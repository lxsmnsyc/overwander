import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns, {
  BIOME_NAMES,
  SpawnRarity,
  getBiomeRoster,
  getSpawnRarity,
  isGrownSpecies,
} from '../../../src/data/biome';
import Biome, {
  SpawnSurface,
  TimeOfDay,
  getTimeOfDay,
  growsHoneyTrees,
} from '../../../src/data/ids/biome';
import { APRICORNS, ItemTypes, Items } from '../../../src/data/ids/items';
import registerItems, { getItemData } from '../../../src/data/items';
import { isValuable } from '../../../src/data/items/valuables';
import {
  ITEM_BAND_ODDS,
  MAX_KINDS,
  MAX_STACK,
  PHENOMENON_BAND_ODDS,
  getItemBand,
  getItemOdds,
} from '../../../src/data/overworld/item-pool';
import EggGroups from '../../../src/data/ids/egg-groups';
import { Species } from '../../../src/data/ids/species';
import { getBaseSpecies, getSpeciesData, registerSpecies } from '../../../src/data/species';
import { seatId } from '../../../src/auth/gym-seat-record';
import { CHUNK_CELLS, worldCell } from '../../../src/overworld/chunk';
import nameTown from '../../../src/data/overworld/town-names';
import type { Town } from '../../../src/overworld/town';
import {
  TOWN_REGION,
  getTownLots,
  townAt,
  townName,
  townOfRegion,
  townOverChunk,
} from '../../../src/overworld/town';
import ChunkSnapshot, {
  LANDMARK_INTERVAL,
  NEST_INTERVAL,
  NPC_INTERVAL,
  RAID_INTERVAL,
  SNAPSHOT_INTERVAL,
} from '../../../src/overworld/chunk-snapshot';
import pickStartPosition from '../../../src/overworld/start';
import deriveEncounter from '../../../src/overworld/encounter';
import { encounterKey, encounterWindow } from '../../../src/overworld/safari';
import { FOSSIL_OFFER_KINDS, getFossilPrice } from '../../../src/data/overworld/fossil';
import { isFossil } from '../../../src/data/items/fossils';
import Landmark from '../../../src/data/overworld/landmark';
import { getPortalCell, portalInRegion } from '../../../src/overworld/portal';
import Npc, { NPCS, npcSheet, npcSheets } from '../../../src/data/overworld/npc';
import Phenomenon, {
  getPhenomenonGroups,
  getPhenomenonItems,
} from '../../../src/data/overworld/phenomenon';
import {
  VENDOR_STAPLES,
  VENDOR_STOCK_KINDS,
  type VendorKind,
  getChefGoods,
  getVendorGoods,
  isMarketable,
} from '../../../src/data/overworld/vendor';
import {
  MAX_BERRY_PICK,
  MIN_BERRY_PICK,
  resolveApricornColour,
  resolveApricornTree,
  resolveBerryPatch,
  resolveNest,
  resolvePhenomenon,
} from '../../../src/overworld/landmarks';
import World, {
  WORLD_MAX,
  WORLD_MIN,
  WORLD_SIZE,
  clampToWorld,
  isInWorld,
} from '../../../src/overworld/world';
import findChunk from './helpers';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

/**
 * The first region whose town, or lack of one, is what a test is
 * after. Swept the way `findChunk` sweeps, since a town is sited to
 * every eighth chunk and most of the world is water
 */
function findRegion(
  world: World,
  matches: (town: Town | null) => boolean,
): [regionX: number, regionY: number] | null {
  for (let regionY = -24; regionY < 24; regionY++) {
    for (let regionX = -24; regionX < 24; regionX++) {
      if (matches(townOfRegion(world, regionX, regionY))) {
        return [regionX, regionY];
      }
    }
  }
  return null;
}

describe('world', () => {
  it('bounds the world at 4096 chunks a side', () => {
    const world = new World('overworld');

    expect(WORLD_MAX - WORLD_MIN + 1).toBe(WORLD_SIZE);
    expect(isInWorld(WORLD_MIN, WORLD_MAX)).toBe(true);
    expect(isInWorld(WORLD_MIN - 1, 0)).toBe(false);
    expect(isInWorld(0, WORLD_MAX + 1)).toBe(false);

    // Past the edge there is no new ground: the outermost chunk is
    // what a coordinate beyond it resolves to
    expect(clampToWorld(WORLD_MAX + 500)).toBe(WORLD_MAX);
    expect(world.getChunk(WORLD_MIN - 7, 0).seed).toBe(world.getChunk(WORLD_MIN, 0).seed);

    // A player always starts inside it
    for (const uid of ['player-uid', 'other-uid', 'third-uid']) {
      const start = pickStartPosition(world, uid);

      expect(isInWorld(start.chunkX, start.chunkY)).toBe(true);
    }
  });

  it('ripens berry patches on the landmark window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.BerryPatch),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const WINDOW = LANDMARK_INTERVAL;
    const patches = new ChunkSnapshot(chunk, 0).getBerryPatches();

    // Every pick sits on a patch cell, is a berry, and is a handful
    // of one rather than a single berry
    expect(patches.size).toBeGreaterThan(0);
    for (const [cell, picked] of patches) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.BerryPatch);
      expect(getItemData(picked.item).type).toBe(ItemTypes.Berry);
      expect(picked.amount).toBeGreaterThanOrEqual(MIN_BERRY_PICK);
      expect(picked.amount).toBeLessThanOrEqual(MAX_BERRY_PICK);
    }

    // The same window agrees for every observer, and a bush keeps
    // its fruit for the whole quarter hour
    expect(new ChunkSnapshot(chunk, 60 * 1000).getBerryPatches()).toEqual(patches);
    expect(new ChunkSnapshot(chunk, LANDMARK_INTERVAL - 1).getBerryPatches()).toEqual(patches);

    // Expired windows grow something new
    const shapes = new Set<string>();

    for (let window = 0; window <= 10; window++) {
      shapes.add(JSON.stringify([...new ChunkSnapshot(chunk, window * WINDOW).getBerryPatches()]));
    }
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('holds one egg species in a nest for the whole half day', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.Nest),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const nests = snapshot.getNests();
    const pool = getBiomeRoster(chunk.biome, getTimeOfDay(0));
    const ordinary = new Set(
      [...pool.base, ...pool.uncommon, ...pool.rare].map((entry) => getBaseSpecies(entry.species)),
    );

    expect(nests.size).toBeGreaterThan(0);
    for (const [cell, species] of nests) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.Nest);
      // What is lying there hatches, so it is the first stage of its
      // line — and it is one of the biome's own
      expect(getSpeciesData(species).evolvesFrom).toBeUndefined();
      expect(ordinary.has(species)).toBe(true);
      // A nest never holds a legendary or a mythical
      expect(getSpawnRarity(species)).not.toBe(SpawnRarity.Special);
    }

    // A nest outlives every other landmark in the chunk: the spawns
    // around it turn over half a day and it holds the same egg
    expect(snapshot.nestTimestamp).toBe(0);
    expect(new ChunkSnapshot(chunk, NEST_INTERVAL - 1).getNests()).toEqual(nests);
    expect(new ChunkSnapshot(chunk, NEST_INTERVAL - 1).nestTimestamp).toBe(0);
    expect(new ChunkSnapshot(chunk, NEST_INTERVAL).nestTimestamp).toBe(NEST_INTERVAL);
  });

  it('gives everything in a chunk a window of its own', () => {
    // What a window is worth is how long it is: the pokemon a player
    // walks past turn over fastest, the ground they dig up slower,
    // and the things worth making a trip for slowest of all
    expect(SNAPSHOT_INTERVAL).toBe(5 * 60 * 1000);
    expect(LANDMARK_INTERVAL).toBe(15 * 60 * 1000);
    expect(RAID_INTERVAL).toBe(3 * 60 * 60 * 1000);
    expect(NPC_INTERVAL).toBe(3 * 60 * 60 * 1000);
    expect(NEST_INTERVAL).toBe(12 * 60 * 60 * 1000);

    // Every window is a whole number of spawn windows, so no landmark
    // ever turns over halfway through the one a player is standing in
    for (const interval of [LANDMARK_INTERVAL, RAID_INTERVAL, NPC_INTERVAL, NEST_INTERVAL]) {
      expect(interval % SNAPSHOT_INTERVAL).toBe(0);
      expect(interval).toBeGreaterThanOrEqual(SNAPSHOT_INTERVAL);
    }

    // And each is read off the same snapshot, floored to its own
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), NPC_INTERVAL + LANDMARK_INTERVAL);

    expect(snapshot.landmarkTimestamp).toBe(NPC_INTERVAL + LANDMARK_INTERVAL);
    expect(snapshot.raidTimestamp).toBe(RAID_INTERVAL);
    expect(snapshot.npcTimestamp).toBe(NPC_INTERVAL);
    expect(snapshot.nestTimestamp).toBe(0);
  });

  it('keeps the same person and the same visit through every spawn window', () => {
    // What a counter held open across a 5-minute boundary depends on:
    // the server derives who is standing there from its own clock
    // rather than from the published spawn window, and both have to
    // answer the same for as long as the passer-by stands there
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.WanderingNpc),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const opened = new ChunkSnapshot(chunk, NPC_INTERVAL);
    const cell = [...opened.getWanderingNpcs().keys()][0];

    for (let at = 0; at < NPC_INTERVAL; at += SNAPSHOT_INTERVAL) {
      const later = new ChunkSnapshot(chunk, NPC_INTERVAL + at);

      expect(later.getStandingNpc(cell)).toBe(opened.getStandingNpc(cell));
      expect(later.visitMarker('daycare', cell)).toBe(opened.visitMarker('daycare', cell));
    }

    // And the window after it is somebody else's business: a marker
    // from this one buys nothing there
    const next = new ChunkSnapshot(chunk, NPC_INTERVAL * 2);

    expect(next.visitMarker('daycare', cell)).not.toBe(opened.visitMarker('daycare', cell));
  });

  it('puts a different passer-by on a wandering cell each window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.WanderingNpc),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const wanderers = new ChunkSnapshot(chunk, 0).getWanderingNpcs();

    expect(wanderers.size).toBeGreaterThan(0);
    for (const [cell, npc] of wanderers) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.WanderingNpc);
      expect(new Set(NPCS).has(npc)).toBe(true);
    }

    // Whoever it is stands for the whole 3-hour window, and the
    // windows are not all the same person
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL - 1).getWanderingNpcs()).toEqual(wanderers);
    expect(new ChunkSnapshot(chunk, NPC_INTERVAL).npcTimestamp).toBe(NPC_INTERVAL);

    const shapes = new Set<string>();
    const met = new Set<Npc>();

    // Enough windows that all 10 roles have room to turn up on however
    // few wandering cells the chunk rolled
    for (let window = 0; window < 96; window++) {
      const standing = new ChunkSnapshot(chunk, window * NPC_INTERVAL).getWanderingNpcs();

      shapes.add(JSON.stringify([...standing]));
      for (const npc of standing.values()) {
        met.add(npc);
      }
    }
    expect(shapes.size).toBeGreaterThan(1);
    // Everyone who wanders turns up: the groomer is drawn from the
    // same pool as the two who came first
    expect(met.has(Npc.Groomer)).toBe(true);
    expect(met.has(Npc.MoveReminder)).toBe(true);
    // Neither of the two with a place of their own is among them: the
    // vendor keeps a stall and Nurse Joy keeps a centre
    expect(met.has(Npc.Vendor)).toBe(false);
    expect(met.has(Npc.NurseJoy)).toBe(false);
  });

  it('dresses each wanderer from their role’s own wardrobe', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.WanderingNpc),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const styles = new Map<Npc, Set<string>>();
    const seen = new Map<Npc, number>();

    for (let window = 0; window < 96; window++) {
      const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);
      const wanderers = snapshot.getWanderingNpcs();
      const coats = snapshot.getWandererCoats();

      // A coat for every wanderer, and for whoever stands at the
      // fighting landmarks besides
      expect(coats.size).toBeGreaterThanOrEqual(wanderers.size);
      for (const [cell, npc] of wanderers) {
        const coat = coats.get(cell);

        expect(coat).not.toBeUndefined();
        if (coat != null) {
          // Always one of the role's own styles
          expect(npcSheets(npc)).toContain(coat);
          styles.set(npc, (styles.get(npc) ?? new Set()).add(coat));
          seen.set(npc, (seen.get(npc) ?? 0) + 1);
        }
      }
      // The window's roll is everybody's roll
      expect(new ChunkSnapshot(chunk, window * NPC_INTERVAL).getWandererCoats()).toEqual(coats);
    }

    // A role both packs drew actually turns up in both styles — asked
    // only of a role met often enough that one style would be a fault
    // in the roll rather than a short visit
    for (const [npc, worn] of styles) {
      if (npcSheets(npc).length > 1 && (seen.get(npc) ?? 0) >= 6) {
        expect(worn.size, String(npc)).toBeGreaterThan(1);
      }
    }
  });

  it('fills a trader’s crate from the window he was drawn in', () => {
    const world = new World('overworld');
    // A chunk with both, so the stall and the wandering chef are
    // measured against each other in one place
    const chunk = findChunk(world, (candidate) => {
      const kinds = new Set(candidate.getLandmarkCells().values());

      return kinds.has(Landmark.WanderingNpc) && kinds.has(Landmark.Market);
    });

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const crates = new Set<string>();
    const counters = new Set<VendorKind>();
    let found = 0;
    let stalls = 0;

    for (let window = 0; window < 24; window++) {
      const at = window * NPC_INTERVAL;
      const snapshot = new ChunkSnapshot(chunk, at);
      // Everyone who could be selling: the window's wanderers, and
      // whoever the landmarks put on a cell for good
      const standing = new Map<number, Npc>();

      for (const cell of snapshot.getWanderingNpcs().keys()) {
        const npc = snapshot.getStandingNpc(cell);

        if (npc != null) {
          standing.set(cell, npc);
        }
      }
      for (const [cell, landmark] of chunk.getLandmarkCells()) {
        if (landmark === Landmark.Market) {
          expect(snapshot.getStandingNpc(cell)).toBe(Npc.Vendor);
          standing.set(cell, Npc.Vendor);
          stalls++;
        }
      }

      for (const [cell, npc] of standing) {
        const stock = snapshot.getVendorStock(cell);

        // Anybody else's cell holds no crate at all
        if (npc !== Npc.Vendor && npc !== Npc.Chef) {
          expect(stock).toEqual([]);
          expect(snapshot.getVendorKind(cell)).toBeNull();
          continue;
        }
        found++;
        crates.add(JSON.stringify(stock));

        // A dozen kinds, none of them twice, or the whole shelf where
        // that counter is carrying fewer than a dozen
        const kind = npc === Npc.Chef ? null : snapshot.getVendorKind(cell);
        const shelf = kind == null ? getChefGoods() : getVendorGoods(kind);

        expect(stock.length).toBe(Math.min(VENDOR_STOCK_KINDS, shelf.length));
        expect(new Set(stock).size).toBe(stock.length);

        if (npc === Npc.Chef) {
          // Everything on his counter came out of his own larder
          const larder = new Set(getChefGoods());

          expect(snapshot.getVendorKind(cell)).toBeNull();
          for (const item of stock) {
            expect(larder.has(item)).toBe(true);
          }
        } else {
          // A vendor's crate is his counter's shelf and nothing else
          expect(kind).not.toBeNull();
          if (kind == null) {
            continue;
          }
          counters.add(kind);

          const goods = new Set(getVendorGoods(kind));

          for (const item of stock) {
            expect(goods.has(item)).toBe(true);
          }
          // A counter with a staple always has it out: a ball stall
          // with no Poke Ball is one a player cannot plan a walk
          // around, and the specialist shelves are their own plan
          for (const staple of VENDOR_STAPLES[kind] ?? []) {
            expect(new Set(stock).has(staple)).toBe(true);
          }
        }
        // Priced goods only, which is what keeps the Master Ball out
        // of the crate without naming it
        for (const item of stock) {
          expect(isMarketable(item)).toBe(true);
          expect(getItemData(item).buy).toBeGreaterThan(0);
        }
        expect(new Set(stock).has(Items.MasterBall)).toBe(false);

        // Everybody who walks up to the same trader is shown the same
        // crate: it is derived, not stored
        expect(new ChunkSnapshot(chunk, at + 1).getVendorStock(cell)).toEqual(stock);
      }
    }

    expect(found).toBeGreaterThan(0);
    // The stall is there every window, which is the whole point of
    // moving him off the wandering roll. A chunk may keep more than
    // one, so the count is per window rather than exact
    expect(stalls).toBeGreaterThanOrEqual(24);
    // The crates are not all the same crate, and the vendor is not
    // always behind the same counter
    expect(crates.size).toBeGreaterThan(1);
    expect(counters.size).toBeGreaterThan(1);
  });

  it('keeps a vendor on every market stall, whatever the window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.Market),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const stalls = [...chunk.getLandmarkCells()]
      .filter(([, landmark]) => landmark === Landmark.Market)
      .map(([cell]) => cell);

    for (let window = 0; window < 24; window++) {
      const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

      for (const cell of stalls) {
        // He is never rolled away: the stall is the landmark, and only
        // which counter he set up turns over
        expect(snapshot.getStandingNpc(cell)).toBe(Npc.Vendor);
        expect(snapshot.getVendorKind(cell)).not.toBeNull();
        // And he is dressed, so the board draws a person rather than a
        // letter in a circle
        expect(snapshot.getWandererCoats().get(cell)).not.toBeUndefined();
      }
      // A wandering cell never stages him any more
      for (const npc of snapshot.getWanderingNpcs().values()) {
        expect(npc).not.toBe(Npc.Vendor);
      }
    }
  });

  it('keeps Nurse Joy at a centre in every town, whatever the window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.PokemonCenter),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const counters = [...chunk.getLandmarkCells()]
      .filter(([, landmark]) => landmark === Landmark.PokemonCenter)
      .map(([cell]) => cell);

    for (let window = 0; window < 24; window++) {
      const snapshot = new ChunkSnapshot(chunk, window * NPC_INTERVAL);

      for (const cell of counters) {
        // She is never rolled away: the counter is the landmark
        expect(snapshot.getStandingNpc(cell)).toBe(Npc.NurseJoy);
        expect(snapshot.getWandererCoats().get(cell)).toBe(npcSheet(Npc.NurseJoy));
      }
      // And a wandering cell never stages her any more
      for (const npc of snapshot.getWanderingNpcs().values()) {
        expect(npc).not.toBe(Npc.NurseJoy);
      }
    }
  });

  it('charters a centre in every town and none in the country', () => {
    const world = new World('overworld');
    let towns = 0;

    for (let regionY = -8; regionY < 8; regionY++) {
      for (let regionX = -8; regionX < 8; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }
        towns++;

        const lots = getTownLots(world, town).filter(
          (lot) => lot.landmark === Landmark.PokemonCenter,
        );

        // One, never two: a second counter is the same service twice
        expect(lots.length, `${town.x}, ${town.y}`).toBe(1);
      }
    }
    expect(towns).toBeGreaterThan(0);

    // Nothing out in the country stages one. A chunk that holds a
    // centre is a chunk a town reaches into
    for (let x = -20; x < 20; x++) {
      for (let y = -20; y < 20; y++) {
        const chunk = world.getChunk(x, y);
        const centres = [...chunk.getLandmarkCells()].filter(
          ([, landmark]) => landmark === Landmark.PokemonCenter,
        );

        if (centres.length > 0) {
          expect(townOverChunk(world, x, y)).not.toBeNull();
        }
      }
    }
  });

  it('names every town it grows, and never two of them the same', () => {
    const world = new World('overworld');
    const names = new Map<string, string>();

    // Not a sample of the odds: names are worked out from where a town
    // is, so two of them sharing one is not unlikely, it is impossible
    for (let regionY = -24; regionY < 24; regionY++) {
      for (let regionX = -24; regionX < 24; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }

        const name = townName(town);
        const where = `${regionX}, ${regionY}`;

        expect(name).toMatch(/^[A-Z].*, [A-Z][a-z]+$/);
        // Answered the same way every time, by anybody, with nothing
        // asked of a store
        expect(townName(town)).toBe(name);
        expect(names.get(name) ?? where, name).toBe(where);
        names.set(name, where);
      }
    }
    expect(names.size).toBeGreaterThan(500);
  });

  it('names a town for its own country and its own county', () => {
    const world = new World('overworld');
    const settled = findRegion(world, (town) => town != null);

    expect(settled).not.toBeNull();
    if (settled == null) {
      return;
    }

    const town = townOfRegion(world, settled[0], settled[1]);

    expect(town).not.toBeNull();
    if (town == null) {
      return;
    }

    // The same answer the data table gives for those coordinates: the
    // town carries nothing of its own into it but where it stands
    expect(townName(town)).toBe(nameTown(town.regionX, town.regionY, town.biome));

    // And a second world says the same thing, since there is nothing
    // remembered anywhere for it to differ about
    const other = new World('overworld');
    const same = townOfRegion(other, settled[0], settled[1]);

    expect(same).not.toBeNull();
    expect(same == null ? null : townName(same)).toBe(townName(town));
  });

  it('posts an auction board in a town, one to a chunk and reachable', () => {
    const world = new World('overworld');
    let boards = 0;
    let towns = 0;
    const span = TOWN_REGION * CHUNK_CELLS;

    for (let regionY = -3; regionY < 3; regionY++) {
      for (let regionX = -3; regionX < 3; regionX++) {
        // Sampled across the region, since a town sits wherever its
        // region's own roll put it
        for (let step = 0; step < span; step += 8) {
          if (townAt(world, regionX * span + step, regionY * span + step) != null) {
            towns++;
            break;
          }
        }
      }
    }

    for (let x = -40; x < 40; x++) {
      for (let y = -40; y < 40; y++) {
        const chunk = world.getChunk(x, y);
        const cells = [...chunk.getLandmarkCells()].filter(
          ([, landmark]) => landmark === Landmark.AuctionBoard,
        );

        boards += cells.length;
        // One board to a chunk: every board reads the same global
        // lots, so a second would be the same board twice
        expect(cells.length).toBeLessThanOrEqual(1);
      }
    }
    // Boards live in towns, and about half of a town's charters carry
    // one, so a stretch of country this size holds several
    expect(towns).toBeGreaterThan(0);
    expect(boards).toBeGreaterThan(3);
  });

  it('names a gym seat by its place and never by its window', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.GymSeat),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const cells = [...chunk.getLandmarkCells()]
      .filter(([, landmark]) => landmark === Landmark.GymSeat)
      .map(([cell]) => cell);

    expect(cells.length).toBe(1);

    const cell = cells[0];
    const id = seatId(chunk, cell);

    // The same cell answers the same id however long anybody waits:
    // a seat outlives windows, which is what makes it a place to come
    // back to rather than a thing to catch while it is there
    expect(seatId(chunk, cell)).toBe(id);
    expect(id).toContain(chunk.seed);
    // A different cell, and a different chunk, are different seats
    expect(seatId(chunk, cell + 1)).not.toBe(id);
    expect(seatId(world.getChunk(chunk.x + 1, chunk.y), cell)).not.toBe(id);
  });

  it('gives the fossil maniac two of the three, drawn with his window', () => {
    const world = new World('overworld');
    // Several of them rather than any: a chunk with one wanderer in it
    // draws the maniac a handful of times over forty-eight windows,
    // which is too few to say anything about what he varies
    const chunk = findChunk(
      world,
      (candidate) =>
        [...candidate.getLandmarkCells().values()].filter(
          (landmark) => landmark === Landmark.WanderingNpc,
        ).length >= 3,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const offers = new Set<string>();
    let found = 0;

    for (let window = 0; window < 48; window++) {
      const at = window * NPC_INTERVAL;
      const snapshot = new ChunkSnapshot(chunk, at);

      for (const [cell, npc] of snapshot.getWanderingNpcs()) {
        const offer = snapshot.getFossilOffer(cell);

        // Nobody else is carrying any
        if (npc !== Npc.FossilManiac) {
          expect(offer).toEqual([]);
          continue;
        }
        found++;
        offers.add(JSON.stringify(offer));

        // Two of the three, never the same one twice, and never all
        // of them: what he offers is a choice
        expect(offer.length).toBe(FOSSIL_OFFER_KINDS);
        expect(new Set(offer).size).toBe(offer.length);
        for (const item of offer) {
          expect(isFossil(item)).toBe(true);
          expect(getFossilPrice(item)).toBeGreaterThan(0);
        }

        // Everybody who reaches the same maniac is offered the same
        // two: it is derived, not stored
        expect(new ChunkSnapshot(chunk, at + 1).getFossilOffer(cell)).toEqual(offer);
      }
    }

    expect(found).toBeGreaterThan(0);
    // And he is not carrying the same pair every window
    expect(offers.size).toBeGreaterThan(1);
  });

  it('opens a portal onto the portal in the town named', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.Portal),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    // A portal stands on a cell of its own, and that cell is where a
    // traveller comes out
    const cell = getPortalCell(chunk);

    expect(cell).not.toBeNull();
    expect(chunk.getLandmarkCells().get(cell ?? -1)).toBe(Landmark.Portal);

    // A region with a town is a place somebody can name; one without
    // has a portal out in the country and nothing to call it
    const settled = findRegion(world, (town) => town != null);

    expect(settled).not.toBeNull();
    if (settled == null) {
      return;
    }

    const town = townOfRegion(world, settled[0], settled[1]);

    expect(town).not.toBeNull();
    if (town == null) {
      return;
    }

    const destination = portalInRegion(world, settled[0], settled[1]);

    expect(destination).not.toBeNull();
    if (destination == null) {
      return;
    }

    // It is a real portal, in the middle of the town it was named for
    expect(destination.name).toBe(townName(town));
    expect(destination.biome).toBe(town.biome);
    expect(getPortalCell(world.getChunk(destination.x, destination.y))).toBe(destination.cell);
    expect(worldCell(destination.x, destination.cell % CHUNK_CELLS)).toBe(town.x);
    expect(worldCell(destination.y, Math.floor(destination.cell / CHUNK_CELLS))).toBe(town.y);
  });

  it('has nowhere to come out in a region with no town', () => {
    const world = new World('overworld');
    const empty = findRegion(world, (town) => town == null);

    expect(empty).not.toBeNull();
    if (empty == null) {
      return;
    }
    expect(portalInRegion(world, empty[0], empty[1])).toBeNull();
  });

  it('reads the window back out of an encounter key', () => {
    const world = new World('overworld');
    const snapshot = new ChunkSnapshot(world.getChunk(3, 4), 12 * SNAPSHOT_INTERVAL);
    const encounter = deriveEncounter(snapshot, [Species.Pidgey, 0, 0]);
    const key = encounterKey(encounter);

    // The key carries which window staged the spawn, which is what
    // lets a fled list forget the ones that can never come back: a
    // window that has turned over has taken its spawns with it
    expect(encounterWindow(key)).toBe(12 * SNAPSHOT_INTERVAL);
    expect(encounterKey(encounter)).toBe(key);

    // A key from another window is a different key, and anything that
    // is not a key at all reads as long expired
    const later = new ChunkSnapshot(world.getChunk(3, 4), 13 * SNAPSHOT_INTERVAL);

    expect(encounterKey(deriveEncounter(later, [Species.Pidgey, 0, 0]))).not.toBe(key);
    expect(encounterWindow('nonsense')).toBe(0);
  });

  it('keeps specials out of nests however the roll falls', () => {
    // Both ends of the stream, on every biome that stages anything:
    // whatever a nest draws is reduced to the stage that hatches, and
    // the special tier is not in the draw at all
    for (const key of Object.keys(BIOME_NAMES)) {
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      const biome = Number(key) as Biome;

      for (const time of [TimeOfDay.Morning, TimeOfDay.Day, TimeOfDay.Evening, TimeOfDay.Night]) {
        for (const roll of [0, 0.5, 0.999999]) {
          const species = resolveNest(biome, time, () => roll);

          if (species == null) {
            continue;
          }
          expect(getSpawnRarity(species)).not.toBe(SpawnRarity.Special);
          expect(getSpeciesData(species).evolvesFrom).toBeUndefined();
        }
      }
    }
  });

  it('rolls the berry pool through its rarity bands', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;

    // Same bands as the spawn pool: the better the berry, the rarer.
    // The berries a fight turns on — the ones held against the moment
    // the holder is nearly out — are the special band
    expect(resolveBerryPatch(rolls([0, 0, 0]))?.item).toBe(Items.LiechiBerry);
    expect(resolveBerryPatch(rolls([0.01, 0, 0]))?.item).toBe(Items.LumBerry);
    expect(resolveBerryPatch(rolls([0.05, 0, 0]))?.item).toBe(Items.LeppaBerry);
    expect(resolveBerryPatch(rolls([0.5, 0, 0]))?.item).toBe(Items.CheriBerry);

    // A bush bears a handful: the third draw is how many, between
    // MIN_BERRY_PICK and MAX_BERRY_PICK inclusive
    expect(resolveBerryPatch(rolls([0.5, 0, 0]))).toEqual({
      item: Items.CheriBerry,
      amount: MIN_BERRY_PICK,
    });
    expect(resolveBerryPatch(rolls([0.5, 0, 0.999]))).toEqual({
      item: Items.CheriBerry,
      amount: MAX_BERRY_PICK,
    });
    expect(resolveBerryPatch(rolls([0.5, 0, 0.5]))?.amount).toBe(4);
  });

  it('stands apricorn trees on the ground, one colour to a tree', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.ApricornTree),
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const snapshot = new ChunkSnapshot(chunk, 0);
    const trees = snapshot.getApricornTrees();

    expect(trees.size).toBeGreaterThan(0);
    for (const [cell, crop] of trees) {
      expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.ApricornTree);
      expect(APRICORNS).toContain(crop.item);
      expect(crop.amount).toBeGreaterThanOrEqual(MIN_BERRY_PICK);
      expect(crop.amount).toBeLessThanOrEqual(MAX_BERRY_PICK);
      // The colour is the tree's own, and the same one the cell reads
      expect(snapshot.getApricornTree(cell)).toBe(crop.item);
    }

    // A tree keeps its colour through every window, since the tree
    // itself is what is drawn, and its crop turns over on the berry
    // clock
    const later = new ChunkSnapshot(chunk, LANDMARK_INTERVAL * 4);

    for (const [cell, crop] of trees) {
      expect(later.getApricornTrees().get(cell)?.item).toBe(crop.item);
    }
    expect(new ChunkSnapshot(chunk, LANDMARK_INTERVAL - 1).getApricornTrees()).toEqual(trees);

    // A cell that holds no tree bears nothing
    const elsewhere = [...chunk.getLandmarkCells()].find(
      ([, landmark]) => landmark !== Landmark.ApricornTree,
    );

    expect(snapshot.getApricornTree(elsewhere?.[0] ?? 0)).toBeNull();
  });

  it('grows honey trees in the forests and nowhere else', () => {
    const world = new World('overworld');
    const chunk = findChunk(world, (candidate) =>
      new Set(candidate.getLandmarkCells().values()).has(Landmark.HoneyTree),
    );

    expect(chunk).not.toBeNull();
    expect(growsHoneyTrees(chunk?.biome ?? Biome.Desert)).toBe(true);
    expect(growsHoneyTrees(Biome.Grassland)).toBe(false);
    expect(growsHoneyTrees(Biome.Taiga)).toBe(false);
  });

  it('bears one apricorn colour a tree, and a handful of it', () => {
    const draw = (value: number) => () => value;

    // No rarer colour to hunt: an apricorn is a ball nobody has
    // carved yet, and the seven balls are worth about the same as
    // each other, so every colour is equally likely
    expect(resolveApricornColour(draw(0))).toBe(APRICORNS[0]);
    expect(resolveApricornColour(draw(0.999))).toBe(APRICORNS[APRICORNS.length - 1]);

    // Two draws on two clocks: the colour is the tree's for good and
    // the crop is the window's, so a good season cannot repaint it
    expect(resolveApricornTree(draw(0), draw(0)).item).toBe(APRICORNS[0]);
    expect(resolveApricornTree(draw(0), draw(0.999)).item).toBe(APRICORNS[0]);
    expect(resolveApricornTree(draw(0), draw(0)).amount).toBe(MIN_BERRY_PICK);
    expect(resolveApricornTree(draw(0), draw(0.999)).amount).toBe(MAX_BERRY_PICK);
  });

  it('resolves a phenomenon into a meeting, a find or an egg', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;
    const grotto = Phenomenon.HiddenGrotto;

    // A grotto has no item side at all: the opening draw is the egg,
    // and everything past it is the pokemon it was hiding
    const egg = resolvePhenomenon(grotto, Biome.Grassland, TimeOfDay.Morning, rolls([0, 0]));

    expect(egg?.kind).toBe('egg');
    if (egg?.kind === 'egg') {
      // A nest's own rule: what hatches, not what it grows into
      expect(getSpeciesData(egg.species).evolvesFrom).toBeUndefined();
    }

    // The pokemon branch is 1/8 grown, the rest half-grown, and never
    // reaches the legendary tier
    const rare = resolvePhenomenon(grotto, Biome.Grassland, TimeOfDay.Morning, rolls([0.9, 0, 0]));
    const uncommon = resolvePhenomenon(
      grotto,
      Biome.Grassland,
      TimeOfDay.Morning,
      rolls([0.9, 0.5, 0]),
    );

    expect(rare?.kind).toBe('pokemon');
    if (rare?.kind === 'pokemon') {
      expect(isGrownSpecies(rare.species)).toBe(true);
    }
    expect(uncommon?.kind).toBe('pokemon');
    if (uncommon?.kind === 'pokemon') {
      expect(getSpawnRarity(uncommon.species)).toBe(SpawnRarity.Rare);
    }

    // The other three are half a meeting and half a find, and what
    // they leave behind is their own: dust turns up anything the
    // ground held, water only what it keeps, a shadow only wings
    // Each in a biome that hosts it: a ripple asks for water, and
    // grassland has none of it in either band
    for (const [phenomenon, biome] of [
      [Phenomenon.DustCloud, Biome.Grassland],
      [Phenomenon.RipplingWater, Biome.Swamp],
      [Phenomenon.FlyingShadow, Biome.Grassland],
    ] as const) {
      const found = resolvePhenomenon(phenomenon, biome, TimeOfDay.Morning, rolls([0, 0.5]));

      expect(found?.kind).toBe('item');
      if (found?.kind === 'item') {
        // A stash on a cache's terms
        expect(found.items.length).toBeGreaterThanOrEqual(1);
        expect(found.items.length).toBeLessThanOrEqual(MAX_KINDS);
        for (const { item, amount } of found.items) {
          expect(amount).toBeGreaterThanOrEqual(1);
          expect(amount).toBeLessThanOrEqual(MAX_STACK);
          expect(new Set(getPhenomenonItems(phenomenon)).has(item)).toBe(true);
        }
      }

      // Past the item draw it is a pokemon, the same two bands
      expect(
        resolvePhenomenon(phenomenon, biome, TimeOfDay.Morning, rolls([0.9, 0.5, 0]))?.kind,
      ).toBe('pokemon');
    }

    // A wing is the whole of what a shadow drops, and a ripple never
    // turns up a stone
    expect(new Set(getPhenomenonItems(Phenomenon.FlyingShadow)).has(Items.HealthWing)).toBe(true);
    expect(new Set(getPhenomenonItems(Phenomenon.RipplingWater)).has(Items.FireStone)).toBe(false);
    expect(new Set(getPhenomenonItems(Phenomenon.DustCloud)).has(Items.FireStone)).toBe(true);
    expect(getPhenomenonItems(Phenomenon.HiddenGrotto)).toEqual([]);
  });

  it('draws what a phenomenon leaves through its own bands', () => {
    // The pools used to be picked over uniformly, which set a relic
    // crown at 1 in 24 out of a ripple against 1 in 50,000 out of the
    // ground. Six hundred thousand gold and a two hundred gold shell
    // are not the same draw
    for (const phenomenon of [
      Phenomenon.DustCloud,
      Phenomenon.RipplingWater,
      Phenomenon.FlyingShadow,
    ]) {
      const groups = getPhenomenonGroups(phenomenon);
      const listed = getPhenomenonItems(phenomenon);
      const bands = ['uncommon', 'rare', 'prized'] as const;

      // Nothing is lost on the way into the bands, and nothing is
      // invented: the same items, sorted
      expect(new Set(bands.flatMap((band) => groups[band].map((entry) => entry.item)))).toEqual(
        new Set(listed),
      );
      // Neither base nor special has any width here, so anything left
      // in one would be an item the phenomenon could never leave
      expect(groups.base).toEqual([]);
      expect(groups.special).toEqual([]);

      for (const band of bands) {
        const entries = groups[band];

        // Peers stay flat inside a band, and the valuables in it keep
        // exactly the share their count gave them: the weights decide
        // **which** valuable, never how often one turns up at all
        expect(entries.reduce((sum, entry) => sum + entry.weight, 0)).toBeCloseTo(
          entries.length,
          6,
        );
        for (const entry of entries) {
          if (!isValuable(entry.item)) {
            expect(entry.weight, getItemData(entry.item).name).toBe(1);
          }
        }

        // And among the valuables it is the ground's own ladder that
        // orders them, so the two cannot drift apart
        const valuables = entries.filter((entry) => isValuable(entry.item));

        for (const one of valuables) {
          for (const other of valuables) {
            if (getItemOdds(one.item) > getItemOdds(other.item)) {
              expect(
                one.weight,
                `${getItemData(one.item).name} against ${getItemData(other.item).name}`,
              ).toBeGreaterThan(other.weight);
            }
          }
        }
      }
    }

    // A gem is in no band the ground knows, and neither is what a walk
    // turns up anyway: both are drawn on the floor
    const dust = getPhenomenonGroups(Phenomenon.DustCloud);
    const floor = new Set(dust.uncommon.map((entry) => entry.item));

    expect(floor.has(Items.NormalGem)).toBe(true);
    expect(floor.has(Items.TinyMushroom)).toBe(true);
    expect(getItemBand(Items.NormalGem)).toBeNull();
    expect(getItemBand(Items.TinyMushroom)).toBe('base');

    // The crown is a special on the ground and is drawn with the ruins
    // here, because a pool picked by type reaches no other special and
    // a band of one would hand it that band's whole width
    const ripple = getPhenomenonGroups(Phenomenon.RipplingWater);

    expect(getItemBand(Items.RelicCrown)).toBe('special');
    expect(ripple.prized.map((entry) => entry.item)).toContain(Items.RelicCrown);
    for (const item of [Items.RelicVase, Items.CometShard, Items.RelicBand, Items.RelicStatue]) {
      expect(ripple.prized.map((entry) => entry.item)).toContain(item);
    }
    // And it is still the rarest of the five it stands with
    const crown = ripple.prized.find((entry) => entry.item === Items.RelicCrown);

    for (const entry of ripple.prized) {
      if (entry.item !== Items.RelicCrown) {
        expect(entry.weight, getItemData(entry.item).name).toBeGreaterThan(crown?.weight ?? 0);
      }
    }

    // The bands themselves are the ground's, one step richer, and what
    // is left over is nothing: no base, no special
    expect(PHENOMENON_BAND_ODDS.rare).toBe(8 * ITEM_BAND_ODDS.rare);
    expect(PHENOMENON_BAND_ODDS.prized).toBe(8 * ITEM_BAND_ODDS.prized);
    expect(PHENOMENON_BAND_ODDS.special).toBe(0);
    expect(
      PHENOMENON_BAND_ODDS.prized + PHENOMENON_BAND_ODDS.rare + PHENOMENON_BAND_ODDS.uncommon,
    ).toBe(1);
  });

  it('startles what the phenomenon looks like', () => {
    const water = new Set([EggGroups.Water1, EggGroups.Water2, EggGroups.Water3]);
    // Skip the item half, then walk both bands with a spread of picks
    const draws = [];

    for (const rare of [0, 0.5]) {
      for (let pick = 0; pick < 8; pick++) {
        draws.push([0.9, rare, pick / 8]);
      }
    }

    for (const roll of draws) {
      const rolls = (values: number[]) => () => values.shift() ?? 0.999;
      // A shadow over grassland is always something that flies
      const shadowed = resolvePhenomenon(
        Phenomenon.FlyingShadow,
        Biome.Grassland,
        TimeOfDay.Morning,
        rolls([...roll]),
      );

      expect(shadowed?.kind).toBe('pokemon');
      if (shadowed?.kind === 'pokemon') {
        expect(getSpeciesData(shadowed.species).eggGroups).toContain(EggGroups.Flying);
      }

      // A ripple in a swamp is never the Farfetch'd wading beside it
      const rippled = resolvePhenomenon(
        Phenomenon.RipplingWater,
        Biome.Swamp,
        TimeOfDay.Morning,
        rolls([...roll]),
      );

      expect(rippled?.kind).toBe('pokemon');
      if (rippled?.kind === 'pokemon') {
        const groups = getSpeciesData(rippled.species).eggGroups;

        expect(groups.some((group) => water.has(group))).toBe(true);
      }
    }

    // A biome with nothing that fits hands over what the phenomenon
    // was carrying rather than a species of the wrong kind
    const landlocked = resolvePhenomenon(
      Phenomenon.RipplingWater,
      Biome.Grassland,
      TimeOfDay.Morning,
      (() => {
        const values = [0.9, 0.5, 0];
        return () => values.shift() ?? 0.999;
      })(),
    );

    expect(landlocked?.kind).toBe('item');

    // ...but a pond in the same grassland draws from its water pool
    const pond = resolvePhenomenon(
      Phenomenon.RipplingWater,
      Biome.Grassland,
      TimeOfDay.Morning,
      (() => {
        const values = [0.9, 0.5, 0];
        return () => values.shift() ?? 0.999;
      })(),
      null,
      SpawnSurface.Water,
    );

    expect(pond?.kind).toBe('pokemon');
  });

  it('produces varied biomes across a region', () => {
    const world = new World('overworld');
    const biomes = new Set<Biome>();

    for (let x = 0; x < 32; x++) {
      for (let y = 0; y < 32; y++) {
        biomes.add(world.getChunk(x, y).biome);
      }
    }

    expect(biomes.size).toBeGreaterThan(1);
  });
});
