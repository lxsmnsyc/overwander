import { For, type JSX, Show, createSignal } from 'solid-js';
import { Button, DialogActions, DialogSection, List, ListRow, RowButton } from '../styled';
import { CostBadge, type CounterCost, CounterStep, CounterTerms } from './terms';
import { type ActionForm, defineForm } from './form';
import { openForm } from './stack';

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
        <DialogActions>
          <For each={props.input.choices}>
            {(choice) => (
              <Button
                tone="primary"
                disabled={choice.refused != null}
                onClick={() => {
                  props.submit(choice.value);
                }}
              >
                {choice.label}
                <Show when={choice.cost}>{(cost) => <CostBadge cost={cost()} />}</Show>
              </Button>
            )}
          </For>
          <Button onClick={props.cancel}>{props.leave}</Button>
        </DialogActions>
      }
    >
      <DialogSection class="flex flex-col gap-3">
        <Show when={props.input.have}>{(have) => <CounterTerms have={have()} />}</Show>
        <Show when={props.input.step}>{(step) => <CounterStep>{step()}</CounterStep>}</Show>
        <List>
          <For each={props.input.choices}>
            {(choice) => (
              <ListRow class="flex-nowrap p-0" selected={picked() === choice}>
                <RowButton
                  class="flex items-center gap-2 px-3 py-2"
                  pressed={picked() === choice}
                  disabled={choice.refused != null}
                  onClick={() => {
                    press(choice);
                  }}
                >
                  <span class="grow font-semibold">{choice.label}</span>
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
      <DialogActions>
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
    title: (input) => input.title ?? 'Choose',
    prompt: (input) => input.prompt ?? 'Choose one.',
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
