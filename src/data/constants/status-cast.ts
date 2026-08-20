import type { CastAnimation } from './cast';
import { SpriteAnim } from '../ids/sprite-anims';
import { Statuses } from '../ids/status';

/**
 * What a pokemon looks like while something is being done **to** it.
 *
 * A fight is mostly won and lost between moves — one side asleep, one
 * side frozen, one flinching out of the turn it had — and none of that
 * showed: a paralyzed pokemon stood there idling exactly like the one
 * that had just put it there. The field panel said so in words, which
 * is the half of the screen a player is not watching while the health
 * bars move.
 *
 * These are preference lists, the same shape a move's `cast` is and
 * read the same way: left to right until the sheet in hand has one of
 * them. That matters more here than it does for a move, because the
 * telling clips are the uncommon ones — a Shake for a shiver, a Twirl
 * for confusion — and only some sheets were drawn with them. Every
 * list ends on a common clip, so the walk always lands somewhere.
 *
 * They stand in for the **idle** loop rather than for a move: a
 * pokemon part-way through a cast is drawn casting, because what it is
 * about to do to somebody else is the more urgent of the two facts
 */

/**
 * Which status a pokemon carrying several is drawn by, and what each
 * of them looks like — in order, first match wins.
 *
 * The order is the order the fight reads them in. A flinch is first
 * because it is the one that is about to end: it costs the pokemon
 * the moment it is in, and a moment is all it lasts. Then the ones
 * that stop it acting at all, then the ones it can act through — a
 * pokemon that is both confused and paralyzed is drawn paralyzed,
 * because that is the one deciding whether it moves at all
 */
export const STATUS_CAST: [status: Statuses, cast: readonly CastAnimation[]][] = [
  // Knocked out of its own turn: it took something and it is showing
  [Statuses.Flinched, [SpriteAnim.Hurt]],
  // A boss that has not woken up yet is asleep, as far as the picture
  // is concerned. Nothing else says what dormant means
  [Statuses.Dormant, [SpriteAnim.Sleep]],
  [Statuses.Sleeping, [SpriteAnim.Sleep]],
  // Shivering where it stands: a Shake reads as cold on the sheets
  // that have one, and a Hurt reads as unable to move on the ones
  // that do not
  [Statuses.Frozen, [SpriteAnim.Shake, SpriteAnim.Hurt]],
  // Spent, after a move that costs the turn behind it
  [Statuses.Recharging, [SpriteAnim.Sleep]],
  [Statuses.Paralyzed, [SpriteAnim.Shock, SpriteAnim.Shake, SpriteAnim.Hurt]],
  [Statuses.Confused, [SpriteAnim.Twirl, SpriteAnim.Shake, SpriteAnim.Hurt]],
  // Winding up rather than suffering: both of these are a pokemon
  // holding something in, and Charge is what a sheet draws that with
  [Statuses.Biding, [SpriteAnim.Charge]],
  [Statuses.Raging, [SpriteAnim.Swell, SpriteAnim.RearUp, SpriteAnim.Charge]],
];

/**
 * The clip to draw a unit standing about in, given what it is
 * carrying and what its sheet has. Answers null when nothing it
 * carries is worth drawing, which is the ordinary case — the caller
 * idles
 */
export default function pickStatusCast(
  carries: (status: Statuses) => boolean,
  has: (anim: SpriteAnim) => boolean,
): SpriteAnim | null {
  for (const [status, cast] of STATUS_CAST) {
    if (!carries(status)) {
      continue;
    }

    for (const animation of cast) {
      if (has(animation)) {
        return animation;
      }
    }
  }
  return null;
}
