import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import {
  ACCEL_LANDS,
  BEAK_COLD,
  BEAK_FIRE,
  BEAK_HEATS,
  BEAK_HOT,
  BEAK_LANDS,
  BEAK_RED,
  BONE_LANDS,
  BONE_WHITE,
  CLANGOR_ARROWS,
  CLANGOR_BEATS,
  DISC_DARK,
  DISC_STEEL,
  FLEUR_OPENS,
  FLEUR_PALE,
  FLEUR_REACHES,
  GHOST_FIRE,
  GHOST_PURPLE,
  INSTRUCT_GLOW,
  INSTRUCT_SIGIL,
  IRONBASH_FIRST,
  IRONBASH_SECOND,
  KOMMO_DARK,
  KOMMO_GOLD,
  KOMMO_GREY,
  MAGEARNA_PINK,
  MAGEARNA_STEEL,
  MELMETAL_DARK,
  MELMETAL_GOLD,
  MELMETAL_STEEL,
  MULTI_LANDS,
  ORANGURU_FAN,
  ORANGURU_PURPLE,
  PLASMA_BLUE,
  PLASMA_CORE,
  PLASMA_FISTS,
  PLASMA_LANDS,
  ROCK_BROWN,
  ROCK_DUST,
  SCALES_CLANGS,
  SCALES_GAP,
  SHADOW_DARK,
  SHELL_DARK,
  SHELL_FIRE,
  SHELL_SPIKE,
  STAT_COLOURS,
  THIEF_GREEN,
  THIEF_PULLS,
  THIEF_SINKS,
  TRAP_BLOWS,
  TROP_FRUIT,
  TROP_LANDS,
  TSAREENA_DARK,
  TSAREENA_GREEN,
  ZERAORA_GOLD,
} from '../effect/alola-signatures';
import { SIGNATURE_SCALE } from '../effect/galar';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, bolt, bone, debris, sickle, smoke, sparks } from './pieces';
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

/** A closed loop of points round a spot on the picture */
function loop(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  sides: number,
  turn: number,
  closed = true,
): Spot[] {
  const path: Spot[] = [];

  for (let corner = 0; corner <= (closed ? sides : sides - 1); corner += 1) {
    const angle = turn + (corner / sides) * TAU;

    path.push(aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  return path;
}

/** One of Melmetal's hex nuts: a thick gold hexagon round a dark hole, all painted */
function nut(kit: EffectBatch, at: Spot, size: number, turn: number, alpha: number): void {
  const path = loop(kit, at, size * 0.72, 6, turn);

  kit.puff(at, size * 0.4, MELMETAL_DARK, alpha);
  kit.ribbon(path, size * 0.62, MELMETAL_DARK, alpha, 0, { add: 0 });
  kit.ribbon(path, size * 0.45, MELMETAL_GOLD, alpha, 0, { add: 0.2 });
  kit.glow(aside(kit, at, -size * 0.35, size * 0.35), size * 0.25, '#fff4cc', alpha * 0.6, 0.5);
}

/** A stat arrow pointing up, painted with light over it so it reads on any ground */
function boost(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  if (alpha <= 0) {
    return;
  }
  const shaft = [aside(kit, at, 0, -size), aside(kit, at, 0, size * 0.4)];
  const head = [
    aside(kit, at, -size * 0.7, size * 0.1),
    aside(kit, at, 0, size),
    aside(kit, at, size * 0.7, size * 0.1),
  ];

  kit.glow(at, size * 1.3, colour, alpha * 0.4, 0.3);
  kit.ribbon(shaft, size * 0.75, '#2a2030', alpha * 0.5, 0, { add: 0 });
  kit.ribbon(head, size * 0.6, '#2a2030', alpha * 0.5, 0, { add: 0 });
  kit.ribbon(shaft, size * 0.5, colour, alpha, 0, { add: 0.3 });
  kit.ribbon(head, size * 0.38, colour, alpha, 0, { add: 0.3 });
}

/** A flame tongue: a painted leaf with light in it, `way` the direction it licks on the picture */
function tongue(
  kit: EffectBatch,
  at: Spot,
  size: number,
  way: number,
  colour: string,
  alpha: number,
): void {
  kit.leaf(at, size, way - Math.PI / 2, colour, alpha);
  kit.glow(at, size * 0.5, lighten(colour, 0.5), alpha * 0.7, 0.5);
}

/** A unit step along the line from one spot to another */
function heading(from: Spot, to: Spot): Spot {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]) || 1;

  return [(to[0] - from[0]) / length, (to[1] - from[1]) / length, (to[2] - from[2]) / length];
}

/** A spot moved some way along a heading */
function along(spot: Spot, way: Spot, distance: number): Spot {
  return [spot[0] + way[0] * distance, spot[1] + way[1] * distance, spot[2] + way[2] * distance];
}

const alolaSignatures = {
  Trop(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const pivot = aside(kit, at, -reach * 0.3, -reach * 1.2);
    const radius = reach * 2.6;
    const start = Math.PI * 1.05;
    const end = Math.PI * 0.1;
    const swing = Math.min(1, share / TROP_LANDS) ** 0.8;
    const angle = start + (end - start) * swing;
    const shown = late(share, 0.6);

    sickle(kit, pivot, radius, start, angle, reach * 0.9, TSAREENA_DARK, shown * 0.6, 0);
    sickle(kit, pivot, radius, start, angle, reach * 0.55, TSAREENA_GREEN, shown * 0.9, 0.3);
    // The leaves shed along the arc, drifting down once the kick has passed them
    for (let leaf = 0; leaf < 8; leaf += 1) {
      const place = leaf / 8;

      if (swing < place) {
        continue;
      }
      const drift = swing - place + Math.max(0, share - TROP_LANDS);
      const turn = start + (end - start) * place;
      const out = radius + spread(seed, leaf) * reach * 0.4;

      kit.leaf(
        aside(
          kit,
          pivot,
          Math.cos(turn) * out + spread(seed, leaf + 10) * drift * reach * 0.6,
          Math.sin(turn) * out - drift * reach * 1.5,
        ),
        reach * 0.8,
        turn + drift * 6,
        TROP_FRUIT[leaf % TROP_FRUIT.length],
        late(share, 0.55),
      );
    }
    if (share < TROP_LANDS + 0.1) {
      const foot = aside(kit, pivot, Math.cos(angle) * radius, Math.sin(angle) * radius);
      const fading = late(share, TROP_LANDS);

      kit.puff(foot, reach * 0.55, TSAREENA_GREEN, fading);
      kit.star(foot, reach * 0.8, share * 8, '#ffffff', fading);
    }
    if (share < TROP_LANDS) {
      return;
    }
    const hit = (share - TROP_LANDS) / (1 - TROP_LANDS);

    kit.glow(at, reach * (1 + hit * 1.4), TROP_FRUIT[0], decay(hit) * 0.7);
    kit.ring(at, reach * (0.8 + hit * 2.6), 0.08, TROP_FRUIT[2], decay(hit));
    for (let sparkle = 0; sparkle < many(10, weight); sparkle += 1) {
      const turn = noise(seed, sparkle + 20) * TAU;
      const out = reach * (0.6 + hit * 2.4) * (0.5 + noise(seed, sparkle + 40) * 0.5);
      const spot = aside(kit, at, Math.cos(turn) * out, Math.sin(turn) * out + hit * reach * 0.6);
      const colour = TROP_FRUIT[sparkle % TROP_FRUIT.length];

      kit.puff(spot, reach * 0.18, colour, decay(hit));
      kit.star(spot, reach * 0.55, share * 6 + sparkle, colour, decay(hit));
    }
    sparks(kit, at, reach * 2.4, many(8, weight), seed + 1, hit, TROP_FRUIT[1], decay(hit));
  },

  Instruct(kit, stage, share, { weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const shown = Math.min(1, share * 8) * late(share, 0.8);
    const sigil = aside(kit, at, 0, reach * 2.2);
    const hub = aside(kit, at, -reach * 2.4, reach * 0.2);
    const point = kit.angleOn(hub, sigil);
    const open = Math.min(1, share / INSTRUCT_SIGIL);
    const formed = Math.min(1, Math.max(0, (share - 0.05) / (INSTRUCT_SIGIL - 0.05)));

    kit.ribbon(
      [hub, aside(kit, hub, -Math.cos(point) * reach * 0.6, -Math.sin(point) * reach * 0.6)],
      reach * 0.2,
      ORANGURU_PURPLE,
      shown,
      0,
      { add: 0 },
    );
    // The fan: blades spread round its handle, pointed at the sigil
    for (let blade = 0; blade < 5; blade += 1) {
      const angle = point + (blade / 4 - 0.5) * 1.2 * open;
      const spot = aside(kit, hub, Math.cos(angle) * reach * 0.7, Math.sin(angle) * reach * 0.7);

      kit.leaf(spot, reach * 1.1, angle - Math.PI / 2, ORANGURU_PURPLE, shown);
      kit.leaf(spot, reach * 0.85, angle - Math.PI / 2, ORANGURU_FAN, shown);
    }
    for (let dot = 0; dot < 4; dot += 1) {
      const travel = (share * 2 + dot / 4) % 1;

      kit.glow(
        toward(hub, sigil, travel),
        reach * 0.22,
        INSTRUCT_GLOW,
        swell(travel) * shown * open,
        0.6,
      );
    }
    // The sigil: a ring with a six-pointed star in it, painted under its light
    kit.glow(sigil, reach * 1.3, INSTRUCT_GLOW, shown * formed * 0.4, 0.3);
    kit.ring(sigil, reach * 1.1 * Math.max(0.05, formed), 0.1, INSTRUCT_GLOW, shown);
    for (let triangle = 0; triangle < 2; triangle += 1) {
      const path = loop(kit, sigil, reach * 0.95 * formed, 3, share * 2 + triangle * Math.PI);

      kit.ribbon(path, reach * 0.14, ORANGURU_PURPLE, shown * formed, 0, { add: 0 });
      kit.ribbon(path, reach * 0.07, INSTRUCT_GLOW, shown * formed);
    }
    kit.star(sigil, reach * 0.6, share * 3, '#ffffff', shown * formed);
    kit.ribbon([sigil, at], reach * 0.25, INSTRUCT_GLOW, shown * formed * 0.4);
    if (share < INSTRUCT_SIGIL) {
      return;
    }
    for (let pulse = 0; pulse < 3; pulse += 1) {
      const out = ((share - INSTRUCT_SIGIL) * 2.2 + pulse / 3) % 1;

      kit.ring(at, reach * (0.6 + out * 2.4), 0.08, INSTRUCT_GLOW, decay(out) * shown);
    }
    kit.ripple(floorOf(at), reach * 1.8, 0.08, ORANGURU_PURPLE, shown * 0.6, { add: 0 });
  },

  Beak(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const perch = aside(kit, stage.source, 0, reach * 1.8);
    const heat = Math.min(1, share / BEAK_HEATS);
    const drive = Math.min(1, Math.max(0, (share - BEAK_HEATS) / (BEAK_LANDS - BEAK_HEATS)));

    if (share < BEAK_LANDS) {
      const way = heading(perch, at);
      const head = toward(perch, at, drive ** 1.5);
      const tip = along(head, way, reach);
      const base = along(tip, way, -reach * 2.4);
      const colour = mix(BEAK_COLD, BEAK_RED, heat);

      if (drive > 0) {
        kit.ribbon([perch, head], reach * 0.8, BEAK_FIRE, drive * 0.6, share * 4);
      }
      kit.glow(toward(base, tip, 0.5), reach * 1.4, BEAK_RED, heat * 0.5, 0.3);
      // The beak tapering to its point, painted so it holds on snow
      kit.ribbon([base, toward(base, tip, 0.4)], reach * 0.95, colour, 1, 0, { add: 0 });
      kit.ribbon([toward(base, tip, 0.35), toward(base, tip, 0.75)], reach * 0.65, colour, 1, 0, {
        add: 0,
      });
      kit.ribbon([toward(base, tip, 0.7), tip], reach * 0.32, colour, 1, 0, { add: 0 });
      kit.ribbon(
        [toward(base, tip, 0.2), toward(base, tip, 0.9)],
        reach * 0.3,
        BEAK_HOT,
        heat * 0.8,
      );
      sparks(
        kit,
        perch,
        reach * 1.6,
        8,
        seed + Math.floor(share * 10),
        (share * 5) % 1,
        BEAK_FIRE,
        heat,
      );
      return;
    }
    const blast = (share - BEAK_LANDS) / (1 - BEAK_LANDS);

    kit.glow(at, reach * (1.2 + blast * 1.8), BEAK_HOT, decay(blast * 1.6));
    kit.glow(at, reach * (1.6 + blast * 2), BEAK_FIRE, decay(blast) * 0.8);
    kit.ring(at, reach * (1 + blast * 3), 0.08, BEAK_RED, decay(blast));
    kit.ripple(floorOf(at), reach * (1 + blast * 3), 0.1, BEAK_FIRE, decay(blast) * 0.8);
    for (let flame = 0; flame < many(7, weight); flame += 1) {
      const angle = Math.PI * 0.1 + (flame / 6) * Math.PI * 0.8;
      const out = reach * (0.6 + blast * 1.8);

      tongue(
        kit,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.7),
        reach * 1.1 * decay(blast * 0.5),
        angle,
        flame % 2 === 0 ? BEAK_FIRE : BEAK_RED,
        decay(blast),
      );
    }
    smoke(kit, at, reach * 1.8, many(5, weight), seed, blast, '#5a4a44', decay(blast) * 0.35);
    sparks(kit, at, reach * (1.4 + blast * 2), 12, seed + 1, blast, BEAK_HOT, decay(blast));
  },

  Scales(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const from = stage.source;
    const facing = kit.angleOn(from, at);
    const shaking = late(share, 0.4);

    for (let one = 0; one < 7; one += 1) {
      const angle = Math.PI * 0.9 - (one / 6) * Math.PI * 0.8;
      const jitter = Math.sin(share * 60 + one * 1.7) * reach * 0.14;
      const spot = aside(
        kit,
        from,
        Math.cos(angle) * reach * 1.3 + jitter,
        reach * 0.6 + Math.sin(angle) * reach * 1.1,
      );

      kit.shard(spot, reach * 0.65, Math.PI / 4 + jitter / reach, KOMMO_DARK, shaking);
      kit.shard(spot, reach * 0.5, Math.PI / 4 + jitter / reach, KOMMO_GOLD, shaking, { add: 0.2 });
    }
    for (let one = 0; one < SCALES_CLANGS; one += 1) {
      const travel = (share - one * SCALES_GAP) / 0.4;

      if (travel < 0 || travel > 1) {
        continue;
      }
      const centre = toward(from, at, travel * 0.85);
      const radius = reach * (0.7 + travel * 1.3);
      const path: Spot[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const angle = facing + (step / 8 - 0.5) * 1.8;
        const out = radius * (step % 2 === 0 ? 0.9 : 1.1);

        path.push(aside(kit, centre, Math.cos(angle) * out, Math.sin(angle) * out));
      }
      const alpha = Math.min(1, (1 - travel) * 4);

      kit.ribbon(path, reach * 0.35, KOMMO_DARK, alpha * 0.6, 0, { add: 0 });
      kit.ribbon(path, reach * 0.18, KOMMO_GOLD, alpha, 0, { add: 0.4 });
    }
    if (share < 0.4) {
      return;
    }
    const hit = (share - 0.4) / 0.6;

    kit.ring(at, reach * (0.8 + hit * 2.6), 0.08, KOMMO_GOLD, decay(hit));
    kit.glow(at, reach * 1.2, KOMMO_GOLD, swell(hit) * 0.5, 0.3);
    for (let piece = 0; piece < many(9, weight); piece += 1) {
      kit.shard(
        thrown(at, seed, piece, hit, reach * 2.6, reach * 1.4),
        reach * 0.5,
        share * 8 + piece,
        piece % 3 === 0 ? KOMMO_GREY : KOMMO_GOLD,
        decay(hit),
        { add: 0.2 },
      );
    }
    sparks(kit, at, reach * (1.2 + hit * 1.6), 10, seed + 1, hit, KOMMO_GOLD, decay(hit));
  },

  Trap(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    if (share < TRAP_BLOWS + 0.1) {
      const tick = share / TRAP_BLOWS;
      const shown = Math.max(0, 1 - Math.max(0, share - TRAP_BLOWS) / 0.1);
      const shell = aside(kit, stage.source, 0, reach * 1.4);
      const pulse = 0.5 + 0.5 * Math.sin(tick ** 2 * 40);
      const hot = Math.min(1, tick) * pulse;

      kit.glow(
        shell,
        reach * (1.4 + tick * 0.6),
        SHELL_FIRE,
        (0.3 + pulse * 0.5) * Math.min(1, tick) * shown,
        0.3,
      );
      kit.puff(shell, reach * 1.1, SHELL_DARK, shown);
      sickle(
        kit,
        shell,
        reach * 1.05,
        0,
        Math.PI,
        reach * 0.3,
        mix(SHELL_DARK, SHELL_FIRE, hot),
        shown,
        0.4,
      );
      // The spikes round the top of the shell, their tips glowing as it ticks
      for (let spike = 0; spike < 5; spike += 1) {
        const angle = Math.PI * 0.85 - (spike / 4) * Math.PI * 0.7;
        const root = aside(kit, shell, Math.cos(angle) * reach * 1.1, Math.sin(angle) * reach);

        kit.shard(root, reach * 0.7, angle, SHELL_SPIKE, shown);
        kit.glow(
          aside(kit, root, Math.cos(angle) * reach * 0.3, Math.sin(angle) * reach * 0.3),
          reach * 0.35,
          SHELL_FIRE,
          hot * shown,
          0.5,
        );
      }
    }
    if (share < TRAP_BLOWS) {
      return;
    }
    const blast = (share - TRAP_BLOWS) / (1 - TRAP_BLOWS);

    kit.glow(at, reach * (1.2 + blast * 2.4), '#fff0c0', decay(blast * 1.6));
    kit.glow(at, reach * (1.6 + blast * 2.6), SHELL_FIRE, decay(blast) * 0.85);
    kit.ring(at, reach * (1 + blast * 3.6), 0.08, '#ffd27a', decay(blast));
    kit.ripple(floorOf(at), reach * (1.2 + blast * 3.6), 0.1, SHELL_FIRE, decay(blast) * 0.8);
    // Pieces of shell and spike thrown out of the blast
    for (let piece = 0; piece < many(10, weight); piece += 1) {
      kit.shard(
        thrown(at, seed, piece, blast, reach * 3.2, reach * 2),
        reach * 0.55,
        share * 10 + piece,
        piece % 2 === 0 ? SHELL_SPIKE : SHELL_DARK,
        decay(blast),
      );
    }
    for (let flame = 0; flame < 7; flame += 1) {
      tongue(
        kit,
        aside(kit, at, spread(seed, flame + 40) * reach * 1.4, -reach * 0.4 + blast * reach),
        reach * (1 + swell(blast)),
        Math.PI / 2 + spread(seed, flame + 50) * 0.5,
        flame % 2 === 0 ? SHELL_FIRE : BEAK_FIRE,
        decay(blast),
      );
    }
    smoke(kit, at, reach * 2, many(5, weight), seed + 2, blast, '#4a3e3a', decay(blast) * 0.35);
    sparks(kit, at, reach * (1.6 + blast * 2), 12, seed + 1, blast, '#ffd27a', decay(blast));
  },

  Fleur(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const hub = aside(kit, stage.source, 0, reach * 1.2);
    const open = Math.min(1, share / FLEUR_OPENS);
    const held = late(share, 0.7);
    const rim = loop(kit, hub, reach * 1.3 * Math.max(0.05, open), 16, 0);

    // The steel ring painted, so it holds on a bright ground
    kit.ribbon(rim, reach * 0.18, MAGEARNA_STEEL, held, 0, { add: 0.2 });
    for (let one = 0; one < 8; one += 1) {
      const angle = (one / 8) * TAU + share * 3;
      const out = reach * (0.4 + open * 0.9);

      kit.leaf(
        aside(kit, hub, Math.cos(angle) * out, Math.sin(angle) * out),
        reach * 0.9 * (0.4 + open * 0.6),
        angle - Math.PI / 2,
        one % 2 === 0 ? MAGEARNA_PINK : MAGEARNA_STEEL,
        held,
      );
    }
    kit.glow(hub, reach * 0.7, FLEUR_PALE, held, 0.6);
    if (share < FLEUR_OPENS) {
      return;
    }
    const pour = Math.min(1, (share - FLEUR_OPENS) / (FLEUR_REACHES - FLEUR_OPENS));
    const shown = late(share, 0.75);
    const head = toward(hub, at, pour);
    const facing = kit.angleOn(hub, at);

    kit.ribbon(
      [hub, toward(hub, head, 0.5), head],
      reach * 1.5,
      MAGEARNA_PINK,
      shown * 0.8,
      share * 4,
      {
        add: 0.3,
      },
    );
    kit.ribbon([hub, toward(hub, head, 0.5), head], reach * 0.5, FLEUR_PALE, shown, share * 6);
    // Petals winding round the beam as it pours, dimmer on the far side
    for (let one = 0; one < many(12, weight); one += 1) {
      const place = ((share * 1.6 + one / 12) % 1) * pour;
      const twist = place * Math.PI * 6 + share * 12 + one;
      const swing = Math.sin(twist) * reach * 1.1;

      kit.leaf(
        aside(kit, toward(hub, at, place), -Math.sin(facing) * swing, Math.cos(facing) * swing),
        reach * 0.7,
        twist,
        one % 2 === 0 ? MAGEARNA_PINK : lighten(MAGEARNA_PINK, 0.5),
        shown * (Math.cos(twist) > 0 ? 1 : 0.5),
      );
    }
    if (share < FLEUR_REACHES) {
      return;
    }
    const hit = (share - FLEUR_REACHES) / (1 - FLEUR_REACHES);

    kit.glow(at, reach * (1.2 + hit * 1.4), MAGEARNA_PINK, decay(hit) * 0.8);
    kit.ring(at, reach * (0.8 + hit * 2.6), 0.08, FLEUR_PALE, decay(hit));
    for (let one = 0; one < 8; one += 1) {
      kit.leaf(
        thrown(at, seed, one, hit, reach * 2.8, reach * 1.4),
        reach * 0.7,
        noise(seed, one) * TAU + share * 6,
        one % 2 === 0 ? MAGEARNA_PINK : MAGEARNA_STEEL,
        decay(hit),
      );
    }
  },

  Bone(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const pivot = aside(kit, at, reach * 1.8, -reach * 0.6);
    const length = reach * 3.2;
    const start = Math.PI * 0.45;
    const end = Math.PI * 0.92;
    const swing = Math.min(1, share / BONE_LANDS) ** 1.6;
    const angle = start + (end - start) * swing;

    sickle(
      kit,
      pivot,
      length * 0.8,
      start,
      angle,
      reach * 0.8,
      GHOST_FIRE,
      late(share, 0.55) * 0.6,
      0.6,
    );
    if (share < BONE_LANDS + 0.12) {
      const shown = Math.max(0, 1 - Math.max(0, share - BONE_LANDS) / 0.12);
      const centre = aside(
        kit,
        pivot,
        Math.cos(angle) * length * 0.6,
        Math.sin(angle) * length * 0.6,
      );
      const half = length * 0.4;

      kit.ribbon(
        [
          aside(kit, centre, Math.cos(angle) * half, Math.sin(angle) * half),
          aside(kit, centre, -Math.cos(angle) * half, -Math.sin(angle) * half),
        ],
        reach * 0.6,
        GHOST_PURPLE,
        shown * 0.6,
        0,
        { add: 0 },
      );
      bone(kit, centre, length * 0.8, angle, BONE_WHITE, shown, reach * 0.35);
      for (let flame = 0; flame < 5; flame += 1) {
        const out = length * (0.3 + (flame / 4) * 0.6);
        const spot = aside(kit, pivot, Math.cos(angle) * out, Math.sin(angle) * out);

        tongue(
          kit,
          aside(kit, spot, 0, reach * 0.3),
          reach * 0.8 * (0.8 + 0.2 * Math.sin(share * 30 + flame)),
          Math.PI / 2,
          GHOST_FIRE,
          shown * 0.85,
        );
      }
    }
    if (share < BONE_LANDS) {
      return;
    }
    const hit = (share - BONE_LANDS) / (1 - BONE_LANDS);
    const count = many(9, weight);

    kit.glow(at, reach * (1 + hit * 1.6), GHOST_FIRE, decay(hit) * 0.7);
    kit.ripple(floorOf(at), reach * (1 + hit * 3), 0.1, GHOST_FIRE, decay(hit));
    // The ghost fire splashing up and out off the blow
    for (let flame = 0; flame < count; flame += 1) {
      const turn = Math.PI * 0.1 + (flame / Math.max(1, count - 1)) * Math.PI * 0.8;
      const out = reach * (0.5 + hit * 2);

      tongue(
        kit,
        aside(kit, at, Math.cos(turn) * out, Math.sin(turn) * out * 0.8 - hit * hit * reach),
        reach * 1 * decay(hit * 0.6),
        turn,
        flame % 3 === 0 ? GHOST_PURPLE : GHOST_FIRE,
        decay(hit),
      );
    }
    sparks(kit, at, reach * (1.2 + hit * 1.6), 10, seed, hit, BONE_WHITE, decay(hit * 1.5));
  },

  Accelerock(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const from = stage.source;
    const run = Math.min(1, share / ACCEL_LANDS);
    const head = toward(from, at, run);
    const shown = late(share, 0.35);
    const facing = kit.angleOn(from, at);
    const shift = (spot: Spot, off: number): Spot =>
      aside(kit, spot, -Math.sin(facing) * off, Math.cos(facing) * off);

    for (let line = 0; line < 5; line += 1) {
      const off = (line - 2) * reach * 0.35;
      const tail = shift(toward(from, head, 0.1 + noise(seed, line) * 0.3), off);
      const front = shift(toward(from, head, 0.95 - noise(seed, line + 10) * 0.15), off);

      kit.ribbon([tail, front], reach * 0.18, ROCK_BROWN, shown * 0.85, 0, { add: 0 });
      kit.trail(tail, front, reach * 0.06, ROCK_DUST, shown * 0.8);
    }
    // The boulder fragments rushing in with it
    for (let piece = 0; piece < 5; piece += 1) {
      const spot = shift(
        toward(from, head, Math.max(0, 1 - piece * 0.12 - noise(seed, piece) * 0.05)),
        spread(seed, piece + 20) * reach * 0.6,
      );

      kit.shard(spot, reach * (0.7 - piece * 0.07), share * 20 + piece, ROCK_BROWN, shown);
    }
    if (share < ACCEL_LANDS) {
      return;
    }
    const hit = (share - ACCEL_LANDS) / (1 - ACCEL_LANDS);

    kit.glow(at, reach * (0.8 + hit), ROCK_DUST, decay(hit * 2) * 0.8);
    kit.ring(at, reach * (0.8 + hit * 2.2), 0.08, ROCK_BROWN, decay(hit));
    kit.star(at, reach * 1.2 * decay(hit * 1.5), 0.4, '#ffffff', decay(hit * 1.5));
    debris(kit, at, reach * 2.2, many(10, weight), seed, hit, ROCK_BROWN, decay(hit));
    smoke(
      kit,
      floorOf(at),
      reach * 1.6,
      many(5, weight),
      seed + 1,
      hit,
      ROCK_DUST,
      decay(hit) * 0.35,
    );
    sparks(kit, at, reach * (1.2 + hit * 1.6), 8, seed + 2, hit, ROCK_DUST, decay(hit * 1.5));
  },

  Thief(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const from = stage.source;
    const home = floorOf(from);
    const foot = floorOf(at);
    const sink = Math.min(1, share / THIEF_SINKS);
    const shown = late(share, 0.8);

    // The caster's shadow running across the ground into the target's
    kit.pool(home, reach * 1.4 * decay(sink * 0.8), SHADOW_DARK, 0.4 * shown, { add: 0 });
    for (let patch = 0; patch < 6; patch += 1) {
      const place = (patch / 5) * sink;

      kit.pool(
        toward(home, foot, place),
        reach * 0.7,
        SHADOW_DARK,
        0.3 * shown * (1 - Math.abs(place - sink)),
        { add: 0 },
      );
    }
    kit.pool(foot, reach * 1.6 * Math.max(0.05, sink), SHADOW_DARK, 0.4 * shown, { add: 0 });
    kit.ripple(foot, reach * 1.6 * Math.max(0.05, sink), 0.08, THIEF_GREEN, 0.8 * shown);
    if (share < THIEF_SINKS) {
      return;
    }
    const rise = Math.min(1, (share - THIEF_SINKS) / (THIEF_PULLS - THIEF_SINKS));
    const grab = Math.max(0, (share - THIEF_PULLS) / (1 - THIEF_PULLS));
    const wrist = aside(kit, foot, 0, 0, -reach * 0.8);
    const palm = aside(kit, wrist, 0, reach * (0.6 + rise * 1.6));
    const limb = (path: Spot[], width: number): void => {
      kit.ribbon(path, width * 2, THIEF_GREEN, shown * 0.5, 0, { add: 0.4 });
      kit.ribbon(path, width, SHADOW_DARK, shown * 0.9, 0, { add: 0 });
    };

    // The hand, dark with a green edge of Marshadow's flame
    limb([wrist, palm], reach * 0.5);
    for (let finger = 0; finger < 4; finger += 1) {
      const angle = Math.PI / 2 - (finger - 1.5) * 0.35;
      const out = reach * 0.9 * (1 - Math.min(1, grab * 3) * 0.45);

      limb([palm, aside(kit, palm, Math.cos(angle) * out, Math.sin(angle) * out)], reach * 0.2);
    }
    // The boosts lifted out of it and pulled back across to the caster
    for (const [one, colour] of STAT_COLOURS.entries()) {
      const above = aside(
        kit,
        at,
        (one - 1.5) * reach * 0.7,
        reach * 1.4 + (one % 2) * reach * 0.3,
      );
      const back = Math.min(1, Math.max(0, grab * 1.4 - one * 0.08));
      const spot = toward(above, aside(kit, from, 0, reach), back ** 1.4);

      boost(kit, spot, reach * 0.45, colour, rise * late(back, 0.75));
    }
    sparks(kit, palm, reach * 1.4, many(8, weight), seed, rise, THIEF_GREEN, shown * 0.8);
  },

  Multi(kit, stage, share, { seed, weight, paint }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = Math.min(1, share * 8) * late(share, 0.7);
    const spin = share * 10;
    const disc = loop(kit, at, reach * 2.3, 24, 0);

    // The memory disc behind it, painted steel banded in the memory's colour
    kit.ribbon(disc, reach * 0.4, DISC_DARK, shown * 0.7, 0, { add: 0 });
    kit.ribbon(disc, reach * 0.24, DISC_STEEL, shown, 0, { add: 0.2 });
    kit.ribbon(loop(kit, at, reach * 1.85, 24, 0), reach * 0.16, paint.color, shown, 0, {
      add: 0.3,
    });
    for (let notch = 0; notch < 8; notch += 1) {
      const angle = spin + (notch / 8) * TAU;

      kit.ribbon(
        [
          aside(kit, at, Math.cos(angle) * reach * 1.95, Math.sin(angle) * reach * 1.95),
          aside(kit, at, Math.cos(angle) * reach * 2.6, Math.sin(angle) * reach * 2.6),
        ],
        reach * 0.2,
        DISC_STEEL,
        shown,
        0,
        { add: 0 },
      );
    }
    kit.glow(at, reach * 1.6, paint.color, shown * 0.3, 0.2);
    // Three claw cuts drawn down across it
    const cut = Math.min(1, Math.max(0, (share - 0.08) / (MULTI_LANDS - 0.08)));
    const clawn = late(share, 0.6);
    const claws = cut > 0 ? 3 : 0;

    for (let claw = 0; claw < claws; claw += 1) {
      const off = (claw - 1) * reach * 0.55;
      const start = aside(kit, at, -reach * 1.6 + off, reach * 1.6 + off);
      const tip = toward(start, aside(kit, at, reach * 1.6 + off, -reach * 1.6 + off), cut);
      const bow = aside(kit, toward(start, tip, 0.5), reach * 0.2, reach * 0.2);
      const path = [start, bow, tip];

      kit.ribbon(path, reach * 0.8, paint.color, clawn * 0.6);
      kit.ribbon(path, reach * 0.4, DISC_DARK, clawn * 0.5, 0, { add: 0 });
      kit.ribbon(path, reach * 0.22, '#ffffff', clawn, 0, { add: 0.5 });
    }
    if (share < MULTI_LANDS) {
      return;
    }
    const flare = (share - MULTI_LANDS) / (1 - MULTI_LANDS);

    kit.glow(at, reach * (1 + flare * 1.6), lighten(paint.color, 0.3), decay(flare));
    kit.ring(at, reach * (1 + flare * 2.4), 0.08, paint.color, decay(flare));
    sparks(
      kit,
      at,
      reach * (1.4 + flare * 1.8),
      many(10, weight),
      seed,
      flare,
      lighten(paint.color, 0.4),
      decay(flare),
    );
  },

  Plasma(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    for (let fist = 0; fist < PLASMA_FISTS; fist += 1) {
      const lands = ((fist + 1) / PLASMA_FISTS) * PLASMA_LANDS;
      const run = (share - (lands - 0.15)) / 0.15;

      if (run < 0) {
        continue;
      }
      const side = fist % 2 === 0 ? -1 : 1;
      const spot = aside(
        kit,
        at,
        spread(seed, fist) * reach * 0.8,
        spread(seed, fist + 10) * reach * 0.6,
      );

      if (run < 1) {
        const from = aside(kit, spot, side * reach * 2.6, -reach * 1.4);
        const head = toward(from, spot, run);

        kit.trail(from, head, reach * 0.4, PLASMA_BLUE, 0.5);
        kit.puff(head, reach * 0.8, PLASMA_BLUE, 1, { add: 0.3 });
        kit.glow(head, reach * 0.55, PLASMA_CORE, 1, 0.8);
        bolt(
          kit,
          head,
          aside(kit, head, side * reach * 0.8, reach * 0.6),
          seed + fist + Math.floor(share * 30),
          reach,
          reach * 0.08,
          PLASMA_CORE,
          0.8,
        );
        continue;
      }
      const hit = (share - lands) / 0.25;

      if (hit >= 1) {
        continue;
      }
      kit.glow(spot, reach * (0.6 + hit * 1.2), PLASMA_CORE, decay(hit));
      kit.ring(spot, reach * (0.5 + hit * 1.6), 0.1, PLASMA_BLUE, decay(hit));
      for (let arc = 0; arc < 3; arc += 1) {
        const angle = noise(seed + fist, arc) * TAU;
        const out = reach * (1 + hit * 1.4);

        bolt(
          kit,
          spot,
          aside(kit, spot, Math.cos(angle) * out, Math.sin(angle) * out),
          seed + fist * 7 + arc + Math.floor(share * 40),
          reach,
          reach * 0.08,
          PLASMA_BLUE,
          decay(hit),
        );
      }
    }
    // The ionised air left round it, twinkling
    const field = Math.min(1, share * 2.5) * late(share, 0.75);

    for (let spark = 0; spark < many(14, weight); spark += 1) {
      const angle = noise(seed, spark + 30) * TAU;
      const out = reach * (0.8 + noise(seed, spark + 50) * 1.8);

      kit.star(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
        reach * 0.35,
        share * 4,
        spark % 4 === 0 ? ZERAORA_GOLD : PLASMA_CORE,
        swell((share * 3 + noise(seed, spark + 70)) % 1) * field,
      );
    }
  },

  Clangor(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const shown = Math.min(1, share * 8) * late(share, 0.8);
    const floor = floorOf(at);
    const beat = share * CLANGOR_BEATS;
    const phase = beat % 1;
    const meet = aside(kit, at, 0, reach * 0.9);
    const gap = reach * (0.25 + Math.sin(Math.PI * phase) * 1.2);

    kit.glow(at, reach * (1.6 + Math.sin(beat * TAU) * 0.2), KOMMO_GOLD, shown * 0.35, 0.2);
    kit.ripple(floor, reach * (1.8 + decay(phase) * 0.4), 0.08, KOMMO_GOLD, shown * 0.8);
    // Two plates of scales swung together on each beat
    for (const side of [-1, 1]) {
      for (let one = 0; one < 3; one += 1) {
        const spot = aside(kit, meet, side * (gap + one * reach * 0.18), -(one - 1) * reach * 0.45);

        kit.shard(spot, reach * 0.7, Math.PI / 4, KOMMO_DARK, shown);
        kit.shard(spot, reach * 0.55, Math.PI / 4, KOMMO_GOLD, shown, { add: 0.2 });
      }
    }
    kit.star(meet, reach * 1.2 * decay(phase * 4), share * 3, '#fff4cc', decay(phase * 4) * shown);
    kit.ring(meet, reach * (0.4 + phase * 1.6), 0.08, KOMMO_GOLD, decay(phase) * shown);
    for (let one = 0; one < CLANGOR_ARROWS; one += 1) {
      const angle = (one / CLANGOR_ARROWS) * TAU + share * 2;
      const rise = (share * 1.5 + one / CLANGOR_ARROWS) % 1;

      boost(
        kit,
        aside(
          kit,
          floor,
          Math.cos(angle) * reach * 1.7,
          reach * 0.3 + rise * reach * 2.6,
          Math.sin(angle) * reach * 1.7,
        ),
        reach * 0.4,
        KOMMO_GOLD,
        swell(rise) * shown,
      );
    }
    sparks(
      kit,
      at,
      reach * 2,
      many(8, weight),
      seed,
      (share * 2) % 1,
      lighten(KOMMO_GOLD, 0.4),
      shown * 0.8,
    );
  },

  Ironbash(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    for (const [fist, lands] of [IRONBASH_FIRST, IRONBASH_SECOND].entries()) {
      const side = fist === 0 ? -1 : 1;
      const swing = (share - (lands - 0.3)) / 0.3;

      if (swing < 0) {
        continue;
      }
      if (swing < 1.25) {
        const t = Math.min(1, swing) ** 1.6;
        const alpha = swing < 1 ? 1 : 1 - (swing - 1) / 0.25;
        const from = aside(kit, at, side * reach * 3, reach * 2);
        const shoulder = aside(kit, at, side * reach * 3.6, -reach * 1.2);
        const place = (part: number): Spot =>
          aside(kit, toward(from, at, part), 0, Math.sin(Math.PI * part) * reach * 0.8);
        const fistAt = place(t);
        const trail: Spot[] = [];

        for (let step = 0; step <= 5; step += 1) {
          trail.push(place(Math.max(0, t - 0.3 + (step / 5) * 0.3)));
        }
        kit.ribbon(trail, reach * 0.9, MELMETAL_STEEL, alpha * 0.35);
        kit.ribbon([shoulder, fistAt], reach * 0.9, MELMETAL_DARK, alpha * 0.8, 0, { add: 0 });
        kit.ribbon([shoulder, fistAt], reach * 0.65, MELMETAL_STEEL, alpha, 0, { add: 0.2 });
        nut(kit, fistAt, reach * 1.1, side * t * 1.5, alpha);
      }
      const hit = (share - lands) / 0.35;

      if (hit < 0 || hit >= 1) {
        continue;
      }
      kit.ring(at, reach * (0.8 + hit * 2.4), 0.1 * decay(hit * 0.5), MELMETAL_GOLD, decay(hit));
      kit.ring(at, reach * (0.5 + hit * 1.6), 0.06, '#ffffff', decay(hit));
      kit.ripple(floorOf(at), reach * (1 + hit * 2.6), 0.1, MELMETAL_STEEL, decay(hit) * 0.8);
      kit.star(at, reach * 1.4 * decay(hit), fist, '#ffffff', decay(hit));
      sparks(kit, at, reach * (1.2 + hit * 1.4), 10, seed + fist, hit, MELMETAL_STEEL, decay(hit));
      debris(kit, at, reach * 2, many(6, weight), seed + fist, hit, MELMETAL_STEEL, decay(hit));
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default alolaSignatures;
