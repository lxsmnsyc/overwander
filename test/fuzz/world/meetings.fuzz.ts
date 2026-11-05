import fc from 'fast-check';
import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../../src/data';
import { SPAWN_BAND_KEYS } from '../../../src/data/biome';
import { getBaseFormSpecies } from '../../../src/data/ids/forms';
import { LURE_SPAWN_BONUS } from '../../../src/overworld/abilities/__create';
import ChunkSnapshot, { SPAWN_COUNT } from '../../../src/overworld/chunk-snapshot';
import { getSpawnLevels } from '../../../src/overworld/encounter';
import stageEncounter from '../../../src/overworld/encounter/stage';
import createOverworld from '../../../src/overworld/setup';
import { CHUNK_CELLS } from '../../../src/overworld/grid';
import { spawnId } from '../../../src/model/snapshot-record';
import { toLocalTime } from '../../../src/model/local-time';
import { RaidKind, asRaidRecord, deriveRaidReward } from '../../../src/model/raid-record';
import {
  RAID_ENCOUNTER_TYPES,
  RAID_REWARD_LEVELS,
  RAID_SHINY_BOOST,
} from '../../../src/server/raids/spoils';
import { type StaffGift, makeGiftOffer } from '../../../src/server/gifts';
import { STAFF_GIFT } from '../../../src/server/validate';
import { GiftKind } from '../../../src/model/gift-record';
import { getRegisteredSpecies } from '../../../src/data/species';
import { Balls } from '../../../src/data/ids/items';
import * as v from 'valibot';
import getWorld from '../../../src/overworld/current';
import { readFuzzParameters } from '../arbitraries';
import {
  type CellInput,
  type ClockInput,
  buddyArbitrary,
  cellArbitrary,
  clockArbitrary,
  playerArbitrary,
  readWorld,
  seedArbitrary,
} from './arbitraries';
import { LEVEL_BOUNDS, checkEncounterRow } from './bounds';

/**
 * What a chunk puts on the ground, held to the two things that read
 * it back: the cell a player presses and the row the meeting is
 * written to. Each run builds a whole chunk, so these run under
 * `pnpm fuzz`
 */
beforeAll(() => {
  registerGameData();
});

const parameters = readFuzzParameters();

/** As many spawns as a window publishes, a lure's included */
const PUBLISHED = SPAWN_COUNT + LURE_SPAWN_BONUS;

function readSnapshot(seed: string, place: CellInput, clock: ClockInput): ChunkSnapshot {
  const chunk = readWorld(seed, place.depth).getChunk(place.chunkX, place.chunkY);

  return new ChunkSnapshot(chunk, toLocalTime(clock.now, clock.zone), clock.zone);
}

describe('spawns on the ground', () => {
  it('stand on the cell they were placed on, out of that cell’s own pool', () => {
    fc.assert(
      fc.property(seedArbitrary, cellArbitrary, clockArbitrary, (seed, place, clock) => {
        const snapshot = readSnapshot(seed, place, clock);
        const spawns = snapshot.getSpawns(PUBLISHED);
        const cells = snapshot.getSpawnCells();

        // Every spawn is on exactly one cell, in roll order
        expect([...cells.values()]).toEqual(spawns);

        for (const [cell, spawn] of cells) {
          expect(snapshot.getSpawnAt(cell % CHUNK_CELLS, Math.floor(cell / CHUNK_CELLS))).toBe(
            spawn,
          );

          // A street rolls the town's pool, which the snapshot keeps to itself
          if (snapshot.chunk.isTownCell(cell)) {
            continue;
          }

          // The pool names the species before its shore, wings, coat or rare shape
          const pool = snapshot.getCellPool(cell);
          const kinds = new Set<number>();

          for (const band of SPAWN_BAND_KEYS) {
            for (const entry of pool[band] ?? []) {
              kinds.add(getBaseFormSpecies(entry.species));
            }
          }
          expect(kinds, `cell ${cell} of ${snapshot.key}`).toContain(getBaseFormSpecies(spawn[0]));
        }
      }),
      parameters,
    );
  });

  // Fails today: a meeting records the chunk's middle, not the cell's
  // country, which 55f99f410 fixed for the pools and not for the row.
  // The `meetings-cell-biome` node fixes it at every caller and turns
  // this back into `it`
  it.fails('are met in the country of the cell they stand on', () => {
    fc.assert(
      fc.property(
        seedArbitrary,
        cellArbitrary,
        clockArbitrary,
        playerArbitrary,
        (seed, place, clock, uid) => {
          const snapshot = readSnapshot(seed, place, clock);
          const spawns = snapshot.getSpawns(PUBLISHED);
          const cells = [...snapshot.getSpawnCells().keys()];

          for (const [index, spawn] of spawns.entries()) {
            const id = spawnId(snapshot.key, snapshot.timestamp, index);
            const met = stageEncounter(uid, snapshot, id, spawn, null);

            expect(met.biome, id).toBe(snapshot.biomeAt(cells[index]));
          }
        },
      ),
      parameters,
    );
  });

  it('are written down inside the bounds the tables check', () => {
    fc.assert(
      fc.property(
        seedArbitrary,
        cellArbitrary,
        clockArbitrary,
        playerArbitrary,
        buddyArbitrary,
        (seed, place, clock, uid, buddy) => {
          const snapshot = readSnapshot(seed, place, clock);
          const broken: string[] = [];

          for (const [index, spawn] of snapshot.getSpawns(PUBLISHED).entries()) {
            const id = spawnId(snapshot.key, snapshot.timestamp, index);

            broken.push(...checkEncounterRow(stageEncounter(uid, snapshot, id, spawn, buddy)));
          }
          expect(broken).toEqual([]);
        },
      ),
      parameters,
    );
  });
});

/**
 * Any species at all, met wild beside any buddy. A chunk's own rolls
 * reach a legendary too rarely to find the top of its band, and the
 * top of the band is where a fierce buddy pushed one to level 103
 */
describe('wild meetings of any species', () => {
  it('roll inside the level bounds the tables check, whatever the buddy lifts', () => {
    const species = getRegisteredSpecies();

    fc.assert(
      fc.property(playerArbitrary, buddyArbitrary, (uid, buddy) => {
        const overworld = createOverworld(uid, buddy);
        const broken: string[] = [];

        // Every band at once: the top of a legendary's is the one a lift breaks
        for (const kind of species) {
          const [lowest, highest] = overworld.checkEncounterLevels(`${kind}`, getSpawnLevels(kind));

          if (lowest < LEVEL_BOUNDS[0] || highest > LEVEL_BOUNDS[1] || lowest > highest) {
            broken.push(`species ${kind}: ${lowest} to ${highest}`);
          }
        }
        expect(broken).toEqual([]);
      }),
      parameters,
    );
  });

  it('are written down inside the bounds the tables check', () => {
    const species = getRegisteredSpecies();

    fc.assert(
      fc.property(
        fc.constantFrom(...species),
        fc.integer(),
        fc.integer(),
        cellArbitrary,
        clockArbitrary,
        playerArbitrary,
        buddyArbitrary,
        (kind, individual, trait, place, clock, uid, buddy) => {
          const snapshot = readSnapshot(getWorld().seed, place, clock);
          const id = spawnId(snapshot.key, snapshot.timestamp, 0);
          const met = stageEncounter(uid, snapshot, id, [kind, individual, trait], buddy);

          expect(checkEncounterRow(met)).toEqual([]);
        },
      ),
      parameters,
    );
  });
});

/** Every kind of lair a chunk can stage, with what each is holding this window */
function readLairs(snapshot: ChunkSnapshot): [RaidKind, number, number][] {
  const lairs: [RaidKind, number, number][] = [];
  const kinds: [RaidKind, () => Map<number, { species: number; traitValue: number }>][] = [
    [RaidKind.Legendary, () => snapshot.getLegendaryLairs()],
    [RaidKind.Shadow, () => snapshot.getShadowLairs()],
    [RaidKind.Totem, () => snapshot.getTotems()],
    [RaidKind.Max, () => snapshot.getMaxRaids()],
    [RaidKind.Alpha, () => snapshot.getAlphaRaids()],
    [RaidKind.Tera, () => snapshot.getTeraRaids()],
  ];

  for (const [kind, read] of kinds) {
    for (const roll of read().values()) {
      lairs.push([kind, roll.species, roll.traitValue]);
    }
  }
  return lairs;
}

describe('raid prizes', () => {
  it('are written down inside the bounds the tables check', () => {
    fc.assert(
      fc.property(
        seedArbitrary,
        cellArbitrary,
        clockArbitrary,
        playerArbitrary,
        buddyArbitrary,
        (seed, place, clock, uid, buddy) => {
          const snapshot = readSnapshot(seed, place, clock);
          const broken: string[] = [];

          for (const [kind, species, traitValue] of readLairs(snapshot)) {
            const lobby = `${snapshot.key}:${kind}:${traitValue}`;
            // A prize reads only the boss and its roll off the raid
            const raid = asRaidRecord({ kind, species, traitValue });
            const [id, spawn] = deriveRaidReward(raid, lobby, uid);
            const prize = stageEncounter(uid, snapshot, id, spawn, buddy, {
              type: RAID_ENCOUNTER_TYPES[kind],
              shadow: kind === RaidKind.Shadow,
              level: RAID_REWARD_LEVELS[kind],
              shinyBoost: RAID_SHINY_BOOST,
            });

            broken.push(...checkEncounterRow(prize));
          }
          expect(broken).toEqual([]);
        },
      ),
      parameters,
    );
  });
});

/** A pokemon gift as the staff might write one, whether or not the schema lets it through */
function giftArbitrary(): fc.Arbitrary<StaffGift> {
  const species = getRegisteredSpecies();

  return fc
    .record({
      catch: fc.boolean(),
      player: fc.option(playerArbitrary),
      species: fc.constantFrom(...species),
      level: fc.integer({ min: -5, max: 120 }),
      shiny: fc.boolean(),
      shadow: fc.boolean(),
      ivs: fc.option(fc.integer({ min: -1, max: 2 ** 31 })),
      slots: fc.integer({ min: 0, max: 4096 }),
    })
    .map((drawn): StaffGift => {
      const pokemon = {
        reason: 'fuzz',
        player: drawn.player,
        expiresAt: null,
        species: drawn.species,
        level: drawn.level,
        shiny: drawn.shiny,
        shadow: drawn.shadow,
        gender: null,
        nature: null,
        ivs: drawn.ivs,
        abilities: [],
        moves: [],
        items: [],
        place: '',
        slots: drawn.slots,
      };

      return drawn.catch
        ? { ...pokemon, kind: GiftKind.Catch, ball: Balls.PokeBall, owner: '' }
        : { ...pokemon, kind: GiftKind.Encounter };
    });
}

describe('gifts', () => {
  it('are written down inside the bounds the tables check, whatever the staff schema admits', () => {
    fc.assert(
      fc.property(giftArbitrary(), fc.nat(), (spec, now) => {
        // Only what the server function would have let through
        fc.pre(v.is(STAFF_GIFT, spec));

        const offer = makeGiftOffer(spec, `gift-${now}`, now);

        expect(offer.encounter == null ? [] : checkEncounterRow(offer.encounter)).toEqual([]);
      }),
      parameters,
    );
  });
});
