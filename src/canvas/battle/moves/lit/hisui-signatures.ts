import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, noise, spread, swell } from '../__paint';
import { SIGNATURE_SCALE } from '../effect/galar';
import {
  ANTLER_BROWN,
  ARROW_COUNT,
  ARROW_FLIGHT,
  ARROW_GAP,
  ARROW_HEAD,
  ARROW_KICK,
  ARROW_LEAF,
  ARROW_SHAFT,
  AXE_DARK,
  AXE_EDGE,
  AXE_HAFT,
  AXE_STONE,
  BARB_COUNT,
  BARB_DARK,
  BARB_LANDS,
  BARB_OOZE,
  BARB_PURPLE,
  BLESSING_GOLD,
  BLESSING_PINK,
  BLESSING_RISEN,
  BLESSING_SHADE,
  BLESSING_SILVER,
  CEASELESS_CUTS,
  CEASELESS_DARK,
  CEASELESS_SHELL,
  CEASELESS_SPLINTERS,
  CEASELESS_TEAL,
  CHLORO_DEEP,
  CHLORO_FIRES,
  CHLORO_GREEN,
  CHLORO_PALE,
  CHLORO_SPARK,
  DIRECLAW_DARK,
  DIRECLAW_DRIP,
  DIRECLAW_GAP,
  DIRECLAW_PURPLE,
  DIRECLAW_RAKE,
  DIRECLAW_RAKES,
  ESPER_BLADES,
  ESPER_DEEP,
  ESPER_FEATHER,
  ESPER_PINK,
  ESPER_SPREAD,
  GALE_CHUNKS,
  GALE_DARK,
  GALE_DEEP,
  GALE_DROP,
  GALE_GAP,
  GALE_ICE,
  GALE_PALE,
  LILLIGANT_GREEN,
  MALICE_DARK,
  MALICE_FROST,
  MALICE_RISEN,
  MALICE_VIOLET,
  MALICE_WHITE,
  MALICE_WISPS,
  PARADE_DEEP,
  PARADE_FLAMES,
  PARADE_MAGENTA,
  PARADE_PALE,
  PARADE_SWARM,
  PARADE_VIOLET,
  PSYSHIELD_LANDS,
  SHELL_DARK,
  SHELL_SLIME,
  SHELL_STEEL,
  SHELTER_CLOSED,
  SHIELD_DEEP,
  SHIELD_VIOLET,
  STONEAXE_LANDS,
  STONEAXE_SPLINTERS,
  TAKEHEART_BEAT,
  TAKEHEART_BLUE,
  TAKEHEART_DARK,
  TAKEHEART_PALE,
  VICTORY_FLOURISH,
  VICTORY_GOLD,
  VICTORY_PETAL,
  VICTORY_RIBBON,
} from '../effect/hisui-signatures';
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

/** A band painted dark under a coloured one, so a solid thing reads on any ground */
function band(
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
  kit.ribbon(path, width * 1.4, shade, alpha * 0.85, 0, { add: 0 });
  kit.ribbon(path, width, colour, alpha, 0, { add: 0.2 });
}

/** A hexagon's corners round a spot on the picture */
function hexagon(kit: EffectBatch, at: Spot, radius: number, turn: number): Spot[] {
  const corners: Spot[] = [];

  for (let corner = 0; corner < 6; corner += 1) {
    const angle = turn + (corner / 6) * TAU;

    corners.push(aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  return corners;
}

/** A sharp splinter on the picture: a dark shard under a lighter one, and a tapered band along `turn` */
function spike(
  kit: EffectBatch,
  at: Spot,
  length: number,
  turn: number,
  colour: string,
  shade: string,
  alpha: number,
): void {
  const tip = aside(kit, at, Math.cos(turn) * length, Math.sin(turn) * length);
  const back = aside(kit, at, -Math.cos(turn) * length * 0.4, -Math.sin(turn) * length * 0.4);

  kit.ribbon([back, at, tip], length * 0.55, shade, alpha * 0.9, 0, { add: 0 });
  kit.ribbon([back, at, toward(at, tip, 0.8)], length * 0.32, colour, alpha, 0, { add: 0.15 });
}

/** A ghostly flame: a dark tongue, a magenta one over it and a pale core */
function wisp(kit: EffectBatch, at: Spot, size: number, flicker: number, alpha: number): void {
  const lean = Math.sin(flicker) * 0.25;
  const tongue = aside(kit, at, 0, size * 0.3);

  kit.leaf(tongue, size * 2.5, lean, PARADE_DEEP, alpha * 0.6);
  kit.leaf(tongue, size * 2.2, lean, PARADE_MAGENTA, alpha);
  kit.leaf(aside(kit, at, 0, size * 0.1), size * 1.6, lean * 0.6, PARADE_VIOLET, alpha);
  kit.glow(aside(kit, at, 0, -size * 0.2), size * 0.5, PARADE_PALE, alpha, 0.6);
}

const hisuiSignatures = {
  Direclaw(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = late(share, 0.55);

    for (let rake = 0; rake < DIRECLAW_RAKES; rake += 1) {
      const run = (share - rake * DIRECLAW_GAP) / DIRECLAW_RAKE;

      if (run <= 0) {
        continue;
      }
      const shift = (rake - (DIRECLAW_RAKES - 1) / 2) * reach * 0.8;
      const from = aside(kit, at, -reach * 1.8 + shift, reach * 1.8 - shift * 0.4);
      const to = aside(kit, at, reach * 1.4 + shift, -reach * 1.6 - shift * 0.4);
      const path: Spot[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const along = (step / 8) * Math.min(1, run);
        const bow = Math.sin(Math.PI * (step / 8)) * reach * 0.3;

        path.push(aside(kit, toward(from, to, along), bow, bow));
      }
      // The claw mark: dark paint under, toxic purple over, a hot core
      kit.ribbon(path, reach * 0.75, DIRECLAW_DARK, shown, 0, { add: 0 });
      kit.ribbon(path, reach * 0.5, DIRECLAW_PURPLE, shown, 0, { add: 0.3 });
      kit.ribbon(path.slice(1), reach * 0.16, lighten(DIRECLAW_DRIP, 0.5), shown);
      for (let drop = 0; drop < 3; drop += 1) {
        const fall = Math.max(0, run - 0.3 - drop * 0.15) * 0.9;

        if (fall <= 0 || fall >= 1) {
          continue;
        }
        const off = toward(from, to, 0.3 + drop * 0.25);
        const spot = aside(
          kit,
          off,
          spread(seed, rake * 3 + drop) * reach * fall,
          -(fall ** 2) * reach * 2.4,
        );

        kit.puff(spot, reach * 0.24, DIRECLAW_PURPLE, decay(fall));
        kit.glow(spot, reach * 0.22, DIRECLAW_DRIP, decay(fall), 0.4);
      }
    }
    kit.glow(at, reach * 1.4, DIRECLAW_PURPLE, swell(share) * 0.35, 0.2);
    sparks(kit, at, reach * 2.2, many(10, weight), seed, share, DIRECLAW_DRIP, shown * 0.8);
  },

  Psyshield(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const run = Math.min(1, share / PSYSHIELD_LANDS) ** 1.6;
    const centre = toward(toward(stage.source, at, 0.45), at, run);
    const shown = late(share, 0.5);
    const radius = reach * 1.5;

    // The antlers just behind the shield's top edge
    for (const side of [-1, 1]) {
      const root = aside(kit, centre, side * reach * 0.5, reach * 0.6, reach * 0.2);
      const tip = aside(kit, root, side * reach * 1.6, reach * 1.8);
      const middle = toward(root, tip, 0.5);

      kit.ribbon([root, middle, tip], reach * 0.24, ANTLER_BROWN, shown, 0, { add: 0 });
      kit.ribbon(
        [middle, aside(kit, root, side * reach * 0.3, reach * 1.9)],
        reach * 0.18,
        ANTLER_BROWN,
        shown,
        0,
        { add: 0 },
      );
      kit.puff(tip, reach * 0.3, SHIELD_DEEP, shown);
    }
    const corners = hexagon(kit, centre, radius, Math.PI / 6);

    kit.glow(centre, radius * 1.4, SHIELD_VIOLET, shown * 0.35, 0.2);
    kit.panel([corners[0], corners[1], corners[2], corners[3]], SHIELD_VIOLET, shown * 0.6);
    kit.panel([corners[3], corners[4], corners[5], corners[0]], SHIELD_VIOLET, shown * 0.6);
    band(kit, [...corners, corners[0]], reach * 0.18, SHIELD_VIOLET, SHIELD_DEEP, shown);
    const inner = hexagon(kit, centre, radius * 0.6, Math.PI / 6);

    kit.ribbon([...inner, inner[0]], reach * 0.08, '#ffffff', shown * 0.8);
    kit.star(
      aside(kit, centre, -radius * 0.4, radius * 0.4),
      reach * 0.6,
      share * 4,
      '#ffffff',
      shown,
    );
    if (share < PSYSHIELD_LANDS) {
      return;
    }
    const hit = (share - PSYSHIELD_LANDS) / (1 - PSYSHIELD_LANDS);

    kit.glow(at, reach * (1 + hit * 1.8), SHIELD_VIOLET, decay(hit) * 0.8);
    kit.ring(at, reach * (1.4 + hit * 2.6), 0.08, SHIELD_DEEP, decay(hit), { add: 0.3 });
    // The shield's light breaking into little hexagons thrown out
    for (let piece = 0; piece < many(8, weight); piece += 1) {
      const angle = noise(seed, piece) * TAU;
      const out = reach * (1 + hit * 2.4);
      const spot = aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8);
      const bits = hexagon(kit, spot, reach * 0.35, hit * 3);

      band(kit, [...bits, bits[0]], reach * 0.1, SHIELD_VIOLET, SHIELD_DEEP, decay(hit));
    }
    sparks(kit, at, reach * (1.4 + hit * 1.6), 10, seed + 1, hit, '#ffffff', decay(hit));
  },

  Stoneaxe(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const pivot = aside(kit, at, reach * 2.2, -reach * 0.4);
    const length = reach * 2.6;
    const start = Math.PI * 0.45;
    const end = Math.PI;
    const swing = Math.min(1, share / STONEAXE_LANDS) ** 1.8;
    const angle = start + (end - start) * swing;

    if (share < STONEAXE_LANDS + 0.12) {
      const shown = late(share, STONEAXE_LANDS);
      const tip = aside(kit, pivot, Math.cos(angle) * length, Math.sin(angle) * length);
      // Which way the head is travelling: on round the swing
      const ahead: [number, number] = [-Math.sin(angle), Math.cos(angle)];
      const along: [number, number] = [Math.cos(angle), Math.sin(angle)];
      const corner = (forward: number, out: number): Spot =>
        aside(
          kit,
          tip,
          (ahead[0] * forward + along[0] * out) * reach,
          (ahead[1] * forward + along[1] * out) * reach,
        );

      sickle(kit, pivot, length, start, angle, reach * 0.9, AXE_STONE, shown * 0.3, 0.2);
      kit.ribbon([pivot, tip], reach * 0.35, AXE_HAFT, shown, 0, { add: 0 });
      // The head: a wedge of stone flaring to a pale edge
      band(
        kit,
        [corner(-0.35, 0), corner(0.4, 0), corner(0.9, 0)],
        reach * 1.1,
        AXE_STONE,
        AXE_DARK,
        shown,
      );
      kit.ribbon(
        [corner(1, 0.8), corner(1.15, 0), corner(1, -0.8)],
        reach * 0.4,
        AXE_DARK,
        shown,
        0,
        {
          add: 0,
        },
      );
      kit.ribbon(
        [corner(1, 0.8), corner(1.15, 0), corner(1, -0.8)],
        reach * 0.18,
        AXE_EDGE,
        shown,
        0,
        {
          add: 0.3,
        },
      );
      kit.shard(corner(0.3, 0), reach * 0.6, angle, AXE_STONE, shown);
    }
    if (share < STONEAXE_LANDS) {
      return;
    }
    const hit = (share - STONEAXE_LANDS) / (1 - STONEAXE_LANDS);
    const held = late(hit, 0.75);

    kit.glow(at, reach * (1 + hit), AXE_EDGE, decay(hit * 2) * 0.8, 0.5);
    debris(kit, at, reach * 2, many(10, weight), seed, hit, AXE_STONE, decay(hit));
    // The splinters rise out of the bite and settle into a slow orbit round it
    for (let one = 0; one < STONEAXE_SPLINTERS; one += 1) {
      const turn = (one / STONEAXE_SPLINTERS) * TAU + hit * 1.6;
      const out = Math.min(1, hit * 3);
      const spot = aside(
        kit,
        at,
        Math.cos(turn) * reach * 2 * out,
        Math.sin(hit * 8 + one) * reach * 0.15,
        Math.sin(turn) * reach * 2 * out,
      );

      spike(
        kit,
        spot,
        reach * 0.6,
        Math.PI / 2 + spread(seed, one) * 0.6,
        AXE_STONE,
        AXE_DARK,
        held,
      );
    }
  },

  Mountaingale(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const top = aside(kit, at, 0, reach * 4.6);
    const shelf = late(share, 0.55);
    const edge: Spot[] = [];

    for (let step = 0; step <= 8; step += 1) {
      edge.push(aside(kit, top, -reach * 3 + step * reach * 0.75, noise(seed, step) * reach * 0.3));
    }
    // The glacier shelf: thick ice painted over a dark rim, icicles under it
    kit.ribbon(edge, reach * 1.4, GALE_DARK, shelf * 0.8, 0, { add: 0 });
    kit.ribbon(edge, reach * 1.1, GALE_ICE, shelf, 0, { add: 0.1 });
    kit.ribbon(edge, reach * 0.25, GALE_PALE, shelf * 0.8, 0, { add: 0.4 });
    for (let icicle = 0; icicle < 5; icicle += 1) {
      spike(
        kit,
        aside(kit, top, -reach * 2.4 + icicle * reach * 1.2, -reach * 0.6),
        reach * 0.6,
        -Math.PI / 2,
        GALE_PALE,
        GALE_DEEP,
        shelf,
      );
    }
    for (let one = 0; one < GALE_CHUNKS; one += 1) {
      const fall = (share - one * GALE_GAP) / GALE_DROP;

      if (fall < 0) {
        continue;
      }
      const lands = aside(kit, at, spread(seed, one + 30) * reach, reach * 0.2);
      const turn = noise(seed, one + 40) * Math.PI;

      if (fall < 1) {
        const from = aside(kit, lands, spread(seed, one + 50) * reach * 0.6, reach * 4);
        const spot = toward(from, lands, fall ** 1.7);
        const size = reach * (1 - one * 0.1);

        kit.shard(spot, size * 2.2, turn + fall, GALE_DARK, 1);
        kit.shard(spot, size * 1.9, turn + fall, GALE_ICE, 1);
        kit.shard(aside(kit, spot, -size * 0.2, size * 0.2), size * 0.8, turn, GALE_PALE, 0.9);
        continue;
      }
      const crash = Math.min(1, (fall - 1) * GALE_DROP * 3.5);

      if (crash >= 1) {
        continue;
      }
      // The chunk splitting into pieces on impact, a burst of frost
      for (let piece = 0; piece < 3; piece += 1) {
        const side = piece - 1;
        const spot = aside(
          kit,
          lands,
          side * reach * crash * 1.2,
          swell(crash) * reach * 0.5 - crash * reach * 0.6,
        );

        kit.shard(spot, reach * 0.95, turn + side * crash * 2, GALE_DARK, decay(crash));
        kit.shard(spot, reach * 0.8, turn + side * crash * 2, GALE_ICE, decay(crash));
      }
      sparks(kit, lands, reach * (1 + crash * 1.6), 9, seed + one, crash, GALE_PALE, decay(crash));
    }
    const after = Math.max(0, (share - GALE_DROP) / (1 - GALE_DROP));

    if (after <= 0) {
      return;
    }
    kit.glow(at, reach * (1.2 + after * 1.4), GALE_PALE, swell(after) * 0.6, 0.3);
    kit.ripple(floorOf(at), reach * (1 + after * 2.6), 0.1, GALE_DEEP, decay(after), { add: 0.2 });
    smoke(
      kit,
      floorOf(at),
      reach * 2.4,
      many(6, weight),
      seed + 7,
      after,
      GALE_PALE,
      decay(after) * 0.4,
    );
    debris(kit, at, reach * 2, many(10, weight), seed + 9, after, GALE_ICE, decay(after));
  },

  Victorydance(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const floor = floorOf(at);
    const head = Math.min(1, share / VICTORY_FLOURISH);
    const tail = Math.max(0, head - 0.45);
    const shown = late(share, 0.75);
    const helix = (along: number): Spot => {
      const angle = along * TAU * 2 + share * TAU;

      return aside(
        kit,
        floor,
        Math.cos(angle) * reach * 1.5,
        reach * 0.1 + along * reach * 2.6,
        Math.sin(angle) * reach * 1.5,
      );
    };
    const ribbon: Spot[] = [];

    for (let step = 0; step <= 20; step += 1) {
      ribbon.push(helix(tail + ((head - tail) * step) / 20));
    }
    kit.ripple(floor, reach * 1.6, 0.08, LILLIGANT_GREEN, shown * 0.7, { add: 0.2 });
    kit.ribbon(ribbon, reach * 0.4, '#5a1420', shown * 0.8, 0, { add: 0 });
    kit.ribbon(ribbon, reach * 0.28, VICTORY_RIBBON, shown, share * 3, { add: 0.2 });
    kit.ribbon(ribbon, reach * 0.08, lighten(VICTORY_RIBBON, 0.6), shown);
    for (let one = 0; one < 8; one += 1) {
      const angle = (one / 8) * TAU + share * Math.PI * 5;
      const rise = (share * 0.8 + noise(seed, one)) % 1;

      kit.leaf(
        aside(
          kit,
          floor,
          Math.cos(angle) * reach * 2,
          reach * 0.2 + rise * reach * 2.4,
          Math.sin(angle) * reach * 2,
        ),
        reach * 0.6,
        angle,
        one % 2 === 0 ? VICTORY_PETAL : LILLIGANT_GREEN,
        Math.min(1, share * 10) * shown,
      );
    }
    if (share < VICTORY_FLOURISH) {
      return;
    }
    const bloom = (share - VICTORY_FLOURISH) / (1 - VICTORY_FLOURISH);
    const crown = aside(kit, at, 0, reach * 1.8);

    kit.glow(crown, reach * (0.8 + bloom), VICTORY_GOLD, decay(bloom) * 0.8, 0.5);
    kit.star(
      crown,
      reach * (0.8 + swell(Math.min(1, bloom * 2)) * 0.6),
      bloom * 2,
      '#ffffff',
      decay(bloom),
    );
    kit.ring(crown, reach * (0.6 + bloom * 1.8), 0.08, VICTORY_GOLD, decay(bloom), { add: 0.3 });
    sparks(kit, crown, reach * 2, many(10, weight), seed + 3, bloom, VICTORY_PETAL, decay(bloom));
  },

  Barbs(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = late(share, 0.75);

    for (let one = 0; one < BARB_COUNT; one += 1) {
      const leave = (one / BARB_COUNT) * (BARB_LANDS - 0.22);
      const flight = (share - leave) / 0.22;

      if (flight < 0) {
        continue;
      }
      const fan = one / (BARB_COUNT - 1) - 0.5;
      const lands = aside(kit, at, fan * reach * 2.2, -spread(seed, one) * reach * 0.8);
      const bend = aside(kit, toward(stage.source, lands, 0.5), fan * reach * 4, reach * 0.6);
      const place = (t: number): Spot =>
        toward(toward(stage.source, bend, t), toward(bend, lands, t), t);

      if (flight < 1) {
        const tip = place(flight);
        const back = place(Math.max(0, flight - 0.08));

        kit.trail(place(Math.max(0, flight - 0.25)), back, reach * 0.08, BARB_PURPLE, 0.6);
        spike(kit, tip, reach * 0.6, kit.angleOn(back, tip), BARB_PURPLE, BARB_DARK, 1);
        continue;
      }
      const ooze = Math.min(1, (flight - 1) * 0.22 * 3);
      const turn = kit.angleOn(place(0.92), lands);

      // Stuck in, the tail out the way it came, ooze running down off it
      spike(
        kit,
        aside(kit, lands, -Math.cos(turn) * reach * 0.3, -Math.sin(turn) * reach * 0.3),
        reach * 0.6,
        turn,
        BARB_PURPLE,
        BARB_DARK,
        shown,
      );
      kit.puff(lands, reach * (0.4 + swell(ooze) * 0.3), BARB_OOZE, shown * 0.6);
      kit.puff(
        aside(kit, lands, 0, -ooze * reach * 1.2),
        reach * 0.2,
        BARB_OOZE,
        decay(ooze) * shown,
      );
    }
    sparks(kit, at, reach * 2, many(8, weight), seed + 5, share, BARB_OOZE, swell(share) * 0.8);
  },

  Esper(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const open = Math.min(1, share / ESPER_SPREAD);
    const wings = Math.min(1, share * 8) * late(share, 0.5);
    const back = aside(kit, stage.source, 0, reach * 0.9, reach * 0.3);

    kit.glow(back, reach * 2.4, ESPER_PINK, wings * 0.4, 0.2);
    for (const side of [-1, 1]) {
      for (let feather = 0; feather < 5; feather += 1) {
        const angle = Math.PI / 2 - side * (0.4 + feather * 0.28 * open);
        const tip = aside(kit, back, Math.cos(angle) * reach * 2.8, Math.sin(angle) * reach * 2.2);

        kit.leaf(
          toward(back, tip, 0.55),
          reach * 2.6,
          angle - Math.PI / 2,
          ESPER_DEEP,
          wings * 0.7,
        );
        kit.leaf(toward(back, tip, 0.58), reach * 2.2, angle - Math.PI / 2, ESPER_FEATHER, wings);
      }
    }
    for (let blade = 0; blade < ESPER_BLADES; blade += 1) {
      const leave = 0.1 + blade * 0.06;
      const flight = (share - leave) / 0.2;

      if (flight < 0) {
        continue;
      }
      const lands = aside(
        kit,
        at,
        spread(seed, blade) * reach * 1.2,
        -spread(seed, blade + 9) * reach * 0.8,
      );

      if (flight < 1) {
        const from = aside(kit, back, (blade - 2) * reach * 0.8, reach);
        const tip = toward(from, lands, flight);
        const tail = toward(from, lands, Math.max(0, flight - 0.25));

        kit.trail(tail, tip, reach * 0.3, ESPER_PINK, 0.8);
        kit.leaf(tip, reach * 0.9, kit.angleOn(tail, tip) - Math.PI / 2, ESPER_FEATHER, 1);
        continue;
      }
      const sweep = Math.min(1, (flight - 1) * 0.2 * 2.2);

      if (sweep >= 1) {
        continue;
      }
      const from = Math.PI * 0.9 - blade;
      const to = from - Math.PI * 0.8 * Math.min(1, sweep * 3);

      sickle(kit, lands, reach * 1.4, from, to, reach * 0.45, ESPER_DEEP, decay(sweep) * 0.6, 0);
      sickle(kit, lands, reach * 1.4, from, to, reach * 0.35, ESPER_PINK, decay(sweep), 0.5);
      sickle(kit, lands, reach * 1.4, from, to, reach * 0.12, ESPER_FEATHER, decay(sweep));
    }
    const hit = Math.max(0, (share - 0.3) / 0.7);

    kit.glow(at, reach * (1 + hit * 1.2), ESPER_PINK, swell(hit) * 0.5, 0.3);
    sparks(kit, at, reach * 2.4, many(10, weight), seed + 2, hit, ESPER_FEATHER, decay(hit));
  },

  Malice(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const risen = Math.min(1, share / MALICE_RISEN);
    const shown = Math.min(1, 0.35 + risen) * late(share, 0.7);
    const face = aside(
      kit,
      at,
      0,
      reach * (0.6 + risen * 0.8) + Math.sin(share * 12) * reach * 0.1,
      -reach * 0.3,
    );

    kit.puff(at, reach * 1.8, MALICE_DARK, shown * 0.3);
    // The mask, rimmed in violet, its hollows dark and glowing at the back
    kit.puff(face, reach * 1.6, MALICE_VIOLET, shown);
    kit.puff(face, reach * 1.4, MALICE_WHITE, shown);
    for (const side of [-1, 1]) {
      const eye = aside(kit, face, side * reach * 0.5, reach * 0.35);

      kit.ribbon(
        [
          aside(kit, eye, -reach * 0.3, side * reach * 0.12),
          aside(kit, eye, reach * 0.3, -side * reach * 0.12),
        ],
        reach * 0.35,
        MALICE_DARK,
        shown,
        0,
        { add: 0 },
      );
      kit.glow(eye, reach * 0.18, MALICE_VIOLET, shown, 0.4);
    }
    const grin: Spot[] = [];

    for (let tooth = 0; tooth <= 6; tooth += 1) {
      grin.push(
        aside(
          kit,
          face,
          -reach * 0.7 + tooth * reach * 0.233,
          -reach * (0.55 + (tooth % 2) * 0.25),
        ),
      );
    }
    kit.ribbon(grin, reach * 0.14, MALICE_DARK, shown, 0, { add: 0 });
    for (let one = 0; one < MALICE_WISPS; one += 1) {
      const run = (share * 1.8 + one / MALICE_WISPS) % 1;
      const angle = (one / MALICE_WISPS) * TAU + noise(seed, one);
      const out = reach * (3.2 - run * 2.4);
      const from = aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8);
      const to = aside(kit, at, Math.cos(angle) * out * 0.5, Math.sin(angle) * out * 0.4);
      const bend = aside(
        kit,
        toward(from, to, 0.5),
        -Math.sin(angle) * reach * 0.5,
        Math.cos(angle) * reach * 0.5,
      );
      const fading = swell(run) * late(share, 0.8);

      kit.ribbon([from, bend, to], reach * 0.3, MALICE_VIOLET, fading * 0.6, 0, { add: 0 });
      kit.ribbon([from, bend, to], reach * 0.14, MALICE_FROST, fading, 0, { add: 0.5 });
    }
    const claws = Math.max(0, (share - 0.35) / 0.4);

    if (claws > 0 && claws < 1) {
      for (let mark = 0; mark < 3; mark += 1) {
        sickle(
          kit,
          aside(kit, at, (mark - 1) * reach * 0.45, 0),
          reach * 1.2,
          -1.2 - 0.9,
          -1.2 + 0.9,
          reach * 0.2,
          MALICE_FROST,
          decay(claws),
          0.4,
        );
      }
    }
    sparks(kit, at, reach * 2.4, many(10, weight), seed + 4, share, MALICE_FROST, shown * 0.8);
  },

  Shelter(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const close = Math.min(1, share / SHELTER_CLOSED) ** 0.8;
    const shown = late(share, 0.8);
    const base = aside(kit, at, 0, -reach * 0.6, -reach * 0.3);

    for (let layer = 0; layer < 3; layer += 1) {
      const radius = reach * (1.7 - layer * 0.35);
      const reached = (Math.PI / 2) * Math.min(1, close * (1 + layer * 0.15));

      for (const [from, to] of [
        [Math.PI, Math.PI - reached],
        [0, reached],
      ]) {
        sickle(kit, base, radius, from, to, reach * 0.55, SHELL_DARK, shown, 0);
        sickle(kit, base, radius, from, to, reach * 0.42, SHELL_STEEL, shown, 0.15);
      }
    }
    // The slime sheen: a pale highlight running over, drops sliding down
    const sheen = (share * 1.5) % 1;

    sickle(
      kit,
      base,
      reach * 1.5,
      Math.PI - sheen * Math.PI,
      Math.PI - sheen * Math.PI - 0.4,
      reach * 0.16,
      lighten(SHELL_SLIME, 0.5),
      shown * close,
    );
    for (let drop = 0; drop < 4; drop += 1) {
      const slide = (share * 1.2 + noise(seed, drop)) % 1;
      const along = Math.PI / 2 + (drop % 2 === 0 ? 1 : -1) * slide * (Math.PI / 2) * 0.9;
      const spot = aside(kit, base, Math.cos(along) * reach * 1.75, Math.sin(along) * reach * 1.75);

      kit.puff(spot, reach * 0.2, SHELL_SLIME, swell(slide) * shown * close);
    }
    if (share < SHELTER_CLOSED) {
      return;
    }
    const clang = (share - SHELTER_CLOSED) / (1 - SHELTER_CLOSED);
    const top = aside(kit, base, 0, reach * 1.7);

    kit.star(
      top,
      reach * (0.7 + swell(Math.min(1, clang * 2.5)) * 0.8),
      clang,
      '#ffffff',
      decay(clang * 1.4),
    );
    kit.ring(top, reach * (0.4 + clang * 1.6), 0.1, SHELL_STEEL, decay(clang), { add: 0.3 });
    sparks(kit, top, reach * 1.2, 8, seed, clang, '#ffffff', decay(clang * 2));
  },

  Triplearrows(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = late(share, 0.75);

    for (let one = 0; one < ARROW_COUNT; one += 1) {
      const flight = (share - one * ARROW_GAP) / ARROW_FLIGHT;

      if (flight < 0) {
        continue;
      }
      const lands = aside(kit, at, (one - 1) * reach * 0.6, -spread(seed, one) * reach * 0.5);
      const from = aside(kit, stage.source, (one - 1) * reach * 0.4, reach);
      const place = (t: number): Spot =>
        aside(kit, toward(from, lands, t), 0, Math.sin(Math.PI * t) * reach * 1.2);
      const tip = place(Math.min(1, flight));
      const back = place(Math.max(0, Math.min(1, flight) - 0.06));
      const turn = kit.angleOn(back, tip);
      const sunk = flight < 1 ? 0 : reach * 0.4;
      const point = aside(kit, tip, Math.cos(turn) * sunk, Math.sin(turn) * sunk);
      const tail = aside(kit, point, -Math.cos(turn) * reach * 2, -Math.sin(turn) * reach * 2);
      const alpha = flight < 1 ? 1 : shown;

      if (flight < 1) {
        kit.trail(place(Math.max(0, flight - 0.3)), tail, reach * 0.12, '#ffffff', 0.5);
      }
      band(kit, [tail, point], reach * 0.16, ARROW_SHAFT, ARROW_HEAD, alpha);
      if (flight < 1) {
        spike(kit, point, reach * 0.45, turn, ARROW_HEAD, '#000000', alpha);
      }
      for (const side of [-1, 1]) {
        kit.leaf(
          aside(
            kit,
            tail,
            -Math.sin(turn) * side * reach * 0.2,
            Math.cos(turn) * side * reach * 0.2,
          ),
          reach * 0.75,
          turn + side * 0.5,
          ARROW_LEAF,
          alpha,
        );
      }
      if (flight < 1) {
        continue;
      }
      // The thud: a kick of force out of the spot it struck
      const thud = Math.min(1, (flight - 1) * ARROW_FLIGHT * 3.5);

      if (thud >= 1) {
        continue;
      }
      kit.glow(lands, reach * (0.8 + thud * 1.2), ARROW_KICK, decay(thud) * 0.7, 0.4);
      kit.ring(lands, reach * (0.6 + thud * 2), 0.1, '#ffffff', decay(thud));
      sparks(kit, lands, reach * (1 + thud * 1.4), 8, seed + one, thud, ARROW_KICK, decay(thud));
      for (let bit = 0; bit < 5; bit += 1) {
        kit.leaf(
          thrown(lands, seed + one + 10, bit, thud, reach * 1.6, reach),
          reach * 0.35,
          thud * 6 + bit,
          ARROW_LEAF,
          decay(thud),
        );
      }
    }
  },

  Parade(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const floor = floorOf(at);
    const shown = Math.min(1, share * 8);

    kit.ripple(floor, reach * 2.6, 0.06, PARADE_VIOLET, shown * late(share, PARADE_SWARM) * 0.5);
    for (let one = 0; one < PARADE_FLAMES; one += 1) {
      const angle = (one / PARADE_FLAMES) * TAU + share * Math.PI * 1.6;
      const hop = Math.abs(Math.sin(share * 24 + one)) * reach * 0.4;
      const ground = aside(
        kit,
        floor,
        Math.cos(angle) * reach * 2.6,
        0,
        Math.sin(angle) * reach * 2.6,
      );
      const round = aside(kit, ground, 0, reach * 0.5 + hop);
      const leave = PARADE_SWARM + (one / PARADE_FLAMES) * 0.15;
      const swarm = Math.max(0, Math.min(1, (share - leave) / 0.15));

      if (swarm >= 1) {
        continue;
      }
      kit.pool(ground, reach * 0.35, PARADE_DEEP, shown * decay(swarm) * 0.35, { add: 0 });
      wisp(kit, toward(round, at, swarm ** 1.5), reach * 0.55, share * 20 + one, shown);
    }
    const burstAt = PARADE_SWARM + 0.1;

    if (share < burstAt) {
      return;
    }
    const blaze = (share - burstAt) / (1 - burstAt);

    kit.glow(
      at,
      reach * (1 + blaze * 1.6),
      PARADE_VIOLET,
      swell(Math.min(1, blaze * 1.5)) * 0.8,
      0.4,
    );
    for (let tongue = 0; tongue < 5; tongue += 1) {
      wisp(
        kit,
        aside(
          kit,
          at,
          (tongue - 2) * reach * 0.6,
          swell(blaze) * reach * (0.6 + noise(seed, tongue) * 0.8),
        ),
        reach * 0.6,
        share * 20 + tongue,
        decay(blaze),
      );
    }
    sparks(kit, at, reach * 2.6, many(12, weight), seed, blaze, PARADE_MAGENTA, decay(blaze));
  },

  Ceaseless(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const floor = floorOf(at);
    const centre = aside(kit, at, reach * 0.6, -reach * 1.2);
    const radius = reach * 2.4;
    const start = Math.PI * 0.15;
    const cut = Math.min(1, share / CEASELESS_CUTS) ** 1.3;
    const end = start + cut * Math.PI * 0.9;
    const arc = late(share, 0.45);

    sickle(kit, centre, radius, start, end, reach * 1.1, CEASELESS_DARK, arc * 0.85, 0);
    sickle(kit, centre, radius * 1.04, start, end, reach * 0.35, CEASELESS_TEAL, arc, 0.5);
    sickle(kit, centre, radius * 1.06, start, end, reach * 0.1, '#ffffff', arc);
    if (share < CEASELESS_CUTS) {
      return;
    }
    const after = (share - CEASELESS_CUTS) / (1 - CEASELESS_CUTS);
    const stuck = late(after, 0.8);
    const fly = Math.min(1, after / 0.35);

    kit.glow(at, reach * (1 + after * 1.2), CEASELESS_TEAL, decay(after * 2) * 0.6, 0.4);
    for (let one = 0; one < CEASELESS_SPLINTERS; one += 1) {
      const angle = (one / CEASELESS_SPLINTERS) * TAU + noise(seed, one) * 0.6;
      const rest = aside(
        kit,
        floor,
        Math.cos(angle) * reach * 2.2,
        0,
        Math.sin(angle) * reach * 2.2,
      );

      if (fly < 1) {
        const spot = aside(kit, toward(at, rest, fly), 0, Math.sin(Math.PI * fly) * reach * 1.4);

        spike(kit, spot, reach * 0.6, fly * 8 + one, CEASELESS_SHELL, CEASELESS_DARK, 1);
        continue;
      }
      // Stuck point-up in the ground round it, a dark scar at each foot
      kit.pool(rest, reach * 0.4, CEASELESS_DARK, stuck * 0.5, { add: 0 });
      spike(
        kit,
        aside(kit, rest, 0, reach * 0.2),
        reach * 0.6,
        Math.PI / 2 + spread(seed, one + 10) * 0.4,
        CEASELESS_SHELL,
        CEASELESS_DARK,
        stuck,
      );
    }
    debris(
      kit,
      at,
      reach * 1.6,
      many(8, weight),
      seed + 3,
      after,
      CEASELESS_SHELL,
      decay(after * 1.5),
    );
  },

  Blessing(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const floor = floorOf(at);
    const risen = Math.min(1, share / BLESSING_RISEN);
    const shown = Math.min(1, share * 8) * late(share, 0.75);
    const moon = aside(kit, at, 0, reach * (2.4 + risen * 0.8));
    const pour = Math.max(0, (share - BLESSING_RISEN * 0.6) / (1 - BLESSING_RISEN * 0.6));

    kit.glow(moon, reach * 1.6, BLESSING_SILVER, shown * 0.5, 0.3);
    // The crescent painted, so it holds on a bright ground
    sickle(
      kit,
      moon,
      reach * 0.9,
      Math.PI * 0.35,
      Math.PI * 1.65,
      reach * 0.75,
      BLESSING_SHADE,
      shown * 0.6,
      0,
    );
    sickle(
      kit,
      moon,
      reach * 0.9,
      Math.PI * 0.35,
      Math.PI * 1.65,
      reach * 0.6,
      BLESSING_SILVER,
      shown,
      0.3,
    );
    sickle(
      kit,
      moon,
      reach * 0.95,
      Math.PI * 0.5,
      Math.PI * 1.5,
      reach * 0.18,
      BLESSING_PINK,
      shown,
      0.4,
    );
    if (pour <= 0) {
      return;
    }
    const falling = swell(Math.min(1, pour * 1.2)) * shown;

    for (let ray = 0; ray < 5; ray += 1) {
      const out = (ray - 2) / 2;

      kit.ribbon(
        [aside(kit, moon, out * reach * 0.4, 0), aside(kit, floor, out * reach * 2, 0)],
        reach * 0.5,
        ray % 2 === 0 ? BLESSING_SILVER : BLESSING_GOLD,
        falling * 0.45,
        share * 2,
      );
    }
    kit.glow(at, reach * 1.6, BLESSING_GOLD, falling * 0.5, 0.3);
    kit.ripple(floor, reach * (1.2 + pour * 1.2), 0.1, BLESSING_PINK, decay(pour) * shown, {
      add: 0.3,
    });
    for (let one = 0; one < many(8, weight); one += 1) {
      const rise = (pour * 1.4 + noise(seed, one)) % 1;

      kit.star(
        aside(kit, floor, spread(seed, one + 10) * reach * 2, rise * reach * 2.6),
        reach * 0.4,
        rise * 3,
        one % 2 === 0 ? '#ffffff' : BLESSING_PINK,
        swell(rise) * shown,
      );
    }
  },

  Takeheart(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const floor = floorOf(at);
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const beat = (share / TAKEHEART_BEAT) % 1;
    const swelling = 0.5 + Math.min(1, share * 2) * 0.35 + swell(beat) * 0.15;
    const chest = aside(kit, at, 0, 0, -reach * 0.3);

    kit.glow(chest, reach * 1.8 * swelling, TAKEHEART_BLUE, shown * 0.5, 0.3);
    kit.heart(chest, reach * 1.5 * swelling, 0, TAKEHEART_DARK, shown);
    kit.heart(chest, reach * 1.25 * swelling, 0, TAKEHEART_BLUE, shown);
    kit.glow(
      aside(kit, chest, -reach * 0.1, reach * 0.1),
      reach * 0.35 * swelling,
      TAKEHEART_PALE,
      shown,
      0.6,
    );
    for (let wave = 0; wave < 4; wave += 1) {
      const out = share / TAKEHEART_BEAT - wave;

      if (out < 0 || out > 1.6) {
        continue;
      }
      kit.ring(chest, reach * (0.6 + out * 1.6), 0.08, TAKEHEART_PALE, decay(out / 1.6) * shown, {
        add: 0.4,
      });
      kit.ripple(
        floor,
        reach * (0.8 + out * 1.8),
        0.08,
        TAKEHEART_BLUE,
        decay(out / 1.6) * shown * 0.8,
        {
          add: 0.2,
        },
      );
    }
    for (let one = 0; one < many(8, weight); one += 1) {
      const rise = (share * 1.3 + noise(seed, one)) % 1;

      kit.star(
        aside(kit, at, spread(seed, one + 20) * reach * 1.8, rise * reach * 2.4),
        reach * 0.35,
        rise * 4,
        '#ffffff',
        swell(rise) * shown,
      );
    }
  },

  Chloroblast(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const source = stage.source;

    if (share < CHLORO_FIRES + 0.1) {
      const charge = Math.min(1, share / CHLORO_FIRES);
      const held = late(share, CHLORO_FIRES);

      kit.puff(source, reach * (0.7 + charge * 1.1), CHLORO_DEEP, held * 0.35);
      kit.glow(
        source,
        reach * (0.8 + charge * 1.4),
        CHLORO_GREEN,
        held * (0.4 + charge * 0.5),
        0.4,
      );
      // Light drawn in from round it
      for (let mote = 0; mote < 10; mote += 1) {
        const pull = (charge * 1.8 + noise(seed, mote)) % 1;
        const angle = noise(seed, mote + 20) * TAU;
        const out = reach * (3 - pull * 2.4);
        const spot = aside(kit, source, Math.cos(angle) * out, Math.sin(angle) * out);

        kit.trail(spot, toward(spot, source, 0.25), reach * 0.12, CHLORO_PALE, held * swell(pull));
      }
      kit.ring(source, reach * (2.4 - charge * 1.4), 0.06, CHLORO_DEEP, held * 0.6, { add: 0 });
    }
    if (share < CHLORO_FIRES) {
      return;
    }
    const fire = (share - CHLORO_FIRES) / (1 - CHLORO_FIRES);
    const run = Math.min(1, fire / 0.15);
    const blast = late(fire, 0.5);
    const path: Spot[] = [];

    for (let step = 0; step <= 8; step += 1) {
      path.push(toward(source, at, (step / 8) * run));
    }
    // The cannon: deep green paint under, bright green light, a pale core
    kit.ribbon(path, reach * 2.4, CHLORO_DEEP, blast * 0.55, 0, { add: 0 });
    kit.ribbon(path, reach * 1.8, CHLORO_GREEN, blast, share * 6, { add: 0.5 });
    kit.ribbon(path, reach * 0.6, CHLORO_PALE, blast, share * 8);
    if (run >= 1) {
      const hit = (fire - 0.15) / 0.85;

      kit.glow(at, reach * (1.4 + hit * 1.6), CHLORO_GREEN, decay(hit) * 0.8);
      kit.ring(at, reach * (1.2 + hit * 2.6), 0.08, CHLORO_PALE, decay(hit));
      kit.ripple(floorOf(at), reach * (1.2 + hit * 2.6), 0.1, CHLORO_GREEN, decay(hit) * 0.7);
      sparks(kit, at, reach * (1.6 + hit * 1.6), 12, seed, hit, CHLORO_PALE, decay(hit));
    }
    // The recoil: sparks spitting back off the caster
    sparks(
      kit,
      source,
      reach * (1 + fire * 1.4),
      8,
      seed + 1 + Math.floor(fire * 8),
      fire,
      CHLORO_SPARK,
      decay(fire),
    );
    sparks(
      kit,
      source,
      reach * 1.8,
      many(6, weight),
      seed + 2,
      (fire * 3) % 1,
      CHLORO_SPARK,
      decay(fire),
    );
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default hisuiSignatures;
