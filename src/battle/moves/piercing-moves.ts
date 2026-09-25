import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { MoveCategories, Moves, StatFlags } from '../../data/ids/moves';
import { createPierceWindows } from '../abilities/__create/pierce';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * The moves that carry Mold Breaker in themselves: whoever throws one,
 * the target's abilities read as absent while it resolves
 * https://bulbapedia.bulbagarden.net/wiki/Sunsteel_Strike_(move)
 */
export const PIERCING_MOVES = new Set<Moves>([
  Moves.SunsteelStrike,
  Moves.MoongeistBeam,
  Moves.PhotonGeyser,
  Moves.SearingSunrazeSmash,
  Moves.MenacingMoonrazeMaelstrom,
  Moves.LightThatBurnsTheSky,
]);

export default function setupPiercingMoves(battle: Battle): void {
  createPierceWindows(battle, (_, move) => PIERCING_MOVES.has(move));

  // Photon Geyser strikes with whichever attacking stat is higher, stages
  // included, which decides whether it lands as a physical move
  battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
    if (
      (event.move === Moves.PhotonGeyser || event.move === Moves.LightThatBurnsTheSky) &&
      event.source.resolveStat(Stats.Attack, StatFlags.Attack) >
        event.source.resolveStat(Stats.SpecialAttack, StatFlags.Attack)
    ) {
      event.category = MoveCategories.Physical;
    }
  });
}
