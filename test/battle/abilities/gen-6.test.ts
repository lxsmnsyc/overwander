import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Species } from '../../../src/data/ids/species';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Statuses, Terrains } from '../../../src/data/ids/status';
import { EffectType, MoveTargetType } from '../../../src/battle/events';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../harness';
import { dealDamage } from './signature/helpers';

describe('Bulletproof', () => {
  it('turns away anything thrown at it and takes what is swung', () => {
    const { battle, teamA, teamB } = createBattle();
    const burr = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    burr.addAbility(Abilities.Bulletproof);
    burr.enter();
    foe.enter();

    const target = { type: MoveTargetType.Unit, unit: burr } as const;

    expect(foe.checkMoveImmunity(Moves.ShadowBall, target, Types.Ghost)).toBe(true);
    expect(foe.checkMoveImmunity(Moves.SeedBomb, target, Types.Grass)).toBe(true);
    // A blow it can see coming still lands
    expect(foe.checkMoveImmunity(Moves.Tackle, target, Types.Normal)).toBe(false);
  });
});

describe('Magician', () => {
  it('takes the item off whatever it lands a move on, while its own hands are empty', () => {
    const { battle, teamA, teamB } = createBattle();
    const mage = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mage.addAbility(Abilities.Magician);
    mage.enter();
    foe.enter();
    foe.addItem(Items.OranBerry);

    dealDamage(mage, foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special);

    expect(foe.items[Items.OranBerry]).toBeFalsy();
    expect(mage.items[Items.OranBerry]).toBeTruthy();
  });

  it('leaves the item where it is once its own hands are full', () => {
    const { battle, teamA, teamB } = createBattle();
    const mage = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mage.addAbility(Abilities.Magician);
    mage.enter();
    foe.enter();
    mage.addItem(Items.Leftovers);
    foe.addItem(Items.OranBerry);

    dealDamage(mage, foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special);

    expect(foe.items[Items.OranBerry]).toBeTruthy();
  });
});

describe('Flower Veil', () => {
  it('keeps status and enemy stat drops off the grass on its own team', () => {
    const { battle, teamA, teamB } = createBattle();
    const flower = createUnit(battle, teamA, [Types.Fairy]);
    const grass = createUnit(battle, teamA, [Types.Grass]);
    const plain = createUnit(battle, teamA, [Types.Normal]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    flower.addAbility(Abilities.FlowerVeil);
    flower.enter();
    grass.enter();
    plain.enter();
    foe.enter();

    grass.addStatus(Statuses.Poisoned, { type: EffectType.None });
    grass.addStage(Stages.Attack, -1, { type: EffectType.Move, unit: foe, move: Moves.Growl });
    plain.addStatus(Statuses.Poisoned, { type: EffectType.None });

    expect(grass.getStatus(Statuses.Poisoned)).toBeFalsy();
    expect(grass.stages[Stages.Attack]).toBe(0);
    // The veil is over the grass, not over the whole team
    expect(plain.getStatus(Statuses.Poisoned)).toBeTruthy();
  });

  it('lets the grass lower its own stat', () => {
    const { battle, teamA, teamB } = createBattle();
    const flower = createUnit(battle, teamA, [Types.Fairy]);
    const grass = createUnit(battle, teamA, [Types.Grass]);

    pinRandom(battle, 1);
    flower.addAbility(Abilities.FlowerVeil);
    flower.enter();
    grass.enter();
    createUnit(battle, teamB).enter();

    grass.addStage(Stages.Defense, -1, {
      type: EffectType.Move,
      unit: grass,
      move: Moves.Curse,
    });

    expect(grass.stages[Stages.Defense]).toBe(-1);
  });
});

describe('Symbiosis', () => {
  it('hands its own item over the moment a teammate spends theirs', () => {
    const { battle, teamA, teamB } = createBattle();
    const giver = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);

    pinRandom(battle, 1);
    giver.addAbility(Abilities.Symbiosis);
    giver.enter();
    mate.enter();
    createUnit(battle, teamB).enter();
    giver.addItem(Items.Leftovers);
    mate.addItem(Items.OranBerry);

    mate.removeItem(Items.OranBerry, { type: EffectType.Item, item: Items.OranBerry, unit: mate });

    expect(giver.items[Items.Leftovers]).toBeFalsy();
    expect(mate.items[Items.Leftovers]).toBeTruthy();
  });

  it('keeps hold of it when the item was knocked away rather than spent', () => {
    const { battle, teamA, teamB } = createBattle();
    const giver = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    giver.addAbility(Abilities.Symbiosis);
    giver.enter();
    mate.enter();
    foe.enter();
    giver.addItem(Items.Leftovers);
    mate.addItem(Items.OranBerry);

    mate.removeItem(Items.OranBerry, { type: EffectType.Move, unit: foe, move: Moves.KnockOff });

    expect(giver.items[Items.Leftovers]).toBeTruthy();
  });
});

describe('Grass Pelt', () => {
  it('counts for something only while there is grass under it', () => {
    const { battle, teamA, teamB } = createBattle();
    const goat = createUnit(battle, teamA, [Types.Grass]);

    pinRandom(battle, 1);
    goat.addAbility(Abilities.GrassPelt);
    goat.enter();
    createUnit(battle, teamB).enter();

    const bare = goat.checkStat(Stats.Defense, 0);

    goat.setTerrain(Terrains.Grassy, turns(5));

    expect(goat.checkStat(Stats.Defense, 0)).toBeCloseTo(bare * 1.5, 5);
  });
});

describe('Misty Surge', () => {
  it('brings the mist up with it', () => {
    const { battle, teamA, teamB } = createBattle();
    const garden = createUnit(battle, teamA, [Types.Fairy]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    garden.addAbility(Abilities.MistySurge);
    foe.enter();

    expect(foe.checkTerrain()).toBe(Terrains.None);

    garden.enter();
    battle.tick(turns(1));

    expect(foe.checkTerrain()).toBe(Terrains.Misty);
  });
});

describe('Stance Change', () => {
  it("draws the blade to attack and sheathes it on King's Shield", () => {
    const { battle, teamA, teamB } = createBattle();
    const sword = createUnit(battle, teamA, [Types.Steel, Types.Ghost]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    sword.addAbility(Abilities.StanceChange);
    sword.setSpecies(Species.Aegislash);
    sword.enter();
    foe.enter();

    expect(sword.species).toBe(Species.Aegislash);

    dealDamage(sword, foe, Moves.IronHead, 80, Types.Steel, MoveCategories.Physical);

    expect(sword.species).toBe(Species.AegislashBlade);

    sword.addMove(Moves.KingsShield);
    sword.cast(Moves.KingsShield, { type: MoveTargetType.None });

    expect(sword.species).toBe(Species.Aegislash);
  });

  it('keeps the shield up for a status move', () => {
    const { battle, teamA, teamB } = createBattle();
    const sword = createUnit(battle, teamA, [Types.Steel, Types.Ghost]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    sword.addAbility(Abilities.StanceChange);
    sword.setSpecies(Species.Aegislash);
    sword.enter();
    foe.enter();

    sword.addMove(Moves.SwordsDance);
    sword.cast(Moves.SwordsDance, { type: MoveTargetType.None });

    expect(sword.species).toBe(Species.Aegislash);
  });
});

describe('Mega Launcher', () => {
  it('fires a pulse harder and mends with one further', () => {
    const { battle, teamA, teamB } = createBattle();
    const gunner = createUnit(battle, teamA, [Types.Water]);
    const foe = createUnit(battle, teamB);
    const mate = createUnit(battle, teamA);

    pinRandom(battle, 1);
    gunner.enter();
    mate.enter();
    foe.enter();

    const bare = dealDamage(gunner, foe, Moves.WaterPulse, 60, Types.Water, MoveCategories.Special);

    foe.setHealth(foe.checkStat(Stats.HP, 0));
    gunner.addAbility(Abilities.MegaLauncher);

    const fired = dealDamage(
      gunner,
      foe,
      Moves.WaterPulse,
      60,
      Types.Water,
      MoveCategories.Special,
    );

    expect(fired).toBeCloseTo(bare * 1.5, 0);

    // And what it swings rather than fires is its own business
    foe.setHealth(foe.checkStat(Stats.HP, 0));

    const swung = dealDamage(gunner, foe, Moves.Tackle, 60, Types.Normal, MoveCategories.Physical);

    gunner.removeAbility(Abilities.MegaLauncher);
    foe.setHealth(foe.checkStat(Stats.HP, 0));

    expect(
      dealDamage(gunner, foe, Moves.Tackle, 60, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(swung, 5);
  });
});

describe('Refrigerate', () => {
  it('throws its Normal moves as Ice, and pays a fifth again for them', () => {
    const { battle, teamA, teamB } = createBattle();
    const aurora = createUnit(battle, teamA, [Types.Rock, Types.Ice]);
    const foe = createUnit(battle, teamB, [Types.Grass]);

    pinRandom(battle, 1);
    aurora.enter();
    foe.enter();

    const at = { type: MoveTargetType.Unit, unit: foe } as const;
    const plain = aurora.checkMovePower(Moves.Tackle, at);

    aurora.addAbility(Abilities.Refrigerate);

    expect(aurora.checkMoveType(Moves.Tackle, at)).toBe(Types.Ice);
    expect(aurora.checkMovePower(Moves.Tackle, at)).toBeCloseTo((plain ?? 0) * 1.2, 5);
  });

  it('leaves everything that was never Normal as it was', () => {
    const { battle, teamA, teamB } = createBattle();
    const aurora = createUnit(battle, teamA, [Types.Rock, Types.Ice]);
    const foe = createUnit(battle, teamB, [Types.Grass]);

    pinRandom(battle, 1);
    aurora.addAbility(Abilities.Refrigerate);
    aurora.enter();
    foe.enter();

    const at = { type: MoveTargetType.Unit, unit: foe } as const;

    expect(aurora.checkMoveType(Moves.RockSlide, at)).toBe(Types.Rock);
    expect(aurora.checkMovePower(Moves.RockSlide, at)).toBe(
      createUnit(battle, teamA, [Types.Rock]).checkMovePower(Moves.RockSlide, at),
    );
  });
});
