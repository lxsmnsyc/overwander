import type EffectBatch from '../../../../../three/effect-batch';
import type { Spot } from '../../../../../three/effect-batch';
import { decay, lighten, noise, spread, swell } from '../../../__paint';
import { SIGNATURE_SCALE } from '../../../effect/regions/galar/legends';
import {
  CHILI_RED,
  CHILI_STEM,
  DIVERS_GAP,
  DIVERS_HEADS,
  DIVE_HOLE,
  DIVE_WATER,
  DOODLE_COLOURS,
  DOODLE_DRAWN,
  ESPATHRA_EYE,
  ESPATHRA_FEATHER,
  EXHAUST_GREY,
  FILLET_PALE,
  FILLET_PEELS,
  FILLET_PINK,
  FILLET_SLICES,
  GLAIVE_DARK,
  GLAIVE_ICE,
  GLAIVE_LANDS,
  GLAIVE_PALE,
  GLIMMORA_PINK,
  GLIMMORA_VIOLET,
  GRIND_GOLD,
  HEAT_ORANGE,
  HORDE_ARRIVES,
  HORDE_MICE,
  JET_BLUE,
  JET_FOAM,
  JET_LANDS,
  KINGAMBIT_DARK,
  KINGAMBIT_GOLD,
  KOWTOW_BOWS,
  KOWTOW_BREAKS,
  LUMINA_COLOURS,
  LUMINA_CRASH,
  LUMINA_FAN,
  MOUSE_DARK,
  MOUSE_WHITE,
  ORDER_LANDS,
  ORDER_WATER,
  SALT_CUBES,
  SALT_FALLS,
  SALT_SHADE,
  SALT_WHITE,
  SILK_SHADE,
  SILK_WHITE,
  SNARE_SPUN,
  SPICE_DROPS,
  SPICE_LANDS,
  SPINNER_PETALS,
  SPINNER_POISON,
  TATSUGIRI_CREAM,
  TATSUGIRI_ORANGE,
  TYRE_BLACK,
  WUGTRIO_BLUE,
  WUGTRIO_RED,
} from '../../../effect/regions/paldea/routes';
import { type EffectShape, many } from '../../../effect/shapes';
import { TAU, arcing, debris, sickle, smoke, sparks } from '../../pieces';
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

/** A strand painted dark under a pale line of light, so it reads on any ground */
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
  kit.ribbon(path, width * 2.2, shade, alpha * 0.85, 0, { add: 0 });
  kit.ribbon(path, width, colour, alpha, 0, { add: 0.3 });
}

/** A Tatsugiri curled over its rice, the curl turned round by `turn` */
function sushi(kit: EffectBatch, at: Spot, size: number, turn: number, alpha: number): void {
  const curl = aside(kit, at, Math.sin(turn) * size * 0.35, Math.cos(turn) * size * 0.35);

  kit.puff(at, size, TATSUGIRI_CREAM, alpha);
  kit.puff(curl, size * 0.8, TATSUGIRI_ORANGE, alpha);
  kit.glow(
    aside(kit, curl, Math.cos(turn) * size * 0.5, -Math.sin(turn) * size * 0.5),
    size * 0.25,
    '#ffe6a0',
    alpha,
    0.5,
  );
}

/** A Maushold mouse: a round white body, two ears and an eye, all painted */
function mouse(kit: EffectBatch, at: Spot, size: number, facing: number, alpha: number): void {
  kit.puff(at, size * 1.15, MOUSE_DARK, alpha * 0.5);
  kit.puff(aside(kit, at, -size * 0.5 * facing, size * 0.95), size * 0.5, MOUSE_WHITE, alpha);
  kit.puff(aside(kit, at, size * 0.3 * facing, size * 0.95), size * 0.5, MOUSE_WHITE, alpha);
  kit.puff(at, size, MOUSE_WHITE, alpha);
  kit.puff(aside(kit, at, size * 0.45 * facing, size * 0.15), size * 0.22, MOUSE_DARK, alpha);
}

const paldeaRoutes = {
  Snare(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const centre = aside(kit, at, 0, reach * 0.4);
    const spun = Math.min(1, share / SNARE_SPUN);
    const shown = late(share, 0.75);
    const radius = reach * 2;
    const corner = (index: number, out: number): Spot => {
      const angle = Math.PI / 2 + (index / 6) * TAU;

      return aside(kit, centre, Math.cos(angle) * out, Math.sin(angle) * out * 1.1);
    };

    kit.glow(centre, radius * 1.1, SILK_WHITE, shown * 0.15, 0);
    for (let spoke = 0; spoke < 6; spoke += 1) {
      strand(
        kit,
        [centre, corner(spoke, radius * Math.min(1, spun * 2))],
        reach * 0.12,
        SILK_WHITE,
        SILK_SHADE,
        shown,
      );
    }
    for (let band = 0; band < 3; band += 1) {
      const strung = Math.min(1, Math.max(0, spun * 3 - 1 - band * 0.6));

      if (strung <= 0) {
        continue;
      }
      const out = radius * (1 - band * 0.28);
      const path: Spot[] = [];

      for (let side = 0; side <= Math.ceil(strung * 6); side += 1) {
        path.push(corner(side, out));
      }
      strand(kit, path, reach * 0.1, SILK_WHITE, SILK_SHADE, shown);
    }
    // The loose threads off the corners, twitching
    for (let thread = 0; thread < 3; thread += 1) {
      const from = corner(thread * 2 + 1, radius);
      const twitch = Math.sin(share * 40 + thread * 2) * reach * 0.25 * spun;
      const end = aside(kit, from, twitch, -reach * 0.9 * spun);

      strand(
        kit,
        [from, toward(from, end, 0.5), end],
        reach * 0.08,
        SILK_WHITE,
        SILK_SHADE,
        shown * 0.8,
      );
    }
    for (let glint = 0; glint < 4; glint += 1) {
      const travel = (share * 1.5 + noise(seed, glint)) % 1;
      const spoke = Math.floor(noise(seed, glint + 10) * 6);

      kit.star(
        toward(centre, corner(spoke, radius * spun), travel),
        reach * 0.4,
        share * 6,
        '#ffffff',
        swell(travel) * shown,
      );
    }
  },

  Lumina(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const open = Math.min(1, share / LUMINA_FAN);
    const fanned = Math.min(1, share * 6) * late(share, 0.55);
    const hub = aside(kit, at, 0, -reach * 0.4, reach * 0.3);

    for (let feather = 0; feather < 7; feather += 1) {
      const angle = Math.PI / 2 + (feather / 6 - 0.5) * Math.PI * 1.1 * open;
      const tip = aside(kit, hub, Math.cos(angle) * reach * 3.2, Math.sin(angle) * reach * 3.2);
      const eye = toward(hub, tip, 0.78);

      kit.leaf(
        toward(hub, tip, 0.55),
        reach * 2.4,
        angle - Math.PI / 2,
        ESPATHRA_FEATHER,
        fanned * 0.9,
      );
      kit.glow(eye, reach * 0.6, LUMINA_COLOURS[feather % LUMINA_COLOURS.length], fanned, 0.3);
      kit.puff(eye, reach * 0.2, ESPATHRA_EYE, fanned);
    }
    if (share < LUMINA_CRASH) {
      return;
    }
    const crash = (share - LUMINA_CRASH) / (1 - LUMINA_CRASH);
    const fall = Math.min(1, crash / 0.35);
    const crest = aside(kit, at, 0, reach * (1 - fall * 4));

    // The wave: bands of each colour curling down over it, with paint under the light
    for (const [band, colour] of LUMINA_COLOURS.entries()) {
      sickle(
        kit,
        crest,
        reach * (2.6 + band * 0.4),
        Math.PI * 0.1,
        Math.PI * 0.9,
        reach * 0.5,
        colour,
        decay(crash * 1.6) * 0.85,
        0.4,
      );
    }
    kit.glow(at, reach * (1 + crash * 1.6), '#fff6ff', swell(Math.min(1, crash * 1.5)) * 0.8);
    for (const [band, colour] of LUMINA_COLOURS.entries()) {
      const out = Math.max(0, crash - band * 0.06);

      kit.ring(at, reach * (0.8 + out * 3.4), 0.08, colour, decay(out) * 0.9);
    }
    kit.ripple(floorOf(at), reach * (1 + crash * 3.6), 0.1, LUMINA_COLOURS[3], decay(crash) * 0.8);
    sparks(kit, at, reach * 2.6, many(10, weight), seed, crash, LUMINA_COLOURS[0], decay(crash));
  },

  Order(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const from = aside(kit, stage.source, reach * 1.6, reach * 0.6);

    if (share < ORDER_LANDS) {
      const flight = share / ORDER_LANDS;
      const spot = arcing(from, at, flight, reach * 5);

      kit.trail(
        arcing(from, at, Math.max(0, flight - 0.12), reach * 5),
        spot,
        reach * 0.15,
        ORDER_WATER,
        0.6,
      );
      sushi(kit, spot, reach * 0.9, flight * TAU * 2, 1);
      return;
    }
    const hit = (share - ORDER_LANDS) / (1 - ORDER_LANDS);
    const floor = floorOf(at);

    kit.ripple(floor, reach * 2.2, 0.12, '#ffffff', late(hit, 0.5) * 0.9, { add: 0.2 });
    kit.ripple(floor, reach * 1.8, 0.06, TATSUGIRI_ORANGE, late(hit, 0.5) * 0.6, { add: 0 });
    kit.glow(at, reach * (1 + hit * 1.8), ORDER_WATER, decay(hit) * 0.7);
    sushi(
      kit,
      aside(kit, at, 0, reach * 0.6 + swell(Math.min(1, hit * 2)) * reach * 0.8),
      reach * 0.9,
      0,
      late(hit, 0.4),
    );
    for (let drop = 0; drop < many(12, weight); drop += 1) {
      kit.glow(
        thrown(at, seed, drop, hit, reach * 3, reach * 1.6),
        reach * 0.18,
        lighten(ORDER_WATER, 0.3),
        decay(hit),
        0.5,
      );
    }
    sparks(kit, at, reach * (1.4 + hit * 2), 12, seed + 1, hit, TATSUGIRI_ORANGE, decay(hit));
  },

  Jetfist(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const run = Math.min(1, share / JET_LANDS) ** 0.8;
    const head = toward(stage.source, at, run);
    const fading = late(share, 0.5);
    const path: Spot[] = [];

    for (let step = 0; step <= 8; step += 1) {
      path.push(toward(stage.source, head, step / 8));
    }
    kit.ribbon(path, reach * 0.7, JET_BLUE, fading * 0.6, share * 4, { add: 0.3 });
    kit.ribbon(path, reach * 0.22, JET_FOAM, fading * 0.9, share * 6);
    sparks(kit, toward(stage.source, head, 0.7), reach * 1.4, 8, seed, run, JET_FOAM, fading * 0.8);
    if (share < JET_LANDS) {
      kit.puff(head, reach * 1.1, JET_BLUE, 1);
      kit.glow(head, reach * 0.9, JET_FOAM, 0.6, 0.4);
      for (let knuckle = 0; knuckle < 4; knuckle += 1) {
        kit.puff(
          aside(kit, head, (knuckle - 1.5) * reach * 0.35, reach * 0.35),
          reach * 0.3,
          JET_FOAM,
          1,
        );
      }
      return;
    }
    const hit = (share - JET_LANDS) / (1 - JET_LANDS);

    kit.glow(at, reach * (0.9 + hit * 1.8), JET_FOAM, decay(hit * 2));
    kit.glow(at, reach * (1.2 + hit * 1.8), JET_BLUE, decay(hit) * 0.7);
    kit.ring(at, reach * (1 + hit * 3), 0.08, JET_FOAM, decay(hit));
    kit.ripple(floorOf(at), reach * (1 + hit * 3), 0.1, JET_BLUE, decay(hit) * 0.7);
    for (let drop = 0; drop < many(12, weight); drop += 1) {
      kit.glow(
        thrown(at, seed + 1, drop, hit, reach * 3, reach * 1.4),
        reach * 0.18,
        lighten(JET_BLUE, 0.4),
        decay(hit),
        0.5,
      );
    }
    sparks(kit, at, reach * (1.4 + hit * 2), 10, seed + 2, hit, JET_FOAM, decay(hit));
  },

  Spice(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const squeeze = Math.min(1, share / SPICE_LANDS);
    const held = Math.min(1, share * 8) * late(share, 0.55);
    const stem = aside(kit, at, -reach * 0.9, reach * 3);
    const tip = aside(kit, at, reach * 0.3, reach * 2.2);
    const pod: Spot[] = [];

    for (let step = 0; step <= 6; step += 1) {
      pod.push(
        aside(kit, toward(stem, tip, step / 6), 0, Math.sin((Math.PI * step) / 6) * reach * 0.3),
      );
    }
    // The pod painted solid, so its red holds on a bright ground
    kit.ribbon(pod, reach * (0.8 - squeeze * 0.3), CHILI_RED, held, 0, { add: 0 });
    kit.ribbon(pod.slice(1, 4), reach * 0.15, '#ff8a7a', held * 0.8, 0, { add: 0.4 });
    kit.ribbon(
      [aside(kit, stem, -reach * 0.5, reach * 0.25), stem],
      reach * 0.2,
      CHILI_STEM,
      held,
      0,
      { add: 0 },
    );
    for (let drop = 0; drop < SPICE_DROPS; drop += 1) {
      const leave = (drop / SPICE_DROPS) * (SPICE_LANDS - 0.2);
      const fall = (share - leave) / 0.2;

      if (fall < 0 || fall > 1) {
        continue;
      }
      const spot = aside(kit, tip, spread(seed, drop) * reach * 0.3, -(fall ** 1.5) * reach * 2);

      kit.puff(spot, reach * 0.25, CHILI_RED, 1);
      kit.glow(spot, reach * 0.3, HEAT_ORANGE, 0.6, 0.3);
    }
    const heat = Math.max(0, (share - 0.2) / 0.8);

    if (heat <= 0) {
      return;
    }
    kit.glow(at, reach * 1.2, CHILI_RED, swell(heat) * 0.6, 0.2);
    for (let wave = 0; wave < 4; wave += 1) {
      const rise = (heat * 1.4 + wave / 4) % 1;
      const base = aside(kit, at, (wave - 1.5) * reach * 0.5, reach * 0.4 + rise * reach * 1.6);
      const path: Spot[] = [];

      for (let step = 0; step <= 6; step += 1) {
        path.push(
          aside(kit, base, Math.sin(step + share * 20 + wave) * reach * 0.12, step * reach * 0.18),
        );
      }
      kit.ribbon(path, reach * 0.07, HEAT_ORANGE, swell(rise) * decay(heat) * 0.9);
    }
    smoke(
      kit,
      aside(kit, at, 0, reach * 0.3),
      reach * 1.4,
      many(6, weight),
      seed + 1,
      heat,
      lighten(CHILI_RED, 0.25),
      decay(heat) * 0.35,
    );
  },

  Burnout(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const floor = floorOf(at);
    const spin = Math.min(1, share / 0.6);
    const shown = late(share, 0.7);

    for (let tyre = 0; tyre < 2; tyre += 1) {
      const radius = reach * (1.8 + tyre * 0.5);
      const start = tyre * Math.PI;
      const marks: Spot[] = [];

      for (let step = 0; step <= 24; step += 1) {
        const angle = start + (step / 24) * spin * TAU;

        marks.push(aside(kit, floor, Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius));
      }
      // The tread laid on the ground, painted dark
      kit.ribbon(marks, reach * 0.3, TYRE_BLACK, shown * 0.7, 0, { add: 0 });
      const angle = start + spin * TAU;
      const wheel = aside(
        kit,
        floor,
        Math.cos(angle) * radius,
        reach * 0.55,
        Math.sin(angle) * radius,
      );

      kit.puff(wheel, reach * 0.6, TYRE_BLACK, shown);
      kit.puff(wheel, reach * 0.28, EXHAUST_GREY, shown);
      for (let spoke = 0; spoke < 3; spoke += 1) {
        const turn = share * 30 + (spoke / 3) * Math.PI;

        kit.ribbon(
          [
            aside(kit, wheel, -Math.cos(turn) * reach * 0.42, -Math.sin(turn) * reach * 0.42),
            aside(kit, wheel, Math.cos(turn) * reach * 0.42, Math.sin(turn) * reach * 0.42),
          ],
          reach * 0.06,
          EXHAUST_GREY,
          shown,
          0,
          { add: 0 },
        );
      }
      sparks(
        kit,
        wheel,
        reach * 1.2,
        6,
        seed + tyre + Math.floor(share * 12),
        (share * 6) % 1,
        GRIND_GOLD,
        shown,
      );
    }
    smoke(kit, floor, reach * 2.6, many(6, weight), seed, share, EXHAUST_GREY, shown * 0.4);
    kit.glow(at, reach * 1.2, GRIND_GOLD, swell(share) * 0.4, 0.3);
  },

  Horde(kit, stage, share, { seed, weight, hits = HORDE_MICE }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const count = Math.max(3, Math.min(HORDE_MICE, Math.round(hits)));

    for (let one = 0; one < count; one += 1) {
      const leave = (one / count) * (HORDE_ARRIVES - 0.2);
      const run = (share - leave) / 0.2;

      if (run < 0) {
        continue;
      }
      const angle = noise(seed, one) * TAU;
      const spot = aside(
        kit,
        at,
        spread(seed, one + 20) * reach * 1.2,
        spread(seed, one + 40) * reach * 0.9,
      );

      if (run < 1) {
        const from = aside(kit, spot, Math.cos(angle) * reach * 4.5, Math.sin(angle) * reach * 2.5);
        const head = toward(from, spot, run);

        kit.trail(toward(from, spot, Math.max(0, run - 0.4)), head, reach * 0.12, MOUSE_WHITE, 0.5);
        mouse(kit, head, reach * 0.5, Math.cos(angle) > 0 ? -1 : 1, 1);
        continue;
      }
      const pop = Math.min(1, (run - 1) * 1.6);

      if (pop >= 1) {
        continue;
      }
      kit.ring(spot, reach * (0.4 + pop * 1.1), 0.12, '#ffffff', decay(pop));
      sparks(kit, spot, reach * (0.6 + pop), 6, seed + one, pop, '#fff2a8', decay(pop));
      mouse(kit, aside(kit, spot, 0, pop * reach * 0.8), reach * 0.5, 1, decay(pop));
    }
    kit.glow(at, reach * 1.4, '#fff6e0', swell(Math.min(1, share * 1.3)) * 0.35, 0.2);
  },

  Glaive(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const pivot = aside(kit, at, reach * 2.4, -reach * 1.2);
    const length = reach * 4.6;
    const start = Math.PI * 0.55;
    const end = Math.PI * 1.1;
    const swing = Math.min(1, share / GLAIVE_LANDS) ** 1.4;
    const angle = start + (end - start) * swing;

    // The crescent of the cut, painted pale with frost light over it
    sickle(
      kit,
      pivot,
      length * 0.85,
      start,
      angle,
      reach * 0.9 * (1 + Math.max(0, share - GLAIVE_LANDS)),
      GLAIVE_PALE,
      late(share, 0.6) * 0.75,
      0.4,
    );
    if (share < GLAIVE_LANDS + 0.1) {
      const shown = late(share, GLAIVE_LANDS);
      const tip = aside(kit, pivot, Math.cos(angle) * length, Math.sin(angle) * length);
      const hilt = toward(pivot, tip, 0.25);

      kit.ribbon([hilt, toward(hilt, tip, 0.5), tip], reach * 1.3, GLAIVE_DARK, shown, 0, {
        add: 0,
      });
      kit.ribbon([hilt, toward(hilt, tip, 0.5), tip], reach * 1, GLAIVE_ICE, shown, 0, {
        add: 0.2,
      });
      kit.trail(toward(hilt, tip, 0.2), tip, reach * 0.15, GLAIVE_PALE, shown);
      kit.ribbon([pivot, hilt], reach * 0.4, GLAIVE_DARK, shown, 0, { add: 0 });
      sparks(kit, tip, reach * 1.2, 6, seed, swing, GLAIVE_PALE, shown);
    }
    if (share < GLAIVE_LANDS) {
      return;
    }
    const hit = (share - GLAIVE_LANDS) / (1 - GLAIVE_LANDS);

    kit.glow(at, reach * (1 + hit * 1.6), GLAIVE_ICE, decay(hit) * 0.6);
    debris(
      kit,
      at,
      reach * 2,
      many(12, weight),
      seed + 1,
      hit,
      lighten(GLAIVE_ICE, 0.4),
      decay(hit),
    );
    for (let glint = 0; glint < 3; glint += 1) {
      kit.star(
        aside(kit, at, spread(seed, glint) * reach * 1.6, spread(seed, glint + 5) * reach),
        reach * 0.5,
        glint,
        '#ffffff',
        swell(Math.min(1, hit * 2 + glint * 0.1)),
      );
    }
  },

  Salt(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const floor = floorOf(at);
    const shown = late(share, 0.75);
    const crust = Math.min(1, Math.max(0, (share - SALT_FALLS) / 0.4));
    const hitAt = (one: number): Spot =>
      aside(kit, at, spread(seed, one + 40) * reach * 0.6, reach * 0.3);

    kit.ripple(floor, reach * (1.2 + crust * 0.8), 0.3, SALT_WHITE, crust * shown * 0.8, {
      add: 0,
    });
    for (let one = 0; one < SALT_CUBES; one += 1) {
      const lands = SALT_FALLS + (one / SALT_CUBES) * 0.35;
      const leave = lands - 0.25;
      const angle = (one / SALT_CUBES) * TAU + noise(seed, one) * 0.5;
      const rest = aside(
        kit,
        floor,
        Math.cos(angle) * reach * 1.6,
        reach * 0.15,
        Math.sin(angle) * reach * 1.6,
      );
      const turn = noise(seed, one + 20) * Math.PI;

      if (share < leave) {
        continue;
      }
      if (share < lands) {
        const fall = ((share - leave) / 0.25) ** 1.6;
        const spot = toward(aside(kit, hitAt(one), 0, reach * 4), hitAt(one), fall);

        kit.shard(spot, reach * 0.7, turn + fall * 4, SALT_SHADE, 1);
        kit.shard(spot, reach * 0.55, turn + fall * 4, SALT_WHITE, 1);
        continue;
      }
      const settle = Math.min(1, (share - lands) / 0.15);
      const spot = aside(kit, toward(hitAt(one), rest, settle), 0, swell(settle) * reach * 0.5);

      kit.shard(spot, reach * 0.7, turn, SALT_SHADE, shown);
      kit.shard(spot, reach * 0.55, turn, SALT_WHITE, shown);
      if (settle < 1) {
        sparks(kit, hitAt(one), reach * 0.6, 5, seed + one, settle, '#ffffff', decay(settle));
      }
      kit.star(
        aside(kit, spot, 0, reach * 0.2),
        reach * 0.45,
        share * 5,
        '#ffffff',
        swell((share * 2.5 + noise(seed, one + 60)) % 1) * shown,
      );
    }
  },

  Divers(kit, stage, share, { seed, weight, hits = DIVERS_HEADS }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const floor = floorOf(at);
    const count = Math.max(1, Math.min(DIVERS_HEADS, Math.round(hits)));

    for (let head = 0; head < count; head += 1) {
      const up = (share - head * DIVERS_GAP) / 0.45;

      if (up < 0 || up > 1) {
        continue;
      }
      const base = aside(
        kit,
        floor,
        (head - (count - 1) / 2) * reach * 1.3,
        0,
        -(head % 2) * reach * 0.4,
      );
      const rise = swell(Math.min(1, up * 1.2));
      const top = aside(kit, base, 0, rise * reach * 2.6);

      kit.pool(base, reach * 0.8, DIVE_HOLE, 0.6, { add: 0 });
      if (rise > 0.05) {
        kit.ribbon([base, toward(base, top, 0.5), top], reach * 0.8, WUGTRIO_RED, 1, 0, { add: 0 });
        kit.puff(top, reach * 0.45, WUGTRIO_RED, 1);
        kit.ribbon(
          [
            top,
            aside(kit, top, -reach * 0.5, -reach * 0.3),
            aside(kit, top, -reach * 0.7, -reach * 0.6),
          ],
          reach * 0.25,
          WUGTRIO_BLUE,
          1,
          0,
          { add: 0 },
        );
        kit.ribbon(
          [
            top,
            aside(kit, top, reach * 0.5, -reach * 0.3),
            aside(kit, top, reach * 0.7, -reach * 0.6),
          ],
          reach * 0.25,
          WUGTRIO_BLUE,
          1,
          0,
          { add: 0 },
        );
        kit.puff(aside(kit, top, -reach * 0.15, reach * 0.05), reach * 0.12, '#ffffff', 1);
        kit.puff(aside(kit, top, reach * 0.15, reach * 0.05), reach * 0.12, '#ffffff', 1);
      }
      kit.ripple(base, reach * (0.6 + up * 1.6), 0.1, DIVE_WATER, decay(up));
      for (let drop = 0; drop < many(8, weight); drop += 1) {
        kit.glow(
          thrown(base, seed + head, drop, up, reach * 1.6, reach * 1.8),
          reach * 0.16,
          lighten(DIVE_WATER, 0.3),
          decay(up),
          0.5,
        );
      }
    }
  },

  Spinner(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = Math.min(1, share * 6) * late(share, 0.7);
    const radius = reach * (2.6 - Math.min(1, share * 3) * 0.9);
    const ring = aside(kit, at, 0, -reach * 0.3);

    kit.ripple(floorOf(at), radius, 0.06, GLIMMORA_PINK, shown * 0.5);
    for (let one = 0; one < SPINNER_PETALS; one += 1) {
      const angle = (one / SPINNER_PETALS) * TAU + share * Math.PI * 5;
      const spot = aside(kit, ring, Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      const facing = kit.angleOn(
        spot,
        aside(kit, ring, Math.cos(angle + 0.2) * radius, 0, Math.sin(angle + 0.2) * radius),
      );

      kit.leaf(spot, reach * 1.3, facing, GLIMMORA_VIOLET, shown);
      kit.leaf(spot, reach * 0.95, facing, GLIMMORA_PINK, shown);
      kit.glow(spot, reach * 0.3, lighten(GLIMMORA_PINK, 0.5), shown * 0.6, 0.4);
    }
    for (let cut = 0; cut < 3; cut += 1) {
      const pass = (share * 3 + cut / 3) % 1;
      const turn = cut * 1.1 + 0.4;

      sickle(
        kit,
        at,
        reach * 1.4,
        turn - 0.9,
        turn + 0.9,
        reach * 0.12,
        lighten(GLIMMORA_PINK, 0.4),
        swell(pass) * shown,
      );
    }
    for (let drop = 0; drop < many(12, weight); drop += 1) {
      kit.glow(
        thrown(at, seed, drop, (share * 1.5 + noise(seed, drop + 9)) % 1, radius * 1.4, reach),
        reach * 0.18,
        SPINNER_POISON,
        shown * 0.9,
        0.3,
      );
    }
  },

  Doodle(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const shown = late(share, 0.8);

    for (const [line, colour] of DOODLE_COLOURS.entries()) {
      const drawn = Math.min(1, Math.max(0, (share - line * 0.06) / (DOODLE_DRAWN - 0.24)));

      if (drawn <= 0) {
        continue;
      }
      const left = aside(kit, at, -reach * 1.4, spread(seed, line) * reach * 0.9);
      const loops = 3 + Math.floor(noise(seed, line + 10) * 2);
      const path: Spot[] = [];

      for (let step = 0; step <= Math.ceil(drawn * 40); step += 1) {
        const t = step / 40;
        const turn = t * loops * TAU;

        path.push(
          aside(
            kit,
            left,
            t * reach * 2.8 + Math.cos(turn) * reach * 0.3,
            Math.sin(turn) * reach * 0.35,
          ),
        );
      }
      // Paint, so the colours hold on any ground
      kit.ribbon(path, reach * 0.1, colour, shown, 0, { add: 0.2 });
      if (drawn < 1) {
        kit.glow(path[path.length - 1], reach * 0.25, '#ffffff', 1, 0.6);
      }
    }
    if (share < DOODLE_DRAWN) {
      return;
    }
    const mark = (share - DOODLE_DRAWN) / (1 - DOODLE_DRAWN);
    const colour = DOODLE_COLOURS[Math.floor(noise(seed, 30) * DOODLE_COLOURS.length)];
    const size = reach * (0.6 + swell(Math.min(1, mark * 3)) * 0.3);

    kit.puff(at, size, colour, late(mark, 0.4));
    for (let blot = 0; blot < 5; blot += 1) {
      const angle = (blot / 5) * TAU + noise(seed, 31);

      kit.puff(
        aside(kit, at, Math.cos(angle) * size, Math.sin(angle) * size),
        size * 0.35,
        colour,
        late(mark, 0.4),
      );
    }
  },

  Fillet(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;

    for (let slice = 0; slice < FILLET_SLICES; slice += 1) {
      const leave = (slice / FILLET_SLICES) * (FILLET_PEELS - 0.3);
      const peel = (share - leave) / 0.45;

      if (peel < 0 || peel > 1) {
        continue;
      }
      const side = slice % 2 === 0 ? -1 : 1;
      const from = aside(kit, at, side * reach * 0.6, -(slice / FILLET_SLICES - 0.5) * reach * 1.4);
      const spot = aside(kit, from, side * peel * reach * 1.2, -(peel ** 2) * reach * 2);
      const turn = Math.PI / 2 - side * peel * 1.6;
      const one = aside(kit, spot, Math.cos(turn) * reach * 0.7, Math.sin(turn) * reach * 0.7);
      const other = aside(kit, spot, -Math.cos(turn) * reach * 0.7, -Math.sin(turn) * reach * 0.7);

      kit.ribbon([one, spot, other], reach * 0.4, FILLET_PINK, decay(peel), 0, { add: 0 });
      kit.ribbon([one, spot, other], reach * 0.26, FILLET_PALE, decay(peel), 0, { add: 0.2 });
    }
    const light = Math.max(0, (share - 0.3) / 0.7);

    if (light <= 0) {
      return;
    }
    for (let line = 0; line < 5; line += 1) {
      const run = (light * 2 + noise(seed, line)) % 1;
      const height = -(line - 2) * reach * 0.35;
      const out = reach * (0.8 + run * 1.6);

      for (const side of [-1, 1]) {
        kit.trail(
          aside(kit, at, side * out, height),
          aside(kit, at, side * (out + reach * 1.2), height),
          reach * 0.08,
          FILLET_PALE,
          swell(run) * late(light, 0.6),
        );
      }
    }
    kit.star(
      aside(kit, at, reach * 0.5, reach * 0.7),
      reach * (0.6 + swell(light) * 0.5),
      light * 2,
      '#ffffff',
      swell(light),
    );
  },

  Kowtow(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const dip = Math.min(1, share / KOWTOW_BOWS);
    const ground = floorOf(stage.source);

    // The caster's shadow stretching forward along the ground as it bows
    for (let patch = 0; patch < 4; patch += 1) {
      kit.pool(
        toward(ground, floorOf(at), (patch / 4) * (0.15 + swell(dip) * 0.15)),
        reach * (0.9 - patch * 0.12),
        KINGAMBIT_DARK,
        0.35 * late(share, 0.4),
        { add: 0 },
      );
    }
    kit.star(
      aside(kit, stage.source, 0, reach * 1.2 - swell(dip) * reach * 0.6),
      reach * 0.7,
      share * 3,
      KINGAMBIT_GOLD,
      swell(dip),
    );
    if (share < KOWTOW_BOWS) {
      return;
    }
    const cut = (share - KOWTOW_BOWS) / (1 - KOWTOW_BOWS);
    const centre = aside(kit, at, -reach * 1.6, -reach * 1.6);
    const radius = reach * Math.SQRT2 * 1.6;
    const start = -Math.PI * 0.15;
    const end = start + Math.min(1, cut * 4) * Math.PI * 0.85;

    if (share < KOWTOW_BREAKS) {
      sickle(kit, centre, radius, start, end, reach * 1.1, KINGAMBIT_DARK, 0.5, 0);
      sickle(kit, centre, radius, start, end, reach * 0.8, KINGAMBIT_GOLD, 1, 0.3);
      sickle(kit, centre, radius, start, end, reach * 0.25, '#fff4cc', 1);
      kit.glow(at, reach * 1.2, KINGAMBIT_GOLD, swell(Math.min(1, cut * 2)) * 0.5, 0.3);
      return;
    }
    const broken = (share - KOWTOW_BREAKS) / (1 - KOWTOW_BREAKS);

    // The arc in pieces, each drifting out from where it broke
    for (let piece = 0; piece < 6; piece += 1) {
      const from = start + (piece / 6) * Math.PI * 0.85;
      const to = start + ((piece + 0.8) / 6) * Math.PI * 0.85;
      const out = radius + broken * reach * (0.6 + noise(seed, piece) * 0.8);

      sickle(
        kit,
        centre,
        out,
        from,
        to,
        reach * 0.6 * decay(broken * 0.5),
        KINGAMBIT_GOLD,
        decay(broken),
        0.3,
      );
    }
    debris(kit, at, reach * 2, many(10, weight), seed, broken, KINGAMBIT_GOLD, decay(broken));
    sparks(kit, at, reach * (1.2 + broken * 1.6), 10, seed + 1, broken, '#fff4cc', decay(broken));
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default paldeaRoutes;
