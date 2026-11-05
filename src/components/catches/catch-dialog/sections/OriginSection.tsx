import { HISTORY_BALL, HISTORY_BALL_INSET, describeHistory } from '../describe';
import { CARD_TITLE } from '../metrics';

import type { CaughtPokemon } from '../../../../auth/caught';
import { BALL_ITEMS } from '../../../../data/ids/items';

import { describeItem } from '../../../details';
import ItemSprite from '../../../items/ItemSprite';
import { Button } from '../../../styled';

import { type JSX, Show } from 'solid-js';
import { m } from '../../../../i18n/paraglide/messages.js';

/**
 * Where it came from in one line, and the way into the whole chain of
 * hands it has passed through.
 */
export interface OriginSectionProps {
  caught: CaughtPokemon;
  /** Open the full history over the sheet */
  onHistory: () => void;
}

export default function OriginSection(props: OriginSectionProps): JSX.Element {
  return (
    <>
      {/* The way into the full history stands beside the title, so the
          card stays two lines tall under a long evolution list */}
      <div class="flex min-h-7 items-center justify-between gap-2">
        <h3 class={CARD_TITLE}>{m.catch_origin()}</h3>
        <Show when={props.caught.history.length > 0}>
          <Button class="px-2! py-0.5! text-xs!" onClick={props.onHistory}>
            {m.catch_history_count({ count: props.caught.history.length })}
          </Button>
        </Show>
      </div>
      <span class="flex min-w-0 items-start gap-2">
        <ItemSprite
          item={BALL_ITEMS[props.caught.ball]}
          size={HISTORY_BALL}
          class={HISTORY_BALL_INSET}
          label={describeItem(BALL_ITEMS[props.caught.ball])}
        />
        <span class="min-w-0 text-left text-xs leading-[15px] text-muted">
          {describeHistory(props.caught)}
        </span>
      </span>
    </>
  );
}
