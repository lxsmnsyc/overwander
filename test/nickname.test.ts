import { describe, expect, it } from 'vitest';
import { NICKNAME_LIMIT, PLAYER_NAME_LIMIT, asNickname, asPlayerName } from '../src/auth/nickname';

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
