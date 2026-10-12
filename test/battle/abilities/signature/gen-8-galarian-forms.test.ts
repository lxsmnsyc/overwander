// Galar's regional forms: Meowth to Yamask.

import { describe, expect, it } from 'vitest';
import {
  BLOCKADE_STAGES,
  CARVED_GRUDGE_FRACTION,
  CORAL_HUSK_DURATION,
  LEEK_SHIELD_SCALE,
  MENDING_HORN_SHARE,
} from '../../../../src/battle/abilities/signature/galarian-forms';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/utils';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const MOONBLAST: Blow = [Moves.Moonblast, 95, Types.Fairy, MoveCategories.Special];
const EMBER: Blow = [Moves.Ember, 40, Types.Fire, MoveCategories.Special];
const FELL: Blow = [Moves.Tackle, 1000, Types.Normal, MoveCategories.Physical];

/** Long enough for any cast move to be wound up and then land */
const FLIGHT = 1000;

function max(unit: Unit): number {
  return unit.checkStat(Stats.HP, 0);
}

/** A cast, then the time for it to wind up and the time for it to land */
function land(battle: ReturnType<typeof createBattle>['battle']): void {
  battle.tick(FLIGHT);
  battle.tick(FLIGHT);
}

describe('War Spoils', () => {
  it('takes the held item of an enemy it knocks out', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    cat.addAbility(Abilities.WarSpoils);
    foe.addItem(Items.Leftovers);

    dealDamage(cat, foe, ...FELL);

    expect(foe.alive).toBe(false);
    expect(foe.items[Items.Leftovers]).toBeUndefined();
    expect(cat.items[Items.Leftovers]).toBe(true);
  });

  it('hands the item to an empty-handed teammate when its own hands are full', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const full = createUnit(battle, teamA);
    const empty = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    cat.addAbility(Abilities.WarSpoils);
    cat.addItem(Items.ChoiceBand);
    full.addItem(Items.ChoiceBand);
    foe.addItem(Items.Leftovers);

    dealDamage(cat, foe, ...FELL);

    expect(cat.items[Items.Leftovers]).toBeUndefined();
    expect(full.items[Items.Leftovers]).toBeUndefined();
    expect(empty.items[Items.Leftovers]).toBe(true);
  });

  it('takes nothing from an enemy somebody else knocks out', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    cat.addAbility(Abilities.WarSpoils);
    foe.addItem(Items.Leftovers);

    dealDamage(mate, foe, ...FELL);

    expect(cat.items[Items.Leftovers]).toBeUndefined();
    expect(mate.items[Items.Leftovers]).toBeUndefined();
  });
});

describe('Mending Horn', () => {
  it('heals its worst-hurt teammate for half of what a Fairy move deals', () => {
    const { battle, teamA, teamB } = createBattle();
    const pony = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const scratched = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    pony.addAbility(Abilities.MendingHorn);
    hurt.setHealth(10);
    scratched.setHealth(max(scratched) - 10);

    const dealt = dealDamage(pony, foe, ...MOONBLAST);

    expect(dealt).toBeGreaterThan(0);
    expect(hurt.health).toBeCloseTo(10 + dealt * MENDING_HORN_SHARE, 5);
    expect(scratched.health).toBe(max(scratched) - 10);
  });

  it('heals nobody for a move of another type', () => {
    const { battle, teamA, teamB } = createBattle();
    const pony = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    pony.addAbility(Abilities.MendingHorn);
    hurt.setHealth(10);

    dealDamage(pony, foe, ...TACKLE);

    expect(hurt.health).toBe(10);
  });
});

describe('Slow Venom', () => {
  it('badly poisons an enemy on the third move it lands on that enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const slow = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    slow.addAbility(Abilities.SlowVenom);

    dealDamage(slow, foe, ...TACKLE);
    dealDamage(slow, other, ...TACKLE);
    dealDamage(slow, foe, ...TACKLE);

    expect(foe.status[Statuses.BadlyPoisoned]).toBeUndefined();

    dealDamage(slow, foe, ...TACKLE);

    expect(foe.status[Statuses.BadlyPoisoned]).toBeDefined();
    // Its one blow is counted on its own
    expect(other.status[Statuses.BadlyPoisoned]).toBeUndefined();
  });
});

describe('Leek Shield', () => {
  it('takes the next blow at 0.6x after landing an attack, then lowers the leek', () => {
    const { battle, teamA, teamB } = createBattle();
    const knight = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    knight.addAbility(Abilities.LeekShield);

    const bare = dealDamage(foe, knight, ...TACKLE);

    knight.setHealth(max(knight));
    dealDamage(knight, foe, ...TACKLE);

    const shielded = dealDamage(foe, knight, ...TACKLE);

    expect(shielded).toBeCloseTo(bare * LEEK_SHIELD_SCALE, 0);

    knight.setHealth(max(knight));

    expect(dealDamage(foe, knight, ...TACKLE)).toBe(bare);
  });
});

describe('Coral Husk', () => {
  it('draws enemy single-target moves for 6 seconds after it faints, and they hit nothing', () => {
    const { battle, teamA, teamB } = createBattle();
    const coral = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    coral.addAbility(Abilities.CoralHusk);
    foe.addMove(Moves.Tackle);

    dealDamage(foe, coral, ...FELL);

    expect(coral.alive).toBe(false);

    foe.cast(Moves.Tackle, unitTarget(mate));

    expect(foe.casting?.target).toEqual(unitTarget(coral));

    land(battle);

    expect(mate.health).toBe(max(mate));

    // Once the husk crumbles, the Tackle goes where it is aimed
    battle.tick(CORAL_HUSK_DURATION);
    foe.cast(Moves.Tackle, unitTarget(mate));
    land(battle);

    expect(mate.health).toBeLessThan(max(mate));
  });

  it('turns a move already winding up at a teammate as it falls', () => {
    const { battle, teamA, teamB } = createBattle();
    const coral = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    coral.addAbility(Abilities.CoralHusk);
    foe.addMove(Moves.Tackle);

    foe.cast(Moves.Tackle, unitTarget(mate));
    dealDamage(other, coral, ...FELL);

    expect(foe.casting?.target).toEqual(unitTarget(coral));

    land(battle);

    expect(mate.health).toBe(max(mate));
  });

  it('does nothing while it stands', () => {
    const { battle, teamA, teamB } = createBattle();
    const coral = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    coral.addAbility(Abilities.CoralHusk);
    foe.addMove(Moves.Tackle);

    foe.cast(Moves.Tackle, unitTarget(mate));
    land(battle);

    expect(mate.health).toBeLessThan(max(mate));
    expect(coral.health).toBe(max(coral));
  });
});

describe('Blockade', () => {
  it('takes 2 stages of Defense off an attacker that makes contact', () => {
    const { battle, teamA, teamB } = createBattle();
    const zig = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    zig.addAbility(Abilities.Blockade);

    dealDamage(foe, zig, ...EMBER);

    expect(foe.stages[Stages.Defense]).toBe(0);

    dealDamage(foe, zig, ...TACKLE);

    expect(foe.stages[Stages.Defense]).toBe(-BLOCKADE_STAGES);
  });

  it('pushes nobody back while it is casting', () => {
    const { battle, teamA, teamB } = createBattle();
    const zig = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    zig.addAbility(Abilities.Blockade);
    zig.addMove(Moves.Tackle);
    zig.cast(Moves.Tackle, unitTarget(foe));

    expect(zig.casting).toBeDefined();

    dealDamage(foe, zig, ...TACKLE);

    expect(foe.stages[Stages.Defense]).toBe(0);
  });
});

describe('Cold Sink', () => {
  it('draws an Ice move aimed at a teammate and turns it into Attack', () => {
    const { battle, teamA, teamB } = createBattle();
    const daruma = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    daruma.addAbility(Abilities.ColdSink);
    foe.addMove(Moves.IceBeam);

    foe.cast(Moves.IceBeam, unitTarget(mate));
    land(battle);

    expect(mate.health).toBe(max(mate));
    expect(daruma.health).toBe(max(daruma));
    expect(daruma.stages[Stages.Attack]).toBe(1);
  });
});

describe('Carved Grudge', () => {
  it('costs every enemy that struck it 1/8 of its HP when it faints', () => {
    const { battle, teamA, teamB } = createBattle();
    const tablet = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    const idle = createUnit(battle, teamB);

    pinRandom(battle, 1);
    tablet.addAbility(Abilities.CarvedGrudge);

    dealDamage(first, tablet, ...TACKLE);

    expect(first.health).toBe(max(first));

    dealDamage(second, tablet, ...FELL);

    expect(tablet.alive).toBe(false);
    expect(first.health).toBeCloseTo(max(first) * (1 - CARVED_GRUDGE_FRACTION), 5);
    expect(second.health).toBeCloseTo(max(second) * (1 - CARVED_GRUDGE_FRACTION), 5);
    expect(idle.health).toBe(max(idle));
  });
});
