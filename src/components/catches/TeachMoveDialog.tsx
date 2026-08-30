import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import { type CaughtPokemon, getCaught } from '../../auth/caught';
import { getCatchSlots, isShiny } from '../../auth/caught-record';
import { Slots } from '../../data/constants/slots';
import { isEgg } from '../../auth/egg';
import teachMove from '../../auth/moves';
import type { Moves } from '../../data/ids/moves';
import { getMachineItem } from '../../data/ids/items';
import { Species } from '../../data/ids/species';
import { getMoveData } from '../../data/moves';
import { getSpeciesData } from '../../data/species';
import { type LearnResult, describeLearnRefusal } from '../../auth/learn-refusal';

import MovePicker, { MoveLine } from './MovePicker';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Button, Dialog, DialogActions, List, Meta, Note, Status } from '../styled';
import { SpriteAnim } from '../../data/ids/sprite-anims';

/**
 * Teaching one move to one pokemon.
 *
 * A list with room asks only whether; a full one asks which move goes.
 * Those are different decisions, so they are different dialogs behind
 * the same props, and the record decides which a player sees.
 *
 * The caller passes its own `teach` and its own word for the price, so
 * the Move Reminder shares this rather than owning a lookalike
 */
export interface TeachMoveDialogProps {
  /**
   * Who is being taught, or null when the dialog is closed
   */
  catchId: string | null;
  /**
   * The move being taught. The machine is derived from it — there is
   * exactly one per move — so a caller paying with a machine does not
   * have to know the item id as well
   */
  move: Moves | null;
  /**
   * What is being spent, named the way the dialog says it: "The
   * machine is spent teaching it." Defaults to the machine
   */
  cost?: string;
  /**
   * How the teaching is actually paid for and written. Defaults to
   * using the machine for the move out of the player's bag
   */
  teach?: (catchId: string, move: Moves, replaces: number) => Promise<LearnResult | null>;
  onClose: () => void;
  /**
   * Fired once the move is actually learned, so the sheet behind the
   * dialog can catch up
   */
  onTaught?: () => void;
}

/**
 * The one move drawn beside the picker is the same line the picker
 * draws, so it comes from there too
 */
export { MoveLine };

/**
 * The two dialogs, which is where the record is read.
 *
 * Which of them opens depends on how much room the pokemon has, so
 * the record is read before either dialog exists, above the panel
 * boundary that would otherwise hold it
 */
function TeachBody(
  props: TeachMoveDialogProps & { caught: Resource<CaughtPokemon | null> },
): JSX.Element {
  const [forgetting, setForgetting] = createSignal(0);
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const open = (): boolean => props.catchId != null && props.move != null;

  /**
   * The record, read in a memo so that it suspends. `isOpen` is read
   * from the dialog's own body, where a read registers with no
   * boundary at all: without this the roomy dialog opens first and
   * swaps itself for the other the moment the moves arrive
   */
  const record = createMemo(() => props.caught());

  const known = (): Moves[] => record()?.moves ?? [];

  /**
   * Whether the list is full. It is what decides which of the two
   * dialogs a player is shown, and it is the **record's** own room
   * rather than the game's, so a pokemon with a fifth slot is offered
   * a fifth move instead of being asked to forget one
   */
  const full = (): boolean => {
    const loaded = record();

    return loaded != null && known().length >= getCatchSlots(loaded, Slots.Move);
  };

  const taught = (): string => (props.move == null ? 'that move' : getMoveData(props.move).name);

  /**
   * What the teaching costs, as the dialog says it
   */
  const spent = (): string => props.cost ?? 'The machine';

  const named = (): string => {
    const loaded = record();

    if (loaded == null) {
      return 'This pokemon';
    }
    return isEgg(loaded) ? 'Egg' : getSpeciesData(loaded.species).name;
  };

  const close = (): void => {
    setStatus(null);
    setForgetting(0);
    setBusy(false);
    props.onClose();
  };

  const teach = (): void => {
    const catchId = props.catchId;
    const move = props.move;

    if (catchId == null || move == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    (
      props.teach?.(catchId, move, forgetting()) ??
      teachMove(catchId, getMachineItem(move), forgetting())
    )
      .then((result) => {
        setBusy(false);

        // The server says which rule refused, so the dialog says one
        // true sentence rather than listing every rule there is. A
        // null is nobody refusing anything: the person who would have
        // taught it is no longer standing there
        if (result == null) {
          setStatus(`${named()} could not be taught ${taught()} just now.`);
          return;
        }
        if ('refused' in result) {
          setStatus(describeLearnRefusal(result.refused, named(), taught()));
          return;
        }
        props.onTaught?.();
        close();
      })
      .catch((thrown: unknown) => {
        setBusy(false);
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  /**
   * What is being taught, drawn the size a dialog can hold
   */
  const portrait = (): JSX.Element => (
    <Show when={record()} fallback={<Note>Reading the record…</Note>}>
      {(loaded) => (
        <div class="flex justify-center">
          <AnimatedSprite
            species={isEgg(loaded()) ? Species.Egg : loaded().species}
            shiny={!isEgg(loaded()) && isShiny(loaded())}
            animation={SpriteAnim.Idle}
            direction="Down"
            scale={4}
            shadow
            label={named()}
          />
        </div>
      )}
    </Show>
  );

  return (
    <>
      {/* A full list: the machine costs a move, so the question is
          which one. Both dialogs are siblings — only one is ever open
          — rather than one over the other */}
      <Dialog
        isOpen={open() && full()}
        onClose={close}
        title={`Teach ${taught()}?`}
        description={`${named()} already knows ${known().length}. Choose the one it forgets — only
          a level-up move ever comes back, and only from the Move Reminder.`}
      >
        {portrait()}

        <Show when={props.move} keyed>
          {(move) => (
            <div class="rounded-lg border border-line-soft bg-parchment px-3 py-2">
              <MoveLine move={move} />
            </div>
          )}
        </Show>

        <MovePicker
          moves={known()}
          value={forgetting()}
          onPick={(at) => {
            setForgetting(at);
          }}
        />

        <Status message={status()} />

        <DialogActions>
          <Button disabled={busy()} onClick={close}>
            Cancel
          </Button>
          <Button tone="primary" disabled={busy() || record() == null} onClick={teach}>
            {busy() ? 'Teaching…' : `Forget ${getMoveData(known()[forgetting()] ?? 0).name}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Room for another: nothing is given up, so there is nothing to
          choose between — only whether to spend the machine */}
      <Dialog
        isOpen={open() && !full()}
        onClose={close}
        title={`Teach ${taught()}?`}
        description={`${named()} has room for it. ${spent()} is spent teaching it.`}
      >
        {portrait()}

        <Show when={props.move} keyed>
          {(move) => (
            <div class="rounded-lg border border-line-soft bg-parchment px-3 py-2">
              <MoveLine move={move} />
            </div>
          )}
        </Show>

        <Show when={known().length} fallback={<Note>It knows nothing yet.</Note>}>
          <Meta>It already knows:</Meta>
          <List>
            <For each={known()}>
              {(move) => (
                <li class="rounded-xl border-2 border-line bg-paper px-3 py-2 text-sm shadow-pop-sm">
                  <MoveLine move={move} />
                </li>
              )}
            </For>
          </List>
        </Show>

        <Status message={status()} />

        <DialogActions>
          <Button disabled={busy()} onClick={close}>
            Cancel
          </Button>
          <Button tone="primary" disabled={busy() || record() == null} onClick={teach}>
            {busy() ? 'Teaching…' : 'Teach it'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/**
 * Teaching a move, and choosing what it costs.
 *
 * A boundary of its own, which no other dialog needs: which of the
 * two panels opens is the record's answer, and that is decided above
 * the panel each of them carries. Nothing is drawn until the record
 * has arrived
 */
export default function TeachMoveDialog(props: TeachMoveDialogProps): JSX.Element {
  const [caught] = createResource(() => props.catchId, getCaught);

  return (
    <Suspense>
      <TeachBody {...props} caught={caught} />
    </Suspense>
  );
}
