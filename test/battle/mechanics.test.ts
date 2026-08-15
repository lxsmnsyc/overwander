import { describe, expect, it } from 'vitest';
import { EventPriority } from '../../src/core/event-emitter';
import { BattleModes } from '../../src/battle/core';
import { BattleEvents, EffectType, MoveTargetType } from '../../src/battle/events';
import type Battle from '../../src/battle/core';
import type Unit from '../../src/battle/unit';
import { MOVE_DELAY } from '../../src/battle/mechanics/move';
import { Stages, Stats, StatsKind } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import Natures from '../../src/data/ids/natures';
import { DamageFlags, MoveCategories, Moves, StatFlags } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { Statuses, Weathers } from '../../src/data/ids/status';
import { PP_UP_LIMIT, getMoveData } from '../../src/data/moves';
import { FULL_INCENSE_PRIORITY, LAX_INCENSE_EVASION } from '../../src/battle/items/incenses';
import { RELIC_BOOST_FACTOR, STAT_BOOST_FACTOR } from '../../src/battle/items/stat-boosters';
import { TYPE_BOOSTER_FACTOR } from '../../src/battle/items/type-boosters';
import { createBattle, createUnit, pinRandom } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

/**
 * Time in frames rather than one leap. A phase that ends part-way
 * through a tick hands the whole of that tick's elapsed time to the
 * phase it opens, so a single 1800ms jump would run a cast and the
 * step after it at once — which is exactly what these tests are trying
 * to tell apart
 */
function advance(battle: Battle, duration: number): void {
  const frame = 1000 / 60;

  for (let elapsed = 0; elapsed < duration; elapsed += frame) {
    battle.tick(frame);
  }
}

/**
 * Whether the unit is in the hiding half of a two-step move — down a
 * hole, in the air, or gone
 */
function attackerIsHidden(unit: Unit): boolean {
  return unit.status[Statuses.Invulnerable] != null;
}

describe('damage mechanics', () => {
  it('lethal damage clamps to zero and faints the target', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    attacker.damage(NONE_CAUSE, victim, 999, 0);

    expect(victim.health).toBe(0);
    expect(victim.alive).toBe(false);
  });

  it('non-lethal damage leaves the target at one health', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    attacker.damage(NONE_CAUSE, victim, 999, DamageFlags.NonLethal);

    expect(victim.health).toBe(1);
    expect(victim.alive).toBe(true);
  });

  it('healing clamps at max health', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.setHealth(150);

    unit.heal(NONE_CAUSE, unit, 50, 0);

    expect(unit.health).toBe(160);
  });
});

describe('stat and stage mechanics', () => {
  it('computes battle stats from level and base stats', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    expect(unit.checkStat(Stats.HP, 0)).toBe(160);
    expect(unit.checkStat(Stats.Attack, 0)).toBe(105);
  });

  it('clamps stages at plus and minus six', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.addStage(Stages.Attack, 8, NONE_CAUSE);
    expect(unit.stages[Stages.Attack]).toBe(6);

    unit.addStage(Stages.Attack, -20, NONE_CAUSE);
    expect(unit.stages[Stages.Attack]).toBe(-6);
  });

  it('applies the stage factor when resolving stats', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.addStage(Stages.Attack, 2, NONE_CAUSE);
    expect(unit.resolveStat(Stats.Attack, StatFlags.Attack)).toBe(210);

    unit.addStage(Stages.Attack, -4, NONE_CAUSE);
    expect(unit.resolveStat(Stats.Attack, StatFlags.Attack)).toBe(52.5);
  });

  it('resets stages when the unit leaves the field', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.addStage(Stages.Attack, 2, NONE_CAUSE);
    unit.leave();

    expect(unit.stages[Stages.Attack]).toBe(0);
  });
});

describe('type effectiveness and STAB', () => {
  it('doubles and halves damage by the type chart', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const fire = createUnit(battle, teamB, [Types.Fire]);
    const water = createUnit(battle, teamB, [Types.Water]);

    attacker.attack(fire, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);
    expect(160 - fire.health).toBeCloseTo(19.6 * 2);

    attacker.attack(water, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);
    expect(160 - water.health).toBeCloseTo(19.6 * 0.5);
  });

  it('immune targets fail the move at targeting', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const ghost = createUnit(battle, teamB, [Types.Ghost]);

    attacker.triggerMoveTarget(Moves.Tackle, unitTarget(ghost), 0);

    expect(ghost.health).toBe(160);
  });

  it('boosts same-type moves by 1.5', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const grass = createUnit(battle, teamA, [Types.Grass]);
    const defender = createUnit(battle, teamB);

    grass.attack(defender, Moves.VineWhip, 45, Types.Grass, MoveCategories.Physical, 0);

    expect(160 - defender.health).toBeCloseTo((0.44 * 45 + 2) * 1.5);
  });
});

describe('critical hits', () => {
  it('double the damage when the roll passes', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // crit always, damage range at 85%
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.attack(
      defender,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
      2, // MoveAttackFlags.Critical
    );

    expect(160 - defender.health).toBeCloseTo(19.6 * 2 * 0.85);
  });
});

describe('species mechanics', () => {
  it('applies stats, types, and appearance on species change', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.setSpecies(Species.Bulbasaur);

    expect(unit.species).toBe(Species.Bulbasaur);
    expect(unit.appearance).toBe(Species.Bulbasaur);
    expect(unit.types.has(Types.Grass)).toBe(true);
    expect(unit.types.has(Types.Poison)).toBe(true);
    expect(unit.stats[StatsKind.Base][Stats.Attack]).toBe(49);

    unit.setAppearance(Species.Charmander);
    expect(unit.appearance).toBe(Species.Charmander);
    expect(unit.species).toBe(Species.Bulbasaur);
  });
});

describe('type-enhancing held items', () => {
  it('lifts the power of its own type and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const target = unitTarget(defender);
    // Ember is Fire, Tackle is Normal
    const fire = getMoveData(Moves.Ember).power ?? 0;
    const normal = getMoveData(Moves.Tackle).power ?? 0;

    expect(attacker.checkMovePower(Moves.Ember, target)).toBe(fire);

    attacker.addItem(Items.Charcoal);

    // The Fire move burns a fifth hotter; the Normal one is untouched
    expect(attacker.checkMovePower(Moves.Ember, target)).toBeCloseTo(fire * TYPE_BOOSTER_FACTOR, 5);
    expect(attacker.checkMovePower(Moves.Tackle, target)).toBe(normal);

    // An item that has been disabled is still held and does nothing
    attacker.disableItem(Items.Charcoal);
    expect(attacker.checkMovePower(Moves.Ember, target)).toBe(fire);
  });
});

describe('incenses', () => {
  it('lifts its own type the way the plain item does', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const target = unitTarget(defender);
    const water = getMoveData(Moves.WaterGun).power ?? 0;

    attacker.addItem(Items.SeaIncense);

    // A Sea Incense is a Mystic Water by another name
    expect(attacker.checkMovePower(Moves.WaterGun, target)).toBeCloseTo(
      water * TYPE_BOOSTER_FACTOR,
      5,
    );
    expect(attacker.checkMovePower(Moves.Ember, target)).toBe(getMoveData(Moves.Ember).power ?? 0);
  });

  it('lifts a type the same whichever family the item came from', () => {
    const { battle, teamA, teamB } = createBattle();
    const defender = createUnit(battle, teamB);
    const target = unitTarget(defender);
    const fire = getMoveData(Moves.Ember).power ?? 0;
    const lifted = fire * TYPE_BOOSTER_FACTOR;

    // A Charcoal is bought, a Flame Plate is dug up, and an Ember is
    // worth exactly the same to either
    for (const item of [Items.Charcoal, Items.FlamePlate]) {
      const holder = createUnit(battle, teamA);

      holder.addItem(item);
      expect(holder.checkMovePower(Moves.Ember, target)).toBeCloseTo(lifted, 5);
      expect(holder.checkMovePower(Moves.WaterGun, target)).toBe(
        getMoveData(Moves.WaterGun).power ?? 0,
      );
    }
  });

  it('makes its holder harder to hit and slower to act', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const target = unitTarget(holder);
    const accuracy = attacker.checkMoveAccuracy(Moves.Tackle, target) ?? 0;

    expect(accuracy).toBeGreaterThan(0);

    holder.addItem(Items.LaxIncense);

    // Read off whoever is being aimed at, not whoever is aiming
    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(
      accuracy * LAX_INCENSE_EVASION,
      5,
    );

    const priority = holder.checkMovePriority(Moves.Tackle, unitTarget(attacker));

    holder.removeItem(Items.LaxIncense, { type: EffectType.None });
    holder.addItem(Items.FullIncense);

    // A bracket later than it would otherwise have acted
    expect(holder.checkMovePriority(Moves.Tackle, unitTarget(attacker))).toBe(
      priority - FULL_INCENSE_PRIORITY,
    );
  });
});

describe('stat-enhancing held items', () => {
  it('buys half a stat with a lock on the move it opened with', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target = unitTarget(enemy);
    const attack = holder.checkStat(Stats.Attack, 0);

    holder.addMove(Moves.Tackle);
    holder.addMove(Moves.Ember);
    holder.addItem(Items.ChoiceBand);

    // The stat it buys, and nothing else
    expect(holder.checkStat(Stats.Attack, 0)).toBeCloseTo(attack * STAT_BOOST_FACTOR, 5);
    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBe(
      createUnit(battle, teamA).checkStat(Stats.SpecialAttack, 0),
    );

    // Anything may be cast until something is
    expect(holder.checkCanCast(Moves.Ember, target)).toBe(true);

    holder.cast(Moves.Tackle, target);
    // The cast itself has to finish before anything else is castable
    // at all — that is the move mechanics' rule, not the item's
    holder.stopCast();
    holder.finishCooldown(Moves.Tackle);

    // From then on it is that move or nothing, while the item lasts
    expect(holder.checkCanCast(Moves.Tackle, target)).toBe(true);
    expect(holder.checkCanCast(Moves.Ember, target)).toBe(false);

    // The lock belongs to the item, so a disabled one frees it — and
    // takes the stat back with it
    holder.disableItem(Items.ChoiceBand);
    expect(holder.checkCanCast(Moves.Ember, target)).toBe(true);
    expect(holder.checkStat(Stats.Attack, 0)).toBe(attack);
  });

  it('trades every status move for half a special defense', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target = unitTarget(enemy);
    const defense = holder.checkStat(Stats.SpecialDefense, 0);

    holder.addMove(Moves.Tackle);
    holder.addMove(Moves.Growl);

    expect(holder.checkCanCast(Moves.Growl, target)).toBe(true);

    holder.addItem(Items.AssaultVest);

    expect(holder.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(defense * STAT_BOOST_FACTOR, 5);
    // Growl is a status move; Tackle is not
    expect(holder.checkCanCast(Moves.Growl, target)).toBe(false);
    expect(holder.checkCanCast(Moves.Tackle, target)).toBe(true);
  });

  it('gives an Eviolite only to what is still growing', () => {
    const { battle, teamA } = createBattle();
    const growing = createUnit(battle, teamA);
    const finished = createUnit(battle, teamA);

    growing.setSpecies(Species.Cubone);
    finished.setSpecies(Species.Marowak);

    const before = [growing.checkStat(Stats.Defense, 0), finished.checkStat(Stats.Defense, 0)];

    growing.addItem(Items.Eviolite);
    finished.addItem(Items.Eviolite);

    // A Cubone has somewhere left to evolve to; a Marowak does not
    expect(growing.checkStat(Stats.Defense, 0)).toBeCloseTo(before[0] * STAT_BOOST_FACTOR, 5);
    expect(growing.checkStat(Stats.SpecialDefense, 0)).toBeGreaterThan(0);
    expect(finished.checkStat(Stats.Defense, 0)).toBe(before[1]);
  });

  it('doubles a relic stat for its own species and nobody else', () => {
    const { battle, teamA, teamB } = createBattle();
    const cubone = createUnit(battle, teamA);
    const stranger = createUnit(battle, teamB);

    cubone.setSpecies(Species.Cubone);
    stranger.setSpecies(Species.Pikachu);

    const boned = cubone.checkStat(Stats.Attack, 0);
    const borrowed = stranger.checkStat(Stats.Attack, 0);

    cubone.addItem(Items.ThickClub);
    stranger.addItem(Items.ThickClub);

    // A bone to a Cubone, a stick to everyone else
    expect(cubone.checkStat(Stats.Attack, 0)).toBeCloseTo(boned * RELIC_BOOST_FACTOR, 5);
    expect(stranger.checkStat(Stats.Attack, 0)).toBe(borrowed);

    // A Light Ball doubles both of a Pikachu's attacking stats
    const charge = [
      stranger.checkStat(Stats.Attack, 0),
      stranger.checkStat(Stats.SpecialAttack, 0),
    ];

    stranger.removeItem(Items.ThickClub, { type: EffectType.None });
    stranger.addItem(Items.LightBall);

    expect(stranger.checkStat(Stats.Attack, 0)).toBeCloseTo(charge[0] * RELIC_BOOST_FACTOR, 5);
    expect(stranger.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
      charge[1] * RELIC_BOOST_FACTOR,
      5,
    );
  });
});

describe('unit measurements', () => {
  it('carries the individual size the builder sets', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    // A unit is measured by whoever builds it, not by its species:
    // two Snorlax of the same species differ
    unit.setSpecies(Species.Snorlax);
    unit.setHeight(2.35);
    unit.setWeight(514.7);

    expect(unit.height).toBe(2.35);
    expect(unit.weight).toBe(514.7);

    // An effect that shrinks or lightens a unit writes through the
    // same setters, and neither may reach zero — a weightless unit
    // would break the weight-driven moves
    unit.setHeight(0);
    unit.setWeight(-10);

    expect(unit.height).toBe(0.01);
    expect(unit.weight).toBe(0.1);
  });
});

describe('casting flow', () => {
  it('casts, resolves the move, and starts the cooldown', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);

    attacker.cast(Moves.Tackle, unitTarget(defender));
    expect(attacker.casting).toBeDefined();
    expect(defender.health).toBe(160);

    // Base cast time is 104 frames at 60fps (~1733ms)
    battle.tick(1800);

    expect(attacker.casting).toBeUndefined();
    expect(defender.health).toBeCloseTo(160 - 19.6);

    // Tackle is now on cooldown (180 / 35 PP ~ 5143ms)
    expect(attacker.checkCanCast(Moves.Tackle, unitTarget(defender))).toBe(false);

    battle.tick(5200);
    expect(attacker.checkCanCast(Moves.Tackle, unitTarget(defender))).toBe(true);
  });

  it('priority moves cast faster', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const target = unitTarget(defender);

    const tackle = attacker.checkMoveCastTime(Moves.Tackle, target);
    const quickAttack = attacker.checkMoveCastTime(Moves.QuickAttack, target);

    expect(quickAttack).toBeLessThan(tackle);
  });

  it('a cast that lands puts its move on cooldown', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);

    attacker.cast(Moves.Tackle, unitTarget(defender));
    advance(battle, 1800);

    // 180 seconds' worth of uses divided by Tackle's 35 PP
    expect(attacker.moves[Moves.Tackle]?.cooldown?.duration).toBeCloseTo((180 / 35) * 1000);
    expect(attacker.checkCanCast(Moves.Tackle, unitTarget(defender))).toBe(false);
  });

  it('a move with points spent on it comes back sooner', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);
    // What a PP Max buys. PP here is how often a move comes back, so
    // the points shorten the wait rather than adding uses
    attacker.setMovePoints(Moves.Tackle, PP_UP_LIMIT);

    attacker.cast(Moves.Tackle, unitTarget(defender));
    advance(battle, 1800);

    // Tackle's 35 PP plus three fifths of it: 56, and the wait comes
    // down in proportion
    expect(attacker.moves[Moves.Tackle]?.points).toBe(PP_UP_LIMIT);
    expect(attacker.moves[Moves.Tackle]?.cooldown?.duration).toBeCloseTo((180 / 56) * 1000);
  });

  it('spends no points on a move the unit does not know', () => {
    const { battle, teamA } = createBattle();
    const attacker = createUnit(battle, teamA);

    // Points for a move it was never fielded with belong to nothing,
    // and inventing a state for them would give it the move
    attacker.setMovePoints(Moves.Thunderbolt, PP_UP_LIMIT);
    expect(attacker.moves[Moves.Thunderbolt]).toBeUndefined();
  });

  it('a cast whose target faints stops, and pays no cooldown for it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const bystander = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);

    attacker.cast(Moves.Tackle, unitTarget(defender));
    advance(battle, 500);
    expect(attacker.casting).toBeDefined();

    bystander.damage(NONE_CAUSE, defender, 9999, 0);

    // The wind-up is thrown away rather than landing on a corpse, and
    // a move that was never used is a move still ready to use
    expect(attacker.casting).toBeUndefined();
    expect(attacker.moves[Moves.Tackle]?.cooldown).toBeUndefined();
  });

  it('channels the remaining steps of a multi-step move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addMove(Moves.Dig);

    attacker.cast(Moves.Dig, unitTarget(defender));

    // The cast ends with the first step: underground, and out of
    // reach of anything that does not dig after it. The step's own
    // effect lands a delay after the move goes off, like any other
    advance(battle, 1800 + MOVE_DELAY);

    expect(attacker.casting).toBeUndefined();
    expect(attacker.channeling).toBeDefined();
    expect(attacker.status[Statuses.Invulnerable]).toBeDefined();
    expect(defender.health).toBe(160);

    // A channelled step runs as long as the wind-up that opened it
    advance(battle, 1800);

    expect(attacker.channeling).toBeUndefined();
    expect(attacker.status[Statuses.Invulnerable]).toBeUndefined();

    // The bite lands a moment after the move goes off
    advance(battle, MOVE_DELAY);

    expect(defender.health).toBeLessThan(160);
  });

  it('a teleporting unit comes back', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const unit = createUnit(battle, teamA);
    // Somebody to come in, which is what a self switch-out needs
    createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Teleport);

    let switches = 0;

    battle.on(BattleEvents.UnitSwitch, EventPriority.Post, () => {
      switches++;
    });

    unit.cast(Moves.Teleport, { type: MoveTargetType.None });

    // Teleport is priority -6, so both its wind-up and its one
    // channelled step run 200 frames (~3333ms)
    advance(battle, 3400 + MOVE_DELAY);

    expect(attackerIsHidden(unit)).toBe(true);

    advance(battle, 3400 + MOVE_DELAY);

    // Vanishing and never reappearing is the failure this guards: the
    // step that brings the user back is a channelled one, so a channel
    // that never starts leaves it invulnerable for the rest of the
    // fight
    expect(attackerIsHidden(unit)).toBe(false);
    expect(switches).toBe(1);
  });

  it('interruption stops the cast without resolving the move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);

    attacker.cast(Moves.Tackle, unitTarget(defender));
    battle.tick(500);
    attacker.interrupt();

    expect(attacker.casting).toBeUndefined();

    battle.tick(3000);
    expect(defender.health).toBe(160);
  });
});

describe('move delay', () => {
  it('resolves the visual delay from move data with listener overrides', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    // A move that names no delay takes the default: the swing has to
    // land somewhere
    expect(unit.checkMoveDelay(Moves.Tackle, target)).toBe(MOVE_DELAY);

    // Projectile moves declare their flight time in data, and it is
    // read from there rather than pinned here: what a thrown move
    // takes to cross the field is a number that gets tuned
    expect(unit.checkMoveDelay(Moves.Ember, target)).toBe(getMoveData(Moves.Ember).delay);
    expect(getMoveData(Moves.Ember).delay).toBeGreaterThan(MOVE_DELAY);

    // The visual layer can nudge it per battle
    battle.on(BattleEvents.CheckUnitMoveDelay, EventPriority.Post, (event) => {
      event.duration += 250;
    });

    expect(unit.checkMoveDelay(Moves.Tackle, target)).toBe(MOVE_DELAY + 250);
  });

  it('holds a move off until its delay has run', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMove(Moves.Tackle, unitTarget(defender), 0);

    // Nothing has landed yet: the swing is still going out
    expect(defender.health).toBe(160);

    advance(battle, MOVE_DELAY - 1000 / 60);
    expect(defender.health).toBe(160);

    advance(battle, 1000 / 60);
    expect(defender.health).toBeLessThan(160);
  });
});

describe('what a unit may carry', () => {
  it('leaves the ceiling to the record it was fielded from', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    // A raid boss walks in with three abilities and a shadow with two,
    // which the record's own `slots` field allowed. The battle counts
    // nothing: a second ceiling here would drop them on the floor
    unit.addAbility(Abilities.Boss);
    unit.addAbility(Abilities.Shadow);
    unit.addAbility(Abilities.RunAway);

    expect(unit.abilities[Abilities.Boss]).toBe(true);
    expect(unit.abilities[Abilities.Shadow]).toBe(true);
    expect(unit.abilities[Abilities.RunAway]).toBe(true);

    unit.addItem(Items.CheriBerry);
    unit.addItem(Items.OranBerry);

    expect(unit.items[Items.CheriBerry]).toBe(true);
    expect(unit.items[Items.OranBerry]).toBe(true);
  });
});

describe('weather chip damage', () => {
  it('sandstorm chips a sixteenth of max health per interval', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const rocky = createUnit(battle, teamB);
    rocky.types.add(Types.Rock);

    battle.setWeather(Weathers.Sandstorm);

    battle.tick(500);
    expect(unit.health).toBe(160);

    battle.tick(500);
    expect(unit.health).toBe(150);
    expect(rocky.health).toBe(160);

    battle.tick(1000);
    expect(unit.health).toBe(140);
  });

  it('hail chips everyone but Ice types', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const icy = createUnit(battle, teamB);
    icy.types.add(Types.Ice);

    battle.setWeather(Weathers.Hail);
    battle.tick(1000);

    expect(unit.health).toBe(150);
    expect(icy.health).toBe(160);
  });

  it('stops chipping when the weather clears', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    battle.setWeather(Weathers.Sandstorm);
    battle.tick(1000);
    expect(unit.health).toBe(150);

    battle.setWeather(Weathers.None);
    battle.tick(1000);
    expect(unit.health).toBe(150);
  });

  it('team-local weather only chips exposed units', () => {
    const { battle, teamA, teamB } = createBattle();
    const exposed = createUnit(battle, teamA);
    const sheltered = createUnit(battle, teamB);

    teamA.setWeather(Weathers.Hail);
    battle.tick(1000);

    expect(exposed.health).toBe(150);
    expect(sheltered.health).toBe(160);
  });
});

describe('damage immunity', () => {
  it('asks whether damage may land before anything acts on it', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const cause = { type: EffectType.None } as const;

    // Nothing objects, so it lands
    expect(target.checkCanDamage(cause, attacker, 10, 0)).toBe(true);
    attacker.damage(cause, target, 10, 0);
    expect(target.health).toBe(150);

    // An immunity is a verdict on the query rather than a race to
    // disable the damage: whatever answers false stops it outright
    battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
      if (event.flags & DamageFlags.Indirect) {
        event.success = false;
      }
    });

    expect(target.checkCanDamage(cause, attacker, 10, DamageFlags.Indirect)).toBe(false);
    attacker.damage(cause, target, 10, DamageFlags.Indirect);
    expect(target.health).toBe(150);

    // and leaves everything else alone
    attacker.damage(cause, target, 10, 0);
    expect(target.health).toBe(140);
  });

  it('refuses the hit before a substitute can eat it', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.triggerMoveEffect(Moves.Substitute, { type: MoveTargetType.None }, 0);
    expect(target.status[Statuses.Substituted]).toBeDefined();

    battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
      event.success = false;
    });

    const paid = target.health;

    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, target, 1000, 0);

    // The substitute is still standing: it was never asked to spend
    // itself on damage its owner was not going to take
    expect(target.status[Statuses.Substituted]).toBeDefined();
    expect(target.health).toBe(paid);
  });
});

describe('battle modes', () => {
  it('raid weather changes only affect the changing team', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', BattleModes.Raid);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    unit.setWeather(Weathers.Rain);

    expect(teamA.weather.current).toBe(Weathers.Rain);
    expect(battle.weather.current).toBe(Weathers.None);
    expect(unit.checkWeather()).toBe(Weathers.Rain);
    expect(enemy.checkWeather()).toBe(Weathers.None);
  });

  it('boss raid weather lands battle-wide', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', BattleModes.Raid);
    const boss = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    boss.setWeather(Weathers.Sandstorm);

    expect(battle.weather.current).toBe(Weathers.Sandstorm);
    expect(enemy.checkWeather()).toBe(Weathers.Sandstorm);
  });

  it('pvp weather changes are battle-wide', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.setWeather(Weathers.Rain);

    expect(battle.weather.current).toBe(Weathers.Rain);
  });

  it('battle weather outranks team weather', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    teamA.weather.current = Weathers.Sunny;
    battle.setWeather(Weathers.Rain);

    expect(unit.checkWeather()).toBe(Weathers.Rain);
  });
});

describe('natures', () => {
  it('raise and lower stats by ten percent', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    // Neutral by default
    expect(unit.checkStat(Stats.Attack, 0)).toBe(105);

    unit.setNature(Natures.Adamant);

    expect(unit.checkStat(Stats.Attack, 0)).toBe(Math.floor(105 * 1.1));
    expect(unit.checkStat(Stats.SpecialAttack, 0)).toBe(Math.floor(105 * 0.9));
    expect(unit.checkStat(Stats.Defense, 0)).toBe(105);
    expect(unit.checkStat(Stats.HP, 0)).toBe(160); // HP is nature-neutral
  });
});
