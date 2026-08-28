import { describe, expect, it } from 'vitest';
import type { TeamRecord } from '../src/auth/teams';
import matchesTeam, { TEAM_VOCABULARY, orderTeams } from '../src/auth/team-search';

/** One row of a raid lobby */
function team(player: string, catches: number): TeamRecord {
  return {
    player,
    raid: 'lair',
    catches: Array.from({ length: catches }, (_one, at) => `${player}-${at}`),
  };
}

describe('searching a raid lobby', () => {
  it('matches everything while nothing has been typed', () => {
    expect(matchesTeam(team('abc', 3), '', { name: 'Blue' })).toBe(true);
  });

  it('finds a player by their name or by their id', () => {
    const row = team('abc123', 3);

    expect(matchesTeam(row, 'blue', { name: 'Blue' })).toBe(true);
    expect(matchesTeam(row, 'abc1', { name: 'Blue' })).toBe(true);
    expect(matchesTeam(row, 'red', { name: 'Blue' })).toBe(false);
  });

  it('picks out the two rows a player looks for', () => {
    const mine = team('me', 2);
    const host = team('host', 6);

    expect(matchesTeam(mine, 'is:mine', { name: 'You', mine: true })).toBe(true);
    expect(matchesTeam(host, 'is:mine', { name: 'Blue', host: true })).toBe(false);
    expect(matchesTeam(host, 'is:host', { name: 'Blue', host: true })).toBe(true);
    expect(matchesTeam(host, '!is:host', { name: 'Blue', host: true })).toBe(false);
  });

  it('counts what somebody brought', () => {
    expect(matchesTeam(team('abc', 6), 'size:6')).toBe(true);
    expect(matchesTeam(team('abc', 2), 'size:>3')).toBe(false);
    expect(matchesTeam(team('abc', 1), 'is:alone')).toBe(true);
  });

  it('matches nothing for a field nobody has heard of', () => {
    expect(matchesTeam(team('abc', 3), 'level:50', { name: 'Blue' })).toBe(false);
  });

  it('arranges the lobby by the size of a party', () => {
    const rows = [team('a', 2), team('b', 6), team('c', 4)];

    expect(
      orderTeams(rows, 'sort:size', (row) => ({ team: row })).map((row) => row.player),
    ).toEqual(['a', 'c', 'b']);
    expect(
      orderTeams(rows, 'sort:size order:desc', (row) => ({ team: row })).map((row) => row.player),
    ).toEqual(['b', 'c', 'a']);
  });

  it('gives every field a line for the guide', () => {
    const bare = TEAM_VOCABULARY.fields.filter((field) => field.hint === '');

    expect(bare.map((field) => field.name)).toEqual([]);
  });

  it('offers only marks the lobby would actually answer to', () => {
    const marks = TEAM_VOCABULARY.fields.find((field) => field.name === 'is');
    const row = team('abc', 3);

    expect(marks?.values?.()).toContain('host');
    for (const mark of marks?.values?.() ?? []) {
      expect(matchesTeam(row, `is:${mark}`) === matchesTeam(row, `not:${mark}`)).toBe(false);
    }
  });

  it('knows the two terms that arrange rather than narrow', () => {
    const named = TEAM_VOCABULARY.fields.map((field) => field.name);

    expect(named).toContain('sort');
    expect(named).toContain('order');
  });
});
