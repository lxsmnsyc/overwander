import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, noise, spread, swell } from '../__paint';
import { SIGNATURE_SCALE } from '../effect/galar';
import {
  AEGIS_DARK,
  AEGIS_GOLD,
  AEGIS_PLANTS,
  AEGIS_PURPLE,
  AEGIS_SHEATHED,
  AEGIS_STEEL,
  BUNKER_ARMS,
  BUNKER_CLOSED,
  CANDY_COLOURS,
  CURSE_BARK,
  CURSE_DARK,
  CURSE_GLOW,
  CURSE_GROWS,
  CURSE_LEAF,
  HAMMER_DARK,
  HAMMER_FROST,
  HAMMER_FUR,
  HAMMER_LANDS,
  HEAL_GREEN,
  KEY_DARK,
  KEY_GOLD,
  LANTERN_LIGHT,
  LEI_COLOURS,
  LEI_FLOWERS,
  LEI_GOLD,
  LEI_SETTLES,
  LEI_VINE,
  LOCK_CLICKS,
  LOCK_KEYS,
  LOCK_PINK,
  LOCK_STEEL,
  MAT_DUST,
  MAT_EDGE,
  MAT_FLIPS,
  MAT_STRAW,
  MAT_WEAVE,
  PRESS_GREEN,
  PRESS_LANDS,
  PRESS_ORANGE,
  PUMPKIN_DARK,
  PUMPKIN_ORANGE,
  PUMPKIN_STEM,
  PURIFY_CLEAR,
  PURIFY_CLOSES,
  PURIFY_MURK,
  PURIFY_PINK,
  PURIFY_SPARKLES,
  REVELATION_LANDS,
  REVELATION_THROWN,
  SAND,
  SAND_DARK,
  SHORE_BUILT,
  SHOVEL_RED,
  THREAD_LANDS,
  THREAD_PURPLE,
  THREAD_SHADE,
  TOXAPEX_DARK,
  TOXAPEX_SPIKE,
  TOXAPEX_VIOLET,
  TOXIC_DRIP,
  TREAT_GHOST,
  TREAT_GRINS,
  TREAT_SETTLES,
  VENOM_BEAD,
  WRATH_HEAVES,
  WRATH_ROCK,
  ZYGARDE_DARK,
  ZYGARDE_GREEN,
} from '../effect/kalos-signatures';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, debris, sickle, smoke, sparks } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  thrown,
  toward,
} from './shapes';

/** A strand painted dark under a coloured line, so it reads on any ground */
function strand(
  kit: EffectBatch,
  path: Spot[],
  width: number,
  colour: string,
  shade: string,
  alpha: number,
): void {
  if (path.length < 2 || alpha <= 0) {
    return;
  }
  kit.ribbon(path, width * 2, shade, alpha * 0.85, 0, { add: 0 });
  kit.ribbon(path, width, colour, alpha, 0, { add: 0.15 });
}

/** A solid painted band between two spots, `width` across it */
function band(
  kit: EffectBatch,
  from: Spot,
  to: Spot,
  width: number,
  colour: string,
  alpha: number,
): void {
  if (alpha <= 0) {
    return;
  }
  kit.ribbon([from, to], width, colour, alpha, 0, { add: 0 });
}

/** Spots round an oval on the picture, from one angle to another, up positive */
function arc(
  kit: EffectBatch,
  at: Spot,
  across: number,
  up: number,
  from: number,
  to: number,
  steps = 16,
): Spot[] {
  const path: Spot[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const angle = from + (to - from) * (step / steps);

    path.push(aside(kit, at, Math.cos(angle) * across, Math.sin(angle) * up));
  }
  return path;
}

/** Spots round a level ring in the field at the height of `at` */
function level(at: Spot, radius: number, from: number, to: number, steps = 20): Spot[] {
  const path: Spot[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const angle = from + (to - from) * (step / steps);

    path.push([at[0] + Math.cos(angle) * radius, at[1], at[2] + Math.sin(angle) * radius]);
  }
  return path;
}

/** A key: a ring for a bow, a shaft and two teeth, turned on the picture by `turn` */
function key(kit: EffectBatch, at: Spot, size: number, turn: number, alpha: number): void {
  const spot = (out: number, side: number): Spot =>
    aside(
      kit,
      at,
      Math.cos(turn) * out - Math.sin(turn) * side,
      Math.sin(turn) * out + Math.cos(turn) * side,
    );
  const width = size * 0.2;

  strand(
    kit,
    arc(kit, spot(-size * 0.55, 0), size * 0.4, size * 0.4, 0, TAU, 12),
    width,
    KEY_GOLD,
    KEY_DARK,
    alpha,
  );
  strand(kit, [spot(-size * 0.15, 0), spot(size, 0)], width, KEY_GOLD, KEY_DARK, alpha);
  strand(
    kit,
    [spot(size * 0.55, 0), spot(size * 0.55, -size * 0.35)],
    width,
    KEY_GOLD,
    KEY_DARK,
    alpha,
  );
  strand(
    kit,
    [spot(size * 0.85, 0), spot(size * 0.85, -size * 0.3)],
    width,
    KEY_GOLD,
    KEY_DARK,
    alpha,
  );
}

/** A flower of five painted petals round a gold middle */
function flower(
  kit: EffectBatch,
  at: Spot,
  size: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const angle = turn + (leaf / 5) * TAU;

    kit.leaf(
      aside(kit, at, Math.cos(angle) * size * 0.55, Math.sin(angle) * size * 0.55),
      size * 1.1,
      angle - Math.PI / 2,
      colour,
      alpha,
    );
  }
  kit.puff(at, size * 0.35, LEI_GOLD, alpha);
}

/** A wrapped sweet: a round middle and a twist of wrapper at each end */
function candy(
  kit: EffectBatch,
  at: Spot,
  size: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  for (const way of [1, -1]) {
    kit.shard(
      aside(kit, at, Math.cos(turn) * size * 1.3 * way, Math.sin(turn) * size * 1.3 * way),
      size * 0.8,
      turn,
      lighten(colour, 0.3),
      alpha,
    );
  }
  kit.puff(at, size * 1.2, PUMPKIN_DARK, alpha * 0.6);
  kit.puff(at, size, colour, alpha);
}

/** Aegislash's shield, built from level bands: straight sides, then narrowing to the point at `tip` */
function shield(
  kit: EffectBatch,
  tip: Spot,
  width: number,
  height: number,
  colour: string,
  alpha: number,
): void {
  const rows = 12;

  for (let row = 0; row < rows; row += 1) {
    const down = (row + 0.5) / rows;
    const half = down < 0.5 ? width : width * Math.max(0.08, 1 - ((down - 0.5) / 0.5) ** 1.3);
    const y = height * (1 - down);

    band(
      kit,
      aside(kit, tip, -half, y),
      aside(kit, tip, half, y),
      (height / rows) * 1.15,
      colour,
      alpha,
    );
  }
}

/** The shield's outline, for its rim */
function shieldRim(kit: EffectBatch, tip: Spot, width: number, height: number): Spot[] {
  return [
    aside(kit, tip, -width, height),
    aside(kit, tip, width, height),
    aside(kit, tip, width, height * 0.5),
    aside(kit, tip, width * 0.55, height * 0.18),
    tip,
    aside(kit, tip, -width * 0.55, height * 0.18),
    aside(kit, tip, -width, height * 0.5),
    aside(kit, tip, -width, height),
  ];
}

const kalosSignatures = {
  Mat(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const base = aside(kit, floorOf(at), 0, 0, -reach * 0.6);
    const flip = Math.min(1, share / MAT_FLIPS);
    const lean = flip ** 2 * (Math.PI / 2);
    const shown = Math.min(1, share * 10) * late(share, 0.7);
    const tall = reach * 2.4;
    const half = reach * 1.2;
    // Lying away from the camera at first, then up on its edge
    const top = aside(kit, base, 0, tall * Math.sin(lean) + reach * 0.15, tall * Math.cos(lean));

    band(kit, base, top, half * 2, MAT_STRAW, shown * 0.95);
    for (let line = 1; line < 7; line += 1) {
      const spot = toward(base, top, line / 7);

      band(
        kit,
        aside(kit, spot, -half * 0.8),
        aside(kit, spot, half * 0.8),
        reach * 0.05,
        MAT_WEAVE,
        shown * 0.8,
      );
    }
    for (const way of [-1, 1]) {
      band(
        kit,
        aside(kit, base, half * 0.9 * way),
        aside(kit, top, half * 0.9 * way),
        half * 0.2,
        MAT_EDGE,
        shown,
      );
    }
    if (share < MAT_FLIPS * 0.85) {
      return;
    }
    const slap = Math.min(1, (share - MAT_FLIPS * 0.85) / 0.5);

    for (let cloud = 0; cloud < 6; cloud += 1) {
      const out = (cloud < 3 ? -1 : 1) * (0.9 + (cloud % 3) * 0.45 + slap * 0.9) * reach;

      kit.puff(
        aside(kit, base, out, reach * (0.15 + slap * 0.3 + noise(seed, cloud) * 0.2)),
        reach * (0.45 + slap * 0.4),
        MAT_DUST,
        decay(slap) * 0.7,
      );
    }
    sparks(kit, top, reach * (1 + slap), 8, seed, slap, '#ffffff', decay(slap * 2));
    debris(kit, base, reach * 1.2, many(8, weight), seed + 1, slap, MAT_WEAVE, decay(slap));
  },

  Treat(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const grin = Math.min(1, share / TREAT_GRINS);
    const held = Math.min(1, share * 8) * late(share, 0.6);
    const head = aside(kit, at, 0, reach * 1.9 + Math.sin(share * 14) * reach * 0.08);
    const big = reach * (0.6 + grin * 0.4);

    kit.glow(head, big * 2, LANTERN_LIGHT, held * 0.3, 0);
    kit.puff(head, big * 1.25, PUMPKIN_DARK, held * 0.8);
    for (const out of [-0.5, 0.5, 0]) {
      kit.puff(aside(kit, head, out * big), big * (out === 0 ? 0.85 : 0.75), PUMPKIN_ORANGE, held);
    }
    band(
      kit,
      aside(kit, head, 0, big * 0.7),
      aside(kit, head, big * 0.2, big * 1.1),
      big * 0.2,
      PUMPKIN_STEM,
      held,
    );
    // The face cut into it, lit from inside
    for (const way of [-1, 1]) {
      kit.shard(
        aside(kit, head, way * big * 0.38, big * 0.18),
        big * 0.26,
        Math.PI / 2,
        PUMPKIN_DARK,
        held,
      );
      kit.glow(aside(kit, head, way * big * 0.38, big * 0.18), big * 0.2, LANTERN_LIGHT, held, 0.8);
    }
    const mouth: Spot[] = [];

    for (let tooth = 0; tooth <= 8; tooth += 1) {
      const across = tooth / 8 - 0.5;

      mouth.push(
        aside(
          kit,
          head,
          across * big * 1.1,
          -big * (0.3 - across * across * 0.6) - (tooth % 2) * big * 0.14 * grin,
        ),
      );
    }
    strand(kit, mouth, big * 0.16, LANTERN_LIGHT, PUMPKIN_DARK, held);
    kit.ribbon(mouth, big * 0.12, LANTERN_LIGHT, held, 0, { add: 0.6 });

    for (let sweet = 0; sweet < many(6, weight); sweet += 1) {
      const angle = noise(seed, sweet) * TAU + share * 5;
      const fall = (share * 1.2 + noise(seed, sweet + 20)) % 1;

      candy(
        kit,
        aside(
          kit,
          at,
          Math.cos(angle) * reach * 1.6,
          reach * 2.2 - fall * reach * 3,
          Math.sin(angle) * reach * 0.6,
        ),
        reach * 0.22,
        angle * 2,
        CANDY_COLOURS[sweet % CANDY_COLOURS.length],
        swell(fall) * late(share, 0.8),
      );
    }
    if (share < TREAT_SETTLES * 0.6) {
      return;
    }
    const settle = (share - TREAT_SETTLES * 0.6) / (1 - TREAT_SETTLES * 0.6);

    kit.glow(at, reach * 1.5, TREAT_GHOST, swell(settle) * 0.45, 0.2);
    kit.ring(at, reach * (2.6 - Math.min(1, settle * 2) * 1.4), 0.08, TREAT_GHOST, swell(settle));
    kit.pool(floorOf(at), reach * 1.6, TREAT_GHOST, swell(settle) * 0.5);
    for (let wisp = 0; wisp < 5; wisp += 1) {
      const rise = (settle * 1.4 + noise(seed, wisp + 40)) % 1;

      kit.leaf(
        aside(kit, at, spread(seed, wisp) * reach * 1.2, -reach * 0.6 + rise * reach * 2),
        reach * 0.6,
        Math.sin(rise * 6) * 0.3,
        lighten(TREAT_GHOST, 0.3),
        swell(rise) * decay(settle) * 0.9,
      );
    }
  },

  Curse(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const floor = floorOf(at);
    const grow = 1 - (1 - Math.min(1, share / CURSE_GROWS)) ** 2;
    const shown = late(share, 0.75);

    for (let branch = 0; branch < 6; branch += 1) {
      const across = (branch / 5 - 0.5) * 2;
      const side = across < 0 ? 1 : -1;
      const base = aside(kit, floor, across * reach * 1.5, 0, spread(seed, branch) * reach * 0.4);
      const height = reach * (2.2 + noise(seed, branch + 10) * 0.9);
      const path: Spot[] = [];

      for (let step = 0; step <= 12; step += 1) {
        const along = (step / 12) * grow;
        const lean =
          Math.sin(along * Math.PI * 0.8) * reach * 0.7 + Math.max(0, along - 0.7) * reach * 2.2;

        path.push(
          aside(
            kit,
            base,
            side * lean + Math.sin(along * 11 + branch) * reach * 0.1,
            along * height,
          ),
        );
      }
      strand(kit, path, reach * 0.24, CURSE_BARK, CURSE_DARK, shown);
      if (grow > 0.5) {
        const knot = path[6];

        strand(
          kit,
          [knot, aside(kit, knot, -side * reach * 0.5 * grow, reach * 0.45 * grow)],
          reach * 0.11,
          CURSE_BARK,
          CURSE_DARK,
          shown,
        );
      }
      strand(
        kit,
        [base, aside(kit, base, -side * reach * 0.7 * grow, 0, -reach * 0.1)],
        reach * 0.15,
        CURSE_BARK,
        CURSE_DARK,
        shown,
      );
    }
    if (share < 0.2) {
      return;
    }
    const drift = (share - 0.2) / 0.8;

    kit.glow(at, reach * 1.6, CURSE_GLOW, swell(drift) * 0.35, 0);
    kit.pool(floor, reach * 1.8, CURSE_GLOW, swell(drift) * 0.4);
    for (let leaf = 0; leaf < many(9, weight); leaf += 1) {
      const fall = Math.min(1, drift * 1.6 - noise(seed, leaf + 30) * 0.5);

      if (fall <= 0) {
        continue;
      }
      kit.leaf(
        aside(
          kit,
          at,
          spread(seed, leaf) * reach * 1.4 + Math.sin(fall * 7 + leaf) * reach * 0.3,
          reach * 2.8 - fall * reach * 2.6,
        ),
        reach * 0.55,
        Math.sin(fall * 9 + leaf) * 0.8,
        CURSE_LEAF,
        late(drift, 0.7),
      );
    }
  },

  Lock(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const centre = aside(kit, at, 0, reach * 0.5);
    const pull = Math.max(0, Math.min(1, (share - 0.25) / (LOCK_CLICKS - 0.25)));
    const keys = Math.min(1, share * 10) * decay(pull ** 2);

    for (let index = 0; index < LOCK_KEYS; index += 1) {
      const angle = (index / LOCK_KEYS) * TAU + share * Math.PI * 3;
      const out = reach * 2.6 * (1 - pull * 0.8);

      key(
        kit,
        [centre[0] + Math.cos(angle) * out, centre[1], centre[2] + Math.sin(angle) * out],
        reach * 0.55,
        angle - Math.PI / 2,
        keys,
      );
    }
    if (share < 0.3) {
      return;
    }
    const grown = 1 - (1 - Math.min(1, (share - 0.3) / 0.2)) ** 2;
    const shut = Math.min(1, Math.max(0, (share - LOCK_CLICKS) / 0.06));
    const shown = Math.min(1, (share - 0.3) * 8) * late(share, 0.85);
    const half = reach * 0.9 * grown;
    const body = aside(kit, centre, 0, -reach * 0.3);
    const raised = (1 - shut) * reach * 0.6;

    kit.glow(body, reach * 2.4 * grown, LOCK_PINK, shown * 0.35, 0);
    strand(
      kit,
      arc(kit, aside(kit, body, 0, half * 0.55 + raised), half * 0.6, half * 0.9, 0, Math.PI),
      half * 0.26,
      LOCK_STEEL,
      KEY_DARK,
      shown,
    );
    band(
      kit,
      aside(kit, body, 0, -half * 0.8),
      aside(kit, body, 0, half * 0.7),
      half * 2.2,
      KEY_DARK,
      shown,
    );
    band(
      kit,
      aside(kit, body, 0, -half * 0.7),
      aside(kit, body, 0, half * 0.6),
      half * 2,
      KEY_GOLD,
      shown,
    );
    kit.puff(body, half * 0.2, KEY_DARK, shown);
    band(kit, body, aside(kit, body, 0, -half * 0.45), half * 0.16, KEY_DARK, shown);
    if (shut <= 0) {
      return;
    }
    const flash = (share - LOCK_CLICKS) / (1 - LOCK_CLICKS);

    kit.glow(body, reach * (1 + flash * 1.5), '#ffffff', decay(flash * 2.5) * 0.9);
    kit.ring(body, reach * (1.2 + flash * 2.6), 0.08, LOCK_PINK, decay(flash));
    for (let glint = 0; glint < 5; glint += 1) {
      const angle = (glint / 5) * TAU + noise(seed, glint);

      kit.star(
        aside(
          kit,
          body,
          Math.cos(angle) * reach * (1.2 + flash * 1.4),
          Math.sin(angle) * reach * (1 + flash),
        ),
        reach * 0.5,
        flash * 3,
        LOCK_PINK,
        decay(flash),
      );
    }
    sparks(kit, body, reach * 2.4, many(8, weight), seed + 1, flash, KEY_GOLD, decay(flash));
  },

  Aegis(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const plant = Math.min(1, share / AEGIS_PLANTS);
    const shown = Math.min(1, share * 10) * late(share, 0.75);
    const tip = aside(kit, floorOf(at), 0, (1 - plant ** 2) * reach * 2.5, -reach * 0.6);
    const width = reach * 1.1;
    const height = reach * 3;
    const slide = Math.max(
      0,
      Math.min(1, (share - AEGIS_PLANTS * 0.6) / (AEGIS_SHEATHED - AEGIS_PLANTS * 0.6)),
    );
    const hilt = aside(kit, tip, 0, height + reach * 0.4 + (1 - slide) * reach * 1.6, reach * 0.3);

    // The blade first, so the shield covers what has slid behind it
    if (share > AEGIS_PLANTS * 0.6) {
      const point = aside(kit, hilt, 0, -reach * 3);

      kit.ribbon([hilt, point], reach * 0.7, AEGIS_DARK, shown, 0, { add: 0 });
      kit.ribbon([hilt, toward(hilt, point, 0.92)], reach * 0.5, '#eef2fa', shown, 0, { add: 0.2 });
      strand(
        kit,
        [aside(kit, hilt, -reach * 0.7), aside(kit, hilt, reach * 0.7)],
        reach * 0.22,
        AEGIS_GOLD,
        AEGIS_DARK,
        shown,
      );
      strand(
        kit,
        [hilt, aside(kit, hilt, 0, reach * 0.7)],
        reach * 0.2,
        AEGIS_PURPLE,
        AEGIS_DARK,
        shown,
      );
    }
    shield(kit, tip, width * 1.12, height * 1.04, AEGIS_DARK, shown);
    shield(kit, tip, width, height, AEGIS_STEEL, shown);
    shield(
      kit,
      aside(kit, tip, 0, reach * 0.3),
      width * 0.72,
      height * 0.78,
      lighten(AEGIS_STEEL, 0.3),
      shown * 0.6,
    );
    kit.ribbon(shieldRim(kit, tip, width, height), reach * 0.22, AEGIS_GOLD, shown, 0, {
      add: 0.2,
    });
    strand(
      kit,
      [aside(kit, tip, 0, height - reach * 0.9), aside(kit, tip, 0, reach * 0.4)],
      reach * 0.13,
      AEGIS_GOLD,
      AEGIS_DARK,
      shown,
    );
    const crown: Spot[] = [];

    for (let point = 0; point <= 4; point += 1) {
      crown.push(
        aside(
          kit,
          tip,
          (point / 4 - 0.5) * width * 1.1,
          height - reach * (point % 2 === 0 ? 0.25 : 0.6),
        ),
      );
    }
    strand(kit, crown, reach * 0.13, AEGIS_GOLD, AEGIS_DARK, shown);
    if (share < AEGIS_PLANTS) {
      return;
    }
    const flash = (share - AEGIS_PLANTS) / (1 - AEGIS_PLANTS);
    const middle = aside(kit, tip, 0, height * 0.5);

    kit.star(
      aside(kit, tip, width * 0.8, height - reach * 0.3),
      reach * (1.2 + swell(Math.min(1, flash * 2)) * 0.8),
      flash * 2,
      '#fff6cc',
      decay(flash),
    );
    kit.ring(middle, reach * (1.4 + flash * 2.4), 0.07, AEGIS_GOLD, decay(flash));
    sparks(kit, middle, reach * (2 + flash * 1.5), 12, seed, flash, AEGIS_GOLD, decay(flash * 1.5));
    kit.ripple(floorOf(tip), reach * (1 + flash * 2), 0.1, AEGIS_GOLD, decay(flash) * 0.8);
  },

  Wrathland(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const floor = floorOf(at);
    const gather = Math.min(1, share / WRATH_HEAVES);
    const cells = late(share, WRATH_HEAVES + 0.1);

    kit.ripple(floor, reach * (2.4 - gather), 0.08, ZYGARDE_GREEN, gather * cells * 0.8);
    for (let index = 0; index < many(10, weight); index += 1) {
      const angle = noise(seed, index) * TAU;
      const out =
        reach *
        (0.3 + noise(seed, index + 10) * 0.7 + (1 - gather) * (3 + noise(seed, index + 20)));
      const spot: Spot = [floor[0] + Math.cos(angle) * out, 0, floor[2] + Math.sin(angle) * out];
      const shown = Math.min(1, share * 10) * cells;

      strand(
        kit,
        level(spot, reach * 0.38, 0, TAU, 6),
        reach * 0.1,
        ZYGARDE_GREEN,
        ZYGARDE_DARK,
        shown,
      );
      kit.pool(spot, reach * 0.4, ZYGARDE_GREEN, shown * 0.8);
    }
    if (share < WRATH_HEAVES) {
      return;
    }
    const heave = (share - WRATH_HEAVES) / (1 - WRATH_HEAVES);
    const rise = 1 - (1 - Math.min(1, heave * 4)) ** 2;
    const rocks = late(heave, 0.5);

    kit.glow(at, reach * (1.4 + heave * 1.4), ZYGARDE_GREEN, decay(heave) * 0.6);
    for (let rock = 0; rock < 7; rock += 1) {
      const across = (rock / 6 - 0.5) * reach * 3.4;
      const base = aside(kit, floor, across, 0, spread(seed, rock + 30) * reach * 0.5);
      const tall =
        reach *
        (1.4 + noise(seed, rock + 40) * 1.2) *
        rise *
        (1 - Math.abs(across) / (reach * 3.4));
      const lean = spread(seed, rock + 50) * reach * 0.3;
      const peak = aside(kit, base, lean, tall);

      kit.ribbon([base, toward(base, peak, 0.5), peak], reach * 0.95, ZYGARDE_DARK, rocks, 0, {
        add: 0,
      });
      kit.ribbon(
        [base, toward(base, peak, 0.5), toward(base, peak, 0.95)],
        reach * 0.75,
        WRATH_ROCK,
        rocks,
        0,
        { add: 0 },
      );
      kit.ribbon([base, toward(base, peak, 0.7)], reach * 0.12, ZYGARDE_GREEN, rocks, 0, {
        add: 0.8,
      });
    }
    debris(kit, at, reach * 1.6, many(12, weight), seed + 1, heave, WRATH_ROCK, decay(heave));
    sparks(kit, floor, reach * (1.6 + heave * 2), 12, seed + 2, heave, ZYGARDE_GREEN, decay(heave));
    kit.ripple(floor, reach * (1.2 + heave * 3), 0.1, ZYGARDE_GREEN, decay(heave));
  },

  Shore(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const floor = floorOf(at);
    const built = Math.min(1, share / SHORE_BUILT);
    const sand = late(share, 0.6);
    const shown = Math.min(1, share * 10) * late(share, 0.85);

    for (let ring = 0; ring < 3; ring += 1) {
      const turn = share * 9 + ring * 2;
      const height = aside(kit, floor, 0, reach * (0.3 + ring * 0.5));

      kit.ribbon(
        level(height, reach * (2.4 - built * 0.8 - ring * 0.3), turn, turn + 1.6, 8),
        reach * 0.18,
        ring === 1 ? SAND_DARK : SAND,
        sand * 0.7,
        0,
        { add: 0 },
      );
    }
    for (let grain = 0; grain < many(18, weight); grain += 1) {
      const travel = (share * 1.6 + noise(seed, grain)) % 1;
      const angle = noise(seed, grain + 10) * TAU + share * 8;
      const out = reach * (3 - travel * 2.4);

      kit.puff(
        [
          floor[0] + Math.cos(angle) * out,
          reach * (0.4 + travel * 0.4),
          floor[2] + Math.sin(angle) * out,
        ],
        reach * 0.12,
        grain % 2 === 0 ? SAND : SAND_DARK,
        sand,
      );
    }
    // The dune: a mound of painted sand along the ground
    for (let lump = 0; lump < 7; lump += 1) {
      const across = (lump / 6 - 0.5) * 2;

      kit.puff(
        aside(kit, floor, across * reach * (0.6 + built * 1.4), reach * 0.1, -reach * 0.3),
        reach * (0.3 + built * 0.6) * (1 - Math.abs(across) * 0.4),
        lump % 2 === 0 ? SAND : lighten(SAND, 0.1),
        shown,
      );
    }
    const rise = Math.max(0, Math.min(1, (share - 0.15) / (SHORE_BUILT - 0.15)));

    if (rise > 0) {
      const ground = aside(kit, floor, 0, reach * 0.4, -reach * 0.4);

      for (const [across, wide, tall] of [
        [-0.75, 0.32, 1],
        [0.75, 0.32, 1],
        [0, 0.42, 1.7],
      ]) {
        const base = aside(kit, ground, across * reach);
        const top = aside(kit, base, 0, tall * reach * rise);

        band(kit, base, aside(kit, top, 0, reach * 0.05), wide * reach * 2.3, SAND_DARK, shown);
        band(kit, base, top, wide * reach * 2, SAND, shown);
        for (const crenel of [-0.6, 0.6]) {
          band(
            kit,
            aside(kit, top, crenel * wide * reach),
            aside(kit, top, crenel * wide * reach, reach * 0.2),
            wide * reach * 0.6,
            SAND,
            shown,
          );
        }
      }
      const peak = aside(kit, ground, 0, reach * 1.7 * rise + reach * 0.2);

      band(kit, peak, aside(kit, peak, 0, reach * 0.6 * rise), reach * 0.1, SAND_DARK, shown);
      kit.puff(aside(kit, peak, 0, reach * 0.75 * rise), reach * 0.25, SHOVEL_RED, shown * rise);
      kit.puff(aside(kit, ground, 0, reach * 0.2), reach * 0.22, SAND_DARK, shown);
    }
    if (share < SHORE_BUILT * 0.8) {
      return;
    }
    const heal = (share - SHORE_BUILT * 0.8) / (1 - SHORE_BUILT * 0.8);

    kit.glow(at, reach * 1.8, HEAL_GREEN, swell(heal) * 0.4, 0.3);
    for (let mote = 0; mote < many(8, weight); mote += 1) {
      const lift = (heal * 1.5 + noise(seed, mote + 30)) % 1;

      kit.glow(
        aside(kit, floor, spread(seed, mote + 40) * reach * 1.6, reach * 0.4 + lift * reach * 2.6),
        reach * 0.22,
        HEAL_GREEN,
        swell(lift) * decay(heal),
        0.6,
      );
    }
    kit.ring(at, reach * (1.2 + heal * 1.6), 0.07, HEAL_GREEN, decay(heal));
  },

  Bunker(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const floor = floorOf(at);
    const closed = 1 - (1 - Math.min(1, share / BUNKER_CLOSED)) ** 2;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const radius = reach * 1.9;
    const apex = aside(kit, floor, 0, reach * 3);

    kit.glow(aside(kit, floor, 0, reach * 1.2), reach * 2 * closed, TOXIC_DRIP, shown * 0.25, 0);
    for (let index = 0; index < BUNKER_ARMS; index += 1) {
      const angle = (index / BUNKER_ARMS) * TAU;
      const base: Spot = [
        floor[0] + Math.cos(angle) * radius,
        0,
        floor[2] + Math.sin(angle) * radius,
      ];
      const path: Spot[] = [];

      for (let step = 0; step <= 10; step += 1) {
        const along = (step / 10) * closed * 0.96;
        const spot = toward(base, apex, along);
        const bulge = Math.sin(Math.PI * along);

        path.push([
          spot[0] + Math.cos(angle) * radius * 0.35 * bulge,
          spot[1] + reach * 0.7 * bulge,
          spot[2] + Math.sin(angle) * radius * 0.35 * bulge,
        ]);
      }
      strand(kit, path, reach * 0.34, TOXAPEX_VIOLET, TOXAPEX_DARK, shown);
      for (const step of [3, 6, 9]) {
        const spot = path[step];
        const out: Spot = [
          spot[0] + Math.cos(angle) * reach * 0.3,
          spot[1],
          spot[2] + Math.sin(angle) * reach * 0.3,
        ];

        kit.shard(out, reach * 0.28, angle, TOXAPEX_SPIKE, shown);
        if (share > 0.2) {
          const drip = (share * 1.8 + noise(seed, index * 3 + step)) % 1;

          kit.glow(
            [out[0], Math.max(0, out[1] - drip * reach * 1.3), out[2]],
            reach * 0.14,
            TOXIC_DRIP,
            shown * decay(drip),
            0.4,
          );
          kit.puff(
            [out[0], Math.max(0, out[1] - drip * reach * 1.3), out[2]],
            reach * 0.08,
            TOXAPEX_DARK,
            shown * decay(drip) * 0.6,
          );
        }
      }
    }
    if (share > BUNKER_CLOSED) {
      const shut = (share - BUNKER_CLOSED) / (1 - BUNKER_CLOSED);

      kit.ripple(floor, radius * (1 + shut * 0.8), 0.08, TOXIC_DRIP, decay(shut));
    }
  },

  Icehammer(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const swing = Math.min(1, share / HAMMER_LANDS) ** 2;
    const start = aside(kit, at, reach * 2.4, reach * 3.8);
    const end = aside(kit, at, 0, reach * 0.8, -reach * 0.3);
    const spotOf = (along: number): Spot =>
      aside(kit, toward(start, end, along), Math.sin(Math.PI * along) * reach * 0.9);
    const fist = spotOf(swing);
    const big = reach * 1.3;
    const held = late(share, 0.55);

    for (let smear = 1; smear <= 4; smear += 1) {
      kit.glow(
        spotOf(Math.max(0, swing - smear * 0.08)),
        big * (1 - smear * 0.12),
        HAMMER_FROST,
        held * 0.3 * (1 - smear * 0.2),
        0.2,
      );
    }
    kit.puff(fist, big * 1.12, HAMMER_DARK, held * 0.7);
    kit.puff(fist, big, HAMMER_FUR, held);
    band(
      kit,
      aside(kit, fist, 0, -big * 0.9),
      aside(kit, fist, 0, -big * 0.1),
      big * 0.2,
      HAMMER_DARK,
      held,
    );
    for (let spot = 0; spot < 5; spot += 1) {
      const angle = Math.PI * 0.15 + spot * 0.4;

      kit.puff(
        aside(kit, fist, Math.cos(angle) * big * 0.6, Math.sin(angle) * big * 0.55),
        big * 0.2,
        HAMMER_FROST,
        held,
      );
    }
    for (const way of [-0.6, -0.3, 0.3, 0.6]) {
      kit.shard(
        aside(kit, fist, way * big, -big * 0.85),
        big * 0.2,
        Math.PI / 2,
        HAMMER_FROST,
        held,
        { add: 0.2 },
      );
    }
    if (share < HAMMER_LANDS) {
      return;
    }
    const hit = (share - HAMMER_LANDS) / (1 - HAMMER_LANDS);

    kit.glow(at, reach * (1 + hit * 1.6), '#ffffff', decay(hit * 2) * 0.9);
    kit.glow(at, reach * (1.3 + hit * 1.6), HAMMER_FROST, decay(hit) * 0.6);
    for (let piece = 0; piece < many(14, weight); piece += 1) {
      kit.shard(
        thrown(at, seed, piece, hit, reach * 3, reach * 1.6),
        reach * 0.24 * (0.7 + noise(seed, piece + 60) * 0.6),
        noise(seed, piece) * TAU + hit * 4,
        piece % 3 === 0 ? '#ffffff' : HAMMER_FROST,
        decay(hit),
        { add: 0.2 },
      );
    }
    sparks(kit, at, reach * (1.6 + hit * 2), 12, seed + 2, hit, HAMMER_FROST, decay(hit));
    kit.ripple(floorOf(at), reach * (1.2 + hit * 3), 0.1, HAMMER_FROST, decay(hit));
  },

  Floral(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const settle = 1 - (1 - Math.min(1, share / LEI_SETTLES)) ** 2;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const centre = aside(kit, at, 0, reach * 2.6 - settle * reach * 2.6);
    const radius = reach * 1.5;

    kit.glow(centre, reach * 1.6, LEI_COLOURS[0], shown * 0.3, 0);
    kit.ribbon(level(centre, radius, 0, TAU, 24), reach * 0.12, LEI_VINE, shown, 0, { add: 0 });
    for (let bloom = 0; bloom < LEI_FLOWERS; bloom += 1) {
      const angle = (bloom / LEI_FLOWERS) * TAU + share * 3;

      flower(
        kit,
        [centre[0] + Math.cos(angle) * radius, centre[1], centre[2] + Math.sin(angle) * radius],
        reach * 0.42,
        angle,
        LEI_COLOURS[bloom % LEI_COLOURS.length],
        shown,
      );
    }
    if (share < LEI_SETTLES * 0.8) {
      return;
    }
    const heal = (share - LEI_SETTLES * 0.8) / (1 - LEI_SETTLES * 0.8);

    kit.glow(at, reach * 1.8, LEI_GOLD, swell(heal) * 0.5, 0.3);
    for (let mote = 0; mote < many(8, weight); mote += 1) {
      const lift = (heal * 1.5 + noise(seed, mote)) % 1;
      const spot = aside(
        kit,
        at,
        spread(seed, mote + 20) * reach * 1.4,
        -reach * 0.6 + lift * reach * 2.6,
      );

      if (mote % 2 === 0) {
        kit.star(spot, reach * 0.4, lift * 4, LEI_GOLD, swell(lift) * decay(heal));
      } else {
        kit.leaf(spot, reach * 0.4, lift * 5, LEI_COLOURS[0], swell(lift) * decay(heal));
      }
    }
  },

  Thread(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const shot = Math.min(1, share / THREAD_LANDS);
    const shown = late(share, 0.8);

    for (let string = 0; string < 3; string += 1) {
      const end = aside(kit, at, (string - 1) * reach * 0.6, -(string - 1) * reach * 0.3);
      const head = toward(stage.source, end, shot);
      const path: Spot[] = [];

      for (let step = 0; step <= 10; step += 1) {
        const bow = Math.sin((step / 10) * Math.PI);

        path.push(
          aside(
            kit,
            toward(stage.source, head, step / 10),
            bow * reach * 0.3 * (string - 1),
            -bow * reach * 0.2,
          ),
        );
      }
      strand(kit, path, reach * 0.09, THREAD_PURPLE, THREAD_SHADE, shown);
      kit.glow(head, reach * 0.25, VENOM_BEAD, shown, 0.4);
      for (let bead = 1; bead < 4; bead += 1) {
        const spot = path[Math.floor((bead / 4) * 10)];
        const drip = (share * 1.5 + noise(seed, string * 4 + bead)) % 1;

        kit.glow(
          aside(kit, spot, 0, -drip * reach * 0.8),
          reach * 0.14,
          VENOM_BEAD,
          shown * decay(drip),
          0.4,
        );
      }
    }
    if (share < THREAD_LANDS) {
      return;
    }
    const bind = (share - THREAD_LANDS) / (1 - THREAD_LANDS);
    const wound = Math.min(1, bind * 2.5);
    const tight = 1 - Math.min(1, bind * 2) * 0.35;

    kit.glow(at, reach * 1.4, THREAD_PURPLE, swell(bind) * 0.3, 0);
    for (let loop = 0; loop < 3; loop += 1) {
      strand(
        kit,
        level(
          aside(kit, at, 0, -(loop - 1) * reach * 0.55),
          reach * 1.3 * tight,
          loop,
          loop + wound * TAU,
        ),
        reach * 0.1,
        THREAD_PURPLE,
        THREAD_SHADE,
        shown,
      );
    }
    for (let bead = 0; bead < many(6, weight); bead += 1) {
      const drip = (bind * 1.6 + noise(seed, bead + 30)) % 1;

      kit.glow(
        aside(kit, at, spread(seed, bead + 40) * reach * 1.3, -reach * 0.5 - drip * reach * 0.8),
        reach * 0.16,
        VENOM_BEAD,
        shown * swell(drip),
        0.4,
      );
    }
  },

  Purify(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const close = 1 - (1 - Math.min(1, share / PURIFY_CLOSES)) ** 2;
    const shell = Math.min(1, share * 8) * late(share, PURIFY_SPARKLES);
    const radius = reach * (3 - close * 1.3);

    kit.glow(at, radius, PURIFY_CLEAR, shell * 0.3, 0);
    kit.bubble(at, radius, PURIFY_CLEAR, shell);
    kit.ring(at, radius * 1.04, 0.04, PURIFY_PINK, shell * 0.6);
    for (let wisp = 0; wisp < 6; wisp += 1) {
      const out = (share - 0.15 - noise(seed, wisp) * 0.15) / 0.5;

      if (out <= 0 || out >= 1) {
        continue;
      }
      const angle = (wisp / 6) * TAU + noise(seed, wisp + 10);
      const spot = aside(
        kit,
        at,
        Math.cos(angle) * reach * (0.3 + out * 2.4),
        Math.sin(angle) * reach * (0.2 + out * 1.6) + out * reach * 0.8,
      );

      kit.puff(spot, reach * 0.6 * decay(out * 0.7), PURIFY_MURK, swell(out) * 0.4);
      smoke(kit, spot, reach * 0.6, 2, seed + wisp, out, PURIFY_MURK, decay(out) * 0.3);
    }
    if (share < PURIFY_SPARKLES - 0.1) {
      return;
    }
    const clean = (share - PURIFY_SPARKLES + 0.1) / (1 - PURIFY_SPARKLES + 0.1);

    kit.ring(at, reach * (1.7 + clean * 1.6), 0.07, PURIFY_CLEAR, decay(clean));
    for (let glint = 0; glint < many(6, weight); glint += 1) {
      const angle = noise(seed, glint + 20) * TAU;
      const out = reach * (0.6 + noise(seed, glint + 30) * 1.4);

      kit.star(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        reach * 0.55 * swell(Math.min(1, clean * 1.4)),
        clean * 3,
        glint % 2 === 0 ? '#ffffff' : PURIFY_PINK,
        decay(clean * 0.8),
      );
    }
  },

  Revelation(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const from = stage.source;
    const ground = floorOf(from);
    const light = lighten(paint.color, 0.5);
    const dancing = share < REVELATION_THROWN ? 1 : decay((share - REVELATION_THROWN) / 0.25);

    for (let step = 0; step < 6; step += 1) {
      if (share < (step / 6) * REVELATION_THROWN * 0.8) {
        continue;
      }
      const angle = (step / 6) * TAU;
      const spot: Spot = [
        ground[0] + Math.cos(angle) * reach * 1.5,
        0,
        ground[2] + Math.sin(angle) * reach * 1.5,
      ];

      kit.ripple(spot, reach * 0.32, 0.2, light, dancing * 0.9);
      kit.pool(spot, reach * 0.3, paint.color, dancing * 0.6);
    }
    for (let feather = 0; feather < many(8, weight); feather += 1) {
      const climb = (share * 1.8 + feather / 8) % 1;
      const angle = climb * Math.PI * 3 + feather;
      const out = reach * 1.5 * (1 - climb * 0.3);

      kit.leaf(
        [ground[0] + Math.cos(angle) * out, climb * reach * 3.2, ground[2] + Math.sin(angle) * out],
        reach * 0.8,
        angle,
        feather % 2 === 0 ? paint.color : light,
        dancing * swell(climb),
      );
    }
    sickle(
      kit,
      from,
      reach * 1.8,
      share * 10,
      share * 10 + 2.2,
      reach * 0.24,
      light,
      dancing * 0.6,
      0.6,
    );
    if (share < REVELATION_THROWN) {
      return;
    }
    if (share < REVELATION_LANDS) {
      const flight = (share - REVELATION_THROWN) / (REVELATION_LANDS - REVELATION_THROWN);
      const head = toward(from, at, flight);

      kit.trail(toward(from, at, Math.max(0, flight - 0.3)), head, reach * 0.5, light, 0.9);
      kit.puff(head, reach * 1.1, paint.color, 0.7);
      kit.glow(head, reach * 1.1, paint.color, 1, 0.6);
      return;
    }
    const hit = (share - REVELATION_LANDS) / (1 - REVELATION_LANDS);

    kit.glow(at, reach * (1 + hit * 1.8), '#ffffff', decay(hit * 2));
    kit.glow(at, reach * (1.4 + hit * 1.8), paint.color, decay(hit) * 0.8);
    kit.ring(at, reach * (1.2 + hit * 2.8), 0.08, light, decay(hit));
    sparks(kit, at, reach * (1.6 + hit * 2), 12, seed, hit, light, decay(hit));
    for (let feather = 0; feather < many(8, weight); feather += 1) {
      kit.leaf(
        thrown(at, seed, feather + 50, hit, reach * 2.6, reach * 1.4),
        reach * 0.7,
        hit * 3 + feather,
        feather % 2 === 0 ? paint.color : light,
        decay(hit),
      );
    }
  },

  Flyingpress(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const floor = floorOf(at);

    if (share < PRESS_LANDS) {
      const fall = (share / PRESS_LANDS) ** 1.6;
      const body = aside(kit, at, -reach * 2.4 * (1 - fall), reach * 5 * (1 - fall));
      const span = reach * (1.6 + swell(fall) * 0.4);

      // The wings painted solid so they read on a bright ground
      for (const side of [-1, 1]) {
        kit.ribbon(
          [
            body,
            aside(kit, body, side * span * 0.6, reach * 0.3),
            aside(kit, body, side * span, reach * 0.9),
          ],
          reach * 0.5,
          PRESS_GREEN,
          1,
          0,
          { add: 0 },
        );
      }
      kit.puff(body, reach * 0.6, PRESS_ORANGE, 1);
      for (let line = 0; line < 4; line += 1) {
        const off = (line - 1.5) * reach * 0.5;

        kit.trail(
          aside(kit, body, off - reach * 1.2, reach * 2.4),
          aside(kit, body, off, reach * 0.6),
          reach * 0.06,
          '#ffffff',
          0.7 * fall,
        );
      }
      return;
    }
    const hit = (share - PRESS_LANDS) / (1 - PRESS_LANDS);

    kit.glow(at, reach * (1 + hit * 2), '#fff4dc', decay(hit * 2.5));
    kit.star(at, reach * (1.2 + hit * 1.6), hit * 2, PRESS_ORANGE, decay(hit));
    sparks(kit, at, reach * (1.4 + hit * 2), 10, seed, hit, PRESS_GREEN, decay(hit));
    for (let wave = 0; wave < 2; wave += 1) {
      kit.ripple(
        floor,
        reach * (0.8 + hit * (2.4 + wave)),
        0.1,
        wave === 0 ? PRESS_ORANGE : PRESS_GREEN,
        decay(hit) * (1 - wave * 0.3),
      );
    }
    debris(kit, at, reach * 2, 10, seed + 1, hit, lighten(PRESS_GREEN, 0.4), decay(hit) * 0.8);
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default kalosSignatures;
