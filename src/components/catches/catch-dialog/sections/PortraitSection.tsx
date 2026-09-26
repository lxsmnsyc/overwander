import { healthLeft } from '../describe';

import type { CaughtPokemon } from '../../../../auth/caught';
import { catchAura, isShiny } from '../../../../auth/caught-record';

import { isEgg } from '../../../../auth/egg';

import { getMaxHealth, isFainted } from '../../../../auth/health';
import StatusSquares from '../../StatusSquares';

import getSigil from '../../../../data/constants/sigil';
import { MAX_IV_STARS, getIVStars } from '../../../../data/constants/stats';

import { Genders, Species } from '../../../../data/ids/species';
import { SpriteAnim } from '../../../../data/ids/sprite-anims';

import AnimatedSprite from '../../../sprites/AnimatedSprite';
import { Meta } from '../../../styled';

import { type JSX, Show } from 'solid-js';

/**
 * The pokemon itself: the sprite, how well it rolled and what it has
 * left. An egg is drawn as an egg and says none of the rest.
 */
export interface PortraitSectionProps {
  caught: CaughtPokemon;
  /** What it is called, which is its nickname or its species */
  named: string;
}

export default function PortraitSection(props: PortraitSectionProps): JSX.Element {
  const stars = (): string => {
    const filled = getIVStars(props.caught.ivs);

    return `${'★'.repeat(filled)}${'☆'.repeat(MAX_IV_STARS - filled)}`;
  };

  return (
    <>
      {/* A square the sprite is fitted to, so every species takes the
          same room. It grows into whatever height the column has spare,
          and never below 8rem */}
      <div class="relative min-h-32 w-full flex-1">
        {/* Centred here rather than by the sprite: a sized one places
            itself against this square, and an egg, which has no height
            to be sized by, is laid in the flow and would sit at the
            corner */}
        <div class="absolute inset-0 m-auto flex aspect-square h-full max-w-full items-center justify-center">
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

      <Show when={!isEgg(props.caught)}>
        {/* Both rolls it was made from: two of a species with the same
            sigil are the same individual */}
        <div class="flex items-center justify-center gap-2">
          <span
            role="img"
            aria-label={`${getIVStars(props.caught.ivs)} of ${MAX_IV_STARS} stars`}
            class="text-sm tracking-[0.2em] text-gold"
          >
            {stars()}
          </span>
          <Meta class="font-mono tracking-[0.2em]">
            {getSigil(props.caught.individualValue, props.caught.traitValue)}
          </Meta>
        </div>

        <div class="flex w-full items-center gap-2">
          <div class="h-1.5 grow overflow-hidden rounded-full border border-line-soft bg-line-soft">
            <div
              class={`h-full ${isFainted(props.caught) ? 'bg-muted' : 'bg-leaf'}`}
              style={{ width: `${healthLeft(props.caught) * 100}%` }}
            />
          </div>
          <Meta class="shrink-0 tabular-nums">
            {Math.max(0, Math.round(props.caught.health))}/{getMaxHealth(props.caught)}
            {isFainted(props.caught) ? ' · fainted' : ''}
          </Meta>
          {/* What it is still carrying from its last fight */}
          <StatusSquares statuses={props.caught.statuses} />
        </div>
      </Show>
    </>
  );
}
