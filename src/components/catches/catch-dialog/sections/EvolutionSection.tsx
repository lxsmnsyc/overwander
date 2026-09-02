import { EvolutionCondition, describeEvolutionMethod } from '../describe';

import type { EvolutionOption } from '../../../../auth/evolution';

import type { Species } from '../../../../data/ids/species';

import { getSpeciesData } from '../../../../data/species';

import SpeciesCoat from '../../../sprites/SpeciesCoat';

import { SpriteAnim } from '../../../../data/ids/sprite-anims';

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
  /**
   * Whether the pokemon whose sheet this is sparkles. What it turns
   * into sparkles with it, so the row asks the dex about that coat
   * rather than the ordinary one
   */
  shiny: boolean;
  /** What the reader's dex has met and kept, which decides the picture */
  dexKnows: (species: Species) => { met: boolean; owned: boolean; shiny: boolean };
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
            {(option) => {
              const becomes = (): Species => option().evolution.species;
              const known = (): { met: boolean; owned: boolean; shiny: boolean } =>
                props.dexKnows(becomes());

              return (
                <ListRow
                  class="items-center gap-3"
                  // The shorthand on the row spelled out,
                  // for anyone who stops on it and for
                  // anything that reads it aloud
                  title={describeEvolutionMethod(option().evolution)}
                >
                  {/* What it turns into, drawn rather than named, and
                      drawn to what the reader has earned of it the way
                      the dex draws one: a line whose end they have
                      never met is a shape rather than a spoiler.

                      Fitted to a square rather than drawn at a
                      multiple of the sheet. A pokemon is whatever size
                      it was drawn at, so a branching line sized by its
                      own sheets came out a different height on every
                      row, with the condition beside it in a different
                      place each time */}
                  <span class="flex size-16 shrink-0 items-center justify-center">
                    <SpeciesCoat
                      species={becomes()}
                      met={known().met}
                      // A shiny sheet asks about the shiny coat. Having
                      // owned an ordinary Pidgeotto is no reason to show
                      // a reader the sparkling one they have never held
                      revealed={props.shiny ? known().shiny : known().owned}
                      // The sparkling coat is drawn only once it is
                      // earned. A shadow is the shape with the colour
                      // taken out, so an unearned one is the ordinary
                      // sheet blacked out rather than a shiny sheet
                      // fetched to be hidden
                      shiny={props.shiny && known().shiny}
                      called={props.shiny ? `${getSpeciesData(becomes()).name}, shiny` : undefined}
                      // Standing the way the pokemon above it stands:
                      // the row is a sum with that picture, and two of
                      // them facing different ways read as two
                      // unrelated drawings
                      animation={SpriteAnim.Idle}
                      direction="DownLeft"
                      fill
                    />
                  </span>
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
              );
            }}
          </Index>
        </List>
      </DialogSection>
    </Show>
  );
}
