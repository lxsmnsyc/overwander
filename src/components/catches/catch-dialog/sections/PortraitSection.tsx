import { healthLeft } from '../describe';

import type { CaughtPokemon } from '../../../../auth/caught';
import { catchAura, isShiny } from '../../../../auth/caught-record';

import { isEgg } from '../../../../auth/egg';

import { getMaxHealth, isFainted } from '../../../../auth/health';

import getSigil from '../../../../data/constants/sigil';

import { Genders, Species } from '../../../../data/ids/species';
import { SpriteAnim } from '../../../../data/ids/sprite-anims';

import { getSpeciesData } from '../../../../data/species';

import AnimatedSprite from '../../../sprites/AnimatedSprite';
import TypeBadge from '../../../sprites/TypeBadge';
import { Divider, Meta, Row } from '../../../styled';

import { GENDER_LABELS, GENDER_MARKS } from '../../catch-summary';
import { For, type JSX, Show } from 'solid-js';

/**
 * The pokemon itself: the sprite, what it is called, what it has left
 * and what kind of thing it is. An egg is drawn as an egg and says
 * none of the rest — it has nothing to lose yet, and is nothing yet.
 */
export interface PortraitSectionProps {
  caught: CaughtPokemon;
  /** What it is called, which is its nickname or its species */
  named: string;
}

export default function PortraitSection(props: PortraitSectionProps): JSX.Element {
  return (
    <>
      <div class="-mb-2 flex min-h-28 items-end justify-center pt-2">
        <AnimatedSprite
          species={isEgg(props.caught) ? Species.Egg : props.caught.species}
          shiny={!isEgg(props.caught) && isShiny(props.caught)}
          female={!isEgg(props.caught) && props.caught.gender === Genders.Female}
          aura={isEgg(props.caught) ? undefined : catchAura(props.caught)}
          animation={SpriteAnim.Walk}
          direction="DownLeft"
          scale={4}
          shadow
          label={props.named}
        />
      </div>

      <div class="flex flex-col items-center gap-0.5">
        <h3>{props.named}</h3>
        {/* What it actually is, under what it is called —
      and only where the two differ. A pokemon nobody
      has named is headed by its species already, and
      printing that twice would be the sheet answering
      a question it has just answered */}
        <Show when={!isEgg(props.caught) && props.caught.nickname !== ''}>
          <Meta>{getSpeciesData(props.caught.species).name}</Meta>
        </Show>
        {/* Both of the rolls it was made from, drawn rather
      than printed. Two of the same species with the
      same sigil are the same individual */}
        <Meta class="font-mono tracking-[0.2em]">
          {getSigil(props.caught.individualValue, props.caught.traitValue)}
        </Meta>
        {/* What it has left, drawn the way the box draws it.
      It is here rather than in the stats below because
      it is about this pokemon *now* rather than about
      what it is made of, and it is the one number a
      player checks before sending it anywhere. An egg
      has nothing to lose yet */}
        <Show when={!isEgg(props.caught)}>
          <div class="flex w-48 max-w-full items-center gap-2">
            <div
              class="h-1.5 grow overflow-hidden rounded-full border border-line-soft
          bg-line-soft"
            >
              <div
                class={`h-full ${isFainted(props.caught) ? 'bg-muted' : 'bg-leaf'}`}
                style={{ width: `${healthLeft(props.caught) * 100}%` }}
              />
            </div>
            <Meta class="shrink-0 tabular-nums">
              {Math.max(0, Math.round(props.caught.health))}/{getMaxHealth(props.caught)}
              {isFainted(props.caught) ? ' · fainted' : ''}
            </Meta>
          </div>
        </Show>
      </div>

      {/* What it is: what the dex calls its kind, the types
        it fights as, and which it is. Its species is named
        above — as the heading, or under it where a
        nickname has taken the heading — so this line does
        not say it a third time. An egg is none of it yet */}
      <Show when={!isEgg(props.caught)}>
        <Row class="justify-center">
          <span class="font-medium">{getSpeciesData(props.caught.species).category}</span>
          <Divider />
          <For each={getSpeciesData(props.caught.species).types}>
            {(type) => <TypeBadge type={type} />}
          </For>
          {/* A mark rather than a word, and nothing at all
            for something that has no gender: an empty
            column is not information */}
          <Show when={GENDER_MARKS[props.caught.gender] !== ''}>
            <Divider />
            <span
              class="text-lg leading-none"
              title={GENDER_LABELS[props.caught.gender]}
              aria-label={GENDER_LABELS[props.caught.gender]}
            >
              {GENDER_MARKS[props.caught.gender]}
            </span>
          </Show>
        </Row>
      </Show>
    </>
  );
}
