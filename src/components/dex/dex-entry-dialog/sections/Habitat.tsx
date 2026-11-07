import { For, type JSX, Show } from 'solid-js';
import { BIOME_NAMES } from '../../../../data/biome';
import type { Items } from '../../../../data/ids/items';
import type { Species } from '../../../../data/ids/species';
import { getItemData, getSpeciesFossil } from '../../../../data/items';
import { Badge, DialogSection, Hint, HintList, List, ListRow, Note } from '../../../styled';
import { describeLairs, groupHabitats, townHours } from '../species-facts';
import { m } from '../../../../i18n/paraglide/messages.js';

/** The rock it comes out of, or the two halves that make one */
function nameFossils(fossils: Items[]): string {
  const names: string[] = [];

  for (const fossil of fossils) {
    names.push(getItemData(fossil).name);
  }
  return names.join(m.dex_fossil_and());
}

/** Where it lives: its lair, the biomes and hours it walks, and towns */
export default function Habitat(props: { species: Species }): JSX.Element {
  return (
    <DialogSection
      title={m.dex_habitat()}
      hint={
        <Hint title={m.dex_habitat_help()}>
          <HintList>
            <li>{m.dex_habitat_help_biomes()}</li>
            <li>{m.dex_habitat_help_towns()}</li>
            <li>{m.dex_habitat_help_lairs()}</li>
          </HintList>
        </Hint>
      }
    >
      <Show
        when={
          groupHabitats(props.species).length ||
          townHours(props.species).length ||
          describeLairs(props.species).length
        }
        fallback={
          // Nowhere at all is the answer for two kinds of species, and
          // they are not the same answer: one is extinct and comes out
          // of a rock, and the other simply is not staged anywhere yet
          <Show
            when={getSpeciesFossil(props.species)}
            fallback={<Note>{m.dex_habitat_none()}</Note>}
          >
            {(fossils) => <Note>{m.dex_extinct({ fossils: nameFossils(fossils()) })}</Note>}
          </Show>
        }
      >
        <List>
          {/* The place it is at home in, first: a player who came to
              this entry for a legendary came for the name of the lair
              rather than for the odds of walking into one */}
          <For each={describeLairs(props.species)}>
            {(lair) => (
              <ListRow class="flex-col items-start gap-0.5 sm:flex-row sm:items-center">
                <span class="grow text-left font-medium">{lair.name}</span>
                <span class="flex flex-wrap justify-end gap-1">
                  <Badge tone="tide">{m.dex_lair()}</Badge>
                  <For each={lair.where}>{(biome) => <Badge>{biome}</Badge>}</For>
                </span>
              </ListRow>
            )}
          </For>
          <For each={groupHabitats(props.species)}>
            {(place) => (
              <ListRow class="flex-col items-start gap-0.5 sm:flex-row sm:items-center">
                <span class="grow text-left font-medium">
                  {place.biome == null ? m.dex_all_biomes() : BIOME_NAMES[place.biome]}
                </span>
                <span class="flex flex-wrap justify-end gap-1">
                  <For each={place.hours}>{(hour) => <Badge>{hour}</Badge>}</For>
                </span>
              </ListRow>
            )}
          </For>
          <Show when={townHours(props.species).length}>
            <ListRow class="flex-col items-start gap-0.5 sm:flex-row sm:items-center">
              <span class="grow text-left font-medium">{m.dex_towns()}</span>
              <span class="flex flex-wrap justify-end gap-1">
                <For each={townHours(props.species)}>{(hour) => <Badge>{hour}</Badge>}</For>
              </span>
            </ListRow>
          </Show>
        </List>
      </Show>
    </DialogSection>
  );
}
