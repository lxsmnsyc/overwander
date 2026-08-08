import type { Battle } from '../core';
import { setupAbsorb } from './absorb';
import { setupBide } from './bide';
import { setupBodySlam } from './body-slam';
import { setupChargeMoves } from './charge';
import { setupCounter } from './counter';
import { setupFixedDamageMoves } from './fixed-damage';
import { setupHitMoves } from './hit';
import { setupIncreasedCriticalHitRatioMoves } from './increased-critical-hit';
import { setupLeechSeed } from './leech-seed';
import { setupMimic } from './mimic';
import { setupPowderMoves } from './powder';
import { setupRage } from './rage';
import { setupRechargeMoves } from './recharge';
import { setupRecoilMoves } from './recoil';
import { setupRest } from './rest';
import { setupSemiInvulnerableMoves } from './semi-invulnerable';
import { setupSolarBeam } from './solar-beam';
import { setupStageMoves } from './stage';
import { setupStatusMoves } from './status';
import { setupSubstitute } from './substitute';
import { setupSwitchOutMoves } from './switch-out';

export function setupMoves(battle: Battle) {
  // Overarching groups
  setupHitMoves(battle);
  setupStageMoves(battle);
  setupStatusMoves(battle);

  // Small groups
  setupPowderMoves(battle);
  setupIncreasedCriticalHitRatioMoves(battle);
  setupRecoilMoves(battle);
  setupRechargeMoves(battle);
  setupChargeMoves(battle);
  setupSemiInvulnerableMoves(battle);
  setupFixedDamageMoves(battle);
  setupSwitchOutMoves(battle);

  // Variations
  setupSolarBeam(battle);
  setupLeechSeed(battle);
  setupBodySlam(battle);
  setupRage(battle);
  setupAbsorb(battle);
  setupMimic(battle);
  setupBide(battle);
  setupRest(battle);
  setupSubstitute(battle);
  setupCounter(battle);
}
