import { describe, expect, it } from 'vitest';
import {
  CHARGE_SCALE,
  PARADOX_SCALE,
  PARADOX_SPEED_SCALE,
  PULSE_SCALE,
  RUIN_SCALE,
} from '../../../src/battle/abilities/__create';
import {
  COMMANDER_STAGES,
  HOSPITALITY_FRACTION,
  ROCKY_PAYLOAD_SCALE,
  SUPREME_OVERLORD_STEP,
  WELL_BAKED_STAGES,
} from '../../../src/battle/abilities/gen-9';
import { EffectType } from '../../../src/battle/events';
import { MOVE_DELAY } from '../../../src/battle/mechanics/move';
import { toxicLayersUnder } from '../../../src/battle/moves/toxic-spikes';
import type Unit from '../../../src/battle/unit';
import { unitTarget } from '../../../src/battle/unit-checks';
import { Stages, Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Species } from '../../../src/data/ids/species';
import { Statuses, TeamStatuses, Terrains, Weathers } from '../../../src/data/ids/status';
import {
  findSpeciesData,
  getSpeciesData,
  registerSpecies,
} from '../../../src/data/species/__create';
import { getItemData, registerItem } from '../../../src/data/items/__create';
import { createBattle, createUnit, pinRandom } from '../harness';
import { NONE_CAUSE, act, dealDamage } from './signature/helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 80, Types.Normal, MoveCategories.Physical];
const SWIFT: Blow = [Moves.Swift, 80, Types.Normal, MoveCategories.Special];
const GUST: Blow = [Moves.Gust, 40, Types.Flying, MoveCategories.Special];
const FIRE_PUNCH: Blow = [Moves.FirePunch, 75, Types.Fire, MoveCategories.Physical];
const SHADOW_BALL: Blow = [Moves.ShadowBall, 80, Types.Ghost, MoveCategories.Special];

/** A shape whose data is not written yet, stood up on a borrowed record */
function ensureSpecies(species: Species): void {
  if (findSpeciesData(species) == null) {
    registerSpecies(species, getSpeciesData(Species.Wishiwashi));
  }
}

/** An item whose data is not written yet, stood up on a borrowed record */
function ensureItem(item: Items): void {
  try {
    getItemData(item);
  } catch {
    registerItem(item, { ...getItemData(Items.Leftovers) });
  }
}

function full(unit: Unit): void {
  unit.setHealth(unit.checkStat(Stats.HP, 0));
}

describe('Lingering Aroma', () => {
  it('passes itself to whoever touches it, in place of one of theirs', () => {
    const { battle, teamA, teamB } = createBattle();
    const pig = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0);
    pig.addAbility(Abilities.LingeringAroma);
    foe.addAbility(Abilities.Blaze);
    dealDamage(foe, pig, ...TACKLE);

    expect(foe.hasAbility(Abilities.LingeringAroma)).toBe(true);
    expect(foe.hasAbility(Abilities.Blaze)).toBe(false);
  });

  it('leaves a move that never touched it alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const pig = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pig.addAbility(Abilities.LingeringAroma);
    foe.addAbility(Abilities.Blaze);
    dealDamage(foe, pig, ...SWIFT);

    expect(foe.hasAbility(Abilities.Blaze)).toBe(true);
  });
});

describe('Well-Baked Body', () => {
  it('swallows a Fire move for 2 stages of Defense', () => {
    const { battle, teamA, teamB } = createBattle();
    const dough = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = dough.checkStat(Stats.HP, 0);

    pinRandom(battle, 0);
    dough.addAbility(Abilities.WellBakedBody);
    foe.triggerMoveTarget(Moves.Ember, unitTarget(dough), 0);

    expect(dough.health).toBe(max);
    expect(dough.stages[Stages.Defense]).toBe(WELL_BAKED_STAGES);
  });
});

describe('Seed Sower', () => {
  it('lays Grassy Terrain when a blow lands on it', () => {
    const { battle, teamA, teamB } = createBattle();
    const olive = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    olive.addAbility(Abilities.SeedSower);
    dealDamage(foe, olive, ...TACKLE);
    battle.tick(MOVE_DELAY);

    expect(olive.checkTerrain()).toBe(Terrains.Grassy);
  });
});

describe('Thermal Exchange', () => {
  it('takes Attack from a Fire move and cannot be burned', () => {
    const { battle, teamA, teamB } = createBattle();
    const dragon = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    dragon.addAbility(Abilities.ThermalExchange);
    dealDamage(foe, dragon, ...FIRE_PUNCH);
    dragon.addStatus(Statuses.Burned, NONE_CAUSE);

    expect(dragon.stages[Stages.Attack]).toBe(1);
    expect(dragon.status[Statuses.Burned]).toBeUndefined();
  });
});

describe('Anger Shell', () => {
  it('trades its defences for offence as a blow takes it past 1/2 HP', () => {
    const { battle, teamA, teamB } = createBattle();
    const crab = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    crab.addAbility(Abilities.AngerShell);
    crab.setHealth(crab.checkStat(Stats.HP, 0) * 0.6);
    dealDamage(foe, crab, ...TACKLE);

    expect(crab.stages[Stages.Attack]).toBe(1);
    expect(crab.stages[Stages.SpecialAttack]).toBe(1);
    expect(crab.stages[Stages.Speed]).toBe(1);
    expect(crab.stages[Stages.Defense]).toBe(-1);
    expect(crab.stages[Stages.SpecialDefense]).toBe(-1);

    // Already under the line: a second blow pays nothing
    dealDamage(foe, crab, ...TACKLE);
    expect(crab.stages[Stages.Attack]).toBe(1);
  });
});

describe('Purifying Salt', () => {
  it('keeps every status off and halves Ghost blows', () => {
    const { battle, teamA, teamB } = createBattle();
    const salt = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    salt.addAbility(Abilities.PurifyingSalt);
    salt.addStatus(Statuses.Paralyzed, NONE_CAUSE);
    salt.addStatus(Statuses.Drowsy, NONE_CAUSE);

    expect(salt.status[Statuses.Paralyzed]).toBeUndefined();
    expect(salt.status[Statuses.Drowsy]).toBeUndefined();
    // Halved on the attacker's stat, so a little over half the damage
    const ghostly = dealDamage(foe, plain, ...SHADOW_BALL);
    const salted = dealDamage(foe, salt, ...SHADOW_BALL);

    expect(salted).toBeGreaterThan(ghostly * 0.4);
    expect(salted).toBeLessThan(ghostly * 0.6);
  });
});

describe('Electromorphosis and Wind Power', () => {
  it('a landed blow charges the next Electric move, which spends it', () => {
    const { battle, teamA, teamB } = createBattle();
    const bulb = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    pinRandom(battle, 1);
    bulb.addAbility(Abilities.Electromorphosis);

    const base = bulb.checkMovePower(Moves.Thunderbolt, at) ?? 0;

    dealDamage(foe, bulb, ...TACKLE);
    expect(bulb.checkMovePower(Moves.Thunderbolt, at)).toBe(base * CHARGE_SCALE);

    bulb.triggerMove(Moves.Thunderbolt, at, 0);
    expect(bulb.checkMovePower(Moves.Thunderbolt, at)).toBe(base);
  });

  it('Wind Power only answers a wind move', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    pinRandom(battle, 1);
    bird.addAbility(Abilities.WindPower);

    const base = bird.checkMovePower(Moves.Thunderbolt, at) ?? 0;

    dealDamage(foe, bird, ...TACKLE);
    expect(bird.checkMovePower(Moves.Thunderbolt, at)).toBe(base);

    dealDamage(foe, bird, ...GUST);
    expect(bird.checkMovePower(Moves.Thunderbolt, at)).toBe(base * CHARGE_SCALE);
  });
});

describe('Guard Dog', () => {
  it('turns Intimidate into an Attack rise and cannot be roared away', () => {
    const { battle, teamA, teamB } = createBattle();
    const dog = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    dog.addAbility(Abilities.GuardDog);
    foe.addAbility(Abilities.Intimidate);
    foe.enter();

    expect(dog.stages[Stages.Attack]).toBe(1);
    expect(foe.checkMoveImmunity(Moves.Roar, unitTarget(dog), Types.Normal)).toBe(true);
  });
});

describe('Rocky Payload', () => {
  it('lifts its Rock moves 1.5x', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);
    const rock = bird.checkMovePower(Moves.RockSlide, at) ?? 0;
    const tackle = bird.checkMovePower(Moves.Tackle, at);

    bird.addAbility(Abilities.RockyPayload);

    expect(bird.checkMovePower(Moves.RockSlide, at)).toBe(rock * ROCKY_PAYLOAD_SCALE);
    expect(bird.checkMovePower(Moves.Tackle, at)).toBe(tackle);
  });
});

describe('Zero to Hero', () => {
  it('comes back from the bench as the hero', () => {
    ensureSpecies(Species.PalafinHero);

    const { battle, teamA } = createBattle();
    const dolphin = createUnit(battle, teamA);

    dolphin.species = Species.Palafin;
    dolphin.addAbility(Abilities.ZeroToHero);
    dolphin.enter();
    expect(dolphin.species).toBe(Species.Palafin);

    dolphin.leave();
    dolphin.enter();
    expect(dolphin.species).toBe(Species.PalafinHero);
  });
});

describe('Commander', () => {
  it('climbs into a Dondozo, which gains 2 stages of everything, and hides', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const whale = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    fish.species = Species.TatsugiriDroopy;
    whale.species = Species.Dondozo;
    fish.addMove(Moves.Tackle);
    fish.addAbility(Abilities.Commander);

    fish.enter();

    for (const stage of [
      Stages.Attack,
      Stages.Defense,
      Stages.SpecialAttack,
      Stages.SpecialDefense,
      Stages.Speed,
    ]) {
      expect(whale.stages[stage]).toBe(COMMANDER_STAGES);
    }
    expect(fish.checkCanCast(Moves.Tackle, unitTarget(foe))).toBe(false);
    expect(foe.checkMoveImmunity(Moves.Tackle, unitTarget(fish), Types.Normal)).toBe(true);

    // Its mount falls, and it climbs back out
    whale.faint(foe);
    expect(fish.checkCanCast(Moves.Tackle, unitTarget(foe))).toBe(true);
    expect(foe.checkMoveImmunity(Moves.Tackle, unitTarget(fish), Types.Normal)).toBe(false);
  });

  it('does nothing without a Dondozo beside it', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    fish.species = Species.Tatsugiri;
    fish.addAbility(Abilities.Commander);
    fish.enter();

    expect(foe.checkMoveImmunity(Moves.Tackle, unitTarget(fish), Types.Normal)).toBe(false);
  });
});

describe('Protosynthesis and Quark Drive', () => {
  it('lifts the highest stat in sun, and lets it go when the sun does', () => {
    const { battle, teamA } = createBattle();
    const tusk = createUnit(battle, teamA);

    tusk.setStat(StatsKind.Base, Stats.Attack, 150);
    tusk.addAbility(Abilities.Protosynthesis);

    const attack = tusk.checkStat(Stats.Attack, 0);
    const defense = tusk.checkStat(Stats.Defense, 0);

    battle.setWeather(Weathers.Sunny);
    expect(tusk.checkStat(Stats.Attack, 0)).toBeCloseTo(attack * PARADOX_SCALE, 5);
    expect(tusk.checkStat(Stats.Defense, 0)).toBe(defense);

    battle.setWeather(Weathers.None);
    expect(tusk.checkStat(Stats.Attack, 0)).toBe(attack);
  });

  it('lifts Speed 1.5x on Electric Terrain', () => {
    const { battle, teamA } = createBattle();
    const treads = createUnit(battle, teamA);

    treads.setStat(StatsKind.Base, Stats.Speed, 150);
    treads.addAbility(Abilities.QuarkDrive);

    const speed = treads.checkStat(Stats.Speed, 0);

    battle.setTerrain(Terrains.Electric);
    expect(treads.checkStat(Stats.Speed, 0)).toBeCloseTo(speed * PARADOX_SPEED_SCALE, 5);
  });

  it('drinks a Booster Energy when nothing else lifts it', () => {
    ensureItem(Items.BoosterEnergy);

    const { battle, teamA } = createBattle();
    const tusk = createUnit(battle, teamA);

    tusk.setStat(StatsKind.Base, Stats.Attack, 150);
    tusk.addAbility(Abilities.Protosynthesis);

    const attack = tusk.checkStat(Stats.Attack, 0);

    tusk.addItem(Items.BoosterEnergy);

    expect(tusk.items[Items.BoosterEnergy]).toBeUndefined();
    expect(tusk.checkStat(Stats.Attack, 0)).toBeCloseTo(attack * PARADOX_SCALE, 5);
  });
});

describe('Good as Gold', () => {
  it('turns away status moves from anybody else', () => {
    const { battle, teamA, teamB } = createBattle();
    const coin = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0);
    coin.addAbility(Abilities.GoodAsGold);
    foe.triggerMove(Moves.Toxic, unitTarget(coin), 0);
    foe.triggerMove(Moves.Toxic, unitTarget(plain), 0);
    battle.tick(MOVE_DELAY);

    expect(coin.status[Statuses.BadlyPoisoned]).toBeUndefined();
    expect(plain.status[Statuses.BadlyPoisoned]).toBeDefined();
  });
});

describe('the Ruins', () => {
  const RUINS: [Abilities, Stats][] = [
    [Abilities.TabletsOfRuin, Stats.Attack],
    [Abilities.SwordOfRuin, Stats.Defense],
    [Abilities.VesselOfRuin, Stats.SpecialAttack],
    [Abilities.BeadsOfRuin, Stats.SpecialDefense],
  ];

  it.each(RUINS)('ability %i cuts stat %i of everybody else', (ability, stat) => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const before = foe.checkStat(stat, 0);

    holder.addAbility(ability);

    expect(foe.checkStat(stat, 0)).toBeCloseTo(before * RUIN_SCALE, 5);
    expect(mate.checkStat(stat, 0)).toBeCloseTo(before * RUIN_SCALE, 5);
    expect(holder.checkStat(stat, 0)).toBe(before);
  });
});

describe('Orichalcum Pulse and Hadron Engine', () => {
  it('Orichalcum Pulse calls up the sun and hits harder under it', () => {
    const { battle, teamA } = createBattle();
    const lizard = createUnit(battle, teamA);
    const attack = lizard.checkStat(Stats.Attack, 0);

    lizard.addAbility(Abilities.OrichalcumPulse);
    lizard.enter();
    battle.tick(MOVE_DELAY);

    expect(lizard.checkWeather()).toBe(Weathers.Sunny);
    expect(lizard.checkStat(Stats.Attack, 0)).toBeCloseTo(attack * PULSE_SCALE, 5);
  });

  it('Hadron Engine lays Electric Terrain and hits harder on it', () => {
    const { battle, teamA } = createBattle();
    const lizard = createUnit(battle, teamA);
    const special = lizard.checkStat(Stats.SpecialAttack, 0);

    lizard.addAbility(Abilities.HadronEngine);
    lizard.enter();
    battle.tick(MOVE_DELAY);

    expect(lizard.checkTerrain()).toBe(Terrains.Electric);
    expect(lizard.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(special * PULSE_SCALE, 5);
  });
});

describe('Opportunist', () => {
  it('copies a foe raising a stat', () => {
    const { battle, teamA, teamB } = createBattle();
    const bug = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bug.addAbility(Abilities.Opportunist);
    foe.addStage(Stages.Attack, 2, NONE_CAUSE);
    mate.addStage(Stages.Speed, 1, NONE_CAUSE);

    expect(bug.stages[Stages.Attack]).toBe(2);
    expect(bug.stages[Stages.Speed]).toBe(0);
  });
});

describe('Cud Chew', () => {
  it('eats a berry again the next time it acts', () => {
    const { battle, teamA } = createBattle();
    const cow = createUnit(battle, teamA);
    const max = cow.checkStat(Stats.HP, 0);

    cow.addAbility(Abilities.CudChew);
    cow.addItem(Items.SitrusBerry);
    cow.setHealth(max * 0.4);

    const eaten = cow.health;

    expect(eaten).toBeGreaterThan(max * 0.4);
    expect(cow.items[Items.SitrusBerry]).toBeUndefined();

    act(battle, cow);
    expect(cow.health).toBeGreaterThan(eaten);

    // Only once
    const chewed = cow.health;

    act(battle, cow);
    expect(cow.health).toBe(chewed);
  });
});

describe('Supreme Overlord', () => {
  it('hits harder for each fallen teammate', () => {
    const { battle, teamA, teamB } = createBattle();
    const king = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    king.addAbility(Abilities.SupremeOverlord);

    const power = king.checkMovePower(Moves.Tackle, at) ?? 0;

    mate.faint(foe);
    expect(king.checkMovePower(Moves.Tackle, at)).toBeCloseTo(
      power * (1 + SUPREME_OVERLORD_STEP),
      5,
    );
  });
});

describe('Costar', () => {
  it('copies a teammate’s stages on arrival', () => {
    const { battle, teamA } = createBattle();
    const flamingo = createUnit(battle, teamA);
    const star = createUnit(battle, teamA);

    star.addStage(Stages.Attack, 2, NONE_CAUSE);
    star.addStage(Stages.Speed, -1, NONE_CAUSE);
    flamingo.addAbility(Abilities.Costar);
    flamingo.enter();

    expect(flamingo.stages[Stages.Attack]).toBe(2);
    expect(flamingo.stages[Stages.Speed]).toBe(-1);
  });
});

describe('Toxic Debris', () => {
  it('a physical blow lays Toxic Spikes under the attacker', () => {
    const { battle, teamA, teamB } = createBattle();
    const rock = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    rock.addAbility(Abilities.ToxicDebris);
    dealDamage(foe, rock, ...SWIFT);
    expect(toxicLayersUnder(teamB)).toBe(0);

    dealDamage(foe, rock, ...TACKLE);
    expect(toxicLayersUnder(teamB)).toBe(1);
    expect(teamB.status[TeamStatuses.ToxicSpikes]).toBeDefined();
  });
});

describe('Armor Tail', () => {
  it('turns away moves that cut ahead from its whole side', () => {
    const { battle, teamA, teamB } = createBattle();
    const giraffe = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    giraffe.addAbility(Abilities.ArmorTail);

    expect(foe.checkMoveImmunity(Moves.QuickAttack, unitTarget(mate), Types.Normal)).toBe(true);
    expect(foe.checkMoveImmunity(Moves.Tackle, unitTarget(mate), Types.Normal)).toBe(false);
  });
});

describe('Mycelium Might', () => {
  it('winds its status moves up slower and goes through abilities', () => {
    const { battle, teamA, teamB } = createBattle();
    const shroom = createUnit(battle, teamA);
    const coin = createUnit(battle, teamB);
    const at = unitTarget(coin);
    const priority = shroom.checkMovePriority(Moves.Toxic, at);
    const tackle = shroom.checkMovePriority(Moves.Tackle, at);

    pinRandom(battle, 0);
    shroom.addAbility(Abilities.MyceliumMight);
    coin.addAbility(Abilities.GoodAsGold);

    expect(shroom.checkMovePriority(Moves.Toxic, at)).toBe(priority - 1);
    expect(shroom.checkMovePriority(Moves.Tackle, at)).toBe(tackle);

    shroom.triggerMove(Moves.Toxic, at, 0);
    battle.tick(MOVE_DELAY);
    expect(coin.status[Statuses.BadlyPoisoned]).toBeDefined();
  });
});

describe("Mind's Eye", () => {
  it('reaches Ghosts with Normal moves and keeps its aim', () => {
    const { battle, teamA, teamB } = createBattle();
    const bear = createUnit(battle, teamA);
    const ghost = createUnit(battle, teamB, [Types.Ghost]);

    expect(bear.checkMoveImmunity(Moves.Tackle, unitTarget(ghost), Types.Normal)).toBe(true);

    bear.addAbility(Abilities.MindsEye);
    bear.addStage(Stages.Accuracy, -1, {
      type: EffectType.Move,
      move: Moves.SandAttack,
      unit: ghost,
    });

    expect(bear.checkMoveImmunity(Moves.Tackle, unitTarget(ghost), Types.Normal)).toBe(false);
    expect(bear.stages[Stages.Accuracy]).toBe(0);
  });
});

describe('Supersweet Syrup', () => {
  it('costs its foes evasion the first time it arrives, and only then', () => {
    const { battle, teamA, teamB } = createBattle();
    const apple = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    apple.addAbility(Abilities.SupersweetSyrup);
    apple.enter();
    expect(foe.stages[Stages.Evasion]).toBe(-1);

    apple.leave();
    apple.enter();
    expect(foe.stages[Stages.Evasion]).toBe(-1);
  });
});

describe('Hospitality', () => {
  it('pours its most hurt teammate 1/4 of its HP on arrival', () => {
    const { battle, teamA } = createBattle();
    const pot = createUnit(battle, teamA);
    const guest = createUnit(battle, teamA);
    const scratched = createUnit(battle, teamA);
    const max = guest.checkStat(Stats.HP, 0);

    guest.setHealth(max / 4);
    scratched.setHealth(max * 0.9);
    pot.addAbility(Abilities.Hospitality);
    pot.enter();

    expect(guest.health).toBeCloseTo(max / 4 + max * HOSPITALITY_FRACTION, 5);
    expect(scratched.health).toBeCloseTo(max * 0.9, 5);
  });
});

describe('Toxic Chain', () => {
  it('may badly poison whatever it hits', () => {
    const { battle, teamA, teamB } = createBattle();
    const dog = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0);
    dog.addAbility(Abilities.ToxicChain);
    dealDamage(dog, foe, ...SWIFT);

    expect(foe.status[Statuses.BadlyPoisoned]).toBeDefined();
  });

  it('misses its roll at 30%', () => {
    const { battle, teamA, teamB } = createBattle();
    const dog = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0.3);
    dog.addAbility(Abilities.ToxicChain);
    dealDamage(dog, foe, ...SWIFT);

    expect(foe.status[Statuses.BadlyPoisoned]).toBeUndefined();
  });
});

describe('Embody Aspect', () => {
  it('raises the stat its mask names, the first time only', () => {
    const { battle, teamA } = createBattle();
    const ogre = createUnit(battle, teamA);

    ogre.species = Species.OgerponHearthflame;
    ogre.addAbility(Abilities.EmbodyAspect);
    ogre.enter();
    expect(ogre.stages[Stages.Attack]).toBe(1);

    ogre.leave();
    ogre.enter();
    expect(ogre.stages[Stages.Attack]).toBe(0);
  });

  it('raises Speed in the Teal Mask', () => {
    const { battle, teamA } = createBattle();
    const ogre = createUnit(battle, teamA);

    ogre.species = Species.Ogerpon;
    ogre.addAbility(Abilities.EmbodyAspect);
    ogre.enter();

    expect(ogre.stages[Stages.Speed]).toBe(1);
  });
});

describe('Tera Shift', () => {
  it('takes the Terastal shape as it arrives', () => {
    ensureSpecies(Species.TerapagosTerastal);

    const { battle, teamA } = createBattle();
    const turtle = createUnit(battle, teamA);

    turtle.species = Species.Terapagos;
    turtle.addAbility(Abilities.TeraShift);
    turtle.enter();

    expect(turtle.species).toBe(Species.TerapagosTerastal);
  });
});

describe('Tera Shell', () => {
  it('at full HP every blow lands not very effective', () => {
    const { battle, teamA, teamB } = createBattle();
    const shell = createUnit(battle, teamA, [Types.Grass]);
    const plain = createUnit(battle, teamA, [Types.Grass]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    shell.addAbility(Abilities.TeraShell);

    const weak = dealDamage(foe, plain, ...FIRE_PUNCH);

    expect(dealDamage(foe, shell, ...FIRE_PUNCH)).toBeCloseTo(weak / 4, 0);

    // No longer at full HP, so the next blow lands as it would
    full(plain);
    expect(dealDamage(foe, shell, ...FIRE_PUNCH)).toBeCloseTo(
      dealDamage(foe, plain, ...FIRE_PUNCH),
      5,
    );
  });
});

describe('Teraform Zero', () => {
  it('wipes the weather and the terrain as it arrives', () => {
    const { battle, teamA } = createBattle();
    const turtle = createUnit(battle, teamA);

    battle.setWeather(Weathers.Rain);
    battle.setTerrain(Terrains.Grassy);
    turtle.addAbility(Abilities.TeraformZero);
    turtle.enter();

    expect(battle.weather.current).toBe(Weathers.None);
    expect(battle.terrain.current).toBe(Terrains.None);
  });

  it('leaves a primal sky standing', () => {
    const { battle, teamA } = createBattle();
    const turtle = createUnit(battle, teamA);

    battle.setWeather(Weathers.HeavyRain);
    turtle.addAbility(Abilities.TeraformZero);
    turtle.enter();

    expect(battle.weather.current).toBe(Weathers.HeavyRain);
  });
});

describe('Poison Puppeteer', () => {
  it('confuses whatever it poisons', () => {
    const { battle, teamA, teamB } = createBattle();
    const peach = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    peach.addAbility(Abilities.PoisonPuppeteer);
    foe.addStatus(Statuses.Poisoned, { type: EffectType.Move, move: Moves.PoisonGas, unit: peach });

    expect(foe.status[Statuses.Confused]).toBeDefined();
  });
});
