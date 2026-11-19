import { type Accessor, For, Loading, Show, createMemo, createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import type { Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { TYPE_NAMES } from '../../data/constants/types';
import type { CatchOption } from '../catches/catch-picker';
import { MoveLine } from '../catches/MovePicker';
import { MOVE_CARD, MoveStripe } from './move-card';
import {
  Button,
  DialogActions,
  DialogSection,
  List,
  ListRow,
  Meta,
  Note,
  RowButton,
  SEARCH_FROM,
  Search,
  spellAria,
} from '../styled';
import type { Choice } from './choice';
import { m } from '../../i18n/paraglide/messages.js';
import { type ActionForm, type FormProps, defineForm } from './form';
import { loadCatchOptions } from './pick-catch';
import { CostBadge, type CounterCost, CounterStep, CounterTerms, PickOne } from './terms';

/**
 * One of the player's pokemon and what to do to it, asked on one
 * screen: the pokemon, then under it whatever it offers, then the one
 * press. A counter that asked the two in two dialogs had the player
 * pressing Next only to find the pokemon had nothing they wanted.
 */
export interface PickCatchThenInput<T> {
  player: string;
  title?: string;
  prompt?: string;
  /** What a row's button says, before the pokemon's name */
  verb: string;
  empty: string;
  /** Which pokemon can be picked at all */
  filter: (option: CatchOption) => boolean;
  /** Why one in the list cannot be picked, which shows it greyed */
  reason?: (option: CatchOption) => string | null;
  /** What picking this one would do, on its square */
  note?: (option: CatchOption) => string | null;
  /** The label over what the picked pokemon offers */
  step: string;
  /** What the picked pokemon offers */
  choices: (option: CatchOption) => Choice<T>[];
  /**
   * The move an offer is, to draw the offers as moves two to a row
   * with their type and category rather than as rows of text
   */
  move?: (value: T) => Moves;
  /** What the dock's button says */
  action: string;
  /** What any of it costs, where the choices do not each say */
  cost?: CounterCost;
  /** What the player carries of what is charged; short greys the button */
  have?: { amount: number; short: boolean; unit: string };
}

function Offers<T>(props: {
  input: PickCatchThenInput<T>;
  choices: Choice<T>[];
  chosen: Choice<T> | null;
  onChoose: (choice: Choice<T>) => void;
}): JSX.Element {
  const [query, setQuery] = createSignal('');

  /** The moves whose name or type holds what was typed */
  const found = (): Choice<T>[] => {
    const typed = query().trim().toLowerCase();

    const moveOf = props.input.move;

    if (typed === '' || moveOf == null) {
      return props.choices;
    }
    const matched: Choice<T>[] = [];

    for (const choice of props.choices) {
      const data = getMoveData(moveOf(choice.value));

      if (
        data.name.toLowerCase().includes(typed) ||
        TYPE_NAMES[data.type].toLowerCase().includes(typed)
      ) {
        matched.push(choice);
      }
    }
    return matched;
  };

  return (
    <Show
      when={props.input.move}
      fallback={
        // A list, so the price has room beside each answer
        <List>
          <For each={props.choices}>
            {(choice) => (
              <ListRow
                class="min-h-[52px] flex-nowrap rounded-card p-0"
                selected={props.chosen === choice}
              >
                <RowButton
                  class="flex items-center gap-2 px-3.5 py-2.5"
                  pressed={props.chosen === choice}
                  disabled={choice.refused != null}
                  onClick={() => {
                    props.onChoose(choice);
                  }}
                >
                  <span class="grow font-extrabold">{choice.label}</span>
                  <Show when={choice.refused ?? choice.detail}>
                    {(said) => (
                      <span class="shrink-0 text-right text-xs text-muted tabular-nums">
                        {said()}
                      </span>
                    )}
                  </Show>
                </RowButton>
              </ListRow>
            )}
          </For>
        </List>
      }
    >
      {(moveOf) => (
        <>
          <Show when={props.choices.length >= SEARCH_FROM}>
            <Search
              value={query()}
              placeholder={m.pick_move_search()}
              onChange={(typed) => {
                setQuery(typed);
              }}
            />
          </Show>
          <ul class="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            <For
              each={found()}
              fallback={
                <li class="col-span-full">
                  <Note>{m.pick_move_none()}</Note>
                </li>
              }
            >
              {(choice) => (
                <li>
                  <button
                    type="button"
                    aria-pressed={spellAria(props.chosen === choice)}
                    disabled={choice.refused != null}
                    class={`${MOVE_CARD} w-full cursor-pointer disabled:cursor-not-allowed
                  disabled:opacity-55 ${
                    props.chosen === choice
                      ? 'border-leaf bg-leaf-soft'
                      : 'border-line bg-paper hover:border-tide'
                  }`}
                    onClick={() => {
                      props.onChoose(choice);
                    }}
                  >
                    <MoveStripe move={moveOf()(choice.value)} />
                    <MoveLine move={moveOf()(choice.value)} />
                    <Show when={choice.refused}>
                      {(why) => <Meta class="shrink-0">{why()}</Meta>}
                    </Show>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </>
      )}
    </Show>
  );
}

function PickCatchThenBody<T>(
  props: FormProps<PickCatchThenInput<T>, [CatchOption, T]> & {
    options: Accessor<CatchOption[]>;
  },
): JSX.Element {
  const [picked, setPicked] = createSignal<string | null>(null);
  const [chosen, setChosen] = createSignal<Choice<T> | null>(null);

  const option = (): CatchOption | undefined => {
    for (const one of props.options()) {
      if (one.id === picked()) {
        return one;
      }
    }
    return undefined;
  };

  const ready = (): boolean =>
    option() != null &&
    chosen() != null &&
    chosen()?.refused == null &&
    props.input.have?.short !== true;

  return (
    <>
      <DialogSection class="flex flex-col gap-3">
        <Show when={props.input.have != null}>
          <CounterTerms have={props.input.have} />
        </Show>
        <PickOne
          options={props.options()}
          picked={picked()}
          onPick={(id) => {
            setPicked(id);
            setChosen(null);
          }}
          verb={props.input.verb}
          empty={props.input.empty}
          filter={props.input.filter}
          note={props.input.note}
          reason={props.input.reason}
        />
        <Show when={option()}>
          {(one) => (
            <>
              <CounterStep>
                {props.input.step} · {props.input.choices(one()).length}
              </CounterStep>
              <Offers
                input={props.input}
                choices={props.input.choices(one())}
                chosen={chosen()}
                onChoose={(choice) => {
                  setChosen(choice);
                }}
              />
            </>
          )}
        </Show>
      </DialogSection>
      <DialogActions stack>
        <Button
          tone="primary"
          disabled={!ready()}
          onClick={() => {
            const one = option();
            const choice = chosen();

            if (one != null && choice != null) {
              props.submit([one, choice.value]);
            }
          }}
        >
          {props.input.action}
          <Show when={chosen()?.cost ?? props.input.cost}>
            {(cost) => <CostBadge cost={cost()} />}
          </Show>
        </Button>
        <Button onClick={props.cancel}>{props.leave}</Button>
      </DialogActions>
    </>
  );
}

/** A pokemon and one of the things it offers, typed by what those are */
export function pickCatchThenForm<T>(): ActionForm<PickCatchThenInput<T>, [CatchOption, T]> {
  return defineForm<PickCatchThenInput<T>, [CatchOption, T]>({
    title: (input) => input.title ?? m.pick_catch_title(),
    prompt: (input) => input.prompt ?? m.pick_catch_then_prompt(),
    width: 'wide',
    view: (props) => {
      // Asked again only for another player, not for an input built again
      const player = createMemo(() => props.input.player);
      const options = createMemo(async () => loadCatchOptions(player()));

      return (
        <Loading fallback={<Note class="text-center">{m.pick_catch_loading()}</Note>}>
          <PickCatchThenBody {...props} options={options} />
        </Loading>
      );
    },
  });
}
