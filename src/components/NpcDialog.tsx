import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from 'terracotta';
import { isLockLive } from '../auth/battle-lock';
import { type CaughtPokemon, listCaught } from '../auth/caught';
import { syncServerClock } from '../auth/clock';
import { isShadow } from '../auth/caught-record';
import { boostedSteps, isEgg, stepsRemaining } from '../auth/egg';
import { boostEgg, breed } from '../auth/npcs';
import Npc, { BREEDING_FEE, DAYCARE_FEE, NPC_NAMES } from '../data/overworld/npc';
import { getSpeciesData } from '../data/species';
import { type BreedingParent, canBreed } from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';

/**
 * One of the player's catches, with what the NPC needs to know about
 * it: whether it is busy fighting, and how it reads as a parent
 */
interface Candidate {
  id: string;
  caught: CaughtPokemon;
  fighting: boolean;
}

/**
 * A catch as the breeding rules read one
 */
function asParent(caught: CaughtPokemon): BreedingParent {
  return {
    species: caught.species,
    gender: caught.gender,
    ivs: caught.ivs,
    moves: caught.moves,
    shadow: isShadow(caught),
    egg: isEgg(caught),
  };
}

function describe(caught: CaughtPokemon): string {
  return isEgg(caught)
    ? `Egg · ${caught.steps} / ${caught.hatchSteps} steps`
    : `${getSpeciesData(caught.species).name} · Lv. ${caught.level}`;
}

export interface NpcDialogProps {
  player: string;
  /**
   * The chunk the player is standing in, and the cell they walked
   * up to — the server re-derives who is standing there from both
   */
  snapshot: ChunkSnapshot | null;
  /**
   * Who is standing there, or null when the dialog is closed
   */
  standing: [cell: number, npc: Npc] | null;
  onClose: () => void;
  /**
   * Fired when something landed — an egg was made, an egg moved on —
   * so the list behind the dialog can catch up
   */
  onChange?: () => void;
}

/**
 * The person a player has walked up to. A breeder wants two pokemon
 * and a fee; a daycare lady wants an egg and a fee. Either can be
 * walked away from
 */
export default function NpcDialog(props: NpcDialogProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  const [chosen, setChosen] = createSignal<string[]>([]);
  const [busy, setBusy] = createSignal(false);

  const [catches, { refetch }] = createResource(
    () => (props.standing == null ? null : props.player),
    async (player): Promise<Candidate[]> => {
      const [owned, now] = await Promise.all([listCaught(player), syncServerClock()]);

      return owned.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, now) }));
    },
  );

  const parents = (): Candidate[] =>
    (catches() ?? []).filter((entry) => !isEgg(entry.caught) && !entry.fighting);

  /**
   * The eggs she will take: any that still has walking left in it
   */
  const eggs = (): Candidate[] =>
    (catches() ?? []).filter(
      (entry) => isEgg(entry.caught) && !entry.fighting && stepsRemaining(entry.caught) > 0,
    );

  const pair = (): [Candidate, Candidate] | null => {
    const picked = chosen();

    if (picked.length !== 2) {
      return null;
    }

    const found = picked.map((id) => parents().find((entry) => entry.id === id));

    return found[0] == null || found[1] == null ? null : [found[0], found[1]];
  };

  const compatible = (): boolean => {
    const chosenPair = pair();

    return (
      chosenPair != null && canBreed(asParent(chosenPair[0].caught), asParent(chosenPair[1].caught))
    );
  };

  const toggle = (id: string): void => {
    const picked = chosen();

    setStatus(null);
    if (picked.includes(id)) {
      setChosen(picked.filter((entry) => entry !== id));
    } else if (picked.length < 2) {
      setChosen([...picked, id]);
    }
  };

  const close = (): void => {
    setStatus(null);
    setChosen([]);
    props.onClose();
  };

  const submitPair = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const chosenPair = pair();

    if (snapshot == null || standing == null || chosenPair == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    breed(snapshot, standing[0], [chosenPair[0].id, chosenPair[1].id])
      .then(async (egg) => {
        setBusy(false);

        if (egg == null) {
          setStatus('The breeder handed them back — that pair, or that price, was no good.');
          return;
        }
        setChosen([]);
        setStatus(`An egg. It is yours — carry it as your buddy and walk. (−${BREEDING_FEE} gold)`);
        await refetch();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const pushEgg = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    boostEgg(snapshot, standing[0], id)
      .then(async (steps) => {
        setBusy(false);
        setStatus(
          steps == null
            ? 'She would not take it.'
            : `She warmed it along to ${steps} steps. (−${DAYCARE_FEE} gold)`,
        );
        await refetch();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <Dialog isOpen={props.standing != null} onClose={close}>
      <DialogOverlay style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.4)' }} />
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
        <Show when={props.standing}>
          {(standing) => (
            <>
              <DialogTitle>{NPC_NAMES[standing()[1]]}</DialogTitle>

              <Show when={standing()[1] === Npc.Breeder}>
                <p>
                  "Leave two of yours with me — {BREEDING_FEE} gold — and you will have an egg of
                  them. It takes after both."
                </p>
                <Show when={!catches.loading} fallback={<p>Looking them over…</p>}>
                  <Show when={parents().length} fallback={<p>You have nothing to leave.</p>}>
                    <ul>
                      <For each={parents()}>
                        {(entry) => (
                          <li>
                            <button
                              type="button"
                              aria-pressed={chosen().includes(entry.id)}
                              disabled={busy()}
                              onClick={() => {
                                toggle(entry.id);
                              }}
                            >
                              {chosen().includes(entry.id) ? '✓ ' : ''}
                              {describe(entry.caught)}
                              {isShadow(entry.caught) ? ' · shadow' : ''}
                            </button>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </Show>
                {/* The pairing is checked here only so the button can
                    say so first; the refusal itself is the server's */}
                <Show when={chosen().length === 2 && !compatible()}>
                  <p role="status">Those two will have nothing to do with each other.</p>
                </Show>
                <p>
                  <button type="button" disabled={busy() || !compatible()} onClick={submitPair}>
                    Leave them ({BREEDING_FEE} gold)
                  </button>
                </p>
              </Show>

              <Show when={standing()[1] === Npc.DaycareLady}>
                <p>
                  "Bring me an egg — {DAYCARE_FEE} gold — and I will warm it half a walk's worth.
                  Wherever it is now, it will be that much further along."
                </p>
                <Show when={!catches.loading} fallback={<p>Looking them over…</p>}>
                  <Show when={eggs().length} fallback={<p>You have no egg for her.</p>}>
                    <ul>
                      <For each={eggs()}>
                        {(entry) => (
                          <li>
                            <button
                              type="button"
                              disabled={busy()}
                              onClick={() => {
                                pushEgg(entry.id);
                              }}
                            >
                              Warm {describe(entry.caught)} ({DAYCARE_FEE} gold)
                            </button>{' '}
                            {/* What the fee actually buys this egg,
                                since half of a long walk is further
                                than half of a short one */}
                            — {entry.caught.steps} → {boostedSteps(entry.caught)}
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </Show>
              </Show>

              <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
            </>
          )}
        </Show>
        <button type="button" onClick={close}>
          Walk on
        </button>
      </DialogPanel>
    </Dialog>
  );
}
