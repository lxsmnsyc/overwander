import 'server-only';
import { BOX_COLOURS, BOX_LIMIT, BOX_SLOT_LIMIT, type BoxRecord } from '../auth/box-record';
import { asNickname } from '../auth/nickname';
import { getSpeciesData } from '../data/species';
import type { BulkOutcome } from './caught';
import { type Tx, getSql, newDocId, tx } from './db';
import { asNumber, asString } from './read';

/**
 * Boxes: folders a player files their catches into.
 *
 * A box is presentation and nothing else. Raids, trades, the buddy and
 * the auction block read catches as they always have, so a pokemon in a
 * fight or on the block can still be filed. What a box keeps is which
 * catches are in it and in which square, and squares may be left empty
 * so a living dex can hold a place for what it is missing.
 */

/** Every box the player has made, in their order */
export async function readBoxes(uid: string): Promise<[string, BoxRecord][]> {
  const rows = await getSql()`
    select id, name, colour, position from boxes where player = ${uid} order by position, made_at
  `;
  const boxes: [string, BoxRecord][] = [];

  for (const row of rows) {
    boxes.push([
      asString(row.id),
      { name: asString(row.name), colour: asNumber(row.colour), position: asNumber(row.position) },
    ]);
  }
  return boxes;
}

/** A name as stored, or null when nothing writable is left of it */
function asBoxName(name: string): string | null {
  const written = asNickname(name);

  return written === '' ? null : written;
}

function isColour(colour: number): boolean {
  return Number.isInteger(colour) && colour >= 0 && colour < BOX_COLOURS.length;
}

/**
 * The box itself, locked, when it is the player's. Locking it is what
 * keeps two filings into one box from both choosing the same free
 * square
 */
async function lockBox(transaction: Tx, uid: string, box: string): Promise<boolean> {
  const held = await transaction`
    select id from boxes where id = ${box} and player = ${uid} for update
  `;

  return held.length > 0;
}

/** Which squares of a box are taken, and by what */
async function readSquares(transaction: Tx, box: string): Promise<Map<number, string>> {
  const rows = await transaction`
    select id, box_slot from caught where box = ${box} and box_slot is not null
  `;
  const squares = new Map<number, string>();

  for (const row of rows) {
    squares.set(asNumber(row.box_slot), asString(row.id));
  }
  return squares;
}

/**
 * Write where each catch now sits, in one statement. Everything moving
 * is taken out first, so a run shuffled inside one box never trips
 * over a square it is about to leave
 */
async function place(
  transaction: Tx,
  box: string | null,
  placed: [string, number][],
): Promise<void> {
  if (placed.length === 0) {
    return;
  }

  const ids: string[] = [];
  const slots: number[] = [];

  for (const [id, slot] of placed) {
    ids.push(id);
    slots.push(slot);
  }
  await transaction`update caught set box = null, box_slot = null where id in ${transaction(ids)}`;
  if (box == null) {
    return;
  }
  await transaction`
    update caught set box = ${box}, box_slot = moved.slot
    from unnest(${ids}::text[], ${slots}::int[]) as moved(id, slot)
    where caught.id = moved.id
  `;
}

/** Catches headed for Default, which keeps no squares */
function unplaced(ids: string[]): [string, number][] {
  const placed: [string, number][] = [];

  for (const id of ids) {
    placed.push([id, 0]);
  }
  return placed;
}

/**
 * Squares for a run of catches, in order: the first free one at or
 * after `from` for each, skipping any held by something that is
 * staying put. Null when the box would run past its last square
 */
function freeSquares(taken: ReadonlySet<number>, count: number, from: number): number[] | null {
  const found: number[] = [];

  for (let slot = from; found.length < count; slot++) {
    if (slot > BOX_SLOT_LIMIT) {
      return null;
    }
    if (!taken.has(slot)) {
      found.push(slot);
    }
  }
  return found;
}

/**
 * File catches into a box, or back into Default with `box` null.
 *
 * Each lands in the box's first free square, or, given `slot`, in the
 * first free square from there on, in the order they were named. One
 * catch dropped on a square another holds in the same box trades
 * places with it, which is what dragging one onto another means. A
 * catch that is not the player's is refused; nothing else is
 */
export async function fileCatches(
  uid: string,
  catchIds: string[],
  box: string | null,
  slot: number | null,
): Promise<BulkOutcome> {
  const outcome: BulkOutcome = { done: [], refused: [] };
  const wanted = [...new Set(catchIds)];

  if (wanted.length === 0) {
    return outcome;
  }

  await tx(async (transaction) => {
    if (box != null && !(await lockBox(transaction, uid, box))) {
      outcome.refused.push(...wanted);
      return;
    }

    const rows = await transaction`
      select id, owner, box, box_slot from caught where id in ${transaction(wanted)} for update
    `;
    const found = new Map<string, Record<string, unknown>>();

    for (const row of rows) {
      found.set(asString(row.id), row);
    }

    const moving: string[] = [];

    for (const id of wanted) {
      if (asString(found.get(id)?.owner) === uid) {
        moving.push(id);
      } else {
        outcome.refused.push(id);
      }
    }
    if (moving.length === 0) {
      return;
    }
    if (box == null) {
      await place(transaction, null, unplaced(moving));
      outcome.done.push(...moving);
      return;
    }

    const squares = await readSquares(transaction, box);
    const leaving = new Set(moving);

    // Two catches in one box trade squares when one is dropped on the other
    if (moving.length === 1 && slot != null) {
      const [id] = moving;
      const held = squares.get(slot);
      const from = found.get(id);

      if (held != null && held !== id && asString(from?.box) === box && from?.box_slot != null) {
        await place(transaction, box, [
          [id, slot],
          [held, asNumber(from.box_slot)],
        ]);
        outcome.done.push(id);
        return;
      }
    }

    const taken = new Set<number>();

    for (const [square, id] of squares) {
      if (!leaving.has(id)) {
        taken.add(square);
      }
    }

    const landing = freeSquares(taken, moving.length, slot ?? 0);

    if (landing == null) {
      outcome.refused.push(...moving);
      return;
    }

    const placed: [string, number][] = [];

    for (const [at, id] of moving.entries()) {
      placed.push([id, landing[at]]);
    }
    await place(transaction, box, placed);
    outcome.done.push(...moving);
  });
  return outcome;
}

/**
 * Make a box at the end of the player's list, and file any catches
 * given into it. Resolves the new box's id, or null when the name is
 * empty, the colour unknown or the player is at `BOX_LIMIT`
 */
export async function makeBox(
  uid: string,
  name: string,
  colour: number,
  catchIds: string[],
): Promise<string | null> {
  const written = asBoxName(name);

  if (written == null || !isColour(colour)) {
    return null;
  }

  const id = await tx(async (transaction) => {
    // Every box of theirs locked, so two made at once cannot both find
    // room for the last one or take the same place in the list
    const held = await transaction`
      select position from boxes where player = ${uid} for update
    `;

    if (held.length >= BOX_LIMIT) {
      return null;
    }

    let next = 0;

    for (const row of held) {
      next = Math.max(next, asNumber(row.position) + 1);
    }

    const made = newDocId();

    await transaction`
      insert into boxes (id, player, name, colour, position, made_at)
      values (${made}, ${uid}, ${written}, ${colour}, ${next}, ${Date.now()})
    `;
    return made;
  });

  if (id != null && catchIds.length > 0) {
    await fileCatches(uid, catchIds, id, null);
  }
  return id;
}

/** Rename or recolour a box. Resolves false when it is not the player's or the name is empty */
export async function editBox(
  uid: string,
  box: string,
  name: string,
  colour: number,
): Promise<boolean> {
  const written = asBoxName(name);

  if (written == null || !isColour(colour)) {
    return false;
  }

  const changed = await getSql()`
    update boxes set name = ${written}, colour = ${colour}
    where id = ${box} and player = ${uid}
    returning id
  `;

  return changed.length > 0;
}

/**
 * Put the player's boxes in a new order. Every box of theirs has to be
 * named once, so a list read before a box was made or deleted is
 * refused rather than half applied
 */
export async function arrangeBoxes(uid: string, order: string[]): Promise<boolean> {
  return tx(async (transaction) => {
    const held = await transaction`select id from boxes where player = ${uid} for update`;
    const theirs = new Set<string>();

    for (const row of held) {
      theirs.add(asString(row.id));
    }

    const named = new Set(order);

    if (named.size !== order.length || named.size !== theirs.size) {
      return false;
    }
    for (const id of order) {
      if (!theirs.has(id)) {
        return false;
      }
    }
    await transaction`
      update boxes set position = arranged.place - 1
      from unnest(${order}::text[]) with ordinality as arranged(id, place)
      where boxes.id = arranged.id
    `;
    return true;
  });
}

/**
 * Delete a box. Its catches go back to Default rather than anywhere
 * worse: nothing is released by deleting a folder
 */
export async function dropBox(uid: string, box: string): Promise<boolean> {
  return tx(async (transaction) => {
    if (!(await lockBox(transaction, uid, box))) {
      return false;
    }
    await transaction`update caught set box = null, box_slot = null where box = ${box}`;
    await transaction`delete from boxes where id = ${box}`;
    return true;
  });
}

/**
 * Move everything in one box to another, or to Default with `to` null.
 * They keep their order, filling the destination's free squares from
 * the front
 */
export async function emptyBox(uid: string, from: string, to: string | null): Promise<boolean> {
  if (from === to) {
    return false;
  }

  return tx(async (transaction) => {
    // Locked in a fixed order, so two moves between the same pair of
    // boxes in opposite directions cannot wait on each other
    for (const id of to == null ? [from] : [from, to].sort()) {
      if (!(await lockBox(transaction, uid, id))) {
        return false;
      }
    }

    const rows = await transaction`
      select id from caught where box = ${from} order by box_slot, id
    `;
    const moving: string[] = [];

    for (const row of rows) {
      moving.push(asString(row.id));
    }
    if (to == null) {
      await place(transaction, null, unplaced(moving));
      return true;
    }

    const landing = freeSquares(
      new Set((await readSquares(transaction, to)).keys()),
      moving.length,
      0,
    );

    if (landing == null) {
      return false;
    }

    const placed: [string, number][] = [];

    for (const [at, id] of moving.entries()) {
      placed.push([id, landing[at]]);
    }
    await place(transaction, to, placed);
    return true;
  });
}

/** How a box can be laid out again in one press */
export type BoxLayout = 'dex' | 'packed';

/**
 * Lay a box out again.
 *
 * `packed` closes the gaps, keeping everything in the order it stands.
 * `dex` puts each pokemon in the square of its dex number, counted from
 * 1, so a box of a region's dex reads like the dex: the first of a
 * species caught takes the square, and any more of it go after the
 * last numbered one, in the order they stood
 */
export async function layOutBox(uid: string, box: string, layout: BoxLayout): Promise<boolean> {
  return tx(async (transaction) => {
    if (!(await lockBox(transaction, uid, box))) {
      return false;
    }

    const rows = await transaction`
      select id, species from caught where box = ${box}
      order by box_slot, caught_at_local, id
    `;
    const placed: [string, number][] = [];

    if (layout === 'packed') {
      for (const [at, row] of rows.entries()) {
        placed.push([asString(row.id), at]);
      }
      await place(transaction, box, placed);
      return true;
    }

    const numbered = new Set<number>();
    const extra: string[] = [];
    let last = -1;

    for (const row of rows) {
      const square = getSpeciesData(asNumber(row.species)).dexNumber - 1;

      if (square < 0 || square > BOX_SLOT_LIMIT || numbered.has(square)) {
        extra.push(asString(row.id));
        continue;
      }
      numbered.add(square);
      placed.push([asString(row.id), square]);
      last = Math.max(last, square);
    }

    const landing = freeSquares(numbered, extra.length, last + 1);

    if (landing == null) {
      return false;
    }
    for (const [at, id] of extra.entries()) {
      placed.push([id, landing[at]]);
    }
    await place(transaction, box, placed);
    return true;
  });
}
