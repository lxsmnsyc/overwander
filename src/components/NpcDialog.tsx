import { type JSX, type ParentProps, Show, createResource, createSignal } from 'solid-js';
import { isLockLive } from '../auth/battle-lock';
import { type CaughtPokemon, isGuarded, listCaught } from '../auth/caught';
import { syncServerClock } from '../auth/clock';
import { isShadow } from '../auth/caught-record';
import { boostedSteps, isEgg, stepsRemaining } from '../auth/egg';
import { describeFriendship, groomedFriendship } from '../data/constants/friendship';
import { boostEgg, breed, groomCatch, visitNurse } from '../auth/npcs';
import Npc, {
  BREEDING_FEE,
  DAYCARE_FEE,
  GROOMING_FEE,
  NPC_NAMES,
  NURSE_CARE_LIMIT,
} from '../data/overworld/npc';
import { type BreedingParent, canBreed } from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import CatchPicker, { type CatchOption } from './CatchPicker';
import { Button, Dialog, DialogActions, DialogSection, Row, Status } from './styled';

/**
 * What the person standing there actually says. It is set apart from
 * the game's own words, because it is somebody talking rather than the
 * game explaining
 */
function Says(props: ParentProps): JSX.Element {
  return <p class="border-l-2 border-leaf/40 pl-3 text-sm text-muted italic">{props.children}</p>;
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

  /**
   * Who is standing there. The dialog is named after them, and it is
   * named whether or not somebody has been walked up to yet
   */
  const who = (): string => {
    const npc = props.standing?.[1];

    return npc == null ? 'Somebody' : NPC_NAMES[npc];
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
          setStatus(
            'The breeder handed them back — that pair, that price, or you have already left a pair with him this while.',
          );
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
            ? 'She would not take it — it may be ready already, or she has already warmed one for you this while.'
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

  const groom = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    groomCatch(snapshot, standing[0], id)
      .then(async (friendship) => {
        setBusy(false);
        setStatus(
          friendship == null
            ? 'He would not take it — it may think as well of you as it can already, or he has already seen you this while.'
            : `Brushed, fussed over and handed back ${describeFriendship(friendship)}. (−${GROOMING_FEE} gold)`,
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
    <Dialog
      isOpen={props.standing != null}
      onClose={close}
      title={who()}
      description="Somebody standing out here with an offer. They will be gone when the window
        turns over, and each of them takes you up on it once while they are here."
    >
      <Show when={props.standing}>
        {(standing) => (
          <>
            <Show when={standing()[1] === Npc.Breeder}>
              <DialogSection>
                <Says>
                  "Leave two of yours with me — {BREEDING_FEE} gold — and you will have an egg of
                  them. It takes after both."
                </Says>
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
                <Status
                  message={
                    chosen().length === 2 && !compatible()
                      ? 'Those two will have nothing to do with each other.'
                      : null
                  }
                />
                <Row>
                  <Button tone="primary" disabled={busy() || !compatible()} onClick={submitPair}>
                    Leave them ({BREEDING_FEE} gold)
                  </Button>
                </Row>
              </DialogSection>
            </Show>

            <Show when={standing()[1] === Npc.NurseJoy}>
              <DialogSection>
                <Says>
                  "Leave them with me — all of them, if you like. No charge. And if one of them is
                  carrying a shadow, I will see to that too."
                </Says>
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
                  reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
                  note={(option) =>
                    isShadow(option.caught) ? 'shadow — she would purify it' : null
                  }
                  onPick={tendParty}
                />
              </DialogSection>
            </Show>

            <Show when={standing()[1] === Npc.DaycareLady}>
              <DialogSection>
                <Says>
                  "Bring me an egg — {DAYCARE_FEE} gold — and I will warm it half a walk's worth.
                  Wherever it is now, it will be that much further along."
                </Says>
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
              </DialogSection>
            </Show>

            <Show when={standing()[1] === Npc.Groomer}>
              <DialogSection>
                <Says>
                  "Leave one with me — {GROOMING_FEE} gold — and I will see to it properly. It will
                  think half again as much of you when I hand it back."
                </Says>
                {/* The note is what the fee actually buys this
                    pokemon: half of what it has left to give, which is
                    a great deal to one just out of its ball and next
                    to nothing to one that already adores its owner */}
                <CatchPicker
                  inline
                  options={catches()}
                  value={null}
                  verb="Groom"
                  empty="You have nothing for him to see to."
                  filter={(option) =>
                    !isEgg(option.caught) &&
                    !option.fighting &&
                    groomedFriendship(option.caught.friendship) > option.caught.friendship
                  }
                  note={(option) =>
                    `${option.caught.friendship} → ${groomedFriendship(option.caught.friendship)}`
                  }
                  onPick={(id) => {
                    if (id != null) {
                      groom(id);
                    }
                  }}
                />
              </DialogSection>
            </Show>

            <Status message={status()} />
          </>
        )}
      </Show>
      <DialogActions>
        <Button onClick={close}>Walk on</Button>
      </DialogActions>
    </Dialog>
  );
}
