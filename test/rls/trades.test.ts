import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import { acceptTrade, cancelTrade, declineTrade, offerTrade } from '../../src/server/trades';
import { TradeStatus } from '../../src/auth/trade-record';
import { BASE_FRIENDSHIP } from '../../src/data/constants/friendship';
import { Species } from '../../src/data/ids/species';

// The server pool reads this lazily at its first query, safely after
// module load
process.env.SUPABASE_DB_URL ??= 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

/**
 * The trade flow, run through the real server functions against the
 * local stack: escrow in and out, the gold riding both ways, and the
 * row policy that keeps a trade between its two parties.
 */

const NOW = 1_700_000_000_000;
const OFFSET = 480;

let proposer: Actor;
let receiver: Actor;
let stranger: Actor;

/** What one player holds and who their catch's owner reads as */
async function ownerOf(catchId: string): Promise<string | null> {
  const rows = await sql`select owner from caught where id = ${catchId}`;

  return rows[0].owner == null ? null : String(rows[0].owner);
}

async function goldOf(uid: string): Promise<number> {
  const rows = await sql`select gold from profiles where id = ${uid}`;

  return Number(rows[0].gold);
}

/** Two friends with a catch each, the proposer with a spare */
beforeEach(async () => {
  await clearAll();
  // A catch left in escrow has no owner to cascade with the accounts,
  // so the stage clears its own pieces before laying them again
  await sql`delete from trades`;
  await sql`delete from caught where id in ('catch-a', 'catch-spare', 'catch-b')`;
  [proposer, receiver, stranger] = await Promise.all([
    actor('proposer'),
    actor('receiver'),
    actor('stranger'),
  ]);

  // The signup trigger has already made the profiles; only the purse
  // is staged
  await sql`
    update profiles set gold = 1000
    where id in (${proposer.uid}, ${receiver.uid}, ${stranger.uid})
  `;
  await sql`insert into caught ${sql(
    [
      caughtRow('catch-a', proposer.uid),
      caughtRow('catch-spare', proposer.uid),
      caughtRow('catch-b', receiver.uid),
    ],
    ...Object.keys(caughtRow('x', null)),
  )}`;

  const ties = [
    { owner: proposer.uid, friend: receiver.uid, since: NOW },
    { owner: receiver.uid, friend: proposer.uid, since: NOW },
  ];

  await sql`insert into friends ${sql(ties, 'owner', 'friend', 'since')}`;
});

afterAll(async () => {
  await clearAll();
  await sql.end();
});

describe('offering', () => {
  it('escrows the catch and refuses a second open offer to the same friend', async () => {
    const id = await offerTrade(
      proposer.uid,
      { friend: receiver.uid, caught: 'catch-a', asked: '', gold: 0 },
      NOW,
      OFFSET,
    );

    expect(id).not.toBeNull();
    expect(await ownerOf('catch-a')).toBeNull();

    const again = await offerTrade(
      proposer.uid,
      { friend: receiver.uid, caught: 'catch-spare', asked: '', gold: 0 },
      NOW,
      OFFSET,
    );

    expect(again).toBeNull();
  });

  it('refuses a stranger, a favorite and gold beyond the purse', async () => {
    expect(
      await offerTrade(
        proposer.uid,
        { friend: stranger.uid, caught: 'catch-a', asked: '', gold: 0 },
        NOW,
        OFFSET,
      ),
    ).toBeNull();

    await sql`update caught set favorite = true where id = ${'catch-a'}`;
    expect(
      await offerTrade(
        proposer.uid,
        { friend: receiver.uid, caught: 'catch-a', asked: '', gold: 0 },
        NOW,
        OFFSET,
      ),
    ).toBeNull();
    await sql`update caught set favorite = false where id = ${'catch-a'}`;

    expect(
      await offerTrade(
        proposer.uid,
        { friend: receiver.uid, caught: 'catch-a', asked: '', gold: 5000 },
        NOW,
        OFFSET,
      ),
    ).toBeNull();
  });

  it('takes the gold riding with the offer as it is made', async () => {
    await offerTrade(
      proposer.uid,
      { friend: receiver.uid, caught: 'catch-a', asked: '', gold: 300 },
      NOW,
      OFFSET,
    );
    expect(await goldOf(proposer.uid)).toBe(700);
  });
});

describe('accepting', () => {
  it('swaps the catches, marks both traded, and moves the asked gold', async () => {
    const id = await offerTrade(
      proposer.uid,
      { friend: receiver.uid, caught: 'catch-a', asked: 'catch-b', gold: -250 },
      NOW,
      OFFSET,
    );

    expect(await acceptTrade(receiver.uid, String(id), '', NOW + 1000, -OFFSET)).toBe(true);
    expect(await ownerOf('catch-a')).toBe(receiver.uid);
    expect(await ownerOf('catch-b')).toBe(proposer.uid);
    expect(await goldOf(receiver.uid)).toBe(750);
    expect(await goldOf(proposer.uid)).toBe(1250);

    const rows = await sql`
      select traded, friendship from caught where id in ('catch-a', 'catch-b')
    `;

    for (const row of rows) {
      expect(row.traded).toBe(true);
      expect(Number(row.friendship)).toBe(BASE_FRIENDSHIP);
    }

    const trade = await sql`select status, given_caught from trades where id = ${String(id)}`;

    expect(Number(trade[0].status)).toBe(TradeStatus.Accepted);
    expect(trade[0].given_caught).toBe('catch-b');
  });

  it('records what each side was and what came the other way', async () => {
    // A trade evolution asks two things of a handover: what the
    // pokemon was at the time, and what it was swapped for. Karrablast
    // and Shelmet are the only pair that ask the second, and neither
    // is registered yet, so the columns are what the test can reach
    await sql`update caught set species = ${Species.Machop} where id = 'catch-a'`;
    await sql`update caught set species = ${Species.Abra} where id = 'catch-b'`;

    const id = await offerTrade(
      proposer.uid,
      { friend: receiver.uid, caught: 'catch-a', asked: 'catch-b', gold: 0 },
      NOW,
      OFFSET,
    );

    expect(await acceptTrade(receiver.uid, String(id), '', NOW + 1000, -OFFSET)).toBe(true);

    const rows = await sql`
      select id, traded_as, traded_for from caught where id in ('catch-a', 'catch-b')
    `;
    const handover = new Map(rows.map((row) => [String(row.id), row]));

    // Each side reads its own species and the other's, which is what
    // lets one of them refuse an evolution the other opened
    expect(Number(handover.get('catch-a')?.traded_as)).toBe(Species.Machop);
    expect(Number(handover.get('catch-a')?.traded_for)).toBe(Species.Abra);
    expect(Number(handover.get('catch-b')?.traded_as)).toBe(Species.Abra);
    expect(Number(handover.get('catch-b')?.traded_for)).toBe(Species.Machop);
  });

  it('answers an open ask with the receiver_s pick, and refuses a stranger_s answer', async () => {
    const id = await offerTrade(
      proposer.uid,
      { friend: receiver.uid, caught: 'catch-a', asked: '', gold: 0 },
      NOW,
      OFFSET,
    );

    expect(await acceptTrade(stranger.uid, String(id), 'catch-b', NOW, OFFSET)).toBe(false);
    expect(await acceptTrade(receiver.uid, String(id), 'catch-b', NOW, OFFSET)).toBe(true);
    expect(await ownerOf('catch-b')).toBe(proposer.uid);
  });
});

describe('turning back', () => {
  it('decline returns the catch and the gold that rode with the offer', async () => {
    const id = await offerTrade(
      proposer.uid,
      { friend: receiver.uid, caught: 'catch-a', asked: '', gold: 300 },
      NOW,
      OFFSET,
    );

    expect(await declineTrade(receiver.uid, String(id), NOW + 1000)).toBe(true);
    expect(await ownerOf('catch-a')).toBe(proposer.uid);
    expect(await goldOf(proposer.uid)).toBe(1000);
    // Answered once is answered: the escrow is already home
    expect(await declineTrade(receiver.uid, String(id), NOW + 2000)).toBe(false);
  });

  it('cancel is the proposer_s own way out, and nobody else_s', async () => {
    const id = await offerTrade(
      proposer.uid,
      { friend: receiver.uid, caught: 'catch-a', asked: '', gold: 0 },
      NOW,
      OFFSET,
    );

    expect(await cancelTrade(receiver.uid, String(id), NOW)).toBe(false);
    expect(await cancelTrade(proposer.uid, String(id), NOW + 1000)).toBe(true);
    expect(await ownerOf('catch-a')).toBe(proposer.uid);
  });
});

describe('who may read a trade', () => {
  it('shows the row to both parties and to nobody else', async () => {
    const id = await offerTrade(
      proposer.uid,
      { friend: receiver.uid, caught: 'catch-a', asked: '', gold: 0 },
      NOW,
      OFFSET,
    );

    const [mine, theirs, others] = await Promise.all([
      proposer.client.from('trades').select('id').eq('id', String(id)),
      receiver.client.from('trades').select('id').eq('id', String(id)),
      stranger.client.from('trades').select('id').eq('id', String(id)),
    ]);

    expect(mine.data).toHaveLength(1);
    expect(theirs.data).toHaveLength(1);
    expect(others.data).toHaveLength(0);
  });

  it('is never client-writable', async () => {
    const written = await proposer.client.from('trades').insert({
      id: 'forged',
      proposer: proposer.uid,
      receiver: receiver.uid,
      offered_caught: 'catch-a',
      gold: 0,
      status: 0,
      created_at: NOW,
      utc_offset: 0,
    });

    expect(written.error).not.toBeNull();
  });
});
