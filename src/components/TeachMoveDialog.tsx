import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { RadioGroup, RadioGroupOption } from 'terracotta';
import { getCaught } from '../auth/caught';
import { isShiny } from '../auth/caught-record';
import { isEgg } from '../auth/egg';
import teachMove from '../auth/moves';
import { MOVE_CATEGORY_COLORS, MOVE_CATEGORY_NAMES, type Moves } from '../data/ids/moves';
import { getMachineItem } from '../data/ids/items';
import { Species } from '../data/ids/species';
import { getMoveData } from '../data/moves';
import { getSpeciesData } from '../data/species';
import { MOVE_LIMIT } from '../overworld/encounter';
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
 * the record's answer rather than the caller's
 */
export interface TeachMoveDialogProps {
  /**
   * Who is being taught, or null when the dialog is closed
   */
  catchId: string | null;
  /**
   * The move the machine teaches. The machine itself is derived from
   * it — there is exactly one per move — so a caller that knows which
   * move it is offering does not have to know the item id as well
   */
  move: Moves | null;
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
function MoveLine(props: { move: Moves }): JSX.Element {
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
  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors' +
  ' border-line bg-paper hover:border-leaf aria-checked:border-leaf aria-checked:bg-leaf-soft' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf';

export default function TeachMoveDialog(props: TeachMoveDialogProps): JSX.Element {
  const [forgetting, setForgetting] = createSignal(0);
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const [caught] = createResource(() => props.catchId, getCaught);

  const open = (): boolean => props.catchId != null && props.move != null;

  const known = (): Moves[] => caught()?.moves ?? [];

  /**
   * Whether the list is full. It is what decides which of the two
   * dialogs a player is shown, and it is read off the record rather
   * than passed in
   */
  const full = (): boolean => known().length >= MOVE_LIMIT;

  const taught = (): string => (props.move == null ? 'that move' : getMoveData(props.move).name);

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
    teachMove(catchId, getMachineItem(move), forgetting())
      .then((moves) => {
        setBusy(false);

        if (moves == null) {
          setStatus(
            `${named()} could not be taught ${taught()} — it may know it already, be unable to learn it, or be locked.`,
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
            direction="down"
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
        description={`${named()} already knows four. Choose the one it forgets — it does not come
          back on its own.`}
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
        description={`${named()} has room for it. The machine is spent teaching it.`}
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
                <li class="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
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
