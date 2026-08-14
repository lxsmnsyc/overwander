import DirectionalEffectSprite from '../../directional-effect-sprite';
import EffectSprite from '../../effect-sprite';

/**
 * What a move looks like when it goes off, and the shared machinery
 * for saying so.
 *
 * The battle canvas draws a move as a dot crossing the field, which is
 * honest about *when* something lands and says nothing at all about
 * what it is. A move visual is the other half: the flash, the ring,
 * the mark left over the whoever it hit.
 *
 * Almost none of that is bespoke drawing. The collection under
 * `public/sprites/effects` already holds the pictures, so a visual is
 * mostly a **running order** — this sheet, over there, starting then,
 * lasting that long — and the work here is keeping several of those in
 * step off one clock. So a move declares
 * [`Beat`](#Beat)s and this plays them; nothing a move writes touches
 * a playhead or a frame index.
 *
 * Sheets are fetched once and shared. Twenty Supersonics in a raid are
 * one download of `effects/19`, and each performance clones the sprite
 * so it gets a playhead of its own — a clone shares the loaded image
 * and nothing else.
 */

/** A position on the canvas, as `[x, y]`. */
export type Point = [x: number, y: number];

/** Where a performance is happening, in canvas pixels. */
export interface MoveStage {
  /** The caster's body, as the field has it. */
  source: Point;
  /**
   * Every body it landed on. A move that hit nothing — a miss, or a
   * status on the caster — arrives with none, and a beat that had
   * nowhere to draw simply does not draw
   */
  targets: Point[];
  /**
   * How big the field is drawing its pokemon. Effects are authored at
   * the same scale the sheets are, so passing the field's own scale
   * keeps a ring the size of the pokemon it came off rather than the
   * size of the window
   */
  scale: number;
}

/**
 * One sheet playing, once, somewhere.
 *
 * `at` and `span` are the running order — when it starts and how long
 * it is stretched over — and `places` is what makes a beat worth more
 * than a single draw call: it answers with a point per copy, so one
 * beat covers every target a move hit without the move counting them
 */
export interface Beat {
  /** Sheet folder under `public/sprites`, e.g. `effects/19`. */
  sheet: string;
  /** Milliseconds into the performance that this beat starts. */
  at: number;
  /**
   * How long the clip is stretched over. The effect sheets are drawn
   * short — a ring is eight ticks, an eighth of a second — and a move
   * wants them held for as long as the move takes, so this is nearly
   * always longer than the sheet's own length
   */
  span: number;
  /**
   * Where the copies go. One point, one copy.
   *
   * `share` is how far through **this beat** the clock is, from 0 to
   * 1, which is what lets a beat move: a ring crossing the field is
   * one beat placed a little further along each frame, rather than a
   * second kind of thing that has to be tracked
   */
  places: (stage: MoveStage, share: number) => Point[];
  /** Multiplier on the stage's scale, for a beat drawn bigger or smaller. */
  scale?: number;
  /** How solid it is drawn, from 0 to 1. */
  alpha?: number;
  /**
   * Where the sheet should point.
   *
   * Setting this plays the beat through
   * [`DirectionalEffectSprite`](../../directional-effect-sprite.ts):
   * the sheet is pinned at its place and turned so its length runs
   * toward the point this answers with. A jet leaving a caster aims at
   * whatever it is hitting; a splash coming off a target aims back at
   * whoever fired it
   */
  aim?: (stage: MoveStage, share: number) => Point;
  /**
   * Where on the cell an aimed beat is pinned, in cell pixels. The top
   * middle by default, which is where the directional sheets grow
   * their effect out of; a splash is pinned at its foot instead,
   * because that is the part touching whatever it landed on
   */
  pivot?: Point;
}

const EFFECT_ROOT = '/sprites';

/**
 * Every sheet asked for so far. A failure is remembered as a failure:
 * a sheet that is not there should cost one 404, not one per cast.
 *
 * Aimed and unaimed are held apart, because they are different classes
 * over the same bytes and there is no way to hand a loaded image from
 * one to the other. A sheet wanted both ways is fetched twice, which
 * no move does yet and which the browser cache would answer anyway
 */
const SHEETS = new Map<string, Promise<EffectSprite | null>>();

/**
 * One sheet, fetched once however many moves want it.
 *
 * What comes back is the shared original and is never played: a caller
 * clones it, because a playhead belongs to a performance and an image
 * belongs to everybody
 */
export async function loadEffect(sheet: string, aimed = false): Promise<EffectSprite | null> {
  const key = aimed ? `${sheet}!` : sheet;
  const known = SHEETS.get(key);

  if (known != null) {
    return known;
  }

  const path = `${EFFECT_ROOT}/${sheet}`;
  const loading = (aimed ? DirectionalEffectSprite.fetch(path) : EffectSprite.fetch(path))
    .then(async (sprite) => sprite.load())
    .catch(() => null);

  SHEETS.set(key, loading);
  return loading;
}

/** A beat with its own copy of the sheet and its own playhead. */
interface Playing {
  beat: Beat;
  sprite: EffectSprite;
  started: boolean;
}

/**
 * A running order, played off one clock.
 *
 * It is deliberately dumb about time: the canvas hands it however many
 * milliseconds have gone by and it hands each beat the same, which is
 * what keeps three rings a tenth of a second apart staying a tenth of
 * a second apart however the frame rate wanders
 */
export default class MoveVisual {
  private readonly playing: Playing[] = [];

  /** How long the whole performance lasts, in milliseconds. */
  readonly duration: number;

  private elapsed = 0;

  constructor(beats: Beat[], sprites: (EffectSprite | null)[]) {
    for (let at = 0; at < beats.length; at += 1) {
      const sprite = sprites[at];

      // A beat whose sheet never arrived is left out rather than
      // stalling the performance: a move should still go off with a
      // piece of it missing
      if (sprite != null) {
        this.playing.push({ beat: beats[at], sprite: sprite.clone(), started: false });
      }
    }
    this.duration = beats.reduce((longest, beat) => Math.max(longest, beat.at + beat.span), 0);
  }

  /**
   * Load every sheet a running order names and hand back the
   * performance ready to play
   */
  static async of(beats: Beat[]): Promise<MoveVisual> {
    return new MoveVisual(
      beats,
      await Promise.all(beats.map(async (beat) => loadEffect(beat.sheet, beat.aim != null))),
    );
  }

  /** Whether it has run its course. */
  get finished(): boolean {
    return this.elapsed >= this.duration;
  }

  /** How far through it is, from 0 to 1. */
  get progress(): number {
    return this.duration > 0 ? Math.min(1, this.elapsed / this.duration) : 1;
  }

  /** Start it over, without refetching anything. */
  restart(): void {
    this.elapsed = 0;
    for (const one of this.playing) {
      one.started = false;
      one.sprite.stop();
    }
  }

  /**
   * Move the whole performance on, in milliseconds.
   *
   * A beat is started the first time the clock reaches it and then
   * ticked with everybody else, so a beat that begins mid-frame loses
   * at most that frame rather than drifting for the rest of the clip
   */
  advance(elapsed: number): void {
    this.elapsed += elapsed;
    for (const one of this.playing) {
      if (!one.started && this.elapsed >= one.beat.at) {
        one.started = true;
        one.sprite.play({ duration: one.beat.span });
        one.sprite.advance(Math.min(this.elapsed - one.beat.at, one.beat.span));
        continue;
      }
      if (one.started) {
        one.sprite.advance(elapsed);
      }
    }
  }

  /**
   * Draw whatever is showing.
   *
   * A beat that has not started yet draws nothing, and one that has
   * ended holds its last frame — which is what a mark left hanging
   * over a confused pokemon is, so it is left to the running order to
   * end the beat rather than to the drawing to hide it
   */
  draw(context: CanvasRenderingContext2D, stage: MoveStage): void {
    for (const one of this.playing) {
      if (!one.started || this.elapsed > one.beat.at + one.beat.span) {
        continue;
      }
      const span = Math.max(1, one.beat.span);
      const share = Math.min(1, Math.max(0, (this.elapsed - one.beat.at) / span));
      const placement = {
        scale: stage.scale * (one.beat.scale ?? 1),
        alpha: one.beat.alpha,
      };
      const aim = one.beat.aim;
      const sprite = one.sprite;

      for (const [x, y] of one.beat.places(stage, share)) {
        if (aim != null && sprite instanceof DirectionalEffectSprite) {
          const [toX, toY] = aim(stage, share);

          if (one.beat.pivot != null) {
            sprite.pivot = one.beat.pivot;
          }
          sprite.aimAt(x, y, toX, toY);
        }
        sprite.draw(context, x, y, placement);
      }
    }
  }
}
