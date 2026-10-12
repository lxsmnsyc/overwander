import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import {
  AIRSTREAM_RINGS,
  MAX_CLOUD,
  MAX_DUSK,
  MAX_EARTH,
  MAX_FIST,
  MAX_FORMS,
  MAX_HAIL,
  MAX_HEIGHT,
  MAX_LEAF,
  MAX_MAGENTA,
  MAX_MIND,
  MAX_OOZE,
  MAX_RAIN,
  MAX_RED,
  MAX_SAND,
  MAX_SHROUD,
  MAX_SIZE,
  MAX_SPARK,
  MAX_STAR,
  MAX_STEEL,
  MAX_SUN,
  MAX_VOID,
  MAX_WHITE,
  MAX_WIND,
  MAX_WING,
  MAX_WISP,
  MAX_WYRM,
  ROCKFALL_DROPS,
  STEELSPIKE_SPIKES,
  aftermath,
  clouded,
  falling,
} from '../effect/max-moves';
import type { EffectShape } from '../effect/shapes';
import { showing } from '../effect/stats';
import { TAU, bolt, debris, sickle, smoke, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, reachOf, toward } from './shapes';

/** Where a Max Move happens: the target, the floor under it, the cloud over it, and a size */
interface Frame {
  at: Spot;
  floor: Spot;
  eye: Spot;
  reach: number;
}

function frameOf(kit: EffectBatch, stage: LitStage, weight: number): Frame {
  const at = landed(stage);
  const reach = reachOf(stage, weight) * MAX_SIZE;

  return { at, floor: floorOf(at), eye: aside(kit, at, 0, reach * MAX_HEIGHT), reach };
}

/** A spot on the floor round another, `out` along the ground at `angle` */
function around(kit: EffectBatch, floor: Spot, angle: number, out: number): Spot {
  return aside(kit, floor, Math.cos(angle) * out, 0, Math.sin(angle) * out);
}

/** A flat hexagon lying on the floor, or at the height of `at` */
function hexagon(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  const corners: Spot[] = [];

  for (let corner = 0; corner <= 6; corner += 1) {
    corners.push(around(kit, at, turn + (corner / 6) * TAU, radius));
  }
  kit.ribbon(corners, radius * 0.06, colour, alpha);
}

/** The shared opening: the dark cloud over the target, lit red, ringed in magenta */
function gather(
  kit: EffectBatch,
  { eye, reach }: Frame,
  share: number,
  colour: string,
  seed: number,
): void {
  const shown = clouded(share);

  if (shown <= 0) {
    return;
  }
  const form = Math.min(1, share / MAX_FORMS);

  for (let puff = 0; puff < 6; puff += 1) {
    const angle = (puff / 6) * TAU + share * 0.6;
    const out = reach * 1.6 * form * (0.6 + noise(seed, puff) * 0.4);

    kit.puff(
      aside(kit, eye, Math.cos(angle) * out, reach * 0.2, Math.sin(angle) * out * 0.5),
      reach * (1 + noise(seed, puff + 10) * 0.5) * form,
      MAX_CLOUD,
      shown * 0.75,
    );
  }
  kit.glow(eye, reach * 1.8 * form, MAX_RED, shown * 0.55, 0.4);
  kit.glow(eye, reach * 0.8 * form, colour, shown * 0.85);
  kit.ripple(eye, reach * 2.6 * form, 0.08, MAX_MAGENTA, shown);
  kit.ripple(aside(kit, eye, 0, -reach * 0.15), reach * 1.9 * form, 0.08, MAX_RED, shown * 0.9);

  const flick = Math.floor(share * 14);

  for (let arc = 0; arc < 2; arc += 1) {
    const from = noise(seed + flick, arc) * TAU;
    const to = from + 1.4 + noise(seed + flick, arc + 5);

    bolt(
      kit,
      around(kit, eye, from, reach * 2 * form),
      around(kit, eye, to, reach * 2 * form),
      seed + flick * 7 + arc,
      reach * 0.4,
      reach * 0.05,
      MAX_RED,
      shown * (flick % 2 === 0 ? 0.9 : 0.35),
    );
  }
}

/** The type's energy coming down out of the cloud onto the target */
function column(
  kit: EffectBatch,
  { eye, floor, reach }: Frame,
  share: number,
  colour: string,
): void {
  const drop = falling(share);
  const after = aftermath(share);
  const kept = after <= 0 ? 1 : decay(after * 2.4);

  if (drop <= 0 || kept <= 0) {
    return;
  }
  const head = toward(eye, floor, drop ** 2);

  kit.trail(eye, head, reach * 2.4 * kept, MAX_RED, kept * 0.4);
  kit.trail(eye, head, reach * 1.4 * kept, colour, kept);
  kit.ribbon([eye, head], reach * 0.4 * kept, '#ffffff', kept * 0.8);
  kit.glow(head, reach * 1.6, lighten(colour, 0.4), kept);
}

/** The blow landing: a flash and rings out along the floor in red and the type's colour */
function slam(
  kit: EffectBatch,
  { at, floor, reach }: Frame,
  share: number,
  colour: string,
  seed: number,
): void {
  const hit = Math.min(1, aftermath(share) * 2);

  if (hit <= 0 || hit >= 1) {
    return;
  }
  const light = lighten(colour, 0.55);

  kit.glow(at, reach * (1.4 + hit * 2.2), colour, decay(hit) * 0.75);
  kit.glow(at, reach * (1 + hit), '#ffffff', decay(Math.min(1, hit * 2)));
  for (const [wave, tint] of [light, MAX_RED, MAX_MAGENTA].entries()) {
    const held = Math.max(0, Math.min(1, hit * 1.5 - wave * 0.22));

    if (held > 0) {
      kit.ripple(floor, reach * (1 + held * 4.4), 0.1, tint, decay(held));
    }
  }
  sparks(kit, at, reach * 2.4, 16, seed, hit, light, decay(hit));
}

/** The whole shared opening: cloud, column and slam. `falls` is false where the move draws its own descent */
function maxCall(
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  colour: string,
  seed: number,
  weight: number,
  falls = true,
): Frame {
  const frame = frameOf(kit, stage, weight);

  gather(kit, frame, share, colour, seed);
  if (falls) {
    column(kit, frame, share, colour);
  }
  slam(kit, frame, share, colour, seed);
  return frame;
}

/** Chevrons pointing down and sinking either side of a spot: a stat falling */
function sinking(
  kit: EffectBatch,
  at: Spot,
  reach: number,
  share: number,
  colour: string,
  alpha: number,
): void {
  for (let row = 0; row < 3; row += 1) {
    for (const side of [-1, 1]) {
      const held = (share * 1.4 + row / 3) % 1;

      const point = aside(kit, at, side * reach * 1.5, reach * (1.2 - held * 2.4));

      // Painted rather than lit, so a grey arrow still shows on snow
      kit.ribbon(
        [
          aside(kit, point, -reach * 0.45, reach * 0.3),
          point,
          aside(kit, point, reach * 0.45, reach * 0.3),
        ],
        reach * 0.18,
        colour,
        alpha * swell(held),
        0,
        { add: 0 },
      );
    }
  }
}

const maxMoves = {
  MaxFlare(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, floor, reach } = frame;
    const shown = showing(after, 4, 0.55);
    const sun = aside(kit, at, 0, reach * (1.4 + after * 0.6));
    const turn = after * 1.2;

    kit.pool(floor, reach * 3, paint.color, shown * 0.5);
    kit.glow(sun, reach * 2.2, MAX_SUN, shown * 0.5, 0.4);
    for (let ray = 0; ray < 12; ray += 1) {
      const angle = turn + (ray / 12) * TAU;
      const long = reach * (1.8 + (ray % 2) * 0.6 + swell(after) * 0.6);

      kit.trail(
        aside(kit, sun, Math.cos(angle) * reach * 0.9, Math.sin(angle) * reach * 0.9),
        aside(kit, sun, Math.cos(angle) * long, Math.sin(angle) * long),
        reach * 0.2,
        MAX_SUN,
        shown,
      );
    }
    kit.glow(sun, reach * 1.1, '#fff4c0', shown);
    for (let lick = 0; lick < 9; lick += 1) {
      const rise = (after * 1.6 + noise(seed, lick)) % 1;

      kit.glow(
        aside(kit, floor, spread(seed, lick + 20) * reach * 2.2, rise * reach * 2.2),
        reach * 0.9 * decay(rise * 0.7),
        rise < 0.4 ? MAX_SUN : paint.color,
        shown * swell(rise),
        0.3,
      );
    }
  },

  MaxGeyser(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { eye, floor, reach } = frame;
    const shown = showing(after, 5, 0.6);

    kit.pool(floor, reach * 3.2, paint.color, shown * 0.5, { add: 0.4 });
    for (let drop = 0; drop < 22; drop += 1) {
      const fall = (after * 2.4 + noise(seed, drop)) % 1;
      const top = aside(
        kit,
        eye,
        spread(seed, drop + 30) * reach * 3.4,
        -eye[1] * fall,
        spread(seed, drop + 35) * reach,
      );

      kit.trail(
        top,
        aside(kit, top, -reach * 0.15, -reach * 0.6),
        reach * 0.06,
        MAX_RAIN,
        shown * 0.85,
      );
    }
    for (let splash = 0; splash < 6; splash += 1) {
      const held = (after * 2 + noise(seed, splash + 60)) % 1;

      kit.ripple(
        aside(
          kit,
          floor,
          spread(seed, splash + 70) * reach * 2.6,
          0,
          spread(seed, splash + 80) * reach,
        ),
        reach * (0.2 + held * 0.6),
        0.15,
        MAX_RAIN,
        shown * decay(held),
      );
    }
  },

  MaxHailstorm(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, eye, floor, reach } = frame;
    const shown = showing(after, 5, 0.55);
    const ice = lighten(paint.color, 0.2);

    kit.glow(at, reach * 2.2, paint.color, shown * 0.5, 0.2, { add: 0.3 });
    for (let arm = 0; arm < 6; arm += 1) {
      const angle = after * 0.8 + (arm / 6) * TAU;
      const tip = aside(
        kit,
        at,
        Math.cos(angle) * reach * 2 * shown,
        Math.sin(angle) * reach * 2 * shown,
      );

      kit.trail(at, tip, reach * 0.26, ice, shown);
      kit.trail(
        toward(at, tip, 0.6),
        aside(kit, tip, Math.cos(angle + 0.8) * reach * 0.5, Math.sin(angle + 0.8) * reach * 0.5),
        reach * 0.12,
        ice,
        shown,
      );
    }
    debris(kit, at, reach * 1.8, 12, seed, after, lighten(paint.color, 0.4), decay(after));
    for (let stone = 0; stone < 14; stone += 1) {
      const fall = (after * 2 + noise(seed, stone)) % 1;

      kit.shard(
        aside(
          kit,
          eye,
          spread(seed, stone + 30) * reach * 3.4,
          -eye[1] * fall,
          spread(seed, stone + 35) * reach,
        ),
        reach * 0.4,
        fall * 6 + stone,
        ice,
        shown * swell(fall * 0.9 + 0.1),
        { add: 0.2 },
      );
    }
    kit.pool(floor, reach * 3, MAX_HAIL, shown * 0.4, { add: 0.4 });
  },

  MaxRockfall(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight, false);
    const { at, eye, floor, reach } = frame;
    const drop = falling(share);
    const after = aftermath(share);

    for (const [index, starts] of ROCKFALL_DROPS.entries()) {
      const fall = Math.max(0, Math.min(1, (drop + after * 0.6 - starts) / 0.6));

      if (fall <= 0 || fall >= 1) {
        continue;
      }
      const top = aside(kit, eye, (index - 1) * reach * 1.3, 0);
      const spot = toward(
        top,
        aside(kit, floor, (index - 1) * reach * 1.3, reach * 0.6),
        fall ** 2,
      );
      const size = reach * (0.8 - index * 0.12);

      kit.shard(spot, size * 1.6, fall * 3 + index, mix(paint.color, '#2a1c12', 0.35), 1);
      kit.shard(
        aside(kit, spot, -size * 0.2, size * 0.2),
        size,
        fall * 3 + index,
        lighten(paint.color, 0.3),
        1,
      );
    }
    if (after <= 0) {
      return;
    }
    const shown = showing(after, 4, 0.55);

    for (let gust = 0; gust < 4; gust += 1) {
      const start = after * 7 + gust * 1.6;

      sickle(
        kit,
        aside(kit, at, 0, -reach * 0.3),
        reach * (1.4 + gust * 0.5),
        start,
        start + 1.8,
        reach * 0.35,
        gust % 2 === 0 ? MAX_SAND : lighten(MAX_SAND, 0.35),
        shown * 0.7,
        0.3,
      );
    }
    debris(kit, floor, reach * 1.6, 10, seed, after, paint.color, decay(after));
    smoke(kit, floor, reach * 3, 5, seed, after, MAX_SAND, shown * 0.45);
  },

  MaxLightning(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight, false);
    const { eye, floor, reach } = frame;
    const drop = falling(share);
    const after = aftermath(share);
    const flick = Math.floor(share * 18);

    if (drop > 0 && after < 0.35) {
      const head = toward(eye, floor, drop ** 2);
      const kept = decay(after / 0.35);

      bolt(kit, eye, head, seed + flick, reach, reach * 0.6, MAX_RED, kept * 0.6);
      bolt(kit, eye, head, seed + flick, reach, reach * 0.36, paint.color, kept);
      kit.glow(head, reach * 1.6, MAX_SPARK, kept);
    }
    if (after <= 0) {
      return;
    }
    const shown = showing(after, 5, 0.6);
    const bright = shown * (flick % 3 === 2 ? 0.45 : 1);

    kit.pool(floor, reach * 3.4, paint.color, bright * 0.55);
    kit.ripple(floor, reach * 3.2, 0.06, MAX_SPARK, bright * 0.7);
    for (let arc = 0; arc < 5; arc += 1) {
      const from = noise(seed + flick, arc) * TAU;
      const to = from + 0.6 + noise(seed + flick, arc + 9) * 0.8;

      bolt(
        kit,
        around(kit, floor, from, reach * 3),
        around(kit, floor, to, reach * 1.5),
        seed + flick * 5 + arc,
        reach * 0.5,
        reach * 0.08,
        MAX_SPARK,
        bright,
      );
    }
  },

  MaxOvergrowth(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, floor, reach } = frame;
    const shown = showing(after, 4, 0.6);
    const grow = Math.min(1, after * 2.4);

    kit.pool(floor, reach * 3.2, paint.color, shown * 0.55, { add: 0.3 });
    for (let blade = 0; blade < 11; blade += 1) {
      const angle = (blade / 11) * TAU + noise(seed, blade) * 0.3;
      const base = around(kit, floor, angle, reach * 2.2);
      const tall = reach * (1.6 + noise(seed, blade + 20) * 1.6) * grow;
      const bend = spread(seed, blade + 60) * reach * 0.5;

      kit.ribbon(
        [
          base,
          aside(kit, base, bend, tall * 0.5),
          aside(kit, base, spread(seed, blade + 40) * reach * 0.6, tall),
        ],
        reach * 0.26,
        blade % 3 === 0 ? MAX_LEAF : paint.color,
        shown,
        0,
        { add: 0.1 },
      );
    }
    for (let leaf = 0; leaf < 8; leaf += 1) {
      const held = (after * 1.4 + noise(seed, leaf + 80)) % 1;
      const angle = noise(seed, leaf + 90) * TAU + after * 3;

      kit.leaf(
        aside(
          kit,
          at,
          Math.cos(angle) * reach * 2 * held,
          held * reach * 2,
          Math.sin(angle) * reach,
        ),
        reach * 0.4,
        angle,
        MAX_LEAF,
        shown * swell(held),
      );
    }
  },

  MaxMindstorm(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, floor, reach } = frame;
    const shown = showing(after, 4, 0.6);

    kit.pool(floor, reach * 3, MAX_MIND, shown * 0.4);
    for (let wave = 0; wave < 4; wave += 1) {
      const held = (after * 1.8 + wave / 4) % 1;

      kit.ripple(
        floor,
        reach * (0.6 + held * 4),
        0.08,
        wave % 2 === 0 ? MAX_MIND : paint.color,
        shown * decay(held),
      );
    }
    for (let loop = 0; loop < 3; loop += 1) {
      const radius = reach * (1.4 + loop * 0.45);

      kit.oval(
        at,
        radius,
        Math.max(radius * 0.08, radius * Math.abs(Math.sin(after * 6 + loop * 1.1))),
        loop * 1.05 + after * 2,
        0.06,
        lighten(MAX_MIND, 0.3),
        shown * 0.85,
      );
    }
    kit.glow(at, reach * 1.2, MAX_MIND, shown * 0.5);
    sparks(kit, at, reach * 2.4, 10, seed, after, '#ffffff', shown);
  },

  MaxStarfall(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, eye, floor, reach } = frame;
    const shown = showing(after, 4, 0.6);

    kit.pool(floor, reach * 3.4, MAX_STAR, shown * 0.55);
    kit.glow(at, reach * 2.4, paint.color, shown * 0.3, 0);
    for (let fall = 0; fall < 12; fall += 1) {
      const held = (after * 1.6 + noise(seed, fall)) % 1;
      const spot = aside(
        kit,
        eye,
        spread(seed, fall + 30) * reach * 3,
        -eye[1] * held,
        spread(seed, fall + 35) * reach,
      );

      kit.trail(
        aside(kit, spot, reach * 0.4, reach * 1.2),
        spot,
        reach * 0.14,
        paint.color,
        shown * 0.6 * decay(held),
      );
      kit.star(
        spot,
        reach * (0.7 + noise(seed, fall + 50) * 0.4),
        held * 4,
        fall % 3 === 0 ? MAX_STAR : paint.color,
        shown * swell(held * 0.8 + 0.2),
      );
    }
  },

  MaxStrike(kit, stage, share, { seed, weight }) {
    const frame = maxCall(kit, stage, share, MAX_WHITE, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, reach } = frame;

    // A grey star painted under the white one, so it still shows on snow
    kit.star(at, reach * (3 + after * 1.6), after * 0.6, MAX_DUSK, decay(after) * 0.85, { add: 0 });
    kit.star(at, reach * (2.6 + after * 1.6), after * 0.6, MAX_WHITE, decay(after) * 0.8);
    kit.star(at, reach * 1.4, -after, '#ffffff', decay(after));
    kit.ring(at, reach * (1.4 + after * 1.6), 0.06, MAX_RED, decay(after));
    sinking(kit, at, reach, after, MAX_DUSK, showing(after, 5, 0.55));
  },

  MaxFlutterby(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, reach } = frame;
    const shown = showing(after, 4, 0.6);

    kit.glow(at, reach * 2, paint.color, shown * 0.35, 0.2);
    for (let wing = 0; wing < 5; wing += 1) {
      const angle = after * 3 + (wing / 5) * TAU;
      const spot = aside(
        kit,
        at,
        Math.cos(angle) * reach * 2,
        reach * 0.4,
        Math.sin(angle) * reach * 2,
      );
      const flap = 0.5 + Math.abs(Math.sin(after * 22 + wing)) * 0.5;

      kit.glow(spot, reach * 0.9, MAX_WING, shown * 0.6, 0.4);
      for (const side of [-1, 1]) {
        kit.leaf(
          aside(kit, spot, side * reach * 0.3 * flap, 0),
          reach * 0.55,
          side * (0.9 + flap * 0.4),
          wing % 2 === 0 ? MAX_WING : paint.color,
          shown * 0.9,
        );
      }
    }
    for (let mote = 0; mote < 14; mote += 1) {
      const fall = (after * 1.2 + noise(seed, mote)) % 1;

      kit.glow(
        aside(
          kit,
          at,
          spread(seed, mote + 20) * reach * 2.4,
          reach * (1.4 - fall * 2),
          spread(seed, mote + 30) * reach,
        ),
        reach * 0.1,
        MAX_WING,
        shown * swell(fall),
      );
    }
  },

  MaxPhantasm(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, floor, reach } = frame;
    const shown = showing(after, 4, 0.6);

    kit.glow(at, reach * 2.4, MAX_SHROUD, shown * 0.55, 0, { add: 0 });
    kit.pool(floor, reach * 3, MAX_WISP, shown * 0.4);
    for (let wisp = 0; wisp < 8; wisp += 1) {
      const rise = (after * 1.2 + noise(seed, wisp)) % 1;
      const angle = (wisp / 8) * TAU + rise * 3;
      const spot = aside(kit, around(kit, floor, angle, reach * 1.8), 0, rise * reach * 3.4);

      kit.glow(
        spot,
        reach * 0.8 * (1 - rise * 0.4),
        wisp % 2 === 0 ? MAX_WISP : lighten(MAX_WISP, 0.4),
        shown * swell(rise),
        0.3,
      );
      kit.streak(
        aside(kit, spot, 0, -reach * 0.4),
        reach * 0.5,
        reach * 0.18,
        Math.PI / 2,
        MAX_WISP,
        shown * swell(rise) * 0.6,
      );
    }
    const open = Math.min(1, after * 3) * shown;

    for (const side of [-1, 1]) {
      kit.streak(
        aside(kit, at, side * reach * 0.6, reach * 0.9),
        reach * 0.32,
        reach * 0.16 * open + 0.001,
        0,
        '#ffe0ff',
        open,
      );
    }
  },

  MaxWyrmwind(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, reach } = frame;
    const shown = showing(after, 4, 0.6);

    for (let band = 0; band < 5; band += 1) {
      const start = after * 9 + band * 1.3;

      // A coil lying round the target, climbing as it winds
      const coil: Spot[] = [];
      const centre = aside(kit, at, 0, reach * (band * 0.45 - 0.6));

      for (let step = 0; step <= 8; step += 1) {
        coil.push(
          aside(
            kit,
            around(kit, centre, start + (step / 8) * 2.4, reach * (2.4 - band * 0.25)),
            0,
            (step / 8) * reach * 0.5,
          ),
        );
      }
      kit.ribbon(
        coil,
        reach * 0.5,
        band % 2 === 0 ? MAX_WYRM : mix(paint.color, '#c06cff', 0.5),
        shown * (0.95 - band * 0.1),
        start,
        { add: 0.3 },
      );
    }
    debris(kit, at, reach * 1.6, 10, seed, after, lighten(MAX_WYRM, 0.4), decay(after));
  },

  MaxDarkness(kit, stage, share, { seed, weight }) {
    const frame = maxCall(kit, stage, share, '#6a3a8a', seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, reach } = frame;
    const shown = showing(after, 4, 0.6);
    const pull = swell(Math.min(1, after * 1.4));

    for (let tendril = 0; tendril < 7; tendril += 1) {
      const angle = (tendril / 7) * TAU + noise(seed, tendril) * 0.4;
      const out = reach * (2 + pull * 1.6);
      const bend = spread(seed, tendril + 10) * reach;

      kit.ribbon(
        [
          at,
          aside(
            kit,
            at,
            Math.cos(angle) * out * 0.5 - Math.sin(angle) * bend,
            Math.sin(angle) * out * 0.35 + Math.cos(angle) * bend,
          ),
          aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.7),
        ],
        reach * 0.4,
        MAX_VOID,
        shown * 0.85,
        0,
        { add: 0 },
      );
    }
    kit.puff(at, reach * (1.6 + pull * 0.8), MAX_VOID, shown * 0.8);
    kit.ring(at, reach * (1.5 + pull * 0.7), 0.06, MAX_RED, shown * 0.8);
    kit.ring(at, reach * (1.9 + pull * 0.7), 0.05, '#9a5acc', shown * 0.6);
    sinking(kit, at, reach, after, '#9a5acc', shown * 0.8);
  },

  MaxKnuckle(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight, false);
    const { at, eye, floor, reach } = frame;
    const drop = falling(share);
    const after = aftermath(share);

    if (drop > 0 && after < 0.25) {
      const spot = toward(eye, aside(kit, at, 0, reach * 0.6), drop ** 2);
      const kept = decay(after / 0.25);
      const size = reach * 1.4;

      kit.trail(eye, spot, reach * 1.2, MAX_FIST, kept * 0.4);
      kit.glow(spot, reach * 2.2, MAX_RED, kept * 0.5, 0.3);
      // Painted rather than lit, so the fist is a solid thing on bright ground
      kit.puff(aside(kit, spot, 0, size * 0.2), size * 0.8, mix(MAX_FIST, '#a04010', 0.3), kept);
      for (let knuckle = 0; knuckle < 4; knuckle += 1) {
        kit.puff(
          aside(kit, spot, (knuckle - 1.5) * size * 0.34, -size * 0.45),
          size * 0.26,
          lighten(MAX_FIST, 0.3),
          kept,
        );
      }
      kit.glow(spot, size * 0.6, '#ffffff', kept * 0.4);
    }
    if (after <= 0) {
      return;
    }
    const shown = showing(after, 5, 0.55);

    for (let crack = 0; crack < 7; crack += 1) {
      const angle = (crack / 7) * TAU + noise(seed, crack) * 0.4;

      kit.pit(
        around(kit, floor, angle, reach * 1.4 * Math.min(1, after * 3)),
        reach * 0.6,
        Math.min(1, after * 3) * 0.6,
        '#3a2010',
        shown * 0.7,
      );
    }
    kit.pool(floor, reach * 3.4, MAX_FIST, shown * 0.45);
    debris(kit, floor, reach * 1.6, 10, seed, after, MAX_EARTH, decay(after));
  },

  MaxSteelspike(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, floor, reach } = frame;
    const shown = showing(after, 5, 0.6);
    const rise = Math.min(1, after * 3) ** 0.5;
    const steel = mix(paint.color, '#203040', 0.25);

    for (let index = 0; index < STEELSPIKE_SPIKES; index += 1) {
      const angle = (index / STEELSPIKE_SPIKES) * TAU + 0.3;
      const base = around(kit, floor, angle, reach * 2.2);
      const tall = reach * (2.4 + noise(seed, index) * 1.2) * rise;
      const tip = aside(kit, base, Math.cos(angle) * reach * 0.5, tall);

      // Tapered: each quarter of its height a narrower band than the one under it
      for (let band = 0; band < 4; band += 1) {
        kit.ribbon(
          [toward(base, tip, band / 4), toward(base, tip, (band + 1) / 4)],
          reach * (0.9 - band * 0.22),
          steel,
          shown,
          0,
          {
            add: 0,
          },
        );
      }
      kit.ribbon([toward(base, tip, 0.1), tip], reach * 0.25, MAX_STEEL, shown * 0.7, 0, {
        add: 0.5,
      });
    }
    for (let glint = 0; glint < 3; glint += 1) {
      kit.star(
        aside(
          kit,
          at,
          spread(seed, glint + 40) * reach * 2,
          reach * (1 + noise(seed, glint + 50) * 1.4),
        ),
        reach * 0.6,
        after * 3,
        '#ffffff',
        shown * swell((after * 2 + glint / 3) % 1),
      );
    }
  },

  MaxOoze(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, floor, reach } = frame;
    const shown = showing(after, 4, 0.6);

    kit.pool(floor, reach * 3.4 * Math.min(1, after * 2.4), MAX_OOZE, shown * 0.85, { add: 0.2 });
    for (let pop = 0; pop < 10; pop += 1) {
      const rise = (after * 1.8 + noise(seed, pop)) % 1;

      kit.bubble(
        aside(
          kit,
          floor,
          spread(seed, pop + 20) * reach * 2.6,
          rise * reach * 1.8,
          spread(seed, pop + 30) * reach,
        ),
        reach * (0.2 + noise(seed, pop + 40) * 0.25) * (0.5 + rise),
        MAX_OOZE,
        shown * decay(rise),
      );
    }
    debris(kit, at, reach * 1.8, 12, seed, after, paint.color, decay(after));
  },

  MaxQuake(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { floor, reach } = frame;
    const shown = showing(after, 5, 0.6);

    kit.pool(floor, reach * 3.6, MAX_EARTH, shown * 0.6, { add: 0 });
    for (let crack = 0; crack < 8; crack += 1) {
      const angle = (crack / 8) * TAU + noise(seed, crack) * 0.3;
      const open = Math.min(1, after * 2.6);

      kit.pit(
        around(kit, floor, angle, reach * 1.8 * open),
        reach * 0.8,
        open * 0.6,
        '#2a1408',
        shown * 0.8,
      );
    }
    for (let slab = 0; slab < 5; slab += 1) {
      const angle = noise(seed, slab + 50) * TAU;
      const up = swell(Math.min(1, after * 1.6 - slab * 0.06)) * reach * 1.4;

      kit.shard(
        aside(kit, around(kit, floor, angle, reach * 2.4), 0, up + reach * 0.3),
        reach * 0.5,
        slab,
        MAX_EARTH,
        shown,
      );
    }
    smoke(kit, floor, reach * 3, 5, seed, after, lighten(MAX_EARTH, 0.3), shown * 0.4);
  },

  MaxAirstream(kit, stage, share, { paint, seed, weight }) {
    const frame = maxCall(kit, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { floor, reach } = frame;
    const shown = showing(after, 4, 0.6);
    const rise = Math.min(1, after * 2.4);

    for (let level = 0; level < AIRSTREAM_RINGS; level += 1) {
      const up = level / (AIRSTREAM_RINGS - 1);
      const sway = Math.sin(after * 10 + level * 0.9) * reach * 0.4 * up;
      const centre = aside(kit, floor, sway, up * reach * 4.4 * rise);
      const radius = reach * (0.8 + up * 2);
      const start = after * 14 + level * 0.8;
      const arc: Spot[] = [];

      kit.ripple(centre, radius, 0.06, paint.color, shown * 0.7, { add: 0.3 });
      for (let step = 0; step <= 6; step += 1) {
        arc.push(around(kit, centre, start + (step / 6) * 2.2, radius));
      }
      kit.ribbon(arc, reach * 0.24, level % 2 === 0 ? MAX_WIND : paint.color, shown, 0, {
        add: 0.3,
      });
    }
    sparks(kit, floor, reach * 3, 10, seed, after, '#ffffff', shown);
  },

  MaxGuard(kit, stage, share, { seed }) {
    const at = landed(stage);
    const reach = reachOf(stage) * 1.6;
    const floor = floorOf(at);
    const up = Math.min(1, share * 4) ** 0.5;
    const shown = share < 0.78 ? 1 : decay((share - 0.78) / 0.22);
    const wide = reach * 1.6;
    const tall = reach * 2 * up;
    const pulse = 0.5 + Math.sin(share * 18) * 0.5;
    const top: Spot = [floor[0], tall, floor[2]];

    kit.glow(aside(kit, floor, 0, tall * 0.5), wide * 1.2, MAX_RED, shown * 0.45, 0);
    for (let band = 0; band < 4; band += 1) {
      const lat = (band / 4) * (Math.PI / 2);

      kit.ripple(
        [floor[0], Math.sin(lat) * tall, floor[2]],
        Math.cos(lat) * wide,
        0.05,
        band === 0 ? MAX_MAGENTA : lighten(MAX_RED, 0.3),
        shown * (band === 0 ? 1 : 0.4 + pulse * 0.4),
      );
    }
    for (let rib = 0; rib < 4; rib += 1) {
      const turn = (rib / 4) * Math.PI + share * 0.6;
      const path: Spot[] = [];

      for (let step = 0; step <= 10; step += 1) {
        const lat = (step / 10) * Math.PI;

        path.push([
          floor[0] + Math.cos(lat) * Math.cos(turn) * wide,
          Math.sin(lat) * tall,
          floor[2] + Math.cos(lat) * Math.sin(turn) * wide,
        ]);
      }
      kit.ribbon(path, reach * 0.08, MAX_RED, shown * 0.7);
    }
    hexagon(kit, floor, wide * 1.1, share, MAX_MAGENTA, shown);
    hexagon(kit, top, reach * 0.6, -share * 3, '#ffffff', shown * up);
    kit.glow(top, reach * 0.6, MAX_MAGENTA, shown * up * 0.7);
    if (share < 0.4) {
      const run = share / 0.4;

      kit.ripple(
        [floor[0], tall * run, floor[2]],
        wide * Math.cos(run * (Math.PI / 2)),
        0.08,
        '#ffffff',
        decay(run),
      );
    }
    sparks(kit, at, reach * 1.6, 10, seed, share, MAX_MAGENTA, shown * 0.8);
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default maxMoves;
