import { COATS, FilePicker, type Naming, NamingFields, START, Written, clearedOnSuccess, refusalOf, useToken } from './shared';
import { packPmd } from '../../../auth/sprites';
import DEFAULT_PMD_ANIMS from '../../../data/constants/pmd-anims';
import { Button, FormActions, FormGrid, FormSection, Status, TextArea } from '../../styled';
import { useSubmission } from '@solidjs/router';
import { For, type JSX, Show, createSignal } from 'solid-js';

/** A pokemon's coats into `public/sprites/pokemon`. */
export default function PmdForm(): JSX.Element {
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
