import { type JSX, type Resource, Suspense, createResource } from 'solid-js';
import type { RaidRecord } from '../../../auth/raids';
import { type Profile, getProfiles } from '../../../auth/profile';
import { settled } from '../../app/resource-reads';
import type { TeamRecord } from '../../../auth/teams';
import { Note } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';
import splitKey from './key';
import type { RaidLobbyProps } from './report';
import LobbyRows from './rows';

/**
 * The lobby with its teams read, which is where the names are asked
 * for: who is in it decides whose profiles have to be looked up, so
 * that read has to be a body below the one holding the teams
 */
export default function LobbyTeams(
  props: RaidLobbyProps & {
    raid: () => RaidRecord | null;
    teams: Resource<TeamRecord[]>;
    canJoin: Resource<boolean>;
    watching: () => string[];
  },
): JSX.Element {
  /**
   * Who everybody in the lobby is. A party is named by its player's
   * uid in the record, and a uid is not a person: the row is the way
   * into their profile, so it wears the name and the face that
   * profile opens under. Read once for the whole lobby, keyed on who
   * is in it
   */
  const [names] = createResource(
    () => {
      const players = new Set<string>();

      for (const team of settled(props.teams) ?? []) {
        players.add(team.player);
      }
      return [...players].sort().join(',');
    },
    async (key): Promise<Map<string, Profile>> => getProfiles(splitKey(key)),
  );

  return (
    <Suspense fallback={<Note>{m.raid_loading_one()}</Note>}>
      <LobbyRows {...props} names={names} />
    </Suspense>
  );
}
