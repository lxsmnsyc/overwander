import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { SIGNATURE_SCALE } from '../effect/galar';
import {
  BALL_DARK,
  BALL_WHITE,
  BERRY_COLOURS,
  BERRY_LEAF,
  BOOST_WARM,
  CHEEKS_FULL,
  CHEEK_BERRIES,
  CHEEK_CREAM,
  CHERRY_RED,
  COURT_BLUE,
  COURT_LANDS,
  COURT_RED,
  COURT_SWAPPED,
  CREAM_PINK,
  CREAM_WHITE,
  CRY_RED,
  DECORATE_PIPED,
  DECORATE_SWEETS,
  DRUM_BEATS,
  DRUM_GAP,
  DRUM_ROOTS,
  GREEDENT_BROWN,
  JAW_DARK,
  JAW_HOLDS,
  JAW_SHUTS,
  JAW_TEAL,
  JAW_TEETH,
  LOCK_GOLD,
  OCTO_ARMS,
  OCTO_DARK,
  OCTO_ORANGE,
  OCTO_SUCKER,
  OCTO_WRAPPED,
  POWDER_FALLS,
  POWDER_GLITTER,
  POWDER_PINK,
  POWDER_VIOLET,
  PYRO_CATCHES,
  PYRO_FLAME,
  PYRO_HOT,
  PYRO_LANDS,
  PYRO_PEBBLE,
  RETREAT_FORMED,
  RETREAT_SHIELDS,
  ROOT_BROWN,
  ROOT_LEAF,
  SHIELD_DARK,
  SHIELD_GOLD,
  SIGHT_RED,
  SNIPE_FOAM,
  SNIPE_LANDS,
  SNIPE_LOCKS,
  SNIPE_WATER,
  STUMP_BROWN,
  STUMP_DARK,
  STUMP_RINGS,
  SWEET_SHADE,
  SWEET_STAR,
  TEACUP_RIM,
  TEACUP_WHITE,
  TEA_BERRY_IN,
  TEA_BROWN,
  TEA_GLOW,
  TEA_STEAM,
  TEA_TIPPED,
  WHISTLE_FLASH,
} from '../effect/galar-signatures';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, arcing, chevron, debris, sparks } from './pieces';
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

/** A line painted dark under a lighter one, so it reads on any ground */
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
  kit.ribbon(path, width * 1.8, shade, alpha * 0.85, 0, { add: 0 });
  kit.ribbon(path, width, colour, alpha, 0, { add: 0.2 });
}

/** An oval drawn round a spot on the picture as a painted band */
function loop(
  kit: EffectBatch,
  centre: Spot,
  across: number,
  up: number,
  width: number,
  colour: string,
  alpha: number,
  add = 0,
): void {
  const path: Spot[] = [];

  for (let step = 0; step <= 20; step += 1) {
    const angle = (step / 20) * TAU;

    path.push(aside(kit, centre, Math.cos(angle) * across, Math.sin(angle) * up));
  }
  kit.ribbon(path, width, colour, alpha, 0, { add });
}

/** A berry: a round fruit with a leaf on top, painted */
function berry(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  kit.puff(at, size * 1.15, mix(colour, '#000000', 0.5), alpha);
  kit.puff(at, size, colour, alpha);
  kit.leaf(aside(kit, at, size * 0.35, size * 1.05), size * 0.9, 0.8, BERRY_LEAF, alpha);
}

/** A football: white with a dark patch in the middle and five round its edge */
function football(kit: EffectBatch, at: Spot, size: number, turn: number, alpha: number): void {
  kit.puff(at, size * 1.12, BALL_DARK, alpha);
  kit.puff(at, size, BALL_WHITE, alpha);
  kit.puff(at, size * 0.34, BALL_DARK, alpha);
  for (let patch = 0; patch < 5; patch += 1) {
    const angle = turn + (patch / 5) * TAU;

    kit.puff(
      aside(kit, at, Math.cos(angle) * size * 0.72, Math.sin(angle) * size * 0.72),
      size * 0.2,
      BALL_DARK,
      alpha * 0.9,
    );
  }
}

/** A soldier's shield: a gold face with a dark rim, a pointed foot and a red boss */
function shield(kit: EffectBatch, at: Spot, size: number, alpha: number): void {
  if (alpha <= 0) {
    return;
  }
  const top = aside(kit, at, 0, size * 0.7);
  const foot = aside(kit, at, 0, -size * 0.15);
  const point = aside(kit, at, 0, -size * 0.5);

  kit.ribbon([top, foot], size * 1.35, SHIELD_DARK, alpha, 0, { add: 0 });
  kit.shard(point, size * 0.75, Math.PI / 4, SHIELD_DARK, alpha);
  kit.ribbon([aside(kit, top, 0, -size * 0.1), foot], size * 1.1, SHIELD_GOLD, alpha, 0, {
    add: 0.1,
  });
  kit.shard(point, size * 0.55, Math.PI / 4, SHIELD_GOLD, alpha);
  kit.puff(aside(kit, at, 0, size * 0.2), size * 0.22, CRY_RED, alpha);
}

/** One half of a turtle's jaw: a dark dome over a row of teeth, `way` -1 for the upper */
function jawHalf(
  kit: EffectBatch,
  at: Spot,
  width: number,
  depth: number,
  way: 1 | -1,
  alpha: number,
): void {
  const dome: Spot[] = [];
  const shell: Spot[] = [];

  for (let step = 0; step <= 8; step += 1) {
    const bulge = 0.4 + 0.6 * Math.sin((Math.PI * step) / 8);
    const right = -width + (width * 2 * step) / 8;

    dome.push(aside(kit, at, right, -way * depth * 0.45 * bulge));
    shell.push(aside(kit, at, right * 0.9, -way * depth * (0.45 * bulge + 0.42)));
  }
  kit.ribbon(dome, depth * 0.95, JAW_DARK, alpha, 0, { add: 0 });
  kit.ribbon(shell, depth * 0.16, JAW_TEAL, alpha, 0, { add: 0.2 });
  for (let tooth = 0; tooth < 5; tooth += 1) {
    kit.shard(
      aside(kit, at, -width * 0.75 + (tooth / 4) * width * 1.5, way * depth * 0.12),
      width * 0.16,
      Math.PI / 4,
      JAW_TEETH,
      alpha,
    );
  }
}

/** A point on a teacup, from the cup's own frame turned `lean` about its foot */
function onCup(
  kit: EffectBatch,
  at: Spot,
  size: number,
  lean: number,
  right: number,
  up: number,
): Spot {
  const lift = up + size * 0.55;

  return aside(
    kit,
    at,
    right * Math.cos(lean) - lift * Math.sin(lean),
    right * Math.sin(lean) + lift * Math.cos(lean) - size * 0.55,
  );
}

/** A teacup on its saucer, the cup leaning over by `lean` */
function teacup(
  kit: EffectBatch,
  at: Spot,
  size: number,
  lean: number,
  tea: number,
  alpha: number,
): void {
  const saucer = aside(kit, at, 0, -size * 0.65);

  strand(
    kit,
    [aside(kit, saucer, -size * 1.25, 0), aside(kit, saucer, size * 1.25, 0)],
    size * 0.3,
    TEACUP_WHITE,
    TEACUP_RIM,
    alpha,
  );
  loop(
    kit,
    onCup(kit, at, size, lean, size * 0.8, size * 0.05),
    size * 0.28,
    size * 0.28,
    size * 0.14,
    TEACUP_RIM,
    alpha,
  );
  const rim = [
    onCup(kit, at, size, lean, -size * 0.6, size * 0.1),
    onCup(kit, at, size, lean, size * 0.6, size * 0.1),
  ];

  kit.ribbon(rim, size * 1.15, TEACUP_RIM, alpha, 0, { add: 0 });
  kit.ribbon(rim, size * 0.95, TEACUP_WHITE, alpha, 0, { add: 0 });
  kit.puff(onCup(kit, at, size, lean, 0, -size * 0.3), size * 0.5, TEACUP_WHITE, alpha);
  if (tea > 0) {
    kit.ribbon(
      [
        onCup(kit, at, size, lean, -size * 0.55, size * 0.52),
        onCup(kit, at, size, lean, size * 0.55, size * 0.52),
      ],
      size * 0.2,
      TEA_BROWN,
      alpha * tea,
      0,
      { add: 0 },
    );
  }
}

/** The far side of the field: the first body reached apart from the caster */
function farSide(kit: EffectBatch, stage: LitStage, reach: number): Spot {
  const [x, y, z] = stage.source;

  for (const target of stage.targets) {
    if (Math.hypot(target[0] - x, target[1] - y, target[2] - z) > reach) {
      return target;
    }
  }
  return aside(kit, stage.source, 0, 0, reach * 8);
}

const galarSignatures = {
  Snipe(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const lock = Math.min(1, share / SNIPE_LOCKS);
    const sighted = Math.min(1, share * 12) * late(share, SNIPE_LANDS + 0.1);
    const radius = reach * (2.6 - lock * 1.4);
    const turn = (1 - lock) * Math.PI * 0.5;
    const finger = aside(kit, stage.source, reach * 0.5, reach * 0.6);

    // The sight painted, so its red holds on a bright ground
    loop(kit, at, radius, radius, reach * 0.22, mix(SIGHT_RED, '#000000', 0.4), sighted * 0.7);
    loop(kit, at, radius, radius, reach * 0.12, SIGHT_RED, sighted, 0.3);
    for (let tick = 0; tick < 4; tick += 1) {
      const angle = turn + (tick * Math.PI) / 2;

      kit.ribbon(
        [
          aside(kit, at, Math.cos(angle) * radius * 0.55, Math.sin(angle) * radius * 0.55),
          aside(kit, at, Math.cos(angle) * radius * 1.3, Math.sin(angle) * radius * 1.3),
        ],
        reach * 0.12,
        SIGHT_RED,
        sighted,
        0,
        { add: 0.3 },
      );
    }
    if (lock >= 1) {
      kit.puff(at, reach * 0.22, SIGHT_RED, sighted);
    }
    if (share < SNIPE_LOCKS) {
      kit.glow(finger, reach * (0.2 + lock * 0.3), SNIPE_FOAM, lock);
      return;
    }
    const flight = Math.min(1, (share - SNIPE_LOCKS) / (SNIPE_LANDS - SNIPE_LOCKS));
    const head = toward(finger, at, flight);
    const trailing = late(share, 0.6);

    kit.ribbon([finger, head], reach * 0.18, SNIPE_WATER, trailing * 0.8, share * 6, { add: 0.3 });
    kit.ribbon([toward(finger, head, 0.4), head], reach * 0.07, SNIPE_FOAM, trailing);
    if (flight < 1) {
      kit.puff(head, reach * 0.3, SNIPE_WATER, 1);
      kit.glow(head, reach * 0.35, SNIPE_FOAM, 1, 0.6);
      return;
    }
    const hit = (share - SNIPE_LANDS) / (1 - SNIPE_LANDS);

    kit.glow(at, reach * (0.5 + hit * 0.6), SNIPE_FOAM, decay(hit * 1.5));
    kit.ring(at, reach * (0.4 + hit * 1.2), 0.12, SNIPE_WATER, decay(hit));
    for (let drop = 0; drop < many(10, weight); drop += 1) {
      kit.puff(
        thrown(at, seed, drop, hit, reach * 1.4, reach * 0.8),
        reach * 0.12,
        SNIPE_WATER,
        decay(hit),
      );
    }
    sparks(kit, at, reach * (0.8 + hit), 8, seed + 1, hit, SNIPE_FOAM, decay(hit));
  },

  Jawlock(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shut = Math.min(1, share / JAW_SHUTS) ** 2;
    const held = Math.min(1, share * 10) * late(share, JAW_HOLDS);
    const shake = share > JAW_SHUTS ? Math.sin(share * 70) * reach * 0.08 : 0;
    const gap = reach * (2.2 - shut * 1.75);
    const width = reach * 2.4;

    jawHalf(kit, aside(kit, at, shake, gap), width, reach * 1.3, -1, held);
    jawHalf(kit, aside(kit, at, shake, -gap), width, reach, 1, held);
    if (share < JAW_SHUTS) {
      return;
    }
    const bite = (share - JAW_SHUTS) / (1 - JAW_SHUTS);
    const lock = aside(kit, at, reach * 2.2, reach * 1.8);

    sparks(kit, at, reach * (1.6 + bite * 1.6), 10, seed, bite, JAW_TEETH, decay(bite * 2.5));
    kit.ring(at, reach * (1.2 + bite * 2), 0.08, JAW_TEAL, decay(bite * 2));
    // The padlock: a dark shackle over a gold body
    loop(
      kit,
      aside(kit, lock, 0, reach * 0.3),
      reach * 0.35,
      reach * 0.35,
      reach * 0.16,
      SHIELD_DARK,
      held,
    );
    kit.ribbon(
      [aside(kit, lock, 0, reach * 0.3), aside(kit, lock, 0, -reach * 0.5)],
      reach * 1.1,
      SHIELD_DARK,
      held,
      0,
      { add: 0 },
    );
    kit.ribbon(
      [aside(kit, lock, 0, reach * 0.25), aside(kit, lock, 0, -reach * 0.45)],
      reach * 0.9,
      LOCK_GOLD,
      held,
      0,
      { add: 0.1 },
    );
    kit.star(
      aside(kit, lock, reach * 0.5, reach * 0.4),
      reach * 0.7,
      share * 4,
      '#ffffff',
      swell(Math.min(1, bite * 2)) * held,
    );
  },

  Cheeks(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const full = Math.min(1, share / CHEEKS_FULL);
    const shown = late(share, 0.8);
    const munch = share > CHEEKS_FULL && share < 0.7 ? Math.abs(Math.sin(share * 45)) * 0.14 : 0;
    const cheek = reach * (0.35 + full * 0.4) * (1 - munch);

    for (const side of [-1, 1]) {
      const spot = aside(kit, at, side * reach * 0.75, reach * 0.1);

      kit.puff(spot, cheek * 1.12, GREEDENT_BROWN, shown);
      kit.puff(spot, cheek, CHEEK_CREAM, shown);
    }
    for (let one = 0; one < CHEEK_BERRIES; one += 1) {
      const leave = (one / CHEEK_BERRIES) * (CHEEKS_FULL - 0.25);
      const flight = (share - leave) / 0.25;

      if (flight < 0 || flight > 1) {
        continue;
      }
      const side = one % 2 === 0 ? -1 : 1;
      const angle = Math.PI / 2 - side * (0.5 + noise(seed, one) * 0.8);
      const from = aside(kit, at, Math.cos(angle) * reach * 3.4, Math.sin(angle) * reach * 3);
      const to = aside(kit, at, side * reach * 0.75, reach * 0.1);

      berry(
        kit,
        arcing(from, to, flight, reach * 0.8),
        reach * 0.28 * (1 - flight * 0.4),
        BERRY_COLOURS[one % BERRY_COLOURS.length],
        1,
      );
    }
    if (munch > 0) {
      debris(kit, at, reach * 0.8, 6, seed + Math.floor(share * 20), 0.5, GREEDENT_BROWN, 0.8);
    }
    const boost = Math.max(0, (share - CHEEKS_FULL) / (1 - CHEEKS_FULL));

    if (boost <= 0) {
      return;
    }
    kit.glow(at, reach * 1.4, BOOST_WARM, swell(boost) * 0.5, 0.2);
    for (let mark = 0; mark < 3; mark += 1) {
      const held = (boost * 1.4 + mark / 3) % 1;

      chevron(
        kit,
        aside(kit, at, 0, (held * 2 - 1) * reach),
        reach * 0.8,
        1,
        lighten(BOOST_WARM, 0.2),
        Math.min(1, swell(held) * 1.8) * (swell(boost) + 0.2),
        reach * 0.14,
      );
    }
  },

  Retreat(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const floor = floorOf(at);
    const shown = late(share, 0.8);

    for (let one = 0; one < RETREAT_SHIELDS; one += 1) {
      const leave = (one / RETREAT_SHIELDS) * (RETREAT_FORMED - 0.2);
      const run = Math.min(1, (share - leave) / 0.2);

      if (run < 0) {
        continue;
      }
      const angle = (one / RETREAT_SHIELDS) * TAU + Math.PI / 2;
      const side = Math.cos(angle) >= 0 ? 1 : -1;
      const step = Math.abs(Math.sin(run * Math.PI * 4)) * reach * 0.15 * decay(run);
      const spot = aside(
        kit,
        floor,
        Math.cos(angle) * reach * 1.6 + side * decay(run) ** 1.5 * reach * 3.5,
        reach * 0.5 + step,
        Math.sin(angle) * reach * 1.6,
      );

      shield(kit, spot, reach * 0.55, shown);
    }
    if (share < RETREAT_FORMED) {
      return;
    }
    const cry = (share - RETREAT_FORMED) / (1 - RETREAT_FORMED);

    for (let wave = 0; wave < 2; wave += 1) {
      const out = Math.max(0, cry * 1.4 - wave * 0.25);

      if (out > 0 && out < 1) {
        kit.ring(at, reach * (0.8 + out * 2.4), 0.1, CRY_RED, decay(out), { add: 0.4 });
      }
    }
    sparks(
      kit,
      aside(kit, at, 0, reach * 0.6),
      reach * (1 + cry),
      8,
      seed,
      cry,
      lighten(CRY_RED, 0.3),
      decay(cry * 1.5),
    );
    for (let mark = 0; mark < 3; mark += 1) {
      const held = (cry * 1.4 + mark / 3) % 1;

      chevron(
        kit,
        aside(kit, at, 0, (held * 2 - 1) * reach),
        reach * 0.8,
        1,
        SHIELD_GOLD,
        Math.min(1, swell(held) * 1.8) * (swell(cry) + 0.2),
        reach * 0.16,
      );
    }
  },

  Powder(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const top = aside(kit, at, 0, reach * 2.8);
    const pouring = Math.min(1, share * 10) * late(share, POWDER_FALLS - 0.1);

    kit.puff(top, reach * 0.7, POWDER_PINK, pouring * 0.7);
    kit.glow(top, reach * 0.8, POWDER_VIOLET, pouring * 0.5, 0.4);
    for (let pinch = 0; pinch < 3; pinch += 1) {
      kit.star(
        aside(kit, top, (pinch - 1) * reach * 0.45, 0),
        reach * 0.3,
        share * 6 + pinch,
        POWDER_GLITTER,
        pouring,
      );
    }
    for (let grain = 0; grain < many(26, weight); grain += 1) {
      const fall = (share * 1.8 + noise(seed, grain)) % 1;
      const alive = share < POWDER_FALLS ? 1 : decay((share - POWDER_FALLS) / 0.2);
      const spot = aside(
        kit,
        top,
        spread(seed, grain + 30) * reach * (0.3 + fall * 1.3),
        -fall * reach * 3.4,
      );

      if (grain % 4 === 0) {
        kit.star(spot, reach * 0.22, share * 8 + grain, POWDER_GLITTER, swell(fall) * alive);
      } else {
        // Painted, so the colour holds on snow
        kit.puff(
          spot,
          reach * 0.09,
          grain % 2 === 0 ? POWDER_PINK : POWDER_VIOLET,
          swell(fall) * alive,
        );
      }
    }
    const turned = Math.max(0, (share - 0.35) / 0.65);

    if (turned <= 0) {
      return;
    }
    kit.glow(at, reach * 1.3, mix(POWDER_PINK, POWDER_VIOLET, turned), swell(turned) * 0.6, 0.2);
    kit.ring(at, reach * (0.9 + turned * 1.4), 0.08, POWDER_VIOLET, decay(turned), { add: 0.4 });
    for (let glint = 0; glint < 6; glint += 1) {
      const twinkle = (turned * 2.2 + noise(seed, glint + 60)) % 1;

      kit.star(
        aside(
          kit,
          at,
          spread(seed, glint + 70) * reach * 1.6,
          spread(seed, glint + 80) * reach * 1.3,
        ),
        reach * 0.4,
        glint,
        POWDER_GLITTER,
        swell(twinkle) * decay(turned * 0.8),
      );
    }
  },

  Teatime(kit, stage, share, { seed, weight }) {
    const at = stage.source;
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const cup = aside(kit, at, reach * 1.5, reach * 1.4);
    const size = reach * 0.6;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const tip = Math.min(1, Math.max(0, (share - TEA_BERRY_IN) / (TEA_TIPPED - TEA_BERRY_IN)));
    const lean = tip * 1.1;
    const pour = Math.max(0, (share - TEA_BERRY_IN - 0.08) / 0.4);

    teacup(kit, cup, size, lean, decay(pour), shown);
    for (let wisp = 0; wisp < 3; wisp += 1) {
      const rise = (share * 1.6 + wisp / 3) % 1;
      const path: Spot[] = [];

      for (let step = 0; step <= 5; step += 1) {
        path.push(
          aside(
            kit,
            cup,
            (wisp - 1) * reach * 0.2 + Math.sin(step + share * 14 + wisp) * reach * 0.1,
            reach * 0.5 + rise * reach * 1.2 + step * reach * 0.14,
          ),
        );
      }
      kit.ribbon(path, reach * 0.08, TEA_STEAM, swell(rise) * shown * 0.6, 0, { add: 0.3 });
    }
    if (share < TEA_BERRY_IN) {
      const pop = share / TEA_BERRY_IN;

      berry(
        kit,
        arcing(
          aside(kit, cup, reach * 1.6, reach * 0.4),
          aside(kit, cup, 0, reach * 0.3),
          pop,
          reach * 1.4,
        ),
        reach * 0.22,
        BERRY_COLOURS[0],
        1,
      );
    } else {
      kit.ring(
        aside(kit, cup, 0, reach * 0.3),
        reach * (0.3 + tip * 0.6),
        0.1,
        TEA_BROWN,
        decay(tip * 2),
        {
          add: 0.2,
        },
      );
    }
    if (pour > 0 && pour < 1) {
      const lip = onCup(kit, cup, size, lean, -size * 0.6, size * 0.55);
      const land = aside(kit, at, reach * 0.3, reach * 0.4);

      strand(
        kit,
        [lip, aside(kit, lip, -reach * 0.2, -reach * 0.4), toward(lip, land, 0.7), land],
        reach * 0.14,
        TEA_BROWN,
        mix(TEA_BROWN, '#000000', 0.4),
        swell(pour),
      );
    }
    const cosy = Math.max(0, (share - 0.35) / 0.65);

    if (cosy <= 0) {
      return;
    }
    kit.glow(at, reach * (1.2 + cosy * 0.6), TEA_GLOW, swell(cosy) * 0.6, 0.2);
    kit.ripple(floorOf(at), reach * (1.2 + cosy), 0.1, TEA_GLOW, swell(cosy) * 0.6);
    sparks(kit, at, reach * 1.8, many(8, weight), seed, cosy, lighten(TEA_GLOW, 0.3), decay(cosy));
  },

  Octolock(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const wrap = Math.min(1, share / OCTO_WRAPPED);
    const shown = late(share, 0.78);
    const squeeze =
      share > OCTO_WRAPPED ? Math.abs(Math.sin((share - OCTO_WRAPPED) * 22)) * 0.18 : 0;

    for (let arm = 0; arm < OCTO_ARMS; arm += 1) {
      const start = (arm / OCTO_ARMS) * TAU + noise(seed, arm) * 0.3;
      const way = arm % 2 === 0 ? 1 : -1;
      const path: Spot[] = [];
      const steps = Math.max(2, Math.ceil(wrap * 14));

      for (let step = 0; step <= steps; step += 1) {
        const along = (step / 14) * Math.min(1, wrap * 1.2);
        const out = reach * (2.8 - Math.min(1, along * 1.6) * (1.7 + squeeze));
        const angle = start + along * Math.PI * 1.3 * way;

        path.push(aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.85));
      }
      // Tapering towards the tip, segment by segment
      for (let step = 0; step < path.length - 1; step += 1) {
        strand(
          kit,
          [path[step], path[step + 1]],
          reach * 0.34 * (1 - (step / 14) * 0.65),
          OCTO_ORANGE,
          OCTO_DARK,
          shown,
        );
      }
      for (let sucker = 2; sucker < path.length - 1; sucker += 3) {
        kit.puff(path[sucker], reach * 0.08, OCTO_SUCKER, shown);
      }
    }
    if (share < OCTO_WRAPPED) {
      return;
    }
    const hold = (share - OCTO_WRAPPED) / (1 - OCTO_WRAPPED);

    kit.ring(at, reach * (1.2 - squeeze), 0.1, OCTO_ORANGE, squeeze * 4 * shown, { add: 0.4 });
    sparks(
      kit,
      at,
      reach * 1.6,
      8,
      seed + Math.floor(hold * 6),
      0.5,
      OCTO_SUCKER,
      squeeze * 4 * shown,
    );
  },

  Court(kit, stage, share, { seed, weight }) {
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const far = farSide(kit, stage, reach);
    const swap = Math.min(1, Math.max(0, (share - COURT_LANDS) / (COURT_SWAPPED - COURT_LANDS)));
    const shown = Math.min(1, share * 10) * late(share, 0.8);

    for (const [index, spot] of [stage.source, far].entries()) {
      const [from, to] = index === 0 ? [COURT_BLUE, COURT_RED] : [COURT_RED, COURT_BLUE];
      const colour = mix(from, to, swap);
      const floor = floorOf(spot);

      kit.pool(floor, reach * 2.2, colour, shown * 0.4, { add: 0 });
      kit.ripple(floor, reach * 2.2, 0.08, colour, shown, { add: 0.3 });
    }
    if (share < COURT_LANDS) {
      const flight = share / COURT_LANDS;

      football(
        kit,
        arcing(stage.source, far, flight, reach * 3),
        reach * 0.4,
        flight * Math.PI * 6,
        1,
      );
      return;
    }
    const blown = (share - COURT_LANDS) / (1 - COURT_LANDS);
    const middle = toward(stage.source, far, 0.5);

    kit.glow(middle, reach * (0.6 + blown * 1.2), WHISTLE_FLASH, decay(blown * 2.5));
    kit.star(
      middle,
      reach * (0.8 + swell(Math.min(1, blown * 3)) * 0.6),
      blown * 2,
      '#ffffff',
      decay(blown * 2),
    );
    sparks(
      kit,
      middle,
      reach * (1 + blown * 1.4),
      10,
      seed,
      blown,
      WHISTLE_FLASH,
      decay(blown * 1.5),
    );
    football(kit, aside(kit, far, 0, -reach * 0.2), reach * 0.4, Math.PI * 6, late(blown, 0.3));
  },

  Decorate(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const piped = Math.min(1, share / DECORATE_PIPED);
    const shown = late(share, 0.8);
    const along = (part: number): Spot => {
      const angle = part * TAU * 2.5;

      return aside(
        kit,
        at,
        Math.cos(angle) * reach * 1.3,
        -reach * 0.9 + part * reach * 2.2 - Math.sin(angle) * reach * 0.3,
        Math.sin(angle) * reach * 0.6,
      );
    };
    const path: Spot[] = [];

    for (let step = 0; step <= Math.ceil(piped * 50); step += 1) {
      path.push(along(Math.min(piped, step / 50)));
    }
    strand(kit, path, reach * 0.26, CREAM_WHITE, CREAM_PINK, shown);
    if (piped < 1) {
      kit.glow(path[path.length - 1], reach * 0.3, '#ffffff', 1, 0.6);
    }
    for (let sweet = 0; sweet < DECORATE_SWEETS; sweet += 1) {
      const part = (sweet + 0.5) / DECORATE_SWEETS;
      const pop = Math.min(1, (piped - part) * 8);

      if (pop <= 0) {
        continue;
      }
      const grow = pop + swell(pop) * 0.4;
      const spot = aside(kit, along(part), 0, reach * 0.25);

      if (sweet % 3 === 0) {
        kit.puff(spot, reach * 0.26 * grow, SWEET_SHADE, shown);
        kit.puff(spot, reach * 0.22 * grow, CHERRY_RED, shown);
        kit.ribbon(
          [spot, aside(kit, spot, reach * 0.15, reach * 0.45 * grow)],
          reach * 0.06,
          BERRY_LEAF,
          shown,
          0,
          { add: 0 },
        );
      } else if (sweet % 3 === 1) {
        kit.heart(spot, reach * 0.4 * grow, Math.PI, CHERRY_RED, shown);
        kit.leaf(
          aside(kit, spot, 0, reach * 0.28 * grow),
          reach * 0.3 * grow,
          0,
          BERRY_LEAF,
          shown,
        );
      } else {
        kit.shard(spot, reach * 0.34 * grow, Math.PI / 4, SWEET_SHADE, shown);
        kit.star(spot, reach * 0.4 * grow, 0, SWEET_STAR, shown, { add: 0.3 });
      }
    }
    const sparkle = Math.max(0, (share - 0.4) / 0.6);

    for (let glint = 0; glint < 5; glint += 1) {
      const twinkle = (sparkle * 2 + noise(seed, glint)) % 1;

      kit.star(
        aside(
          kit,
          at,
          spread(seed, glint + 10) * reach * 1.6,
          spread(seed, glint + 20) * reach * 1.4,
        ),
        reach * 0.45,
        glint,
        '#ffffff',
        swell(twinkle) * Math.min(1, sparkle * 4) * shown,
      );
    }
  },

  Drumming(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const drumFloor = floorOf(aside(kit, stage.source, -reach * 1.6, 0));
    const floor = floorOf(at);
    const shown = Math.min(1, share * 12) * late(share, 0.6);
    let squash = 0;

    for (let beat = 0; beat < DRUM_BEATS; beat += 1) {
      const since = share - beat * DRUM_GAP;

      if (since >= 0 && since < 0.06) {
        squash = Math.max(squash, decay(since / 0.06));
      }
    }
    const height = reach * (1.4 - squash * 0.15);
    const top = aside(kit, drumFloor, 0, height);

    // The stump: its bark, then its ringed top
    kit.ribbon([drumFloor, top], reach * 2.2, STUMP_DARK, shown, 0, { add: 0 });
    kit.ribbon([drumFloor, top], reach * 1.95, STUMP_BROWN, shown, 0, { add: 0 });
    kit.puff(top, reach * 1.05, STUMP_DARK, shown);
    kit.puff(top, reach * 0.95, STUMP_RINGS, shown);
    for (let band = 1; band < 3; band += 1) {
      loop(kit, top, reach * 0.3 * band, reach * 0.3 * band, reach * 0.06, STUMP_BROWN, shown);
    }
    // The sticks, coming down on each beat
    const lift = decay(squash) * reach * 0.9;

    for (const side of [-1, 1]) {
      strand(
        kit,
        [
          aside(kit, top, side * reach * 1.4, reach * 0.8 + lift),
          aside(kit, top, side * reach * 0.35, reach * 0.05 + lift * 0.3),
        ],
        reach * 0.16,
        STUMP_BROWN,
        STUMP_DARK,
        shown,
      );
    }
    for (let beat = 0; beat < DRUM_BEATS; beat += 1) {
      const travel = (share - beat * DRUM_GAP) / 0.3;

      if (travel < 0 || travel > 1) {
        continue;
      }
      kit.ring(top, reach * (0.8 + travel * 1.6), 0.1, ROOT_LEAF, decay(travel * 1.6), {
        add: 0.4,
      });
      kit.ripple(
        toward(drumFloor, floor, travel),
        reach * (0.9 + travel * 0.6),
        0.14,
        lighten(ROOT_LEAF, 0.2),
        swell(travel),
        { add: 0.3 },
      );
    }
    if (share < DRUM_ROOTS) {
      return;
    }
    const burstOut = (share - DRUM_ROOTS) / (1 - DRUM_ROOTS);
    const held = late(burstOut, 0.6);

    kit.pit(floor, reach * 1.8, Math.min(1, burstOut * 4) * held, STUMP_DARK, 0.6);
    for (let root = 0; root < 5; root += 1) {
      const rise = Math.min(1, Math.max(0, (burstOut - root * 0.05) / 0.25));

      if (rise <= 0) {
        continue;
      }
      const base = aside(
        kit,
        floor,
        (root - 2) * reach * 0.65 + spread(seed, root) * reach * 0.2,
        0,
        spread(seed, root + 10) * reach * 0.5,
      );
      const lean = (root - 2) * 0.25 + spread(seed, root + 20) * 0.3;
      const tall = reach * (1.6 + noise(seed, root + 30) * 1.2) * rise;
      const path: Spot[] = [];

      for (let step = 0; step <= 5; step += 1) {
        const up = step / 5;

        path.push(aside(kit, base, Math.sin(up * 2.2) * lean * tall * 0.5, up * tall));
      }
      strand(kit, path, reach * 0.32, ROOT_BROWN, STUMP_DARK, held);
      kit.leaf(path[path.length - 1], reach * 0.6, -lean, ROOT_LEAF, held);
    }
    debris(
      kit,
      floor,
      reach * 1.2,
      many(12, weight),
      seed + 1,
      burstOut,
      STUMP_BROWN,
      decay(burstOut),
    );
  },

  Pyroball(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const kick = aside(kit, floorOf(stage.source), reach * 0.5, reach * 0.3);
    const flightOf = (when: number): Spot =>
      arcing(
        kick,
        at,
        Math.min(1, Math.max(0, (when - PYRO_CATCHES) / (PYRO_LANDS - PYRO_CATCHES))),
        reach * 4,
      );

    if (share < PYRO_CATCHES) {
      const catching = share / PYRO_CATCHES;

      kit.glow(kick, reach * (0.4 + catching * 0.6), PYRO_FLAME, catching, 0.4);
      kit.puff(kick, reach * 0.32, BALL_DARK, 1);
      kit.puff(kick, reach * 0.26, PYRO_PEBBLE, 1);
      return;
    }
    if (share < PYRO_LANDS) {
      // The flames trailing behind, oldest smallest
      for (let flame = 5; flame >= 1; flame -= 1) {
        kit.glow(
          flightOf(share - flame * 0.025),
          reach * (0.7 - flame * 0.1),
          flame > 2 ? PYRO_FLAME : PYRO_HOT,
          0.9 - flame * 0.12,
          0.4,
        );
      }
      const spot = flightOf(share);

      kit.glow(spot, reach * 0.9, PYRO_FLAME, 0.9, 0.3);
      football(kit, spot, reach * 0.42, share * 40, 1);
      return;
    }
    const hit = (share - PYRO_LANDS) / (1 - PYRO_LANDS);

    kit.glow(at, reach * (1.2 + hit * 1.6), PYRO_HOT, decay(hit * 1.6));
    kit.glow(at, reach * (1.6 + hit * 1.6), PYRO_FLAME, decay(hit) * 0.8, 0.3);
    kit.ring(at, reach * (1 + hit * 2.6), 0.1, PYRO_HOT, decay(hit));
    kit.ripple(floorOf(at), reach * (1 + hit * 3), 0.1, PYRO_FLAME, decay(hit) * 0.8);
    for (let flame = 0; flame < many(6, weight); flame += 1) {
      const rise = (hit * 1.4 + noise(seed, flame)) % 1;

      kit.leaf(
        aside(kit, at, spread(seed, flame + 10) * reach * 1.4, rise * reach * 1.8),
        reach * decay(rise),
        0,
        flame % 2 === 0 ? PYRO_FLAME : PYRO_HOT,
        decay(hit),
      );
    }
    sparks(kit, at, reach * (1.6 + hit * 2), 12, seed + 1, hit, PYRO_HOT, decay(hit));
    debris(kit, at, reach * 1.6, many(10, weight), seed + 2, hit, PYRO_FLAME, decay(hit));
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default galarSignatures;
