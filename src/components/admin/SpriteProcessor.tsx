import { For, type JSX, Show, createEffect, createSignal, onMount } from 'solid-js';
import { useSubmission } from '@solidjs/router';
import { TabGroup } from 'terracotta';
import {
  Button,
  Combobox,
  Field,
  FormActions,
  FormGrid,
  FormSection,
  Note,
  Status,
  Switch,
  TabBar,
  TabButton,
  TabPane,
  TextArea,
} from '../styled';
import { canProcessSprites, packExtras, packPmd } from '../../auth/sprites';
import getIdToken from '../../auth/session';
import type { Drawing } from '../../auth/sprites';
import DEFAULT_PMD_ANIMS from '../../data/constants/pmd-anims';
import { Species } from '../../data/ids/species';
import { getRegisteredSpecies, getSpeciesData } from '../../data/species';

/**
 * The sprite processor: the packer tool, moved into the game.
 *
 * It does what the standalone tool did — loose images into one sheet,
 * or a PMD archive into a pokemon's sheet — with two differences. The
 * work happens on the server, so nothing is decoded in a canvas and
 * read back out again; and the result is **written**, straight into
 * `public/`, rather than handed over as two downloads to be dropped
 * into place by hand.
 *
 * That makes it a development tool rather than a staff screen. A
 * deployed build serves `public/` out of a bundle, so a write there
 * would change nothing and a server that could write into its own
 * asset root is a hole — the server refuses either way, and the page
 * says so instead of offering a button that cannot work.
 *
 * Both halves are ordinary **forms**. The files are the whole point of
 * the screen, and a file belongs in a multipart body rather than read
 * into a typed array and serialised through a function call — so what
 * the server functions take is the `FormData`, and everything beside
 * the files goes in as a named input.
 */

/** Which of the two the page is on. */
const enum Mode {
  Pmd = 0,
  Extras = 1,
}

/** How a sheet is named. */
interface Naming {
  species: Species | null;
  female: boolean;
  compact: boolean;
}

const START: Naming = { species: null, female: false, compact: true };

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
function FilePicker(props: {
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
function NamingFields(props: {
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
function Written(props: { paths: string[]; drawings: Drawing[]; note?: string }): JSX.Element {
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
function useToken(): () => string {
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
function clearedOnSuccess(
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
function refusalOf(error: unknown): string {
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
const COATS: { name: string; label: string; hint: string }[] = [
  {
    name: 'regular',
    label: 'Regular',
    hint: 'The ordinary coat. Everything else is packed to it.',
  },
  { name: 'shiny', label: 'Shiny', hint: 'Optional.' },
  { name: 'female', label: 'Female', hint: 'Optional. Written beside the ordinary one as _f.' },
  { name: 'shinyFemale', label: 'Shiny female', hint: 'Optional.' },
];

/** A pokemon's coats into `public/sprites/pokemon`. */
function PmdForm(): JSX.Element {
  const token = useToken();
  const [picked, setPicked] = createSignal(false);
  const [naming, setNaming] = createSignal<Naming>(START);
  const [anims, setAnims] = createSignal(DEFAULT_PMD_ANIMS.join(' '));
  const packing = useSubmission(packPmd);
  const [form, setForm] = createSignal<HTMLFormElement>();

  const ready = (): boolean => picked() && naming().species != null && !packing.pending;

  clearedOnSuccess(
    form,
    () => packing.result,
    () => {
      setPicked(false);
      setNaming(START);
      // The list of animations is a setting rather than an answer, so it
      // goes back to the one it opened with instead of going blank
      setAnims(DEFAULT_PMD_ANIMS.join(' '));
    },
  );

  return (
    <form
      ref={(element) => {
        setForm(element);
      }}
      action={packPmd}
      method="post"
      enctype="multipart/form-data"
    >
      <input type="hidden" name="token" value={token()} />
      <FormSection
        title="PMD archives"
        lede="One archive a coat, as the collab site hands them out. They are packed to a single
          layout, since the game keeps one description for all four."
      >
        <FormGrid>
          <For each={COATS}>
            {(coat) => (
              <FilePicker
                label={coat.label}
                name={coat.name}
                accept=".zip"
                hint={coat.hint}
                onPick={(files) => {
                  if (coat.name === 'regular') {
                    setPicked(files.length > 0);
                  }
                }}
              />
            )}
          </For>
        </FormGrid>
        <NamingFields
          naming={naming()}
          onChange={(value) => {
            setNaming(value);
          }}
          female={false}
        />
        <TextArea
          label="Animations"
          name="anims"
          value={anims()}
          onChange={(value) => {
            setAnims(value);
          }}
          hint="Names to keep, separated by spaces. Matched from the start of the name."
          rows={3}
        />
        {/* Above what it produced rather than under it: a sheet and
            its four coats are taller than the screen, and a button at
            the end of that is a button nobody can find twice */}
        <FormActions note="Writes the sheet and the description it shares.">
          <Button type="submit" tone="primary" disabled={!ready()}>
            {packing.pending ? 'Processing…' : 'Process'}
          </Button>
        </FormActions>
        <Status message={refusalOf(packing.error)} tone="alert" />
        <Show when={packing.result}>
          {(done) => (
            <Written
              paths={done().written}
              drawings={done().coats}
              note={`${done().anims.length} animations kept, ${done().coats.length} ${
                done().coats.length === 1 ? 'coat' : 'coats'
              } at ${done().width} × ${done().height}.`}
            />
          )}
        </Show>
      </FormSection>
    </form>
  );
}

/** Loose images into `public/sprites/extras`. */
function ExtrasForm(): JSX.Element {
  const token = useToken();
  const [count, setCount] = createSignal(0);
  const [naming, setNaming] = createSignal<Naming>(START);
  const packing = useSubmission(packExtras);
  const [form, setForm] = createSignal<HTMLFormElement>();

  const ready = (): boolean => count() > 0 && naming().species != null && !packing.pending;

  clearedOnSuccess(
    form,
    () => packing.result,
    () => {
      setCount(0);
      setNaming(START);
    },
  );

  return (
    <form
      ref={(element) => {
        setForm(element);
      }}
      action={packExtras}
      method="post"
      enctype="multipart/form-data"
    >
      <input type="hidden" name="token" value={token()} />
      <FormSection
        title="Loose images"
        lede="Any set of images packed into one sheet, with a description saying where each of them
          landed."
      >
        <FilePicker
          label="Images"
          name="images"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onPick={(files) => {
            setCount(files.length);
          }}
        />
        <Note>{count() === 0 ? 'Nothing picked yet.' : `${count()} picked.`}</Note>
        {/* One drawing rather than two coats, so nothing here asks
            which — the server files an extra under neither */}
        <NamingFields
          naming={naming()}
          onChange={(value) => {
            setNaming(value);
          }}
          female
        />
        <FormActions note="Writes the sheet and its description.">
          <Button type="submit" tone="primary" disabled={!ready()}>
            {packing.pending ? 'Packing…' : 'Pack'}
          </Button>
        </FormActions>
        <Status message={refusalOf(packing.error)} tone="alert" />
        <Show when={packing.result}>
          {(done) => (
            <Written
              paths={done().written}
              drawings={[done().drawing]}
              note={`${done().images} images, ${done().width} × ${done().height}.`}
            />
          )}
        </Show>
      </FormSection>
    </form>
  );
}

export default function SpriteProcessor(): JSX.Element {
  return (
    <Show
      when={canProcessSprites()}
      fallback={
        <Status
          message="The sprite processor only runs on a development build: it writes into public/,
            which a deployed build serves out of a bundle."
          tone="alert"
        />
      }
    >
      <TabGroup horizontal defaultValue={Mode.Pmd} toggleable={false} class="flex flex-col gap-3">
        <TabBar>
          <TabButton value={Mode.Pmd}>PMD</TabButton>
          <TabButton value={Mode.Extras}>Loose images</TabButton>
        </TabBar>
        <TabPane value={Mode.Pmd}>
          <PmdForm />
        </TabPane>
        <TabPane value={Mode.Extras}>
          <ExtrasForm />
        </TabPane>
      </TabGroup>
    </Show>
  );
}
