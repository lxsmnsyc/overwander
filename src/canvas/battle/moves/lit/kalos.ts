import { Types } from '../../../../data/constants/types';
import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import {
  ARROWS_LAND,
  ASCENT_LANDS,
  ASCENT_RISES,
  DIAMONDS_BREAK,
  GEO_TONES,
  LUNAR_FALLS,
  MAGMA,
  OBLIVION_FIRE,
  ORIGIN_FIRE,
  ORIGIN_HIT,
  PORTAL_OPEN,
  PRECIPICE_SPLIT,
  RUIN_FIRE,
  STEAM_BURST,
  SWELL_BREAKS,
} from '../effect/kalos';
import { showing } from '../effect/stats';
import { TAU, arcing, debris, gathering, jet, sickle, smoke, sparks } from './pieces';
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

/** A ring standing open in the air: a dark middle and a bright rim */
function portal(kit: EffectBatch, at: Spot, radius: number, colour: string, alpha: number): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  kit.puff(at, radius * 0.9, '#140a24', alpha * 0.85);
  kit.ring(at, radius, 0.18, lighten(colour, 0.4), alpha);
}

/** Points from one spot to another, bowed across and up in the middle, drawn as far as `drawn` */
function bowed(
  kit: EffectBatch,
  from: Spot,
  to: Spot,
  right: number,
  up: number,
  drawn: number,
): Spot[] {
  const path: Spot[] = [];

  for (let step = 0; step <= 8; step += 1) {
    const along = (step / 8) * drawn;
    const bend = Math.sin(Math.PI * along);

    path.push(aside(kit, toward(from, to, along), right * bend, up * bend));
  }
  return path;
}

const kalos = {
  // Sparkles flung out of a soft glow, each one twinkling as it goes
  Sparkle(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.6);
    const count = many(7, weight);

    kit.glow(at, reach * (0.5 + swell(share) * 0.6), paint.color, decay(share) * 0.8, 0.8);
    for (let glint = 0; glint < count; glint += 1) {
      const angle = (glint / count) * TAU + spread(seed, glint) * 0.5;
      const out = reach * (0.4 + share * (1.4 + noise(seed, glint) * 0.8));
      const blink = swell((share * 2 + noise(seed, glint + 9)) % 1);

      kit.star(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
        reach * 0.4 * blink,
        share * 1.5,
        light,
        decay(share),
      );
    }
  },

  // Columns of light in every colour rising out of the ground round it, and a halo over it
  Geo(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const shown = showing(share, 4, 0.7);
    const rise = Math.min(1, share * 2.5);
    const columns = many(8, weight);

    for (const [tone, colour] of GEO_TONES.entries()) {
      kit.pool(floor, reach * (1.2 + tone * 0.5) * rise, colour, shown * 0.3);
      kit.ripple(floor, reach * (0.8 + tone * 0.45 + swell(share) * 1.2), 0.1, colour, shown * 0.6);
    }
    for (let column = 0; column < columns; column += 1) {
      const angle = (column / columns) * TAU + share * 1.5;

      jet(
        kit,
        aside(kit, floor, Math.cos(angle) * reach * 1.8, 0, Math.sin(angle) * reach * 1.2),
        reach * (3 + noise(seed, column) * 2.5) * rise,
        reach * 0.16,
        GEO_TONES[column % GEO_TONES.length],
        '#ffffff',
        shown * 0.8,
        share * 8,
      );
    }
    for (let mote = 0; mote < many(18, weight); mote += 1) {
      const held = (share * 1.6 + noise(seed, mote)) % 1;

      kit.star(
        aside(
          kit,
          floor,
          spread(seed, mote + 3) * reach * 2,
          held * reach * 5,
          spread(seed, mote + 9),
        ),
        reach * 0.26 * swell(held),
        held * 2,
        GEO_TONES[mote % GEO_TONES.length],
        shown,
      );
    }
    kit.ripple(aside(kit, at, 0, reach * 1.4), reach * 0.9, 0.12, '#fff4fa', shown * 0.8);
    kit.glow(at, reach * (0.9 + swell(share) * 0.8), '#fff4fa', shown * 0.55, 0.6);
    kit.star(at, reach * 2.2 * swell(share), share * 2, '#ffffff', shown * 0.5);
  },

  // The whole floor lighting up from the pokemon outward, and the terrain's own stuff rising off it
  Terrain(kit, stage, share, { paint, seed, type }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const shown = showing(share, 4, 0.65);
    const light = lighten(paint.color, 0.45);
    const floor = floorOf(at);

    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, share * 1.4 - wave * 0.18));

      kit.ripple(floor, reach * (1 + held * 7), 0.1, paint.color, decay(held) * shown * 0.7);
    }
    kit.pool(floor, reach * 6 * swell(Math.min(1, share * 1.5)), paint.color, shown * 0.35);
    for (let rising = 0; rising < 18; rising += 1) {
      const rise = (share * 1.3 + noise(seed, rising)) % 1;
      const spot = aside(
        kit,
        floor,
        spread(seed, rising + 30) * reach * 7,
        rise * reach * 2.2,
        spread(seed, rising + 60) * reach * 3,
      );
      const alpha = swell(rise) * shown;

      if (type === Types.Grass) {
        kit.leaf(spot, reach * 0.3, rise * 4 + rising, light, alpha);
      } else if (type === Types.Electric) {
        kit.streak(
          spot,
          reach * 0.3,
          reach * 0.06,
          Math.PI / 2 + spread(seed, rising + 90),
          light,
          alpha,
        );
      } else if (type === Types.Psychic) {
        kit.ripple(spot, reach * 0.4 * (0.5 + rise), 0.15, light, alpha);
      } else {
        kit.puff(spot, reach * 0.35 * (0.6 + rise), light, alpha * 0.5);
      }
    }
  },

  // A volley of arrows loosed skyward off the caster, then raining down all round it and sticking in the ground
  Arrows(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const home = floorOf(stage.source);
    const reach = reachOf(stage, weight);
    const count = many(16, weight);
    const light = lighten(paint.color, 0.35);

    if (share < ARROWS_LAND) {
      const rise = share / ARROWS_LAND;

      kit.pool(home, reach * 1.8, paint.color, decay(rise) * 0.5);
      kit.ripple(home, reach * (0.8 + rise * 1.6), 0.12, paint.color, decay(rise) * 0.7);
      for (let shaft = 0; shaft < count; shaft += 1) {
        const lift = Math.min(1, rise * (1.2 + noise(seed, shaft) * 0.6));
        const tip = aside(
          kit,
          home,
          spread(seed, shaft) * reach * 1.8,
          reach * (0.5 + lift * 8),
          spread(seed, shaft + 40) * reach,
        );

        kit.trail(aside(kit, tip, 0, -reach * 1.4), tip, reach * 0.08, light, 1);
        kit.glow(tip, reach * 0.16, light, 0.8);
      }
      return;
    }
    const rain = (share - ARROWS_LAND) / (1 - ARROWS_LAND);

    kit.pool(floor, reach * 3.2, paint.color, swell(rain) * 0.45);
    for (let shaft = 0; shaft < count; shaft += 1) {
      const lands = 0.15 + noise(seed, shaft + 20) * 0.4;
      const fall = (rain - lands + 0.15) / 0.15;
      const spot = aside(
        kit,
        floor,
        spread(seed, shaft + 60) * reach * 2.8,
        0,
        spread(seed, shaft + 80) * reach * 1.6,
      );

      if (fall <= 0) {
        continue;
      }
      if (fall < 1) {
        const tip = aside(kit, spot, 0, reach * 7 * (1 - fall));

        kit.trail(aside(kit, tip, 0, reach * 1.4), tip, reach * 0.08, light, 1);
        continue;
      }
      const after = (rain - lands) / (1 - lands);

      // The arrow stays standing where it struck
      kit.streak(
        aside(kit, spot, 0, reach * 0.35),
        reach * 0.35,
        reach * 0.07,
        Math.PI / 2,
        paint.color,
        late(after, 0.6),
        { add: 0 },
      );
      if (after < 0.3) {
        kit.ripple(spot, reach * (0.2 + after * 2), 0.2, light, decay(after / 0.3) * 0.8);
      }
    }
    const hit = Math.max(0, (rain - 0.5) / 0.5);

    if (hit > 0) {
      debris(
        kit,
        aside(kit, floor, 0, reach * 0.3),
        reach,
        many(10, weight),
        seed,
        hit,
        paint.color,
        decay(hit),
      );
      kit.ripple(floor, reach * (1 + hit * 2.6), 0.12, paint.color, decay(hit) * 0.8);
      sparks(kit, at, reach * 1.8, 10, seed, hit, light, decay(hit));
    }
  },

  // A wall of earth rolling in from the caster's side, breaking over it and leaving a ring of rock round it
  Groundswell(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const dark = mix(paint.color, '#3a2a1a', 0.35);
    const dust = mix(paint.color, '#d8c8a8', 0.5);

    if (share < SWELL_BREAKS) {
      const rolled = share / SWELL_BREAKS;
      const front = toward(floorOf(stage.source), floor, rolled);
      const crest = Math.min(1, rolled * 1.6);
      const columns = many(14, weight);

      kit.ripple(front, reach * 2.6, 0.1, paint.color, 0.5);
      for (let column = 0; column < columns; column += 1) {
        const across = column / (columns - 1) - 0.5;
        const height =
          reach * 2.6 * crest * (1 - Math.abs(across) * 0.8) * (0.7 + noise(seed, column) * 0.5);

        for (let layer = 0; layer < 3; layer += 1) {
          kit.shard(
            aside(kit, front, across * reach * 5, height * (layer / 2.5), -layer * reach * 0.3),
            reach * (0.6 - layer * 0.1),
            column + layer + share * 4,
            layer === 2 ? paint.color : dark,
            1,
          );
        }
      }
      smoke(kit, front, reach * 2.4, 6, seed, rolled, dust, 0.6);
      return;
    }
    const hit = (share - SWELL_BREAKS) / (1 - SWELL_BREAKS);
    const kept = late(hit, 0.5);
    const rocks = many(12, weight);

    kit.pool(floor, reach * (1.6 + hit * 1.6), '#1a0f08', kept * 0.5, { add: 0 });
    for (let rock = 0; rock < rocks; rock += 1) {
      const angle = (rock / rocks) * TAU + noise(seed, rock) * 0.3;

      kit.shard(
        aside(
          kit,
          floor,
          Math.cos(angle) * reach * 1.9,
          reach * (0.3 + noise(seed, rock + 10) * 0.4) * Math.min(1, hit * 4),
          Math.sin(angle) * reach * 1.3,
        ),
        reach * (0.5 + noise(seed, rock + 20) * 0.3),
        angle,
        dark,
        kept,
      );
    }
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(hit, 1.5, wave * 0.3);

      if (held > 0) {
        kit.ripple(floor, reach * (1 + held * 2.6), 0.12, paint.color, decay(held) * 0.7);
      }
    }
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.4),
      reach * 1.4,
      many(12, weight),
      seed,
      hit,
      dark,
      late(hit, 0.6),
    );
    smoke(kit, floor, reach * 3, 8, seed, hit, dust, decay(hit) * 0.7);
  },

  // The ground splitting over magma, then a crown of stone blades driven up round it and embers pouring off
  Precipice(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const split = Math.min(1, share / PRECIPICE_SPLIT);
    const kept = late(share, 0.6);
    const hot = mix(MAGMA, '#ffd84a', 0.5);

    kit.pool(floor, reach * (1 + split * 2.2), '#140a05', kept * 0.6, { add: 0 });
    kit.pool(floor, reach * (0.8 + split * 1.8), MAGMA, kept * split * 0.7);
    kit.ripple(floor, reach * (0.6 + split * 2.6), 0.12, MAGMA, kept * 0.8);
    if (share < PRECIPICE_SPLIT) {
      sparks(kit, floor, reach * 1.6, 8, seed, split, hot, split);
      return;
    }
    const rise = (share - PRECIPICE_SPLIT) / (1 - PRECIPICE_SPLIT);
    const grow = Math.min(1, rise * 5);
    const blades = many(11, weight);

    kit.glow(aside(kit, floor, 0, reach * 1.2), reach * 2.8 * grow, MAGMA, kept * 0.45, 0.3);
    for (let blade = 0; blade < blades; blade += 1) {
      const angle = (blade / blades) * TAU + noise(seed, blade) * 0.5;
      const round = reach * (0.9 + noise(seed, blade + 30) * 1.3);
      const base = aside(kit, floor, Math.cos(angle) * round, 0, Math.sin(angle) * round * 0.7);
      const tall =
        reach *
        (2 + noise(seed, blade + 10) * 2.4) *
        Math.min(1, grow * (1 + noise(seed, blade + 40)));

      if (tall <= 0) {
        continue;
      }
      const top = aside(
        kit,
        base,
        spread(seed, blade + 20) * reach * 0.5 + Math.cos(angle) * reach * 0.4,
        tall,
      );
      const turn = kit.angleOn(base, top);

      kit.streak(toward(base, top, 0.5), tall * 0.55, reach * 0.42, turn, paint.color, kept, {
        add: 0,
      });
      kit.streak(toward(base, top, 0.35), tall * 0.4, reach * 0.12, turn, hot, kept * 0.9);
      kit.glow(base, reach * 0.5, MAGMA, kept * grow * 0.8, 0.6);
    }
    for (let one = 0; one < 3; one += 1) {
      jet(
        kit,
        aside(kit, floor, spread(seed, one + 50) * reach * 1.4),
        reach * (2 + noise(seed, one + 55) * 2) * grow,
        reach * 0.18,
        MAGMA,
        hot,
        late(rise, 0.5),
        share * 12,
      );
    }
    for (let ember = 0; ember < many(12, weight); ember += 1) {
      const held = (share * 1.4 + noise(seed, ember + 70)) % 1;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, ember + 80) * reach * 2.6,
          held * reach * 5,
          spread(seed, ember + 90) * reach,
        ),
        reach * 0.07,
        hot,
        swell(held) * kept,
        0.8,
      );
    }
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 1.2,
      many(10, weight),
      seed,
      rise,
      mix(paint.color, '#5b4636', 0.5),
      late(rise, 0.7),
    );
  },

  // Soaring up off the caster in green light, then diving down on it as a comet and a pillar of light
  Ascent(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.6);

    if (share < ASCENT_RISES) {
      const up = share / ASCENT_RISES;
      const head = aside(kit, stage.source, 0, reach * 8 * up * up);

      kit.pool(floorOf(stage.source), reach * 1.8, paint.color, decay(up) * 0.5);
      kit.glow(stage.source, reach * 1.2, paint.color, decay(up) * 0.7, 0.4);
      kit.trail(stage.source, head, reach * 0.5, paint.color, 0.6);
      kit.trail(stage.source, head, reach * 0.18, light, 1);
      return;
    }
    if (share < ASCENT_LANDS) {
      const fall = (share - ASCENT_RISES) / (ASCENT_LANDS - ASCENT_RISES);
      const place = (along: number): Spot =>
        aside(kit, at, -reach * 3 * (1 - along), reach * 9 * (1 - along) ** 1.5);
      const path: Spot[] = [];

      for (let step = 0; step <= 6; step += 1) {
        path.push(place(Math.max(0, fall - 0.35 + (step / 6) * 0.35)));
      }
      kit.pool(floor, reach * (0.6 + fall * 1.6), paint.color, fall * 0.5);
      kit.ribbon(path, reach * 1.1, paint.color, 0.55, share * 10);
      kit.ribbon(path, reach * 0.4, light, 1, share * 14);
      kit.glow(place(fall), reach * (0.8 + fall * 0.6), light, 1, 0.8);
      sparks(kit, place(fall), reach * 1.4, 8, seed, fall, light, 0.8);
      return;
    }
    const hit = (share - ASCENT_LANDS) / (1 - ASCENT_LANDS);

    jet(
      kit,
      floor,
      reach * 7,
      reach * 0.9 * decay(hit),
      paint.color,
      light,
      decay(hit),
      share * 12,
    );
    kit.pool(floor, reach * (2 + hit * 2.4), paint.color, decay(hit) * 0.7, { add: 0.4 });
    kit.glow(at, reach * (1 + hit * 1.8), light, decay(Math.min(1, hit * 1.5)));
    kit.star(at, reach * (1.4 + hit * 2), 0, '#ffffff', decay(Math.min(1, hit * 3)));
    kit.ring(at, reach * (0.6 + hit * 3.2), 0.1, light, decay(hit) * 0.8);
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(hit, 1.5, wave * 0.3);

      if (held > 0) {
        kit.ripple(floor, reach * (0.8 + held * 3), 0.12, paint.color, decay(held) * 0.8);
      }
    }
    sparks(kit, at, reach * (2 + hit * 2), 14, seed, hit, paint.color, decay(hit));
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.2),
      reach * 1.3,
      many(10, weight),
      seed,
      hit,
      mix(paint.color, '#5b4636', 0.6),
      late(hit, 0.6),
    );
  },

  // A ring of holes opening round it, a fist out of each in turn, and one last blow out of all of them
  Fury(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const count = many(7, weight);
    const open = Math.min(1, share / PORTAL_OPEN);
    const closing = decay(Math.max(0, share - 0.82) / 0.18);
    const light = lighten(paint.color, 0.5);

    kit.pool(floor, reach * 3 * open, '#140a24', closing * 0.5, { add: 0 });
    for (let hole = 0; hole < count; hole += 1) {
      const angle = (hole / count) * TAU + noise(seed, hole) * 0.4;
      const spot = aside(
        kit,
        at,
        Math.cos(angle) * reach * 2.4,
        Math.sin(angle) * reach * 1.8 + reach * 0.4,
        Math.sin(angle * 2) * reach * 0.4,
      );
      const start = PORTAL_OPEN + (hole / count) * 0.42;
      const blow = (share - start) / 0.1;
      const impact = (share - start - 0.1) / 0.12;

      portal(kit, spot, reach * 0.7 * open * closing, paint.color, closing);
      if (blow > 0 && blow < 1) {
        const fist = toward(spot, at, blow);

        kit.trail(spot, fist, reach * 0.4, paint.color, 0.8);
        kit.glow(fist, reach * 0.45, light, 1, 0.6);
      }
      if (impact >= 0 && impact < 1) {
        kit.star(
          aside(
            kit,
            at,
            spread(seed, hole + 10) * reach * 0.4,
            spread(seed, hole + 20) * reach * 0.4,
          ),
          reach * (0.8 + impact * 1.2),
          hole,
          '#ffffff',
          decay(impact),
        );
        kit.ring(at, reach * (0.4 + impact * 1.4), 0.1, light, decay(impact));
        sparks(kit, at, reach * 1.4, 8, seed + hole, impact, light, decay(impact));
      }
    }
    const last = (share - 0.82) / 0.18;

    if (last > 0) {
      kit.glow(at, reach * (1 + last * 1.6), light, decay(last));
      kit.ring(at, reach * (0.8 + last * 3), 0.1, paint.color, decay(last));
      kit.ripple(floor, reach * (1 + last * 3), 0.12, paint.color, decay(last) * 0.8);
      debris(
        kit,
        aside(kit, floor, 0, reach * 0.3),
        reach * 1.2,
        many(8, weight),
        seed,
        last,
        paint.color,
        decay(last),
      );
    }
  },

  // A great ring opening beside it and swallowing light, a blast out of it, and the ring snapping shut
  Portal(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const spot = aside(kit, at, -reach * 2.2, reach * 1.6, reach * 0.5);
    const open = Math.min(1, share / PORTAL_OPEN);
    const closing = decay(Math.max(0, share - 0.72) / 0.28);
    const radius = reach * 1.3 * open * closing;
    const light = lighten(paint.color, 0.5);

    kit.glow(spot, radius * 1.6, paint.color, closing * 0.4, 0.2);
    portal(kit, spot, radius, paint.color, closing);
    for (let glint = 0; glint < 10; glint += 1) {
      const angle = (glint / 10) * TAU + share * 9;

      kit.star(
        aside(kit, spot, Math.cos(angle) * radius, Math.sin(angle) * radius),
        reach * 0.2,
        angle,
        light,
        closing * open,
      );
    }
    for (let mote = 0; mote < many(10, weight); mote += 1) {
      const held = (share * 2 + noise(seed, mote)) % 1;
      const angle = noise(seed, mote + 10) * TAU + held * 4;
      const out = radius * 1.8 * (1 - held);

      kit.glow(
        aside(kit, spot, Math.cos(angle) * out, Math.sin(angle) * out),
        reach * 0.08,
        light,
        swell(held) * closing,
        0.8,
      );
    }
    if (share > 0.9) {
      const snap = (share - 0.9) / 0.1;

      kit.star(spot, reach * 1.4 * swell(snap), 0, light, swell(snap));
    }
    if (share < PORTAL_OPEN) {
      return;
    }
    const strike = Math.min(1, (share - PORTAL_OPEN) / 0.12);
    const kept = late((share - PORTAL_OPEN) / (1 - PORTAL_OPEN), 0.4);
    const path = [spot, toward(spot, at, strike * 0.5), toward(spot, at, strike)];

    kit.ribbon(path, reach * kept, paint.color, 0.7 * kept, share * 10);
    kit.ribbon(path, reach * 0.35 * kept, light, kept, share * 14);
    if (strike < 1) {
      return;
    }
    const hit = (share - PORTAL_OPEN - 0.12) / (1 - PORTAL_OPEN - 0.12);

    kit.glow(at, reach * (0.9 + hit * 1.4), light, decay(hit));
    kit.star(at, reach * (1.4 + hit * 2), hit, '#ffffff', decay(Math.min(1, hit * 2.5)));
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(hit, 1.5, wave * 0.3);

      if (held > 0) {
        kit.ring(at, reach * (0.6 + held * 2.6), 0.1, light, decay(held));
      }
    }
    sparks(kit, at, reach * (1.4 + hit * 1.4), 12, seed, hit, light, decay(hit));
  },

  // A dust cloud tumbling over it, stars and hearts popping out of the scuffle
  Scuffle(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = showing(share, 5, 0.7);

    for (let puff = 0; puff < 7; puff += 1) {
      const turn = share * 5 + (puff / 7) * TAU;

      kit.puff(
        aside(kit, at, Math.cos(turn) * reach * 0.9, Math.sin(turn) * reach * 0.6),
        reach * (0.6 + noise(seed, puff) * 0.4),
        '#f2e6ee',
        shown * 0.55,
      );
    }
    for (let pop = 0; pop < many(6, weight); pop += 1) {
      const held = (share * 2.2 + noise(seed, pop + 7)) % 1;
      const angle = spread(seed, pop) * Math.PI;
      const spot = aside(
        kit,
        at,
        Math.cos(angle) * reach * (0.8 + held * 1.2),
        reach * 0.4 + held * reach * 1.4,
      );

      if (pop % 2 === 0) {
        kit.star(spot, reach * 0.3, held * 3, paint.color, decay(held) * shown);
      } else {
        kit.heart(spot, reach * 0.24, 0, paint.color, decay(held) * shown);
      }
    }
  },

  // A whirlwind of diamonds climbing round it, glinting, then the whole storm flying apart
  Diamonds(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const shown = showing(share, 4, DIAMONDS_BREAK);
    const count = many(18, weight);
    const broken = Math.max(0, (share - DIAMONDS_BREAK) / (1 - DIAMONDS_BREAK));

    kit.pool(floor, reach * 2.6, paint.color, Math.min(1, share * 4) * decay(broken) * 0.5);
    for (let band = 0; band < 3; band += 1) {
      const held = (share * 1.2 + band / 3) % 1;

      kit.ripple(
        aside(kit, floor, 0, held * reach * 4.5),
        reach * (0.8 + held * 1.4),
        0.08,
        lighten(paint.color, 0.4),
        swell(held) * shown * 0.6,
      );
    }
    for (let stone = 0; stone < count; stone += 1) {
      const glint = swell((share * 3 + noise(seed, stone + 5)) % 1);
      let spot: Spot;
      let alpha = shown;

      if (broken > 0) {
        spot = thrown(
          aside(kit, floor, 0, reach * 1.5),
          seed,
          stone,
          broken,
          reach * 3.4,
          reach * 2,
        );
        alpha = decay(broken);
      } else {
        const climb = (share * 1.4 + noise(seed, stone)) % 1;
        const angle = share * 9 + (stone / count) * TAU;
        const out = reach * (0.7 + climb * 1.4);

        spot = aside(
          kit,
          floor,
          Math.cos(angle) * out,
          climb * reach * 4.5,
          Math.sin(angle) * out * 0.7,
        );
      }
      kit.shard(spot, reach * 0.36, stone + share * 8, paint.color, alpha, { add: 0.4 });
      kit.star(spot, reach * 0.4 * glint, 0, '#ffffff', alpha * glint);
    }
    if (broken > 0) {
      kit.star(at, reach * 3 * decay(broken), broken, '#ffffff', decay(broken));
      sparks(kit, at, reach * 2.4, 14, seed, broken, lighten(paint.color, 0.5), decay(broken));
    }
  },

  // Crimson wings spread over the caster, a twisting beam out of them, and the life it took streaming back
  Oblivion(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const dark = mix(paint.color, '#1a0610', 0.55);
    const pale = lighten(paint.color, 0.55);
    const open = Math.min(1, share / OBLIVION_FIRE);
    const wings = late(share, 0.55);

    for (const side of [-1, 1]) {
      const from = Math.PI / 2 - side * 0.2;
      const to = from - side * 1.5 * open;

      sickle(kit, stage.source, reach * 1.7, from, to, reach * 0.6, dark, wings, 0);
      sickle(kit, stage.source, reach * 1.7, from, to, reach * 0.22, paint.color, wings);
    }
    kit.glow(stage.source, reach * (0.6 + open * 0.6), paint.color, wings * 0.6, 0.4);
    if (share > OBLIVION_FIRE && share < 0.65) {
      const drawn = Math.min(1, (share - OBLIVION_FIRE) / 0.12);
      const kept = share < 0.5 ? 1 : decay((share - 0.5) / 0.15);
      const core: Spot[] = [];
      const twists: [Spot[], Spot[]] = [[], []];

      for (let step = 0; step <= 12; step += 1) {
        const along = (step / 12) * drawn;
        const base = toward(stage.source, at, along);
        const turn = along * TAU * 2 - share * 20;
        const round = reach * 0.4 * Math.sin(Math.PI * along);

        core.push(base);
        twists[0].push(aside(kit, base, 0, Math.sin(turn) * round, Math.cos(turn) * round));
        twists[1].push(aside(kit, base, 0, -Math.sin(turn) * round, -Math.cos(turn) * round));
      }
      kit.ribbon(core, reach * 1.1, dark, kept * 0.8, 0, { add: 0 });
      kit.ribbon(core, reach * 0.5, paint.color, kept, share * 10);
      kit.ribbon(core, reach * 0.16, pale, kept, share * 14);
      for (const twist of twists) {
        kit.ribbon(twist, reach * 0.12, paint.color, kept * 0.8);
      }
    }
    if (share < 0.3) {
      return;
    }
    const taken = (share - 0.3) / 0.7;

    kit.glow(at, reach * 1.6, dark, late(taken, 0.5) * 0.7, 0, { add: 0 });
    for (let band = 0; band < 3; band += 1) {
      const held = (share * 2 + band / 3) % 1;

      kit.ring(at, reach * (2.2 - held * 1.8), 0.08, paint.color, swell(held) * late(taken, 0.6));
    }
    if (share < 0.45) {
      return;
    }
    const back = (share - 0.45) / 0.55;

    kit.glow(stage.source, reach * (0.8 + back * 0.6), paint.color, swell(back) * 0.6, 0.6);
    for (let mote = 0; mote < many(12, weight); mote += 1) {
      const held = Math.max(0, Math.min(1, back * 1.5 - noise(seed, mote) * 0.5));
      const lift = reach * (1 + noise(seed, mote + 10));

      if (held <= 0 || held >= 1) {
        continue;
      }
      kit.trail(
        arcing(at, stage.source, Math.max(0, held - 0.08), lift),
        arcing(at, stage.source, held, lift),
        reach * 0.1,
        pale,
        swell(held),
      );
    }
  },

  // Light gathered in a ring of petals on the caster, then a beam wide enough to swallow it, and a blast
  Ruin(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.7);

    if (share < RUIN_FIRE + 0.1) {
      const charge = Math.min(1, share / RUIN_FIRE);
      const kept = share < RUIN_FIRE ? 1 : decay((share - RUIN_FIRE) / 0.1);
      const round = reach * 1.1 * (1.4 - charge * 0.6);

      for (let petal = 0; petal < 5; petal += 1) {
        const angle = (petal / 5) * TAU + share * 6;

        kit.leaf(
          aside(kit, stage.source, Math.cos(angle) * round, Math.sin(angle) * round),
          reach * 0.5,
          angle,
          paint.color,
          kept * charge,
        );
      }
      kit.glow(stage.source, reach * (0.4 + charge * 1.2), light, kept * charge);
      gathering(kit, stage.source, reach * 2, 14, seed, share, light);
    }
    if (share < RUIN_FIRE) {
      return;
    }
    const fired = (share - RUIN_FIRE) / (1 - RUIN_FIRE);
    const drawn = Math.min(1, fired * 6);
    const thick = Math.min(1, fired * 4) * late(fired, 0.6);
    const path = [
      stage.source,
      toward(stage.source, at, drawn * 0.5),
      toward(stage.source, at, drawn),
    ];

    kit.ribbon(path, reach * 2.2 * thick, paint.color, 0.55, share * 8);
    kit.ribbon(path, reach * thick, light, 0.9, share * 12);
    kit.ribbon(path, reach * 0.35 * thick, '#ffffff', 1, share * 16);
    // What it costs the caster, flaring back at the mouth of the beam
    kit.glow(stage.source, reach * 1.4 * thick, light, thick * 0.7);
    if (drawn < 1) {
      return;
    }
    const blast = (fired - 1 / 6) / (5 / 6);

    jet(kit, floor, reach * 7, reach * 0.8 * thick, paint.color, light, thick, share * 12);
    kit.pool(floor, reach * (2 + blast * 2.4), paint.color, late(blast, 0.5) * 0.7, { add: 0.4 });
    kit.glow(at, reach * (1.2 + swell(blast) * 1.4), light, Math.max(thick, decay(blast)));
    kit.star(at, reach * (2 + blast * 2), share * 2, '#ffffff', decay(Math.min(1, blast * 2)));
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(blast, 1.6, wave * 0.25);

      if (held > 0) {
        kit.ring(at, reach * (0.8 + held * 3), 0.1, paint.color, decay(held));
      }
    }
    sparks(kit, at, reach * (2 + blast * 2), 16, seed, blast, light, decay(blast));
  },

  // The sea gathered on the caster, beams bowing out of it onto the target, and a flood where they land
  Origin(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.6);
    const foam = lighten(paint.color, 0.55);
    const count = many(8, weight);

    if (share < ORIGIN_HIT) {
      const charge = Math.min(1, share / ORIGIN_FIRE);
      const kept = charge * decay(Math.max(0, share - ORIGIN_FIRE) / (ORIGIN_HIT - ORIGIN_FIRE));

      kit.glow(stage.source, reach * (0.5 + charge * 0.9), paint.color, kept * 0.8, 0.5);
      kit.ring(stage.source, reach * (1.6 - charge * 0.8), 0.1, light, kept * 0.7);
      gathering(kit, stage.source, reach * 1.8, 12, seed, share, light);
    }
    const loosed = ORIGIN_FIRE * 0.8;

    if (share > loosed && share < ORIGIN_HIT + 0.15) {
      const drawn = Math.min(1, (share - loosed) / (ORIGIN_HIT - loosed));
      const kept = share < ORIGIN_HIT ? 1 : decay((share - ORIGIN_HIT) / 0.15);

      for (let ray = 0; ray < count; ray += 1) {
        const path = bowed(
          kit,
          stage.source,
          at,
          (ray / (count - 1 || 1) - 0.5) * reach * 4,
          reach * (1.5 + noise(seed, ray) * 2),
          Math.min(1, drawn + noise(seed, ray + 5) * 0.1),
        );

        kit.ribbon(path, reach * 0.4, paint.color, kept * 0.5, share * 6);
        kit.ribbon(path, reach * 0.14, light, kept, share * 8);
      }
    }
    if (share < ORIGIN_HIT) {
      return;
    }
    const hit = (share - ORIGIN_HIT) / (1 - ORIGIN_HIT);
    const spouts = many(6, weight);

    kit.pool(floor, reach * (2 + hit * 2.4), paint.color, decay(hit) * 0.7, { add: 0.4 });
    kit.glow(at, reach * (1 + hit * 1.6), light, decay(Math.min(1, hit * 1.4)), 0.6);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(hit, 1.5, wave * 0.25);

      if (held > 0) {
        kit.ripple(floor, reach * (0.8 + held * 3.4), 0.1, foam, decay(held) * 0.9);
      }
    }
    for (let spout = 0; spout < spouts; spout += 1) {
      const angle = (spout / spouts) * TAU + noise(seed, spout) * 0.4;

      jet(
        kit,
        [floor[0] + Math.cos(angle) * reach * 1.8, 0, floor[2] + Math.sin(angle) * reach * 1.8],
        reach * (2.4 + noise(seed, spout + 10) * 2) * Math.min(1, hit * 3),
        reach * 0.32,
        paint.color,
        foam,
        late(hit, 0.4),
        share * 12,
      );
    }
    for (let drop = 0; drop < many(14, weight); drop += 1) {
      const base = aside(kit, floor, 0, reach * 0.4);

      kit.trail(
        thrown(base, seed, drop, Math.max(0, hit - 0.07), reach * 2.6, reach * 2),
        thrown(base, seed, drop, hit, reach * 2.6, reach * 2),
        reach * 0.07,
        foam,
        late(hit, 0.5),
      );
    }
  },

  // A full moon glowing over it, then coming down on it and bursting
  Lunar(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.75);
    const fall = Math.max(0, (share - LUNAR_FALLS) / 0.15);

    if (fall < 1) {
      const rise = Math.min(1, share / 0.2);
      const moon = aside(kit, at, 0, reach * 2.8 * (1 - fall));

      kit.glow(moon, reach * 1.4 * rise, paint.color, 0.35 * rise, 0.4);
      kit.glow(moon, reach * 0.9 * rise, light, rise);
      return;
    }
    const hit = (share - LUNAR_FALLS - 0.15) / (1 - LUNAR_FALLS - 0.15);

    kit.glow(at, reach * (0.9 + hit * 1.2), light, decay(hit));
    kit.ring(at, reach * (0.8 + hit * 2.2), 0.12, paint.color, decay(hit));
    for (let glint = 0; glint < many(8, weight); glint += 1) {
      const angle = (glint / 8) * TAU + spread(seed, glint) * 0.3;
      const out = reach * (1 + hit * 2);

      kit.star(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
        reach * 0.3,
        hit * 2,
        light,
        decay(hit),
      );
    }
  },

  // The ground cracking hot under it, then a geyser of scalding water and billowing steam
  Steam(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const hot = mix(paint.color, '#ffffff', 0.5);
    const cloud = '#f4f8fc';
    const crack = Math.min(1, share / STEAM_BURST);
    const kept = late(share, 0.6);

    kit.pool(floor, reach * (0.8 + crack * 1.6), hot, kept * 0.6);
    kit.ripple(floor, reach * (0.6 + crack * 1.8), 0.12, paint.color, kept * 0.7);
    if (share < STEAM_BURST) {
      smoke(kit, floor, reach, 4, seed, crack, cloud, crack * 0.6);
      return;
    }
    const erupt = (share - STEAM_BURST) / (1 - STEAM_BURST);
    const tall = reach * 7 * Math.min(1, erupt * 3);

    jet(kit, floor, tall, reach * 0.9 * kept, paint.color, hot, kept, share * 14);
    kit.glow(aside(kit, floor, 0, reach), reach * 2 * kept, hot, kept * 0.5, 0.4);
    for (let puff = 0; puff < many(18, weight); puff += 1) {
      const rise = (share * 1.4 + noise(seed, puff)) % 1;

      kit.puff(
        aside(
          kit,
          floor,
          spread(seed, puff + 4) * reach * (0.4 + rise * 2.4),
          rise * tall,
          spread(seed, puff + 8) * reach,
        ),
        reach * (0.6 + rise * 1.2),
        cloud,
        swell(rise) * kept * 0.8,
      );
    }
    for (let puff = 0; puff < 6; puff += 1) {
      const angle = (puff / 6) * TAU + noise(seed, puff + 20);

      kit.puff(
        aside(
          kit,
          floor,
          Math.cos(angle) * reach * (1 + erupt * 2),
          reach * 0.3,
          Math.sin(angle) * reach * (1 + erupt * 2) * 0.7,
        ),
        reach * (0.7 + erupt * 0.6),
        cloud,
        decay(erupt) * 0.7,
      );
    }
    for (let drop = 0; drop < many(12, weight); drop += 1) {
      const base = aside(kit, floor, 0, reach * 2);

      kit.trail(
        thrown(base, seed, drop, Math.max(0, erupt - 0.07), reach * 2.8, reach * 2.4),
        thrown(base, seed, drop, erupt, reach * 2.8, reach * 2.4),
        reach * 0.07,
        hot,
        late(erupt, 0.5),
      );
    }
  },

  // Spinning stars of water flying in one after another, each splashing where it lands
  Shuriken(kit, stage, share, { paint, seed, hits }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const light = lighten(paint.color, 0.5);
    const count = Math.max(2, hits ?? 2);

    for (let shot = 0; shot < count; shot += 1) {
      const flight = (share - (shot / count) * 0.7) / 0.18;

      if (flight <= 0) {
        continue;
      }
      if (flight < 1) {
        const from = aside(kit, stage.source, 0, spread(seed, shot) * reach);

        kit.star(toward(from, at, flight), reach * 0.45, share * 18, light, 1);
        continue;
      }
      const splash = Math.min(1, (flight - 1) * 0.6);

      kit.ring(
        aside(kit, at, spread(seed, shot + 7) * reach * 0.5),
        reach * (0.3 + splash),
        0.14,
        paint.color,
        decay(splash),
      );
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default kalos;
