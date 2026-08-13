import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { requireUid } from '../server/firebase';
import {
  type RevivedFossil,
  type TradeResult,
  boostEgg as boostOnServerSide,
  breedCatches as breedOnServerSide,
  buyFossil as buyFossilOnServerSide,
  buyFromVendor as buyOnServerSide,
  groomCatch as groomOnServerSide,
  remindMove as remindOnServerSide,
  reviveFossil as reviveOnServerSide,
  sellToVendor as sellOnServerSide,
  visitNurse as visitNurseOnServerSide,
} from '../server/npcs';
import { syncServerClock } from './clock';
import { getLocale } from './local-time';
import getIdToken from './session';

/**
 * The wandering NPCs, as the client asks them for things.
 *
 * Which of them is standing at a cell derives from the chunk, the
 * zone and the window, so the client already knows who it is walking up
 * to — `ChunkSnapshot.getWanderingNpcs`. The calls below are for what
 * they *do*, all of which moves gold and none of which the client is
 * trusted with: the server re-derives who is standing there before it
 * charges anything.
 */

export type { RevivedFossil, TradeResult } from '../server/npcs';

/**
 * Leave two pokemon with the breeder and take the egg. Both must be
 * the player's, neither may be an egg or in a battle, and the two
 * have to be compatible — the pairing rules are checked again on the
 * server, from the stored records.
 *
 * The breeder sees a player once per window: a second pair left at
 * the same cell before the passer-by changes is turned away, whatever
 * the player can pay.
 *
 * Resolves the new egg's catch id, or null when the breeder refuses,
 * the fee cannot be paid, or this window's visit has already been made
 */
export async function breed(
  snapshot: ChunkSnapshot,
  cell: number,
  parents: [string, string],
): Promise<string | null> {
  return breedOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    parents,
    snapshot.offset,
    getLocale(),
  );
}

async function breedOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  parents: [string, string],
  offset: number,
  locale: string,
): Promise<string | null> {
  'use server';
  return breedOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    parents,
    await syncServerClock(),
    offset,
    locale,
  );
}

/**
 * Have the daycare lady warm an egg: half of what hatching costs is
 * added to wherever it already was, so an egg a quarter of the way
 * along comes out three quarters of the way. An egg already ready to
 * hatch is refused, and so is a second egg brought to the same cell in
 * the same window — she sees a player once, the way everyone who
 * wanders does.
 *
 * Resolves the egg's new step count, or null when she refuses
 */
export async function boostEgg(
  snapshot: ChunkSnapshot,
  cell: number,
  catchId: string,
): Promise<number | null> {
  return boostOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    catchId,
    snapshot.offset,
  );
}

async function boostOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  offset: number,
): Promise<number | null> {
  'use server';
  return boostOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    catchId,
    await syncServerClock(),
    offset,
  );
}

/**
 * Hand a party to Nurse Joy. Up to `NURSE_CARE_LIMIT` of them come
 * back at full health with nothing left on them, and any shadow among
 * them comes back purified — the Shadow ability replaced, the doubled
 * candy cost gone, every value two higher.
 *
 * She takes nothing for it. What she asks instead is that it be once:
 * the server marks the visit against her window, and a party that
 * needed nothing is turned away without spending it.
 *
 * Resolves the ids she actually tended, or null when she is not
 * standing there, there was nothing to do, or this window's visit has
 * already been made
 */
export async function visitNurse(
  snapshot: ChunkSnapshot,
  cell: number,
  catches: string[],
): Promise<string[] | null> {
  return visitNurseOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    catches,
    snapshot.offset,
  );
}

async function visitNurseOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  catches: string[],
  offset: number,
): Promise<string[] | null> {
  'use server';
  return visitNurseOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    catches,
    await syncServerClock(),
    offset,
  );
}

/**
 * Have the groomer see to a pokemon: half of whatever friendship it
 * had left to give, bought rather than walked for. A pokemon that
 * already thinks as well of the player as it can is refused, and so is
 * a second pokemon brought to the same cell in the same window.
 *
 * Resolves what the pokemon now thinks of its owner, or null when the
 * groomer refuses
 */
export async function groomCatch(
  snapshot: ChunkSnapshot,
  cell: number,
  catchId: string,
): Promise<number | null> {
  return groomOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    catchId,
    snapshot.offset,
  );
}

async function groomOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  offset: number,
): Promise<number | null> {
  'use server';
  return groomOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    catchId,
    await syncServerClock(),
    offset,
  );
}

/**
 * Have the Move Reminder put a forgotten level-up move back on one of
 * the player's pokemon, for one Heart Scale.
 *
 * Which moves he can give back is derived from the species and the
 * level, so the client already knows the list — `getRecallableMoves` —
 * and the server derives it again from the stored record before it
 * takes the scale. `replaces` names which of the known moves it goes
 * over, and is ignored by a pokemon that still has room.
 *
 * The scale is spent in the same transaction the move list is written
 * in, so it is only ever consumed when the move is actually taught.
 *
 * Resolves the move list as it now stands, or null when he refuses
 */
export async function remindMove(
  snapshot: ChunkSnapshot,
  cell: number,
  catchId: string,
  move: Moves,
  replaces = 0,
): Promise<Moves[] | null> {
  return remindOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    catchId,
    move,
    replaces,
    snapshot.offset,
  );
}

async function remindOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  move: Moves,
  replaces: number,
  offset: number,
): Promise<Moves[] | null> {
  'use server';
  return remindOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    catchId,
    move,
    replaces,
    await syncServerClock(),
    offset,
  );
}

/**
 * Buy from the vendor's crate. What he is carrying is derived, so the
 * client already knows it — `ChunkSnapshot.getVendorStock` — and the
 * server derives it again before it takes a coin.
 *
 * The whole basket is one trade: it lands entire or not at all.
 *
 * He is the one wanderer a player may deal with as often as they like
 * while he is standing there: what limits him is the crate and the
 * purse rather than a once-a-window marker.
 *
 * Resolves the balance and the stack afterwards, or null when he is
 * not carrying it or the player cannot pay
 */
export async function buyFromVendor(
  snapshot: ChunkSnapshot,
  cell: number,
  basket: [item: Items, amount: number][],
): Promise<TradeResult | null> {
  return buyOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    basket,
    snapshot.offset,
  );
}

async function buyOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  basket: [item: Items, amount: number][],
  offset: number,
): Promise<TradeResult | null> {
  'use server';
  return buyOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    basket,
    await syncServerClock(),
    offset,
  );
}

/**
 * Sell to the vendor. He takes anything the market puts a price on —
 * wider than what he sells — and pays what the registry says one
 * fetches, which is half of what he charges for the same thing.
 *
 * The whole basket is one trade: a bag short of one line sells
 * nothing rather than part of it.
 *
 * Resolves the balance and what is left of the stack, or null when he
 * will not price it or the player has not got that many
 */
export async function sellToVendor(
  snapshot: ChunkSnapshot,
  cell: number,
  basket: [item: Items, amount: number][],
): Promise<TradeResult | null> {
  return sellOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    basket,
    snapshot.offset,
  );
}

async function sellOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  basket: [item: Items, amount: number][],
  offset: number,
): Promise<TradeResult | null> {
  'use server';
  return sellOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    basket,
    await syncServerClock(),
    offset,
  );
}

/**
 * Buy one fossil off the Fossil Maniac. Which two he is carrying is
 * derived, so the client already knows them —
 * `ChunkSnapshot.getFossilOffer` — and the server derives the pair
 * again before it takes a coin.
 *
 * He sells a player one while he is standing there.
 *
 * Resolves the balance and how many of that fossil are now carried,
 * or null when he is not holding it, the purse will not cover it, or
 * he has already sold to this player this window
 */
export async function buyFossil(
  snapshot: ChunkSnapshot,
  cell: number,
  item: Items,
): Promise<TradeResult | null> {
  return buyFossilOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    item,
    snapshot.offset,
  );
}

async function buyFossilOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  item: Items,
  offset: number,
): Promise<TradeResult | null> {
  'use server';
  return buyFossilOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    item,
    await syncServerClock(),
    offset,
  );
}

/**
 * Hand a fossil to the Fossil Scientist and take back what was in it.
 * Which species that is belongs to the fossil, and the level is
 * fixed, so nothing about the outcome is the client's to name.
 *
 * He is the one wanderer besides the vendor who is not once a window:
 * a player carrying three fossils may open all three.
 *
 * Resolves what came out, or null when he refuses — he is not
 * standing there, or the fossil is not in the bag
 */
export async function reviveFossil(
  snapshot: ChunkSnapshot,
  cell: number,
  item: Items,
): Promise<RevivedFossil | null> {
  return reviveOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    item,
    snapshot.offset,
    getLocale(),
  );
}

async function reviveOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  item: Items,
  offset: number,
  locale: string,
): Promise<RevivedFossil | null> {
  'use server';
  return reviveOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    item,
    await syncServerClock(),
    offset,
    locale,
  );
}
