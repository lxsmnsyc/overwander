import { type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import type Battle from '../../battle/core';
import type Unit from '../../battle/unit';
import { type BaseEvent, EventPriority } from '../../core/event-emitter';
import BattleCanvas, { type UnitSpot } from './battle-canvas';
import { CARD_EVENTS, unitsOf } from './BattleParty';
import UnitCard from './UnitCard';

/**
 * The field, and the card that comes up over whichever pokemon the
 * pointer is on.
 *
 * The two belong together: the canvas is what knows where a pokemon
 * was drawn, and the card is the only place the numbers under it are
 * said. Keeping them in one component is what lets the field be the
 * whole page — a fight and a readout of it, without a row of cards
 * along either edge covering the strips the fight is fought on.
 */

/**
 * How much room a card needs above a pokemon before it is put there.
 * Under a pokemon standing near the top of the frame is the only place
 * a card of this height fits at all
 */
const CARD_ROOM = 260;

/**
 * How long the card waits after the pointer leaves the pokemon. It is
 * the time it takes to cross the gap onto the card itself, which a
 * player has to be able to do: what an ability or an item does is on a
 * card over the card
 */
const CLOSE_DELAY = 140;

export interface BattleFieldProps {
  battle: Battle;
  /**
   * Whose side is drawn at the bottom. Empty for a spectator, who is
   * shown the fighting side instead
   */
  player: string;
  onReady?: () => void;
  /**
   * What pressing a pokemon does. Left out where there is nothing to
   * open — a demo's units stand for no record
   */
  onPick?: (unit: Unit) => void;
}

export default function BattleField(props: BattleFieldProps): JSX.Element {
  const [hovered, setHovered] = createSignal<{ unit: Unit; at: UnitSpot } | null>(null);
  /**
   * A count of everything that changes what the card shows. The engine
   * mutates units in place, so there is nothing to observe directly —
   * this is what the card watches instead
   */
  const [beat, setBeat] = createSignal(0);

  // Only the pokemon under the pointer is followed: a card nobody is
  // looking at is a card nobody is reading
  createEffect(() => {
    const unit = hovered()?.unit;

    if (unit == null) {
      return;
    }

    const battle = props.battle;
    const bump = (event: BaseEvent): void => {
      if (unitsOf(event).includes(unit)) {
        setBeat((count) => count + 1);
      }
    };

    for (const event of CARD_EVENTS) {
      battle.on(event, EventPriority.Post, bump);
    }

    onCleanup(() => {
      for (const event of CARD_EVENTS) {
        battle.off(event, EventPriority.Post, bump);
      }
    });
  });

  let leaving: ReturnType<typeof setTimeout> | undefined;

  const keep = (): void => {
    if (leaving != null) {
      clearTimeout(leaving);
      leaving = undefined;
    }
  };

  const drop = (): void => {
    keep();
    leaving = setTimeout(() => {
      setHovered(null);
    }, CLOSE_DELAY);
  };

  onCleanup(keep);

  return (
    <>
      <BattleCanvas
        battle={props.battle}
        player={props.player}
        onHover={(unit, at) => {
          if (unit == null || at == null) {
            drop();
            return;
          }
          keep();
          setHovered({ unit, at });
        }}
        onPick={(unit) => {
          props.onPick?.(unit);
        }}
        onReady={() => {
          props.onReady?.();
        }}
      />

      {/* Above the pokemon where there is room and below it where
          there is not, so a card never hangs off the top of a fight
          being watched from the near side */}
      <Show when={hovered()}>
        {(spot) => (
          <ul
            aria-label="The pokemon under the pointer"
            // Pressable, so the pointer can be moved onto it. Leaving
            // the pokemon starts a short wait rather than clearing the
            // card, and arriving here calls the wait off
            class={`fixed z-20 m-0 flex list-none -translate-x-1/2 p-0
              ${spot().at.top < CARD_ROOM ? '' : '-translate-y-full'}`}
            style={{
              left: `${spot().at.x}px`,
              top: `${spot().at.top < CARD_ROOM ? spot().at.bottom : spot().at.top}px`,
            }}
            onMouseEnter={keep}
            onMouseLeave={drop}
          >
            <UnitCard unit={spot().unit} revision={beat} />
          </ul>
        )}
      </Show>
    </>
  );
}
