import { For, type JSX, Show, createSignal } from 'solid-js';
import { Button, DialogActions, DialogSection, List, ListRow, RowButton } from '../styled';
import { CostBadge, type CounterCost, CounterStep, CounterTerms, DockNote } from './terms';
import { type ActionForm, defineForm } from './form';
import { openForm } from './stack';
import { m } from '../../i18n/paraglide/messages.js';

/** One answer to a choice */
export interface Choice<T> {
  label: string;
  value: T;
  /** What a list row says beside it: what it would do, what it costs */
  detail?: string;
  /** Why it cannot be picked just now, which greys it rather than hiding it */
  refused?: string | null;
  /** What picking it costs, drawn on the button that commits to it */
  cost?: CounterCost;
}

export interface ChoiceInput<T> {
  title?: string;
  prompt?: string;
  choices: Choice<T>[];
  /**
   * Draw the choices as rows rather than as buttons in the dock, for
   * answers with something to say about each. With `action`, a row is
   * picked and the dock's button commits to it; without, the row is
   * the answer
   */
  list?: boolean;
  /** The label over the rows */
  step?: string;
  action?: string;
  /** What the player carries, as a chip over the rows */
  have?: { amount: number; short: boolean; unit: string };
}

function ChoiceView<T>(props: {
  input: ChoiceInput<T>;
  submit: (value: T) => void;
  cancel: () => void;
  leave: string;
}): JSX.Element {
  const [picked, setPicked] = createSignal<Choice<T> | null>(null);

  const press = (choice: Choice<T>): void => {
    if (props.input.action == null) {
      props.submit(choice.value);
    } else {
      setPicked(choice);
    }
  };

  return (
    <Show
      when={props.input.list === true}
      fallback={
        <>
          {/* The answers as cards: pressing one is the answer, and one that
              cannot be taken is greyed with its reason where its note would be */}
          <Show when={props.input.have}>{(have) => <CounterTerms have={have()} />}</Show>
          <Show when={props.input.step}>{(step) => <CounterStep>{step()}</CounterStep>}</Show>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <For each={props.input.choices}>
              {(choice) => (
                <button
                  type="button"
                  disabled={choice.refused != null}
                  class="flex cursor-pointer flex-col gap-0.5 rounded-card border-2 border-line
                    bg-paper px-3.5 py-2.5 text-left shadow-pop-sm
                    transition-[translate,border-color] duration-(--motion-quick) ease-spring
                    hover:-translate-y-0.5 hover:border-tide focus-visible:outline-2
                    focus-visible:outline-offset-2 focus-visible:outline-tide
                    disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0
                    disabled:hover:border-line"
                  onClick={() => {
                    props.submit(choice.value);
                  }}
                >
                  <span class="text-sm font-extrabold">{choice.label}</span>
                  <Show when={choice.refused ?? choice.detail}>
                    {(said) => <span class="text-xs text-muted">{said()}</span>}
                  </Show>
                  <Show when={choice.cost}>
                    {(cost) => (
                      <span class="mt-1 self-start">
                        <CostBadge cost={cost()} />
                      </span>
                    )}
                  </Show>
                </button>
              )}
            </For>
          </div>
          <DialogActions stack note={<DockNote>{m.ask_press_note()}</DockNote>}>
            <Button onClick={props.cancel}>{props.leave}</Button>
          </DialogActions>
        </>
      }
    >
      <DialogSection class="flex flex-col gap-3">
        <Show when={props.input.have}>{(have) => <CounterTerms have={have()} />}</Show>
        <Show when={props.input.step}>{(step) => <CounterStep>{step()}</CounterStep>}</Show>
        <List>
          <For each={props.input.choices}>
            {(choice) => (
              <ListRow
                class="min-h-[52px] flex-nowrap rounded-card p-0"
                selected={picked() === choice}
              >
                <RowButton
                  class="flex items-center gap-2 px-3.5 py-2.5"
                  pressed={picked() === choice}
                  disabled={choice.refused != null}
                  onClick={() => {
                    press(choice);
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
      </DialogSection>
      <DialogActions stack>
        <Show when={props.input.action}>
          {(action) => (
            <Button
              tone="primary"
              disabled={picked() == null}
              onClick={() => {
                const choice = picked();

                if (choice != null) {
                  props.submit(choice.value);
                }
              }}
            >
              {action()}
              <Show when={picked()?.cost}>{(cost) => <CostBadge cost={cost()} />}</Show>
            </Button>
          )}
        </Show>
        <Button onClick={props.cancel}>{props.leave}</Button>
      </DialogActions>
    </Show>
  );
}

/** One of a handful of answers, typed by what they are */
export function choiceForm<T>(): ActionForm<ChoiceInput<T>, T> {
  return defineForm<ChoiceInput<T>, T>({
    title: (input) => input.title ?? m.choice_title(),
    prompt: (input) => input.prompt ?? m.choice_prompt(),
    width: 'wide',
    view: (props) => (
      <ChoiceView
        input={props.input}
        submit={props.submit}
        cancel={props.cancel}
        leave={props.leave}
      />
    ),
  });
}

/** Ask for one of a handful of answers */
export async function choose<T>(input: ChoiceInput<T>): Promise<T | null> {
  return openForm(choiceForm<T>(), input);
}
