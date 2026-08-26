import type { MoveTarget } from '../../../battle/events';
import type Unit from '../../../battle/unit';
import type { FieldVisual } from '../../../canvas/battle/moves/__painted';
import type SpeciesSpriteAnimation from '../../../canvas/species-sprite-animation';
import { isLoopingCast, pickCast } from '../../../data/constants/cast';
import pickStatusCast from '../../../data/constants/status-cast';
import type { Moves } from '../../../data/ids/moves';
import { SpriteAnim } from '../../../data/ids/sprite-anims';
import { getMoveData } from '../../../data/moves';

/**
 * Movement over the field's stillness: a body thrown at another, two
 * teammates trading places, and which clip a move is played with.
 */

/**
 * How long one ability has to wait before it draws a cue again, in
 * battle milliseconds
 */
export const CUE_GAP = 700;

/**
 * A pokemon throwing itself at another one.
 *
 * A contact move is the pokemon *being* the projectile — there is
 * nothing in the air to draw, because the thing crossing the gap is
 * the body. So the sprite goes: out toward whatever it is hitting and
 * back to where it stands, on the battle's own clock
 */
export interface Lunge {
  source: Unit;
  target: Unit;
  elapsed: number;
  window: number;
}

/** How long the whole out-and-back takes, in battle milliseconds. */
export const LUNGE_SPAN = 480;

/**
 * Two teammates trading places: a switch swaps where they stand, and
 * the swap is walked rather than teleported — each glides from the
 * other's old spot into its own. The walk keeps no clock of its own:
 * the engine's UnitUpdateSwitch events carry how far along it is
 */
export interface Trade {
  a: Unit;
  b: Unit;
  elapsed: number;
  window: number;
}

/** How much of the gap it crosses. Not all of it: they do not overlap */
export const LUNGE_REACH = 0.42;

/**
 * A move going off: its own picture, played where it happened.
 *
 * It covers the whole of the move, the time in the air included — a
 * move the engine holds before it lands is handed that window and
 * spends it, so nothing else has to draw where the move currently is
 */
export interface Casting {
  source: Unit;
  targets: Unit[];
  visual: FieldVisual;
}

/**
 * What a unit should look like it is doing, and how long it has to do
 * it in.
 *
 * A unit working a move plays the move's own `cast` list, walked until
 * the sprite in hand has one of those clips, so a Fire Punch punches
 * on a sheet that has a punch and swings on one that does not.
 *
 * The clip is **stretched over the window** rather than looped inside
 * it: a cast runs `(104 - 16 x priority)` frames and a drawn clip is
 * whatever length it was drawn at, so a loop would leave the gesture
 * part-way through when the move fires. Stretched, the wind-up ends
 * exactly as the move goes off, which makes priority visible without a
 * number on screen. Channelling draws the same way, one pass per step
 */
export interface Performance {
  animation: SpriteAnim;
  /**
   * How long one pass should take, or null to play at the speed the
   * sheet was drawn at
   */
  duration: number | null;
  loop: boolean;
}

/**
 * A move this unit has thrown and is waiting to land: which move, and
 * how long the engine is holding it in the air. It is what the unit is
 * doing between firing and hitting
 */
export interface Striking {
  move: Moves;
  /**
   * How long the gesture is given: the flight the engine is holding
   * the move for, plus the rest the caster takes afterwards.
   *
   * It is not what the clip is *fitted* to — a throw plays at the
   * speed it was drawn at — it is how long the field goes on showing
   * it before the pokemon falls back to standing about. Fitting the
   * clip to the flight instead squeezed a second of drawn gesture into
   * a quarter of one, which is a blink rather than a throw
   */
  window: number;
  /** How much of that window has passed. */
  elapsed?: number;
  /**
   * What it was thrown at, so the thrower goes on facing it while the
   * move is in the air rather than turning away the moment it fires
   */
  at?: MoveTarget;
}

export function animationFor(
  unit: Unit,
  sprite: SpeciesSpriteAnimation,
  striking?: Striking,
): Performance {
  if (!unit.alive) {
    // A knocked-out pokemon holds the last frame of being hurt rather
    // than looping it, which is the difference between lying there
    // and writhing for ever
    return { animation: SpriteAnim.Hurt, duration: null, loop: false };
  }

  /**
   * The move going off is when the move is **seen**: the swing, the
   * jab, the leaf thrown. It is the clip the move asks for, fitted to
   * the window the engine holds it open for, so the gesture finishes
   * exactly as the hit lands.
   *
   * It is asked before the wind-up below because a unit that has just
   * fired a multi-step move is both throwing this step and winding up
   * the next, and what it is doing right now is throwing
   */
  if (striking != null) {
    const animation = pickCast(getMoveData(striking.move).cast, (name) => sprite.has(name));

    // At the speed it was drawn at, either way. A clip drawn as
    // something repeated goes round for as long as the gesture lasts;
    // one drawn as a single movement plays once and holds. Neither is
    // fitted to the flight: the engine's delay says when the hit
    // lands, not how fast a pokemon moves
    return { animation, duration: null, loop: isLoopingCast(animation) };
  }

  /**
   * Winding up is a pokemon gathering itself, whatever it is about to
   * throw: one clip for every move rather than the move's own.
   *
   * The move's clip is the *throw*, and playing it through the wind-up
   * spent the gesture before the move went off — a Double Slap slapped
   * for a second and three quarters and then hit, and a slow move
   * played its one swing in slow motion. Charge is drawn as a loop, so
   * it fills a window of any length by repeating rather than by
   * dragging
   */
  const working = unit.casting ?? unit.channeling;

  if (working != null) {
    return { animation: SpriteAnim.Charge, duration: null, loop: true };
  }

  // Standing about is where what is being done **to** it shows: asleep,
  // frozen, flinching out of the turn it had. It looks at the sheet in
  // hand rather than at a table of which species owns which clip, the
  // same way a cast does
  const suffering = pickStatusCast(
    (status) => unit.getStatus(status) != null,
    (name) => sprite.has(name),
  );

  if (suffering != null) {
    return { animation: suffering, duration: null, loop: true };
  }
  return { animation: SpriteAnim.Idle, duration: null, loop: true };
}
