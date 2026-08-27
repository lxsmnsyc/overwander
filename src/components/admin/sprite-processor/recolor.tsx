import { biomeOptions } from './biome';
import { Written, refusalOf, useToken } from './shared';
import { recolorBiome } from '../../../auth/sprites';
import {
  Button,
  Combobox,
  FormActions,
  FormGrid,
  FormSection,
  Note,
  Status,
  TextArea,
} from '../../styled';
import { useSubmission } from '@solidjs/router';
import { type JSX, Show, createSignal } from 'solid-js';

/**
 * A packed biome recoloured into another biome's folder.
 *
 * No file to pick: the source is what an earlier pack wrote, and the
 * whole input is the colour map. Run it with the map empty and the
 * result lists every colour the sheet holds, most-used first; fill
 * the map in and run again
 */
export default function RecolorForm(): JSX.Element {
  const token = useToken();
  const [source, setSource] = createSignal<number | null>(null);
  const [biome, setBiome] = createSignal<number | null>(null);
  const [swaps, setSwaps] = createSignal('');
  const swapping = useSubmission(recolorBiome);

  const ready = (): boolean =>
    source() != null && biome() != null && source() !== biome() && !swapping.pending;

  return (
    <form action={recolorBiome} method="post">
      <input type="hidden" name="token" value={token()} />
      <input type="hidden" name="source" value={source() ?? ''} />
      <input type="hidden" name="biome" value={biome() ?? ''} />
      <FormSection
        title="Palette swap"
        lede="An already-packed biome copied under new colours. The map runs over the sheet's
          pixels and its animation palettes alike, so the water keeps cycling in the new colours."
      >
        <FormGrid>
          <Combobox
            label="Copy from"
            required
            value={source()}
            options={biomeOptions()}
            onChange={(value) => {
              setSource(value);
            }}
            hint="A biome the packer has already written."
          />
          <Combobox
            label="Into"
            required
            value={biome()}
            options={biomeOptions()}
            onChange={(value) => {
              setBiome(value);
            }}
            hint="The folder the recoloured copy lands in."
          />
        </FormGrid>
        <TextArea
          label="Colour swaps"
          name="swaps"
          value={swaps()}
          onChange={(value) => {
            setSwaps(value);
          }}
          hint="One swap per line: #old #new. Leave empty to be told the sheet's colours."
          rows={8}
        />
        <FormActions note="Writes the recoloured atlas and its description.">
          <Button type="submit" tone="primary" disabled={!ready()}>
            {swapping.pending ? 'Swapping…' : 'Swap'}
          </Button>
        </FormActions>
        <Status message={refusalOf(swapping.error)} tone="alert" />
        <Show when={swapping.result}>
          {(done) => (
            <Written
              paths={done().written}
              drawings={[done().drawing]}
              note={`${done().swapped} pixels swapped.`}
            />
          )}
        </Show>
        <Show when={(swapping.result?.unmapped.length ?? 0) > 0}>
          <Note>
            {`Colours the map said nothing about, most-used first: ${swapping.result?.unmapped.join(
              ' ',
            )}`}
          </Note>
        </Show>
      </FormSection>
    </form>
  );
}
