import { EvolutionCondition, describeEvolutionMethod } from '../describe';

import type { EvolutionOption } from '../../../../auth/evolution';

import { speciesDexNumber } from '../../../../data/ids/forms';
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

/** How large an option is drawn when the line branches into rows */
const ROW_PICTURE = 'flex size-10 shrink-0 items-center justify-center rounded-xl';

/** The arrow between two pokemon on the line */
function Arrow(): JSX.Element {
  return (
    <span aria-hidden="true" class="flex flex-col items-center">
      <span class="h-4 w-0.5 bg-line" />
      <span class="border-x-[5px] border-t-[6px] border-x-transparent border-t-line" />
    </span>
  );
}

/** What the reader's dex says about one species */
type Known = { met: boolean; owned: boolean; shiny: boolean };

/**
 * What it turns into, drawn to what the reader has earned of it the way
 * the dex draws one: a line whose end they have never met is a shape
 * rather than a spoiler
 */
function OptionCoat(props: {
  species: Species;
  known: Known;
  shiny: boolean;
  female: boolean;
}): JSX.Element {
  return (
    <SpeciesCoat
      species={props.species}
      met={props.known.met}
      // A shiny sheet asks about the shiny coat. Having owned an
      // ordinary Pidgeotto is no reason to show a reader the sparkling
      // one they have never held
      revealed={props.shiny ? props.known.shiny : props.known.owned}
      // The sparkling coat is drawn only once it is earned. A shadow is
      // the shape with the colour taken out, so an unearned one is the
      // ordinary sheet blacked out rather than a shiny sheet fetched to
      // be hidden
      shiny={props.shiny && props.known.shiny}
      female={props.female}
      called={
        props.shiny ? m.catch_shiny_name({ name: getSpeciesData(props.species).name }) : undefined
      }
      // Standing the way the pokemon above it stands, met or not
      animation={SpriteAnim.Idle}
      unmet={SpriteAnim.Idle}
      direction="DownLeft"
      fill
    />
  );
}

/**
 * What the option asks for, or "ready" once a handover has settled it.
 * It stays beside the picture rather than hiding on the button: it is
 * what the player is working towards
 */
function OptionCondition(props: { option: EvolutionOption; class: string }): JSX.Element {
  return (
    <Show
      when={!props.option.covered}
      fallback={
        <span class="text-xs font-extrabold text-leaf-dark">{m.catch_evolution_ready()}</span>
      }
    >
      <span
        // The condition's own row wraps between its parts rather than
        // squeezing each into a column of its own
        class={`flex flex-wrap items-center gap-1 text-muted [&>span]:flex-wrap
          [&>span]:gap-x-1 [&>span]:gap-y-0 ${props.class}`}
      >
        <EvolutionCondition evolution={props.option.evolution} progress={props.option.progress} />
      </span>
    </Show>
  );
}

export default function EvolutionSection(props: EvolutionSectionProps): JSX.Element {
  /**
   * Whether every option keeps it the same pokemon in another shape
   * (Ogerpon's masks, Rotom's appliances, Deoxys' formes): a form is
   * numbered under its species' own dex number
   */
  const forms = (): boolean => {
    const own = speciesDexNumber(props.species);

    for (const option of props.options ?? []) {
      if (speciesDexNumber(option.evolution.species) !== own) {
        return false;
      }
    }
    return true;
  };

  const branching = (): boolean => (props.options?.length ?? 0) > 1;

  const evolve = (option: EvolutionOption): void => {
    props.onEvolve(option.evolution.species);
  };

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
          <h3 class={CARD_TITLE}>{forms() ? m.dex_forms() : m.catch_evolves_into()}</h3>
          <Show
            when={branching()}
            fallback={
              // One option: a line down from what it is now to what it becomes
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
                <Arrow />
                <Index each={props.options}>
                  {(option) => (
                    <div
                      class="flex w-full min-w-0 flex-col items-center gap-1 text-center"
                      // The shorthand under the picture spelled out, for
                      // anyone who stops on it and for anything that
                      // reads it aloud
                      title={describeEvolutionMethod(
                        option().evolution,
                        option().covered,
                        option().progress,
                      )}
                    >
                      {/* Ringed in green once it is in reach */}
                      <span
                        class={`${PICTURE} ${option().available ? 'bg-leaf-soft ring-4 ring-leaf/25' : ''}`}
                      >
                        <OptionCoat
                          species={option().evolution.species}
                          known={props.dexKnows(option().evolution.species)}
                          shiny={props.shiny}
                          female={props.female}
                        />
                      </span>
                      {/* Named only once it has been met */}
                      <Show when={props.dexKnows(option().evolution.species).met}>
                        <span class="text-xs font-extrabold break-words">
                          {getSpeciesData(option().evolution.species).name}
                        </span>
                      </Show>
                      <OptionCondition option={option()} class="justify-center text-xs" />
                      <Show when={props.owned}>
                        <Button
                          tone="primary"
                          class="w-full justify-center"
                          disabled={props.frozen || !option().available}
                          onClick={() => {
                            evolve(option());
                          }}
                        >
                          {m.catch_evolve()}
                        </Button>
                      </Show>
                    </div>
                  )}
                </Index>
              </div>
            }
          >
            {/* A line that branches (an Eevee, Rotom's appliances) is a
                row per option, so all eight of an Eevee stand in the
                column at once: the picture, what it asks for, and Evolve.
                `Index` rather than `For`: the list is re-read after
                everything this sheet writes, and each read hands back
                fresh objects, so a keyed list would rebuild every sprite
                when only a flag on one of them changed */}
            <ul class="m-0 flex list-none flex-col gap-0 p-0">
              <Index each={props.options}>
                {(option) => (
                  <li
                    class="flex min-h-8 items-center gap-1.5"
                    title={describeEvolutionMethod(
                      option().evolution,
                      option().covered,
                      option().progress,
                    )}
                  >
                    <span
                      class={`${ROW_PICTURE} -my-1 ${option().available ? 'bg-leaf-soft ring-2 ring-leaf/25' : ''}`}
                    >
                      <OptionCoat
                        species={option().evolution.species}
                        known={props.dexKnows(option().evolution.species)}
                        shiny={props.shiny}
                        female={props.female}
                      />
                    </span>
                    <span class="flex min-w-0 grow flex-col">
                      <Show when={props.dexKnows(option().evolution.species).met}>
                        <span class="truncate text-[11px] leading-3 font-extrabold">
                          {getSpeciesData(option().evolution.species).name}
                        </span>
                      </Show>
                      <OptionCondition option={option()} class="text-[11px] leading-3" />
                    </span>
                    <Show when={props.owned}>
                      <Button
                        tone="primary"
                        class="shrink-0 px-2! py-0.5! text-xs!"
                        disabled={props.frozen || !option().available}
                        onClick={() => {
                          evolve(option());
                        }}
                      >
                        {m.catch_evolve()}
                      </Button>
                    </Show>
                  </li>
                )}
              </Index>
            </ul>
          </Show>
        </Show>
      </section>
    </Show>
  );
}
