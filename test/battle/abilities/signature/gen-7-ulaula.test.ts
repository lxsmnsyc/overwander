// Komala through Drampa, with Disguise.

import { describe, expect, it } from 'vitest';
import { AttackPriority } from '../../../../src/core/event-emitter';
import { BattleEvents, EffectType } from '../../../../src/battle/events';
import { unitTarget } from '../../../../src/battle/utils';
import { DISGUISE_CHIP } from '../../../../src/battle/abilities/gen-7';
import { HIT_BACK_SCALE } from '../../../../src/battle/abilities/signature/__create';
import { NAP_TIME_FRACTION } from '../../../../src/battle/abilities/signature/komala-to-drampa';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Species } from '../../../../src/data/ids/species';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { act, dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 80, Types.Normal, MoveCategories.Physical];
const SWIFT: Blow = [Moves.Swift, 80, Types.Normal, MoveCategories.Special];
// Mimikyu is a Ghost, so a Normal blow would not reach it at all
const EMBER: Blow = [Moves.Ember, 80, Types.Fire, MoveCategories.Special];

describe('Disguise', () => {
  it('takes the first blow for 1/8 of its HP and stays broken', () => {
    const { battle, teamA, teamB } = createBattle();
    const rag = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    rag.setSpecies(Species.Mimikyu);

    const max = rag.checkStat(Stats.HP, 0);

    rag.setHealth(max);
    rag.addAbility(Abilities.Disguise);

    expect(dealDamage(foe, rag, ...EMBER)).toBeCloseTo(max * DISGUISE_CHIP, 5);
    expect(rag.species).toBe(Species.MimikyuBusted);

    // Broken, so the next blow lands in full
    expect(dealDamage(foe, rag, ...EMBER)).toBeGreaterThan(max * DISGUISE_CHIP);
  });
});

describe('Nap Time', () => {
  it('heals 1/4 of its HP every 3rd time it acts', () => {
    const { battle, teamA } = createBattle();
    const koala = createUnit(battle, teamA);
    const max = koala.checkStat(Stats.HP, 0);

    koala.addAbility(Abilities.NapTime);
    koala.setHealth(max / 4);

    act(battle, koala);
    act(battle, koala);

    expect(koala.health).toBe(max / 4);

    act(battle, koala);

    expect(koala.health).toBeCloseTo(max / 4 + max * NAP_TIME_FRACTION, 5);
  });
});

describe('Blast Shell and Elder’s Ire', () => {
  it('charge on a blow of their own category against the team, and spend it on their own type', () => {
    const { battle, teamA, teamB } = createBattle();
    const turtle = createUnit(battle, teamA);
    const elder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    pinRandom(battle, 1);
    turtle.addAbility(Abilities.BlastShell);
    elder.addAbility(Abilities.EldersIre);

    const fire = turtle.checkMovePower(Moves.Ember, at) ?? 0;
    const dragon = elder.checkMovePower(Moves.DragonBreath, at) ?? 0;

    // A physical blow on a teammate charges only the turtle
    dealDamage(foe, mate, ...TACKLE);

    expect(turtle.checkMovePower(Moves.Ember, at)).toBeCloseTo(fire * HIT_BACK_SCALE, 5);
    expect(elder.checkMovePower(Moves.DragonBreath, at)).toBe(dragon);

    // A special one charges the elder
    dealDamage(foe, mate, ...SWIFT);

    expect(elder.checkMovePower(Moves.DragonBreath, at)).toBeCloseTo(dragon * HIT_BACK_SCALE, 5);

    // Spent by the move it powered
    dealDamage(turtle, foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special);

    expect(turtle.checkMovePower(Moves.Ember, at)).toBe(fire);
  });
});

describe('Grudge Shroud', () => {
  it('casts Spite at each enemy the first time it lands a move on it', () => {
    const { battle, teamA, teamB } = createBattle();
    const rag = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    const spites: unknown[] = [];

    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.move === Moves.Spite) {
        spites.push(event.target);
      }
    });

    pinRandom(battle, 1);
    rag.addAbility(Abilities.GrudgeShroud);

    dealDamage(foe, rag, ...TACKLE);
    dealDamage(foe, rag, ...TACKLE);
    dealDamage(other, rag, ...TACKLE);

    expect(spites).toEqual([unitTarget(foe), unitTarget(other)]);

    // Nothing for damage that was not a move
    rag.damage({ type: EffectType.None }, rag, 1, 0);

    expect(spites).toHaveLength(2);
  });
});
