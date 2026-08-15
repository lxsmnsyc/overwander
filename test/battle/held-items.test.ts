import { describe, expect, it } from 'vitest';
import { EventPriority } from '../../src/core/event-emitter';
import type Battle from '../../src/battle/core';
import { BattleEvents, EffectType, MoveTargetType } from '../../src/battle/events';
import type Team from '../../src/battle/team';
import type Unit from '../../src/battle/unit';
import {
  BAND_FACTOR,
  BIG_ROOT_FACTOR,
  BINDING_BAND_FACTOR,
  BLACK_SLUDGE_SHARE,
  BRIGHT_POWDER_EVASION,
  EXPERT_BELT_FACTOR,
  FLOAT_STONE_WEIGHT,
  GRIP_CLAW_FACTOR,
  IRON_BALL_SPEED,
  LAGGING_TAIL_PRIORITY,
  LEFTOVERS_SHARE,
  LIGHT_CLAY_FACTOR,
  METRONOME_LIMIT,
  METRONOME_STEP,
  QUICK_CLAW_PRIORITY,
  ROCKY_HELMET_SHARE,
  SCOPE_LENS_CRITICAL_STAGES,
  SHELL_BELL_SHARE,
  SPECIES_LENS_CRITICAL_STAGES,
  STICKY_BARB_SHARE,
  WIDE_LENS_ACCURACY,
  ZOOM_LENS_ACCURACY,
} from '../../src/battle/items/gear';
import { X_ITEM_STAGES_BOOST } from '../../src/battle/items/battle-items';
import { POLICY_STAGES, REACTION_STAGES } from '../../src/battle/items/one-shots';
import { SACRED_ASH_DELAY } from '../../src/battle/items/sacred-ash';
import { DRINK_THRESHOLD } from '../../src/battle/items/drinks';
import { DRINKS } from '../../src/data/items/drinks';
import { TREAT_DELAY } from '../../src/battle/items/treats';
import { TREATS } from '../../src/data/items/treats';
import { SCREEN_DURATION } from '../../src/battle/status/reflect';
import { TRAPPED_DURATION, TRAPPED_TICK } from '../../src/battle/status/trapped';
import Abilities from '../../src/data/ids/abilities';
import { Stages, Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { Items } from '../../src/data/ids/items';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Genders, Species } from '../../src/data/ids/species';
import { Statuses, TeamStatuses, Weathers } from '../../src/data/ids/status';
import { getMoveData } from '../../src/data/moves';
import { packSlots } from '../../src/data/constants/slots';
import { createHeldItems } from '../../src/battle/items/__create';
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

describe('gear that lengthens what is already running', () => {
  it('holds a screen up for half again as long with a Light Clay', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const other = createUnit(battle, teamB);
    const cause = moveCause(caster, Moves.Reflect);

    caster.addItem(Items.LightClay);
    teamA.addStatus(TeamStatuses.Reflect, cause);
    teamB.addStatus(TeamStatuses.Reflect, moveCause(other, Moves.Reflect));

    // The plain screen is out on time; the clay's is still up
    battle.tick(SCREEN_DURATION);
    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
    expect(teamA.status[TeamStatuses.Reflect]).toBeDefined();

    battle.tick(SCREEN_DURATION * (LIGHT_CLAY_FACTOR - 1));
    expect(teamA.status[TeamStatuses.Reflect]).toBeUndefined();
  });

  it('holds a bind on for longer with a Grip Claw', () => {
    const { battle, teamA, teamB } = createBattle();
    const gripping = createUnit(battle, teamA);
    const barehanded = createUnit(battle, teamA);
    const held = createUnit(battle, teamB);
    const loose = createUnit(battle, teamB);

    gripping.addItem(Items.GripClaw);
    held.addStatus(Statuses.Trapped, moveCause(gripping, Moves.Wrap));
    loose.addStatus(Statuses.Trapped, moveCause(barehanded, Moves.Wrap));

    battle.tick(TRAPPED_DURATION);
    expect(loose.status[Statuses.Trapped]).toBeUndefined();
    expect(held.status[Statuses.Trapped]).toBeDefined();

    battle.tick(TRAPPED_DURATION * (GRIP_CLAW_FACTOR - 1));
    expect(held.status[Statuses.Trapped]).toBeUndefined();
  });

  it('grips harder with a Binding Band', () => {
    const { battle, teamA, teamB } = createBattle();
    const banded = createUnit(battle, teamA);
    const barehanded = createUnit(battle, teamA);
    const squeezed = createUnit(battle, teamB);
    const held = createUnit(battle, teamB);

    banded.addItem(Items.BindingBand);
    squeezed.addStatus(Statuses.Trapped, moveCause(banded, Moves.Wrap));
    held.addStatus(Statuses.Trapped, moveCause(barehanded, Moves.Wrap));

    const maxHealth = squeezed.checkStat(Stats.HP, 0);

    battle.tick(TRAPPED_TICK);

    const plain = maxHealth - held.health;

    expect(plain).toBeGreaterThan(0);
    expect(maxHealth - squeezed.health).toBeCloseTo(plain * BINDING_BAND_FACTOR, 5);
  });

  it('leaves the target reeling now and then with a King’s Rock', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    holder.addItem(Items.KingsRock);

    pinRandom(battle, 0.99); // above the chance: nothing comes of it
    holder.attack(target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(target.status[Statuses.Flinched]).toBeUndefined();

    pinRandom(battle, 0); // and this time the rock tells
    holder.attack(target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(target.status[Statuses.Flinched]).toBeDefined();
    // Held, not spent — and still the trade item it also is
    expect(holder.items[Items.KingsRock]).toBe(true);
  });
});

describe('the item gate', () => {
  it('builds one item\u2019s listeners and nobody else\u2019s', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    const built: Items[] = [];

    const setup = createHeldItems(
      () => [Items.Leftovers, Items.ShellBell],
      (inner, item) => {
        built.push(item);
        return inner.on(BattleEvents.Tick, EventPriority.Post, () => {
          // no-op: the gate is what is under test
        });
      },
    );

    setup(battle);

    // Nothing is wired until somebody actually carries something
    expect(built).toEqual([]);

    unit.addItem(Items.Leftovers);
    expect(built).toEqual([Items.Leftovers]);

    // A second holder of the same item reuses the gate that is open
    createUnit(battle, teamA).addItem(Items.Leftovers);
    expect(built).toEqual([Items.Leftovers]);

    // And an item outside the list is none of this gate's business
    unit.addItem(Items.OranBerry);
    expect(built).toEqual([Items.Leftovers]);
  });

  it('leaves an item\u2019s own listeners running while it is held', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    const attackerHealth = attacker.checkStat(Stats.HP, 0);

    // The helmet is picked up after the Leftovers, so its gate opens
    // on its own rather than riding the other item's
    holder.addItem(Items.Leftovers);
    holder.removeItem(Items.Leftovers, { type: EffectType.None });
    holder.addItem(Items.RockyHelmet);

    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(attacker.health).toBe(attackerHealth - Math.floor(attackerHealth * ROCKY_HELMET_SHARE));
  });

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

  it('answers a stare-down with an Adrenaline Orb', () => {
    const { battle, teamA, teamB } = createBattle();
    const intimidator = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const bare = createUnit(battle, teamB);

    holder.addItem(Items.AdrenalineOrb);
    intimidator.addAbility(Abilities.Intimidate);
    intimidator.enter();

    // Both lost the Attack; only the one carrying the orb got
    // something back for it
    expect(holder.stages[Stages.Attack]).toBe(-1);
    expect(bare.stages[Stages.Attack]).toBe(-1);

    expect(holder.stages[Stages.Speed]).toBe(REACTION_STAGES);
    expect(holder.items[Items.AdrenalineOrb]).toBeUndefined();
    expect(bare.stages[Stages.Speed]).toBe(0);
  });

  it('puts back a stage an Intimidate took, not only one that was removed', () => {
    const { battle, teamA, teamB } = createBattle();
    const intimidator = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    holder.addItem(Items.WhiteHerb);
    intimidator.addAbility(Abilities.Intimidate);
    intimidator.enter();

    // An Intimidate lowers by adding a negative stage rather than by
    // removing one, and the herb has to answer both
    expect(holder.stages[Stages.Attack]).toBe(0);
    expect(holder.items[Items.WhiteHerb]).toBeUndefined();
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

describe('the gear that reads a moment', () => {
  it('sharpens a swing at somebody in the middle of their own', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const target = unitTarget(defender);
    const accuracy = getMoveData(Moves.Tackle).accuracy ?? 0;

    attacker.addItem(Items.ZoomLens);

    // Standing there, the lens is worth nothing
    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(accuracy, 5);

    defender.addMove(Moves.Tackle);
    defender.cast(Moves.Tackle, unitTarget(attacker));

    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(
      accuracy * ZOOM_LENS_ACCURACY,
      5,
    );

    defender.stopCast();

    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(accuracy, 5);
  });

  it('gets a Shed Shell holder out of what is holding it', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const caught = createUnit(battle, teamA);

    holder.addStatus(Statuses.Trapped, { type: EffectType.None });
    caught.addStatus(Statuses.Trapped, { type: EffectType.None });

    expect(caught.checkEscape()).toBe(false);

    holder.addItem(Items.ShedShell);

    expect(holder.checkEscape()).toBe(true);
  });
});

describe('the one-shots that put somebody on the bench', () => {
  function recordSwitches(battle: Battle): { source: Unit; target: Unit }[] {
    const switches: { source: Unit; target: Unit }[] = [];

    battle.on(BattleEvents.UnitSwitch, EventPriority.Post, (event) => {
      switches.push({ source: event.source, target: event.target });
    });
    return switches;
  }

  /**
   * A team with somebody worth bringing out and somebody who is not
   */
  function bench(battle: Battle, team: Team): { strong: Unit; weak: Unit } {
    const strong = createUnit(battle, team);
    const weak = createUnit(battle, team);

    weak.setHealth(20);

    return { strong, weak };
  }

  it('shows a Red Card to an enemy and takes their worst in trade', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    const { strong, weak } = bench(battle, teamB);

    holder.addItem(Items.RedCard);

    const switches = recordSwitches(battle);

    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(switches).toHaveLength(1);
    expect(switches[0].source).toBe(attacker);
    expect(switches[0].target).toBe(weak);
    expect(switches[0].target).not.toBe(strong);
    expect(holder.items[Items.RedCard]).toBeUndefined();
  });

  it('fetches an ally’s best out instead, and leaves the holder where it is', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const { strong, weak } = bench(battle, teamA);

    holder.addItem(Items.RedCard);

    const switches = recordSwitches(battle);

    ally.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(switches).toHaveLength(1);
    expect(switches[0].source).toBe(ally);
    expect(switches[0].target).toBe(strong);
    expect(switches[0].target).not.toBe(weak);
  });

  it('drags the one who threw it out of whatever is holding them', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    bench(battle, teamB);
    holder.addItem(Items.RedCard);
    attacker.addStatus(Statuses.Trapped, { type: EffectType.None });

    const switches = recordSwitches(battle);

    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    // A card is shown to somebody, not chosen by them
    expect(switches).toHaveLength(1);
  });

  it('keeps the card when there is nobody to send out', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.RedCard);

    const switches = recordSwitches(battle);

    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(switches).toHaveLength(0);
    expect(holder.items[Items.RedCard]).toBe(true);
  });

  it('presses an Eject Button on the holder’s own behalf', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    const { strong, weak } = bench(battle, teamA);

    holder.addItem(Items.EjectButton);

    const switches = recordSwitches(battle);

    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(switches).toHaveLength(1);
    expect(switches[0].source).toBe(holder);
    expect(switches[0].target).toBe(strong);
    expect(switches[0].target).not.toBe(weak);
    expect(holder.items[Items.EjectButton]).toBeUndefined();
  });

  it('cannot press one while something has hold of the holder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    bench(battle, teamA);
    holder.addItem(Items.EjectButton);
    holder.addStatus(Statuses.Trapped, { type: EffectType.None });

    const switches = recordSwitches(battle);

    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(switches).toHaveLength(0);
    // And an unpressed button is still a button
    expect(holder.items[Items.EjectButton]).toBe(true);
  });

  it('pulls an Eject Pack the moment a stat goes down', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    const { strong } = bench(battle, teamA);

    holder.addItem(Items.EjectPack);

    const switches = recordSwitches(battle);

    holder.removeStage(Stages.Attack, 1, {
      type: EffectType.Move,
      move: Moves.Growl,
      unit: attacker,
    });

    expect(switches).toHaveLength(1);
    expect(switches[0].source).toBe(holder);
    expect(switches[0].target).toBe(strong);
    expect(holder.items[Items.EjectPack]).toBeUndefined();
  });

  it('leaves the pack alone for a stat going up', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);

    bench(battle, teamA);
    holder.addItem(Items.EjectPack);

    const switches = recordSwitches(battle);

    holder.addStage(Stages.Attack, 1, { type: EffectType.None });

    expect(switches).toHaveLength(0);
    expect(holder.items[Items.EjectPack]).toBe(true);
  });
});

describe('the gear that costs its own carrier something', () => {
  it('drags an Iron Ball holder down in both senses', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA, [Types.Flying]);
    const attacker = createUnit(battle, teamB);
    const speed = holder.checkStat(Stats.Speed, 0);

    // A Flying type is out of a Ground move's reach until it is
    // carrying something heavy enough to bring it down
    expect(holder.checkGrounded()).toBe(false);
    expect(attacker.checkMoveImmunity(Moves.Earthquake, unitTarget(holder), Types.Ground)).toBe(
      true,
    );

    holder.addItem(Items.IronBall);

    expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(speed * IRON_BALL_SPEED, 5);
    expect(holder.checkGrounded()).toBe(true);
    expect(attacker.checkMoveImmunity(Moves.Earthquake, unitTarget(holder), Types.Ground)).toBe(
      false,
    );
  });

  it('lifts what a Float Stone holder weighs', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.setWeight(300);

    expect(attacker.checkMovePower(Moves.LowKick, unitTarget(holder))).toBe(120);

    holder.addItem(Items.FloatStone);

    // Halved, and the lift it buys is a whole bracket of Low Kick
    expect(holder.checkWeight()).toBeCloseTo(300 * FLOAT_STONE_WEIGHT, 5);
    // What it stores is untouched: the stone is carried, not eaten
    expect(holder.weight).toBe(300);
    expect(attacker.checkMovePower(Moves.LowKick, unitTarget(holder))).toBe(100);
  });

  it('makes a Lagging Tail holder the later of the two', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const target = unitTarget(createUnit(battle, teamB));
    const priority = holder.checkMovePriority(Moves.Tackle, target);

    holder.addItem(Items.LaggingTail);

    expect(holder.checkMovePriority(Moves.Tackle, target)).toBe(priority + LAGGING_TAIL_PRIORITY);
  });

  it('opens a Ring Target holder to what its typing would have shrugged off', () => {
    const { battle, teamA, teamB } = createBattle();
    const ghost = createUnit(battle, teamA, [Types.Ghost]);
    const attacker = createUnit(battle, teamB);

    expect(attacker.checkMoveImmunity(Moves.Tackle, unitTarget(ghost), Types.Normal)).toBe(true);

    ghost.addItem(Items.RingTarget);

    expect(attacker.checkMoveImmunity(Moves.Tackle, unitTarget(ghost), Types.Normal)).toBe(false);
  });

  it('leaves an immunity the holder’s typing does not explain', () => {
    const { battle, teamA, teamB } = createBattle();
    const floater = createUnit(battle, teamA, [Types.Normal]);
    const attacker = createUnit(battle, teamB);

    floater.addAbility(Abilities.Levitate);
    floater.addItem(Items.RingTarget);

    // The ring is no answer to a pokemon that simply is not standing
    // on the ground
    expect(attacker.checkMoveImmunity(Moves.Earthquake, unitTarget(floater), Types.Ground)).toBe(
      true,
    );
  });
});

describe('Protective Pads', () => {
  it('keeps the holder out of everything that answers being touched', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const helmet = createUnit(battle, teamB);
    const attackerHealth = attacker.checkStat(Stats.HP, 0);

    helmet.addItem(Items.RockyHelmet);
    attacker.addItem(Items.ProtectivePads);
    attacker.attack(helmet, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    // The blow lands; the hand behind it never touches the helmet
    expect(helmet.health).toBeLessThan(helmet.checkStat(Stats.HP, 0));
    expect(attacker.health).toBe(attackerHealth);
  });

  it('answers the contact check itself, so an ability reads it too', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const target = unitTarget(createUnit(battle, teamB));

    expect(attacker.checkMoveContact(Moves.Tackle, target)).toBe(true);
    // Ember is nobody's idea of contact, pads or no pads
    expect(attacker.checkMoveContact(Moves.Ember, target)).toBe(false);

    attacker.addItem(Items.ProtectivePads);

    expect(attacker.checkMoveContact(Moves.Tackle, target)).toBe(false);
  });

  it('leaves a Static holder unable to answer the blow', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    pinRandom(battle, 0); // every roll the ability makes passes
    holder.addAbility(Abilities.Static);
    attacker.addItem(Items.ProtectivePads);
    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(attacker.status[Statuses.Paralyzed]).toBeUndefined();
  });

  it('does not stop the barb catching on somebody else’s hand', () => {
    const { battle, teamA, teamB } = createBattle();
    const barbed = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    // The pads are the toucher's, and here the toucher has none
    barbed.addItem(Items.StickyBarb);
    attacker.attack(barbed, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(attacker.items[Items.StickyBarb]).toBe(true);
  });
});

describe('the Sticky Barb', () => {
  it('bites whoever is carrying it, whatever they are', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA, [Types.Poison]);
    const defender = createUnit(battle, teamB);
    const maxHealth = holder.checkStat(Stats.HP, 0);

    holder.addMove(Moves.Tackle);
    holder.addItem(Items.StickyBarb);
    castOnce(holder, defender);

    // Even a Poison type, which a Black Sludge would have fed
    expect(maxHealth - holder.health).toBe(Math.floor(maxHealth * STICKY_BARB_SHARE));
  });

  it('catches on whoever puts a hand on its holder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.StickyBarb);
    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.items[Items.StickyBarb]).toBeUndefined();
    expect(attacker.items[Items.StickyBarb]).toBe(true);
  });

  it('stays put when the hand it caught is full', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.StickyBarb);
    attacker.addItem(Items.Leftovers);
    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.items[Items.StickyBarb]).toBe(true);
    expect(attacker.items[Items.StickyBarb]).toBeUndefined();
  });

  it('catches on a hand with a slot still free', () => {
    // A scenario that allows two, and a pokemon with room for two:
    // both have to agree before a second hand exists
    const { battle, teamA, teamB } = createBattle('test-seed', undefined, packSlots(1, 2, 4));
    const barbed = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    attacker.setSlots(packSlots(1, 2, 4));
    attacker.addItem(Items.Leftovers);

    barbed.addItem(Items.StickyBarb);
    attacker.attack(barbed, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(attacker.items[Items.StickyBarb]).toBe(true);
    expect(attacker.items[Items.Leftovers]).toBe(true);
  });

  it('keeps to itself when nobody touched it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    // Ember has no contact flag: the barb has nothing to catch on
    holder.addItem(Items.StickyBarb);
    attacker.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(holder.items[Items.StickyBarb]).toBe(true);
  });
});

describe('the battle items', () => {
  it('puts an X item’s own stat back up further than it fell', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.XAttack);
    holder.removeStage(Stages.Attack, 1, moveCause(attacker, Moves.Growl));

    // Down one, then up two: the item is worth carrying only if
    // answering a drop leaves the holder ahead
    expect(holder.stages[Stages.Attack]).toBe(-1 + X_ITEM_STAGES_BOOST);
    expect(holder.items[Items.XAttack]).toBeUndefined();
  });

  it('leaves an X item alone for a stat it is not for', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.XAttack);
    holder.removeStage(Stages.Speed, 1, moveCause(attacker, Moves.StringShot));

    expect(holder.stages[Stages.Speed]).toBe(-1);
    expect(holder.items[Items.XAttack]).toBe(true);
  });

  it('answers an Intimidate as readily as a Growl', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const intimidator = createUnit(battle, teamB);

    holder.addItem(Items.XAttack);
    intimidator.addAbility(Abilities.Intimidate);
    intimidator.enter();

    // Intimidate lowers by adding a negative stage rather than by
    // taking one off, and the item has to answer both doors
    expect(holder.stages[Stages.Attack]).toBe(-1 + X_ITEM_STAGES_BOOST);
  });

  it('sharpens a Dire Hit holder for the rest of the fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const hit = createUnit(battle, teamB);
    const bare = createUnit(battle, teamB);

    holder.addItem(Items.DireHit);
    holder.removeStage(Stages.Defense, 1, moveCause(hit, Moves.TailWhip));

    expect(holder.items[Items.DireHit]).toBeUndefined();

    // Between the bare odds and the sharpened ones
    pinRandom(battle, (1 / 16) * 2);

    const beforePlain = bare.health;
    plain.attack(bare, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, CAN_CRIT);

    const beforeSharp = hit.health;
    holder.attack(hit, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, CAN_CRIT);

    expect(beforeSharp - hit.health).toBeCloseTo((beforePlain - bare.health) * 2, 5);
  });

  it('refuses the drop outright with a Guard Spec', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.GuardSpec);
    holder.removeStage(Stages.Attack, 1, moveCause(attacker, Moves.Growl));

    expect(holder.stages[Stages.Attack]).toBe(0);
    expect(holder.items[Items.GuardSpec]).toBeUndefined();

    // And it is spent: the next one lands
    holder.removeStage(Stages.Attack, 1, moveCause(attacker, Moves.Growl));
    expect(holder.stages[Stages.Attack]).toBe(-1);
  });

  it('lets a Guard Spec holder lower its own stats', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);

    // A Belly Drum sort of price is the holder's own choice, and a
    // guard against everybody else is no reason to refuse it
    holder.addItem(Items.GuardSpec);
    holder.removeStage(Stages.Defense, 1, {
      type: EffectType.Move,
      move: Moves.Growl,
      unit: holder,
    });

    expect(holder.stages[Stages.Defense]).toBe(-1);
    expect(holder.items[Items.GuardSpec]).toBe(true);
  });
});

describe('the Sacred Ash', () => {
  /**
   * Everything on the team on the floor, the holder last
   */
  function wipe(units: Unit[], attacker: Unit): void {
    for (const unit of units) {
      unit.damage(moveCause(attacker), unit, unit.checkStat(Stats.HP, 0) * 2, 0);
    }
  }

  it('brings a whole team back a second after its holder falls', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.SacredAsh);
    wipe([ally, holder], attacker);

    // Everyone is down and the ash is gone, but nothing has happened
    // yet: it is a moment, not a reflex
    expect(holder.alive).toBe(false);
    expect(ally.alive).toBe(false);
    expect(holder.items[Items.SacredAsh]).toBeUndefined();

    battle.tick(SACRED_ASH_DELAY - 1);
    expect(holder.alive).toBe(false);

    battle.tick(1);

    expect(holder.alive).toBe(true);
    expect(ally.alive).toBe(true);
    expect(holder.health).toBe(holder.checkStat(Stats.HP, 0));
    expect(ally.health).toBe(ally.checkStat(Stats.HP, 0));
  });

  it('brings them back ready to act rather than waiting on a cooldown', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addMove(Moves.Tackle);
    holder.addItem(Items.SacredAsh);

    // A move thrown, then a faint while it is still cooling
    holder.cast(Moves.Tackle, unitTarget(attacker));
    holder.finishCast();

    expect(holder.moves[Moves.Tackle]?.cooldown).toBeDefined();

    wipe([holder], attacker);
    battle.tick(SACRED_ASH_DELAY);

    expect(holder.alive).toBe(true);
    expect(holder.moves[Moves.Tackle]?.cooldown).toBeUndefined();
  });

  it('is one to a team, however many the team is carrying', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.SacredAsh);
    second.addItem(Items.SacredAsh);

    wipe([holder], attacker);
    battle.tick(SACRED_ASH_DELAY);

    expect(holder.alive).toBe(true);
    // The other one is still in its holder's grip and worth nothing
    expect(second.items[Items.SacredAsh]).toBe(false);

    wipe([second, holder], attacker);
    battle.tick(SACRED_ASH_DELAY);

    expect(holder.alive).toBe(false);
    expect(second.alive).toBe(false);
  });

  it('deadens one picked up after the team has spent theirs', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const later = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.SacredAsh);
    wipe([holder], attacker);
    battle.tick(SACRED_ASH_DELAY);

    later.addItem(Items.SacredAsh);

    expect(later.items[Items.SacredAsh]).toBe(false);
  });

  it('leaves the other side to look after itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const attacker = createUnit(battle, teamB);

    holder.addItem(Items.SacredAsh);
    wipe([enemy], attacker);
    wipe([holder], attacker);
    battle.tick(SACRED_ASH_DELAY);

    expect(holder.alive).toBe(true);
    expect(enemy.alive).toBe(false);
  });
});

describe('the drinks', () => {
  it('goes down on its own once the holder is nearly out', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const maxHealth = holder.checkStat(Stats.HP, 0);
    const drink = DRINKS.get(Items.MoomooMilk);

    holder.addItem(Items.MoomooMilk);

    // A quarter left is a berry's moment, not a drink's
    holder.setHealth(maxHealth / 4);

    expect(holder.items[Items.MoomooMilk]).toBe(true);

    const low = maxHealth * DRINK_THRESHOLD;

    holder.setHealth(low);

    expect(holder.items[Items.MoomooMilk]).toBeUndefined();
    expect(holder.health).toBe(low + (drink?.restore ?? 0));
  });

  it('gives back what the bottle holds, whatever the pokemon is', () => {
    const { battle, teamA } = createBattle();
    const small = createUnit(battle, teamA);
    const maxHealth = small.checkStat(Stats.HP, 0);
    const water = DRINKS.get(Items.FreshWater);
    const milk = DRINKS.get(Items.MoomooMilk);

    small.addItem(Items.FreshWater);
    small.setHealth(maxHealth * DRINK_THRESHOLD);

    // Flat, so the cheap bottle is worth less to whoever has more to
    // fill — and the dear one is worth carrying by anybody
    expect(small.health).toBe(maxHealth * DRINK_THRESHOLD + (water?.restore ?? 0));
    expect(water?.restore).toBeLessThan(milk?.restore ?? 0);
  });

  it('is moved by a Gluttony the way a berry is', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const maxHealth = holder.checkStat(Stats.HP, 0);

    holder.addAbility(Abilities.Gluttony);
    holder.addItem(Items.Lemonade);
    holder.setHealth(maxHealth * DRINK_THRESHOLD * 2);

    // Twice the threshold, which is exactly what the ability buys
    expect(holder.items[Items.Lemonade]).toBeUndefined();
  });

  it('never spills over the top of its holder', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const maxHealth = holder.checkStat(Stats.HP, 0);

    holder.addItem(Items.MoomooMilk);
    holder.setHealth(1);

    expect(holder.health).toBeLessThanOrEqual(maxHealth);
  });
});

describe('the regional treats', () => {
  it('waits a second before it is unwrapped, then takes the status off', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const burner = createUnit(battle, teamB);

    holder.addItem(Items.OldGateau);
    holder.addStatus(Statuses.Burned, moveCause(burner, Moves.Ember));

    // The pause is the point: the burn is still on and the cake is
    // still in its wrapper
    battle.tick(TREAT_DELAY - 1);

    expect(holder.status[Statuses.Burned]).toBeDefined();
    expect(holder.items[Items.OldGateau]).toBe(true);

    battle.tick(1);

    expect(holder.status[Statuses.Burned]).toBeUndefined();
    expect(holder.items[Items.OldGateau]).toBeUndefined();
  });

  it('clears everything it covers in the one mouthful', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const poisoner = createUnit(battle, teamB);

    holder.addItem(Items.LavaCookie);
    holder.addStatus(Statuses.Poisoned, moveCause(poisoner, Moves.PoisonPowder));
    holder.addStatus(Statuses.Paralyzed, moveCause(poisoner, Moves.ThunderWave));
    battle.tick(TREAT_DELAY);

    expect(holder.status[Statuses.Poisoned]).toBeUndefined();
    expect(holder.status[Statuses.Paralyzed]).toBeUndefined();
    expect(holder.items[Items.LavaCookie]).toBeUndefined();
  });

  it('stays wrapped when the status is gone before it is opened', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const burner = createUnit(battle, teamB);

    holder.addItem(Items.Casteliacone);
    holder.addStatus(Statuses.Burned, moveCause(burner, Moves.Ember));
    holder.removeStatus(Statuses.Burned, { type: EffectType.None, unit: holder });
    battle.tick(TREAT_DELAY);

    expect(holder.items[Items.Casteliacone]).toBe(true);
  });

  it('says nothing about a status no Full Heal answers', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const confuser = createUnit(battle, teamB);

    holder.addItem(Items.BigMalasada);
    holder.addStatus(Statuses.Confused, moveCause(confuser, Moves.Confusion));
    battle.tick(TREAT_DELAY);

    expect(holder.status[Statuses.Confused]).toBeDefined();
    expect(holder.items[Items.BigMalasada]).toBe(true);
  });

  it('eats the candy bar the way a drink goes down', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const maxHealth = holder.checkStat(Stats.HP, 0);
    const restore = TREATS.get(Items.RageCandyBar)?.restore ?? 0;
    const low = maxHealth * DRINK_THRESHOLD;

    holder.addItem(Items.RageCandyBar);
    holder.setHealth(maxHealth / 4);

    expect(holder.items[Items.RageCandyBar]).toBe(true);

    holder.setHealth(low);

    expect(holder.items[Items.RageCandyBar]).toBeUndefined();
    expect(holder.health).toBe(low + restore);
  });

  it('leaves the candy bar alone for a status', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const burner = createUnit(battle, teamB);

    holder.addItem(Items.RageCandyBar);
    holder.addStatus(Statuses.Burned, moveCause(burner, Moves.Ember));
    battle.tick(TREAT_DELAY);

    expect(holder.status[Statuses.Burned]).toBeDefined();
    expect(holder.items[Items.RageCandyBar]).toBe(true);
  });
});
