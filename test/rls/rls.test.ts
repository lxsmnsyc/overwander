import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, guest, service, sql } from './clients';
import { DEFAULT_DUEL_RULES } from '../../src/auth/duel-record';

/**
 * The security surface, asserted from the outside: what a signed-in
 * player, a stranger and a guest may read and write. It is the
 * successor of the Firestore rules suite, and its shape is the same
 * three tiers the schema declares.
 */

let alice: Actor;
let bob: Actor;
/** A third player, for the rows that are private to two of them */
let carol: Actor;

beforeAll(async () => {
  await clearAll();
  alice = await actor('alice');
  bob = await actor('bob');
  carol = await actor('carol');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  // Game rows are cleared; the two accounts and their profiles stay
  // Deletes in dependency order rather than TRUNCATE CASCADE: the
  // cascade would follow profiles.buddy_id into the profiles table
  // and empty the actors' own rows
  await sql`delete from bids`;
  await sql`delete from gift_claims`;
  await sql`delete from gifts`;
  await sql`delete from auction_sellers`;
  await sql`delete from auctions`;
  await sql`delete from battle_aftermaths`;
  await sql`delete from raid_rewards`;
  // Before the battles and snapshots they point at
  await sql`delete from gym_challenges`;
  await sql`delete from gym_seats`;
  await sql`delete from duel_catches`;
  await sql`delete from duel_invites`;
  await sql`delete from duel_members`;
  await sql`delete from duels`;
  await sql`delete from raid_watchers`;
  await sql`delete from battle_teams`;
  await sql`delete from battles`;
  await sql`delete from team_snapshots`;
  await sql`delete from teams`;
  await sql`delete from raids`;
  await sql`update profiles set buddy_id = null`;
  await sql`delete from caught`;
  await sql`delete from bag_items`;
  await sql`delete from friends`;
  await sql`delete from friend_requests`;
  await sql`delete from blocks`;
  await sql`delete from nest_claims`;
  await sql`delete from snapshot_spawns`;
  await sql`delete from snapshots`;
});

describe('profiles', () => {
  it('is readable by any signed-in player and no guest', async () => {
    const seen = await bob.client.from('profiles').select('nickname').eq('id', alice.uid);

    expect(seen.error).toBeNull();
    expect(seen.data?.length).toBe(1);

    const hidden = await guest().from('profiles').select('nickname');

    expect(hidden.data ?? []).toEqual([]);
  });

  it('lets a player change their cosmetics and nothing else', async () => {
    const renamed = await alice.client
      .from('profiles')
      .update({ nickname: 'Alice of Pallet' })
      .eq('id', alice.uid)
      .select('nickname');

    expect(renamed.error).toBeNull();
    expect(renamed.data?.[0]?.nickname).toBe('Alice of Pallet');

    // Gold is not among the granted columns
    const minted = await alice.client.from('profiles').update({ gold: 999999 }).eq('id', alice.uid);

    expect(minted.error).not.toBeNull();

    // A role is not either
    const crowned = await alice.client
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', alice.uid);

    expect(crowned.error).not.toBeNull();

    // Nor is the character they go about as: it is earned, and what
    // was earned is checked on the server, so the column cannot be
    // the player's to write
    const dressed = await alice.client
      .from('profiles')
      .update({ sprite: 'characters/frlg/blue' })
      .eq('id', alice.uid);

    expect(dressed.error).not.toBeNull();
  });

  it('never updates somebody else', async () => {
    const touched = await bob.client
      .from('profiles')
      .update({ nickname: 'Not Alice' })
      .eq('id', alice.uid)
      .select('nickname');

    // RLS filters the row out: zero rows updated, no error
    expect(touched.data ?? []).toEqual([]);
  });
});

describe('caught', () => {
  it('is readable by every signed-in player, children included', async () => {
    await sql`insert into caught ${sql(caughtRow('rls-catch-1', alice.uid))}`;
    await sql`insert into caught_moves (caught_id, slot, move, points) values ('rls-catch-1', 0, 33, 0)`;

    const seen = await bob.client
      .from('caught')
      .select('id, caught_moves(move)')
      .eq('id', 'rls-catch-1');

    expect(seen.error).toBeNull();
    expect(seen.data?.length).toBe(1);

    const hidden = await guest().from('caught').select('id');

    expect(hidden.data ?? []).toEqual([]);
  });

  it('is never client-writable', async () => {
    const forged = await alice.client.from('caught').insert(caughtRow('rls-forged', alice.uid));

    expect(forged.error).not.toBeNull();

    await sql`insert into caught ${sql(caughtRow('rls-catch-2', alice.uid))}`;
    const leveled = await alice.client
      .from('caught')
      .update({ level: 100 })
      .eq('id', 'rls-catch-2')
      .select('id');

    expect(leveled.data ?? []).toEqual([]);
  });
});

describe('owner-only stores', () => {
  it('shows a bag only to its owner', async () => {
    await sql`insert into bag_items (player, item, count) values (${alice.uid}, 15, 3)`;

    const mine = await alice.client.from('bag_items').select('item, count');

    expect(mine.data).toEqual([{ item: 15, count: 3 }]);

    const theirs = await bob.client.from('bag_items').select('item, count');

    expect(theirs.data ?? []).toEqual([]);
  });

  it('scopes claim markers to their player', async () => {
    await sql`insert into nest_claims (marker, player, species) values ('m1', ${alice.uid}, 25)`;

    const mine = await alice.client.from('nest_claims').select('marker');

    expect(mine.data?.length).toBe(1);

    // The old rules let anybody list these; the port shut that
    const theirs = await bob.client.from('nest_claims').select('marker');

    expect(theirs.data ?? []).toEqual([]);
  });

  it('shows a bid only to its bidder', async () => {
    await sql`
      insert into auctions (id, seller, lot, item, starting_bid, increment, bid, created_at, ends_at, utc_offset)
      values ('rls-lot', ${alice.uid}, 0, 15, 100, 10, 0, 0, 9999999999999, 480)
    `;
    await sql`insert into bids (player, auction, amount, bid_at) values (${bob.uid}, 'rls-lot', 120, 1)`;

    const theirs = await bob.client.from('bids').select('auction');

    expect(theirs.data?.length).toBe(1);

    const spied = await alice.client.from('bids').select('auction');

    expect(spied.data ?? []).toEqual([]);
  });
});

describe('friendship rows', () => {
  it('shows each side their own rows, and requests to both ends', async () => {
    await sql`insert into friends (owner, friend, since) values (${alice.uid}, ${bob.uid}, 1), (${bob.uid}, ${alice.uid}, 1)`;
    await sql`insert into friend_requests (sender, recipient, sent_at) values (${alice.uid}, ${bob.uid}, 2)`;

    const mine = await alice.client.from('friends').select('friend');

    expect(mine.data?.length).toBe(1);

    const sent = await alice.client.from('friend_requests').select('recipient');
    const received = await bob.client.from('friend_requests').select('sender');

    expect(sent.data?.length).toBe(1);
    expect(received.data?.length).toBe(1);

    // A third party sees neither
    const carol = await actor('carol');
    const nothing = await carol.client.from('friend_requests').select('sender');

    expect(nothing.data ?? []).toEqual([]);
  });

  it('never lets a player write themselves onto a list', async () => {
    const forged = await alice.client
      .from('friends')
      .insert({ owner: bob.uid, friend: alice.uid, since: 3 });

    expect(forged.error).not.toBeNull();
  });
});

describe('gifts', () => {
  it('is closed to clients end to end', async () => {
    await sql`insert into gifts (id, player, offered_at, gift) values ('rls-gift', null, 0, '{"kind":1}')`;

    const read = await alice.client.from('gifts').select('id');

    expect(read.data ?? []).toEqual([]);

    const written = await alice.client
      .from('gifts')
      .insert({ id: 'rls-gift-2', player: null, offered_at: 0, gift: {} });

    expect(written.error).not.toBeNull();
  });
});

describe('gym seats', () => {
  it('is readable by anybody and writable by nobody', async () => {
    await sql`
      insert into team_snapshots (id, player, alliance, catches)
      values ('rls-seat-party', ${alice.uid}, 0, '[]'::jsonb)
    `;
    await sql`
      insert into gym_seats
        (seat_id, holder, snapshot_id, chunk_seed, chunk_x, chunk_y, cell, seated_at)
      values ('rls-seat', ${alice.uid}, 'rls-seat-party', 'rls-seed', 0, 0, 5, 1000)
    `;

    // Who is holding a seat is the whole reason to walk to it, so
    // anybody signed in may see it
    const seen = await bob.client.from('gym_seats').select('holder, defenses');

    expect(seen.error).toBeNull();
    expect(seen.data?.length).toBe(1);
    expect(seen.data?.[0]?.holder).toBe(alice.uid);

    // But taking one is the server's to write: a browser cannot seat
    // itself, move a seat, or turn a holder out
    const forged = await bob.client.from('gym_seats').insert({
      seat_id: 'rls-seat-2',
      holder: bob.uid,
      snapshot_id: 'rls-seat-party',
      chunk_seed: 'rls-seed',
      chunk_x: 0,
      chunk_y: 0,
      cell: 6,
      seated_at: 1000,
    });

    expect(forged.error).not.toBeNull();

    const stolen = await bob.client
      .from('gym_seats')
      .update({ holder: bob.uid })
      .eq('seat_id', 'rls-seat');

    expect(stolen.error).not.toBeNull();

    const razed = await bob.client.from('gym_seats').delete().eq('seat_id', 'rls-seat');

    expect(razed.error).not.toBeNull();

    // A guest sees no seats at all
    const hidden = await guest().from('gym_seats').select('holder');

    expect(hidden.data ?? []).toEqual([]);
  });

  it('shows a challenge only to the two players in it', async () => {
    await sql`
      insert into team_snapshots (id, player, alliance, catches)
      values ('rls-seat-party', ${alice.uid}, 0, '[]'::jsonb)
    `;
    await sql`
      insert into gym_seats
        (seat_id, holder, snapshot_id, chunk_seed, chunk_x, chunk_y, cell, seated_at)
      values ('rls-seat', ${alice.uid}, 'rls-seat-party', 'rls-seed', 0, 0, 5, 1000)
    `;
    await sql`
      insert into battles (id, raid_id, species, outcome, started_at, limits)
      values ('rls-seat-battle', null, 0, 0, 1000, 0)
    `;
    await sql`
      insert into gym_challenges (seat_id, challenger, battle_id, held_by, started_at)
      values ('rls-seat', ${bob.uid}, 'rls-seat-battle', ${alice.uid}, 1000)
    `;

    // The challenger and the holder are both in it, so both see it
    const challenger = await bob.client.from('gym_challenges').select('battle_id');
    const holder = await alice.client.from('gym_challenges').select('battle_id');

    expect(challenger.data?.length).toBe(1);
    expect(holder.data?.length).toBe(1);
  });
});

describe('battle lobbies', () => {
  const stage = async (host: string): Promise<void> => {
    await sql`
      insert into duels (id, host, battle_id, created_at, limits, team_size)
      values ('rls-duel', ${host}, null, 1000,
        ${DEFAULT_DUEL_RULES.limits}, ${DEFAULT_DUEL_RULES.teamSize})
    `;
    await sql`insert into duel_members (duel_id, player, role) values ('rls-duel', ${host}, 0)`;
  };

  it('is readable by the people in it and by nobody else', async () => {
    await stage(alice.uid);
    await sql`
      insert into duel_invites (duel_id, sender, recipient, role, sent_at)
      values ('rls-duel', ${alice.uid}, ${bob.uid}, 0, 1000)
    `;

    // The host is in it, and the trainer they called is on their way
    const host = await alice.client.from('duels').select('host');
    const called = await bob.client.from('duels').select('host');

    expect(host.data?.length).toBe(1);
    expect(called.data?.length).toBe(1);

    // Nobody else knows the fight is being arranged at all. This is
    // the whole of what makes a duel private, and it is also the case
    // that would break first if `in_duel` ever became a subquery: a
    // policy on duel_members reading duel_members recurses
    const stranger = await carol.client.from('duels').select('host');
    const members = await carol.client.from('duel_members').select('player');

    expect(stranger.error).toBeNull();
    expect(stranger.data ?? []).toEqual([]);
    expect(members.data ?? []).toEqual([]);
  });

  it('cannot be walked into by writing a row', async () => {
    await stage(alice.uid);

    const forged = await carol.client
      .from('duel_members')
      .insert({ duel_id: 'rls-duel', player: carol.uid, role: 0 });

    expect(forged.error).not.toBeNull();

    const started = await bob.client
      .from('duels')
      .update({ battle_id: 'rls-battle' })
      .eq('id', 'rls-duel');

    expect(started.error).not.toBeNull();
  });

  it('shows who is watching a raid to anybody', async () => {
    await sql`
      insert into raids
        (id, kind, lair, species, trait_value, host, window_at, utc_offset,
         chunk_seed, chunk_x, chunk_y, biome, cell)
      values ('rls-raid', 0, null, 1, 0, ${alice.uid}, 1000, 0, 'rls-seed', 0, 0, 0, 5)
    `;
    await sql`
      insert into raid_watchers (raid_id, player, seen_at)
      values ('rls-raid', ${alice.uid}, 1000)
    `;

    // A raid lobby stands open in the world, so who is in the room is
    // as public as who has joined it
    const seen = await carol.client.from('raid_watchers').select('player');

    expect(seen.error).toBeNull();
    expect(seen.data?.length).toBe(1);

    const forged = await carol.client
      .from('raid_watchers')
      .insert({ raid_id: 'rls-raid', player: carol.uid, seen_at: 1000 });

    expect(forged.error).not.toBeNull();
  });
});

describe('the snapshot publish', () => {
  it('publishes through the definer function, shape-checked', async () => {
    const spawns = [{ species: 25, individualValue: 1, traitValue: 2 }];
    const published = await alice.client.rpc('publish_snapshot', {
      p_seed: 'rls-seed',
      p_zone: '+08:00',
      p_offset: 480,
      p_window: 1000,
      p_spawns: spawns,
    });

    expect(published.error).toBeNull();

    const stored = await alice.client
      .from('snapshots')
      .select('window_at')
      .eq('chunk_seed', 'rls-seed');

    expect(stored.data?.[0]?.window_at).toBe(1000);

    const spawnRows = await alice.client
      .from('snapshot_spawns')
      .select('species')
      .eq('chunk_seed', 'rls-seed');

    expect(spawnRows.data?.[0]?.species).toBe(25);

    // A stale publisher changes nothing
    const stale = await bob.client.rpc('publish_snapshot', {
      p_seed: 'rls-seed',
      p_zone: '+08:00',
      p_offset: 480,
      p_window: 500,
      p_spawns: spawns,
    });

    expect(stale.error).toBeNull();

    const kept = await alice.client
      .from('snapshots')
      .select('window_at')
      .eq('chunk_seed', 'rls-seed');

    expect(kept.data?.[0]?.window_at).toBe(1000);
  });

  it('refuses a guest and a direct write', async () => {
    const anonymous = await guest().rpc('publish_snapshot', {
      p_seed: 'rls-guest',
      p_zone: '+08:00',
      p_offset: 480,
      p_window: 1000,
      p_spawns: [],
    });

    expect(anonymous.error).not.toBeNull();

    const direct = await alice.client
      .from('snapshots')
      .insert({ chunk_seed: 'rls-direct', zone: '+08:00', utc_offset: 480, window_at: 1 });

    expect(direct.error).not.toBeNull();
  });
});

describe('the server door', () => {
  it('is not bound by any of it', async () => {
    const written = await service.from('caught').insert(caughtRow('rls-service', alice.uid));

    expect(written.error).toBeNull();
  });
});
