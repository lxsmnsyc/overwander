import 'server-only';
import AleaRNG from '../core/alea';
import BattleOutcome from '../auth/battle-outcome';
import { asCaughtPokemon } from '../auth/caught-record';
import {
  type DungeonRun,
  asDungeonRun,
  dungeonFightSeed,
  dungeonIdOf,
  lootKey,
} from '../auth/dungeon-record';
import type { EncounterRecord } from '../auth/encounter-record';
import { asOffset, toLocalTime } from '../auth/local-time';
import { TEAM_SIZE } from '../auth/teams';
import type Awards from '../data/ids/awards';
import type { Moves } from '../data/ids/moves';
import DungeonKind, { FloorGate } from '../data/overworld/dungeon';
import {
  FRONTIER_BRAIN_RULES,
  FRONTIER_BRAIN_SYMBOLS,
  FRONTIER_BRAIN_TITLES,
  FrontierRule,
  frontierTeamSize,
} from '../data/overworld/experts';
import type { ItemStack } from '../data/overworld/item-pool';
import { pickItems } from '../data/overworld/item-pool';
import { getItemPool } from '../data/overworld/biome-items';
import Npc from '../data/overworld/npc';
import { SYNDICATE_BOSS_HONORS } from '../data/overworld/syndicate';
import ChunkSnapshot, { NPC_INTERVAL } from '../overworld/chunk-snapshot';
import getWorld, { WORLD_GENERATION } from '../overworld/current';
import { Depth } from '../overworld/depth';
import type { Direction } from '../overworld/dungeon/floor';
import { RoomKind } from '../overworld/dungeon/floor';
import type { DungeonLayout } from '../overworld/dungeon/layout';
import {
  dungeonFoe,
  dungeonKindOf,
  getDungeonLayout,
  getDungeonLegendary,
} from '../overworld/dungeon/stage';
import { type CellGrid, Thing, cellAhead } from '../overworld/dungeon/grid';
import { type Footing, arrive, press, spottedBy, thingAt, tread } from '../overworld/dungeon/tread';
import { EncounterType } from '../overworld/encounter';
import { resolveItemCache } from '../overworld/landmarks';
import { LEGENDARY_RAID_GOLD, LEGENDARY_RAID_REWARD_LEVEL } from '../overworld/raid';
import createOverworld from '../overworld/setup';
import {
  CHAMPION_LOOT_ODDS,
  CHAMPION_OUTFIT,
  FRONTIER_GOLD,
  GIOVANNI_GOLD,
  ROCKET_REWARD_LEVEL,
  rollStopGold,
} from '../overworld/stop';
import { Foe, Metric } from '../auth/quest-record';
import { hasAwards, recordAwardWin } from './awards';
import resolveBuddy from './buddy';
import { isEggRecord } from './catch-fields';
import { readCaughtMany } from './caught-io';
import { getSql, jsonOf } from './db';
import { grantItem } from './inventory';
import { startEncounter } from './overworld';
import { grantGold } from './profile';
import { bumpProgress } from './quest-progress';
import { foughtBattle, readBattle } from './raid-io';
import { asNumber, asString } from './read';
import { stageHouseFight } from './stops';

/**
 * The dungeons, written with admin credentials. The floors are derived
 * from the chunk and the window on both sides; what is stored is only
 * what the player changed, and every move is checked against the same
 * walk the client draws
 */

// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asOutcome = (value: unknown): BattleOutcome => asNumber(value) as BattleOutcome;

async function readRun(id: string, player: string): Promise<DungeonRun | null> {
  const rows = await getSql()`
    select * from dungeon_runs
    where generation = ${WORLD_GENERATION} and run_id = ${id} and player = ${player}
  `;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }
  const fields: Record<string, unknown> = {
    id: row.run_id,
    kind: row.kind,
    timestamp: row.window_at,
    offset: row.utc_offset,
    chunk: { seed: asString(row.chunk_seed), x: asNumber(row.chunk_x), y: asNumber(row.chunk_y) },
    depth: row.depth,
    cell: row.cell,
    party: row.party,
    floor: row.floor,
    state: row.state,
    beaten: row.beaten,
    looted: row.looted,
    battle: row.battle_id,
    battleRoom: row.battle_room,
    cleared: row.cleared,
  };

  return asDungeonRun(fields);
}

async function saveRun(player: string, run: DungeonRun, battleRoom?: number | null): Promise<void> {
  const sql = getSql();

  await sql`
    update dungeon_runs set
      party = ${jsonOf(sql, run.party)},
      floor = ${run.floor},
      state = ${run.state == null ? null : jsonOf(sql, run.state)},
      beaten = ${jsonOf(sql, run.beaten)},
      looted = ${jsonOf(sql, run.looted)},
      battle_id = ${run.battle},
      cleared = ${run.cleared}
      ${battleRoom === undefined ? sql`` : sql`, battle_room = ${battleRoom}`}
    where generation = ${WORLD_GENERATION} and run_id = ${run.id} and player = ${player}
  `;
}

function snapshotOf(run: DungeonRun): ChunkSnapshot {
  return new ChunkSnapshot(
    getWorld(run.depth).getChunk(run.chunk.x, run.chunk.y),
    run.timestamp,
    run.offset,
  );
}

function isLive(run: DungeonRun, now: number): boolean {
  return !run.cleared && toLocalTime(now, run.offset) < run.timestamp + NPC_INTERVAL;
}

/** The run back at the entrance: the party is freed, what was looted stays taken */
function reset(run: DungeonRun): DungeonRun {
  return { ...run, party: [], floor: 0, state: null, beaten: [], battle: null };
}

async function isFightUnfinished(battle: string | null): Promise<boolean> {
  if (battle == null) {
    return false;
  }

  const row = await readBattle(battle);

  return row != null && asOutcome(row.outcome) === BattleOutcome.Unfinished;
}

/** The moves the locked party knows between them, which is what clears the way */
async function partyMoves(run: DungeonRun): Promise<Set<Moves>> {
  const known = new Set<Moves>();

  for (const data of (await readCaughtMany(getSql(), run.party)).values()) {
    for (const move of asCaughtPokemon(data).moves) {
      known.add(move);
    }
  }
  return known;
}

/** Whether somebody at this cell still has a fight to give */
function standing(grid: CellGrid, run: DungeonRun, footing: Footing, cell: number): boolean {
  const thing = thingAt(grid, footing, cell);
  const room = grid.rooms.get(cell);

  return (
    room != null &&
    (thing === Thing.Trainer || thing === Thing.Horde || thing === Thing.Boss) &&
    !run.beaten.includes(room)
  );
}

/** A floor's footing as arrived back on at its stairs, coming up from below */
function atStairs(grid: CellGrid): Footing {
  return { ...arrive(grid), at: grid.exit };
}

/** Whether the challenger holds the house's silver symbol already */
async function tookTheHouse(uid: string, snapshot: ChunkSnapshot, cell: number): Promise<boolean> {
  const brain = snapshot.getFrontierBrain(cell);

  return brain != null && (await hasAwards(uid, [FRONTIER_BRAIN_SYMBOLS[brain][0]]));
}

function houseRules(layout: DungeonLayout, snapshot: ChunkSnapshot, cell: number): FrontierRule {
  const brain = layout.kind === DungeonKind.Frontier ? snapshot.getFrontierBrain(cell) : null;

  return brain == null ? FrontierRule.None : FRONTIER_BRAIN_RULES[brain];
}

/**
 * Walking up to a dungeon: its run for this window, `'cleared'` once
 * this player has cleared it, `'locked'` for a Frontier that will not
 * take them yet, or null where the cell holds no dungeon this window
 */
export type DungeonEntry = DungeonRun | 'cleared' | 'locked' | null;

export async function enterDungeon(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  depth: Depth = Depth.Surface,
): Promise<DungeonEntry> {
  const chunk = getWorld(depth).getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  const kind = dungeonKindOf(chunk.getLandmarkCells().get(cell));

  if (kind == null || getDungeonLayout(snapshot, cell) == null) {
    return null;
  }
  // A house stands past the league, so it takes nobody without that region's crown
  if (kind === DungeonKind.Frontier) {
    const brain = snapshot.getFrontierBrain(cell);

    if (brain == null || !(await hasAwards(uid, [FRONTIER_BRAIN_TITLES[brain]]))) {
      return 'locked';
    }
  }

  const id = dungeonIdOf(chunk, snapshot.npcTimestamp, cell, zone);

  await getSql()`
    insert into dungeon_runs
      (generation, run_id, player, kind, window_at, utc_offset, chunk_seed, chunk_x, chunk_y,
       depth, cell)
    values
      (${WORLD_GENERATION}, ${id}, ${uid}, ${kind}, ${snapshot.npcTimestamp}, ${zone},
       ${chunk.seed}, ${chunk.x}, ${chunk.y}, ${depth}, ${cell})
    on conflict do nothing
  `;

  let run = await readRun(id, uid);

  // A fight that ended without being settled is settled on the way back in
  if (run?.battle != null && !(await isFightUnfinished(run.battle))) {
    await settleDungeonFight(uid, id);
    run = await readRun(id, uid);
  }
  if (run == null) {
    return null;
  }
  return run.cleared ? 'cleared' : run;
}

/**
 * Lock a party in at the entrance and start on the first floor. A run
 * already under way is left as it is. A Factory tower takes no party:
 * every floor is fought with three rented on the spot
 */
export async function beginDungeonRun(
  uid: string,
  id: string,
  catches: string[],
  now: number,
): Promise<DungeonRun | null> {
  const run = await readRun(id, uid);

  if (run == null || !isLive(run, now)) {
    return null;
  }
  if (run.state != null) {
    return run;
  }

  const snapshot = snapshotOf(run);
  const layout = getDungeonLayout(snapshot, run.cell);

  if (layout == null || new Set(catches).size !== catches.length) {
    return null;
  }

  const rules = houseRules(layout, snapshot, run.cell);

  if (rules === FrontierRule.Rented) {
    if (catches.length > 0) {
      return null;
    }
  } else {
    const most = rules === FrontierRule.None ? TEAM_SIZE : frontierTeamSize(rules);

    if (catches.length === 0 || catches.length > most) {
      return null;
    }

    const found = await readCaughtMany(getSql(), catches);

    for (const catchId of catches) {
      const data = found.get(catchId);

      if (data == null || data.owner !== uid || isEggRecord(data)) {
        return null;
      }
    }
  }

  const started: DungeonRun = {
    ...run,
    party: catches,
    floor: 0,
    state: arrive(layout.floors[0].grid),
    beaten: [],
    battle: null,
  };

  await saveRun(uid, started);
  return started;
}

/** What a walk came to, besides the footing it left */
export type DungeonWalkEvent =
  | { kind: 'spotted'; cell: number }
  | { kind: 'climbed' }
  | { kind: 'shut'; want: 'guard' | 'pass' }
  | { kind: 'up' }
  | { kind: 'fell' }
  | { kind: 'out' };

export interface DungeonWalk {
  run: DungeonRun;
  event: DungeonWalkEvent | null;
}

/** The most steps one walk report may carry */
export const WALK_LIMIT = 64;

/**
 * Walk a run of steps, replaying each with the same rules the board
 * draws with, and stop at the first thing that happens: a trainer's
 * line, the stairs, a fall, the way back up
 */
export async function walkDungeon(
  uid: string,
  id: string,
  steps: Direction[],
  now: number,
): Promise<DungeonWalk | null> {
  const run = await readRun(id, uid);

  if (run?.state == null || !isLive(run, now) || steps.length > WALK_LIMIT) {
    return null;
  }
  if (await isFightUnfinished(run.battle)) {
    return null;
  }

  const layout = getDungeonLayout(snapshotOf(run), run.cell);

  if (layout == null) {
    return null;
  }

  const known = await partyMoves(run);
  const beaten = new Set(run.beaten);
  let floor = run.floor;
  let footing = run.state;
  let event: DungeonWalkEvent | null = null;

  for (const direction of steps) {
    const plan = layout.floors[floor];
    const trod = tread(plan.grid, footing, direction, known);

    if (trod == null) {
      continue;
    }
    footing = trod.footing;

    if (trod.event?.kind === 'fall') {
      // A broken floor drops you back a floor, and out of the first one
      floor = Math.max(0, floor - 1);
      footing =
        floor === run.floor ? arrive(layout.floors[0].grid) : atStairs(layout.floors[floor].grid);
      event = { kind: 'fell' };
      break;
    }
    if (trod.event?.kind === 'stairs') {
      const guarded = plan.gate === FloorGate.Guard && !beaten.has(plan.exit);
      const passless = plan.gate === FloorGate.Pass && !footing.pass;

      if (guarded || passless) {
        event = { kind: 'shut', want: guarded ? 'guard' : 'pass' };
        break;
      }
      floor += 1;
      footing = arrive(layout.floors[floor].grid);
      event = { kind: 'climbed' };
      break;
    }
    if (trod.event?.kind === 'arrival') {
      if (floor === 0) {
        event = { kind: 'out' };
      } else {
        floor -= 1;
        footing = atStairs(layout.floors[floor].grid);
        event = { kind: 'up' };
      }
      break;
    }

    const spotter = spottedBy(plan.grid, footing, beaten);

    if (spotter != null) {
      event = { kind: 'spotted', cell: spotter };
      break;
    }
  }

  // A new floor starts with nothing on it beaten
  const walked: DungeonRun = {
    ...run,
    floor,
    state: footing,
    beaten: floor === run.floor ? run.beaten : [],
  };

  await saveRun(uid, walked);
  return { run: walked, event };
}

/** What pressing the thing in front of you came to */
export interface DungeonPress {
  run: DungeonRun;
  items: ItemStack[];
  /** A fight, or the legendary, waiting on the cell pressed */
  fight: number | null;
}

/** Press whatever the player faces, having turned to face it */
export async function pressInDungeon(
  uid: string,
  id: string,
  facing: Direction,
  now: number,
): Promise<DungeonPress | null> {
  const run = await readRun(id, uid);

  if (run?.state == null || !isLive(run, now) || (await isFightUnfinished(run.battle))) {
    return null;
  }

  const snapshot = snapshotOf(run);
  const layout = getDungeonLayout(snapshot, run.cell);

  if (layout == null) {
    return null;
  }

  const grid = layout.floors[run.floor].grid;
  const pressed = press(grid, { ...run.state, facing }, await partyMoves(run));

  if (pressed == null) {
    return null;
  }
  if (pressed.event?.kind === 'fight') {
    const cell = pressed.event.cell;

    return {
      run,
      items: [],
      fight: standing(grid, run, run.state, cell) ? cell : null,
    };
  }

  let pressedRun: DungeonRun = { ...run, state: pressed.footing };
  let items: ItemStack[] = [];

  // A stash pays once per window, however many times the run starts over
  if (pressed.event?.kind === 'take' && pressed.event.thing === Thing.Stash) {
    const key = lootKey(run.floor, pressed.event.cell);

    if (!run.looted.includes(key)) {
      const rng = new AleaRNG(`${id}:stash:${key}:${uid}`);

      items = resolveItemCache(snapshot.biomeAt(run.cell), () => rng.random());
      pressedRun = { ...pressedRun, looted: [...run.looted, key] };
    }
  }

  await saveRun(uid, pressedRun);
  for (const { item, amount } of items) {
    await grantItem(uid, item, amount);
  }
  return { run: pressedRun, items, fight: null };
}

/**
 * Fight whoever stands at `cell`: somebody the player is facing, or a
 * trainer whose line they walked into. `picks` are the rental indexes on
 * a Factory floor and nothing elsewhere. Resolves the battle id, the one
 * under way if any
 */
export async function startDungeonFight(
  uid: string,
  id: string,
  cell: number,
  picks: string[],
  now: number,
): Promise<string | null> {
  const run = await readRun(id, uid);

  if (run?.state == null || !isLive(run, now)) {
    return null;
  }
  if (run.battle != null) {
    // One under way is walked back into; one over is settled first
    return (await isFightUnfinished(run.battle)) ? run.battle : null;
  }

  const snapshot = snapshotOf(run);
  const layout = getDungeonLayout(snapshot, run.cell);

  if (layout == null) {
    return null;
  }

  const plan = layout.floors[run.floor];
  const grid = plan.grid;
  const room = grid.rooms.get(cell);
  const beside = cellAhead(grid, run.state.at, run.state.facing) === cell;
  const seen = grid.watches.get(cell)?.sight.includes(run.state.at) === true;

  if (room == null || !standing(grid, run, run.state, cell) || !(beside || seen)) {
    return null;
  }

  const last = run.floor === layout.floors.length - 1;
  const gold =
    layout.kind === DungeonKind.Frontier && last && (await tookTheHouse(uid, snapshot, run.cell));
  const foe = dungeonFoe(snapshot, run.cell, run.floor, room, gold);

  if (foe == null) {
    return null;
  }

  return stageHouseFight(uid, foe.rules === FrontierRule.Rented ? picks : run.party, now, {
    seed: dungeonFightSeed(id, run.floor, room),
    snapshot,
    cell: run.cell,
    rules: foe.rules,
    party: foe.party,
    shadow: foe.shadow,
    levels: foe.levels,
    outfit: foe.outfit,
    challenger: foe.name === '' ? null : { name: foe.name, sprite: foe.sprite },
    link: async (transaction, battleId) => {
      await transaction`
        update dungeon_runs set battle_id = ${battleId}, battle_room = ${room}
        where generation = ${WORLD_GENERATION} and run_id = ${id} and player = ${uid}
      `;
    },
  });
}

/** What clearing a dungeon paid */
export interface DungeonReward {
  gold: number;
  award: Awards | null;
  items: ItemStack[];
  encounter: EncounterRecord | null;
}

/** How a finished fight left the run */
export interface DungeonSettlement {
  run: DungeonRun;
  won: boolean;
  reward: DungeonReward | null;
}

/**
 * Read back the room's fight once it is over. A win clears the room,
 * and the last room clears the dungeon; a loss sends the run back to
 * the entrance
 */
export async function settleDungeonFight(
  uid: string,
  id: string,
): Promise<DungeonSettlement | null> {
  const run = await readRun(id, uid);

  if (run?.battle == null || run.state == null) {
    return null;
  }

  const battle = await readBattle(run.battle);

  if (battle == null || asOutcome(battle.outcome) === BattleOutcome.Unfinished) {
    return null;
  }

  const won =
    asOutcome(battle.outcome) === BattleOutcome.Won && (await foughtBattle(run.battle, uid));

  if (!won) {
    const lost = reset(run);

    await saveRun(uid, lost, null);
    return { run: lost, won: false, reward: null };
  }

  const snapshot = snapshotOf(run);
  const layout = getDungeonLayout(snapshot, run.cell);

  if (layout == null) {
    return null;
  }

  const room = run.battleRoom;

  if (room == null) {
    return null;
  }

  const grid = layout.floors[run.floor].grid;
  const boss = layout.floors[run.floor].rooms[room].kind === RoomKind.Boss;
  // A beaten horde is gone from the cell it stood on
  let footing = run.state;

  for (const [cell, of] of grid.rooms) {
    if (of === room && grid.things.get(cell) === Thing.Horde && !footing.taken.includes(cell)) {
      footing = { ...footing, taken: [...footing.taken, cell].sort((a, b) => a - b) };
    }
  }

  const settled: DungeonRun = {
    ...run,
    state: footing,
    beaten: run.beaten.includes(room) ? run.beaten : [...run.beaten, room],
    battle: null,
    battleRoom: null,
    cleared: boss,
  };

  // The first settle to clear it is the one that pays
  const claimed = await getSql()`
    update dungeon_runs set beaten = ${jsonOf(getSql(), settled.beaten)},
      state = ${jsonOf(getSql(), footing)}, battle_id = null, battle_room = null, cleared = ${boss}
    where generation = ${WORLD_GENERATION} and run_id = ${id} and player = ${uid}
      and battle_id = ${run.battle}
  `;

  if (claimed.count === 0) {
    return null;
  }
  return {
    run: settled,
    won: true,
    reward: boss ? await payBoss(uid, run, snapshot, layout, room) : null,
  };
}

/** What beating a Hideout's boss or a Frontier's Brain pays */
async function payBoss(
  uid: string,
  run: DungeonRun,
  snapshot: ChunkSnapshot,
  layout: DungeonLayout,
  room: number,
): Promise<DungeonReward> {
  const overworld = createOverworld(uid, await resolveBuddy(uid));

  if (layout.kind === DungeonKind.Frontier) {
    const brain = snapshot.getFrontierBrain(run.cell);
    // Asked before the award is written, so the win that earns silver
    // is not read as a gold one
    const gold = await tookTheHouse(uid, snapshot, run.cell);
    const purse = overworld.checkGoldReward(
      run.id,
      rollStopGold(`${run.id}:purse:${uid}`, FRONTIER_GOLD),
    );

    await grantGold(uid, purse);
    await bumpProgress(uid, [
      [Metric.NpcVisits, Npc.Trainer, 1],
      [Metric.GoldEarned, 0, purse],
    ]);

    const owed = brain == null ? null : FRONTIER_BRAIN_SYMBOLS[brain][gold ? 1 : 0];
    const award = owed != null && (await recordAwardWin(uid, owed, Date.now())) ? owed : null;

    return { gold: purse, award, items: [], encounter: null };
  }

  const syndicate = snapshot.getSyndicate();
  const purse = overworld.checkGoldReward(
    run.id,
    rollStopGold(`${run.id}:purse:${uid}`, GIOVANNI_GOLD),
  );

  await grantGold(uid, purse);
  await bumpProgress(uid, [
    [Metric.NpcVisits, Npc.RocketGrunt, 1],
    [Metric.BattleWins, Foe.Rocket, 1],
    [Metric.GoldEarned, 0, purse],
  ]);

  const owed = SYNDICATE_BOSS_HONORS[syndicate];
  const award = (await recordAwardWin(uid, owed, Date.now())) ? owed : null;
  const rng = new AleaRNG(`${run.id}:loot:${uid}`);
  const items = pickItems(
    getItemPool(snapshot.biomeAt(run.cell)),
    () => rng.random(),
    CHAMPION_LOOT_ODDS,
  );

  for (const { item, amount } of items) {
    await grantItem(uid, item, amount);
  }

  // One of the boss' own six, handed over the way a grunt's is
  const foe = dungeonFoe(snapshot, run.cell, run.floor, room);
  const offered = foe?.party ?? [];
  const encounter =
    offered.length === 0
      ? null
      : await startEncounter(
          uid,
          snapshot,
          `${run.id}$reward`,
          [offered[Math.floor(rng.random() * offered.length)][0], rng.int32(), rng.int32()],
          {
            type: EncounterType.Rocket,
            level: ROCKET_REWARD_LEVEL,
            shadow: true,
            abilities: CHAMPION_OUTFIT.abilities,
            itemSlots: CHAMPION_OUTFIT.items,
          },
        );

  return { gold: purse, award, items, encounter };
}

/**
 * Meet the legendary at the bottom of a Dungeon. It cannot flee, and
 * reaching it is the clear: the window's run is done either way
 */
export async function meetDungeonLegendary(
  uid: string,
  id: string,
  now: number,
): Promise<DungeonReward | null> {
  const run = await readRun(id, uid);

  if (run?.state == null || !isLive(run, now)) {
    return null;
  }

  const snapshot = snapshotOf(run);
  const layout = getDungeonLayout(snapshot, run.cell);
  const legendary = getDungeonLegendary(snapshot, run.cell);

  if (
    layout?.kind !== DungeonKind.Dungeon ||
    legendary == null ||
    run.floor !== layout.floors.length - 1 ||
    cellAhead(layout.floors[run.floor].grid, run.state.at, run.state.facing) !==
      layout.floors[run.floor].exit
  ) {
    return null;
  }

  const claimed = await getSql()`
    update dungeon_runs set cleared = true
    where generation = ${WORLD_GENERATION} and run_id = ${id} and player = ${uid}
      and not cleared
  `;

  if (claimed.count === 0) {
    return null;
  }

  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const gold = overworld.checkGoldReward(id, LEGENDARY_RAID_GOLD);

  await grantGold(uid, gold);
  await bumpProgress(uid, [[Metric.GoldEarned, 0, gold]]);

  const rng = new AleaRNG(`${id}:legendary:${uid}`);
  const encounter = await startEncounter(
    uid,
    snapshot,
    `${id}$legendary`,
    [legendary.species, rng.int32(), legendary.traitValue],
    {
      // A raid prize's type, which is what keeps it from fleeing
      type: EncounterType.LegendaryRaid,
      lair: legendary.lair,
      level: LEGENDARY_RAID_REWARD_LEVEL,
    },
  );

  return { gold, award: null, items: [], encounter };
}

/** Walk out: the run goes back to the entrance and the party is freed */
export async function leaveDungeonRun(uid: string, id: string): Promise<DungeonRun | null> {
  const run = await readRun(id, uid);

  if (run == null || (await isFightUnfinished(run.battle))) {
    return null;
  }

  const left = reset(run);

  await saveRun(uid, left, null);
  return left;
}
