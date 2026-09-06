import { type JSX, Show, Suspense, createMemo, createResource, createSignal } from 'solid-js';
import { isLockLive } from '../../../auth/battle-lock';
import { readCatchContext, searchCaught } from '../../../auth/caught';
import { syncServerClock } from '../../../auth/clock';
import { useAuth } from '../../../auth/context';
import {
  type CatchConstraint,
  type CatchContext,
  planCatchSearch,
} from '../../../auth/catch-search';
import ensureBattleData from '../../../data/battle-data';
import { Button, Dialog, DialogActions, Note } from '../../styled';
import PickerBox from './box';
import type { CatchOption, CatchPickerProps } from './options';

export type { CatchOption, CatchPickerProps } from './options';

/**
 * Picking one of the player's pokemon.
 *
 * A raid party, a breeding pair, a lot to auction, an egg to hand to
 * the daycare lady — every one of them is the same question with a
 * different rule about what counts as an answer, and each used to ask
 * it with its own list. This is the list; the rule is `filter` for what
 * to leave out and `reason` for what to show but refuse.
 *
 * It is a dialog by default. `inline` renders the list on its own for
 * callers that are already inside a dialog of their own, since a
 * dialog opened over a dialog fights it for the click that closes it.
 */

/**
 * Picking one of the player's pokemon: the button that opens it, the
 * dialog it opens into, and the box inside that.
 *
 * The records are read one component down, under the boundary this
 * puts around the box — a list read here would throw past it and take
 * the page with it
 */
export default function CatchPicker(props: CatchPickerProps): JSX.Element {
  const auth = useAuth();
  const [opened, setOpened] = createSignal(false);
  /** Bumped by a give or a take, so the records are read again */
  const [handled, setHandled] = createSignal(0);

  const owner = (): string => props.player ?? auth.user()?.uid ?? '';

  const showing = (): boolean => props.inline === true || (props.open ?? opened());

  /**
   * The move, ability and item registries, which the app loads behind
   * the first frame.
   *
   * The search reads names out of them: `move:ember` is a move id by
   * the time the store sees it. Asked before they land, every one of
   * those terms narrows to nothing on both passes and the box draws
   * as an empty collection rather than as one still loading, so
   * nothing is planned or shown until they are here
   */
  const [registries] = createResource(ensureBattleData);
  /** The same, read without suspending the page the picker sits on */
  const ready = (): boolean => registries.state === 'ready';

  const [own, setOwn] = createSignal('');
  /** The caller's query where it holds one, ours otherwise */
  const query = (): string => props.search ?? own();
  const setQuery = (value: string): void => {
    if (props.onSearch == null) {
      setOwn(value);
    } else {
      props.onSearch(value);
    }
  };
  /**
   * The half of the search the store can answer, which is what decides
   * whether the box has to be read again.
   *
   * Compared by what it says rather than by identity: a keystroke that
   * changes only the part the runtime filters — a name, a second type
   * — leaves this the same and reads nothing
   */
  const narrowing = createMemo<CatchConstraint[]>(
    () => (ready() ? planCatchSearch(query()) : []),
    [],
    {
      equals: (before: CatchConstraint[], after: CatchConstraint[]) =>
        JSON.stringify(before) === JSON.stringify(after),
    },
  );

  const [owned] = createResource(
    () =>
      showing() && ready() && props.options == null
        ? ([owner(), props.revision, handled(), narrowing()] as const)
        : null,
    async ([player, , , narrowed]): Promise<CatchOption[]> => {
      // The clock is the server's, so a lock that has timed out reads
      // as free rather than as whatever this device believes
      const [records, now] = await Promise.all([searchCaught(player, narrowed), syncServerClock()]);

      return records.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, now) }));
    },
  );

  /**
   * The facts about the box that live in other tables, read once
   * beside the rows. A view-only box reads them too: they are about
   * whose pokemon these are, not about who is looking
   */
  const [around] = createResource(
    () => (showing() && props.options == null ? ([owner(), handled()] as const) : null),
    async ([player]): Promise<CatchContext> => readCatchContext(player),
  );

  const limit = (): number =>
    props.multiple === true ? (props.max ?? Number.POSITIVE_INFINITY) : 1;

  /**
   * What the picker is asking for. A caller with something more
   * specific to say says it; otherwise the question is how many, which
   * the picker already knows
   */
  const purpose = (): string => {
    if (props.description != null) {
      return props.description;
    }
    if (props.viewOnly === true) {
      return 'What this trainer has caught.';
    }
    if (props.multiple !== true) {
      return 'Choose one of your pokemon.';
    }
    return limit() === Number.POSITIVE_INFINITY
      ? 'Choose from your pokemon.'
      : `Choose from your pokemon — up to ${limit()} of them.`;
  };

  const close = (): void => {
    setOpened(false);
    props.onClose?.();
  };

  /**
   * What went wrong reading the box, or nothing. A refused read leaves
   * the last list standing, since the box shows `latest` rather than
   * suspending on every keystroke, and a stale box with no word about
   * it reads as a search that found nothing
   */
  const trouble = (): boolean => registries.error != null || owned.error != null;

  const box = (): JSX.Element => (
    <Suspense fallback={<Note>Looking them over…</Note>}>
      <Show when={trouble()}>
        <Note>Could not read your pokemon just now. Try again in a moment.</Note>
      </Show>
      {/* Nothing is drawn against half-filled registries: a box whose
          search cannot name a move says so instead of answering it
          with an empty collection */}
      <Show when={ready()} fallback={<Note>Looking them over…</Note>}>
        <PickerBox
          {...props}
          owned={owned}
          around={around}
          showing={showing()}
          search={query()}
          onSearch={(typed) => {
            setQuery(typed);
          }}
          onHandled={() => {
            setHandled((count) => count + 1);
          }}
          onDone={close}
        />
      </Show>
    </Suspense>
  );

  return (
    <Show when={props.inline !== true} fallback={box()}>
      {/* The button that opens it, for a caller that has not said
          when it opens. One that passes `open` has a trigger of its
          own — a grunt's challenge, a lair — and this one turned up
          beside it saying the same thing twice, or, where the caller
          was a dialog, loose on the page behind it */}
      <Show when={props.open === undefined}>
        <Button
          onClick={() => {
            setOpened(true);
          }}
        >
          {props.label ?? props.title ?? 'Pick a pokemon'}
        </Button>
      </Show>
      <Dialog
        isOpen={showing()}
        onClose={close}
        title={props.title ?? (props.viewOnly === true ? 'Their pokemon' : 'Your pokemon')}
        description={purpose()}
      >
        {box()}
        <DialogActions>
          <Show when={props.multiple !== true && props.value != null && props.viewOnly !== true}>
            <Button
              onClick={() => {
                if (props.multiple !== true) {
                  props.onPick(null);
                }
                close();
              }}
            >
              Pick none
            </Button>
          </Show>
          <Button onClick={close}>Close</Button>
        </DialogActions>
      </Dialog>
    </Show>
  );
}
