import { For, type JSX, createSignal } from 'solid-js';
import { BOX_COLOURS, BOX_NAME_LIMIT } from '../../../auth/box-record';
import { Button, Row, TextField } from '../../styled';

/**
 * A box's name and colour, for making one and for changing one. The
 * same few fields either way, so the two cannot drift into asking
 * differently.
 */
export interface BoxFormProps {
  /** What the field starts with: the box's own, or nothing for a new one */
  name?: string;
  colour?: number;
  /** What the button that keeps it says: "Make it", "Save" */
  verb: string;
  busy?: boolean;
  onSubmit: (name: string, colour: number) => void;
  onCancel: () => void;
}

export default function BoxForm(props: BoxFormProps): JSX.Element {
  // Seeded once: from here the form is the player's to change
  const [name, setName] = createSignal(props.name ?? '');
  const [colour, setColour] = createSignal(props.colour ?? 0);

  const submit = (): void => {
    if (name().trim() !== '') {
      props.onSubmit(name(), colour());
    }
  };

  return (
    <div class="flex flex-col gap-2 rounded-xl border-2 border-tide bg-paper p-2.5">
      <TextField
        label="Name"
        value={name()}
        placeholder="Water team"
        onChange={(typed) => {
          setName(typed.slice(0, BOX_NAME_LIMIT));
        }}
        onEnter={submit}
      />
      <div role="radiogroup" aria-label="Colour" class="flex flex-wrap gap-1.5">
        <For each={BOX_COLOURS}>
          {(swatch, at) => (
            <button
              type="button"
              role="radio"
              aria-checked={colour() === at()}
              aria-label={swatch.name}
              class={`size-6 cursor-pointer rounded-md border-2 ${
                colour() === at() ? 'border-ink' : 'border-paper'
              } shadow-pop-sm`}
              style={{ background: swatch.tone }}
              onClick={() => {
                setColour(at());
              }}
            />
          )}
        </For>
      </div>
      <Row>
        <Button
          tone="primary"
          disabled={props.busy === true || name().trim() === ''}
          onClick={submit}
        >
          {props.verb}
        </Button>
        <Button onClick={props.onCancel}>Never mind</Button>
      </Row>
    </div>
  );
}
