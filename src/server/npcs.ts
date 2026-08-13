import 'server-only';
import { Acquisition, asCaughtPokemon, isShadow } from '../auth/caught-record';
import { CAUGHT_COLLECTION, NPC_CLAIM_COLLECTION, PROFILE_COLLECTION } from '../auth/collections';
import { boostedSteps, isEgg, stepsRemaining } from '../auth/egg';
import { getMaxHealth } from '../auth/health';
import { groomedFriendship } from '../data/constants/friendship';
import Npc, {
  BREEDING_FEE,
  DAYCARE_FEE,
  GROOMING_FEE,
  NURSE_CARE_LIMIT,
  REMINDER_FEE,
  getRecallableMoves,
} from '../data/overworld/npc';
import { FOSSIL_REVIVE_LEVEL, getFossilPrice } from '../data/overworld/fossil';
import { VENDOR_TRADE_LIMIT, isMarketable } from '../data/overworld/vendor';
import AleaRNG from '../core/alea';
import { Balls, type Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type { Species } from '../data/ids/species';
import { getItemData } from '../data/items';
import { FOSSIL_SPECIES } from '../data/items/fossils';
import { isPurifiable, purifyIVs } from '../data/items/purifying-gem';
import { type BreedingParent, getEggSpecies } from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import deriveEncounter, { EncounterType } from '../overworld/encounter';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { writeCaughtRecord } from './caught';
import { grantBredEgg } from './eggs';
import { consumeItem, grantItem } from './inventory';
import { getAdminFirestore } from './firebase';
import { learnMove } from './moves';
import { readStackIn, writeStackIn } from './stacks';
import { ITEM_STACKS } from '../auth/stacks';
import { isCatchLocked } from './locks';
import { claim, resolveSnapshot } from './overworld';
import { grantGold, spendGold } from './profile';
import { purifiedFields } from './purify';
import { type UpdateFields, asNumber, docData } from './read';

/**
 * The people a player meets at a wandering-NPC cell, and what they do.
 *
 * Who is standing there is not the caller's to say: it is re-derived
 * from the chunk, the zone and the window before anything happens, so
 * asking a breeder to push an egg along — or asking either of them
 * from a cell that has neither — is refused rather than paid for.
 *
 * **Each of them serves a player once per window**, the vendor aside.
 * Whoever is at the cell stands there for `NPC_INTERVAL`, and a marker
 * in `npcClaims` records that this player has been seen; a second ask
 * that window is turned away whatever they can pay. It is taken only
 * where the visit actually lands — a pair that cannot breed, an egg
 * already ready to hatch or a party that needed nothing costs nothing
 * — and it is given back if the write behind it fails.
 *
 * The **vendor** takes no marker at all: what the others hand over is
 * something the world cannot make twice in six hours, and what he
 * hands over is a potion. His crate and the player's purse are the
 * whole of the limit.
 *
 * The two that charge take the gold after the visit is claimed and put
 * it back if what it bought was never written. A player who is charged
 * and given nothing is worse off than one who is refused.
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
  const standing = snapshot?.getWanderingNpcs().get(cell);

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
  const id = `${snapshot.key}@${snapshot.npcTimestamp}$${tag}${cell}:${uid}`;

  return (await claim(NPC_CLAIM_COLLECTION, id, { player: uid, ...record })) ? id : null;
}

/**
 * Give the visit back. What it was taken for did not happen, so the
 * window should not be spent on it
 */
async function releaseVisit(id: string): Promise<void> {
  await getAdminFirestore().collection(NPC_CLAIM_COLLECTION).doc(id).delete();
}

/**
 * One parent as the breeding rules read it, from a stored catch the
 * player must own and must not have fighting
 */
function asParent(caught: Record<string, unknown> | null, uid: string): BreedingParent | null {
  // A locked pokemon may still be a parent: breeding changes nothing
  // about either of them — the egg is a third record — and the two are
  // handed straight back
  if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
    return null;
  }

  const record = asCaughtPokemon(caught);

  return {
    species: record.species,
    gender: record.gender,
    ivs: record.ivs,
    moves: record.moves,
    shadow: isShadow(record),
    egg: isEgg(record),
  };
}

/**
 * Leave two pokemon with the breeder. The pair is checked against the
 * breeding rules here, from the stored records rather than from what
 * the caller says about them, and the fee is only taken once the two
 * are known to be compatible.
 *
 * Neither parent is consumed or held: they are handed back the moment
 * the egg is written, which is why nothing about them is locked.
 *
 * Resolves the new egg's catch id, or null when the pair cannot
 * breed, the player cannot pay, or no breeder is standing there
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

  const db = getAdminFirestore();
  const stored = await db.getAll(
    db.collection(CAUGHT_COLLECTION).doc(left),
    db.collection(CAUGHT_COLLECTION).doc(right),
  );
  const pair = stored.map((entry) => asParent(docData(entry), uid));
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

  try {
    return await grantBredEgg(uid, snapshot, seed, species, [first, second], now, offset, locale);
  } catch (error) {
    // The fee bought an egg that was never written; the player keeps
    // their gold and their visit rather than the breeder keeping both
    await grantGold(uid, BREEDING_FEE);
    await releaseVisit(visit);
    throw error;
  }
}

/**
 * What Nurse Joy did to one pokemon, or null when there was nothing
 * of hers to do for it
 */
function tended(caught: Record<string, unknown>, uid: string): UpdateFields | null {
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
    ...purified,
    health: getMaxHealth({ ...record, ivs: purifyIVs(record.ivs) }),
    statuses: 0,
  };
}

/**
 * Walk a party up to Nurse Joy. She takes up to `NURSE_CARE_LIMIT` of
 * them, hands every one back at full health with nothing left on it,
 * and purifies any shadow among them — all of it for nothing.
 *
 * What she charges instead is the window: the claim marker at
 * npcClaims/{cell key}:{uid} is taken once she has actually done
 * something, so a player gets one visit per NPC window and an empty
 * ask — a party already whole — costs them nothing.
 *
 * Resolves the ids she tended, or null when she is not standing there,
 * none of them are the player's to hand over, there was nothing to do,
 * or this window's visit has already been made
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

  const db = getAdminFirestore();
  const refs = catches.map((id) => db.collection(CAUGHT_COLLECTION).doc(id));
  const stored = await db.getAll(...refs);
  const care: [FirebaseFirestore.DocumentReference, UpdateFields][] = [];

  for (const [at, entry] of stored.entries()) {
    const caught = docData(entry);
    const fields = caught == null ? null : tended(caught, uid);

    if (fields != null) {
      care.push([refs[at], fields]);
    }
  }

  // Nothing of hers to do, so the visit is not spent on it
  if (care.length === 0) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'nurse', cell, uid, { catches });

  if (visit == null) {
    return null;
  }

  const batch = db.batch();

  for (const [ref, fields] of care) {
    batch.update(ref, fields);
  }

  try {
    await batch.commit();
  } catch (error) {
    // She was asked and did nothing; the window is given back rather
    // than spent on a write that never landed
    await releaseVisit(visit);
    throw error;
  }

  return care.map(([ref]) => ref.id);
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

  const db = getAdminFirestore();
  const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
  const stored = docData(await ref.get());

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
    await ref.update({ steps: warmed, steppedAt: now });
  } catch (error) {
    await grantGold(uid, DAYCARE_FEE);
    await releaseVisit(visit);
    throw error;
  }
  return warmed;
}

/**
 * Have the groomer see to a pokemon: half of whatever friendship it
 * had left to give is added to what it already thinks of its owner.
 *
 * It is the daycare lady's bargain moved from the egg to the pokemon.
 * A share of the remainder rather than a place on it means the first
 * grooming is worth a great deal to a pokemon fresh out of a ball and
 * almost nothing to one that is already inseparable — gold buys the
 * early half of a friendship and can never buy the last of it.
 *
 * Resolves what the pokemon now thinks, or null when it is not the
 * player's, is still an egg, is fighting, already thinks as well of
 * them as it can, or no groomer is standing there
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

  const db = getAdminFirestore();
  const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
  const stored = docData(await ref.get());

  // An egg thinks nothing of anybody yet: what is inside it has not
  // met the player, and the shell is what the daycare lady is for
  // A locked pokemon is still groomed: friendship is the one thing a
  // lock leaves alone, and being fussed over is not being changed
  if (stored == null || stored.owner !== uid || isEggRecord(stored) || isCatchLocked(stored)) {
    return null;
  }

  const caught = asCaughtPokemon(stored);
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
    await ref.update({ friendship: groomed });
  } catch (error) {
    await grantGold(uid, GROOMING_FEE);
    await releaseVisit(visit);
    throw error;
  }
  return groomed;
}

/**
 * Have the Move Reminder put back a move the pokemon learned by
 * levelling and has since lost, for one Heart Scale.
 *
 * What he may put back is not the caller's to say: the recallable list
 * is derived again here from the **stored** species, level and move
 * list, so a client asking for a move the pokemon never learned — or
 * one it already knows — is refused rather than charged.
 *
 * `replaces` names which of the known moves the recalled one goes over
 * and is ignored by a pokemon that still has room. The scale leaves
 * the bag in the same transaction the move list is written in, so it
 * is **only ever consumed when the move is actually taught**.
 *
 * Resolves the move list as it now stands, or null when he refuses:
 * the catch is not the player's, it is fighting, locked or still an
 * egg, the move is not one he can give back, no scale is carried, or
 * this window's visit has already been made
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
): Promise<Moves[] | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.MoveReminder);

  if (snapshot == null) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'remind', cell, uid, { caught: catchId, move });

  if (visit == null) {
    return null;
  }

  let taught: Moves[] | null;

  try {
    taught = await learnMove(uid, catchId, move, REMINDER_FEE, replaces, (species, level, known) =>
      new Set(getRecallableMoves(species, level, known)).has(move),
    );
  } catch (error) {
    await releaseVisit(visit);
    throw error;
  }

  // He was asked and gave nothing back — no scale, the wrong move, a
  // pokemon he cannot touch. The window is given back with it
  if (taught == null) {
    await releaseVisit(visit);
  }
  return taught;
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
 * was never taken is a mint. Both documents are read and written
 * together, so neither can happen.
 *
 * Resolves null when the player cannot cover their side of it
 */
async function trade(
  uid: string,
  basket: [item: Items, amount: number][],
  gold: number,
): Promise<TradeResult | null> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const purse = db.collection(PROFILE_COLLECTION).doc(uid);
    // Every read happens before any write, which is Firestore's own
    // rule for a transaction — and the bag is one document, so a
    // basket of six kinds is still one read and one write
    const [profile, ...carried] = await Promise.all([
      transaction.get(purse),
      ...basket.map(async ([item]) => readStackIn(transaction, ITEM_STACKS, uid, item)),
    ]);
    const balance = asNumber(docData(profile)?.gold) + gold;
    const held = basket.map(([, amount], at) => carried[at] + amount);

    // The player cannot pay, or is selling what they have not got.
    // The whole basket is refused rather than the affordable part of
    // it: a trade a player agreed to is one trade
    if (balance < 0 || held.some((count) => count < 0)) {
      return null;
    }

    transaction.set(purse, { gold: balance }, { merge: true });
    for (const [at, [item]] of basket.entries()) {
      writeStackIn(transaction, ITEM_STACKS, uid, item, held[at]);
    }
    return { gold: balance, carried: held.reduce((total, count) => total + count, 0) };
  });
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
 * Buy from the vendor's crate.
 *
 * What he is carrying is not the caller's to say: the crate is derived
 * from the same seed he was, so everything in the basket has to be one
 * of the six he is actually standing behind this window. The price is
 * the registry's `buy`, which is what makes an item worth the same
 * from every vendor in the world.
 *
 * The **whole basket is one trade**: one transaction, one write to the
 * purse and one to the bag, so a player who agreed to six kinds gets
 * six kinds or none. He is also the one wanderer who is **not** once
 * per window — a trader who sold a player one potion every six hours
 * would not be a trader.
 *
 * Resolves the balance and what the bag now holds of it, or null when
 * he is not standing there, is not carrying something in the basket,
 * or the player cannot pay
 */
export async function buyFromVendor(
  uid: string,
  x: number,
  y: number,
  cell: number,
  basket: [item: Items, amount: number][],
  now: number,
  offset: number,
): Promise<TradeResult | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.Vendor);

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
): Promise<TradeResult | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.Vendor);

  if (snapshot == null) {
    return null;
  }

  const paid = priced(basket, (item) => (isMarketable(item) ? getItemData(item).sell : 0));

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
