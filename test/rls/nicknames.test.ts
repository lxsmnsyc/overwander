import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PLAYER_NAME_LIMIT, asNickname, asPlayerName } from '../../src/auth/nickname';
import { caughtRow, service, sql } from './clients';
import { Acquisition } from '../../src/auth/caught-record';
import { setNickname } from '../../src/server/caught';

/**
 * The nickname columns, which are the half of the rule the app cannot
 * enforce: `profiles` is the one row a browser writes for itself, so
 * the column's own constraint is what actually holds. The cleaner is
 * checked against the TypeScript one here too, since a name written
 * by the trigger and a name written by the app must come out the same
 */

let uid = '';

beforeAll(async () => {
  const made = await service.auth.admin.createUser({
    email: `nick-${Date.now()}@example.test`,
    password: 'walking-in-the-tall-grass',
    email_confirm: true,
  });
  uid = made.data.user?.id ?? '';
});

afterAll(async () => {
  await sql`delete from caught where owner = ${uid}`;
  await service.auth.admin.deleteUser(uid);
});

describe('the columns refuse what the app would have cleaned', () => {
  it('refuses a player name outside the alphabet', async () => {
    for (const name of ['Ash\u202Enosaj', 'e\u0301\u0301vil', 'Red\u200bBlue', '\u{1f525}Blaze']) {
      await expect(sql`update profiles set nickname = ${name} where id = ${uid}`).rejects.toThrow(
        /profiles_nickname_charset/u,
      );
    }
  });

  it('takes a name in any script', async () => {
    for (const name of ['田中', 'サトシ', '한지우', 'Ольга', 'José', 'Ελλάδα']) {
      await sql`update profiles set nickname = ${name} where id = ${uid}`;

      expect((await sql`select nickname from profiles where id = ${uid}`)[0]?.nickname).toBe(name);
    }
  });

  it('refuses a player name that is too long, or empty', async () => {
    await expect(
      sql`update profiles set nickname = ${'x'.repeat(PLAYER_NAME_LIMIT + 1)} where id = ${uid}`,
    ).rejects.toThrow(/profiles_nickname_charset/u);
    await expect(sql`update profiles set nickname = '' where id = ${uid}`).rejects.toThrow(
      /profiles_nickname_charset/u,
    );
  });

  it('takes a cleaned one', async () => {
    await sql`update profiles set nickname = ${asPlayerName('  Red   the Brave  ')} where id = ${uid}`;

    const rows = await sql`select nickname from profiles where id = ${uid}`;

    expect(rows[0]?.nickname).toBe('Red the Brave');
  });

  it('refuses a catch nickname outside the alphabet but allows none at all', async () => {
    await sql`insert into caught ${sql(caughtRow('nick-1', uid))}`;

    await expect(
      sql`update caught set nickname = ${'\u{1f525}Blaze'} where id = 'nick-1'`,
    ).rejects.toThrow(/caught_nickname_charset/u);

    await sql`update caught set nickname = '' where id = 'nick-1'`;
    await sql`update caught set nickname = ${"Farfetch'd"} where id = 'nick-1'`;
  });
});

describe('a name given before a handover', () => {
  const plant = async (id: string, owner: string, hands: string[]): Promise<void> => {
    await sql`insert into caught ${sql({ ...caughtRow(id, owner), nickname: 'Sparky' })}`;

    for (const [seq, hand] of hands.entries()) {
      await sql`
        insert into caught_history
          (caught_id, seq, owner, owner_name, acquired_at_local, acquired_at_offset, kind)
        values (${id}, ${seq}, ${hand}, null, ${new Date('2026-08-20T12:00:00Z')}, 0,
                ${seq === 0 ? Acquisition.Caught : Acquisition.Trade})
      `;
    }
  };

  it('stays its first trainer’s to change', async () => {
    const second = await service.auth.admin.createUser({
      email: `nick-second-${Date.now()}@example.test`,
      password: 'walking-in-the-tall-grass',
      email_confirm: true,
    });
    const other = second.data.user?.id ?? '';

    // Held by whoever it was handed to, named by whoever caught it
    await plant('nick-traded', other, [uid, other]);
    expect(await setNickname(other, 'nick-traded', 'Zap')).toBeNull();

    const [held] = await sql`select nickname from caught where id = 'nick-traded'`;

    expect(held.nickname).toBe('Sparky');

    // The trainer who named it may still change it, and anybody may
    // name one that answers to nothing
    await sql`update caught set owner = ${uid} where id = 'nick-traded'`;
    expect(await setNickname(uid, 'nick-traded', 'Zap')).toBe('Zap');

    await sql`update caught set owner = ${other}, nickname = '' where id = 'nick-traded'`;
    expect(await setNickname(other, 'nick-traded', 'Zap')).toBe('Zap');

    await sql`delete from caught where id = 'nick-traded'`;
    await service.auth.admin.deleteUser(other);
  });

  it('is the holder’s own where the pokemon never changed hands', async () => {
    await plant('nick-kept', uid, [uid]);
    expect(await setNickname(uid, 'nick-kept', 'Zap')).toBe('Zap');
  });
});

describe('the two cleaners agree', () => {
  it('gives the same answer in SQL as in TypeScript', async () => {
    const tried = [
      "  Farfetch'd  ",
      'Nidoran♀',
      '🔥🔥 Blaze 🔥🔥',
      'Ash\u202Enosaj',
      'e\u0301\u0301\u0301vil',
      'Red\u200bBlue',
      '\u0410dmin',
      'tab\there',
      '田中',
      'サトシ 小智',
      '한지우',
      'Ольга Владимировна Петрова',
      'José',
      'Ελλάδα',
      'محمد',
      '٥٥٥',
      'ก',
      'x'.repeat(40),
      'a\t\u{1f525}\tb',
      'Red  \u{1f525}  Blue',
      '\u{1d400}dmin',
      'Ａｄｍｉｎ',
      '①②③',
      'abcdefghijk lmno',
      'Mr. Mime',
      'Porygon-Z',
      '',
    ];

    for (const name of tried) {
      const [row] = await sql`select clean_nickname(${name}, ${PLAYER_NAME_LIMIT}) as cleaned`;

      expect([name, row.cleaned]).toEqual([name, asNickname(name, PLAYER_NAME_LIMIT)]);
    }
  });
});

describe('a new account', () => {
  it('is given a cleaned provider name, or Trainer', async () => {
    const made = await service.auth.admin.createUser({
      email: `trig-${Date.now()}@example.test`,
      password: 'walking-in-the-tall-grass',
      email_confirm: true,
      user_metadata: { full_name: '\u{1f525} Ash\u202E Ketchum of Pallet Town \u{1f525}' },
    });
    const other = made.data.user?.id ?? '';
    const rows = await sql`select nickname from profiles where id = ${other}`;

    // Cut to the limit, which is where the name runs out rather than
    // where the word does
    expect(rows[0]?.nickname).toBe(asPlayerName('Ash Ketchum of Pallet Town'));
    expect(rows[0]?.nickname).toHaveLength(PLAYER_NAME_LIMIT);
    await service.auth.admin.deleteUser(other);

    const blank = await service.auth.admin.createUser({
      email: `trig2-${Date.now()}@example.test`,
      password: 'walking-in-the-tall-grass',
      email_confirm: true,
      user_metadata: { full_name: '\u{1f525}' },
    });
    const none = blank.data.user?.id ?? '';

    expect((await sql`select nickname from profiles where id = ${none}`)[0]?.nickname).toBe(
      'Trainer',
    );
    await service.auth.admin.deleteUser(none);
  });
});
