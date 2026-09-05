import type { Point } from '../../stage';
import {
  beam,
  between,
  bolt,
  bubble,
  burst,
  decay,
  fade,
  lash,
  lighten,
  motes,
  noise,
  orb,
  ring,
  ripple,
  shards,
  slash,
  spread,
  star,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { CHASM_GAPE, CHASM_RUN, CHASM_STEPS, CHASM_TEAR, REACH, landing, many } from './shapes';

/**
 * The shapes an element arrives as: fire, water, ice, grass, lightning
 * and the ground opening
 */
const elements = {
  // Weather setting in. It comes down over the field rather than
  // landing on anybody, so nothing here is drawn on the target
  Sky(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let fall = 0; fall < 9; fall += 1) {
      const held = (share * 1.2 + noise(seed, fall)) % 1;
      const x = at[0] + (noise(seed, fall + 40) - 0.5) * size * 5;

      orb(context, [x, at[1] - size * 5 + held * size * 5], 2.4 * stage.scale, {
        ...paint,
        alpha: swell(held) * 0.85,
      });
    }
    ripple(context, at, size * (1.4 + swell(share) * 1.2), {
      ...paint,
      alpha: swell(share) * 0.45,
      width: 2 * stage.scale,
    });
  },

  // A hit that takes the ground with it
  Blast(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    orb(context, at, size * (0.3 + share * 1.4), { ...paint, alpha: decay(share) });
    ring(context, at, size * (0.6 + share * 2.2), {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 3 * stage.scale,
    });
    shards(context, at, size * 1.8, many(7, weight), seed, share, {
      ...paint,
      alpha: decay(share),
      width: 2.4 * stage.scale,
    });
  },

  // Something special going off: a core, and a ring leaving it
  Bloom(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    orb(context, at, size * (0.5 + swell(share) * 0.6), { ...paint, alpha: 0.85 * decay(share) });
    ring(context, at, size * (0.5 + share * 1.6), {
      ...paint,
      alpha: decay(share),
      width: 2.5 * stage.scale,
    });
    motes(context, at, size * 1.4, many(6, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2 * stage.scale,
    });
  },

  // A beam arriving and holding for an instant
  Beam(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    // Out fast, held, then gone: a beam that fades as it travels is a
    // beam nobody sees arrive
    const reach = Math.min(1, share * 3);
    const fading = share < 0.7 ? 1 : decay(share) * 3;

    beam(context, stage.source, at, reach, size * 0.28 * fading, { ...paint, alpha: fading });
    if (reach >= 1) {
      orb(context, at, size * (0.6 + swell(share) * 0.5), { ...paint, alpha: decay(share) });
    }
  },

  // Lightning, from whoever fired it
  Zap(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    // Bright for most of it and then gone: lightning does not dim
    bolt(context, stage.source, at, seed, {
      ...paint,
      alpha: Math.min(1, decay(share) * 2.2),
      width: 3 * stage.scale * weight,
    });
    // A strong one forks
    if (weight > 1.15) {
      bolt(context, stage.source, at, seed + 17, {
        ...paint,
        alpha: Math.min(1, decay(share) * 1.6),
        width: 1.6 * stage.scale,
      });
    }
    burst(context, at, size * (0.5 + share), many(6, weight), seed, {
      ...paint,
      alpha: decay(share),
      width: 2 * stage.scale,
    });
  },

  // Fire: a core, and embers coming off it
  Flame(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    orb(context, [at[0], at[1] - size * share * 0.4], size * (0.7 + swell(share) * 0.5), {
      ...paint,
      alpha: 0.9 * decay(share),
    });
    motes(context, at, size * 1.6, many(8, weight), seed, share, {
      ...paint,
      alpha: decay(share),
      width: 2.2 * stage.scale,
    });
    // A big one throws a wall of it rather than a puff
    if (weight > 1.25) {
      for (let tongue = 0; tongue < 3; tongue += 1) {
        const angle = -Math.PI / 2 + (tongue - 1) * 0.7;
        const reach = size * (1 + share * 1.4);

        orb(
          context,
          [at[0] + Math.cos(angle) * reach * 0.6, at[1] + Math.sin(angle) * reach * 0.6],
          size * 0.5 * decay(share * 0.6),
          { ...paint, alpha: decay(share) * 0.8 },
        );
      }
    }
  },

  // Water: it lands, it spreads, it runs off
  Splash(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    ripple(context, at, size * (0.4 + share * 1.8), {
      ...paint,
      alpha: decay(share),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 1.5, many(10, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 2 * stage.scale,
    });
  },

  // Ice: it arrives in pieces, sweeps through and hangs about
  Frost(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    // The cold coming through, rather than a scatter standing still:
    // a wall of crystals crosses whatever it landed on
    for (let gust = 0; gust < many(2, weight); gust += 1) {
      const held = Math.max(0, Math.min(1, share * 1.5 - gust * 0.25));

      if (held > 0) {
        slash(context, at, size * (0.9 + gust * 0.4), Math.PI * (0.15 + gust * 0.2), {
          ...paint,
          alpha: swell(held) * 0.9,
          width: 3 * stage.scale,
        });
      }
    }
    shards(context, at, size * 1.5, many(7, weight), seed, share, {
      ...paint,
      alpha: decay(share),
      width: 2.6 * stage.scale,
    });
    // Left behind: the frost that does not blow away with the rest
    ring(context, at, size * (0.7 + share * 0.9), {
      ...paint,
      alpha: swell(share) * 0.7,
      width: 2 * stage.scale,
    });
  },

  // Grass: cuts and leaves
  Leafy(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let cut = 0; cut < many(2, weight); cut += 1) {
      const angle = noise(seed, cut) * Math.PI * 2;
      const held = Math.max(0, Math.min(1, share * 2 - cut * 0.25));

      if (held > 0) {
        slash(context, at, size * (0.7 + cut * 0.25), angle, {
          ...paint,
          alpha: decay(share),
          width: 3 * stage.scale,
        });
      }
    }
    motes(context, at, size * 1.3, many(5, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2 * stage.scale,
    });
  },

  // The ground itself
  Quake(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let wave = 0; wave < many(2, weight); wave += 1) {
      const held = Math.max(0, Math.min(1, share * 1.4 - wave * 0.22));

      if (held > 0) {
        ripple(context, at, size * held * 3.2, {
          ...paint,
          alpha: decay(held) * 0.9,
          width: 3 * stage.scale,
        });
      }
    }
    shards(context, at, size * 1.6, many(6, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2.4 * stage.scale,
    });
  },

  // A barrage: bubbles crowd whatever they hit and pop one after
  // another. The run of pops is the picture — all of them going at
  // once would read as a single splash
  Bubbles(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const count = many(9, weight);

    for (let one = 0; one < count; one += 1) {
      const held = Math.min(1, share * 1.6 - (one / count) * 0.6);

      if (held <= 0) {
        continue;
      }
      const angle = noise(seed, one) * Math.PI * 2;
      const reach = size * (0.3 + noise(seed, one + 20) * 0.8);
      const radius = size * 0.2 * (0.6 + noise(seed, one + 40) * 0.8);
      // Flattened sideways and lifted as it goes, since a bubble rises
      const spot: Point = [
        at[0] + Math.cos(angle) * reach,
        at[1] + Math.sin(angle) * reach * 0.7 - size * held * 0.35,
      ];

      if (held < 0.7) {
        bubble(context, spot, radius * (0.55 + held * 0.6), {
          ...paint,
          alpha: 0.9,
          width: 1.8 * stage.scale,
        });
        continue;
      }
      // Popped: what is left where it was, for the rest of its turn
      ring(context, spot, radius * (1 + (held - 0.7) * 4), {
        ...paint,
        alpha: decay((held - 0.7) / 0.3) * 0.85,
        width: 1.6 * stage.scale,
      });
    }
  },

  // A sound: rings leaving the caster and washing over what heard it
  Wave(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.3 + pulse * 0.28) % 1;
      const along = between(stage.source, at, held);

      ring(context, along, size * (0.3 + held * 0.9), {
        ...paint,
        alpha: decay(held) * 0.9,
        width: 2.4 * stage.scale,
      });
    }
  },

  // Wind: rings turning around the point rather than closing on it
  Swirl(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let turn = 0; turn < 3; turn += 1) {
      const angle = share * Math.PI * 3 + turn * 2;

      slash(context, at, size * (0.7 + turn * 0.3), angle, {
        ...paint,
        alpha: swell(share) * 0.9,
        width: 2.6 * stage.scale,
      });
    }
    motes(context, at, size * 1.5, many(5, weight), seed, share, {
      ...paint,
      alpha: swell(share) * 0.7,
      width: 2 * stage.scale,
    });
  },

  // Rocks coming down on it
  Rocks(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    const falling = many(4, weight);

    // Staggered by index rather than by the scatter, so the first one
    // is already on its way at the first frame: a picture that starts
    // empty reads as a move that did nothing
    for (let rock = 0; rock < falling; rock += 1) {
      const held = Math.max(0, Math.min(1, share * 1.6 - (rock / falling) * 0.55));
      const off = (noise(seed, rock + 12) - 0.5) * size * 2;

      if (held <= 0) {
        continue;
      }
      shards(
        context,
        [at[0] + off, at[1] - size * 3 * (1 - held)],
        size * 0.4,
        1,
        seed + rock,
        held,
        { ...paint, alpha: 1, width: 3.4 * stage.scale },
      );
    }
    if (share > 0.6) {
      ripple(context, at, size * (share - 0.6) * 3, {
        ...paint,
        alpha: decay(share) * 1.6,
        width: 2.4 * stage.scale,
      });
    }
  },

  // The ground splitting open underneath it. What a one-hit knockout
  // by burial looks like is a hole, not a hit
  Chasm(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    // Torn open at once and closed again by the end, so the ground it
    // is left standing on is whole
    const open =
      share < CHASM_TEAR
        ? share / CHASM_TEAR
        : Math.max(0, 1 - (share - CHASM_TEAR) / (1 - CHASM_TEAR));
    const half = size * CHASM_RUN;
    const gape = size * CHASM_GAPE * open;
    // Along the top lip and back along the bottom one, which closes
    // the shape: the hole is a thing to fill, not two lines to stroke
    const rim = (): void => {
      context.beginPath();
      context.moveTo(at[0] - half, at[1]);
      for (let step = 1; step <= CHASM_STEPS; step += 1) {
        const along = step / CHASM_STEPS;

        context.lineTo(
          at[0] - half + along * half * 2,
          at[1] - gape * Math.sin(Math.PI * along) + spread(seed, step) * stage.scale,
        );
      }
      for (let step = CHASM_STEPS - 1; step >= 0; step -= 1) {
        const along = step / CHASM_STEPS;

        context.lineTo(
          at[0] - half + along * half * 2,
          at[1] + gape * Math.sin(Math.PI * along) + spread(seed, step + 20) * stage.scale,
        );
      }
      context.closePath();
    };

    // The dark is the move. A Fissure is not a mark on the ground, it
    // is the ground not being there any more
    rim();
    const depth = context.createLinearGradient(at[0], at[1] - gape, at[0], at[1] + gape);

    depth.addColorStop(0, fade('#0a0705', 0.55 * open));
    depth.addColorStop(0.5, fade('#0a0705', 0.95 * open));
    depth.addColorStop(1, fade('#0a0705', 0.7 * open));
    context.fillStyle = depth;
    context.fill();
    // Broken earth around the hole rather than a drawn outline
    context.strokeStyle = fade(lighten(paint.color, 0.3), open);
    context.lineWidth = 2.4 * stage.scale;
    context.stroke();

    // The jolt that opened it, and what it threw up
    ripple(context, at, half * (0.5 + share * 1.1), {
      ...paint,
      alpha: decay(share) * 0.7,
      width: 2.4 * stage.scale,
    });
    shards(context, at, half * 0.9, many(6, weight), seed, Math.min(1, share * 1.5), {
      ...paint,
      alpha: decay(share),
      width: 2.6 * stage.scale,
    });
    motes(context, at, half * 0.8, many(8, weight), seed + 31, share, {
      ...paint,
      alpha: swell(share) * 0.45,
      width: 2.2 * stage.scale,
    });
  },

  // Leaves crossing it, edge on. They arrive in a line rather than
  // landing in one place, which is what tells a volley of them from a
  // pair of claw marks
  Leaves(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const flying = many(4, weight);

    for (let leaf = 0; leaf < flying; leaf += 1) {
      const held = Math.max(0, Math.min(1, share * 1.7 - (leaf / flying) * 0.7));

      if (held <= 0 || held >= 1) {
        continue;
      }
      const drift = (noise(seed, leaf) - 0.5) * size * 1.6;

      slash(
        context,
        [at[0] - size * 1.6 + held * size * 3.2, at[1] + drift],
        size * 0.45,
        held * 6 + leaf,
        { ...paint, alpha: 1, width: 2.6 * stage.scale },
      );
    }
  },

  // A stream of stars, which is the one move that says it never
  // misses by looking like it is being aimed for you
  Stars(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let mark = 0; mark < many(5, weight); mark += 1) {
      const held = (share * 1.4 + mark * 0.17) % 1;
      const along = between(stage.source, at, held);
      const drift = (noise(seed, mark) - 0.5) * size * 0.8;

      star(context, [along[0] + drift, along[1] + drift * 0.4], size * 0.3, held * 5, {
        ...paint,
        alpha: swell(held) + 0.25,
      });
    }
    if (share > 0.6) {
      burst(context, at, size * (share - 0.6) * 2.5, 6, seed, {
        ...paint,
        alpha: decay(share) * 2,
        width: 2 * stage.scale,
      });
    }
  },

  // Out of the caster and down on it: an eruption is a column, and
  // what a player sees is the falling half, so the beam drains from
  // the top as the base fills
  Spout(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const top: Point = [at[0], at[1] - size * 4.4];

    beam(context, top, at, Math.min(1, share * 1.8), size * 0.55 * (1 - share * 0.45), {
      ...paint,
      alpha: decay(share),
    });
    if (share > 0.3) {
      ripple(context, at, size * (share - 0.3) * 3.4, {
        ...paint,
        alpha: decay(share) * 1.3,
        width: 3 * stage.scale,
      });
    }
    motes(context, at, size * 2.2, many(7, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 2.4 * stage.scale,
    });
  },

  // Pushed up through the floor: several break the surface at once and
  // go on growing, which is the whole of what the move is
  Roots(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const growing = many(5, weight);

    for (let root = 0; root < growing; root += 1) {
      const held = Math.max(0, Math.min(1, share * 1.5 - (root / growing) * 0.35));

      if (held <= 0) {
        continue;
      }
      // Fanned across the upper half, so they climb out of the ground
      // rather than lying across it
      const angle = -Math.PI / 2 + ((root + 0.5) / growing - 0.5) * 2.4 + spread(seed, root) * 0.25;
      const reach = size * 2.4 * held;

      lash(
        context,
        at,
        [at[0] + Math.cos(angle) * reach, at[1] + Math.sin(angle) * reach],
        spread(seed, root + 40) * size * 0.5,
        { ...paint, alpha: 1, width: (3.4 - (root / growing) * 1.4) * stage.scale },
      );
    }
    ripple(context, at, size * (0.5 + share * 1.1), {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2.4 * stage.scale,
    });
  },

  // Laid on the ground rather than thrown at anybody, so they settle
  // along it instead of scattering from a point
  Caltrops(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const laid = 5;

    for (let one = 0; one < laid; one += 1) {
      const held = Math.max(0, Math.min(1, share * 1.5 - (one / laid) * 0.4));

      if (held <= 0) {
        continue;
      }
      const along = (one / (laid - 1) - 0.5) * size * 3.2;

      shards(
        context,
        [at[0] + along, at[1] + size * 0.5 - size * (1 - held)],
        size * 0.26,
        1,
        seed + one,
        held,
        { ...paint, alpha: 1, width: 2.6 * stage.scale },
      );
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default elements;
