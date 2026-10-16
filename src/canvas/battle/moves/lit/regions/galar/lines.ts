import type EffectBatch from '../../../../../three/effect-batch';
import type { Spot } from '../../../../../three/effect-batch';
import { decay, lighten, noise, spread, swell } from '../../../__paint';
import { SIGNATURE_SCALE } from '../../../effect/regions/galar/legends';
import {
  ACID_DARK,
  ACID_GREEN,
  ACID_LANDS,
  ACID_YELLOW,
  AMPED_HITS,
  AMPED_PINK,
  AMPED_WAVES,
  AMPED_YELLOW,
  APPLE_DARK,
  APPLE_LEAF,
  APPLE_RED,
  APPLE_STEM,
  CHIMNEY_DARK,
  CHIMNEY_GREY,
  CROWN_GEM,
  CROWN_GOLD,
  FLAG_POLE,
  FLAG_WHITE,
  FOG_PINK,
  FOG_VIOLET,
  GRAVITY_VIOLET,
  GRAV_LANDS,
  HAIR_DARK,
  HAIR_LIGHT,
  LANCE_LANDS,
  LEEK_GREEN,
  LEEK_WHITE,
  MORPEKO_BROWN,
  MORPEKO_YELLOW,
  OBSTAGOON_BLACK,
  OBSTAGOON_RED,
  OBSTAGOON_WHITE,
  OBSTRUCT_CROSSED,
  SHELL_DARK,
  SHELL_PALE,
  SHELL_PURPLE,
  SIDEARM_FIRES,
  SIDEARM_LANDS,
  SIRFETCHD_BROWN,
  SPELL_REACHES,
  SPELL_RUNES,
  SPELL_VIOLET,
  SPIRIT_LANDS,
  SPIRIT_PINK,
  STEAM_ROLLS,
  SUCKER_DARK,
  SUCKER_LIGHT,
  SURRENDER_BOWS,
  SURRENDER_STRIKES,
  TOXIC_PURPLE,
  TOXTRICITY_PURPLE,
  WHEEL_DARK,
  WHEEL_LANDS,
} from '../../../effect/regions/galar/lines';
import { type EffectShape, many } from '../../../effect/shapes';
import { TAU, arcing, bolt, chevron, debris, sickle, smoke, sparks, spiral } from '../../pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  thrown,
  toward,
} from '../../shapes';

/** A line painted dark under a lighter line, so it reads on any ground */
function strand(
  kit: EffectBatch,
  path: Spot[],
  width: number,
  colour: string,
  shade: string,
  alpha: number,
  add = 0.3,
): void {
  if (path.length < 2 || alpha <= 0) {
    return;
  }
  kit.ribbon(path, width * 2.2, shade, alpha * 0.7, 0, { add: 0 });
  kit.ribbon(path, width, colour, alpha, 0, { add });
}

/** A circle on the picture round a spot, as a closed run of points */
function loop(kit: EffectBatch, at: Spot, radius: number, squash = 1): Spot[] {
  const path: Spot[] = [];

  for (let step = 0; step <= 20; step += 1) {
    const angle = (step / 20) * TAU;

    path.push(aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius * squash));
  }
  return path;
}

/** A solid ball painted with a dark rim round it */
function body(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  colour: string,
  rim: string,
  alpha: number,
): void {
  kit.puff(at, radius * 1.15, rim, alpha * 0.8);
  kit.puff(at, radius, colour, alpha);
}

/** One rune of the spell: a ringed stroke, a triangle or a barred cross */
function rune(kit: EffectBatch, at: Spot, size: number, kind: number, alpha: number): void {
  const width = size * 0.22;
  const point = (right: number, up: number): Spot => aside(kit, at, right * size, up * size);

  if (kind % 3 === 0) {
    strand(kit, loop(kit, at, size * 0.6), width, SPELL_VIOLET, SHELL_DARK, alpha, 0.4);
    strand(kit, [point(0, 1), point(0, -1)], width, lighten(SPELL_VIOLET, 0.4), SHELL_DARK, alpha);
    return;
  }
  if (kind % 3 === 1) {
    strand(
      kit,
      [point(0, 1), point(0.9, -0.7), point(-0.9, -0.7), point(0, 1)],
      width,
      SPELL_VIOLET,
      SHELL_DARK,
      alpha,
      0.4,
    );
    return;
  }
  strand(kit, [point(-0.7, 0.7), point(0.7, -0.7)], width, SPELL_VIOLET, SHELL_DARK, alpha, 0.4);
  strand(kit, [point(0.7, 0.7), point(-0.7, -0.7)], width, SPELL_VIOLET, SHELL_DARK, alpha, 0.4);
  strand(kit, [point(-1, 0), point(1, 0)], width, lighten(SPELL_VIOLET, 0.4), SHELL_DARK, alpha);
}

const galarLines = {
  Aurawheel(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const run = Math.min(1, share / WHEEL_LANDS) ** 0.8;
    const hub = toward(stage.source, at, run);
    const radius = reach * 1.5;
    const spin = share * Math.PI * 10;
    const shown = late(share, 0.7);
    const flicker = seed + Math.floor(share * 24);

    if (share < WHEEL_LANDS) {
      kit.trail(toward(stage.source, hub, 0.3), hub, reach * 0.5, paint.color, 0.5);
    }
    kit.glow(hub, radius * 1.3, paint.color, shown * 0.35, 0.2);
    // The rim painted dark under its light, so it holds on a bright ground
    strand(kit, loop(kit, hub, radius), reach * 0.25, paint.color, WHEEL_DARK, shown, 0.5);
    for (let spoke = 0; spoke < 6; spoke += 1) {
      const angle = spin + (spoke / 6) * TAU;

      kit.ribbon(
        [hub, aside(kit, hub, Math.cos(angle) * radius, Math.sin(angle) * radius)],
        reach * 0.1,
        lighten(paint.color, 0.4),
        shown,
        0,
        { add: 0.3 },
      );
    }
    sickle(kit, hub, radius * 0.3, spin, spin + Math.PI, radius * 0.45, MORPEKO_YELLOW, shown, 0);
    sickle(
      kit,
      hub,
      radius * 0.3,
      spin + Math.PI,
      spin + TAU,
      radius * 0.45,
      MORPEKO_BROWN,
      shown,
      0,
    );
    for (let crack = 0; crack < 3; crack += 1) {
      const angle = spin * 0.5 + (crack / 3) * TAU + noise(flicker, crack);
      const rim = (turn: number): Spot =>
        aside(kit, hub, Math.cos(turn) * radius * 1.15, Math.sin(turn) * radius * 1.15);

      bolt(
        kit,
        rim(angle),
        rim(angle + 0.9),
        flicker + crack,
        reach,
        reach * 0.08,
        paint.color,
        shown,
      );
    }
    sparks(kit, hub, radius * 1.7, 8, flicker, (share * 8) % 1, paint.color, shown);
    if (share < WHEEL_LANDS) {
      return;
    }
    const hit = (share - WHEEL_LANDS) / (1 - WHEEL_LANDS);

    kit.ring(at, reach * (1.4 + hit * 2.4), 0.1, lighten(paint.color, 0.5), decay(hit));
    kit.ripple(floorOf(at), reach * (1.2 + hit * 2.4), 0.1, paint.color, decay(hit) * 0.8);
    sparks(kit, at, reach * 3, many(12, weight), seed + 1, hit, paint.color, decay(hit));
  },

  Amped(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const strum = decay(share * 2.5);

    for (let string = 0; string < 4; string += 1) {
      const path: Spot[] = [];

      for (let step = 0; step <= 10; step += 1) {
        const wobble = Math.sin(step * Math.PI + share * 90 + string) * reach * 0.15 * strum;

        path.push(
          aside(
            kit,
            stage.source,
            -reach * 1.4 + step * reach * 0.28,
            reach * (0.6 + string * 0.3) + wobble,
          ),
        );
      }
      strand(kit, path, reach * 0.1, AMPED_YELLOW, TOXTRICITY_PURPLE, strum);
    }
    // Bars of sound as upright zigzags, blasting across the gap one after another
    for (let wave = 0; wave < AMPED_WAVES; wave += 1) {
      const travel = (share - wave * 0.1) / (AMPED_HITS - 0.05);

      if (travel < 0 || travel > 1.4) {
        continue;
      }
      const centre = toward(stage.source, at, Math.min(1, travel));
      const half = reach * (1 + Math.min(1, travel) * 1.4);
      const path: Spot[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const kick = (step % 2 === 0 ? 1 : -1) * reach * 0.35;

        path.push(aside(kit, centre, kick, (step / 8 - 0.5) * 2 * half));
      }
      strand(
        kit,
        path,
        reach * 0.28,
        wave % 2 === 0 ? AMPED_YELLOW : AMPED_PINK,
        TOXTRICITY_PURPLE,
        decay(Math.max(0, travel - 1) * 2.5),
        0.5,
      );
    }
    if (share < AMPED_HITS) {
      return;
    }
    const hit = (share - AMPED_HITS) / (1 - AMPED_HITS);
    const flicker = seed + Math.floor(share * 20);

    kit.glow(at, reach * (1 + hit), AMPED_YELLOW, decay(hit) * 0.6, 0.4);
    kit.ring(at, reach * (1.2 + hit * 2.6), 0.1, AMPED_PINK, decay(hit));
    for (let crack = 0; crack < 3; crack += 1) {
      const angle = noise(flicker, crack) * TAU;

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * reach * 2.4, Math.sin(angle) * reach * 2.4),
        flicker + crack,
        reach,
        reach * 0.1,
        AMPED_YELLOW,
        decay(hit),
      );
    }
    sparks(kit, at, reach * (1.4 + hit * 2), 10, seed + 2, hit, AMPED_PINK, decay(hit));
  },

  Acid(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const height = reach * 3.5;

    if (share < ACID_LANDS) {
      const flight = share / ACID_LANDS;
      const spot = arcing(stage.source, at, flight, height);

      kit.trail(
        arcing(stage.source, at, Math.max(0, flight - 0.15), height),
        spot,
        reach * 0.25,
        ACID_YELLOW,
        0.6,
      );
      body(kit, spot, reach * 0.8, ACID_GREEN, ACID_DARK, 1);
      kit.glow(aside(kit, spot, -reach * 0.25, reach * 0.25), reach * 0.3, ACID_YELLOW, 0.8, 0.5);
      return;
    }
    const hit = (share - ACID_LANDS) / (1 - ACID_LANDS);
    const floor = floorOf(at);
    const shown = late(hit, 0.5);

    kit.pool(floor, reach * (1.4 + Math.min(1, hit * 3) * 0.8), ACID_GREEN, shown * 0.6, {
      add: 0,
    });
    kit.ripple(floor, reach * (1.4 + hit * 1.6), 0.1, ACID_YELLOW, shown * 0.8);
    kit.glow(at, reach * (1 + hit), ACID_GREEN, decay(hit) * 0.6, 0.3);
    for (let drop = 0; drop < 7; drop += 1) {
      const angle = Math.PI / 2 + (drop / 6 - 0.5) * Math.PI * 1.4;
      const out = reach * (0.6 + Math.min(1, hit * 2.5) * 1.2);

      kit.leaf(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        reach * 0.8,
        angle - Math.PI / 2,
        drop % 2 === 0 ? ACID_GREEN : ACID_YELLOW,
        decay(hit * 1.4),
      );
    }
    // The sizzle: bubbles popping up off it
    for (let pop = 0; pop < many(6, weight); pop += 1) {
      const rise = (hit * 2 + noise(seed, pop)) % 1;

      kit.bubble(
        aside(kit, at, spread(seed, pop + 10) * reach, -reach * 0.4 + rise * reach * 1.8),
        reach * (0.15 + noise(seed, pop + 20) * 0.15),
        ACID_YELLOW,
        swell(rise) * shown,
      );
    }
    smoke(kit, at, reach * 1.2, 3, seed + 1, hit, lighten(ACID_GREEN, 0.4), decay(hit) * 0.3);
  },

  Gravapple(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const fall = Math.min(1, share / GRAV_LANDS) ** 2;
    const spot = toward(aside(kit, at, 0, reach * 7), aside(kit, at, 0, reach * 0.6), fall);
    const landing = share >= GRAV_LANDS;
    const hit = landing ? (share - GRAV_LANDS) / (1 - GRAV_LANDS) : 0;
    const shown = late(share, 0.7);
    const apple = reach * 1.5;

    for (const side of [-1, 1]) {
      for (let mark = 0; mark < 3; mark += 1) {
        const held = (share * 1.4 + mark / 3) % 1;

        chevron(
          kit,
          aside(kit, spot, side * apple * 1.5, reach * 1.2 * (1 - held * 2)),
          reach * 1.2,
          -1,
          GRAVITY_VIOLET,
          shown * swell(held),
          reach * 0.2,
        );
      }
    }
    // The apple, painted solid with a glint off its shoulder
    body(kit, spot, apple, APPLE_RED, APPLE_DARK, shown);
    kit.glow(
      aside(kit, spot, -apple * 0.4, apple * 0.35),
      apple * 0.3,
      '#ffffff',
      shown * 0.7,
      0.8,
    );
    kit.ribbon(
      [aside(kit, spot, 0, apple * 0.8), aside(kit, spot, apple * 0.1, apple * 1.3)],
      reach * 0.2,
      APPLE_STEM,
      shown,
      0,
      { add: 0 },
    );
    kit.leaf(aside(kit, spot, apple * 0.4, apple * 1.1), apple * 0.6, -1.1, APPLE_LEAF, shown);
    if (!landing) {
      return;
    }
    const floor = floorOf(at);

    kit.ripple(floor, reach * (1.4 + hit * 3), 0.12, '#ffffff', decay(hit) * 0.9, { add: 0.3 });
    kit.ripple(floor, reach * (1 + hit * 2.2), 0.1, GRAVITY_VIOLET, decay(hit));
    debris(kit, floor, reach * 1.6, many(10, weight), seed, hit, '#a89878', decay(hit));
  },

  Spiritbreak(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const drop = Math.min(1, share / SPIRIT_LANDS) ** 2;
    const top = aside(kit, at, reach * 1.2, reach * 7);
    const fist = toward(top, aside(kit, at, 0, reach * 0.8), drop);
    const shown = late(share, 0.6);
    const arm = [top, toward(top, fist, 0.5), fist];

    kit.ribbon(arm, reach * 2.2, SPIRIT_PINK, shown * 0.5);
    kit.ribbon(arm, reach * 1.5, HAIR_DARK, shown, 0, { add: 0 });
    for (let twist = 0; twist < 3; twist += 1) {
      const path: Spot[] = [];

      for (let step = 0; step <= 12; step += 1) {
        const along = step / 12;
        const sway = Math.sin(along * Math.PI * 4 + twist * 2.1) * reach * 0.5 * swell(along);

        path.push(aside(kit, toward(top, fist, along), sway));
      }
      kit.ribbon(path, reach * 0.12, HAIR_LIGHT, shown, 0, { add: 0.2 });
    }
    kit.glow(fist, reach * 1.6, SPIRIT_PINK, shown * 0.6, 0.3);
    body(kit, fist, reach * 1.1, HAIR_DARK, SPIRIT_PINK, shown);
    for (let knuckle = 0; knuckle < 4; knuckle += 1) {
      body(
        kit,
        aside(kit, fist, (knuckle - 1.5) * reach * 0.45, -reach * 0.6),
        reach * 0.28,
        HAIR_LIGHT,
        HAIR_DARK,
        shown,
      );
    }
    if (share < SPIRIT_LANDS) {
      return;
    }
    const hit = (share - SPIRIT_LANDS) / (1 - SPIRIT_LANDS);

    kit.ring(at, reach * (1 + hit * 3), 0.1, SPIRIT_PINK, decay(hit));
    // The spirit in pieces of pink glass, painted with a shine over
    for (let piece = 0; piece < many(12, weight); piece += 1) {
      const spot = thrown(at, seed, piece, hit, reach * 3.2, reach * 1.6);
      const turn = noise(seed, piece + 20) * TAU + hit * 6;

      kit.shard(spot, reach * 0.55, turn, SPIRIT_PINK, decay(hit));
      kit.shard(spot, reach * 0.35, turn, lighten(SPIRIT_PINK, 0.6), decay(hit), { add: 0.5 });
    }
    for (let glint = 0; glint < 4; glint += 1) {
      kit.star(
        aside(kit, at, spread(seed, glint) * reach * 2, spread(seed, glint + 5) * reach * 1.4),
        reach * 0.6,
        glint,
        '#ffffff',
        swell(Math.min(1, hit * 1.6 + glint * 0.1)),
      );
    }
  },

  Strangesteam(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = late(share, 0.8);
    const stacks = [
      aside(kit, stage.source, -reach * 0.9, reach * 1.4),
      aside(kit, stage.source, reach * 0.8, reach * 1.7),
    ];

    for (const [index, base] of stacks.entries()) {
      const mouth = aside(kit, base, 0, reach * 1.2);

      // The chimney painted solid: a dark stack, its grey face and a lip
      kit.ribbon([base, mouth], reach * 0.64, CHIMNEY_DARK, shown, 0, { add: 0 });
      kit.ribbon([base, mouth], reach * 0.46, CHIMNEY_GREY, shown, 0, { add: 0 });
      kit.ribbon(
        [aside(kit, mouth, -reach * 0.42), aside(kit, mouth, reach * 0.42)],
        reach * 0.3,
        CHIMNEY_DARK,
        shown,
        0,
        { add: 0 },
      );
      for (let puff = 0; puff < 3; puff += 1) {
        const rise = (share * 3 + puff / 3 + index * 0.17) % 1;

        kit.puff(
          aside(kit, mouth, 0, rise * reach * 1.6),
          reach * (0.4 + rise * 0.6),
          puff % 2 === 0 ? FOG_PINK : FOG_VIOLET,
          swell(rise) * shown * 0.7,
        );
      }
    }
    for (let puff = 0; puff < many(8, weight); puff += 1) {
      const roll = Math.min(1, Math.max(0, (share - 0.05 - puff * 0.03) / (STEAM_ROLLS - 0.1)));

      if (roll <= 0) {
        continue;
      }
      kit.puff(
        aside(
          kit,
          toward(stacks[puff % 2], at, roll),
          spread(seed, puff) * reach * 0.8,
          -spread(seed, puff + 10) * reach * 0.5,
        ),
        reach * (0.7 + roll * 0.6),
        puff % 2 === 0 ? FOG_PINK : FOG_VIOLET,
        shown * 0.45,
      );
    }
    if (share < STEAM_ROLLS) {
      return;
    }
    const daze = (share - STEAM_ROLLS) / (1 - STEAM_ROLLS);

    kit.glow(at, reach * 2.2, FOG_PINK, swell(daze) * 0.5, 0.2);
    spiral(kit, at, reach * 1.4, 2, daze, lighten(FOG_VIOLET, 0.3), late(daze, 0.5), reach * 0.12);
    for (let glint = 0; glint < 5; glint += 1) {
      const angle = (glint / 5) * TAU + daze * Math.PI * 3;

      kit.star(
        aside(kit, at, Math.cos(angle) * reach * 1.6, reach * 0.6, Math.sin(angle) * reach * 0.5),
        reach * 0.5,
        daze * 4,
        '#ffffff',
        late(daze, 0.5) * swell((daze * 3 + glint / 5) % 1),
      );
    }
  },

  Obstruct(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const cross = Math.min(1, share / OBSTRUCT_CROSSED);
    const shown = late(share, 0.75);
    const centre = aside(kit, at, 0, reach * 0.3, -reach * 0.5);
    const out = reach * 1.8;

    kit.glow(centre, reach * 2.2, OBSTAGOON_RED, shown * 0.2, 0);
    for (const side of [-1, 1]) {
      const angle = Math.PI / 4 + (side < 0 ? Math.PI / 2 : 0) + side * decay(cross) * 0.9;
      const one = aside(kit, centre, Math.cos(angle) * out, Math.sin(angle) * out);
      const other = aside(kit, centre, -Math.cos(angle) * out, -Math.sin(angle) * out);

      // The arm painted black over a white edge, banded white like Obstagoon's
      kit.ribbon([one, other], reach * 1.1, OBSTAGOON_WHITE, shown, 0, { add: 0 });
      kit.ribbon([one, other], reach * 0.8, OBSTAGOON_BLACK, shown, 0, { add: 0 });
      for (let band = 0; band < 3; band += 1) {
        const from = 0.12 + band * 0.3;

        kit.ribbon(
          [toward(one, other, from), toward(one, other, from + 0.12)],
          reach * 0.55,
          OBSTAGOON_WHITE,
          shown,
          0,
          { add: 0 },
        );
      }
    }
    body(kit, centre, reach * 0.35, OBSTAGOON_RED, OBSTAGOON_BLACK, shown);
    const flash = Math.max(0, (share - OBSTRUCT_CROSSED * 0.7) / 0.25);

    if (flash > 0 && flash < 1) {
      kit.glow(centre, reach * (1.4 + flash * 1.6), '#ffffff', decay(flash) * 0.9);
      kit.star(centre, reach * (1.6 + flash), Math.PI / 4, '#ffffff', decay(flash));
      sparks(kit, centre, reach * (2 + flash * 1.4), 10, seed, flash, '#ffffff', decay(flash));
    }
  },

  Surrender(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const dip = Math.min(1, share / SURRENDER_BOWS);
    const held = late(share, SURRENDER_STRIKES);
    const ground = floorOf(stage.source);
    const foot = aside(kit, stage.source, reach * 1.4, -reach * 0.2);
    const lean = swell(dip) * 0.35;
    const head = aside(kit, foot, Math.sin(lean) * reach * 3.4, Math.cos(lean) * reach * 3.4);

    // The caster's shadow stretching forward along the ground as it bows
    for (let patch = 0; patch < 4; patch += 1) {
      kit.pool(
        toward(ground, floorOf(at), (patch / 4) * (0.12 + swell(dip) * 0.12)),
        reach * (0.9 - patch * 0.12),
        SUCKER_DARK,
        0.3 * held,
        { add: 0 },
      );
    }
    kit.ribbon([foot, head], reach * 0.4, SUCKER_DARK, held * 0.7, 0, { add: 0 });
    kit.ribbon([foot, head], reach * 0.2, FLAG_POLE, held, 0, { add: 0 });
    // The flag: a waving band of white hung off the pole's top
    const cloth: Spot[] = [];

    for (let step = 0; step <= 6; step += 1) {
      const along = step / 6;
      const wave = Math.sin(along * TAU - share * 30) * reach * 0.25 * along;

      cloth.push(aside(kit, head, along * reach * 2, -reach * 0.65 + wave));
    }
    kit.ribbon(cloth, reach * 1.5, SUCKER_DARK, held * 0.5, 0, { add: 0 });
    kit.ribbon(cloth, reach * 1.3, FLAG_WHITE, held, 0, { add: 0 });
    if (share < SURRENDER_BOWS) {
      return;
    }
    const swing = Math.min(1, (share - SURRENDER_BOWS) / (SURRENDER_STRIKES - SURRENDER_BOWS));
    const from = aside(kit, at, -reach * 5, -reach * 0.6);
    const blow = toward(from, at, swing ** 1.5);

    if (share < SURRENDER_STRIKES + 0.15) {
      const shown = late(share, SURRENDER_STRIKES);

      kit.trail(toward(from, blow, 0.2), blow, reach * 0.8, SUCKER_LIGHT, shown * 0.5);
      body(kit, blow, reach * 0.9, SUCKER_DARK, SUCKER_LIGHT, shown);
    }
    if (share < SURRENDER_STRIKES) {
      return;
    }
    const hit = (share - SURRENDER_STRIKES) / (1 - SURRENDER_STRIKES);

    kit.puff(at, reach * (1 + hit * 1.4), SUCKER_DARK, decay(hit) * 0.3);
    kit.star(at, reach * (1.4 + swell(Math.min(1, hit * 2)) * 0.6), 0.3, '#ffffff', decay(hit));
    kit.ring(at, reach * (1 + hit * 2.4), 0.1, SUCKER_LIGHT, decay(hit));
    sparks(kit, at, reach * (1.4 + hit * 2), 10, seed, hit, SUCKER_LIGHT, decay(hit));
  },

  Assault(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const run = Math.min(1, share / LANCE_LANDS) ** 1.3;
    const tip = toward(stage.source, at, run);
    const gap = Math.max(
      0.001,
      Math.hypot(at[0] - stage.source[0], at[1] - stage.source[1], at[2] - stage.source[2]),
    );
    const butt = toward(stage.source, at, run - (reach * 4) / gap);
    const shown = late(share, 0.55);
    const lance = [butt, toward(butt, tip, 0.5), tip];

    // The streak behind the charge, brown under green
    kit.ribbon(
      [toward(stage.source, butt, 0.1), tip],
      reach * 1.8,
      SIRFETCHD_BROWN,
      shown * 0.5,
      share * 4,
      { add: 0 },
    );
    kit.trail(toward(stage.source, butt, 0.3), tip, reach * 0.5, LEEK_GREEN, shown * 0.8);
    const back = kit.angleOn(tip, butt);

    for (let leaf = 0; leaf < 3; leaf += 1) {
      const angle = back + (leaf - 1) * 0.5;

      kit.leaf(
        aside(kit, butt, Math.cos(angle) * reach * 0.8, Math.sin(angle) * reach * 0.8),
        reach * 1.6,
        angle - Math.PI / 2,
        LEEK_GREEN,
        shown,
      );
    }
    // The lance painted solid: a brown edge round the white stalk
    kit.ribbon(lance, reach * 1, SIRFETCHD_BROWN, shown, 0, { add: 0 });
    kit.ribbon(lance, reach * 0.7, LEEK_WHITE, shown, 0, { add: 0.1 });
    if (share < LANCE_LANDS) {
      kit.star(tip, reach * 0.8, share * 10, '#ffffff', 1);
      return;
    }
    const hit = (share - LANCE_LANDS) / (1 - LANCE_LANDS);

    kit.glow(at, reach * (1.4 + hit * 1.6), '#fff8e0', decay(hit * 1.5));
    kit.star(at, reach * (2 + swell(Math.min(1, hit * 2)) * 1), 0.2, '#ffffff', decay(hit));
    kit.ring(at, reach * (1.2 + hit * 3.4), 0.1, LEEK_GREEN, decay(hit));
    kit.ripple(floorOf(at), reach * (1.2 + hit * 3), 0.1, LEEK_GREEN, decay(hit) * 0.8);
    sparks(kit, at, reach * (1.8 + hit * 2.2), 12, seed, hit, '#fff8e0', decay(hit));
    debris(kit, at, reach * 2, many(10, weight), seed + 1, hit, SIRFETCHD_BROWN, decay(hit));
  },

  Sidearm(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const kick = share < SIDEARM_FIRES ? 0 : decay((share - SIDEARM_FIRES) * 6) * reach * 0.4;
    const shell = aside(kit, stage.source, reach * 1.3 + kick * 0.3, reach * 0.5 - kick);
    const shown = late(share, 0.6);
    const aim = kit.angleOn(shell, at);

    for (let ridge = 0; ridge < 5; ridge += 1) {
      const angle = aim + Math.PI + (ridge / 4 - 0.5) * Math.PI * 1.2;

      kit.leaf(
        aside(kit, shell, Math.cos(angle) * reach * 0.7, Math.sin(angle) * reach * 0.7),
        reach * 1,
        angle - Math.PI / 2,
        ridge % 2 === 0 ? SHELL_PURPLE : SHELL_DARK,
        shown,
      );
    }
    body(kit, shell, reach * 0.8, SHELL_PURPLE, SHELL_DARK, shown);
    body(
      kit,
      aside(kit, shell, Math.cos(aim) * reach * 0.35, Math.sin(aim) * reach * 0.35),
      reach * 0.35,
      SHELL_DARK,
      SHELL_PALE,
      shown,
    );
    if (share < SIDEARM_FIRES) {
      kit.glow(shell, reach * (0.6 + share * 4), TOXIC_PURPLE, 0.7, 0.4);
      return;
    }
    const muzzle = aside(kit, shell, Math.cos(aim) * reach, Math.sin(aim) * reach);
    const flash = (share - SIDEARM_FIRES) / 0.12;

    if (flash < 1) {
      sparks(kit, muzzle, reach * (0.8 + flash), 8, seed, flash, TOXIC_PURPLE, decay(flash));
    }
    if (share < SIDEARM_LANDS) {
      const flight = (share - SIDEARM_FIRES) / (SIDEARM_LANDS - SIDEARM_FIRES);
      const ball = toward(muzzle, at, flight);

      kit.trail(
        toward(muzzle, at, Math.max(0, flight - 0.3)),
        ball,
        reach * 0.5,
        TOXIC_PURPLE,
        0.7,
      );
      body(kit, ball, reach * 0.6, TOXIC_PURPLE, SHELL_DARK, 1);
      kit.glow(ball, reach * 0.4, SHELL_PALE, 0.8, 0.5);
      return;
    }
    const hit = (share - SIDEARM_LANDS) / (1 - SIDEARM_LANDS);

    kit.glow(at, reach * (1.2 + hit * 1.8), TOXIC_PURPLE, decay(hit) * 0.7, 0.3);
    kit.ring(at, reach * (1 + hit * 3), 0.1, lighten(TOXIC_PURPLE, 0.3), decay(hit));
    sparks(kit, at, reach * 3, many(12, weight), seed + 1, hit, TOXIC_PURPLE, decay(hit));
    for (let pop = 0; pop < many(6, weight); pop += 1) {
      const rise = (hit * 1.6 + noise(seed, pop)) % 1;

      kit.bubble(
        aside(kit, at, spread(seed, pop + 10) * reach * 1.2, rise * reach * 2),
        reach * (0.2 + noise(seed, pop + 20) * 0.2),
        lighten(TOXIC_PURPLE, 0.3),
        swell(rise) * late(hit, 0.5),
      );
    }
  },

  Spell(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const crown = aside(kit, stage.source, 0, reach * 1.9);
    const glow = late(share, 0.6);

    kit.glow(
      crown,
      reach * (1 + swell(Math.min(1, share * 2)) * 0.6),
      SPELL_VIOLET,
      glow * 0.6,
      0.3,
    );
    // The crown painted gold: three spikes on a band, a gem in the middle
    const points: Spot[] = [aside(kit, crown, -reach * 0.8, -reach * 0.1)];

    for (let spike = 0; spike < 3; spike += 1) {
      const across = (spike - 1) * reach * 0.55;

      points.push(aside(kit, crown, across - reach * 0.25, 0));
      points.push(aside(kit, crown, across, reach * 0.6));
      points.push(aside(kit, crown, across + reach * 0.25, 0));
    }
    points.push(aside(kit, crown, reach * 0.8, -reach * 0.1));
    strand(kit, points, reach * 0.2, CROWN_GOLD, SHELL_DARK, glow, 0.2);
    kit.ribbon(
      [
        aside(kit, crown, -reach * 0.8, -reach * 0.15),
        aside(kit, crown, reach * 0.8, -reach * 0.15),
      ],
      reach * 0.4,
      CROWN_GOLD,
      glow,
      0,
      { add: 0 },
    );
    kit.puff(aside(kit, crown, 0, -reach * 0.15), reach * 0.3, CROWN_GEM, glow);
    const travel = Math.min(1, share / SPELL_REACHES);
    const centre = toward(crown, at, travel ** 0.9);
    const closing = Math.max(0, (share - SPELL_REACHES) / (1 - SPELL_REACHES));
    const radius = reach * (0.8 + travel * 1.2) * (1 - closing * 0.5);
    const runes = late(share, 0.8);

    for (let one = 0; one < SPELL_RUNES; one += 1) {
      const angle = (one / SPELL_RUNES) * TAU + share * TAU;

      rune(
        kit,
        aside(kit, centre, Math.cos(angle) * radius, Math.sin(angle) * radius * 0.6),
        reach * 0.3,
        one + Math.floor(noise(seed, one) * 3),
        runes,
      );
    }
    if (closing <= 0) {
      return;
    }
    for (let wave = 0; wave < 3; wave += 1) {
      const pull = (closing * 2 + wave / 3) % 1;

      kit.ring(at, reach * (3 - pull * 2.6), 0.08, SPELL_VIOLET, swell(pull) * runes);
    }
    kit.glow(at, reach * 1.3, SPELL_VIOLET, swell(closing) * 0.5, 0.3);
    for (let mote = 0; mote < 5; mote += 1) {
      const rise = (closing * 1.5 + noise(seed, mote + 20)) % 1;

      kit.glow(
        aside(kit, at, spread(seed, mote + 30) * reach, reach * 0.4 + rise * reach * 2),
        reach * 0.22,
        lighten(SPELL_VIOLET, 0.4),
        swell(rise) * runes,
        0.5,
      );
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default galarLines;
