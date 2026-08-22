import { For, type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import { previewSnapshot } from '../../auth/catch-snapshot';
import { type Profile, getProfiles } from '../../auth/profile';
import { type TeamSnapshotRecord, getTeamSnapshot } from '../../auth/teams';
import { getSpeciesData } from '../../data/species';
import TeamStrip from '../catches/TeamStrip';
import PlayerPlate from '../profile/PlayerPlate';
import { Note } from '../styled';

/**
 * The frozen teams of one battle, each as a face and a row of squares:
 * who fought, and what they fielded. A side no player owns — the raid
 * boss, a grunt's line — is named for what led it out and wears no
 * face.
 */

/** One team, read back out of its snapshot */
interface PreviewRow {
  player: string;
  name: string;
  avatar: string | null;
  catches: [string, CaughtPokemon][];
}

export interface TeamsPreviewProps {
  /** The battle's teamSnapshots/{id} list */
  teams: string[];
  /** The reader, whose own row says "You" and opens nothing */
  player: string;
  onVisit?: (uid: string) => void;
  /**
   * Health taken off the other side, by the uid that took it — the
   * raid boss under the empty string. Given, each row wears its share
   * beside the team that dealt it
   */
  dealt?: Map<string, number>;
}

function TeamsRows(props: TeamsPreviewProps & { loaded: Resource<PreviewRow[]> }): JSX.Element {
  return (
    <ul class="flex list-none flex-col gap-1">
      <For each={props.loaded() ?? []}>
        {(row) => (
          <li class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <PlayerPlate
              name={row.player === props.player ? 'You' : row.name}
              avatar={row.avatar}
              onOpen={
                props.onVisit != null && row.player !== '' && row.player !== props.player
                  ? () => props.onVisit?.(row.player)
                  : undefined
              }
            />
            <Show when={props.dealt?.get(row.player) != null}>
              <span class="text-sm text-muted">
                {Math.round(props.dealt?.get(row.player) ?? 0).toLocaleString()} damage
              </span>
            </Show>
            <TeamStrip catches={row.catches} />
          </li>
        )}
      </For>
    </ul>
  );
}

export default function TeamsPreview(props: TeamsPreviewProps): JSX.Element {
  const [loaded] = createResource(
    () => (props.teams.length === 0 ? null : props.teams.join(',')),
    async (key): Promise<PreviewRow[]> => {
      const found = await Promise.all(key.split(',').map(async (id) => getTeamSnapshot(id)));
      const snapshots = found.filter(
        (snapshot): snapshot is TeamSnapshotRecord => snapshot != null,
      );
      const profiles = await getProfiles(snapshots.map((snapshot) => snapshot.player));

      return snapshots.map((snapshot) => {
        const lead = snapshot.catches.at(0);
        const profile: Profile | undefined = profiles.get(snapshot.player);
        // A side no player owns is named for what led it out
        const wild = lead == null ? 'Wild' : getSpeciesData(lead.species).name;

        return {
          player: snapshot.player,
          name: snapshot.player === '' ? wild : (profile?.nickname ?? 'A trainer'),
          avatar: profile?.avatar ?? null,
          catches: snapshot.catches.map((caught, at): [string, CaughtPokemon] => [
            caught.caught === '' ? `${at}` : caught.caught,
            previewSnapshot(caught),
          ]),
        };
      });
    },
  );

  return (
    <Suspense fallback={<Note>Loading teams…</Note>}>
      <TeamsRows {...props} loaded={loaded} />
    </Suspense>
  );
}
