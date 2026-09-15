import { Types } from '../../../../data/constants/types';
import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { aside, floorOf, thrown, toward } from './shapes';

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

/** A blow's element breaking off where it lands: flames, frost or sparks, and plain sparks for any other type */
export function imbue(
  kit: EffectBatch,
  at: Spot,
  reach: number,
  share: number,
  seed: number,
  type: Types,
  colour: string,
  count: number,
): void {
  const fade = decay(share);

  if (type === Types.Fire) {
    const hot = mix(colour, '#ffd84a', 0.6);

    kit.pool(floorOf(at), reach * 1.4, colour, swell(share) * 0.5);
    for (let lick = 0; lick < count; lick += 1) {
      const rise = (share * 1.8 + noise(seed, lick)) % 1;
      const angle = noise(seed, lick + 5) * TAU;
      const round = reach * 0.6 * (1 - rise * 0.5);

      kit.glow(
        aside(
          kit,
          at,
          Math.cos(angle) * round,
          -reach * 0.2 + rise * reach * 1.4,
          Math.sin(angle) * round * 0.6,
        ),
        reach * 0.3 * (1 - rise * 0.6),
        rise < 0.4 ? hot : colour,
        swell(rise) * fade,
        rise < 0.4 ? 0.5 : 0.1,
      );
    }
    return;
  }
  if (type === Types.Ice) {
    const ice = lighten(colour, 0.45);

    kit.glow(at, reach * (0.6 + share * 0.6), ice, swell(share) * 0.35, 0, { add: 0.3 });
    for (let piece = 0; piece < count; piece += 1) {
      kit.shard(
        thrown(at, seed, piece, share, reach * 1.4, reach * 0.8),
        reach * 0.16 * (0.7 + noise(seed, piece + 60) * 0.6),
        noise(seed, piece) * TAU + share * 4,
        ice,
        fade,
        { add: 0.25 },
      );
    }
    for (let glint = 0; glint < 3; glint += 1) {
      kit.star(
        aside(kit, at, spread(seed, glint + 71) * reach, spread(seed, glint + 72) * reach),
        reach * 0.22,
        0,
        '#ffffff',
        swell((share * 2 + noise(seed, glint + 70)) % 1) * fade,
      );
    }
    return;
  }
  if (type === Types.Electric) {
    const flick = Math.floor(share * 16);
    const bright = fade * (flick % 3 === 2 ? 0.5 : 1);

    kit.pool(floorOf(at), reach * 1.4, colour, bright * 0.4);
    for (let arc = 0; arc < 3; arc += 1) {
      const angle = noise(seed + flick, arc) * TAU;

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * reach * 1.3, Math.sin(angle) * reach * 1.3),
        seed + flick * 7 + arc,
        reach * 0.5,
        reach * 0.06,
        colour,
        bright,
      );
    }
    return;
  }
  sparks(kit, at, reach, count, seed, share, lighten(colour, 0.5), fade);
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
