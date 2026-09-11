import { Items } from '../../../data/ids/items';
import type Battle from '../../core';
import {
  setupBrightPowder,
  setupScopeLens,
  setupSpeciesLens,
  setupWideLens,
  setupZoomLens,
} from './aim';
import {
  setupBand,
  setupBigRoot,
  setupExpertBelt,
  setupMetronome,
  setupProtectivePads,
  setupShellBell,
} from './damage';
import {
  setupBindingBand,
  setupDestinyKnot,
  setupEscapeItem,
  setupGripClaw,
  setupLightClay,
  setupWeatherRock,
} from './field';
import { setupClearAmulet, setupFlinchItem, setupRazorClaw } from './flinch';
import {
  setupFocusBand,
  setupQuickClaw,
  setupRockyHelmet,
  setupSafetyGoggles,
  setupUtilityUmbrella,
} from './guard';
import {
  setupBlackSludge,
  setupFloatStone,
  setupIronBall,
  setupLaggingTail,
  setupLeftovers,
  setupRingTarget,
  setupStickyBarbResidual,
  setupStickyBarbTransfer,
} from './residual';
import { BAND_CATEGORIES, SPECIES_LENSES, WEATHER_ROCKS } from './worths';

/**
 * Every piece of gear, started in one pass. The parts are grouped by
 * the hook they ride rather than by the shelf they are sold on
 */
const SETUPS: ((battle: Battle) => void)[] = [
  setupLeftovers,
  setupBlackSludge,
  setupStickyBarbResidual,
  setupStickyBarbTransfer,
  setupIronBall,
  setupFloatStone,
  setupLaggingTail,
  setupRingTarget,
  setupProtectivePads,
  setupShellBell,
  setupBigRoot,
  ...[...BAND_CATEGORIES].map(([item, category]) => setupBand(item, category)),
  setupExpertBelt,
  setupMetronome,
  setupWideLens,
  setupBrightPowder,
  setupZoomLens,
  setupScopeLens,
  ...[...SPECIES_LENSES].map(([item, species]) => setupSpeciesLens(item, species)),
  setupQuickClaw,
  setupFocusBand,
  setupRockyHelmet,
  setupSafetyGoggles,
  setupUtilityUmbrella,
  setupEscapeItem(Items.SmokeBall),
  setupEscapeItem(Items.ShedShell),
  setupDestinyKnot,
  ...WEATHER_ROCKS.map(setupWeatherRock),
  setupLightClay,
  setupGripClaw,
  setupBindingBand,
  setupClearAmulet,
  // These three are registered with the trade items, since the
  // evolution each gates is the other half of what it is for
  setupFlinchItem(Items.KingsRock),
  setupFlinchItem(Items.RazorFang),
  setupRazorClaw,
];

export default function setupGear(battle: Battle): void {
  for (const setup of SETUPS) {
    setup(battle);
  }
}

export * from './worths';
export * from './residual';
export * from './damage';
export * from './aim';
export * from './guard';
export * from './field';
export * from './flinch';
