import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { lighten, noise, spread } from '../__paint';
import { aside, thrown, toward } from './shapes';

/**
 * Pieces more than one scene picture is built from: sparks, debris,
 * smoke, bolts, and the few drawn things (a bone, a chevron, a spiral,
 * a dome) that several moves share.
 */

export const TAU = Math.PI * 2;

/** Sparks flying out of a spot across the picture. */
export function sparks(
  kit: EffectBatch,
  at: Spot,
  reach: number,
  count: number,
  seed: number,
  share: number,
  colour: string,
  alpha: number,
): void {
  for (let spark = 0; spark < count; spark += 1) {
    const angle = (spark / count) * TAU + noise(seed, spark + 7) * 0.5;
    const out = reach * (0.25 + share * (0.8 + noise(seed, spark + 17) * 0.5));

    kit.streak(
      aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
      reach * 0.22 * (1 - share * 0.5),
      reach * 0.05,
      angle,
      colour,
      alpha,
    );
  }
}

/** Broken pieces thrown out of a spot and falling back to the floor. */
export function debris(
  kit: EffectBatch,
  at: Spot,
  reach: number,
  count: number,
  seed: number,
  share: number,
  colour: string,
  alpha: number,
): void {
  for (let piece = 0; piece < count; piece += 1) {
    kit.shard(
      thrown(at, seed, piece, share, reach * 2, reach * 1.2),
      reach * 0.14 * (0.7 + noise(seed, piece + 60) * 0.6),
      noise(seed, piece) * TAU + share * 5,
      colour,
      alpha,
    );
  }
}

/** Soft clouds rising off a spot, painted rather than lit. */
export function smoke(
  kit: EffectBatch,
  at: Spot,
  reach: number,
  count: number,
  seed: number,
  share: number,
  colour: string,
  alpha: number,
): void {
  for (let puff = 0; puff < count; puff += 1) {
    const spot = aside(
      kit,
      at,
      spread(seed, puff + 30) * reach * 0.8,
      reach * share * (0.6 + noise(seed, puff + 50) * 0.6),
      spread(seed, puff + 70) * reach * 0.3,
    );

    kit.glow(spot, reach * (0.45 + share * 0.7), colour, alpha, 0, { add: 0 });
  }
}

/** A jagged bolt between two spots, redrawn on a new seed to flicker. */
export function bolt(
  kit: EffectBatch,
  from: Spot,
  to: Spot,
  seed: number,
  reach: number,
  width: number,
  colour: string,
  alpha: number,
): void {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const wander = Math.max(reach * 0.25, length * 0.07);
  const path: Spot[] = [];

  for (let step = 0; step <= 10; step += 1) {
    const along = step / 10;
    // Loose in the middle and pinned at both ends
    const loose = Math.sin(Math.PI * along) * wander;

    path.push(
      aside(
        kit,
        toward(from, to, along),
        spread(seed, step) * loose,
        spread(seed, step + 20) * loose,
      ),
    );
  }
  kit.ribbon(path, width * 4, colour, alpha * 0.25);
  kit.ribbon(path, width, lighten(colour, 0.5), alpha);

  const fork = path[3 + Math.floor(noise(seed, 40) * 5)];
  const tip = aside(kit, fork, spread(seed, 41) * wander * 1.6, spread(seed, 42) * wander * 1.6);
  const bend = aside(kit, toward(fork, tip, 0.5), spread(seed, 43) * wander * 0.4);

  kit.ribbon([fork, bend, tip], width * 0.5, lighten(colour, 0.5), alpha * 0.8);
}

/** A bone tumbling: a shaft across the picture with a knob at each end. */
export function bone(
  kit: EffectBatch,
  at: Spot,
  length: number,
  angle: number,
  colour: string,
  alpha: number,
  width: number,
): void {
  const one = aside(kit, at, (Math.cos(angle) * length) / 2, (Math.sin(angle) * length) / 2);
  const other = aside(kit, at, (-Math.cos(angle) * length) / 2, (-Math.sin(angle) * length) / 2);

  kit.ribbon([one, other], width, colour, alpha, 0, { add: 0 });
  for (const end of [one, other]) {
    kit.glow(end, width * 1.4, lighten(colour, 0.5), alpha, 0.3, { add: 0.2 });
  }
}

/** A chevron on the picture, pointing up for `way` 1 and down for -1. */
export function chevron(
  kit: EffectBatch,
  at: Spot,
  size: number,
  way: 1 | -1,
  colour: string,
  alpha: number,
  width: number,
): void {
  kit.ribbon(
    [
      aside(kit, at, -size * 0.5, -size * 0.3 * way),
      at,
      aside(kit, at, size * 0.5, -size * 0.3 * way),
    ],
    width,
    colour,
    alpha,
  );
}

/** A spiral winding in on the picture, turned on by `share`. */
export function spiral(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  turns: number,
  share: number,
  colour: string,
  alpha: number,
  width: number,
): void {
  const path: Spot[] = [];

  for (let step = 0; step <= 40; step += 1) {
    const along = step / 40;
    const angle = along * TAU * turns + share * TAU;
    const reach = radius * (1 - along * 0.92);

    path.push(aside(kit, at, Math.cos(angle) * reach, Math.sin(angle) * reach * 0.6));
  }
  kit.ribbon(path, width, colour, alpha);
}

/** Rings laid round a spot at rising heights and arcs over the top: a dome the pokemon stands in. */
export function dome(
  kit: EffectBatch,
  floor: Spot,
  radius: number,
  colour: string,
  alpha: number,
): void {
  for (let band = 0; band < 4; band += 1) {
    const lat = (band / 4) * (Math.PI / 2);

    kit.ripple(
      [floor[0], Math.sin(lat) * radius, floor[2]],
      Math.cos(lat) * radius,
      0.06,
      colour,
      alpha * (1 - band * 0.15),
    );
  }
  for (let meridian = 0; meridian < 3; meridian += 1) {
    const turn = (meridian / 3) * Math.PI;
    const path: Spot[] = [];

    for (let step = 0; step <= 10; step += 1) {
      const lat = (step / 10) * Math.PI;

      path.push([
        floor[0] + Math.cos(lat) * Math.cos(turn) * radius,
        Math.sin(lat) * radius,
        floor[2] + Math.cos(lat) * Math.sin(turn) * radius,
      ]);
    }
    kit.ribbon(path, radius * 0.04, colour, alpha * 0.5);
  }
}

/** Where a spot a share of the way along a line is, lifted into an arc. */
export function arcing(from: Spot, to: Spot, share: number, height: number): Spot {
  const at = toward(from, to, share);

  return [at[0], at[1] + Math.sin(Math.PI * share) * height, at[2]];
}

/** Motes drawn in to a spot from every side, for a charge gathering. */
export function gathering(
  kit: EffectBatch,
  at: Spot,
  reach: number,
  count: number,
  seed: number,
  share: number,
  colour: string,
): void {
  for (let mote = 0; mote < count; mote += 1) {
    const held = (share * 1.6 + noise(seed, mote)) % 1;
    const angle = noise(seed, mote + 30) * TAU;
    const rise = (noise(seed, mote + 60) - 0.5) * Math.PI * 0.8;
    const out = (distance: number): Spot => [
      at[0] + Math.cos(angle) * Math.cos(rise) * distance,
      at[1] + Math.sin(rise) * distance,
      at[2] + Math.sin(angle) * Math.cos(rise) * distance,
    ];

    kit.trail(
      out(reach * (1.25 - held)),
      out(reach * (1 - held)),
      reach * 0.035,
      colour,
      (1 - held) * 0.9,
    );
  }
}
