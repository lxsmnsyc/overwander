import { describe, expect, it } from 'vitest';
import { EffectType, MoveTargetType } from '../../../src/battle/events';
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
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Species } from '../../../src/data/ids/species';
import { MOVE_DELAY } from '../../../src/battle/mechanics/move';
import { createBattle, createUnit } from '../harness';
import { dealDamage } from '../abilities/signature/helpers';

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
    expect(deoxys.stats[0][Stats.Attack]).toBe(203);
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

  it('puts a Wormadam born in another cloak at the Zenith of that cloak', () => {
    const { battle, teamA } = createBattle();
    const wormadam = createUnit(battle, teamA);
    wormadam.setSpecies(Species.WormadamTrash);
    wormadam.addItem(Items.WormadamZenithShard);

    wormadam.enter();

    expect(wormadam.species).toBe(Species.WormadamTrashZenith);
    expect([...wormadam.types]).toEqual([Types.Bug, Types.Steel]);
    expect(wormadam.hasAbility(Abilities.FurCoat)).toBe(true);
  });

  it('opens a Cherrim Zenith in the sun it brings', () => {
    const { battle, teamA } = createBattle();
    const cherrim = createUnit(battle, teamA);
    cherrim.setSpecies(Species.Cherrim);
    cherrim.addAbility(Abilities.FlowerGift);
    cherrim.addItem(Items.CherrimZenithShard);

    cherrim.enter();
    battle.tick(MOVE_DELAY);

    expect(cherrim.species).toBe(Species.CherrimSunshineZenith);
  });

  it('turns a Darmanitan Zenith into its Zen Mode Zenith below half', () => {
    const { battle, teamA, teamB } = createBattle();
    const darmanitan = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    darmanitan.setSpecies(Species.Darmanitan);
    darmanitan.setHealth(darmanitan.checkStat(Stats.HP, 0));
    darmanitan.addAbility(Abilities.ZenMode);
    darmanitan.addItem(Items.DarmanitanZenithShard);

    darmanitan.enter();
    foe.enter();

    expect(darmanitan.species).toBe(Species.DarmanitanZenith);
    expect([...darmanitan.types]).toEqual([Types.Fire, Types.Fighting]);

    foe.damage({ type: EffectType.None }, darmanitan, darmanitan.health * 0.6, 0);

    expect(darmanitan.species).toBe(Species.DarmanitanZenZenith);
    expect([...darmanitan.types]).toEqual([Types.Fire, Types.Psychic]);
    expect(darmanitan.hasAbility(Abilities.Berserk)).toBe(true);
  });

  it('puts a fused Kyurem at the Zenith of the dragon it holds', () => {
    const { battle, teamA } = createBattle();
    const kyurem = createUnit(battle, teamA);
    kyurem.setSpecies(Species.KyuremBlack);
    kyurem.addItem(Items.KyuremZenithShard);

    kyurem.enter();

    expect(kyurem.species).toBe(Species.KyuremBlackZenith);
    expect(kyurem.stats[0][Stats.Attack]).toBe(200);
    expect(kyurem.hasAbility(Abilities.IceScales)).toBe(true);
  });

  it('puts a Blue-Striped Basculin at its own Zenith, Dark like the red', () => {
    const { battle, teamA } = createBattle();
    const basculin = createUnit(battle, teamA);
    basculin.setSpecies(Species.BasculinBlue);
    basculin.addItem(Items.BasculinZenithShard);

    basculin.enter();

    expect(basculin.species).toBe(Species.BasculinBlueZenith);
    expect([...basculin.types]).toEqual([Types.Water, Types.Dark]);
  });

  it('draws an Aegislash Zenith into its Blade Zenith and back', () => {
    const { battle, teamA, teamB } = createBattle();
    const sword = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    sword.setSpecies(Species.Aegislash);
    sword.addAbility(Abilities.StanceChange);
    sword.addItem(Items.AegislashZenithShard);

    sword.enter();
    foe.enter();

    expect(sword.species).toBe(Species.AegislashZenith);

    dealDamage(sword, foe, Moves.IronHead, 80, Types.Steel, MoveCategories.Physical);

    expect(sword.species).toBe(Species.AegislashBladeZenith);
    expect(sword.stats[0][Stats.Attack]).toBe(170);
    expect(sword.hasAbility(Abilities.Sharpness)).toBe(true);

    sword.addMove(Moves.KingsShield);
    sword.cast(Moves.KingsShield, { type: MoveTargetType.None });

    expect(sword.species).toBe(Species.AegislashZenith);
  });

  it('puts a Super Gourgeist at its own Zenith, on its own HP', () => {
    const { battle, teamA } = createBattle();
    const pumpkin = createUnit(battle, teamA);
    pumpkin.setSpecies(Species.GourgeistSuper);
    pumpkin.addItem(Items.GourgeistZenithShard);

    pumpkin.enter();

    expect(pumpkin.species).toBe(Species.GourgeistSuperZenith);
    expect(pumpkin.stats[0][Stats.HP]).toBe(85);
    expect(pumpkin.hasAbility(Abilities.Harvest)).toBe(true);
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
