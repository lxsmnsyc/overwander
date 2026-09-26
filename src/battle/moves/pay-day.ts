import { AttackPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { getCastTime } from '../mechanics/move/timing';
import { BattleEvents, EffectType } from '../events';

/**
 * What one landed Pay Day scatters, per level of the user: the
 * mainline's five
 */
export const PAY_DAY_COINS_PER_LEVEL = 5;

/**
 * The moves that can use a move their user does not know: each one
 * can land a Pay Day it borrowed from a teammate, a foe or chance
 */
const PAY_DAY_BORROWERS = new Set<Moves>([
  Moves.Assist,
  Moves.Copycat,
  Moves.MeFirst,
  Moves.Metronome,
  Moves.Mimic,
  Moves.MirrorMove,
  Moves.Sketch,
  Moves.Transform,
]);

/**
 * Whether a pokemon fielded with these moves and abilities could ever
 * land a Pay Day. A new move or ability that borrows moves belongs in
 * `PAY_DAY_BORROWERS` or beside Imposter, or its coins are thrown away
 */
function canScatterCoins(moves: readonly Moves[], abilities: readonly Abilities[]): boolean {
  for (const move of moves) {
    if (move === Moves.PayDay || PAY_DAY_BORROWERS.has(move)) {
      return true;
    }
  }
  return abilities.includes(Abilities.Imposter);
}

/**
 * The most a pokemon's Pay Days can have scattered in a fight that
 * has run `lasted` milliseconds: nothing from one that could never
 * have used the move, and otherwise one landed use for every cast that
 * fits in the time, at the level it was fielded at. A report of more
 * than this is a report of a fight that did not happen
 */
export function payDayCeiling(
  level: number,
  moves: readonly Moves[],
  abilities: readonly Abilities[],
  lasted: number,
): number {
  if (!canScatterCoins(moves, abilities)) {
    return 0;
  }
  const casts = 1 + Math.floor(Math.max(0, lasted) / getCastTime(0));

  return PAY_DAY_COINS_PER_LEVEL * level * casts;
}

export default function setupPayDay(battle: Battle): void {
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    // Only the direct hit scatters: damage merely carrying the move
    // as its cause must not pay twice
    if (
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      event.cause.move === Moves.PayDay
    ) {
      event.source.coins += PAY_DAY_COINS_PER_LEVEL * event.source.level;
    }
  });
}
