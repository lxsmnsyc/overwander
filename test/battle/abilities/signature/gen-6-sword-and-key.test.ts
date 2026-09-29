// Espurr through Klefki.

import { describe, expect, it } from 'vitest';
import { UNLIMITED_BATTLE_LIMITS } from '../../../../src/data/constants/battle-limits';
import { Slots, packSlots, withSlots } from '../../../../src/data/constants/slots';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Species } from '../../../../src/data/ids/species';
import {
  KEYRING_SLOTS,
  RESTRAINT_HELD,
  RESTRAINT_PENALTY,
  RESTRAINT_RELEASE,
  TURN_THE_BLADE_SCALE,
} from '../../../../src/battle/abilities/signature/espurr-to-klefki';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

describe("Kalos's sword and key", () => {
  it('holds its first three moves back and lets go of the fourth', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA, [Types.Psychic]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    cat.enter();
    foe.enter();

    const bare = dealDamage(cat, foe, Moves.Psybeam, 65, Types.Psychic, MoveCategories.Special);

    foe.setHealth(foe.checkStat(Stats.HP, 0));
    cat.addAbility(Abilities.Restraint);

    for (let at = 0; at < RESTRAINT_HELD; at++) {
      foe.setHealth(foe.checkStat(Stats.HP, 0));

      const held = dealDamage(cat, foe, Moves.Psybeam, 65, Types.Psychic, MoveCategories.Special);

      expect(held).toBeCloseTo(bare * RESTRAINT_PENALTY, 0);
    }

    foe.setHealth(foe.checkStat(Stats.HP, 0));

    const loosed = dealDamage(cat, foe, Moves.Psybeam, 65, Types.Psychic, MoveCategories.Special);

    expect(loosed).toBeCloseTo(bare * RESTRAINT_RELEASE, 0);
  });

  it('turns the first blow of each stance and takes the second whole', () => {
    const { battle, teamA, teamB } = createBattle();
    const sword = createUnit(battle, teamA, [Types.Steel, Types.Ghost]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    sword.setSpecies(Species.Aegislash);
    sword.enter();
    foe.enter();

    /** One blow, from a sword that is whole again first */
    function swing(): number {
      sword.setHealth(sword.checkStat(Stats.HP, 0));
      return dealDamage(foe, sword, Moves.Tackle, 80, Types.Normal, MoveCategories.Physical);
    }

    const bare = swing();

    sword.addAbility(Abilities.TurnTheBlade);

    expect(swing()).toBeCloseTo(bare * TURN_THE_BLADE_SCALE, 0);
    expect(swing()).toBeCloseTo(bare, 0);

    // Drawing the blade arms it again, since that is another stance
    sword.setSpecies(Species.AegislashBlade);

    expect(swing()).toBeCloseTo(bare * TURN_THE_BLADE_SCALE, 0);
    expect(swing()).toBeCloseTo(bare, 0);
  });

  it('carries one held item more than it was born with', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', undefined, UNLIMITED_BATTLE_LIMITS);
    const ring = createUnit(battle, teamA, [Types.Steel, Types.Fairy]);

    pinRandom(battle, 1);
    ring.setSlots(withSlots(0, Slots.Item, 2));
    ring.enter();
    createUnit(battle, teamB).enter();

    expect(ring.checkSlots(Slots.Item)).toBe(2);

    ring.addAbility(Abilities.Keyring);

    expect(ring.checkSlots(Slots.Item)).toBe(2 + KEYRING_SLOTS);
  });

  it('never carries more than the fight allows', () => {
    // A rule about the fight outranks the ring's own pocket
    const { battle, teamA, teamB } = createBattle('test-seed', undefined, packSlots(1, 1, 4));
    const ring = createUnit(battle, teamA, [Types.Steel, Types.Fairy]);

    pinRandom(battle, 1);
    ring.setSlots(withSlots(0, Slots.Item, 4));
    ring.addAbility(Abilities.Keyring);
    ring.enter();
    createUnit(battle, teamB).enter();

    expect(ring.checkSlots(Slots.Item)).toBe(1);
  });
});
