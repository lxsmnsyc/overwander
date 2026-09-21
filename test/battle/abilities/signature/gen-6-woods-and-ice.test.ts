// Phantump, Pumpkaboo and Bergmite.

import { describe, expect, it } from 'vitest';
import { Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage, makeAttack, resolveAttackStat } from './helpers';

describe("Kalos's woods and ice", () => {
  it('lays the wood onto whatever it hits, and only once', () => {
    const { battle, teamA, teamB } = createBattle();
    const tree = createUnit(battle, teamA, [Types.Ghost, Types.Grass]);
    const foe = createUnit(battle, teamB, [Types.Normal]);

    pinRandom(battle, 1);
    tree.addAbility(Abilities.Undergrowth);
    tree.enter();
    foe.enter();

    dealDamage(tree, foe, Moves.Pound, 10, Types.Normal, MoveCategories.Physical);
    // The curse is cast rather than laid by hand, so it flies first
    battle.tick(1000);

    expect(foe.types.has(Types.Grass)).toBe(true);
    expect(foe.types.has(Types.Normal)).toBe(true);

    // A target already carrying it is left alone
    foe.removeType(Types.Normal);
    dealDamage(tree, foe, Moves.Pound, 10, Types.Normal, MoveCategories.Physical);
    battle.tick(1000);

    expect(foe.types.has(Types.Normal)).toBe(false);
  });

  it('calls its target over to the dead', () => {
    const { battle, teamA, teamB } = createBattle();
    const pumpkin = createUnit(battle, teamA, [Types.Ghost, Types.Grass]);
    const foe = createUnit(battle, teamB, [Types.Normal]);

    pinRandom(battle, 1);
    pumpkin.addAbility(Abilities.Hollowing);
    pumpkin.enter();
    foe.enter();

    dealDamage(pumpkin, foe, Moves.Pound, 10, Types.Normal, MoveCategories.Physical);
    battle.tick(1000);

    expect(foe.types.has(Types.Ghost)).toBe(true);
  });

  it('leaves the curse off its own team', () => {
    const { battle, teamA, teamB } = createBattle();
    const tree = createUnit(battle, teamA, [Types.Ghost, Types.Grass]);
    const mate = createUnit(battle, teamA, [Types.Normal]);
    const foe = createUnit(battle, teamB, [Types.Normal]);

    pinRandom(battle, 1);
    tree.addAbility(Abilities.Undergrowth);
    tree.enter();
    mate.enter();
    foe.enter();

    dealDamage(tree, mate, Moves.Pound, 10, Types.Normal, MoveCategories.Physical);
    battle.tick(1000);

    expect(mate.types.has(Types.Grass)).toBe(false);
  });

  it('hits with the wall rather than with the arm', () => {
    const { battle, teamA, teamB } = createBattle();
    const floe = createUnit(battle, teamA, [Types.Ice]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    floe.setStat(StatsKind.Base, Stats.Attack, 60);
    floe.setStat(StatsKind.Base, Stats.Defense, 180);
    floe.addAbility(Abilities.Deadweight);
    floe.enter();
    foe.enter();

    const attack = floe.checkStat(Stats.Attack, 0);
    const defense = floe.checkStat(Stats.Defense, 0);

    expect(defense).toBeGreaterThan(attack);

    const swung = makeAttack(floe, foe, Moves.Tackle, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, swung, floe, Stats.Attack, attack)).toBeCloseTo(defense, 0);

    // A special move reads its own stat, which the ice never touches
    const thrown = makeAttack(floe, foe, Moves.IceBeam, Types.Ice, MoveCategories.Special);
    const special = floe.checkStat(Stats.SpecialAttack, 0);

    expect(resolveAttackStat(battle, thrown, floe, Stats.SpecialAttack, special)).toBeCloseTo(
      special,
      0,
    );
  });

  it('keeps the arm when the arm is the stronger of the two', () => {
    const { battle, teamA, teamB } = createBattle();
    const floe = createUnit(battle, teamA, [Types.Ice]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    floe.setStat(StatsKind.Base, Stats.Attack, 180);
    floe.setStat(StatsKind.Base, Stats.Defense, 60);
    floe.addAbility(Abilities.Deadweight);
    floe.enter();
    foe.enter();

    const attack = floe.checkStat(Stats.Attack, 0);
    const swung = makeAttack(floe, foe, Moves.Tackle, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, swung, floe, Stats.Attack, attack)).toBeCloseTo(attack, 0);
  });
});
