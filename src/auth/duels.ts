// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import { asNumber, asRecordArray, asString } from './__normalize';
import { type DuelInvite, type DuelRecord, type DuelRules, asDuelRecord } from './duel-record';
import type { LobbyRole } from './lobby-role';
import { requireUid } from '../server/auth';
import {
  declineDuelInvite as declineOnServer,
  hostDuel as hostOnServer,
  inviteToDuelByCode as inviteByCodeOnServerSide,
  inviteToDuel as inviteOnServer,
  joinDuel as joinOnServer,
  leaveDuel as leaveOnServer,
  setDuelParty as setPartyOnServer,
  setDuelReady as setReadyOnServer,
  setDuelRole as setRoleOnServer,
  setDuelRules as setRulesOnServer,
  startDuel as startOnServer,
} from '../server/duels';
import { syncServerClock } from './clock';
import getSupabase, { type Unwatch, watchRow, watchTable } from './supabase';
import getIdToken from './session';

export {
  DEFAULT_DUEL_RULES,
  DUEL_FIGHTERS,
  getDuelBlocker,
  getDuelFighters,
  getDuelSpectators,
} from './duel-record';
export type { DuelInvite, DuelMember, DuelRecord, DuelRules } from './duel-record';

const DUEL_TABLE = 'duels';

/** One lobby, its members and their parties stitched back together */
export async function getDuel(id: string): Promise<DuelRecord | null> {
  return (await readDuels([id])).get(id) ?? null;
}

/**
 * Lobbies by id, with their members and parties. Two reads however many
 * lobbies, rather than two per lobby
 */
async function readDuels(ids: string[]): Promise<Map<string, DuelRecord>> {
  const found = new Map<string, DuelRecord>();

  if (ids.length === 0) {
    return found;
  }

  const supabase = getSupabase();
  const [lobbies, parties] = await Promise.all([
    supabase
      .from(DUEL_TABLE)
      .select(
        'id, host, battle_id, created_at, limits, team_size, ' +
          'duel_members(player, role, ready, joined_seq)',
      )
      .in('id', ids),
    supabase.from('duel_catches').select('duel_id, player, slot, caught_id').in('duel_id', ids),
  ]);
  // Each lobby's parties, by player, as slot and catch pairs
  const held = new Map<string, Map<string, [number, string][]>>();

  for (const entry of asRecordArray(parties.data)) {
    const duel = asString(entry.duel_id);
    const players = held.get(duel) ?? new Map<string, [number, string][]>();
    const player = asString(entry.player);

    players.set(player, [
      ...(players.get(player) ?? []),
      [asNumber(entry.slot), asString(entry.caught_id)],
    ]);
    held.set(duel, players);
  }
  for (const row of asRecordArray(lobbies.data)) {
    const id = asString(row.id);

    found.set(id, fromDuelRow(row, held.get(id) ?? new Map<string, [number, string][]>()));
  }
  return found;
}

function fromDuelRow(
  row: Record<string, unknown>,
  held: Map<string, [number, string][]>,
): DuelRecord {
  const members = asRecordArray(row.duel_members).sort(
    (left, right) => asNumber(left.joined_seq) - asNumber(right.joined_seq),
  );
  const seated: Record<string, unknown>[] = [];

  for (const entry of members) {
    const catches: string[] = [];

    for (const [, caught] of (held.get(asString(entry.player)) ?? []).sort(
      ([left], [right]) => left - right,
    )) {
      catches.push(caught);
    }
    seated.push({ player: entry.player, role: entry.role, ready: entry.ready, catches });
  }
  return asDuelRecord({
    host: row.host,
    battle: row.battle_id,
    createdAt: row.created_at,
    limits: row.limits,
    teamSize: row.team_size,
    members: seated,
  });
}

/**
 * Follow a lobby. Everything in one moves while somebody is looking
 * at it, and each part is a table of its own: the second player
 * arriving, a party assembled, a ready taken back, the host's start
 */
export function watchDuel(id: string, onChange: (duel: DuelRecord | null) => void): Unwatch {
  const read = async (): Promise<DuelRecord | null> => getDuel(id);
  const closers = [
    watchRow(DUEL_TABLE, `id=eq.${id}`, read, onChange),
    watchTable('duel_members', [`duel_id=eq.${id}`], read, onChange),
    watchTable('duel_catches', [`duel_id=eq.${id}`], read, onChange),
  ];

  return () => {
    for (const close of closers) {
      close();
    }
  };
}

/**
 * The lobbies this player is standing in. There is rarely more than
 * one: a player hosts one at a time and is called into few
 */
export async function listMyDuels(uid: string): Promise<[string, DuelRecord][]> {
  const { data } = await getSupabase().from('duel_members').select('duel_id').eq('player', uid);
  const ids: string[] = [];

  for (const row of asRecordArray(data)) {
    ids.push(asString(row.duel_id));
  }

  const found = await readDuels(ids);
  const duels: [string, DuelRecord][] = [];

  for (const id of ids) {
    const duel = found.get(id);

    if (duel != null) {
      duels.push([id, duel]);
    }
  }
  return duels;
}

/** Follow that list, so a lobby opened or shut elsewhere moves it */
export function watchMyDuels(
  uid: string,
  onChange: (duels: [string, DuelRecord][]) => void,
): Unwatch {
  const read = async (): Promise<[string, DuelRecord][]> => listMyDuels(uid);
  const closers = [
    // Unfiltered on the lobby table: a lobby starting or being taken
    // down leaves the set by UPDATE or DELETE, which the set's own
    // filter would not deliver
    watchTable(DUEL_TABLE, [], read, onChange),
    watchTable('duel_members', [`player=eq.${uid}`], read, onChange),
  ];

  return () => {
    for (const close of closers) {
      close();
    }
  };
}

/** The calls waiting on this player */
export function watchDuelInvites(uid: string, onChange: (invites: DuelInvite[]) => void): Unwatch {
  const read = async (): Promise<DuelInvite[]> => {
    const { data } = await getSupabase()
      .from('duel_invites')
      .select('duel_id, sender, role, sent_at')
      .eq('recipient', uid)
      .order('sent_at', { ascending: false });

    const invites: DuelInvite[] = [];

    for (const row of asRecordArray(data)) {
      invites.push({
        duel: asString(row.duel_id),
        sender: asString(row.sender),
        role: asNumber(row.role) as LobbyRole,
        sentAt: asNumber(row.sent_at),
      });
    }
    return invites;
  };

  return watchTable('duel_invites', [`recipient=eq.${uid}`], read, onChange);
}

/**
 * Open a lobby, or step back into the one already open. `watching`
 * stages a fight for other people: the host takes no seat and the
 * lobby waits for two guests instead of one
 */
export async function hostDuel(watching = false): Promise<string> {
  return hostDuelOnServer(await getIdToken(), watching);
}

async function hostDuelOnServer(token: string, watching: boolean): Promise<string> {
  'use server';
  return hostOnServer(await requireUid(token), watching, await syncServerClock());
}

/** Call somebody in, to fight or to watch */
export async function inviteToDuel(id: string, target: string, role: LobbyRole): Promise<boolean> {
  return inviteToDuelOnServer(await getIdToken(), id, target, role);
}

async function inviteToDuelOnServer(
  token: string,
  id: string,
  target: string,
  role: LobbyRole,
): Promise<boolean> {
  'use server';
  return inviteOnServer(await requireUid(token), id, target, role, await syncServerClock());
}

/** The same call, to whoever holds a friend code */
export async function inviteToDuelByCode(
  id: string,
  code: string,
  role: LobbyRole,
): Promise<boolean> {
  return inviteByCodeOnServer(await getIdToken(), id, code, role);
}

async function inviteByCodeOnServer(
  token: string,
  id: string,
  code: string,
  role: LobbyRole,
): Promise<boolean> {
  'use server';
  return inviteByCodeOnServerSide(await requireUid(token), id, code, role, await syncServerClock());
}

export async function declineDuelInvite(id: string): Promise<void> {
  await declineDuelInviteOnServer(await getIdToken(), id);
}

async function declineDuelInviteOnServer(token: string, id: string): Promise<void> {
  'use server';
  await declineOnServer(await requireUid(token), id);
}

/** Answer a call by walking in, under whichever seat it offered */
export async function joinDuel(id: string): Promise<boolean> {
  return joinDuelOnServer(await getIdToken(), id);
}

async function joinDuelOnServer(token: string, id: string): Promise<boolean> {
  'use server';
  return joinOnServer(await requireUid(token), id);
}

/** Take the free seat, or step back to watching */
export async function setDuelRole(id: string, role: LobbyRole): Promise<boolean> {
  return setDuelRoleOnServer(await getIdToken(), id, role);
}

async function setDuelRoleOnServer(token: string, id: string, role: LobbyRole): Promise<boolean> {
  'use server';
  return setRoleOnServer(await requireUid(token), id, role);
}

/**
 * Set what this fight allows. The host's alone, and it takes every
 * ready back: what both sides agreed to was a fight under the rules
 * they could see
 */
export async function setDuelRules(id: string, rules: DuelRules): Promise<boolean> {
  return setDuelRulesOnServer(await getIdToken(), id, rules);
}

async function setDuelRulesOnServer(token: string, id: string, rules: DuelRules): Promise<boolean> {
  'use server';
  return setRulesOnServer(await requireUid(token), id, rules);
}

/**
 * Assemble the party this side is bringing. It takes the ready back:
 * what the other side agreed to was the party they could see
 */
export async function setDuelParty(id: string, catches: string[]): Promise<boolean> {
  return setDuelPartyOnServer(await getIdToken(), id, catches);
}

async function setDuelPartyOnServer(
  token: string,
  id: string,
  catches: string[],
): Promise<boolean> {
  'use server';
  return setPartyOnServer(await requireUid(token), id, catches);
}

export async function setDuelReady(id: string, ready: boolean): Promise<boolean> {
  return setDuelReadyOnServer(await getIdToken(), id, ready);
}

async function setDuelReadyOnServer(token: string, id: string, ready: boolean): Promise<boolean> {
  'use server';
  return setReadyOnServer(await requireUid(token), id, ready);
}

/** Walk out. The host leaving takes the lobby with them */
export async function leaveDuel(id: string): Promise<void> {
  await leaveDuelOnServer(await getIdToken(), id);
}

async function leaveDuelOnServer(token: string, id: string): Promise<void> {
  'use server';
  await leaveOnServer(await requireUid(token), id);
}

/**
 * Start the fight. Resolves the battle id, or null when the caller is
 * not the host or the lobby is not ready to go
 */
export async function startDuel(id: string): Promise<string | null> {
  return startDuelOnServer(await getIdToken(), id);
}

async function startDuelOnServer(token: string, id: string): Promise<string | null> {
  'use server';
  return startOnServer(await requireUid(token), id, await syncServerClock());
}
