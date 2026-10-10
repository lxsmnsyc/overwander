import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import {
  AURORA_TONES,
  BERRY_TONES,
  BLOOM_PINK,
  CANNON_BLUE,
  CANNON_FLIGHT,
  CANNON_SHOTS,
  CHI_FISTS,
  CHI_LOCKS,
  CHI_ORANGE,
  COIN_GOLD,
  COIN_RIM,
  CUDDLE_PINK,
  EEVEE_BROWN,
  EEVEE_CREAM,
  FOAM,
  GARBAGE,
  GENGAR_EYE,
  HEAL_GREEN,
  LAPRAS_BLUE,
  LASHES,
  LEAF_GREEN,
  MALODOR_GREEN,
  MALODOR_PURPLE,
  MELMETAL,
  MELT_LANDS,
  MOLTEN,
  POUNCE_LANDS,
  RETICLE,
  SCALE_TONES,
  SNORLAX_BELLY,
  SNORLAX_TEAL,
  SPRAY,
  TERROR_SHADE,
  TERROR_VIOLET,
  VINES,
  VINE_GREEN,
  VOLT_YELLOW,
  WILDFIRE,
} from '../effect/g-max-moves';
import {
  GMAX_MAGENTA,
  GMAX_RED,
  cloudOver,
  dropped,
  fist,
  flame,
  gMaxPower,
  gigantic,
  note,
  stretch,
  whip,
} from './g-max-power';
import { TAU, bolt, debris, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, late, reachOf, toward } from './shapes';

/** A spot on the floor round another, at an angle and a distance */
function around(kit: EffectBatch, floor: Spot, angle: number, distance: number): Spot {
  return aside(kit, floor, Math.cos(angle) * distance, 0, Math.sin(angle) * distance * 0.8);
}

/** A shadow lying on the floor */
function shadow(kit: EffectBatch, floor: Spot, radius: number, alpha: number): void {
  kit.pool(floor, radius, '#000000', alpha, { add: 0 });
}

/**
 * Volt Crash's giant bolt: a dark edge under it so it still reads on
 * snow, the yellow over that, and a white-hot core
 */
function thunder(
  kit: EffectBatch,
  from: Spot,
  to: Spot,
  seed: number,
  reach: number,
  alpha: number,
): void {
  const path: Spot[] = [];

  for (let step = 0; step <= 10; step += 1) {
    const along = step / 10;
    const loose = Math.sin(Math.PI * along) * reach * 0.9;

    path.push(aside(kit, toward(from, to, along), spread(seed, step) * loose));
  }
  kit.ribbon(path, reach * 1.4, '#5a3a00', alpha * 0.5, 0, { add: 0 });
  kit.ribbon(path, reach * 0.9, VOLT_YELLOW, alpha, 0, { add: 0.3 });
  kit.ribbon(path, reach * 0.3, '#ffffff', alpha);
  kit.glow(toward(from, to, 0.5), reach * 3, VOLT_YELLOW, alpha * 0.3, 0);
}

const gMaxMoves = {
  GMaxVineLash(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const shown = Math.min(1, go * 6) * late(go, 0.85);

    kit.ripple(floor, reach * 2.4, 0.08, VINE_GREEN, shown * 0.5);
    for (let vine = 0; vine < VINES; vine += 1) {
      const side = vine % 2 === 0 ? 1 : -1;
      const row = Math.floor(vine / 2);
      const root = aside(kit, floor, -side * reach * (1.3 + row * 0.7), 0, (row - 0.5) * reach);
      const beat = (go * LASHES + vine * 0.23) % 1;
      const path: Spot[] = [];

      for (const [across, up] of whip(beat, side, reach * 3.4)) {
        path.push(aside(kit, root, across, up));
      }
      kit.ribbon(path, reach * 0.5, mix(VINE_GREEN, '#1a3a1a', 0.3), shown, 0, { add: 0 });
      kit.ribbon(path, reach * 0.24, LEAF_GREEN, shown, 0, { add: 0.2 });
      for (let leaf = 2; leaf < path.length; leaf += 3) {
        kit.leaf(path[leaf], reach * 0.28, beat * 4 + leaf, LEAF_GREEN, shown);
      }
      const crack = stretch(beat, 0.6, 0.85);

      if (crack > 0 && crack < 1) {
        sparks(
          kit,
          path[path.length - 1],
          reach * (0.8 + crack),
          8,
          seed + vine,
          crack,
          lighten(LEAF_GREEN, 0.5),
          decay(crack) * shown,
        );
        kit.glow(at, reach * 1.4, LEAF_GREEN, decay(crack) * 0.4 * shown, 0.2);
      }
    }
    for (let petal = 0; petal < many(10, weight); petal += 1) {
      const rise = (go + noise(seed, petal)) % 1;

      kit.leaf(
        aside(
          kit,
          at,
          spread(seed, petal + 10) * reach * 2.6,
          rise * reach * 2,
          spread(seed, petal + 20) * reach,
        ),
        reach * 0.16,
        rise * 6 + petal,
        BLOOM_PINK,
        shown * swell(rise),
      );
    }
  },

  GMaxWildfire(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);
    const pour = stretch(go, 0, 0.3);
    const kept = late(go, 0.8);

    if (pour < 1) {
      const head = toward(top, floor, Math.min(1, pour * 1.4));

      kit.ribbon([top, head], reach * 2.2 * swell(pour * 0.9 + 0.1), WILDFIRE, 0.8, share * 6, {
        add: 0.5,
      });
      kit.ribbon([top, head], reach * 0.7 * swell(pour * 0.9 + 0.1), '#ffd84a', 0.9, share * 8);
    }
    const reached = stretch(go, 0.2, 0.55);

    kit.glow(at, reach * (1.4 + pour * 1.4), WILDFIRE, decay(pour) * 0.6, 0.5);
    kit.pool(floor, reach * 4.4 * reached, WILDFIRE, kept * 0.7, { add: 0.6 });
    kit.ripple(floor, reach * 4.4 * reached, 0.06, lighten(WILDFIRE, 0.3), kept * 0.8);
    for (let tongue = 0; tongue < many(16, weight); tongue += 1) {
      const angle = noise(seed, tongue) * TAU;
      const out = Math.sqrt(noise(seed, tongue + 30)) * 3.8 * reached;
      const flicker = 0.7 + Math.sin(share * 30 + tongue * 1.7) * 0.3;

      flame(
        kit,
        around(kit, floor, angle, reach * out),
        reach * (0.9 + noise(seed, tongue + 60) * 0.9) * flicker * reached,
        WILDFIRE,
        kept,
      );
    }
    sparks(
      kit,
      aside(kit, floor, 0, reach),
      reach * 3,
      many(12, weight),
      seed,
      go,
      '#ffd84a',
      kept,
    );
  },

  GMaxCannonade(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);

    for (const [index, fired] of CANNON_SHOTS.entries()) {
      const flight = stretch(go, fired, fired + CANNON_FLIGHT);
      const splash = stretch(go, fired + CANNON_FLIGHT, fired + CANNON_FLIGHT + 0.25);
      const from = aside(kit, stage.source, (index % 2 === 0 ? -1 : 1) * reach * 0.6, reach * 0.5);
      const to = aside(kit, at, spread(seed, index) * reach * 0.5);

      if (flight > 0 && flight < 1) {
        const head = toward(from, to, flight);
        const tail = toward(from, to, Math.max(0, flight - 0.5));

        kit.ribbon([tail, head], reach * 0.9, CANNON_BLUE, 0.9, share * 8, { add: 0.3 });
        kit.ribbon([tail, head], reach * 0.35, lighten(CANNON_BLUE, 0.6), 1, share * 8);
      }
      if (splash > 0 && splash < 1) {
        kit.ring(at, reach * (0.6 + splash * 2), 0.1, SPRAY, decay(splash));
        debris(kit, at, reach, 6, seed + index, splash, SPRAY, decay(splash));
      }
    }
    const pound = stretch(go, 0.5, 1);

    if (pound > 0) {
      const top = cloudOver(stage);

      for (let whirl = 0; whirl < 3; whirl += 1) {
        kit.ripple(
          floor,
          reach * (1 + ((pound * 2 + whirl / 3) % 1) * 2.4),
          0.1,
          CANNON_BLUE,
          late(pound, 0.6) * 0.8,
        );
      }
      for (let drop = 0; drop < 3; drop += 1) {
        const fall = (pound * 2.4 + drop / 3) % 1;
        const column = aside(kit, top, spread(seed, drop + 50) * reach * 1.2);
        const ground: Spot = [column[0], 0, column[2]];

        kit.ribbon(
          [toward(column, ground, Math.max(0, fall - 0.3)), toward(column, ground, fall)],
          reach * 0.8,
          lighten(CANNON_BLUE, 0.4),
          late(pound, 0.6) * 0.9,
        );
      }
    }
  },

  GMaxBefuddle(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);
    const shown = Math.min(1, go * 5) * late(go, 0.8);

    kit.glow(at, reach * 2.2, SCALE_TONES[0], shown * 0.3, 0);
    for (let scale = 0; scale < many(30, weight); scale += 1) {
      const fall = (go * 1.4 + noise(seed, scale)) % 1;
      const angle = fall * TAU * 2 + noise(seed, scale + 20) * TAU;
      const round = reach * (2 - fall * 0.9);
      const spot = aside(
        kit,
        toward(top, floor, fall),
        Math.cos(angle) * round,
        0,
        Math.sin(angle) * round,
      );
      const tone = SCALE_TONES[scale % SCALE_TONES.length];

      kit.leaf(spot, reach * 0.22, angle + share * 6, tone, shown * swell(fall));
      if (scale % 4 === 0) {
        kit.star(spot, reach * 0.3 * swell((share * 6 + scale * 0.3) % 1), 0, '#ffffff', shown);
      }
    }
    for (const [index, tone] of SCALE_TONES.entries()) {
      kit.ripple(floor, reach * (1.2 + ((go * 1.5 + index / 3) % 1) * 2), 0.08, tone, shown * 0.6);
    }
  },

  GMaxVoltCrash(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);
    const flick = Math.floor(share * 22);
    const strike = stretch(go, 0, 0.55);
    const bright = decay(strike) * (flick % 3 === 2 ? 0.5 : 1);

    if (strike < 1) {
      thunder(kit, top, floor, seed + flick, reach, bright);
    }
    const hit = stretch(go, 0.05, 1);

    kit.pool(floor, reach * (2 + hit * 4), VOLT_YELLOW, decay(hit) * 0.8, { add: 0.6 });
    kit.glow(at, reach * (2 + hit * 2.4), VOLT_YELLOW, decay(hit) * 0.6, 0.4);
    kit.glow(at, reach * 1.4, '#ffffff', decay(Math.min(1, hit * 2.5)));
    for (let wave = 0; wave < 2; wave += 1) {
      const held = stretch(hit, wave * 0.2, wave * 0.2 + 0.6);

      kit.ripple(floor, reach * (1 + held * 4.5), 0.1, VOLT_YELLOW, decay(held));
    }
    for (let arc = 0; arc < many(6, weight); arc += 1) {
      const angle = (arc / many(6, weight)) * TAU + noise(seed + flick, arc) * 0.5;

      bolt(
        kit,
        floor,
        around(kit, floor, angle, reach * (1.6 + hit * 3)),
        seed + flick * 5 + arc,
        reach * 0.4,
        reach * 0.07,
        lighten(VOLT_YELLOW, 0.4),
        late(hit, 0.4) * (flick % 2 === 0 ? 1 : 0.6),
      );
    }
  },

  GMaxGoldRush(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);
    const kept = late(go, 0.85);

    kit.glow(at, reach * 2, COIN_GOLD, swell(go) * 0.35, 0.2);
    for (let coin = 0; coin < many(22, weight); coin += 1) {
      const fall = stretch(go, noise(seed, coin) * 0.5, noise(seed, coin) * 0.5 + 0.4);

      if (fall <= 0) {
        continue;
      }
      const ground = around(
        kit,
        floor,
        noise(seed, coin + 40) * TAU,
        reach * (0.3 + noise(seed, coin + 60) * 2.6),
      );
      const spot: Spot = [ground[0], reach * 0.15 + dropped(fall, top[1]), ground[2]];
      const flying = fall < 0.7;
      const spin = flying ? Math.max(0.15, Math.abs(Math.cos(share * 14 + coin))) : 1;
      const round = reach * 0.32;

      // Painted rather than lit, so gold still reads on snow; the face darkens as it turns edge-on
      if (flying) {
        kit.puff(spot, round, COIN_RIM, kept);
        kit.puff(spot, round * 0.72, mix(COIN_RIM, COIN_GOLD, spin), kept, { add: 0.2 });
      } else {
        kit.pool(ground, round, COIN_RIM, kept, { add: 0 });
        kit.pool(ground, round * 0.72, COIN_GOLD, kept, { add: 0.2 });
      }
      if ((coin + Math.floor(share * 10)) % 5 === 0) {
        kit.star(aside(kit, spot, round * 0.3, round * 0.3), round * 1.1, 0, '#ffffff', kept);
      }
    }
  },

  GMaxChiStrike(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const lock = stretch(go, 0, CHI_LOCKS);
    const held = late(go, 0.75);

    for (let band = 0; band < 2; band += 1) {
      kit.ring(
        at,
        reach * (1.4 + (1 - lock) * (1.4 + band * 0.8)),
        0.06,
        band === 0 ? RETICLE : GMAX_RED,
        held * 0.9,
      );
    }
    for (let tick = 0; tick < 4; tick += 1) {
      const angle = (tick / 4) * TAU + (1 - lock) * 1.5;
      const near = reach * (1.6 + (1 - lock) * 1.2);

      kit.ribbon(
        [
          aside(kit, at, Math.cos(angle) * near, Math.sin(angle) * near),
          aside(
            kit,
            at,
            Math.cos(angle) * (near + reach * 1.1),
            Math.sin(angle) * (near + reach * 1.1),
          ),
        ],
        reach * 0.18,
        RETICLE,
        held,
      );
    }
    for (const [index, lands] of CHI_FISTS.entries()) {
      const angle = (index / CHI_FISTS.length) * TAU + Math.PI / 4;
      const flight = stretch(go, lands - 0.12, lands);
      const hit = stretch(go, lands, lands + 0.25);
      const from = aside(kit, at, Math.cos(angle) * reach * 5, Math.sin(angle) * reach * 4);

      if (flight > 0 && flight < 1) {
        const spot = toward(from, at, flight);

        kit.trail(toward(from, at, Math.max(0, flight - 0.4)), spot, reach * 0.5, CHI_ORANGE, 0.5);
        fist(kit, spot, reach * 0.9, CHI_ORANGE, 1);
      }
      if (hit > 0 && hit < 1) {
        sparks(
          kit,
          at,
          reach * (1.4 + hit * 2),
          10,
          seed + index,
          hit,
          lighten(CHI_ORANGE, 0.5),
          decay(hit),
        );
        kit.ring(at, reach * (1 + hit * 2.4), 0.12, CHI_ORANGE, decay(hit));
      }
    }
    const flare = stretch(go, CHI_FISTS[3], 1);

    if (flare > 0) {
      kit.glow(at, reach * (2 + flare * 1.6), RETICLE, decay(flare) * 0.7, 0.6);
      kit.star(at, reach * 3 * decay(flare), flare, '#ffffff', decay(flare));
    }
  },

  GMaxTerror(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const pool = stretch(go, 0, 0.25);
    const kept = late(go, 0.8);

    kit.pool(floor, reach * 3.4 * pool, TERROR_SHADE, kept * 0.9, { add: 0 });
    kit.ripple(floor, reach * 3.6 * pool, 0.08, TERROR_VIOLET, kept);
    for (let hand = 0; hand < 6; hand += 1) {
      const angle = (hand / 6) * TAU + 0.3;
      const base = around(kit, floor, angle, reach * 2.8);
      const grasp = stretch(go, 0.15 + hand * 0.04, 0.5 + hand * 0.04);

      if (grasp <= 0) {
        continue;
      }
      const grip = aside(
        kit,
        toward(base, at, grasp * 0.7),
        0,
        reach * 1.8 * Math.sin(grasp * Math.PI * 0.6) * (1 - grasp * 0.4),
      );
      const elbow = aside(kit, toward(base, grip, 0.5), Math.cos(angle) * reach * 0.6, reach * 0.6);

      kit.ribbon([base, elbow, grip], reach * 0.8, TERROR_SHADE, kept, 0, { add: 0 });
      kit.puff(grip, reach * 0.5, TERROR_SHADE, kept);
      kit.ribbon([base, elbow, grip], reach * 0.3, TERROR_VIOLET, kept * 0.7);
      const bend = kit.angleOn(grip, at);

      for (let finger = 0; finger < 4; finger += 1) {
        const turn = bend + (finger - 1.5) * 0.45;
        const curl = reach * (0.9 - grasp * 0.3);

        kit.ribbon(
          [
            grip,
            aside(kit, grip, Math.cos(turn) * curl, Math.sin(turn) * curl),
            aside(kit, grip, Math.cos(turn - 0.6) * curl * 1.4, Math.sin(turn - 0.6) * curl * 1.4),
          ],
          reach * 0.3,
          TERROR_SHADE,
          kept,
          0,
          { add: 0 },
        );
      }
    }
    const glare = stretch(go, 0.3, 0.45) * kept;

    for (const side of [-1, 1]) {
      const eye = aside(kit, at, side * reach * 0.8, reach * 1.5);

      kit.glow(eye, reach * 0.7, GENGAR_EYE, glare * 0.6, 0.3);
      kit.oval(eye, reach * 0.4, reach * 0.18, 0, 1, '#ffffff', glare);
    }
  },

  GMaxFoamBurst(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const pop = stretch(go, 0.7, 1);

    for (let froth = 0; froth < many(30, weight); froth += 1) {
      const layer = noise(seed, froth);
      const grow = stretch(go, layer * 0.5, layer * 0.5 + 0.15);

      if (grow <= 0) {
        continue;
      }
      const wide = reach * 3.2 * (1 - layer * 0.75);
      const spot = aside(
        kit,
        floor,
        spread(seed, froth + 30) * wide,
        layer * reach * 4.2 + reach * 0.3,
        spread(seed, froth + 50) * wide * 0.5,
      );
      const round = reach * (0.4 + noise(seed, froth + 60) * 0.5) * grow;
      const popped = stretch(
        pop,
        noise(seed, froth + 90) * 0.5,
        noise(seed, froth + 90) * 0.5 + 0.3,
      );

      if (popped <= 0) {
        kit.bubble(spot, round, FOAM, 0.9);
      } else if (popped < 1) {
        kit.ring(spot, round * (1 + popped), 0.1, FOAM, decay(popped));
      }
    }
    kit.ripple(floor, reach * 3.4, 0.08, FOAM, late(go, 0.7) * 0.7);
  },

  GMaxResonance(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const kept = late(go, 0.8);

    for (let line = 0; line < 8; line += 1) {
      const along = (go * 1.6 + line / 8) % 1;

      note(
        kit,
        aside(
          kit,
          toward(stage.source, at, along),
          Math.sin(along * 8 + line) * reach * 0.8,
          Math.sin(Math.PI * along) * reach * 2,
        ),
        reach * 0.6,
        AURORA_TONES[line % AURORA_TONES.length],
        kept * swell(along),
      );
    }
    for (let wave = 0; wave < 3; wave += 1) {
      const held = (go * 2 + wave / 3) % 1;

      kit.ring(at, reach * (0.8 + held * 2.4), 0.08, LAPRAS_BLUE, kept * decay(held));
    }
    const veil = stretch(go, 0.1, 0.4) * kept;
    // Sized to the caster rather than to the blow: it is a veil over a side, not a hit
    const near = reachOf(stage);

    for (const [band, tone] of AURORA_TONES.entries()) {
      const path: Spot[] = [];

      for (let step = 0; step <= 12; step += 1) {
        path.push(
          aside(
            kit,
            stage.source,
            (step / 12 - 0.5) * near * 5,
            near * (1.7 + band * 0.45) + Math.sin(step * 0.9 + share * 8 + band) * near * 0.25,
          ),
        );
      }
      kit.ribbon(path, near * 0.8, tone, veil * 0.4, share * 3, { add: 0.5 });
      kit.ribbon(path, near * 0.22, lighten(tone, 0.4), veil * 0.8, share * 3);
    }
  },

  GMaxCuddle(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);

    if (go < POUNCE_LANDS) {
      const leap = go / POUNCE_LANDS;
      const body = aside(
        kit,
        toward(stage.source, at, leap),
        0,
        reach * 5 * Math.sin(Math.PI * leap),
      );

      shadow(kit, floor, reach * (0.6 + leap * 1.8), leap * 0.35);
      for (const side of [-1, 1]) {
        kit.ribbon(
          [
            aside(kit, body, side * reach * 0.6, reach * 0.6),
            aside(kit, body, side * reach * 1.1, reach * 1.5),
          ],
          reach * 0.45,
          EEVEE_BROWN,
          1,
          0,
          { add: 0 },
        );
      }
      kit.puff(body, reach * 1.1, EEVEE_BROWN, 1);
      kit.puff(aside(kit, body, 0, -reach * 0.5, -reach * 0.2), reach * 0.8, EEVEE_CREAM, 1);
      return;
    }
    const hit = (go - POUNCE_LANDS) / (1 - POUNCE_LANDS);

    kit.puff(at, reach * 1.8 * (1 + hit * 0.3), EEVEE_BROWN, decay(Math.min(1, hit * 2.5)));
    kit.ripple(floor, reach * (1.4 + hit * 3.4), 0.1, EEVEE_CREAM, decay(hit));
    debris(kit, floor, reach * 1.2, 8, seed, hit, '#c8b08a', decay(hit));
    for (let love = 0; love < many(8, weight); love += 1) {
      const rise = stretch(hit, noise(seed, love) * 0.4, noise(seed, love) * 0.4 + 0.6);

      if (rise > 0 && rise < 1) {
        kit.heart(
          aside(kit, at, spread(seed, love + 20) * reach * 2.2, rise * reach * 3),
          reach * 0.6,
          0,
          CUDDLE_PINK,
          swell(rise),
        );
      }
    }
  },

  GMaxReplenish(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);

    if (go < POUNCE_LANDS) {
      const fall = go / POUNCE_LANDS;
      const body = aside(kit, at, 0, reach * 6 * (1 - fall * fall));

      shadow(kit, floor, reach * (1 + fall * 1.8), fall * 0.4);
      kit.puff(body, reach * 2, SNORLAX_TEAL, 1);
      kit.puff(aside(kit, body, 0, -reach * 0.4, -reach * 0.4), reach * 1.4, SNORLAX_BELLY, 1);
    } else {
      const hit = stretch(go, POUNCE_LANDS, 0.8);

      kit.glow(at, reach * (1.6 + hit * 2), SNORLAX_BELLY, decay(hit) * 0.6, 0.3);
      for (let wave = 0; wave < 2; wave += 1) {
        kit.ripple(
          floor,
          reach * (1.6 + stretch(hit, wave * 0.2, 1) * 4),
          0.12,
          SNORLAX_BELLY,
          decay(stretch(hit, wave * 0.2, 1)),
        );
      }
    }
    const rain = stretch(go, 0.3, 1);

    if (rain <= 0) {
      return;
    }
    // Sized to the caster rather than to the blow: these are its own side's berries
    const near = reachOf(stage);
    const home = floorOf(stage.source);

    kit.glow(stage.source, near * 1.6, HEAL_GREEN, swell(rain) * 0.45, 0.3);
    for (let berry = 0; berry < many(12, weight); berry += 1) {
      const fall = stretch(rain, noise(seed, berry) * 0.5, noise(seed, berry) * 0.5 + 0.45);

      if (fall <= 0) {
        continue;
      }
      const ground = aside(
        kit,
        home,
        spread(seed, berry + 30) * near * 3,
        0,
        spread(seed, berry + 60) * near * 1.5,
      );
      const spot: Spot = [ground[0], near * 0.35 + dropped(fall, near * 3.4), ground[2]];

      kit.puff(spot, near * 0.36, BERRY_TONES[berry % BERRY_TONES.length], late(rain, 0.8), {
        add: 0.2,
      });
      kit.leaf(
        aside(kit, spot, near * 0.15, near * 0.4),
        near * 0.2,
        0.8,
        LEAF_GREEN,
        late(rain, 0.8),
      );
    }
    sparks(kit, stage.source, near * 1.8, many(8, weight), seed, rain, HEAL_GREEN, late(rain, 0.7));
  },

  GMaxMalodor(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const billow = stretch(go, 0, 0.35);
    const kept = late(go, 0.8);

    for (let puff = 0; puff < many(12, weight); puff += 1) {
      const angle = noise(seed, puff) * TAU + share * 1.5;
      const out = reach * (0.4 + noise(seed, puff + 20) * 2) * billow;
      const boil = 1 + Math.sin(share * 12 + puff) * 0.12;

      kit.puff(
        aside(
          kit,
          at,
          Math.cos(angle) * out,
          reach * 0.4 + Math.sin(angle) * out * 0.6,
          spread(seed, puff + 60) * reach,
        ),
        reach * (0.8 + noise(seed, puff + 40) * 0.6) * billow * boil,
        puff % 3 === 0 ? MALODOR_GREEN : MALODOR_PURPLE,
        kept * 0.75,
      );
    }
    debris(kit, at, reach * 1.6, many(10, weight), seed, go, GARBAGE, kept);
    for (let reek = 0; reek < 4; reek += 1) {
      const path: Spot[] = [];

      for (let step = 0; step <= 6; step += 1) {
        path.push(
          aside(
            kit,
            at,
            (reek - 1.5) * reach * 1.1 + Math.sin(step * 1.4 + share * 10 + reek) * reach * 0.3,
            reach * (1.4 + step * 0.4 + go * 1.2),
          ),
        );
      }
      kit.ribbon(path, reach * 0.16, lighten(MALODOR_GREEN, 0.3), kept * 0.8);
    }
    sparks(kit, at, reach * 2.6, many(10, weight), seed, go, '#c0e070', kept);
  },

  GMaxMeltdown(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);

    if (go < MELT_LANDS) {
      const fall = go / MELT_LANDS;
      const glob = toward(top, at, fall * fall);

      kit.glow(glob, reach * 2, MOLTEN, 0.7, 0.5);
      kit.oval(glob, reach * 1.1, reach * 1.3, 0, 1, lighten(MOLTEN, 0.4), 1);
      kit.oval(aside(kit, glob, 0, reach * 1.2), reach * 0.4, reach * 0.7, 0, 1, MOLTEN, 0.9);
      return;
    }
    const hit = (go - MELT_LANDS) / (1 - MELT_LANDS);
    const cool = mix(MOLTEN, MELMETAL, Math.min(1, hit * 1.4));

    kit.glow(at, reach * (1.8 + hit * 2), MOLTEN, decay(hit) * 0.7, 0.5);
    kit.ring(at, reach * (1 + hit * 3), 0.12, lighten(MOLTEN, 0.5), decay(hit));
    for (let pool = 0; pool < 5; pool += 1) {
      kit.pool(
        around(
          kit,
          floor,
          noise(seed, pool) * TAU,
          reach * (0.4 + noise(seed, pool + 10) * 2.6) * Math.min(1, hit * 2),
        ),
        reach * (0.9 + noise(seed, pool + 20)) * Math.min(1, hit * 2.5),
        cool,
        late(hit, 0.7),
        { add: 0.1 },
      );
    }
    debris(kit, at, reach * 1.6, many(12, weight), seed, hit, lighten(MOLTEN, 0.3), decay(hit));
    sparks(kit, at, reach * 2.4, many(8, weight), seed + 3, hit, GMAX_MAGENTA, decay(hit) * 0.6);
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default gMaxMoves;
