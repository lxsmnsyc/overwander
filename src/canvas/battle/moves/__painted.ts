import type { Stage } from '../stage';

/**
 * A move's picture, drawn rather than played.
 *
 * It is the same contract the sheet-backed
 * [`MoveVisual`](./__visual.ts) answers — the field advances it by the
 * battle's own tick and draws it, and drops it when it is finished —
 * so the canvas does not care which kind it is holding.
 *
 * What it holds is one function. A painter is handed the stage and how
 * far through it is, and draws that instant; it keeps nothing between
 * frames, which is what lets a battle be stepped, paused or replayed
 * and still draw the same picture.
 */

/** What a phase draws at one instant. */
export type Painter = (
  context: CanvasRenderingContext2D,
  stage: Stage,
  share: number,
) => void;

/** What the field holds: either kind of picture answers this. */
export interface FieldVisual {
  readonly duration: number;
  readonly finished: boolean;
  advance(elapsed: number): void;
  draw(context: CanvasRenderingContext2D, stage: Stage): void;
}

export default class PaintedVisual implements FieldVisual {
  readonly duration: number;

  private readonly painter: Painter;

  private elapsed = 0;

  constructor(duration: number, painter: Painter) {
    this.duration = Math.max(1, duration);
    this.painter = painter;
  }

  get finished(): boolean {
    return this.elapsed >= this.duration;
  }

  get progress(): number {
    return Math.min(1, this.elapsed / this.duration);
  }

  advance(elapsed: number): void {
    this.elapsed += elapsed;
  }

  draw(context: CanvasRenderingContext2D, stage: Stage): void {
    // Whatever a painter leaves behind — a line width, a cap, an alpha
    // — is its own business rather than the next painter's
    context.save();
    this.painter(context, stage, this.progress);
    context.restore();
  }
}
