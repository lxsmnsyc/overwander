import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import { Species } from '../../src/data/ids/species';
import registerData from '../../src/data';
import { BOX_LIMIT } from '../../src/auth/box-record';
import {
  arrangeBoxes,
  dropBox,
  editBox,
  emptyBox,
  fileCatches,
  layOutBox,
  makeBox,
  readBoxes,
} from '../../src/server/boxes';

/**
 * Boxes against the real database: who may file what where, which
 * square each catch lands in, and that a box going away or a catch
 * changing hands sends it back to Default rather than anywhere worse.
 */

let player: Actor;
let stranger: Actor;

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('box-player');
  stranger = await actor('box-stranger');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from caught`;
  await sql`delete from boxes`;
});

async function put(key: string, owner = player.uid, species = Species.Pidgey): Promise<string> {
  const id = `box-${key}`;

  await sql`insert into caught ${sql({ ...caughtRow(id, owner), species })}`;
  return id;
}

/** Where each catch sits, as `box:slot`, or `default` */
async function where(...ids: string[]): Promise<string[]> {
  const rows = await sql`select id, box, box_slot from caught where id in ${sql(ids)}`;
  const byId = new Map<string, string>();

  for (const row of rows) {
    byId.set(String(row.id), row.box == null ? 'default' : `${row.box}:${row.box_slot}`);
  }

  const found: string[] = [];

  for (const id of ids) {
    found.push(byId.get(id) ?? 'gone');
  }
  return found;
}

describe('making boxes', () => {
  it('appends each box to the end of the list', async () => {
    const water = await makeBox(player.uid, 'Water', 0, []);
    const fire = await makeBox(player.uid, 'Fire', 5, []);

    expect(await readBoxes(player.uid)).toEqual([
      [water, { name: 'Water', colour: 0, position: 0 }],
      [fire, { name: 'Fire', colour: 5, position: 1 }],
    ]);
  });

  it('refuses an empty name and an unknown colour', async () => {
    expect(await makeBox(player.uid, '   ', 0, [])).toBeNull();
    expect(await makeBox(player.uid, 'Water', 99, [])).toBeNull();
  });

  it('stops at the limit', async () => {
    for (let made = 0; made < BOX_LIMIT; made++) {
      expect(await makeBox(player.uid, `Box ${made}`, 0, [])).not.toBeNull();
    }
    expect(await makeBox(player.uid, 'One more', 0, [])).toBeNull();
  });

  it('files what it was made with', async () => {
    const a = await put('a');
    const b = await put('b');
    const box = await makeBox(player.uid, 'Picks', 1, [a, b]);

    expect(await where(a, b)).toEqual([`${box}:0`, `${box}:1`]);
  });

  it('renames and reorders only the owner’s boxes', async () => {
    const one = String(await makeBox(player.uid, 'One', 0, []));
    const two = String(await makeBox(player.uid, 'Two', 0, []));

    expect(await editBox(stranger.uid, one, 'Mine', 2)).toBe(false);
    expect(await editBox(player.uid, one, 'First', 2)).toBe(true);
    expect(await arrangeBoxes(player.uid, [one])).toBe(false);
    expect(await arrangeBoxes(player.uid, [two, one])).toBe(true);

    const boxes = await readBoxes(player.uid);

    expect(boxes.map(([id, box]) => [id, box.name, box.position])).toEqual([
      [two, 'Two', 0],
      [one, 'First', 1],
    ]);
  });
});

describe('filing', () => {
  it('fills the first free squares, keeping gaps', async () => {
    const box = String(await makeBox(player.uid, 'Dex', 0, []));
    const [a, b, c] = [await put('a'), await put('b'), await put('c')];

    await fileCatches(player.uid, [a], box, 3);
    await fileCatches(player.uid, [b, c], box, null);

    expect(await where(a, b, c)).toEqual([`${box}:3`, `${box}:0`, `${box}:1`]);
  });

  it('lands a run from a square, stepping over what is taken', async () => {
    const box = String(await makeBox(player.uid, 'Dex', 0, []));
    const [a, b, c] = [await put('a'), await put('b'), await put('c')];

    await fileCatches(player.uid, [a], box, 5);
    await fileCatches(player.uid, [b, c], box, 4);

    expect(await where(a, b, c)).toEqual([`${box}:5`, `${box}:4`, `${box}:6`]);
  });

  it('trades squares when one is dropped on another in the same box', async () => {
    const box = String(await makeBox(player.uid, 'Dex', 0, []));
    const [a, b] = [await put('a'), await put('b')];

    await fileCatches(player.uid, [a, b], box, null);
    await fileCatches(player.uid, [a], box, 1);

    expect(await where(a, b)).toEqual([`${box}:1`, `${box}:0`]);
  });

  it('sends catches back to Default', async () => {
    const box = String(await makeBox(player.uid, 'Dex', 0, []));
    const a = await put('a');

    await fileCatches(player.uid, [a], box, null);
    await fileCatches(player.uid, [a], null, null);

    expect(await where(a)).toEqual(['default']);
  });

  it('refuses somebody else’s catch and somebody else’s box', async () => {
    const mine = String(await makeBox(player.uid, 'Mine', 0, []));
    const theirs = await put('theirs', stranger.uid);
    const a = await put('a');

    expect(await fileCatches(player.uid, [theirs, a], mine, null)).toEqual({
      done: [a],
      refused: [theirs],
    });
    expect(await fileCatches(stranger.uid, [theirs], mine, null)).toEqual({
      done: [],
      refused: [theirs],
    });
    expect(await where(theirs)).toEqual(['default']);
  });

  it('unfiles a catch that changes hands', async () => {
    const box = String(await makeBox(player.uid, 'Dex', 0, []));
    const a = await put('a');

    await fileCatches(player.uid, [a], box, null);
    await sql`update caught set owner = ${stranger.uid} where id = ${a}`;

    expect(await where(a)).toEqual(['default']);
  });
});

describe('a box as a whole', () => {
  it('sends its catches back to Default when deleted', async () => {
    const box = String(await makeBox(player.uid, 'Dex', 0, []));
    const a = await put('a');

    await fileCatches(player.uid, [a], box, 7);
    expect(await dropBox(stranger.uid, box)).toBe(false);
    expect(await dropBox(player.uid, box)).toBe(true);

    expect(await where(a)).toEqual(['default']);
    expect(await readBoxes(player.uid)).toEqual([]);
  });

  it('moves everything into another box’s free squares, in order', async () => {
    const from = String(await makeBox(player.uid, 'From', 0, []));
    const to = String(await makeBox(player.uid, 'To', 0, []));
    const [a, b, c] = [await put('a'), await put('b'), await put('c')];

    await fileCatches(player.uid, [a], from, 4);
    await fileCatches(player.uid, [b], from, 2);
    await fileCatches(player.uid, [c], to, 0);
    expect(await emptyBox(player.uid, from, to)).toBe(true);

    expect(await where(b, a, c)).toEqual([`${to}:1`, `${to}:2`, `${to}:0`]);
  });

  it('closes up the gaps, keeping the order', async () => {
    const box = String(await makeBox(player.uid, 'Dex', 0, []));
    const [a, b] = [await put('a'), await put('b')];

    await fileCatches(player.uid, [a], box, 9);
    await fileCatches(player.uid, [b], box, 3);
    expect(await layOutBox(player.uid, box, 'packed')).toBe(true);

    expect(await where(b, a)).toEqual([`${box}:0`, `${box}:1`]);
  });

  it('lays a box out by dex number, extras after the last', async () => {
    const box = String(await makeBox(player.uid, 'Dex', 0, []));
    const pidgey = await put('pidgey', player.uid, Species.Pidgey);
    const again = await put('again', player.uid, Species.Pidgey);
    const bulbasaur = await put('bulbasaur', player.uid, Species.Bulbasaur);

    await fileCatches(player.uid, [pidgey, again, bulbasaur], box, null);
    expect(await layOutBox(player.uid, box, 'dex')).toBe(true);

    expect(await where(bulbasaur, pidgey, again)).toEqual([`${box}:0`, `${box}:15`, `${box}:16`]);
  });
});
