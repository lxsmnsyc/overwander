import { describe, expect, it } from 'vitest';
import { EffectType, MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import {
  BAND_FACTOR,
  BIG_ROOT_FACTOR,
  BLACK_SLUDGE_SHARE,
  BRIGHT_POWDER_EVASION,
  EXPERT_BELT_FACTOR,
  LEFTOVERS_SHARE,
  METRONOME_LIMIT,
  METRONOME_STEP,
  QUICK_CLAW_PRIORITY,
  ROCKY_HELMET_SHARE,
  SCOPE_LENS_CRITICAL_STAGES,
  SHELL_BELL_SHARE,
  SPECIES_LENS_CRITICAL_STAGES,
  WIDE_LENS_ACCURACY,
} from '../../src/battle/items/gear';
import { POLICY_STAGES, REACTION_STAGES } from '../../src/battle/items/one-shots';
import { Stages, Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { Items } from '../../src/data/ids/items';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Genders, Species } from '../../src/data/ids/species';
import { Statuses, Weathers } from '../../src/data/ids/status';
import { getMoveData } from '../../src/data/moves';
import { createBattle, createUnit, pinRandom } from './harness';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

/**
 * MoveAttackFlags.Critical: a blow only rolls for a critical when the
 * move it came from allows one
 */
const CAN_CRIT = 2;

function moveCause(
  unit: Unit,
  move = Moves.Tackle,
): { readonly type: EffectType.Move; readonly move: Moves; readonly unit: Unit } {
  return { type: EffectType.Move, move, unit } as const;
}

/**
 * One whole move, start to finish: the residual gear is paid out on
 * the cast rather than on the clock, and a move cannot be reached for
 * again until its cooldown is out of the way
 */
function castOnce(unit: Unit, target: Unit, move = Moves.Tackle): void {
  unit.cast(move, unitTarget(target));
  unit.finishCast();
  unit.finishCooldown(move);
}

describe('residual gear', () => {
  it('hands a share of the holder back for every move it finishes', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const maxHealth = holder.checkStat(Stats.HP, 0);
    const share = Math.floor(maxHealth * LEFTOVERS_SHARE);

    holder.addMove(Moves.Tackle);
    bare.addMove(Moves.Tackle);
    holder.addItem(Items.Leftovers);
    holder.setHealth(maxHealth / 2);
    bare.setHealth(maxHealth / 2);

    // Standing about is worth nothing: a clock does not pay this out
    battle.tick(5000);
    expect(holder.health).toBe(maxHealth / 2);

    castOnce(holder, defender);
    castOnce(bare, defender);

    expect(holder.health).toBe(maxHealth / 2 + share);
    // Carrying nothing is worth nothing either
    expect(bare.health).toBe(maxHealth / 2);

    castOnce(holder, defender);
    expect(holder.health).toBe(maxHealth / 2 + share * 2);
  });

  it('leaves a holder at full health alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const maxHealth = holder.checkStat(Stats.HP, 0);

    holder.addMove(Moves.Tackle);
    holder.addItem(Items.Leftovers);
    castOnce(holder, defender);

    expect(holder.health).toBe(maxHealth);
  });

  it('makes a Black Sludge food for Poison types and poison for the rest', () => {
    const { battle, teamA, teamB } = createBattle();
    const poison = createUnit(battle, teamA, [Types.Poison]);
    const other = createUnit(battle, teamA, [Types.Normal]);
    const defender = createUnit(battle, teamB);
    const maxHealth = poison.checkStat(Stats.HP, 0);

    poison.addMove(Moves.Tackle);
    other.addMove(Moves.Tackle);
    poison.addItem(Items.BlackSludge);
    other.addItem(Items.BlackSludge);
    poison.setHealth(maxHealth / 2);

    castOnce(poison, defender);
    castOnce(other, defender);

    expect(poison.health).toBe(maxHealth / 2 + Math.floor(maxHealth * LEFTOVERS_SHARE));
    expect(other.health).toBe(maxHealth - Math.floor(maxHealth * BLACK_SLUDGE_SHARE));
  });
});

describe('gear that answers a blow', () => {
  it('gives a Shell Bell holder a share of what it just did', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const maxHealth = attacker.checkStat(Stats.HP, 0);

    attacker.addItem(Items.ShellBell);
    attacker.setHealth(maxHealth / 2);

    const before = defender.health;

    attacker.attack(defender, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    const dealt = before - defender.health;

    expect(dealt).toBeGreaterThan(0);
    expect(attacker.health).toBe(maxHealth / 2 + Math.floor(dealt * SHELL_BELL_SHARE));
    // Never spent: a bell rings for every blow its holder lands
    expect(attacker.items[Items.ShellBell]).toBe(true);
  });

  it('charges whoever puts a hand on a Rocky Helmet', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const attackerHealth = attacker.checkStat(Stats.HP, 0);

    holder.addItem(Items.RockyHelmet);

    // Tackle makes contact; Ember does not
    attacker.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    expect(attacker.health).toBe(attackerHealth);

    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(attacker.health).toBe(attackerHealth - Math.floor(attackerHealth * ROCKY_HELMET_SHARE));
    expect(holder.items[Items.RockyHelmet]).toBe(true);
  });

  it('leaves a Focus Band holder standing one time in ten', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    holder.addItem(Items.FocusBand);
    pinRandom(battle, 0); // the roll passes

    holder.damage(moveCause(attacker), holder, holder.checkStat(Stats.HP, 0) * 2, 0);

    expect(holder.alive).toBe(true);
    expect(holder.health).toBe(1);
    // Not spent doing it, unlike a Sash
    expect(holder.items[Items.FocusBand]).toBe(true);

    pinRandom(battle, 0.99); // and this one does not
    holder.damage(moveCause(attacker), holder, holder.checkStat(Stats.HP, 0) * 2, 0);

    expect(holder.alive).toBe(false);
  });
});

describe('gear that lifts a number', () => {
  it('lifts the half of the game each band belongs to', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const target = unitTarget(createUnit(battle, teamB));
    const tackle = getMoveData(Moves.Tackle).power ?? 0;
    const ember = getMoveData(Moves.Ember).power ?? 0;

    attacker.addItem(Items.MuscleBand);

    expect(attacker.checkMovePower(Moves.Tackle, target)).toBeCloseTo(tackle * BAND_FACTOR, 5);
    expect(attacker.checkMovePower(Moves.Ember, target)).toBe(ember);

    attacker.removeItem(Items.MuscleBand, { type: EffectType.None });
    attacker.addItem(Items.WiseGlasses);

    expect(attacker.checkMovePower(Moves.Tackle, target)).toBe(tackle);
    expect(attacker.checkMovePower(Moves.Ember, target)).toBeCloseTo(ember * BAND_FACTOR, 5);
  });

  it('pays an Expert Belt only on a blow that was landing hard', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const grass = createUnit(battle, teamB, [Types.Grass]);
    const plain = createUnit(battle, teamB, [Types.Normal]);

    pinRandom(battle, 1); // no criticals, damage range at its top

    const bareGrass = grass.health;
    const barePlain = plain.health;

    attacker.attack(grass, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    attacker.attack(plain, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    const effective = bareGrass - grass.health;
    const neutral = barePlain - plain.health;

    const beltGrass = createUnit(battle, teamB, [Types.Grass]);
    const beltPlain = createUnit(battle, teamB, [Types.Normal]);

    attacker.addItem(Items.ExpertBelt);
    attacker.attack(beltGrass, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    attacker.attack(beltPlain, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(beltGrass.checkStat(Stats.HP, 0) - beltGrass.health).toBeCloseTo(
      effective * EXPERT_BELT_FACTOR,
      0,
    );
    // Nothing at all against something it has no answer for
    expect(beltPlain.checkStat(Stats.HP, 0) - beltPlain.health).toBeCloseTo(neutral, 5);
  });

  it('pays a Metronome for repeating itself, up to its ceiling', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const target = unitTarget(createUnit(battle, teamB));
    const tackle = getMoveData(Moves.Tackle).power ?? 0;

    attacker.addMove(Moves.Tackle);
    attacker.addMove(Moves.Ember);
    attacker.addItem(Items.Metronome);

    expect(attacker.checkMovePower(Moves.Tackle, target)).toBe(tackle);

    castOnce(attacker, target.unit);
    expect(attacker.checkMovePower(Moves.Tackle, target)).toBe(tackle);

    castOnce(attacker, target.unit);
    expect(attacker.checkMovePower(Moves.Tackle, target)).toBeCloseTo(
      tackle * (1 + METRONOME_STEP),
      5,
    );

    // Reaching for something else forgets the whole streak
    castOnce(attacker, target.unit, Moves.Ember);
    expect(attacker.checkMovePower(Moves.Tackle, target)).toBe(tackle);

    for (let i = 0; i < 20; i++) {
      castOnce(attacker, target.unit, Moves.Ember);
    }
    expect(attacker.checkMovePower(Moves.Ember, target)).toBeCloseTo(
      (getMoveData(Moves.Ember).power ?? 0) * METRONOME_LIMIT,
      5,
    );
  });

  it('steadies the holder and muddles whoever aims at one', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const target = unitTarget(defender);
    const accuracy = getMoveData(Moves.Tackle).accuracy ?? 0;

    attacker.addItem(Items.WideLens);
    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(
      accuracy * WIDE_LENS_ACCURACY,
      5,
    );

    defender.addItem(Items.BrightPowder);
    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(
      accuracy * WIDE_LENS_ACCURACY * BRIGHT_POWDER_EVASION,
      5,
    );
  });

  it('sharpens a critical by stages rather than by a factor', () => {
    const { battle, teamA, teamB } = createBattle();
    const chansey = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    chansey.setSpecies(Species.Chansey);

    // The odds open at one in sixteen and double with every stage, so
    // a roll this size only crits once something has added to them
    const between = (1 / 16) * 2 ** SCOPE_LENS_CRITICAL_STAGES;

    pinRandom(battle, between);

    const bare = defender.health;
    chansey.attack(defender, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, CAN_CRIT);
    const plain = bare - defender.health;

    defender.setHealth(defender.checkStat(Stats.HP, 0));
    chansey.addItem(Items.ScopeLens);

    const beforeLens = defender.health;
    chansey.attack(defender, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, CAN_CRIT);

    // Same roll, twice the damage: the lens turned it into a critical
    expect(beforeLens - defender.health).toBeCloseTo(plain * 2, 5);

    // And the glove is worth two stages to the one species that can
    // wear it
    expect(SPECIES_LENS_CRITICAL_STAGES).toBeGreaterThan(SCOPE_LENS_CRITICAL_STAGES);
  });

  it('deepens what a Big Root drains', () => {
    const { battle, teamA, teamB } = createBattle();
    const drainer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(drainer.checkDrain(target, 20)).toBe(20);

    drainer.addItem(Items.BigRoot);
    expect(drainer.checkDrain(target, 20)).toBeCloseTo(20 * BIG_ROOT_FACTOR, 5);
  });
});

describe('gear that changes a rule', () => {
  it('hurries a Quick Claw holder for the cast it fired on', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const target = unitTarget(createUnit(battle, teamB));
    const priority = holder.checkMovePriority(Moves.Tackle, target);

    holder.addMove(Moves.Tackle);
    holder.addItem(Items.QuickClaw);

    pinRandom(battle, 0); // the claw fires
    holder.cast(Moves.Tackle, target);

    expect(holder.checkMovePriority(Moves.Tackle, target)).toBe(priority + QUICK_CLAW_PRIORITY);

    // The hurry belongs to the cast, so it is gone with it
    holder.stopCast();
    expect(holder.checkMovePriority(Moves.Tackle, target)).toBe(priority);

    pinRandom(battle, 0.99); // and this time it does not
    holder.cast(Moves.Tackle, target);
    expect(holder.checkMovePriority(Moves.Tackle, target)).toBe(priority);
  });

  it('keeps powder and weather off whoever wears the goggles', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const bare = createUnit(battle, teamB);
    const target = unitTarget(holder);

    holder.addItem(Items.SafetyGoggles);

    expect(attacker.checkMoveImmunity(Moves.StunSpore, target, Types.Grass)).toBe(true);
    expect(attacker.checkMoveImmunity(Moves.StunSpore, unitTarget(bare), Types.Grass)).toBe(false);

    battle.setWeather(Weathers.Sandstorm);
    battle.tick(1000);

    expect(holder.health).toBe(holder.checkStat(Stats.HP, 0));
    expect(bare.health).toBeLessThan(bare.checkStat(Stats.HP, 0));
  });

  it('keeps the sun and the rain off an umbrella holder', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);

    battle.setWeather(Weathers.Rain);
    holder.addItem(Items.UtilityUmbrella);

    expect(holder.checkWeather()).toBe(Weathers.None);
    expect(bare.checkWeather()).toBe(Weathers.Rain);

    // A sandstorm goes round an umbrella
    battle.setWeather(Weathers.Sandstorm);
    expect(holder.checkWeather()).toBe(Weathers.Sandstorm);
  });

  it('gets a Smoke Ball holder out of what is holding it', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const trapped = createUnit(battle, teamB);

    trapped.addStatus(Statuses.Trapped, moveCause(attacker, Moves.Wrap));
    expect(trapped.checkEscape()).toBe(false);

    trapped.addItem(Items.SmokeBall);
    expect(trapped.checkEscape()).toBe(true);
  });

  it('ties the other end of an infatuation with a Destiny Knot', () => {
    const { battle, teamA, teamB } = createBattle();
    const charmer = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    charmer.setGender(Genders.Female);
    holder.setGender(Genders.Male);

    holder.addItem(Items.DestinyKnot);
    holder.addStatus(Statuses.Infatuated, moveCause(charmer));

    expect(holder.status[Statuses.Infatuated]).toBeDefined();
    expect(charmer.status[Statuses.Infatuated]).toBeDefined();
    // The knot is not spent tying it
    expect(holder.items[Items.DestinyKnot]).toBe(true);
  });
});

describe('the family gate', () => {
  it('wires a family back up when somebody picks one up again', () => {
    const { battle, teamA, teamB } = createBattle();
    const first = createUnit(battle, teamA);
    const second = createUnit(battle, teamB);
    const attacker = createUnit(battle, teamA);
    const maxHealth = first.checkStat(Stats.HP, 0);

    // The only berry on the field is eaten, which switches the berry
    // listeners off
    first.addItem(Items.OranBerry);
    first.setHealth(maxHealth / 4);
    expect(first.items[Items.OranBerry]).toBeUndefined();

    // A berry picked up afterwards works exactly as it did before
    second.addItem(Items.CheriBerry);
    second.addStatus(Statuses.Paralyzed, moveCause(attacker));

    expect(second.status[Statuses.Paralyzed]).toBeUndefined();
    expect(second.items[Items.CheriBerry]).toBeUndefined();
  });

  it('keeps a family listening while its last item is still owing', () => {
    const { battle, teamA, teamB } = createBattle();
    const sharpened = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const hit = createUnit(battle, teamB);
    const bare = createUnit(battle, teamB);
    const maxHealth = sharpened.checkStat(Stats.HP, 0);

    // A Lansat is eaten in a pinch and sharpens its holder for the
    // rest of the fight — long after the berry itself is gone, and
    // with no berry left on the field to hold the family open
    sharpened.addItem(Items.LansatBerry);
    sharpened.setHealth(maxHealth / 5);
    expect(sharpened.items[Items.LansatBerry]).toBeUndefined();

    // Between the bare odds and the sharpened ones
    pinRandom(battle, (1 / 16) * 2);

    const beforePlain = bare.health;
    plain.attack(bare, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, CAN_CRIT);

    const beforeSharp = hit.health;
    sharpened.attack(hit, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, CAN_CRIT);

    expect(beforeSharp - hit.health).toBeCloseTo((beforePlain - bare.health) * 2, 5);
  });
});

describe('one-shots', () => {
  it('spends a Focus Sash on one blow from full health', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const maxHealth = holder.checkStat(Stats.HP, 0);

    holder.addItem(Items.FocusSash);
    holder.damage(moveCause(attacker), holder, maxHealth * 2, 0);

    expect(holder.alive).toBe(true);
    expect(holder.health).toBe(1);
    expect(holder.items[Items.FocusSash]).toBeUndefined();
    expect([...holder.consumed]).toStrictEqual([Items.FocusSash]);
  });

  it('does nothing for a sash holder that was already hurt', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const maxHealth = holder.checkStat(Stats.HP, 0);

    holder.addItem(Items.FocusSash);
    holder.setHealth(maxHealth - 1);
    holder.damage(moveCause(attacker), holder, maxHealth * 2, 0);

    expect(holder.alive).toBe(false);
    expect(holder.items[Items.FocusSash]).toBe(true);
  });

  it('floats an Air Balloon holder until something lands on it', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    holder.addItem(Items.AirBalloon);
    expect(holder.checkGrounded()).toBe(false);
    expect(attacker.checkMoveImmunity(Moves.Earthquake, unitTarget(holder), Types.Ground)).toBe(
      true,
    );

    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.items[Items.AirBalloon]).toBeUndefined();
    expect(holder.checkGrounded()).toBe(true);
  });

  it('answers a hard hit with a Weakness Policy', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const grass = createUnit(battle, teamB, [Types.Grass]);
    const plain = createUnit(battle, teamB, [Types.Normal]);

    grass.addItem(Items.WeaknessPolicy);
    plain.addItem(Items.WeaknessPolicy);

    attacker.attack(plain, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    expect(plain.items[Items.WeaknessPolicy]).toBe(true);
    expect(plain.stages[Stages.Attack]).toBe(0);

    attacker.attack(grass, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(grass.items[Items.WeaknessPolicy]).toBeUndefined();
    expect(grass.stages[Stages.Attack]).toBe(POLICY_STAGES);
    expect(grass.stages[Stages.SpecialAttack]).toBe(POLICY_STAGES);
  });

  it('answers a blow of its own kind with the elemental one-shots', () => {
    // A pokemon holds one thing at a time, so the bulb and the
    // battery are carried by two of them
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const bulb = createUnit(battle, teamB);
    const battery = createUnit(battle, teamB);

    bulb.addItem(Items.AbsorbBulb);
    battery.addItem(Items.CellBattery);

    attacker.attack(bulb, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);
    attacker.attack(battery, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);

    // The bulb answered the water; the battery is still waiting for
    // something electric
    expect(bulb.stages[Stages.SpecialAttack]).toBe(REACTION_STAGES);
    expect(bulb.items[Items.AbsorbBulb]).toBeUndefined();
    expect(battery.items[Items.CellBattery]).toBe(true);
    expect(battery.stages[Stages.Attack]).toBe(0);

    attacker.attack(battery, Moves.ThunderShock, 40, Types.Electric, MoveCategories.Special, 0);

    expect(battery.stages[Stages.Attack]).toBe(REACTION_STAGES);
    expect(battery.items[Items.CellBattery]).toBeUndefined();
  });

  it('pays a Throat Spray for the shout rather than for what it did', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const target = unitTarget(createUnit(battle, teamB));

    holder.addItem(Items.ThroatSpray);

    // Tackle is silent, Growl is not
    holder.triggerMove(Moves.Tackle, target, 0);
    expect(holder.items[Items.ThroatSpray]).toBe(true);

    holder.triggerMove(Moves.Growl, target, 0);

    expect(holder.items[Items.ThroatSpray]).toBeUndefined();
    expect(holder.stages[Stages.SpecialAttack]).toBe(1);
  });

  it('puts every lowered stage back with a White Herb', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const cause = moveCause(attacker, Moves.Growl);

    holder.addItem(Items.WhiteHerb);
    holder.addStage(Stages.Speed, 2, cause);
    holder.removeStage(Stages.Attack, 2, cause);

    expect(holder.stages[Stages.Attack]).toBe(0);
    expect(holder.items[Items.WhiteHerb]).toBeUndefined();
    // What was gained is left where it is: the herb answers what was
    // taken, not what was earned
    expect(holder.stages[Stages.Speed]).toBe(2);
  });

  it('clears a smitten head with a Mental Herb', () => {
    const { battle, teamA, teamB } = createBattle();
    const charmer = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    charmer.setGender(Genders.Female);
    holder.setGender(Genders.Male);

    holder.addItem(Items.MentalHerb);
    holder.addStatus(Statuses.Infatuated, moveCause(charmer));

    expect(holder.status[Statuses.Infatuated]).toBeUndefined();
    expect(holder.items[Items.MentalHerb]).toBeUndefined();
  });

  it('spends a Power Herb on one instant cast', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const target = unitTarget(createUnit(battle, teamB));

    holder.addMove(Moves.Tackle);
    holder.addItem(Items.PowerHerb);

    const windUp = holder.checkMoveCastTime(Moves.Tackle, target);

    expect(windUp).toBeGreaterThan(0);

    holder.cast(Moves.Tackle, target);

    expect(holder.casting?.time.duration).toBe(0);
    expect(holder.items[Items.PowerHerb]).toBeUndefined();

    holder.stopCast();
    holder.cast(Moves.Tackle, target);

    // And the next one winds up like anything else
    expect(holder.casting?.time.duration).toBe(windUp);
  });
});
