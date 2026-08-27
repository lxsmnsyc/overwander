// Rows arrive untyped; the reader below restores const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import { asNumber, asRecord, asRecordArray, asString, asStringArray } from './__normalize';
import { LobbyRole } from './lobby-role';

/**
 * What a battle lobby is, and how a stored one is read back. Both the
 * client and the privileged server work from these, so the shape sits
 * apart from both
 */

/**
 * How many of the players in a lobby actually fight. The rest are
 * watching, however many of them there are
 */
export const DUEL_FIGHTERS = 2;

/** One player standing in a lobby */
export interface DuelMember {
  player: string;
  role: LobbyRole;
  /**
   * Whether they have said their party is the one they mean to bring.
   * Assembling a different party takes it back
   */
  ready: boolean;
  /**
   * The catch ids they have assembled, empty for a watcher
   */
  catches: string[];
}

/**
 * One lobby at duels/{duelId}. It is private: nothing in the world
 * stages one, and only the people in it and the people called into it
 * can read it
 */
export interface DuelRecord {
  host: string;
  /**
   * The battles/{battleId} the host started, or null while the lobby
   * is still gathering
   */
  battle: string | null;
  createdAt: number;
  /**
   * Everybody in the lobby, in the order they arrived
   */
  members: DuelMember[];
}

/** One call into a lobby, waiting on the player it was sent to */
export interface DuelInvite {
  duel: string;
  sender: string;
  role: LobbyRole;
  sentAt: number;
}

export function asDuelRecord(value: unknown): DuelRecord {
  const data = asRecord(value);

  return {
    host: asString(data.host),
    battle: typeof data.battle === 'string' ? data.battle : null,
    createdAt: asNumber(data.createdAt),
    members: asRecordArray(data.members).map((entry) => ({
      player: asString(entry.player),
      role: asNumber(entry.role) as LobbyRole,
      ready: entry.ready === true,
      catches: asStringArray(entry.catches),
    })),
  };
}

/** The two who are fighting, in the order they took the seats */
export function getDuelFighters(duel: DuelRecord): DuelMember[] {
  return duel.members.filter((member) => member.role === LobbyRole.Fighter);
}

export function getDuelSpectators(duel: DuelRecord): DuelMember[] {
  return duel.members.filter((member) => member.role === LobbyRole.Spectator);
}

/**
 * Why the host cannot start yet, or null when they can. A sentence
 * rather than a boolean: the Start button is dead for one of three
 * different reasons and the lobby has to say which
 */
export function getDuelBlocker(duel: DuelRecord): string | null {
  const fighters = getDuelFighters(duel);

  if (fighters.length < DUEL_FIGHTERS) {
    return 'Waiting for a second trainer.';
  }
  if (fighters.some((member) => member.catches.length === 0)) {
    return 'Both sides need a party.';
  }
  if (fighters.some((member) => !member.ready)) {
    return 'Both sides have to be ready.';
  }
  return null;
}
