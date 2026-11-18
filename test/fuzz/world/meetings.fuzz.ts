import { getRoamArea, positionAt } from '../../../src/overworld/spawn-life/roam';
import fc from 'fast-check';
import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../../src/data';
import { SPAWN_BAND_KEYS } from '../../../src/data/biome';
import { getBaseFormSpecies } from '../../../src/data/ids/forms';
import ChunkSnapshot from '../../../src/overworld/chunk-snapshot';
import type { LiveSpawn } from '../../../src/overworld/spawn-life';
import { checkMeeting, liveSpawns } from '../../../src/overworld/spawn-life/lifetimes';
import { getSpawnLevels } from '../../../src/overworld/encounter';
import stageEncounter from '../../../src/overworld/encounter/stage';
import createOverworld from '../../../src/overworld/setup';
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

function readSnapshot(seed: string, place: CellInput, clock: ClockInput): ChunkSnapshot {
  const chunk = readWorld(seed, place.depth).getChunk(place.chunkX, place.chunkY);

  return new ChunkSnapshot(chunk, toLocalTime(clock.now, clock.zone), clock.zone);
}

/** The pokemon standing in the chunk at the clock, each with the snapshot its meeting is staged in */
function readStanding(
  seed: string,
  place: CellInput,
  clock: ClockInput,
): [live: LiveSpawn, staged: ChunkSnapshot][] {
  const { chunk } = readSnapshot(seed, place, clock);
  const local = toLocalTime(clock.now, clock.zone);
  const standing: [LiveSpawn, ChunkSnapshot][] = [];

  for (const live of liveSpawns(chunk, clock.zone, local)) {
    standing.push([live, new ChunkSnapshot(chunk, live.cycle.start, clock.zone)]);
  }
  return standing;
}

describe('spawns on the ground', () => {
  it('stand on the cell they were placed on, out of that cell’s own pool', () => {
    fc.assert(
      fc.property(seedArbitrary, cellArbitrary, clockArbitrary, (seed, place, clock) => {
        const local = toLocalTime(clock.now, clock.zone);

        for (const [live, staged] of readStanding(seed, place, clock)) {
          // The server derives the same pokemon on the same cell, and a
          // wrong individual value or a cell far away is refused
          const stands = positionAt(getRoamArea(staged.chunk, clock.zone, live), live, local).cell;
          const met = checkMeeting(staged.chunk, clock.zone, live.id, live.spawn[1], stands, local);

          expect(met?.id).toBe(live.id);
          expect(
            checkMeeting(staged.chunk, clock.zone, live.id, live.spawn[1] ^ 1, stands, local),
          ).toBeNull();

          // A street rolls the town's pool, which the snapshot keeps to itself
          if (staged.chunk.isTownCell(live.home)) {
            continue;
          }

          // The pool names the species before its shore, wings, coat or rare shape
          const pool = staged.getCellPool(live.home);
          const kinds = new Set<number>();

          for (const band of SPAWN_BAND_KEYS) {
            for (const entry of pool[band] ?? []) {
              kinds.add(getBaseFormSpecies(entry.species));
            }
          }
          expect(kinds, `cell ${live.home} of ${staged.key}`).toContain(
            getBaseFormSpecies(live.spawn[0]),
          );
        }
      }),
      parameters,
    );
  });

  it('are met in the country of the cell they stand on', () => {
    fc.assert(
      fc.property(
        seedArbitrary,
        cellArbitrary,
        clockArbitrary,
        playerArbitrary,
        (seed, place, clock, uid) => {
          for (const [live, staged] of readStanding(seed, place, clock)) {
            expect(
              stageEncounter(uid, staged, live.id, live.spawn, null, { cell: live.home }).biome,
            ).toBe(staged.biomeAt(live.home));
          }
        },
      ),
      parameters,
    );
  });

  it('are written down inside the bounds the tables check', () => {
    let checked = 0;

    fc.assert(
      fc.property(
        seedArbitrary,
        cellArbitrary,
        clockArbitrary,
        playerArbitrary,
        buddyArbitrary,
        (seed, place, clock, uid, buddy) => {
          const broken: string[] = [];

          for (const [live, staged] of readStanding(seed, place, clock)) {
            checked += 1;
            broken.push(
              ...checkEncounterRow(
                stageEncounter(uid, staged, live.id, live.spawn, buddy, { cell: live.home }),
              ),
            );
          }
          expect(broken).toEqual([]);
        },
      ),
      parameters,
    );
    // The chunks drawn put something on the ground to check
    expect(checked).toBeGreaterThan(0);
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
          const met = stageEncounter(uid, snapshot, id, [kind, individual, trait], buddy, {
            cell: null,
          });

          expect(checkEncounterRow(met)).toEqual([]);
        },
      ),
      parameters,
    );
  });
});

/** Every kind of lair a chunk can stage, with what each is holding this window */
function readLairs(snapshot: ChunkSnapshot): [RaidKind, number, number, number][] {
  const lairs: [RaidKind, number, number, number][] = [];
  const kinds: [RaidKind, () => Map<number, { species: number; traitValue: number }>][] = [
    [RaidKind.Legendary, () => snapshot.getLegendaryLairs()],
    [RaidKind.Shadow, () => snapshot.getShadowLairs()],
    [RaidKind.Totem, () => snapshot.getTotems()],
    [RaidKind.Max, () => snapshot.getMaxRaids()],
    [RaidKind.Alpha, () => snapshot.getAlphaRaids()],
    [RaidKind.Tera, () => snapshot.getTeraRaids()],
  ];

  for (const [kind, read] of kinds) {
    for (const [cell, roll] of read()) {
      lairs.push([kind, cell, roll.species, roll.traitValue]);
    }
  }
  return lairs;
}

describe('raid prizes', () => {
  it('are written down inside the bounds the tables check', () => {
    let checked = 0;

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

          for (const [kind, cell, species, traitValue] of readLairs(snapshot)) {
            const lobby = `${snapshot.key}:${kind}:${traitValue}`;
            // A prize reads only the boss and its roll off the raid
            const raid = asRaidRecord({ kind, species, traitValue });
            const [id, spawn] = deriveRaidReward(raid, lobby, uid);
            const prize = stageEncounter(uid, snapshot, id, spawn, buddy, {
              cell,
              type: RAID_ENCOUNTER_TYPES[kind],
              shadow: kind === RaidKind.Shadow,
              level: RAID_REWARD_LEVELS[kind],
              shinyBoost: RAID_SHINY_BOOST,
            });

            checked += 1;
            broken.push(...checkEncounterRow(prize));
          }
          expect(broken).toEqual([]);
        },
      ),
      parameters,
    );
    // Lairs are rare, but the chunks drawn hold some
    expect(checked).toBeGreaterThan(0);
  });
});

describe('raid prizes met at a lair', () => {
  it('are met in the country of the lair', () => {
    fc.assert(
      fc.property(
        seedArbitrary,
        cellArbitrary,
        clockArbitrary,
        playerArbitrary,
        (seed, place, clock, uid) => {
          const snapshot = readSnapshot(seed, place, clock);

          for (const [kind, cell, species, traitValue] of readLairs(snapshot)) {
            const raid = asRaidRecord({ kind, species, traitValue });
            const [id, spawn] = deriveRaidReward(
              raid,
              `${snapshot.key}:${kind}:${traitValue}`,
              uid,
            );
            const prize = stageEncounter(uid, snapshot, id, spawn, null, { cell });

            expect(prize.biome).toBe(snapshot.biomeAt(cell));
          }
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
      level: fc.oneof(fc.integer({ min: 1, max: 100 }), fc.integer({ min: -5, max: 120 })),
      shiny: fc.boolean(),
      shadow: fc.boolean(),
      ivs: fc.option(fc.integer({ min: -1, max: 2 ** 31 })),
      // Mostly inside the column, sometimes just past it
      slots: fc.oneof(fc.integer({ min: 0, max: 511 }), fc.integer({ min: 512, max: 600 })),
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
