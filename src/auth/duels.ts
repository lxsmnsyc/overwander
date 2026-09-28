// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { DuelInvite, DuelRecord, DuelRules } from './duel-record';
import type { LobbyRole } from './lobby-role';
import { requireReader, requireUid, requireUidFor } from '../server/auth';
import { Feature } from '../server/switches';
import check, {
  DUEL_RULES,
  FLAG,
  ID,
  ID_BATCH,
  LOBBY_ROLE,
  PARTY,
  TEXT,
  TOKEN,
  UID,
} from '../server/validate';
import {
  declineDuelInvite as declineOnServer,
  hostDuel as hostOnServer,
  inviteToDuelByCode as inviteByCodeOnServerSide,
  inviteToDuel as inviteOnServer,
  joinDuel as joinOnServer,
  leaveDuel as leaveOnServer,
  readDuelInvites,
  readMyDuelIds,
  readVisibleDuels,
  setDuelParty as setPartyOnServer,
  setDuelReady as setReadyOnServer,
  setDuelRole as setRoleOnServer,
  setDuelRules as setRulesOnServer,
  startDuel as startOnServer,
} from '../server/duels';
import { syncServerClock } from './clock';
import { type Unwatch, watchRow, watchTable } from './watch';
import { readOnly } from '../utils/server-calls';
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

/** Lobbies by id, with their members and parties, leaving out any the player cannot see */
async function readDuels(ids: string[]): Promise<Map<string, DuelRecord>> {
  return new Map(ids.length === 0 ? [] : await readDuelsOnServer(await getIdToken(), ids));
}

async function readDuelsOnServer(token: string, ids: string[]): Promise<[string, DuelRecord][]> {
  'use server';
  check(TOKEN, token);
  check(ID_BATCH, ids);
  return readVisibleDuels(await requireReader(token), ids);
}
readOnly(readDuelsOnServer);

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
  const ids = await readMyDuelIdsOnServer(await getIdToken(), uid);
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

async function readMyDuelIdsOnServer(token: string, player: string): Promise<string[]> {
  'use server';
  check(TOKEN, token);
  check(UID, player);
  const uid = await requireReader(token);

  return player === uid ? readMyDuelIds(uid) : [];
}
readOnly(readMyDuelIdsOnServer);

/** Follow that list, so a lobby opened or shut elsewhere moves it */
export function watchMyDuels(
  uid: string,
  onChange: (duels: [string, DuelRecord][]) => void,
): Unwatch {
  let mine = new Set<string>();
  const read = async (): Promise<[string, DuelRecord][]> => {
    const duels = await listMyDuels(uid);

    mine = new Set<string>();
    for (const [id] of duels) {
      mine.add(id);
    }
    return duels;
  };
  const closers = [
    // Unfiltered on the lobby table: a lobby starting or being taken
    // down leaves the set by UPDATE or DELETE, which the set's own
    // filter would not deliver. A lobby joined arrives as a member row
    // below, so only a change to one already in the list is read
    watchTable(DUEL_TABLE, [], read, onChange, { wanted: (row) => mine.has(String(row.id)) }),
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
    const invites: DuelInvite[] = [];

    for (const invite of await readInvitesOnServer(await getIdToken())) {
      invites.push({ ...invite, role: invite.role as LobbyRole });
    }
    return invites;
  };

  return watchTable('duel_invites', [`recipient=eq.${uid}`], read, onChange);
}

async function readInvitesOnServer(
  token: string,
): Promise<{ duel: string; sender: string; role: number; sentAt: number }[]> {
  'use server';
  check(TOKEN, token);
  return readDuelInvites(await requireReader(token));
}
readOnly(readInvitesOnServer);

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
  check(TOKEN, token);
  check(FLAG, watching);
  return hostOnServer(await requireUidFor(token, Feature.Duels), watching, await syncServerClock());
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
  check(TOKEN, token);
  check(ID, id);
  check(UID, target);
  check(LOBBY_ROLE, role);
  return inviteOnServer(
    await requireUidFor(token, Feature.Duels),
    id,
    target,
    role,
    await syncServerClock(),
  );
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
  check(TOKEN, token);
  check(ID, id);
  check(TEXT, code);
  check(LOBBY_ROLE, role);
  return inviteByCodeOnServerSide(
    await requireUidFor(token, Feature.Duels),
    id,
    code,
    role,
    await syncServerClock(),
  );
}

export async function declineDuelInvite(id: string): Promise<void> {
  await declineDuelInviteOnServer(await getIdToken(), id);
}

async function declineDuelInviteOnServer(token: string, id: string): Promise<void> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  await declineOnServer(await requireUid(token), id);
}

/** Answer a call by walking in, under whichever seat it offered */
export async function joinDuel(id: string): Promise<boolean> {
  return joinDuelOnServer(await getIdToken(), id);
}

async function joinDuelOnServer(token: string, id: string): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  return joinOnServer(await requireUidFor(token, Feature.Duels), id);
}

/** Take the free seat, or step back to watching */
export async function setDuelRole(id: string, role: LobbyRole): Promise<boolean> {
  return setDuelRoleOnServer(await getIdToken(), id, role);
}

async function setDuelRoleOnServer(token: string, id: string, role: LobbyRole): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  check(LOBBY_ROLE, role);
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
  check(TOKEN, token);
  check(ID, id);
  check(DUEL_RULES, rules);
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
  check(TOKEN, token);
  check(ID, id);
  check(PARTY, catches);
  return setPartyOnServer(await requireUid(token), id, catches);
}

export async function setDuelReady(id: string, ready: boolean): Promise<boolean> {
  return setDuelReadyOnServer(await getIdToken(), id, ready);
}

async function setDuelReadyOnServer(token: string, id: string, ready: boolean): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  check(FLAG, ready);
  return setReadyOnServer(await requireUid(token), id, ready);
}

/** Walk out. The host leaving takes the lobby with them */
export async function leaveDuel(id: string): Promise<void> {
  await leaveDuelOnServer(await getIdToken(), id);
}

async function leaveDuelOnServer(token: string, id: string): Promise<void> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
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
  check(TOKEN, token);
  check(ID, id);
  return startOnServer(await requireUidFor(token, Feature.Duels), id, await syncServerClock());
}
