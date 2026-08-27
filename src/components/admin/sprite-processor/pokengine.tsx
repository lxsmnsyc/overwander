import { FilePicker, Written, clearedOnSuccess, refusalOf, useToken } from './shared';
import { packPokengine } from '../../../auth/sprites';
import {
  Button,
  FormActions,
  FormGrid,
  FormSection,
  Status,
  Switch,
  TextField,
} from '../../styled';
import { useSubmission } from '@solidjs/router';
import { type JSX, Show, createSignal } from 'solid-js';

/** The row order a Pokengine sheet arrives in. */
const POKENGINE_ORDER = 'down up right left';

/**
 * A Pokengine community charset into `public/sprites/overworld`.
 *
 * The format is fixed — three walk frames across, four facings down —
 * so the one input that is not a file or a name is the sheet's own row
 * order, which the pack puts into the game's reading order
 */
export default function PokengineForm(): JSX.Element {
  const token = useToken();
  const [picked, setPicked] = createSignal(false);
  const [name, setName] = createSignal('');
  const [order, setOrder] = createSignal(POKENGINE_ORDER);
  const [credit, setCredit] = createSignal('');
  const [compact, setCompact] = createSignal(true);
  const packing = useSubmission(packPokengine);
  const [form, setForm] = createSignal<HTMLFormElement>();

  const ready = (): boolean =>
    picked() && name().trim().length > 0 && credit().trim().length > 0 && !packing.pending;

  clearedOnSuccess(
    form,
    () => packing.result,
    () => {
      setPicked(false);
      setName('');
      setOrder(POKENGINE_ORDER);
      setCredit('');
    },
  );

  return (
    <form
      ref={(element) => {
        setForm(element);
      }}
      action={packPokengine}
      method="post"
      enctype="multipart/form-data"
    >
      <input type="hidden" name="token" value={token()} />
      <input type="hidden" name="name" value={name()} />
      <input type="hidden" name="order" value={order()} />
      <input type="hidden" name="credit" value={credit()} />
      <input type="hidden" name="compact" value={compact() ? 'on' : ''} />
      <FormSection
        title="Pokengine charsets"
        lede="One Pokengine community charset — standing, one step, the other step across, four
          facings down. The rows land in the game's order whatever order they arrived in, and the
          description carries the walk cycle a three-frame charset plays."
      >
        <FilePicker
          label="Sheet"
          name="sheet"
          accept="image/png,image/webp"
          hint="One image holding the whole 3 × 4 grid."
          onPick={(files) => {
            setPicked(files.length > 0);
          }}
        />
        <FormGrid>
          <TextField
            label="Name"
            required
            value={name()}
            placeholder="characters/frlg/red"
            onChange={(value) => {
              setName(value);
            }}
            hint="The folder under sprites/overworld. Letters and digits; slashes keep subfolders."
          />
          <TextField
            label="Row order"
            value={order()}
            placeholder={POKENGINE_ORDER}
            onChange={(value) => {
              setOrder(value);
            }}
            hint="The sheet's facings, top to bottom. Each of down, left, right, up once."
          />
          <TextField
            label="Credit"
            required
            value={credit()}
            placeholder="Artist"
            onChange={(value) => {
              setCredit(value);
            }}
            hint="Who drew it. Written into the Pokengine table on the credits page."
          />
          <Switch
            label="Compact"
            description="Crop every cell to the tightest rectangle that still holds all of them."
            checked={compact()}
            onChange={(value) => {
              setCompact(value);
            }}
          />
        </FormGrid>
        <FormActions note="Writes the grid, the description beside it, and the credit row.">
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
              note={`${done().grid.columns} × ${done().grid.rows} frames of ${
                done().grid.frameWidth
              } × ${done().grid.frameHeight}, cut from ${done().grid.sourceFrameWidth} × ${
                done().grid.sourceFrameHeight
              }.`}
            />
          )}
        </Show>
      </FormSection>
    </form>
  );
}
