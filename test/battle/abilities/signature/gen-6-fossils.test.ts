// Tyrunt and Amaura, Kalos's two fossils.

import { describe, expect, it } from 'vitest';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { MoveTargetType } from '../../../../src/battle/events';
import turns from '../../../../src/battle/turn';
import {
  FROSTBOUND_DURATION,
  FROSTBOUND_SCALE,
  JAW_SNAP_COOLDOWN,
} from '../../../../src/battle/abilities/signature/tyrunt-and-amaura';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

describe("Kalos's fossils", () => {
  it('bites a cast shut, then lets the next one through', () => {
    const { battle, teamA, teamB } = createBattle();
    const king = createUnit(battle, teamA, [Types.Rock, Types.Dragon]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    king.addAbility(Abilities.JawSnap);
    king.enter();
    foe.enter();
    foe.addMove(Moves.SolarBeam);

    foe.cast(Moves.SolarBeam, { type: MoveTargetType.Unit, unit: king });

    expect(foe.casting).toBeTruthy();

    dealDamage(king, foe, Moves.Crunch, 80, Types.Dark, MoveCategories.Physical);

    expect(foe.casting).toBeFalsy();

    // The jaw stays shut for its own while: the next cast rides out
    foe.cast(Moves.SolarBeam, { type: MoveTargetType.Unit, unit: king });
    dealDamage(king, foe, Moves.Crunch, 80, Types.Dark, MoveCategories.Physical);

    expect(foe.casting).toBeTruthy();

    // ...and once it opens again, the bite lands
    battle.tick(JAW_SNAP_COOLDOWN);
    dealDamage(king, foe, Moves.Crunch, 80, Types.Dark, MoveCategories.Physical);

    expect(foe.casting).toBeFalsy();
  });

  it('leaves alone anything that was not in the middle of a move', () => {
    const { battle, teamA, teamB } = createBattle();
    const king = createUnit(battle, teamA, [Types.Rock, Types.Dragon]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    king.addAbility(Abilities.JawSnap);
    king.enter();
    foe.enter();

    const bitten = dealDamage(king, foe, Moves.Crunch, 80, Types.Dark, MoveCategories.Physical);

    expect(bitten).toBeGreaterThan(0);
    expect(foe.casting).toBeFalsy();
  });

  it('holds a target in the cold, and lets it thaw', () => {
    const { battle, teamA, teamB } = createBattle();
    const aurora = createUnit(battle, teamA, [Types.Rock, Types.Ice]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    aurora.enter();
    foe.enter();
    foe.addMove(Moves.SolarBeam);

    const warm = foe.checkMoveCastTime(Moves.SolarBeam, {
      type: MoveTargetType.Unit,
      unit: aurora,
    });

    aurora.addAbility(Abilities.Frostbound);
    dealDamage(aurora, foe, Moves.AuroraBeam, 65, Types.Ice, MoveCategories.Special);

    expect(
      foe.checkMoveCastTime(Moves.SolarBeam, { type: MoveTargetType.Unit, unit: aurora }),
    ).toBeCloseTo(warm * FROSTBOUND_SCALE, 5);

    battle.tick(FROSTBOUND_DURATION + turns(1));

    expect(
      foe.checkMoveCastTime(Moves.SolarBeam, { type: MoveTargetType.Unit, unit: aurora }),
    ).toBeCloseTo(warm, 5);
  });
});
