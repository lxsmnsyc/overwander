// Gastly through Mew, with the trios that shift a stage on entry.

import { describe, expect, it } from 'vitest';
import registerAbilities, {
  getAbilityData,
  getRegisteredAbilities,
} from '../../../../src/data/abilities';
import { SIGNATURE_ABILITIES } from '../../../../src/battle/abilities/signature';
import {
  FOSSIL_BLADE_SCALE,
  FOSSIL_SHELL_SCALE,
} from '../../../../src/battle/abilities/signature/__create';
import {
  ANCESTRAL_MEMORY_SCALE,
  FULL_BELLY_CAST_SCALE,
  FULL_BELLY_HEAL_FRACTION,
  GENETIC_APEX_HIGHEST_SCALE,
  GENETIC_APEX_LOWEST_SCALE,
  LATENT_POTENTIAL_SCALE,
  PREDATORS_DIVE_SCALE,
  ROLLBACK_SAMPLE,
  ROLLBACK_THRESHOLD,
  ROLLBACK_WINDOW,
} from '../../../../src/battle/abilities/signature/eevee-to-dragonite';
import {
  BLAST_FURNACE_CHANCE,
  BULLHEADED_EXPOSED_SCALE,
  BULLHEADED_POWER_SCALE,
  CORKSCREW_SCALE,
  CUSHIONED_CAP_FRACTION,
  HEAVY_PINCER_SCALE,
  HEAVY_PINCER_THRESHOLD,
  ICY_CHARM_SCALE,
  LATE_BLOOMER_INTERVAL,
  LATE_BLOOMER_MAX_STACKS,
  LATE_BLOOMER_STEP,
  MIMED_BARRIER_SELF_SCALE,
  MOTHERS_SHIELD_THRESHOLD,
  MOURNING_BONE_SCALE,
  OVERLOAD_SPEED_SCALE,
  OVERLOAD_THRESHOLD,
  SECOND_WIND_HEAL_FRACTION,
  SECOND_WIND_THRESHOLD,
  SMOG_SCREEN_ACCURACY_SCALE,
  SNAPJAW_SCALE,
  STATIC_FIELD_MAX_STACKS,
  STATIC_FIELD_STEP,
  UPSTREAM_SCALE,
  WHIRL_CURRENT_CAST_SCALE,
} from '../../../../src/battle/abilities/signature/krabby-to-pinsir';
import {
  DREAM_FEAST_FRACTION,
  LIVING_TUNNEL_ALLY_SCALE,
  LIVING_TUNNEL_SELF_SCALE,
  NIGHT_TERROR_DURATION,
} from '../../../../src/battle/abilities/signature/geodude-to-drowzee';
import {
  BattleEvents,
  EffectType,
  type MoveTarget,
  MoveTargetType,
} from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { Stages, Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses, TeamStatuses, Weathers } from '../../../../src/data/ids/status';
import turns from '../../../../src/battle/turn';
import { layersUnder } from '../../../../src/battle/moves/spikes';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, makeAttack, resolveAttackStat } from './helpers';

describe('Night Terror', () => {
  it('keeps a wound open for four seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.NightTerror);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    // Well clear of full, so a heal that lands has room to show
    enemy.setHealth(enemy.checkStat(Stats.HP, 0) / 2);

    const hurt = enemy.health;
    enemy.heal(NONE_CAUSE, enemy, 20, 0);

    expect(enemy.health).toBe(hurt);

    battle.tick(NIGHT_TERROR_DURATION);
    enemy.heal(NONE_CAUSE, enemy, 20, 0);

    expect(enemy.health).toBeCloseTo(hurt + 20, 5);
  });
});

describe('Living Tunnel', () => {
  it('turns Rock and Ground aside from allies and takes them itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LivingTunnel);

    const atAlly = makeAttack(enemy, ally, Moves.RockThrow, Types.Rock, MoveCategories.Physical);
    const atHolder = makeAttack(
      enemy,
      holder,
      Moves.RockThrow,
      Types.Rock,
      MoveCategories.Physical,
    );
    const other = makeAttack(enemy, ally, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, atAlly, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * LIVING_TUNNEL_ALLY_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, atHolder, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * LIVING_TUNNEL_SELF_SCALE,
      5,
    );

    // Only the two types the rock stands in the way of
    expect(resolveAttackStat(battle, other, enemy, Stats.Attack, 100)).toBe(100);
  });
});

describe('Dream Feast', () => {
  it('eats a sleeping dream whole', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.DreamFeast);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);

    enemy.addStatus(Statuses.Sleeping, NONE_CAUSE);
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * DREAM_FEAST_FRACTION, 5);
  });
});

describe('Heavy Pincer', () => {
  it('closes the claw properly only while it has strength left', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HeavyPincer);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(40 * HEAVY_PINCER_SCALE, 5);
    expect(holder.checkMovePower(Moves.Ember, target)).toBe(40);

    holder.setHealth(holder.checkStat(Stats.HP, 0) * HEAVY_PINCER_THRESHOLD - 1);

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);
  });
});

describe('Overload', () => {
  it('doubles its Speed once it is badly hurt', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Overload);

    const bare = holder.checkStat(Stats.Speed, 0);
    const maxHP = holder.checkStat(Stats.HP, 0);

    holder.setHealth(maxHP * OVERLOAD_THRESHOLD);

    expect(holder.checkStat(Stats.Speed, 0)).toBe(bare);

    holder.setHealth(maxHP * OVERLOAD_THRESHOLD - 1);

    expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(bare * OVERLOAD_SPEED_SCALE, 5);
  });
});

describe('Psyseed', () => {
  it('casts Leech Seed on a mind its Psychic moves damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Psyseed);

    // A move of another type plants nothing
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Seeding]).toBeUndefined();

    holder.attack(enemy, Moves.Confusion, 40, Types.Psychic, MoveCategories.Special, 0);
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Seeding]).not.toBeUndefined();
  });

  it('leaves a Grass type unseeded, the way the move does', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB, [Types.Grass]);
    holder.addAbility(Abilities.Psyseed);

    holder.attack(enemy, Moves.Confusion, 40, Types.Psychic, MoveCategories.Special, 0);
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Seeding]).toBeUndefined();
  });
});

describe('Mourning Bone', () => {
  it('hits harder with nobody left beside it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.MourningBone);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    ally.faint(enemy);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(40 * MOURNING_BONE_SCALE, 5);
  });
});

describe('Second Wind', () => {
  it('gets up once and only once', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SecondWind);

    const maxHP = holder.checkStat(Stats.HP, 0);

    holder.setHealth(maxHP * SECOND_WIND_THRESHOLD + 10);
    enemy.damage(NONE_CAUSE, holder, 11, 0);

    expect(holder.health).toBeCloseTo(
      maxHP * SECOND_WIND_THRESHOLD - 1 + maxHP * SECOND_WIND_HEAL_FRACTION,
      5,
    );

    // The wind does not come round twice
    holder.setHealth(10);
    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(holder.health).toBe(9);
  });
});

describe('Taste Everything', () => {
  it('eats the berry it licks and takes what the berry gives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TasteEverything);

    holder.setHealth(holder.checkStat(Stats.HP, 0) / 2);
    enemy.addItem(Items.OranBerry);

    // Nothing it does not get its tongue on
    enemy.setHealth(enemy.checkStat(Stats.HP, 0));
    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(enemy.items[Items.OranBerry]).not.toBeUndefined();

    const before = holder.health;
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.items[Items.OranBerry]).toBeUndefined();
    expect(holder.health).toBeCloseTo(before + 10, 5);
  });

  it('is cured by a berry that cures', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TasteEverything);

    holder.addStatus(Statuses.Paralyzed, NONE_CAUSE);
    enemy.addItem(Items.CheriBerry);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.status[Statuses.Paralyzed]).toBeUndefined();
  });
});

describe('Smog Screen', () => {
  it('costs the far side its aim and leaves its own alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SmogScreen);

    const atHolder = { type: MoveTargetType.Unit, unit: holder } as const;
    const atEnemy = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(enemy.checkMoveAccuracy(Moves.Pound, atHolder)).toBeCloseTo(
      100 * SMOG_SCREEN_ACCURACY_SCALE,
      5,
    );
    expect(ally.checkMoveAccuracy(Moves.Pound, atEnemy)).toBe(100);
    expect(holder.checkMoveAccuracy(Moves.Pound, atEnemy)).toBe(100);
  });
});

describe('Corkscrew', () => {
  it('hits harder and ignores a raised guard', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Corkscrew);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(40 * CORKSCREW_SCALE, 5);
    expect(holder.checkMovePower(Moves.Ember, target)).toBe(40);

    enemy.addStage(Stages.Defense, 2, NONE_CAUSE);

    const guarded = enemy.resolveStat(Stats.Defense, 0);
    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const bare = createUnit(battle, teamB).resolveStat(Stats.Defense, 0);

    expect(guarded).toBeGreaterThan(bare);
    expect(resolveAttackStat(battle, parent, enemy, Stats.Defense, guarded)).toBeCloseTo(bare, 5);
  });
});

describe('Cushioned', () => {
  it('caps what any single blow may take', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Cushioned);

    const maxHP = holder.checkStat(Stats.HP, 0);
    const cap = maxHP * CUSHIONED_CAP_FRACTION;

    enemy.damage(NONE_CAUSE, holder, maxHP, 0);

    expect(holder.health).toBeCloseTo(maxHP - cap, 5);

    // A small hit is left as it is
    holder.setHealth(maxHP);
    enemy.damage(NONE_CAUSE, holder, 5, 0);

    expect(holder.health).toBeCloseTo(maxHP - 5, 5);
  });
});

describe('Vine Web', () => {
  it('lays a layer of Spikes on the enemy side as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.VineWeb);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(1);
    expect(layersUnder(teamA)).toBe(0);
  });
});

describe("Mother's Shield", () => {
  it('takes over a move aimed at a hurt ally', () => {
    const { battle, teamA, teamB } = createBattle();
    const mother = createUnit(battle, teamA);
    const child = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    mother.addAbility(Abilities.MothersShield);

    function aimedAt(unit: Unit): Unit | undefined {
      const event = {
        id: 'UnitTriggerMoveTarget',
        disabled: false,
        source: enemy,
        move: Moves.Pound,
        target: { type: MoveTargetType.Unit, unit } as MoveTarget,
        steps: 0,
      };
      battle.emit(BattleEvents.UnitTriggerMoveTarget, event);
      return event.target.type === MoveTargetType.Unit ? event.target.unit : undefined;
    }

    // A healthy ally is left to fend for itself
    expect(aimedAt(child)).toBe(child);

    child.setHealth(child.checkStat(Stats.HP, 0) * MOTHERS_SHIELD_THRESHOLD - 1);

    expect(aimedAt(child)).toBe(mother);
  });
});

describe('Whirl Current', () => {
  it('slows enemy wind-ups while it is raining', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.WhirlCurrent);

    const target = { type: MoveTargetType.None } as const;
    const bare = enemy.checkMoveCastTime(Moves.Flamethrower, target);

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);

    teamB.weather.current = Weathers.Rain;

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * WHIRL_CURRENT_CAST_SCALE,
      5,
    );

    // Its own casts are its own business
    teamA.weather.current = Weathers.Rain;

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);
  });
});

describe('Upstream', () => {
  it('hits anything bigger than it harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const bigger = createUnit(battle, teamB);
    holder.addAbility(Abilities.Upstream);

    bigger.setStat(StatsKind.Base, Stats.HP, 200);

    const atBigger = makeAttack(holder, bigger, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(bigger.checkStat(Stats.HP, 0)).toBeGreaterThan(holder.checkStat(Stats.HP, 0));
    expect(resolveAttackStat(battle, atBigger, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * UPSTREAM_SCALE,
      5,
    );

    const smaller = createUnit(battle, teamB);
    smaller.setStat(StatsKind.Base, Stats.HP, 20);

    const atSmaller = makeAttack(
      holder,
      smaller,
      Moves.Pound,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(resolveAttackStat(battle, atSmaller, holder, Stats.Attack, 100)).toBe(100);
  });
});

describe('Core Reset', () => {
  it('undoes one stat drop each time it acts', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.CoreReset);

    holder.addStage(Stages.Attack, -2, NONE_CAUSE);
    holder.addStage(Stages.Speed, -1, NONE_CAUSE);

    act(battle, holder);

    expect(holder.stages[Stages.Attack]).toBe(-1);
    expect(holder.stages[Stages.Speed]).toBe(-1);

    act(battle, holder);
    act(battle, holder);

    expect(holder.stages[Stages.Attack]).toBe(0);
    expect(holder.stages[Stages.Speed]).toBe(0);

    // Nothing to right, nothing raised
    act(battle, holder);

    expect(holder.stages[Stages.Attack]).toBe(0);
  });
});

describe('Mimed Barrier', () => {
  it('puts Light Screen up as it arrives and stays open to a punch', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.MimedBarrier);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(teamA.status[TeamStatuses.LightScreen]).not.toBeUndefined();

    const physical = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, physical, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * MIMED_BARRIER_SELF_SCALE,
      5,
    );
  });
});

describe('Clean Cut', () => {
  it('reads a critical hit against the bare defending stat', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CleanCut);

    enemy.addStage(Stages.Defense, 2, NONE_CAUSE);

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const guarded = enemy.resolveStat(Stats.Defense, 0);
    const bare = enemy.checkStat(Stats.Defense, 0);

    // Nothing at all until the blow is a critical
    expect(resolveAttackStat(battle, parent, enemy, Stats.Defense, guarded)).toBe(guarded);

    battle.emit(BattleEvents.UnitAttackResolveCriticalHit, {
      id: 'UnitAttackResolveCriticalHit',
      disabled: false,
      parent,
      critical: true,
    });

    expect(resolveAttackStat(battle, parent, enemy, Stats.Defense, guarded)).toBe(bare);
  });
});

describe('Icy Charm', () => {
  it('hits a turned head harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.IcyCharm);

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBe(100);

    enemy.addStatus(Statuses.Confused, NONE_CAUSE);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * ICY_CHARM_SCALE,
      5,
    );
  });
});

describe('Static Field', () => {
  it('charges off contact and only off contact', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.StaticField);

    const bare = holder.checkStat(Stats.Speed, 0);
    const maxHP = holder.checkStat(Stats.HP, 0);

    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    holder.setHealth(maxHP);

    expect(holder.checkStat(Stats.Speed, 0)).toBe(bare);

    for (let touched = 1; touched <= STATIC_FIELD_MAX_STACKS + 2; touched += 1) {
      enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
      holder.setHealth(maxHP);

      expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(
        bare * (1 + STATIC_FIELD_STEP * Math.min(STATIC_FIELD_MAX_STACKS, touched)),
        5,
      );
    }
  });
});

describe('Blast Furnace', () => {
  it('sets a target alight with a Fire move and leaves other types alone', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.BlastFurnace);

    expect(BLAST_FURNACE_CHANCE).toBeGreaterThan(0);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.status[Statuses.Burned]).toBeUndefined();

    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(enemy.status[Statuses.Burned]).not.toBeUndefined();
  });

  it('does not light one when the roll goes against it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.BlastFurnace);

    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(enemy.status[Statuses.Burned]).toBeUndefined();
  });
});

describe('Snapjaw', () => {
  it('crushes a target that is winding up', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Snapjaw);

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBe(100);

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: enemy,
      move: Moves.SolarBeam,
      target: { type: MoveTargetType.Unit, unit: holder },
    });

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * SNAPJAW_SCALE,
      5,
    );
  });
});

describe('Bullheaded', () => {
  it('trades guard for weight behind its charge', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bullheaded);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(40 * BULLHEADED_POWER_SCALE, 5);
    expect(holder.checkMovePower(Moves.Ember, target)).toBe(40);

    const incoming = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, incoming, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * BULLHEADED_EXPOSED_SCALE,
      5,
    );
  });
});

describe('the signature registry', () => {
  it('has a name and a line for every signature ability the engine implements', () => {
    registerAbilities();

    const registered = new Set(getRegisteredAbilities());

    // A battle implementation on its own proves nothing about the
    // registry: an unregistered ability works in a fight and has no
    // name anywhere a player can read
    for (const ability of SIGNATURE_ABILITIES) {
      expect(registered.has(ability)).toBe(true);

      const data = getAbilityData(ability);

      expect(data.name.length).toBeGreaterThan(0);
      expect(data.description.endsWith('.')).toBe(true);
    }
  });
});

describe('Late Bloomer', () => {
  it('grows with every stretch of the fight, up to its ceiling', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LateBloomer);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    battle.tick(LATE_BLOOMER_INTERVAL);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(40 * (1 + LATE_BLOOMER_STEP), 5);

    battle.tick(LATE_BLOOMER_INTERVAL * (LATE_BLOOMER_MAX_STACKS + 4));

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
      40 * (1 + LATE_BLOOMER_STEP * LATE_BLOOMER_MAX_STACKS),
      5,
    );
  });
});

describe('Safe Passage', () => {
  it('puts Safeguard over its side and carries its allies past a trap', () => {
    const { battle, teamA, teamB } = createBattle();
    const ferry = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    ferry.addAbility(Abilities.SafePassage);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: ferry,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(teamA.status[TeamStatuses.Safeguard]).not.toBeUndefined();

    ally.addStatus(Statuses.Cornered, NONE_CAUSE);
    enemy.addStatus(Statuses.Cornered, NONE_CAUSE);

    expect(ally.checkEscape()).toBe(true);
    expect(enemy.checkEscape()).toBe(false);
  });
});

describe('Formless', () => {
  it('takes a critical hit as an ordinary one and refuses a drop', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Formless);

    const event = {
      id: 'UnitAttackResolveCriticalHit',
      disabled: false,
      parent: makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical),
      critical: true,
    };
    battle.emit(BattleEvents.UnitAttackResolveCriticalHit, event);

    expect(event.critical).toBe(false);

    holder.addStage(Stages.Attack, -2, NONE_CAUSE);

    expect(holder.stages[Stages.Attack]).toBe(0);

    // A raise is still a raise
    holder.addStage(Stages.Attack, 1, NONE_CAUSE);

    expect(holder.stages[Stages.Attack]).toBe(1);
  });
});

describe('Latent Potential', () => {
  it('raises whichever stat is furthest behind', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.LatentPotential);

    const bare = createUnit(battle, teamA);
    holder.setStat(StatsKind.Base, Stats.Speed, 40);
    bare.setStat(StatsKind.Base, Stats.Speed, 40);

    // Speed is now its worst, so Speed is what the potential goes into
    expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(
      bare.checkStat(Stats.Speed, 0) * LATENT_POTENTIAL_SCALE,
      5,
    );
    expect(holder.checkStat(Stats.Attack, 0)).toBe(bare.checkStat(Stats.Attack, 0));

    // Lift it above the rest and the potential moves elsewhere
    holder.setStat(StatsKind.Base, Stats.Speed, 200);
    bare.setStat(StatsKind.Base, Stats.Speed, 200);

    expect(holder.checkStat(Stats.Speed, 0)).toBe(bare.checkStat(Stats.Speed, 0));
  });
});

describe('Rollback', () => {
  it('restores the health it had four seconds earlier, once', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Rollback);

    const maxHP = holder.checkStat(Stats.HP, 0);

    // Snapshots are taken a second at a time, so the clock is run the
    // way a fight runs it
    function waitForSnapshots(): void {
      for (let taken = 0; taken <= ROLLBACK_WINDOW / ROLLBACK_SAMPLE + 1; taken += 1) {
        battle.tick(ROLLBACK_SAMPLE);
      }
    }

    waitForSnapshots();

    enemy.damage(NONE_CAUSE, holder, maxHP * (1 - ROLLBACK_THRESHOLD) + 10, 0);

    expect(holder.health).toBeCloseTo(maxHP, 5);

    // The snapshot is spent: a second fall is not undone
    holder.setHealth(maxHP);
    waitForSnapshots();
    enemy.damage(NONE_CAUSE, holder, maxHP * (1 - ROLLBACK_THRESHOLD) + 10, 0);

    expect(holder.health).toBeLessThan(maxHP * ROLLBACK_THRESHOLD);
  });
});

describe('the Kanto fossils', () => {
  it('raises the shell against every blow it takes', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HelixShell);

    const physical = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const special = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, physical, holder, Stats.Defense, 100)).toBeCloseTo(
      100 * FOSSIL_SHELL_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, special, holder, Stats.SpecialDefense, 100)).toBeCloseTo(
      100 * FOSSIL_SHELL_SCALE,
      5,
    );

    // Its own attacking side is untouched
    const thrown = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, thrown, holder, Stats.Attack, 100)).toBe(100);
  });

  it('cuts the shell off whatever the blade strikes', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.DomeBlade);

    const thrown = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, thrown, enemy, Stats.Defense, 100)).toBeCloseTo(
      100 * FOSSIL_BLADE_SCALE,
      5,
    );

    // And nothing when the blade is the one being struck
    const struck = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, struck, holder, Stats.Defense, 100)).toBe(100);
  });

  it('answers itself when the two meet', () => {
    const { battle, teamA, teamB } = createBattle();
    const shell = createUnit(battle, teamA);
    const blade = createUnit(battle, teamB);
    shell.addAbility(Abilities.HelixShell);
    blade.addAbility(Abilities.DomeBlade);

    const parent = makeAttack(blade, shell, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, shell, Stats.Defense, 100)).toBeCloseTo(
      100 * FOSSIL_SHELL_SCALE * FOSSIL_BLADE_SCALE,
      5,
    );
  });
});

describe("Predator's Dive", () => {
  it('is worth more against each enemy exactly once', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    holder.addAbility(Abilities.PredatorsDive);

    const atEnemy = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const atOther = makeAttack(holder, other, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, atEnemy, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * PREDATORS_DIVE_SCALE,
      5,
    );

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(resolveAttackStat(battle, atEnemy, holder, Stats.Attack, 100)).toBe(100);

    // Every new enemy is a new dive
    expect(resolveAttackStat(battle, atOther, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * PREDATORS_DIVE_SCALE,
      5,
    );
  });
});

describe('Full Belly', () => {
  it('feeds itself every time it acts and is slower for it', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.FullBelly);

    const bare = createUnit(battle, teamA).checkMoveCastTime(Moves.Flamethrower, {
      type: MoveTargetType.None,
    });
    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    act(battle, holder);

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * FULL_BELLY_HEAL_FRACTION, 5);
    expect(holder.checkMoveCastTime(Moves.Flamethrower, { type: MoveTargetType.None })).toBeCloseTo(
      bare * FULL_BELLY_CAST_SCALE,
      5,
    );
  });
});

describe('the creation trio', () => {
  const DRAGS = [
    { name: 'Time Drag', ability: Abilities.TimeDrag, stage: Stages.Speed },
    { name: 'Space Drift', ability: Abilities.SpaceDrift, stage: Stages.Accuracy },
    { name: 'Void Weight', ability: Abilities.VoidWeight, stage: Stages.Attack },
  ];

  for (const { name, ability, stage } of DRAGS) {
    it(`${name} costs the far side a stage for as long as it stands`, () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      expect(enemy.checkStage(stage, 0)).toBe(0);

      holder.addAbility(ability);

      expect(enemy.checkStage(stage, 0)).toBe(-1);
      // Its own side reads what it always read, itself included
      expect(mate.checkStage(stage, 0)).toBe(0);
      expect(holder.checkStage(stage, 0)).toBe(0);

      // Nothing is written to the enemy, so it comes straight back
      holder.removeAbility(ability);

      expect(enemy.checkStage(stage, 0)).toBe(0);
    });
  }

  it('two of them never stack on the same stage', () => {
    const { battle, teamA, teamB } = createBattle();
    const first = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    first.addAbility(Abilities.TimeDrag);
    second.addAbility(Abilities.TimeDrag);

    expect(enemy.checkStage(Stages.Speed, 0)).toBe(-1);
  });
});

describe('the lake trio', () => {
  const GIFTS = [
    { name: 'Mindgift', ability: Abilities.Mindgift, stage: Stages.Accuracy },
    { name: 'Heartgift', ability: Abilities.Heartgift, stage: Stages.SpecialAttack },
    { name: 'Willgift', ability: Abilities.Willgift, stage: Stages.Attack },
  ];

  for (const { name, ability, stage } of GIFTS) {
    it(`hands its own side a stage as ${name} arrives`, () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      holder.addAbility(ability);

      battle.emit(BattleEvents.UnitEntersField, {
        id: 'UnitEntersField',
        disabled: false,
        source: holder,
        reactivation: false,
      });

      // Itself included: it is standing at its own lake
      expect(holder.stages[stage]).toBe(1);
      expect(mate.stages[stage]).toBe(1);
      // And the far side gets nothing
      expect(enemy.stages[stage]).toBe(0);
    });
  }

  it('gives nothing back when it is only reactivated', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Mindgift);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: true,
    });

    expect(holder.stages[Stages.Accuracy]).toBe(0);
  });
});

describe('the birds', () => {
  const WINGBEATS = [
    { name: 'Frostwing', ability: Abilities.Frostwing, stage: Stages.Speed },
    { name: 'Stormwing', ability: Abilities.Stormwing, stage: Stages.SpecialDefense },
    { name: 'Emberwing', ability: Abilities.Emberwing, stage: Stages.Defense },
  ];

  for (const { name, ability, stage } of WINGBEATS) {
    it(`takes a stage off the whole far side as ${name} arrives`, () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const ally = createUnit(battle, teamA);
      const first = createUnit(battle, teamB);
      const second = createUnit(battle, teamB);
      holder.addAbility(ability);

      battle.emit(BattleEvents.UnitEntersField, {
        id: 'UnitEntersField',
        disabled: false,
        source: holder,
        reactivation: false,
      });

      expect(first.stages[stage]).toBe(-1);
      expect(second.stages[stage]).toBe(-1);
      // Its own side stands where it was
      expect(ally.stages[stage]).toBe(0);
      expect(holder.stages[stage]).toBe(0);
    });
  }

  it('beats nothing on a bird that was only reactivated', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Frostwing);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: true,
    });

    expect(enemy.stages[Stages.Speed]).toBe(0);
  });
});

describe('Serene Storm', () => {
  it('holds its weather out and keeps its own side out of it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SereneStorm);

    // Whatever it calls up is called up to stay
    expect(holder.checkWeatherDuration(Weathers.Sandstorm, turns(5))).toBe(0);
    expect(enemy.checkWeatherDuration(Weathers.Sandstorm, turns(5))).toBe(turns(5));

    const sand = { type: EffectType.Weather, weather: Weathers.Sandstorm, unit: ally } as const;

    expect(ally.checkCanDamage(sand, ally, 10, 0)).toBe(false);
    expect(enemy.checkCanDamage({ ...sand, unit: enemy }, enemy, 10, 0)).toBe(true);
  });
});

describe('Genetic Apex', () => {
  it('sharpens what it is best at and dulls what it is worst at', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    holder.addAbility(Abilities.GeneticApex);

    for (const unit of [holder, bare]) {
      unit.setStat(StatsKind.Base, Stats.SpecialAttack, 200);
      unit.setStat(StatsKind.Base, Stats.Defense, 40);
    }

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
      bare.checkStat(Stats.SpecialAttack, 0) * GENETIC_APEX_HIGHEST_SCALE,
      5,
    );
    expect(holder.checkStat(Stats.Defense, 0)).toBeCloseTo(
      bare.checkStat(Stats.Defense, 0) * GENETIC_APEX_LOWEST_SCALE,
      5,
    );
    expect(holder.checkStat(Stats.Speed, 0)).toBe(bare.checkStat(Stats.Speed, 0));
  });
});

describe('Ancestral Memory', () => {
  it('remembers each type after it has met it once', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.AncestralMemory);

    const fire = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);
    const normal = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, fire, enemy, Stats.SpecialAttack, 100)).toBe(100);

    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(resolveAttackStat(battle, fire, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * ANCESTRAL_MEMORY_SCALE,
      5,
    );

    // A type it has not met yet still lands in full, and the memory of
    // the first one stays
    expect(resolveAttackStat(battle, normal, enemy, Stats.Attack, 100)).toBe(100);

    enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(resolveAttackStat(battle, normal, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * ANCESTRAL_MEMORY_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, fire, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * ANCESTRAL_MEMORY_SCALE,
      5,
    );
  });
});
