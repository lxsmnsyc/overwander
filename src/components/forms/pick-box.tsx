import { type JSX, Show, createSignal } from 'solid-js';
import CatchBox, { type BoxEntry } from '../catches/CatchBox';
import { Button, DialogActions, DialogSection, Meta } from '../styled';
import { CounterStep } from './terms';
import { type FormProps, defineForm } from './form';

export interface PickBoxInput {
  title?: string;
  prompt?: string;
  /** Pokemon that are nobody's yet: an offer, a shelf of gifts */
  entries: BoxEntry[];
  columns?: 3 | 5 | 6 | 8;
  step: string;
  action: string;
  /** What is worth knowing about the one picked, before committing to it */
  about?: (id: string) => string;
}

function PickBoxView(props: FormProps<PickBoxInput, string>): JSX.Element {
  const [picked, setPicked] = createSignal<string | null>(null);

  const entries = (): BoxEntry[] => {
    const marked: BoxEntry[] = [];

    for (const entry of props.input.entries) {
      marked.push(entry.id === picked() ? { ...entry, mark: 'picked' } : entry);
    }
    return marked;
  };

  return (
    <>
      <DialogSection class="flex flex-col gap-3">
        <CounterStep>{props.input.step}</CounterStep>
        <CatchBox
          entries={entries()}
          columns={props.input.columns ?? 3}
          capacity={props.input.entries.length}
          onOpen={(id) => {
            setPicked(id);
          }}
        />
        <Show when={picked()}>
          {(id) => (
            <Show when={props.input.about?.(id())}>
              {(said) => <Meta class="block">{said()}</Meta>}
            </Show>
          )}
        </Show>
      </DialogSection>
      <DialogActions>
        <Button
          tone="primary"
          disabled={picked() == null}
          onClick={() => {
            const id = picked();

            if (id != null) {
              props.submit(id);
            }
          }}
        >
          {props.input.action}
        </Button>
        <Button onClick={props.cancel}>{props.leave}</Button>
      </DialogActions>
    </>
  );
}

/** One pokemon out of a box of them that is not the player's */
export const PickBoxForm = defineForm<PickBoxInput, string>({
  title: (input) => input.title ?? 'Choose one',
  prompt: (input) => input.prompt ?? 'Choose one of these.',
  view: (props) => <PickBoxView {...props} />,
});
