import { type JSX, Show, createResource, createSignal } from 'solid-js';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from 'terracotta';
import { isLockLive } from '../auth/battle-lock';
import { type CaughtPokemon, listCaught } from '../auth/caught';
import { syncServerClock } from '../auth/clock';
import { isShadow } from '../auth/caught-record';
import { boostedSteps, isEgg, stepsRemaining } from '../auth/egg';
import { boostEgg, breed, visitNurse } from '../auth/npcs';
import Npc, { BREEDING_FEE, DAYCARE_FEE, NPC_NAMES, NURSE_CARE_LIMIT } from '../data/overworld/npc';
import { type BreedingParent, canBreed } from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import CatchPicker, { type CatchOption } from './CatchPicker';

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
 * and a fee; a daycare lady wants an egg and a fee; Nurse Joy wants
 * nothing at all, and gives a party back whole once a window. Any of
 * them can be walked away from
 */
export default function NpcDialog(props: NpcDialogProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  const [chosen, setChosen] = createSignal<string[]>([]);
  const [busy, setBusy] = createSignal(false);

  // Both lists are drawn from this one read: the pair the breeder
  // wants and the egg the daycare lady wants are the same records,
  // asked two different questions
  const [catches, { refetch }] = createResource(
    () => (props.standing == null ? null : props.player),
    async (player): Promise<CatchOption[]> => {
      const [owned, now] = await Promise.all([listCaught(player), syncServerClock()]);

      return owned.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, now) }));
    },
  );

  const pair = (): [CatchOption, CatchOption] | null => {
    const picked = chosen();

    if (picked.length !== 2) {
      return null;
    }

    const found = picked.map((id) => (catches() ?? []).find((entry) => entry.id === id));

    return found[0] == null || found[1] == null ? null : [found[0], found[1]];
  };

  const compatible = (): boolean => {
    const chosenPair = pair();

    return (
      chosenPair != null && canBreed(asParent(chosenPair[0].caught), asParent(chosenPair[1].caught))
    );
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

  const tendParty = (picked: string[]): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null || picked.length === 0) {
      return;
    }
    setStatus(null);
    setBusy(true);
    visitNurse(snapshot, standing[0], picked)
      .then(async (tended) => {
        setBusy(false);
        setStatus(
          tended == null
            ? 'She looked them over and handed them straight back — there was nothing to do, or she has already seen you this while.'
            : `She looked after ${tended.length} of them. Right as rain.`,
        );
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
                {/* The pair is picked with the same list every other
                    part of the game picks a pokemon with; what makes
                    it a breeding pair is the two, and the rule about
                    what can be one */}
                <CatchPicker
                  inline
                  multiple
                  max={2}
                  options={catches()}
                  value={chosen()}
                  verb="Leave"
                  empty="You have nothing to leave."
                  filter={(option) => !isEgg(option.caught) && !option.fighting}
                  note={(option) => (isShadow(option.caught) ? 'shadow' : null)}
                  onPick={(picked) => {
                    setStatus(null);
                    setChosen(picked);
                  }}
                />
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

              <Show when={standing()[1] === Npc.NurseJoy}>
                <p>
                  "Leave them with me — all of them, if you like. No charge. And if one of them is
                  carrying a shadow, I will see to that too."
                </p>
                {/* She is free, so what keeps her from being a tap is
                    the window: one visit per player while she is
                    standing here */}
                <CatchPicker
                  inline
                  multiple
                  max={NURSE_CARE_LIMIT}
                  options={catches()}
                  value={[]}
                  verb="Hand over"
                  empty="You have nothing for her to look at."
                  filter={(option) => !isEgg(option.caught) && !option.fighting}
                  note={(option) =>
                    isShadow(option.caught) ? 'shadow — she would purify it' : null
                  }
                  onPick={tendParty}
                />
              </Show>

              <Show when={standing()[1] === Npc.DaycareLady}>
                <p>
                  "Bring me an egg — {DAYCARE_FEE} gold — and I will warm it half a walk's worth.
                  Wherever it is now, it will be that much further along."
                </p>
                {/* The note on each row is what the fee actually buys
                    that egg: half of a long walk is further than half
                    of a short one */}
                <CatchPicker
                  inline
                  options={catches()}
                  value={null}
                  verb="Warm"
                  empty="You have no egg for her."
                  filter={(option) =>
                    isEgg(option.caught) && !option.fighting && stepsRemaining(option.caught) > 0
                  }
                  note={(option) => `${option.caught.steps} → ${boostedSteps(option.caught)}`}
                  onPick={(id) => {
                    if (id != null) {
                      pushEgg(id);
                    }
                  }}
                />
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
