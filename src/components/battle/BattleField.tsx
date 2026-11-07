import { type JSX, Show, createSignal } from 'solid-js';
import type Battle from '../../battle/battle';
import type Biome from '../../data/ids/biome';
import type Unit from '../../battle/unit';
import BattleCanvas, { type UnitSpot } from './battle-canvas';
import followUnit from './battle-view/follow-unit';
import UnitCard from './UnitCard';
import { m } from '../../i18n/paraglide/messages.js';

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

export interface BattleFieldProps {
  battle: Battle;
  /** The ground the fight is standing on, for the field to draw. */
  biome?: Biome;
  /**
   * Whose side is drawn at the bottom. Empty for a spectator, who is
   * shown the fighting side instead
   */
  player: string;
  onReady?: () => void;
  /**
   * What pressing a pokemon does: the battle view docks it in the
   * inspector. Left out where a press does nothing
   */
  onPick?: (unit: Unit) => void;
}

export default function BattleField(props: BattleFieldProps): JSX.Element {
  const [hovered, setHovered] = createSignal<{ unit: Unit; at: UnitSpot } | null>(null);
  // Only the pokemon under the pointer is followed
  const beat = followUnit(
    () => props.battle,
    () => hovered()?.unit,
  );

  return (
    <>
      <BattleCanvas
        battle={props.battle}
        biome={props.biome}
        player={props.player}
        onHover={(unit, at) => {
          setHovered(unit == null || at == null ? null : { unit, at });
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
          // A tooltip: nothing on it is pressed, so it lets the pointer
          // through to the field and goes the moment the pokemon is left
          <div
            role="tooltip"
            aria-label={m.battle_field_hovered()}
            class={`pointer-events-none fixed z-20 -translate-x-1/2
              ${spot().at.top < CARD_ROOM ? 'pt-1.5' : '-translate-y-full pb-1.5'}`}
            style={{
              left: `${spot().at.x}px`,
              top: `${spot().at.top < CARD_ROOM ? spot().at.bottom : spot().at.top}px`,
            }}
          >
            <ul class="m-0 flex list-none p-0">
              <UnitCard unit={spot().unit} revision={beat} tip />
            </ul>
          </div>
        )}
      </Show>
    </>
  );
}
