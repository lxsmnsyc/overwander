import type { CaughtPokemon } from '../../../../auth/caught';
import { catchAura, isShiny } from '../../../../model/caught-record';

import { isEgg } from '../../../../model/egg';

import { BALL_ITEMS } from '../../../../data/ids/items';
import { Genders, Species } from '../../../../data/ids/species';
import { SpriteAnim } from '../../../../data/ids/sprite-anims';

import { describeItem } from '../../../details';
import ItemSprite from '../../../items/ItemSprite';
import AnimatedSprite from '../../../sprites/AnimatedSprite';

import type { JSX } from 'solid-js';

/**
 * The pokemon itself, stood on the safari's field the way a summary
 * screen shows it, with the ball it sits in on the corner. An egg is
 * drawn as an egg.
 */
export interface PortraitSectionProps {
  caught: CaughtPokemon;
  /** What it is called, which is its nickname or its species */
  named: string;
}

/** How large the ball on the corner is drawn */
const BALL = 28;

export default function PortraitSection(props: PortraitSectionProps): JSX.Element {
  return (
    <div class="relative h-28 w-32 shrink-0 md:h-[150px] md:w-[220px]">
      {/* The field is a layer of its own, clipped to its corners, so the
          pokemon standing on it is never clipped with it */}
      <div
        aria-hidden="true"
        class="absolute inset-0 overflow-hidden rounded-card"
        style={{
          background:
            'linear-gradient(var(--field-sky), var(--field-haze) 55%, var(--field-grass) 55%, var(--field-grass-deep))',
        }}
      >
        <span
          class="absolute bottom-2 left-1/2 h-5 w-20 -translate-x-1/2 rounded-[50%]
            shadow-[inset_0_-4px_0_rgb(0_0_0/0.15)] md:bottom-3 md:h-7 md:w-32"
          style={{ background: 'var(--field-base)' }}
        />
      </div>
      <span class="absolute top-1.5 left-1.5 z-10 flex">
        <ItemSprite
          item={BALL_ITEMS[props.caught.ball]}
          size={BALL}
          label={describeItem(BALL_ITEMS[props.caught.ball])}
        />
      </span>
      {/* The room above the base, with a square in it the sprite is
          fitted to: its height is the room's, so a tall species is
          shrunk to stand inside the field rather than spill below it */}
      <div class="absolute inset-x-0 top-3 bottom-2.5 flex justify-center md:top-4 md:bottom-4">
        <div class="relative flex aspect-square h-full max-w-full items-end justify-center">
          <AnimatedSprite
            species={isEgg(props.caught) ? Species.Egg : props.caught.species}
            shiny={!isEgg(props.caught) && isShiny(props.caught)}
            female={!isEgg(props.caught) && props.caught.gender === Genders.Female}
            aura={isEgg(props.caught) ? undefined : catchAura(props.caught)}
            animation={SpriteAnim.Idle}
            direction="DownLeft"
            fill
            // An egg has no height of its own to be drawn at
            sized={!isEgg(props.caught)}
            shadow
            label={props.named}
          />
        </div>
      </div>
    </div>
  );
}
