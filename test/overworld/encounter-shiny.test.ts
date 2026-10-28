import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import { Species } from '../../src/data/ids/species';
import Weather from '../../src/data/overworld/weather';
import ChunkSnapshot from '../../src/overworld/chunk-snapshot';
import deriveEncounter, { EncounterType, deriveShiny } from '../../src/overworld/encounter';
import World from '../../src/overworld/world';

const SPECIES = [Species.Pikachu, Species.Eevee, Species.Garchomp, Species.Magikarp];

describe('deriveShiny', () => {
  beforeAll(() => {
    registerGameData();
  });

  it('answers what the whole meeting answers, under any sky, boost or kind', () => {
    const snapshot = new ChunkSnapshot(new World('overworld').getChunk(0, 0), 0);
    const seen = new Set<boolean>();

    for (const species of SPECIES) {
      for (let traitValue = 0; traitValue < 400; traitValue++) {
        for (const weather of [undefined, Weather.Clear, Weather.MeteorShower]) {
          for (const shinyBoost of [1, 512]) {
            for (const type of [EncounterType.Wild, EncounterType.TotemRaid]) {
              const options = { type, weather, shinyBoost };
              const shiny = deriveShiny(species, traitValue, snapshot.timestamp, 'player-uid', options);

              expect(shiny).toBe(
                deriveEncounter(snapshot, [species, 1, traitValue], 'player-uid', options).shiny,
              );
              seen.add(shiny);
            }
          }
        }
      }
    }

    // Both answers turned up, so the comparison was not of two constants
    expect(seen).toEqual(new Set([true, false]));
  });
});
