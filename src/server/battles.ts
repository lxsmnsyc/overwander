import 'server-only';
import type BattleAftermath from '../auth/battle-aftermath';
import { type CatchSnapshot, asCatchSnapshot } from '../auth/catch-snapshot';
import { asCaughtPokemon } from '../auth/caught-record';
import { carriedStatuses, getMaxHealth } from '../auth/health';
import { settleStatuses } from '../data/ids/status';
import { gainFriendship } from '../data/constants/friendship';
import type { Items } from '../data/ids/items';
import BattleOutcome from '../auth/battle-outcome';
import type Families from '../data/ids/families';
import { getSpeciesData } from '../data/species';
import { Metric } from '../auth/quest-record';
import { grantCandy } from './candy';
import { getSql, tx } from './db';
import { readCaughtMany, updateCaughtIn } from './caught-io';
import { type ProgressBump, bumpProgress } from './quest-progress';
import { asNumber, asNumberArray } from './read';

/**
 * What a battle leaves behind, written over the owner connection. A
 * report touches only the reporter's own party, but it still passes
 * through here: it writes catch records, and the marker that stops it
 * landing twice has to be the server's.
 *
 * The items spent, the health left and the statuses carried out land
 * together, because they describe one fight.
 *
 * What the server can check, it checks: the battle names the player,
 * the catches were fielded by its snapshots, an item was one that
 * catch walked in holding, health is clamped, and only carryable
 * statuses survive. The number itself it cannot check, since no server
 * replays a live battle, so health is trusted the way the outcome is:
 * bounded rather than proven
 */

/**
 * What a catch is holding, restored from the stored row
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asHeldItems = (value: unknown): Items[] => asNumberArray(value) as Items[];

/**
 * The most one catch's Pay Days may claim from a single battle:
 * 5 coins x level 100, one landed use per two-second turn, over a
 * ten-minute fight
 */
const PAY_DAY_REPORT_LIMIT = 5 * 100 * 300;

/**
 * Everything the player actually fielded in this battle, catch id to
 * the snapshot it was frozen from. The team snapshots are the
 * server's own writing, so they — not the report — decide what a unit
 * could possibly have spent
 */
async function readFielded(battleId: string, player: string): Promise<Map<string, CatchSnapshot>> {
  const fielded = new Map<string, CatchSnapshot>();
  const snapshots = await getSql()`
    select ts.catches
    from battle_teams bt
    join team_snapshots ts on ts.id = bt.snapshot_id
    where bt.battle_id = ${battleId} and bt.player = ${player}
  `;

  for (const data of snapshots) {
    if (!Array.isArray(data.catches)) {
      continue;
    }
    for (const value of data.catches) {
      const snapshot = asCatchSnapshot(value);

      if (snapshot.caught !== '') {
        fielded.set(snapshot.caught, snapshot);
      }
    }
  }

  return fielded;
}

/** What a fought team came home with, one entry per family fielded */
export interface CandyEarned {
  family: Families;
  count: number;
}

/**
 * Write what the battle did to a player's party: the items it spent
 * come off the catch records, the health it has left and the statuses
 * it is carrying are written onto them, and the team is paid its
 * candy for what the fight was worth.
 *
 * A marker at battleAftermaths/{battleId}:{uid} guards the whole
 * thing, so one battle settles one player once however many times the
 * report arrives. Resolves what the candy came to, and nothing at all
 * for a player who did not fight it or has already settled it
 */
export default async function recordAftermath(
  uid: string,
  battleId: string,
  aftermath: BattleAftermath[],
  defeated: number,
): Promise<CandyEarned[]> {
  if (aftermath.length === 0) {
    return [];
  }

  const fought = await getSql()`
    select 1 from battle_teams where battle_id = ${battleId} and player = ${uid} limit 1
  `;

  if (fought.length === 0) {
    return [];
  }

  // A raid or an npc fight settles for whoever fought it. A fight
  // between players settles for **the challenger of a gym seat and
  // nobody else**: they were there, and their party carries the wear
  // out with it. The holder's side is a frozen copy standing in for
  // somebody who is not present — settling it would charge them for a
  // fight they never saw — and any other player-versus-player battle
  // settles for neither side
  const battles = await getSql()`select raid_id, outcome from battles where id = ${battleId}`;
  const others = await getSql()`
    select count(distinct player)::int as players
    from battle_teams where battle_id = ${battleId} and player is not null
  `;

  if (battles.at(0) == null) {
    return [];
  }
  if (battles[0].raid_id == null && asNumber(others.at(0)?.players) > 1) {
    const challenged = await getSql()`
      select 1 from gym_challenges where battle_id = ${battleId} and challenger = ${uid} limit 1
    `;

    if (challenged.length === 0) {
      return [];
    }
  }

  const fielded = await readFielded(battleId, uid);
  const reported = aftermath.filter((entry) => fielded.has(entry.caught));

  if (reported.length === 0) {
    return [];
  }

  // The report is the client's word, so what a Pay Day can pay is
  // bounded the way health is bounded by the pool: per catch, at the
  // mainline's rate for a level-100 user landing one use a turn for
  // the length of a long raid
  const coins = reported.reduce(
    (sum, entry) => sum + Math.min(Math.max(0, Math.floor(entry.coins)), PAY_DAY_REPORT_LIMIT),
    0,
  );

  const settled = await tx(async (transaction) => {
    // The marker is the whole race: one battle settles one player
    // exactly once, however many times the report arrives
    const claimed = await transaction`
      insert into battle_aftermaths (battle_id, player, settled_at)
      values (${battleId}, ${uid}, ${Date.now()})
      on conflict do nothing
    `;

    if (claimed.count === 0) {
      return false;
    }

    if (coins > 0) {
      await transaction`update profiles set gold = gold + ${coins} where id = ${uid}`;
    }

    // Locked together rather than one at a time: everything the fight
    // put down is read in one question before any of it is written
    const found = await readCaughtMany(
      transaction,
      reported.map((target) => target.caught),
      true,
    );

    for (const target of reported) {
      const data = found.get(target.caught);

      // A catch sold, released or handed on since the battle started
      // is nobody's to charge
      if (data == null || data.owner !== uid) {
        continue;
      }

      const spent = new Set(fielded.get(target.caught)?.items);
      const reportedItems = new Set(target.items);
      const remaining: Items[] = [];
      const taken = new Set<Items>();

      for (const item of asHeldItems(data.items)) {
        // One copy per item spent: the rest of the stack, if a later
        // limit ever allows one, stays where it is
        if (spent.has(item) && reportedItems.has(item) && !taken.has(item)) {
          taken.add(item);
          continue;
        }
        remaining.push(item);
      }

      // Health is measured against the record as it stands, not as it
      // was frozen: a level taken between the freeze and the report
      // would otherwise cap the pokemon at its old pool
      const record = asCaughtPokemon(data);
      const health = Math.max(0, Math.min(getMaxHealth(record), Math.floor(target.health)));
      // Only what a pokemon can actually carry out of a fight is
      // written, one of each: confusion and the rest ended with the
      // battle
      const statuses = settleStatuses(carriedStatuses(target.statuses));

      await updateCaughtIn(transaction, target.caught, {
        health,
        statuses,
        ...(taken.size > 0 ? { items: remaining } : {}),
        // A pokemon that was carried out of the fight thinks a little
        // less of whoever took it in there. It is one point, and the
        // walk back buys it again — losing a pokemon's trust should
        // take more than losing a raid
        ...(health <= 0 ? { friendship: gainFriendship(record.friendship, 'faint') } : {}),
      });
    }

    return true;
  });

  if (!settled) {
    return [];
  }

  // Settling is the once-per-battle moment, so it is where a raid run
  // counts; a win counts on top from the stamped outcome, and Pay Day
  // gold counts as earned the moment it lands
  // oxlint-disable-next-line typescript/no-unsafe-enum-comparison
  const won = asNumber(battles[0].outcome) === BattleOutcome.Won;
  const raid = battles[0].raid_id != null;

  await bumpProgress(uid, [
    ...(coins > 0 ? [[Metric.GoldEarned, 0, coins] satisfies ProgressBump] : []),
    ...(raid ? [[Metric.RaidRuns, 0, 1] satisfies ProgressBump] : []),
    ...(raid && won ? [[Metric.RaidWins, 0, 1] satisfies ProgressBump] : []),
  ]);

  // And what the fight was worth to the team that fought it: one
  // candy each, of whichever family the pokemon belongs to, so a
  // party of 3 Gyarados comes home with 3 Magikarp candies.
  //
  // A win pays for the whole party. A loss pays only for what it beat
  // — one candy per pokemon the other side lost — so a fight walked
  // into and given up on is worth nothing, and one lost on the last
  // unit is worth nearly a win. It is counted off the team snapshots
  // rather than the report, since what was fielded is the server's
  // own writing, and it rides the same marker as everything else
  // here: one battle pays one team once
  const paid = won ? fielded.size : Math.min(fielded.size, await downed(battleId, uid, defeated));
  const earned = new Map<Families, number>();

  for (const snapshot of [...fielded.values()].slice(0, paid)) {
    const { family } = getSpeciesData(snapshot.species);

    earned.set(family, (earned.get(family) ?? 0) + 1);
  }
  for (const [family, count] of earned) {
    await grantCandy(uid, family, count);
  }
  return [...earned].map(([family, count]) => ({ family, count }));
}

/**
 * How many of the other side this player may be paid for.
 *
 * The count comes from the client, like the Pay Day coins, so it is
 * clamped to the party the server itself staged against them: nobody
 * can knock down more pokemon than were standing there
 */
async function downed(battleId: string, player: string, reported: number): Promise<number> {
  const rows = await getSql()`
    select ts.catches
    from battle_teams bt
    join team_snapshots ts on ts.id = bt.snapshot_id
    where bt.battle_id = ${battleId} and (bt.player is null or bt.player <> ${player})
  `;
  let standing = 0;

  for (const data of rows) {
    if (Array.isArray(data.catches)) {
      standing += data.catches.length;
    }
  }
  return Math.min(standing, Math.max(0, Math.floor(reported)));
}
