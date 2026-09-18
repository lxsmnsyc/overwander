// Spinda through Deoxys.

import { describe, expect, it } from 'vitest';
import {
  ECLIPSE_LOWERED_SCALE,
  ECLIPSE_RAISED_SCALE,
  EON_LANCE_SCALE,
  EON_SHIELD_SCALE,
  FEUD_SCALE,
  FOSSIL_HOLD_DURATION,
  FOSSIL_HOLD_SCALE,
  FOSSIL_RUSH_SCALE,
  PRIMAL_SCALE,
  PRIMAL_STAGES,
  PRIMAL_THRESHOLD,
  SEALED_DURATION,
  SEALED_SCALE,
  WOKEN_SCALE,
  WOKEN_STAGES,
} from '../../../../src/battle/abilities/signature/__create';
import type Battle from '../../../../src/battle/core';
import { BattleEvents, EffectType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { Stages, Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses, TeamStatuses, Weathers } from '../../../../src/data/ids/status';
import {
  ANTLION_PIT_FRACTION,
  APPLAUSE_FRACTION,
  BLEND_IN_DELAY,
  BLEND_IN_SCALE,
  COLD_SNAP_CHANCE,
  DIRTY_FIGHTER_SCALE,
  DOOM_MARK_DURATION,
  DOOM_MARK_SCALE,
  FORM_DRIFT_INTERVAL,
  FRUIT_CROP_INTERVAL,
  HIVE_MIND_MAX_ALLIES,
  HIVE_MIND_STEP,
  MALICE_POOL_MAX_STAGES,
  MALICE_POOL_STEP,
  PATIENT_STALK_MAX_STEPS,
  PATIENT_STALK_SECOND,
  PATIENT_STALK_STEP,
  PEARL_GUARD_SCALE,
  RINGING_HEAD_SCALE,
  SCARRED_BEAUTY_SCALE,
  SEVEN_WISHES_COUNT,
  SEVEN_WISHES_FRACTION,
  SHARED_HEART_SHARE,
  SILT_BED_SCALE,
  SKULL_CHARGE_RECOIL,
  SKULL_CHARGE_SCALE,
  SOUL_HARVEST_FRACTION,
  UNIQUE_SPOTS_LOWERED,
  UNIQUE_SPOTS_RAISED,
  WEATHER_WORN_DEALT_SCALE,
  WEATHER_WORN_TAKEN_SCALE,
} from '../../../../src/battle/abilities/signature/spoink-to-deoxys';
import turns from '../../../../src/battle/turn';
import { unitTarget } from '../../../../src/battle/utils';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, dealDamage, makeAttack, resolveAttackDamage, rollMove } from './helpers';

describe('Unique Spots', () => {
  it('rolls one stat up and a different one down as it arrives', () => {
    const { battle, teamA } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.UniqueSpots);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    const raised = [];
    const lowered = [];

    for (const stage of [
      Stages.Attack,
      Stages.Defense,
      Stages.SpecialAttack,
      Stages.SpecialDefense,
      Stages.Speed,
    ]) {
      if (holder.stages[stage] > 0) {
        raised.push(stage);
      }
      if (holder.stages[stage] < 0) {
        lowered.push(stage);
      }
    }

    expect(raised).toHaveLength(1);
    expect(lowered).toHaveLength(1);
    expect(holder.stages[raised[0]]).toBe(UNIQUE_SPOTS_RAISED);
    expect(holder.stages[lowered[0]]).toBe(-UNIQUE_SPOTS_LOWERED);
  });
});

describe('Antlion Pit', () => {
  it('costs whoever misses it a share of their own HP', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.AntlionPit);

    const maxHP = enemy.checkStat(Stats.HP, 0);

    // Hypnosis is a 60-accuracy move, so a pinned roll of 1 misses it
    pinRandom(battle, 1);

    rollMove(battle, enemy, holder, Moves.Hypnosis, false);

    expect(maxHP - enemy.health).toBeCloseTo(maxHP * ANTLION_PIT_FRACTION, 5);

    // And the same move landing costs nothing
    enemy.setHealth(maxHP);
    pinRandom(battle, 0);

    rollMove(battle, enemy, holder, Moves.Hypnosis, false);

    expect(enemy.health).toBe(maxHP);
  });
});

describe('Patient Stalk', () => {
  it('banks the wait and spends it on one blow', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.PatientStalk);

    const target = unitTarget(enemy);
    const clean = bare.checkMovePower(Moves.Pound, target) ?? 0;

    battle.tick(PATIENT_STALK_SECOND * 2);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
      clean * (1 + PATIENT_STALK_STEP * 2),
      5,
    );

    // The wait stops counting at the cap
    battle.tick(PATIENT_STALK_SECOND * (PATIENT_STALK_MAX_STEPS + 3));

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
      clean * (1 + PATIENT_STALK_STEP * PATIENT_STALK_MAX_STEPS),
      5,
    );

    // And a landed blow spends the lot
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean, 5);
  });
});

describe('Cloud Step', () => {
  it('takes the first blow of a battle and nothing after it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CloudStep);

    const maxHP = holder.checkStat(Stats.HP, 0);

    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, 40, 0);

    expect(holder.health).toBe(maxHP);

    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, 40, 0);

    expect(maxHP - holder.health).toBeCloseTo(40, 5);
  });
});

describe('the Zangoose and Seviper pair', () => {
  it('works the venom deeper on one side and hunts it on the other', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const zangoose = createUnit(battle, teamA);
    const seviper = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    zangoose.addAbility(Abilities.FeudClaws);
    seviper.addAbility(Abilities.DeepeningVenom);

    const target = unitTarget(enemy);
    const clean = zangoose.checkMovePower(Moves.Pound, target) ?? 0;

    // A clean target is nothing to either of them
    seviper.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.status[Statuses.BadlyPoisoned]).toBeUndefined();
    expect(zangoose.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean, 5);

    // Somebody else's poison is what Seviper works on
    enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(zangoose.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean * FEUD_SCALE, 5);

    seviper.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.status[Statuses.Poisoned]).toBeUndefined();
    expect(enemy.status[Statuses.BadlyPoisoned]).not.toBeUndefined();
    expect(zangoose.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean * FEUD_SCALE, 5);
  });
});

describe('the Lunatone and Solrock pair', () => {
  it('hangs one aura each, over opposite sides', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const solrock = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const clean = resolveAttackDamage(battle, solrock, enemy);

    solrock.addAbility(Abilities.SunGlare);

    expect(resolveAttackDamage(battle, solrock, enemy)).toBeCloseTo(
      clean * ECLIPSE_RAISED_SCALE,
      5,
    );

    const lunatone = createUnit(battle, teamB);
    const bare = resolveAttackDamage(battle, solrock, enemy);

    lunatone.addAbility(Abilities.MoonPull);

    // Two stones in the sky is an eclipse, so neither aura applies
    expect(resolveAttackDamage(battle, solrock, enemy)).toBeCloseTo(bare / ECLIPSE_RAISED_SCALE, 5);

    lunatone.faint(solrock);

    expect(resolveAttackDamage(battle, solrock, enemy)).toBeCloseTo(bare, 5);
  });

  it('covers its own side with the moon and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const lunatone = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const inbound = resolveAttackDamage(battle, enemy, ally);
    const outbound = resolveAttackDamage(battle, ally, enemy);

    lunatone.addAbility(Abilities.MoonPull);

    expect(resolveAttackDamage(battle, enemy, ally)).toBeCloseTo(
      inbound * ECLIPSE_LOWERED_SCALE,
      5,
    );
    expect(resolveAttackDamage(battle, ally, enemy)).toBeCloseTo(outbound, 5);
  });
});

describe('Silt Bed', () => {
  it('slows everything standing in it, its own side included', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const ours = ally.checkStat(Stats.Speed, 0);
    const theirs = enemy.checkStat(Stats.Speed, 0);

    holder.addAbility(Abilities.SiltBed);

    expect(ally.checkStat(Stats.Speed, 0)).toBeCloseTo(ours * SILT_BED_SCALE, 5);
    expect(enemy.checkStat(Stats.Speed, 0)).toBeCloseTo(theirs * SILT_BED_SCALE, 5);

    // Anything off the ground is above the silt
    enemy.addAbility(Abilities.Levitate);

    expect(enemy.checkStat(Stats.Speed, 0)).toBeCloseTo(theirs, 5);
  });
});

describe('Dirty Fighter', () => {
  it('hits an untouched target harder and a hurt one normally', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.DirtyFighter);

    const target = unitTarget(enemy);
    const clean = enemy.checkMovePower(Moves.Pound, target) ?? 0;

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean * DIRTY_FIGHTER_SCALE, 5);

    enemy.setHealth(enemy.checkStat(Stats.HP, 0) - 1);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean, 5);
  });
});

describe('Spin Balance', () => {
  it('refuses a flinch, a forced switch and a stage drop', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SpinBalance);

    holder.addStatus(Statuses.Flinched, NONE_CAUSE);

    expect(holder.status[Statuses.Flinched]).toBeUndefined();

    holder.addStage(Stages.Attack, -1, NONE_CAUSE);

    expect(holder.stages[Stages.Attack]).toBe(0);

    // A raise is still a raise
    holder.addStage(Stages.Attack, 1, NONE_CAUSE);

    expect(holder.stages[Stages.Attack]).toBe(1);

    expect(enemy.checkMoveImmunity(Moves.Whirlwind, unitTarget(holder), Types.Normal)).toBe(true);
  });
});

describe('the Lileep and Anorith pair', () => {
  it('pins what it hits, and runs down whatever cannot keep up', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const lileep = createUnit(battle, teamA);
    const anorith = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    lileep.addAbility(Abilities.RootHold);
    anorith.addAbility(Abilities.ClawRush);

    const target = unitTarget(enemy);
    const clean = enemy.checkStat(Stats.Speed, 0);
    const power = enemy.checkMovePower(Moves.Pound, target) ?? 0;

    // Anorith is no faster than the enemy to begin with
    expect(anorith.checkMovePower(Moves.Pound, target)).toBeCloseTo(power, 5);

    lileep.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.checkStat(Stats.Speed, 0)).toBeCloseTo(clean * FOSSIL_HOLD_SCALE, 5);
    expect(enemy.checkEscape()).toBe(false);

    // What the roots leave behind is exactly what the claws are for
    expect(anorith.checkMovePower(Moves.Pound, target)).toBeCloseTo(power * FOSSIL_RUSH_SCALE, 5);

    battle.tick(FOSSIL_HOLD_DURATION);

    expect(enemy.checkStat(Stats.Speed, 0)).toBeCloseTo(clean, 5);
    expect(enemy.checkEscape()).toBe(true);
  });
});

describe('Scarred Beauty', () => {
  it('answers with what it is carrying', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    holder.addAbility(Abilities.ScarredBeauty);

    const clean = bare.checkStat(Stats.SpecialAttack, 0);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(clean, 5);

    holder.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(clean * SCARRED_BEAUTY_SCALE, 5);

    // Only the special half, and only a major status
    expect(holder.checkStat(Stats.Attack, 0)).toBeCloseTo(bare.checkStat(Stats.Attack, 0), 5);
  });
});

describe('Weather Worn', () => {
  it('is worth something under any sky and nothing under none', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.WeatherWorn);

    const dealt = resolveAttackDamage(battle, holder, enemy);
    const taken = resolveAttackDamage(battle, enemy, holder);

    holder.setWeather(Weathers.Hail);

    expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(
      dealt * WEATHER_WORN_DEALT_SCALE,
      5,
    );
    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(
      taken * WEATHER_WORN_TAKEN_SCALE,
      5,
    );

    holder.setWeather(Weathers.None);

    expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(dealt, 5);
  });
});

describe('Blend In', () => {
  it('hides it once it has stood still, and gives it away when it moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.BlendIn);

    const target = unitTarget(holder);
    const clean = enemy.checkMoveAccuracy(Moves.Pound, target);

    // Not yet still for long enough
    battle.tick(BLEND_IN_DELAY / 2);

    expect(enemy.checkMoveAccuracy(Moves.Pound, target)).toBe(clean);

    battle.tick(BLEND_IN_DELAY / 2);

    expect(enemy.checkMoveAccuracy(Moves.Pound, target)).toBeCloseTo(
      (clean ?? 0) * BLEND_IN_SCALE,
      5,
    );

    // Reaching for a move gives it away at once
    act(battle, holder);

    expect(enemy.checkMoveAccuracy(Moves.Pound, target)).toBe(clean);
  });

  it('covers it through the gaps of a real attacking loop', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.BlendIn);
    holder.addMove(Moves.Pound);

    const target = unitTarget(holder);
    const clean = enemy.checkMoveAccuracy(Moves.Pound, target) ?? 0;

    function hidden(): boolean {
      return (enemy.checkMoveAccuracy(Moves.Pound, target) ?? 0) < clean;
    }

    // A cast, then the wait that follows it: the cover comes back 2
    // seconds into the wait and holds until it reaches for the next move
    holder.cast(Moves.Pound, unitTarget(enemy));
    battle.tick(turns(2));

    expect(holder.casting).toBeUndefined();
    expect(hidden()).toBe(true);

    act(battle, holder);

    expect(hidden()).toBe(false);
  });
});

describe('Malice Pool', () => {
  it('reads how far the target has been worked down', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.MalicePool);

    const target = unitTarget(enemy);
    const clean = enemy.checkMovePower(Moves.Pound, target) ?? 0;

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean, 5);

    enemy.addStage(Stages.Attack, -2, NONE_CAUSE);
    enemy.addStage(Stages.Speed, -1, NONE_CAUSE);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
      clean * (1 + MALICE_POOL_STEP * 3),
      5,
    );

    // Raises count for nothing, and the pool has a floor to it
    enemy.addStage(Stages.Defense, 3, NONE_CAUSE);
    enemy.addStage(Stages.SpecialAttack, -6, NONE_CAUSE);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
      clean * (1 + MALICE_POOL_STEP * MALICE_POOL_MAX_STAGES),
      5,
    );
  });
});

describe('Soul Harvest', () => {
  it('takes its cut of anything that falls, either side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SoulHarvest);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(1);

    enemy.faint(holder);

    expect(holder.health).toBeCloseTo(1 + maxHP * SOUL_HARVEST_FRACTION, 5);

    holder.setHealth(1);
    ally.faint(enemy);

    expect(holder.health).toBeCloseTo(1 + maxHP * SOUL_HARVEST_FRACTION, 5);
  });
});

describe('Fruit Crop', () => {
  it('grows a berry on the clock while its hands are empty', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.FruitCrop);

    battle.tick(FRUIT_CROP_INTERVAL);

    expect(holder.items[Items.SitrusBerry]).not.toBeUndefined();

    // Nothing grows into a full hand
    holder.removeItem(Items.SitrusBerry, NONE_CAUSE);
    holder.addItem(Items.Leftovers);
    battle.tick(FRUIT_CROP_INTERVAL);

    expect(holder.items[Items.SitrusBerry]).toBeUndefined();
  });
});

describe('Ringing Head', () => {
  it('drags out what the far side winds up, and nothing of its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const theirs = enemy.checkMoveCastTime(Moves.Ember, unitTarget(ally));
    const ours = ally.checkMoveCastTime(Moves.Ember, unitTarget(enemy));

    holder.addAbility(Abilities.RingingHead);

    expect(enemy.checkMoveCastTime(Moves.Ember, unitTarget(ally))).toBeCloseTo(
      theirs * RINGING_HEAD_SCALE,
      5,
    );
    expect(ally.checkMoveCastTime(Moves.Ember, unitTarget(enemy))).toBeCloseTo(ours, 5);
  });
});

describe('Doom Mark', () => {
  it('marks what it hits, and the next blow spends the mark', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.DoomMark);

    const clean = dealDamage(ally, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    // An ally's blow is what the mark pays out on, and it pays once
    expect(
      dealDamage(ally, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(clean * DOOM_MARK_SCALE, 5);
    expect(
      dealDamage(ally, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(clean, 5);

    // And an unspent mark lets go on its own
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(DOOM_MARK_DURATION);

    expect(
      dealDamage(ally, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(clean, 5);
  });
});

describe('Cold Snap', () => {
  it('freezes whoever touches it, on the roll', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.ColdSnap);

    // A roll under the chance takes hold
    pinRandom(battle, COLD_SNAP_CHANCE - 0.01);
    enemy.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.status[Statuses.Frozen]).not.toBeUndefined();

    // A roll over it does not, and neither does a move that never
    // touched it
    const second = createUnit(battle, teamB);

    pinRandom(battle, 1);
    second.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(second.status[Statuses.Frozen]).toBeUndefined();

    pinRandom(battle, 0);
    second.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(second.status[Statuses.Frozen]).toBeUndefined();
  });
});

describe('Applause', () => {
  it('claps for the rest of its side and nothing for itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Applause);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    rollMove(battle, ally, enemy, Moves.Pound, true);

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * APPLAUSE_FRACTION, 5);

    // Its own moves and the enemy's are worth nothing to it
    holder.setHealth(maxHP / 2);

    rollMove(battle, holder, enemy, Moves.Pound, true);
    rollMove(battle, enemy, holder, Moves.Pound, true);

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);
  });
});

describe('Pearl Guard', () => {
  it('is worth nothing with an empty shell', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    holder.addAbility(Abilities.PearlGuard);

    const special = bare.checkStat(Stats.SpecialAttack, 0);
    const defence = bare.checkStat(Stats.SpecialDefense, 0);
    const physical = bare.checkStat(Stats.Attack, 0);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(special, 5);

    holder.addItem(Items.Leftovers);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(special * PEARL_GUARD_SCALE, 5);
    expect(holder.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(defence * PEARL_GUARD_SCALE, 5);
    expect(holder.checkStat(Stats.Attack, 0)).toBeCloseTo(physical, 5);

    holder.removeItem(Items.Leftovers, NONE_CAUSE);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(special, 5);
  });
});

describe('Unchanged', () => {
  it('reads every type against it as neutral', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Unchanged);
    holder.addType(Types.Rock);

    function effectiveness(type: Types): number {
      const event = {
        id: 'UnitAttackResolveEffectiveness',
        disabled: false,
        parent: makeAttack(enemy, holder, Moves.Pound, type, MoveCategories.Physical),
        defendingType: Types.Rock,
        multiplier: 1,
      };
      battle.emit(BattleEvents.UnitAttackResolveEffectiveness, event);
      return event.multiplier;
    }

    // Water is 2x into Rock and Normal is 0.5x; both read neutral here
    expect(effectiveness(Types.Water)).toBe(1);
    expect(effectiveness(Types.Normal)).toBe(1);

    // And an immunity is no immunity either
    expect(enemy.checkMoveImmunity(Moves.ThunderWave, unitTarget(holder), Types.Ground)).toBe(
      false,
    );
  });
});

describe('Shared Heart', () => {
  it('takes half of whatever an ally is given', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    holder.addAbility(Abilities.SharedHeart);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);
    ally.setHealth(1);

    ally.heal(NONE_CAUSE, ally, 40, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + 40 * SHARED_HEART_SHARE, 5);

    // Two of them do not pass one heal back and forth
    const second = createUnit(battle, teamA);
    second.addAbility(Abilities.SharedHeart);
    holder.setHealth(maxHP / 2);
    second.setHealth(maxHP / 2);
    ally.setHealth(1);

    ally.heal(NONE_CAUSE, ally, 40, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + 40 * SHARED_HEART_SHARE, 5);
    expect(second.health).toBeCloseTo(maxHP / 2 + 40 * SHARED_HEART_SHARE, 5);
  });
});

describe('Skull Charge', () => {
  it('hits harder with contact and pays for it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SkullCharge);

    const clean = dealDamage(bare, enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);
    const maxHP = holder.checkStat(Stats.HP, 0);

    const dealt = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(dealt).toBeCloseTo(clean * SKULL_CHARGE_SCALE, 5);
    expect(maxHP - holder.health).toBeCloseTo(dealt * SKULL_CHARGE_RECOIL, 5);

    // A move that never touches costs it nothing and gains it nothing
    holder.setHealth(maxHP);

    const special = dealDamage(holder, enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special);
    const bareSpecial = dealDamage(
      bare,
      enemy,
      Moves.Ember,
      40,
      Types.Fire,
      MoveCategories.Special,
    );

    expect(special).toBeCloseTo(bareSpecial, 5);
    expect(holder.health).toBe(maxHP);
  });
});

describe('Hive Mind', () => {
  it('counts the others standing with it, up to the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HiveMind);

    const target = unitTarget(enemy);
    const clean = enemy.checkMovePower(Moves.Pound, target) ?? 0;

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean, 5);

    for (let allies = 1; allies <= HIVE_MIND_MAX_ALLIES + 1; allies += 1) {
      createUnit(battle, teamA);

      expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
        clean * (1 + HIVE_MIND_STEP * Math.min(HIVE_MIND_MAX_ALLIES, allies)),
        5,
      );
    }
  });
});

describe('the Regi trio', () => {
  const GOLEMS = [
    { name: 'Stone Seal', ability: Abilities.StoneSeal, stage: Stages.Defense },
    { name: 'Frost Seal', ability: Abilities.FrostSeal, stage: Stages.SpecialDefense },
    { name: 'Iron Seal', ability: Abilities.IronSeal, stage: Stages.Attack },
  ];

  for (const { name, ability, stage } of GOLEMS) {
    it(`stands sealed and then wakes for ${name}`, () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 0);
      const holder = createUnit(battle, teamA);
      const bare = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      holder.addAbility(ability);

      const clean = resolveAttackDamage(battle, bare, enemy);
      const incoming = resolveAttackDamage(battle, enemy, bare);

      // Sealed: half in both directions
      expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(clean * SEALED_SCALE, 5);
      expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(incoming * SEALED_SCALE, 5);

      battle.tick(SEALED_DURATION);

      // Woken: a quarter harder, taking blows in full, and two stages up
      expect(holder.stages[stage]).toBe(WOKEN_STAGES);
      expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(clean * WOKEN_SCALE, 5);
      expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(incoming, 5);

      // The seal breaks once
      battle.tick(SEALED_DURATION);

      expect(holder.stages[stage]).toBe(WOKEN_STAGES);
    });
  }
});

describe('the Latias and Latios pair', () => {
  it('covers everybody but itself', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const latias = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const onAlly = resolveAttackDamage(battle, enemy, ally);
    const onHer = resolveAttackDamage(battle, enemy, latias);

    latias.addAbility(Abilities.EonShield);

    expect(resolveAttackDamage(battle, enemy, ally)).toBeCloseTo(onAlly * EON_SHIELD_SCALE, 5);
    expect(resolveAttackDamage(battle, enemy, latias)).toBeCloseTo(onHer, 5);
  });

  it('flies through what the far side put up', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const latios = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    latios.addAbility(Abilities.EonLance);

    const clean = resolveAttackDamage(battle, bare, enemy);

    expect(resolveAttackDamage(battle, latios, enemy)).toBeCloseTo(clean * EON_LANCE_SCALE, 5);

    teamB.addStatus(TeamStatuses.Reflect, NONE_CAUSE);

    const screened = resolveAttackDamage(battle, bare, enemy);

    // The screen takes its cut off everybody else and nothing off him
    expect(screened).toBeLessThan(clean);
    expect(resolveAttackDamage(battle, latios, enemy)).toBeCloseTo(clean * EON_LANCE_SCALE, 5);
  });
});

describe('the weather trio', () => {
  const TITANS = [
    {
      name: 'Primal Sea',
      ability: Abilities.PrimalSea,
      stage: Stages.SpecialAttack,
      type: Types.Water,
      move: Moves.WaterGun,
    },
    {
      name: 'Primal Land',
      ability: Abilities.PrimalLand,
      stage: Stages.Attack,
      type: Types.Ground,
      move: Moves.MudSlap,
    },
    {
      name: 'Primal Sky',
      ability: Abilities.PrimalSky,
      stage: Stages.SpecialAttack,
      type: Types.Dragon,
      move: Moves.DragonBreath,
    },
  ];

  function resolve(battle: Battle, attacker: Unit, target: Unit, type: Types, move: Moves): number {
    const event = {
      id: 'UnitAttackResolveDamage',
      disabled: false,
      parent: makeAttack(attacker, target, move, type, MoveCategories.Special),
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackResolveDamage, event);
    return event.value;
  }

  for (const { name, ability, stage, type, move } of TITANS) {
    it(`wakes once and stays awake for ${name}`, () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 0);
      const holder = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      holder.addAbility(ability);

      const clean = resolve(battle, holder, enemy, type, move);
      const maxHP = holder.checkStat(Stats.HP, 0);

      expect(holder.stages[stage]).toBe(0);

      holder.setHealth(maxHP * PRIMAL_THRESHOLD + 10);
      enemy.damage(NONE_CAUSE, holder, 20, 0);

      expect(holder.stages[stage]).toBe(PRIMAL_STAGES);
      expect(resolve(battle, holder, enemy, type, move)).toBeCloseTo(clean * PRIMAL_SCALE, 5);

      // Its other elements are untouched, and the waking is once only
      expect(resolve(battle, holder, enemy, Types.Normal, Moves.Pound)).toBeCloseTo(
        resolve(battle, enemy, holder, Types.Normal, Moves.Pound),
        5,
      );

      enemy.damage(NONE_CAUSE, holder, 1, 0);

      expect(holder.stages[stage]).toBe(PRIMAL_STAGES);
    });
  }
});

describe('Seven Wishes', () => {
  it('grants the lot on the seventh time it acts', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    holder.addAbility(Abilities.SevenWishes);

    const maxHP = ally.checkStat(Stats.HP, 0);
    ally.setHealth(1);
    ally.addStatus(Statuses.Poisoned, NONE_CAUSE);
    holder.addStatus(Statuses.Poisoned, NONE_CAUSE);

    for (let asked = 1; asked < SEVEN_WISHES_COUNT; asked += 1) {
      act(battle, holder);
    }

    expect(ally.health).toBe(1);

    act(battle, holder);

    expect(ally.health).toBeCloseTo(1 + maxHP * SEVEN_WISHES_FRACTION, 5);

    // The cure is for the wish-granter alone
    expect(ally.status[Statuses.Poisoned]).not.toBeUndefined();
    expect(holder.status[Statuses.Poisoned]).toBeUndefined();

    // The count starts again from nothing
    ally.setHealth(1);

    act(battle, holder);

    expect(ally.health).toBe(1);
  });
});

describe('Form Drift', () => {
  it('drifts further into whatever shape it is already in', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.FormDrift);

    holder.setStat(StatsKind.Base, Stats.Attack, 200);
    holder.setStat(StatsKind.Base, Stats.Defense, 20);

    battle.tick(FORM_DRIFT_INTERVAL);

    expect(holder.stages[Stages.Attack]).toBe(1);
    expect(holder.stages[Stages.Defense]).toBe(-1);

    battle.tick(FORM_DRIFT_INTERVAL);

    expect(holder.stages[Stages.Attack]).toBe(2);
    expect(holder.stages[Stages.Defense]).toBe(-2);
  });
});
