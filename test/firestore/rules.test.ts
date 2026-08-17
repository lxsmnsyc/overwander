import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import {
  type Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  AUCTION_COLLECTION,
  AUCTION_SELLER_COLLECTION,
  BAG_COLLECTION,
  BATTLE_AFTERMATH_COLLECTION,
  BATTLE_COLLECTION,
  BERRY_CLAIM_COLLECTION,
  BID_COLLECTION,
  CACHE_CLAIM_COLLECTION,
  CAUGHT_COLLECTION,
  ENCOUNTER_COLLECTION,
  FLED_COLLECTION,
  GIFT_COLLECTION,
  NEST_CLAIM_COLLECTION,
  NPC_CLAIM_COLLECTION,
  PHENOMENON_CLAIM_COLLECTION,
  POKEDEX_COLLECTION,
  POSITION_COLLECTION,
  PROFILE_COLLECTION,
  RAID_COLLECTION,
  RAID_REWARD_COLLECTION,
  ROCKET_COLLECTION,
  SNAPSHOT_COLLECTION,
  TEAM_COLLECTION,
  TEAM_SNAPSHOT_COLLECTION,
  bidEntryId,
} from '../../src/auth/collections';

/**
 * What `firestore.rules` actually does, asked of the rules engine
 * rather than read off the file.
 *
 * These are the only tests in the repository that need something
 * running: the rules language has no interpreter outside the
 * emulator, and every mistake it admits is one that reads perfectly.
 * A `read` where a `get` was meant looks right until a query arrives
 * and every id wildcard is null; a condition on a field nobody wrote
 * is not an error but a quiet denial; and `allow write: if false` is
 * indistinguishable from a missing rule until something tries.
 *
 * They live apart from the rest of the suite for that reason — see
 * `vitest.rules.ts` and the `test:rules` script, which starts the
 * emulator, runs them, and stops it again.
 */

/**
 * The emulator's own project. A `demo-` prefix is what keeps it
 * offline, and it has to match the id the app and `firebase.json`
 * use, since a run of the emulator holds one project at a time
 */
const PROJECT = 'demo-poketerra';

/**
 * Where to find it. The default is the port in `firebase.json`, and
 * the override exists because these tests **empty the store between
 * cases** — running them against an emulator somebody is using would
 * take their local data with them. A second emulator on another port
 * is the way to run them while one is already up
 */
const FIRESTORE_PORT = Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);

const ALICE = 'alice';
const BOB = 'bob';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: FIRESTORE_PORT,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

// Each test says what it needs, so nothing may be left behind by the
// one before it — a document another test seeded is the difference
// between "the rule allows this" and "the document was already there"
beforeEach(async () => {
  await env.clearFirestore();
});

/**
 * A store to make requests against.
 *
 * The cast is version skew and nothing more. `rules-unit-testing`
 * declares its return as the **compat** Firestore — the namespaced
 * shape from the v8 SDK it still types against — while the instance
 * it actually hands back is the modular one every call below takes.
 * The two differ by a couple of fields nobody here touches, so the
 * cast says which of the declarations is true rather than papering
 * over a mismatch
 */
function storeOf(context: { firestore: () => unknown }): Firestore {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return context.firestore() as Firestore;
}

/**
 * The store as a signed-in player sees it
 */
function as(uid: string): Firestore {
  return storeOf(env.authenticatedContext(uid));
}

/**
 * The store as somebody who has not signed in. Worth asking of every
 * rule, since `request.auth` being null is the one state a browser
 * can reach without doing anything at all
 */
function guest(): Firestore {
  return storeOf(env.unauthenticatedContext());
}

/**
 * Put a document where the rules would not let anybody put one. This
 * is how the server's writes are stood in for: everything the game
 * stores under `allow write: if false` gets there through the Admin
 * SDK, which the rules never see
 */
async function seed(path: string, data: Record<string, unknown>): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(storeOf(context), path), data);
  });
}

describe('profiles', () => {
  it('is readable by any signed-in player and by nobody else', async () => {
    await seed(`${PROFILE_COLLECTION}/${BOB}`, { nickname: 'Bob', gold: 40 });

    // A trade starts with looking somebody up, so a profile is not
    // private — but it is not public either
    await assertSucceeds(getDoc(doc(as(ALICE), PROFILE_COLLECTION, BOB)));
    await assertFails(getDoc(doc(guest(), PROFILE_COLLECTION, BOB)));
  });

  it('opens empty-handed', async () => {
    // The whole of the economy rests on this one: gold moves on the
    // server, and the only write a client makes to its own profile
    // that could name a balance is the first one
    await assertFails(setDoc(doc(as(ALICE), PROFILE_COLLECTION, ALICE), { gold: 500 }));
    await assertSucceeds(setDoc(doc(as(ALICE), PROFILE_COLLECTION, ALICE), { gold: 0 }));
  });

  it('refuses a profile created without a balance at all', async () => {
    // An absent field is not a zero. If it were allowed through, the
    // reader's default would be deciding what the balance is
    await assertFails(setDoc(doc(as(ALICE), PROFILE_COLLECTION, ALICE), { nickname: 'Alice' }));
  });

  it('opens as a player, whatever it says it is', async () => {
    // The role is authority the way gold is money: an account that
    // could name its own would be granting itself one
    await assertFails(
      setDoc(doc(as(ALICE), PROFILE_COLLECTION, ALICE), { gold: 0, role: 'admin' }),
    );
    // Saying it is a player is the same as not saying anything
    await assertSucceeds(setDoc(doc(as(ALICE), PROFILE_COLLECTION, ALICE), { gold: 0, role: '' }));
  });

  it('refuses a player granting themselves a role later', async () => {
    await seed(`${PROFILE_COLLECTION}/${ALICE}`, { nickname: 'Alice', gold: 40, role: '' });

    await assertFails(updateDoc(doc(as(ALICE), PROFILE_COLLECTION, ALICE), { role: 'admin' }));
  });

  it('is created only by the player it belongs to', async () => {
    await assertFails(setDoc(doc(as(BOB), PROFILE_COLLECTION, ALICE), { gold: 0 }));
  });

  it('lets a player change their details and nothing else', async () => {
    await seed(`${PROFILE_COLLECTION}/${ALICE}`, { nickname: 'Alice', gold: 40 });

    const mine = doc(as(ALICE), PROFILE_COLLECTION, ALICE);

    await assertSucceeds(updateDoc(mine, { nickname: 'Al', avatar: 25, buddy: 'catch-1' }));
    // The balance is the field this rule exists for, and a write that
    // moves it is refused by however little it moves
    await assertFails(updateDoc(mine, { gold: 41 }));
    await assertFails(updateDoc(mine, { gold: 39 }));
    // Naming it without moving it is allowed, which is worth knowing
    // rather than guessing at: `affectedKeys` is a **diff**, so a
    // field written over the value it already held is in no key set
    // at all. Nothing changes hands, and a rule that refused this
    // would refuse a client that sends the whole document back
    await assertSucceeds(updateDoc(mine, { gold: 40 }));
    // Anything the game has not thought of yet is refused too: the
    // rule names what may move rather than what may not
    await assertFails(updateDoc(mine, { badges: 8 }));
  });

  it('refuses an update to somebody else, and a delete to anyone', async () => {
    await seed(`${PROFILE_COLLECTION}/${BOB}`, { nickname: 'Bob', gold: 40 });

    await assertFails(updateDoc(doc(as(ALICE), PROFILE_COLLECTION, BOB), { nickname: 'Al' }));
    await assertFails(deleteDoc(doc(as(BOB), PROFILE_COLLECTION, BOB)));
  });
});

/**
 * The documents a player has one of, addressed by their own uid. Each
 * is a `get` rather than a `read` on purpose, and the tests below ask
 * the same four questions of all of them
 */
const OWN_BY_UID = [
  BAG_COLLECTION,
  POKEDEX_COLLECTION,
  POSITION_COLLECTION,
  FLED_COLLECTION,
  AUCTION_SELLER_COLLECTION,
];

describe.each(OWN_BY_UID)('%s', (name) => {
  beforeEach(async () => {
    await seed(`${name}/${ALICE}`, { player: ALICE });
    await seed(`${name}/${BOB}`, { player: BOB });
  });

  it('is read by its owner and by nobody else', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), name, ALICE)));
    await assertFails(getDoc(doc(as(BOB), name, ALICE)));
    await assertFails(getDoc(doc(guest(), name, ALICE)));
  });

  it('cannot be listed, even by a player who owns one', async () => {
    // The condition names the document's own id, which a query has
    // none of. Granting `read` here would not widen the rule so much
    // as break it — a list evaluates it with a null wildcard
    await assertFails(getDocs(collection(as(ALICE), name)));
  });

  it('is not written by a client', async () => {
    await assertFails(setDoc(doc(as(ALICE), name, ALICE), { player: ALICE }));
    await assertFails(updateDoc(doc(as(ALICE), name, ALICE), { player: BOB }));
    await assertFails(deleteDoc(doc(as(ALICE), name, ALICE)));
  });
});

/**
 * What every signed-in player may look at and none may write. These
 * are shared state — the board, the lobbies, the catch records a
 * trade is negotiated over — and each of them changes hands or
 * decides a reward, so the writing is the server's
 */
const SHARED_READABLE = [
  CAUGHT_COLLECTION,
  AUCTION_COLLECTION,
  RAID_COLLECTION,
  RAID_REWARD_COLLECTION,
  ROCKET_COLLECTION,
  TEAM_COLLECTION,
  TEAM_SNAPSHOT_COLLECTION,
  BATTLE_COLLECTION,
  BATTLE_AFTERMATH_COLLECTION,
  CACHE_CLAIM_COLLECTION,
  PHENOMENON_CLAIM_COLLECTION,
  BERRY_CLAIM_COLLECTION,
  NEST_CLAIM_COLLECTION,
  NPC_CLAIM_COLLECTION,
];

describe.each(SHARED_READABLE)('%s', (name) => {
  beforeEach(async () => {
    await seed(`${name}/one`, { player: BOB });
  });

  it('is read, both by name and as a list, only once signed in', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), name, 'one')));
    await assertSucceeds(getDocs(collection(as(ALICE), name)));
    await assertFails(getDoc(doc(guest(), name, 'one')));
    await assertFails(getDocs(collection(guest(), name)));
  });

  it('is not written by a client', async () => {
    await assertFails(setDoc(doc(as(ALICE), name, 'two'), { player: ALICE }));
    await assertFails(updateDoc(doc(as(ALICE), name, 'one'), { player: ALICE }));
    await assertFails(deleteDoc(doc(as(ALICE), name, 'one')));
  });
});

describe('snapshots', () => {
  // The one document a client writes. Its id is "{seed}:{zone}", and
  // the rule holds the body to the id so a player publishing a window
  // cannot publish it into another chunk's
  const WINDOW = 'seed-1:+08:00';
  const record = { seed: 'seed-1', offset: 480, timestamp: 1_700_000_000_000, spawns: [] };

  it('is published by any signed-in player', async () => {
    await assertSucceeds(setDoc(doc(as(ALICE), SNAPSHOT_COLLECTION, WINDOW), record));
    await assertFails(setDoc(doc(guest(), SNAPSHOT_COLLECTION, WINDOW), record));
  });

  it('holds the window to the chunk it is filed under', async () => {
    await assertFails(
      setDoc(doc(as(ALICE), SNAPSHOT_COLLECTION, WINDOW), { ...record, seed: 'seed-2' }),
    );
  });

  it('refuses a window whose fields are the wrong kind of thing', async () => {
    // A float timestamp is the one that would get through a check for
    // presence alone, and it is what a client-side clock produces
    await assertFails(
      setDoc(doc(as(ALICE), SNAPSHOT_COLLECTION, WINDOW), { ...record, timestamp: 1.5 }),
    );
    await assertFails(
      setDoc(doc(as(ALICE), SNAPSHOT_COLLECTION, WINDOW), { ...record, offset: '+08:00' }),
    );
    await assertFails(
      setDoc(doc(as(ALICE), SNAPSHOT_COLLECTION, WINDOW), { ...record, spawns: 3 }),
    );
    await assertFails(setDoc(doc(as(ALICE), SNAPSHOT_COLLECTION, WINDOW), { seed: 'seed-1' }));
  });

  it('is read by every signed-in player, since a zone shares one', async () => {
    await seed(`${SNAPSHOT_COLLECTION}/${WINDOW}`, record);

    await assertSucceeds(getDoc(doc(as(BOB), SNAPSHOT_COLLECTION, WINDOW)));
    await assertFails(getDoc(doc(guest(), SNAPSHOT_COLLECTION, WINDOW)));
  });
});

describe('encounters', () => {
  // Keyed "{parentId}:{uid}" — the uid is the second half here, not
  // the first, which is the sort of thing that reads as correct in
  // either order and fails silently in one of them
  const MINE = `spawn-1:${ALICE}`;
  const THEIRS = `spawn-1:${BOB}`;

  beforeEach(async () => {
    await seed(`${ENCOUNTER_COLLECTION}/${MINE}`, { player: ALICE });
    await seed(`${ENCOUNTER_COLLECTION}/${THEIRS}`, { player: BOB });
  });

  it('is read by the player it was rolled for', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), ENCOUNTER_COLLECTION, MINE)));
    await assertFails(getDoc(doc(as(ALICE), ENCOUNTER_COLLECTION, THEIRS)));
    await assertFails(getDoc(doc(guest(), ENCOUNTER_COLLECTION, MINE)));
  });

  it('cannot be listed or written', async () => {
    await assertFails(getDocs(collection(as(ALICE), ENCOUNTER_COLLECTION)));
    await assertFails(setDoc(doc(as(ALICE), ENCOUNTER_COLLECTION, MINE), { player: ALICE }));
  });
});

describe('gifts', () => {
  // The one collection a client cannot touch at all: a gift is
  // offered, listed and claimed through the server, and a gift a
  // player could clear is a gift they could take twice
  beforeEach(async () => {
    await seed(`${GIFT_COLLECTION}/starter:${ALICE}`, { player: ALICE, claimedAt: null });
  });

  it('is closed to everybody, signed in or not', async () => {
    await assertFails(getDoc(doc(as(ALICE), GIFT_COLLECTION, `starter:${ALICE}`)));
    await assertFails(getDocs(collection(as(ALICE), GIFT_COLLECTION)));
    await assertFails(
      setDoc(doc(as(ALICE), GIFT_COLLECTION, `starter:${ALICE}`), { player: ALICE }),
    );
    await assertFails(deleteDoc(doc(as(ALICE), GIFT_COLLECTION, `starter:${ALICE}`)));
  });
});

describe('bids', () => {
  // The collection whose two halves of a read ask different
  // questions: a `get` knows the id and a `list` does not
  const MINE = bidEntryId(ALICE, 'auction-1');
  const THEIRS = bidEntryId(BOB, 'auction-1');

  beforeEach(async () => {
    await seed(`${BID_COLLECTION}/${MINE}`, { player: ALICE, auction: 'auction-1', amount: 40 });
    await seed(`${BID_COLLECTION}/${THEIRS}`, { player: BOB, auction: 'auction-1', amount: 60 });
  });

  it('hands a player their own row by name', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), BID_COLLECTION, MINE)));
    await assertFails(getDoc(doc(as(ALICE), BID_COLLECTION, THEIRS)));
    await assertFails(getDoc(doc(guest(), BID_COLLECTION, MINE)));
  });

  it('lists a history only to the player who filtered for their own', async () => {
    const mine = query(collection(as(ALICE), BID_COLLECTION), where('player', '==', ALICE));

    await assertSucceeds(getDocs(mine));
    // What the filter is for. A query that does not narrow to the
    // asking player would return a document the rule fails for, and
    // Firestore refuses the query whole rather than trimming it
    await assertFails(getDocs(collection(as(ALICE), BID_COLLECTION)));
    await assertFails(
      getDocs(query(collection(as(ALICE), BID_COLLECTION), where('player', '==', BOB))),
    );
    await assertFails(
      getDocs(query(collection(guest(), BID_COLLECTION), where('player', '==', ALICE))),
    );
  });

  it('returns only that player, and every row of theirs', async () => {
    // A rule refusing what it should have allowed looks the same as
    // one that allowed nothing, so the rows are counted
    await seed(`${BID_COLLECTION}/${bidEntryId(ALICE, 'auction-2')}`, {
      player: ALICE,
      auction: 'auction-2',
      amount: 10,
    });

    const found = await getDocs(
      query(collection(as(ALICE), BID_COLLECTION), where('player', '==', ALICE)),
    );

    expect(found.docs.map((row) => row.id).sort()).toStrictEqual(
      [MINE, bidEntryId(ALICE, 'auction-2')].sort(),
    );
  });

  it('is not written by a client, not even its own', async () => {
    // Bidding moves gold, so what a bid says was bid is written by
    // the server that took it
    await assertFails(setDoc(doc(as(ALICE), BID_COLLECTION, MINE), { player: ALICE, amount: 1 }));
    await assertFails(updateDoc(doc(as(ALICE), BID_COLLECTION, MINE), { amount: 1 }));
    await assertFails(deleteDoc(doc(as(ALICE), BID_COLLECTION, MINE)));
  });
});
