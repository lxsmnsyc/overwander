import { biomeOptions } from './biome';
import { Written, refusalOf, useToken } from './shared';
import { graftBiomeWall } from '../../../auth/sprites';
import { Button, Combobox, FormActions, FormSection, Note, Status, TextArea } from '../../styled';
import { useSubmission } from '@solidjs/router';
import { type JSX, Show, createSignal } from 'solid-js';

/**
 * One packed biome's wall written over other biomes' walls.
 *
 * The forest rips draw their walls as trees, which was right when a
 * wall was all a chunk had and is not right now that the board grows
 * its own trees on the ground. A stone wall from a cave rip puts the
 * trees back where the world put them
 */
export default function GraftForm(): JSX.Element {
  const token = useToken();
  const [from, setFrom] = createSignal<number | null>(null);
  const [biomes, setBiomes] = createSignal('');
  const grafting = useSubmission(graftBiomeWall);

  const ready = (): boolean => from() != null && biomes().trim() !== '' && !grafting.pending;

  return (
    <form action={graftBiomeWall} method="post">
      <input type="hidden" name="token" value={token()} />
      <input type="hidden" name="from" value={from() ?? ''} />
      <FormSection
        title="Borrow a wall"
        lede="One packed biome's wall column copied over another's. The tiles are copied rather
          than shared, so each biome's sheet still holds everything it draws."
      >
        <Combobox
          label="Wall from"
          required
          value={from()}
          options={biomeOptions()}
          onChange={(value) => {
            setFrom(value);
          }}
          hint="A biome whose wall is already packed and never cycles a palette."
        />
        <TextArea
          label="Onto"
          name="biomes"
          value={biomes()}
          onChange={(value) => {
            setBiomes(value);
          }}
          hint="Biome numbers, separated by spaces or commas."
          rows={3}
        />
        <FormActions note="Rewrites each biome's atlas and its description in place.">
          <Button type="submit" tone="primary" disabled={!ready()}>
            {grafting.pending ? 'Grafting…' : 'Graft'}
          </Button>
        </FormActions>
        <Status message={refusalOf(grafting.error)} tone="alert" />
        <Show when={grafting.result}>
          {(done) => (
            <>
              <Written
                paths={done().written}
                drawings={done().grafted.map((one) => one.drawing)}
                note={`${done().lent} over ${done().grafted.length} biomes.`}
              />
              <Note>
                {done()
                  .grafted.map((one) => `${one.biome}: ${one.was}, ${one.tiles} tiles`)
                  .join(' · ')}
              </Note>
            </>
          )}
        </Show>
      </FormSection>
    </form>
  );
}
