import { readFileSync, readdirSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { asRecord, asRecordArray } from '../src/auth/__normalize';
import * as hub from '../src/server/live/hub';
import { LIVE_TABLES, matchesFilter, parseFilter, visibleRow } from '../src/server/live/rules';

/**
 * The live feed: which changes reach whom, and how much of each row
 * they see.
 */

const ME = '00000000-0000-4000-8000-000000000001';
const THEM = '00000000-0000-4000-8000-000000000002';

describe('filters', () => {
  it('reads eq and in, and nothing else', () => {
    expect(parseFilter('player=eq.abc')).toEqual({ column: 'player', values: ['abc'] });
    expect(parseFilter('id=in.(a,b)')).toEqual({ column: 'id', values: ['a', 'b'] });
    expect(parseFilter('id=gt.3')).toBeNull();
    expect(parseFilter('id=in.a,b')).toBeNull();
    expect(parseFilter('Drop table=eq.x')).toBeNull();
  });

  it('compares a row value as text', () => {
    expect(matchesFilter({ column: 'cell', values: ['3'] }, { cell: 3 })).toBe(true);
    expect(matchesFilter({ column: 'cell', values: ['3'] }, { cell: 4 })).toBe(false);
    expect(matchesFilter({ column: 'cell', values: ['3'] }, null)).toBe(false);
  });
});

describe('what a reader sees', () => {
  it('sees a public row whole', () => {
    expect(visibleRow('auctions', { id: 'a', seller: THEM }, ME)).toEqual({
      id: 'a',
      seller: THEM,
    });
  });

  it('sees their own row whole and nobody else’s at all', () => {
    expect(visibleRow('trades', { id: 't', proposer: THEM, receiver: ME }, ME)).toEqual({
      id: 't',
      proposer: THEM,
      receiver: ME,
    });
    expect(visibleRow('trades', { id: 't', proposer: THEM, receiver: THEM }, ME)).toEqual({});
  });

  it('sees only the lobby of a duel row they may not read', () => {
    expect(visibleRow('duel_members', { duel_id: 'd', player: THEM, ready: true }, ME)).toEqual({
      duel_id: 'd',
    });
  });

  it('follows exactly the tables the migration triggers on', () => {
    const triggered: string[] = [];

    for (const file of readdirSync('db/migrations')) {
      const text = readFileSync(`db/migrations/${file}`, 'utf8');

      for (const match of text.matchAll(
        /create trigger live_changes after .* on (?:public\.)?(\w+)/gi,
      )) {
        triggered.push(match[1]);
      }
    }
    expect(triggered.sort()).toEqual([...LIVE_TABLES].sort());
  });
});

describe('the hub', () => {
  let heard = new Map<string, Record<string, unknown>[]>();

  function peer(id: string, uid: string): void {
    heard.set(id, []);
    hub.connect(
      {
        id,
        send: (message) => {
          heard.get(id)?.push(asRecord(JSON.parse(message)));
        },
      },
      uid,
    );
  }

  beforeEach(() => {
    for (const id of heard.keys()) {
      hub.disconnect(id);
    }
    heard = new Map();
    peer('mine', ME);
    peer('theirs', THEM);
  });

  it('sends a change to the subscriptions it answers, and only those', () => {
    hub.subscribe('mine', '1', 'positions', [{ column: 'player', values: [ME] }]);
    hub.subscribe('theirs', '1', 'positions', [{ column: 'player', values: [THEM] }]);
    hub.dispatch('positions', 'UPDATE', { player: ME, chunk_x: 1 }, { player: ME, chunk_x: 0 });

    expect(heard.get('mine')).toEqual([
      {
        t: 'change',
        id: '1',
        op: 'UPDATE',
        new: { player: ME, chunk_x: 1 },
        old: { player: ME, chunk_x: 0 },
      },
    ]);
    expect(heard.get('theirs')).toEqual([]);
  });

  it('matches a row leaving the filter by its old side', () => {
    hub.subscribe('mine', '1', 'raids', [{ column: 'id', values: ['r'] }]);
    hub.dispatch('raids', 'DELETE', null, { id: 'r' });

    expect(heard.get('mine')?.at(0)?.op).toBe('DELETE');
  });

  it('pings every follower of the table for a change too large to carry', () => {
    hub.subscribe('mine', '1', 'profiles', [{ column: 'id', values: [ME] }]);
    hub.dispatch('profiles', 'UPDATE', null, null);

    expect(heard.get('mine')?.at(0)).toEqual({
      t: 'change',
      id: '1',
      op: 'UPDATE',
      new: {},
      old: {},
    });
  });

  it('relays to everybody else in a topic, and keeps presence under the verified uid', () => {
    hub.join('mine', 'a', 'sight:2:0:0:0');
    hub.join('theirs', 'b', 'sight:2:0:0:0');
    heard.set('mine', []);
    heard.set('theirs', []);

    hub.broadcast('mine', 'a', 'walk', { u: 'anyone' });
    expect(heard.get('mine')).toEqual([]);
    expect(heard.get('theirs')).toEqual([
      { t: 'msg', id: 'b', event: 'walk', payload: { u: 'anyone' } },
    ]);

    hub.track('mine', 'a', { x: 1 });

    const presence = heard.get('theirs')?.at(-1);

    expect(presence?.t).toBe('presence');
    expect(asRecordArray(presence?.state)[0].key).toBe(ME);

    hub.disconnect('mine');
    expect(heard.get('theirs')?.at(-1)).toEqual({ t: 'presence', id: 'b', state: [] });
  });

  it('refuses a join past what one connection may hold, and keeps the rest', () => {
    for (let index = 0; index < hub.MOST_TOPICS; index += 1) {
      expect(hub.join('mine', `t${index}`, `sight:2:0:${index}:0`)).toBe(true);
    }
    expect(hub.join('mine', 'extra', 'sight:2:0:99:0')).toBe(false);
    // A join it already holds is not a new one
    expect(hub.join('mine', 't0', 'sight:2:0:0:0')).toBe(true);
  });

  it('tells everybody to read again after the listener reconnects', () => {
    hub.resync();

    expect(heard.get('mine')).toEqual([{ t: 'resync' }]);
  });
});
