import { describe, expect, it } from 'vitest';
import { AttackPriority } from '../../src/core/event-emitter';
import { chooseMove, setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import type Battle from '../../src/battle/core';
import { BattleEvents, MoveTargetType, type UnitAttackEvent } from '../../src/battle/events';
import { canDynamax } from '../../src/battle/mechanics/dynamax';
import {
  TERA_ADAPTABILITY_STAB,
  TERA_POWER_FLOOR,
  TERA_SAME_TYPE_STAB,
  TERA_STAB,
  canTerastallize,
  isTerastallized,
  terastallize,
} from '../../src/battle/mechanics/terastal';
import type Unit from '../../src/battle/unit';
import { packSlots } from '../../src/data/constants/slots';
import { Stats, StatsKind } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { createBattle, createUnit, pinRandom } from './harness';

function at(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit };
}

/** A unit of the given types holding a Tera Orb, with room for one more item */
function orbHolder(battle: Battle, team: Unit['team'], types: Types[], tera: Types): Unit {
  const unit = createUnit(battle, team, types);

  unit.setSlots(packSlots(1, 2, 4));
  unit.teraType = tera;
  unit.addItem(Items.TeraOrb);
  return unit;
}

/** What the engine's STAB resolution makes of a move of this type in the unit's hands */
function stabOf(battle: Battle, source: Unit, target: Unit, type: Types): number {
  const parent: UnitAttackEvent = {
    id: 'UnitAttack',
    disabled: false,
    source,
    target,
    move: Moves.Tackle,
    value: 0,
    category: MoveCategories.Physical,
    type,
    flags: 0,
    success: false,
  };
  const event = { id: 'UnitAttackResolveSTAB', disabled: false, parent, value: 0 };

  battle.emit(BattleEvents.UnitAttackResolveSTAB, event);
  return event.value;
}

/** HP a move takes off a target at a fixed roll and no critical */
function damageOf(attacker: Unit, move: Moves, target: Unit): number {
  const before = target.health;

  attacker.triggerMoveTarget(move, at(target), 0);
  const taken = before - target.health;

  target.setHealth(target.checkStat(Stats.HP, 0));
  return taken;
}

describe('Terastallization', () => {
  it('turns an orb holder into its Tera type as it takes the field', () => {
    const { battle, teamA } = createBattle();
    const unit = orbHolder(battle, teamA, [Types.Fire, Types.Flying], Types.Water);

    expect(isTerastallized(unit)).toBe(false);
    unit.enter();

    expect(unit.terastallized).toBe(true);
    expect([...unit.types]).toEqual([Types.Water]);
  });

  it('reads a unit with no Tera type stored as its first type', () => {
    const { battle, teamA } = createBattle();
    const unit = orbHolder(battle, teamA, [Types.Grass, Types.Poison], Types.Unknown);

    unit.enter();

    expect(unit.teraType).toBe(Types.Grass);
    expect([...unit.types]).toEqual([Types.Grass]);
  });

  it('turns nobody without the orb', () => {
    const { battle, teamA } = createBattle();
    const plain = createUnit(battle, teamA, [Types.Fire]);

    plain.teraType = Types.Water;
    plain.enter();

    expect(plain.terastallized).toBe(false);
    expect([...plain.types]).toEqual([Types.Fire]);
  });

  it('turns one pokemon a side a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const first = orbHolder(battle, teamA, [Types.Fire], Types.Water);
    const second = orbHolder(battle, teamA, [Types.Fire], Types.Water);
    const rival = orbHolder(battle, teamB, [Types.Fire], Types.Grass);

    first.enter();
    second.enter();
    rival.enter();

    expect(first.terastallized).toBe(true);
    expect(second.terastallized).toBe(false);
    // The other side has its own
    expect(rival.terastallized).toBe(true);
  });

  it('lasts through switching out and back in', () => {
    const { battle, teamA } = createBattle();
    const unit = orbHolder(battle, teamA, [Types.Fire], Types.Water);

    unit.enter();
    unit.leave();
    unit.enter(true);

    expect(unit.terastallized).toBe(true);
    expect([...unit.types]).toEqual([Types.Water]);
  });

  it('never turns a pokemon holding a Mega Stone, a Z-Crystal or a Dynamax Band', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', undefined, packSlots(1, 2, 4));
    const { battle: other, teamA: otherTeam } = createBattle(
      'test-seed',
      undefined,
      packSlots(1, 2, 4),
    );
    const stone = orbHolder(battle, teamA, [Types.Fire], Types.Water);
    const crystal = orbHolder(battle, teamB, [Types.Fire], Types.Water);
    const band = orbHolder(other, otherTeam, [Types.Fire], Types.Water);

    stone.addItem(Items.Gengarite);
    crystal.addItem(Items.FiriumZ);
    band.addItem(Items.DynamaxBand);
    for (const unit of [stone, crystal, band]) {
      expect(canTerastallize(unit)).toBe(false);
      unit.enter();
      expect(unit.terastallized).toBe(false);
    }
  });

  it('never also Dynamaxes or Mega Evolves once it has', () => {
    const { battle, teamA } = createBattle('test-seed', undefined, packSlots(1, 2, 4));
    const unit = orbHolder(battle, teamA, [Types.Ghost, Types.Poison], Types.Ghost);

    unit.setSpecies(Species.Gengar);
    unit.setHealth(unit.checkStat(Stats.HP, 0));
    unit.enter();
    expect(unit.terastallized).toBe(true);

    // Handed a band and a stone after the fact, the way Trick would
    unit.setSlots(packSlots(1, 3, 4));
    unit.addItem(Items.DynamaxBand);
    unit.addItem(Items.Gengarite);
    expect(canDynamax(unit)).toBe(false);
    unit.setHealth(unit.checkStat(Stats.HP, 0) / 2 - 1);
    expect(unit.dynamaxed).toBe(false);

    unit.leave();
    unit.enter(true);
    expect(unit.species).toBe(Species.Gengar);
  });

  it('is only its Tera type when hit', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const plain = createUnit(battle, teamB, [Types.Grass]);
    const tera = orbHolder(battle, teamB, [Types.Grass], Types.Water);

    pinRandom(battle, 1);
    tera.enter();

    // Ember is 2x on Grass, 1/2 on Water
    const intoGrass = damageOf(attacker, Moves.Ember, plain);
    const intoWater = damageOf(attacker, Moves.Ember, tera);

    expect(intoWater).toBeLessThan(intoGrass / 3);
  });

  it('keeps its type through a type-changing move and a form change', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const tera = orbHolder(battle, teamB, [Types.Grass], Types.Fire);

    tera.enter();
    caster.triggerMoveTarget(Moves.Soak, at(tera), 0);
    expect([...tera.types]).toEqual([Types.Fire]);

    tera.setSpecies(Species.Squirtle);
    expect([...tera.types]).toEqual([Types.Fire]);
    // Its STAB now reads the new form's types
    expect(stabOf(battle, tera, caster, Types.Water)).toBe(TERA_STAB);
    expect(stabOf(battle, tera, caster, Types.Grass)).toBe(1);
  });

  it('keeps its own STAB and gains 1.5x on its Tera type, 2x where the two match', () => {
    const { battle, teamA, teamB } = createBattle();
    const foe = createUnit(battle, teamB);
    const off = orbHolder(battle, teamA, [Types.Fire, Types.Flying], Types.Water);
    const { battle: other, teamA: otherTeam, teamB: otherFoes } = createBattle();
    const same = orbHolder(other, otherTeam, [Types.Fire, Types.Flying], Types.Fire);
    const otherFoe = createUnit(other, otherFoes);

    off.enter();
    same.enter();

    expect(stabOf(battle, off, foe, Types.Water)).toBe(TERA_STAB);
    expect(stabOf(battle, off, foe, Types.Fire)).toBe(TERA_STAB);
    expect(stabOf(battle, off, foe, Types.Flying)).toBe(TERA_STAB);
    expect(stabOf(battle, off, foe, Types.Grass)).toBe(1);

    expect(stabOf(other, same, otherFoe, Types.Fire)).toBe(TERA_SAME_TYPE_STAB);
    expect(stabOf(other, same, otherFoe, Types.Flying)).toBe(TERA_STAB);
  });

  it('takes Adaptability to 2.25x where the types match, and 2x on a new Tera type', () => {
    const { battle, teamA, teamB } = createBattle();
    const foe = createUnit(battle, teamB);
    const same = orbHolder(battle, teamA, [Types.Normal], Types.Normal);
    const { battle: other, teamA: otherTeam, teamB: otherFoes } = createBattle();
    const off = orbHolder(other, otherTeam, [Types.Normal], Types.Water);
    const otherFoe = createUnit(other, otherFoes);

    for (const unit of [same, off]) {
      unit.addAbility(Abilities.Adaptability);
      unit.enter();
    }

    expect(stabOf(battle, same, foe, Types.Normal)).toBe(TERA_ADAPTABILITY_STAB);
    expect(stabOf(other, off, otherFoe, Types.Water)).toBe(2);
    // Its original type's moves stay at 1.5x
    expect(stabOf(other, off, otherFoe, Types.Normal)).toBe(TERA_STAB);
  });

  it('raises its weaker Tera-type moves to 60 power, but not multi-hit or priority ones', () => {
    const { battle, teamA, teamB } = createBattle();
    const tera = orbHolder(battle, teamA, [Types.Normal], Types.Water);
    const grass = orbHolder(battle, teamB, [Types.Normal], Types.Grass);
    const foe = createUnit(battle, teamB);

    expect(tera.checkMovePower(Moves.WaterGun, at(foe))).toBe(40);
    tera.enter();
    grass.enter();

    expect(tera.checkMovePower(Moves.WaterGun, at(foe))).toBe(TERA_POWER_FLOOR);
    // Priority
    expect(tera.checkMovePower(Moves.AquaJet, at(foe))).toBe(40);
    // Not its Tera type
    expect(tera.checkMovePower(Moves.Ember, at(foe))).toBe(40);
    // Already above it
    expect(tera.checkMovePower(Moves.Surf, at(foe))).toBe(90);
    // Multi-hit
    expect(grass.checkMovePower(Moves.BulletSeed, at(foe))).toBe(25);
  });

  it('throws Tera Blast as its Tera type, physical where Attack is the higher', () => {
    const { battle, teamA, teamB } = createBattle();
    const tera = orbHolder(battle, teamA, [Types.Normal], Types.Fire);
    const foe = createUnit(battle, teamB);
    const categories: MoveCategories[] = [];

    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      if (event.move === Moves.TeraBlast) {
        categories.push(event.category);
      }
    });
    pinRandom(battle, 1);

    expect(tera.checkMoveType(Moves.TeraBlast, at(foe))).toBe(Types.Normal);
    tera.setStat(StatsKind.Base, Stats.Attack, 150);
    tera.triggerMoveTarget(Moves.TeraBlast, at(foe), 0);

    tera.enter();
    expect(tera.checkMoveType(Moves.TeraBlast, at(foe))).toBe(Types.Fire);
    tera.triggerMoveTarget(Moves.TeraBlast, at(foe), 0);
    tera.setStat(StatsKind.Base, Stats.Attack, 50);
    tera.triggerMoveTarget(Moves.TeraBlast, at(foe), 0);

    expect(categories).toEqual([
      MoveCategories.Special,
      MoveCategories.Physical,
      MoveCategories.Special,
    ]);
  });

  it('lets a raid boss be turned without the orb, spending its side', () => {
    const { battle, teamB } = createBattle();
    const boss = createUnit(battle, teamB, [Types.Rock]);
    const ally = orbHolder(battle, teamB, [Types.Fire], Types.Water);

    boss.teraType = Types.Dragon;
    terastallize(boss);
    boss.enter();
    ally.enter();

    expect([...boss.types]).toEqual([Types.Dragon]);
    expect(ally.terastallized).toBe(false);
  });

  it('lets the AI see the new typing when it weighs its moves', () => {
    const { battle, teamA, teamB } = createBattle();
    setupChooseMoveAI(battle);
    pinRandom(battle, 0.99);
    const attacker = createUnit(battle, teamA);
    const tera = orbHolder(battle, teamB, [Types.Grass], Types.Water);

    attacker.addMove(Moves.Ember);
    attacker.addMove(Moves.ThunderShock);
    attacker.enter();

    // Grass as it stands: Ember is the 2x
    expect(chooseMove(battle, attacker)?.move).toBe(Moves.Ember);
    tera.enter();
    // Water once it has turned: Thunder Shock is
    expect(chooseMove(battle, attacker)?.move).toBe(Moves.ThunderShock);
  });
});
