import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { BALL_ITEMS, Balls } from '../../src/data/ids/items';
import { WORLD_GENERATION } from '../../src/overworld/current';
import { ThrowResult } from '../../src/overworld/safari';
import { throwAt } from '../../src/server/throws';
import registerData from '../../src/data';

/**
 * Throws are the server's to decide. What is checked here is what a
 * client calling the server functions directly could once get away
 * with: a catch without a ball, a catch the roll did not give, and the
 * same meeting caught more than once.
 */

const BALL = Balls.PokeBall;
const ITEM = BALL_ITEMS[BALL];
const OFFSET = 480;

let player: Actor;
let meeting = 0;

async function stageMeeting(uid: string): Promise<string> {
  meeting += 1;

  const spawn = `throw-${meeting}`;

  await sql`
    insert into encounters ${sql({
      generation: WORLD_GENERATION,
      spawn_id: spawn,
      player: uid,
      type: 0,
      species: 25,
      level: 5,
      individual_value: 1000 + meeting,
      trait_value: 2,
      ivs: 0,
      nature: 0,
      ability: 1,
      gender: 1,
      shiny: false,
      shadow: false,
      window_at: 0,
      x: meeting,
      y: 0,
      biome: 0,
    })}
  `;
  return spawn;
}

async function carry(uid: string, count: number): Promise<void> {
  await sql`delete from bag_items where player = ${uid} and item = ${ITEM}`;
  if (count > 0) {
    await sql`insert into bag_items ${sql({ player: uid, item: ITEM, count })}`;
  }
}

async function ballsLeft(uid: string): Promise<number> {
  const rows = await sql`select count from bag_items where player = ${uid} and item = ${ITEM}`;

  return rows.length === 0 ? 0 : Number(rows[0].count);
}

async function caughtCount(uid: string): Promise<number> {
  const rows = await sql`select count(*)::int as held from caught where owner = ${uid}`;

  return Number(rows[0].held);
}

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('thrower');
});

beforeEach(async () => {
  await sql`delete from caught where owner = ${player.uid}`;
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await sql.end();
});

describe('throwing at a meeting', () => {
  it('refuses a throw without the ball, and writes nothing', async () => {
    const spawn = await stageMeeting(player.uid);

    await carry(player.uid, 0);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(await throwAt(player.uid, spawn, BALL, Date.now(), OFFSET, 'en')).toBeNull();
    expect(await caughtCount(player.uid)).toBe(0);
  });

  it('spends the ball and writes the catch when the roll holds', async () => {
    const spawn = await stageMeeting(player.uid);

    await carry(player.uid, 3);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const report = await throwAt(player.uid, spawn, BALL, Date.now(), OFFSET, 'en');

    expect(report?.result).toBe(ThrowResult.Caught);
    expect(report?.catchId).not.toBeNull();
    expect(await ballsLeft(player.uid)).toBe(2);
    expect(await caughtCount(player.uid)).toBe(1);
  });

  it('never catches the same meeting twice', async () => {
    const spawn = await stageMeeting(player.uid);

    await carry(player.uid, 3);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    await throwAt(player.uid, spawn, BALL, Date.now(), OFFSET, 'en');

    expect(await throwAt(player.uid, spawn, BALL, Date.now(), OFFSET, 'en')).toBeNull();
    expect(await caughtCount(player.uid)).toBe(1);
    // The refused throw spent nothing
    expect(await ballsLeft(player.uid)).toBe(2);
  });

  it('catches once however many throws land together', async () => {
    const spawn = await stageMeeting(player.uid);

    await carry(player.uid, 5);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const reports = await Promise.all([
      throwAt(player.uid, spawn, BALL, Date.now(), OFFSET, 'en'),
      throwAt(player.uid, spawn, BALL, Date.now(), OFFSET, 'en'),
      throwAt(player.uid, spawn, BALL, Date.now(), OFFSET, 'en'),
    ]);
    let caught = 0;

    for (const report of reports) {
      if (report?.result === ThrowResult.Caught) {
        caught += 1;
      }
    }
    expect(caught).toBe(1);
    expect(await caughtCount(player.uid)).toBe(1);
    expect(await ballsLeft(player.uid)).toBe(4);
  });

  it('keeps a miss on the server, so the next look carries it', async () => {
    const spawn = await stageMeeting(player.uid);

    await carry(player.uid, 3);
    // Every shake fails and the flight roll does too
    vi.spyOn(Math, 'random').mockReturnValue(0.999_999);

    const report = await throwAt(player.uid, spawn, BALL, Date.now(), OFFSET, 'en');

    expect(report?.result).toBe(ThrowResult.BrokeFree);
    expect(report?.tally.throws).toBe(1);

    const rows = await sql`
      select safari from encounters
      where generation = ${WORLD_GENERATION} and spawn_id = ${spawn} and player = ${player.uid}
    `;

    expect(rows[0].safari).toMatchObject({ throws: 1 });
    expect(await caughtCount(player.uid)).toBe(0);
  });
});
