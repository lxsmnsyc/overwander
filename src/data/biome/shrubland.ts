import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Shrubland spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerShrublandSpawns(): void {
  registerSpawnPool(Biome.Shrubland, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Mareep, weight: 25 },
        { species: Species.Hoppip, weight: 25 },
        { species: Species.Shinx, weight: 25 },
      ],
      uncommon: [
        { species: Species.Spoink, weight: 20 },
        { species: Species.Spearow, weight: 20 },
        { species: Species.Natu, weight: 20 },
        { species: Species.Sunkern, weight: 25 },
        { species: Species.Snubbull, weight: 20 },
        { species: Species.Skitty, weight: 25 },
        { species: Species.Roselia, weight: 20 },
        { species: Species.Glameow, weight: 25 },
      ],
      rare: [
        { species: Species.Flaaffy, weight: 5 },
        { species: Species.Skiploom, weight: 5 },
        { species: Species.Luxio, weight: 5 },
      ],
      scarce: [
        { species: Species.Grumpig, weight: 6 },
        { species: Species.Fearow, weight: 10 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Delcatty, weight: 10 },
        { species: Species.Xatu, weight: 5 },
        { species: Species.Sunflora, weight: 5 },
        { species: Species.Granbull, weight: 5 },
        { species: Species.Purugly, weight: 8 },
        { species: Species.Roserade, weight: 6 },
      ],
      elusive: [
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Miltank, weight: 5 },
        { species: Species.Ampharos, weight: 5 },
        { species: Species.Jumpluff, weight: 5 },
        { species: Species.Luxray, weight: 4 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Budew, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Mareep, weight: 25 },
        { species: Species.Hoppip, weight: 25 },
        { species: Species.Shinx, weight: 25 },
      ],
      uncommon: [
        { species: Species.Spoink, weight: 20 },
        { species: Species.Spearow, weight: 20 },
        { species: Species.Natu, weight: 20 },
        { species: Species.Sunkern, weight: 25 },
        { species: Species.Snubbull, weight: 20 },
        { species: Species.Skitty, weight: 25 },
        { species: Species.Roselia, weight: 20 },
        { species: Species.Glameow, weight: 25 },
      ],
      rare: [
        { species: Species.Flaaffy, weight: 5 },
        { species: Species.Skiploom, weight: 5 },
        { species: Species.Luxio, weight: 5 },
      ],
      scarce: [
        { species: Species.Grumpig, weight: 6 },
        { species: Species.Fearow, weight: 10 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Delcatty, weight: 10 },
        { species: Species.Xatu, weight: 5 },
        { species: Species.Sunflora, weight: 5 },
        { species: Species.Granbull, weight: 5 },
        { species: Species.Purugly, weight: 8 },
        { species: Species.Roserade, weight: 6 },
      ],
      elusive: [
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Miltank, weight: 5 },
        { species: Species.Ampharos, weight: 5 },
        { species: Species.Jumpluff, weight: 5 },
        { species: Species.Luxray, weight: 4 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Budew, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Seedot, weight: 20 },
        { species: Species.Shinx, weight: 25 },
      ],
      uncommon: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Houndour, weight: 20 },
        { species: Species.Poochyena, weight: 20 },
        { species: Species.Roselia, weight: 20 },
        { species: Species.Glameow, weight: 25 },
        { species: Species.Stunky, weight: 22 },
        { species: Species.Skorupi, weight: 20 },
      ],
      rare: [
        { species: Species.Nuzleaf, weight: 10 },
        { species: Species.Luxio, weight: 5 },
      ],
      scarce: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Mightyena, weight: 10 },
        { species: Species.Houndoom, weight: 5 },
        { species: Species.Purugly, weight: 8 },
        { species: Species.Skuntank, weight: 8 },
        { species: Species.Drapion, weight: 6 },
        { species: Species.Roserade, weight: 6 },
      ],
      elusive: [
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Shiftry, weight: 5 },
        { species: Species.Luxray, weight: 4 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Budew, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Seedot, weight: 20 },
        { species: Species.Shinx, weight: 25 },
      ],
      uncommon: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Houndour, weight: 20 },
        { species: Species.Poochyena, weight: 20 },
        { species: Species.Roselia, weight: 20 },
        { species: Species.Glameow, weight: 25 },
        { species: Species.Stunky, weight: 22 },
        { species: Species.Skorupi, weight: 20 },
      ],
      rare: [
        { species: Species.Nuzleaf, weight: 10 },
        { species: Species.Luxio, weight: 5 },
      ],
      scarce: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Mightyena, weight: 10 },
        { species: Species.Houndoom, weight: 5 },
        { species: Species.Purugly, weight: 8 },
        { species: Species.Skuntank, weight: 8 },
        { species: Species.Drapion, weight: 6 },
        { species: Species.Roserade, weight: 6 },
      ],
      elusive: [
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Shiftry, weight: 5 },
        { species: Species.Luxray, weight: 4 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Budew, weight: PRIZED_WEIGHT }],
      special: [],
    },
  });
}
