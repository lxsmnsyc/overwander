import { For, type JSX, Show, createEffect, createResource, createSignal, untrack } from 'solid-js';
import { isLockLive } from '../auth/battle-lock';
import { type CaughtPokemon, listCaught } from '../auth/caught';
import { syncServerClock } from '../auth/clock';
import { useAuth } from '../auth/context';
import { describeCatch } from './CatchesList';
import matches from '../core/search';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  List,
  ListRow,
  Meta,
  Note,
  Row,
  RowButton,
  SEARCH_FROM,
  Search,
} from './styled';

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
  /**
   * What the caller is asking for, in a sentence. The picker says
   * something sensible about how many it wants if the caller does not
   */
  description?: string;
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

  /**
   * What the caller will accept, before the player narrows it further
   */
  const offered = (): CatchOption[] =>
    (props.options ?? owned() ?? []).filter((option) => props.filter?.(option) ?? true);

  const [query, setQuery] = createSignal('');

  /**
   * A search hides rows rather than refusing them: a pokemon already
   * drafted stays drafted while it is out of sight, so typing to find
   * the sixth party member cannot quietly drop the other five
   */
  const options = (): CatchOption[] =>
    offered().filter((option) => matches(describeCatch(option.caught), query()));

  const chosen = (): string[] => (props.multiple === true ? props.value : []);

  const limit = (): number =>
    props.multiple === true ? (props.max ?? Number.POSITIVE_INFINITY) : 1;

  createEffect(() => {
    if (showing()) {
      setDraft(untrack(chosen));
    }
  });

  const isDrafted = (id: string): boolean => new Set(draft()).has(id);

  /**
   * What the picker is asking for. A caller with something more
   * specific to say says it; otherwise the question is how many, which
   * the picker already knows
   */
  const purpose = (): string => {
    if (props.description != null) {
      return props.description;
    }
    if (props.multiple !== true) {
      return 'Choose one of your pokemon.';
    }
    return limit() === Number.POSITIVE_INFINITY
      ? 'Choose from your pokemon.'
      : `Choose from your pokemon — up to ${limit()} of them.`;
  };

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
    <div class="flex flex-col gap-3">
      <Show when={offered().length > SEARCH_FROM}>
        <Row>
          <Search
            placeholder="Search your pokemon"
            value={query()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Row>
      </Show>

      <Show when={!loading()} fallback={<Note>Looking them over…</Note>}>
        <Show
          when={options().length}
          fallback={
            <Note>
              {query().length === 0
                ? (props.empty ?? 'You have nothing for this.')
                : 'None of yours match that.'}
            </Note>
          }
        >
          <List>
            <For each={options()}>
              {(option) => (
                <ListRow
                  selected={
                    props.multiple === true ? isDrafted(option.id) : props.value === option.id
                  }
                  class="flex-col items-stretch"
                >
                  <div class="flex flex-wrap items-center gap-2">
                    <RowButton
                      pressed={
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
                    </RowButton>
                    {/* Said rather than merely greyed: a pokemon left
                        out of a party for a reason is worth the
                        sentence */}
                    <Show when={props.reason?.(option)}>
                      {(said) => <Badge tone="ember">{said()}</Badge>}
                    </Show>
                    <Show when={props.note?.(option)}>{(said) => <Meta>{said()}</Meta>}</Show>
                  </div>
                  <Show when={pending() === option.id}>
                    <Row>
                      <Button
                        tone="primary"
                        onClick={() => {
                          pickOne(option.id);
                        }}
                      >
                        {props.verb ?? 'Pick'} this one?
                      </Button>
                      <Button
                        onClick={() => {
                          setPending(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </Row>
                  </Show>
                </ListRow>
              )}
            </For>
          </List>
        </Show>
      </Show>

      <Show when={props.multiple === true}>
        <Row>
          <Button
            tone="primary"
            disabled={props.disabled === true || draft().length === 0}
            onClick={finish}
          >
            {confirming()
              ? 'Sure?'
              : `${props.verb ?? 'Take'} ${draft().length}${
                  limit() === Number.POSITIVE_INFINITY ? '' : `/${limit()}`
                }`}
          </Button>
        </Row>
      </Show>
    </div>
  );

  return (
    <Show when={props.inline !== true} fallback={list()}>
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
        title={props.title ?? 'Your pokemon'}
        description={purpose()}
      >
        {list()}
        <DialogActions>
          <Show when={props.multiple !== true && props.value != null}>
            <Button
              onClick={() => {
                pickOne(null);
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
