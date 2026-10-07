import { COMMON_CAST } from '../../data/constants/cast';
import { SpriteAnim } from '../../data/ids/sprite-anims';

/**
 * Which drawn clip plays when the sheet has not got the one asked for.
 *
 * Idle where the sheet has one, the first frame of Rotate held where it
 * has not, and failing both any clip it carries: a clip that will not
 * play leaves the playhead unset, and a sprite with no playhead draws
 * no body and no shadow, so the pokemon would be absent from the fight
 */
export interface StandIn {
  animation: SpriteAnim;
  /**
   * Whether the clip is held on one frame rather than played. A Rotate
   * standing in for an Idle is a pokemon turning on the spot if it is
   * allowed to run
   */
  still: boolean;
}

/**
 * `has` is the sheet's own answer, so the decision is made against the
 * sheet in hand rather than against a table of which species owns
 * what, which would be a second copy of the truth and would rot
 */
export function standInFor(wanted: SpriteAnim, has: (anim: SpriteAnim) => boolean): StandIn {
  if (has(wanted)) {
    return { animation: wanted, still: false };
  }
  if (has(SpriteAnim.Idle)) {
    return { animation: SpriteAnim.Idle, still: false };
  }
  if (has(SpriteAnim.Rotate)) {
    return { animation: SpriteAnim.Rotate, still: true };
  }
  for (const name of COMMON_CAST) {
    if (has(name)) {
      return { animation: name, still: false };
    }
  }
  return { animation: wanted, still: false };
}
