import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Species } from '../../../src/data/ids/species';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Statuses, Terrains, Weathers } from '../../../src/data/ids/status';
import { AttackPriority } from '../../../src/core/event-emitter';
import { BattleEvents, EffectType, MoveTargetType } from '../../../src/battle/events';
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

describe('Sweet Veil', () => {
  it('keeps its whole team awake while it stands', () => {
    const { battle, teamA, teamB } = createBattle();
    const shop = createUnit(battle, teamA, [Types.Fairy]);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    shop.addAbility(Abilities.SweetVeil);
    shop.enter();
    mate.enter();
    foe.enter();

    mate.addStatus(Statuses.Sleeping, { type: EffectType.None });

    expect(mate.status[Statuses.Sleeping]).toBeFalsy();

    // The other side sleeps as it always did
    foe.addStatus(Statuses.Sleeping, { type: EffectType.None });

    expect(foe.status[Statuses.Sleeping]).toBeTruthy();
  });
});

describe('Pixilate', () => {
  it('sends a Normal move out as Fairy, and harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const ribbon = createUnit(battle, teamA, [Types.Fairy]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    ribbon.enter();
    foe.enter();

    const target = { type: MoveTargetType.Unit, unit: foe } as const;
    const bare = ribbon.checkMovePower(Moves.Pound, target);

    ribbon.addAbility(Abilities.Pixilate);

    expect(ribbon.checkMoveType(Moves.Pound, target)).toBe(Types.Fairy);
    expect(ribbon.checkMovePower(Moves.Pound, target)).toBeCloseTo((bare ?? 0) * 1.2, 1);
  });
});

describe('the auras', () => {
  it('lays its type over the whole field, and a break turns it round', () => {
    const { battle, teamA, teamB } = createBattle();
    const stag = createUnit(battle, teamA, [Types.Fairy]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    stag.enter();
    foe.enter();

    const whole = foe.checkStat(Stats.HP, 0);
    const bare = dealDamage(stag, foe, Moves.Moonblast, 40, Types.Fairy, MoveCategories.Special);

    foe.setHealth(whole);
    stag.addAbility(Abilities.FairyAura);

    const aura = dealDamage(stag, foe, Moves.Moonblast, 40, Types.Fairy, MoveCategories.Special);

    expect(aura).toBeCloseTo(bare * (4 / 3), 0);

    // A break on the field turns the aura into a weakness
    foe.setHealth(whole);
    foe.addAbility(Abilities.AuraBreak);

    expect(
      dealDamage(stag, foe, Moves.Moonblast, 40, Types.Fairy, MoveCategories.Special),
    ).toBeCloseTo(bare * (3 / 4), 0);
  });
});

describe('Power Construct', () => {
  it('gathers the rest of the cells at half health', () => {
    const { battle, teamA, teamB } = createBattle();
    const swarm = createUnit(battle, teamA, [Types.Dragon, Types.Ground]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    swarm.setSpecies(Species.Zygarde);
    swarm.addAbility(Abilities.PowerConstruct);
    swarm.enter();
    foe.enter();

    const whole = swarm.checkStat(Stats.HP, 0);

    foe.damage({ type: EffectType.None }, swarm, whole / 4, 0);

    expect(swarm.species).toBe(Species.Zygarde);

    foe.damage({ type: EffectType.None }, swarm, whole / 3, 0);

    expect(swarm.species).toBe(Species.ZygardeComplete);
  });
});

describe('Triage', () => {
  it('sends a heal out ahead of everything else', () => {
    const { battle, teamA, teamB } = createBattle();
    const stag = createUnit(battle, teamA, [Types.Fairy]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    stag.enter();
    foe.enter();

    const target = { type: MoveTargetType.None } as const;
    const bare = stag.checkMovePriority(Moves.Recover, target);
    const swung = stag.checkMovePriority(Moves.Moonblast, target);

    stag.addAbility(Abilities.Triage);

    expect(stag.checkMovePriority(Moves.Recover, target)).toBe(bare + 3);
    // Everything else is thrown at the speed it always was
    expect(stag.checkMovePriority(Moves.Moonblast, target)).toBe(swung);
  });
});

describe('Earth Eater', () => {
  it('eats a Ground move rather than taking it', () => {
    const { battle, teamA, teamB } = createBattle();
    const swarm = createUnit(battle, teamA, [Types.Dragon, Types.Ground]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    swarm.addAbility(Abilities.EarthEater);
    swarm.enter();
    foe.enter();

    const whole = swarm.checkStat(Stats.HP, 0);

    swarm.setHealth(whole / 2);
    foe.addMove(Moves.Earthquake);
    foe.cast(Moves.Earthquake, { type: MoveTargetType.Unit, unit: swarm });
    battle.tick(turns(4));

    expect(swarm.health).toBeGreaterThan(whole / 2);
  });
});

describe('Steam Engine', () => {
  it('jumps when fire or water lands on it, and not otherwise', () => {
    const { battle, teamA, teamB } = createBattle();
    const boiler = createUnit(battle, teamA, [Types.Fire, Types.Water]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    boiler.addAbility(Abilities.SteamEngine);
    boiler.enter();
    foe.enter();

    dealDamage(foe, boiler, Moves.Pound, 10, Types.Normal, MoveCategories.Physical);

    expect(boiler.stages[Stages.Speed]).toBe(0);

    dealDamage(foe, boiler, Moves.Scald, 10, Types.Water, MoveCategories.Special);

    expect(boiler.stages[Stages.Speed]).toBe(6);
  });
});

describe('Aerilate', () => {
  it('throws its Normal moves as Flying, and pays a fifth again for them', () => {
    const { battle, teamA, teamB } = createBattle();
    const beetle = createUnit(battle, teamA, [Types.Bug, Types.Flying]);
    const foe = createUnit(battle, teamB, [Types.Grass]);

    pinRandom(battle, 1);
    beetle.enter();
    foe.enter();

    const at = { type: MoveTargetType.Unit, unit: foe } as const;
    const plain = beetle.checkMovePower(Moves.Tackle, at);

    beetle.addAbility(Abilities.Aerilate);

    expect(beetle.checkMoveType(Moves.Tackle, at)).toBe(Types.Flying);
    expect(beetle.checkMovePower(Moves.Tackle, at)).toBeCloseTo((plain ?? 0) * 1.2, 5);
  });
});

describe('Parental Bond', () => {
  it('lands a move cast at one target twice, the second a quarter as hard', () => {
    const { battle, teamA, teamB } = createBattle();
    const parent = createUnit(battle, teamA, [Types.Normal]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    parent.addAbility(Abilities.ParentalBond);
    parent.enter();
    foe.enter();

    const powers: number[] = [];

    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === parent && event.success) {
        powers.push(event.value);
      }
    });

    parent.attack(foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    // The child's blow resolves inside the parent's, so it is logged first
    expect(powers).toHaveLength(2);
    expect(powers).toContain(40);
    expect(powers).toContain(10);
  });

  it('leaves a move that already strikes several times alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const parent = createUnit(battle, teamA, [Types.Normal]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    parent.addAbility(Abilities.ParentalBond);
    parent.enter();
    foe.enter();

    let landed = 0;

    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === parent && event.success) {
        landed += 1;
      }
    });

    parent.attack(foe, Moves.DoubleSlap, 15, Types.Normal, MoveCategories.Physical, 0);

    expect(landed).toBe(1);
  });
});

describe('Delta Stream', () => {
  it('raises strong winds on entry, and they hold against any other sky', () => {
    const { battle, teamA, teamB } = createBattle();
    const dragon = createUnit(battle, teamA, [Types.Dragon, Types.Flying]);
    const foe = createUnit(battle, teamB);

    dragon.addAbility(Abilities.DeltaStream);
    foe.addAbility(Abilities.Drought);
    dragon.enter();
    foe.enter();

    expect(dragon.checkWeather()).toBe(Weathers.StrongWinds);
  });

  it('takes the winds away with it when it faints', () => {
    const { battle, teamA, teamB } = createBattle();
    const dragon = createUnit(battle, teamA, [Types.Dragon, Types.Flying]);
    const foe = createUnit(battle, teamB);

    dragon.addAbility(Abilities.DeltaStream);
    dragon.enter();
    foe.enter();
    foe.damage({ type: EffectType.None }, dragon, dragon.health, 0);

    expect(dragon.alive).toBe(false);

    expect(foe.checkWeather()).toBe(Weathers.None);
  });
});
