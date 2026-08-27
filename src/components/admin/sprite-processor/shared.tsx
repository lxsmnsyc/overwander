import getIdToken from '../../../auth/session';
import type { Drawing } from '../../../auth/sprites';
import { Species } from '../../../data/ids/species';
import { getRegisteredSpecies, getSpeciesData } from '../../../data/species';
import { Combobox, Field, FormGrid, Note, Switch } from '../../styled';
import { For, type JSX, Show, createEffect, createSignal, onMount } from 'solid-js';

/** How a sheet is named. */
export interface Naming {
  species: Species | null;
  female: boolean;
  compact: boolean;
}

export const START: Naming = { species: null, female: false, compact: true };

/**
 * The three that appear on a field without being anybody's pokemon.
 * They have sheets and dex numbers of their own but no species entry,
 * so a list built from the registry alone cannot name them
 */
const NAMELESS: { value: Species; label: string }[] = [
  { value: Species.Missingno, label: 'Missingno' },
  { value: Species.Egg, label: 'Egg' },
  { value: Species.Substitute, label: 'Substitute' },
];

/** Everything a sheet can be filed under, by the name it is known by. */
function speciesOptions(): { value: Species; label: string }[] {
  return [
    ...getRegisteredSpecies().map((species) => ({
      value: species,
      // The number is in the label as well as the value: the files are
      // named after it, and it is what somebody checking a sheet on
      // disk has in front of them
      label: `${getSpeciesData(species).name} · ${species}`,
    })),
    ...NAMELESS.map((entry) => ({ ...entry, label: `${entry.label} · ${entry.value}` })),
  ];
}

/** The file picker, dressed like the rest of the forms. */
export function FilePicker(props: {
  label: string;
  name: string;
  accept: string;
  hint?: string;
  multiple?: boolean;
  onPick: (files: File[]) => void;
}): JSX.Element {
  return (
    <Field label={props.label} stacked>
      <input
        type="file"
        name={props.name}
        accept={props.accept}
        multiple={props.multiple}
        class="rounded-lg border-2 border-line bg-paper p-2 text-sm text-ink file:mr-2
          file:rounded-md file:border-2 file:border-line file:bg-parchment file:px-2 file:py-1
          file:text-sm file:font-bold file:text-ink"
        onInput={(event) => {
          props.onPick([...(event.currentTarget.files ?? [])]);
        }}
      />
      <Show when={props.hint}>{(said) => <span class="text-xs text-muted">{said()}</span>}</Show>
    </Field>
  );
}

/**
 * What a sheet is called and how it is packed.
 *
 * The PMD half says nothing about coats here: which drawing a sheet is
 * follows from **which picker it was put in**, since all four are
 * packed together
 */
export function NamingFields(props: {
  naming: Naming;
  onChange: (naming: Naming) => void;
  /** Whether this half has a female sheet to name rather than pack. */
  female: boolean;
}): JSX.Element {
  const set = (change: Partial<Naming>): void => {
    props.onChange({ ...props.naming, ...change });
  };

  return (
    <FormGrid>
      {/* The controls above are the game's own rather than native
          inputs, so what the form actually posts is written out
          beside them: a toggle carries the same `on` a checkbox would */}
      <input type="hidden" name="species" value={props.naming.species ?? ''} />
      <Show when={props.female}>
        <input type="hidden" name="female" value={props.naming.female ? 'on' : ''} />
      </Show>
      <input type="hidden" name="compact" value={props.naming.compact ? 'on' : ''} />
      <Combobox
        label="Species"
        required
        value={props.naming.species}
        options={speciesOptions()}
        placeholder="Search species"
        onChange={(value) => {
          set({ species: value });
        }}
        hint="What the sheet is filed under. Its number is what names the files."
      />
      <Show when={props.female}>
        <Switch
          label="Female"
          description="A separate drawing of the same species, written beside the ordinary one
            as _f."
          checked={props.naming.female}
          onChange={(value) => {
            set({ female: value });
          }}
        />
      </Show>
      <Switch
        label="Compact"
        description="Crop every frame to the tightest rectangle that still holds all of them."
        checked={props.naming.compact}
        onChange={(value) => {
          set({ compact: value });
        }}
      />
    </FormGrid>
  );
}

/**
 * How the drawing came out: the container the compactor picked, what
 * that cost, and the two comparisons worth having — what the same sheet
 * would have weighed written plainly, and what the file it replaced
 * weighed. A sheet that grew is the thing worth noticing, and without
 * the second number nothing on the screen would say so
 */
export function storedAs(drawing: Drawing): string {
  // Bytes under a kilobyte rather than `0.0K`: the number that matters
  // most here is a difference, and a difference is usually small
  const size = (bytes: number): string =>
    bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}K`;
  const said = [`${size(drawing.bytes)} as ${drawing.as}`];

  if (drawing.plain > 0 && drawing.bytes < drawing.plain) {
    said.push(`${Math.round((1 - drawing.bytes / drawing.plain) * 100)}% off plain`);
  }
  if (drawing.before != null) {
    const change = drawing.bytes - drawing.before;

    said.push(
      change === 0
        ? `same as before at ${size(drawing.before)}`
        : `${change > 0 ? '+' : '−'}${size(Math.abs(change))} on ${size(drawing.before)}`,
    );
  }
  return said.join(', ');
}

/**
 * What the server wrote, once it has: every file, what each drawing
 * cost, and the drawing itself.
 *
 * The picture is fetched back out of `public/` rather than sent along
 * with the answer. The file is already there and the dev server is
 * already serving it, so the shortest way to show what was just packed
 * is to ask for it — and asking for it proves it landed where the page
 * says it did, which the bytes would not.
 *
 * A stamp on the address is what makes that work twice: the second run
 * writes over the same path, and a browser that already has that path
 * shows the sheet from before it
 */
export function Written(props: {
  paths: string[];
  drawings: Drawing[];
  note?: string;
}): JSX.Element {
  const stamp = Date.now();
  const found = (path: string): Drawing | undefined =>
    props.drawings.find((written) => written.path === path);

  return (
    <div class="flex flex-col gap-2">
      <Show when={props.note}>{(said) => <Note>{said()}</Note>}</Show>
      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        <For each={props.paths}>
          {(path) => {
            const drawing = found(path);

            return (
              <li class="flex flex-col gap-1">
                <span class="font-mono text-xs text-muted">
                  public/{path}
                  {drawing == null ? '' : ` — ${storedAs(drawing)}`}
                </span>
                <Show when={drawing != null}>
                  <img
                    src={`/${path}?packed=${stamp}`}
                    alt={path}
                    // Nearest-neighbour and no bigger than the panel: a
                    // sheet is pixel art, and a smoothed one says
                    // nothing about what was packed
                    class="max-h-64 max-w-full self-start rounded-lg border-2 border-line
                      bg-parchment object-contain p-1 [image-rendering:pixelated]"
                  />
                </Show>
              </li>
            );
          }}
        </For>
      </ul>
    </div>
  );
}

/**
 * The caller's own token, put in the form.
 *
 * A privileged server function verifies who is asking, and a form
 * submission carries nothing a fetch would have set for it — so the
 * token is a field like any other. It is read once when the screen
 * opens, which is as long as this tool is ever open for
 */
export function useToken(): () => string {
  const [token, setToken] = createSignal('');

  onMount(() => {
    getIdToken()
      .then(setToken)
      .catch(() => {
        // Nothing signed in is a refusal the server gives anyway, and
        // this screen is behind the dashboard's own gate
        setToken('');
      });
  });
  return token;
}

/**
 * Empties the pickers once the sheet is on disk.
 *
 * A form still holding the archive it just processed invites pressing
 * the button twice, and the second press writes the same files again
 * from the same bytes. What is **not** cleared is the answer: what was
 * written stays on the screen, since that is the thing worth reading
 *
 * The files are cleared through the DOM rather than through a signal
 * because a file picker's value is the browser's — a page cannot put a
 * file into one, and clearing it is the one change it is allowed
 */
export function clearedOnSuccess(
  form: () => HTMLFormElement | undefined,
  done: () => unknown,
  reset: () => void,
): void {
  let seen: unknown;

  createEffect(() => {
    const result = done();

    if (result == null || result === seen) {
      return;
    }
    seen = result;
    for (const picker of form()?.querySelectorAll<HTMLInputElement>('input[type=file]') ?? []) {
      picker.value = '';
    }
    reset();
  });
}

/** What went wrong, whether it was thrown here or on the server. */
export function refusalOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  // Anything that is not an `Error` says as little as it is worth
  return error == null ? '' : 'The sheet could not be processed';
}

/**
 * The four drawings, in the order they are filed. Only the plain one
 * has to be there: a species with no female form has two of these, and
 * one still being drawn may have one
 */
export const COATS: { name: string; label: string; hint: string }[] = [
  {
    name: 'regular',
    label: 'Regular',
    hint: 'The ordinary coat. Everything else is packed to it.',
  },
  { name: 'shiny', label: 'Shiny', hint: 'Optional.' },
  { name: 'female', label: 'Female', hint: 'Optional. Written beside the ordinary one as _f.' },
  { name: 'shinyFemale', label: 'Shiny female', hint: 'Optional.' },
];
