import { For, type JSX, Show } from 'solid-js';
import type { Species } from '../../../../data/ids/species';
import { SpriteAnim } from '../../../../data/ids/sprite-anims';
import { getSpeciesData, listEvolutionLine } from '../../../../data/species';
import {
  EvolutionCondition,
  describeEvolutionMethod,
} from '../../../catches/catch-dialog/describe';
import SpeciesCoat from '../../../sprites/SpeciesCoat';
import { CARD, CARD_TITLE, Hint, HintList, TooltipHost, riseAfter } from '../../../styled';
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

/**
 * Every stage of the line down a card, what each takes written between
 * them, the other stages opening their own entry
 */
export default function EvolutionLine(props: EvolutionLineProps): JSX.Element {
  /** A stage's name, or ??? until the reader has met it */
  const named = (species: Species): string =>
    props.dexKnows(species).met ? getSpeciesData(species).name : '???';

  return (
    <section class={`${CARD} min-h-0 gap-1 md:flex-1`} style={riseAfter(1)}>
      <span class="flex items-center gap-1.5">
        <h3 class={CARD_TITLE}>{m.dex_line()}</h3>
        <Hint title={m.dex_line_help()}>
          <HintList>
            <li>{m.dex_line_help_hover()}</li>
            <li>{m.dex_line_help_press()}</li>
            <li>{m.dex_line_help_unmet()}</li>
          </HintList>
        </Hint>
      </span>
      {/* A long branching line scrolls inside its own card */}
      <ul class="m-0 flex min-h-0 list-none flex-col gap-0.5 overflow-y-auto p-0">
        <For each={listEvolutionLine(props.species)}>
          {(stage) => (
            <li
              class="flex flex-col gap-0.5"
              style={{ 'padding-left': `${Math.max(0, stage.depth - 1) * 14}px` }}
            >
              {/* What it takes, between the stage before and this one */}
              <Show when={stage.from}>
                {(from) => (
                  <span class="pl-[2.875rem] text-[11px] text-muted">
                    ↓ {describeEvolutionMethod(from())}
                  </span>
                )}
              </Show>
              {/* The condition in full is on the tooltip */}
              <TooltipHost
                class="block"
                name={named(stage.species)}
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
                <Show
                  when={stage.species !== props.species}
                  fallback={
                    <span
                      aria-current="page"
                      class="flex items-center gap-2 rounded-button border-2 border-tide bg-tide-soft
                        px-2 py-1 text-[13px] font-extrabold"
                    >
                      <StageSprite species={stage.species} knows={props.dexKnows(stage.species)} />
                      <span class="truncate">{props.name}</span>
                    </span>
                  }
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 rounded-button border-2 border-transparent
                      bg-transparent px-2 py-1 text-left text-[13px] font-extrabold text-ink shadow-none
                      transition-colors hover:bg-line-soft active:translate-y-0"
                    onClick={() => {
                      props.onSpecies(stage.species);
                    }}
                  >
                    <StageSprite species={stage.species} knows={props.dexKnows(stage.species)} />
                    <span class="truncate">{named(stage.species)}</span>
                  </button>
                </Show>
              </TooltipHost>
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}

/** A stage's small picture, a silhouette until it is owned */
function StageSprite(props: { species: Species; knows: DexKnows }): JSX.Element {
  return (
    // Centred in its square: a sheet whose cell is not square is fitted
    // by its longer side and would otherwise sit against one edge
    <span class="flex size-[30px] shrink-0 items-center justify-center">
      <SpeciesCoat
        species={props.species}
        met={props.knows.met}
        revealed={props.knows.owned}
        centred
        animation={SpriteAnim.Idle}
        unmet={SpriteAnim.Idle}
        direction="DownLeft"
        fill
      />
    </span>
  );
}
