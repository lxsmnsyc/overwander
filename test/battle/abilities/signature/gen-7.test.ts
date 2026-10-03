// Rowlet through Popplio.

import { describe, expect, it } from 'vitest';
import { Stats } from '../../../../src/data/constants/stats';
import Abilities from '../../../../src/data/ids/abilities';
import Team from '../../../../src/battle/team';
import {
  AUDIENCE_LIMIT,
  AUDIENCE_SHARE,
} from '../../../../src/battle/abilities/signature/__create';
import { createBattle, createUnit, pinRandom } from '../../harness';

describe("Alola's starters", () => {
  it('counts its Speed up for each enemy standing, and down as they fall', () => {
    const { battle, teamA, teamB } = createBattle();
    const owl = createUnit(battle, teamA);
    const one = createUnit(battle, teamB);
    const two = createUnit(battle, teamB);

    pinRandom(battle, 1);
    owl.enter();
    one.enter();
    two.enter();

    const bare = owl.checkStat(Stats.Speed, 0);

    owl.addAbility(Abilities.QuillAudience);

    expect(owl.checkStat(Stats.Speed, 0)).toBeCloseTo(bare * (1 + 2 * AUDIENCE_SHARE), 5);

    one.faint(owl);

    expect(owl.checkStat(Stats.Speed, 0)).toBeCloseTo(bare * (1 + AUDIENCE_SHARE), 5);
    // Only the stat it plays to
    expect(owl.checkStat(Stats.Attack, 0)).toBe(bare);
  });

  it('stops counting enemies past the limit', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const crowd = [];

    for (let index = 0; index < AUDIENCE_LIMIT + 2; index++) {
      crowd.push(createUnit(battle, teamB));
    }

    pinRandom(battle, 1);
    cat.enter();
    for (const foe of crowd) {
      foe.enter();
    }

    const bare = cat.checkStat(Stats.Attack, 0);

    cat.addAbility(Abilities.HeelAudience);

    expect(cat.checkStat(Stats.Attack, 0)).toBeCloseTo(
      bare * (1 + AUDIENCE_LIMIT * AUDIENCE_SHARE),
      5,
    );
    // Its own side is no audience for a heel
    expect(cat.checkStat(Stats.Speed, 0)).toBe(bare);
  });

  it('sings to its own team, never itself or an ally', () => {
    const { battle, allianceA, teamA, teamB } = createBattle();
    const seal = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const allyTeam = new Team(battle, allianceA);

    allianceA.addTeam(allyTeam);

    const ally = createUnit(battle, allyTeam);

    pinRandom(battle, 1);
    seal.enter();
    mate.enter();
    ally.enter();
    foe.enter();

    const bare = seal.checkStat(Stats.SpecialAttack, 0);

    seal.addAbility(Abilities.AriaAudience);

    expect(seal.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(bare * (1 + AUDIENCE_SHARE), 5);

    mate.faint(foe);

    expect(seal.checkStat(Stats.SpecialAttack, 0)).toBe(bare);
  });
});
