import { describe, expect, it } from 'vitest';
import registerAbilities, {
  getAbilityData,
  getRegisteredAbilities,
} from '../../../src/data/abilities';
import { SIGNATURE_ABILITIES } from '../../../src/battle/abilities/signature';
import {
  CHEER_MAX_SHOUTS,
  ECLIPSE_LOWERED_SCALE,
  ECLIPSE_RAISED_SCALE,
  EON_LANCE_SCALE,
  EON_SHIELD_SCALE,
  FEUD_SCALE,
  FIELD_LOWERED_SCALE,
  FIELD_RAISED_SCALE,
  FOSSIL_BLADE_SCALE,
  FOSSIL_HOLD_DURATION,
  FOSSIL_HOLD_SCALE,
  FOSSIL_RUSH_SCALE,
  FOSSIL_SHELL_SCALE,
  GROVE_DAMAGE_SCALE,
  GROVE_HEAL_FRACTION,
  GROWTH_MAX_STAGES,
  MARK_DEEP_FRACTION,
  MARK_FRACTION,
  PRIMAL_SCALE,
  PRIMAL_STAGES,
  PRIMAL_THRESHOLD,
  REGAL_COURT_MAX_ENEMIES,
  REGAL_COURT_STEP,
  SEALED_DURATION,
  SEALED_SCALE,
  WOKEN_SCALE,
  WOKEN_STAGES,
} from '../../../src/battle/abilities/signature/__create';
import {
  BACKLASH_SHARE,
  BULLY_SCALE,
  ESCORT_SCALE,
  MAGMA_TRAIL_FRACTION,
  MIND_FOG_SCALE,
  MOMENTUM_MAX_STACKS,
  MOMENTUM_STEP,
  RAINBOW_REKINDLING_FRACTION,
  SAND_RIDER_SCALE,
  SHARED_MISERY_THRESHOLD,
  SUNLIT_CHARGE_SCALE,
  SWEET_PAW_SHARE,
  TIMELINE_SPLIT_THRESHOLD,
} from '../../../src/battle/abilities/signature/chikorita-to-celebi';
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
} from '../../../src/battle/abilities/signature/eevee-to-dragonite';
import {
  CHORUS_SCALE,
  FLOCK_CEILING,
  FLOCK_SCALE,
  LODGE_SCALE,
} from '../../../src/battle/abilities/signature/starly-to-kricketot';
import { AttackPriority } from '../../../src/core/event-emitter';
import {
  CHAIN_LIGHTNING_FRACTION,
  NIBBLE_FRACTION,
  RELENTLESS_MAX_STACKS,
  RELENTLESS_STEP,
  SLIPSTREAM_SCALE,
  SQUEEZE_FRACTION,
  SQUEEZE_INTERVAL,
  TWIN_STINGER_POWER_SCALE,
} from '../../../src/battle/abilities/signature/bulbasaur-to-pikachu';
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
} from '../../../src/battle/abilities/signature/krabby-to-pinsir';
import {
  DELAYED_REACTION_DELAY,
  DELAYED_REACTION_SHARE,
  DREAM_FEAST_FRACTION,
  GALLOP_MAX_STACKS,
  GALLOP_STEP,
  LEEK_DUELIST_CRITICAL_SCALE,
  LEEK_DUELIST_CRITICAL_STAGES,
  LEEK_DUELIST_EXPOSED_SCALE,
  LIVING_TUNNEL_ALLY_SCALE,
  LIVING_TUNNEL_SELF_SCALE,
  NIGHT_TERROR_DURATION,
  REPULSION_FIELD_SCALE,
  SECOND_HEAD_INTERVAL,
  SECOND_HEAD_POWER_SCALE,
  SLEEK_HIDE_CONTACT_SCALE,
  SLEEK_HIDE_RANGED_SCALE,
  SOLID_CORE_PHYSICAL_SCALE,
  SOLID_CORE_SPECIAL_SCALE,
  SPIKE_SHELL_CONTACT_SCALE,
  SPIKE_SHELL_FRACTION,
} from '../../../src/battle/abilities/signature/geodude-to-drowzee';
import {
  BLIND_RAGE_ACCURACY_SCALE,
  BLIND_RAGE_ATTACK_SCALE,
  CHASE_DOWN_SCALE,
  CHASE_DOWN_THRESHOLD,
  DIGEST_HEAL_FRACTION,
  DIGEST_THRESHOLD,
  DUST_STORM_MAX_STACKS,
  DUST_STORM_STEP,
  FUNGAL_BLOOM_FRACTION,
  HEADACHE_BURST_SCALE,
  HYPNOTIC_SPIRAL_CAST_SCALE,
  OVERHEAD_THROW_HEAVY_SCALE,
  OVERHEAD_THROW_LIGHT_SCALE,
  TELEPORT_GUARD_WINDOW,
  UNDERMINE_MAX_STACKS,
  UNDERMINE_STEP,
} from '../../../src/battle/abilities/signature/paras-to-tentacool';
import {
  BLOODTHIRST_DRAIN_SCALE,
  BLOODTHIRST_HEAL_SCALE,
  LULLABY_POWER_SCALE,
  LULLABY_SLEEP_SCALE,
  NINE_TAILS_MAX_STACKS,
  NINE_TAILS_STEP,
} from '../../../src/battle/abilities/signature/sandshrew-to-oddish';
import type Battle from '../../../src/battle/core';
import {
  BattleEvents,
  EffectType,
  type MoveTarget,
  MoveTargetType,
  type UnitAttackEvent,
} from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import {
  DamageFlags,
  MoveCategories,
  MoveTargets,
  Moves,
  StatFlags,
} from '../../../src/data/ids/moves';
import { Statuses, TeamStatuses, Weathers } from '../../../src/data/ids/status';
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
  STORED_BOUNCE_CAP,
  STORED_BOUNCE_SHARE,
  UNIQUE_SPOTS_LOWERED,
  UNIQUE_SPOTS_RAISED,
  WEATHER_WORN_DEALT_SCALE,
  WEATHER_WORN_TAKEN_SCALE,
} from '../../../src/battle/abilities/signature/spoink-to-deoxys';
import turns from '../../../src/battle/turn';
import { layersUnder } from '../../../src/battle/moves/spikes';
import {
  BODY_HEAT_SCALE,
  BOTTOMLESS_FRACTION,
  COCOON_DURATION,
  COCOON_SCALE,
  COCOON_THRESHOLD,
  CROOKED_RUN_MAX_STACKS,
  CROOKED_RUN_SCALE,
  ECHO_CHAMBER_DELAY,
  ECHO_CHAMBER_FRACTION,
  EMPATH_SCALE,
  EMPATH_THRESHOLD,
  FEEDING_FRENZY_MAX_STAGES,
  GULLS_GREED_SHARE,
  JOLT_START_SCALE,
  KITTEN_PACE_SCALE,
  LURE_SCENT_SCALE,
  MAGMA_VENT_FRACTION,
  MAGMA_VENT_THRESHOLD,
  MIND_OVER_BODY_SCALE,
  MYCELIUM_SCALE,
  ORE_HUNGER_FRACTION,
  PACK_HUNT_SCALE,
  PERENNIAL_HEAL_FRACTION,
  PERENNIAL_THRESHOLD,
  VANISHING_ACT_DURATION,
} from '../../../src/battle/abilities/signature/treecko-to-torkoal';
import { unitTarget } from '../../../src/battle/utils';
import { SWITCHING_SPAN } from '../../../src/battle/status/switching';
import Team from '../../../src/battle/team';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_CAUSE = { type: EffectType.None } as const;

/**
 * How deep a chain of answers is allowed to run before a test calls
 * it runaway. Ordinary play nests about a dozen events
 */
const RUNAWAY_DEPTH = 200;

/** The bus as a plain emitter, so a test can count what goes over it */
interface Emitting {
  emit(type: never, event: never): void;
}

/** Deterministic direct attack; returns the health lost by the target */
function dealDamage(
  attacker: ReturnType<typeof createUnit>,
  defender: ReturnType<typeof createUnit>,
  move: Moves,
  power: number,
  type: Types,
  category: MoveCategories,
): number {
  const before = defender.health;
  attacker.attack(defender, move, power, type, category, 0);
  return before - defender.health;
}

/** The unit reaching for a move, which is when a residual is paid */
function act(battle: Battle, unit: Unit): void {
  battle.emit(BattleEvents.UnitCast, {
    id: 'UnitCast',
    disabled: false,
    source: unit,
    move: Moves.Tackle,
    target: { type: MoveTargetType.None },
  });
}

/** A synthetic blow, for the resolvers that answer questions about one */
function makeAttack(
  source: Unit,
  target: Unit,
  move: Moves,
  type: Types,
  category: MoveCategories,
): UnitAttackEvent {
  return {
    id: 'UnitAttack',
    disabled: false,
    source,
    target,
    move,
    value: 0,
    category,
    type,
    flags: 0,
    success: false,
  };
}

function resolveAttackStat(
  battle: Battle,
  parent: UnitAttackEvent,
  unit: Unit,
  stat: Stats,
  value: number,
): number {
  const event = {
    id: 'UnitAttackResolveStat',
    disabled: false,
    parent,
    unit,
    stat,
    value,
  };
  battle.emit(BattleEvents.UnitAttackResolveStat, event);
  return event.value;
}

/** Whether the blow lands once every listener has answered for it */
function rolled(battle: Battle, source: Unit, target: Unit, move: Moves): boolean {
  const event = {
    id: 'UnitTriggerMoveRollHit',
    disabled: false,
    parent: {
      id: 'UnitTriggerMove',
      disabled: false,
      source,
      move,
      target: { type: MoveTargetType.Unit, unit: target } as const,
      steps: 0,
    },
    hit: true,
  };
  battle.emit(BattleEvents.UnitTriggerMoveRollHit, event);
  return event.hit;
}

describe('the Kanto starters', () => {
  const FIELDS = [
    {
      name: 'Verdant Field',
      ability: Abilities.VerdantField,
      raised: Types.Grass,
      lowered: Types.Water,
    },
    {
      name: 'Ember Field',
      ability: Abilities.EmberField,
      raised: Types.Fire,
      lowered: Types.Grass,
    },
    {
      name: 'Deluge Field',
      ability: Abilities.DelugeField,
      raised: Types.Water,
      lowered: Types.Fire,
    },
  ];

  function resolve(battle: Battle, attacker: Unit, target: Unit, type: Types): number {
    const event = {
      id: 'UnitAttackResolveDamage',
      disabled: false,
      parent: makeAttack(attacker, target, Moves.Pound, type, MoveCategories.Special),
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackResolveDamage, event);
    return event.value;
  }

  for (const { name, ability, raised, lowered } of FIELDS) {
    it(`tilts the field both ways for ${name}`, () => {
      const { battle, teamA, teamB } = createBattle();
      // The damage roll is pinned, so the blows differ only by the tilt
      pinRandom(battle, 0);
      const holder = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      const bareRaised = resolve(battle, enemy, holder, raised);
      const bareLowered = resolve(battle, enemy, holder, lowered);

      holder.addAbility(ability);

      // Both sides stand in it: this is the enemy throwing them
      expect(resolve(battle, enemy, holder, raised)).toBeCloseTo(
        bareRaised * FIELD_RAISED_SCALE,
        5,
      );
      expect(resolve(battle, enemy, holder, lowered)).toBeCloseTo(
        bareLowered * FIELD_LOWERED_SCALE,
        5,
      );
      // Anything else is thrown as usual
      expect(resolve(battle, enemy, holder, Types.Normal)).toBeCloseTo(
        resolve(battle, holder, enemy, Types.Normal),
        5,
      );
    });
  }
});

function rollMove(battle: Battle, source: Unit, target: Unit, move: Moves, hit: boolean): void {
  battle.emit(BattleEvents.UnitTriggerMoveRollHit, {
    id: 'UnitTriggerMoveRollHit',
    disabled: false,
    parent: {
      id: 'UnitTriggerMove',
      disabled: false,
      source,
      move,
      target: { type: MoveTargetType.Unit, unit: target },
      steps: 0,
    },
    hit,
  });
}

describe('Slipstream', () => {
  it('shortens what its own side winds up and leaves the enemy alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const target = unitTarget(enemy);
    const bare = ally.checkMoveCastTime(Moves.Flamethrower, target);
    const theirs = enemy.checkMoveCastTime(Moves.Flamethrower, unitTarget(ally));

    holder.addAbility(Abilities.Slipstream);

    expect(ally.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * SLIPSTREAM_SCALE,
      5,
    );
    expect(enemy.checkMoveCastTime(Moves.Flamethrower, unitTarget(ally))).toBeCloseTo(theirs, 5);
  });
});

describe('Nibble', () => {
  it('takes a bite on top of every move that lands', () => {
    const plain = createBattle();
    pinRandom(plain.battle, 1);
    const plainHolder = createUnit(plain.battle, plain.teamA);
    const plainEnemy = createUnit(plain.battle, plain.teamB);
    const bare = dealDamage(
      plainHolder,
      plainEnemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Nibble);

    const bitten = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(bitten - bare).toBeCloseTo(enemy.checkStat(Stats.HP, 0) * NIBBLE_FRACTION, 5);
  });
});

describe('Powder Burst', () => {
  it('widens a status move it aims at one enemy over the whole far side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.PowderBurst);

    // A status move aimed at one enemy is recast at nobody, which is
    // what fans it out over the enemy side
    expect(holder.checkMoveTargeting(Moves.SleepPowder).target).toBe(MoveTargets.None);

    // An attacking move still picks its one target
    expect(holder.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.Unit);
  });
});

describe('Twin Stinger', () => {
  it('lands a physical move twice at reduced power', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TwinStinger);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Tackle, target)).toBeCloseTo(
      40 * TWIN_STINGER_POWER_SCALE,
      5,
    );

    let landed = 0;
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === holder && event.success) {
        landed += 1;
      }
    });

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(landed).toBe(2);
  });

  it('leaves special moves and moves that already strike several times alone', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TwinStinger);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Ember, target)).toBe(40);
    expect(holder.checkMovePower(Moves.DoubleSlap, target)).toBe(15);

    let landed = 0;
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === holder && event.success) {
        landed += 1;
      }
    });

    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(landed).toBe(1);
  });
});

describe('Relentless', () => {
  it('presses one target harder each time it lands, and starts over on another', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.Relentless);

    const atFirst = { type: MoveTargetType.Unit, unit: first } as const;
    const atSecond = { type: MoveTargetType.Unit, unit: second } as const;

    expect(holder.checkMovePower(Moves.Tackle, atFirst)).toBe(40);

    for (let landed = 1; landed <= RELENTLESS_MAX_STACKS + 1; landed += 1) {
      holder.attack(first, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
      first.setHealth(first.checkStat(Stats.HP, 0));

      expect(holder.checkMovePower(Moves.Tackle, atFirst)).toBeCloseTo(
        40 * (1 + RELENTLESS_STEP * Math.min(RELENTLESS_MAX_STACKS, landed)),
        5,
      );

      // Nothing carries over to anybody else
      expect(holder.checkMovePower(Moves.Tackle, atSecond)).toBe(40);
    }

    holder.attack(second, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.checkMovePower(Moves.Tackle, atFirst)).toBe(40);
  });
});

describe('Squeeze', () => {
  it('tightens on the last thing it touched while it is winding up', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Squeeze);

    const maxHP = enemy.checkStat(Stats.HP, 0);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    const caught = enemy.health;

    // Nothing while it stands idle
    battle.tick(SQUEEZE_INTERVAL);

    expect(enemy.health).toBe(caught);

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: holder,
      move: Moves.SolarBeam,
      target: { type: MoveTargetType.Unit, unit: enemy },
    });

    battle.tick(SQUEEZE_INTERVAL);

    expect(caught - enemy.health).toBeCloseTo(maxHP * SQUEEZE_FRACTION, 5);
  });

  it('needs contact to get hold of anything', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Squeeze);

    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    const before = enemy.health;

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: holder,
      move: Moves.SolarBeam,
      target: { type: MoveTargetType.Unit, unit: enemy },
    });
    battle.tick(SQUEEZE_INTERVAL);

    expect(enemy.health).toBe(before);
  });
});

describe('Chain Lightning', () => {
  it('arcs a third of the blow to the next enemy along', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const struck = createUnit(battle, teamB);
    const next = createUnit(battle, teamB);
    holder.addAbility(Abilities.ChainLightning);

    const before = next.health;
    const dealt = dealDamage(
      holder,
      struck,
      Moves.ThunderShock,
      40,
      Types.Electric,
      MoveCategories.Special,
    );

    expect(before - next.health).toBeCloseTo(dealt * CHAIN_LIGHTNING_FRACTION, 5);
  });

  it('does not arc off a move of another type', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const struck = createUnit(battle, teamB);
    const next = createUnit(battle, teamB);
    holder.addAbility(Abilities.ChainLightning);

    const before = next.health;

    dealDamage(holder, struck, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(next.health).toBe(before);
  });
});

describe('Curl Up', () => {
  it('casts Defense Curl on itself for every hit it takes', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CurlUp);

    const maxHP = holder.checkStat(Stats.HP, 0);

    enemy.damage(NONE_CAUSE, holder, 1, 0);
    battle.tick(turns(1));

    expect(holder.stages[Stages.Defense]).toBe(1);

    holder.setHealth(maxHP);
    enemy.damage(NONE_CAUSE, holder, 1, 0);
    battle.tick(turns(1));

    expect(holder.stages[Stages.Defense]).toBe(2);
  });
});

describe('the Nidoran pair', () => {
  const COURTS = [
    { name: "Queen's Court", ability: Abilities.QueensCourt, defends: true },
    { name: "King's Court", ability: Abilities.KingsCourt, defends: false },
  ];

  for (const { name, ability, defends } of COURTS) {
    it(`pays ${name} for every poisoned enemy, up to the cap`, () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const enemies = [
        createUnit(battle, teamB),
        createUnit(battle, teamB),
        createUnit(battle, teamB),
        createUnit(battle, teamB),
      ];
      holder.addAbility(ability);

      const parent = defends
        ? makeAttack(enemies[0], holder, Moves.Pound, Types.Normal, MoveCategories.Physical)
        : makeAttack(holder, enemies[0], Moves.Pound, Types.Normal, MoveCategories.Physical);
      const stat = defends ? Stats.Defense : Stats.Attack;

      // Nothing owed while the far side is clean
      expect(resolveAttackStat(battle, parent, holder, stat, 100)).toBe(100);

      for (const [index, enemy] of enemies.entries()) {
        enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

        const counted = Math.min(REGAL_COURT_MAX_ENEMIES, index + 1);

        expect(resolveAttackStat(battle, parent, holder, stat, 100)).toBeCloseTo(
          100 * (1 + REGAL_COURT_STEP * counted),
          5,
        );
      }
    });
  }

  it('pays each half on its own side of the blow only', () => {
    const { battle, teamA, teamB } = createBattle();
    const queen = createUnit(battle, teamA);
    const king = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    queen.addAbility(Abilities.QueensCourt);
    king.addAbility(Abilities.KingsCourt);
    enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

    const struck = makeAttack(enemy, queen, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const thrown = makeAttack(king, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const owed = 100 * (1 + REGAL_COURT_STEP);

    // She is paid defending and he attacking, and neither the other way
    expect(resolveAttackStat(battle, struck, queen, Stats.Defense, 100)).toBeCloseTo(owed, 5);
    expect(resolveAttackStat(battle, struck, enemy, Stats.Attack, 100)).toBe(100);
    expect(resolveAttackStat(battle, thrown, king, Stats.Attack, 100)).toBeCloseTo(owed, 5);
    expect(resolveAttackStat(battle, thrown, enemy, Stats.Defense, 100)).toBe(100);
  });

  it('counts the poison either of them landed', () => {
    const { battle, teamA, teamB } = createBattle();
    const queen = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    queen.addAbility(Abilities.QueensCourt);

    enemy.addStatus(Statuses.BadlyPoisoned, NONE_CAUSE);

    const struck = makeAttack(enemy, queen, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, struck, queen, Stats.SpecialDefense, 100)).toBeCloseTo(
      100 * (1 + REGAL_COURT_STEP),
      5,
    );
  });
});

describe('Wishing Well', () => {
  it('casts Wish on the ally furthest from full', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    holder.addAbility(Abilities.WishingWell);

    const maxHP = hurt.checkStat(Stats.HP, 0);
    hurt.setHealth(maxHP / 4);
    holder.setHealth(1);

    let wished: Unit | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.move === Moves.Wish && event.target.type === MoveTargetType.Unit) {
        wished = event.target.unit;
      }
    });

    act(battle, holder);

    expect(wished).toBe(hurt);
  });
});

describe('Nine Tails', () => {
  it('buys Special Attack with every hit it survives, up to nine', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.NineTails);

    const bare = holder.checkStat(Stats.SpecialAttack, 0);
    const maxHP = holder.checkStat(Stats.HP, 0);

    for (let taken = 1; taken <= NINE_TAILS_MAX_STACKS + 2; taken += 1) {
      enemy.damage(NONE_CAUSE, holder, 1, 0);
      holder.setHealth(maxHP);

      expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
        bare * (1 + NINE_TAILS_STEP * Math.min(NINE_TAILS_MAX_STACKS, taken)),
        5,
      );
    }
  });
});

describe('Lullaby', () => {
  it('holds its own sleep longer and hits a sleeper harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Lullaby);

    const fromHolder = {
      type: EffectType.Ability,
      ability: Abilities.Lullaby,
      unit: holder,
    } as const;

    const bare = enemy.checkStatusDuration(Statuses.Sleeping, turns(3), NONE_CAUSE);

    expect(enemy.checkStatusDuration(Statuses.Sleeping, turns(3), fromHolder)).toBeCloseTo(
      bare * LULLABY_SLEEP_SCALE,
      5,
    );

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBe(100);

    enemy.addStatus(Statuses.Sleeping, NONE_CAUSE);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * LULLABY_POWER_SCALE,
      5,
    );
  });
});

describe('Bloodthirst', () => {
  it('drinks deeper and eats worse', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bloodthirst);

    expect(holder.checkDrain(enemy, 20)).toBeCloseTo(20 * BLOODTHIRST_DRAIN_SCALE, 5);

    holder.setHealth(10);
    holder.heal(NONE_CAUSE, holder, 20, 0);

    expect(holder.health).toBeCloseTo(10 + 20 * BLOODTHIRST_HEAL_SCALE, 5);

    // A drain is not one of the heals it is bad at
    holder.setHealth(10);
    holder.heal({ type: EffectType.Move, move: Moves.MegaDrain, unit: holder }, holder, 20, 0);

    expect(holder.health).toBeCloseTo(30, 5);
  });
});

describe('Deep Roots', () => {
  it('casts Ingrain on itself as it arrives', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.DeepRoots);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(holder.status[Statuses.Rooted]).not.toBeUndefined();
  });
});

describe('Fungal Bloom', () => {
  it('feeds on every status it lands on an enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FungalBloom);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    enemy.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonPowder,
      unit: holder,
    });

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * FUNGAL_BLOOM_FRACTION, 5);

    // A status it puts on itself feeds it nothing
    holder.setHealth(maxHP / 2);
    holder.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.Toxic,
      unit: holder,
    });

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);
  });
});

describe('Dust Storm', () => {
  it('reads every ailing enemy, up to what the dust can cover', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.DustStorm);

    const enemies = [
      createUnit(battle, teamB),
      createUnit(battle, teamB),
      createUnit(battle, teamB),
      createUnit(battle, teamB),
      createUnit(battle, teamB),
    ];
    const bare = holder.checkStat(Stats.SpecialAttack, 0);

    expect(bare).toBeGreaterThan(0);

    enemies.forEach((enemy, index) => {
      enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

      expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
        bare * (1 + DUST_STORM_STEP * Math.min(DUST_STORM_MAX_STACKS, index + 1)),
        5,
      );
    });
  });

  it('reads nothing off its own side', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    holder.addAbility(Abilities.DustStorm);

    const bare = holder.checkStat(Stats.SpecialAttack, 0);
    ally.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBe(bare);
  });
});

describe('Undermine', () => {
  it('leaves a target taking more from everybody, up to the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Undermine);

    const maxHP = enemy.checkStat(Stats.HP, 0);
    const fromAlly = makeAttack(ally, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, fromAlly, ally, Stats.Attack, 100)).toBe(100);

    for (let passes = 1; passes <= UNDERMINE_MAX_STACKS + 2; passes += 1) {
      holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
      enemy.setHealth(maxHP);

      // The ally profits from the digging as much as the digger does
      expect(resolveAttackStat(battle, fromAlly, ally, Stats.Attack, 100)).toBeCloseTo(
        100 * (1 + UNDERMINE_STEP * Math.min(UNDERMINE_MAX_STACKS, passes)),
        5,
      );
    }
  });
});

describe('Cutpurse', () => {
  it('takes an item once from each enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Cutpurse);

    enemy.addItem(Items.OranBerry);

    expect(enemy.items[Items.OranBerry]).not.toBeUndefined();

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.items[Items.OranBerry]).toBeUndefined();

    // Pockets already turned out stay empty: a second item is safe
    enemy.setHealth(enemy.checkStat(Stats.HP, 0));
    enemy.addItem(Items.OranBerry);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.items[Items.OranBerry]).not.toBeUndefined();
  });
});

describe('Headache Burst', () => {
  it('comes on at half health and takes the misses out of Psychic moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HeadacheBurst);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkStat(Stats.SpecialAttack, 0);

    expect(holder.checkMoveAccuracy(Moves.Psybeam, target)).not.toBeUndefined();

    holder.setHealth(holder.checkStat(Stats.HP, 0) / 2);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(bare * HEADACHE_BURST_SCALE, 5);
    expect(holder.checkMoveAccuracy(Moves.Psybeam, target)).toBeUndefined();

    // A move of another type still has to land the ordinary way
    expect(holder.checkMoveAccuracy(Moves.WaterGun, target)).not.toBeUndefined();
  });
});

describe('Blind Rage', () => {
  it('swings harder, aims worse, and refuses every heal', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.BlindRage);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bareAttack = createUnit(battle, teamB).checkStat(Stats.Attack, 0);

    expect(holder.checkStat(Stats.Attack, 0)).toBeCloseTo(bareAttack * BLIND_RAGE_ATTACK_SCALE, 5);
    expect(holder.checkMoveAccuracy(Moves.Pound, target)).toBeCloseTo(
      100 * BLIND_RAGE_ACCURACY_SCALE,
      5,
    );

    holder.setHealth(10);
    holder.heal(NONE_CAUSE, holder, 50, 0);

    expect(holder.health).toBe(10);
  });
});

describe('Chase Down', () => {
  it('hits quarry harder and will not let it leave', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.ChaseDown);

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBe(100);
    expect(enemy.checkEscape()).toBe(true);

    enemy.setHealth(enemy.checkStat(Stats.HP, 0) * CHASE_DOWN_THRESHOLD);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * CHASE_DOWN_SCALE,
      5,
    );
    expect(enemy.checkEscape()).toBe(false);
  });
});

describe('Hypnotic Spiral', () => {
  it('slows the next cast of whoever touches it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HypnoticSpiral);

    const target = { type: MoveTargetType.None } as const;
    const bare = enemy.checkMoveCastTime(Moves.Flamethrower, target);

    // A ranged move leaves the spiral out of reach
    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);

    enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * HYPNOTIC_SPIRAL_CAST_SCALE,
      5,
    );

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: enemy,
      move: Moves.Flamethrower,
      target,
    });

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);
  });
});

describe('Teleport Guard', () => {
  it('blinks away from one attack, then has to gather itself', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TeleportGuard);

    // The blow that would have landed does not
    rollMove(battle, enemy, holder, Moves.Pound, true);

    // The next one lands: the blink is spent
    const second = rolled(battle, enemy, holder, Moves.Pound);

    expect(second).toBe(true);

    battle.tick(TELEPORT_GUARD_WINDOW);

    expect(rolled(battle, enemy, holder, Moves.Pound)).toBe(false);
  });
});

describe('Overhead Throw', () => {
  it('throws a heavier target harder than a lighter one', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const heavy = createUnit(battle, teamB);
    const light = createUnit(battle, teamB);
    holder.addAbility(Abilities.OverheadThrow);

    holder.setWeight(100);
    heavy.setWeight(200);
    light.setWeight(50);

    const atHeavy = makeAttack(holder, heavy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const atLight = makeAttack(holder, light, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const ranged = makeAttack(holder, heavy, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, atHeavy, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * OVERHEAD_THROW_HEAVY_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, atLight, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * OVERHEAD_THROW_LIGHT_SCALE,
      5,
    );

    // Nothing it does not get its hands on
    expect(resolveAttackStat(battle, ranged, holder, Stats.SpecialAttack, 100)).toBe(100);
  });
});

describe('Digest', () => {
  it('feeds on a target that is nearly finished', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Digest);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    // A healthy target is no meal
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);

    enemy.setHealth(enemy.checkStat(Stats.HP, 0) * DIGEST_THRESHOLD);
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * DIGEST_HEAL_FRACTION, 5);
  });
});

describe('Tentacle Grasp', () => {
  it('holds whatever it has touched while it stands', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const untouched = createUnit(battle, teamB);
    holder.addAbility(Abilities.TentacleGrasp);

    expect(enemy.checkEscape()).toBe(true);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.checkEscape()).toBe(false);
    expect(untouched.checkEscape()).toBe(true);

    // The grip goes with the holder
    holder.faint(enemy);

    expect(enemy.checkEscape()).toBe(true);
  });
});

describe('Solid Core', () => {
  it('shrugs off physical blows and eats special ones', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SolidCore);

    const physical = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const special = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, physical, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * SOLID_CORE_PHYSICAL_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, special, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * SOLID_CORE_SPECIAL_SCALE,
      5,
    );

    // Its own defensive stat is left alone
    expect(resolveAttackStat(battle, physical, holder, Stats.Defense, 100)).toBe(100);
  });
});

describe('Gallop', () => {
  it('gathers speed as it acts and loses it all to one hit', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Gallop);

    const bare = holder.checkStat(Stats.Speed, 0);

    for (let strides = 1; strides <= GALLOP_MAX_STACKS + 2; strides += 1) {
      act(battle, holder);

      expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(
        bare * (1 + GALLOP_STEP * Math.min(GALLOP_MAX_STACKS, strides)),
        5,
      );
    }

    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(holder.checkStat(Stats.Speed, 0)).toBe(bare);
  });
});

describe('Delayed Reaction', () => {
  it('feels half the blow now and the rest in four seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.DelayedReaction);

    const maxHP = holder.checkStat(Stats.HP, 0);

    enemy.damage(NONE_CAUSE, holder, 40, 0);

    expect(holder.health).toBeCloseTo(maxHP - 40 * DELAYED_REACTION_SHARE, 5);

    battle.tick(DELAYED_REACTION_DELAY / 2);

    expect(holder.health).toBeCloseTo(maxHP - 40 * DELAYED_REACTION_SHARE, 5);

    battle.tick(DELAYED_REACTION_DELAY / 2);

    expect(holder.health).toBeCloseTo(maxHP - 40, 5);

    // The debt settles once and does not come round again
    battle.tick(DELAYED_REACTION_DELAY);

    expect(holder.health).toBeCloseTo(maxHP - 40, 5);
  });
});

describe('Repulsion Field', () => {
  it('dampens special moves from both sides', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.RepulsionField);

    const incoming = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);
    const outgoing = makeAttack(holder, enemy, Moves.Ember, Types.Fire, MoveCategories.Special);
    const physical = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, incoming, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * REPULSION_FIELD_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, outgoing, holder, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * REPULSION_FIELD_SCALE,
      5,
    );

    // Nothing swung rather than thrown
    expect(resolveAttackStat(battle, physical, enemy, Stats.Attack, 100)).toBe(100);
  });
});

describe('Leek Duelist', () => {
  it('crits more often and harder, and takes everything harder too', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LeekDuelist);

    const outgoing = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const incoming = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    const ratio = {
      id: 'UnitAttackCheckCriticalRatio',
      disabled: false,
      parent: outgoing,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackCheckCriticalRatio, ratio);

    expect(ratio.value).toBe(LEEK_DUELIST_CRITICAL_STAGES);

    const mult = {
      id: 'UnitAttackResolveCriticalMult',
      disabled: false,
      parent: outgoing,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackResolveCriticalMult, mult);

    expect(mult.value).toBeCloseTo(2 * LEEK_DUELIST_CRITICAL_SCALE, 5);

    expect(resolveAttackStat(battle, incoming, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * LEEK_DUELIST_EXPOSED_SCALE,
      5,
    );
  });
});

describe('Second Head', () => {
  it('gives the spare head every third blow', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SecondHead);

    const powers: number[] = [];
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === holder) {
        powers.push(event.value);
      }
    });

    for (let landed = 0; landed < SECOND_HEAD_INTERVAL; landed += 1) {
      holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
      enemy.setHealth(enemy.checkStat(Stats.HP, 0));
    }

    // Three blows thrown, and the third brings a fourth with it. The
    // spare head's blow resolves inside the third, so it is recorded
    // before it
    expect(powers).toHaveLength(SECOND_HEAD_INTERVAL + 1);
    expect(powers.filter((power) => power === 40 * SECOND_HEAD_POWER_SCALE)).toHaveLength(1);
  });
});

describe('Sleek Hide', () => {
  it('sheds contact and takes the rest badly', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SleekHide);

    const contact = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const ranged = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, contact, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * SLEEK_HIDE_CONTACT_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, ranged, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * SLEEK_HIDE_RANGED_SCALE,
      5,
    );
  });
});

describe('Corrosive Ooze', () => {
  it('eats the item off whoever touches it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CorrosiveOoze);

    enemy.addItem(Items.OranBerry);
    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    // Nothing thrown from a distance touches the sludge
    expect(enemy.items[Items.OranBerry]).not.toBeUndefined();

    enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.items[Items.OranBerry]).toBeUndefined();
  });
});

describe('Spike Shell', () => {
  it('blunts a contact blow and costs the arm that threw it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SpikeShell);

    const contact = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, contact, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * SPIKE_SHELL_CONTACT_SCALE,
      5,
    );

    const maxHP = enemy.checkStat(Stats.HP, 0);
    const before = enemy.health;

    enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(before - enemy.health).toBeCloseTo(maxHP * SPIKE_SHELL_FRACTION, 5);
  });
});

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

describe('the Johto starters', () => {
  it('marks what Sapmark lands on, and drinks the same', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Sapmark);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    // Nothing is marked until something lands
    act(battle, enemy);

    expect(enemy.health).toBe(enemy.checkStat(Stats.HP, 0));

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    const before = enemy.health;
    holder.setHealth(maxHP / 2);

    act(battle, enemy);

    const share = enemy.checkStat(Stats.HP, 0) * MARK_FRACTION;

    expect(enemy.health).toBeCloseTo(before - share, 5);
    expect(holder.health).toBeCloseTo(maxHP / 2 + share, 5);
  });

  it('bites deeper with Embermark once the target is burning', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Embermark);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    const maxHP = enemy.checkStat(Stats.HP, 0);
    let before = enemy.health;

    act(battle, enemy);

    expect(enemy.health).toBeCloseTo(before - maxHP * MARK_FRACTION, 5);

    enemy.addStatus(Statuses.Burned, NONE_CAUSE);
    before = enemy.health;

    act(battle, enemy);

    // The burn's own residual rides on top, so only the floor is checked
    expect(enemy.health).toBeLessThanOrEqual(before - maxHP * MARK_DEEP_FRACTION);
  });

  it('holds one thing at a time with Jawmark', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.Jawmark);

    holder.attack(first, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
    holder.attack(second, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    const firstHealth = first.health;
    const secondBefore = second.health;

    act(battle, first);
    act(battle, second);

    // The jaw let the first one go when it took the second
    expect(first.health).toBe(firstHealth);
    expect(second.health).toBeCloseTo(
      secondBefore - second.checkStat(Stats.HP, 0) * MARK_DEEP_FRACTION,
      5,
    );
  });
});

describe('Sentry', () => {
  it('refuses a critical hit anywhere on its side', () => {
    const { battle, teamA, teamB } = createBattle();
    const lookout = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    lookout.addAbility(Abilities.Sentry);

    function rollCritical(target: Unit): boolean {
      const event = {
        id: 'UnitAttackResolveCriticalHit',
        disabled: false,
        parent: makeAttack(enemy, target, Moves.Pound, Types.Normal, MoveCategories.Physical),
        critical: true,
      };
      battle.emit(BattleEvents.UnitAttackResolveCriticalHit, event);
      return event.critical;
    }

    expect(rollCritical(ally)).toBe(false);
    expect(rollCritical(lookout)).toBe(false);

    // The far side still crits as usual
    expect(rollCritical(enemy)).toBe(true);
  });
});

describe('Watchful Roost', () => {
  it('puts Reflect up over its side as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.WatchfulRoost);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(teamA.status[TeamStatuses.Reflect]).not.toBeUndefined();
    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
  });
});

describe('Relay', () => {
  it('hands its stat stages to the teammate coming in', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const replacement = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Relay);

    holder.addStage(Stages.Attack, 2, NONE_CAUSE);
    holder.addStage(Stages.Speed, -1, NONE_CAUSE);

    holder.forceSwitch(replacement);
    battle.tick(SWITCHING_SPAN);

    expect(replacement.stages[Stages.Attack]).toBe(2);
    expect(replacement.stages[Stages.Speed]).toBe(-1);

    // What left the field still leaves it empty-handed
    expect(holder.stages[Stages.Attack]).toBe(0);
  });

  it('passes nothing when it had nothing built up', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const replacement = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Relay);

    holder.forceSwitch(replacement);
    battle.tick(SWITCHING_SPAN);

    expect(replacement.stages[Stages.Attack]).toBe(0);
  });
});

describe('Silk Snare', () => {
  it('casts String Shot over the whole enemy side as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.SilkSnare);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(first.stages[Stages.Speed]).toBeLessThan(0);
    expect(second.stages[Stages.Speed]).toBeLessThan(0);
    expect(holder.stages[Stages.Speed]).toBe(0);
  });
});

describe('Lantern Lure', () => {
  it('casts Confuse Ray at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LanternLure);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Confused]).not.toBeUndefined();
  });
});

describe('Fair Share', () => {
  it('caps a run of luck on the same ally', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FairShare);

    // Hypnosis is 60 accuracy; a pinned roll of 0 always lands it
    pinRandom(battle, 0);

    rollMove(battle, enemy, ally, Moves.Hypnosis, false);

    const second = {
      id: 'UnitTriggerMoveRollHit',
      disabled: false,
      parent: {
        id: 'UnitTriggerMove',
        disabled: false,
        source: enemy,
        move: Moves.Hypnosis,
        target: unitTarget(ally),
        steps: 0,
      },
      hit: false,
    };
    battle.emit(BattleEvents.UnitTriggerMoveRollHit, second);

    // The second chancy move running cannot land on the same ally
    expect(second.hit).toBe(false);

    const third = {
      id: 'UnitTriggerMoveRollHit',
      disabled: false,
      parent: {
        id: 'UnitTriggerMove',
        disabled: false,
        source: enemy,
        move: Moves.Hypnosis,
        target: unitTarget(ally),
        steps: 0,
      },
      hit: false,
    };
    battle.emit(BattleEvents.UnitTriggerMoveRollHit, third);

    expect(third.hit).toBe(true);
  });

  it('says nothing about a move that never misses', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FairShare);
    pinRandom(battle, 0);

    for (let blows = 0; blows < 3; blows += 1) {
      expect(rolled(battle, enemy, ally, Moves.Pound)).toBe(true);
    }
  });
});

describe('Prophecy', () => {
  it('casts Future Sight at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Prophecy);

    let cast: Moves | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === holder) {
        cast = event.move;
      }
    });

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(cast).toBe(Moves.FutureSight);

    // The promise is kept two turns after the cast has flown
    battle.tick(turns(4));

    expect(enemy.health).toBeLessThan(enemy.checkStat(Stats.HP, 0));
  });
});

describe('Live Wire', () => {
  it('casts Thunder Wave at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LiveWire);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Paralyzed]).not.toBeUndefined();
  });
});

describe('Spillover', () => {
  it('throws what will not fit at an enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Spillover);

    const maxHP = holder.checkStat(Stats.HP, 0);
    const enemyHP = enemy.health;
    holder.setHealth(maxHP - 10);

    holder.heal(NONE_CAUSE, holder, 40, 0);

    expect(holder.health).toBe(maxHP);
    expect(enemy.health).toBe(enemyHP - 30);
  });

  it('spills nothing while there is room for the heal', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Spillover);

    const maxHP = holder.checkStat(Stats.HP, 0);
    const enemyHP = enemy.health;
    holder.setHealth(maxHP / 2);

    holder.heal(NONE_CAUSE, holder, 40, 0);

    expect(enemy.health).toBe(enemyHP);
  });
});

describe('False Wood', () => {
  function effectiveness(battle: Battle, attacker: Unit, target: Unit, type: Types): number {
    const event = {
      id: 'UnitAttackResolveEffectiveness',
      disabled: false,
      parent: makeAttack(attacker, target, Moves.WaterGun, type, MoveCategories.Special),
      defendingType: Types.Rock,
      multiplier: 1,
    };
    battle.emit(BattleEvents.UnitAttackResolveEffectiveness, event);
    return event.multiplier;
  }

  it('answers a blow as a tree rather than a rock', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA, [Types.Rock]);
    const enemy = createUnit(battle, teamB);

    // Water is twice as bad against rock and half as bad against grass
    expect(effectiveness(battle, enemy, holder, Types.Water)).toBeCloseTo(2, 5);

    holder.addAbility(Abilities.FalseWood);

    expect(effectiveness(battle, enemy, holder, Types.Water)).toBeCloseTo(0.5, 5);
  });

  it('drops the act on the first hit that lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA, [Types.Rock]);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FalseWood);

    enemy.damage(NONE_CAUSE, holder, 10, 0);

    expect(effectiveness(battle, enemy, holder, Types.Water)).toBeCloseTo(2, 5);

    // Taking the field again puts the disguise back up
    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(effectiveness(battle, enemy, holder, Types.Water)).toBeCloseTo(0.5, 5);
  });
});

describe('Updraft', () => {
  it('gets away from whatever is holding it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);

    holder.addStatus(Statuses.Trapped, NONE_CAUSE);

    expect(holder.checkEscape()).toBe(false);

    holder.addAbility(Abilities.Updraft);

    expect(holder.checkEscape()).toBe(true);
  });

  it('keeps its Speed where it is', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Updraft);

    const cause = { type: EffectType.Ability, ability: Abilities.Updraft, unit: enemy } as const;

    holder.addStage(Stages.Speed, -2, cause);

    expect(holder.stages[Stages.Speed]).toBe(0);

    // Everything else still slips through, and a raise is welcome
    holder.addStage(Stages.Attack, -2, cause);
    holder.addStage(Stages.Speed, 1, cause);

    expect(holder.stages[Stages.Attack]).toBe(-2);
    expect(holder.stages[Stages.Speed]).toBe(1);
  });
});

describe('Tailthrow', () => {
  it('casts Fling at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Tailthrow);
    holder.addItem(Items.OranBerry);

    let cast: Moves | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === holder) {
        cast = event.move;
      }
    });

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(cast).toBe(Moves.Fling);

    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(enemy.health).toBeLessThan(enemy.checkStat(Stats.HP, 0));
  });
});

describe('Sunlit Charge', () => {
  it('makes what it holds down land harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    const bare = holder.checkMovePower(Moves.SolarBeam, target);

    holder.addAbility(Abilities.SunlitCharge);

    expect(holder.checkMovePower(Moves.SolarBeam, target)).toBeCloseTo(
      (bare ?? 0) * SUNLIT_CHARGE_SCALE,
      5,
    );

    // A move let go at once gains nothing
    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);
  });

  it('holds the channel through an interrupt', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SunlitCharge);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    holder.channel(Moves.SolarBeam, target, 0);
    plain.channel(Moves.SolarBeam, target, 0);

    expect(holder.channeling).not.toBeUndefined();

    holder.interrupt();
    plain.interrupt();

    expect(holder.channeling).not.toBeUndefined();
    expect(plain.channeling).toBeUndefined();
  });
});

describe('Resonance', () => {
  it('carries a sound move across the whole enemy side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Resonance);

    // Uproar is sound; Pound is not
    expect(holder.checkMoveTargeting(Moves.Uproar).target).toBe(MoveTargets.None);
    expect(holder.checkMoveTargeting(Moves.Pound).target).toBe(MoveTargets.Unit);

    // Everybody else still aims a sound at one target
    expect(enemy.checkMoveTargeting(Moves.Uproar).target).toBe(MoveTargets.Unit);
  });
});

describe('Contagious Yawn', () => {
  it('casts Yawn at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.ContagiousYawn);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Drowsy]).not.toBeUndefined();
  });
});

describe('Magpie', () => {
  it('pockets whatever is taken off somebody else', () => {
    const { battle, teamA, teamB } = createBattle();
    const crow = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    crow.addAbility(Abilities.Magpie);
    enemy.addItem(Items.OranBerry);

    enemy.removeItem(Items.OranBerry, {
      type: EffectType.Ability,
      ability: Abilities.Magpie,
      unit: crow,
    });

    expect(enemy.items[Items.OranBerry]).toBeUndefined();
    expect(crow.items[Items.OranBerry]).not.toBeUndefined();
  });

  it('leaves a berry its owner ate alone, and never robs itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const crow = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    crow.addAbility(Abilities.Magpie);
    enemy.addItem(Items.OranBerry);

    // Eaten rather than knocked loose: the cause names the holder
    enemy.removeItem(Items.OranBerry, {
      type: EffectType.Item,
      item: Items.OranBerry,
      unit: enemy,
    });

    expect(crow.items[Items.OranBerry]).toBeUndefined();

    crow.addItem(Items.SitrusBerry);
    crow.removeItem(Items.SitrusBerry, {
      type: EffectType.Ability,
      ability: Abilities.Magpie,
      unit: enemy,
    });

    expect(crow.items[Items.SitrusBerry]).toBeUndefined();
  });
});

describe('Shared Misery', () => {
  it('casts Pain Split at the healthiest enemy once it is nearly done', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamB);
    const healthy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SharedMisery);

    const maxHP = holder.checkStat(Stats.HP, 0);
    hurt.setHealth(maxHP / 4);

    let cast: { move: Moves; at: Unit } | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === holder && event.target.type === MoveTargetType.Unit) {
        cast = { move: event.move, at: event.target.unit };
      }
    });

    // Still standing: nothing to share yet
    healthy.damage(NONE_CAUSE, holder, maxHP * 0.5, 0);

    expect(cast).toBeUndefined();

    healthy.damage(NONE_CAUSE, holder, maxHP * SHARED_MISERY_THRESHOLD, 0);

    expect(cast?.move).toBe(Moves.PainSplit);
    expect(cast?.at).toBe(healthy);

    // Once per turn on the field, not once per hit
    cast = undefined;
    healthy.damage(NONE_CAUSE, holder, 1, 0);

    expect(cast).toBeUndefined();
  });
});

describe('Ruinous Script', () => {
  it("shuts the far side's items down while it stands", () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const ally = createUnit(battle, teamA);
    enemy.addItem(Items.OranBerry);
    ally.addItem(Items.SitrusBerry);

    expect(enemy.hasItem(Items.OranBerry)).toBe(true);

    holder.addAbility(Abilities.RuinousScript);

    expect(enemy.hasItem(Items.OranBerry)).toBe(false);
    // Its own side reads as usual
    expect(ally.hasItem(Items.SitrusBerry)).toBe(true);

    holder.faint(enemy);

    expect(enemy.hasItem(Items.OranBerry)).toBe(true);
  });
});

describe('Backlash', () => {
  it('gives back a share of what was put into it as it moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Backlash);

    const enemyHP = enemy.health;
    // A blow with somebody behind it: there is nobody to pay a
    // causeless hit back to
    const blow = { type: EffectType.Move, move: Moves.Pound, unit: enemy } as const;

    enemy.damage(blow, holder, 40, 0);
    enemy.damage(blow, holder, 20, 0);

    // Nothing is paid until it acts
    expect(enemy.health).toBe(enemyHP);

    act(battle, holder);

    expect(enemy.health).toBeCloseTo(enemyHP - 60 * BACKLASH_SHARE, 5);

    // The bank is spent, not kept
    act(battle, holder);

    expect(enemy.health).toBeCloseTo(enemyHP - 60 * BACKLASH_SHARE, 5);
  });
});

describe('Ambidextrous', () => {
  it('swings with the better of its two attacking stats', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Ambidextrous);

    holder.setStat(StatsKind.Base, Stats.Attack, 20);
    holder.setStat(StatsKind.Base, Stats.SpecialAttack, 200);

    const physical = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const special = holder.resolveStat(Stats.SpecialAttack, StatFlags.Attack);

    expect(resolveAttackStat(battle, physical, holder, Stats.Attack, 30)).toBeCloseTo(special, 5);

    // The defending end is untouched
    const incoming = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, incoming, holder, Stats.Defense, 50)).toBe(50);
  });
});

describe('Shrapnel', () => {
  it('lays both hazard layers on the enemy side as it goes down', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Shrapnel);

    holder.faint(enemy);
    // The cast moves take their own flight time to arrive
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(1);
    expect(teamB.status[TeamStatuses.ToxicSpikes]).not.toBeUndefined();
    expect(layersUnder(teamA)).toBe(0);
  });
});

/** What one plain blow works out to against a given defender */
function resolveAttackDamage(battle: Battle, attacker: Unit, target: Unit): number {
  const event = {
    id: 'UnitAttackResolveDamage',
    disabled: false,
    parent: makeAttack(attacker, target, Moves.Pound, Types.Normal, MoveCategories.Physical),
    value: 0,
  };
  battle.emit(BattleEvents.UnitAttackResolveDamage, event);
  return event.value;
}

describe('Hidden Den', () => {
  it('cannot be aimed at while a teammate is standing', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HiddenDen);

    expect(enemy.checkMoveImmunity(Moves.Pound, unitTarget(holder), Types.Normal)).toBe(true);
    expect(enemy.checkMoveImmunity(Moves.Pound, unitTarget(mate), Types.Normal)).toBe(false);

    // Alone, there is nowhere left to hide
    mate.faint(enemy);

    expect(enemy.checkMoveImmunity(Moves.Pound, unitTarget(holder), Types.Normal)).toBe(false);
  });

  it('does not hide behind somebody else’s party', () => {
    const { battle, allianceA, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HiddenDen);

    // A second party under the same banner, which is what a raid is:
    // allied, but not the pokemon standing beside it
    const allied = new Team(battle, allianceA);

    allianceA.addTeam(allied);
    createUnit(battle, allied);

    expect(enemy.checkMoveImmunity(Moves.Pound, unitTarget(holder), Types.Normal)).toBe(false);
  });
});

describe('Sand Rider', () => {
  it('cannot miss and is half covered while the sand blows', () => {
    const { battle, teamA, teamB } = createBattle();
    // The damage roll is pinned, so the two blows differ only by the cover
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SandRider);

    const atEnemy = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMoveAccuracy(Moves.FireBlast, atEnemy)).not.toBeUndefined();

    battle.setWeather(Weathers.Sandstorm);

    expect(holder.checkMoveAccuracy(Moves.FireBlast, atEnemy)).toBeUndefined();

    // The resolver works the damage out itself, so the cover is read
    // off a bare unit taking the same blow
    const bare = createUnit(battle, teamA);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(
      resolveAttackDamage(battle, enemy, bare) * SAND_RIDER_SCALE,
      5,
    );
  });
});

describe('Bully', () => {
  it('hits harder at whatever has already been cowed', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bully);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    enemy.addStage(Stages.Attack, -1, NONE_CAUSE);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(40 * BULLY_SCALE, 5);
  });
});

describe('Last Barb', () => {
  it('casts Toxic at whoever finished it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LastBarb);

    holder.faint(enemy);
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(enemy.status[Statuses.BadlyPoisoned]).not.toBeUndefined();
  });
});

describe('Fermenter', () => {
  it('brews a juice into a free hand as it moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Fermenter);

    expect(holder.items[Items.BerryJuice]).toBeUndefined();

    act(battle, holder);

    expect(holder.items[Items.BerryJuice]).not.toBeUndefined();
  });
});

describe('Heave', () => {
  it('throws each enemy off the field the first time it lands one', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Heave);

    const casts: Moves[] = [];
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === holder) {
        casts.push(event.move);
      }
    });

    // A contact move lands, and the throw follows it
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(casts).toEqual([Moves.Whirlwind]);

    // The same enemy is not thrown twice
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(casts).toEqual([Moves.Whirlwind]);
  });

  it('leaves a move that never touched it alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Heave);

    let cast = false;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      cast = cast || event.source === holder;
    });

    holder.attack(enemy, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);

    expect(cast).toBe(false);
  });
});

describe('Sharp Claw', () => {
  it('opens the target up with every touch', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SharpClaw);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.stages[Stages.Defense]).toBe(-1);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.stages[Stages.Defense]).toBe(-2);

    // Nothing that keeps its distance cuts anything
    holder.attack(enemy, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);

    expect(enemy.stages[Stages.Defense]).toBe(-2);
  });
});

describe('Sweet Paw', () => {
  it('licks back a share of what its paws deal', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SweetPaw);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    holder.damage({ type: EffectType.Move, move: Moves.Pound, unit: holder }, enemy, 40, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + 40 * SWEET_PAW_SHARE, 5);

    // A move that never touched the target gives nothing back
    holder.setHealth(maxHP / 2);
    holder.damage({ type: EffectType.Move, move: Moves.WaterGun, unit: holder }, enemy, 40, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);
  });
});

describe('Magma Trail', () => {
  it('burns only what it has actually reached', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const burned = createUnit(battle, teamB);
    const untouched = createUnit(battle, teamB);
    holder.addAbility(Abilities.MagmaTrail);

    const maxHP = burned.checkStat(Stats.HP, 0);

    // Nothing before it connects
    act(battle, burned);

    expect(burned.health).toBe(maxHP);

    holder.attack(burned, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
    burned.setHealth(maxHP);

    act(battle, burned);

    expect(burned.health).toBeCloseTo(maxHP - maxHP * MAGMA_TRAIL_FRACTION, 5);

    // The one it never touched walks over clean ground, and so does
    // its own side
    act(battle, untouched);
    act(battle, ally);

    expect(untouched.health).toBe(untouched.checkStat(Stats.HP, 0));
    expect(ally.health).toBe(ally.checkStat(Stats.HP, 0));
  });
});

describe('Icebreaker', () => {
  it('tears the screens down as it swings', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Icebreaker);

    const screen = { type: EffectType.None } as const;
    teamB.addStatus(TeamStatuses.Reflect, screen);
    teamB.addStatus(TeamStatuses.LightScreen, screen);

    holder.triggerMove(Moves.Pound, unitTarget(enemy), 0);
    battle.tick(turns(1));

    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
    expect(teamB.status[TeamStatuses.LightScreen]).toBeUndefined();
  });
});

describe('Coral Bloom', () => {
  it('passes what it takes in on to the ally that needs it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const fine = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.CoralBloom);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);
    hurt.setHealth(maxHP / 4);

    holder.heal(NONE_CAUSE, holder, 20, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + 20, 5);
    expect(hurt.health).toBeCloseTo(maxHP / 4 + 20, 5);
    // Only the neediest branch, and never twice over
    expect(fine.health).toBe(maxHP);
  });
});

describe('Standoff', () => {
  it('never touches whatever it is shooting at', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const bare = createUnit(battle, teamA);

    expect(bare.checkMoveContact(Moves.Pound, unitTarget(enemy))).toBe(true);

    holder.addAbility(Abilities.Standoff);

    expect(holder.checkMoveContact(Moves.Pound, unitTarget(enemy))).toBe(false);
  });
});

describe('Delivery', () => {
  it('puts a juice in the hands of whoever needs it as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const fine = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Delivery);

    hurt.setHealth(hurt.checkStat(Stats.HP, 0) / 4);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(hurt.items[Items.BerryJuice]).not.toBeUndefined();
    expect(fine.items[Items.BerryJuice]).toBeUndefined();
    // The parcel is never for itself
    expect(holder.items[Items.BerryJuice]).toBeUndefined();
  });
});

describe('Escort', () => {
  it('spreads its wing over everybody else in its party', () => {
    const { battle, allianceA, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const bare = mate.checkStat(Stats.SpecialDefense, 0);

    holder.addAbility(Abilities.Escort);

    expect(mate.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(bare * ESCORT_SCALE, 5);
    // Not itself, and not the far side
    expect(holder.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(bare, 5);
    expect(enemy.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(bare, 5);

    // And not a party it merely happens to be allied with
    const allied = new Team(battle, allianceA);

    allianceA.addTeam(allied);

    const stranger = createUnit(battle, allied);

    expect(stranger.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(bare, 5);
  });
});

describe('Steelmolt', () => {
  it('sheds a layer onto the enemy side for every hit taken', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Steelmolt);

    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, 20, 0);
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(1);

    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, 20, 0);
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(2);
    expect(layersUnder(teamA)).toBe(0);
  });
});

describe('Pack Howl', () => {
  it('lifts every teammate as it arrives, and nobody else', () => {
    const { battle, allianceA, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.PackHowl);

    // Another party under the same banner, which is what a raid lobby
    // is: allied, but not the pack
    const allied = new Team(battle, allianceA);

    allianceA.addTeam(allied);

    const stranger = createUnit(battle, allied);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(mate.stages[Stages.Attack]).toBe(1);
    expect(holder.stages[Stages.Attack]).toBe(0);
    expect(stranger.stages[Stages.Attack]).toBe(0);
    expect(enemy.stages[Stages.Attack]).toBe(0);
  });
});

describe('Momentum', () => {
  it('rolls harder for every blow that has landed', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Momentum);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    for (let landed = 1; landed <= MOMENTUM_MAX_STACKS; landed += 1) {
      rollMove(battle, holder, enemy, Moves.Pound, true);

      expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
        40 * (1 + MOMENTUM_STEP * landed),
        5,
      );
    }

    // Past the cap it holds where it is
    rollMove(battle, holder, enemy, Moves.Pound, true);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
      40 * (1 + MOMENTUM_STEP * MOMENTUM_MAX_STACKS),
      5,
    );

    // Taking the field again starts the roll over
    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);
  });
});

describe('Mind Fog', () => {
  it('dulls what the far side can think with', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const bare = enemy.checkStat(Stats.SpecialAttack, 0);

    holder.addAbility(Abilities.MindFog);

    expect(enemy.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(bare * MIND_FOG_SCALE, 5);
    expect(ally.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(bare, 5);
    expect(enemy.checkStat(Stats.Attack, 0)).toBeCloseTo(bare, 5);
  });
});

describe('Palette', () => {
  it('paints its moves the colour of whatever last hit it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Palette);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMoveType(Moves.Pound, target)).toBe(Types.Normal);

    enemy.attack(holder, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);

    expect(holder.checkMoveType(Moves.Pound, target)).toBe(Types.Water);

    // Whatever lands next repaints it
    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(holder.checkMoveType(Moves.Pound, target)).toBe(Types.Fire);
  });
});

describe('Cowbell', () => {
  it('rings the team clean as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Cowbell);

    ally.addStatus(Statuses.Burned, NONE_CAUSE);
    enemy.addStatus(Statuses.Burned, NONE_CAUSE);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(ally.status[Statuses.Burned]).toBeUndefined();
    expect(enemy.status[Statuses.Burned]).not.toBeUndefined();
  });
});

describe('the risen beasts', () => {
  const RISEN = [
    { name: 'Risen Thunder', ability: Abilities.RisenThunder, stage: Stages.Speed },
    { name: 'Risen Flame', ability: Abilities.RisenFlame, stage: Stages.Attack },
    { name: 'Risen Tide', ability: Abilities.RisenTide, stage: Stages.Defense },
  ];

  for (const { name, ability, stage } of RISEN) {
    it(`gets ${name} back up once, cured and a stage sharper`, () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      holder.addAbility(ability);
      holder.addStatus(Statuses.Burned, NONE_CAUSE);

      const maxHP = holder.checkStat(Stats.HP, 0);

      enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, maxHP * 2, 0);

      expect(holder.alive).toBe(true);
      expect(holder.health).toBe(1);
      expect(holder.status[Statuses.Burned]).toBeUndefined();
      expect(holder.stages[stage]).toBe(1);

      // The tower burns once: the next one finishes it
      holder.setHealth(maxHP);
      enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, maxHP * 2, 0);

      expect(holder.alive).toBe(false);
    });
  }
});

describe('Tyrant', () => {
  it('holds the far side down where it is', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Tyrant);

    enemy.addStage(Stages.Attack, 2, NONE_CAUSE);

    expect(enemy.stages[Stages.Attack]).toBe(0);

    // Drops still land on them, and its own side builds as it likes
    enemy.addStage(Stages.Attack, -1, NONE_CAUSE);
    ally.addStage(Stages.Attack, 2, NONE_CAUSE);

    expect(enemy.stages[Stages.Attack]).toBe(-1);
    expect(ally.stages[Stages.Attack]).toBe(2);
  });
});

describe('Silver Aegis', () => {
  it('holds an ally up through the blow that would finish it', () => {
    const { battle, teamA, teamB } = createBattle();
    const guardian = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    guardian.addAbility(Abilities.SilverAegis);

    const blow = { type: EffectType.Move, move: Moves.Pound, unit: enemy } as const;
    const maxHP = ally.checkStat(Stats.HP, 0);

    enemy.damage(blow, ally, maxHP * 2, 0);

    expect(ally.alive).toBe(true);
    expect(ally.health).toBe(1);

    // One shield, and the guardian never held it over itself
    ally.setHealth(maxHP);
    enemy.damage(blow, ally, maxHP * 2, 0);

    expect(ally.alive).toBe(false);
    expect(guardian.alive).toBe(true);

    enemy.damage(blow, guardian, guardian.checkStat(Stats.HP, 0) * 2, 0);

    expect(guardian.alive).toBe(false);
  });
});

describe('Rainbow Rekindling', () => {
  it('puts the first ally that falls back on its feet', () => {
    const { battle, teamA, teamB } = createBattle();
    const phoenix = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    phoenix.addAbility(Abilities.RainbowRekindling);

    ally.faint(enemy);

    expect(ally.alive).toBe(true);
    expect(ally.health).toBeCloseTo(ally.checkStat(Stats.HP, 0) * RAINBOW_REKINDLING_FRACTION, 5);

    // The rainbow comes once
    second.faint(enemy);

    expect(second.alive).toBe(false);
  });
});

describe('Timeline Split', () => {
  it('steps back to before it was worn down', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TimelineSplit);

    holder.addStage(Stages.Attack, 2, NONE_CAUSE);
    holder.addStage(Stages.Defense, -2, NONE_CAUSE);
    holder.addStage(Stages.Speed, -1, NONE_CAUSE);
    holder.addStatus(Statuses.Burned, NONE_CAUSE);

    const maxHP = holder.checkStat(Stats.HP, 0);

    // Still above the line: nothing splits yet
    enemy.damage(NONE_CAUSE, holder, maxHP * 0.2, 0);

    expect(holder.stages[Stages.Defense]).toBe(-2);

    enemy.damage(NONE_CAUSE, holder, maxHP * (1 - TIMELINE_SPLIT_THRESHOLD), 0);

    expect(holder.stages[Stages.Defense]).toBe(0);
    expect(holder.stages[Stages.Speed]).toBe(0);
    // What it built for itself is its own doing and stays
    expect(holder.stages[Stages.Attack]).toBe(2);
    expect(holder.status[Statuses.Burned]).toBeUndefined();

    // Once per battle
    holder.addStage(Stages.Defense, -1, NONE_CAUSE);
    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(holder.stages[Stages.Defense]).toBe(-1);
  });
});

describe('the Hoenn starters', () => {
  it('grows Sap Surge a stage of Speed for every action', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.SapSurge);

    for (let grown = 1; grown <= GROWTH_MAX_STAGES; grown += 1) {
      act(battle, holder);

      expect(holder.stages[Stages.Speed]).toBe(grown);
    }

    // It only grows itself so far
    act(battle, holder);

    expect(holder.stages[Stages.Speed]).toBe(GROWTH_MAX_STAGES);

    // Taking the field again starts it over, stages and all
    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    act(battle, holder);

    expect(holder.stages[Stages.Speed]).toBe(GROWTH_MAX_STAGES + 1);
  });

  it('grows Ember Surge a stage of Attack for every blow that lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.EmberSurge);

    rollMove(battle, holder, enemy, Moves.Pound, true);

    expect(holder.stages[Stages.Attack]).toBe(1);

    // Acting is not landing
    act(battle, holder);

    expect(holder.stages[Stages.Attack]).toBe(1);
  });

  it('grows Silt Surge a stage of Special Defense for every hit taken', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SiltSurge);

    const blow = { type: EffectType.Move, move: Moves.Pound, unit: enemy } as const;

    enemy.damage(blow, holder, 10, 0);

    expect(holder.stages[Stages.SpecialDefense]).toBe(1);

    // Chip damage is not a blow
    enemy.damage(blow, holder, 10, DamageFlags.Indirect);

    expect(holder.stages[Stages.SpecialDefense]).toBe(1);
  });
});

describe('Pack Hunt', () => {
  it('hits harder at whatever an ally has already been at', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.PackHunt);

    const target = unitTarget(enemy);

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    // Its own bite opens nothing up
    holder.damage({ type: EffectType.Move, move: Moves.Pound, unit: holder }, enemy, 10, 0);

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    ally.damage({ type: EffectType.Move, move: Moves.Pound, unit: ally }, enemy, 10, 0);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(40 * PACK_HUNT_SCALE, 5);
  });
});

describe('Crooked Run', () => {
  it('is harder to hit for every step it takes, until something lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CrookedRun);

    const target = unitTarget(holder);
    const clean = enemy.checkMoveAccuracy(Moves.Pound, target);

    for (let steps = 1; steps <= CROOKED_RUN_MAX_STACKS + 2; steps += 1) {
      act(battle, holder);

      const kept = Math.min(CROOKED_RUN_MAX_STACKS, steps);

      expect(enemy.checkMoveAccuracy(Moves.Pound, target)).toBeCloseTo(
        (clean ?? 0) * CROOKED_RUN_SCALE ** kept,
        5,
      );
    }

    // Caught once, and the whole run counts for nothing
    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(enemy.checkMoveAccuracy(Moves.Pound, target)).toBe(clean);
  });

  it('leaves a blow aimed at anybody else alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CrookedRun);

    const clean = enemy.checkMoveAccuracy(Moves.Pound, unitTarget(ally));

    act(battle, holder);

    expect(enemy.checkMoveAccuracy(Moves.Pound, unitTarget(ally))).toBe(clean);
  });
});

describe('Cocoon', () => {
  it('shells over once, cutting both sides of a blow', () => {
    const { battle, teamA, teamB } = createBattle();
    // The damage roll is pinned, so the blows differ only by the shell
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Cocoon);

    const maxHP = holder.checkStat(Stats.HP, 0);
    const bare = resolveAttackDamage(battle, enemy, holder);
    const thrown = resolveAttackDamage(battle, holder, enemy);

    holder.setHealth(maxHP * COCOON_THRESHOLD + 10);
    enemy.damage(NONE_CAUSE, holder, 20, 0);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(bare * COCOON_SCALE, 5);
    expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(thrown * COCOON_SCALE, 5);

    // The shell opens on its own, and it only ever grows one
    battle.tick(COCOON_DURATION);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(bare, 5);

    holder.setHealth(maxHP * COCOON_THRESHOLD - 1);
    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(bare, 5);
  });
});

describe('the Lotad and Seedot pair', () => {
  it('calls up its own sky as it takes the field', () => {
    const { battle, teamA } = createBattle();
    const lotad = createUnit(battle, teamA);
    lotad.addAbility(Abilities.WaterBloom);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: lotad,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(battle.weather.current).toBe(Weathers.Rain);

    const seedot = createUnit(battle, teamA);
    seedot.addAbility(Abilities.SunRoot);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: seedot,
      reactivation: false,
    });
    battle.tick(turns(1));

    // Whichever arrived last owns the sky, which is how the two cancel
    expect(battle.weather.current).toBe(Weathers.Sunny);
  });

  it('pays the water half in health and the sun half in damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const lotad = createUnit(battle, teamA);
    const seedot = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    lotad.addAbility(Abilities.WaterBloom);
    seedot.addAbility(Abilities.SunRoot);

    const maxHP = lotad.checkStat(Stats.HP, 0);
    const clean = resolveAttackDamage(battle, seedot, enemy);

    lotad.setHealth(maxHP / 2);
    lotad.setWeather(Weathers.Rain);

    act(battle, lotad);

    expect(lotad.health - maxHP / 2).toBeCloseTo(maxHP * GROVE_HEAL_FRACTION, 5);

    // Nothing for the sun half while the rain stands
    expect(resolveAttackDamage(battle, seedot, enemy)).toBeCloseTo(clean, 5);

    seedot.setWeather(Weathers.Sunny);
    lotad.setHealth(maxHP / 2);

    act(battle, lotad);

    expect(lotad.health).toBe(maxHP / 2);
    expect(resolveAttackDamage(battle, seedot, enemy)).toBeCloseTo(clean * GROVE_DAMAGE_SCALE, 5);
  });
});

describe("Migrant's Wind", () => {
  it('casts Tailwind over its side as it arrives', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.MigrantsWind);

    let cast: Moves | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.target.type === MoveTargetType.Team) {
        cast = event.move;
      }
    });

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(cast).toBe(Moves.Tailwind);
  });
});

describe("Gull's Greed", () => {
  it('takes its cut out of an enemy heal', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.GullsGreed);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);
    enemy.setHealth(1);

    enemy.heal(NONE_CAUSE, enemy, 40, 0);

    expect(enemy.health).toBeCloseTo(1 + 40 * (1 - GULLS_GREED_SHARE), 5);
    expect(holder.health).toBeCloseTo(maxHP / 2 + 40 * GULLS_GREED_SHARE, 5);

    // Nothing taken out of its own side's healing
    const ally = createUnit(battle, teamA);
    ally.setHealth(1);

    ally.heal(NONE_CAUSE, ally, 40, 0);

    expect(ally.health).toBeCloseTo(41, 5);
  });
});

describe('Empath', () => {
  it('answers for whatever its side is carrying', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Empath);

    const parent = makeAttack(holder, enemy, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, parent, holder, Stats.SpecialAttack, 100)).toBe(100);

    ally.setHealth(ally.checkStat(Stats.HP, 0) * EMPATH_THRESHOLD - 1);

    expect(resolveAttackStat(battle, parent, holder, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * EMPATH_SCALE,
      5,
    );

    // Its own hurt is not the side's, and the physical half is untouched
    ally.setHealth(ally.checkStat(Stats.HP, 0));
    holder.setHealth(1);

    expect(resolveAttackStat(battle, parent, holder, Stats.SpecialAttack, 100)).toBe(100);
  });
});

describe('Surface Walk', () => {
  it('lets the hazards and the weather pass under it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SurfaceWalk);

    const maxHP = holder.checkStat(Stats.HP, 0);

    enemy.damage(
      { type: EffectType.Move, move: Moves.Spikes, unit: enemy },
      holder,
      maxHP / 8,
      DamageFlags.Indirect,
    );

    expect(holder.health).toBe(maxHP);

    holder.damage(
      { type: EffectType.Weather, weather: Weathers.Sandstorm, unit: holder },
      holder,
      maxHP / 16,
      DamageFlags.Indirect,
    );

    expect(holder.health).toBe(maxHP);

    // A blow is still a blow
    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, maxHP / 4, 0);

    expect(holder.health).toBeLessThan(maxHP);
  });
});

describe('Mycelium', () => {
  it('feeds on whatever is already sick, whichever side is carrying it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Mycelium);

    const cleanOut = resolveAttackDamage(battle, holder, enemy);
    const cleanIn = resolveAttackDamage(battle, enemy, holder);

    enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(cleanOut * MYCELIUM_SCALE, 5);

    // Its own side is no exception: the fungus does not pick a team
    holder.addStatus(Statuses.Burned, NONE_CAUSE);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(cleanIn * MYCELIUM_SCALE, 5);
  });
});

describe('Wide Swing', () => {
  it('widens a physical move over the whole far side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.WideSwing);

    expect(holder.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.None);

    // A special move and a status move still pick their one target
    expect(holder.checkMoveTargeting(Moves.Ember).target).toBe(MoveTargets.Unit);
    expect(holder.checkMoveTargeting(Moves.SleepPowder).target).toBe(MoveTargets.Unit);

    // And nobody else swings that wide
    expect(enemy.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.Unit);
  });
});

describe('Vanishing Act', () => {
  it('cannot be found for a moment after it strikes', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.VanishingAct);

    expect(rolled(battle, enemy, holder, Moves.Pound)).toBe(true);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(rolled(battle, enemy, holder, Moves.Pound)).toBe(false);

    // A move that covers the whole side finds it anyway
    expect(rolled(battle, enemy, holder, Moves.Earthquake)).toBe(true);

    // It comes back up on its own
    battle.tick(VANISHING_ACT_DURATION);

    expect(rolled(battle, enemy, holder, Moves.Pound)).toBe(true);
  });

  it('is taken out of the running while it is gone', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.VanishingAct);

    function usable(): boolean {
      const event = {
        id: 'CheckUnitAIMoveUsable',
        disabled: false,
        source: enemy,
        move: Moves.Pound,
        target: unitTarget(holder),
        usable: true,
      };
      battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
      return event.usable;
    }

    expect(usable()).toBe(true);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(usable()).toBe(false);
  });
});

describe('Echo Chamber', () => {
  it('sends a sound move back off the walls', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.EchoChamber);

    const shout = dealDamage(holder, enemy, Moves.Uproar, 90, Types.Normal, MoveCategories.Special);
    const before = enemy.health;

    battle.tick(ECHO_CHAMBER_DELAY);

    expect(before - enemy.health).toBeCloseTo(shout * ECHO_CHAMBER_FRACTION, 5);
  });

  it('has nothing to say about a move that is not sound', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.EchoChamber);

    dealDamage(holder, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    const before = enemy.health;

    battle.tick(ECHO_CHAMBER_DELAY);

    expect(enemy.health).toBe(before);
  });
});

describe('Shove', () => {
  it('costs an enemy the cast it was winding up', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Shove);
    enemy.addMove(Moves.Ember);

    enemy.cast(Moves.Ember, unitTarget(holder));

    expect(enemy.casting).not.toBeUndefined();

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.status[Statuses.Flinched]).not.toBeUndefined();
    expect(enemy.casting).toBeUndefined();
  });

  it('has nothing to shove when the enemy is standing still', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Shove);

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.status[Statuses.Flinched]).toBeUndefined();
  });
});

describe('Magnetize', () => {
  it('pulls what was aimed at an ally onto itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Magnetize);
    enemy.addMove(Moves.Ember);

    enemy.cast(Moves.Ember, unitTarget(ally));

    expect(enemy.casting?.target).toEqual(unitTarget(holder));
  });

  it('leaves a spread move and a move aimed at its own side alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    holder.addAbility(Abilities.Magnetize);
    enemy.addMove(Moves.Growl);

    // Aimed at its own side, so there is nothing coming to pull
    enemy.cast(Moves.Growl, unitTarget(other));

    expect(enemy.casting?.target).toEqual(unitTarget(other));
  });
});

describe('Kitten Pace', () => {
  it('plays fastest while nothing has caught it', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    holder.addAbility(Abilities.KittenPace);

    const clean = bare.checkStat(Stats.Speed, 0);

    expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(clean * KITTEN_PACE_SCALE, 5);

    holder.setHealth(holder.checkStat(Stats.HP, 0) - 1);

    expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(clean, 5);
  });
});

describe('the Sableye and Mawile pair', () => {
  it('knocks the highest raise off, and keeps it on the other half', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const sableye = createUnit(battle, teamA);
    const mawile = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    sableye.addAbility(Abilities.ShadowTax);
    mawile.addAbility(Abilities.JawClaim);

    enemy.addStage(Stages.Attack, 3, NONE_CAUSE);
    enemy.addStage(Stages.Defense, 1, NONE_CAUSE);

    sableye.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    // The highest raise is the one taken, and nobody keeps it
    expect(enemy.stages[Stages.Attack]).toBe(2);
    expect(enemy.stages[Stages.Defense]).toBe(1);
    expect(sableye.stages[Stages.Attack]).toBe(0);

    mawile.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.stages[Stages.Attack]).toBe(1);
    expect(mawile.stages[Stages.Attack]).toBe(1);
  });

  it('has nothing to take off a target that has raised nothing', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const mawile = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    mawile.addAbility(Abilities.JawClaim);

    enemy.addStage(Stages.Speed, -2, NONE_CAUSE);

    mawile.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.stages[Stages.Speed]).toBe(-2);
    expect(mawile.stages[Stages.Speed]).toBe(0);
  });
});

describe('Ore Hunger', () => {
  it('eats a blow of steel, rock or earth', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.OreHunger);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    enemy.damage({ type: EffectType.Move, move: Moves.RockThrow, unit: enemy }, holder, 100, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + 100 * ORE_HUNGER_FRACTION, 5);

    // Anything else is still a blow
    holder.setHealth(maxHP);
    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, 100, 0);

    expect(holder.health).toBeCloseTo(maxHP - 100, 5);
  });
});

describe('Mind Over Body', () => {
  it('takes half of what lands while it is holding a move together', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.MindOverBody);
    holder.addMove(Moves.Ember);

    const clean = resolveAttackDamage(battle, enemy, holder);

    holder.cast(Moves.Ember, unitTarget(enemy));

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(clean * MIND_OVER_BODY_SCALE, 5);

    holder.stopCast();

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(clean, 5);
  });
});

describe('Jolt Start', () => {
  it('puts the opening move ahead of everything, and nothing after it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.JoltStart);

    const target = unitTarget(enemy);
    const clean = bare.checkMovePower(Moves.Pound, target) ?? 0;

    expect(holder.checkMovePriority(Moves.Pound, target)).toBe(1);
    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean * JOLT_START_SCALE, 5);

    act(battle, holder);

    // The jolt still covers the move it went off with, but nothing is
    // coming out ahead any more
    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean * JOLT_START_SCALE, 5);
    expect(holder.checkMovePriority(Moves.Pound, target)).toBe(0);

    act(battle, holder);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean, 5);
  });
});

describe('the Plusle and Minun pair', () => {
  it('lifts the ally that needs it and drags the best enemy down', () => {
    const { battle, teamA, teamB } = createBattle();
    const plusle = createUnit(battle, teamA);
    const minun = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    plusle.addAbility(Abilities.CheerOn);
    minun.addAbility(Abilities.JeerAt);

    hurt.setHealth(hurt.checkStat(Stats.HP, 0) / 4);
    hurt.setStat(StatsKind.Base, Stats.Attack, 200);
    enemy.setStat(StatsKind.Base, Stats.Speed, 200);

    act(battle, plusle);

    expect(hurt.stages[Stages.Attack]).toBe(1);

    act(battle, minun);

    expect(enemy.stages[Stages.Speed]).toBe(-1);
  });

  it('only has so many shouts in it', () => {
    const { battle, teamA, teamB } = createBattle();
    const plusle = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    createUnit(battle, teamB);
    plusle.addAbility(Abilities.CheerOn);

    ally.setHealth(1);
    ally.setStat(StatsKind.Base, Stats.Attack, 200);

    for (let shouts = 0; shouts < CHEER_MAX_SHOUTS + 2; shouts += 1) {
      act(battle, plusle);
    }

    expect(ally.stages[Stages.Attack]).toBe(CHEER_MAX_SHOUTS);
  });
});

describe('the Volbeat and Illumise pair', () => {
  it('leaves the far side nowhere to hide and nobody quick', () => {
    const { battle, teamA, teamB } = createBattle();
    const volbeat = createUnit(battle, teamA);
    const illumise = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    // Measured before the pair lights up, since the aura covers the
    // whole far side
    const clean = enemy.checkStat(Stats.Speed, 0);

    volbeat.addAbility(Abilities.TailLight);
    illumise.addAbility(Abilities.LureScent);

    enemy.addStage(Stages.Evasion, 3, NONE_CAUSE);

    expect(enemy.checkStage(Stages.Evasion, 0)).toBe(0);
    expect(enemy.checkStat(Stats.Speed, 0)).toBeCloseTo(clean * LURE_SCENT_SCALE, 5);

    // Neither aura reaches its own side
    volbeat.addStage(Stages.Evasion, 2, NONE_CAUSE);

    expect(volbeat.checkStage(Stages.Evasion, 0)).toBe(2);
  });

  it('takes the light and the scent with it when it goes', () => {
    const { battle, teamA, teamB } = createBattle();
    const volbeat = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    volbeat.addAbility(Abilities.TailLight);

    enemy.addStage(Stages.Evasion, 2, NONE_CAUSE);

    expect(enemy.checkStage(Stages.Evasion, 0)).toBe(0);

    volbeat.faint(enemy);

    expect(enemy.checkStage(Stages.Evasion, 0)).toBe(2);
  });
});

describe('Perennial', () => {
  it('flowers again once, clean', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Perennial);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP * PERENNIAL_THRESHOLD + 10);
    holder.addStatus(Statuses.Poisoned, NONE_CAUSE);

    enemy.damage(NONE_CAUSE, holder, 20, 0);

    expect(holder.status[Statuses.Poisoned]).toBeUndefined();
    expect(holder.health).toBeCloseTo(
      maxHP * PERENNIAL_THRESHOLD - 10 + maxHP * PERENNIAL_HEAL_FRACTION,
      5,
    );

    // Only ever the once
    holder.setHealth(maxHP * PERENNIAL_THRESHOLD - 1);
    const before = holder.health;

    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(holder.health).toBeCloseTo(before - 1, 5);
  });
});

describe('Bottomless', () => {
  it('feeds on whatever anybody else spends', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bottomless);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    enemy.addItem(Items.SitrusBerry);
    enemy.setHealth(enemy.checkStat(Stats.HP, 0) / 4);
    battle.tick(turns(1));

    expect(enemy.items[Items.SitrusBerry]).toBeUndefined();
    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * BOTTOMLESS_FRACTION, 5);
  });

  it('gets nothing from an item knocked out of a hand', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bottomless);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    enemy.addItem(Items.Leftovers);
    enemy.removeItem(Items.Leftovers, { type: EffectType.Move, move: Moves.Pound, unit: holder });

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);
  });
});

describe('Feeding Frenzy', () => {
  it('takes a step for each enemy that falls, up to the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.FeedingFrenzy);

    const meals = [];
    for (let index = 0; index < FEEDING_FRENZY_MAX_STAGES + 1; index += 1) {
      meals.push(createUnit(battle, teamB));
    }

    for (const [index, meal] of meals.entries()) {
      meal.faint(holder);

      expect(holder.stages[Stages.Attack]).toBe(Math.min(FEEDING_FRENZY_MAX_STAGES, index + 1));
    }
  });

  it('is fed by nothing on its own side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FeedingFrenzy);

    ally.faint(enemy);

    expect(holder.stages[Stages.Attack]).toBe(0);
  });
});

describe('Spout', () => {
  it('widens a Water move over the whole far side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Spout);

    expect(holder.checkMoveTargeting(Moves.WaterGun).target).toBe(MoveTargets.None);

    // Anything that is not Water still picks its one target
    expect(holder.checkMoveTargeting(Moves.Ember).target).toBe(MoveTargets.Unit);

    // And nobody else spouts
    expect(enemy.checkMoveTargeting(Moves.WaterGun).target).toBe(MoveTargets.Unit);
  });
});

describe('Magma Vent', () => {
  it('empties the hump over the far side once', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.MagmaVent);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP * MAGMA_VENT_THRESHOLD + 10);

    first.damage(NONE_CAUSE, holder, 20, 0);

    for (const enemy of [first, second]) {
      const theirs = enemy.checkStat(Stats.HP, 0);

      expect(theirs - enemy.health).toBeCloseTo(theirs * MAGMA_VENT_FRACTION, 5);
    }

    // Only ever the once
    const before = first.health;

    holder.setHealth(maxHP * MAGMA_VENT_THRESHOLD - 1);
    first.damage(NONE_CAUSE, holder, 1, 0);

    expect(first.health).toBe(before);
  });
});

describe('Body Heat', () => {
  it('counts both defences higher under its own sun', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.BodyHeat);

    const defense = holder.checkStat(Stats.Defense, 0);
    const special = holder.checkStat(Stats.SpecialDefense, 0);
    const attack = holder.checkStat(Stats.Attack, 0);

    holder.setWeather(Weathers.Sunny);

    expect(holder.checkStat(Stats.Defense, 0)).toBeCloseTo(defense * BODY_HEAT_SCALE, 5);
    expect(holder.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(special * BODY_HEAT_SCALE, 5);

    // Nothing about what it hits with
    expect(holder.checkStat(Stats.Attack, 0)).toBeCloseTo(attack, 5);
  });
});

describe('Stored Bounce', () => {
  it('keeps half of what lands on it and gives the lot back', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.StoredBounce);

    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, 80, 0);

    const before = enemy.health;
    const dealt = dealDamage(holder, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    // The blow itself plus the stored half of the 80 it took
    expect(before - enemy.health).toBeCloseTo(dealt, 5);
    expect(dealt).toBeGreaterThan(80 * STORED_BOUNCE_SHARE);

    // The bank empties on that one blow
    const second = dealDamage(
      holder,
      enemy,
      Moves.Pound,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(second).toBeLessThan(dealt - 80 * STORED_BOUNCE_SHARE + 1);
  });

  it('holds no more than half its own HP', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.StoredBounce);

    const maxHP = holder.checkStat(Stats.HP, 0);

    for (let hits = 0; hits < 8; hits += 1) {
      enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, maxHP / 4, 0);
      holder.setHealth(maxHP);
    }

    const bare = createUnit(battle, teamA);
    const clean = dealDamage(bare, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);
    const loaded = dealDamage(
      holder,
      enemy,
      Moves.Pound,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(loaded - clean).toBeCloseTo(maxHP * STORED_BOUNCE_CAP, 0);
  });
});

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

describe('the Sinnoh starters', () => {
  it('takes the first physical blow at half and puts roots down', () => {
    const { battle, teamA, teamB } = createBattle();
    const turtle = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    turtle.addAbility(Abilities.BarkBrace);
    turtle.enter();
    attacker.enter();
    battle.tick(1);

    const pool = turtle.checkStat(Stats.HP, 0);

    attacker.attack(turtle, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(turns(1));

    const braced = pool - turtle.health;

    // The roots are Ingrain's, so they land on the move's own delay
    expect(turtle.status[Statuses.Rooted]).toBeDefined();

    // The second one of the same kind is a blow like any other
    attacker.attack(turtle, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(1);

    expect(pool - turtle.health - braced).toBeGreaterThan(braced);
  });

  it('takes the first special blow at half and puts the flare into its next move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const chimp = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    const bystander = createUnit(battle, teamB);

    chimp.addAbility(Abilities.CinderBrace);
    chimp.enter();
    attacker.enter();
    bystander.enter();
    battle.tick(1);

    const plain = bystander.health;

    chimp.attack(bystander, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(1);

    const ordinary = plain - bystander.health;

    attacker.attack(chimp, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);
    battle.tick(1);

    const before = bystander.health;

    chimp.attack(bystander, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(1);

    // The flare rides the next move that lands, and only that one
    expect(before - bystander.health).toBeCloseTo(ordinary * 1.5, 5);

    const after = bystander.health;

    chimp.attack(bystander, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(1);

    expect(after - bystander.health).toBeCloseTo(ordinary, 5);
  });

  it('refuses the first status move aimed at it and takes a stage for the insult', () => {
    const { battle, teamA, teamB } = createBattle();
    const penguin = createUnit(battle, teamA);
    const talker = createUnit(battle, teamB);

    penguin.addAbility(Abilities.CrestBrace);
    penguin.enter();
    talker.enter();
    battle.tick(1);

    talker.triggerMove(Moves.Growl, unitTarget(penguin), 0);
    battle.tick(turns(1));

    expect(penguin.stages[Stages.SpecialAttack]).toBe(1);
    expect(penguin.stages[Stages.Attack]).toBe(0);

    // Only the first: the next one lands
    talker.triggerMove(Moves.Growl, unitTarget(penguin), 0);
    battle.tick(turns(1));

    expect(penguin.stages[Stages.Attack]).toBe(-1);
  });
});

describe('signature feedback', () => {
  /**
   * A ring of signatures that each answer the thing the next one
   * does. What is being asserted is that the answers run out: a
   * signature whose answer re-triggers the signature that caused it
   * would recurse until the stack gave way, and on a raid field of
   * forty-nine that is a frozen page rather than a caught bug
   */
  const watchDepth = (battle: ReturnType<typeof createBattle>['battle']): (() => number) => {
    let depth = 0;
    let deepest = 0;
    // Counted through the bus itself rather than through any one
    // event: what nests here is one listener causing the next
    const engine: Emitting = battle;
    const emit = engine.emit.bind(engine);

    engine.emit = (type, event): void => {
      depth++;
      deepest = Math.max(deepest, depth);

      if (depth > RUNAWAY_DEPTH) {
        throw new Error('runaway event recursion');
      }
      try {
        emit(type, event);
      } finally {
        depth--;
      }
    };

    return () => deepest;
  };

  it('settles a ring of heal answers', () => {
    const { battle, teamA } = createBattle('loop-heal');
    pinRandom(battle, 0);

    const reef = createUnit(battle, teamA);
    const pair = createUnit(battle, teamA);
    const other = createUnit(battle, teamA);
    const gull = createUnit(battle, teamA);
    const over = createUnit(battle, teamA);

    reef.addAbility(Abilities.CoralBloom);
    pair.addAbility(Abilities.SharedHeart);
    other.addAbility(Abilities.SharedHeart);
    gull.addAbility(Abilities.GullsGreed);
    over.addAbility(Abilities.Spillover);

    battle.initialize();
    battle.start();

    for (const unit of [reef, pair, other, gull, over]) {
      unit.setHealth(Math.floor(unit.checkStat(Stats.HP, 0) / 2));
    }

    const deepest = watchDepth(battle);

    reef.heal(NONE_CAUSE, reef, 40, 0);
    pair.heal(NONE_CAUSE, pair, 40, 0);
    // More than it can hold, so the spill is paid out as well
    over.heal(NONE_CAUSE, over, 400, 0);

    expect(deepest()).toBeLessThan(RUNAWAY_DEPTH);
  });

  it('settles a ring of damage answers', () => {
    const { battle, teamA, teamB } = createBattle('loop-damage');
    pinRandom(battle, 0);

    const spikes = createUnit(battle, teamA);
    const misery = createUnit(battle, teamA);
    const vent = createUnit(battle, teamA);
    const back = createUnit(battle, teamB);
    const skull = createUnit(battle, teamB);
    const arc = createUnit(battle, teamB);

    spikes.addAbility(Abilities.SpikeShell);
    misery.addAbility(Abilities.SharedMisery);
    vent.addAbility(Abilities.MagmaVent);
    back.addAbility(Abilities.Backlash);
    skull.addAbility(Abilities.SkullCharge);
    arc.addAbility(Abilities.ChainLightning);

    battle.initialize();
    battle.start();

    const deepest = watchDepth(battle);

    // Low enough that the ones that answer a hard fight are armed
    for (const unit of [spikes, misery, vent, back, skull, arc]) {
      unit.setHealth(Math.floor(unit.checkStat(Stats.HP, 0) / 4));
    }

    // Contact damage caused by a move, which is what the reflectors
    // are gated on: a bare damage call reaches none of them
    const swing = (source: Unit, target: Unit, type: Types): void => {
      source.attack(target, Moves.Tackle, 40, type, MoveCategories.Physical, 0);
    };

    swing(skull, spikes, Types.Normal);
    swing(spikes, back, Types.Normal);
    swing(arc, vent, Types.Electric);
    swing(back, misery, Types.Normal);
    swing(misery, skull, Types.Normal);
    swing(vent, arc, Types.Fire);

    for (let frame = 0; frame < 20; frame++) {
      battle.tick(250);
    }

    expect(deepest()).toBeLessThan(RUNAWAY_DEPTH);
  });

  it('lets a confused holder hit itself without asking what the hit was', () => {
    const { battle, teamA } = createBattle('loop-confusion');
    pinRandom(battle, 0);

    // Sweet Paw drinks from what its move lands, and a confusion
    // self-hit arrives as a move nobody registered: it must answer
    // the contact question rather than look the hit up
    const paw = createUnit(battle, teamA);

    paw.addAbility(Abilities.SweetPaw);

    battle.initialize();
    battle.start();

    expect(() => {
      paw.attack(paw, Moves._Confused, 40, Types.Unknown, MoveCategories.Physical, 0);
    }).not.toThrow();

    expect(paw.checkMoveContact(Moves._Confused, unitTarget(paw))).toBe(false);
  });
});

describe('the three that open Sinnoh', () => {
  it('pays a Starly for the flock it stands in, up to a ceiling', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const mates = [0, 1, 2, 3, 4, 5].map(() => createUnit(battle, teamA));
    const enemy = createUnit(battle, teamB);

    bird.addAbility(Abilities.Murmuration);
    bird.enter();
    enemy.enter();

    for (const mate of mates) {
      mate.enter();
    }

    battle.tick(1);

    // Six others standing is past where the flock stops paying
    expect(bird.checkMovePower(Moves.Tackle, unitTarget(enemy))).toBeCloseTo(40 * FLOCK_CEILING, 5);

    for (const mate of mates.slice(1)) {
      mate.damage(NONE_CAUSE, mate, mate.health, 0);
    }

    // One left beside it is one step of the scale
    expect(bird.checkMovePower(Moves.Tackle, unitTarget(enemy))).toBeCloseTo(40 * FLOCK_SCALE, 5);

    mates[0].damage(NONE_CAUSE, mates[0], mates[0].health, 0);

    expect(bird.checkMovePower(Moves.Tackle, unitTarget(enemy))).toBe(40);
  });

  it('leaves a quarter of what is indirect off its own lodge', () => {
    const { battle, teamA, teamB } = createBattle();
    const beaver = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    beaver.addAbility(Abilities.Lodgework);
    beaver.enter();
    ally.enter();
    enemy.enter();
    battle.tick(1);

    const before = ally.health;

    enemy.damage(NONE_CAUSE, ally, 20, DamageFlags.Indirect);

    expect(before - ally.health).toBeCloseTo(20 * LODGE_SCALE, 5);

    // A cost is what a pokemon spent rather than what was done to it
    const paid = ally.health;

    ally.damage(NONE_CAUSE, ally, 20, DamageFlags.Indirect | DamageFlags.Cost);

    expect(paid - ally.health).toBe(20);

    // The far side builds no dams
    const across = enemy.health;

    ally.damage(NONE_CAUSE, enemy, 20, DamageFlags.Indirect);

    expect(across - enemy.health).toBe(20);

    // And it holds for nobody once the builder is down
    beaver.damage(NONE_CAUSE, beaver, beaver.health, 0);

    const alone = ally.health;

    enemy.damage(NONE_CAUSE, ally, 20, DamageFlags.Indirect);

    expect(alone - ally.health).toBe(20);
  });

  it('lifts every sound move on its own side and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const cricket = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    cricket.addAbility(Abilities.Chorus);
    cricket.enter();
    ally.enter();
    enemy.enter();
    battle.tick(1);

    expect(ally.checkMovePower(Moves.BugBuzz, unitTarget(enemy))).toBeCloseTo(90 * CHORUS_SCALE, 5);
    expect(cricket.checkMovePower(Moves.BugBuzz, unitTarget(enemy))).toBeCloseTo(
      90 * CHORUS_SCALE,
      5,
    );

    // What is not sung is not conducted
    expect(ally.checkMovePower(Moves.Tackle, unitTarget(enemy))).toBe(40);

    // Nor is the far side's singing
    expect(enemy.checkMovePower(Moves.BugBuzz, unitTarget(ally))).toBe(90);
  });
});
