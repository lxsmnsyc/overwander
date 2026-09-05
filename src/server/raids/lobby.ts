import 'server-only';
import { asOffset, toLocalTime } from '../../auth/local-time';
import {
  RaidAction,
  RaidKind,
  type RaidRecord,
  type RaidView,
  asRaidRecord,
  mythicalRaidId,
  raidId,
} from '../../auth/raid-record';
import ChunkSnapshot from '../../overworld/chunk-snapshot';
import getWorld from '../../overworld/current';
import AleaRNG from '../../core/alea';
import type { Items } from '../../data/ids/items';
import { getRaidSpecies } from '../../data/items/raid-items';
import Biome from '../../data/ids/biome';
import { getSpeciesLair } from '../../data/overworld/lair';
import { getSql, tx } from '../db';
import { readBattle, readRaid, readRaidIn, writeRaid } from '../raid-io';
import { consumeItem } from '../inventory';
import { asString } from '../read';
import { hasAnyCaught } from '../caught';
import { isBattleLost, isRaidLost } from './outcome';

/**
 * The lobby itself: looking at one, opening one, leaving one, and
 * watching one from outside
 */
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

  const lobby = raidId(chunk, snapshot.raidTimestamp, cell, kind, zone);
  const stored = await readRaid(lobby);
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
    (existing.battle != null && isBattleLost(await readBattle(existing.battle), now));

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
 * Walk into a raid landmark. The lobby id and the roll behind it are
 * derived from the chunk seed and the window, so what is staged is
 * what the world staged rather than what the caller says.
 *
 * The window gives the boss one **defeat**, not one fight: a raid lost
 * or walked out on restages against the same roll for the next
 * arrival, and only beating the boss shuts the cell. A player who owns
 * no pokemon stages nothing and watches whatever is standing.
 *
 * Resolves the lobby id and its record, or null when the cell stages
 * no raid this window, its raid has been cleared, or there is nothing
 * for a spectator to watch
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

  const id = raidId(chunk, snapshot.raidTimestamp, cell, kind, zone);
  const staging = await hasAnyCaught(uid);

  // One landmark stages one raid at a time: the row lock is what
  // keeps two players walking in together from each opening their own
  return tx(async (transaction) => {
    const stored = await readRaidIn(transaction, id);
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
      if (existing.battle == null || !(await isRaidLost(existing.battle, now))) {
        return [id, existing];
      }
      // The boss survived, so the landmark is open again. A spectator
      // restages nothing and watches the fight that failed
      if (!staging) {
        return [id, existing];
      }
      await writeRaid(transaction, id, fresh);
      return [id, fresh];
    }

    if (!staging) {
      return null;
    }
    await writeRaid(transaction, id, fresh);
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
  const id = mythicalRaidId(chunk, snapshot.raidTimestamp, item, uid, zone);
  const stored = await readRaid(id);

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

  await tx(async (transaction) => writeRaid(transaction, id, fresh));
  return [id, fresh];
}

/**
 * Walk out of a lobby: the player's teams come out with them, so a
 * raid they left does not start with their party in it. Only their
 * own teams are pulled, since a team row names its owner, and a
 * started raid is already frozen into snapshots, so it is left alone.
 *
 * A lobby nobody is left in is taken down rather than left standing.
 * It was left standing, and it was a lobby in every listing and a lair
 * that could not be hosted again — most often opened by somebody who
 * pressed Host, saw what was in there and walked out again without
 * ever forming a team, which left a raid nobody had joined sitting in
 * the world until the window turned over.
 *
 * A **cleared** lobby is the one empty one that stays: it is the
 * record of the boss having been met, and it is what keeps the
 * landmark shut for the rest of the window
 */
export async function leaveRaid(uid: string, lobby: string): Promise<void> {
  await tx(async (transaction) => {
    // Whatever else they were doing in there, they are no longer
    // standing in it
    await transaction`
      delete from raid_watchers where raid_id = ${lobby} and player = ${uid}
    `;

    const raid = await readRaidIn(transaction, lobby);

    if (raid == null || raid.battle != null) {
      return;
    }

    const record = asRaidRecord(raid);
    const rows = await transaction`
      select id, player from teams where raid_id = ${lobby}
    `;
    const mine = new Set(
      rows.filter((entry) => entry.player === uid).map((entry) => asString(entry.id)),
    );
    const left = rows.filter((entry) => !mine.has(asString(entry.id)));

    // The last party out shuts the door behind it, and so does a host
    // who never formed one.
    //
    // Whether the leaver had anything in there is the whole of the
    // condition. Without it, a **spectator** walking out of somebody
    // else's freshly opened lobby would take it down with them: they
    // hold no team, so the teams left behind are the same empty list
    // either way, and the door would be shut on a host still standing
    // in the room
    if (left.length === 0 && !record.cleared && (mine.size > 0 || record.host === uid)) {
      await transaction`delete from raids where id = ${lobby}`;
      return;
    }
    if (mine.size === 0) {
      return;
    }
    await transaction`delete from teams where id = any(${[...mine]})`;
  });
}

/**
 * Stand in a lobby without a party.
 *
 * Watching was always allowed and never recorded, so the lobby could
 * not say who was in the room. The row is the player's own presence:
 * written on the way in, dropped by `leaveRaid` on the way out, and
 * taken by the cascade when the lobby goes
 */
export async function watchRaidLobby(uid: string, lobby: string, now: number): Promise<void> {
  await getSql()`
    insert into raid_watchers (raid_id, player, seen_at)
    values (${lobby}, ${uid}, ${now})
    on conflict (raid_id, player) do nothing
  `;
}

/**
 * Stop standing in it, without leaving the raid.
 *
 * `leaveRaid` is the way out of a lobby and takes the player's teams
 * with it. This is only the presence: the panel was shut, so they are
 * no longer in the room, but a party they brought is still in the
 * fight
 */
export async function unwatchRaidLobby(uid: string, lobby: string): Promise<void> {
  await getSql()`
    delete from raid_watchers where raid_id = ${lobby} and player = ${uid}
  `;
}
