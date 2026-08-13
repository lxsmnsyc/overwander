import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { RadioGroup, RadioGroupOption } from 'terracotta';
import { getCaught } from '../auth/caught';
import { getCatchSlots, isShiny } from '../auth/caught-record';
import { Slots } from '../data/constants/slots';
import { isEgg } from '../auth/egg';
import teachMove from '../auth/moves';
import { MOVE_CATEGORY_COLORS, MOVE_CATEGORY_NAMES, type Moves } from '../data/ids/moves';
import { getMachineItem } from '../data/ids/items';
import { Species } from '../data/ids/species';
import { getMoveData } from '../data/moves';
import { getSpeciesData } from '../data/species';

import SpriteDisplay from './SpriteDisplay';
import TypeBadge from './TypeBadge';
import { Button, Dialog, DialogActions, List, Meta, Note, Status } from './styled';

/**
 * Teaching one move to one pokemon.
 *
 * A machine is the only thing that changes what a pokemon knows, and
 * what it costs depends entirely on how full the move list is: a
 * pokemon with room simply learns a fourth move, while one that
 * already knows four has to **forget** one to make space. Those are
 * different decisions, so they are different dialogs — the first asks
 * only whether, the second asks which.
 *
 * Both are opened by the same props, since which one a player sees is
 * the record's answer rather than the caller's.
 *
 * What is being spent is the caller's, though. A machine is the
 * default because it is the common case, but the Move Reminder puts
 * back a forgotten move for a Heart Scale and asks exactly the same
 * question about exactly the same list — so it passes its own `teach`
 * and its own word for what it costs rather than having a second
 * dialog that looks like this one
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
  teach?: (catchId: string, move: Moves, replaces: number) => Promise<Moves[] | null>;
  onClose: () => void;
  /**
   * Fired once the move is actually learned, so the sheet behind the
   * dialog can catch up
   */
  onTaught?: () => void;
}

/**
 * One move as the sheet draws it: what it is, what kind it is, and
 * what it is worth
 */
export function MoveLine(props: { move: Moves }): JSX.Element {
  return (
    <span class="flex flex-wrap items-center gap-2">
      <TypeBadge type={getMoveData(props.move).type} />
      <span
        class="size-3 shrink-0 rounded-sm"
        style={{ 'background-color': MOVE_CATEGORY_COLORS[getMoveData(props.move).category] }}
        title={MOVE_CATEGORY_NAMES[getMoveData(props.move).category]}
        aria-label={MOVE_CATEGORY_NAMES[getMoveData(props.move).category]}
        role="img"
      />
      <span class="font-medium">{getMoveData(props.move).name}</span>
      <Meta>
        {getMoveData(props.move).power == null ? '' : `${getMoveData(props.move).power} power · `}
        {getMoveData(props.move).pp} PP
      </Meta>
    </span>
  );
}

const OPTION =
  'flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm shadow-pop-sm' +
  ' transition-colors border-line bg-paper hover:border-tide aria-checked:border-leaf' +
  ' aria-checked:bg-leaf-soft focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-tide';

export default function TeachMoveDialog(props: TeachMoveDialogProps): JSX.Element {
  const [forgetting, setForgetting] = createSignal(0);
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const [caught] = createResource(() => props.catchId, getCaught);

  const open = (): boolean => props.catchId != null && props.move != null;

  const known = (): Moves[] => caught()?.moves ?? [];

  /**
   * Whether the list is full. It is what decides which of the two
   * dialogs a player is shown, and it is the **record's** own room
   * rather than the game's, so a pokemon with a fifth slot is offered
   * a fifth move instead of being asked to forget one
   */
  const full = (): boolean => {
    const record = caught();

    return record != null && known().length >= getCatchSlots(record, Slots.Move);
  };

  const taught = (): string => (props.move == null ? 'that move' : getMoveData(props.move).name);

  /**
   * What the teaching costs, as the dialog says it
   */
  const spent = (): string => props.cost ?? 'The machine';

  const named = (): string => {
    const record = caught();

    if (record == null) {
      return 'This pokemon';
    }
    return isEgg(record) ? 'Egg' : getSpeciesData(record.species).name;
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
      .then((moves) => {
        setBusy(false);

        if (moves == null) {
          setStatus(
            `${named()} could not be taught ${taught()} — it may know it already, be unable to learn it, be locked, or what it costs may not be in your bag.`,
          );
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

        {/* The type argument is written out because the options are
            indexes: without it the group's value is inferred from the
            DOM handler rather than from what is being picked */}
        <RadioGroup<number>
          toggleable={false}
          value={forgetting()}
          onChange={(picked) => {
            if (picked !== undefined) {
              setForgetting(picked);
            }
          }}
          class="flex flex-col gap-2"
        >
          <For each={known()}>
            {(move, at) => (
              <RadioGroupOption value={at()} class={OPTION}>
                <MoveLine move={move} />
              </RadioGroupOption>
            )}
          </For>
        </RadioGroup>

        <Status message={status()} />

        <DialogActions>
          <Button disabled={busy()} onClick={close}>
            Cancel
          </Button>
          <Button tone="primary" disabled={busy() || caught() == null} onClick={teach}>
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
          <Button tone="primary" disabled={busy() || caught() == null} onClick={teach}>
            {busy() ? 'Teaching…' : 'Teach it'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
