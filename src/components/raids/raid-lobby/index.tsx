import type { JSX } from '@solidjs/web';
import { Loading, createEffect, createMemo, from } from 'solid-js';
import {
  type RaidRecord,
  canJoinRaids,
  unwatchRaidLobby,
  watchRaid,
  watchRaidLobby,
  watchRaidWatchers,
} from '../../../auth/raids';
import { type TeamRecord, getTeamBatched } from '../../../auth/teams';
import { Note } from '../../styled';
import watchLive from '../../app/watch';
import { m } from '../../../i18n/paraglide/messages.js';
import splitKey from './key';
import type { RaidLobbyProps, RaidLobbyReport } from './report';
import LobbyTeams from './teams';

export type { RaidLobbyProps, RaidLobbyReport };

/**
 * One raid lobby, filling the Raids tab: who has joined, a way to
 * bring a party, and, for the host, the button that starts the
 * fight. Going back leaves the lobby, taking the player's teams with
 * them
 */
export default function RaidLobby(props: RaidLobbyProps): JSX.Element {
  // The lobby is shared: parties join and leave it while the player
  // is looking at it, and the host's start lands here too. Seeded with
  // nothing, so the rows tell "not here yet" from "gone" themselves
  const raid = createMemo(() =>
    from<RaidRecord | null | undefined>((set) => {
      set(undefined);
      return watchRaid(props.raidId, (record) => {
        set(record);
      });
    }),
  );

  // A team is written once and never changed, so one already read is
  // kept by its id: a join reads the team that joined and nothing else,
  // and the rows of the teams already there are not built again
  const known = new Map<string, TeamRecord>();
  const readTeam = async (id: string): Promise<TeamRecord | null> => {
    const team = known.get(id) ?? (await getTeamBatched(id));

    if (team != null) {
      known.set(id, team);
    }
    return team;
  };

  // Keyed on the ids, since every lobby ping hands over a fresh array of
  // the same ones. No lobby yet asks for nothing
  const teamKey = createMemo(() => raid()?.teams.join(',') ?? null);
  const readTeams = async (key: string): Promise<TeamRecord[]> => {
    const reads: Promise<TeamRecord | null>[] = [];

    // One read for every team not held yet, rather than one per team
    for (const id of splitKey(key)) {
      reads.push(readTeam(id));
    }

    const found: TeamRecord[] = [];

    for (const team of await Promise.all(reads)) {
      if (team != null) {
        found.push(team);
      }
    }
    return found;
  };
  const teams = createMemo((): Promise<TeamRecord[]> | null => {
    const key = teamKey();

    return key == null ? null : readTeams(key);
  });

  // A player with no pokemon of their own can stand in the lobby and
  // watch, but has nothing to field
  const canJoin = createMemo(async () => canJoinRaids(props.user.uid));

  // Standing here is written down, so the lobby can say who is in the
  // room. It is dropped again on the way out, and the way out is not
  // only the Cancel button: shutting the panel unmounts this, and a
  // row left behind would show them watching a raid they walked away
  // from until the window turned over
  createEffect(
    () => props.raidId,
    (lobby) => {
      watchRaidLobby(lobby).catch(() => {
        // A presence that did not land is a name missing from a list;
        // nothing about the raid turns on it
      });
      return () => {
        unwatchRaidLobby(lobby).catch(() => undefined);
      };
    },
  );

  const watching = watchLive<string, string[]>(
    () => props.raidId,
    (lobby, set) =>
      watchRaidWatchers(lobby, (players) => {
        set(players);
      }),
  );

  return (
    <Loading fallback={<Note>{m.raid_loading_one()}</Note>}>
      <LobbyTeams
        {...props}
        raid={() => raid() ?? null}
        teams={teams}
        canJoin={canJoin}
        watching={() => watching() ?? []}
      />
    </Loading>
  );
}
