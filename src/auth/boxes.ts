import { readOnly } from '../utils/server-calls';
import type { BoxRecord } from './box-record';
import getIdToken from './session';
import { requireReader, requireUid } from '../server/auth';
import check, {
  BOX_COLOUR,
  BOX_LAYOUT,
  BOX_NAME,
  BOX_ORDER,
  CATCH_LIST,
  ID,
  MAYBE_ID,
  MAYBE_SLOT,
  TOKEN,
  UID,
} from '../server/validate';
import type { BulkOutcome } from '../server/caught';
import {
  type BoxLayout,
  arrangeBoxes as arrangeOnServerSide,
  dropBox as dropOnServerSide,
  editBox as editOnServerSide,
  emptyBox as emptyOnServerSide,
  fileCatches as fileOnServerSide,
  layOutBox as layOutOnServerSide,
  makeBox as makeOnServerSide,
  readBoxes as readOnServerSide,
} from '../server/boxes';

export * from './box-record';
export type { BoxLayout } from '../server/boxes';

/**
 * The player's boxes. Reads and writes both go through the server,
 * since filing names catch ids and only the server can say whose they
 * are. A box is private: another player's are never read.
 */

/** Every box this player has made, in their order */
export async function listBoxes(player: string): Promise<[string, BoxRecord][]> {
  return listBoxesOnServer(await getIdToken(), player);
}

async function listBoxesOnServer(token: string, player: string): Promise<[string, BoxRecord][]> {
  'use server';
  check(TOKEN, token);
  check(UID, player);
  const uid = await requireReader(token);

  return player === uid ? readOnServerSide(uid) : [];
}
readOnly(listBoxesOnServer);

/**
 * Make a box at the end of the list, with any catches given filed into
 * it. Resolves its id, or null when the name is empty or the player
 * already has `BOX_LIMIT`
 */
export async function makeBox(
  name: string,
  colour: number,
  catchIds: string[] = [],
): Promise<string | null> {
  return makeOnServer(await getIdToken(), name, colour, catchIds);
}

async function makeOnServer(
  token: string,
  name: string,
  colour: number,
  catchIds: string[],
): Promise<string | null> {
  'use server';
  check(TOKEN, token);
  check(BOX_NAME, name);
  check(BOX_COLOUR, colour);
  check(CATCH_LIST, catchIds);
  return makeOnServerSide(await requireUid(token), name, colour, catchIds);
}

/** Rename or recolour a box */
export async function editBox(box: string, name: string, colour: number): Promise<boolean> {
  return editOnServer(await getIdToken(), box, name, colour);
}

async function editOnServer(
  token: string,
  box: string,
  name: string,
  colour: number,
): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, box);
  check(BOX_NAME, name);
  check(BOX_COLOUR, colour);
  return editOnServerSide(await requireUid(token), box, name, colour);
}

/** Put the boxes in a new order, every one of them named once */
export async function arrangeBoxes(order: string[]): Promise<boolean> {
  return arrangeOnServer(await getIdToken(), order);
}

async function arrangeOnServer(token: string, order: string[]): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(BOX_ORDER, order);
  return arrangeOnServerSide(await requireUid(token), order);
}

/** Delete a box. What was in it goes back to Default */
export async function deleteBox(box: string): Promise<boolean> {
  return dropOnServer(await getIdToken(), box);
}

async function dropOnServer(token: string, box: string): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, box);
  return dropOnServerSide(await requireUid(token), box);
}

/**
 * File catches into a box, or into Default with `box` null. Given a
 * `slot`, they land in the first free squares from there on; one catch
 * dropped on another in the same box trades places with it
 */
export async function fileCatches(
  catchIds: string[],
  box: string | null,
  slot: number | null = null,
): Promise<BulkOutcome> {
  return fileOnServer(await getIdToken(), catchIds, box ?? '', slot);
}

async function fileOnServer(
  token: string,
  catchIds: string[],
  box: string,
  slot: number | null,
): Promise<BulkOutcome> {
  'use server';
  check(TOKEN, token);
  check(CATCH_LIST, catchIds);
  check(MAYBE_ID, box);
  check(MAYBE_SLOT, slot);
  return fileOnServerSide(await requireUid(token), catchIds, box === '' ? null : box, slot);
}

/** Move everything in one box to another, or to Default with `to` null */
export async function emptyBox(from: string, to: string | null): Promise<boolean> {
  return emptyOnServer(await getIdToken(), from, to ?? '');
}

async function emptyOnServer(token: string, from: string, to: string): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, from);
  check(MAYBE_ID, to);
  return emptyOnServerSide(await requireUid(token), from, to === '' ? null : to);
}

/** Close a box's gaps, or lay it out by dex number */
export async function layOutBox(box: string, layout: BoxLayout): Promise<boolean> {
  return layOutOnServer(await getIdToken(), box, layout);
}

async function layOutOnServer(token: string, box: string, layout: BoxLayout): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, box);
  check(BOX_LAYOUT, layout);
  return layOutOnServerSide(await requireUid(token), box, layout);
}
