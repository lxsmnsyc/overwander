import { describe, expect, it } from 'vitest';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { MoveTargetType } from '../../../src/battle/events';
import { createBattle, createUnit, pinRandom } from '../harness';
import { dealDamage } from './signature/helpers';

describe('Bulletproof', () => {
  it('turns away anything thrown at it and takes what is swung', () => {
    const { battle, teamA, teamB } = createBattle();
    const burr = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    burr.addAbility(Abilities.Bulletproof);
    burr.enter();
    foe.enter();

    const target = { type: MoveTargetType.Unit, unit: burr } as const;

    expect(foe.checkMoveImmunity(Moves.ShadowBall, target, Types.Ghost)).toBe(true);
    expect(foe.checkMoveImmunity(Moves.SeedBomb, target, Types.Grass)).toBe(true);
    // A blow it can see coming still lands
    expect(foe.checkMoveImmunity(Moves.Tackle, target, Types.Normal)).toBe(false);
  });
});

describe('Magician', () => {
  it('takes the item off whatever it lands a move on, while its own hands are empty', () => {
    const { battle, teamA, teamB } = createBattle();
    const mage = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mage.addAbility(Abilities.Magician);
    mage.enter();
    foe.enter();
    foe.addItem(Items.OranBerry);

    dealDamage(mage, foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special);

    expect(foe.items[Items.OranBerry]).toBeFalsy();
    expect(mage.items[Items.OranBerry]).toBeTruthy();
  });

  it('leaves the item where it is once its own hands are full', () => {
    const { battle, teamA, teamB } = createBattle();
    const mage = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mage.addAbility(Abilities.Magician);
    mage.enter();
    foe.enter();
    mage.addItem(Items.Leftovers);
    foe.addItem(Items.OranBerry);

    dealDamage(mage, foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special);

    expect(foe.items[Items.OranBerry]).toBeTruthy();
  });
});
