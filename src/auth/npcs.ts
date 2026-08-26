import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import Npc from '../data/overworld/npc';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { requireUid } from '../server/auth';
import {
  type RevivedFossil,
  type TradeResult,
  boostEgg as boostOnServerSide,
  breedCatches as breedOnServerSide,
  buyFossil as buyFossilOnServerSide,
  buyFromVendor as buyOnServerSide,
  countVisit,
  groomCatch as groomOnServerSide,
  remindMove as remindOnServerSide,
  reviveFossil as reviveOnServerSide,
  sellToVendor as sellOnServerSide,
  tutorMove as tutorOnServerSide,
  visitNurse as visitNurseOnServerSide,
} from '../server/npcs';
import { syncServerClock } from './clock';
import { getLocale } from './local-time';
import getIdToken from './session';
import getSupabase from './supabase';

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
  const uid = await requireUid(token);

  return countVisit(
    uid,
    Npc.Breeder,
    await breedOnServerSide(uid, x, y, cell, parents, await syncServerClock(), offset, locale),
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
  const uid = await requireUid(token);

  return countVisit(
    uid,
    Npc.DaycareLady,
    await boostOnServerSide(uid, x, y, cell, catchId, await syncServerClock(), offset),
  );
}

/**
 * Hand a party to Nurse Joy. Up to `NURSE_CARE_LIMIT` of them per
 * handover come back at full health with nothing left on them, and
 * any shadow among them comes back purified — the Shadow ability
 * replaced, the doubled candy cost gone, every value 2 higher, and
 * the friendship a shadow never arrived with handed over.
 *
 * She takes nothing for it and turns nobody away: the cap is the
 * handover's, and there is no limit on how often she is asked.
 *
 * Resolves the ids she actually tended, or null when she is not
 * standing there or there was nothing to do
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
  const uid = await requireUid(token);

  return countVisit(
    uid,
    Npc.NurseJoy,
    await visitNurseOnServerSide(uid, x, y, cell, catches, await syncServerClock(), offset),
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
  const uid = await requireUid(token);

  return countVisit(
    uid,
    Npc.Groomer,
    await groomOnServerSide(uid, x, y, cell, catchId, await syncServerClock(), offset),
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
  const uid = await requireUid(token);

  return countVisit(
    uid,
    Npc.MoveReminder,
    await remindOnServerSide(
      uid,
      x,
      y,
      cell,
      catchId,
      move,
      replaces,
      await syncServerClock(),
      offset,
    ),
  );
}

/**
 * Have the Move Tutor teach a move from the species' teachable list,
 * for gold. Which moves he offers is derived, so the client already
 * knows the list (`getTutorableMoves`) and the server derives it
 * again from the stored record before it takes the fee.
 *
 * Resolves the move list as it now stands, or null when he refuses
 */
export async function tutorMove(
  snapshot: ChunkSnapshot,
  cell: number,
  catchId: string,
  move: Moves,
  replaces = 0,
): Promise<Moves[] | null> {
  return tutorOnServer(
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

async function tutorOnServer(
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
  const uid = await requireUid(token);

  return countVisit(
    uid,
    Npc.MoveTutor,
    await tutorOnServerSide(
      uid,
      x,
      y,
      cell,
      catchId,
      move,
      replaces,
      await syncServerClock(),
      offset,
    ),
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
  trader: Npc = Npc.Vendor,
): Promise<TradeResult | null> {
  return buyOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    basket,
    snapshot.offset,
    trader,
  );
}

async function buyOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  basket: [item: Items, amount: number][],
  offset: number,
  trader: Npc,
): Promise<TradeResult | null> {
  'use server';
  const uid = await requireUid(token);

  // The server refuses a trader that is not one, and refuses a cell
  // where they are not standing — so the caller's word only picks
  // which counter is being asked
  return countVisit(
    uid,
    trader,
    await buyOnServerSide(uid, x, y, cell, basket, await syncServerClock(), offset, trader),
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
  trader: Npc = Npc.Vendor,
): Promise<TradeResult | null> {
  return sellOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    basket,
    snapshot.offset,
    trader,
  );
}

async function sellOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  basket: [item: Items, amount: number][],
  offset: number,
  trader: Npc,
): Promise<TradeResult | null> {
  'use server';
  const uid = await requireUid(token);

  return countVisit(
    uid,
    trader,
    await sellOnServerSide(uid, x, y, cell, basket, await syncServerClock(), offset, trader),
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
  const uid = await requireUid(token);

  return countVisit(
    uid,
    Npc.FossilManiac,
    await buyFossilOnServerSide(uid, x, y, cell, item, await syncServerClock(), offset),
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
  const uid = await requireUid(token);

  return countVisit(
    uid,
    Npc.FossilScientist,
    await reviveOnServerSide(uid, x, y, cell, item, await syncServerClock(), offset, locale),
  );
}

/**
 * Whether whoever is standing at the cell has already dealt with the
 * signed-in player this window. The claim rows are readable by their
 * owner, so a dialog can show "sold" instead of offering a press the
 * server would only refuse
 */
export async function hasVisited(
  snapshot: ChunkSnapshot,
  tag: string,
  cell: number,
): Promise<boolean> {
  const { data } = await getSupabase()
    .from('npc_claims')
    .select('marker')
    .eq('marker', snapshot.visitMarker(tag, cell));

  return (data ?? []).length > 0;
}
