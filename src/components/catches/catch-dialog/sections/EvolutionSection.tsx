import { EvolutionCondition, describeEvolutionMethod } from '../describe';

import type { EvolutionOption } from '../../../../auth/evolution';

import type { Species } from '../../../../data/ids/species';

import { getSpeciesData } from '../../../../data/species';

import SpeciesCoat from '../../../sprites/SpeciesCoat';

import { SpriteAnim } from '../../../../data/ids/sprite-anims';

import { Button, Note } from '../../../styled';
import { CARD, CARD_TITLE } from '../metrics';

import { Index, type JSX, Show } from 'solid-js';
import { m } from '../../../../i18n/paraglide/messages.js';

/**
 * Everything it could ever become, with the ones it cannot become yet
 * left in and refused: the sheet is also where a player finds out what
 * they are working towards.
 */
export interface EvolutionSectionProps {
  /** What it is now, drawn at the top of the line */
  species: Species;
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
  /** Whether it is female, so what it turns into is drawn as she would be */
  female: boolean;
  /** What the reader's dex has met and kept, which decides the picture */
  dexKnows: (species: Species) => { met: boolean; owned: boolean; shiny: boolean };
  onEvolve: (species: Species) => void;
  /** Where the card stands and when it rises */
  class?: string;
  style?: JSX.CSSProperties;
}

/** How large each pokemon on the line is drawn */
const PICTURE = 'flex size-16 shrink-0 items-center justify-center rounded-2xl';

/** The arrow between two pokemon on the line */
function Arrow(): JSX.Element {
  return (
    <span aria-hidden="true" class="flex flex-col items-center">
      <span class="h-4 w-0.5 bg-line" />
      <span class="border-x-[5px] border-t-[6px] border-x-transparent border-t-line" />
    </span>
  );
}

export default function EvolutionSection(props: EvolutionSectionProps): JSX.Element {
  return (
    // Drawn once the answer is in, so a line still loading is not
    // briefly told it has nowhere to go. A sheet that cannot ask (one
    // that is not the reader's) has no card here at all
    <Show when={props.options != null}>
      <section class={`${CARD} ${props.class ?? ''}`} style={props.style}>
        <Show
          when={props.options?.length}
          fallback={
            <Note class="flex flex-1 items-center justify-center text-center">
              {m.catch_evolution_none()}
            </Note>
          }
        >
          <h3 class={CARD_TITLE}>{m.catch_evolves_into()}</h3>
          {/* A line down from what it is now to everything it could
              become; a line with many branches scrolls with its column */}
          <div class="flex flex-col items-center gap-1.5">
            <span class={PICTURE}>
              <SpeciesCoat
                species={props.species}
                met
                revealed
                shiny={props.shiny}
                female={props.female}
                animation={SpriteAnim.Idle}
                direction="DownLeft"
                fill
              />
            </span>
            <span class="text-xs font-extrabold">{getSpeciesData(props.species).name}</span>
            {/* `Index` rather than `For`: the list is re-read after
                everything this sheet writes, and each read hands back
                fresh objects, so a keyed-by-value list throws every row
                away and builds it again, sprite and all, when what
                actually changed is a flag on one of them. What a line
                evolves into does not move; only whether it can yet */}
            <Index each={props.options}>
              {(option) => {
                const becomes = (): Species => option().evolution.species;
                const known = (): { met: boolean; owned: boolean; shiny: boolean } =>
                  props.dexKnows(becomes());

                return (
                  <>
                    <Arrow />
                    <div
                      class="flex w-full flex-col items-center gap-1 text-center"
                      // The shorthand under the picture spelled out, for
                      // anyone who stops on it and for anything that
                      // reads it aloud
                      title={describeEvolutionMethod(
                        option().evolution,
                        option().covered,
                        option().progress,
                      )}
                    >
                      {/* What it turns into, drawn to what the reader has
                          earned of it the way the dex draws one: a line
                          whose end they have never met is a shape rather
                          than a spoiler. Ringed in green once it is in
                          reach */}
                      <span
                        class={`${PICTURE} ${option().available ? 'bg-leaf-soft ring-4 ring-leaf/25' : ''}`}
                      >
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
                          female={props.female}
                          called={
                            props.shiny
                              ? m.catch_shiny_name({ name: getSpeciesData(becomes()).name })
                              : undefined
                          }
                          // Standing the way the pokemon above it stands,
                          // met or not
                          animation={SpriteAnim.Idle}
                          unmet={SpriteAnim.Idle}
                          direction="DownLeft"
                          fill
                        />
                      </span>
                      {/* Named only once it has been met */}
                      <Show when={known().met}>
                        <span class="text-xs font-extrabold">{getSpeciesData(becomes()).name}</span>
                      </Show>
                      {/* The condition stays under the picture rather than
                          hiding on the button: it is what the player is
                          working towards. Once a handover has settled it
                          there is nothing left to work towards */}
                      <Show
                        when={!option().covered}
                        fallback={
                          <span class="text-xs font-extrabold text-leaf-dark">
                            {m.catch_evolution_ready()}
                          </span>
                        }
                      >
                        <span class="flex flex-wrap items-center justify-center gap-1 text-xs text-muted">
                          <EvolutionCondition
                            evolution={option().evolution}
                            progress={option().progress}
                          />
                        </span>
                      </Show>
                      <Show when={props.owned}>
                        <Button
                          tone="primary"
                          class="w-full justify-center"
                          disabled={props.frozen || !option().available}
                          onClick={() => {
                            props.onEvolve(option().evolution.species);
                          }}
                        >
                          {m.catch_evolve()}
                        </Button>
                      </Show>
                    </div>
                  </>
                );
              }}
            </Index>
          </div>
        </Show>
      </section>
    </Show>
  );
}
