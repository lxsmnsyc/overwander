import { WEATHER_BALL_TYPES } from '../../../../battle/moves/conditional-power';
import { TYPE_COLORS, Types } from '../../../../data/constants/types';
import { Weathers } from '../../../../data/ids/status';
import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { FREEZE_CRACK, FREEZE_SET, TRI_MEET, TRI_TYPES, WEATHER_FALL } from '../effect/elements';
import { CHASM_RUN, CHASM_TEAR, type EffectShape, many } from '../effect/shapes';
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
import { TAU, bolt, debris, imbue, smoke, sparks } from './pieces';

/**
 * The elements arriving in the battle scene: the same shapes as the
 * painted ones, given height, light on the floor and pieces that fall
 * back to it.
 */

/** Yellow at a flame's root, orange partway and the move's own colour by the tip. */
function flameTint(rise: number, hot: string, warm: string, colour: string): string {
  if (rise < 0.35) {
    return hot;
  }
  return rise < 0.7 ? warm : colour;
}

/** A meteor `fall` of the way down out of the sky onto a spot on the floor, burning as it comes */
function meteor(
  kit: EffectBatch,
  ground: Spot,
  reach: number,
  fall: number,
  colour: string,
  hot: string,
): void {
  const sky = aside(kit, ground, -reach * 3, reach * 8);
  const spot = toward(sky, ground, fall);

  kit.pool(ground, reach * 0.9 * fall, hot, fall * 0.5);
  kit.trail(toward(sky, ground, Math.max(0, fall - 0.3)), spot, reach * 0.35, colour, 0.6);
  kit.glow(spot, reach * 0.7, hot, 0.9, 0.9);
  kit.shard(spot, reach * 0.3, fall * 6, mix(hot, '#3a2010', 0.5), 1);
}

/** Where a meteor struck: a flash, a ring along the floor and rock thrown up */
function crater(
  kit: EffectBatch,
  ground: Spot,
  reach: number,
  blast: number,
  seed: number,
  colour: string,
  hot: string,
): void {
  kit.pool(ground, reach * (1 + blast * 1.2), hot, decay(blast) * 0.8);
  kit.glow(aside(kit, ground, 0, reach * 0.4), reach * (0.5 + blast * 1.2), hot, decay(blast), 0.8);
  kit.ripple(ground, reach * (0.4 + blast * 1.8), 0.08, lighten(colour, 0.3), decay(blast));
  debris(
    kit,
    aside(kit, ground, 0, reach * 0.2),
    reach * 0.7,
    6,
    seed,
    blast,
    mix(colour, '#5b4636', 0.5),
    late(blast, 0.6),
  );
}

/** A block of ice standing on the floor round a spot, `grown` of the way up */
function iceBlock(kit: EffectBatch, floor: Spot, reach: number, grown: number, ice: string): void {
  const low: Spot[] = [];
  const high: Spot[] = [];

  for (const [right, away] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ] as const) {
    low.push(aside(kit, floor, right * reach * 1.2, 0.02, away * reach));
    high.push(aside(kit, floor, right * reach * 1.2, reach * 2.6 * grown, away * reach));
  }
  for (let side = 0; side < 4; side += 1) {
    const next = (side + 1) % 4;

    kit.panel([high[side], high[next], low[next], low[side]], ice, 0.5);
    kit.ribbon([low[side], high[side]], reach * 0.06, '#ffffff', 0.7);
  }
  kit.panel([high[0], high[1], high[2], high[3]], ice, 0.4);
  kit.ribbon([...high, high[0]], reach * 0.06, '#ffffff', 0.7);
}

const elements = {
  // Weather setting in, over the field rather than on anybody
  Sky(kit, stage, share, { paint, seed }) {
    const at = floorOf(landed(stage));
    const reach = reachOf(stage);
    const drop = lighten(paint.color, 0.3);

    for (let fall = 0; fall < 14; fall += 1) {
      const held = (share * 1.2 + noise(seed, fall)) % 1;
      const spot = aside(
        kit,
        at,
        spread(seed, fall + 40) * reach * 2.5,
        reach * 5 * (1 - held),
        spread(seed, fall + 60) * reach * 1.5,
      );

      kit.streak(spot, reach * 0.22, reach * 0.04, Math.PI / 2, drop, swell(held) * 0.85);
      if (held > 0.85) {
        const splash = (held - 0.85) / 0.15;

        kit.ripple(floorOf(spot), reach * 0.35 * splash, 0.3, drop, decay(splash) * 0.6);
      }
    }
    kit.pool(at, reach * 2.4, paint.color, swell(share) * 0.2);
    kit.ripple(at, reach * (1.4 + swell(share) * 1.2), 0.08, paint.color, swell(share) * 0.45);
  },

  // A hit that takes the ground with it
  Blast(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const fade = decay(share);

    kit.pool(floor, reach * 1.3, '#140e0a', swell(share) * 0.45, { add: 0 });
    kit.pool(floor, reach * (1 + share * 1.5), colour, fade * 0.7);
    smoke(kit, at, reach, 5, seed, share, mix(colour, '#2a2424', 0.8), swell(share) * 0.5);
    for (let lobe = 0; lobe < 6; lobe += 1) {
      const angle = noise(seed, lobe + 3) * TAU;
      const out = reach * (0.2 + share * 0.9) * noise(seed, lobe + 13);

      kit.glow(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.7 + reach * share * 0.5),
        reach * (0.4 + share * 0.9),
        lobe % 2 === 0 ? colour : lighten(colour, 0.35),
        fade * 0.6,
        0.3,
      );
    }
    kit.glow(
      at,
      reach * (0.5 + share * 1.1),
      lighten(colour, 0.45),
      decay(Math.min(1, share * 1.8)) * 0.75,
      0.6,
    );
    kit.ripple(floor, reach * (0.6 + share * 2.8), 0.06, lighten(colour, 0.4), fade * 0.9);
    kit.ring(at, reach * (0.6 + share * 2.2), 0.05, lighten(colour, 0.5), fade * 0.7);
    debris(
      kit,
      at,
      reach,
      many(9, weight),
      seed,
      share,
      mix(colour, '#5b4636', 0.55),
      late(share, 0.7),
    );
    sparks(kit, at, reach * 1.4, many(8, weight), seed, share, lighten(colour, 0.6), fade);
  },

  // Something special going off: a core, a ring leaving it, and motes rising
  Bloom(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const fade = decay(share);

    kit.pool(floorOf(at), reach * 1.4, colour, swell(share) * 0.4);
    kit.glow(at, reach * (0.6 + swell(share) * 0.6), colour, 0.9 * fade, 0.8);
    kit.ring(at, reach * (0.5 + share * 1.6), 0.08, lighten(colour, 0.4), fade);
    for (let mote = 0; mote < many(10, weight); mote += 1) {
      const spot = aside(
        kit,
        at,
        spread(seed, mote) * reach * 1.4 * share,
        share * reach * (0.6 + noise(seed, mote + 20) * 0.8),
        spread(seed, mote + 40) * reach * 0.8 * share,
      );

      kit.glow(spot, reach * 0.09, lighten(colour, 0.5), fade, 0.9);
    }
  },

  // A beam arriving and holding for an instant
  Beam(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    // Out fast, held, then gone: a beam that fades as it travels is a
    // beam nobody sees arrive
    const out = Math.min(1, share * 3);
    const fading = share < 0.7 ? 1 : decay(share) * 3;
    const head = toward(stage.source, at, out);
    const path: Spot[] = [];
    const width = reach * 0.3 * fading;

    for (let step = 0; step <= 12; step += 1) {
      path.push(toward(stage.source, head, step / 12));
    }
    kit.ribbon(path, width * 3, colour, 0.3 * fading, share * 10);
    kit.ribbon(path, width, lighten(colour, 0.2), fading, share * 16);
    // Light winding round it on the way
    for (let mote = 0; mote < 10; mote += 1) {
      const along = ((mote / 10 + share * 2.5) % 1) * out;
      const turn = along * 14 + noise(seed, mote) * TAU;

      kit.glow(
        aside(
          kit,
          toward(stage.source, at, along),
          0,
          Math.sin(turn) * width * 0.9,
          Math.cos(turn) * width * 0.9,
        ),
        reach * 0.08,
        lighten(colour, 0.5),
        fading * 0.9,
      );
    }
    kit.glow(stage.source, reach * 0.5 * fading, lighten(colour, 0.4), fading);
    if (out >= 1) {
      const struck = (share - 1 / 3) / (2 / 3);

      kit.pool(floorOf(at), reach * 1.6, colour, fading * 0.6);
      kit.glow(at, reach * (0.7 + swell(share) * 0.5), colour, fading);
      kit.ring(at, reach * (0.4 + struck * 1.6), 0.08, lighten(colour, 0.5), decay(struck));
      // Sprays over and over while it holds
      sparks(
        kit,
        at,
        reach * 1.2,
        many(6, weight),
        seed + Math.floor(share * 12),
        (share * 12) % 1,
        lighten(colour, 0.6),
        fading,
      );
    }
  },

  // Lightning, from whoever fired it
  Zap(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const flick = Math.floor(share * 16);
    // Bright for most of it and then gone, with a stutter: lightning does not dim
    const bright = Math.min(1, decay(share) * 2.2) * (flick % 3 === 2 ? 0.5 : 1);

    kit.pool(floorOf(at), reach * 1.8, colour, bright * 0.5);
    bolt(kit, stage.source, at, seed + flick * 13, reach, reach * 0.2 * weight, colour, bright);
    // A strong one forks
    if (weight > 1.15) {
      bolt(kit, stage.source, at, seed + 17 + flick * 7, reach, reach * 0.1, colour, bright * 0.7);
    }
    kit.glow(stage.source, reach * 0.4, lighten(colour, 0.5), bright * 0.8);
    kit.glow(at, reach * (0.5 + share * 0.5), colour, decay(share));
    kit.star(
      at,
      reach * (0.9 + noise(seed, flick) * 0.5),
      noise(seed, flick + 3) * 0.6,
      lighten(colour, 0.6),
      bright,
    );
    sparks(kit, at, reach, many(8, weight), seed, share, lighten(colour, 0.5), decay(share));
  },

  // Fire: tongues licking up round it, a core, and embers
  Flame(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.65);
    const warm = mix(colour, '#ff8a2a', 0.45);
    const fade = late(share, 0.55);
    const core = aside(kit, at, 0, reach * share * 0.4);

    kit.pool(floor, reach * (1.4 + swell(share)), colour, swell(share) * 0.55);
    smoke(
      kit,
      aside(kit, at, 0, reach * 0.6),
      reach * 0.8,
      3,
      seed,
      share,
      mix(colour, '#262222', 0.82),
      swell(share) * 0.35,
    );
    const tongues = many(14, weight);

    // Licks of flame rising and shrinking, yellow at the root and the
    // move's own colour by the tip
    for (let tongue = 0; tongue < tongues; tongue += 1) {
      const rise = (share * 2.2 + noise(seed, tongue)) % 1;
      const angle = (tongue / tongues) * TAU + noise(seed, tongue + 5);
      const round = reach * 0.4 * (1 - rise * 0.6);
      const sway = spread(seed, tongue + 9) * reach * 0.15 * rise;

      kit.glow(
        aside(
          kit,
          [at[0] + Math.cos(angle) * round, at[1], at[2] + Math.sin(angle) * round],
          sway,
          -reach * 0.35 + rise * reach * 1.6,
        ),
        reach * 0.32 * (1 - rise * 0.7),
        flameTint(rise, hot, warm, colour),
        swell(rise) * fade * 0.9,
        rise < 0.35 ? 0.6 : 0.15,
      );
    }
    kit.glow(
      core,
      reach * (0.7 + swell(share) * 0.5),
      mix(colour, '#3a0800', 0.45),
      0.8 * fade,
      0.1,
    );
    kit.glow(core, reach * (0.45 + swell(share) * 0.35), colour, 0.9 * fade, 0.7);
    for (let ember = 0; ember < many(12, weight); ember += 1) {
      const spot = aside(
        kit,
        at,
        spread(seed, ember + 20) * reach * (0.3 + share * 1.2),
        share * reach * (0.8 + noise(seed, ember + 30) * 1.2),
        spread(seed, ember + 40) * reach * share,
      );

      kit.glow(spot, reach * 0.06, hot, decay(share) * (0.6 + noise(seed, ember + 50) * 0.4));
    }
    // A big one rings it in fire rather than a puff
    if (weight > 1.25) {
      for (let pillar = 0; pillar < 8; pillar += 1) {
        const angle = (pillar / 8) * TAU + share;
        const round = reach * (1 + share * 0.6);
        const rise = swell(staged(share, 1.6, pillar * 0.05));

        for (let lick = 0; lick < 3; lick += 1) {
          kit.glow(
            [
              floor[0] + Math.cos(angle) * round,
              reach * rise * (0.15 + lick * 0.35),
              floor[2] + Math.sin(angle) * round,
            ],
            reach * 0.28 * rise * (1 - lick * 0.25),
            lick === 0 ? hot : warm,
            rise * fade * 0.85,
            lick === 0 ? 0.5 : 0.1,
          );
        }
      }
    }
  },

  // Water: it lands, it spreads, it throws spray
  Splash(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const foam = lighten(colour, 0.55);
    const spray = late(share, 0.6) * 0.9;

    kit.pool(floor, reach * (0.8 + share * 1.4), colour, swell(share) * 0.3, { add: 0.4 });
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(share, 1.4, wave * 0.3);

      if (held > 0) {
        kit.ripple(floor, reach * (0.4 + held * 2), 0.1, foam, decay(held) * 0.9);
      }
    }
    kit.glow(at, reach * (0.5 + share * 0.6), colour, decay(share * 1.4) * 0.4, 0.15, { add: 0.6 });
    kit.ring(at, reach * (0.3 + share * 1.4), 0.12, foam, decay(share) * 0.8);
    for (let drop = 0; drop < many(14, weight); drop += 1) {
      const now = thrown(at, seed, drop, share, reach * 1.8, reach * 1.1);
      const was = thrown(at, seed, drop, Math.max(0, share - 0.07), reach * 1.8, reach * 1.1);

      kit.trail(was, now, reach * 0.06, foam, spray);
    }
  },

  // Ice: the cold blows through, pieces break off, and crystals are left standing
  Frost(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const ice = lighten(paint.color, 0.45);
    const fade = decay(share);

    kit.pool(floor, reach * (1 + share), '#e6f7ff', swell(share) * 0.35, { add: 0.5 });
    kit.ripple(floor, reach * (0.7 + share * 0.9), 0.18, ice, swell(share) * 0.7);
    for (let mist = 0; mist < 3; mist += 1) {
      kit.glow(
        aside(kit, at, spread(seed, mist) * reach * 0.8, spread(seed, mist + 3) * reach * 0.3),
        reach * (0.8 + share * 0.5),
        ice,
        swell(share) * 0.3,
        0,
        { add: 0.3 },
      );
    }
    for (let gust = 0; gust < many(6, weight); gust += 1) {
      const held = staged(share, 1.6, noise(seed, gust + 9) * 0.5);

      if (held <= 0 || held >= 1) {
        continue;
      }
      const across = held * 2 - 1;

      kit.streak(
        aside(
          kit,
          at,
          across * reach * 2,
          spread(seed, gust) * reach * 0.8 - across * reach * 0.5,
          spread(seed, gust + 4) * reach * 0.5,
        ),
        reach * 0.55,
        reach * 0.05,
        -0.25,
        ice,
        swell(held) * 0.9,
      );
    }
    for (let piece = 0; piece < many(8, weight); piece += 1) {
      kit.shard(
        thrown(at, seed, piece, share, reach * 1.6, reach * 0.9),
        reach * 0.18 * (0.7 + noise(seed, piece + 60) * 0.6),
        noise(seed, piece) * TAU + share * 4,
        ice,
        fade,
        { add: 0.25 },
      );
    }
    const grown = Math.min(1, share * 2.5) * late(share, 0.75);
    const crystals = many(5, weight);

    for (let crystal = 0; crystal < crystals; crystal += 1) {
      const angle = (crystal / crystals) * TAU + noise(seed, crystal + 90);
      const round = reach * (0.7 + noise(seed, crystal + 91) * 0.4);
      const size = reach * 0.3 * (0.6 + noise(seed, crystal + 92) * 0.6) * grown;

      // Standing on the floor: a piece is drawn about its middle
      kit.shard(
        [floor[0] + Math.cos(angle) * round, size, floor[2] + Math.sin(angle) * round],
        size,
        spread(seed, crystal + 93) * 0.3,
        ice,
        grown,
        { add: 0.2 },
      );
    }
    for (let glint = 0; glint < 4; glint += 1) {
      const twinkle = swell((share * 2 + noise(seed, glint + 70)) % 1);

      kit.star(
        aside(kit, at, spread(seed, glint + 71) * reach, spread(seed, glint + 72) * reach),
        reach * 0.25,
        0,
        '#ffffff',
        twinkle * fade,
      );
    }
  },

  // Grass: cuts across it and leaves thrown off
  Leafy(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const edge = lighten(colour, 0.5);

    for (let cut = 0; cut < many(2, weight); cut += 1) {
      const held = staged(share, 2.2, cut * 0.35);

      if (held <= 0) {
        continue;
      }
      const angle = noise(seed, cut) * TAU;
      const radius = reach * (0.7 + cut * 0.25);
      const path: Spot[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const turn = -0.9 + (step / 8) * 1.8 * held;
        const x = Math.cos(turn) * radius;
        const y = Math.sin(turn) * radius * 0.75;

        path.push(
          aside(
            kit,
            at,
            x * Math.cos(angle) - y * Math.sin(angle),
            x * Math.sin(angle) + y * Math.cos(angle),
          ),
        );
      }
      kit.ribbon(path, reach * 0.12, edge, decay(share));
    }
    for (let one = 0; one < many(7, weight); one += 1) {
      kit.leaf(
        thrown(at, seed, one, share, reach * 1.5, reach * 0.7),
        reach * 0.2,
        noise(seed, one + 5) * TAU + share * 7,
        one % 2 === 0 ? colour : mix(colour, '#1d4a12', 0.35),
        late(share, 0.6),
      );
    }
    kit.glow(at, reach * 0.6, edge, decay(Math.min(1, share * 2)) * 0.5, 0.6);
  },

  // Leaves crossing the gap in a line, spinning, each cutting as it arrives
  Leaves(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const flying = many(5, weight);

    for (let leaf = 0; leaf < flying; leaf += 1) {
      const delay = (leaf / flying) * 0.7;
      const raw = share * 1.7 - delay;

      if (raw <= 0) {
        continue;
      }
      const drift = spread(seed, leaf) * reach * 0.8;
      const along = (held: number): Spot =>
        aside(
          kit,
          toward(stage.source, at, held),
          0,
          drift * 0.6 + Math.sin(held * Math.PI) * reach * 0.6,
          drift,
        );

      if (raw < 1) {
        const spot = along(raw);

        kit.trail(along(Math.max(0, raw - 0.08)), spot, reach * 0.05, lighten(colour, 0.4), 0.6);
        kit.leaf(spot, reach * 0.28, raw * 14 + leaf, colour, 1);
        continue;
      }
      kit.streak(
        aside(kit, at, drift * 0.3, drift * 0.2),
        reach * 0.5,
        reach * 0.06,
        0.6 + leaf,
        lighten(colour, 0.6),
        decay((raw - 1) * 3),
      );
    }
  },

  // The ground itself: waves along it, stones hopping, dust
  Quake(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const dust = mix(colour, '#b9a58a', 0.55);

    kit.pool(floor, reach * 1.8, '#20150d', swell(share) * 0.4, { add: 0 });
    for (let wave = 0; wave < many(3, weight); wave += 1) {
      const held = staged(share, 1.4, wave * 0.22);

      if (held > 0) {
        kit.ripple(floor, reach * held * 3.4, 0.07, lighten(colour, 0.25), decay(held) * 0.9);
      }
    }
    for (let rock = 0; rock < many(9, weight); rock += 1) {
      const hop = staged(share, 1.5, noise(seed, rock + 3) * 0.45);

      if (hop <= 0 || hop >= 1) {
        continue;
      }
      const angle = noise(seed, rock) * TAU;
      const round = reach * (0.5 + noise(seed, rock + 10) * 2);
      const size = reach * 0.14 * (0.7 + noise(seed, rock + 20) * 0.7);

      kit.shard(
        [
          floor[0] + Math.cos(angle) * round,
          size + reach * 1.1 * 4 * hop * (1 - hop),
          floor[2] + Math.sin(angle) * round,
        ],
        size,
        hop * 5 + rock,
        mix(colour, '#6b5440', 0.4),
        1,
      );
    }
    for (let puff = 0; puff < 7; puff += 1) {
      const angle = (puff / 7) * TAU + noise(seed, puff + 40);
      const round = reach * (0.8 + share * 1.8);

      kit.glow(
        [floor[0] + Math.cos(angle) * round, reach * 0.3, floor[2] + Math.sin(angle) * round],
        reach * (0.4 + share * 0.5),
        dust,
        swell(share) * 0.4,
        0,
        { add: 0 },
      );
    }
  },

  // A barrage: bubbles crowd whatever they hit and pop one after another
  Bubbles(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shell = lighten(paint.color, 0.35);
    const count = many(9, weight);

    for (let one = 0; one < count; one += 1) {
      const held = Math.min(1, share * 1.6 - (one / count) * 0.6);

      if (held <= 0) {
        continue;
      }
      const angle = noise(seed, one) * TAU;
      const round = reach * (0.3 + noise(seed, one + 20) * 0.8);
      const radius = reach * 0.2 * (0.6 + noise(seed, one + 40) * 0.8);
      // Rising as it goes, since a bubble does
      const spot: Spot = [
        at[0] + Math.cos(angle) * round,
        at[1] + spread(seed, one + 60) * reach * 0.5 + held * reach * 0.4,
        at[2] + Math.sin(angle) * round * 0.6,
      ];

      if (held < 0.7) {
        kit.bubble(spot, radius * (0.55 + held * 0.6), shell, 0.9);
        continue;
      }
      const popped = (held - 0.7) / 0.3;
      const spray = radius * (1 + popped * 1.5);

      kit.ring(spot, radius * (1 + popped * 1.2), 0.15, shell, decay(popped) * 0.85);
      for (let drop = 0; drop < 3; drop += 1) {
        const turn = (drop / 3) * TAU + angle;

        kit.glow(
          aside(kit, spot, Math.cos(turn) * spray, Math.sin(turn) * spray),
          reach * 0.04,
          shell,
          decay(popped),
        );
      }
    }
  },

  // A sound: rings leaving the caster and washing over what heard it
  Wave(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.3 + pulse * 0.28) % 1;

      kit.ring(
        toward(stage.source, at, held),
        reach * (0.3 + held * 0.9),
        0.1,
        lighten(paint.color, 0.3),
        decay(held) * 0.9,
      );
    }
    kit.ripple(floorOf(at), reach * (0.6 + share * 1.6), 0.08, paint.color, swell(share) * 0.5);
  },

  // Wind: a funnel turning up round it
  Swirl(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const wind = lighten(paint.color, 0.45);
    const risen = Math.min(1, share * 2.5);
    const shown = swell(share);
    const funnel = (along: number, turn: number): Spot => {
      const round = reach * (0.35 + along * 0.75);

      return [
        floor[0] + Math.cos(turn) * round,
        along * reach * 2.6 * risen,
        floor[2] + Math.sin(turn) * round,
      ];
    };

    for (let band = 0; band < 3; band += 1) {
      const path: Spot[] = [];

      for (let step = 0; step <= 16; step += 1) {
        const along = step / 16;

        path.push(funnel(along, along * TAU * 1.4 + share * Math.PI * 5 + band * 2.1));
      }
      kit.ribbon(path, reach * 0.08, wind, shown * 0.75, share * 8, { add: 0.7 });
    }
    for (let mote = 0; mote < many(8, weight); mote += 1) {
      const along = (noise(seed, mote) + share * 0.8) % 1;

      kit.glow(
        funnel(along, along * TAU * 1.4 + share * Math.PI * 5 + noise(seed, mote + 9) * TAU),
        reach * 0.06,
        wind,
        shown,
        0.8,
      );
    }
    kit.ripple(floor, reach * (0.8 + share * 0.6), 0.1, wind, shown * 0.5);
  },

  // Rocks coming down on it, each with its shadow rushing up to meet it
  Rocks(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const stone = mix(paint.color, '#7a6650', 0.35);
    const shade = mix(stone, '#000000', 0.25);
    const dust = mix(paint.color, '#b9a58a', 0.6);
    const falling = many(4, weight);
    const fade = late(share, 0.8);

    // Staggered by index, so the first is already on its way at the first frame
    for (let rock = 0; rock < falling; rock += 1) {
      const raw = share * 1.6 - (rock / falling) * 0.55;

      if (raw <= 0) {
        continue;
      }
      const held = Math.min(1, raw);
      const floor = floorOf(
        aside(kit, at, spread(seed, rock + 12) * reach, 0, spread(seed, rock + 14) * reach * 0.6),
      );
      const size = reach * 0.4 * (0.8 + noise(seed, rock + 16) * 0.4);
      const height = size * 0.7 + reach * 5 * (1 - held * held);

      kit.pool(floor, size * (0.6 + held * 0.6), '#140e0a', held * 0.5 * fade, { add: 0 });
      kit.shard([floor[0], height, floor[2]], size, rock * 1.7 + held * 2, stone, fade);
      kit.shard([floor[0], height, floor[2]], size * 0.7, rock * 1.7 + held * 2 + 2.4, shade, fade);
      if (raw >= 1) {
        const after = Math.min(1, (raw - 1) * 3);

        kit.ripple(floor, size * (0.8 + after * 2), 0.1, dust, decay(after) * 0.8);
        for (let puff = 0; puff < 3; puff += 1) {
          kit.glow(
            aside(kit, floor, spread(seed, rock * 5 + puff) * size * 1.5, size * (0.4 + after)),
            size * (0.6 + after * 0.8),
            dust,
            decay(after) * 0.5,
            0,
            { add: 0 },
          );
        }
      }
    }
  },

  // The ground splitting open underneath it and closing again
  Chasm(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const open =
      share < CHASM_TEAR
        ? share / CHASM_TEAR
        : Math.max(0, 1 - (share - CHASM_TEAR) / (1 - CHASM_TEAR));
    const half = reach * CHASM_RUN;

    kit.pool(floor, half * 1.1, '#140d08', open * 0.4, { add: 0 });
    kit.pit(floor, half, open, lighten(paint.color, 0.3), 1);
    kit.ripple(
      floor,
      half * (0.5 + share * 1.1),
      0.06,
      lighten(paint.color, 0.3),
      decay(share) * 0.7,
    );
    for (let piece = 0; piece < many(10, weight); piece += 1) {
      kit.shard(
        thrown(
          aside(kit, floor, spread(seed, piece + 5) * half * 0.8),
          seed,
          piece,
          Math.min(1, share * 1.5),
          half * 0.5,
          reach * 1.4,
        ),
        reach * 0.14 * (0.7 + noise(seed, piece + 60) * 0.6),
        noise(seed, piece) * TAU + share * 5,
        mix(paint.color, '#5b4636', 0.4),
        late(share, 0.7),
      );
    }
    for (let puff = 0; puff < 6; puff += 1) {
      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, puff + 31) * half,
          reach * (0.4 + share * 0.8),
          spread(seed, puff + 33) * reach * 0.3,
        ),
        reach * (0.5 + share * 0.6),
        mix(paint.color, '#b9a58a', 0.6),
        swell(share) * 0.4,
        0,
        { add: 0 },
      );
    }
  },

  // A stream of stars arcing in, which says it never misses
  Stars(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;

    for (let mark = 0; mark < many(5, weight); mark += 1) {
      const held = (share * 1.4 + mark * 0.17) % 1;
      const drift = spread(seed, mark) * reach * 0.5;
      const along = (through: number): Spot =>
        aside(
          kit,
          toward(stage.source, at, through),
          drift,
          drift * 0.4 + Math.sin(through * Math.PI) * reach * 0.5,
        );
      const spot = along(held);
      const alpha = Math.min(1, swell(held) + 0.25);

      kit.trail(along(Math.max(0, held - 0.1)), spot, reach * 0.1, colour, alpha * 0.5);
      kit.glow(spot, reach * 0.3, colour, alpha * 0.4, 0.3);
      kit.star(spot, reach * 0.34, held * 5, lighten(colour, 0.3), alpha);
    }
    if (share > 0.6) {
      const burst = (share - 0.6) / 0.4;

      kit.star(at, reach * (0.6 + burst * 1.2), burst, lighten(colour, 0.5), decay(burst));
      sparks(kit, at, reach * 1.2, 6, seed, burst, colour, decay(burst));
    }
  },

  // A column coming down on it: the base fills as the top drains
  Spout(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const top: Spot = [floor[0], reach * 4.6, floor[2]];
    const head = toward(top, floor, Math.min(1, share * 1.8));
    const tail = toward(top, floor, Math.max(0, (share - 0.55) / 0.45));
    const width = reach * 0.6 * (1 - share * 0.45);
    const fade = decay(share);
    const path: Spot[] = [];

    for (let step = 0; step <= 8; step += 1) {
      path.push(toward(tail, head, step / 8));
    }
    kit.ribbon(path, width * 2.2, colour, fade * 0.35, share * 10);
    kit.ribbon(path, width, lighten(colour, 0.25), fade, share * 14);
    if (share <= 0.3) {
      return;
    }
    const struck = (share - 0.3) / 0.7;
    const base: Spot = [floor[0], reach * 0.2, floor[2]];

    kit.pool(floor, reach * (1 + struck * 1.4), colour, decay(struck) * 0.6);
    kit.ripple(floor, reach * struck * 3.4, 0.08, lighten(colour, 0.4), decay(struck));
    kit.glow(aside(kit, floor, 0, reach * 0.3), reach * 0.9, colour, decay(struck) * 0.8, 0.8);
    for (let drop = 0; drop < many(10, weight); drop += 1) {
      kit.trail(
        thrown(base, seed, drop, Math.max(0, struck - 0.07), reach * 2.2, reach * 1.6),
        thrown(base, seed, drop, struck, reach * 2.2, reach * 1.6),
        reach * 0.08,
        lighten(colour, 0.45),
        late(struck, 0.5),
      );
    }
  },

  // Pushed up through the floor round it, and still growing
  Roots(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const bark = mix(paint.color, '#3b2a14', 0.35);
    const growing = many(5, weight);
    const alpha = late(share, 0.8);

    kit.pool(floor, reach * 1.2, '#1f160c', swell(share) * 0.35, { add: 0 });
    for (let root = 0; root < growing; root += 1) {
      const held = staged(share, 1.5, (root / growing) * 0.35);

      if (held <= 0) {
        continue;
      }
      const angle = (root / growing) * TAU + spread(seed, root) * 0.4;
      const lean = reach * (0.6 + noise(seed, root + 20) * 0.6);
      const bow = spread(seed, root + 40) * reach * 0.5;
      const path: Spot[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const along = (step / 8) * held;
        const out = reach * 0.5 + lean * along;
        const sway = bow * Math.sin(Math.PI * along);

        path.push([
          floor[0] + Math.cos(angle) * out - Math.sin(angle) * sway,
          along * reach * 2.4,
          floor[2] + Math.sin(angle) * out + Math.cos(angle) * sway,
        ]);
      }
      kit.ribbon(path, reach * (0.2 - (root / growing) * 0.07), bark, alpha, 0, { add: 0 });
      kit.leaf(path[path.length - 1], reach * 0.2 * held, angle + share * 2, paint.color, alpha);
    }
    kit.ripple(
      floor,
      reach * (0.5 + share * 1.1),
      0.08,
      lighten(paint.color, 0.2),
      decay(share) * 0.8,
    );
  },

  // Laid on the ground in a row in front of them, glinting as each settles
  Caltrops(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const spike = lighten(paint.color, 0.15);
    const laid = 5;
    const size = reach * 0.24;

    for (let one = 0; one < laid; one += 1) {
      const raw = share * 1.5 - (one / laid) * 0.4;

      if (raw <= 0) {
        continue;
      }
      const held = Math.min(1, raw);
      const floor = floorOf(
        aside(
          kit,
          at,
          (one / (laid - 1) - 0.5) * reach * 3.2,
          0,
          -reach * 0.6 + spread(seed, one) * reach * 0.3,
        ),
      );

      kit.pool(floor, size * 1.2, '#140e0a', held * 0.4, { add: 0 });
      kit.shard(
        [floor[0], size + reach * 2.5 * (1 - held * held), floor[2]],
        size,
        (1 - held) * 3 + one,
        spike,
        1,
      );
      if (raw >= 1) {
        kit.star(
          [floor[0], size * 1.6, floor[2]],
          size * 0.8,
          0,
          '#ffffff',
          swell(Math.min(1, (raw - 1) * 4)) * 0.8,
        );
      }
    }
  },

  // Wind that keeps coming: strands turning out of the caster and widening onto it, the far end turning rather than bursting
  Gale(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const wind = lighten(paint.color, 0.3);
    const out = Math.min(1, share * 2.4);
    const fading = share < 0.75 ? 1 : decay(share) * 4;
    const strands = many(3, weight);

    for (let strand = 0; strand < strands; strand += 1) {
      const path: Spot[] = [];

      for (let step = 0; step <= 22; step += 1) {
        const along = (step / 22) * out;
        const phase = along * Math.PI * 2.5 + share * Math.PI * 6 + (strand / strands) * TAU;
        // Wider the further it has blown, so the pokemon at the far end stands in the mouth of it
        const swing = reach * 0.9 * (0.25 + along);

        path.push(
          aside(
            kit,
            toward(stage.source, at, along),
            Math.cos(phase) * swing,
            Math.sin(phase) * swing * 0.6,
          ),
        );
      }
      kit.ribbon(path, reach * 0.09, wind, fading * 0.9, share * 8, { add: 0.7 });
    }
    if (out >= 1) {
      for (let spin = 0; spin < 2; spin += 1) {
        const radius = reach * (0.8 + spin * 0.4);
        const start = share * Math.PI * 5 + spin * 2.2;
        const arc: Spot[] = [];

        for (let step = 0; step <= 8; step += 1) {
          const angle = start - 0.9 + (step / 8) * 1.8;

          arc.push(aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius * 0.75));
        }
        kit.ribbon(arc, reach * 0.1, wind, fading * 0.8);
      }
    }
    for (let mote = 0; mote < many(4, weight); mote += 1) {
      const held = (share + noise(seed, mote)) % 1;

      kit.glow(
        aside(
          kit,
          at,
          spread(seed, mote + 10) * reach * 1.6 * held,
          spread(seed, mote + 20) * reach * held,
          spread(seed, mote + 30) * reach,
        ),
        reach * 0.07,
        wind,
        fading * 0.6 * swell(held),
        0.6,
      );
    }
  },
  // Meteors streaking down onto it one after another, each going off where it lands
  Meteors(kit, stage, share, { paint, seed, weight }) {
    const floor = floorOf(landed(stage));
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffb04a', 0.6);
    const count = many(3, weight);

    for (let rock = 0; rock < count; rock += 1) {
      const raw = share * 1.8 - (rock / count) * 0.8;

      if (raw <= 0) {
        continue;
      }
      const ground = floorOf(
        aside(
          kit,
          floor,
          spread(seed, rock) * reach * 1.4,
          0,
          spread(seed, rock + 5) * reach * 0.8,
        ),
      );

      if (raw < 0.5) {
        meteor(kit, ground, reach, raw / 0.5, colour, hot);
        continue;
      }
      crater(kit, ground, reach, Math.min(1, (raw - 0.5) / 0.5), seed + rock, colour, hot);
    }
  },

  // The ground under it splitting, and light bursting up out of the split
  Rift(kit, stage, share, { paint, seed, weight }) {
    const floor = floorOf(landed(stage));
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = mix(colour, '#ffcc66', 0.6);
    const open = Math.min(1, share * 3) * late(share, 0.7);

    kit.pool(floor, reach * 2, light, open * 0.5);
    kit.pit(floor, reach * 1.8, open, light, 1);
    kit.ripple(floor, reach * (0.8 + share * 1.6), 0.08, lighten(colour, 0.3), decay(share) * 0.8);
    if (share <= 0.2) {
      return;
    }
    const rise = (share - 0.2) / 0.8;
    const up = Math.min(1, rise * 2.5);
    const path: Spot[] = [];

    for (let step = 0; step <= 6; step += 1) {
      path.push([floor[0], (step / 6) * reach * 4 * up, floor[2]]);
    }
    kit.ribbon(path, reach * 1.8 * decay(rise), light, decay(rise) * 0.45, share * 10);
    kit.ribbon(path, reach * 0.7 * decay(rise), '#ffffff', decay(rise) * 0.8, share * 14);
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.2),
      reach,
      many(8, weight),
      seed,
      rise,
      mix(colour, '#5b4636', 0.4),
      late(rise, 0.6),
    );
    sparks(
      kit,
      aside(kit, floor, 0, reach),
      reach * 1.5,
      many(6, weight),
      seed,
      rise,
      light,
      decay(rise),
    );
  },

  // A wall of hot wind blowing across it from the caster's side, the air wavering and embers carried on it
  Scorch(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffb04a', 0.5);
    const dx = at[0] - stage.source[0];
    const dz = at[2] - stage.source[2];
    const length = Math.max(1e-3, Math.hypot(dx, dz));
    const ux = dx / length;
    const uz = dz / length;

    kit.pool(floorOf(at), reach * 2.2, colour, swell(share) * 0.5);
    kit.glow(at, reach * 1.2, colour, swell(share) * 0.3, 0.2);
    for (let band = 0; band < 5; band += 1) {
      const held = (share * 1.4 + band * 0.2) % 1;
      const travel = (held - 0.5) * reach * 4;
      const height = at[1] + (band - 2) * reach * 0.45;
      const path: Spot[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const along = (step / 8 - 0.5) * reach * 2.4;
        // Wavering, the way air over a fire does
        const wobble = Math.sin(step * 0.75 + share * 20 + band) * reach * 0.15;

        path.push([
          at[0] + ux * (travel + wobble) - uz * along,
          Math.max(0.05, height),
          at[2] + uz * (travel + wobble) + ux * along,
        ]);
      }
      kit.ribbon(path, reach * 0.18, hot, swell(held) * 0.7, share * 10, { add: 0.8 });
    }
    for (let ember = 0; ember < many(12, weight); ember += 1) {
      const held = (share * 1.2 + noise(seed, ember)) % 1;
      const travel = (held - 0.5) * reach * 4.4;
      const off = spread(seed, ember + 10) * reach * 1.2;

      kit.glow(
        [
          at[0] + ux * travel - uz * off,
          Math.max(0.05, at[1] + spread(seed, ember + 20) * reach * 0.8 + held * reach * 0.5),
          at[2] + uz * travel + ux * off,
        ],
        reach * 0.07,
        '#ffd84a',
        swell(held),
        0.9,
      );
    }
  },

  // Dark rings pulsing out of the caster and washing over it, each edged in a thin light
  Pulse(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const dark = mix(paint.color, '#120818', 0.6);
    const rim = mix(lighten(paint.color, 0.3), '#b48cff', 0.4);

    kit.glow(stage.source, reach * 0.8, dark, swell(share) * 0.5, 0, { add: 0 });
    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.2 + pulse * 0.33) % 1;
      // Travelling rather than growing to the whole gap, which filled the screen on a wide field
      const centre = toward(stage.source, at, held);
      const radius = reach * (0.5 + held * 1.1);

      kit.ring(centre, radius, 0.3, dark, decay(held) * 0.8, { add: 0 });
      kit.ring(centre, radius, 0.05, rim, decay(held));
    }
    kit.glow(at, reach * (0.6 + swell(share) * 0.5), dark, swell(share) * 0.7, 0, { add: 0 });
    kit.ring(at, reach * (0.6 + share), 0.08, rim, swell(share));
  },

  // Frozen solid in a block of ice that cracks and breaks away
  Freeze(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const ice = lighten(paint.color, 0.45);
    const grown = Math.min(1, share / FREEZE_SET);
    const broken = Math.max(0, (share - FREEZE_CRACK) / (1 - FREEZE_CRACK));

    kit.pool(floor, reach * (1.4 + grown), '#e6f7ff', decay(broken) * 0.4, { add: 0.5 });
    kit.ripple(floor, reach * (0.8 + grown * 1.2), 0.15, ice, decay(broken) * 0.8);
    if (broken > 0) {
      for (let piece = 0; piece < many(14, weight); piece += 1) {
        kit.shard(
          thrown(aside(kit, floor, 0, reach * 1.1), seed, piece, broken, reach * 2, reach * 1.2),
          reach * 0.22 * (0.7 + noise(seed, piece + 60) * 0.6),
          noise(seed, piece) * TAU + broken * 5,
          ice,
          late(broken, 0.5),
          { add: 0.3 },
        );
      }
      kit.star(at, reach * (1 + broken * 2), 0, '#ffffff', decay(broken));
      return;
    }
    iceBlock(kit, floor, reach, grown, ice);
    if (share > FREEZE_SET) {
      bolt(
        kit,
        aside(kit, at, -reach * 0.7, reach * 0.6, -reach * 1.05),
        aside(kit, at, reach * 0.6, -reach * 0.5, -reach * 1.05),
        seed,
        reach * 0.4,
        reach * 0.04,
        '#ffffff',
        (share - FREEZE_SET) / (FREEZE_CRACK - FREEZE_SET),
      );
    }
  },
  // A ball made of whatever the sky is doing, dropping onto it and going off as that
  Weather(kit, stage, share, { paint, seed, weight, weather }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const type = WEATHER_BALL_TYPES.get(weather ?? Weathers.None);
    const colour = type == null ? paint.color : TYPE_COLORS[type];
    const light = lighten(colour, 0.5);

    if (share < WEATHER_FALL) {
      const sky = aside(kit, at, 0, reach * 6);
      const fall = (share / WEATHER_FALL) ** 2;
      const spot = toward(sky, at, fall);

      kit.pool(floor, reach * fall, colour, fall * 0.4);
      kit.trail(toward(sky, at, Math.max(0, fall - 0.2)), spot, reach * 0.3, colour, 0.5);
      kit.glow(spot, reach * 0.6, colour, 0.9, 0.7);
      return;
    }
    const pop = (share - WEATHER_FALL) / (1 - WEATHER_FALL);

    kit.pool(floor, reach * (1.4 + pop * 1.2), colour, decay(pop) * 0.6);
    kit.glow(at, reach * (0.6 + pop * 0.9), light, decay(Math.min(1, pop * 1.6)), 0.9);
    kit.ring(at, reach * (0.5 + pop * 1.8), 0.08, light, decay(pop));
    if (type === Types.Water) {
      kit.ripple(floor, reach * (0.5 + pop * 2), 0.1, light, decay(pop) * 0.9);
      for (let drop = 0; drop < many(12, weight); drop += 1) {
        kit.trail(
          thrown(at, seed, drop, Math.max(0, pop - 0.07), reach * 1.8, reach * 1.1),
          thrown(at, seed, drop, pop, reach * 1.8, reach * 1.1),
          reach * 0.06,
          light,
          late(pop, 0.6),
        );
      }
      return;
    }
    if (type === Types.Rock) {
      debris(
        kit,
        at,
        reach,
        many(8, weight),
        seed,
        pop,
        mix(colour, '#6b5440', 0.4),
        late(pop, 0.6),
      );
      return;
    }
    if (type != null) {
      imbue(kit, at, reach, pop, seed, type, colour, many(8, weight));
      return;
    }
    sparks(kit, at, reach, 6, seed, pop, light, decay(pop));
  },

  // Three orbs of fire, ice and lightning turning in on it, then each going off as its own element
  Tri(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const meet = Math.min(1, share / TRI_MEET);
    const corners: Spot[] = [];

    for (let corner = 0; corner < 3; corner += 1) {
      const angle = share * TAU + (corner / 3) * TAU + Math.PI / 2;
      const round = reach * 1.6 * (1 - meet * 0.6);

      corners.push(aside(kit, at, Math.cos(angle) * round, Math.sin(angle) * round));
    }
    if (share < TRI_MEET) {
      kit.ribbon([...corners, corners[0]], reach * 0.06, '#ffffff', meet * 0.6);
    }
    for (const [corner, type] of TRI_TYPES.entries()) {
      const colour = TYPE_COLORS[type];

      if (share < TRI_MEET) {
        kit.glow(corners[corner], reach * 0.35, colour, 0.95, 0.7);
        continue;
      }
      const pop = (share - TRI_MEET) / (1 - TRI_MEET);

      kit.glow(corners[corner], reach * (0.35 + pop * 0.5), colour, decay(pop), 0.8);
      imbue(kit, corners[corner], reach * 0.9, pop, seed + corner, type, colour, many(6, weight));
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default elements;
