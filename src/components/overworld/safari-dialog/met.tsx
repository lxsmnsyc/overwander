import { type JSX, Show } from 'solid-js';
import { BALL_ITEMS, Balls } from '../../../data/ids/items';
import { getSpeciesData } from '../../../data/species';
import { isShadow, isShiny } from '../../../model/caught-record';
import type { EncounterRecord } from '../../../model/encounter-record';
import { FireIcon, SparklesIcon } from '../../icons';
import ItemSprite from '../../items/ItemSprite';
import { GENDER_MARKS } from './metrics';
import { m } from '../../../i18n/paraglide/messages.js';

/** Stands in for the line in the message, so the words either side of it can be read off */
const SLOT = '\u0000';

export interface MeetingTitleProps {
  encounter: EncounterRecord | null;
  /** Whether this player has caught the species standing there before */
  owned: boolean;
}

/**
 * The nameplate, all of the meeting in one line: "A wild", whether it
 * was caught before, the level, the marks, the species and its gender,
 * then "appeared!".
 * The bare word while no encounter is open
 */
export default function MeetingTitle(props: MeetingTitleProps): JSX.Element {
  // The words around the line, in the order the locale puts them
  const around = (): string[] => m.safari_appeared({ name: SLOT }).split(SLOT);

  return (
    <Show when={props.encounter} fallback={m.safari_encounter()}>
      {(encounter) => (
        <span class="inline-flex items-center gap-1.5">
          <Show when={around()[0].trim() !== ''}>
            <span>{around()[0].trim()}</span>
          </Show>
          <Show when={props.owned}>
            {/* The ball fills 18 of its 32-pixel cell, so the cell is drawn at 28 to bring
                the ball up to the icons beside it, and pulled in so the line keeps their height */}
            <ItemSprite item={BALL_ITEMS[Balls.PokeBall]} size={28} label="" class="-m-1.5" />
            <span class="sr-only">{m.safari_caught_before()}</span>
          </Show>
          <span>{m.ow_level({ level: encounter().level })}</span>
          {/* The bar's own white rather than a colour, which barely shows on
              the blue. The word is what a screen reader hears */}
          <Show when={isShadow(encounter())}>
            <FireIcon aria-hidden="true" class="size-4 shrink-0" />
            <span class="sr-only">{m.safari_shadow()}</span>
          </Show>
          <Show when={isShiny(encounter())}>
            <SparklesIcon aria-hidden="true" class="size-4 shrink-0" />
            <span class="sr-only">{m.safari_shiny()}</span>
          </Show>
          <span>
            {`${getSpeciesData(encounter().species).name} ${GENDER_MARKS[encounter().gender]}`.trimEnd()}
          </span>
          <Show when={(around()[1] ?? '').trim() !== ''}>
            <span>{(around()[1] ?? '').trim()}</span>
          </Show>
        </span>
      )}
    </Show>
  );
}
