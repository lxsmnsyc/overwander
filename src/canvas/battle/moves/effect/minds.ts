import {
  box,
  burst,
  chevrons,
  decay,
  heart,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  slash,
  spiral,
  spread,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

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
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default minds;
