import { describe, expect, it } from 'vitest';
import { MoveTargetType } from '../../../src/battle/events';
import { canDynamax } from '../../../src/battle/gimmicks/dynamax';
import { canTerastallize } from '../../../src/battle/gimmicks/terastal';
import { zCastShownAs } from '../../../src/battle/gimmicks/z-moves';
import type Unit from '../../../src/battle/unit';
import { packSlots } from '../../../src/data/constants/slots';
import { Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { Weathers } from '../../../src/data/ids/status';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { Moves } from '../../../src/data/ids/moves';
import { Species } from '../../../src/data/ids/species';
import { MOVE_DELAY } from '../../../src/battle/mechanics/move';
import { createBattle, createUnit } from '../harness';

describe('Zeniths', () => {
  it('puts an Arcanine holding its shard at its Zenith, Strong Jaw worn on top', () => {
    const { battle, teamA } = createBattle();
    const dog = createUnit(battle, teamA);
    dog.setSpecies(Species.Arcanine);
    dog.addAbility(Abilities.Intimidate);
    dog.addItem(Items.ArcanineZenithShard);

    dog.enter();

    expect(dog.species).toBe(Species.ArcanineZenith);
    expect(dog.stats[0][Stats.Speed]).toBe(135);
    expect([...dog.types]).toEqual([Types.Fire, Types.Dragon]);
    expect(dog.hasAbility(Abilities.StrongJaw)).toBe(true);
    expect(dog.hasAbility(Abilities.Intimidate)).toBe(true);
  });

  it('keeps the Zenith through a change back to its own shape', () => {
    const { battle, teamA } = createBattle();
    const dog = createUnit(battle, teamA);
    dog.setSpecies(Species.Arcanine);
    dog.addItem(Items.ArcanineZenithShard);

    dog.enter();
    // A form change aims at the pokemon's own shape, which for a Zenith is the Zenith
    dog.setSpecies(Species.Arcanine);

    expect(dog.species).toBe(Species.ArcanineZenith);
  });

  it('lets a change into a shape the Zenith has none of land as it would on anybody', () => {
    const { battle, teamA } = createBattle();
    const dog = createUnit(battle, teamA);
    dog.setSpecies(Species.Arcanine);
    dog.addItem(Items.ArcanineZenithShard);

    dog.enter();
    dog.setSpecies(Species.ArcanineHisui);

    expect(dog.species).toBe(Species.ArcanineHisui);
  });

  it('puts a Deoxys kept in another shape at the Zenith of that shape', () => {
    const { battle, teamA } = createBattle();
    const deoxys = createUnit(battle, teamA);
    deoxys.setSpecies(Species.DeoxysAttack);
    deoxys.addItem(Items.DeoxysZenithShard);

    deoxys.enter();

    expect(deoxys.species).toBe(Species.DeoxysAttackZenith);
    expect(deoxys.stats[0][Stats.Attack]).toBe(200);
    expect(deoxys.hasAbility(Abilities.BeastBoost)).toBe(true);
  });

  it('turns a Castform Zenith with the weather, from its own snow to the sun', () => {
    const { battle, teamA } = createBattle();
    const cloud = createUnit(battle, teamA);
    cloud.setSpecies(Species.Castform);
    cloud.addAbility(Abilities.Forecast);
    cloud.addItem(Items.CastformZenithShard);

    cloud.enter();
    // Snow Warning calls up its sky by casting the move for it, which lands a delay later
    battle.tick(MOVE_DELAY);

    expect(cloud.species).toBe(Species.CastformSnowyZenith);
    expect([...cloud.types]).toEqual([Types.Ice]);

    battle.setWeather(Weathers.Sunny);

    expect(cloud.species).toBe(Species.CastformSunnyZenith);
    expect([...cloud.types]).toEqual([Types.Fire]);
  });

  it('ignores a shard held by anybody else', () => {
    const { battle, teamA } = createBattle();
    const ninetales = createUnit(battle, teamA);
    ninetales.setSpecies(Species.Ninetales);
    ninetales.addItem(Items.ArcanineZenithShard);

    ninetales.enter();

    expect(ninetales.species).toBe(Species.Ninetales);
  });

  it('lets one pokemon on a team reach its Zenith, the highest level first', () => {
    const { battle, teamA, teamB } = createBattle();
    const low = createUnit(battle, teamA);
    const high = createUnit(battle, teamA);
    const rival = createUnit(battle, teamB);

    for (const unit of [low, high, rival]) {
      unit.setSpecies(Species.Arcanine);
      unit.addItem(Items.ArcanineZenithShard);
    }
    low.setLevel(40);
    high.setLevel(60);

    low.enter();
    high.enter();
    rival.enter();

    expect(low.species).toBe(Species.Arcanine);
    expect(high.species).toBe(Species.ArcanineZenith);
    // The other side has a Zenith of its own
    expect(rival.species).toBe(Species.ArcanineZenith);
  });

  it('keeps a team’s Mega and its Zenith apart', () => {
    const { battle, teamA } = createBattle();
    const ghost = createUnit(battle, teamA);
    const dog = createUnit(battle, teamA);
    ghost.setSpecies(Species.Gengar);
    ghost.addItem(Items.Gengarite);
    dog.setSpecies(Species.Arcanine);
    dog.addItem(Items.ArcanineZenithShard);

    ghost.enter();
    dog.enter();

    expect(ghost.species).toBe(Species.GengarMega);
    expect(dog.species).toBe(Species.ArcanineZenith);
  });

  it('stays at its Zenith when it steps off the field and back', () => {
    const { battle, teamA } = createBattle();
    const dog = createUnit(battle, teamA);
    dog.setSpecies(Species.Arcanine);
    dog.addItem(Items.ArcanineZenithShard);

    dog.enter();
    dog.leave();
    dog.enter();

    expect(dog.species).toBe(Species.ArcanineZenith);
  });

  it('keeps a shard holder from Z-Moves, Terastal and Dynamax', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', undefined, packSlots(1, 2, 4));
    const foe = createUnit(battle, teamB);
    const plain = createUnit(battle, teamA);
    const holding = (item: Items): Unit => {
      const dog = createUnit(battle, teamA);

      dog.setSlots(packSlots(1, 2, 4));
      dog.setSpecies(Species.Arcanine);
      dog.addItem(Items.ArcanineZenithShard);
      dog.addItem(item);
      return dog;
    };
    const crystal = holding(Items.FiriumZ);
    const orb = holding(Items.TeraOrb);
    const band = holding(Items.DynamaxBand);
    const cast = {
      move: Moves.Flamethrower,
      target: { type: MoveTargetType.Unit, unit: foe },
      time: { progress: 0, duration: 1 },
    } as const;

    plain.setSpecies(Species.Arcanine);
    plain.addItem(Items.FiriumZ);

    // The same crystal turns the cast of an Arcanine with no shard
    expect(zCastShownAs(plain, cast)).not.toBeNull();
    expect(zCastShownAs(crystal, cast)).toBeNull();
    expect(canTerastallize(orb)).toBe(false);
    expect(canDynamax(band)).toBe(false);
  });
});
