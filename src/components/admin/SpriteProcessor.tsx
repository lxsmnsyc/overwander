import { For, type JSX, Show, createSignal, onMount } from 'solid-js';
import { useSubmission } from '@solidjs/router';
import { TabGroup } from 'terracotta';
import {
  Button,
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
  TextField,
} from '../styled';
import { canProcessSprites, packExtras, packPmd } from '../../auth/sprites';
import getIdToken from '../../auth/session';
import DEFAULT_PMD_ANIMS from '../../data/constants/pmd-anims';

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
  species: string;
  female: boolean;
  compact: boolean;
}

const START: Naming = { species: '', female: false, compact: true };

/** The species a sheet is for, or nothing where the box is not a number. */
function speciesOf(naming: Naming): number | null {
  const value = Number.parseInt(naming.species, 10);

  return Number.isFinite(value) && value > 0 ? value : null;
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
      <input type="hidden" name="species" value={props.naming.species} />
      <Show when={props.female}>
        <input type="hidden" name="female" value={props.naming.female ? 'on' : ''} />
      </Show>
      <input type="hidden" name="compact" value={props.naming.compact ? 'on' : ''} />
      <TextField
        label="Species"
        kind="number"
        min={1}
        value={props.naming.species}
        onChange={(value) => {
          set({ species: value });
        }}
        hint="The dex number the sheet is filed under, which is what names the files."
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
 * How the drawing came out: the container the compactor picked and what
 * that cost. Worth saying out loud — the difference between a sheet
 * stored indexed and the same sheet stored RGBA is most of its weight
 */
function storedAs(bytes: number, as: string): string {
  return `${(bytes / 1024).toFixed(1)}K as ${as}`;
}

/** What the server wrote, once it has. */
function Written(props: { paths: string[]; note?: string }): JSX.Element {
  return (
    <div class="flex flex-col gap-1">
      <Show when={props.note}>{(said) => <Note>{said()}</Note>}</Show>
      <ul class="m-0 flex list-none flex-col gap-1 p-0">
        <For each={props.paths}>
          {(path) => <li class="font-mono text-xs text-muted">public/{path}</li>}
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

  const ready = (): boolean => picked() && speciesOf(naming()) != null && !packing.pending;

  return (
    <form action={packPmd} method="post" enctype="multipart/form-data">
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
        <FormActions
          note={
            <Show when={packing.result} fallback="Writes the sheet and the description it shares.">
              {(done) => (
                <Written
                  paths={done().written}
                  note={`${done().anims.length} animations kept, ${done().coats.length} ${
                    done().coats.length === 1 ? 'coat' : 'coats'
                  } at ${done().width} × ${done().height}, ${storedAs(
                    done().coats[0].bytes,
                    done().coats[0].as,
                  )}.`}
                />
              )}
            </Show>
          }
        >
          <Button type="submit" tone="primary" disabled={!ready()}>
            {packing.pending ? 'Processing…' : 'Process'}
          </Button>
        </FormActions>
        <Status message={refusalOf(packing.error)} tone="alert" />
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

  const ready = (): boolean => count() > 0 && speciesOf(naming()) != null && !packing.pending;

  return (
    <form action={packExtras} method="post" enctype="multipart/form-data">
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
        <FormActions
          note={
            <Show when={packing.result} fallback="Writes the sheet and its description.">
              {(done) => (
                <Written
                  paths={done().written}
                  note={`${done().images} images, ${done().width} × ${done().height}, ${storedAs(
                    done().bytes,
                    done().as,
                  )}.`}
                />
              )}
            </Show>
          }
        >
          <Button type="submit" tone="primary" disabled={!ready()}>
            {packing.pending ? 'Packing…' : 'Pack'}
          </Button>
        </FormActions>
        <Status message={refusalOf(packing.error)} tone="alert" />
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
