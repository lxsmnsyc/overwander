import { type JSX, Suspense, createEffect, createResource, from, onCleanup } from 'solid-js';
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
  // is looking at it, and the host's start lands here too
  const raid = from<RaidRecord | null>((set) =>
    watchRaid(props.raidId, (record) => {
      set(record);
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
  // the same ones
  const [teams] = createResource(
    () => raid()?.teams.join(',') ?? null,
    async (key): Promise<TeamRecord[]> => {
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
    },
  );

  // A player with no pokemon of their own can stand in the lobby and
  // watch, but has nothing to field
  const [canJoin] = createResource(
    () => props.user.uid,
    async (uid) => canJoinRaids(uid),
  );

  // Standing here is written down, so the lobby can say who is in the
  // room. It is dropped again on the way out, and the way out is not
  // only the Cancel button: shutting the panel unmounts this, and a
  // row left behind would show them watching a raid they walked away
  // from until the window turned over
  createEffect(() => {
    const lobby = props.raidId;

    watchRaidLobby(lobby).catch(() => {
      // A presence that did not land is a name missing from a list;
      // nothing about the raid turns on it
    });

    onCleanup(() => {
      unwatchRaidLobby(lobby).catch(() => undefined);
    });
  });

  const watching = watchLive<string[]>((set) =>
    watchRaidWatchers(props.raidId, (players) => {
      set(players);
    }),
  );

  return (
    <Suspense fallback={<Note>{m.raid_loading_one()}</Note>}>
      <LobbyTeams
        {...props}
        raid={() => raid() ?? null}
        teams={teams}
        canJoin={canJoin}
        watching={() => watching() ?? []}
      />
    </Suspense>
  );
}
