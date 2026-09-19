import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import {
  CANNON_ARRIVE,
  GRIP_CLOSE,
  LUSTRE_GATHER,
  RAINBOW,
  STALL_BREAK,
  STALL_FREEZE,
  STARFALL_DROP,
  SURGE_PULL,
  VOID_RIM,
  gapeOf,
} from '../effect/legends';
import { type EffectShape, many } from '../effect/shapes';
import { backToward } from './contact';
import { TAU, arcing, debris, gathering, jet, smoke, sparks } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  staged,
  thrown,
  toward,
} from './shapes';

/** Pieces of a broken ring, thrown out from where each was and falling */
function shatter(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  count: number,
  seed: number,
  broken: number,
  colour: string,
  reach: number,
): void {
  for (let piece = 0; piece < count; piece += 1) {
    const angle = (piece / count) * TAU + noise(seed, piece) * 0.3;
    const out = radius * (1 + broken * (0.3 + noise(seed, piece + 10) * 0.4));

    kit.shard(
      aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out - broken * broken * reach * 1.2),
      reach * 0.14 * (0.7 + noise(seed, piece + 20) * 0.6),
      angle + broken * (3 + noise(seed, piece + 30) * 3),
      colour,
      decay(broken),
      { add: 0.4 },
    );
  }
}

/** One shaft of light coming down on a spot on the floor, and the splash where it lands */
function shaft(kit: EffectBatch, ground: Spot, reach: number, held: number, colour: string): void {
  const top: Spot = [ground[0], reach * 7, ground[2]];
  const down = Math.min(1, held * 3);
  const head = toward(top, ground, down);

  kit.ribbon([top, head], reach * 0.7, colour, decay(held) * 0.35);
  kit.ribbon([top, head], reach * 0.25, '#ffffff', decay(held));
  if (down < 1) {
    return;
  }
  const hit = (held * 3 - 1) / 2;

  kit.pool(ground, reach * 0.9, colour, decay(hit) * 0.7);
  kit.ripple(ground, reach * (0.2 + hit * 0.8), 0.1, lighten(colour, 0.3), decay(hit));
}

/** A great hand of four fingers reaching in from one side */
function hand(
  kit: EffectBatch,
  at: Spot,
  side: number,
  reach: number,
  close: number,
  colour: string,
  alpha: number,
): void {
  const palm = aside(kit, at, side * reach * (2.4 - close * 1.3));

  kit.glow(aside(kit, palm, side * reach * 0.35), reach * 0.8, colour, alpha * 0.8, 0, { add: 0 });
  for (let finger = 0; finger < 4; finger += 1) {
    const path: Spot[] = [];

    for (let step = 0; step <= 5; step += 1) {
      const along = step / 5;

      // Drawn in toward the middle of it the tighter the hand closes
      path.push(
        aside(
          kit,
          palm,
          -side * along * reach * 1.1 * (0.4 + close * 0.6),
          (finger - 1.5) * reach * 0.5 * (1 - along * 0.3 * close),
        ),
      );
    }
    kit.ribbon(path, reach * 0.26, colour, alpha, 0, { add: 0 });
    kit.ribbon(path, reach * 0.1, lighten(colour, 0.4), alpha * 0.6);
  }
}

/** A crescent drawn as beads of light along an arc, fattest in the middle, its bright side facing `turn` */
function crescent(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  for (let step = 0; step <= 10; step += 1) {
    const along = step / 10;
    const angle = turn + (along - 0.5) * Math.PI * 1.2;

    kit.glow(
      aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius),
      radius * (0.3 * Math.sin(Math.PI * along) + 0.04),
      colour,
      alpha,
      0.6,
    );
  }
}

/** The legendary signature moves in the battle scene */
const legends = {
  // Time stopping: rings thrown out freeze where they are, like a clock face, then shatter
  Stall(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const rim = lighten(colour, 0.45);
    const grown = 1 - (1 - Math.min(1, share / STALL_FREEZE)) ** 3;
    const broken = Math.max(0, (share - STALL_BREAK) / (1 - STALL_BREAK));
    const held = broken > 0 ? decay(broken) : 1;

    kit.pool(floorOf(at), reach * 2.6 * grown, colour, held * 0.4);
    kit.glow(at, reach * (0.6 + grown * 0.8), colour, held * 0.5, 0.7);
    for (let band = 0; band < 3; band += 1) {
      const radius = reach * (0.9 + band * 0.8) * grown;

      if (broken > 0) {
        shatter(kit, at, radius, 10 + band * 4, seed + band * 13, broken, rim, reach);
        continue;
      }
      kit.ring(at, radius, 0.06, rim, 0.9);
    }
    if (broken > 0) {
      kit.star(at, reach * (1.5 + broken * 1.5), 0, '#ffffff', swell(Math.min(1, broken * 3)));
      return;
    }
    const outer = reach * 2.5 * grown;

    for (let tick = 0; tick < 12; tick += 1) {
      const angle = (tick / 12) * TAU;

      kit.streak(
        aside(kit, at, Math.cos(angle) * outer * 0.93, Math.sin(angle) * outer * 0.93),
        reach * 0.1 * grown,
        reach * 0.03,
        angle,
        rim,
        grown,
      );
    }
  },

  // Space torn open: a cut across it that gapes onto the dark and snaps shut
  Rend(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const from = aside(kit, at, -reach * 1.6, reach * 1.1);
    const to = aside(kit, at, reach * 1.6, -reach * 1.1);
    const drawn = Math.min(1, share / 0.2);
    const gape = gapeOf(share);
    const angle = kit.angleOn(from, to);
    const middle = toward(from, to, drawn / 2);
    const shown = share < 0.7 ? 1 : Math.min(1, decay(share) * 3);

    kit.glow(at, reach * (0.8 + gape * 0.8), colour, gape * 0.45, 0.3);
    kit.streak(
      middle,
      reach * 1.94 * drawn,
      reach * (0.1 + gape * 0.45),
      angle,
      lighten(colour, 0.3),
      shown,
    );
    kit.streak(middle, reach * 1.84 * drawn, reach * gape * 0.32, angle, '#12061c', gape, {
      add: 0,
    });
    // Motes drawn into the tear while it is open
    for (let mote = 0; mote < many(10, weight); mote += 1) {
      const held = (share * 1.5 + noise(seed, mote)) % 1;

      kit.glow(
        aside(
          kit,
          at,
          spread(seed, mote + 10) * reach * 2 * (1 - held),
          spread(seed, mote + 20) * reach * 1.5 * (1 - held),
        ),
        reach * 0.07,
        lighten(colour, 0.5),
        swell(held) * gape,
        0.8,
      );
    }
    if (share <= 0.7) {
      return;
    }
    const snap = (share - 0.7) / 0.3;

    kit.star(at, reach * (1 + snap * 1.5), angle, '#ffffff', decay(snap));
    kit.ring(at, reach * (0.6 + snap * 2), 0.08, lighten(colour, 0.4), decay(snap));
    sparks(kit, at, reach * 1.4, many(8, weight), seed, snap, lighten(colour, 0.5), decay(snap));
  },

  // Shafts of light coming down all round it, and the light gathering on it
  Verdict(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const shafts = many(6, weight);

    for (let one = 0; one < shafts; one += 1) {
      const held = staged(share, 1.6, (one / shafts) * 0.5);

      if (held <= 0) {
        continue;
      }
      const angle = (one / shafts) * TAU + noise(seed, one) * 0.5;
      const round = reach * (1.2 + noise(seed, one + 10) * 0.6);

      shaft(
        kit,
        [floor[0] + Math.cos(angle) * round, 0, floor[2] + Math.sin(angle) * round],
        reach,
        held,
        colour,
      );
    }
    if (share <= 0.5) {
      return;
    }
    const judged = (share - 0.5) * 2;

    kit.pool(floor, reach * 3, colour, swell(judged) * 0.6);
    kit.glow(at, reach * (0.8 + judged * 1.2), colour, swell(judged) * 0.9, 1);
    sparks(kit, at, reach * 1.6, many(8, weight), seed, judged, '#ffffff', swell(judged));
  },

  // A flash on it and the light bursting upward off it
  Sunburst(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.6);
    const flash = share < 0.12 ? share / 0.12 : decay((share - 0.12) / 0.88);

    kit.pool(floorOf(at), reach * (1.6 + share * 2), paint.color, flash * 0.7);
    kit.glow(at, reach * (0.6 + flash * 1.6), light, flash, 1);
    for (let ray = 0; ray < 7; ray += 1) {
      const angle = Math.PI / 2 + (ray / 6 - 0.5) * 1.8;
      const length = reach * (1 + share * 3.5);

      kit.ribbon(
        [at, aside(kit, at, Math.cos(angle) * length, Math.sin(angle) * length)],
        reach * 0.18 * flash,
        light,
        flash * 0.8,
      );
    }
    for (let mote = 0; mote < many(14, weight); mote += 1) {
      kit.glow(
        aside(
          kit,
          at,
          spread(seed, mote) * reach * 1.4 * share,
          share * reach * (2 + noise(seed, mote + 20) * 3),
          spread(seed, mote + 40) * reach * share,
        ),
        reach * 0.08,
        light,
        decay(share),
        0.9,
      );
    }
    kit.ring(at, reach * (0.5 + share * 2.4), 0.06, light, decay(share));
  },

  // It goes dark, and the cut comes out of the dark from behind it
  Ambush(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const dark = share < 0.45 ? share / 0.45 : decay((share - 0.45) / 0.55);

    kit.pool(floorOf(at), reach * 1.8, '#0a0612', dark * 0.6, { add: 0 });
    kit.glow(at, reach * (1.1 + dark * 0.5), '#0a0612', dark * 0.85, 0, { add: 0 });
    smoke(kit, at, reach, 5, seed, share, mix(colour, '#0a0612', 0.4), dark * 0.6);
    if (share <= 0.4) {
      return;
    }
    const after = (share - 0.4) / 0.6;
    const cut = Math.min(1, after * 3.3);
    // Starting behind it, away from the camera, so the blade comes through it
    const from = aside(kit, at, -reach * 1.4, -reach * 1.1, reach * 0.8);
    const to = aside(kit, at, reach * 1.4, reach * 1.1, -reach * 0.4);
    const path: Spot[] = [];

    for (let step = 0; step <= 8; step += 1) {
      const along = (step / 8) * cut;
      const bow = Math.sin(Math.PI * along) * reach * 0.5;

      path.push(aside(kit, toward(from, to, along), -bow * 0.6, bow * 0.8));
    }
    kit.ribbon(path, reach * 0.6, colour, decay(after) * 0.5);
    kit.ribbon(path, reach * 0.2, lighten(colour, 0.5), Math.min(1, decay(after) * 1.5));
    if (share <= 0.55) {
      return;
    }
    // The blow landing where the cut arrives
    const hit = (share - 0.55) / 0.45;
    const floor = floorOf(at);

    kit.pool(floor, reach * 1.8, lighten(colour, 0.3), decay(hit) * 0.6);
    kit.ripple(floor, reach * (0.5 + hit * 2.2), 0.09, lighten(colour, 0.4), decay(hit) * 0.9);
    kit.glow(at, reach * (0.5 + hit * 0.8), lighten(colour, 0.6), decay(Math.min(1, hit * 2)), 1);
    kit.ring(at, reach * (0.4 + hit * 2), 0.1, lighten(colour, 0.5), decay(hit));
    debris(
      kit,
      floor,
      reach * 0.8,
      many(6, weight),
      seed,
      hit,
      mix(colour, '#3a2a40', 0.5),
      decay(hit),
    );
    kit.star(at, reach * (0.8 + hit), 0.5, '#ffffff', decay(hit));
    sparks(kit, at, reach * 1.3, many(8, weight), seed, hit, lighten(colour, 0.4), decay(hit));
  },

  // Lava wound up round it from the ground, turning as it rises
  Vortex(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const lava = mix(colour, '#ff8a2a', 0.45);
    const hot = mix(colour, '#ffd84a', 0.65);
    const crust = mix(colour, '#2a0800', 0.55);
    const risen = Math.min(1, share * 2);
    const shown = late(share, 0.7) * Math.min(1, share * 5);
    const spin = share * TAU * 1.6;
    const funnel = (along: number, turn: number): Spot => {
      const round = reach * (0.6 + along * 0.8);

      return [
        floor[0] + Math.cos(turn) * round,
        along * reach * 3 * risen,
        floor[2] + Math.sin(turn) * round,
      ];
    };

    kit.pool(floor, reach * 1.8, colour, shown * 0.6);
    kit.pool(floor, reach * 1.1, '#1a0600', shown * 0.4, { add: 0 });
    for (let band = 0; band < 3; band += 1) {
      const path: Spot[] = [];

      for (let step = 0; step <= 16; step += 1) {
        const along = step / 16;

        path.push(funnel(along, along * TAU * 1.3 + spin + band * 2.1));
      }
      kit.ribbon(path, reach * 0.24, crust, shown * 0.8, 0, { add: 0 });
      kit.ribbon(path, reach * 0.12, lava, shown, share * 8);
    }
    for (let blob = 0; blob < many(12, weight); blob += 1) {
      const along = (noise(seed, blob) + share * 0.9) % 1;

      kit.glow(
        funnel(along, along * TAU * 1.3 + spin + noise(seed, blob + 9) * TAU),
        reach * 0.14,
        hot,
        shown * swell(along),
        0.6,
      );
    }
  },

  // A pillar of fire standing on it, its edge licked with every colour
  Pyre(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.7);
    const up = Math.min(1, share * 2.5);
    const shown = late(share, 0.65);
    const height = reach * 5.5 * up;
    const path: Spot[] = [];

    for (let step = 0; step <= 10; step += 1) {
      path.push([floor[0], (step / 10) * height, floor[2]]);
    }
    kit.pool(floor, reach * 2, colour, shown * 0.7);
    kit.ribbon(path, reach * 1.8, colour, shown * 0.45, share * 10);
    kit.ribbon(path, reach * 0.9, hot, shown, share * 14);
    kit.ribbon(path, reach * 0.35, '#ffffff', shown * 0.8, share * 18);
    for (let lick = 0; lick < many(14, weight); lick += 1) {
      const rise = (share * 1.8 + noise(seed, lick)) % 1;
      const side = lick % 2 === 0 ? 1 : -1;

      kit.glow(
        aside(
          kit,
          floor,
          side * reach * (0.85 + Math.sin(rise * 9 + lick) * 0.15),
          rise * height,
          spread(seed, lick + 5) * reach * 0.3,
        ),
        reach * 0.28 * (1 - rise * 0.5),
        RAINBOW[(lick + Math.floor(share * 10)) % RAINBOW.length],
        swell(rise) * shown * 0.9,
        0.3,
      );
    }
    kit.ripple(floor, reach * (0.8 + share * 1.6), 0.08, hot, decay(share));
  },

  // The ground cracks under it, then erupts in fire and rock
  Upheaval(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.6);
    const crack = Math.min(1, share * 3);

    kit.pool(floor, reach * (1 + crack * 1.6), '#140a05', late(share, 0.7) * 0.6, { add: 0 });
    kit.ripple(floor, reach * (0.6 + crack * 2), 0.12, colour, decay(share) * 0.9);
    if (share <= 0.2) {
      return;
    }
    const erupt = (share - 0.2) / 0.8;
    const jets = many(5, weight);

    for (let one = 0; one < jets; one += 1) {
      const angle = (one / jets) * TAU + noise(seed, one);
      const round = reach * (0.3 + noise(seed, one + 10) * 1.2);

      jet(
        kit,
        [floor[0] + Math.cos(angle) * round, 0, floor[2] + Math.sin(angle) * round],
        reach * (2.5 + noise(seed, one + 20) * 2.5) * Math.min(1, erupt * 3),
        reach * 0.4,
        colour,
        hot,
        late(erupt, 0.4),
        share * 12,
      );
    }
    kit.glow(
      aside(kit, floor, 0, reach * (0.5 + erupt)),
      reach * (0.8 + erupt * 1.4),
      lighten(colour, 0.3),
      decay(erupt) * 0.8,
      0.6,
    );
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.2),
      reach,
      many(10, weight),
      seed,
      erupt,
      mix(colour, '#5b4636', 0.55),
      late(erupt, 0.7),
    );
    sparks(kit, at, reach * 1.6, many(8, weight), seed, erupt, hot, decay(erupt));
  },
  // A soft ball that bursts into a cloud of down, feathers drifting out of it
  Plume(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const soft = lighten(colour, 0.5);
    const open = 1 - (1 - Math.min(1, share * 2.5)) ** 2;
    const shown = late(share, 0.5);

    kit.pool(floorOf(at), reach * 1.6 * open, colour, shown * 0.35);
    kit.glow(at, reach * (0.5 + open * 0.4), '#ffffff', decay(Math.min(1, share * 3)), 1);
    for (let puff = 0; puff < many(9, weight); puff += 1) {
      const angle = noise(seed, puff) * TAU;
      const out = reach * (0.2 + open * (0.8 + noise(seed, puff + 10) * 0.6));

      kit.puff(
        aside(
          kit,
          at,
          Math.cos(angle) * out,
          Math.sin(angle) * out * 0.7 + share * reach * 0.3,
          spread(seed, puff + 20) * reach * 0.4,
        ),
        reach * (0.35 + open * 0.35) * (0.7 + noise(seed, puff + 30) * 0.5),
        puff % 2 === 0 ? soft : '#ffffff',
        shown * 0.75,
        { add: 0.25 },
      );
    }
    for (let feather = 0; feather < many(8, weight); feather += 1) {
      kit.leaf(
        aside(
          kit,
          at,
          spread(seed, feather + 40) * reach * 1.8 * open +
            Math.sin(share * 6 + feather) * reach * 0.2,
          spread(seed, feather + 50) * reach * 0.8 - share * reach * 1.2 + reach * 0.4,
          spread(seed, feather + 60) * reach * 0.6,
        ),
        reach * 0.18,
        Math.sin(share * 5 + feather) * 0.8 + Math.PI / 2,
        '#ffffff',
        late(share, 0.6) * Math.min(1, share * 4),
      );
    }
  },

  // Light drawn into a point, then flaring out of it in every direction
  Lustre(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    if (share < LUSTRE_GATHER) {
      const gather = share / LUSTRE_GATHER;

      kit.glow(at, reach * (1.2 - gather * 0.8), colour, 0.4 + gather * 0.5, 0.8);
      gathering(kit, at, reach * 2, 12, seed, share * 3, light);
      return;
    }
    const flare = (share - LUSTRE_GATHER) / (1 - LUSTRE_GATHER);

    kit.pool(floor, reach * (2 + flare * 2), colour, decay(flare) * 0.8);
    kit.glow(at, reach * (0.6 + flare * 2.2), light, decay(flare), 1);
    for (let ray = 0; ray < 12; ray += 1) {
      const angle = (ray / 12) * TAU + noise(seed, ray) * 0.2;
      const out = reach * (0.6 + flare * 2.4);

      kit.streak(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        reach * (0.5 + flare * 0.6),
        reach * 0.06,
        angle,
        light,
        decay(flare),
      );
    }
    kit.ring(at, reach * (0.5 + flare * 3), 0.05, '#ffffff', decay(flare));
    kit.ripple(floor, reach * (0.6 + flare * 3.2), 0.06, light, decay(flare) * 0.8);
  },

  // A star falling out of the sky onto it, then going off in a star of light
  Starfall(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    if (share < STARFALL_DROP) {
      const top = aside(kit, at, -reach * 2.5, reach * 7);
      const fall = (share / STARFALL_DROP) ** 2;
      const spot = toward(top, at, fall);

      kit.pool(floor, reach * 1.2 * fall, colour, fall * 0.5);
      kit.trail(toward(top, at, Math.max(0, fall - 0.25)), spot, reach * 0.25, colour, 0.6);
      kit.glow(spot, reach * 0.6, colour, 0.9, 0.9);
      kit.star(spot, reach * 0.8, share * 6, '#ffffff', 1);
      return;
    }
    const blast = (share - STARFALL_DROP) / (1 - STARFALL_DROP);

    kit.pool(floor, reach * (2 + blast * 1.5), colour, decay(blast) * 0.8);
    kit.glow(at, reach * (0.8 + blast * 1.8), light, decay(blast), 1);
    kit.star(at, reach * (1.5 + blast * 2.5), blast * 0.6, '#ffffff', decay(blast));
    kit.ring(at, reach * (0.6 + blast * 2.6), 0.06, light, decay(blast));
    for (let glint = 0; glint < many(12, weight); glint += 1) {
      kit.star(
        thrown(at, seed, glint, blast, reach * 2.4, reach * 1.6),
        reach * 0.2,
        blast * 4 + glint,
        light,
        late(blast, 0.5),
      );
    }
  },

  // Two great hands closing on it from either side and squeezing
  Grip(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const close = Math.min(1, share / GRIP_CLOSE) ** 2;
    const squeeze = Math.max(0, (share - GRIP_CLOSE) / (1 - GRIP_CLOSE));
    const shown = squeeze < 0.7 ? 1 : decay((squeeze - 0.7) / 0.3);
    // Trembling while it squeezes
    const held = aside(kit, at, squeeze > 0 ? Math.sin(share * 90) * reach * 0.04 : 0);

    for (const side of [-1, 1]) {
      hand(kit, held, side, reach, close, colour, shown);
    }
    if (squeeze <= 0) {
      return;
    }
    kit.ring(at, reach * (1.4 - squeeze * 0.8), 0.1, lighten(colour, 0.4), decay(squeeze));
    kit.glow(at, reach * 0.8, lighten(colour, 0.5), decay(Math.min(1, squeeze * 2)), 0.9);
    kit.star(at, reach * (0.8 + squeeze), 0.4, '#ffffff', decay(Math.min(1, squeeze * 1.5)));
    sparks(
      kit,
      at,
      reach * 1.2,
      many(8, weight),
      seed,
      squeeze,
      lighten(colour, 0.5),
      decay(squeeze),
    );
  },

  // Psychic light spiralling in on it, then tearing out of it in spikes
  Surge(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.45);

    if (share < SURGE_PULL) {
      const pull = share / SURGE_PULL;
      const count = many(10, weight);

      for (let one = 0; one < count; one += 1) {
        const angle = (one / count) * TAU + pull * Math.PI * 3;
        const out = reach * 2.2 * (1 - pull * 0.85);

        kit.glow(
          aside(
            kit,
            at,
            Math.cos(angle) * out,
            Math.sin(angle) * out * 0.8,
            Math.sin(angle * 2) * reach * 0.3,
          ),
          reach * 0.16,
          light,
          0.9,
          0.8,
        );
      }
      kit.glow(at, reach * (0.3 + pull * 0.5), colour, pull, 0.9);
      kit.oval(
        at,
        reach * 1.2 * (1 - pull * 0.5),
        reach * 0.5,
        pull * Math.PI,
        0.1,
        light,
        pull * 0.8,
      );
      return;
    }
    const blast = (share - SURGE_PULL) / (1 - SURGE_PULL);

    kit.pool(floor, reach * (2 + blast * 2), colour, decay(blast) * 0.8);
    kit.glow(at, reach * (0.8 + blast * 1.8), colour, decay(blast), 0.7);
    for (let spike = 0; spike < 12; spike += 1) {
      const angle = (spike / 12) * TAU + noise(seed, spike) * 0.4;
      const length = reach * (1 + noise(seed, spike + 10) * 1.2) * (0.4 + blast * 1.2);

      kit.streak(
        aside(kit, at, Math.cos(angle) * length * 0.5, Math.sin(angle) * length * 0.5),
        length * 0.5,
        reach * 0.14 * decay(blast),
        angle,
        light,
        decay(blast),
      );
    }
    for (let shell = 0; shell < 3; shell += 1) {
      const held = staged(blast, 1.4, shell * 0.2);
      const radius = reach * (0.8 + held * 2.6);

      kit.oval(
        at,
        radius,
        radius * (0.4 + shell * 0.15),
        shell * 1.1 + blast,
        0.07,
        light,
        decay(held),
      );
    }
    sparks(kit, at, reach * 1.6, many(8, weight), seed, blast, '#ffffff', decay(blast));
  },

  // A crescent moon rising over it, smaller ones circling, and silver falling
  Moonlit(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const shown = Math.min(1, share * 4) * late(share, 0.7);
    const moon = aside(kit, at, 0, reach * (1.2 + Math.min(1, share * 2) * 1.2));

    kit.pool(floor, reach * 2.2, colour, shown * 0.5);
    kit.glow(moon, reach * 1.1, colour, shown * 0.45, 0.2);
    crescent(kit, moon, reach * 0.7, Math.PI / 4, lighten(colour, 0.4), shown);
    for (let one = 0; one < 3; one += 1) {
      const angle = (one / 3) * TAU + share * TAU;

      crescent(
        kit,
        [
          at[0] + Math.cos(angle) * reach * 1.4,
          at[1] + Math.sin(share * TAU * 2 + one) * reach * 0.3,
          at[2] + Math.sin(angle) * reach * 1.4,
        ],
        reach * 0.3,
        angle,
        colour,
        shown,
      );
    }
    for (let mote = 0; mote < many(10, weight); mote += 1) {
      const held = (share * 1.3 + noise(seed, mote)) % 1;

      kit.glow(
        aside(
          kit,
          moon,
          spread(seed, mote + 10) * reach * 1.6,
          -held * reach * 3,
          spread(seed, mote + 20) * reach * 0.6,
        ),
        reach * 0.06,
        '#ffffff',
        swell(held) * shown,
        0.9,
      );
    }
  },

  // Two hearts trading places between the pair of them
  Exchange(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const held = Math.min(1, share / 0.7);
    const eased = held * held * (3 - 2 * held);
    const shown = late(share, 0.7);
    const trips: [from: Spot, to: Spot, lift: number, tint: string][] = [
      [stage.source, at, reach * 1.6, lighten(colour, 0.2)],
      [at, stage.source, reach * 0.5, mix(colour, '#8a7cff', 0.5)],
    ];

    for (const [from, to, lift, tint] of trips) {
      const spot = arcing(from, to, eased, lift);

      kit.trail(
        arcing(from, to, Math.max(0, eased - 0.12), lift),
        spot,
        reach * 0.14,
        tint,
        shown * 0.5,
      );
      kit.glow(spot, reach * 0.5, tint, shown * 0.4, 0.3);
      kit.heart(spot, reach * 0.45, Math.sin(share * 8) * 0.3, tint, shown);
    }
    if (share <= 0.7) {
      return;
    }
    const arrive = (share - 0.7) / 0.3;

    for (const end of [at, stage.source]) {
      kit.ring(end, reach * (0.4 + arrive * 1.4), 0.1, lighten(colour, 0.4), decay(arrive));
      kit.glow(end, reach * 0.8, colour, decay(arrive) * 0.6, 0.6);
    }
  },

  // A black sphere swelling up out of the ground and swallowing it, then collapsing
  Void(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const grow = Math.min(1, share / 0.4);
    const collapse = Math.max(0, (share - 0.6) / 0.4);
    const kept = 1 - collapse;
    const radius = reach * (0.4 + grow * 1.4) * (1 - collapse * collapse);
    const centre: Spot = [at[0], at[1] * (0.3 + grow * 0.7), at[2]];

    kit.pool(floor, reach * 2.2 * grow, '#000000', kept * 0.7, { add: 0 });
    kit.glow(centre, radius * 1.35, VOID_RIM, kept * 0.5, 0.1);
    kit.puff(centre, radius, '#050308', 0.95);
    kit.ring(centre, radius * 1.02, 0.06, VOID_RIM, kept * 0.8);
    for (let wisp = 0; wisp < many(10, weight); wisp += 1) {
      const held = (share * 1.6 + noise(seed, wisp)) % 1;
      const angle = noise(seed, wisp + 10) * TAU;
      const out = reach * 2.4 * (1 - held);

      kit.trail(
        aside(
          kit,
          centre,
          Math.cos(angle) * (out + reach * 0.3),
          Math.sin(angle) * (out + reach * 0.3),
        ),
        aside(kit, centre, Math.cos(angle) * out, Math.sin(angle) * out),
        reach * 0.05,
        lighten(paint.color, 0.3),
        swell(held) * 0.8 * kept,
      );
    }
    // A last ring thrown off as it collapses
    if (collapse > 0) {
      kit.ring(centre, reach * 2.2 * collapse, 0.05, VOID_RIM, swell(collapse) * 0.8);
    }
  },
  // A great ball of water slamming in from the caster's side, then a ring of spouts bursting up round it
  Cannon(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const foam = lighten(colour, 0.55);

    if (share < CANNON_ARRIVE) {
      const flight = share / CANNON_ARRIVE;
      const out = reach * 3.5 * (1 - flight);
      const ball = backToward(at, stage.source, out);

      kit.pool(floor, reach * 1.2 * flight, colour, flight * 0.4);
      kit.trail(backToward(at, stage.source, out + reach * 2), ball, reach * 0.5, colour, 0.5);
      kit.glow(ball, reach * 1.1, colour, 0.5, 0.2, { add: 0.5 });
      kit.bubble(ball, reach * 0.8, foam, 0.95);
      return;
    }
    const splash = (share - CANNON_ARRIVE) / (1 - CANNON_ARRIVE);
    const spouts = many(6, weight);

    kit.pool(floor, reach * (1.6 + splash * 2), colour, decay(splash) * 0.7, { add: 0.4 });
    kit.glow(
      at,
      reach * (0.8 + splash * 1.2),
      colour,
      decay(Math.min(1, splash * 1.6)) * 0.7,
      0.4,
      {
        add: 0.6,
      },
    );
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(splash, 1.4, wave * 0.3);

      if (held > 0) {
        kit.ripple(floor, reach * (0.6 + held * 2.6), 0.1, foam, decay(held) * 0.9);
      }
    }
    for (let spout = 0; spout < spouts; spout += 1) {
      const angle = (spout / spouts) * TAU + noise(seed, spout) * 0.4;

      jet(
        kit,
        [floor[0] + Math.cos(angle) * reach * 1.6, 0, floor[2] + Math.sin(angle) * reach * 1.6],
        reach * (2 + noise(seed, spout + 10) * 1.5) * Math.min(1, splash * 3),
        reach * 0.3,
        colour,
        foam,
        late(splash, 0.4),
        share * 12,
      );
    }
    for (let drop = 0; drop < many(14, weight); drop += 1) {
      const base = aside(kit, floor, 0, reach * 0.4);

      kit.trail(
        thrown(base, seed, drop, Math.max(0, splash - 0.07), reach * 2.4, reach * 1.8),
        thrown(base, seed, drop, splash, reach * 2.4, reach * 1.8),
        reach * 0.07,
        foam,
        late(splash, 0.5),
      );
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default legends;
