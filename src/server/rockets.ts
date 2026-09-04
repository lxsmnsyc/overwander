import 'server-only';
import BattleOutcome from '../auth/battle-outcome';
import { PVP_BATTLE_LIMITS } from '../data/constants/battle-limits';
import { type EncounterRecord, asEncounterRecord } from '../auth/encounter-record';
import { asOffset, toLocalTime } from '../auth/local-time';
import {
  type RocketRecord,
  asRocketRecord,
  deriveRocketReward,
  rocketStopId,
  toSpawns,
} from '../auth/rocket-record';
import { TEAM_SIZE } from '../auth/teams';
import ChunkSnapshot, { NPC_INTERVAL, RocketRank, type Spawn } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { EncounterType } from '../overworld/encounter';
import { PLAYER_ALLIANCE } from '../overworld/raid';
import {
  ROCKET_ALLIANCE,
  ROCKET_REWARD_LEVEL,
  createRocketParty,
  rollStopGold,
  rollStopLoot,
  stopChallenger,
  stopGoldBand,
  stopOutfit,
  stopPartyLevels,
} from '../overworld/rocket';
import { encounterKey } from '../overworld/safari';
import createOverworld from '../overworld/setup';
import Landmark from '../data/overworld/landmark';
import Npc, {
  GIOVANNI_HONOR,
  ROCKET_EXECUTIVE_HONORS,
  ROCKET_GRUNT_HONOR,
} from '../data/overworld/npc';
import { trainerLevels } from '../data/overworld/trainers';
import type Awards from '../data/ids/awards';
import {
  CHAMPION_HONORS,
  CHAMPION_TITLES,
  ELITE_MEMBER_HONORS,
  GYM_LEADER_BADGES,
  LEGEND_HONORS,
  getEliteBadges,
  rollGymMachine,
} from '../data/overworld/experts';
import type { Items } from '../data/ids/items';
import AleaRNG from '../core/alea';
import { hasAwards, recordAwardWin } from './awards';
import { grantItem } from './inventory';
import { Foe, Metric } from '../auth/quest-record';
import { type ProgressBump, bumpProgress } from './quest-progress';
import resolveBuddy from './buddy';
import { getSql, jsonOf, newDocId, tx } from './db';
import { readEncounter } from './encounter-io';
import { startEncounter } from './overworld';
import { grantGold } from './profile';
import { recordSeenOpponents } from './pokedex';
import { foughtBattle, readBattle } from './raid-io';
import { isAnyCatchQueued, publishTeamSnapshot } from './raids';
import { asNumber, asString } from './read';

/** Which BattleWins foe a fighting landmark's resident counts as */
const FOE_OF: Partial<Record<Landmark, Foe>> = {
  [Landmark.TeamRocket]: Foe.Rocket,
  [Landmark.GymLeader]: Foe.GymLeader,
  [Landmark.EliteFour]: Foe.EliteFour,
  [Landmark.Champion]: Foe.Champion,
  [Landmark.Trainer]: Foe.Trainer,
};

/**
 * Team Rocket stops, written with admin credentials. A grunt hands
 * over gold and a pokemon, so what it fields, whether it was beaten,
 * and what beating it paid are all decided here — a client reports
 * the outcome of the fight and nothing else about it
 */

/**
 * A stored outcome, restored as the enum this compares against
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asOutcome = (value: unknown): BattleOutcome => asNumber(value) as BattleOutcome;

/**
 * Walk up to a Team Rocket stop. The grunt's party comes from the
 * chunk's own roll for the window, so it is the one the world staged
 * wherever the caller says they are standing, and the record is
 * created on first approach.
 *
 * Resolves the stop id and the player's state of it, or null when the
 * cell stages no grunt this window or the player has already beaten
 * the
 * one it stages
 */

/** One stop for one player, in the record shape, or null */
async function readRocketStop(
  stop: string,
  player: string,
): Promise<Record<string, unknown> | null> {
  const sql = getSql();
  const rows = await sql`
    select * from rocket_stops where stop_id = ${stop} and player = ${player}
  `;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }

  const party = await sql`
    select species, individual_value as "individualValue", trait_value as "traitValue"
    from rocket_party
    where stop_id = ${stop} and player = ${player}
    order by slot
  `;

  return {
    player: row.player,
    party: [...party],
    battle: row.battle_id,
    timestamp: row.window_at,
    offset: row.utc_offset,
    chunk: { seed: asString(row.chunk_seed), x: asNumber(row.chunk_x), y: asNumber(row.chunk_y) },
    cell: row.cell,
    defeated: row.defeated,
  };
}

/**
 * The ways for a walk-up to find no fight, told apart because they
 * say different things: `'beaten'` is this player's own win still
 * standing on the cell, `'locked'` is an expert who will not take
 * this challenger yet, and null is a cell the window stages nobody
 * on at all, which is what a stale client's board looks like from
 * here
 */
export type RocketStopEntry = [string, RocketRecord] | 'beaten' | 'locked' | null;

/**
 * The party a fighting landmark stages at this cell this window, or
 * null for a cell that stages none
 */
function stagedParty(
  snapshot: ChunkSnapshot,
  landmark: Landmark | undefined,
  cell: number,
): Spawn[] | null {
  if (landmark === Landmark.Trainer) {
    return snapshot.getTrainerStops().get(cell) ?? null;
  }
  if (landmark === Landmark.GymLeader) {
    return snapshot.getGymStops().get(cell) ?? null;
  }
  if (landmark === Landmark.EliteFour) {
    return snapshot.getEliteStops().get(cell) ?? null;
  }
  if (landmark === Landmark.Champion) {
    return snapshot.getChampionStops().get(cell) ?? null;
  }
  return snapshot.getRocketStops().get(cell) ?? null;
}

export async function enterRocketStop(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<RocketStopEntry> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  // The cell's landmark says whose stop this is: Team Rocket's, the
  // duelling trainer's, or one of the experts'
  const landmark = chunk.getLandmarkCells().get(cell);
  const party = stagedParty(snapshot, landmark, cell);

  if (party == null) {
    return null;
  }

  // The ladder's gates: an elite asks to see their own league's whole
  // badge case, and the Champion asks for the Elite Four themselves
  if (landmark === Landmark.EliteFour) {
    const member = snapshot.getEliteMember(cell);

    if (member == null || !(await hasAwards(uid, getEliteBadges(member)))) {
      return 'locked';
    }
  }
  // A legend standing in a champion's seat asks for nothing: they
  // keep no league and answer to no badge case
  if (landmark === Landmark.Champion && snapshot.getLegend(cell) == null) {
    const champion = snapshot.getChampion(cell);

    if (champion == null || !(await hasAwards(uid, CHAMPION_HONORS[champion]))) {
      return 'locked';
    }
  }

  const stop = rocketStopId(chunk, snapshot.npcTimestamp, cell, zone);
  const stored = await readRocketStop(stop, uid);

  if (stored != null) {
    const existing = asRocketRecord(stored);

    // A grunt already beaten is gone for the window; a grunt that won
    // is still standing there, and can be fought again
    return existing.defeated ? 'beaten' : [stop, existing];
  }

  const fresh: RocketRecord = {
    player: uid,
    party: party.map(([species, individualValue, traitValue]) => ({
      species,
      individualValue,
      traitValue,
    })),
    battle: null,
    timestamp: snapshot.npcTimestamp,
    offset: zone,
    chunk: { seed: chunk.seed, x: chunk.x, y: chunk.y },
    cell,
    defeated: false,
  };

  await tx(async (transaction) => {
    await transaction`
      insert into rocket_stops
        (stop_id, player, battle_id, window_at, utc_offset,
         chunk_seed, chunk_x, chunk_y, cell, defeated)
      values
        (${stop}, ${uid}, null, ${fresh.timestamp}, ${fresh.offset},
         ${chunk.seed}, ${chunk.x}, ${chunk.y}, ${cell}, false)
      on conflict do nothing
    `;

    const rows = fresh.party.map((entry, slot) => ({
      stop_id: stop,
      player: uid,
      slot,
      species: entry.species,
      individual_value: entry.individualValue,
      trait_value: entry.traitValue,
    }));

    await transaction`
      insert into rocket_party
        ${transaction(rows, 'stop_id', 'player', 'slot', 'species', 'individual_value', 'trait_value')}
      on conflict do nothing
    `;
  });
  return [stop, fresh];
}

/**
 * Whether a fight is still going. A battle that has an outcome, or one
 * whose row never landed, is over, and a stop whose last fight is over
 * may be fought again
 */
async function isBattleUnfinished(battleId: string): Promise<boolean> {
  const battle = await readBattle(battleId);

  return battle != null && asOutcome(battle.outcome) === BattleOutcome.Unfinished;
}

/**
 * Accept the grunt's challenge. The player's party is frozen and
 * locked exactly as a raid freezes one, the grunt's three are frozen
 * beside it, and the pair becomes a battle.
 *
 * A fight already under way is returned rather than restaged, so a
 * second acceptance walks back into the same one. A stop the player
 * has beaten, or one whose window has rolled over, stages nothing.
 *
 * Resolves the battle id, or null when the challenge cannot be taken
 */
export async function startRocketBattle(
  uid: string,
  stop: string,
  catches: string[],
  now: number,
): Promise<string | null> {
  if (catches.length === 0 || catches.length > TEAM_SIZE) {
    return null;
  }
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const stored = await readRocketStop(stop, uid);

  if (stored == null) {
    return null;
  }

  const record = asRocketRecord(stored);

  if (record.player !== uid || record.defeated) {
    return null;
  }
  // A grunt stands for the window that staged them; past that, the
  // cell has rolled somebody else onto it
  if (toLocalTime(now, record.offset) >= record.timestamp + NPC_INTERVAL) {
    return null;
  }
  if (record.battle != null && (await isBattleUnfinished(record.battle))) {
    return record.battle;
  }
  // A pokemon waiting in a raid lobby is spoken for; one already
  // fighting is refused by the freeze below
  if (await isAnyCatchQueued(uid, catches)) {
    return null;
  }

  const battleId = newDocId();
  const party = await publishTeamSnapshot(uid, catches, PLAYER_ALLIANCE, now);

  if (party == null) {
    return null;
  }

  const chunk = getWorld().getChunk(record.chunk.x, record.chunk.y);
  const snapshot = new ChunkSnapshot(chunk, record.timestamp, record.offset);
  // The cell's landmark decides what they field: only Team Rocket
  // fields shadows, and it fixes the band — every league seat brings
  // a full 6, so size alone cannot say what the fight is worth, and a
  // duellist's band is their class'
  const landmark = chunk.getLandmarkCells().get(record.cell);
  const shadow = landmark === Landmark.TeamRocket;
  const duellist = snapshot.getTrainerClass(record.cell);
  const rank = snapshot.getRocketRank(record.cell) ?? RocketRank.Grunt;
  const legend = snapshot.getLegend(record.cell) != null;
  const levels = stopPartyLevels(
    landmark ?? Landmark.TeamRocket,
    rank,
    duellist == null ? undefined : trainerLevels(duellist),
    legend,
  );
  // Who is standing there, kept on the battle rather than derived
  // again later: the window that rolled them is gone within the hour,
  // and a history read back afterwards has nothing to ask
  const challenger = stopChallenger(snapshot, record.cell);
  const gruntId = newDocId();
  // The sky over the cell when the fight was accepted, read here
  // rather than trusted from the client and kept on the row, since
  // the world's own moves on within the hour
  const weather = getWorld().getWeather(record.chunk.x, record.chunk.y, snapshot.weatherWindow);

  await tx(async (transaction) => {
    // The stop's party belongs to nobody, the way a raid boss' does
    await transaction`
      insert into team_snapshots (id, player, alliance, catches)
      values (${gruntId}, null, ${ROCKET_ALLIANCE},
              ${jsonOf(
                transaction,
                createRocketParty(
                  snapshot,
                  toSpawns(record.party),
                  shadow,
                  levels,
                  stopOutfit(landmark ?? Landmark.TeamRocket, rank, legend, duellist ?? undefined),
                ),
              )})
    `;
    await transaction`
      insert into battles (id, raid_id, species, outcome, started_at, biome, weather, limits,
                           opponent, opponent_sprite)
      values (${battleId}, null, ${record.party[0]?.species ?? 0},
              ${BattleOutcome.Unfinished}, ${now},
              ${chunk.biome}, ${weather}, ${PVP_BATTLE_LIMITS},
              ${challenger?.name ?? ''}, ${challenger?.sprite ?? ''})
    `;

    const rows = [
      { battle_id: battleId, position: 0, snapshot_id: gruntId, player: null as string | null },
      { battle_id: battleId, position: 1, snapshot_id: party, player: uid as string | null },
    ];

    await transaction`
      insert into battle_teams ${transaction(rows, 'battle_id', 'position', 'snapshot_id', 'player')}
    `;
    await transaction`
      update rocket_stops set battle_id = ${battleId}
      where stop_id = ${stop} and player = ${uid}
    `;
  });

  // What the stop put on the field is now something the player has
  // seen, whatever the fight comes to
  await recordSeenOpponents(battleId, [uid]);

  return battleId;
}

/**
 * What a beaten stop owed: the purse, a grunt's dropped pokemon, and
 * an expert's award. A duelling trainer keeps their party and hands
 * out no award, so their reward is the purse alone; `award` is only
 * ever the one this win earned, never one already held
 */
export interface RocketReward {
  encounter: EncounterRecord | null;
  gold: number;
  award: Awards | null;
  /**
   * What the fight left besides the purse: a gym leader's TM of their
   * own type, or the one item the rungs above them drop. First claim
   * only, and null for the rungs that leave none
   */
  item: Items | null;
}

/**
 * Collect what a beaten grunt owes. The `defeated` flag guards the
 * **gold**: it is set inside a transaction, and only the call that
 * sets it pays, so a stop pays once however many times it is claimed.
 *
 * The pokemon is not spent by walking away from it: the encounter is
 * staged per player and handed back as-is until it is caught, so a
 * reward run from can be walked back to. Only a catch retires it.
 *
 * Resolves null when the fight was not won, was somebody else's, or
 * the pokemon is already caught and the gold already paid
 */
export async function claimRocketReward(uid: string, stop: string): Promise<RocketReward | null> {
  const stored = await readRocketStop(stop, uid);

  if (stored == null) {
    return null;
  }

  const record = asRocketRecord(stored);

  if (record.player !== uid || record.battle == null) {
    return null;
  }

  const battle = await readBattle(record.battle);

  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !(await foughtBattle(record.battle, uid))
  ) {
    return null;
  }

  const chunk = getWorld().getChunk(record.chunk.x, record.chunk.y);
  const snapshot = new ChunkSnapshot(chunk, record.timestamp, record.offset);
  const landmark = chunk.getLandmarkCells().get(record.cell);
  // Every expert counts as a trainer for the quest ledger: what sets
  // them apart is the award, not the metric
  const kind = landmark === Landmark.TeamRocket ? Npc.RocketGrunt : Npc.Trainer;
  // Whose six it was, which sets both what is on offer and whether
  // the purse is a boss purse. Re-derived off the cell rather than
  // stored: the party alone no longer says, now that every rank
  // fields six
  const rank = snapshot.getRocketRank(record.cell) ?? RocketRank.Grunt;
  // And whether the seat at the top holds its champion or a legend,
  // which is the difference between a title and the only draw in the
  // game that reaches the special band
  const legend = snapshot.getLegend(record.cell) != null;

  // First claim pays; the guard rides in the statement
  const claimed = await getSql()`
    update rocket_stops set defeated = true
    where stop_id = ${stop} and player = ${uid} and not defeated
  `;

  const [spawnId, spawn] = deriveRocketReward(record, stop, uid, rank);

  if (claimed.count === 0) {
    // Paid already: the only thing possibly still owed is a grunt's
    // pokemon. Caught, it is retired; a trainer never owed one
    if (kind === Npc.Trainer) {
      return null;
    }

    const existing = await readEncounter(spawnId, uid);

    if (existing == null) {
      return null;
    }

    const encounter = asEncounterRecord(existing);
    const gone = await getSql()`
      select 1 from fled_encounters
      where player = ${uid} and key = ${encounterKey(encounter)}
    `;

    return gone.length > 0 ? null : { encounter, gold: 0, award: null, item: null };
  }

  // What the stop is worth — a purse rolled per winner, the top range
  // for Giovanni and the Champion — and then what the winner brought
  // along: a buddy burning a Luck Incense doubles it
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const gold = overworld.checkGoldReward(
    stop,
    rollStopGold(
      `${stop}:purse:${uid}`,
      stopGoldBand(
        landmark ?? Landmark.TeamRocket,
        rank,
        snapshot.getTrainerClass(record.cell) ?? undefined,
        legend,
      ),
    ),
  );

  await grantGold(uid, gold);

  // A first claim is the one moment a beaten stop counts once. A
  // duellist counts twice over: once as a trainer beaten, and once
  // under the class they were, which is what their title is worn off
  const foe = FOE_OF[landmark ?? Landmark.TeamRocket] ?? Foe.Rocket;
  const duelled = landmark === Landmark.Trainer ? snapshot.getTrainerClass(record.cell) : null;

  await bumpProgress(uid, [
    [Metric.NpcVisits, kind, 1],
    [Metric.BattleWins, foe, 1],
    [Metric.GoldEarned, 0, gold],
    ...(duelled == null ? [] : ([[Metric.TrainerWins, duelled, 1]] as ProgressBump[])),
  ]);

  // An expert's win carries their award as well: the resident gym
  // leader's badge, the elite's mark, or the region's title. Each is
  // earned once for good; every win counts on the shelf, and only
  // the earning one reports the award
  const owed = awardFor(landmark, snapshot, record.cell);
  const award = owed != null && (await recordAwardWin(uid, owed, Date.now())) ? owed : null;

  // A beaten expert also leaves something: a leader's TM of their own
  // type, or a draw off the pool for the rungs above them. Rolled per
  // winner like the purse, and only on the claim that paid, so a stop
  // is worth one of them however many times it is claimed
  const rng = new AleaRNG(`${stop}:machine:${uid}`);
  const leader = landmark === Landmark.GymLeader ? snapshot.getGymLeader(record.cell) : null;
  const item =
    leader == null
      ? rollStopLoot(
          landmark ?? Landmark.TeamRocket,
          rank,
          snapshot.chunk.biome,
          () => rng.random(),
          legend,
        )
      : rollGymMachine(leader, () => rng.random());

  if (item != null) {
    await grantItem(uid, item);
  }

  // A trainer's and an expert's purse is the whole of what changes
  // hands: they keep their party
  if (kind === Npc.Trainer) {
    return { encounter: null, gold, award, item };
  }

  // Fixed rather than rolled, so the same grunt is worth the same to
  // everyone who put them down — and far below the party it was taken
  // from. What it does keep is how it was trained: an executive's and
  // Giovanni's pokemon were raised with a second ability, and
  // Giovanni's with room for a second item, and neither is undone by
  // changing hands
  const raised = stopOutfit(Landmark.TeamRocket, rank);
  const encounter = await startEncounter(uid, snapshot, spawnId, spawn, {
    type: EncounterType.Rocket,
    level: ROCKET_REWARD_LEVEL,
    shadow: true,
    abilities: raised.abilities,
    itemSlots: raised.items,
  });

  return { encounter, gold, award, item };
}

/**
 * The award a fighting landmark pays, or null where it pays none: a
 * badge is the resident leader's, a mark the resident elite's, the
 * title the region's, and Team Rocket's is whoever was standing on
 * the cell
 */
function awardFor(
  landmark: Landmark | undefined,
  snapshot: ChunkSnapshot,
  cell: number,
): Awards | null {
  if (landmark === Landmark.TeamRocket) {
    if (snapshot.getRocketRank(cell) === RocketRank.Giovanni) {
      return GIOVANNI_HONOR;
    }

    const executive = snapshot.getRocketExecutive(cell);

    // The rank and file share one mark: a grunt is a uniform rather
    // than a person, and the coat it pays is that uniform
    return executive == null ? ROCKET_GRUNT_HONOR : ROCKET_EXECUTIVE_HONORS[executive];
  }
  if (landmark === Landmark.GymLeader) {
    const leader = snapshot.getGymLeader(cell);

    return leader == null ? null : GYM_LEADER_BADGES[leader];
  }
  if (landmark === Landmark.EliteFour) {
    const member = snapshot.getEliteMember(cell);

    return member == null ? null : ELITE_MEMBER_HONORS[member];
  }
  if (landmark === Landmark.Champion) {
    // A legend pays their own mark rather than the league's title:
    // the seat is still the champion's, and beating whoever wandered
    // into it is not beating the league
    const legend = snapshot.getLegend(cell);

    if (legend != null) {
      return LEGEND_HONORS[legend];
    }

    const champion = snapshot.getChampion(cell);

    return champion == null ? null : CHAMPION_TITLES[champion];
  }
  return null;
}
