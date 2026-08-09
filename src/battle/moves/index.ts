import type Battle from '../core';
import setupAbsorb from './absorb';
import setupBide from './bide';
import setupBodySlam from './body-slam';
import setupChargeMoves from './charge';
import setupCounter from './counter';
import setupDisable from './disable';
import setupFixedDamageMoves from './fixed-damage';
import setupHaze from './haze';
import setupHitMoves from './hit';
import setupIncreasedCriticalHitRatioMoves from './increased-critical-hit';
import setupLeechSeed from './leech-seed';
import setupMetronome from './metronome';
import setupMimic from './mimic';
import setupMirrorMove from './mirror-move';
import setupMultiHitMoves from './multi-hit';
import setupPowderMoves from './powder';
import setupRage from './rage';
import setupRechargeMoves from './recharge';
import setupRecoilMoves from './recoil';
import setupRecoverMoves from './recover';
import setupRest from './rest';
import setupSelfDestructMoves from './self-destruct';
import setupSemiInvulnerableMoves from './semi-invulnerable';
import setupSolarBeam from './solar-beam';
import setupStageMoves from './stage';
import { setupStatusMoves } from './status';
import setupSubstitute from './substitute';
import setupTriAttack from './tri-attack';
import setupSwitchOutMoves from './switch-out';
import setupWeatherAccuracyMoves from './weather-accuracy';

export default function setupMoves(battle: Battle): void {
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
  setupMultiHitMoves(battle);

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
  setupDisable(battle);
  setupHaze(battle);
  setupRecoverMoves(battle);
  setupSelfDestructMoves(battle);
  setupTriAttack(battle);
  setupMirrorMove(battle);
  setupMetronome(battle);
  setupWeatherAccuracyMoves(battle);
}
