import type { Point } from '../../stage';
import {
  between,
  box,
  bubble,
  burst,
  chevrons,
  decay,
  edge,
  fade,
  heart,
  lighten,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  slash,
  spiral,
  spread,
  star,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** A music note: a round head, a stem and a flag */
function note(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
  scale: number,
): void {
  context.beginPath();
  context.ellipse(x, y, size * 0.35, size * 0.28, -0.4, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.beginPath();
  context.moveTo(x + size * 0.3, y);
  context.lineTo(x + size * 0.3, y - size * 1.1);
  context.lineTo(x + size * 0.7, y - size * 0.75);
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = 1.8 * scale;
  context.stroke();
}

/** A bell hanging from its crown, turned by `tilt` */
function bell(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  tilt: number,
  color: string,
  alpha: number,
  scale: number,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(tilt);
  context.beginPath();
  context.moveTo(-size * 0.7, size);
  context.quadraticCurveTo(-size * 0.5, -size * 0.2, 0, 0);
  context.quadraticCurveTo(size * 0.5, -size * 0.2, size * 0.7, size);
  context.closePath();
  context.fillStyle = fade(color, alpha * 0.35);
  context.fill();
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = 2 * scale;
  context.stroke();
  context.restore();
}

/** Curse: the nail's steel */
export const NAIL = '#c8c8d4';

/** Curse: when each of its three blows lands, as shares of the span */
export const NAIL_BLOWS = [0.2, 0.4, 0.6];

/** How far Curse's nail has been driven in, from 0 to 1 */
export function nailDriven(share: number): number {
  let driven = 0;

  for (const blow of NAIL_BLOWS) {
    driven += Math.max(0, Math.min(1, (share - blow) / 0.05)) / NAIL_BLOWS.length;
  }
  return driven;
}

/** An eye from the front: almond lids `open` from 0 to 1, a coloured iris and a slit pupil */
function eye(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  open: number,
  color: string,
  alpha: number,
  scale: number,
): void {
  const lid = size * 0.55 * open;
  const tall = Math.min(size * 0.42, lid * 0.75);

  context.beginPath();
  context.moveTo(x - size, y);
  context.quadraticCurveTo(x, y - lid * 2, x + size, y);
  context.quadraticCurveTo(x, y + lid * 2, x - size, y);
  context.closePath();
  context.fillStyle = fade('#fffbe8', alpha * 0.9);
  context.fill();
  context.strokeStyle = fade('#2a1a10', alpha);
  context.lineWidth = 2.4 * scale;
  context.stroke();
  if (tall <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, size * 0.42, tall, 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.beginPath();
  context.ellipse(x, y, size * 0.09, tall * 0.9, 0, 0, Math.PI * 2);
  context.fillStyle = fade('#1a1010', alpha);
  context.fill();
}

/** The anger mark: four arcs bowed in toward a middle */
function vein(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
  scale: number,
): void {
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = 3.2 * scale;
  context.lineCap = 'round';
  for (let quarter = 0; quarter < 4; quarter += 1) {
    const angle = Math.PI / 4 + (quarter * Math.PI) / 2;

    context.beginPath();
    context.arc(
      x + Math.cos(angle) * size,
      y + Math.sin(angle) * size,
      size * 0.7,
      angle + Math.PI - 0.75,
      angle + Math.PI + 0.75,
    );
    context.stroke();
  }
  context.lineCap = 'butt';
}

/**
 * The shapes that are done to a mind rather than to a body: a haze, a
 * mark, a dazzle, a mood
 */
const minds = {
  // Powder, gas, anything that hangs in the air
  Haze(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    motes(context, at, size * 1.6, many(12, weight), seed, share, {
      ...paint,
      alpha: swell(share) * 0.8,
      width: 2.6 * stage.scale,
    });
  },

  // A status arriving: rings closing on whatever it was aimed at
  Mark(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let step = 0; step < 2; step += 1) {
      const held = Math.max(0, Math.min(1, share * 1.6 - step * 0.3));

      ring(context, at, size * (1.6 - held * 1.1), {
        ...paint,
        alpha: swell(held) * 0.9,
        width: 2.5 * stage.scale,
      });
    }
  },

  // A light in the eyes: it whites out and is gone. Nothing travels
  // and nothing lands, which is what separates this from a shockwave
  Dazzle(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    // Up almost at once and down slowly, the way a bright light is
    // seen: half the phase is the eye recovering
    const glare = share < 0.15 ? share / 0.15 : decay((share - 0.15) / 0.85);

    orb(context, at, size * (0.6 + glare * 1.9), { ...paint, alpha: glare });
    burst(context, at, size * (1 + glare * 2.4), 10, seed, {
      ...paint,
      alpha: glare * 0.9,
      width: 2 * stage.scale,
    });
  },

  // A spiral winding down: what the sleeping and the confusing moves
  // have always looked like
  Trance(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    spiral(context, at, size * 1.6 * (1 - share * 0.3), 2.5, share, {
      ...paint,
      alpha: swell(share) + 0.2,
      width: 2.4 * stage.scale,
    });
  },

  // Steadying itself: the spokes come in rather than out, and what is
  // left is a core held tight
  Nerve(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    burst(context, at, size * (2 - swell(share) * 1.2), 6, seed, {
      ...paint,
      alpha: swell(share) * 0.8,
      width: 2.4 * stage.scale,
    });
    ring(context, at, size * (1.4 - swell(share) * 0.6), {
      ...paint,
      alpha: swell(share) * 0.7,
      width: 2.6 * stage.scale,
    });
    orb(context, at, size * (0.2 + swell(share) * 0.3), { ...paint, alpha: swell(share) });
  },

  // Struck, three times. Each beat leaves at once and fades, so what
  // reads is the rhythm rather than one swell
  Drum(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let beat = 0; beat < 3; beat += 1) {
      const held = share * 3 - beat;

      if (held <= 0 || held >= 1) {
        continue;
      }
      ring(context, at, size * (0.4 + held * 2.2), {
        ...paint,
        alpha: decay(held),
        width: 4 * stage.scale,
      });
      ripple(context, at, size * (0.5 + held * 1.8), {
        ...paint,
        alpha: decay(held) * 0.6,
        width: 3 * stage.scale,
      });
    }
  },

  // It went past. Drawn small and grey on purpose: a miss is news,
  // and a miss that looks like a hit is worse than nothing
  // Ghost: a dark thing gathering, wisping off, and closing in on it
  Shade(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    orb(context, at, size * (0.45 + swell(share) * 0.75), {
      ...paint,
      alpha: swell(share) * 0.85,
    });
    motes(context, at, size * 1.7, many(6, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 2.4 * stage.scale,
    });
    // Inward rather than out: what a ghost move does is close on it
    ring(context, at, size * (1.9 - share * 1.2), {
      ...paint,
      alpha: swell(share) * 0.7,
      width: 2.2 * stage.scale,
    });
  },

  // What a pokemon is feeling rather than what it was hit with
  Hearts(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const rising = many(4, weight);

    for (let one = 0; one < rising; one += 1) {
      const held = Math.max(0, Math.min(1, share * 1.4 - (one / rising) * 0.5));

      if (held <= 0) {
        continue;
      }
      heart(
        context,
        [at[0] + spread(seed, one) * size * 0.9, at[1] - size * 2 * held],
        size * 0.42,
        { ...paint, alpha: decay(held) },
      );
    }
  },

  Whiff(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const drift = share * size * 0.8;

    slash(context, [at[0] + drift, at[1] - drift * 0.4], size * 0.9, -0.5, {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2 * stage.scale,
    });
  },

  // The air bending: rings that do not leave, they distort
  Warp(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let shell = 0; shell < 3; shell += 1) {
      const held = (share * 1.2 + shell * 0.3) % 1;

      context.save();
      context.translate(at[0], at[1]);
      context.rotate(held * Math.PI);
      ring(context, [0, 0], size * (0.5 + held), {
        ...paint,
        alpha: swell(held) * 0.9,
        width: 2.6 * stage.scale,
      });
      context.restore();
    }
  },

  // A breeze of petals over it: they cross rather than burst, and
  // each one turns as it goes, which is what separates blown petals
  // from thrown ones
  Petals(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let one = 0; one < many(9, weight); one += 1) {
      // Staggered, so petals keep arriving for the whole of it rather
      // than crossing as one row
      const held = (share * 1.25 + noise(seed, one)) % 1;
      const drift = (held - 0.5) * size * 4.4;
      const sway = Math.sin(held * Math.PI * 2.2 + one) * size * 0.55;
      const high = (noise(seed, one + 30) - 0.5) * size * 2;

      petal(
        context,
        [at[0] + drift, at[1] + high + sway],
        size * (0.22 + noise(seed, one + 60) * 0.12),
        held * Math.PI * 3 + one,
        { ...paint, alpha: 0.35 + swell(held) * 0.65 },
      );
    }
  },

  // A room laid over the field. It goes up and stands, the way a
  // screen does: what it changes lasts, so a flash would be a lie
  // about how long it is there
  Grid(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const up = Math.min(1, share * 3);
    const alpha = share < 0.8 ? 0.4 + up * 0.4 : decay(share) * 4;

    box(context, [at[0], at[1] + size * 0.6], size * 3.4 * up, size * 2.6 * up, size * 1.1 * up, {
      ...paint,
      alpha,
      width: 2.2 * stage.scale,
    });
  },

  // Weight coming down over everything: chevrons falling rather than
  // rising, and the ground pressed flat under them
  Press(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let column = 0; column < 3; column += 1) {
      const x = at[0] + (column - 1) * size * 1.9;

      chevrons(
        context,
        [x, at[1] - size * 0.4],
        size,
        2,
        (share + noise(seed, column) * 0.2) % 1,
        { ...paint, alpha: swell(share) * 0.85, width: 2.6 * stage.scale },
        // Falling rather than rising: the same marks a stat drop is
        // drawn with, which is what makes this read as weight
        -1,
      );
    }
    // Flattened rather than round: what is being drawn is the ground
    // taking the weight
    ripple(context, [at[0], at[1] + size * 0.6], size * (1.6 + swell(share) * 1.4), {
      ...paint,
      alpha: swell(share) * 0.5,
      width: 2.4 * stage.scale,
    });
  },
  // Music notes drifting round it
  Song(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const color = lighten(paint.color, 0.2);

    ring(context, at, size * (0.8 + share), {
      color,
      alpha: swell(share) * 0.5,
      width: 2 * stage.scale,
    });
    for (let one = 0; one < many(6, weight); one += 1) {
      const held = (share * 1.3 + noise(seed, one)) % 1;
      const angle = noise(seed, one + 10) * Math.PI * 2 + share * Math.PI * 2;
      const round = size * (1.3 - held * 0.4);

      note(
        context,
        [
          at[0] + Math.cos(angle) * round,
          at[1] - size * (held * 1.4 - 0.2) + Math.sin(angle) * round * 0.3,
        ],
        size * 0.35,
        color,
        swell(held),
        stage.scale,
      );
    }
  },

  // Shock arcs rolling out of the caster toward it, widening as they go
  Roar(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const angle = Math.atan2(at[1] - stage.source[1], at[0] - stage.source[0]);
    const light = lighten(paint.color, 0.4);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.4 + pulse * 0.33) % 1;
      const front = between(stage.source, at, held * 0.9);
      const radius = size * (0.5 + held * 1.6);

      context.beginPath();
      context.arc(
        front[0] - Math.cos(angle) * radius,
        front[1] - Math.sin(angle) * radius,
        radius,
        angle - 0.9,
        angle + 0.9,
      );
      context.strokeStyle = fade(light, decay(held) * 0.9);
      context.lineWidth = (2.4 + held * 2) * stage.scale;
      context.stroke();
    }
    ring(context, at, size * (0.6 + share * 1.2), {
      color: light,
      alpha: swell(share) * 0.6,
      width: 2 * stage.scale,
    });
  },

  // A golden bell swinging over it, ringing out
  Chime(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const light = lighten(paint.color, 0.4);
    const shown = Math.min(1, share * 4) * (share < 0.8 ? 1 : decay((share - 0.8) / 0.2));
    const crown: Point = [at[0], at[1] - size * 1.8];

    bell(
      context,
      crown,
      size * 0.9,
      Math.sin(share * Math.PI * 4) * 0.5,
      paint.color,
      shown,
      stage.scale,
    );
    for (let wave = 0; wave < 3; wave += 1) {
      const held = (share * 2 + wave / 3) % 1;

      ring(context, [crown[0], crown[1] + size * 0.5], size * (0.4 + held * 2), {
        color: light,
        alpha: decay(held) * shown,
        width: 2 * stage.scale,
      });
    }
    for (let glint = 0; glint < 6; glint += 1) {
      star(
        context,
        [at[0] + spread(seed, glint) * size * 1.4, at[1] + spread(seed, glint + 10) * size * 1.2],
        size * 0.2,
        0,
        { color: '#ffffff', alpha: swell((share * 2 + noise(seed, glint)) % 1) * shown },
      );
    }
  },

  // Poison welling up round it: bubbles rising off a sickly pool and popping
  Toxin(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 5) * (share < 0.75 ? 1 : decay((share - 0.75) / 0.25));
    const light = lighten(paint.color, 0.3);

    ripple(context, [at[0], at[1] + size * 0.9], size * (1.2 + swell(share) * 0.6), {
      ...paint,
      alpha: shown * 0.7,
      width: 3 * stage.scale,
    });
    for (let one = 0; one < many(10, weight); one += 1) {
      const held = (share * 1.5 + noise(seed, one)) % 1;
      const spot: Point = [
        at[0] + spread(seed, one + 10) * size * 1.3,
        at[1] + size * 0.9 - held * size * 2.4,
      ];
      const radius = size * (0.12 + noise(seed, one + 20) * 0.14) * (0.5 + held);

      if (held < 0.85) {
        bubble(context, spot, radius, { color: light, alpha: shown, width: 1.6 * stage.scale });
        continue;
      }
      const pop = (held - 0.85) / 0.15;

      ring(context, spot, radius * (1 + pop), {
        color: light,
        alpha: shown * decay(pop),
        width: 1.4 * stage.scale,
      });
    }
  },

  // Spores drifting down over it, crackling where they settle
  Spores(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 4) * (share < 0.7 ? 1 : decay((share - 0.7) / 0.3));

    for (let one = 0; one < many(16, weight); one += 1) {
      const fall = (share * 1.2 + noise(seed, one)) % 1;
      const radius = stage.scale * (1.6 + noise(seed, one + 20) * 1.6);

      context.beginPath();
      context.ellipse(
        at[0] + spread(seed, one + 10) * size * 1.6 + Math.sin(fall * 6 + one) * size * 0.25,
        at[1] - size * 2 + fall * size * 2.8,
        radius,
        radius,
        0,
        0,
        Math.PI * 2,
      );
      context.fillStyle = fade(paint.color, shown * swell(fall));
      context.fill();
    }
    if (share < 0.3) {
      return;
    }
    // A new flicker every twelfth of the span, so the crackle jumps about rather than sliding
    const flicker = Math.floor(share * 12);

    for (let zap = 0; zap < 2; zap += 1) {
      burst(
        context,
        [
          at[0] + spread(seed, flicker * 7 + zap) * size * 0.9,
          at[1] + spread(seed, flicker * 7 + zap + 3) * size * 0.8,
        ],
        size * 0.4,
        4,
        seed + flicker + zap,
        { color: '#fff6a0', alpha: shown * 0.9, width: 1.8 * stage.scale },
      );
    }
  },

  // An eye opening over it and flashing, the look that freezes something in place
  Stare(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const open = Math.min(1, share / 0.25) * (share < 0.8 ? 1 : decay((share - 0.8) / 0.2));
    const centre: Point = [at[0], at[1] - size * 0.4];
    const light = lighten(paint.color, 0.5);
    const flash = (share - 0.25) / 0.3;

    eye(context, centre, size * 1.2, open, paint.color, Math.min(1, open * 3), stage.scale);
    if (flash > 0 && flash < 1) {
      burst(context, centre, size * (1.4 + flash * 1.6), 12, seed, {
        color: light,
        alpha: decay(flash),
        width: 2.4 * stage.scale,
      });
      ring(context, at, size * (0.6 + flash * 1.4), {
        color: light,
        alpha: decay(flash) * 0.8,
        width: 2.4 * stage.scale,
      });
    }
  },

  // Sparkles clapping together over its head three times, calling for more
  Applause(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const meet: Point = [at[0], at[1] - size * 1.4];
    const light = lighten(paint.color, 0.5);

    for (let beat = 0; beat < 3; beat += 1) {
      const held = share * 3 - beat;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const closing = Math.min(1, held / 0.35);

      if (closing < 1) {
        for (const side of [-1, 1]) {
          star(
            context,
            [meet[0] + side * size * 1.3 * (1 - closing), meet[1] + size * 0.3 * (1 - closing)],
            size * 0.28,
            closing * 3 * side,
            { color: paint.color, alpha: 0.95 },
          );
        }
        continue;
      }
      const pop = (held - 0.35) / 0.65;

      star(context, meet, size * (0.35 + pop * 0.4), pop, { color: '#ffffff', alpha: decay(pop) });
      ring(context, meet, size * (0.2 + pop * 1.1), {
        color: light,
        alpha: decay(pop),
        width: 2.2 * stage.scale,
      });
      for (let bit = 0; bit < 5; bit += 1) {
        const angle = (bit / 5) * Math.PI * 2 + noise(seed, beat * 5 + bit);

        star(
          context,
          [
            meet[0] + Math.cos(angle) * size * pop * 1.2,
            meet[1] + Math.sin(angle) * size * pop * 1.2 + pop * pop * size * 0.6,
          ],
          size * 0.14,
          angle,
          { color: paint.color, alpha: decay(pop) },
        );
      }
    }
  },

  // An anger mark throbbing on its head
  Vein(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 6) * (share < 0.8 ? 1 : decay((share - 0.8) / 0.2));
    const spot: Point = [at[0] + size * 0.8, at[1] - size * 1.2];
    const throb = 1 + Math.abs(Math.sin(share * Math.PI * 3)) * 0.35;

    vein(context, spot, size * 0.42 * throb, paint.color, shown, stage.scale);
    for (let beat = 0; beat < 3; beat += 1) {
      const held = share * 3 - beat;

      if (held <= 0 || held >= 1) {
        continue;
      }
      ring(context, spot, size * (0.5 + held * 0.9), {
        color: lighten(paint.color, 0.3),
        alpha: decay(held) * shown * 0.7,
        width: 2 * stage.scale,
      });
    }
  },

  // A nail driven into it in three blows, under a closing ring of dark
  Nail(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = Math.min(1, share * 6) * (share < 0.8 ? 1 : decay((share - 0.8) / 0.2));
    const tip: Point = [at[0], at[1] - size * 0.2 + nailDriven(share) * size * 0.7];
    const head: Point = [tip[0], tip[1] - size * 1.4];

    ring(context, at, size * (1.9 - share * 1.1), {
      ...paint,
      alpha: swell(share) * 0.7,
      width: 2.4 * stage.scale,
    });
    edge(context, head, tip, size * 0.09, 0, { color: NAIL, alpha: shown });
    edge(
      context,
      [head[0] - size * 0.32, head[1]],
      [head[0] + size * 0.32, head[1]],
      size * 0.08,
      0,
      {
        color: NAIL,
        alpha: shown,
      },
    );
    for (const [one, blow] of NAIL_BLOWS.entries()) {
      const since = (share - blow - 0.05) / 0.25;

      if (since <= 0 || since >= 1) {
        continue;
      }
      ring(context, head, size * (0.2 + since * 0.8), {
        color: lighten(paint.color, 0.4),
        alpha: decay(since),
        width: 2.4 * stage.scale,
      });
      burst(context, head, size * (0.4 + since * 0.6), 6, seed + one, {
        color: '#ffffff',
        alpha: decay(since),
        width: 2 * stage.scale,
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default minds;
