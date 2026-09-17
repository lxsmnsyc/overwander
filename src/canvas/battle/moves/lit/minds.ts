import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { NAIL, NAIL_BLOWS, nailDriven } from '../effect/minds';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, chevron, sparks, spiral } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  staged,
  toward,
} from './shapes';

/** A music note on the picture: a round head, a stem and a flag */
function note(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  const foot = aside(kit, at, size * 0.3);
  const top = aside(kit, foot, 0, size * 1.1);

  kit.puff(at, size * 0.35, colour, alpha);
  kit.ribbon([foot, top], size * 0.12, colour, alpha, 0, { add: 0.3 });
  kit.ribbon([top, aside(kit, top, size * 0.4, -size * 0.35)], size * 0.12, colour, alpha, 0, {
    add: 0.3,
  });
}

/** A bell on the picture hanging from its crown, turned by `tilt` */
function bell(
  kit: EffectBatch,
  crown: Spot,
  size: number,
  tilt: number,
  colour: string,
  alpha: number,
): void {
  const turned = (x: number, y: number): Spot =>
    aside(
      kit,
      crown,
      x * Math.cos(tilt) - y * Math.sin(tilt),
      x * Math.sin(tilt) + y * Math.cos(tilt),
    );
  const dome: Spot[] = [];

  for (let step = 0; step <= 12; step += 1) {
    const angle = Math.PI * (step / 12);
    // Widening toward the lip, which is what makes a dome a bell
    const flare = 1 + (1 - Math.sin(angle)) * 0.35;

    dome.push(turned(Math.cos(angle) * size * 0.5 * flare, (Math.sin(angle) - 1) * size));
  }
  kit.ribbon(dome, size * 0.14, colour, alpha, 0, { add: 0.4 });
  kit.ribbon(
    [turned(-size * 0.7, -size), turned(size * 0.7, -size)],
    size * 0.14,
    colour,
    alpha,
    0,
    {
      add: 0.4,
    },
  );
  kit.glow(turned(0, -size * 1.15), size * 0.14, lighten(colour, 0.4), alpha, 0.8);
}

/** An eye on the picture: almond lids `open` from 0 to 1, a coloured iris and a slit pupil */
function eye(
  kit: EffectBatch,
  at: Spot,
  size: number,
  open: number,
  colour: string,
  alpha: number,
): void {
  const lid = size * 0.55 * open;
  const tall = Math.min(size * 0.42, lid * 0.75);
  const upper: Spot[] = [];
  const lower: Spot[] = [];

  for (let step = 0; step <= 10; step += 1) {
    const across = (step / 10) * 2 - 1;
    const bulge = (1 - across * across) * lid;

    upper.push(aside(kit, at, across * size, bulge));
    lower.push(aside(kit, at, across * size, -bulge));
  }
  kit.glow(at, size * 0.7, '#fffbe8', alpha * open * 0.5, 0.2);
  kit.ribbon(upper, size * 0.1, '#2a1a10', alpha, 0, { add: 0 });
  kit.ribbon(lower, size * 0.1, '#2a1a10', alpha, 0, { add: 0 });
  if (tall <= 0) {
    return;
  }
  kit.glow(at, tall, colour, alpha, 0.3, { add: 0.3 });
  kit.streak(at, tall * 0.9, size * 0.08, Math.PI / 2, '#1a1010', alpha, { add: 0 });
}

/** The anger mark on the picture: four arcs bowed in toward a middle */
function vein(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  for (let quarter = 0; quarter < 4; quarter += 1) {
    const angle = Math.PI / 4 + (quarter * Math.PI) / 2;
    const path: Spot[] = [];

    for (let step = 0; step <= 6; step += 1) {
      const turn = angle + Math.PI + (step / 6 - 0.5) * 1.5;

      path.push(
        aside(
          kit,
          at,
          Math.cos(angle) * size + Math.cos(turn) * size * 0.7,
          Math.sin(angle) * size + Math.sin(turn) * size * 0.7,
        ),
      );
    }
    kit.ribbon(path, size * 0.22, colour, alpha, 0, { add: 0.2 });
  }
}

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

  // A breeze of petals crossing over it, each turning as it goes, which is what separates blown from thrown
  Petals(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage);

    for (let one = 0; one < many(9, weight); one += 1) {
      // Staggered, so petals keep arriving for the whole of it rather than crossing as one row
      const held = (share * 1.25 + noise(seed, one)) % 1;

      kit.leaf(
        aside(
          kit,
          at,
          (held - 0.5) * reach * 4.4,
          spread(seed, one + 30) * reach + Math.sin(held * Math.PI * 2.2 + one) * reach * 0.55,
          spread(seed, one + 45) * reach * 0.8,
        ),
        reach * (0.22 + noise(seed, one + 60) * 0.12),
        held * Math.PI * 3 + one,
        paint.color,
        0.35 + swell(held) * 0.65,
      );
    }
  },

  // A room laid over the field. It goes up and stands, as a screen does: what it changes lasts
  Grid(kit, stage, share, { paint }) {
    const floor = floorOf(landed(stage));
    const reach = reachOf(stage);
    const up = Math.min(1, share * 3);
    const alpha = share < 0.8 ? 0.4 + up * 0.4 : decay(share) * 4;
    const line = lighten(paint.color, 0.3);
    const low: Spot[] = [];
    const high: Spot[] = [];

    // Ring order from the far left, as a panel takes its corners
    for (const [right, away] of [
      [-1, 1],
      [1, 1],
      [1, -1],
      [-1, -1],
    ] as const) {
      low.push(aside(kit, floor, right * reach * 3.4 * up, 0.02, away * reach * 2.2 * up));
      high.push(
        aside(kit, floor, right * reach * 3.4 * up, reach * 2.6 * up, away * reach * 2.2 * up),
      );
    }
    kit.panel([low[0], low[1], low[2], low[3]], paint.color, alpha * 0.5);
    kit.ribbon([...low, low[0]], reach * 0.08, line, alpha);
    kit.ribbon([...high, high[0]], reach * 0.08, line, alpha);
    for (let post = 0; post < 4; post += 1) {
      kit.ribbon([low[post], high[post]], reach * 0.08, line, alpha);
    }
  },

  // Weight coming down over everything: chevrons falling rather than rising, and the ground pressed flat
  Press(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = lighten(paint.color, 0.2);
    const shown = swell(share) * 0.85;

    for (let column = 0; column < 3; column += 1) {
      for (let mark = 0; mark < 2; mark += 1) {
        const held = (((share + noise(seed, column) * 0.2) % 1) + mark / 2) % 1;
        const spot = aside(kit, at, (column - 1) * reach * 1.9, reach * (1.2 - held * 2));

        chevron(
          kit,
          [spot[0], Math.max(0.1, spot[1]), spot[2]],
          reach * 0.7,
          -1,
          colour,
          shown * Math.min(1, swell(held) * 1.8),
          reach * 0.1,
        );
      }
    }
    kit.ripple(
      floorOf(at),
      reach * (1.6 + swell(share) * 1.4),
      0.06,
      paint.color,
      swell(share) * 0.5,
    );
  },
  // Music notes drifting round it
  Song(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = lighten(paint.color, 0.2);

    kit.ring(at, reach * (0.8 + share), 0.06, colour, swell(share) * 0.5);
    for (let one = 0; one < many(6, weight); one += 1) {
      const held = (share * 1.3 + noise(seed, one)) % 1;
      const angle = noise(seed, one + 10) * TAU + share * TAU;
      const round = reach * (1.3 - held * 0.4);

      note(
        kit,
        [
          at[0] + Math.cos(angle) * round,
          at[1] + reach * (held * 1.4 - 0.2),
          at[2] + Math.sin(angle) * round,
        ],
        reach * 0.35,
        colour,
        swell(held),
      );
    }
  },

  // Shock arcs rolling out of the caster toward it, widening as they go
  Roar(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.4);
    const angle = kit.angleOn(stage.source, at);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.4 + pulse * 0.33) % 1;
      const front = toward(stage.source, at, held * 0.9);
      const radius = reach * (0.5 + held * 1.6);
      const arc: Spot[] = [];

      for (let step = 0; step <= 10; step += 1) {
        const turn = angle + (step / 10 - 0.5) * 1.8;

        // Round a middle behind the front, so the arc's crown leads
        arc.push(
          aside(
            kit,
            front,
            (Math.cos(turn) - Math.cos(angle)) * radius,
            (Math.sin(turn) - Math.sin(angle)) * radius,
          ),
        );
      }
      kit.ribbon(arc, reach * 0.12 * (1 + held), light, decay(held) * 0.9);
    }
    kit.ring(at, reach * (0.6 + share * 1.2), 0.06, light, swell(share) * 0.6);
  },

  // A golden bell swinging over it, ringing out
  Chime(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.4);
    const shown = Math.min(1, share * 4) * late(share, 0.8);
    const crown = aside(kit, at, 0, reach * 1.8);

    bell(kit, crown, reach * 0.9, Math.sin(share * TAU * 2) * 0.5, colour, shown);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = (share * 2 + wave / 3) % 1;

      kit.ring(
        aside(kit, crown, 0, -reach * 0.5),
        reach * (0.4 + held * 2),
        0.05,
        light,
        decay(held) * shown,
      );
    }
    for (let glint = 0; glint < 6; glint += 1) {
      kit.star(
        aside(kit, at, spread(seed, glint) * reach * 1.4, spread(seed, glint + 10) * reach * 1.2),
        reach * 0.2,
        0,
        '#ffffff',
        swell((share * 2 + noise(seed, glint)) % 1) * shown,
      );
    }
  },

  // Poison welling up round it: bubbles rising off a sickly pool and popping
  Toxin(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.3);
    const shown = Math.min(1, share * 5) * late(share, 0.75);

    kit.pool(floor, reach * (1.4 + swell(share) * 0.6), colour, shown * 0.6);
    kit.ripple(floor, reach * (1.2 + swell(share) * 0.6), 0.1, light, shown * 0.6);
    for (let one = 0; one < many(10, weight); one += 1) {
      const held = (share * 1.5 + noise(seed, one)) % 1;
      const spot = aside(
        kit,
        floor,
        spread(seed, one + 10) * reach * 1.3,
        held * reach * 2.4,
        spread(seed, one + 30) * reach * 0.8,
      );
      const radius = reach * (0.12 + noise(seed, one + 20) * 0.14) * (0.5 + held);

      if (held < 0.85) {
        kit.bubble(spot, radius, light, shown);
        continue;
      }
      const pop = (held - 0.85) / 0.15;

      kit.ring(spot, radius * (1 + pop), 0.1, light, shown * decay(pop));
    }
  },

  // Spores drifting down over it, crackling where they settle
  Spores(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const shown = Math.min(1, share * 4) * late(share, 0.7);

    for (let one = 0; one < many(16, weight); one += 1) {
      const fall = (share * 1.2 + noise(seed, one)) % 1;
      const spot = aside(
        kit,
        at,
        spread(seed, one + 10) * reach * 1.6 + Math.sin(fall * 6 + one) * reach * 0.25,
        reach * 2 - fall * reach * 2.8,
        spread(seed, one + 30) * reach * 0.8,
      );

      kit.glow(
        [spot[0], Math.max(0.05, spot[1]), spot[2]],
        reach * 0.08 * (0.7 + noise(seed, one + 20)),
        paint.color,
        shown * swell(fall),
        0.6,
      );
    }
    if (share < 0.3) {
      return;
    }
    // A new flicker every twelfth of the span, so the crackle jumps about rather than sliding
    const flicker = Math.floor(share * 12);

    for (let zap = 0; zap < 2; zap += 1) {
      sparks(
        kit,
        aside(
          kit,
          at,
          spread(seed, flicker * 7 + zap) * reach * 0.9,
          -spread(seed, flicker * 7 + zap + 3) * reach * 0.8,
        ),
        reach * 0.4,
        4,
        seed + flicker + zap,
        0.3,
        '#fff6a0',
        shown * 0.9,
      );
    }
  },

  // An eye opening over it and flashing, the look that freezes something in place
  Stare(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const open = Math.min(1, share / 0.25) * late(share, 0.8);
    const centre = aside(kit, at, 0, reach * 0.4);
    const light = lighten(paint.color, 0.5);
    const flash = (share - 0.25) / 0.3;

    eye(kit, centre, reach * 1.2, open, paint.color, Math.min(1, open * 3));
    if (flash > 0 && flash < 1) {
      kit.star(centre, reach * (1.4 + flash * 1.6), 0.2, light, decay(flash));
      sparks(kit, centre, reach * (1.4 + flash * 1.6), 12, seed, flash, light, decay(flash));
      kit.ring(at, reach * (0.6 + flash * 1.4), 0.06, light, decay(flash) * 0.8);
    }
  },

  // Sparkles clapping together over its head three times, calling for more
  Applause(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const meet = aside(kit, at, 0, reach * 1.4);

    for (let beat = 0; beat < 3; beat += 1) {
      const held = share * 3 - beat;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const closing = Math.min(1, held / 0.35);

      if (closing < 1) {
        for (const side of [-1, 1]) {
          kit.star(
            aside(kit, meet, side * reach * 1.3 * (1 - closing), -reach * 0.3 * (1 - closing)),
            reach * 0.28,
            closing * 3 * side,
            colour,
            0.95,
          );
        }
        continue;
      }
      const pop = (held - 0.35) / 0.65;

      kit.star(meet, reach * (0.35 + pop * 0.4), pop, '#ffffff', decay(pop));
      kit.ring(meet, reach * (0.2 + pop * 1.1), 0.08, lighten(colour, 0.5), decay(pop));
      for (let bit = 0; bit < 5; bit += 1) {
        const angle = (bit / 5) * TAU + noise(seed, beat * 5 + bit);

        kit.star(
          aside(
            kit,
            meet,
            Math.cos(angle) * reach * pop * 1.2,
            Math.sin(angle) * reach * pop * 1.2 - pop * pop * reach * 0.6,
          ),
          reach * 0.14,
          angle,
          colour,
          decay(pop),
        );
      }
    }
  },

  // An anger mark throbbing on its head
  Vein(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = Math.min(1, share * 6) * late(share, 0.8);
    const spot = aside(kit, at, reach * 0.8, reach * 1.2);
    const throb = 1 + Math.abs(Math.sin(share * Math.PI * 3)) * 0.35;

    vein(kit, spot, reach * 0.42 * throb, colour, shown);
    for (let beat = 0; beat < 3; beat += 1) {
      const held = share * 3 - beat;

      if (held <= 0 || held >= 1) {
        continue;
      }
      kit.ring(
        spot,
        reach * (0.5 + held * 0.9),
        0.06,
        lighten(colour, 0.3),
        decay(held) * shown * 0.7,
      );
    }
  },

  // A nail driven into it in three blows, under a closing ring of dark
  Nail(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const shown = Math.min(1, share * 6) * late(share, 0.8);
    const tip = aside(kit, at, 0, reach * 0.2 - nailDriven(share) * reach * 0.7);
    const head = aside(kit, tip, 0, reach * 1.4);

    kit.glow(at, reach * 0.8, mix(colour, '#0a0612', 0.5), swell(share) * 0.5, 0, { add: 0 });
    kit.ring(at, reach * (1.9 - share * 1.1), 0.08, lighten(colour, 0.3), swell(share) * 0.7);
    kit.streak(toward(head, tip, 0.5), reach * 0.7, reach * 0.09, Math.PI / 2, NAIL, shown, {
      add: 0,
    });
    kit.streak(head, reach * 0.32, reach * 0.08, 0, NAIL, shown, { add: 0 });
    for (const [one, blow] of NAIL_BLOWS.entries()) {
      const since = (share - blow - 0.05) / 0.25;

      if (since <= 0 || since >= 1) {
        continue;
      }
      kit.ring(head, reach * (0.2 + since * 0.8), 0.08, lighten(colour, 0.4), decay(since));
      sparks(kit, head, reach * (0.4 + since * 0.6), 6, seed + one, since, '#ffffff', decay(since));
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default minds;
