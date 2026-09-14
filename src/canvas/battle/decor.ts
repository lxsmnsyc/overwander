import {
  BREATH,
  ORBIT,
  PILLARS,
  RISE,
  STARS,
  STAR_RISE,
  type StormSpot,
  drift,
  lifeOf,
  stormOf,
} from '../auras';
import {
  SPARKLE_BURST,
  SPARKLE_COLORS,
  SPARKLE_LIFE,
  SPARKLE_MIDDLE,
  SPARKLE_RAYS,
  SPARKLE_RAY_REACH,
  SPARKLE_RING_REACH,
  SPARKLE_RISE,
  SPARKLE_SPREAD,
  SPARKLE_STARS,
  SPARKLE_STAR_LIFE,
  SPARKLE_STAR_SIZE,
  SPARKLE_TINTS,
  sparkleStar,
} from '../sparkle';
import type EffectBatch from '../three/effect-batch';
import type { Spot } from '../three/effect-batch';
import { aside } from './moves/lit/shapes';

/**
 * The shadow and purified auras and the shiny sparkle, built in the
 * battle scene. The designs and timings are the painted ones in
 * `auras.ts` and `sparkle.ts`, stood round the pokemon in depth, so the
 * half behind it is hidden by it. Sizes are in field units.
 */

const TAU = Math.PI * 2;

/** The dark line round every sparkle shape, so a pale glint still shows on sand */
const SPARKLE_EDGE = '#5a3c00';

/** How far across the picture a direction round the pokemon points, from 0 to 1 */
function sideways(kit: EffectBatch, angle: number): number {
  const [ax, az] = kit.across;

  return Math.abs(Math.cos(angle) * ax + Math.sin(angle) * az);
}

/** The storm cloud a shadow pokemon stands in. `radius` is its ground shadow's */
export function litShadowAura(
  kit: EffectBatch,
  floor: Spot,
  radius: number,
  elapsed: number,
  seed: number,
  strength: number,
): void {
  // Judged behind the body, as the painted aura is drawn under it: only what reaches past its outline shows
  kit.near(-radius * 1.5);
  const storm = stormOf(elapsed, seed);
  const [ax, az] = kit.across;
  const [wx, wz] = kit.away;
  // Angle 0 across the picture and a quarter turn toward the camera, as the painted storm is laid out
  const place = (spot: StormSpot, lift = 0): Spot => {
    const across = Math.cos(spot.angle) * radius * spot.out;
    const toward = Math.sin(spot.angle) * radius * spot.out;

    return [
      floor[0] + ax * across - wx * toward,
      Math.max(lift, spot.up * radius),
      floor[2] + az * across - wz * toward,
    ];
  };
  const trace = (path: StormSpot[], lift = 0): Spot[] => {
    const spots: Spot[] = [];

    for (const spot of path) {
      spots.push(place(spot, lift));
    }
    return spots;
  };
  const { wave } = storm;

  kit.pool(floor, radius * 1.5, '#120422', 0.7 * strength, { add: 0 });
  kit.ripple(floor, radius * wave.out, 0.28 / wave.out, '#1e0834', 0.5 * wave.life * strength, {
    add: 0,
  });
  kit.ripple(floor, radius * wave.out, 0.12 / wave.out, '#be60ff', 0.6 * wave.life * strength);

  const ring = trace(storm.ring, 0.02);

  kit.ribbon(ring, radius * 0.12, '#1e0834', 0.5 * strength, 0, { add: 0 });
  kit.ribbon(ring, radius * 0.05, '#c878ff', (0.5 + 0.4 * storm.flash) * strength);
  // A violet mass, then a dark one a little lower, leaving the tops lit as the painted cloud is
  const rim = storm.flash > 0.5 ? '#c896ff' : '#5c2e96';

  for (const puff of storm.puffs) {
    kit.puff(place(puff), puff.size * radius, rim, 0.9 * strength);
  }
  for (const puff of storm.puffs) {
    const [px, py, pz] = place(puff);
    const size = puff.size * radius;

    kit.puff([px, py - size * 0.22, pz], size * 0.92, '#1a082e', 0.94 * strength);
  }
  for (const arc of storm.arcs) {
    const alpha = arc.life * strength;

    kit.glow(
      place(arc.path[Math.floor(arc.path.length / 2)]),
      radius * 0.8,
      '#b46eff',
      0.3 * alpha,
      0,
    );
    for (const path of [arc.path, arc.fork]) {
      const thin = path === arc.fork ? 0.6 : 1;
      const spots = trace(path);

      kit.ribbon(spots, radius * 0.24 * thin, '#aa50ff', 0.45 * alpha);
      kit.ribbon(spots, radius * 0.08 * thin, '#f5e1ff', alpha);
    }
  }
}

/** The light a purified pokemon stands in. `radius` is its ground shadow's */
export function litPurifiedAura(
  kit: EffectBatch,
  floor: Spot,
  radius: number,
  elapsed: number,
  seed: number,
  strength: number,
): void {
  // Judged behind the body, as the painted aura is drawn under it: only what reaches past its outline shows
  kit.near(-radius * 1.5);
  const ring = radius * 1.15;

  kit.pool(floor, radius * 1.5, '#ffecaa', 0.55 * strength);
  for (let index = 0; index < PILLARS; index += 1) {
    const angle = ((index + 0.5) / PILLARS) * TAU;
    const breath = 0.5 + 0.5 * Math.sin((elapsed / BREATH) * TAU + index * 1.9 + seed);
    const out = radius * 1.2;
    const base: Spot = [floor[0] + Math.cos(angle) * out, 0.02, floor[2] + Math.sin(angle) * out];
    const tall = radius * (1.7 + sideways(kit, angle)) * (0.8 + 0.2 * breath);
    const wide = radius * (0.14 + 0.06 * breath) * 2;
    const middle: Spot = [base[0], tall * 0.6, base[2]];
    const top: Spot = [base[0], tall, base[2]];

    // An amber edge under the light, so a light page still sees it
    kit.ribbon([base, middle], wide * 1.5, '#be7c18', (0.45 + 0.2 * breath) * 0.5 * strength, 0, {
      add: 0,
    });
    kit.ribbon([base, middle], wide, '#ffe282', (0.45 + 0.35 * breath) * strength);
    kit.ribbon([middle, top], wide * 0.6, '#fff4c8', (0.2 + 0.2 * breath) * strength);
  }
  kit.ripple(floor, ring, 0.22, '#b07014', 0.55 * strength, { add: 0 });
  kit.ripple(floor, ring, 0.12, '#ffd66e', 0.9 * strength);

  const orbit = (elapsed / ORBIT + seed * 0.37) * TAU;

  for (const start of [orbit, orbit + Math.PI]) {
    const path: Spot[] = [];

    for (let step = 0; step <= 6; step += 1) {
      const angle = start + (step / 6) * 0.9;

      path.push([floor[0] + Math.cos(angle) * ring, 0.05, floor[2] + Math.sin(angle) * ring]);
    }
    kit.ribbon(path, radius * 0.18, '#fffce8', 0.95 * strength);
  }
  for (let index = 0; index < STARS; index += 1) {
    const phase = (elapsed / STAR_RISE + drift(seed, index, 2)) % 1;
    const angle = drift(seed, index, 3) * TAU;
    const twinkle = 0.65 + 0.35 * Math.sin(elapsed / 110 + index * 2.1);
    const life = lifeOf(phase) * twinkle * strength;
    const size = radius * (0.26 + drift(seed, index, 1) * 0.14) * (1 - phase * 0.3);
    const spot = aside(
      kit,
      [
        floor[0] + Math.cos(angle) * radius * 1.3,
        phase * radius * RISE,
        floor[2] + Math.sin(angle) * radius * 1.3,
      ],
      Math.sin(phase * TAU + index) * radius * 0.2,
    );

    kit.glow(spot, size * 1.4, '#fff0b4', 0.55 * life, 0.3);
    kit.star(spot, size * 1.2, 0, '#a86810', 0.8 * life, { add: 0 });
    kit.star(spot, size, 0, '#fffae2', life);
  }
}

/**
 * A shiny's arrival: rays and a ring burst out of its middle, then glints
 * light over its body. `width` and `height` are the sprite's, and past
 * `SPARKLE_LIFE` nothing is drawn
 */
export function litSparkle(
  kit: EffectBatch,
  floor: Spot,
  width: number,
  height: number,
  age: number,
  seed: number,
): void {
  if (age < 0 || age > SPARKLE_LIFE) {
    return;
  }
  const middle = aside(kit, floor, 0, -SPARKLE_MIDDLE * height);

  if (age < SPARKLE_BURST) {
    const share = age / SPARKLE_BURST;
    const out = 1 - (1 - share) ** 3;
    const fade = 1 - share;
    const thick = width * 0.04 * fade;

    for (let ray = 0; ray < SPARKLE_RAYS; ray += 1) {
      // Off the axes, so the burst never reads as a crosshair
      const angle = ((ray + 0.5) / SPARKLE_RAYS) * TAU;
      const reach = width * SPARKLE_RAY_REACH * (ray % 2 === 0 ? 1 : 0.6);
      const from = reach * (0.3 + 0.45 * out);
      const to = reach * (0.45 + 0.55 * out);
      const streak = [
        aside(kit, middle, Math.cos(angle) * from, Math.sin(angle) * from),
        aside(kit, middle, Math.cos(angle) * to, Math.sin(angle) * to),
      ];

      kit.ribbon(streak, thick * 2.2, SPARKLE_EDGE, 0.6 * fade, 0, { add: 0 });
      kit.ribbon(streak, thick, ray % 2 === 0 ? SPARKLE_COLORS.core : SPARKLE_COLORS.fill, fade);
    }
    const ring = width * SPARKLE_RING_REACH * out;

    kit.ring(middle, ring, 0.08, SPARKLE_EDGE, 0.6 * fade, { add: 0 });
    kit.ring(middle, ring, 0.04, SPARKLE_COLORS.fill, fade);
  }
  for (let star = 0; star < SPARKLE_STARS; star += 1) {
    const { x, y, delay } = sparkleStar(seed, star, SPARKLE_SPREAD);
    const lived = (age - delay) / SPARKLE_STAR_LIFE;

    if (lived < 0 || lived > 1) {
      continue;
    }
    const swell = Math.sin(lived * Math.PI);
    const size = swell * width * SPARKLE_STAR_SIZE;
    const spin = (lived - 0.5) * 0.7 * (star % 2 === 0 ? 1 : -1);
    const spot = aside(kit, floor, x * width, (-y + lived * SPARKLE_RISE) * height);

    kit.star(spot, size * 1.2, spin, SPARKLE_EDGE, 0.6 * swell, { add: 0 });
    kit.star(spot, size, spin, SPARKLE_TINTS[star % SPARKLE_TINTS.length], swell);
    kit.star(spot, size * 0.55, spin + Math.PI / 4, SPARKLE_COLORS.core, swell);
  }
}
