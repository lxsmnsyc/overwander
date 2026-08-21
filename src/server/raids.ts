import 'server-only';
import BattleOutcome from '../auth/battle-outcome';
import { UNLIMITED_BATTLE_LIMITS } from '../data/constants/battle-limits';
import { type CatchSnapshot, createCatchSnapshot } from '../auth/catch-snapshot';
import BATTLE_TIMEOUT from '../auth/battle-lock';
import { asOffset, toLocalTime } from '../auth/local-time';
import { asCaughtPokemon } from '../auth/caught-record';
import { isFainted } from '../auth/health';

import type { EncounterRecord } from '../auth/encounter-record';
import {
  RaidAction,
  RaidKind,
  type RaidRecord,
  type RaidView,
  asRaidRecord,
  deriveRaidReward,
  mythicalRaidId,
  raidId,
} from '../auth/raid-record';
import { TEAM_SIZE } from '../auth/teams';
import ChunkSnapshot from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { EncounterType } from '../overworld/encounter';
import {
  BOSS_ALLIANCE,
  LEGENDARY_RAID_GOLD,
  LEGENDARY_RAID_REWARD_LEVEL,
  MYTHICAL_RAID_GOLD,
  MYTHICAL_RAID_REWARD_LEVEL,
  PLAYER_ALLIANCE,
  SHADOW_RAID_GOLD,
  SHADOW_RAID_REWARD_LEVEL,
  createRaidBossSnapshot,
} from '../overworld/raid';
import AleaRNG from '../core/alea';
import type { Items } from '../data/ids/items';
import { getRaidSpecies } from '../data/items/raid-items';
import createOverworld from '../overworld/setup';
import resolveBuddy from './buddy';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import Biome from '../data/ids/biome';
import { getSpeciesLair } from '../data/overworld/lair';
import { getSql, jsonOf, newDocId, tx } from './db';
import { readCaughtIn } from './caught-io';
import { foughtBattle, readBattle, readRaid, readRaidIn, readTeam, writeRaid } from './raid-io';
import { consumeItem } from './inventory';
import { isAnyCatchLocked, isCatchLocked, releaseBattleLocks } from './locks';
import { asNumber, asString } from './read';
import { hasAnyCaught } from './caught';
import { startEncounter } from './overworld';
import { grantGold } from './profile';

/**
 * What each kind of lobby pays, hands over, and records itself as
 */
const RAID_GOLD: Record<RaidKind, number> = {
  [RaidKind.Legendary]: LEGENDARY_RAID_GOLD,
  [RaidKind.Shadow]: SHADOW_RAID_GOLD,
  [RaidKind.Mythical]: MYTHICAL_RAID_GOLD,
};

const RAID_REWARD_LEVELS: Record<RaidKind, number> = {
  [RaidKind.Legendary]: LEGENDARY_RAID_REWARD_LEVEL,
  [RaidKind.Shadow]: SHADOW_RAID_REWARD_LEVEL,
  [RaidKind.Mythical]: MYTHICAL_RAID_REWARD_LEVEL,
};

const RAID_ENCOUNTER_TYPES: Record<RaidKind, EncounterType> = {
  [RaidKind.Legendary]: EncounterType.LegendaryRaid,
  [RaidKind.Shadow]: EncounterType.ShadowRaid,
  [RaidKind.Mythical]: EncounterType.MythicalRaid,
};

/**
 * A stored outcome, restored as the enum the rest of the code
 * compares against
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asOutcome = (value: unknown): BattleOutcome => asNumber(value) as BattleOutcome;

/**
 * Raids, written with admin credentials. A raid decides who is owed a
 * legendary, so the three writes that settle one — starting it,
 * clearing it, and collecting from it — are checked here rather than
 * reported by whoever fought
 */

/**
 * How long an unsettled raid battle holds its landmark: the same
 * window that decides how long it holds its party
 * ([`src/server/locks.ts`](./locks.ts)). A fight is over in minutes;
 * one still unfinished after this was walked out on, and an abandoned
 * party is not a beaten boss
 */
export const RAID_BATTLE_TIMEOUT = BATTLE_TIMEOUT;

/**
 * Whether a stored battle ended without the boss going down — lost
 * outright, or abandoned long enough that nobody is coming back to
 * settle it. A raid that was won never reaches here: clearing it
 * shuts the landmark first
 */
function isBattleLost(battle: Record<string, unknown> | null, now: number): boolean {
  if (battle == null) {
    return true;
  }
  if (asOutcome(battle.outcome) === BattleOutcome.Unfinished) {
    return now - asNumber(battle.startedAt) >= RAID_BATTLE_TIMEOUT;
  }
  return asOutcome(battle.outcome) !== BattleOutcome.Won;
}

/**
 * The same question, read inside the transaction that acts on the
 * answer
 */
async function isRaidLost(battleId: string, now: number): Promise<boolean> {
  return isBattleLost(await readBattle(battleId), now);
}

/**
 * Look at a lair without staging anything.
 *
 * What is at the cell, and what this player may do about it, are read
 * the same way `enterRaid` decides them — so the button the dialog
 * shows is the one that will actually be honoured when it is pressed.
 * Nothing is written: a player who walks up to a lair and thinks
 * better of it leaves no lobby standing behind them.
 *
 * Resolves what is there, or null when the cell stages no raid this
 * window, its raid has been cleared, or there is nothing standing and
 * this player has no pokemon to stage one with
 */
export async function peekRaid(
  uid: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
  now: number,
  offset: number,
): Promise<RaidView | null> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  const roll =
    kind === RaidKind.Shadow
      ? snapshot.getShadowLairs().get(cell)
      : snapshot.getLegendaryLairs().get(cell);

  if (roll == null) {
    return null;
  }

  const lobby = raidId(chunk, snapshot.raidTimestamp, cell, kind, zone);
  const stored = await readRaid(lobby);
  const existing = stored == null ? null : asRaidRecord(stored);

  // The boss has been met; the landmark is shut until the window turns
  if (existing?.cleared === true) {
    return null;
  }

  const staging = await hasAnyCaught(uid);
  // A lobby that has not started is one a party can still be brought
  // to
  const gathering = existing != null && existing.battle == null;
  // A landmark with nothing standing, or with a party that failed at
  // it, is one to stage rather than to join
  const open =
    existing == null ||
    (existing.battle != null && isBattleLost(await readBattle(existing.battle), now));

  // Nothing is standing and they have nothing to stage it with, so
  // there is not even anything to watch
  if (open && !staging && existing == null) {
    return null;
  }

  // One thing is on offer at a time: a lair to stage, a lobby to
  // bring a party to, or something to watch — which is what is left
  // for a player with nothing to field, and for anybody once the
  // fight has started
  let action = RaidAction.Spectate;

  if (staging && open) {
    action = RaidAction.Host;
  } else if (staging && gathering) {
    action = RaidAction.Join;
  }

  return {
    lobby,
    action,
    kind,
    lair: existing?.lair ?? roll.lair,
    biome: chunk.biome,
    species: existing?.species ?? roll.species,
    battle: existing?.battle ?? null,
    teams: existing?.teams.length ?? 0,
  };
}

/**
 * Walk into a raid landmark. The lobby id is derived from the chunk,
 * the raid window, the cell and the kind, and the roll behind it comes
 * from the chunk's own seed against the server's clock — so what is
 * staged there is what the world staged, not what the caller says.
 *
 * The first arrival of the window opens the lobby and hosts it, and
 * everyone after adopts what is already standing. The window gives the
 * boss one defeat, not one fight: a raid the party lost — or walked
 * out on — leaves the landmark open for the next arrival to restage
 * against the same roll. Only beating the boss shuts the cell.
 *
 * A player with no pokemon of their own stages nothing; they take
 * whatever lobby is standing, as a spectator.
 *
 * Resolves the lobby id and its record, or null when the cell stages
 * no raid this window, its raid has been cleared, or there is nothing
 * standing for a spectator to watch
 */
export async function enterRaid(
  uid: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
  now: number,
  offset: number,
): Promise<[string, RaidRecord] | null> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  const roll =
    kind === RaidKind.Shadow
      ? snapshot.getShadowLairs().get(cell)
      : snapshot.getLegendaryLairs().get(cell);

  if (roll == null) {
    return null;
  }

  const id = raidId(chunk, snapshot.raidTimestamp, cell, kind, zone);
  const staging = await hasAnyCaught(uid);

  // One landmark stages one raid at a time: the row lock is what
  // keeps two players walking in together from each opening their own
  return tx(async (transaction) => {
    const stored = await readRaidIn(transaction, id);
    const existing = stored == null ? null : asRaidRecord(stored);

    const fresh: RaidRecord = {
      kind,
      // What the raid is called after: the lair it stands in, or the
      // biome it stands on when a shadow reached for a rare species
      lair: roll.lair,
      species: roll.species,
      traitValue: roll.traitValue,
      host: uid,
      teams: [],
      battle: null,
      timestamp: snapshot.raidTimestamp,
      offset: zone,
      chunk: { seed: chunk.seed, x: chunk.x, y: chunk.y },
      biome: chunk.biome,
      cell,
      cleared: false,
    };

    if (existing != null) {
      // A cleared lobby stays shut until the window turns over and the
      // landmark rolls a new raid: the boss has been met
      if (existing.cleared) {
        return null;
      }
      // A raid still gathering, or one being fought right now, is
      // what the arrival walks into
      if (existing.battle == null || !(await isRaidLost(existing.battle, now))) {
        return [id, existing];
      }
      // The boss survived, so the landmark is open again. A spectator
      // restages nothing and watches the fight that failed
      if (!staging) {
        return [id, existing];
      }
      await writeRaid(transaction, id, fresh);
      return [id, fresh];
    }

    if (!staging) {
      return null;
    }
    await writeRaid(transaction, id, fresh);
    return [id, fresh];
  });
}

/**
 * Open a mythical raid with a raid item. The relic names the species
 * — the world never stages a mythical of its own — and it is **spent
 * in the calling**: the stack comes down by one before the lobby is
 * written, so a mythical is fought once whether the boss goes down or
 * walks away. Nothing restages it, unlike a landmark raid a party
 * failed.
 *
 * The lobby stands where the player was standing, for the window they
 * were standing there in, and is joinable by anyone the way any other
 * lobby is.
 *
 * Resolves the lobby id and its record, or null when the item calls
 * nothing, is not carried, or has already been spent on this window's
 * lobby
 */
export async function hostMythicalRaid(
  uid: string,
  x: number,
  y: number,
  item: Items,
  now: number,
  offset: number,
): Promise<[string, RaidRecord] | null> {
  const species = getRaidSpecies(item);

  if (species == null) {
    return null;
  }

  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  const id = mythicalRaidId(chunk, snapshot.raidTimestamp, item, uid, zone);
  const stored = await readRaid(id);

  // The relic was already spent on this window's lobby: whatever became
  // of it — gathering, fought, lost — is what there is
  if (stored != null) {
    const existing = asRaidRecord(stored);

    return existing.cleared ? null : [id, existing];
  }
  // A player with nothing of their own cannot host: an empty lobby
  // would spend the relic on a raid nobody can start
  if (!(await hasAnyCaught(uid))) {
    return null;
  }
  // Spent before the lobby exists, so a relic can never open two
  if (!(await consumeItem(uid, item))) {
    return null;
  }

  // The boss' nature and ability come from the lobby itself, so every
  // player who joins fights the same mythical
  const fresh: RaidRecord = {
    kind: RaidKind.Mythical,
    // The relic calls the mythical out to the place it has always
    // been called from, whatever ground the player is standing on —
    // which is nowhere the world contains
    lair: getSpeciesLair(species),
    species,
    traitValue: new AleaRNG(`${id}:mythical`).int32(),
    host: uid,
    teams: [],
    battle: null,
    timestamp: snapshot.raidTimestamp,
    offset: zone,
    chunk: { seed: chunk.seed, x: chunk.x, y: chunk.y },
    biome: Biome.Beyond,
    // A mythical stands on no landmark cell
    cell: -1,
    cleared: false,
  };

  await tx(async (transaction) => writeRaid(transaction, id, fresh));
  return [id, fresh];
}

/**
 * Walk out of a lobby: the player's teams come out with them, so a
 * raid they left does not start with their party in it. Only their
 * own teams are pulled — the team documents name their owner — and a
 * started raid is already frozen into snapshots, so it is left alone.
 *
 * A lobby nobody is left in is taken down rather than left standing.
 * It was left standing, and it was a lobby in every listing and a lair
 * that could not be hosted again — most often opened by somebody who
 * pressed Host, saw what was in there and walked out again without
 * ever forming a team, which left a raid nobody had joined sitting in
 * the world until the window turned over.
 *
 * A **cleared** lobby is the one empty one that stays: it is the
 * record of the boss having been met, and it is what keeps the
 * landmark shut for the rest of the window
 */
export async function leaveRaid(uid: string, lobby: string): Promise<void> {
  await tx(async (transaction) => {
    const raid = await readRaidIn(transaction, lobby);

    if (raid == null || raid.battle != null) {
      return;
    }

    const record = asRaidRecord(raid);
    const rows = await transaction`
      select id, player from teams where raid_id = ${lobby}
    `;
    const mine = new Set(
      rows.filter((entry) => entry.player === uid).map((entry) => asString(entry.id)),
    );
    const left = rows.filter((entry) => !mine.has(asString(entry.id)));

    // The last party out shuts the door behind it, and so does a host
    // who never formed one.
    //
    // Whether the leaver had anything in there is the whole of the
    // condition. Without it, a **spectator** walking out of somebody
    // else's freshly opened lobby would take it down with them: they
    // hold no team, so the teams left behind are the same empty list
    // either way, and the door would be shut on a host still standing
    // in the room
    if (left.length === 0 && !record.cleared && (mine.size > 0 || record.host === uid)) {
      await transaction`delete from raids where id = ${lobby}`;
      return;
    }
    if (mine.size === 0) {
      return;
    }
    await transaction`delete from teams where id = any(${[...mine]})`;
  });
}

/**
 * Whether any of the catches is already queued in a lobby. A team
 * names the raid it joined, so the player's own teams are enough to
 * answer it: a team still listed by a raid that has not started is a
 * party waiting to fight, and what it holds is spoken for.
 *
 * A team is deleted when its raid starts, so what is left is only
 * ever a party still waiting. The lobby is checked anyway — a raid
 * cleared, or one the team was dropped from on the way out, leaves
 * its pokemon free — and a party that is actually fighting answers
 * the different question the battle lock asks
 */
export async function isAnyCatchQueued(uid: string, catches: string[]): Promise<boolean> {
  // One query says it all: a team of this player's, holding any of
  // these catches, whose raid is still gathering
  const rows = await getSql()`
    select 1
    from teams t
    join team_catches tc on tc.team_id = t.id
    join raids r on r.id = t.raid_id
    where t.player = ${uid}
      and tc.caught_id = any(${catches})
      and r.battle_id is null
      and not r.cleared
    limit 1
  `;

  return rows.length > 0;
}

/**
 * Bring a party into a lobby. The catch ids are checked against their
 * owners, so a party cannot field pokemon the player does not own, no
 * catch can be listed twice, none of them may already be fighting or
 * waiting in another lobby, and none of them may be fainted.
 *
 * The freeze at the start of the fight would drop a fainted pokemon
 * anyway; refusing here is so a player finds out while they can still
 * do something about it. Resolves the team id, or null when the party
 * is not a legal one or the raid has started
 */
export async function joinRaid(
  uid: string,
  lobby: string,
  catches: string[],
): Promise<string | null> {
  const raid = await readRaid(lobby);

  if (raid == null || raid.battle != null) {
    return null;
  }
  if (catches.length === 0 || catches.length > TEAM_SIZE) {
    return null;
  }
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const owned = await tx(async (transaction) => {
    const records: Record<string, unknown>[] = [];

    for (const id of catches) {
      const record = await readCaughtIn(transaction, id, false);

      if (record == null) {
        return null;
      }
      records.push(record);
    }
    return records;
  });

  if (owned == null || !owned.every((entry) => entry.owner === uid)) {
    return null;
  }
  // A pokemon already fighting elsewhere cannot be brought along: one
  // catch, one live battle
  if (isAnyCatchLocked(owned)) {
    return null;
  }
  // Nor one that is down. Nothing revives on its own, so it is a
  // berry or a level before that pokemon fights again
  if (owned.some((entry) => isFainted(asCaughtPokemon(entry)))) {
    return null;
  }
  // Nor one its owner has put away. A guarded pokemon is not to be
  // disturbed, and a raid is the loudest thing that could happen to it
  if (owned.some((entry) => isGuardedRecord(entry))) {
    return null;
  }
  // Nor one already waiting in another lobby, or in this one: a party
  // that queues the same pokemon twice would have it dropped from
  // whichever raid started second, without ever being told
  if (await isAnyCatchQueued(uid, catches)) {
    return null;
  }

  const teamId = newDocId();

  await tx(async (transaction) => {
    await transaction`
      insert into teams (id, player, raid_id) values (${teamId}, ${uid}, ${lobby})
    `;

    const rows = catches.map((caught, slot) => ({ team_id: teamId, slot, caught_id: caught }));

    await transaction`
      insert into team_catches ${transaction(rows, 'team_id', 'slot', 'caught_id')}
    `;
  });

  return teamId;
}

/**
 * Freeze one team for the battle, dropping catches that have vanished,
 * changed hands, fainted or are already fighting somewhere else, and lock what
 * it fields into that battle. The
 * freeze and the lock share a transaction, so an item cannot be
 * handed back in the moment between them — the snapshot the fight
 * runs on and the record it came from stay the same pokemon. The lock
 * is stamped with the battle's `startedAt`, which is what lets the
 * fight release its own party and nobody else's.
 *
 * Resolves the snapshot id, or null when the team fields nothing — an
 * empty side must not stand in a battle
 */
export async function publishTeamSnapshot(
  player: string,
  catches: string[],
  alliance: number,
  startedAt: number,
): Promise<string | null> {
  if (catches.length === 0) {
    return null;
  }

  const snapshotId = newDocId();

  return tx(async (transaction) => {
    const fielded: CatchSnapshot[] = [];
    const locking: string[] = [];

    for (const id of catches) {
      const data = await readCaughtIn(transaction, id);

      // A pokemon already fighting is left behind rather than fielded
      // twice: a player may sit in two lobbies with the same party,
      // and the first raid to start is the one that gets it. An egg
      // is left behind for good — there is nothing in it to fight
      // with until it hatches — and so is a pokemon that is down,
      // which has to be healed before it fights again
      if (
        data?.owner === player &&
        !isCatchLocked(data) &&
        !isEggRecord(data) &&
        !isGuardedRecord(data) &&
        !isFainted(asCaughtPokemon(data))
      ) {
        fielded.push(createCatchSnapshot(id, asCaughtPokemon(data)));
        locking.push(id);
      }
    }

    if (fielded.length === 0) {
      return null;
    }

    await transaction`
      insert into team_snapshots (id, player, alliance, catches)
      values (${snapshotId}, ${player}, ${alliance}, ${jsonOf(transaction, fielded)})
    `;
    await transaction`
      update caught set locked_at = ${startedAt} where id = any(${locking})
    `;
    return snapshotId;
  });
}

/**
 * Start the raid: every joined team is frozen, the boss gets a
 * snapshot of its own, and the pair of alliances becomes a battle.
 * Only the host may start, and only once — the battle id is written
 * back inside a transaction, so a second start finds it taken
 */
export async function startRaid(uid: string, lobby: string, now: number): Promise<string | null> {
  const stored = await readRaid(lobby);

  if (stored == null) {
    return null;
  }

  const raid: RaidRecord = asRaidRecord(stored);

  if (raid.host !== uid || raid.battle != null || raid.teams.length === 0) {
    return null;
  }

  // The raid is claimed before anything is frozen, since freezing
  // locks the parties: a start that loses the race must not hold
  // pokemon for a battle it is not going to run. A claim whose teams
  // then field nothing leaves the raid pointing at a battle that was
  // never written, which reads as lost and restages
  const battleId = newDocId();
  const claimed = await getSql()`
    update raids set battle_id = ${battleId}
    where id = ${lobby} and battle_id is null
  `;

  if (claimed.count === 0) {
    const current = await readRaid(lobby);

    return typeof current?.battle === 'string' ? current.battle : null;
  }

  const fielded: [string, string][] = [];

  for (const id of raid.teams) {
    const team = await readTeam(id);

    if (team == null) {
      continue;
    }

    const snapshot = await publishTeamSnapshot(team.player, team.catches, PLAYER_ALLIANCE, now);

    if (snapshot != null) {
      fielded.push([team.player, snapshot]);
    }
  }

  if (fielded.length === 0) {
    return null;
  }

  // The boss stands alone: one perfect-IV catch snapshot, no owner
  const bossId = newDocId();

  await tx(async (transaction) => {
    await transaction`
      insert into team_snapshots (id, player, alliance, catches)
      values (${bossId}, null, ${BOSS_ALLIANCE}, ${jsonOf(transaction, [
        createRaidBossSnapshot(raid.species, raid.traitValue, raid.kind === RaidKind.Shadow),
      ])})
    `;
    await transaction`
      insert into battles (id, raid_id, species, outcome, started_at, limits)
      values (${battleId}, ${lobby}, ${raid.species}, ${BattleOutcome.Unfinished}, ${now},
              ${UNLIMITED_BATTLE_LIMITS})
    `;

    const rows = [
      { battle_id: battleId, position: 0, snapshot_id: bossId, player: null as string | null },
      ...fielded.map(([player, snapshot], at) => ({
        battle_id: battleId,
        position: at + 1,
        snapshot_id: snapshot,
        player: player as string | null,
      })),
    ];

    await transaction`
      insert into battle_teams ${transaction(rows, 'battle_id', 'position', 'snapshot_id', 'player')}
    `;
  });

  // The lobby's teams have done their work. What the fight runs on is
  // the snapshots, which are frozen and complete; a team is a list of
  // catch ids that was only ever there so a party could gather and be
  // checked for a pokemon queued twice. Left behind they would be one
  // stale document per raid ever staged, and `isAnyCatchQueued` would
  // go on finding parties that are fighting rather than waiting
  await getSql()`delete from teams where id = any(${raid.teams})`;

  return battleId;
}

/**
 * Record how a battle ended. Only a player who fielded a team may
 * report it, and only once: an outcome already stamped stands, so the
 * first honest report cannot be overwritten by a later one.
 *
 * The end of the fight is also what frees its party — every catch it
 * froze goes back to being editable. A battle nobody ever reports
 * releases its own by timing out instead
 */
export async function finishBattle(
  uid: string,
  battleId: string,
  outcome: BattleOutcome,
): Promise<boolean> {
  const stamped =
    (await foughtBattle(battleId, uid)) &&
    (
      await getSql()`
        update battles set outcome = ${outcome}
        where id = ${battleId} and outcome = ${BattleOutcome.Unfinished}
      `
    ).count > 0;

  if (stamped) {
    await releaseBattleLocks(battleId);
  }
  return stamped;
}

/**
 * Shut a raid's landmark for the rest of the window. Only a raid whose
 * battle is recorded as won can be cleared, so a player cannot close
 * a landmark by claiming a victory that never happened
 */
export async function clearRaid(uid: string, lobby: string): Promise<boolean> {
  const raid = await readRaid(lobby);
  const battleId = raid?.battle;

  if (typeof battleId !== 'string') {
    return false;
  }

  const battle = await readBattle(battleId);

  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !(await foughtBattle(battleId, uid))
  ) {
    return false;
  }
  await getSql()`update raids set cleared = true where id = ${lobby}`;
  return true;
}

/**
 * What a cleared raid owes one fighter: the legendary waiting for
 * them, and the purse that came with it
 */
export interface RaidReward {
  encounter: EncounterRecord;
  gold: number;
}

/**
 * Collect what a cleared raid owes. The claim marker at
 * raidRewards/{raidId}:{uid} guards it, so the raid pays each fighter
 * once however late they come back for it — the gold and the pokemon
 * ride the same marker, so neither can be collected twice. The
 * encounter is derived against the raid's own chunk and window, not
 * wherever the player is standing now
 */
export async function claimRaidReward(uid: string, lobby: string): Promise<RaidReward | null> {
  const stored = await readRaid(lobby);

  if (stored == null) {
    return null;
  }

  const raid: RaidRecord = asRaidRecord(stored);

  if (raid.battle == null) {
    return null;
  }

  const battle = await readBattle(raid.battle);

  // Only the players who actually fielded a team are owed anything,
  // and only from a raid that was won
  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !(await foughtBattle(raid.battle, uid))
  ) {
    return null;
  }

  const shadow = raid.kind === RaidKind.Shadow;
  // What the boss is worth, and then what the claimant brought along:
  // a buddy burning a Luck Incense doubles the purse
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const gold = overworld.checkGoldReward(lobby, RAID_GOLD[raid.kind]);
  const claimed = await getSql()`
    insert into raid_rewards (raid_id, player, gold)
    values (${lobby}, ${uid}, ${gold})
    on conflict do nothing
  `;

  if (claimed.count === 0) {
    return null;
  }
  await grantGold(uid, gold);

  const chunk = getWorld().getChunk(raid.chunk.x, raid.chunk.y);
  // The raid's own window and zone, not wherever the claimant is now
  const snapshot = new ChunkSnapshot(chunk, raid.timestamp, raid.offset);
  const [spawnId, spawn] = deriveRaidReward(raid, lobby, uid);
  const encounter = await startEncounter(uid, snapshot, spawnId, spawn, {
    // The three raids hand over different prizes, so a catch says
    // which lobby it came out of
    type: RAID_ENCOUNTER_TYPES[raid.kind],
    shadow,
    // The prize remembers the place it was won in — and a mythical
    // remembers that the place was nowhere on the map
    lair: raid.lair,
    biome: raid.kind === RaidKind.Mythical ? Biome.Beyond : undefined,
    level: RAID_REWARD_LEVELS[raid.kind],
  });

  return { encounter, gold };
}
