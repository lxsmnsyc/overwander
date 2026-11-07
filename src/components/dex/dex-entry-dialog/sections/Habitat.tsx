import { For, type JSX, Show } from 'solid-js';
import { BIOME_NAMES } from '../../../../data/biome';
import type { Items } from '../../../../data/ids/items';
import type { Species } from '../../../../data/ids/species';
import { getItemData, getSpeciesFossil } from '../../../../data/items';
import { CARD, CARD_TITLE, Hint, HintList, Note, riseAfter } from '../../../styled';
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

/** A place's row: its name, then what is said about it as pills */
const PLACE =
  'flex flex-wrap items-center gap-1.5 border-b-2 border-line-soft/70 py-1.5 text-xs font-bold' +
  ' last:border-b-0';

/** A small pill of fact: an hour, a biome */
const PILL =
  'inline-flex h-6 items-center rounded-full bg-line-soft px-2.5 text-[11px] font-extrabold';

/** Where it lives: its lair, the biomes and hours it walks, and towns */
export default function Habitat(props: { species: Species }): JSX.Element {
  return (
    <section class={`${CARD} min-h-0 md:flex-1`} style={riseAfter(4)}>
      <span class="flex items-center gap-1.5">
        <h3 class={CARD_TITLE}>{m.dex_habitat()}</h3>
        <Hint title={m.dex_habitat_help()}>
          <HintList>
            <li>{m.dex_habitat_help_biomes()}</li>
            <li>{m.dex_habitat_help_towns()}</li>
            <li>{m.dex_habitat_help_lairs()}</li>
          </HintList>
        </Hint>
      </span>
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
        <ul class="m-0 flex min-h-0 list-none flex-col overflow-y-auto p-0">
          {/* The place it is at home in, first: a player who came to this
              entry for a legendary came for the name of the lair rather
              than for the odds of walking into one */}
          <For each={describeLairs(props.species)}>
            {(lair) => (
              <li class={PLACE}>
                <span class={`${PILL} bg-arcane/15 text-arcane-dark`}>{m.dex_lair()}</span>
                <span>{lair.name}</span>
                <For each={lair.where}>{(biome) => <span class={PILL}>{biome}</span>}</For>
              </li>
            )}
          </For>
          <For each={groupHabitats(props.species)}>
            {(place) => (
              <li class={PLACE}>
                <span>{place.biome == null ? m.dex_all_biomes() : BIOME_NAMES[place.biome]}</span>
                <For each={place.hours}>{(hour) => <span class={PILL}>{hour}</span>}</For>
              </li>
            )}
          </For>
          <Show when={townHours(props.species).length}>
            <li class={PLACE}>
              <span>{m.dex_towns()}</span>
              <For each={townHours(props.species)}>
                {(hour) => <span class={PILL}>{hour}</span>}
              </For>
            </li>
          </Show>
        </ul>
      </Show>
    </section>
  );
}
