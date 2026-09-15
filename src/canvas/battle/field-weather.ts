import { Weathers } from '../../data/ids/status';
import type EffectBatch from '../three/effect-batch';
import type { Spot } from '../three/effect-batch';
import projectField, { type FieldView, unprojectField } from './field';
import { noise } from './moves/__paint';

/**
 * The battle's weather built in the scene, in field units: rain falls
 * through the field and splashes on the ground, fog drifts between the
 * pokemon, and whoever stands nearer the camera is in front of it. The
 * colours, counts and timings are the painted sky's in `weather.ts`,
 * which stays the drawing without WebGL. Sizes are given in drawing
 * pixels at the middle of the field, so near ones come out larger.
 */

/** How many of whatever is falling, as the painted sky has */
const DROPS = 90;

/** How long one drop takes to fall, in milliseconds */
const FALL = 900;

/**
 * What a sky covers, in drawing coordinates: the whole picture, or the
 * shaft over one team that the painted sky tints. `bleed` is how far past
 * the sides it reaches, so nothing pops in at the picture's border
 */
export interface SkyArea {
  left: number;
  top: number;
  right: number;
  bottom: number;
  bleed: number;
}

/** A place on the ground under the sky, and how high the field runs above it before the picture's top */
interface Ground {
  x: number;
  z: number;
  top: number;
}

/**
 * The ground at `across` (0 left to 1 right) and `down` (0 at the top of
 * the area to 1 at its bottom). Null where that is past the horizon
 */
function groundAt(view: FieldView, area: SkyArea, across: number, down: number): Ground | null {
  const { left, top, right, bottom, bleed } = area;
  const foot = unprojectField(
    left - bleed + (right - left + bleed * 2) * across,
    top + (bottom - top) * down,
    view,
  );

  if (foot == null) {
    return null;
  }
  const seen = projectField(foot, view);

  if (!seen.visible || seen.scale <= 0) {
    return null;
  }
  return { x: foot.x, z: foot.z, top: Math.max(0, (seen.y - top) / (seen.scale * view.unit)) };
}

/** Where one of many is through its cycle, from 0 to 1, spread so the sky is never empty */
function falling(index: number, clock: number, span: number): number {
  return (((clock / span + noise(1, index)) % 1) + 1) % 1;
}

/** More of them near the camera, where the field is spread over more of the picture */
function nearward(share: number): number {
  return 1 - (1 - share) ** 2;
}

function rain(
  kit: EffectBatch,
  view: FieldView,
  area: SkyArea,
  clock: number,
  heavy: boolean,
): void {
  const px = 1 / view.unit;
  const alpha = heavy ? 0.5 : 0.35;
  const [ax, az] = kit.across;

  for (let drop = 0; drop < (heavy ? DROPS * 1.6 : DROPS); drop += 1) {
    const ground = groundAt(view, area, noise(2, drop), nearward(noise(7, drop)));

    if (ground == null) {
      continue;
    }
    const along = falling(drop, clock, FALL);
    // Slanting across the picture as it falls, the way the painted rain does
    const lean = ground.top * (1 - along) * 0.3;
    const height = ground.top * (1 - along);
    const head: Spot = [ground.x - ax * lean, height, ground.z - az * lean];
    const length = 29 * px;
    const tail: Spot = [head[0] - ax * length * 0.3, height + length, head[2] - az * length * 0.3];

    kit.trail(tail, head, 2 * px, '#2980ef', alpha);
    // The splash of the fall before, spreading where it landed
    if (along < 0.25) {
      const share = along / 0.25;

      kit.ripple(
        [ground.x, 0.02, ground.z],
        (1.5 + share * 3.5) * px,
        0.2,
        '#7fb4ff',
        alpha * 1.4 * (1 - share),
      );
    }
  }
}

function snow(kit: EffectBatch, view: FieldView, area: SkyArea, clock: number, icy: boolean): void {
  const px = 1 / view.unit;
  const [ax, az] = kit.across;

  for (let flake = 0; flake < DROPS; flake += 1) {
    const ground = groundAt(view, area, noise(4, flake), nearward(noise(8, flake)));

    if (ground == null) {
      continue;
    }
    const along = falling(flake, clock, FALL * 2.2);
    const drift = Math.sin(clock / 700 + flake) * 13 * px;
    const size = (icy ? 1.6 : 1.2 + noise(3, flake)) * px * 1.4;
    const spot: Spot = [ground.x + ax * drift, ground.top * (1 - along), ground.z + az * drift];

    if (icy) {
      kit.puff(spot, size, '#3dcef3', 0.75);
      kit.glow(spot, size * 0.7, '#ffffff', 0.5, 1);
      // Hail does not settle: the stone before this one hops off the ground
      if (along < 0.12) {
        const share = along / 0.12;

        kit.puff(
          [ground.x + ax * drift, Math.sin(share * Math.PI) * 6 * px, ground.z + az * drift],
          size,
          '#3dcef3',
          0.75 * (1 - share),
        );
      }
    } else {
      // A grey rim, so a white flake still shows over pale ground
      kit.puff(spot, size * 1.35, '#8a94a6', 0.25);
      kit.puff(spot, size, '#e6ecf5', 0.75);
    }
  }
}

function sand(kit: EffectBatch, view: FieldView, area: SkyArea, clock: number): void {
  const px = 1 / view.unit;
  const [ax, az] = kit.across;

  // Dust rolling along the ground under the grains
  for (let cloud = 0; cloud < 14; cloud += 1) {
    const across = (((clock / 3000 + noise(10, cloud)) % 1) + 1) % 1;
    const ground = groundAt(view, area, across, nearward(noise(11, cloud)));

    if (ground == null) {
      continue;
    }
    const radius = (30 + noise(12, cloud) * 25) * px;

    kit.glow(
      [ground.x, radius * 0.4, ground.z],
      radius,
      '#c4a24c',
      0.28 * Math.sin(Math.PI * across),
      0,
      { add: 0 },
    );
  }
  // Sideways rather than down: what makes a sandstorm read as one is that everything in it goes the same way, fast
  for (let grain = 0; grain < DROPS * 2; grain += 1) {
    const across = (((clock / 600 + noise(5, grain)) % 1) + 1) % 1;
    const ground = groundAt(view, area, across, nearward(noise(6, grain)));

    if (ground == null) {
      continue;
    }
    const spot: Spot = [ground.x, noise(9, grain) ** 2 * ground.top * 0.7, ground.z];
    const length = 6 * px;

    kit.trail(
      [spot[0] - ax * length, spot[1], spot[2] - az * length],
      spot,
      1.5 * px,
      '#915121',
      0.55,
    );
  }
}

function sun(
  kit: EffectBatch,
  view: FieldView,
  area: SkyArea,
  clock: number,
  harsh: boolean,
): void {
  const px = 1 / view.unit;
  const [ax, az] = kit.across;
  const shafts = harsh ? 6 : 4;

  for (let shaft = 0; shaft < shafts; shaft += 1) {
    const breath = 0.5 + 0.5 * Math.sin(clock / 1400 + shaft * 1.7);
    const ground = groundAt(
      view,
      area,
      (shaft + 0.5) / shafts + Math.sin(clock / 5000 + shaft) * 0.04,
      0.45 + noise(13, shaft) * 0.4,
    );

    if (ground == null) {
      continue;
    }
    const foot: Spot = [ground.x, 0.02, ground.z];
    // Leaning out of the top middle, where the painted glow comes from
    const lean = ground.top * 0.35 * ((shaft + 0.5) / shafts - 0.5) * 2;
    const sky: Spot = [ground.x - ax * lean, ground.top, ground.z - az * lean];
    const strength = (harsh ? 0.16 : 0.1) * (0.6 + 0.4 * breath);

    kit.ribbon([sky, foot], (40 + noise(14, shaft) * 30) * px, '#fac000', strength);
    kit.pool(foot, 45 * px, '#fac000', strength * 1.4);
  }
  // Motes turning in the light
  for (let mote = 0; mote < (harsh ? 36 : 24); mote += 1) {
    const ground = groundAt(view, area, noise(15, mote), nearward(noise(16, mote)));

    if (ground == null) {
      continue;
    }
    const rise = falling(mote, clock, 6000);
    const twinkle = 0.5 + 0.5 * Math.sin(clock / 260 + mote * 2.3);
    const drift = Math.sin(clock / 1900 + mote) * 10 * px;

    kit.glow(
      [ground.x + ax * drift, (0.1 + rise * 0.5) * ground.top, ground.z + az * drift],
      2.5 * px,
      '#fff2b0',
      0.7 * twinkle * Math.sin(Math.PI * rise),
    );
  }
}

function fog(kit: EffectBatch, view: FieldView, area: SkyArea, clock: number): void {
  const px = 1 / view.unit;

  for (let band = 0; band < 5; band += 1) {
    for (let bank = 0; bank < 9; bank += 1) {
      const which = band * 9 + bank;
      const across = (clock / 4000 + band * 0.25 + bank / 9) % 1;
      // Overlapping wide and off a line, so the banks run together rather than reading as spots
      const ground = groundAt(
        view,
        area,
        across,
        0.12 + band * 0.2 + (noise(18, which) - 0.5) * 0.12,
      );

      if (ground == null) {
        continue;
      }
      const radius = (100 + noise(17, which) * 60) * px;

      // Faded at the edges it wraps round at
      kit.glow(
        [ground.x, radius * 0.3, ground.z],
        radius,
        '#9aa0ad',
        0.13 * Math.sin(Math.PI * across),
        0,
        { add: 0 },
      );
    }
  }
}

/** Build whatever is in the sky. `None` and the wind build nothing, as the painted sky draws nothing */
export default function buildWeather(
  kit: EffectBatch,
  weather: Weathers,
  view: FieldView,
  area: SkyArea,
  clock: number,
): void {
  kit.near(0);
  switch (weather) {
    case Weathers.Rain:
      rain(kit, view, area, clock, false);
      break;
    case Weathers.HeavyRain:
      rain(kit, view, area, clock, true);
      break;
    case Weathers.Hail:
      snow(kit, view, area, clock, true);
      break;
    case Weathers.Snow:
      snow(kit, view, area, clock, false);
      break;
    case Weathers.Sandstorm:
      sand(kit, view, area, clock);
      break;
    case Weathers.Sunny:
      sun(kit, view, area, clock, false);
      break;
    case Weathers.ExtremeSunny:
      sun(kit, view, area, clock, true);
      break;
    case Weathers.Fog:
      fog(kit, view, area, clock);
      break;
    case Weathers.None:
    case Weathers.StrongWinds:
      break;
  }
}
