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
      <h3 class={CARD_TITLE}>{m.catch_origin()}</h3>
      <span class="flex min-w-0 items-start gap-2">
        <ItemSprite
          item={BALL_ITEMS[props.caught.ball]}
          size={HISTORY_BALL}
          class={HISTORY_BALL_INSET}
          label={describeItem(BALL_ITEMS[props.caught.ball])}
        />
        <span class="min-w-0 text-left text-xs leading-[17px] text-muted">
          {describeHistory(props.caught)}
        </span>
      </span>
      <Show when={props.caught.history.length > 0}>
        <Button onClick={props.onHistory}>
          {m.catch_history_count({ count: props.caught.history.length })}
        </Button>
      </Show>
    </>
  );
}
