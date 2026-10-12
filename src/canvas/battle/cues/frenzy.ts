import PaintedVisual from '../moves/__painted';
import { fade, ring, ripple, swell } from '../moves/__paint';
import { aside, floorOf } from '../moves/lit/shapes';
import { LIFT, REACH } from './shapes';

/**
 * A Noble's burst telegraphed across its windup: a glow gathering on
 * the Noble, and a warning mark on every foe it is about to land on.
 * It is the party's cue to raise a guard, so it is loud on purpose,
 * unlike every other cue. Each is painted on its own body, so a mark
 * is sized to the pokemon it warns rather than to the Noble.
 */

const GLOW = '#ffcf4a';
const WARN = '#ff3b30';

/** How often the warning marks blink across the windup */
const BLINKS = 6;

function blink(share: number): number {
  return 0.6 + 0.4 * Math.sin(share * Math.PI * 2 * BLINKS);
}

/** The Noble gathering itself: rings closing in on it and a glow building under it */
export function frenzyGathering(windup: number): PaintedVisual {
  return new PaintedVisual(
    windup,
    (context, stage, share) => {
      const size = REACH * stage.scale;

      for (let band = 0; band < 2; band += 1) {
        const closing = (share * 2 + band / 2) % 1;

        ring(context, stage.source, size * (2.6 - closing * 1.8), {
          color: GLOW,
          alpha: swell(closing) * 0.8,
          width: 3 * stage.scale,
        });
      }
      ripple(context, [stage.source[0], stage.source[1] + size * 1.2], size * (1.2 + share), {
        color: GLOW,
        alpha: 0.3 + share * 0.5,
        width: 3 * stage.scale,
      });
    },
    (kit, stage, share) => {
      const size = REACH * stage.size;

      for (let band = 0; band < 2; band += 1) {
        const closing = (share * 2 + band / 2) % 1;

        kit.ring(stage.source, size * (2.6 - closing * 1.8), 0.08, GLOW, swell(closing) * 0.8);
      }
      kit.glow(stage.source, size * (0.6 + share), GLOW, share * 0.5, 0.5);
      kit.ripple(floorOf(stage.source), size * (1.2 + share), 0.1, GLOW, 0.3 + share * 0.5);
    },
  );
}

/** One foe marked: a ring tightening at its feet and a warning sign over its head */
export function frenzyWarning(windup: number): PaintedVisual {
  return new PaintedVisual(
    windup,
    (context, stage, share) => {
      const size = REACH * stage.scale;
      const pulse = blink(share);
      const foot: [number, number] = [stage.source[0], stage.source[1] + size * 0.9];
      const head: [number, number] = [stage.source[0], stage.source[1] - LIFT * stage.scale * 1.4];
      const mark = size * 0.8;

      ripple(context, foot, size * (2 - share * 0.7), {
        color: WARN,
        alpha: pulse * 0.8,
        width: 2 * stage.scale,
      });
      context.fillStyle = fade(WARN, pulse);
      context.beginPath();
      context.moveTo(head[0], head[1] - mark);
      context.lineTo(head[0] + mark * 0.85, head[1] + mark * 0.5);
      context.lineTo(head[0] - mark * 0.85, head[1] + mark * 0.5);
      context.closePath();
      context.fill();
      context.fillStyle = fade('#ffffff', pulse);
      context.fillRect(head[0] - mark * 0.1, head[1] - mark * 0.5, mark * 0.2, mark * 0.55);
      context.fillRect(head[0] - mark * 0.1, head[1] + mark * 0.15, mark * 0.2, mark * 0.18);
    },
    // Painted rather than lit, so the warning holds on snow and sand
    (kit, stage, share) => {
      const size = REACH * stage.size;
      const pulse = blink(share);
      const head = aside(kit, stage.source, 0, LIFT * stage.size * 1.4);

      kit.ripple(floorOf(stage.source), size * (2 - share * 0.7), 0.12, WARN, pulse * 0.8, {
        add: 0,
      });
      kit.near(size);
      kit.ring(head, size * 0.6, 0.4, WARN, pulse, { add: 0 });
      kit.star(head, size * 0.8, 0, '#ffffff', pulse);
      kit.near(0);
    },
  );
}
