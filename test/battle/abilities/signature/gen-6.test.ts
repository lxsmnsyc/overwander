// Chespin through Froakie.

import { describe, expect, it } from 'vitest';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Types } from '../../../../src/data/constants/types';
import { MoveTargetType } from '../../../../src/battle/events';
import {
  BOND_KINDLE_SCALE,
  BOND_SHADE_SCALE,
  BOND_SHELTER_SCALE,
} from '../../../../src/battle/abilities/signature/__create';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

describe("Kalos's starters", () => {
  it('shelters its own team from physical moves, and nobody else', () => {
    const { battle, teamA, teamB } = createBattle();
    const knight = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    knight.enter();
    mate.enter();
    foe.enter();
    other.enter();

    const bare = dealDamage(foe, mate, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);

    knight.addAbility(Abilities.SpineBond);

    const sheltered = dealDamage(
      foe,
      mate,
      Moves.Tackle,
      80,
      Types.Normal,
      MoveCategories.Physical,
    );
    // The far side is hit as hard as ever
    const across = dealDamage(mate, foe, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);

    expect(sheltered).toBeCloseTo(bare * BOND_SHELTER_SCALE, 5);
    expect(across).toBe(bare);
  });

  it('leaves special moves alone while it shelters', () => {
    const { battle, teamA, teamB } = createBattle();
    const knight = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    knight.enter();
    mate.enter();
    foe.enter();

    const bare = dealDamage(foe, mate, Moves.Ember, 80, Types.Fire, MoveCategories.Special);

    knight.addAbility(Abilities.SpineBond);

    expect(dealDamage(foe, mate, Moves.Ember, 80, Types.Fire, MoveCategories.Special)).toBe(bare);
  });

  it('sharpens what its own team throws with special moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const mage = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mage.enter();
    mate.enter();
    foe.enter();

    const bare = dealDamage(mate, foe, Moves.Ember, 80, Types.Fire, MoveCategories.Special);
    const physical = dealDamage(mate, foe, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);

    mage.addAbility(Abilities.EmberBond);

    expect(dealDamage(mate, foe, Moves.Ember, 80, Types.Fire, MoveCategories.Special)).toBeCloseTo(
      bare * BOND_KINDLE_SCALE,
      5,
    );
    // Physical moves are its own business
    expect(dealDamage(mate, foe, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical)).toBe(
      physical,
    );
  });

  it('gets its own team casting sooner, and leaves the enemy to wind up', () => {
    const { battle, teamA, teamB } = createBattle();
    const ninja = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    ninja.enter();
    mate.enter();
    foe.enter();

    const atMate = { type: MoveTargetType.Unit, unit: mate } as const;
    const atFoe = { type: MoveTargetType.Unit, unit: foe } as const;
    const plain = mate.checkMoveCastTime(Moves.SolarBeam, atFoe);

    ninja.addAbility(Abilities.ShadeBond);

    expect(mate.checkMoveCastTime(Moves.SolarBeam, atFoe)).toBeCloseTo(plain * BOND_SHADE_SCALE, 5);
    expect(foe.checkMoveCastTime(Moves.SolarBeam, atMate)).toBe(plain);
  });
});
