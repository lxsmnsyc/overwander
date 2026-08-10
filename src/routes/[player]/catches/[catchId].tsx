import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import {
  type CaughtPokemon,
  getCaught,
  getCaughtAbilities,
  getCaughtItems,
} from '../../../auth/caught';
import { useAuth } from '../../../auth/context';
import { evolveCatch, listEvolutions } from '../../../auth/evolution';
import { Stats } from '../../../data/constants/stats';
import type { Items } from '../../../data/ids/items';
import { Genders, type Species } from '../../../data/ids/species';
import { getItemData } from '../../../data/items';
import { getMoveData } from '../../../data/moves';
import { getConsumedItem, getSpeciesData } from '../../../data/species';

const STAT_LABELS: Record<Stats, string> = {
  [Stats.HP]: 'HP',
  [Stats.Attack]: 'Attack',
  [Stats.Defense]: 'Defense',
  [Stats.SpecialAttack]: 'Sp. Attack',
  [Stats.SpecialDefense]: 'Sp. Defense',
  [Stats.Speed]: 'Speed',
};

const GENDER_LABELS: Record<Genders, string> = {
  [Genders.Genderless]: 'Genderless',
  [Genders.Male]: 'Male',
  [Genders.Female]: 'Female',
};

const STAT_ORDER: Stats[] = [
  Stats.HP,
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

interface CatchDetail {
  caught: CaughtPokemon;
  abilities: number[];
  items: Items[];
}

async function loadDetail(catchId: string): Promise<CatchDetail | null> {
  const [caught, abilities, items] = await Promise.all([
    getCaught(catchId),
    getCaughtAbilities(catchId),
    getCaughtItems(catchId),
  ]);

  if (caught == null) {
    return null;
  }
  return { caught, abilities, items };
}

/**
 * The item an evolution spends, named when the item registry knows
 * it; balls and the like are not registered yet, so fall back to the
 * raw id rather than throwing on a detail page
 */
function describeItem(item: Items): string {
  try {
    return getItemData(item).name;
  } catch {
    return `Item #${item}`;
  }
}

export default function CatchPage(): JSX.Element {
  const params = useParams<{ player: string; catchId: string }>();
  const auth = useAuth();
  const [detail, { refetch }] = createResource(() => params.catchId, loadDetail);
  const [status, setStatus] = createSignal<string | null>(null);

  /**
   * The evolutions are only ever offered to the owner: they depend on
   * what the signed-in player carries, and only they can act on them
   */
  const owned = (): string | null => {
    const user = auth.user();

    return user != null && user.uid === params.player ? user.uid : null;
  };

  const [evolutions, { refetch: refetchEvolutions }] = createResource(
    () => {
      const uid = owned();

      return uid == null ? null : ([uid, params.catchId, detail()?.caught.species] as const);
    },
    async ([uid, catchId]) => listEvolutions(uid, catchId),
  );

  const evolve = (into: Species): void => {
    const uid = owned();

    if (uid == null) {
      return;
    }
    setStatus(null);
    evolveCatch(uid, params.catchId, into)
      .then(async (species) => {
        setStatus(
          species == null ? 'That evolution is no longer available.' : 'Evolution complete.',
        );
        await refetch();
        await refetchEvolutions();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <main>
      <Title>Catch - Poketerra</Title>
      <Show when={!detail.loading} fallback={<p>Loading catch…</p>}>
        <Show
          when={(() => {
            const loaded = detail();

            // A catch belongs to exactly one player; reaching it under
            // someone else's route is a wrong address, not a peek
            return loaded != null && loaded.caught.owner === params.player ? loaded : null;
          })()}
          fallback={<p>No such catch.</p>}
        >
          {(loaded) => (
            <>
              <h1>
                {loaded().caught.shiny ? '✦ ' : ''}
                {getSpeciesData(loaded().caught.species).name}
              </h1>
              <dl>
                <dt>Level</dt>
                <dd>{loaded().caught.level}</dd>
                <dt>Gender</dt>
                <dd>{GENDER_LABELS[loaded().caught.gender]}</dd>
                <dt>Nature</dt>
                <dd>#{loaded().caught.nature}</dd>
                <dt>Abilities</dt>
                <dd>
                  {loaded()
                    .abilities.map((ability) => `#${ability}`)
                    .join(', ') || 'None'}
                </dd>
                <dt>Held items</dt>
                <dd>{loaded().items.map(describeItem).join(', ') || 'None'}</dd>
                <dt>Moves</dt>
                <dd>
                  {loaded()
                    .caught.moves.map((move) => getMoveData(move).name)
                    .join(', ') || 'None'}
                </dd>
                <dt>Individual values</dt>
                <dd>
                  {STAT_ORDER.map(
                    (stat) => `${STAT_LABELS[stat]} ${loaded().caught.ivs[stat]}`,
                  ).join(' · ')}
                </dd>
                <dt>Caught</dt>
                <dd>{new Date(loaded().caught.caughtAt).toISOString().slice(0, 10)}</dd>
                <dt>Origin</dt>
                <dd>
                  Chunk {loaded().caught.origin.x}, {loaded().caught.origin.y}
                </dd>
              </dl>

              <Show when={owned()}>
                <h2>Evolution</h2>
                <Show when={!evolutions.loading} fallback={<p>Checking evolutions…</p>}>
                  <Show
                    when={evolutions()?.length}
                    fallback={<p>No evolution is available right now.</p>}
                  >
                    <ul>
                      <For each={evolutions()}>
                        {(evolution) => (
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                evolve(evolution.species);
                              }}
                            >
                              Evolve into {getSpeciesData(evolution.species).name}
                              {/* Item id 0 is a real item, so test for
                                  absence rather than falsiness */}
                              <Show when={getConsumedItem(evolution) ?? undefined} keyed>
                                {(item) => <> (uses {describeItem(item)})</>}
                              </Show>
                            </button>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </Show>
                <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
              </Show>

              <p>
                <a href={`/${params.player}/catches`}>Back to catches</a>
              </p>
            </>
          )}
        </Show>
      </Show>
    </main>
  );
}
