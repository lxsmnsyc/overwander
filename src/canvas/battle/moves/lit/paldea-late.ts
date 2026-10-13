import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { SIGNATURE_SCALE } from '../effect/galar';
import {
  APPLE_LEAF,
  BLAZING_FLAME,
  BLAZING_RED,
  CLAP_STRIKES,
  CLAP_VIOLET,
  CLAP_YELLOW,
  CLEAVE_BLUE,
  CLEAVE_FALLS,
  CLEAVE_LIGHT,
  CLEAVE_ROCK,
  CLEAVE_SHIELD,
  COMBAT_DUST,
  COMBAT_ORANGE,
  ELECTRO_CHARGES,
  ELECTRO_STEEL,
  ELECTRO_YELLOW,
  FICKLE_DRAGON,
  FICKLE_GOLD,
  FICKLE_GREEN,
  FICKLE_HEADS,
  FICKLE_LANDS,
  FIREWALL_DARK,
  FIREWALL_GOLD,
  FIREWALL_RED,
  FIREWALL_RISES,
  FIREWALL_SPIKES,
  MAGICAL_PINK,
  MAGICAL_SPARKLE,
  NOXIOUS_FUMES,
  NOXIOUS_PURPLE,
  PSYBLADE_CUTS,
  PSY_GRID,
  PSY_NEON,
  PSY_PINK,
  RECEPTION_FREEZES,
  RECEPTION_ICE,
  RECEPTION_INK,
  RECEPTION_PAPER,
  STEAM_BLUE,
  STEAM_GLARE,
  STEAM_LANDS,
  STEAM_WHITE,
  SYRUP_AMBER,
  SYRUP_APPLE,
  SYRUP_GLOSS,
  SYRUP_LANDS,
  TACHYON_CYAN,
  TACHYON_FLIGHT,
  TACHYON_LEAVES,
  TACHYON_WHITE,
  TORQUE_LANDS,
  TORQUE_SPOKES,
  TORQUE_TYRE,
  WICKED_DARK,
  WICKED_SMOKE,
  WICKED_SPARK,
} from '../effect/paldea-late';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, arcing, bolt, debris, gathering, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, late, reachOf, toward } from './shapes';

/** What a Starmobile wheel is painted in */
interface Torque {
  rim: string;
  exhaust: string;
  /** How thick the exhaust hangs, from 0 to 1 */
  fumes: number;
}

/** Where a Torque has got to: rolling in at `head`, or `hit` from 0 once it has landed */
interface Rolled {
  at: Spot;
  reach: number;
  head: Spot;
  run: number;
  hit: number;
}

/** A closed loop on the picture round a spot, `wide` across and `tall` up */
function loop(kit: EffectBatch, at: Spot, wide: number, tall: number, turn = 0): Spot[] {
  const path: Spot[] = [];

  for (let step = 0; step <= 16; step += 1) {
    const angle = turn + (step / 16) * TAU;

    path.push(aside(kit, at, Math.cos(angle) * wide, Math.sin(angle) * tall));
  }
  return path;
}

/** A hexagon shield on the picture, whole or only one half (`keep` -1 for left, 1 for right) */
function shield(kit: EffectBatch, at: Spot, radius: number, keep: -1 | 0 | 1, alpha: number): void {
  const corner = (index: number): Spot => {
    const angle = Math.PI / 6 + (index / 6) * TAU;

    return aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius);
  };

  for (let side = 0; side < 6; side += 1) {
    // Sides 1 to 3 are on the left of the line through the top and bottom corners
    const left = side >= 1 && side <= 3;

    if (keep === (left ? 1 : -1)) {
      continue;
    }
    kit.trail(corner(side), corner(side + 1), radius * 0.08, CLEAVE_SHIELD, alpha);
  }
  if (keep <= 0) {
    kit.panel([corner(2), corner(1), corner(4), corner(3)], CLEAVE_SHIELD, alpha * 0.3);
  }
  if (keep >= 0) {
    kit.panel([corner(1), corner(0), corner(5), corner(4)], CLEAVE_SHIELD, alpha * 0.3);
  }
}

/** A spike standing up off the floor: painted, tapering to its tip */
function spike(
  kit: EffectBatch,
  base: Spot,
  height: number,
  width: number,
  colour: string,
  alpha: number,
): void {
  for (let step = 0; step < 4; step += 1) {
    kit.ribbon(
      [aside(kit, base, 0, (height * step) / 4), aside(kit, base, 0, (height * (step + 1)) / 4)],
      width * (1 - (step + 0.5) / 4),
      colour,
      alpha,
      0,
      { add: 0 },
    );
  }
}

/** A Starmobile wheel: a dark tyre, a coloured rim, spokes turned by `turn` and a hub */
function wheel(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  turn: number,
  rim: string,
  alpha: number,
): void {
  const round = loop(kit, at, radius, radius);

  kit.ribbon(round, radius * 0.4, TORQUE_TYRE, alpha, 0, { add: 0 });
  kit.ribbon(round, radius * 0.16, rim, alpha, 0, { add: 0 });
  for (let spoke = 0; spoke < TORQUE_SPOKES; spoke += 1) {
    const angle = turn + (spoke / TORQUE_SPOKES) * TAU;

    kit.ribbon(
      [at, aside(kit, at, Math.cos(angle) * radius * 0.85, Math.sin(angle) * radius * 0.85)],
      radius * 0.12,
      lighten(rim, 0.3),
      alpha,
      0,
      { add: 0 },
    );
  }
  kit.puff(at, radius * 0.3, rim, alpha);
  kit.oval(at, radius, radius, 0, 0.1, lighten(rim, 0.4), alpha * 0.6);
}

/** The frame every Torque shares, as the painted one draws it */
function torque(
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  weight: number,
  seed: number,
  look: Torque,
): Rolled {
  const at = landed(stage);
  const reach = reachOf(stage, weight);
  const run = Math.min(1, share / TORQUE_LANDS) ** 1.3;
  const head = toward(stage.source, at, run);
  const hit = share < TORQUE_LANDS ? -1 : (share - TORQUE_LANDS) / (1 - TORQUE_LANDS);

  for (let puff = 1; puff <= 6; puff += 1) {
    const back = run - puff * 0.07;

    if (back < 0) {
      break;
    }
    kit.puff(
      toward(stage.source, at, back),
      reach * (0.5 + puff * 0.14 + noise(seed, puff) * 0.2),
      look.exhaust,
      look.fumes * (1 - puff / 7) * late(share, 0.55),
    );
  }
  if (hit < 0) {
    kit.trail(toward(stage.source, at, Math.max(0, run - 0.3)), head, reach * 0.25, look.rim, 0.5);
    wheel(kit, head, reach * 1.1, share * 40, look.rim, 1);
    return { at, reach, head, run, hit };
  }
  wheel(kit, at, reach * (1.1 + hit * 0.3), share * 60, look.rim, decay(hit * 1.6));
  kit.ring(at, reach * (1 + hit * 3), 0.08, lighten(look.rim, 0.3), decay(hit));
  return { at, reach, head, run, hit };
}

const paldeaLate = {
  Syrup(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    if (share < SYRUP_LANDS) {
      const lob = share / SYRUP_LANDS;
      const head = arcing(stage.source, at, lob, reach * 3);

      kit.puff(head, reach * 0.75, SYRUP_APPLE, 1);
      kit.glow(aside(kit, head, -reach * 0.3, reach * 0.3), reach * 0.25, '#ffffff', 0.7);
      kit.leaf(aside(kit, head, reach * 0.4, reach * 0.95), reach * 0.45, 0.9, APPLE_LEAF, 1);
      sparks(kit, head, reach * 0.9, 5, seed, lob, SYRUP_AMBER, 0.7);
      return;
    }
    const hit = (share - SYRUP_LANDS) / (1 - SYRUP_LANDS);
    const stuck = late(hit, 0.5);

    kit.glow(at, reach * (0.8 + hit * 1.6), SYRUP_GLOSS, decay(hit * 2));
    kit.pool(floorOf(at), reach * (1 + Math.min(1, hit * 2) * 0.8), SYRUP_AMBER, stuck * 0.8, {
      add: 0,
    });
    for (let blob = 0; blob < many(8, weight); blob += 1) {
      const angle = noise(seed, blob) * TAU;
      const out = reach * (0.6 + Math.min(1, hit * 3) * (0.8 + noise(seed, blob + 20)));

      kit.puff(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
        reach * 0.4,
        SYRUP_AMBER,
        stuck,
      );
    }
    for (let strand = 0; strand < 5; strand += 1) {
      const right = spread(seed, strand + 10) * reach * 1.4;
      const top = reach * (0.8 - noise(seed, strand + 30) * 0.4);
      const length = reach * (0.5 + noise(seed, strand + 50)) * (0.4 + hit * 1.4);
      const drop = aside(kit, at, right, top - length);

      kit.ribbon([aside(kit, at, right, top), drop], reach * 0.18, SYRUP_AMBER, stuck, 0, {
        add: 0,
      });
      kit.puff(drop, reach * 0.26, SYRUP_AMBER, stuck);
      kit.glow(aside(kit, drop, -reach * 0.06, reach * 0.08), reach * 0.1, SYRUP_GLOSS, stuck);
    }
  },

  Electroshot(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const core = aside(kit, at, 0, reach * 2.4);
    const flick = Math.floor(share * 16);

    if (share < ELECTRO_CHARGES) {
      const charge = share / ELECTRO_CHARGES;

      // Solid steel under the light, so the core reads on a bright ground
      kit.puff(core, reach * (0.4 + charge * 0.5), ELECTRO_STEEL, 1);
      kit.glow(core, reach * (0.6 + charge * 0.9), ELECTRO_STEEL, 0.8);
      kit.glow(core, reach * (0.3 + charge * 0.4), ELECTRO_YELLOW, 0.9);
      gathering(kit, core, reach * 2.4, 10, seed, share, ELECTRO_YELLOW);
      for (let arc = 0; arc < 3; arc += 1) {
        const angle = noise(seed + flick, arc) * TAU;
        const out = reach * (0.8 + charge);

        bolt(
          kit,
          core,
          aside(kit, core, Math.cos(angle) * out, Math.sin(angle) * out),
          seed + flick * 3 + arc,
          reach * 0.5,
          reach * 0.06,
          ELECTRO_YELLOW,
          0.9,
        );
      }
      return;
    }
    const hit = (share - ELECTRO_CHARGES) / (1 - ELECTRO_CHARGES);
    const firing = late(hit, 0.4);
    const head = toward(stage.source, at, Math.min(1, hit * 4));

    kit.glow(core, reach * 1.5 * decay(hit * 3), ELECTRO_STEEL, 1);
    kit.ribbon([stage.source, head], reach * 1.2, ELECTRO_STEEL, firing * 0.8, share * 4, {
      add: 0.3,
    });
    kit.ribbon([stage.source, head], reach * 0.4, lighten(ELECTRO_STEEL, 0.8), firing, share * 4);
    for (let arc = 0; arc < 3; arc += 1) {
      bolt(
        kit,
        stage.source,
        head,
        seed + flick * 5 + arc,
        reach,
        reach * 0.07,
        ELECTRO_YELLOW,
        firing,
      );
    }
    if (hit < 0.25) {
      return;
    }
    const slam = (hit - 0.25) / 0.75;

    kit.glow(at, reach * (1.2 + slam * 1.8), ELECTRO_YELLOW, decay(slam * 1.5));
    kit.ring(at, reach * (1 + slam * 3.4), 0.1, ELECTRO_STEEL, decay(slam));
    kit.ripple(floorOf(at), reach * (1 + slam * 3), 0.08, ELECTRO_YELLOW, decay(slam));
    sparks(kit, at, reach * (1.4 + slam * 1.8), 10, seed + 1, slam, ELECTRO_YELLOW, decay(slam));
  },

  Fickle(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const run = Math.min(1, share / FICKLE_LANDS);
    const firing = late(share, 0.6);
    const big = Math.floor(noise(seed, 1) * FICKLE_HEADS);

    for (let head = 0; head < FICKLE_HEADS; head += 1) {
      const origin = aside(
        kit,
        stage.source,
        (head - (FICKLE_HEADS - 1) / 2) * reach * 1.3,
        reach * 0.8,
      );
      const fickle = head === big;
      const width = fickle ? reach * (0.4 + Math.min(1, share / 0.5) * 1.6) : reach * 0.35;
      const colour = fickle ? FICKLE_GOLD : FICKLE_GREEN;
      const tip = toward(origin, at, run);

      kit.glow(origin, width * 1.2, FICKLE_DRAGON, firing * 0.6);
      kit.ribbon([origin, tip], width * 1.8, FICKLE_DRAGON, firing * 0.4, share * 3);
      // A painted band under the light, so the beams hold on snow
      kit.ribbon([origin, tip], width * 0.7, mix(colour, '#2a4a1a', 0.3), firing, 0, { add: 0 });
      kit.ribbon([origin, tip], width, colour, firing, share * 3);
    }
    if (share < FICKLE_LANDS) {
      return;
    }
    const hit = (share - FICKLE_LANDS) / (1 - FICKLE_LANDS);

    kit.glow(at, reach * (1.2 + hit * 2), FICKLE_GOLD, decay(hit) * 0.9);
    kit.ring(at, reach * (1 + hit * 3), 0.08, FICKLE_DRAGON, decay(hit));
    sparks(kit, at, reach * (1.4 + hit * 2), 12, seed + 2, hit, FICKLE_GREEN, decay(hit));
  },

  Firewall(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const rise = Math.min(1, share / FIREWALL_RISES) ** 0.7;
    const shown = late(share, 0.7);
    // In front of it, a little toward the far side of the field
    const floor = aside(kit, floorOf(at), 0, 0, reach * 0.8);

    kit.glow(aside(kit, floor, 0, reach), reach * 2.6, FIREWALL_RED, shown * 0.35);
    kit.ripple(floor, reach * 2.8, 0.06, FIREWALL_GOLD, shown * 0.7);
    for (let one = 0; one < FIREWALL_SPIKES; one += 1) {
      const across = one / (FIREWALL_SPIKES - 1) - 0.5;
      const base = aside(kit, floor, across * reach * 5);
      const height = reach * (1.2 + Math.cos(across * Math.PI) * 1.2 + noise(seed, one) * 0.5);

      spike(kit, base, height * rise, reach * 0.9, FIREWALL_DARK, shown);
      kit.trail(base, aside(kit, base, 0, height * rise), reach * 0.12, FIREWALL_GOLD, shown);
      for (let lick = 0; lick < 3; lick += 1) {
        const up = (share * 2.2 + noise(seed, one * 3 + lick)) % 1;

        kit.glow(
          aside(kit, base, spread(seed, one * 3 + lick) * reach * 0.2, height * rise * (0.2 + up)),
          reach * 0.4 * (1 - up * 0.5),
          up < 0.4 ? FIREWALL_GOLD : FIREWALL_RED,
          swell(up) * shown,
          up < 0.4 ? 0.5 : 0.1,
        );
      }
    }
  },

  Clap(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const run = Math.min(1, share / CLAP_STRIKES);
    const top = aside(kit, at, reach * 0.6, reach * 9);
    const head = toward(top, at, run);
    const flick = Math.floor(share * 14);
    const struck = late(share, 0.4);

    bolt(kit, top, head, seed + flick, reach, reach * 0.7, CLAP_VIOLET, struck * 0.6);
    bolt(kit, top, head, seed + flick, reach, reach * 0.3, CLAP_YELLOW, struck);
    if (share < CLAP_STRIKES) {
      kit.glow(head, reach * 0.8, '#ffffff', 1);
      return;
    }
    const hit = (share - CLAP_STRIKES) / (1 - CLAP_STRIKES);
    const floor = floorOf(at);

    kit.glow(at, reach * (1.5 + hit * 3), '#ffffff', decay(hit * 3));
    kit.glow(at, reach * (1 + hit * 1.4), CLAP_YELLOW, decay(hit) * 0.7);
    kit.pool(floor, reach * 2, CLAP_YELLOW, decay(hit) * 0.6);
    kit.ripple(floor, reach * (1 + hit * 4.5), 0.1, CLAP_YELLOW, decay(hit));
    kit.ripple(floor, reach * (0.6 + hit * 3), 0.06, '#ffffff', decay(hit * 1.3));
    for (let arc = 0; arc < 4; arc += 1) {
      const angle = (arc / 4) * TAU + noise(seed, arc) * 0.6;
      const out = reach * (1.2 + hit * 2);

      bolt(
        kit,
        floor,
        [floor[0] + Math.cos(angle) * out, 0, floor[2] + Math.sin(angle) * out],
        seed + arc + flick,
        reach * 0.5,
        reach * 0.06,
        CLAP_YELLOW,
        decay(hit),
      );
    }
  },

  Cleave(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const top = aside(kit, at, reach * 0.3, reach * 6);
    const bottom = aside(kit, at, -reach * 0.15, -reach * 2.4);
    const meets = 0.7;

    if (share < CLEAVE_FALLS) {
      const fall = (share / CLEAVE_FALLS) ** 1.6 * meets;
      const tail = toward(top, bottom, Math.max(0, fall - 0.4));
      const head = toward(top, bottom, fall);

      shield(kit, at, reach * 1.7, 0, Math.min(1, share * 8));
      kit.ribbon([tail, head], reach * 0.5, mix(CLEAVE_BLUE, '#1a2a4a', 0.4), 1, 0, { add: 0 });
      kit.trail(tail, head, reach * 0.6, CLEAVE_BLUE, 0.6);
      kit.trail(tail, head, reach * 0.25, CLEAVE_LIGHT, 1);
      return;
    }
    const cut = (share - CLEAVE_FALLS) / (1 - CLEAVE_FALLS);
    const apart = reach * cut * 1.6;

    shield(kit, aside(kit, at, -apart, -apart * 0.4), reach * 1.7, -1, decay(cut));
    shield(kit, aside(kit, at, apart, -apart * 0.4), reach * 1.7, 1, decay(cut));
    kit.ribbon([top, bottom], reach * 0.5 * decay(cut), mix(CLEAVE_BLUE, '#1a2a4a', 0.4), 1, 0, {
      add: 0,
    });
    kit.trail(top, bottom, reach * 0.7 * decay(cut), CLEAVE_BLUE, 0.7);
    kit.trail(top, bottom, reach * 0.3 * decay(cut), CLEAVE_LIGHT, 1);
    kit.glow(at, reach * (1 + cut * 1.6), CLEAVE_LIGHT, decay(cut * 2));
    debris(kit, at, reach * 1.6, many(14, weight), seed, cut, CLEAVE_ROCK, decay(cut));
  },

  Tachyon(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const glowing = late(share, 0.75);

    for (const [blade, leave] of TACHYON_LEAVES.entries()) {
      if (share < leave) {
        continue;
      }
      // Up positive: the first from the lower left, the second from the lower right
      const right = blade === 0 ? Math.cos(0.6) : -Math.cos(0.6);
      const up = Math.sin(0.6);
      const start = aside(kit, at, -right * reach * 6, -up * reach * 6);
      const end = aside(kit, at, right * reach * 2.5, up * reach * 2.5);
      const flight = Math.min(1, (share - leave) / TACHYON_FLIGHT) ** 1.2;
      const through = 6 / 8.5;
      const passed = Math.max(0, (flight - through) / (1 - through));

      if (flight < 1) {
        const head = toward(start, end, flight);
        const blur = toward(start, end, Math.max(0, flight - 0.1));

        kit.trail(
          toward(start, end, Math.max(0, flight - 0.45)),
          head,
          reach * 0.14,
          TACHYON_CYAN,
          0.6,
        );
        kit.ribbon([blur, head], reach * 0.22, mix(TACHYON_CYAN, '#0a3a4a', 0.4), 1, 0, { add: 0 });
        kit.trail(blur, head, reach * 0.3, TACHYON_WHITE, 1);
        kit.glow(head, reach * 0.4, TACHYON_CYAN, 1);
      }
      if (passed > 0) {
        const cutFrom = aside(kit, at, -right * reach * 1.8, -up * reach * 1.8);
        const cutTo = aside(kit, at, right * reach * 1.8, up * reach * 1.8);

        kit.ribbon([cutFrom, cutTo], reach * 0.14, mix(TACHYON_CYAN, '#0a3a4a', 0.4), glowing, 0, {
          add: 0,
        });
        kit.trail(cutFrom, cutTo, reach * 0.4, TACHYON_CYAN, glowing * 0.6);
        kit.trail(cutFrom, cutTo, reach * 0.16, TACHYON_WHITE, glowing);
        sparks(
          kit,
          at,
          reach * (1 + passed * 0.8),
          8,
          seed + blade,
          passed,
          TACHYON_CYAN,
          decay(passed),
        );
      }
    }
  },

  Psyblade(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = Math.min(1, share * 6) * late(share, 0.75);
    // The cut runs from lower left to upper right, bowed up a little
    const along = (t: number): Spot =>
      aside(
        kit,
        at,
        -reach * 2.4 + t * reach * 4.8,
        -reach * 1.2 + t * reach * 2.6 + swell(t) * reach * 0.3,
      );

    for (let line = -3; line <= 3; line += 1) {
      kit.trail(
        aside(kit, at, line * reach * 0.7, -reach * 2.1),
        aside(kit, at, line * reach * 0.7, reach * 2.1),
        reach * 0.04,
        PSY_GRID,
        shown * 0.35,
      );
      kit.trail(
        aside(kit, at, -reach * 2.1, line * reach * 0.7),
        aside(kit, at, reach * 2.1, line * reach * 0.7),
        reach * 0.04,
        PSY_GRID,
        shown * 0.35,
      );
    }
    const cutting = Math.min(1, share / PSYBLADE_CUTS) ** 0.8;
    const fading =
      share < PSYBLADE_CUTS ? 1 : decay(((share - PSYBLADE_CUTS) / (1 - PSYBLADE_CUTS)) * 1.6);
    const from = share < PSYBLADE_CUTS ? Math.max(0, cutting - 0.5) : 0;
    const path: Spot[] = [];

    for (let step = 0; step <= 10; step += 1) {
      path.push(along(from + (cutting - from) * (step / 10)));
    }
    kit.ribbon(path, reach * 0.4 * fading, mix(PSY_PINK, '#4a0a3a', 0.3), 1, 0, { add: 0 });
    kit.ribbon(path, reach * 1 * fading, PSY_PINK, 0.8, share * 3);
    kit.ribbon(path, reach * 0.35 * fading, PSY_NEON, 1, share * 3);
    if (share < PSYBLADE_CUTS) {
      kit.glow(along(cutting), reach * 0.5, PSY_PINK, 1);
      return;
    }
    const hit = (share - PSYBLADE_CUTS) / (1 - PSYBLADE_CUTS);

    kit.glow(at, reach * (1 + hit * 1.4), PSY_PINK, decay(hit * 2) * 0.7);
    for (let pixel = 0; pixel < many(18, weight); pixel += 1) {
      const spot = along(0.1 + noise(seed, pixel) * 0.8);

      kit.streak(
        aside(
          kit,
          spot,
          spread(seed, pixel + 30) * reach * 2 * hit,
          -(spread(seed, pixel + 60) * 2 - 1) * reach * hit,
        ),
        reach * 0.24,
        reach * 0.24,
        0,
        pixel % 2 === 0 ? PSY_PINK : PSY_NEON,
        Math.min(1, hit * 4) * decay(hit),
        { add: 0.4 },
      );
    }
  },

  Steamjet(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const run = Math.min(1, share / STEAM_LANDS);
    const flowing = late(share, 0.55);
    const head = toward(stage.source, at, run);

    kit.ribbon([stage.source, head], reach * 1.6, STEAM_BLUE, flowing * 0.5, share * 4);
    kit.ribbon([stage.source, head], reach * 0.7, mix(STEAM_BLUE, '#0a2a5a', 0.3), flowing, 0, {
      add: 0,
    });
    kit.ribbon([stage.source, head], reach * 0.4, lighten(STEAM_BLUE, 0.6), flowing, share * 4);
    sparks(
      kit,
      toward(stage.source, at, run * 0.6),
      reach * 1.4,
      7,
      seed,
      share,
      STEAM_WHITE,
      flowing * 0.8,
    );
    if (share < STEAM_LANDS) {
      return;
    }
    const hit = (share - STEAM_LANDS) / (1 - STEAM_LANDS);

    kit.glow(at, reach * (1.4 + hit * 1.6), STEAM_GLARE, swell(Math.min(1, hit * 1.3)) * 0.5);
    kit.ring(at, reach * (1 + hit * 2.4), 0.08, lighten(STEAM_BLUE, 0.4), decay(hit));
    for (let puff = 0; puff < many(8, weight); puff += 1) {
      const rise = hit + noise(seed, puff) * 0.3;

      kit.puff(
        aside(kit, at, spread(seed, puff + 10) * reach * 1.8, -reach * 0.6 + rise * reach * 3),
        reach * (0.6 + hit * 1.2),
        STEAM_WHITE,
        0.7 * decay(hit),
      );
    }
  },

  Reception(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const pop = Math.min(1, share * 8);
    const shown = late(share, 0.7);
    const freeze = Math.max(0, Math.min(1, (share - 0.15) / (RECEPTION_FREEZES - 0.15)));
    const bubble = aside(kit, at, reach * 0.9, reach * 2.4);
    const wide = reach * 1.2 * pop;
    const tall = reach * 0.8 * pop;
    const paper = mix(RECEPTION_PAPER, RECEPTION_ICE, freeze);
    const ink = mix(RECEPTION_INK, lighten(RECEPTION_ICE, 0.3), freeze);

    // The bubble painted, with its ink outline and a tail down to it
    kit.puff(bubble, tall, paper, shown);
    kit.puff(aside(kit, bubble, -wide * 0.45), tall * 0.85, paper, shown);
    kit.puff(aside(kit, bubble, wide * 0.45), tall * 0.85, paper, shown);
    kit.ribbon(loop(kit, bubble, wide, tall), reach * 0.08, RECEPTION_INK, shown, 0, { add: 0 });
    kit.ribbon(
      [aside(kit, bubble, -wide * 0.5, -tall * 0.8), aside(kit, bubble, -wide * 0.95, -tall * 1.6)],
      reach * 0.16,
      RECEPTION_INK,
      shown,
      0,
      { add: 0 },
    );
    for (let dot = -1; dot <= 1; dot += 1) {
      kit.puff(aside(kit, bubble, dot * wide * 0.4), reach * 0.14 * pop, ink, shown);
    }
    if (freeze > 0) {
      for (let crack = 0; crack < 3; crack += 1) {
        const angle = noise(seed, crack) * TAU;

        kit.ribbon(
          [
            bubble,
            aside(kit, bubble, Math.cos(angle) * wide * freeze, Math.sin(angle) * tall * freeze),
          ],
          reach * 0.08,
          '#ffffff',
          shown,
          0,
          { add: 0 },
        );
      }
      kit.star(
        aside(kit, bubble, wide * 0.5, tall * 0.5),
        reach * 0.4 * freeze,
        share * 3,
        '#ffffff',
        shown,
      );
    }
    if (share < RECEPTION_FREEZES) {
      return;
    }
    const chill = (share - RECEPTION_FREEZES) / (1 - RECEPTION_FREEZES);

    for (let strand = 0; strand < 3; strand += 1) {
      const radius = reach * (1.3 + chill * 1.6 + strand * 0.3);
      const start = chill * 4 + strand * 2.1;
      const path: Spot[] = [];

      for (let step = 0; step <= 10; step += 1) {
        const angle = start + (step / 10) * 1.8;

        path.push(
          aside(
            kit,
            at,
            Math.cos(angle) * radius,
            -reach * 0.2 + chill * reach * 0.6,
            Math.sin(angle) * radius,
          ),
        );
      }
      kit.ribbon(path, reach * 0.12, mix(RECEPTION_ICE, '#2a5a8a', 0.3), decay(chill) * 0.8, 0, {
        add: 0,
      });
      kit.ribbon(path, reach * 0.2, lighten(RECEPTION_ICE, 0.4), decay(chill) * 0.6, chill * 3);
    }
    for (let flake = 0; flake < many(9, weight); flake += 1) {
      const angle = noise(seed, flake + 40) * TAU + chill * 2;
      const out = reach * (0.6 + chill * 2.4 * (0.5 + noise(seed, flake + 60)));
      const spot = aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.6);

      kit.shard(spot, reach * 0.22, chill * 3 + flake, RECEPTION_ICE, decay(chill));
      kit.star(spot, reach * 0.35, chill * 3 + flake, '#ffffff', decay(chill));
    }
  },

  Blazing(kit, stage, share, { seed, weight }) {
    const { at, reach, head, hit } = torque(kit, stage, share, weight, seed, {
      rim: BLAZING_RED,
      exhaust: BLAZING_FLAME,
      fumes: 0.6,
    });

    if (hit < 0) {
      kit.glow(head, reach * 1.6, BLAZING_FLAME, 0.4, 0.2);
      sparks(kit, head, reach * 1.6, 6, seed, (share * 3) % 1, BLAZING_FLAME, 0.9);
      return;
    }
    kit.glow(at, reach * (1.2 + hit * 2), BLAZING_FLAME, decay(hit * 1.5));
    kit.glow(at, reach * (1.4 + hit * 1.6), BLAZING_RED, decay(hit) * 0.7);
    kit.pool(floorOf(at), reach * 2, BLAZING_RED, decay(hit) * 0.5);
    for (let lick = 0; lick < many(8, weight); lick += 1) {
      const up = (hit * 1.5 + noise(seed, lick)) % 1;

      kit.glow(
        aside(kit, at, spread(seed, lick + 10) * reach * 1.6, -reach * 0.6 + up * reach * 2.4),
        reach * 0.5 * (1 - up * 0.5),
        up < 0.4 ? BLAZING_FLAME : BLAZING_RED,
        swell(up) * decay(hit),
        up < 0.4 ? 0.5 : 0.1,
      );
    }
  },

  Wicked(kit, stage, share, { seed, weight }) {
    const { at, reach, head, hit } = torque(kit, stage, share, weight, seed, {
      rim: WICKED_DARK,
      exhaust: WICKED_SMOKE,
      fumes: 0.4,
    });

    if (hit < 0) {
      sparks(kit, head, reach * 1.4, 4, seed, (share * 3) % 1, WICKED_SPARK, 0.8);
      return;
    }
    kit.puff(at, reach * (1.4 + hit * 1.6), WICKED_SMOKE, decay(hit) * 0.4);
    kit.ring(at, reach * (0.8 + hit * 2.4), 0.08, WICKED_SPARK, decay(hit));
    sparks(kit, at, reach * (1.4 + hit * 2), 12, seed + 1, hit, WICKED_SPARK, decay(hit));
    sparks(
      kit,
      at,
      reach * 2.4,
      many(10, weight),
      seed + 2,
      hit,
      lighten(WICKED_SPARK, 0.3),
      decay(hit),
    );
  },

  Noxious(kit, stage, share, { seed, weight }) {
    const { at, reach, head, hit } = torque(kit, stage, share, weight, seed, {
      rim: NOXIOUS_PURPLE,
      exhaust: NOXIOUS_FUMES,
      fumes: 0.5,
    });

    if (hit < 0) {
      sparks(kit, head, reach * 1.4, 5, seed, (share * 3) % 1, NOXIOUS_FUMES, 0.8);
      return;
    }
    const bloom = Math.min(1, hit * 2);

    for (let cloud = 0; cloud < 6; cloud += 1) {
      const angle = (cloud / 6) * TAU + noise(seed, cloud) * 0.6;
      const out = reach * bloom * 1.4;

      kit.puff(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.6),
        reach * (0.8 + bloom * 0.8),
        cloud % 2 === 0 ? NOXIOUS_PURPLE : NOXIOUS_FUMES,
        decay(hit) * 0.5,
      );
    }
    for (let pop = 0; pop < many(8, weight); pop += 1) {
      kit.bubble(
        aside(
          kit,
          at,
          spread(seed, pop + 3) * reach * 2,
          -reach * 0.4 + ((hit * 1.4 + noise(seed, pop + 9)) % 1) * reach * 2.4,
        ),
        reach * 0.25,
        NOXIOUS_FUMES,
        decay(hit),
      );
    }
  },

  Combat(kit, stage, share, { seed, weight }) {
    const { at, reach, head, hit } = torque(kit, stage, share, weight, seed, {
      rim: COMBAT_ORANGE,
      exhaust: COMBAT_DUST,
      fumes: 0.5,
    });

    if (hit < 0) {
      sparks(kit, head, reach * 1.4, 4, seed, (share * 3) % 1, COMBAT_DUST, 0.8);
      return;
    }
    // The punch: a spiked burst painted solid, lit from inside
    for (let point = 0; point < 10; point += 1) {
      const angle = (point / 10) * TAU;
      const out = reach * (0.8 + hit * 1.4) * (1.5 + noise(seed, point * 2) * 0.4);

      kit.ribbon(
        [at, aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out)],
        reach * 0.5 * (0.8 + hit),
        lighten(COMBAT_ORANGE, 0.3),
        decay(hit * 1.4),
        0,
        { add: 0 },
      );
    }
    kit.puff(at, reach * (0.8 + hit * 1.2), COMBAT_ORANGE, decay(hit * 1.4));
    kit.glow(at, reach * (1 + hit * 1.4), '#fff0c0', decay(hit * 2));
    for (let line = 0; line < 10; line += 1) {
      const angle = (line / 10) * TAU + noise(seed, line + 30) * 0.3;
      const inner = reach * (2 + hit * 0.6);
      const outer = reach * (3.6 + hit * 0.6);

      kit.ribbon(
        [
          aside(kit, at, Math.cos(angle) * outer, Math.sin(angle) * outer),
          aside(kit, at, Math.cos(angle) * inner, Math.sin(angle) * inner),
        ],
        reach * 0.14,
        COMBAT_ORANGE,
        decay(hit),
        0,
        { add: 0 },
      );
    }
  },

  Magical(kit, stage, share, { seed, weight }) {
    const { at, reach, head, run, hit } = torque(kit, stage, share, weight, seed, {
      rim: MAGICAL_PINK,
      exhaust: lighten(MAGICAL_PINK, 0.5),
      fumes: 0.5,
    });

    if (hit < 0) {
      for (let glint = 0; glint < 5; glint += 1) {
        const back = toward(stage.source, at, Math.max(0, run - glint * 0.08));

        kit.star(
          aside(kit, back, spread(seed, glint) * reach, spread(seed, glint + 9) * reach),
          reach * 0.4,
          share * 6 + glint,
          glint % 2 === 0 ? MAGICAL_SPARKLE : '#ffffff',
          1 - glint * 0.15,
        );
      }
      kit.glow(head, reach * 1.4, MAGICAL_PINK, 0.35);
      return;
    }
    kit.glow(at, reach * (1.2 + hit * 1.6), MAGICAL_PINK, decay(hit) * 0.7);
    for (let glint = 0; glint < many(10, weight); glint += 1) {
      const angle = noise(seed, glint) * TAU;
      const out = reach * (0.6 + hit * (1.8 + noise(seed, glint + 20)));
      const spot = aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out);
      const colour = glint % 2 === 0 ? MAGICAL_SPARKLE : MAGICAL_PINK;

      // A painted heart of each star, so the sparkle holds on snow
      kit.shard(spot, reach * 0.2, hit * 4 + glint, MAGICAL_PINK, decay(hit));
      kit.star(spot, reach * 0.45 * (1 - hit * 0.4), hit * 4 + glint, colour, decay(hit));
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default paldeaLate;
