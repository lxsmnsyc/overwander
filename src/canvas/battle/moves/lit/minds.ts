import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, sparks, spiral } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, reachOf, staged } from './shapes';

/**
 * The shapes done to a mind rather than a body, in the battle scene:
 * a haze, a mark, a dazzle, a mood.
 */
const minds = {
  // Powder, gas, anything that hangs in the air round it
  Haze(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const cloud = swell(share);

    for (let puff = 0; puff < many(7, weight); puff += 1) {
      const drift = share * reach * 0.6;

      kit.glow(
        aside(
          kit,
          at,
          spread(seed, puff) * reach * 1.2 + spread(seed, puff + 5) * drift,
          spread(seed, puff + 10) * reach * 0.6 + drift * 0.4,
          spread(seed, puff + 20) * reach * 0.8,
        ),
        reach * (0.5 + noise(seed, puff + 30) * 0.4) * (0.7 + share * 0.5),
        colour,
        cloud * 0.35,
        0,
        { add: 0.3 },
      );
    }
    for (let mote = 0; mote < many(12, weight); mote += 1) {
      const out = 0.4 + share;

      kit.glow(
        aside(
          kit,
          at,
          spread(seed, mote + 40) * reach * 1.6 * out,
          spread(seed, mote + 50) * reach * out + share * reach * 0.5,
          spread(seed, mote + 60) * reach,
        ),
        reach * 0.07,
        lighten(colour, 0.4),
        cloud * 0.8,
        0.6,
      );
    }
  },

  // A status arriving: rings closing on it, on the air and on the floor
  Mark(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;

    for (let step = 0; step < 2; step += 1) {
      const held = staged(share, 1.6, step * 0.3);
      const radius = reach * (1.6 - held * 1.1);

      kit.ring(at, radius, 0.08, lighten(colour, 0.3), swell(held) * 0.9);
      kit.ripple(floorOf(at), radius, 0.08, colour, swell(held) * 0.5);
    }
    if (share > 0.55) {
      kit.star(at, reach * 0.6, 0.4, lighten(colour, 0.6), swell((share - 0.55) / 0.45));
    }
  },

  // A light in the eyes: it whites out and is gone
  Dazzle(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    // Up almost at once and down slowly, the way a bright light is seen
    const glare = share < 0.15 ? share / 0.15 : decay((share - 0.15) / 0.85);

    kit.pool(floorOf(at), reach * 3, colour, glare * 0.5);
    kit.glow(at, reach * (0.6 + glare * 1.9), colour, glare * 0.8);
    kit.star(at, reach * (1 + glare * 2), 0.2, '#ffffff', glare);
    sparks(kit, at, reach * (1 + glare * 1.6), 10, seed, 1 - glare, colour, glare * 0.9);
  },

  // A spiral winding down
  Trance(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;

    kit.glow(at, reach * 0.5, colour, swell(share) * 0.4, 0.5);
    spiral(
      kit,
      at,
      reach * 1.6 * (1 - share * 0.3),
      2.5,
      share,
      lighten(colour, 0.3),
      Math.min(1, swell(share) + 0.2),
      reach * 0.09,
    );
  },

  // Steadying itself: spokes coming in and a core held tight
  Nerve(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const held = swell(share);

    for (let spoke = 0; spoke < 6; spoke += 1) {
      const angle = (spoke / 6) * TAU + noise(seed, spoke) * 0.4;
      const out = reach * (2 - held * 1.2);

      kit.streak(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        reach * 0.3,
        reach * 0.05,
        angle,
        lighten(colour, 0.4),
        held * 0.8,
      );
    }
    kit.ring(at, reach * (1.4 - held * 0.6), 0.08, colour, held * 0.7);
    kit.glow(at, reach * (0.2 + held * 0.35), lighten(colour, 0.4), held);
  },

  // Struck three times: each beat leaves at once and fades
  Drum(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;

    for (let beat = 0; beat < 3; beat += 1) {
      const held = share * 3 - beat;

      if (held <= 0 || held >= 1) {
        continue;
      }
      kit.glow(at, reach * 0.5, colour, decay(held) * 0.5, 0.6);
      kit.ring(at, reach * (0.4 + held * 2.2), 0.1, lighten(colour, 0.3), decay(held));
      kit.ripple(floorOf(at), reach * (0.5 + held * 1.8), 0.1, colour, decay(held) * 0.6);
    }
  },

  // A ghost: a dark thing gathering, wisps rising off it, closing in
  Shade(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const shown = swell(share);

    kit.glow(at, reach * (0.6 + shown * 0.9), mix(colour, '#0a0612', 0.6), shown * 0.7, 0, {
      add: 0,
    });
    kit.glow(at, reach * (0.35 + shown * 0.5), colour, shown * 0.6, 0.2);
    for (let wisp = 0; wisp < many(7, weight); wisp += 1) {
      const rise = (share * 1.6 + noise(seed, wisp)) % 1;
      const angle = noise(seed, wisp + 10) * TAU;
      const round = reach * (1.2 - rise * 0.6);
      const spot: Spot = [
        at[0] + Math.cos(angle) * round,
        at[1] - reach * 0.5 + rise * reach * 1.6,
        at[2] + Math.sin(angle) * round,
      ];

      kit.streak(
        spot,
        reach * 0.3 * (1 - rise * 0.5),
        reach * 0.1,
        Math.PI / 2 + spread(seed, wisp + 20) * 0.4,
        lighten(colour, 0.2),
        swell(rise) * decay(share) * 0.9,
      );
    }
    // Inward rather than out: what a ghost move does is close on it
    kit.ring(at, reach * (1.9 - share * 1.2), 0.08, lighten(colour, 0.3), shown * 0.7);
  },

  // What a pokemon is feeling rather than what it was hit with
  Hearts(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const rising = many(4, weight);

    for (let one = 0; one < rising; one += 1) {
      const held = staged(share, 1.4, (one / rising) * 0.5);

      if (held <= 0) {
        continue;
      }
      const spot = aside(
        kit,
        at,
        spread(seed, one) * reach * 0.9 + Math.sin(held * 6 + one) * reach * 0.15,
        reach * 2 * held,
        spread(seed, one + 5) * reach * 0.4,
      );

      kit.glow(spot, reach * 0.5, colour, decay(held) * 0.35, 0.2);
      kit.heart(
        spot,
        reach * 0.42,
        spread(seed, one + 9) * 0.3,
        lighten(colour, 0.15),
        decay(held),
      );
    }
  },

  // It went past: small, grey and drifting on
  Whiff(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const drift = share * reach * 0.8;
    const spot = aside(kit, at, drift, drift * 0.4);

    kit.trail(
      aside(kit, spot, -reach * 0.9, reach * 0.45),
      aside(kit, spot, reach * 0.9, -reach * 0.45),
      reach * 0.06,
      paint.color,
      decay(share) * 0.8,
    );
  },

  // The air bending: ovals that turn over rather than leave
  Warp(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;

    kit.glow(at, reach * 0.6, colour, swell(share) * 0.35, 0.3);
    for (let shell = 0; shell < 3; shell += 1) {
      const held = (share * 1.2 + shell * 0.3) % 1;
      const radius = reach * (0.5 + held);

      kit.oval(
        at,
        radius,
        radius * (0.45 + 0.4 * Math.abs(Math.cos(held * Math.PI))),
        held * Math.PI,
        0.1,
        lighten(colour, 0.3),
        swell(held) * 0.9,
      );
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default minds;
