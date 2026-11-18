import type { JSX } from '@solidjs/web';
import { Loading, createMemo } from 'solid-js';
import { type DuelRecord, watchDuel } from '../../../auth/duels';
import { type Profile, getProfiles } from '../../../auth/profile';
import watchLive from '../../app/watch';
import { Note } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';
import LobbyRows from './rows';
import type { DuelLobbyProps, DuelLobbyReport } from './report';

export type { DuelLobbyProps, DuelLobbyReport };

/**
 * One private fight being arranged: two seats, whoever is watching,
 * and the readiness both sides have to give before the host may
 * start.
 *
 * The readiness is what a raid lobby has no use for. A raid boss is
 * not consulted; the other trainer is, and a fight started while they
 * were still picking their sixth is a fight they did not agree to
 */
export default function DuelLobby(props: DuelLobbyProps): JSX.Element {
  // Followed rather than read once: the second player arriving, a
  // party assembled and the host's start all land here
  const duel = watchLive<string, DuelRecord | null>(
    () => props.duelId,
    (id, set) =>
      watchDuel(id, (record) => {
        set(record);
      }),
  );

  /**
   * Who everybody in the room is. A member is a uid in the record, and
   * a uid is not a person: the row is the way into their profile, so
   * it wears the name and the face that profile opens under
   */
  const nameKey = createMemo(() => {
    const uids: string[] = [];

    for (const member of duel()?.members ?? []) {
      uids.push(member.player);
    }
    return uids.sort().join(',');
  });
  const names = createMemo(async (): Promise<Map<string, Profile>> => {
    const uids: string[] = [];

    for (const uid of nameKey().split(',')) {
      if (uid !== '') {
        uids.push(uid);
      }
    }
    return getProfiles(uids);
  });

  return (
    <Loading fallback={<Note>{m.duels_loading_lobby()}</Note>}>
      <LobbyRows {...props} duel={duel} names={names} />
    </Loading>
  );
}
