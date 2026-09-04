// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import 'server-only';
import BattleOutcome from '../auth/battle-outcome';
import {
  DEFAULT_DUEL_RULES,
  DUEL_FIGHTERS,
  type DuelRecord,
  type DuelRules,
  asDuelRecord,
} from '../auth/duel-record';
import { withLimit } from '../data/constants/battle-limits';
import { Slots, getSlots } from '../data/constants/slots';
import { TEAM_SIZE } from '../auth/teams';
import { LobbyRole } from '../auth/lobby-role';
import { asCaughtPokemon } from '../auth/caught-record';
import { isFainted } from '../auth/health';
import { getSql, newDocId, tx } from './db';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { isAnyCatchLocked } from './locks';
import { isAnyCatchQueued, publishTeamSnapshot } from './raids';
import { recordSeenOpponents } from './pokedex';
import { readCaughtMany } from './caught-io';
import { asNumber, asString } from './read';
import { findPlayerByCode } from './friends';

/**
 * Battle lobbies: a private fight between two players, with anybody
 * they call in watching.
 *
 * Nothing in the world stages one. A duel exists because somebody
 * asked for it and somebody else said yes, so every read here is
 * gated on membership rather than on where a player is standing. The
 * fight it becomes settles no aftermath and pays nothing: see
 * `recordAftermath`, which refuses any battle with two players in it.
 */

/** One lobby, members and parties stitched back together */
export async function readDuel(id: string): Promise<DuelRecord | null> {
  const sql = getSql();
  const rows = await sql`select * from duels where id = ${id}`;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }

  const [members, parties] = await Promise.all([
    sql`select player, role, ready from duel_members where duel_id = ${id} order by joined_seq`,
    sql`select player, caught_id from duel_catches where duel_id = ${id} order by player, slot`,
  ]);
  const held = new Map<string, string[]>();

  for (const entry of parties) {
    const player = asString(entry.player);

    held.set(player, [...(held.get(player) ?? []), asString(entry.caught_id)]);
  }

  return asDuelRecord({
    host: asString(row.host),
    battle: row.battle_id == null ? null : asString(row.battle_id),
    createdAt: asNumber(row.created_at),
    limits: asNumber(row.limits),
    teamSize: asNumber(row.team_size),
    members: members.map((entry) => ({
      player: asString(entry.player),
      role: asNumber(entry.role),
      ready: entry.ready === true,
      catches: held.get(asString(entry.player)) ?? [],
    })),
  });
}

/** Whether this player is standing in the lobby at all */
async function isMember(id: string, uid: string): Promise<boolean> {
  const rows = await getSql()`
    select 1 from duel_members where duel_id = ${id} and player = ${uid}
  `;

  return rows.length > 0;
}

/**
 * Open a lobby, or step back into the one this player already has
 * open. A player hosts one duel at a time: a second would be a lobby
 * their guests are waiting in while they stand in another.
 *
 * `watching` stages the fight for other people. It is applied to a
 * lobby that already stands as well as to a fresh one, since the two
 * buttons that call this say which side of the fight the host is on,
 * and one that quietly handed back the lobby as it was would be
 * saying something it did not do
 */
export async function hostDuel(uid: string, watching: boolean, now: number): Promise<string> {
  const sql = getSql();
  const standing = await sql`
    select id from duels where host = ${uid} and battle_id is null limit 1
  `;
  const held = asString(standing.at(0)?.id);

  if (held !== '') {
    // Refused when the other seat is already taken, which leaves them
    // watching a fight they arranged: the right answer either way
    await setDuelRole(uid, held, watching ? LobbyRole.Spectator : LobbyRole.Fighter);
    return held;
  }

  const id = newDocId();

  await tx(async (transaction) => {
    await transaction`
      insert into duels (id, host, battle_id, created_at, limits, team_size)
      values (${id}, ${uid}, null, ${now},
        ${DEFAULT_DUEL_RULES.limits}, ${DEFAULT_DUEL_RULES.teamSize})
    `;
    await transaction`
      insert into duel_members (duel_id, player, role)
      values (${id}, ${uid}, ${watching ? LobbyRole.Spectator : LobbyRole.Fighter})
    `;
  });
  return id;
}

/**
 * Whether the two have blocked each other. An invite is a call for
 * somebody's attention, so a block stops it in either direction
 */
async function isBlocked(uid: string, other: string): Promise<boolean> {
  const rows = await getSql()`
    select 1 from blocks
    where (blocker = ${uid} and blocked = ${other})
       or (blocker = ${other} and blocked = ${uid})
    limit 1
  `;

  return rows.length > 0;
}

/**
 * Call somebody into the lobby. The host calls either kind; anybody
 * else in it may only call watchers, since the second seat is the
 * host's fight to arrange.
 *
 * There is no friendship check, unlike a raid invite: a duel is
 * arranged with whoever the host has in front of them: a friend, a
 * trainer whose profile they are reading, or somebody who handed over
 * a code. What keeps it from being spam is that it is one dismissible
 * row and a block refuses it
 */
export async function inviteToDuel(
  uid: string,
  id: string,
  target: string,
  role: LobbyRole,
  now: number,
): Promise<boolean> {
  if (target === '' || target === uid) {
    return false;
  }

  const duel = await readDuel(id);

  if (duel == null || duel.battle != null) {
    return false;
  }
  if (duel.host !== uid && role === LobbyRole.Fighter) {
    return false;
  }
  if (duel.host !== uid && !(await isMember(id, uid))) {
    return false;
  }
  // Already in it, whichever seat they took
  if (duel.members.some((member) => member.player === target)) {
    return false;
  }
  if (await isBlocked(uid, target)) {
    return false;
  }

  await getSql()`
    insert into duel_invites (duel_id, sender, recipient, role, sent_at)
    values (${id}, ${uid}, ${target}, ${role}, ${now})
    on conflict (duel_id, recipient) do update
      set sender = ${uid}, role = ${role}, sent_at = ${now}
  `;
  return true;
}

/**
 * The same call, to whoever holds a friend code. It is how a duel
 * reaches somebody the host has never met: the code was handed over,
 * which is the whole check on who may be asked
 */
export async function inviteToDuelByCode(
  uid: string,
  id: string,
  code: string,
  role: LobbyRole,
  now: number,
): Promise<boolean> {
  const found = await findPlayerByCode(uid, code);

  return found == null ? false : inviteToDuel(uid, id, found.uid, role, now);
}

/** Put an invite away unanswered */
export async function declineDuelInvite(uid: string, id: string): Promise<void> {
  await getSql()`delete from duel_invites where duel_id = ${id} and recipient = ${uid}`;
}

/**
 * Answer a call by walking in. The invite says which seat was offered,
 * and a fighter's seat is taken under the lobby row's own lock so two
 * answers cannot both take the second one.
 *
 * Resolves false when the call is gone, the lobby has started, or the
 * seat was taken while they were deciding
 */
export async function joinDuel(uid: string, id: string): Promise<boolean> {
  return tx(async (transaction) => {
    const held = await transaction`
      select battle_id from duels where id = ${id} for update
    `;

    if (held.length === 0 || held[0].battle_id != null) {
      return false;
    }

    const called = await transaction`
      select role from duel_invites where duel_id = ${id} and recipient = ${uid}
    `;

    if (called.length === 0) {
      return false;
    }

    let role = asNumber(called[0].role) as LobbyRole;

    if (role === LobbyRole.Fighter) {
      const seated = await transaction`
        select count(*)::int as taken from duel_members
        where duel_id = ${id} and role = ${LobbyRole.Fighter}
      `;

      // The seat went while they were deciding, so they come in to
      // watch rather than being turned away at the door
      if (asNumber(seated[0]?.taken) >= DUEL_FIGHTERS) {
        role = LobbyRole.Spectator;
      }
    }

    await transaction`
      insert into duel_members (duel_id, player, role) values (${id}, ${uid}, ${role})
      on conflict (duel_id, player) do nothing
    `;
    await transaction`delete from duel_invites where duel_id = ${id} and recipient = ${uid}`;
    return true;
  });
}

/**
 * Take the other seat, or step back to watching. Stepping back drops
 * the party with it: a watcher fields nothing, and a party left behind
 * would be brought back the moment they sat down again
 */
export async function setDuelRole(uid: string, id: string, role: LobbyRole): Promise<boolean> {
  return tx(async (transaction) => {
    const held = await transaction`select battle_id from duels where id = ${id} for update`;

    if (held.length === 0 || held[0].battle_id != null) {
      return false;
    }

    const mine = await transaction`
      select role from duel_members where duel_id = ${id} and player = ${uid}
    `;

    if (mine.length === 0) {
      return false;
    }

    if (role === LobbyRole.Fighter) {
      const seated = await transaction`
        select count(*)::int as taken from duel_members
        where duel_id = ${id} and role = ${LobbyRole.Fighter} and player <> ${uid}
      `;

      if (asNumber(seated[0]?.taken) >= DUEL_FIGHTERS) {
        return false;
      }
    } else {
      await transaction`
        delete from duel_catches where duel_id = ${id} and player = ${uid}
      `;
    }

    await transaction`
      update duel_members set role = ${role}, ready = false
      where duel_id = ${id} and player = ${uid}
    `;
    return true;
  });
}

/**
 * Set what this fight allows: what one pokemon may bring and how many
 * of them a side may field. The host's alone, and only while the lobby
 * is still gathering.
 *
 * Every ready is taken back, because what both sides agreed to was a
 * fight under the old rules. A party longer than the new team size is
 * cut to it from the end rather than thrown away: the order is the
 * fighter's own, so the tail is what they cared least about, and they
 * are told by their party visibly shrinking and their ready going with
 * it
 */
export async function setDuelRules(uid: string, id: string, rules: DuelRules): Promise<boolean> {
  const limits = clampLimits(rules.limits);
  const teamSize = Math.max(1, Math.min(TEAM_SIZE, Math.floor(rules.teamSize)));

  if (!Number.isFinite(rules.limits) || !Number.isFinite(rules.teamSize)) {
    return false;
  }

  return tx(async (transaction) => {
    const rows = await transaction`
      select host, battle_id from duels where id = ${id} for update
    `;
    const row = rows.at(0);

    if (row == null || asString(row.host) !== uid || row.battle_id != null) {
      return false;
    }

    await transaction`
      update duels set limits = ${limits}, team_size = ${teamSize} where id = ${id}
    `;
    await transaction`
      delete from duel_catches where duel_id = ${id} and slot >= ${teamSize}
    `;
    await transaction`
      update duel_members set ready = false where duel_id = ${id}
    `;
    return true;
  });
}

/** The packed limits with every count brought inside what a host may pick */
function clampLimits(limits: number): number {
  let held = 0;

  for (const kind of [Slots.Ability, Slots.Item, Slots.Move]) {
    held = withLimit(held, kind, getSlots(limits, kind));
  }
  return held;
}

/**
 * Assemble the party this side is bringing. The catches are checked
 * the way a raid team's are (owned, distinct, not fighting, not
 * fainted, not put away, not queued anywhere else) and the ready is
 * taken back: what the other side agreed to was the party they could
 * see
 */
export async function setDuelParty(uid: string, id: string, catches: string[]): Promise<boolean> {
  if (catches.length === 0 || new Set(catches).size !== catches.length) {
    return false;
  }

  const duel = await readDuel(id);
  const mine = duel?.members.find((member) => member.player === uid);

  if (duel == null || duel.battle != null || mine == null || mine.role !== LobbyRole.Fighter) {
    return false;
  }
  // The lobby's own ceiling rather than the game's: the host may have
  // called for a fight of three
  if (catches.length > duel.teamSize) {
    return false;
  }

  // Read together rather than one at a time: a party of six is two
  // round trips this way and twelve the other
  const found = await readCaughtMany(getSql(), catches);
  const records = catches.map((one) => found.get(one));
  const owned = records.every((record) => record != null) ? records : null;

  if (owned == null || !owned.every((entry) => entry.owner === uid)) {
    return false;
  }
  if (isAnyCatchLocked(owned)) {
    return false;
  }
  if (owned.some((entry) => isEggRecord(entry))) {
    return false;
  }
  if (owned.some((entry) => isFainted(asCaughtPokemon(entry)))) {
    return false;
  }
  if (owned.some((entry) => isGuardedRecord(entry))) {
    return false;
  }
  if (await isAnyCatchQueued(uid, catches, id)) {
    return false;
  }

  await tx(async (transaction) => {
    await transaction`delete from duel_catches where duel_id = ${id} and player = ${uid}`;

    const rows = catches.map((caught, slot) => ({
      duel_id: id,
      player: uid,
      slot,
      caught_id: caught,
    }));

    await transaction`
      insert into duel_catches ${transaction(rows, 'duel_id', 'player', 'slot', 'caught_id')}
    `;
    await transaction`
      update duel_members set ready = false where duel_id = ${id} and player = ${uid}
    `;
  });
  return true;
}

/**
 * Say the party is the one they mean to bring. A fighter with nothing
 * assembled has nothing to be ready with
 */
export async function setDuelReady(uid: string, id: string, ready: boolean): Promise<boolean> {
  const rows = await getSql()`
    update duel_members set ready = ${ready}
    where duel_id = ${id} and player = ${uid} and role = ${LobbyRole.Fighter}
      and (not ${ready} or exists (
        select 1 from duel_catches where duel_id = ${id} and player = ${uid}
      ))
      and exists (select 1 from duels where id = ${id} and battle_id is null)
  `;

  return rows.count > 0;
}

/**
 * Walk out. The host leaving takes the lobby with them, since it was
 * their fight to arrange and a lobby nobody can start is worse than
 * none; everything hanging off it goes by cascade.
 *
 * A lobby whose fight has already started is left the same way. What
 * the battle runs on is its own frozen snapshots, so nothing is lost
 * by taking the room down once everybody has walked out of it
 */
export async function leaveDuel(uid: string, id: string): Promise<void> {
  await tx(async (transaction) => {
    const held = await transaction`select host from duels where id = ${id} for update`;
    const row = held.at(0);

    if (row == null) {
      return;
    }
    if (asString(row.host) === uid) {
      await transaction`delete from duels where id = ${id}`;
      return;
    }
    await transaction`delete from duel_members where duel_id = ${id} and player = ${uid}`;
  });
}

/**
 * Start the fight. Both parties are frozen into snapshots under an
 * alliance each, and the battle id is claimed on the lobby row first,
 * so a second press finds it taken.
 *
 * Resolves the battle id, or null when the caller is not the host or
 * the lobby is not ready to go
 */
export async function startDuel(uid: string, id: string, now: number): Promise<string | null> {
  const duel = await readDuel(id);

  if (duel == null || duel.host !== uid) {
    return null;
  }
  if (duel.battle != null) {
    return duel.battle;
  }

  const fighters = duel.members.filter((member) => member.role === LobbyRole.Fighter);

  if (fighters.length !== DUEL_FIGHTERS) {
    return null;
  }
  if (fighters.some((member) => !member.ready || member.catches.length === 0)) {
    return null;
  }

  const battleId = newDocId();
  const claimed = await getSql()`
    update duels set battle_id = ${battleId} where id = ${id} and battle_id is null
  `;

  if (claimed.count === 0) {
    return (await readDuel(id))?.battle ?? null;
  }

  // One alliance each, numbered by which seat they took. Neither side
  // is marked as the boss, so a mutual knockout is the draw it looks
  // like
  // Both sides at once: neither freeze waits on the other, and the
  // host is standing on the Start button for both of them
  const published = await Promise.all(
    fighters.map(async (member, side): Promise<[string, string] | null> => {
      const snapshot = await publishTeamSnapshot(member.player, member.catches, side, now);

      return snapshot == null ? null : [member.player, snapshot];
    }),
  );
  const fielded = published.filter((entry) => entry != null);

  // A side that fields nothing is not a fight. The claim stands, which
  // reads as a lobby whose battle never landed, and the host restages
  if (fielded.length !== DUEL_FIGHTERS) {
    return null;
  }

  await tx(async (transaction) => {
    await transaction`
      insert into battles (id, raid_id, species, outcome, started_at, limits)
      values (${battleId}, null, 0, ${BattleOutcome.Unfinished}, ${now}, ${duel.limits})
    `;

    const rows = fielded.map(([player, snapshot], position) => ({
      battle_id: battleId,
      position,
      snapshot_id: snapshot,
      player,
    }));

    await transaction`
      insert into battle_teams ${transaction(rows, 'battle_id', 'position', 'snapshot_id', 'player')}
    `;
  });

  // Each side has met whatever the other brought
  for (const [player] of fielded) {
    await recordSeenOpponents(battleId, player);
  }

  return battleId;
}
