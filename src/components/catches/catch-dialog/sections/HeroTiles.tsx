import { CARD_TITLE, tint } from '../metrics';

import type { CaughtPokemon } from '../../../../auth/caught';
import { MAX_LEVEL } from '../../../../data/constants/levels';
import { TYPE_COLORS, TYPE_NAMES } from '../../../../data/constants/types';
import { getFamilyName, getSpeciesData } from '../../../../data/species';
import { teraTypeOf } from '../../../../data/species/tera-type';

import CandySprite from '../../../sprites/CandySprite';
import TypeBadge from '../../../sprites/TypeBadge';
import { Badge, Button } from '../../../styled';

import { type JSX, Show } from 'solid-js';
import { m } from '../../../../i18n/paraglide/messages.js';

/**
 * The two things raised from the top of the sheet: its tera type, and
 * its candy with the level it buys.
 */
export interface HeroTilesProps {
  caught: CaughtPokemon;
  /** Whether the reader owns it, which is who may spend the candy */
  owned: boolean;
  /** The pile as the sheet shows it, or null where it could not be read */
  candies: number | null;
  /** The level as the sheet shows it, presses and all */
  level: number;
  /** What the next level costs */
  cost: number;
  /** Whether Level Up is held back (too few candies, at the cap, waiting on an answer, frozen) */
  held: boolean;
  onFeed: () => void;
}

/**
 * A candy's art is a 16px picture centred in a 32px cell, so the margin
 * is pulled in to keep a badge as tight as its text
 */
const CANDY_BADGE = '-m-2';

export default function HeroTiles(props: HeroTilesProps): JSX.Element {
  const family = (): number => getSpeciesData(props.caught.species).family;

  return (
    <>
      <div
        class="flex min-w-24 flex-col items-center justify-center gap-1 rounded-[16px] border-2 px-3.5 py-2"
        style={{
          background: tint(TYPE_COLORS[teraTypeOf(props.caught)], 14),
          'border-color': tint(TYPE_COLORS[teraTypeOf(props.caught)], 45),
        }}
      >
        <span class={CARD_TITLE}>{m.catch_tera_type()}</span>
        <span class="flex items-center gap-1.5 font-display text-[17px] font-semibold">
          <TypeBadge type={teraTypeOf(props.caught)} size={18} />
          {TYPE_NAMES[teraTypeOf(props.caught)]}
        </span>
      </div>

      <div class="flex flex-col justify-center gap-1.5 rounded-[16px] border-2 border-gold/60 bg-gold-soft px-2.5 py-2">
        <span class="flex items-center gap-1 text-xs font-extrabold text-gold-dark">
          <CandySprite family={family()} label="" class={CANDY_BADGE} />
          <span class="tabular-nums">
            {m.catch_candy_held({
              count: props.candies ?? '?',
              family: getFamilyName(family()),
            })}
          </span>
        </span>
        {/* The level and what raises it are one control: where it
            stands and what the next step costs. Presses are gathered and
            sent together once they stop */}
        <Show when={props.owned}>
          <Button tone="primary" disabled={props.held} onClick={props.onFeed}>
            {props.level >= MAX_LEVEL ? (
              m.catch_level({ level: props.level })
            ) : (
              <>
                {m.catch_level_up()}
                {/* The cost in candy, drawn, as a badge on the button */}
                <Badge tone="gold">
                  <CandySprite
                    family={family()}
                    label={m.tooltip_kind_candy()}
                    class={CANDY_BADGE}
                  />
                  x {props.cost}
                </Badge>
              </>
            )}
          </Button>
        </Show>
      </div>
    </>
  );
}
