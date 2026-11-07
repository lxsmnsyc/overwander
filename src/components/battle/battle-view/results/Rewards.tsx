import { For, type JSX, Show } from 'solid-js';
import type { CandyEarned } from '../../../../auth/battles';
import { AWARD_NAMES } from '../../../../data/awards';
import { getItemData } from '../../../../data/items';
import { getFamilyName, getSpeciesData } from '../../../../data/species';
import type { Spoils } from '../../../app/game-context';
import ItemSprite from '../../../items/ItemSprite';
import { AwardArt } from '../../../profile/AwardsCard';
import CandySprite from '../../../sprites/CandySprite';
import { formatNumber } from '../../../../i18n/format';
import { m } from '../../../../i18n/paraglide/messages.js';
import UnitArt from './UnitArt';

/** How far after the screen opens the first pill pops in, and the step between pills */
const FIRST_POP = 300;
const POP_STEP = 60;

/**
 * A pill that pops in on a spring, `at` places after the first. Under
 * reduce motion the delay goes and it fades
 */
function Pill(props: {
  at: number;
  tone: string;
  art?: JSX.Element;
  children: JSX.Element;
}): JSX.Element {
  return (
    <li
      class={`motion-crossfade flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]
        font-extrabold animate-[grow-in_var(--motion-move)_var(--ease-spring)_backwards]
        ${props.tone}`}
      style={{ 'animation-delay': `${FIRST_POP + props.at * POP_STEP}ms` }}
    >
      <Show when={props.art}>
        <span class="flex size-6 shrink-0 items-center justify-center">{props.art}</span>
      </Show>
      {props.children}
    </li>
  );
}

/** Whether the fight paid anything to lay out */
export function hasRewards(spoils: Spoils | null, candy: CandyEarned[]): boolean {
  return (
    candy.length > 0 ||
    (spoils != null &&
      (spoils.gold !== 0 ||
        spoils.award != null ||
        spoils.items.length > 0 ||
        spoils.waiting != null ||
        spoils.seat != null))
  );
}

/**
 * What the fight paid, as a row of pills under the result: the seat, the
 * gold, an award, the items and the candy, with what is waiting in the
 * overworld on a line under them
 */
export default function Rewards(props: {
  spoils: Spoils | null;
  candy: CandyEarned[];
}): JSX.Element {
  // Each pill's place in the row, so they pop in one after another
  const goldAt = (): number => (props.spoils?.seat == null ? 0 : 1);
  const awardAt = (): number => goldAt() + (props.spoils?.gold ? 1 : 0);
  const itemsAt = (): number => awardAt() + (props.spoils?.award == null ? 0 : 1);
  const candyAt = (): number => itemsAt() + (props.spoils?.items.length ?? 0);

  return (
    <section class="flex flex-col items-center gap-2">
      <h2 class="sr-only">{m.verdict_rewards()}</h2>
      <ul class="m-0 flex list-none flex-row flex-wrap justify-center gap-2 p-0">
        <Show when={props.spoils?.seat}>
          {(seat) => (
            <Pill
              at={0}
              tone={
                seat() === 'freed' ? 'bg-leaf-soft text-leaf-dark' : 'bg-ember-soft text-ember-dark'
              }
            >
              {seat() === 'freed' ? m.verdict_seat_open() : m.verdict_seat_held()}
            </Pill>
          )}
        </Show>
        <Show when={props.spoils != null && props.spoils.gold !== 0}>
          <Pill
            at={goldAt()}
            tone={
              (props.spoils?.gold ?? 0) > 0
                ? 'bg-gold-soft text-gold-dark'
                : 'bg-ember-soft text-ember-dark'
            }
          >
            {m.verdict_gold({
              amount: `${(props.spoils?.gold ?? 0) > 0 ? '+' : '−'}${formatNumber(Math.abs(props.spoils?.gold ?? 0))}`,
            })}
          </Pill>
        </Show>
        <Show when={props.spoils?.award}>
          {(award) => (
            <Pill
              at={awardAt()}
              tone="bg-paper text-ink"
              art={<AwardArt award={award()} size={24} />}
            >
              {AWARD_NAMES[award()]}
            </Pill>
          )}
        </Show>
        <For each={props.spoils?.items ?? []}>
          {(stack, at) => (
            <Pill
              at={itemsAt() + at()}
              tone="bg-paper text-ink"
              art={<ItemSprite item={stack.item} size={24} label="" />}
            >
              {getItemData(stack.item).name}
              {stack.amount > 1 ? ` ×${stack.amount}` : ''}
            </Pill>
          )}
        </For>
        <For each={props.candy}>
          {(pile, at) => (
            <Pill
              at={candyAt() + at()}
              tone="bg-leaf-soft text-leaf-dark"
              art={<CandySprite family={pile.family} size={24} label="" />}
            >
              {m.battle_candy_earned({ count: pile.count, family: getFamilyName(pile.family) })}
            </Pill>
          )}
        </For>
      </ul>
      <Show when={props.spoils?.waiting}>
        {(species) => (
          <p class="m-0 flex items-center gap-1.5 text-sm text-white/85">
            <UnitArt species={species()} shiny={false} female={false} fainted={false} />
            {m.verdict_waiting({ species: getSpeciesData(species()).name })}
          </p>
        )}
      </Show>
    </section>
  );
}
