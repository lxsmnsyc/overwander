import { For, type JSX, Show, createEffect, createResource, createSignal, untrack } from 'solid-js';
import { isLockLive } from '../auth/battle-lock';
import { type CaughtPokemon, listCaught } from '../auth/caught';
import { syncServerClock } from '../auth/clock';
import { useAuth } from '../auth/context';
import PickerDialog from './PickerDialog';
import { describeCatch } from './CatchesList';

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
 * One of the player's pokemon, with the one thing a caller cannot read
 * off the record itself: whether it is in a battle right now. That
 * needs the server's clock, which the picker reads once for the whole
 * list rather than making every caller do it
 */
export interface CatchOption {
  id: string;
  caught: CaughtPokemon;
  fighting: boolean;
}

interface CatchPickerCommonProps {
  /**
   * Whose pokemon. Defaults to the signed-in player
   */
  player?: string;
  title?: string;
  label?: string;
  /**
   * What a row's button says it will do. The pokemon follows it
   */
  verb?: string;
  empty?: string;
  /**
   * Ask once more before handing the pick back
   */
  confirm?: boolean;
  /**
   * Whether the list is showing but not taking picks — a catch in a
   * live battle, say, where every row is refused for the same reason
   */
  disabled?: boolean;
  /**
   * Render the list on its own, with no dialog and no button to open
   * one
   */
  inline?: boolean;
  open?: boolean;
  onClose?: () => void;
  /**
   * Which pokemon the caller can accept at all. Anything else is left
   * out of the list
   */
  filter?: (option: CatchOption) => boolean;
  /**
   * Why a pokemon that *is* in the list cannot be picked — "in a
   * raid", "fainted". A row with a reason is shown, said, and
   * disabled, so a player counting their party knows where one went
   * instead of finding it missing
   */
  reason?: (option: CatchOption) => string | null;
  /**
   * Something worth saying about a row that does not stop it being
   * picked — what a fee would buy this particular egg, say
   */
  note?: (option: CatchOption) => string | null;
  /**
   * The records, already in hand. A caller showing two pickers over
   * one set of catches reads them once and passes them to both
   */
  options?: CatchOption[];
  /**
   * Changing this re-reads the records
   */
  revision?: unknown;
}

export type CatchPickerProps = CatchPickerCommonProps &
  (
    | {
        multiple?: false;
        value: string | null;
        onPick: (caught: string | null) => void;
        max?: undefined;
      }
    | {
        multiple: true;
        value: string[];
        onPick: (caught: string[]) => void;
        /**
         * How many may be picked at once — a party of six, a pair of
         * parents. Rows stop taking picks once it is reached
         */
        max?: number;
      }
  );

export default function CatchPicker(props: CatchPickerProps): JSX.Element {
  const auth = useAuth();
  const [opened, setOpened] = createSignal(false);
  const [pending, setPending] = createSignal<string | null>(null);
  const [confirming, setConfirming] = createSignal(false);
  const [draft, setDraft] = createSignal<string[]>([]);

  const owner = (): string => props.player ?? auth.user()?.uid ?? '';

  const showing = (): boolean => props.inline === true || (props.open ?? opened());

  const [owned] = createResource(
    () => (showing() && props.options == null ? ([owner(), props.revision] as const) : null),
    async ([player]): Promise<CatchOption[]> => {
      // The clock is the server's, so a lock that has timed out reads
      // as free rather than as whatever this device believes
      const [records, now] = await Promise.all([listCaught(player), syncServerClock()]);

      return records.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, now) }));
    },
  );

  const loading = (): boolean => props.options == null && owned.loading;

  const options = (): CatchOption[] =>
    (props.options ?? owned() ?? []).filter((option) => props.filter?.(option) ?? true);

  const chosen = (): string[] => (props.multiple === true ? props.value : []);

  const limit = (): number =>
    props.multiple === true ? (props.max ?? Number.POSITIVE_INFINITY) : 1;

  createEffect(() => {
    if (showing()) {
      setDraft(untrack(chosen));
    }
  });

  const isDrafted = (id: string): boolean => new Set(draft()).has(id);

  const close = (): void => {
    setPending(null);
    setConfirming(false);
    setOpened(false);
    props.onClose?.();
  };

  const pickOne = (id: string | null): void => {
    if (props.multiple === true) {
      return;
    }
    props.onPick(id);
    close();
  };

  const pickMany = (): void => {
    if (props.multiple !== true) {
      return;
    }
    props.onPick(draft());
    close();
  };

  const press = (option: CatchOption): void => {
    if (props.reason?.(option) != null) {
      return;
    }
    if (props.multiple === true) {
      if (isDrafted(option.id)) {
        setDraft(draft().filter((id) => id !== option.id));
      } else if (draft().length < limit()) {
        setDraft([...draft(), option.id]);
      }
      return;
    }
    if (props.confirm === true && pending() !== option.id) {
      setPending(option.id);
      return;
    }
    pickOne(option.id);
  };

  const finish = (): void => {
    if (props.confirm === true && !confirming()) {
      setConfirming(true);
      return;
    }
    pickMany();
  };

  const list = (): JSX.Element => (
    <>
      <Show when={!loading()} fallback={<p>Looking them over…</p>}>
        <Show
          when={options().length}
          fallback={<p>{props.empty ?? 'You have nothing for this.'}</p>}
        >
          <ul>
            <For each={options()}>
              {(option) => (
                <li>
                  <button
                    type="button"
                    aria-pressed={
                      props.multiple === true ? isDrafted(option.id) : props.value === option.id
                    }
                    disabled={props.disabled === true || props.reason?.(option) != null}
                    onClick={() => {
                      press(option);
                    }}
                  >
                    {isDrafted(option.id) ? '✓ ' : ''}
                    {props.verb == null ? '' : `${props.verb} `}
                    {describeCatch(option.caught)}
                  </button>
                  {/* Said rather than merely greyed: a pokemon left out
                      of a party for a reason is worth the sentence */}
                  <Show when={props.reason?.(option)}>{(said) => <span> · {said()}</span>}</Show>
                  <Show when={props.note?.(option)}>{(said) => <span> · {said()}</span>}</Show>
                  <Show when={pending() === option.id}>
                    {' '}
                    <button
                      type="button"
                      onClick={() => {
                        pickOne(option.id);
                      }}
                    >
                      {props.verb ?? 'Pick'} this one?
                    </button>{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setPending(null);
                      }}
                    >
                      Cancel
                    </button>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>

      <Show when={props.multiple === true}>
        <p>
          <button
            type="button"
            disabled={props.disabled === true || draft().length === 0}
            onClick={finish}
          >
            {confirming()
              ? 'Sure?'
              : `${props.verb ?? 'Take'} ${draft().length}${
                  limit() === Number.POSITIVE_INFINITY ? '' : `/${limit()}`
                }`}
          </button>
        </p>
      </Show>
    </>
  );

  return (
    <Show when={props.inline !== true} fallback={list()}>
      <button
        type="button"
        onClick={() => {
          setOpened(true);
        }}
      >
        {props.label ?? props.title ?? 'Pick a pokemon'}
      </button>
      <PickerDialog isOpen={showing()} title={props.title ?? 'Your pokemon'} onClose={close}>
        {list()}
        <p>
          <Show when={props.multiple !== true && props.value != null}>
            <button
              type="button"
              onClick={() => {
                pickOne(null);
              }}
            >
              Pick none
            </button>{' '}
          </Show>
          <button type="button" onClick={close}>
            Close
          </button>
        </p>
      </PickerDialog>
    </Show>
  );
}
