import 'server-only';
import {
  Acquisition,
  asCaughtPokemon,
  asNickname,
  isAuctionableCatch,
} from '../auth/caught-record';
import { type EncounterRecord, asEncounterRecord } from '../auth/encounter-record';
import { getMaxHealth, needsCare } from '../auth/health';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  Slots,
  getSlots,
  packSlots,
} from '../data/constants/slots';
import Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import { Balls, ItemFlags } from '../data/ids/items';
import { getItemData } from '../data/items';
import { getSpeciesData } from '../data/species';
import createOverworld from '../overworld/setup';
import resolveBuddy, { resolveBuddyCatch } from './buddy';
import { grantCandy, grantCatchCandy } from './candy';
import { getCatchCandy } from '../auth/candy-rules';
import {
  asLocale,
  isEggRecord,
  isFavoriteRecord,
  isGuardedRecord,
  zeroEffortValues,
} from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { BASE_FRIENDSHIP, SHADOW_FRIENDSHIP } from '../data/constants/friendship';
import { getSql, newDocId, tx } from './db';
import { readEncounter } from './encounter-io';
import { recordCaughtSpecies } from './pokedex';
import { CANDY_STACKS, ITEM_STACKS } from '../auth/stacks';
import { readStackIn, spendStackIn, writeStackIn } from './stacks';
import { asOffset, toLocalISO, toLocalTime } from '../auth/local-time';
import { isCatchLocked } from './locks';
import { asNumber, asNumberArray } from './read';
import { retireSpawn } from './overworld';

/**
 * Catch records, written over the owner connection. A catch is the
 * most forgeable thing in the game (a client that could write one
 * would write itself a shiny level-100 legendary) so the record is
 * built here from the encounter the overworld actually staged, never
 * from what the caller describes
 */

/**
 * What a catch is holding, restored from the stored record
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asHeldItems = (value: unknown): Items[] => asNumberArray(value) as Items[];

/**
 * Whether the player owns any pokemon at all. A raid asks this of
 * everyone who walks in, and the answer is a yes or no, so it reads a
 * single row
 */
export async function hasAnyCaught(uid: string): Promise<boolean> {
  const rows = await getSql()`select 1 from caught where owner = ${uid} limit 1`;

  return rows.length > 0;
}

/**
 * Whether the player has a pokemon to spare, that is, more than the
 * one.
 *
 * Nothing may take somebody's last one. Releasing it or selling it
 * leaves a player who cannot join a raid, cannot answer a grunt and
 * cannot throw a ball at anything, which is not a decision so much as
 * a way of ending the game by accident.
 *
 * Two rows at most, since the question is "more than one" rather
 * than "how many"
 */
export async function hasSpareCatch(uid: string): Promise<boolean> {
  const rows = await getSql()`select 1 from caught where owner = ${uid} limit 2`;

  return rows.length > 1;
}

/**
 * Write one pokemon into a player's collection.
 *
 * Every way a pokemon arrives ends here, thrown at and caught or
 * handed over as a gift, because everything below the first three
 * lines is the same either way: what it rolled, what room it has,
 * what it is worth to somebody else, and the fact that it arrives
 * whole. What differs is the ball it is in and what the history says
 * it was, so those are asked for.
 *
 * `from` is the trainer it belonged to before this one, for a
 * distribution written as somebody else's pokemon ("owned by Red").
 * It is a name rather than an account: there is no such player, and
 * the entry is there so the sheet can say where the pokemon came from
 */
export async function writeCaughtRecord(
  uid: string,
  encounter: EncounterRecord,
  ball: Balls,
  kind: Acquisition,
  now: number,
  offset: number,
  locale: string,
  from = '',
): Promise<string> {
  const id = newDocId();
  const room =
    encounter.slots ?? packSlots(DEFAULT_ABILITY_SLOTS, DEFAULT_ITEM_SLOTS, DEFAULT_MOVE_SLOTS);
  // The instant is the server's, the calendar the owner's: the stamp
  // is written in their zone, and the species day is the day it was
  // where they were standing
  const zone = asOffset(offset);
  const caughtAt = toLocalISO(now, zone);
  const shadow = encounter.shadow;
  // Whatever it walks in with (the one it rolled, or the list a gift
  // was written with) plus Shadow for good where it came out of one
  const abilities = [
    ...new Set([
      ...(encounter.abilities ?? [encounter.ability]),
      ...(shadow ? [Abilities.Shadow] : []),
    ]),
  ];

  await tx(async (transaction) => {
    await transaction`
      insert into caught (
        id, owner, type, species, nickname, level, individual_value, trait_value,
        ivs, gender, nature, shiny, shadow, egg, favorite, guarded, traded,
        auctionable, slots, locked_at, steps, hatch_steps, stepped_at, health,
        statuses, lair, ball, caught_at_local, caught_at_offset, locale,
        effort_bonus, walked, friendship,
        origin_timestamp, origin_x, origin_y, origin_biome, origin_place
      ) values (
        ${id}, ${uid}, ${encounter.type}, ${encounter.species}, '',
        ${encounter.level}, ${encounter.individualValue}, ${encounter.traitValue},
        ${encounter.ivs}, ${encounter.gender}, ${encounter.nature},
        ${encounter.shiny}, ${shadow}, false, false, false, false,
        ${isAuctionableCatch(encounter)}, ${room}, 0, 0, 0, 0,
        ${getMaxHealth({
          species: encounter.species,
          level: encounter.level,
          ivs: encounter.ivs,
          effortValues: zeroEffortValues(),
        })},
        0, ${encounter.lair}, ${ball},
        ${new Date(toLocalTime(now, zone))}, ${zone}, ${asLocale(locale)},
        0, 0, ${shadow ? SHADOW_FRIENDSHIP : BASE_FRIENDSHIP},
        ${encounter.timestamp}, ${encounter.x}, ${encounter.y},
        ${encounter.biome}, ${encounter.place ?? null}
      )
    `;

    await updateCaughtIn(transaction, id, {
      // Cut to the room: a record that knew more moves than it has
      // slots for would be one the sheet could not draw
      moves: encounter.moves.slice(0, getSlots(room, Slots.Move)),
      movePoints: {},
      abilities,
      items: encounter.items.slice(0, getSlots(room, Slots.Item)),
      // The ball is on the entry as well as on the pokemon: this is
      // the one it arrived in, and a later owner may put it in another.
      // Whoever had it first holds no uid: nobody signs in as Red
      history: [
        ...(from === '' ? [] : [{ owner: '', name: from, acquiredAt: caughtAt, kind, ball }]),
        { owner: uid, acquiredAt: caughtAt, kind, ball },
      ],
    });
  });

  // Every arrival ends here, so this is the one place the dex has to
  // be told a pokemon became this player's. An egg is the exception
  // and writes its own record; it is logged when it hatches, since
  // what is in the shell is not something the player has met yet
  await recordCaughtSpecies(uid, encounter.species, encounter.shiny);
  return id;
}

/**
 * Record the catch of an encounter the player is already in. The
 * encounter is read from the server's own staged row, so the species,
 * level, IVs and shininess are the ones that were staged, whatever
 * the client believes.
 *
 * Every catch pays its family's candy, fourfold on the family's own
 * day, in the same call: the reward cannot be skipped or claimed
 * twice by a client that stops asking.
 *
 * Resolves the new catch id, or null when the player is not in that
 * encounter
 */
export async function recordCatch(
  uid: string,
  spawnId: string,
  ball: Balls,
  now: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  const stored = await readEncounter(spawnId, uid);

  if (stored == null) {
    return null;
  }

  const encounter = asEncounterRecord(stored);
  const zone = asOffset(offset);
  const id = await writeCaughtRecord(uid, encounter, ball, Acquisition.Caught, now, offset, locale);

  await grantCatchCandy(uid, encounter.species, toLocalTime(now, zone));

  // And then whatever the player was carrying when they caught it.
  // These are paid flat: the species day is already worth four times
  // the catch's own candy, and a bonus that multiplied with it would
  // make one day worth a week of them
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const family = getSpeciesData(encounter.species).family;

  for (const [owed, count] of overworld.checkCatchCandy(spawnId, family)) {
    await grantCandy(uid, owed, count);
  }
  await mendWithHealBall(uid, ball);
  // And it is not standing there any more, for this player. The spawn
  // belongs to the window and the window is everybody's, so it is
  // retired the same way one that ran off is: left in the world, left
  // out of what this player is shown
  await retireSpawn(uid, spawnId);

  return id;
}

/**
 * What a Heal Ball does here.
 *
 * The mainline ball mends what is caught in it, and here that is
 * already true of everything: an encounter is not a battle, so a
 * catch arrives whole however long it was fed and thrown at. What the
 * ball's field does have something to mend is the pokemon standing
 * beside the player, so that is where the healing goes.
 *
 * It is free and it is quiet: a buddy already whole is left alone
 * rather than written to, an egg has nothing to mend, and a buddy
 * locked into a live battle is left to fight it
 */
async function mendWithHealBall(uid: string, ball: Balls): Promise<void> {
  if (ball !== Balls.HealBall) {
    return;
  }

  const resolved = await resolveBuddyCatch(uid);

  if (resolved == null) {
    return;
  }

  const [catchId, stored] = resolved;

  if (isCatchLocked(stored) || isEggRecord(stored)) {
    return;
  }

  const buddy = asCaughtPokemon(stored);

  if (!needsCare(buddy)) {
    return;
  }
  await getSql()`
    update caught set health = ${getMaxHealth(buddy)}, statuses = 0
    where id = ${catchId}
  `;
}

/**
 * Set or clear one of the two marks a player sets themselves.
 *
 * A **favorite** cannot be released, auctioned or traded; a
 * **guarded** pokemon cannot be bred, groomed, fielded, healed,
 * purified or have an item spent on it. Neither is a rule about the
 * pokemon; both are the player saying what they want left alone, so
 * both come off exactly the way they went on.
 *
 * Refused while the pokemon is fighting, the way every other edit to
 * a live record is. Resolves what the mark now is, or null when it
 * was refused
 */
async function setCatchMark(
  uid: string,
  catchId: string,
  field: 'favorite' | 'guarded',
  on: boolean,
): Promise<boolean | null> {
  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
      return null;
    }
    await updateCaughtIn(transaction, catchId, { [field]: on });
    return on;
  });
}

/**
 * Name one of the player's pokemon, or take its name back off.
 *
 * The name is cleaned by the server rather than trusted from the
 * caller, so nothing arrives on a record that the sheet cannot draw:
 * no control characters, no run of spaces standing in for a name,
 * nothing longer than the limit. A name that cleans to nothing clears
 * the field, and the pokemon goes back to being called whatever its
 * species is called.
 *
 * A **guarded** pokemon may still be named. What guarding protects is
 * everything that changes what a pokemon *is*, and what somebody
 * calls it is not among them. A **fighting** one may not, for the
 * ordinary reason: its record is held while the battle runs on a
 * snapshot of it.
 *
 * Resolves the name as it now stands, or null when the catch is not
 * the user's or is fighting
 */
export async function setNickname(
  uid: string,
  catchId: string,
  nickname: string,
): Promise<string | null> {
  const named = asNickname(nickname);

  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
      return null;
    }
    await updateCaughtIn(transaction, catchId, { nickname: named });
    return named;
  });
}

/**
 * Mark one of the player's catches as one they are keeping, or take
 * the mark off
 */
export async function setFavorite(
  uid: string,
  catchId: string,
  favorite: boolean,
): Promise<boolean | null> {
  return setCatchMark(uid, catchId, 'favorite', favorite);
}

/**
 * Put one of the player's catches away, or take it back out
 */
export async function setGuarded(
  uid: string,
  catchId: string,
  guarded: boolean,
): Promise<boolean | null> {
  return setCatchMark(uid, catchId, 'guarded', guarded);
}

/**
 * Hand an item from the bag to one of the player's catches. The stack
 * and the catch move in one transaction, so an item is never in both
 * places or neither. Resolves false when the catch is not theirs, the
 * item is not carried, the catch already holds its limit, or the item
 * is not holdable
 */
export async function giveItem(uid: string, catchId: string, item: Items): Promise<boolean> {
  if ((getItemData(item).flags & ItemFlags.Holdable) === 0) {
    return false;
  }

  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    // An egg has no hands: nothing is handed to one until it hatches.
    // A locked one has hands and may already be holding something; it
    // is simply not to be reached into either way
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return false;
    }

    const held = asHeldItems(caught.items);

    // How much room it has is the record's own answer: a pokemon that
    // has been given a second hand is not the one the constant knows
    // about
    if (held.length >= getSlots(asNumber(caught.slots), Slots.Item)) {
      return false;
    }

    const carried = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (!(await spendStackIn(transaction, ITEM_STACKS, uid, item, carried))) {
      return false;
    }
    await updateCaughtIn(transaction, catchId, { items: [...held, item] });
    return true;
  });
}

/**
 * Take a held item back into the bag. Resolves false when the catch
 * is not the player's or is not holding that item
 */
export async function takeItem(uid: string, catchId: string, item: Items): Promise<boolean> {
  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    // Taking one back is refused for a locked pokemon as much as
    // handing one over: what it is holding is part of how it was put
    // away
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isGuardedRecord(caught)
    ) {
      return false;
    }

    const held = asHeldItems(caught.items);
    const index = held.indexOf(item);

    if (index < 0) {
      return false;
    }

    const carried = await readStackIn(transaction, ITEM_STACKS, uid, item);

    // Only the one copy comes off, so a future stack of duplicates
    // still gives back exactly what it took
    await updateCaughtIn(transaction, catchId, { items: held.filter((_, at) => at !== index) });
    await writeStackIn(transaction, ITEM_STACKS, uid, item, carried + 1);
    return true;
  });
}

/**
 * Let a pokemon go. The row is deleted outright rather than flagged:
 * a released pokemon is gone, and nothing in the game reads a catch
 * it no longer owns.
 *
 * Whatever it was holding goes back to the bag in the same
 * transaction (the item was the player's, not the pokemon's), and its
 * family's candy is paid once more as it goes. The buddy field clears
 * itself: it is a foreign key that nulls on delete.
 *
 * A **favorite** is refused. Releasing cannot be undone, and the flag
 * is there for exactly this. So is the **last** one, whatever it is:
 * see `hasSpareCatch`.
 *
 * Resolves false when the catch is not the player's, is fighting, is
 * a favorite, or is the only pokemon they have
 */
export async function releaseCatch(uid: string, catchId: string): Promise<boolean> {
  if (!(await hasSpareCatch(uid))) {
    return false;
  }

  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isFavoriteRecord(caught)
    ) {
      return false;
    }

    // One copy back per copy held: two of the same item share a
    // stack, and giving them back one write at a time would clobber
    const returning = new Map<Items, number>();

    for (const item of asHeldItems(caught.items)) {
      returning.set(item, (returning.get(item) ?? 0) + 1);
    }

    // What the pokemon was worth meeting, paid once more as it goes
    const record = asCaughtPokemon(caught);
    const { family } = getSpeciesData(record.species);

    for (const [item, count] of returning) {
      const carried = await readStackIn(transaction, ITEM_STACKS, uid, item);

      await writeStackIn(transaction, ITEM_STACKS, uid, item, carried + count);
    }

    const candies = await readStackIn(transaction, CANDY_STACKS, uid, family);

    await writeStackIn(
      transaction,
      CANDY_STACKS,
      uid,
      family,
      candies + getCatchCandy(record.species),
    );
    await transaction`delete from caught where id = ${catchId}`;
    return true;
  });
}
