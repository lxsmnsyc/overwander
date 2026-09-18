import { SpriteAnim } from '../data/ids/sprite-anims';
import type { Species } from '../data/ids/species';
import { getSpeciesData } from '../data/species';
import type SpeciesSpriteAnimation from './species-sprite-animation';

/** About the median idle height across the sheets, in sheet pixels */
const IDLE_REFERENCE = 30;

/** How strongly a species' real height shows in its size */
const HEIGHT_POWER = 0.4;

/** The shortest and tallest an idle pose may stand, in sheet pixels */
const SHORTEST = 15;
const TALLEST = 80;

/**
 * How much to resize a species' sheet so its idle pose stands as tall
 * as its real height says. PMD art fills much the same box whatever it
 * draws, so the pose is measured first. Battle and the board share it,
 * so a pokemon is the same size beside others in both, and every clip
 * the sheet plays uses the one factor
 */
export default function speciesSize(species: Species, sprite: SpeciesSpriteAnimation): number {
  const drawn = sprite.heightOf(SpriteAnim.Idle);

  // A sheet with no idle pose has nothing to measure, so it keeps its own size
  if (drawn <= 0) {
    return 1;
  }

  const target = IDLE_REFERENCE * getSpeciesData(species).height ** HEIGHT_POWER;

  return Math.min(TALLEST, Math.max(SHORTEST, target)) / drawn;
}
