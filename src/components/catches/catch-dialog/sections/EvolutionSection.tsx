import { EvolutionCondition, describeEvolutionMethod } from '../describe';

import type { EvolutionOption } from '../../../../auth/evolution';

import type { Species } from '../../../../data/ids/species';

import SpeciesCoat from '../../../sprites/SpeciesCoat';

import { Button, DialogSection, List, ListRow } from '../../../styled';

import { Index, type JSX, Show } from 'solid-js';

/**
 * Everything it could ever become, with the ones it cannot become yet
 * left in and refused: the sheet is also where a player finds out what
 * they are working towards.
 */
export interface EvolutionSectionProps {
  /** What this line offers, and whether each is within reach */
  options: EvolutionOption[] | undefined;
  owned: boolean;
  frozen: boolean;
  /** What the reader's dex has met and kept, which decides the picture */
  dexKnows: (species: Species) => { met: boolean; owned: boolean };
  onEvolve: (species: Species) => void;
}

export default function EvolutionSection(props: EvolutionSectionProps): JSX.Element {
  return (
<Show when={props.options?.length}>
  <DialogSection title="Evolution">
    {/* `items-center`: a row is as wide as what it
        says, and stands in the middle of the sheet.
        Stretched, the button ended up an inch of
        empty paper away from the picture it acts on,
        which reads as belonging to nothing */}
    <List class="items-center">
      {/* `Index` rather than `For`: the list is
          re-read after everything this sheet writes,
          and each read hands back fresh objects — so
          a keyed-by-value list throws every row away
          and builds it again, sprite and all, when
          what actually changed is a flag on one of
          them. What a line evolves into does not
          move; only whether it can yet */}
      <Index each={props.options}>
        {(option) => (
          <ListRow
            class="items-center gap-3"
            // The shorthand on the row spelled out,
            // for anyone who stops on it and for
            // anything that reads it aloud
            title={describeEvolutionMethod(option().evolution)}
          >
            {/* What it turns into, drawn rather than
                named — and drawn to what the reader
                has earned of it, the way the dex
                draws one. A line whose end they have
                never met is a shape rather than a
                spoiler, which is the whole reason a
                dex is worth filling in */}
            <div class="flex items-end justify-start">
              <SpeciesCoat
                species={option().evolution.species}
                met={props.dexKnows(option().evolution.species).met}
                revealed={props.dexKnows(option().evolution.species).owned}
                scale={2}
              />
            </div>
            {/* The condition reads as a sum with the
                picture: that shape, plus a trade.
                It stays on the row rather than
                hiding on the button, because it is
                what the player is working towards
                and they need it whether or not they
                are about to press anything */}
            <span class="flex items-center gap-1 text-muted">
              <span>+</span>
              <EvolutionCondition evolution={option().evolution} />
            </span>
            <Show when={props.owned}>
              <Button
                tone="primary"
                disabled={props.frozen || !option().available}
                onClick={() => {
                  props.onEvolve(option().evolution.species);
                }}
              >
                Evolve
              </Button>
            </Show>
          </ListRow>
        )}
      </Index>
    </List>
  </DialogSection>
</Show>
  );
}
