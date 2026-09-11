import type { Point } from '../../stage';
import { beam, between, chevrons, decay, motes, noise, orb, pane, ring, swell } from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/**
 * The shapes that mend, ward or pass something along rather than take
 * anything away
 */
const care = {
  // Health coming back: motes rising into the body
  Mend(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let mote = 0; mote < many(9, weight); mote += 1) {
      const held = (share + noise(seed, mote)) % 1;
      const angle = noise(seed, mote + 20) * Math.PI * 2;
      const x = at[0] + Math.cos(angle) * size * (1 - held) * 1.2;
      const y = at[1] + size * 0.8 - held * size * 1.8;

      orb(context, [x, y], 2.5 * stage.scale, { ...paint, alpha: swell(held) });
    }
    ring(context, at, size * (1.2 - swell(share) * 0.3), {
      ...paint,
      alpha: swell(share) * 0.5,
      width: 2 * stage.scale,
    });
  },

  // Something put up: a wall the caster stands behind
  Ward(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let shell = 0; shell < 3; shell += 1) {
      ring(context, at, size * (1.3 + shell * 0.22) * (0.6 + swell(share) * 0.5), {
        ...paint,
        alpha: swell(share) * (0.8 - shell * 0.2),
        width: 2 * stage.scale,
      });
    }
  },

  // A screen: a pane of coloured glass put up over the pokemon it is
  // for, rather than a shell closing on it. It goes up fast and then
  // stands, because standing there is the whole of what it does
  Screen(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const up = Math.min(1, share * 3);
    // Held bright and taken away at the end, so what is read is a
    // wall rather than a flash
    const alpha = share < 0.8 ? 0.55 + up * 0.35 : decay(share) * 4.5;
    const foot: Point = [at[0], at[1] + size * 0.7];
    const height = size * 3.2 * up;

    pane(context, foot, size * 1.8, height, {
      ...paint,
      alpha,
      width: 2.6 * stage.scale,
    });
    // The light running across the face of it, which is what says
    // glass rather than paper
    if (up >= 1) {
      const along = ((share - 0.33) / 0.67) * 2 - 0.5;
      const x = at[0] + (along - 0.5) * size * 3.6;

      beam(context, [x, foot[1]], [x + size * 0.9, foot[1] - height], 1, size * 0.16, {
        ...paint,
        alpha: alpha * 0.5,
      });
    }
  },

  // What it takes, going home: the point of a drain is where the
  // health ends up, so the motes cross back to the caster
  Drain(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    ring(context, at, size * (1.2 - swell(share) * 0.6), {
      ...paint,
      alpha: decay(share),
      width: 2.5 * stage.scale,
    });
    for (let mote = 0; mote < many(6, weight); mote += 1) {
      const held = (share * 1.3 + noise(seed, mote) * 0.5) % 1;
      const drift = between(at, stage.source, held);

      orb(context, [drift[0], drift[1] - Math.sin(Math.PI * held) * size * 0.4], 3 * stage.scale, {
        ...paint,
        alpha: swell(held) * 0.9,
      });
    }
  },

  // Something about the pokemon itself went up
  // A stat going up, on whoever it went up on
  Boost(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    chevrons(context, at, size, 3, share, {
      ...paint,
      alpha: swell(share) + 0.2,
      width: 2.8 * stage.scale,
    });
  },

  // And going down: the same picture turned over, so a rise and a
  // drop are one thing read two ways rather than two pictures
  Drop(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    chevrons(
      context,
      at,
      size,
      3,
      share,
      { ...paint, alpha: swell(share) + 0.2, width: 2.8 * stage.scale },
      -1,
    );
  },

  // Handed on: what the pokemon was carrying lifts off it rather than
  // going off on it
  Relay(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const lift: Point = [at[0], at[1] - size * 2.4 * swell(share)];

    orb(context, lift, size * 0.32, { ...paint, alpha: 1 - share * 0.4 });
    ring(context, lift, size * (0.5 + share * 0.7), {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2.4 * stage.scale,
    });
    motes(context, at, size * 1.2, 5, seed, share, {
      ...paint,
      alpha: decay(share) * 0.7,
      width: 2 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default care;
