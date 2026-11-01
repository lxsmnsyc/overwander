import { For, type JSX, createSignal } from 'solid-js';
import { BOX_COLOURS, BOX_NAME_LIMIT } from '../../../model/box-record';
import { Button, TextField } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';

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
  /** What the form is for, over it: "New box", "Rename Water" */
  heading?: string;
  busy?: boolean;
  onSubmit: (name: string, colour: number) => void;
  onCancel: () => void;
}

/** The colours said in words, in the order `BOX_COLOURS` holds them */
export const BOX_COLOUR_NAMES: readonly (() => string)[] = [
  m.catch_colour_blue,
  m.catch_colour_red,
  m.catch_colour_green,
  m.catch_colour_gold,
  m.catch_colour_violet,
  m.catch_colour_orange,
  m.catch_colour_teal,
  m.catch_colour_pink,
  m.catch_colour_brown,
  m.catch_colour_slate,
];

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
    <div class="flex flex-col gap-2 rounded-xl border-2 border-tide bg-tide-soft p-2.5">
      <TextField
        label={props.heading ?? m.catch_box_name()}
        class="[&>label]:px-1 [&>label]:text-xs [&>label]:font-black [&>label]:tracking-wide
          [&>label]:text-tide-dark [&>label]:uppercase"
        value={name()}
        placeholder={m.catch_box_name_placeholder()}
        onChange={(typed) => {
          setName(typed.slice(0, BOX_NAME_LIMIT));
        }}
        onEnter={submit}
      />
      <div
        role="radiogroup"
        aria-label={m.catch_box_colour()}
        class="flex flex-wrap gap-1.5 px-0.5"
      >
        <For each={BOX_COLOURS}>
          {(swatch, at) => (
            <button
              type="button"
              role="radio"
              aria-checked={colour() === at()}
              aria-label={BOX_COLOUR_NAMES[at()]?.() ?? swatch.name}
              class={`size-7 cursor-pointer rounded-lg border-[3px] ${
                colour() === at() ? 'border-ink' : 'border-paper'
              }`}
              style={{ background: swatch.tone }}
              onClick={() => {
                setColour(at());
              }}
            />
          )}
        </For>
      </div>
      <div class="flex gap-1.5">
        <Button
          tone="accent"
          class="grow justify-center"
          disabled={props.busy === true || name().trim() === ''}
          onClick={submit}
        >
          {props.verb}
        </Button>
        <Button onClick={props.onCancel}>{m.ui_never_mind()}</Button>
      </div>
    </div>
  );
}
