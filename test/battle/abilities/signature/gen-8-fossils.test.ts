// Dracozolt, Arctozolt, Dracovish and Arctovish.

import { describe, expect, it } from 'vitest';
import type Battle from '../../../../src/battle/core';
import { unitTarget } from '../../../../src/battle/utils';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Moves } from '../../../../src/data/ids/moves';
import { createBattle, createUnit, pinRandom } from '../../harness';

/** Walk the battle clock forward in frame-sized ticks */
function advance(battle: Battle, duration: number): void {
  const frame = 1000 / 60;

  for (let elapsed = 0; elapsed < duration; elapsed += frame) {
    battle.tick(frame);
  }
}

const STITCHES = [
  {
    ability: Abilities.Boltdrake,
    move: Moves.Thunderbolt,
    head: Types.Electric,
    tail: Types.Dragon,
    // Ground is immune to the head, and Fairy to the tail
    swaps: [Types.Ground],
    keeps: [Types.Water, Types.Fairy],
  },
  {
    ability: Abilities.Boltfrost,
    move: Moves.Thunderbolt,
    head: Types.Electric,
    tail: Types.Ice,
    swaps: [Types.Grass],
    keeps: [Types.Water],
  },
  {
    ability: Abilities.Gilldrake,
    move: Moves.WaterGun,
    head: Types.Water,
    tail: Types.Dragon,
    swaps: [Types.Dragon],
    keeps: [Types.Fire],
  },
  {
    ability: Abilities.Gillfrost,
    move: Moves.WaterGun,
    head: Types.Water,
    tail: Types.Ice,
    swaps: [Types.Grass],
    keeps: [Types.Fire, Types.Normal],
  },
] as const;

for (const stitch of STITCHES) {
  describe(`stitched ability ${stitch.ability}`, () => {
    it('strikes as the tail only where the tail hits harder', () => {
      const { battle, teamA, teamB } = createBattle();
      const fossil = createUnit(battle, teamA);
      const plain = createUnit(battle, teamA);

      fossil.addAbility(stitch.ability);

      for (const type of stitch.swaps) {
        const foe = createUnit(battle, teamB, [type]);

        expect(fossil.checkMoveType(stitch.move, unitTarget(foe))).toBe(stitch.tail);
        expect(plain.checkMoveType(stitch.move, unitTarget(foe))).toBe(stitch.head);
      }

      for (const type of stitch.keeps) {
        const foe = createUnit(battle, teamB, [type]);

        expect(fossil.checkMoveType(stitch.move, unitTarget(foe))).toBe(stitch.head);
      }

      // Only the head's own moves
      const foe = createUnit(battle, teamB, [stitch.swaps[0]]);

      expect(fossil.checkMoveType(Moves.Tackle, unitTarget(foe))).toBe(Types.Normal);
    });
  });
}

describe('Boltdrake', () => {
  it('lands an Electric move on a Ground target as a Dragon move', () => {
    const { battle, teamA, teamB } = createBattle();
    const fossil = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const ground = createUnit(battle, teamB, [Types.Ground]);
    const at = unitTarget(ground);
    const full = ground.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);

    plain.triggerMove(Moves.Thunderbolt, at, 0);
    advance(battle, plain.checkMoveDelay(Moves.Thunderbolt, at) + 100);

    expect(ground.health).toBe(full);

    fossil.addAbility(Abilities.Boltdrake);
    fossil.triggerMove(Moves.Thunderbolt, at, 0);
    advance(battle, fossil.checkMoveDelay(Moves.Thunderbolt, at) + 100);

    expect(ground.health).toBeLessThan(full);
  });
});
