import { type JSX, Show, createEffect, createResource, createSignal } from 'solid-js';
import { getCaught } from '../../auth/caught';
import { getMovePoints, isShiny } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { usePPItem } from '../../auth/training';
import type { Items } from '../../data/ids/items';
import type { Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { PP_UP_LIMIT, getMoveData, getMovePP } from '../../data/moves';
import { getSpeciesData } from '../../data/species';
import { PP_ITEMS } from '../../data/items/vitamins';
import { describeItem } from '../items/InventoryPicker';
import MovePicker from './MovePicker';
import SpriteDisplay from '../sprites/SpriteDisplay';
import { Button, Dialog, DialogActions, Meta, Note, Status } from '../styled';

/**
 * Spending a PP Up or a PP Max on one move.
 *
 * The item asks a question back, the way a machine does: a bottle is
 * spent on **one** move, and which one is a decision that cannot be
 * undone — no berry takes the points back off. So pressing the item in
 * the bag opens this rather than spending it, and nothing leaves the
 * bag until the move has been chosen and the button pressed.
 *
 * What the points buy is a **shorter cooldown** on that move rather
 * than more uses of it, since the fights run in real time — see
 * `getMovePP` — which is why every row says what the move comes to now
 * and what it would come to after.
 */
export interface IncreasePPDialogProps {
  /**
   * Whose move is being spent on, or null when the dialog is shut
   */
  catchId: string | null;
  /**
   * The bottle being spent: a PP Up is one point, a PP Max is the
   * whole allowance at once. Null closes the dialog with it
   */
  item: Items | null;
  onClose: () => void;
  /**
   * Fired once the points have actually landed, so the sheet behind
   * the dialog can re-read the record
   */
  onUsed?: (said: string) => void;
}

export default function IncreasePPDialog(props: IncreasePPDialogProps): JSX.Element {
  const [chosen, setChosen] = createSignal(0);
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const [caught, { refetch }] = createResource(
    () => (props.item == null ? null : props.catchId),
    getCaught,
  );

  const open = (): boolean => props.catchId != null && props.item != null;

  const known = (): Moves[] => caught()?.moves ?? [];

  /**
   * What one bottle of this is worth: a point for a PP Up, the whole
   * allowance for a PP Max
   */
  const worth = (): number => (props.item == null ? 0 : (PP_ITEMS.get(props.item) ?? 0));

  const spent = (move: Moves): number => {
    const record = caught();

    return record == null ? 0 : getMovePoints(record, move);
  };

  /**
   * What the move would come to. A PP Max takes it straight to the
   * limit rather than past it, and what it grants is however much was
   * missing
   */
  const after = (move: Moves): number => Math.min(PP_UP_LIMIT, spent(move) + worth());

  /**
   * Why a move cannot take it: it already has everything it will ever
   * take. It is shown and refused rather than left out — a player
   * looking for the move they meant wants to be told
   */
  const refused = (move: Moves | undefined): string | null => {
    if (move == null) {
      return 'Nothing chosen';
    }
    return spent(move) >= PP_UP_LIMIT ? 'Full' : null;
  };

  const named = (): string => {
    const record = caught();

    if (record == null) {
      return 'This pokemon';
    }
    return isEgg(record) ? 'Egg' : getSpeciesData(record.species).name;
  };

  const bottle = (): string => (props.item == null ? 'It' : describeItem(props.item));

  /**
   * Whether there is anything here to spend it on. A pokemon whose
   * every move is full is told so rather than shown a list it cannot
   * choose from
   */
  const anywhere = (): boolean => known().some((move) => refused(move) == null);

  const close = (): void => {
    setStatus(null);
    setChosen(0);
    setBusy(false);
    props.onClose();
  };

  /**
   * The move the picker is on. `at` rather than an index, since the
   * list is re-read whenever the record is and a chosen slot can go
   * out from under it
   */
  const picked = (): Moves | undefined => known().at(chosen());

  // Open on a move that can actually take the points. The first slot
  // is the obvious place to start and the wrong one for a pokemon
  // whose first move is already full: a dialog that opens with its own
  // button refused reads as broken
  createEffect(() => {
    if (known().length > 0 && refused(picked()) != null) {
      const first = known().findIndex((move) => refused(move) == null);

      if (first >= 0) {
        setChosen(first);
      }
    }
  });

  const use = (): void => {
    const catchId = props.catchId;
    const item = props.item;
    const move = picked();

    if (catchId == null || item == null || move == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    usePPItem(catchId, move, item)
      .then((result) => {
        setBusy(false);

        if (result == null) {
          setStatus(
            `${bottle()} could not be used — the move may already carry everything it will take, or you may no longer have one.`,
          );
          // What the record says may be what refused it, so it is read
          // again rather than left as it was
          Promise.resolve(refetch()).catch(() => undefined);
          return;
        }
        props.onUsed?.(
          `${getMoveData(move).name} carries ${result.points} of ${PP_UP_LIMIT} — ${result.pp} PP.`,
        );
        close();
      })
      .catch((thrown: unknown) => {
        setBusy(false);
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  return (
    <Dialog
      isOpen={open()}
      onClose={close}
      title="Increase PP"
      description={`${bottle()} is spent on one move, and nothing takes the points back. Choose the
        move it goes on.`}
    >
      <Show when={caught()} fallback={<Note>Reading the record…</Note>}>
        {(record) => (
          <div class="flex justify-center">
            <SpriteDisplay
              species={isEgg(record()) ? Species.Egg : record().species}
              shiny={!isEgg(record()) && isShiny(record())}
              animation="Idle"
              direction="Down"
              scale={4}
              label={named()}
            />
          </div>
        )}
      </Show>

      <Show when={known().length} fallback={<Note>It knows nothing to spend it on.</Note>}>
        <Show when={anywhere()} fallback={<Note>Every move it knows is already full.</Note>}>
          <MovePicker
            moves={known()}
            value={chosen()}
            onPick={(at) => {
              setChosen(at);
            }}
            refused={refused}
            // What the move is worth today and what the bottle would
            // make of it: the number a player is actually buying
            aside={(move) => (
              <Meta class="whitespace-nowrap">
                {getMovePP(move, spent(move))} → {getMovePP(move, after(move))} PP
              </Meta>
            )}
          />
        </Show>
      </Show>

      <Status message={status()} />

      <DialogActions>
        <Button disabled={busy()} onClick={close}>
          Cancel
        </Button>
        <Button tone="primary" disabled={busy() || refused(picked()) != null} onClick={use}>
          {busy() ? 'Using…' : `Use ${bottle()}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
