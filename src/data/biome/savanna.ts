import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Savanna spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerSavannaSpawns(): void {
  registerSpawnPool(Biome.Savanna, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.NidoranF, weight: 20 },
        { species: Species.NidoranM, weight: 20 },
        { species: Species.Growlithe, weight: 10 },
        { species: Species.Doduo, weight: 20 },
        { species: Species.Natu, weight: 20 },
        { species: Species.Sunkern, weight: 25 },
      ],
      uncommon: [
        { species: Species.Nidorina, weight: 5 },
        { species: Species.Nidorino, weight: 5 },
      ],
      rare: [
        { species: Species.Nidoqueen, weight: 5 },
        { species: Species.Nidoking, weight: 5 },
        { species: Species.Arcanine, weight: 5 },
        { species: Species.Dodrio, weight: 10 },
        { species: Species.Kangaskhan, weight: 5 },
        { species: Species.Tauros, weight: 10 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Ekans, weight: 20 },
        { species: Species.NidoranF, weight: 20 },
        { species: Species.NidoranM, weight: 20 },
        { species: Species.Growlithe, weight: 10 },
        { species: Species.Doduo, weight: 20 },
        { species: Species.Rhyhorn, weight: 20 },
        { species: Species.Natu, weight: 20 },
        { species: Species.Sunkern, weight: 25 },
      ],
      uncommon: [
        { species: Species.Nidorina, weight: 5 },
        { species: Species.Nidorino, weight: 5 },
      ],
      rare: [
        { species: Species.Arbok, weight: 10 },
        { species: Species.Nidoqueen, weight: 5 },
        { species: Species.Nidoking, weight: 5 },
        { species: Species.Arcanine, weight: 5 },
        { species: Species.Dodrio, weight: 10 },
        { species: Species.Rhydon, weight: 10 },
        { species: Species.Kangaskhan, weight: 5 },
        { species: Species.Tauros, weight: 10 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Ekans, weight: 20 },
        { species: Species.NidoranF, weight: 20 },
        { species: Species.NidoranM, weight: 20 },
      ],
      uncommon: [
        { species: Species.Nidorina, weight: 5 },
        { species: Species.Nidorino, weight: 5 },
      ],
      rare: [
        { species: Species.Arbok, weight: 10 },
        { species: Species.Nidoqueen, weight: 5 },
        { species: Species.Nidoking, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Ekans, weight: 20 },
        { species: Species.NidoranF, weight: 20 },
        { species: Species.NidoranM, weight: 20 },
      ],
      uncommon: [
        { species: Species.Nidorina, weight: 5 },
        { species: Species.Nidorino, weight: 5 },
      ],
      rare: [
        { species: Species.Arbok, weight: 10 },
        { species: Species.Nidoqueen, weight: 5 },
        { species: Species.Nidoking, weight: 5 },
      ],
      special: [],
    },
  });
}
