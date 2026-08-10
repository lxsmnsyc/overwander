import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from 'terracotta';
import { type CaughtPokemon, getCaught, getCaughtAbilities, getCaughtItems } from '../auth/caught';
import { useAuth } from '../auth/context';
import { evolveCatch, listEvolutions } from '../auth/evolution';
import { Stats } from '../data/constants/stats';
import { BALL_ITEMS, type Items } from '../data/ids/items';
import { Genders, type Species } from '../data/ids/species';
import { getItemData } from '../data/items';
import { getMoveData } from '../data/moves';
import { getConsumedItem, getSpeciesData } from '../data/species';

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
 * The item registry only knows berries and stones so far; a held
 * ball would throw, so fall back to the raw id
 */
function describeItem(item: Items): string {
  try {
    return getItemData(item).name;
  } catch {
    return `Item #${item}`;
  }
}

export interface CatchDialogProps {
  /**
   * The player the catch is being viewed under; a catch owned by
   * anyone else is treated as absent
   */
  player: string;
  /**
   * The catch to show, or null when the dialog is closed
   */
  catchId: string | null;
  onClose: () => void;
  /**
   * Fired when the catch changed (an evolution landed), so the list
   * behind the dialog can refresh
   */
  onChange?: () => void;
}

/**
 * One catch in full, shown over the list it was opened from
 */
export default function CatchDialog(props: CatchDialogProps): JSX.Element {
  const auth = useAuth();
  const [detail, { refetch }] = createResource(() => props.catchId, loadDetail);
  const [status, setStatus] = createSignal<string | null>(null);

  /**
   * Evolutions are only offered to the owner: they depend on what
   * the signed-in player carries, and only they can act on them
   */
  const owned = (): string | null => {
    const user = auth.user();

    return user != null && user.uid === props.player ? user.uid : null;
  };

  const [evolutions, { refetch: refetchEvolutions }] = createResource(
    () => {
      const uid = owned();
      const catchId = props.catchId;

      return uid == null || catchId == null
        ? null
        : ([uid, catchId, detail()?.caught.species] as const);
    },
    async ([uid, catchId]) => listEvolutions(uid, catchId),
  );

  const evolve = (into: Species): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setStatus(null);
    evolveCatch(uid, catchId, into)
      .then(async (species) => {
        setStatus(
          species == null ? 'That evolution is no longer available.' : 'Evolution complete.',
        );
        await refetch();
        await refetchEvolutions();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const view = (): CatchDetail | null => {
    const loaded = detail();

    // A catch belongs to exactly one player; one opened under
    // someone else's list is a wrong address, not a peek
    return loaded != null && loaded.caught.owner === props.player ? loaded : null;
  };

  return (
    <Dialog
      isOpen={props.catchId != null}
      onClose={() => {
        setStatus(null);
        props.onClose();
      }}
    >
      <DialogOverlay
        style={{
          position: 'fixed',
          inset: '0',
          background: 'rgba(0, 0, 0, 0.4)',
        }}
      />
      <DialogPanel
        style={{
          position: 'fixed',
          inset: '10% 50% auto auto',
          transform: 'translateX(50%)',
          'max-height': '80vh',
          'overflow-y': 'auto',
          background: '#fff',
          padding: '1rem 2rem',
          'border-radius': '0.5rem',
          'text-align': 'left',
        }}
      >
        <Show when={!detail.loading} fallback={<p>Loading catch…</p>}>
          <Show when={view()} fallback={<p>No such catch.</p>}>
            {(loaded) => (
              <>
                <DialogTitle>
                  {loaded().caught.shiny ? '✦ ' : ''}
                  {getSpeciesData(loaded().caught.species).name}
                </DialogTitle>
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
                  <dt>Ball</dt>
                  <dd>{describeItem(BALL_ITEMS[loaded().caught.ball])}</dd>
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
                  <h3>Evolution</h3>
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
              </>
            )}
          </Show>
        </Show>
        <button
          type="button"
          onClick={() => {
            setStatus(null);
            props.onClose();
          }}
        >
          Close
        </button>
      </DialogPanel>
    </Dialog>
  );
}
