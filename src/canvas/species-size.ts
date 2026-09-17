import { SpriteAnim } from '../data/ids/sprite-anims';
import type { Species } from '../data/ids/species';
import { getSpeciesData } from '../data/species';
import type SpeciesSpriteAnimation from './species-sprite-animation';

/** How strongly a species' real height shows in its size, and how far it may carry */
export interface SizeCurve {
  power: number;
  min: number;
  max: number;
}

/** About the median idle height across the sheets, in sheet pixels */
const IDLE_REFERENCE = 30;

/**
 * How much to resize a species' sheet so its idle pose stands as tall
 * as its real height says. PMD art fills much the same box whatever it
 * draws, so the pose is measured first; each canvas brings its own
 * curve, and every clip the sheet plays shares the one factor
 */
export default function speciesSize(
  species: Species,
  sprite: SpeciesSpriteAnimation,
  curve: SizeCurve,
): number {
  const drawn = sprite.heightOf(SpriteAnim.Idle);

  // A sheet with no idle pose has nothing to measure, so it keeps its own size
  if (drawn <= 0) {
    return 1;
  }

  const ratio = getSpeciesData(species).height ** curve.power;

  return (IDLE_REFERENCE * Math.min(curve.max, Math.max(curve.min, ratio))) / drawn;
}
