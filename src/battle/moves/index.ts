import type Battle from '../core';
import setupBeatUp from './beat-up';
import setupCurse from './curse';
import setupDestinyBond from './destiny-bond';
import setupEncore from './encore';
import setupForesight from './foresight';
import setupFutureSight from './future-sight';
import setupHiddenPower from './hidden-power';
import setupLockOn from './lock-on';
import setupNightmare from './nightmare';
import setupNoEscapeMoves from './no-escape';
import setupNonLethalMoves from './non-lethal';
import setupPerishSong from './perish-song';
import setupProtectMoves from './protect';
import setupPursuit from './pursuit';
import setupRapidSpin from './rapid-spin';
import setupSketch from './sketch';
import setupSleepingMoves from './sleeping-moves';
import setupSpikes from './spikes';
import setupSpite from './spite';
import setupSupportMoves from './support';
import setupThawingMoves from './thaw';
import setupThief from './thief';
import setupVariablePowerMoves from './variable-power';
import setupAbsorb from './absorb';
import setupBide from './bide';
import setupBodySlam from './body-slam';
import setupChargeMoves from './charge';
import setupConversion, { setupConversion2 } from './conversion';
import setupCounter from './counter';
import setupCrashMoves from './crash';
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
import setupPayDay from './pay-day';
import setupPowderMoves from './powder';
import setupRage from './rage';
import setupRampageMoves from './rampage';
import setupRechargeMoves from './recharge';
import setupRecoilMoves from './recoil';
import setupRollingMoves from './rolling';
import setupRecoverMoves from './recover';
import setupRest from './rest';
import setupSelfDestructMoves from './self-destruct';
import setupSemiInvulnerableMoves from './semi-invulnerable';
import setupSolarBeam from './solar-beam';
import setupStageMoves from './stage';
import setupStruggle from './struggle';
import setupAttack from './attack';
import { setupStatusMoves } from './status';
import setupSubstitute from './substitute';
import setupTransform from './transform';
import setupTriAttack from './tri-attack';
import setupSwitchOutMoves from './switch-out';
import setupWeatherAccuracyMoves from './weather-accuracy';
import setupWeatherMoves from './weather';
import setupWeightMoves from './weight';
import setupAbilityMoves from './ability-moves';
import setupAssist from './assist';
import setupBrickBreak from './brick-break';
import setupCharged from './charged';
import setupConditionalPowerMoves from './conditional-power';
import setupCureMoves from './cure';
import setupFakeOut from './fake-out';
import setupFocusPunch from './focus-punch';
import setupFollowMe from './follow-me';
import setupImprison from './imprison';
import setupItemMoves from './item-moves';
import setupMemento from './memento';
import setupGroundMoves from './ground';
import setupSports from './sports';
import setupStockpile from './stockpile';
import setupUproar from './uproar';
import setupWish from './wish';

export default function setupMoves(battle: Battle): void {
  // Overarching groups
  setupHitMoves(battle);
  setupStageMoves(battle);
  setupStatusMoves(battle);

  // Small groups
  setupPowderMoves(battle);
  setupIncreasedCriticalHitRatioMoves(battle);
  setupRampageMoves(battle);
  setupRecoilMoves(battle);
  setupCrashMoves(battle);
  setupTransform(battle);
  setupRechargeMoves(battle);
  setupChargeMoves(battle);
  setupSemiInvulnerableMoves(battle);
  setupFixedDamageMoves(battle);
  setupSwitchOutMoves(battle);
  setupMultiHitMoves(battle);
  setupWeightMoves(battle);

  // Johto: the groups it brought with it
  setupProtectMoves(battle);
  setupNoEscapeMoves(battle);
  setupNonLethalMoves(battle);
  setupThawingMoves(battle);
  setupRollingMoves(battle);
  setupVariablePowerMoves(battle);
  setupHiddenPower(battle);
  setupPursuit(battle);
  setupBeatUp(battle);

  // Variations
  setupSolarBeam(battle);
  setupLeechSeed(battle);
  setupBodySlam(battle);
  setupPayDay(battle);
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
  setupWeatherMoves(battle);
  setupConversion(battle);
  setupConversion2(battle);
  setupCurse(battle);
  setupNightmare(battle);
  setupPerishSong(battle);
  setupDestinyBond(battle);
  setupEncore(battle);
  setupSpite(battle);
  setupForesight(battle);
  setupLockOn(battle);
  setupSupportMoves(battle);
  setupSleepingMoves(battle);
  setupSketch(battle);
  setupSpikes(battle);
  setupRapidSpin(battle);
  setupThief(battle);
  setupFutureSight(battle);

  // Hoenn: what it brought, and what the fight going on around a move
  // does to it
  setupConditionalPowerMoves(battle);
  setupFakeOut(battle);
  setupFocusPunch(battle);
  setupFollowMe(battle);
  setupStockpile(battle);
  setupCharged(battle);
  setupSports(battle);
  setupCureMoves(battle);
  setupMemento(battle);
  setupBrickBreak(battle);
  setupImprison(battle);
  setupUproar(battle);
  setupItemMoves(battle);
  setupAbilityMoves(battle);
  setupAssist(battle);
  setupWish(battle);
  setupGroundMoves(battle);

  // Last, because they are what is left: both fallbacks only answer
  // when every resolver above has declined to pick anything. Attack
  // is for a unit waiting on its cooldowns and Struggle for one shut
  // out of its move set, which are exclusive conditions
  setupAttack(battle);
  setupStruggle(battle);
}
