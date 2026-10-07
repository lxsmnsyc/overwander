import { For, type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import { previewSnapshot } from '../../auth/catch-snapshot';
import { type Profile, getProfiles } from '../../auth/profile';
import { type TeamSnapshotRecord, getTeamSnapshotBatched } from '../../auth/teams';
import { getSpeciesData } from '../../data/species';
import TeamRow, { TeamRows } from '../catches/TeamRow';
import PlayerPlate from '../profile/PlayerPlate';
import { Note } from '../styled';
import type { SideSummary } from './battle-view/summary';

/**
 * A raid's aftermath, team by team: each party as the fight left it,
 * then a plate with where it placed, who it was and what it dealt.
 * The team comes first and is large enough to see who is in it; a
 * strip squeezed in beside the name was too small to tell anyone
 * apart. The boss stands last, with what it dealt back.
 */

/** One team, read back out of its snapshot */
interface PreviewRow {
  player: string;
  name: string;
  sprite: string | null;
  catches: [string, CaughtPokemon][];
  /**
   * The alliance it fought under and which of that alliance's teams it
   * was, which is how it is told which side it fought as
   */
  alliance: number;
  nth: number;
}

export interface TeamsPreviewProps {
  /** The battle's teamSnapshots/{id} list */
  teams: string[];
  /** The reader, whose own row says "You" and opens nothing */
  player: string;
  onVisit?: (uid: string) => void;
  /** The fight read by sides, which is where the damage and the end state come from */
  sides: SideSummary[];
}

function TeamsRows(props: TeamsPreviewProps & { loaded: Resource<PreviewRow[]> }): JSX.Element {
  /** The side that fought a team, and so what it dealt and how it ended */
  const sideOf = (row: PreviewRow): SideSummary | undefined => {
    for (const side of props.sides) {
      if (side.alliance === row.alliance && side.nth === row.nth) {
        return side;
      }
    }
    return undefined;
  };

  const dealt = (row: PreviewRow): number => sideOf(row)?.dealt ?? 0;

  /** The parties by what they dealt, most first, and the boss after them */
  const ranked = (): PreviewRow[] => {
    const parties: PreviewRow[] = [];
    const bosses: PreviewRow[] = [];

    for (const row of props.loaded() ?? []) {
      (row.player === '' ? bosses : parties).push(row);
    }
    parties.sort((one, other) => dealt(other) - dealt(one));
    return [...parties, ...bosses];
  };

  /** Everything the parties dealt between them, which a share is of */
  const total = (): number => {
    let sum = 0;

    for (const row of props.loaded() ?? []) {
      if (row.player !== '') {
        sum += dealt(row);
      }
    }
    return sum;
  };

  const share = (row: PreviewRow): number => (total() <= 0 ? 0 : dealt(row) / total());

  /** What each square finished on, by its place in the party */
  const ended = (row: PreviewRow): (number | undefined)[] | undefined => {
    const side = sideOf(row);

    if (side == null) {
      return undefined;
    }
    const health: (number | undefined)[] = [];

    for (const unit of side.units) {
      health[unit.seat] = unit.health;
    }
    return health;
  };

  const tone = (row: PreviewRow): 'mine' | 'foe' | undefined => {
    if (row.player === '') {
      return 'foe';
    }
    return row.player === props.player ? 'mine' : undefined;
  };

  return (
    <TeamRows>
      <For each={ranked()}>
        {(row, at) => (
          <TeamRow
            catches={row.catches}
            name={row.player === props.player ? 'You' : row.name}
            ended={ended(row)}
            tone={tone(row)}
          >
            <Show
              when={row.player !== ''}
              fallback={
                <span class="shrink-0 text-xs font-black text-ember-dark uppercase">Boss</span>
              }
            >
              <span class="w-6 shrink-0 text-center font-black text-muted tabular-nums">
                {at() + 1}
              </span>
            </Show>
            <span class="min-w-0 grow">
              {/* The boss is nobody's, so it wears no trainer's face */}
              <Show
                when={row.player !== ''}
                fallback={<span class="truncate font-bold">{row.name}</span>}
              >
                <PlayerPlate
                  name={row.player === props.player ? 'You' : row.name}
                  sprite={row.sprite}
                  onOpen={
                    props.onVisit != null && row.player !== props.player
                      ? () => props.onVisit?.(row.player)
                      : undefined
                  }
                />
              </Show>
            </span>
            <span class="flex shrink-0 flex-col items-end">
              <span class="font-black tabular-nums">{Math.round(dealt(row)).toLocaleString()}</span>
              <span class="text-xs text-muted">
                {row.player === ''
                  ? 'dealt back'
                  : `${Math.round(share(row) * 100)}% of the damage`}
              </span>
            </span>
            {/* The share drawn as well as said, so the order reads at a glance */}
            <Show when={row.player !== ''}>
              <span class="h-1.5 basis-full overflow-hidden rounded-full bg-line-soft">
                <span
                  class="block h-full rounded-full bg-tide"
                  style={{ width: `${share(row) * 100}%` }}
                />
              </span>
            </Show>
          </TeamRow>
        )}
      </For>
    </TeamRows>
  );
}

export default function TeamsPreview(props: TeamsPreviewProps): JSX.Element {
  const [loaded] = createResource(
    () => (props.teams.length === 0 ? null : props.teams.join(',')),
    async (key): Promise<PreviewRow[]> => {
      const pending: Promise<TeamSnapshotRecord | null>[] = [];

      for (const id of key.split(',')) {
        pending.push(getTeamSnapshotBatched(id));
      }

      const found = await Promise.all(pending);
      const snapshots: TeamSnapshotRecord[] = [];
      const players: string[] = [];

      for (const snapshot of found) {
        if (snapshot != null) {
          snapshots.push(snapshot);
          players.push(snapshot.player);
        }
      }

      const profiles = await getProfiles(players);
      const rows: PreviewRow[] = [];
      /** How many teams of each alliance have been read, to match each to its side */
      const met = new Map<number, number>();

      for (const snapshot of snapshots) {
        const lead = snapshot.catches.at(0);
        const profile: Profile | undefined = profiles.get(snapshot.player);
        // A side no player owns is named for what led it out
        const wild = lead == null ? 'Wild' : getSpeciesData(lead.species).name;
        const catches: [string, CaughtPokemon][] = [];
        const nth = met.get(snapshot.alliance) ?? 0;

        met.set(snapshot.alliance, nth + 1);
        for (const [at, caught] of snapshot.catches.entries()) {
          catches.push([caught.caught === '' ? `${at}` : caught.caught, previewSnapshot(caught)]);
        }
        rows.push({
          player: snapshot.player,
          name: snapshot.player === '' ? wild : (profile?.nickname ?? 'A trainer'),
          sprite: profile?.sprite ?? null,
          catches,
          alliance: snapshot.alliance,
          nth,
        });
      }
      return rows;
    },
  );

  return (
    <Suspense fallback={<Note>Loading teams…</Note>}>
      <TeamsRows {...props} loaded={loaded} />
    </Suspense>
  );
}
