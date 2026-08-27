import { FilePicker, Written, clearedOnSuccess, refusalOf, useToken } from './shared';
import { packExtras } from '../../../auth/sprites';
import {
  Button,
  FormActions,
  FormGrid,
  FormSection,
  Note,
  Status,
  Switch,
  TextField,
} from '../../styled';
import { useSubmission } from '@solidjs/router';
import { type JSX, Show, createSignal } from 'solid-js';

/** Loose images into `public/sprites/extras`. */
export default function ExtrasForm(): JSX.Element {
  const token = useToken();
  const [count, setCount] = createSignal(0);
  const [name, setName] = createSignal('');
  const [compact, setCompact] = createSignal(true);
  const packing = useSubmission(packExtras);
  const [form, setForm] = createSignal<HTMLFormElement>();

  const ready = (): boolean => count() > 0 && name().trim().length > 0 && !packing.pending;

  clearedOnSuccess(
    form,
    () => packing.result,
    () => {
      setCount(0);
      setName('');
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
      <input type="hidden" name="name" value={name()} />
      <input type="hidden" name="compact" value={compact() ? 'on' : ''} />
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
        {/* A sheet of loose images is about nothing in particular, so
            it takes a name of its own rather than a species */}
        <FormGrid>
          <TextField
            label="Name"
            required
            value={name()}
            placeholder="ui/battle-effects"
            onChange={(value) => {
              setName(value);
            }}
            hint="What the sheet under sprites/extras is called. Letters and digits; a slash
              files it in a subfolder."
          />
          <Switch
            label="Compact"
            description="Crop every image to the tightest rectangle that still holds it."
            checked={compact()}
            onChange={(value) => {
              setCompact(value);
            }}
          />
        </FormGrid>
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
