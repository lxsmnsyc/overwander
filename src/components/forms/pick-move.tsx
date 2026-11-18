import { For, Show, createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import type { Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { TYPE_NAMES } from '../../data/constants/types';
import { MoveLine } from '../catches/MovePicker';
import { MOVE_CARD, MoveStripe } from './move-card';
import {
  Button,
  DialogActions,
  DialogSection,
  LIST_PAGE,
  Meta,
  Note,
  SEARCH_FROM,
  Search,
  createPager,
  spellAria,
} from '../styled';
import { CostBadge, type CounterCost, CounterStep, CounterTerms } from './terms';
import { m } from '../../i18n/paraglide/messages.js';
import { type FormProps, defineForm } from './form';

export interface PickMoveInput {
  title?: string;
  prompt?: string;
  moves: Moves[];
  /** The label over the moves */
  step: string;
  /** What the dock's button says */
  action: string;
  /** Why a move on offer cannot be picked yet, or null */
  refuses?: (move: Moves) => string | null;
  cost?: CounterCost;
  have?: { amount: number; short: boolean; unit: string };
}

function PickMoveView(props: FormProps<PickMoveInput, Moves>): JSX.Element {
  const [query, setQuery] = createSignal('');
  const [chosen, setChosen] = createSignal<Moves | null>(null);

  /** The moves on offer whose name or type holds what was typed */
  const found = (): Moves[] => {
    const typed = query().trim().toLowerCase();

    if (typed === '') {
      return props.input.moves;
    }
    const matched: Moves[] = [];

    for (const move of props.input.moves) {
      const data = getMoveData(move);

      if (
        data.name.toLowerCase().includes(typed) ||
        TYPE_NAMES[data.type].toLowerCase().includes(typed)
      ) {
        matched.push(move);
      }
    }
    return matched;
  };
  const page = createPager(found, LIST_PAGE);

  return (
    <>
      <DialogSection class="flex flex-col gap-3">
        <Show when={props.input.have != null}>
          <CounterTerms have={props.input.have} />
        </Show>
        <CounterStep>
          {props.input.step} · {props.input.moves.length}
        </CounterStep>
        <Show when={props.input.moves.length >= SEARCH_FROM}>
          <Search
            value={query()}
            placeholder={m.pick_move_search()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Show>
        {/* Name, type and category at a glance, as the catch sheet draws
            them; what the move does is on the card over it */}
        <ul class="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
          <For
            each={page.shown()}
            fallback={
              <li class="col-span-full">
                <Note>{m.pick_move_none()}</Note>
              </li>
            }
          >
            {(move) => {
              const refused = (): string | null => props.input.refuses?.(move) ?? null;

              return (
                <li>
                  <button
                    type="button"
                    aria-pressed={spellAria(chosen() === move)}
                    disabled={refused() != null}
                    class={`${MOVE_CARD} w-full cursor-pointer disabled:cursor-not-allowed
                      disabled:opacity-55 ${
                        chosen() === move
                          ? 'border-leaf bg-leaf-soft'
                          : 'border-line bg-paper hover:border-tide'
                      }`}
                    onClick={() => {
                      setChosen(move);
                    }}
                  >
                    <MoveStripe move={move} />
                    <MoveLine move={move} />
                    <Show when={refused()}>{(why) => <Meta class="shrink-0">{why()}</Meta>}</Show>
                  </button>
                </li>
              );
            }}
          </For>
        </ul>
        {page.controls()}
      </DialogSection>
      <DialogActions stack>
        <Button
          tone="primary"
          disabled={chosen() == null || props.input.have?.short === true}
          onClick={() => {
            const move = chosen();

            if (move != null) {
              props.submit(move);
            }
          }}
        >
          {props.input.action}
          <Show when={props.input.cost}>{(cost) => <CostBadge cost={cost()} />}</Show>
        </Button>
        <Button onClick={props.cancel}>{props.leave}</Button>
      </DialogActions>
    </>
  );
}

/** One move out of those on offer */
export const PickMoveForm = defineForm<PickMoveInput, Moves>({
  title: (input) => input.title ?? m.pick_move_title(),
  prompt: (input) => input.prompt ?? m.pick_move_prompt(),
  // Moves are listed two to a row, which needs the room
  width: 'wide',
  view: (props) => <PickMoveView {...props} />,
});
