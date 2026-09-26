import { describe, expect, it } from 'vitest';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Moves } from '../../../src/data/ids/moves';
import { unitTarget } from '../../../src/battle/utils';
import { createBattle, createUnit, pinRandom } from '../harness';

describe('Long Reach', () => {
  it('never touches what it hits', () => {
    const { battle, teamA, teamB } = createBattle();
    const owl = createUnit(battle, teamA, [Types.Grass, Types.Flying]);
    const bare = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    owl.enter();
    bare.enter();
    foe.enter();

    expect(owl.checkMoveContact(Moves.Peck, unitTarget(foe))).toBe(true);

    owl.addAbility(Abilities.LongReach);

    expect(owl.checkMoveContact(Moves.Peck, unitTarget(foe))).toBe(false);
    // Whoever stands beside it still has to walk up to hit
    expect(bare.checkMoveContact(Moves.Peck, unitTarget(foe))).toBe(true);
  });
});

describe('Liquid Voice', () => {
  it('sings its sound moves as Water and leaves the rest alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const seal = createUnit(battle, teamA, [Types.Water]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    seal.enter();
    foe.enter();

    const at = unitTarget(foe);
    const plain = seal.checkMovePower(Moves.HyperVoice, at);

    seal.addAbility(Abilities.LiquidVoice);

    expect(seal.checkMoveType(Moves.HyperVoice, at)).toBe(Types.Water);
    expect(seal.checkMoveType(Moves.DisarmingVoice, at)).toBe(Types.Water);
    // A voice changes what it is made of, not what it is worth
    expect(seal.checkMovePower(Moves.HyperVoice, at)).toBe(plain);
    expect(seal.checkMoveType(Moves.Tackle, at)).toBe(Types.Normal);
  });
});
