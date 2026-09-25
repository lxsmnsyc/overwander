import 'server-only';
import {
  type Acquisition,
  type CatchOrder,
  asCaughtPokemon,
  isAuctionableCatch,
  isNicknameLocked,
} from '../auth/caught-record';
import { asNickname } from '../auth/nickname';
import type { EncounterRecord } from '../auth/encounter-record';
import { getMaxHealth, needsCare } from '../auth/health';
import {
  DEFAULT_MOVE_SLOTS,
  Slots,
  defaultSlots,
  getSlots,
  withSlots,
} from '../data/constants/slots';
import Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import { Balls, ItemFlags } from '../data/ids/items';
import { getItemData } from '../data/items';
import { PINAP_CANDY_HELPINGS } from '../data/items/berries';
import type { Species } from '../data/ids/species';
import { getSpeciesData } from '../data/species';
import createOverworld from '../overworld/setup';
import { asBuddy } from './buddy';
import type Families from '../data/ids/families';
import { catchCandyWorth, grantCandies } from './candy';
import { getCatchCandy, getReleaseCandy } from '../auth/candy-rules';
import {
  asLocale,
  isEggRecord,
  isFavoriteRecord,
  isGuardedRecord,
  rearrangedAs,
  zeroEffortValues,
} from './catch-fields';
import { readCaughtIn, readCaughtMany, updateCaughtIn } from './caught-io';
import { caughtFriendship } from '../data/constants/friendship';
import { type Tx, getSql, newDocId, tx } from './db';
import { recordCaughtSpecies } from './pokedex';
import { Metric } from '../auth/quest-record';
import { type ProgressBump, bumpProgress } from './quest-progress';
import { CANDY_STACKS, ITEM_STACKS } from '../auth/stacks';
import { readStackIn, readStacksIn, spendStackIn, writeStackIn } from './stacks';
import { asOffset, toLocalISO, toLocalTime } from '../auth/local-time';
import { isCatchLocked } from './locks';
import { asNumber, asNumberArray, asRecord } from './read';

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
  const rows = await getSql()`
    select 1 from caught where owner = ${uid} and not hidden limit 1
  `;

  return rows.length > 0;
}

/**
 * How many of the player's pokemon may leave their hands, which is all
 * but one.
 *
 * Nothing may take somebody's last one: releasing it or selling it
 * leaves a player who cannot join a raid, answer a grunt or throw a
 * ball. Counted under a lock on their profile, so two of these at once
 * cannot both see a spare and together take the last
 */
async function spareRoomIn(transaction: Tx, uid: string): Promise<number> {
  await transaction`select 1 from profiles where id = ${uid} for update`;

  // A dragon folded into a fusion is not one of the player's spare
  // pokemon: it is already inside one of them
  const held = await transaction`
    select count(*)::int as count from caught where owner = ${uid} and not hidden
  `;

  return Math.max(0, asNumber(held.at(0)?.count) - 1);
}

/** Whether the player has a pokemon to spare, asked inside the transaction that takes it */
export async function hasSpareCatchIn(transaction: Tx, uid: string): Promise<boolean> {
  return (await spareRoomIn(transaction, uid)) > 0;
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
  const id = await tx(async (transaction) =>
    insertCaughtIn(transaction, uid, encounter, ball, kind, now, offset, locale, from),
  );

  // Every arrival ends here, so this is the one place the dex has to
  // be told a pokemon became this player's. An egg is the exception
  // and writes its own record; it is logged when it hatches, since
  // what is in the shell is not something the player has met yet
  await recordCaughtSpecies(uid, encounter.species, encounter.shiny);
  await bumpProgress(uid, [
    [Metric.Catches, encounter.species, 1],
    ...(encounter.shiny
      ? [[Metric.ShinyCatches, encounter.species, 1] satisfies ProgressBump]
      : []),
  ]);
  return id;
}

/**
 * The row itself, inside a transaction the caller holds, for an
 * arrival that has to land with something else: an evolution writes the
 * husk it leaves in the same one that spends the ball. The dex and the
 * quest counters are the caller's to tell
 */
export async function insertCaughtIn(
  transaction: Tx,
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
  // Room for everything it arrived with, since the battle counts slots
  // rather than the lists and would read a full one as having none
  // free: a mirage hands some of them a second ability, a fogbow a
  // fifth and a sixth move, and each list is cut to its room here
  const room =
    encounter.slots ??
    withSlots(
      defaultSlots(abilities),
      Slots.Move,
      Math.max(DEFAULT_MOVE_SLOTS, encounter.moves.length),
    );

  // It arrives whole, and the maximum it is measured against is stored
  // beside it so `hurt` can be a column
  const whole = getMaxHealth({
    species: encounter.species,
    level: encounter.level,
    ivs: encounter.ivs,
    effortValues: zeroEffortValues(),
  });

  await transaction`
    insert into caught (
      id, owner, type, species, nickname, level, individual_value, trait_value,
      ivs, gender, nature, shiny, shadow, egg, favorite, guarded, traded,
      auctionable, slots, locked_at, steps, hatch_steps, stepped_at, health,
      max_health, statuses, lair, ball, caught_at_local, caught_at_offset, locale,
      effort_bonus, walked, friendship,
      origin_timestamp, origin_x, origin_y, origin_biome, origin_place
    ) values (
      ${id}, ${uid}, ${encounter.type}, ${encounter.species}, '',
      ${encounter.level}, ${encounter.individualValue}, ${encounter.traitValue},
      ${encounter.ivs}, ${encounter.gender}, ${encounter.nature},
      ${encounter.shiny}, ${shadow}, false, false, false, false,
      ${isAuctionableCatch(encounter)}, ${room}, 0, 0, 0, 0,
      ${whole}, ${whole},
      0, ${encounter.lair}, ${ball},
      ${new Date(toLocalTime(now, zone))}, ${zone}, ${asLocale(locale)},
      0, 0, ${caughtFriendship(ball, shadow)},
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
  return id;
}

/**
 * Everything a catch pays once its record is written: the dex, the
 * quest counters, the family's candy (fourfold on the family's own
 * day, plus what the buddy and a fed Pinap add) and a Heal Ball's
 * mending of the buddy.
 *
 * The caller has already claimed the encounter, so this runs once per
 * meeting however often a client asks. `buddy` is the one the throw
 * was rolled with, read once and handed on
 */
export async function payCatch(
  uid: string,
  spawnId: string,
  encounter: EncounterRecord,
  ball: Balls,
  now: number,
  offset: number,
  buddy: [string, Record<string, unknown>] | null,
): Promise<void> {
  await recordCaughtSpecies(uid, encounter.species, encounter.shiny);
  await bumpProgress(uid, [
    [Metric.Catches, encounter.species, 1],
    ...(encounter.shiny
      ? [[Metric.ShinyCatches, encounter.species, 1] satisfies ProgressBump]
      : []),
  ]);

  const zone = asOffset(offset);
  const overworld = createOverworld(uid, buddy == null ? null : asBuddy(buddy[1]));
  const family = getSpeciesData(encounter.species).family;
  const earned = new Map<Families, number>([
    [family, catchCandyWorth(encounter.species, toLocalTime(now, zone))],
  ]);
  const owe = (owed: Families, count: number): void => {
    earned.set(owed, (earned.get(owed) ?? 0) + count);
  };

  // The held items and the berry are paid flat: the species day is
  // already worth four times the catch's own candy, and a bonus that
  // multiplied with it would make one day worth a week of them
  for (const [owed, count] of overworld.checkCatchCandy(spawnId, family)) {
    owe(owed, count);
  }

  const helpings = encounter.fed == null ? undefined : PINAP_CANDY_HELPINGS.get(encounter.fed);

  if (helpings != null) {
    owe(family, getCatchCandy(encounter.species) * helpings);
  }
  await grantCandies(uid, earned);
  await mendWithHealBall(ball, buddy);
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
async function mendWithHealBall(
  ball: Balls,
  resolved: [string, Record<string, unknown>] | null,
): Promise<void> {
  if (ball !== Balls.HealBall || resolved == null) {
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
    // Who owns it and whether it is fighting are both on the row: the
    // lists it keeps are nobody's business here
    const caught = await readCaughtIn(transaction, catchId, true, []);

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
 * The name is cleaned here rather than trusted: no control characters,
 * no run of spaces, nothing past the limit. One that cleans to nothing
 * empties the column, and the pokemon goes back to its species name.
 *
 * A **guarded** pokemon may still be named, since guarding protects
 * what a pokemon is rather than what it is called. A **fighting** one
 * may not: its record is held while the battle runs on a snapshot.
 *
 * Neither may one that was named by somebody else and handed on: the
 * name came with it, and only the trainer who gave it may take it
 * back. An unnamed pokemon that changed hands is still the new
 * owner's to name.
 *
 * Resolves the name as it now stands, or null when the catch is not
 * the user's, is fighting, or answers to a name that is not the
 * user's to change
 */
export async function setNickname(
  uid: string,
  catchId: string,
  nickname: string,
): Promise<string | null> {
  const named = asNickname(nickname);

  return tx(async (transaction) => {
    // The history, for who first held it; nothing else it keeps is
    // read to answer a name
    const caught = await readCaughtIn(transaction, catchId, true, ['history']);

    if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
      return null;
    }
    if (isNicknameLocked(asCaughtPokemon(caught), uid)) {
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
    const kept: Items[] = [];

    for (const [at, one] of held.entries()) {
      if (at !== index) {
        kept.push(one);
      }
    }
    await updateCaughtIn(transaction, catchId, { items: kept });
    await writeStackIn(transaction, ITEM_STACKS, uid, item, carried + 1);
    return true;
  });
}

/**
 * Put a pokemon's moves, abilities and held items in the order its
 * owner wants them in.
 *
 * The order is what a player brings to a fight rather than a matter
 * of taste: a battle takes as many of each as it allows from the top
 * of the list, so a pokemon with eight moves in a fight that allows
 * four fights with the first four.
 *
 * All three lists in one call, since they are laid out together and
 * saved together. Each may only be a rearrangement of what is already
 * there: nothing is learned, taught or handed over here, and a list
 * that says otherwise refuses the whole call. Refused as well for a
 * pokemon somebody is fighting with, an egg, and one put away
 */
export async function arrangeCatch(
  uid: string,
  catchId: string,
  order: CatchOrder,
): Promise<boolean> {
  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return false;
    }

    const fields: Record<string, unknown> = {};

    for (const kind of ['moves', 'abilities', 'items'] as const) {
      const wanted = order[kind];

      if (wanted == null) {
        continue;
      }

      const laid = rearrangedAs(asNumberArray(caught[kind]), wanted);

      if (laid == null) {
        return false;
      }
      fields[kind] = laid;
    }

    if (Object.keys(fields).length === 0) {
      return false;
    }
    // The points ride on the move rows, so rewriting those without
    // saying what was spent on each would hand every PP Up back
    if ('moves' in fields) {
      fields.movePoints = asRecord(caught.movePoints);
    }
    await updateCaughtIn(transaction, catchId, fields);
    return true;
  });
}

/**
 * What a run of catches came to: the ones that changed, and the ones
 * that would not. A caller says what actually happened rather than
 * assuming the whole selection went through
 */
export interface BulkOutcome {
  done: string[];
  refused: string[];
}

/**
 * Whether a pokemon may be let go: it is the player's and is not
 * fighting, a favorite or locked. Release cannot be undone, and both
 * marks are a player saying so about this pokemon in particular
 */
function isReleasable(
  caught: Record<string, unknown> | undefined,
  uid: string,
): caught is Record<string, unknown> {
  return (
    caught?.owner === uid &&
    !isCatchLocked(caught) &&
    !isFavoriteRecord(caught) &&
    !isGuardedRecord(caught)
  );
}

/**
 * Let several go at once, in one transaction: the records in one read,
 * each stack they pay into read and written once, and one delete.
 *
 * A released pokemon's held items go back to the bag and its family is
 * paid candy for the levels it took. A refusal (see `isReleasable`)
 * leaves its neighbours alone, and the last pokemon is counted under
 * `spareRoomIn`'s lock, so it is never let go
 */
export async function releaseCatches(uid: string, catchIds: string[]): Promise<BulkOutcome> {
  const outcome: BulkOutcome = { done: [], refused: [] };
  /** How many of each species went, so the quest board is told once */
  const gone = new Map<Species, number>();

  await tx(async (transaction) => {
    const room = await spareRoomIn(transaction, uid);
    const stored = await readCaughtMany(transaction, catchIds, true, ['items']);
    const released = new Set<string>();
    // Totals rather than a write per pokemon: two holding the same item,
    // or of one family, share a stack and would clobber each other
    const returning = new Map<Items, number>();
    const candy = new Map<Families, number>();

    for (const catchId of catchIds) {
      const caught = stored.get(catchId);

      // A repeated id is refused the second time, as one already gone
      if (released.size >= room || released.has(catchId) || !isReleasable(caught, uid)) {
        outcome.refused.push(catchId);
        continue;
      }
      released.add(catchId);
      outcome.done.push(catchId);

      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      const species = asNumber(caught.species) as Species;
      const { family } = getSpeciesData(species);

      for (const item of asHeldItems(caught.items)) {
        returning.set(item, (returning.get(item) ?? 0) + 1);
      }
      candy.set(
        family,
        (candy.get(family) ?? 0) + getReleaseCandy({ level: asNumber(caught.level) }),
      );
      gone.set(species, (gone.get(species) ?? 0) + 1);
    }
    if (outcome.done.length === 0) {
      return;
    }

    const carried = await readStacksIn(transaction, ITEM_STACKS, uid, [...returning.keys()]);

    for (const [item, count] of returning) {
      await writeStackIn(transaction, ITEM_STACKS, uid, item, (carried.get(item) ?? 0) + count);
    }

    const candies = await readStacksIn(transaction, CANDY_STACKS, uid, [...candy.keys()]);

    for (const [family, count] of candy) {
      await writeStackIn(
        transaction,
        CANDY_STACKS,
        uid,
        family,
        (candies.get(family) ?? 0) + count,
      );
    }
    // The buddy field clears itself, as a foreign key that nulls on delete
    await transaction`delete from caught where id in ${transaction(outcome.done)}`;
  });

  if (gone.size > 0) {
    const bumps: ProgressBump[] = [];

    for (const [species, count] of gone) {
      bumps.push([Metric.Releases, species, count]);
    }

    await bumpProgress(uid, bumps);
  }
  return outcome;
}

/**
 * Let a pokemon go. The last one is refused whatever it is, and so is
 * anything a batch would refuse.
 *
 * Resolves false when the catch is not the player's, is fighting, is
 * a favorite, is locked, or is the only pokemon they have
 */
export async function releaseCatch(uid: string, catchId: string): Promise<boolean> {
  return (await releaseCatches(uid, [catchId])).done.length > 0;
}

/**
 * Put a mark on several of the player's catches at once, or take it
 * off several. One transaction over the lot, and a catch that is
 * fighting or is not theirs is refused on its own
 */
export async function setCatchMarks(
  uid: string,
  catchIds: string[],
  field: 'favorite' | 'guarded',
  on: boolean,
): Promise<BulkOutcome> {
  const outcome: BulkOutcome = { done: [], refused: [] };

  await tx(async (transaction) => {
    // The lot in one read and one write: marking is a button pressed
    // over a whole box, and asking after each pokemon in turn is a
    // round trip a piece
    const stored = await readCaughtMany(transaction, catchIds, true, []);

    for (const catchId of catchIds) {
      const caught = stored.get(catchId);

      if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
        outcome.refused.push(catchId);
        continue;
      }
      outcome.done.push(catchId);
    }
    if (outcome.done.length > 0) {
      await transaction`
        update caught set ${transaction(field)} = ${on}
        where id in ${transaction(outcome.done)}
      `;
    }
  });
  return outcome;
}
