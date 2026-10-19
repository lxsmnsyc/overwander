import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { noise } from '../__paint';
import { type Draw, type EffectShape, REACH } from '../effect/shapes';

/**
 * The kit the scene versions of a move landing are built with. Sizes
 * are the painted versions' own, turned into field units by the stage,
 * so the two stay the same size as each other.
 */

export type LitShapePainter = (
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  draw: Draw,
) => void;

/** How hard each shape shakes the scene at ordinary weight, in drawing pixels */
export const JOLTS: Partial<Record<EffectShape, number>> = {
  Blast: 3,
  Quake: 4,
  Chasm: 3.5,
  Rocks: 2,
  Spout: 2.5,
  Slam: 2.5,
  Strike: 1.5,
  Drum: 1.5,
  Rush: 2.5,
  Torrent: 1.5,
  Stall: 2,
  Rend: 3,
  Overload: 3,
  Jetstream: 2.5,
  Resolute: 2.5,
  Verdict: 1.5,
  Pyre: 1.5,
  Upheaval: 3.5,
  Ambush: 2.5,
  Lustre: 2,
  Starfall: 2.5,
  Grip: 2,
  Surge: 3,
  Cannon: 3,
  Meteors: 3.5,
  Rampage: 2.5,
  Rift: 2.5,
  Freeze: 1.5,
  Shears: 3,
  Auger: 3.5,
  Blaster: 3,
  Crash: 3.5,
  Haymaker: 3,
  Flurry: 2,
  Aura: 2,
  Kicks: 1,
  Roar: 1.5,
  Sweep: 1,
  Crescent: 1.5,
  Sickles: 1,
  Cutter: 1,
  Nail: 1,
  Flex: 1,
  Converge: 2,
  Orbit: 1.5,
  Gambit: 3,
  Techno: 2,
  Victory: 3.5,
  Azure: 2,
  Thunderclap: 3,
  Fusion: 3,
  Frostbolt: 2,
  Frostfire: 2,
  Glaze: 1,
  Searing: 2,
  Smite: 2.5,
  Smash: 1.5,
  Tonnage: 4,
  Pledge: 2,
  Aerial: 1,
  Plummet: 3,
  Roller: 2.5,
  Turnabout: 2,
  Ram: 3,
  Blaze: 1.5,
  Spatter: 1.5,
  Arrows: 3,
  Groundswell: 3.5,
  Precipice: 3.5,
  Ascent: 3.5,
  Fury: 2,
  Portal: 1.5,
  Diamonds: 1.5,
  Ruin: 3,
  Origin: 3,
  Lunar: 2,
  Steam: 2,
  Behemoth: 3,
  Singlestrike: 3,
  Maxcannon: 2.5,
  Thunderkick: 2,
  Bulwark: 3.5,
  Dynamax: 2.5,
  Lance: 3,
  Astral: 2,
  MaxFlare: 3,
  MaxGeyser: 3,
  MaxHailstorm: 3,
  MaxRockfall: 3,
  MaxLightning: 3,
  MaxOvergrowth: 3,
  MaxMindstorm: 3,
  MaxStarfall: 3,
  MaxStrike: 3,
  MaxFlutterby: 3,
  MaxPhantasm: 3,
  MaxWyrmwind: 3,
  MaxDarkness: 3,
  MaxKnuckle: 3,
  MaxSteelspike: 3,
  MaxOoze: 3,
  MaxQuake: 3,
  MaxAirstream: 3,
  GMaxVineLash: 2,
  GMaxWildfire: 2.5,
  GMaxCannonade: 2.5,
  GMaxVoltCrash: 3.5,
  GMaxChiStrike: 3,
  GMaxCuddle: 3,
  GMaxReplenish: 3.5,
  GMaxMeltdown: 3,
  GMaxDrumSolo: 2.5,
  GMaxFireball: 3,
  GMaxHydrosnipe: 2,
  GMaxWindRage: 2,
  GMaxGravitas: 3,
  GMaxStonesurge: 2,
  GMaxVolcalith: 3.5,
  GMaxSandblast: 2,
  GMaxCentiferno: 2,
  GMaxSmite: 2.5,
  GMaxSteelsurge: 2,
  GMaxOneBlow: 4,
  GMaxRapidFlow: 2.5,
  Splinters: 3,
  PetalStorm: 1.5,
  Wildfire: 2,
  ChargedBlast: 3.5,
  Iceberg: 3.5,
  Collision: 3,
  Calamity: 2,
  Cudgel: 2.5,
  Starstorm: 2,
  Lumina: 2,
  Order: 2.5,
  Jetfist: 2,
  Burnout: 1.5,
  Glaive: 3,
  Salt: 1.5,
  Divers: 2,
  Spinner: 2,
  Kowtow: 3,
  Bouquet: 1.5,
  Torch: 1.5,
  Bull: 3,
  Coins: 1,
  Hyperdrill: 3,
  Twin: 1.5,
  Ragefist: 2.5,
  Armor: 2.5,
  Bitter: 1.5,
  Doubleshock: 2.5,
  Gigaton: 4,
  Bloodmoon: 2,
  Matcha: 1,
  Syrup: 1.5,
  Electroshot: 3,
  Fickle: 2.5,
  Clap: 3,
  Cleave: 3,
  Tachyon: 1,
  Psyblade: 1.5,
  Steamjet: 1.5,
  Blazing: 2.5,
  Wicked: 2.5,
  Noxious: 2,
  Combat: 3,
  Magical: 2,
  Eggbarrage: 1.5,
  Boneclub: 2.5,
  Volt: 3.5,
  Attackorder: 2,
  Grind: 2.5,
  Wrathland: 3,
  Icehammer: 3,
  Revelation: 1.5,
  Trop: 2,
  Beak: 3,
  Scales: 2,
  Trap: 3,
  Fleur: 3,
  Bone: 2.5,
  Accelerock: 1.5,
  Thief: 2,
  Multi: 2.5,
  Plasma: 2.5,
  Ironbash: 3,
  Snipe: 1.5,
  Jawlock: 2,
  Drumming: 2.5,
  Pyroball: 2.5,
  Direclaw: 2,
  Psyshield: 2.5,
  Stoneaxe: 3,
  Mountaingale: 3,
  Barbs: 1.5,
  Esper: 1.5,
  Malice: 1.5,
  Triplearrows: 2,
  Parade: 1.5,
  Ceaseless: 2.5,
  Chloroblast: 3,
  Flyingpress: 3,
  Respects: 2,
  Aurawheel: 2.5,
  Amped: 2.5,
  Acid: 1.5,
  Gravapple: 3.5,
  Spiritbreak: 3,
  Surrender: 2.5,
  Assault: 3.5,
  Sidearm: 2.5,
  Spell: 1.5,
};

/** Where the effect is happening: the first body it landed on. */
export function landed(stage: LitStage): Spot {
  return stage.targets[0] ?? stage.source;
}

/** The painted `REACH` in field units, scaled by weight. */
export function reachOf(stage: LitStage, weight = 1): number {
  return REACH * stage.size * weight;
}

/** The ground under a spot. */
export function floorOf(spot: Spot): Spot {
  return [spot[0], 0, spot[2]];
}

/** The spot in the middle of everything given. */
export function middleOf(spots: Spot[]): Spot {
  const sum: Spot = [0, 0, 0];

  for (const spot of spots) {
    sum[0] += spot[0];
    sum[1] += spot[1];
    sum[2] += spot[2];
  }
  return [sum[0] / spots.length, sum[1] / spots.length, sum[2] / spots.length];
}

/** A point some share of the way from one spot to another. */
export function toward(from: Spot, to: Spot, share: number): Spot {
  return [
    from[0] + (to[0] - from[0]) * share,
    from[1] + (to[1] - from[1]) * share,
    from[2] + (to[2] - from[2]) * share,
  ];
}

/** A spot moved across the picture, up, and away from the camera. */
export function aside(kit: EffectBatch, spot: Spot, right: number, up = 0, away = 0): Spot {
  const [ax, az] = kit.across;
  const [bx, bz] = kit.away;

  return [spot[0] + ax * right + bx * away, spot[1] + up, spot[2] + az * right + bz * away];
}

/**
 * Where a piece thrown out of a spot is: out along the ground in a
 * seeded direction, up, and back down to the floor by the end
 */
export function thrown(
  from: Spot,
  seed: number,
  index: number,
  share: number,
  out: number,
  up: number,
): Spot {
  const angle = noise(seed, index) * Math.PI * 2;
  const distance = out * (0.35 + noise(seed, index + 40) * 0.65) * (1 - (1 - share) ** 2);
  const lift = up * (0.5 + noise(seed, index + 80) * 0.5);

  return [
    from[0] + Math.cos(angle) * distance,
    Math.max(0, from[1] + lift * 4 * share * (1 - share) - from[1] * share * share),
    from[2] + Math.sin(angle) * distance,
  ];
}

export { late } from '../__paint';

/** How far through its own part something staggered is, from 0 to 1. */
export function staged(share: number, rate: number, delay: number): number {
  return Math.max(0, Math.min(1, share * rate - delay));
}
