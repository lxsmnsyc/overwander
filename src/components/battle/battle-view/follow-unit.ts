import { type Accessor, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type Battle from '../../../battle/battle';
import type Unit from '../../../battle/unit';
import { type BaseEvent, EventPriority } from '../../../core/event-emitter';
import { CARD_EVENTS, unitsOf } from '../BattleParty';

/**
 * A count bumped whenever the battle says `unit` moved, for a card or
 * the inspector to read. The engine mutates units in place, so there is
 * nothing to observe directly. Only the one unit is followed: a card
 * nobody is looking at is a card nobody is reading
 */
export default function followUnit(
  battle: Accessor<Battle>,
  unit: Accessor<Unit | null | undefined>,
): Accessor<number> {
  const [beat, setBeat] = createSignal(0);
  // Through memos, so a caller rebuilding its props does not resubscribe
  const followed = createMemo(unit);
  const field = createMemo(battle);

  createEffect(() => {
    const watched = followed();
    const fought = field();

    if (watched == null) {
      return;
    }

    const bump = (event: BaseEvent): void => {
      if (unitsOf(event).includes(watched)) {
        setBeat((count) => count + 1);
      }
    };

    for (const event of CARD_EVENTS) {
      fought.on(event, EventPriority.Post, bump);
    }
    onCleanup(() => {
      for (const event of CARD_EVENTS) {
        fought.off(event, EventPriority.Post, bump);
      }
    });
  });

  return beat;
}
