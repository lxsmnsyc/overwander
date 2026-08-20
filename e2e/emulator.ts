import { expect } from '@playwright/test';
import type { Player } from './game';

/**
 * Writing straight into the emulator, past the rules.
 *
 * Nearly everything a browser test needs can be reached by playing the
 * game, and where it can be, it is. Some of it cannot: a raid has to be
 * standing under the player's feet in the right window, and a lot on
 * the auction board has to have been listed by somebody who is not the
 * player. Neither can be arranged from one browser.
 *
 * So those are written as documents. The emulators take the word
 * `owner` in place of a signed token and treat the caller as the
 * project's owner, which is what lets a test put a document somewhere
 * the security rules would refuse one. Everything after the write is
 * the real game reading it.
 */

const PROJECT = 'demo-poketerra';

export const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;

const AUTH = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT}`;
/**
 * The same emulator without the project in the path: signing up is an
 * ordinary client call rather than an administrative one
 */
const IDENTITY = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';

export const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

/**
 * Write one document, by collection and id
 */
export async function writeDocument(
  collection: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(`${FIRESTORE}/${collection}?documentId=${id}`, {
    method: 'POST',
    headers: OWNER,
    body: JSON.stringify({ fields }),
  });

  expect(response.ok, `staging ${collection}/${id} failed: ${await response.text()}`).toBe(true);
}

/**
 * Rewrite named fields of a document that is already there.
 *
 * `writeDocument` creates, and creating something the game has already
 * written is refused — the dex is written the moment a player is
 * handed their starter, so a spec that wants a fuller one has to write
 * over it rather than beside it
 */
export async function patchDocument(
  collection: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const mask = Object.keys(fields)
    .map((field) => `updateMask.fieldPaths=${field}`)
    .join('&');
  const response = await fetch(`${FIRESTORE}/${collection}/${id}?${mask}`, {
    method: 'PATCH',
    headers: OWNER,
    body: JSON.stringify({ fields }),
  });

  expect(response.ok, `patching ${collection}/${id} failed: ${await response.text()}`).toBe(true);
}

/**
 * One document as the REST API hands it back: its id, and its fields
 * in Firestore's tagged-value shape
 */
export interface StoredDocument {
  id: string;
  fields: Record<string, unknown>;
}

/**
 * Every document of a collection whose field holds this string.
 *
 * A spec that has to reach a document the game wrote — the auction a
 * listing produced, the catch a starter grant rolled — cannot know its
 * id, since the server made it up. This asks the same question the
 * game's own queries ask
 */
export async function findDocuments(
  collection: string,
  field: string,
  value: string,
): Promise<StoredDocument[]> {
  const response = await fetch(`${FIRESTORE}:runQuery`, {
    method: 'POST',
    headers: OWNER,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } },
        },
      },
    }),
  });

  // The body is read once or the other way: asking for the text to
  // put in a failure message spends it, and the rows are what this is
  // for
  if (!response.ok) {
    expect(response.ok, `querying ${collection} failed: ${await response.text()}`).toBe(true);
  }

  const rows: unknown = await response.json();

  const found: StoredDocument[] = [];

  for (const row of Array.isArray(rows) ? rows : []) {
    const document = isRecord(row) ? row.document : null;

    if (!isRecord(document) || !isRecord(document.fields)) {
      continue;
    }
    found.push({
      // The REST API names a document by its whole path; the id is the
      // last step of it, which is what every other call here takes
      id: String(document.name).split('/').pop() ?? '',
      fields: document.fields,
    });
  }
  return found;
}

/**
 * The uid the auth emulator gave this account. A raid names its host by
 * uid and only the host may start it, so a test that stages one has to
 * know which uid the sign-in produced
 */
export async function uidOf(player: Player): Promise<string> {
  // The admin query rather than the emulator's own `accounts` path,
  // which only answers DELETE — asking it for a listing is a 405
  const response = await fetch(`${AUTH}/accounts:query`, {
    method: 'POST',
    headers: OWNER,
    body: JSON.stringify({ returnUserInfo: true }),
  });

  expect(response.ok, 'the auth emulator should list its accounts').toBe(true);

  const listed: unknown = await response.json();
  const users = isRecord(listed) && Array.isArray(listed.userInfo) ? listed.userInfo : [];
  const wanted = player.email.toLowerCase();

  for (const user of users) {
    if (isRecord(user) && user.email === wanted && typeof user.localId === 'string') {
      return user.localId;
    }
  }
  throw new Error(`no account for ${player.email}`);
}

/**
 * Open an account nobody signs into.
 *
 * Half of what a player does is done at somebody else, and some of it
 * needs that somebody to be a real account rather than a profile
 * document: a friend is looked up by the address they signed up with,
 * and an address lives in Firebase Auth. Resolves the uid the emulator
 * gave it
 */
export async function stageAccount(email: string): Promise<string> {
  // The key is not checked by the emulator, and there is no real
  // project behind this to check it against
  const response = await fetch(`${IDENTITY}/accounts:signUp?key=demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'walking-in-the-tall-grass', returnSecureToken: true }),
  });

  expect(response.ok, 'the auth emulator should open an account').toBe(true);

  const opened: unknown = await response.json();

  if (!isRecord(opened) || typeof opened.localId !== 'string') {
    throw new Error(`no account made for ${email}`);
  }
  return opened.localId;
}
