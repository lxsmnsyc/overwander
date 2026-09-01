import 'server-only';
import { Acquisition, asCaughtPokemon, isShadow } from '../auth/caught-record';
import { boostedSteps, isEgg, stepsRemaining } from '../auth/egg';
import { getMaxHealth } from '../auth/health';
import { groomedFriendship } from '../data/constants/friendship';
import Npc, {
  BREEDING_FEE,
  CHANNELER_FEE,
  DAYCARE_FEE,
  GROOMING_FEE,
  NURSE_CARE_LIMIT,
  REMINDER_FEE,
  TUTOR_FEE,
  getRecallableMoves,
  getTutorableMoves,
} from '../data/overworld/npc';
import { FOSSIL_REVIVE_LEVEL, getFossilPrice } from '../data/overworld/fossil';
import { VENDOR_TRADE_LIMIT, sellPrice } from '../data/overworld/vendor';
import AleaRNG from '../core/alea';
import { Balls, Items, getApricornBall } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type { Species } from '../data/ids/species';
import { getItemData } from '../data/items';
import { FOSSIL_SPECIES } from '../data/items/fossils';
import { getHeldPowerStat } from '../data/items/power-items';
import { isPurifiable, purifyIVs } from '../data/items/purifying-gem';
import { type BreedingParent, getEggSpecies } from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import deriveEncounter, { EncounterType } from '../overworld/encounter';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { writeCaughtRecord } from './caught';
import { grantBredEgg } from './eggs';
import { consumeItem, grantItem } from './inventory';
import { readCaughtIn, readCaughtMany, updateCaughtIn } from './caught-io';
import { getSql, tx } from './db';
import awakenAbility, { type Awakening } from './awaken';
import { learnMove } from './moves';
import { LearnRefusal, type LearnResult, isRefusal } from '../auth/learn-refusal';
import { readStacksIn, writeStackIn } from './stacks';
import { ITEM_STACKS } from '../auth/stacks';
import { isCatchLocked } from './locks';
import { claim, resolveSnapshot } from './overworld';
import { grantGold, spendGold } from './profile';
import { purifiedFields } from './purify';
import { Metric } from '../auth/quest-record';
import { bumpProgress } from './quest-progress';
import { asNumber } from './read';

/**
 * Count a served visit for the quests, passing the answer through:
 * the bridges wrap their server calls in this so every wanderer's
 * yes lands on the same counter
 */
export async function countVisit<T>(uid: string, npc: Npc, served: T): Promise<T> {
  // A refusal is not a visit. The two who take a scale answer with the
  // rule that turned the player away rather than with nothing at all,
  // and a counter that took those would count walking up as a lesson
  if (served != null && !isRefusal(served)) {
    await bumpProgress(uid, [[Metric.NpcVisits, npc, 1]]);
  }
  return served;
}

/**
 * The people a player meets at a wandering-NPC cell, and what they do.
 *
 * Who is standing there is re-derived from the chunk, zone and window
 * before anything happens, so asking the wrong NPC — or any NPC from a
 * cell that has none — is refused rather than paid for.
 *
 * **Each serves a player once per window**, the vendor aside: a marker
 * in `npcClaims` records the visit, and it is taken only where the
 * visit lands and given back if the write fails. The vendor takes no
 * marker — his crate and the player's purse are the whole limit.
 *
 * The two that charge take gold after the visit is claimed and put it
 * back if nothing was written: charged and given nothing is worse than
 * refused.
 */

/**
 * Who is standing at the cell this window, or null when the player is
 * not at a live window, the cell holds no wandering NPC, or somebody
 * else is standing there
 */
async function resolveNpc(
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  expected: Npc,
): Promise<ChunkSnapshot | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const standing = snapshot?.getStandingNpc(cell);

  return snapshot != null && standing === expected ? snapshot : null;
}

/**
 * Take this window's visit with whoever is standing at the cell.
 *
 * The marker is per NPC, cell, window and player, so walking to
 * another wandering cell finds somebody who has not seen you yet —
 * that walk is what a second egg costs. It is taken as late as the
 * call can manage, once the visit is known to be one that will land,
 * so a refusal never spends it.
 *
 * Resolves the marker's id, or null when this player has already been
 * seen here this window
 */
async function takeVisit(
  snapshot: ChunkSnapshot,
  tag: string,
  cell: number,
  uid: string,
  record: Record<string, unknown> = {},
): Promise<string | null> {
  const id = snapshot.visitMarker(tag, cell);

  return (await claim('npc_claims', id, { player: uid, ...record })) ? `${id}:${uid}` : null;
}

/**
 * Give the visit back. What it was taken for did not happen, so the
 * window should not be spent on it
 */
async function releaseVisit(id: string): Promise<void> {
  // The id carries the player after the last ':'; the row is the
  // marker and that player
  const at = id.lastIndexOf(':');

  await getSql()`
    delete from npc_claims
    where marker = ${id.slice(0, at)} and player = ${id.slice(at + 1)}
  `;
}

/**
 * One parent as the breeding rules read it, from a stored catch the
 * player must own and must not have fighting
 */
function asParent(caught: Record<string, unknown> | null, uid: string): BreedingParent | null {
  // One fighting right now is refused: its battle runs on a frozen
  // snapshot, and reading it mid-fight would breed from a record the
  // fight is about to rewrite. A *guarded* pokemon is a different
  // lock and is welcome, since standing as a parent is one of the few
  // things putting one away leaves open
  if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
    return null;
  }

  const record = asCaughtPokemon(caught);
  const held = new Set(record.items);

  return {
    species: record.species,
    gender: record.gender,
    ivs: record.ivs,
    moves: record.moves,
    shadow: isShadow(record),
    nature: record.nature,
    // The one it is actually fielding. A pokemon with room for several
    // passes the first, which is the one it leads with
    ability: record.abilities[0],
    ball: record.ball,
    // Read off the stored record, like everything else here: what the
    // egg inherits is decided by what the pokemon is actually holding
    everstone: held.has(Items.Everstone),
    destinyKnot: held.has(Items.DestinyKnot),
    powerStat: getHeldPowerStat(record.items),
    egg: isEgg(record),
  };
}

/**
 * Leave two pokemon with the breeder. The pair is checked from the
 * stored records rather than the caller's word, and the fee is taken
 * only once they are known to be compatible. Neither parent is
 * consumed or held.
 *
 * Resolves the new egg's catch id, or null when the pair cannot breed,
 * the player cannot pay, or no breeder is standing there
 */
export async function breedCatches(
  uid: string,
  x: number,
  y: number,
  cell: number,
  parents: [string, string],
  now: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  const [left, right] = parents;

  // A pokemon cannot be both parents; the pair has to be two
  if (left === right || left === '' || right === '') {
    return null;
  }

  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.Breeder);

  if (snapshot == null) {
    return null;
  }

  // Both parents in one question, and no transaction round them: they
  // are read rather than read-then-written, so a BEGIN and a COMMIT
  // would be two round trips buying no lock
  const found = await readCaughtMany(getSql(), [left, right]);
  const pair = [left, right].map((id) => asParent(found.get(id) ?? null, uid));
  const [first, second] = pair;

  if (first == null || second == null) {
    return null;
  }

  const species: Species | null = getEggSpecies(first, second);

  if (species == null) {
    return null;
  }

  // Claimed before the fee, since a player already seen this window
  // should not be charged to be told so
  const visit = await takeVisit(snapshot, 'breed', cell, uid, { parents: [left, right] });

  if (visit == null) {
    return null;
  }
  if (!(await spendGold(uid, BREEDING_FEE))) {
    await releaseVisit(visit);
    return null;
  }

  // Seeded by the pair and the window, so this visit's egg is this
  // visit's egg — and by the instant, so the same pair left again is
  // a different one
  const seed = `${snapshot.key}${snapshot.npcTimestamp}breed${cell}:${uid}:${left}:${right}:${now}`;

  let egg: string;

  try {
    egg = await grantBredEgg(uid, snapshot, seed, species, [first, second], now, offset, locale);
  } catch (error) {
    // The fee bought an egg that was never written; the player keeps
    // their gold and their visit rather than the breeder keeping both
    await grantGold(uid, BREEDING_FEE);
    await releaseVisit(visit);
    throw error;
  }
  await bumpProgress(uid, [[Metric.GoldSpent, 0, BREEDING_FEE]]);
  return egg;
}

/**
 * What Nurse Joy did to one pokemon — and whether the doing included
 * a purification, which is counted apart — or null when there was
 * nothing of hers to do for it
 */
function tended(
  caught: Record<string, unknown>,
  uid: string,
): { fields: Record<string, unknown>; purifies: boolean } | null {
  // She heals and purifies, and a guarded pokemon is to be left alone
  // on both counts; it is simply not one of the ones she takes
  if (
    caught.owner !== uid ||
    isCatchLocked(caught) ||
    isEggRecord(caught) ||
    isGuardedRecord(caught)
  ) {
    return null;
  }

  const record = asCaughtPokemon(caught);
  const whole = getMaxHealth(record);
  // A shadow is put right as well as patched up, which is the reason
  // to walk to her with one rather than with a potion in hand
  const purified = isPurifiable(record) ? purifiedFields(caught) : null;
  const healed = record.health < whole || record.statuses !== 0;

  if (purified == null && !healed) {
    return null;
  }
  // Purifying raises the pool, and she fills whatever the pool ends up
  // being: the two are one visit, so the order they are written in
  // must not leave the pokemon short
  return {
    fields: {
      ...purified,
      health: getMaxHealth({ ...record, ivs: purifyIVs(record.ivs) }),
      statuses: 0,
    },
    purifies: purified != null,
  };
}

/**
 * Walk a party up to Nurse Joy. She takes up to `NURSE_CARE_LIMIT` in
 * one handover, hands every one back at full health with nothing left
 * on it, and purifies any shadow among them — all of it for nothing,
 * as often as she is asked. The cap is the handover's, not hers: she
 * turns nobody away while she is standing there.
 *
 * Resolves the ids she tended, or null when she is not standing there,
 * none of them are the player's to hand over, or there was nothing to
 * do
 */
export async function visitNurse(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catches: string[],
  now: number,
  offset: number,
): Promise<string[] | null> {
  if (catches.length === 0 || catches.length > NURSE_CARE_LIMIT) {
    return null;
  }
  // The same pokemon twice would be one write racing another
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.NurseJoy);

  if (snapshot == null) {
    return null;
  }

  const care: [string, Record<string, unknown>, boolean][] = [];

  await tx(async (transaction) => {
    for (const id of catches) {
      const caught = await readCaughtIn(transaction, id, false);
      const done = caught == null ? null : tended(caught, uid);

      if (done != null) {
        care.push([id, done.fields, done.purifies]);
      }
    }
  });

  // Nothing of hers to do: a party already whole is handed straight
  // back
  if (care.length === 0) {
    return null;
  }

  await tx(async (transaction) => {
    for (const [id, fields] of care) {
      await updateCaughtIn(transaction, id, fields);
    }
  });

  const purified = care.filter(([, , purifies]) => purifies).length;

  await bumpProgress(uid, [[Metric.Purifies, 0, purified]]);

  return care.map(([id]) => id);
}

/**
 * Have the daycare lady warm an egg along: half of what hatching
 * costs is added to wherever it already was, so an egg a quarter of
 * the way along comes out three quarters of the way.
 *
 * The boost is a share of the requirement rather than a place on it,
 * which means an egg past the half-way mark is finished by one and
 * any egg is finished by two. That is what the fee is for.
 *
 * Resolves how far along the egg now is, or null when it is not the
 * player's, is not an egg, is already ready to hatch, or no daycare
 * lady is standing there
 */
export async function boostEgg(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  now: number,
  offset: number,
): Promise<number | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.DaycareLady);

  if (snapshot == null) {
    return null;
  }

  const stored = await readCaughtIn(getSql(), catchId, false);

  if (stored == null || stored.owner !== uid || !isEggRecord(stored) || isCatchLocked(stored)) {
    return null;
  }

  const caught = asCaughtPokemon(stored);

  // An egg already at the finish line has nothing left to buy
  if (stepsRemaining(caught) === 0) {
    return null;
  }

  const warmed = boostedSteps(caught);
  const visit = await takeVisit(snapshot, 'daycare', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }
  if (!(await spendGold(uid, DAYCARE_FEE))) {
    await releaseVisit(visit);
    return null;
  }

  try {
    // The stamp moves with it: the steps were not walked, so the time
    // they would have taken must not be banked for the next report
    await getSql()`
      update caught set steps = ${warmed}, stepped_at = ${now} where id = ${catchId}
    `;
  } catch (error) {
    await grantGold(uid, DAYCARE_FEE);
    await releaseVisit(visit);
    throw error;
  }
  await bumpProgress(uid, [[Metric.GoldSpent, 0, DAYCARE_FEE]]);
  return warmed;
}

/**
 * Have the groomer see to a pokemon: half of whatever friendship it
 * had left to give. A share of the remainder rather than a place on
 * it, so gold buys the early half of a friendship and never the last.
 *
 * Resolves what the pokemon now thinks, or null when it is not the
 * player's, is an egg, is fighting, already thinks as well of them as
 * it can, or no groomer is standing there
 */
export async function groomCatch(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  now: number,
  offset: number,
): Promise<number | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.Groomer);

  if (snapshot == null) {
    return null;
  }

  const stored = await readCaughtIn(getSql(), catchId, false);

  // An egg thinks nothing of anybody yet: what is inside it has not
  // met the player, and the shell is what the daycare lady is for
  // A locked pokemon is still groomed: friendship is the one thing a
  // lock leaves alone, and being fussed over is not being changed
  if (stored == null || stored.owner !== uid || isEggRecord(stored) || isCatchLocked(stored)) {
    return null;
  }

  const caught = asCaughtPokemon(stored);

  // A shadow will not be fussed over. Nothing it thinks of anybody can
  // be bought while it is one, which is what makes purifying worth
  // walking for
  if (isShadow(caught)) {
    return null;
  }

  const groomed = groomedFriendship(caught.friendship);

  // Nothing left to buy, so nothing is charged
  if (groomed === caught.friendship) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'groom', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }
  if (!(await spendGold(uid, GROOMING_FEE))) {
    await releaseVisit(visit);
    return null;
  }

  try {
    await getSql()`update caught set friendship = ${groomed} where id = ${catchId}`;
  } catch (error) {
    await grantGold(uid, GROOMING_FEE);
    await releaseVisit(visit);
    throw error;
  }
  await bumpProgress(uid, [[Metric.GoldSpent, 0, GROOMING_FEE]]);
  return groomed;
}

/**
 * Have the Move Reminder put back a move the pokemon learned by
 * levelling and has since lost, for one Heart Scale.
 *
 * The recallable list is derived again from the **stored** species,
 * level and move list, and the scale leaves the bag in the same
 * transaction the list is written in, so it is only spent on a move
 * actually taught. `replaces` names which known move goes and is
 * ignored where there is room.
 *
 * He serves as often as a player has scales. A scale is dug out of
 * the ground and nothing sells one, so the fee is what paces him:
 * a second limit on top of it only meant a player holding five of
 * them could spend one every three hours.
 *
 * Resolves the move list as it now stands, or which rule refused it,
 * a person who has walked on among them
 */
export async function remindMove(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  move: Moves,
  replaces: number,
  now: number,
  offset: number,
): Promise<LearnResult> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.MoveReminder);

  if (snapshot == null) {
    return { refused: LearnRefusal.Gone };
  }
  return learnMove(uid, catchId, move, REMINDER_FEE, replaces, (species, level, known) =>
    new Set(getRecallableMoves(species, level, known)).has(move),
  );
}

/**
 * Have the Move Tutor put a teachable move on the pokemon.
 *
 * The reminder's trade run the other way: the tutor deals in what a
 * machine would teach rather than in what levelling once gave, for
 * the same one Heart Scale. It leaves the bag in the transaction the
 * move is written in, so a refusal costs nothing.
 *
 *
 * He serves as often as a player has scales, for the reason the
 * reminder does: the scale is the limit, and it is a real one.
 *
 * Resolves the move list as it now stands, or which rule refused it,
 * a person who has walked on among them
 */
export async function tutorMove(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  move: Moves,
  replaces: number,
  now: number,
  offset: number,
): Promise<LearnResult> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.MoveTutor);

  if (snapshot == null) {
    return { refused: LearnRefusal.Gone };
  }
  return learnMove(uid, catchId, move, TUTOR_FEE, replaces, (species, _level, known) =>
    new Set(getTutorableMoves(species, known)).has(move),
  );
}

/**
 * Have the Channeler draw a second ability out of the pokemon, for
 * one Heart Scale.
 *
 * The slot she opens and the ability that fills it are written
 * together, so a pokemon is never left holding room for nothing. What
 * comes out is seeded by the visit rather than the moment, so asking
 * again while she stands there is the same question rather than
 * another roll at it.
 *
 * Resolves what she drew out, or null when she refuses: the catch is
 * not the player's, it is fighting, locked or still an egg, no scale
 * is carried, the pokemon has no room left, its line has nothing it
 * does not already have, or this window's visit has already been made
 */
export async function channelAbility(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  now: number,
  offset: number,
): Promise<Awakening | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.Channeler);

  if (snapshot == null) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'channel', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }

  const seed = `${snapshot.key}${snapshot.npcTimestamp}channel${cell}:${uid}:${catchId}`;

  let drawn: Awakening | null;

  try {
    drawn = await awakenAbility(uid, catchId, CHANNELER_FEE, seed);
  } catch (error) {
    await releaseVisit(visit);
    throw error;
  }

  // She was asked and drew nothing out — no scale, a pokemon she
  // cannot touch, a line with nothing left in it. The window is given
  // back with it
  if (drawn == null) {
    await releaseVisit(visit);
  }
  return drawn;
}

/**
 * What a trade with the vendor left the player holding: the gold
 * balance and how much of the item is now in the bag
 */
export interface TradeResult {
  gold: number;
  carried: number;
}

/**
 * Move gold and one stack of items in the same transaction, in
 * whichever direction the trade goes.
 *
 * A shop is the one place in the game where two stores have to agree:
 * a player charged for a potion that was never handed over is worse
 * off than one who was refused, and a potion handed over for gold that
 * was never taken is a mint. The purse and the stack are read and
 * written together, so neither can happen.
 *
 * Resolves null when the player cannot cover their side of it
 */
async function trade(
  uid: string,
  basket: [item: Items, amount: number][],
  gold: number,
): Promise<TradeResult | null> {
  const traded = await tx(async (transaction) => {
    const profiles = await transaction`
      select gold from profiles where id = ${uid} for update
    `;
    const carried = await readStacksIn(
      transaction,
      ITEM_STACKS,
      uid,
      basket.map(([item]) => item),
    );
    const balance = asNumber(profiles[0]?.gold) + gold;
    const held = basket.map(([item, amount]) => (carried.get(item) ?? 0) + amount);

    // The player cannot pay, or is selling what they have not got.
    // The whole basket is refused rather than the affordable part of
    // it: a trade a player agreed to is one trade
    if (balance < 0 || held.some((count) => count < 0)) {
      return null;
    }

    await transaction`update profiles set gold = ${balance} where id = ${uid}`;
    for (const [at, [item]] of basket.entries()) {
      await writeStackIn(transaction, ITEM_STACKS, uid, item, held[at]);
    }
    return { gold: balance, carried: held.reduce((total, count) => total + count, 0) };
  });

  // Signed the way the balance moved: buying spends, selling earns
  if (traded != null && gold !== 0) {
    await bumpProgress(uid, [
      gold > 0 ? [Metric.GoldEarned, 0, gold] : [Metric.GoldSpent, 0, -gold],
    ]);
  }
  return traded;
}

/**
 * What a basket comes to, or null when any of it is something the
 * vendor will not trade. Nothing is charged for a basket that has one
 * bad line in it
 */
function priced(
  basket: [item: Items, amount: number][],
  price: (item: Items) => number,
): number | null {
  let total = 0;

  for (const [item, amount] of basket) {
    const each = price(item);

    if (!Number.isInteger(amount) || amount < 1 || amount > VENDOR_TRADE_LIMIT || each <= 0) {
      return null;
    }
    total += each * amount;
  }
  return basket.length === 0 ? null : total;
}

/**
 * Buy from a trader's crate — the vendor's, or the chef's larder. The
 * crate is derived from the same seed the trader is, so the basket has
 * to be what they are actually standing behind, and the price is the
 * registry's `buy`.
 *
 * The whole basket is one transaction — six kinds or none — and the
 * traders are the wanderers not limited to once per window.
 *
 * Resolves the balance and what the bag now holds, or null when the
 * trader is not there, is not carrying it, or the player cannot pay
 */
export async function buyFromVendor(
  uid: string,
  x: number,
  y: number,
  cell: number,
  basket: [item: Items, amount: number][],
  now: number,
  offset: number,
  trader: Npc = Npc.Vendor,
): Promise<TradeResult | null> {
  if (trader !== Npc.Vendor && trader !== Npc.Chef) {
    return null;
  }

  const snapshot = await resolveNpc(x, y, cell, now, offset, trader);

  if (snapshot == null) {
    return null;
  }

  const stock = new Set(snapshot.getVendorStock(cell));
  // A crate is only ever filled with priced goods, so a zero price is
  // a registry that changed under the vendor rather than a free item
  const owed = priced(basket, (item) => (stock.has(item) ? getItemData(item).buy : 0));

  return owed == null ? null : trade(uid, basket, -owed);
}

/**
 * Sell to the vendor.
 *
 * What he takes is wider than what he sells: anything the market puts
 * a price on, so the pearls and nuggets a walk turns up have somewhere
 * to go. What he pays is the registry's `sell`, which is half of what
 * he charges for the same item — buying from him and selling it
 * straight back is a way to lose money, which is the point.
 *
 * The basket is one trade here too, so a bag that turns out to be
 * short of one line sells nothing rather than part of it.
 *
 * Resolves the balance and what is left, or null when he is not
 * standing there, will not price something, or the player has not got
 * that many
 */
export async function sellToVendor(
  uid: string,
  x: number,
  y: number,
  cell: number,
  basket: [item: Items, amount: number][],
  now: number,
  offset: number,
  trader: Npc = Npc.Vendor,
): Promise<TradeResult | null> {
  if (trader !== Npc.Vendor && trader !== Npc.Chef) {
    return null;
  }

  const snapshot = await resolveNpc(x, y, cell, now, offset, trader);

  if (snapshot == null) {
    return null;
  }

  // What he pays is the registry's price, not whether he stocks it:
  // the pearls and nuggets a walk turns up are never in a crate, and
  // selling them is the only thing they are for
  const paid = priced(basket, sellPrice);

  return paid == null
    ? null
    : trade(
        uid,
        basket.map(([item, amount]) => [item, -amount]),
        paid,
      );
}

/**
 * Buy a fossil off the Fossil Maniac.
 *
 * What he is carrying is not the caller's to say: the pair is derived
 * from the window he was, so a fossil he is not holding is refused
 * rather than sold. One per visit, and one visit per window — he is
 * the only place a fossil can be bought, and a maniac who sold three
 * in an hour would make digging one up pointless.
 *
 * The gold and the rock move in the same transaction the vendor's
 * trades move in, so a player is never charged for a fossil that
 * never reached the bag.
 *
 * Resolves the balance and how many of that fossil are now carried,
 * or null when he is not standing there, is not holding it, the purse
 * will not cover it, or he has already sold to this player
 */
export async function buyFossil(
  uid: string,
  x: number,
  y: number,
  cell: number,
  item: Items,
  now: number,
  offset: number,
): Promise<TradeResult | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.FossilManiac);

  if (snapshot == null) {
    return null;
  }

  const owed = getFossilPrice(item);

  if (owed <= 0 || !new Set(snapshot.getFossilOffer(cell)).has(item)) {
    return null;
  }

  // Claimed before the trade, since a player already seen this window
  // should not have their purse touched to be told so
  const visit = await takeVisit(snapshot, 'fossil', cell, uid, { item });

  if (visit == null) {
    return null;
  }

  const sold = await trade(uid, [[item, 1]], -owed);

  if (sold == null) {
    // He was asked and sold nothing — the purse would not stretch —
    // so the window is given back rather than spent on a refusal
    await releaseVisit(visit);
  }
  return sold;
}

/**
 * What came out of a fossil: the catch record it was written to, and
 * what the rock turned out to hold
 */
export interface RevivedFossil {
  catchId: string;
  species: Species;
  level: number;
  shiny: boolean;
}

/**
 * Have the Fossil Scientist open a fossil.
 *
 * Which species comes out is the fossil's rather than the caller's,
 * and the level is fixed, so the only thing a player decides is which
 * rock they hand over. He is **not** once a window: what paces him is
 * how many fossils have been dug up, and turning away the second of
 * two would only be a walk to the next cell to do the same thing.
 *
 * The fossil leaves the bag first and is put back if the record is
 * never written, since a fossil spent on nothing is the one outcome
 * that cannot be walked off.
 *
 * Resolves what came out, or null when he is not standing there, the
 * item is not a fossil, or the player is not carrying one
 */
/**
 * Kurt's counter: apricorns in, the balls their colours make out.
 *
 * One apricorn is one ball and there is no fee, since the picking was
 * the price. He works through as many of one colour as a player is
 * carrying, so a basket of nine reds is nine Level Balls in one
 * handover rather than nine walks back.
 *
 * The apricorns leave the bag first and go back if the balls are
 * never granted: apricorns spent on nothing is the one outcome that
 * cannot be walked off.
 *
 * Resolves how many were carved, or null when he is not standing
 * there, the item is not an apricorn, or the player is not carrying
 * that many
 */
export async function carveApricorns(
  uid: string,
  x: number,
  y: number,
  cell: number,
  item: Items,
  amount: number,
  now: number,
  offset: number,
): Promise<{ ball: Items; amount: number } | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.Kurt);
  const ball = getApricornBall(item);
  const carving = Math.floor(amount);

  if (snapshot == null || ball == null || carving < 1) {
    return null;
  }
  if (!(await consumeItem(uid, item, carving))) {
    return null;
  }

  try {
    await grantItem(uid, ball, carving);
    return { ball, amount: carving };
  } catch (error) {
    // The apricorns bought nothing, so the player keeps them
    await grantItem(uid, item, carving);
    throw error;
  }
}

export async function reviveFossil(
  uid: string,
  x: number,
  y: number,
  cell: number,
  item: Items,
  now: number,
  offset: number,
  locale: string,
): Promise<RevivedFossil | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.FossilScientist);
  const species = FOSSIL_SPECIES.get(item);

  if (snapshot == null || species == null) {
    return null;
  }
  if (!(await consumeItem(uid, item))) {
    return null;
  }

  // Seeded by the player, the fossil and the instant: two of the same
  // rock opened one after the other are two different pokemon, and
  // re-running a call that failed on the way out gives the same one
  const rng = new AleaRNG(
    `${snapshot.key}${snapshot.npcTimestamp}revive${cell}:${uid}:${item}:${now}`,
  );
  const encounter = deriveEncounter(snapshot, [species, rng.int32(), rng.int32()], uid, {
    type: EncounterType.Revived,
    level: FOSSIL_REVIVE_LEVEL,
  });

  try {
    // Nothing was thrown at it, and the record still has to name a
    // ball: the commemorative one, which is what every pokemon that
    // arrived without a throw is written under
    const catchId = await writeCaughtRecord(
      uid,
      { ...encounter, spawn: `fossil${cell}:${uid}:${item}:${now}`, player: uid },
      Balls.PremierBall,
      Acquisition.Revived,
      now,
      offset,
      locale,
    );

    return {
      catchId,
      species: encounter.species,
      level: encounter.level,
      shiny: encounter.shiny,
    };
  } catch (error) {
    // The rock bought nothing, so the player keeps the rock
    await grantItem(uid, item);
    throw error;
  }
}
