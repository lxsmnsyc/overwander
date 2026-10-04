// Mareanie through Wimpod, with Corrosion, Fluffy and Emergency Exit.

import { describe, expect, it } from 'vitest';
import { AttackPriority, EventPriority } from '../../../../src/core/event-emitter';
import { BattleEvents, EffectType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/utils';
import { FLUFFY_CONTACT_SCALE, FLUFFY_FIRE_SCALE } from '../../../../src/battle/abilities/gen-7';
import {
  FOND_CRUSH_SCALE,
  OPENING_SLASH_SCALE,
  TOXIC_DOME_SCALE,
} from '../../../../src/battle/abilities/signature/mareanie-to-wimpod';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Genders } from '../../../../src/data/ids/species';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 80, Types.Normal, MoveCategories.Physical];
const SWIFT: Blow = [Moves.Swift, 80, Types.Normal, MoveCategories.Special];
const EMBER: Blow = [Moves.Ember, 80, Types.Fire, MoveCategories.Special];

function heal(unit: Unit): void {
  unit.setHealth(unit.checkStat(Stats.HP, 0));
}

describe('Corrosion', () => {
  it('poisons Poison and Steel types, but not past another guard', () => {
    const { battle, teamA, teamB } = createBattle();
    const lizard = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const poison = createUnit(battle, teamB, [Types.Poison]);
    const steel = createUnit(battle, teamB, [Types.Steel]);
    const guarded = createUnit(battle, teamB, [Types.Steel]);
    const from = (unit: Unit) => ({ type: EffectType.Move, move: Moves.Toxic, unit }) as const;

    lizard.addAbility(Abilities.Corrosion);
    guarded.addAbility(Abilities.Immunity);

    poison.addStatus(Statuses.Poisoned, from(plain));

    expect(poison.status[Statuses.Poisoned]).toBeUndefined();

    poison.addStatus(Statuses.Poisoned, from(lizard));
    steel.addStatus(Statuses.BadlyPoisoned, from(lizard));
    guarded.addStatus(Statuses.Poisoned, from(lizard));

    expect(poison.status[Statuses.Poisoned]).toBeDefined();
    expect(steel.status[Statuses.BadlyPoisoned]).toBeDefined();
    expect(guarded.status[Statuses.Poisoned]).toBeUndefined();
  });
});

describe('Fluffy', () => {
  it('halves contact moves and doubles Fire moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const bear = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bear.addAbility(Abilities.Fluffy);

    const cases: [Blow, number][] = [
      [TACKLE, FLUFFY_CONTACT_SCALE],
      [SWIFT, 1],
      [EMBER, FLUFFY_FIRE_SCALE],
    ];

    for (const [blow, scale] of cases) {
      heal(bear);
      heal(plain);
      expect(dealDamage(foe, bear, ...blow) / dealDamage(foe, plain, ...blow)).toBeCloseTo(
        scale,
        1,
      );
    }
  });
});

describe('Emergency Exit', () => {
  it('leaves for its strongest teammate when damage takes it under 1/2 HP', () => {
    const { battle, teamA, teamB } = createBattle();
    const bug = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const switched: [Unit, Unit][] = [];

    battle.on(BattleEvents.UnitSwitch, EventPriority.Post, (event) => {
      switched.push([event.source, event.target]);
    });

    bug.addAbility(Abilities.EmergencyExit);
    bug.enter();
    foe.enter();

    foe.damage(NONE_CAUSE, bug, bug.checkStat(Stats.HP, 0) * 0.3, 0);

    expect(switched).toHaveLength(0);

    foe.damage(NONE_CAUSE, bug, bug.checkStat(Stats.HP, 0) * 0.3, 0);

    expect(switched).toEqual([[bug, mate]]);
  });
});

describe('Toxic Dome', () => {
  it('softens the first hit after each entrance and casts Toxic back', () => {
    const { battle, teamA, teamB } = createBattle();
    const star = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const toxics: unknown[] = [];

    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.move === Moves.Toxic) {
        toxics.push(event.target);
      }
    });

    pinRandom(battle, 1);
    star.addAbility(Abilities.ToxicDome);
    star.enter();
    foe.enter();

    const base = dealDamage(foe, plain, ...TACKLE);

    expect(dealDamage(foe, star, ...TACKLE) / base).toBeCloseTo(TOXIC_DOME_SCALE, 1);
    expect(toxics).toEqual([unitTarget(foe)]);

    heal(star);
    expect(dealDamage(foe, star, ...TACKLE)).toBe(base);
    expect(toxics).toHaveLength(1);

    // Back on the field, the dome is up again
    star.leave();
    star.enter();
    heal(star);
    expect(dealDamage(foe, star, ...TACKLE) / base).toBeCloseTo(TOXIC_DOME_SCALE, 1);
  });
});

describe('Fume Flare', () => {
  it('poisons with its Fire moves when the roll comes up', () => {
    const { battle, teamA, teamB } = createBattle();
    const lizard = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    lizard.addAbility(Abilities.FumeFlare);

    pinRandom(battle, 0.5);
    dealDamage(lizard, foe, ...EMBER);

    expect(foe.status[Statuses.Poisoned]).toBeUndefined();

    // A hit that is not Fire never poisons, whatever the roll
    pinRandom(battle, 0);
    dealDamage(lizard, foe, ...SWIFT);

    expect(foe.status[Statuses.Poisoned]).toBeUndefined();

    dealDamage(lizard, foe, ...EMBER);

    expect(foe.status[Statuses.Poisoned]).toBeDefined();
  });
});

describe('Fond Crush', () => {
  it('hits an infatuated target harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const bear = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    bear.setGender(Genders.Female);
    foe.setGender(Genders.Male);
    bear.addAbility(Abilities.FondCrush);

    const plain = bear.checkMovePower(Moves.Tackle, at) ?? 0;

    foe.addStatus(Statuses.Infatuated, {
      type: EffectType.Ability,
      ability: Abilities.CuteCharm,
      unit: bear,
    });

    expect(foe.status[Statuses.Infatuated]).toBeDefined();
    expect(bear.checkMovePower(Moves.Tackle, at)).toBeCloseTo(plain * FOND_CRUSH_SCALE, 5);
  });
});

describe('Opening Slash', () => {
  it('powers up the first move it lands after each entrance', () => {
    const { battle, teamA, teamB } = createBattle();
    const bug = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bug.addAbility(Abilities.OpeningSlash);
    bug.enter();
    foe.enter();

    const base = dealDamage(plain, foe, ...TACKLE);

    heal(foe);
    expect(dealDamage(bug, foe, ...TACKLE) / base).toBeCloseTo(OPENING_SLASH_SCALE, 1);

    heal(foe);
    expect(dealDamage(bug, foe, ...TACKLE)).toBe(base);

    bug.leave();
    bug.enter();
    heal(foe);
    expect(dealDamage(bug, foe, ...TACKLE) / base).toBeCloseTo(OPENING_SLASH_SCALE, 1);
  });
});
