import { describe, expect, it } from 'vitest';
import { NICKNAME_LIMIT, PLAYER_NAME_LIMIT, asNickname, asPlayerName } from '../src/auth/nickname';
import type { OwnershipRecord } from '../src/auth/caught-record';
import {
  Acquisition,
  isNicknameLocked,
  isOriginalOwner,
  originalOwner,
} from '../src/auth/caught-record';

/**
 * What a name a player writes may be made of: letters of any script,
 * and nothing that is not a letter. A name is shown to other people
 * in lists they cannot inspect, so the cases that matter most are the
 * ones that would reorder the row or hide inside it
 */
describe('asNickname', () => {
  it('keeps what a species name needs', () => {
    expect(asNickname("Farfetch'd")).toBe("Farfetch'd");
    expect(asNickname('Mr. Mime')).toBe('Mr. Mime');
    expect(asNickname('Porygon-Z')).toBe('Porygon-Z');
    expect(asNickname('Nidoran♀')).toBe('Nidoran♀');
  });

  it('writes a name in whatever script it is written in', () => {
    expect(asNickname('田中')).toBe('田中');
    expect(asNickname('サトシ')).toBe('サトシ');
    expect(asNickname('小智')).toBe('小智');
    expect(asNickname('한지우')).toBe('한지우');
    expect(asNickname('Ольга')).toBe('Ольга');
    expect(asNickname('José')).toBe('José');
    expect(asNickname('Ελλάδα')).toBe('Ελλάδα');
  });

  it('drops everything that is not a letter', () => {
    // The override would reorder the row it is drawn in
    expect(asNickname('Ash\u202Enosaj')).toBe('Ashnosaj');
    // A stack of combining marks, which is what zalgo is made of
    expect(asNickname('e\u0301\u0301\u0301vil')).toBe('evil');
    expect(asNickname('\u{1f525} Blaze \u{1f525}')).toBe('Blaze');
    // Zero-width characters hide inside a name rather than beside it
    expect(asNickname('Red\u200bBlue')).toBe('RedBlue');
    expect(asNickname('tab\there')).toBe('tab here');
    // A dropped character leaves no gap where it was
    expect(asNickname('Red \u{1f525} Blue')).toBe('Red Blue');
  });

  it('lets a lookalike letter through, which is the cost of every script', () => {
    // Cyrillic \u0410 draws as Latin A and is a different letter.
    // Telling them apart needs a rule about scripts, not characters
    expect(asNickname('\u0410dmin')).toBe('\u0410dmin');
  });

  it('collapses, trims and cuts', () => {
    expect(asNickname('  a   b  ')).toBe('a b');
    expect(asNickname('x'.repeat(40))).toHaveLength(NICKNAME_LIMIT);
    expect(asNickname('x'.repeat(40), PLAYER_NAME_LIMIT)).toHaveLength(PLAYER_NAME_LIMIT);
    // Cut mid-word can leave a trailing space, which goes too: a name
    // whose last character inside the limit is the space before a word
    const upToTheSpace = `${'x'.repeat(NICKNAME_LIMIT - 1)} yz`;

    expect(asNickname(upToTheSpace)).toBe('x'.repeat(NICKNAME_LIMIT - 1));
  });

  it('lets a pokemon have no name but never a player', () => {
    expect(asNickname('🔥')).toBe('');
    expect(asPlayerName('🔥')).toBe('Trainer');
    expect(asPlayerName('')).toBe('Trainer');
  });
});

describe('who a name belongs to', () => {
  const handover = (
    owners: { owner: string; name?: string }[],
  ): { history: OwnershipRecord[] } => ({
    history: owners.map((entry) => ({
      ...entry,
      acquiredAt: '2026-01-01T00:00:00Z',
      kind: Acquisition.Trade,
      paid: null,
      ball: null,
    })),
  });

  it('answers who first held it', () => {
    expect(originalOwner(handover([{ owner: 'ash' }, { owner: 'gary' }]))).toBe('ash');
    expect(originalOwner(handover([]))).toBeNull();
    expect(isOriginalOwner(handover([{ owner: 'ash' }, { owner: 'gary' }]), 'ash')).toBe(true);
    expect(isOriginalOwner(handover([{ owner: 'ash' }, { owner: 'gary' }]), 'gary')).toBe(false);
    // Nobody is the original owner of a record that kept no history
    expect(isOriginalOwner(handover([]), 'ash')).toBe(false);
    expect(isOriginalOwner(handover([{ owner: 'ash' }]), '')).toBe(false);
  });

  it('leaves a traded pokemon the name its first trainer gave it', () => {
    const passed = { ...handover([{ owner: 'ash' }, { owner: 'gary' }]), nickname: 'Sparky' };

    // The trainer holding it now did not name it
    expect(isNicknameLocked(passed, 'gary')).toBe(true);
    // The one who did may still change it, however far it has been
    expect(isNicknameLocked(passed, 'ash')).toBe(false);
    // An unnamed one is the new owner's to name: there is nothing
    // there to overwrite
    expect(isNicknameLocked({ ...passed, nickname: '' }, 'gary')).toBe(false);
  });

  it('leaves a pokemon that never changed hands alone', () => {
    const kept = { ...handover([{ owner: 'ash' }]), nickname: 'Sparky' };

    expect(isNicknameLocked(kept, 'ash')).toBe(false);
    // And a record from before the history was kept has nothing to
    // answer with
    expect(isNicknameLocked({ ...handover([]), nickname: 'Sparky' }, 'gary')).toBe(false);
  });

  it('keeps the name a distributed pokemon arrived with', () => {
    // A story's trainer is a name rather than an account, so no player
    // signed in is the one who named it
    const distributed = {
      ...handover([{ owner: 'OT/Kanto', name: 'OT/Kanto' }, { owner: 'gary' }]),
      nickname: 'Sparky',
    };

    expect(isNicknameLocked(distributed, 'gary')).toBe(true);
  });
});
