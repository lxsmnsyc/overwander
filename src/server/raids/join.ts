import 'server-only';
import { asCaughtPokemon } from '../../auth/caught-record';
import { isFainted } from '../../auth/health';
import { RAID_PLAYER_LIMIT } from '../../auth/raid-record';
import { TEAM_SIZE } from '../../auth/teams';
import { isGuardedRecord } from '../catch-fields';
import { getSql, newDocId, tx } from '../db';
import { readCaughtMany } from '../caught-io';
import { readRaid } from '../raid-io';
import { isAnyCatchLocked } from '../locks';
import { asNumber } from '../read';

/** Joining a lobby with a team, and what bars a catch from one */
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
 * the different question the battle lock asks.
 *
 * A battle lobby's party counts the same way. `exceptDuel` is the one
 * a caller is assembling right now: replacing a party there must not
 * find the pokemon it is replacing
 */
export async function isAnyCatchQueued(
  uid: string,
  catches: string[],
  exceptDuel = '',
): Promise<boolean> {
  // One query says it all: a party of this player's, holding any of
  // these catches, in a lobby that has not started
  const rows = await getSql()`
    select 1
    from teams t
    join team_catches tc on tc.team_id = t.id
    join raids r on r.id = t.raid_id
    where t.player = ${uid}
      and tc.caught_id = any(${catches})
      and r.battle_id is null
      and not r.cleared
    union all
    select 1
    from duel_catches dc
    join duels d on d.id = dc.duel_id
    where dc.player = ${uid}
      and dc.caught_id = any(${catches})
      and dc.duel_id <> ${exceptDuel}
      and d.battle_id is null
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

  // Read together rather than one at a time: a party of six is two
  // round trips this way and twelve the other
  const found = await readCaughtMany(getSql(), catches);
  const records = catches.map((one) => found.get(one));
  const owned = records.every((record) => record != null) ? records : null;

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

  return tx(async (transaction) => {
    // The raid row is the lock: two parties joining a nearly full
    // lobby at once count one after the other
    const held = await transaction`select 1 from raids where id = ${lobby} for update`;

    if (held.length === 0) {
      return null;
    }

    // Distinct players other than this one: a second team of their
    // own fills no new place, and a full lobby still takes it
    const others = await transaction`
      select count(distinct player)::int as joined
      from teams where raid_id = ${lobby} and player <> ${uid}
    `;

    if (asNumber(others[0]?.joined) >= RAID_PLAYER_LIMIT) {
      return null;
    }

    await transaction`
      insert into teams (id, player, raid_id) values (${teamId}, ${uid}, ${lobby})
    `;

    const rows = catches.map((caught, slot) => ({ team_id: teamId, slot, caught_id: caught }));

    await transaction`
      insert into team_catches ${transaction(rows, 'team_id', 'slot', 'caught_id')}
    `;
    // An invite that was answered has done its work
    await transaction`
      delete from raid_invites where raid_id = ${lobby} and recipient = ${uid}
    `;
    return teamId;
  });
}
