import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from 'terracotta';
import { isLockLive } from '../auth/battle-lock';
import { getBuddy, setBuddy } from '../auth/buddy';
import { syncServerClock } from '../auth/clock';
import { canHatch, stepsRemaining } from '../auth/egg';
import { hatchEgg } from '../auth/eggs';
import {
  type CaughtPokemon,
  HELD_ITEM_LIMIT,
  getCaught,
  giveItem,
  releaseCatch,
  takeItem,
} from '../auth/caught';
import { getInventory } from '../auth/inventory';
import { getCandyCost, getCandyCount, useCandy } from '../auth/candy';
import { useAuth } from '../auth/context';
import { evolveCatch, listEvolutions } from '../auth/evolution';
import { getAbilityData } from '../data/abilities';
import { MAX_LEVEL } from '../data/constants/levels';
import { Stats } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import { BALL_ITEMS, ItemFlags, type Items } from '../data/ids/items';
import { Genders, type Species } from '../data/ids/species';
import { getItemData } from '../data/items';
import { getMoveData } from '../data/moves';
import { getConsumedItem, getSpeciesData } from '../data/species';
import { ENCOUNTER_TYPE_NAMES, deriveSize } from '../overworld/encounter';

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

/**
 * A catch is one document — abilities, held items and ownership
 * history included — so the dialog opens on a single read
 */
async function loadDetail(catchId: string): Promise<CaughtPokemon | null> {
  return getCaught(catchId);
}

/**
 * An ability with no registered data shows as its id rather than a
 * guess; every Gen 1 ability is registered
 */
function describeAbility(ability: Abilities): string {
  try {
    return getAbilityData(ability).name;
  } catch {
    return `Ability #${ability}`;
  }
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

/**
 * This individual's own measurements, the way a dex prints them:
 * meters to the centimeter, kilograms to one decimal. Size is derived
 * from the trait value against the species as it stands, so evolving
 * grows the pokemon while keeping its proportions
 */
function describeSize(caught: CaughtPokemon): string {
  const { height, weight } = deriveSize(caught.species, caught.traitValue);
  const listed = getSpeciesData(caught.species);
  // Where it falls against the species' listed height, so a giant is
  // recognizable without a chart
  const share = Math.round((height / listed.height) * 100);

  return `${height.toFixed(2)} m · ${weight.toFixed(1)} kg (${share}% of average)`;
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

      return uid == null || catchId == null ? null : ([uid, catchId, detail()?.species] as const);
    },
    async ([uid, catchId]) => listEvolutions(uid, catchId),
  );

  /**
   * Whether this pokemon is fighting right now. A battle runs on a
   * frozen snapshot of the party, so the record it was copied from
   * holds still until the fight ends — the server refuses the writes
   * either way; this is only so the buttons say so first
   */
  const [fighting] = createResource(
    () => detail() ?? null,
    async (caught) => isLockLive(caught, await syncServerClock()),
  );

  /**
   * The candies behind this catch: the stack is keyed by family, so
   * every stage of the line spends the same pile
   */
  const [candies, { refetch: refetchCandies }] = createResource(
    () => {
      const species = detail()?.species;

      return species == null ? null : ([props.player, getSpeciesData(species).family] as const);
    },
    async ([player, family]) => getCandyCount(player, family),
  );

  const feedCandy = (): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setStatus(null);
    useCandy(catchId)
      .then(async (level) => {
        setStatus(level == null ? 'That candy could not be used.' : `Grew to level ${level}.`);
        await refetch();
        await refetchCandies();
        await refetchEvolutions();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * The holdable items in the player's bag; a catch can only be
   * handed something it is allowed to hold
   */
  const [bag, { refetch: refetchBag }] = createResource(
    () => owned(),
    async (uid) => {
      const carried = await getInventory(uid);

      return carried.filter((entry) => {
        try {
          return (getItemData(entry.item).flags & ItemFlags.Holdable) !== 0;
        } catch {
          // An unregistered item has no flags to read, so it is not
          // offered rather than assumed holdable
          return false;
        }
      });
    },
  );

  const moveItem = (item: Items, give: boolean): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setStatus(null);
    (give ? giveItem(catchId, item) : takeItem(catchId, item))
      .then(async (moved) => {
        setStatus(
          moved
            ? `${describeItem(item)} ${give ? 'handed over' : 'taken back'}.`
            : `${describeItem(item)} could not be ${give ? 'handed over' : 'taken back'}.`,
        );
        await refetch();
        await refetchBag();
        await refetchEvolutions();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Which catch is currently walking with the player, so the button
   * can say whether this is the one
   */
  const [buddy, { refetch: refetchBuddy }] = createResource(
    () => owned(),
    async (uid) => (await getBuddy(uid))?.caught ?? null,
  );

  const takeAlong = (): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setStatus(null);
    setBuddy(uid, catchId)
      .then(async (set) => {
        setStatus(set ? 'Walking with you now.' : 'That one cannot come along.');
        await refetchBuddy();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const hatch = (): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    setStatus(null);
    hatchEgg(catchId)
      .then(async (species) => {
        setStatus(
          species == null
            ? 'It is not ready yet.'
            : `It hatched into ${getSpeciesData(species).name}!`,
        );
        await refetch();
        await refetchCandies();
        await refetchEvolutions();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const evolve = (into: Species): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setStatus(null);
    evolveCatch(catchId, into)
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

  /**
   * Whether the release button has been pressed once. Letting a
   * pokemon go cannot be undone, so it takes two presses and the
   * second one says what it is doing
   */
  const [releasing, setReleasing] = createSignal(false);

  const release = (): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    if (!releasing()) {
      setReleasing(true);
      return;
    }
    setStatus(null);
    releaseCatch(catchId)
      .then((released) => {
        setReleasing(false);

        if (!released) {
          setStatus('It could not be released.');
          return;
        }
        // The record is gone, so there is nothing left for this
        // dialog to show
        props.onChange?.();
        props.onClose();
      })
      .catch((caught: unknown) => {
        setReleasing(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const view = (): CaughtPokemon | null => {
    const loaded = detail();

    // A catch belongs to exactly one player; one opened under
    // someone else's list is a wrong address, not a peek
    return loaded != null && loaded.owner === props.player ? loaded : null;
  };

  return (
    <Dialog
      isOpen={props.catchId != null}
      onClose={() => {
        setStatus(null);
        // A release half-confirmed is a release declined
        setReleasing(false);
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
                  {/* An egg gives away nothing about what is inside
                      it — not the species, not even whether it
                      sparkles */}
                  {loaded().egg
                    ? 'Egg'
                    : `${loaded().shiny ? '✦ ' : ''}${getSpeciesData(loaded().species).name}`}
                </DialogTitle>
                <dl>
                  <dt>Level</dt>
                  <dd>{loaded().level}</dd>
                  {/* Everything below this point is read off the
                      species, so an egg has none of it to show */}
                  <Show when={!loaded().egg}>
                    <dt>Gender</dt>
                    <dd>{GENDER_LABELS[loaded().gender]}</dd>
                    <dt>Size</dt>
                    <dd>{describeSize(loaded())}</dd>
                    <dt>Nature</dt>
                    <dd>#{loaded().nature}</dd>
                    <dt>Abilities</dt>
                    <dd>{loaded().abilities.map(describeAbility).join(', ') || 'None'}</dd>
                  </Show>
                  <dt>Ball</dt>
                  <dd>{describeItem(BALL_ITEMS[loaded().ball])}</dd>
                  <Show when={!loaded().egg}>
                    <dt>Held items</dt>
                    <dd>{loaded().items.map(describeItem).join(', ') || 'None'}</dd>
                    <dt>Moves</dt>
                    <dd>
                      {loaded()
                        .moves.map((move) => getMoveData(move).name)
                        .join(', ') || 'None'}
                    </dd>
                  </Show>
                  <dt>Individual values</dt>
                  <dd>
                    {STAT_ORDER.map((stat) => `${STAT_LABELS[stat]} ${loaded().ivs[stat]}`).join(
                      ' · ',
                    )}
                  </dd>
                  <dt>{loaded().egg ? 'Found' : 'Caught'}</dt>
                  {/* The stamp is already in the catcher's own zone,
                      so the date it opens with is the day they had */}
                  <dd>{loaded().caughtAt.slice(0, 10)}</dd>
                  {/* Where it came from, not just where it was
                      standing: a grunt's drop is not a raid prize */}
                  <Show when={!loaded().egg}>
                    <dt>Met</dt>
                    <dd>{ENCOUNTER_TYPE_NAMES[loaded().type]}</dd>
                  </Show>
                  <dt>Origin</dt>
                  <dd>
                    Chunk {loaded().origin.x}, {loaded().origin.y}
                  </dd>
                </dl>

                <Show when={owned()}>
                  {/* Everything below changes the record, and a
                      pokemon in a live battle is fighting as the
                      snapshot froze it */}
                  <Show when={fighting()}>
                    <p role="status">
                      In a raid right now — nothing about it can be changed until the battle ends.
                    </p>
                  </Show>

                  <h3>Buddy</h3>
                  {/* Only what walks beside the player counts steps,
                      so an egg has to be the buddy to get anywhere */}
                  <p>
                    <Show
                      when={buddy() !== props.catchId}
                      fallback={<span>Walking with you.</span>}
                    >
                      <button type="button" onClick={takeAlong}>
                        {loaded().egg ? 'Carry this egg' : 'Walk with this one'}
                      </button>
                    </Show>
                  </p>

                  <Show when={loaded().egg}>
                    <h3>Egg</h3>
                    <p>
                      {loaded().steps} / {loaded().hatchSteps} steps
                      {buddy() === props.catchId
                        ? '.'
                        : ' — it only moves while it is the one being carried.'}
                    </p>
                    <p>
                      <button type="button" disabled={!canHatch(loaded())} onClick={hatch}>
                        {canHatch(loaded()) ? 'Hatch' : `${stepsRemaining(loaded())} steps to go`}
                      </button>
                    </p>
                  </Show>

                  <Show when={!loaded().egg}>
                    <h3>Held items</h3>
                    <Show when={loaded().items.length} fallback={<p>Holding nothing.</p>}>
                      <ul>
                        <For each={loaded().items}>
                          {(item) => (
                            <li>
                              {describeItem(item)}{' '}
                              <button
                                type="button"
                                disabled={fighting()}
                                onClick={() => {
                                  moveItem(item, false);
                                }}
                              >
                                Take back
                              </button>
                            </li>
                          )}
                        </For>
                      </ul>
                    </Show>
                    {/* A catch holds one item at a time, matching the
                      battle's per-unit limit */}
                    <Show when={loaded().items.length < HELD_ITEM_LIMIT}>
                      <Show when={bag()?.length} fallback={<p>Nothing holdable in the bag.</p>}>
                        <ul>
                          <For each={bag()}>
                            {(entry) => (
                              <li>
                                <button
                                  type="button"
                                  disabled={fighting()}
                                  onClick={() => {
                                    moveItem(entry.item, true);
                                  }}
                                >
                                  Give {describeItem(entry.item)} × {entry.amount}
                                </button>
                              </li>
                            )}
                          </For>
                        </ul>
                      </Show>
                    </Show>

                    <h3>Candies</h3>
                    {/* The stack is keyed by family, so every stage of
                      the line draws on the same pile */}
                    <p>
                      {candies() ?? 0} {(candies() ?? 0) === 1 ? 'candy' : 'candies'} for the{' '}
                      {getSpeciesData(loaded().species).name} family
                    </p>
                    <p>
                      <button
                        type="button"
                        disabled={
                          (candies() ?? 0) < getCandyCost(loaded()) ||
                          loaded().level >= MAX_LEVEL ||
                          fighting() === true
                        }
                        onClick={feedCandy}
                      >
                        {loaded().level >= MAX_LEVEL
                          ? 'Already at the level cap'
                          : `Level up for ${getCandyCost(loaded())} ${
                              getCandyCost(loaded()) === 1 ? 'candy' : 'candies'
                            }`}
                      </button>
                      {/* A shadow keeps the Shadow ability, and pays
                        for it at every level */}
                      <Show when={loaded().shadow}>
                        {' '}
                        <span>A shadow costs twice as much to raise.</span>
                      </Show>
                    </p>

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
                                  disabled={fighting()}
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
                  </Show>
                  <h3>Release</h3>
                  {/* There is no undoing it, so it takes two presses
                      — and whatever it is holding comes back to the
                      bag rather than going with it */}
                  <p>
                    <button type="button" disabled={fighting()} onClick={release}>
                      {releasing()
                        ? `Release ${loaded().egg ? 'this egg' : getSpeciesData(loaded().species).name} for good?`
                        : 'Release'}
                    </button>
                    <Show when={releasing()}>
                      {' '}
                      <button
                        type="button"
                        onClick={() => {
                          setReleasing(false);
                        }}
                      >
                        Keep
                      </button>
                    </Show>
                  </p>

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
            setReleasing(false);
            props.onClose();
          }}
        >
          Close
        </button>
      </DialogPanel>
    </Dialog>
  );
}
