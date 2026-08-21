import 'server-only';
import type BattleAftermath from '../auth/battle-aftermath';
import { type CatchSnapshot, asCatchSnapshot } from '../auth/catch-snapshot';
import { asCaughtPokemon } from '../auth/caught-record';
import { carriedStatuses, getMaxHealth } from '../auth/health';
import { gainFriendship } from '../data/constants/friendship';
import type { Items } from '../data/ids/items';
import { getSql, tx } from './db';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { asNumberArray } from './read';

/**
 * What a battle leaves behind, written with admin credentials. A
 * report only ever touches the reporter's own party — so unlike an
 * outcome it cannot be used against anybody else — but it still
 * passes through here, because it writes to catch records and because
 * the marker that stops it happening twice has to be the server's.
 *
 * Three things land together: the items the party spent, the health it
 * has left, and the statuses it is still carrying. They are one report
 * because they are one fight — a Sitrus Berry gone and the health it
 * restored describe the same moment.
 *
 * What the server can check, it checks: the battle has to name the
 * player, the catches have to be ones the team snapshots actually
 * fielded, an item has to be one that catch walked in holding, health
 * is clamped to what the record can hold, and the statuses are kept
 * to the ones a pokemon could carry out of a fight. What it cannot check is the
 * number itself — no server replays a live battle — so health is
 * trusted the same way the outcome is: this is a cooperative game,
 * and the report is bounded rather than proven.
 */

/**
 * What a catch is holding, restored from the stored document
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asHeldItems = (value: unknown): Items[] => asNumberArray(value) as Items[];

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

/**
 * Write what the battle did to a player's party: the items it spent
 * come off the catch records, the health it has left and the statuses
 * it is carrying are written onto them.
 *
 * A marker at battleAftermaths/{battleId}:{uid} guards the whole
 * thing, so one battle settles one player once however many times the
 * report arrives. Resolves false when the player did not fight it, or
 * has already settled it
 */
export default async function recordAftermath(
  uid: string,
  battleId: string,
  aftermath: BattleAftermath[],
): Promise<boolean> {
  if (aftermath.length === 0) {
    return false;
  }

  const fought = await getSql()`
    select 1 from battle_teams where battle_id = ${battleId} and player = ${uid} limit 1
  `;

  if (fought.length === 0) {
    return false;
  }

  const fielded = await readFielded(battleId, uid);
  const reported = aftermath.filter((entry) => fielded.has(entry.caught));

  if (reported.length === 0) {
    return false;
  }

  return tx(async (transaction) => {
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

    for (const target of reported) {
      const data = await readCaughtIn(transaction, target.caught);

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
      const statuses = carriedStatuses(target.statuses);

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
}
