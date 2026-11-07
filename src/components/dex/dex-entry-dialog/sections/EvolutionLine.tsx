import { For, type JSX, Show } from 'solid-js';
import type { Species } from '../../../../data/ids/species';
import { SpriteAnim } from '../../../../data/ids/sprite-anims';
import { getSpeciesData, listEvolutionLine } from '../../../../data/species';
import {
  EvolutionCondition,
  describeEvolutionMethod,
} from '../../../catches/catch-dialog/describe';
import SpeciesCoat from '../../../sprites/SpeciesCoat';
import { ArrowRightIcon } from '../../../icons';
import { Hint, HintList, TooltipHost } from '../../../styled';
import { m } from '../../../../i18n/paraglide/messages.js';

/** What the reader's dex says about one species */
export interface DexKnows {
  met: boolean;
  owned: boolean;
  shiny: boolean;
}

export interface EvolutionLineProps {
  species: Species;
  name: string;
  dexKnows: (species: Species) => DexKnows;
  onSpecies: (species: Species) => void;
}

/** Every stage of the line, the other stages opening their own entry */
export default function EvolutionLine(props: EvolutionLineProps): JSX.Element {
  return (
    <section class="flex min-h-0 w-full flex-1 flex-col gap-1 border-t border-line-soft pt-2">
      <span class="flex items-center gap-1.5">
        <h3 class="text-left">{m.dex_line()}</h3>
        <Hint title={m.dex_line_help()}>
          <HintList>
            <li>{m.dex_line_help_hover()}</li>
            <li>{m.dex_line_help_press()}</li>
            <li>{m.dex_line_help_unmet()}</li>
          </HintList>
        </Hint>
      </span>
      {/* A long branching line scrolls inside its own box */}
      <ul class="m-0 flex min-h-0 list-none flex-col gap-1 overflow-y-auto p-0">
        <For each={listEvolutionLine(props.species)}>
          {(stage) => (
            <li
              class={`flex items-center gap-2 rounded-lg px-1 text-left text-sm ${
                stage.species === props.species ? 'bg-tide-soft' : ''
              }`}
              style={{ 'padding-left': `${stage.depth * 12 + 4}px` }}
            >
              {/* What it takes is on the tooltip, so the line stays one
                  name a row */}
              <TooltipHost
                class="flex min-w-0 items-center gap-2"
                name={
                  props.dexKnows(stage.species).met ? getSpeciesData(stage.species).name : '???'
                }
                description={
                  stage.from == null ? m.dex_line_start() : describeEvolutionMethod(stage.from)
                }
                extra={() => (
                  <Show when={stage.from}>
                    {(from) => (
                      <span class="text-xs">
                        <EvolutionCondition evolution={from()} />
                      </span>
                    )}
                  </Show>
                )}
              >
                <Show when={stage.depth > 0}>
                  <ArrowRightIcon class="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                </Show>
                {/* Centred in its square: a sheet whose cell is not square
                    is fitted by its longer side and would otherwise sit
                    against one edge, leaving a gap before the name */}
                <span class="flex size-9 shrink-0 items-center justify-center">
                  <SpeciesCoat
                    species={stage.species}
                    met={props.dexKnows(stage.species).met}
                    revealed={props.dexKnows(stage.species).owned}
                    centred
                    animation={SpriteAnim.Idle}
                    unmet={SpriteAnim.Idle}
                    direction="DownLeft"
                    fill
                  />
                </span>
                <span class="flex min-w-0 flex-col">
                  <Show
                    when={stage.species !== props.species}
                    fallback={<span class="truncate font-bold">{props.name}</span>}
                  >
                    <button
                      type="button"
                      class="truncate border-0 bg-transparent p-0 text-left text-sm font-medium
                        text-ink shadow-none hover:text-tide-dark"
                      onClick={() => {
                        props.onSpecies(stage.species);
                      }}
                    >
                      {props.dexKnows(stage.species).met
                        ? getSpeciesData(stage.species).name
                        : '???'}
                    </button>
                  </Show>
                </span>
              </TooltipHost>
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}
