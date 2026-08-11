import 'server-only';
import BattleOutcome from '../auth/battle-outcome';
import {
  BATTLE_COLLECTION,
  CAUGHT_COLLECTION,
  RAID_COLLECTION,
  RAID_REWARD_COLLECTION,
  TEAM_COLLECTION,
  TEAM_SNAPSHOT_COLLECTION,
} from '../auth/collections';
import { type CatchSnapshot, createCatchSnapshot } from '../auth/catch-snapshot';
import BATTLE_TIMEOUT from '../auth/battle-lock';
import { asOffset, toLocalTime } from '../auth/local-time';
import { asCaughtPokemon } from '../auth/caught-record';
import { isFainted } from '../auth/health';

import type { EncounterRecord } from '../auth/encounter-record';
import {
  RaidAction,
  RaidKind,
  type RaidRecord,
  type RaidView,
  asRaidRecord,
  deriveRaidReward,
  mythicalRaidId,
  raidId,
} from '../auth/raid-record';
import { TEAM_SIZE } from '../auth/teams';
import ChunkSnapshot from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { EncounterType } from '../overworld/encounter';
import {
  BOSS_ALLIANCE,
  LEGENDARY_RAID_GOLD,
  LEGENDARY_RAID_REWARD_LEVEL,
  MYTHICAL_RAID_GOLD,
  MYTHICAL_RAID_REWARD_LEVEL,
  PLAYER_ALLIANCE,
  SHADOW_RAID_GOLD,
  SHADOW_RAID_REWARD_LEVEL,
  createRaidBossSnapshot,
} from '../overworld/raid';
import AleaRNG from '../core/alea';
import type { Items } from '../data/ids/items';
import { getRaidSpecies } from '../data/items/raid-items';
import createOverworld from '../overworld/setup';
import resolveBuddy from './buddy';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import Biome from '../data/ids/biome';
import { getSpeciesLair } from '../data/overworld/lair';
import { getAdminFirestore } from './firebase';
import { consumeItem } from './inventory';
import { isAnyCatchLocked, isCatchLocked, lockFields, releaseBattleLocks } from './locks';
import { asNumber, asString, asStringArray, docData } from './read';
import { hasAnyCaught } from './caught';
import { startEncounter } from './overworld';
import { grantGold } from './profile';

/**
 * What each kind of lobby pays, hands over, and records itself as
 */
const RAID_GOLD: Record<RaidKind, number> = {
  [RaidKind.Legendary]: LEGENDARY_RAID_GOLD,
  [RaidKind.Shadow]: SHADOW_RAID_GOLD,
  [RaidKind.Mythical]: MYTHICAL_RAID_GOLD,
};

const RAID_REWARD_LEVELS: Record<RaidKind, number> = {
  [RaidKind.Legendary]: LEGENDARY_RAID_REWARD_LEVEL,
  [RaidKind.Shadow]: SHADOW_RAID_REWARD_LEVEL,
  [RaidKind.Mythical]: MYTHICAL_RAID_REWARD_LEVEL,
};

const RAID_ENCOUNTER_TYPES: Record<RaidKind, EncounterType> = {
  [RaidKind.Legendary]: EncounterType.LegendaryRaid,
  [RaidKind.Shadow]: EncounterType.ShadowRaid,
  [RaidKind.Mythical]: EncounterType.MythicalRaid,
};

/**
 * A stored outcome, restored as the enum the rest of the code
 * compares against
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asOutcome = (value: unknown): BattleOutcome => asNumber(value) as BattleOutcome;

/**
 * Raids, written with admin credentials. A raid decides who is owed a
 * legendary, so the three writes that settle one — starting it,
 * clearing it, and collecting from it — are checked here rather than
 * reported by whoever fought
 */

/**
 * How long an unsettled raid battle holds its landmark: the same
 * window that decides how long it holds its party
 * ([`src/server/locks.ts`](./locks.ts)). A fight is over in minutes;
 * one still unfinished after this was walked out on, and an abandoned
 * party is not a beaten boss
 */
export const RAID_BATTLE_TIMEOUT = BATTLE_TIMEOUT;

/**
 * Whether a stored battle ended without the boss going down — lost
 * outright, or abandoned long enough that nobody is coming back to
 * settle it. A raid that was won never reaches here: clearing it
 * shuts the landmark first
 */
function isBattleLost(battle: Record<string, unknown> | null, now: number): boolean {
  if (battle == null) {
    return true;
  }
  if (asOutcome(battle.outcome) === BattleOutcome.Unfinished) {
    return now - asNumber(battle.startedAt) >= RAID_BATTLE_TIMEOUT;
  }
  return asOutcome(battle.outcome) !== BattleOutcome.Won;
}

/**
 * The same question, read inside the transaction that acts on the
 * answer
 */
async function isRaidLost(
  transaction: FirebaseFirestore.Transaction,
  battleId: string,
  now: number,
): Promise<boolean> {
  return isBattleLost(
    docData(await transaction.get(getAdminFirestore().collection(BATTLE_COLLECTION).doc(battleId))),
    now,
  );
}

/**
 * Look at a lair without staging anything.
 *
 * What is at the cell, and what this player may do about it, are read
 * the same way `enterRaid` decides them — so the button the dialog
 * shows is the one that will actually be honoured when it is pressed.
 * Nothing is written: a player who walks up to a lair and thinks
 * better of it leaves no lobby standing behind them.
 *
 * Resolves what is there, or null when the cell stages no raid this
 * window, its raid has been cleared, or there is nothing standing and
 * this player has no pokemon to stage one with
 */
export async function peekRaid(
  uid: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
  now: number,
  offset: number,
): Promise<RaidView | null> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  const roll =
    kind === RaidKind.Shadow
      ? snapshot.getShadowLairs().get(cell)
      : snapshot.getLegendaryLairs().get(cell);

  if (roll == null) {
    return null;
  }

  const db = getAdminFirestore();
  const lobby = raidId(chunk, snapshot.raidTimestamp, cell, kind, zone);
  const stored = docData(await db.collection(RAID_COLLECTION).doc(lobby).get());
  const existing = stored == null ? null : asRaidRecord(stored);

  // The boss has been met; the landmark is shut until the window turns
  if (existing?.cleared === true) {
    return null;
  }

  const staging = await hasAnyCaught(uid);
  // A lobby that has not started is one a party can still be brought
  // to
  const gathering = existing != null && existing.battle == null;
  // A landmark with nothing standing, or with a party that failed at
  // it, is one to stage rather than to join
  const open =
    existing == null ||
    (existing.battle != null &&
      isBattleLost(
        docData(await db.collection(BATTLE_COLLECTION).doc(existing.battle).get()),
        now,
      ));

  // Nothing is standing and they have nothing to stage it with, so
  // there is not even anything to watch
  if (open && !staging && existing == null) {
    return null;
  }

  // One thing is on offer at a time: a lair to stage, a lobby to
  // bring a party to, or something to watch — which is what is left
  // for a player with nothing to field, and for anybody once the
  // fight has started
  let action = RaidAction.Spectate;

  if (staging && open) {
    action = RaidAction.Host;
  } else if (staging && gathering) {
    action = RaidAction.Join;
  }

  return {
    lobby,
    action,
    kind,
    lair: existing?.lair ?? roll.lair,
    biome: chunk.biome,
    species: existing?.species ?? roll.species,
    battle: existing?.battle ?? null,
    teams: existing?.teams.length ?? 0,
  };
}

/**
 * Walk into a raid landmark. The lobby id is derived from the chunk,
 * the raid window, the cell and the kind, and the roll behind it comes
 * from the chunk's own seed against the server's clock — so what is
 * staged there is what the world staged, not what the caller says.
 *
 * The first arrival of the window opens the lobby and hosts it, and
 * everyone after adopts what is already standing. The window gives the
 * boss one defeat, not one fight: a raid the party lost — or walked
 * out on — leaves the landmark open for the next arrival to restage
 * against the same roll. Only beating the boss shuts the cell.
 *
 * A player with no pokemon of their own stages nothing; they take
 * whatever lobby is standing, as a spectator.
 *
 * Resolves the lobby id and its record, or null when the cell stages
 * no raid this window, its raid has been cleared, or there is nothing
 * standing for a spectator to watch
 */
export async function enterRaid(
  uid: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
  now: number,
  offset: number,
): Promise<[string, RaidRecord] | null> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  const roll =
    kind === RaidKind.Shadow
      ? snapshot.getShadowLairs().get(cell)
      : snapshot.getLegendaryLairs().get(cell);

  if (roll == null) {
    return null;
  }

  const db = getAdminFirestore();
  const id = raidId(chunk, snapshot.raidTimestamp, cell, kind, zone);
  const staging = await hasAnyCaught(uid);

  // One landmark stages one raid at a time: the read and the create
  // share a transaction, so two players walking in together cannot
  // each open their own
  return db.runTransaction(async (transaction) => {
    const ref = db.collection(RAID_COLLECTION).doc(id);
    const stored = docData(await transaction.get(ref));
    const existing = stored == null ? null : asRaidRecord(stored);

    const fresh: RaidRecord = {
      kind,
      // What the raid is called after: the lair it stands in, or the
      // biome it stands on when a shadow reached for a rare species
      lair: roll.lair,
      species: roll.species,
      traitValue: roll.traitValue,
      host: uid,
      teams: [],
      battle: null,
      timestamp: snapshot.raidTimestamp,
      offset: zone,
      chunk: { seed: chunk.seed, x: chunk.x, y: chunk.y },
      biome: chunk.biome,
      cell,
      cleared: false,
    };

    if (existing != null) {
      // A cleared lobby stays shut until the window turns over and the
      // landmark rolls a new raid: the boss has been met
      if (existing.cleared) {
        return null;
      }
      // A raid still gathering, or one being fought right now, is
      // what the arrival walks into
      if (existing.battle == null || !(await isRaidLost(transaction, existing.battle, now))) {
        return [id, existing];
      }
      // The boss survived, so the landmark is open again. A spectator
      // restages nothing and watches the fight that failed
      if (!staging) {
        return [id, existing];
      }
      transaction.set(ref, fresh);
      return [id, fresh];
    }

    if (!staging) {
      return null;
    }
    transaction.set(ref, fresh);
    return [id, fresh];
  });
}

/**
 * Open a mythical raid with a raid item. The relic names the species
 * — the world never stages a mythical of its own — and it is **spent
 * in the calling**: the stack comes down by one before the lobby is
 * written, so a mythical is fought once whether the boss goes down or
 * walks away. Nothing restages it, unlike a landmark raid a party
 * failed.
 *
 * The lobby stands where the player was standing, for the window they
 * were standing there in, and is joinable by anyone the way any other
 * lobby is.
 *
 * Resolves the lobby id and its record, or null when the item calls
 * nothing, is not carried, or has already been spent on this window's
 * lobby
 */
export async function hostMythicalRaid(
  uid: string,
  x: number,
  y: number,
  item: Items,
  now: number,
  offset: number,
): Promise<[string, RaidRecord] | null> {
  const species = getRaidSpecies(item);

  if (species == null) {
    return null;
  }

  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const snapshot = new ChunkSnapshot(chunk, toLocalTime(now, zone), zone);
  const db = getAdminFirestore();
  const id = mythicalRaidId(chunk, snapshot.raidTimestamp, item, uid, zone);
  const ref = db.collection(RAID_COLLECTION).doc(id);
  const stored = docData(await ref.get());

  // The relic was already spent on this window's lobby: whatever became
  // of it — gathering, fought, lost — is what there is
  if (stored != null) {
    const existing = asRaidRecord(stored);

    return existing.cleared ? null : [id, existing];
  }
  // A player with nothing of their own cannot host: an empty lobby
  // would spend the relic on a raid nobody can start
  if (!(await hasAnyCaught(uid))) {
    return null;
  }
  // Spent before the lobby exists, so a relic can never open two
  if (!(await consumeItem(uid, item))) {
    return null;
  }

  // The boss' nature and ability come from the lobby itself, so every
  // player who joins fights the same mythical
  const fresh: RaidRecord = {
    kind: RaidKind.Mythical,
    // The relic calls the mythical out to the place it has always
    // been called from, whatever ground the player is standing on —
    // which is nowhere the world contains
    lair: getSpeciesLair(species),
    species,
    traitValue: new AleaRNG(`${id}:mythical`).int32(),
    host: uid,
    teams: [],
    battle: null,
    timestamp: snapshot.raidTimestamp,
    offset: zone,
    chunk: { seed: chunk.seed, x: chunk.x, y: chunk.y },
    biome: Biome.Beyond,
    // A mythical stands on no landmark cell
    cell: -1,
    cleared: false,
  };

  await ref.set(fresh);
  return [id, fresh];
}

/**
 * Walk out of a lobby: the player's teams come out with them, so a
 * raid they left does not start with their party in it. Only their
 * own teams are pulled — the team documents name their owner — and a
 * started raid is already frozen into snapshots, so it is left alone
 */
export async function leaveRaid(uid: string, lobby: string): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.collection(RAID_COLLECTION).doc(lobby);

  await db.runTransaction(async (transaction) => {
    const raid = docData(await transaction.get(ref));

    if (raid == null || raid.battle != null) {
      return;
    }

    const ids = asStringArray(raid.teams);

    if (ids.length === 0) {
      return;
    }

    const teams = await transaction.getAll(
      ...ids.map((id) => db.collection(TEAM_COLLECTION).doc(id)),
    );
    const mine = new Set(
      teams.filter((entry) => docData(entry)?.player === uid).map((entry) => entry.id),
    );

    if (mine.size === 0) {
      return;
    }
    transaction.update(ref, { teams: ids.filter((id) => !mine.has(id)) });
  });
}

/**
 * Whether any of the catches is already queued in a lobby. A team
 * names the raid it joined, so the player's own teams are enough to
 * answer it: a team still listed by a raid that has not started is a
 * party waiting to fight, and what it holds is spoken for.
 *
 * Teams of raids that have started, been cleared, or dropped the team
 * on the way out do not count — those pokemon are free (or locked,
 * which is a different question)
 */
export async function isAnyCatchQueued(uid: string, catches: string[]): Promise<boolean> {
  const db = getAdminFirestore();
  const teams = await db
    .collection(TEAM_COLLECTION)
    .where('player', '==', uid)
    .where('catches', 'array-contains-any', catches)
    .get();

  // A team written before teams named their raid has nothing to check
  // against, and its raid is long over either way
  const joined = teams.docs
    .map((entry) => ({ team: entry.id, lobby: asString(docData(entry)?.raid) }))
    .filter((entry) => entry.lobby !== '');

  if (joined.length === 0) {
    return false;
  }

  const ids = [...new Set(joined.map((entry) => entry.lobby))];
  const lobbies = await db.getAll(...ids.map((id) => db.collection(RAID_COLLECTION).doc(id)));
  const waiting = new Set<string>();

  for (const entry of lobbies) {
    const raid = docData(entry);

    if (raid != null && raid.battle == null && raid.cleared !== true) {
      for (const team of asStringArray(raid.teams)) {
        waiting.add(team);
      }
    }
  }

  return joined.some((entry) => waiting.has(entry.team));
}

/**
 * Bring a party into a lobby. The catch ids are checked against their
 * owners, so a party cannot field pokemon the player does not own, no
 * catch can be listed twice, none of them may already be fighting or
 * waiting in another lobby, and none of them may be fainted.
 *
 * The freeze at the start of the fight would drop a fainted pokemon
 * anyway; refusing here is so a player finds out while they can still
 * do something about it. Resolves the team id, or null when the party
 * is not a legal one or the raid has started
 */
export async function joinRaid(
  uid: string,
  lobby: string,
  catches: string[],
): Promise<string | null> {
  const db = getAdminFirestore();
  const raid = docData(await db.collection(RAID_COLLECTION).doc(lobby).get());

  if (raid == null || raid.battle != null) {
    return null;
  }
  if (catches.length === 0 || catches.length > TEAM_SIZE) {
    return null;
  }
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const owned = await db.getAll(...catches.map((id) => db.collection(CAUGHT_COLLECTION).doc(id)));

  if (!owned.every((entry) => docData(entry)?.owner === uid)) {
    return null;
  }
  // A pokemon already fighting elsewhere cannot be brought along: one
  // catch, one live battle
  if (isAnyCatchLocked(owned.map((entry) => docData(entry)))) {
    return null;
  }
  // Nor one that is down. Nothing revives on its own, so it is a
  // berry or a level before that pokemon fights again
  if (owned.some((entry) => isFainted(asCaughtPokemon(docData(entry))))) {
    return null;
  }
  // Nor one its owner has put away. A guarded pokemon is not to be
  // disturbed, and a raid is the loudest thing that could happen to it
  if (owned.some((entry) => isGuardedRecord(docData(entry) ?? {}))) {
    return null;
  }
  // Nor one already waiting in another lobby, or in this one: a party
  // that queues the same pokemon twice would have it dropped from
  // whichever raid started second, without ever being told
  if (await isAnyCatchQueued(uid, catches)) {
    return null;
  }

  const team = db.collection(TEAM_COLLECTION).doc();

  await team.set({ player: uid, raid: lobby, catches });
  await db
    .collection(RAID_COLLECTION)
    .doc(lobby)
    .update({ teams: [...asStringArray(raid.teams), team.id] });

  return team.id;
}

/**
 * Freeze one team for the battle, dropping catches that have vanished,
 * changed hands, fainted or are already fighting somewhere else, and lock what
 * it fields into that battle. The
 * freeze and the lock share a transaction, so an item cannot be
 * handed back in the moment between them — the snapshot the fight
 * runs on and the record it came from stay the same pokemon. The lock
 * is stamped with the battle's `startedAt`, which is what lets the
 * fight release its own party and nobody else's.
 *
 * Resolves the snapshot id, or null when the team fields nothing — an
 * empty side must not stand in a battle
 */
export async function publishTeamSnapshot(
  player: string,
  catches: string[],
  alliance: number,
  startedAt: number,
): Promise<string | null> {
  if (catches.length === 0) {
    return null;
  }

  const db = getAdminFirestore();
  const ref = db.collection(TEAM_SNAPSHOT_COLLECTION).doc();

  return db.runTransaction(async (transaction) => {
    const refs = catches.map((id) => db.collection(CAUGHT_COLLECTION).doc(id));
    const stored = await transaction.getAll(...refs);
    const fielded: CatchSnapshot[] = [];
    const locking: FirebaseFirestore.DocumentReference[] = [];

    for (const [at, entry] of stored.entries()) {
      const data = docData(entry);

      // A pokemon already fighting is left behind rather than fielded
      // twice: a player may sit in two lobbies with the same party,
      // and the first raid to start is the one that gets it. An egg
      // is left behind for good — there is nothing in it to fight
      // with until it hatches — and so is a pokemon that is down,
      // which has to be healed before it fights again
      if (
        data?.owner === player &&
        !isCatchLocked(data) &&
        !isEggRecord(data) &&
        !isGuardedRecord(data) &&
        !isFainted(asCaughtPokemon(data))
      ) {
        fielded.push(createCatchSnapshot(entry.id, asCaughtPokemon(data)));
        locking.push(refs[at]);
      }
    }

    if (fielded.length === 0) {
      return null;
    }

    transaction.set(ref, { player, alliance, catches: fielded });
    for (const caught of locking) {
      transaction.update(caught, lockFields(startedAt));
    }
    return ref.id;
  });
}

/**
 * Start the raid: every joined team is frozen, the boss gets a
 * snapshot of its own, and the pair of alliances becomes a battle.
 * Only the host may start, and only once — the battle id is written
 * back inside a transaction, so a second start finds it taken
 */
export async function startRaid(uid: string, lobby: string, now: number): Promise<string | null> {
  const db = getAdminFirestore();
  const raidRef = db.collection(RAID_COLLECTION).doc(lobby);
  const stored = docData(await raidRef.get());

  if (stored == null) {
    return null;
  }

  const raid: RaidRecord = asRaidRecord(stored);

  if (raid.host !== uid || raid.battle != null || raid.teams.length === 0) {
    return null;
  }

  // The raid is claimed before anything is frozen, since freezing
  // locks the parties: a start that loses the race must not hold
  // pokemon for a battle it is not going to run. A claim whose teams
  // then field nothing leaves the raid pointing at a battle that was
  // never written, which reads as lost and restages
  const battle = db.collection(BATTLE_COLLECTION).doc();
  const claimed = await db.runTransaction(async (transaction) => {
    const current = docData(await transaction.get(raidRef));

    if (current == null || current.battle != null) {
      return false;
    }
    transaction.update(raidRef, { battle: battle.id });
    return true;
  });

  if (!claimed) {
    const current = docData(await raidRef.get())?.battle;

    return typeof current === 'string' ? current : null;
  }

  const teams = await db.getAll(...raid.teams.map((id) => db.collection(TEAM_COLLECTION).doc(id)));
  const fielded: [string, string][] = [];

  for (const entry of teams) {
    const team = docData(entry);

    if (team == null) {
      continue;
    }

    const player = asString(team.player);
    const snapshot = await publishTeamSnapshot(
      player,
      asStringArray(team.catches),
      PLAYER_ALLIANCE,
      now,
    );

    if (snapshot != null) {
      fielded.push([player, snapshot]);
    }
  }

  if (fielded.length === 0) {
    return null;
  }

  // The boss stands alone: one perfect-IV catch snapshot, no owner
  const boss = db.collection(TEAM_SNAPSHOT_COLLECTION).doc();

  await boss.set({
    player: '',
    alliance: BOSS_ALLIANCE,
    catches: [createRaidBossSnapshot(raid.species, raid.traitValue, raid.kind === RaidKind.Shadow)],
  });

  await battle.set({
    teams: [boss.id, ...fielded.map(([, snapshot]) => snapshot)],
    players: [...new Set(fielded.map(([player]) => player))],
    raid: lobby,
    species: raid.species,
    outcome: BattleOutcome.Unfinished,
    startedAt: now,
  });

  return battle.id;
}

/**
 * Record how a battle ended. Only a player who fielded a team may
 * report it, and only once: an outcome already stamped stands, so the
 * first honest report cannot be overwritten by a later one.
 *
 * The end of the fight is also what frees its party — every catch it
 * froze goes back to being editable. A battle nobody ever reports
 * releases its own by timing out instead
 */
export async function finishBattle(
  uid: string,
  battleId: string,
  outcome: BattleOutcome,
): Promise<boolean> {
  const db = getAdminFirestore();
  const ref = db.collection(BATTLE_COLLECTION).doc(battleId);
  const stamped = await db.runTransaction(async (transaction) => {
    const battle = docData(await transaction.get(ref));

    if (battle == null || !new Set(asStringArray(battle.players)).has(uid)) {
      return false;
    }
    if (asOutcome(battle.outcome) !== BattleOutcome.Unfinished) {
      return false;
    }
    transaction.update(ref, { outcome });
    return true;
  });

  if (stamped) {
    await releaseBattleLocks(battleId);
  }
  return stamped;
}

/**
 * Shut a raid's landmark for the rest of the window. Only a raid whose
 * battle is recorded as won can be cleared, so a player cannot close
 * a landmark by claiming a victory that never happened
 */
export async function clearRaid(uid: string, lobby: string): Promise<boolean> {
  const db = getAdminFirestore();
  const raidRef = db.collection(RAID_COLLECTION).doc(lobby);
  const battleId = docData(await raidRef.get())?.battle;

  if (typeof battleId !== 'string') {
    return false;
  }

  const battle = docData(await db.collection(BATTLE_COLLECTION).doc(battleId).get());

  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !new Set(asStringArray(battle.players)).has(uid)
  ) {
    return false;
  }
  await raidRef.update({ cleared: true });
  return true;
}

/**
 * What a cleared raid owes one fighter: the legendary waiting for
 * them, and the purse that came with it
 */
export interface RaidReward {
  encounter: EncounterRecord;
  gold: number;
}

/**
 * Collect what a cleared raid owes. The claim marker at
 * raidRewards/{raidId}:{uid} guards it, so the raid pays each fighter
 * once however late they come back for it — the gold and the pokemon
 * ride the same marker, so neither can be collected twice. The
 * encounter is derived against the raid's own chunk and window, not
 * wherever the player is standing now
 */
export async function claimRaidReward(uid: string, lobby: string): Promise<RaidReward | null> {
  const db = getAdminFirestore();
  const stored = docData(await db.collection(RAID_COLLECTION).doc(lobby).get());

  if (stored == null) {
    return null;
  }

  const raid: RaidRecord = asRaidRecord(stored);

  if (raid.battle == null) {
    return null;
  }

  const battle = docData(await db.collection(BATTLE_COLLECTION).doc(raid.battle).get());

  // Only the players who actually fielded a team are owed anything,
  // and only from a raid that was won
  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !new Set(asStringArray(battle.players)).has(uid)
  ) {
    return null;
  }

  const shadow = raid.kind === RaidKind.Shadow;
  // What the boss is worth, and then what the claimant brought along:
  // a buddy burning a Luck Incense doubles the purse
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const gold = overworld.checkGoldReward(lobby, RAID_GOLD[raid.kind]);
  const ref = db.collection(RAID_REWARD_COLLECTION).doc(`${lobby}:${uid}`);
  const claimed = await db.runTransaction(async (transaction) => {
    if ((await transaction.get(ref)).exists) {
      return false;
    }
    transaction.set(ref, { player: uid, raid: lobby, gold });
    return true;
  });

  if (!claimed) {
    return null;
  }
  await grantGold(uid, gold);

  const chunk = getWorld().getChunk(raid.chunk.x, raid.chunk.y);
  // The raid's own window and zone, not wherever the claimant is now
  const snapshot = new ChunkSnapshot(chunk, raid.timestamp, raid.offset);
  const [spawnId, spawn] = deriveRaidReward(raid, lobby, uid);
  const encounter = await startEncounter(uid, snapshot, spawnId, spawn, {
    // The three raids hand over different prizes, so a catch says
    // which lobby it came out of
    type: RAID_ENCOUNTER_TYPES[raid.kind],
    shadow,
    // The prize remembers the place it was won in — and a mythical
    // remembers that the place was nowhere on the map
    lair: raid.lair,
    biome: raid.kind === RaidKind.Mythical ? Biome.Beyond : undefined,
    level: RAID_REWARD_LEVELS[raid.kind],
  });

  return { encounter, gold };
}
