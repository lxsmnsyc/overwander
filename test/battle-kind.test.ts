import { describe, expect, it } from 'vitest';
import BattleKind, { BATTLE_KIND_NAMES, getBattleKind } from '../src/auth/battle-kind';
import type { BattleRecord } from '../src/auth/battles';
import BattleOutcome from '../src/auth/battle-outcome';
import { UNLIMITED_BATTLE_LIMITS } from '../src/data/constants/battle-limits';
import { Species } from '../src/data/ids/species';

function asRecord(fields: Partial<BattleRecord>): BattleRecord {
  return {
    teams: ['one', 'two'],
    players: ['alice'],
    raid: '',
    species: Species.Bulbasaur,
    outcome: BattleOutcome.Won,
    startedAt: 0,
    limits: UNLIMITED_BATTLE_LIMITS,
    ...fields,
  };
}

describe('battle kinds', () => {
  it('reads a raid off the lobby it was fought for', () => {
    expect(getBattleKind(asRecord({ raid: 'lobby-1' }))).toBe(BattleKind.Raid);

    // Several players in one raid is still a raid: what they fought
    // was the boss, not each other
    expect(getBattleKind(asRecord({ raid: 'lobby-1', players: ['alice', 'bob'] }))).toBe(
      BattleKind.Raid,
    );
  });

  it('reads a grunt off there being no lobby and one player', () => {
    expect(getBattleKind(asRecord({}))).toBe(BattleKind.Rocket);
  });

  it('reads players fighting each other off there being two of them', () => {
    expect(getBattleKind(asRecord({ players: ['alice', 'bob'] }))).toBe(BattleKind.Player);
  });

  it('names every kind', () => {
    for (const kind of [BattleKind.Raid, BattleKind.Rocket, BattleKind.Player]) {
      expect(BATTLE_KIND_NAMES[kind].length).toBeGreaterThan(0);
    }
  });
});
