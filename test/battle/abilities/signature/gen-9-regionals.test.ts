import { describe, expect, it } from 'vitest';
import {
  BOG_DOWN_DURATION,
  RAGING_SCALE,
  TEA_SERVICE_SCALE,
} from '../../../../src/battle/abilities/signature/paldea-regionals';
import { EffectType } from '../../../../src/battle/events';
import { unitTarget } from '../../../../src/battle/utils';
import { Stages } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { createBattle, createUnit, pinRandom } from '../../harness';

describe('Bog Down', () => {
  it('holds an enemy that lands a Ground move on it for 6 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const clod = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    clod.addAbility(Abilities.BogDown);
    expect(foe.checkEscape()).toBe(true);

    foe.attack(clod, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(foe.checkEscape()).toBe(true);

    foe.attack(clod, Moves.MudShot, 55, Types.Ground, MoveCategories.Special, 0);
    expect(foe.checkEscape()).toBe(false);

    battle.tick(BOG_DOWN_DURATION + 100);
    expect(foe.checkEscape()).toBe(true);
  });
});

describe('Raging', () => {
  it('winds up 20% faster while its Attack is raised', () => {
    const { battle, teamA, teamB } = createBattle();
    const bull = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bull.addAbility(Abilities.Raging);

    const calm = bull.checkMoveCastTime(Moves.Tackle, unitTarget(foe));

    bull.addStage(Stages.Attack, 1, { type: EffectType.None });
    expect(bull.checkMoveCastTime(Moves.Tackle, unitTarget(foe))).toBeCloseTo(calm * RAGING_SCALE);
  });
});

describe('Tea Service', () => {
  it('winds up a heal for a teammate 40% faster, not one for itself', () => {
    const { battle, teamA } = createBattle();
    const tea = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const plain = tea.checkMoveCastTime(Moves.HealPulse, unitTarget(mate));
    const own = tea.checkMoveCastTime(Moves.HealPulse, unitTarget(tea));
    const blow = tea.checkMoveCastTime(Moves.Tackle, unitTarget(mate));

    tea.addAbility(Abilities.TeaService);
    expect(tea.checkMoveCastTime(Moves.HealPulse, unitTarget(mate))).toBeCloseTo(
      plain * TEA_SERVICE_SCALE,
    );
    expect(tea.checkMoveCastTime(Moves.HealPulse, unitTarget(tea))).toBeCloseTo(own);
    expect(tea.checkMoveCastTime(Moves.Tackle, unitTarget(mate))).toBeCloseTo(blow);
  });
});
