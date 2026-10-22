import * as v from 'valibot';
import { type CastAnimation, readCast } from './cast';
import { STATUS_IDS } from '../ids/names';
import type { SpriteAnim } from '../ids/sprite-anims';
import type { Statuses } from '../ids/status';
import { idOf } from '../yaml';
import castFile from './status-cast.yaml';

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
 * of them looks like, in order, first match wins. Written in
 * `status-cast.yaml`
 */
export const STATUS_CAST: [status: Statuses, cast: readonly CastAnimation[]][] = [];

for (const [name, clips] of Object.entries(
  v.parse(v.record(v.string(), v.array(v.string())), castFile),
)) {
  const where = `status-cast.yaml: ${name}`;

  STATUS_CAST.push([idOf<Statuses>(STATUS_IDS, name, where), readCast(clips, where)]);
}

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
    // The status is the one being drawn and the sheet has none of its
    // clips. The last is the common one, which the battle canvas
    // stands in for with Idle
    return cast.at(-1) ?? null;
  }
  return null;
}
