import { describe, expect, it } from 'vitest';
import registerAbilities, {
  getAbilityData,
  getRegisteredAbilities,
} from '../../../src/data/abilities';
import { SIGNATURE_ABILITIES } from '../../../src/battle/abilities/signature';
import {
  LATENT_POTENTIAL_SCALE,
  PREDATORS_DIVE_SCALE,
  ROLLBACK_SAMPLE,
  ROLLBACK_THRESHOLD,
  ROLLBACK_WINDOW,
  SERRATED_EDGE_DURATION,
  SERRATED_EDGE_FRACTION,
  SPIRAL_SHELL_FLOOR,
  SPIRAL_SHELL_STEP,
} from '../../../src/battle/abilities/signature/eevee-to-dragonite';
import { AttackPriority } from '../../../src/core/event-emitter';
import {
  AFTERBURN_MAX_STACKS,
  AFTERBURN_STEP,
  CHAIN_LIGHTNING_FRACTION,
  NIBBLE_FRACTION,
  OVERPRESSURE_COOLDOWN_STEP,
  OVERPRESSURE_MAX_STACKS,
  OVERPRESSURE_POWER_SCALE,
  RELENTLESS_MAX_STACKS,
  RELENTLESS_STEP,
  SEED_CACHE_BANK_FRACTION,
  SEED_CACHE_CAP_FRACTION,
  SLIPSTREAM_SCALE,
  SQUEEZE_FRACTION,
  SQUEEZE_INTERVAL,
  TWIN_STINGER_POWER_SCALE,
} from '../../../src/battle/abilities/signature/bulbasaur-to-pikachu';
import {
  ADAPTIVE_CELL_SCALE,
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
  MIMED_BARRIER_ALLY_SCALE,
  MIMED_BARRIER_SELF_SCALE,
  MOTHERS_SHIELD_THRESHOLD,
  MOURNING_BONE_SCALE,
  OVERLOAD_SPEED_SCALE,
  OVERLOAD_THRESHOLD,
  PSYSEED_FRACTION,
  SAFE_PASSAGE_STATUS_SCALE,
  SECOND_WIND_HEAL_FRACTION,
  SECOND_WIND_THRESHOLD,
  SMOG_SCREEN_ACCURACY_SCALE,
  SNAPJAW_SCALE,
  STATIC_FIELD_MAX_STACKS,
  STATIC_FIELD_STEP,
  UPSTREAM_SCALE,
  VINE_WEB_FRACTION,
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
  CURL_UP_MAX_STACKS,
  CURL_UP_STEP,
  DEEP_ROOTS_SCALE,
  LULLABY_POWER_SCALE,
  LULLABY_SLEEP_SCALE,
  NINE_TAILS_MAX_STACKS,
  NINE_TAILS_STEP,
  REGAL_HIDE_EXPOSED_SCALE,
  REGAL_HIDE_GUARD_SCALE,
  REGAL_HIDE_THRESHOLD,
  REGAL_VENOM_SCALE,
  WISHING_WELL_FRACTION,
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
import { MoveCategories, MoveTargets, Moves } from '../../../src/data/ids/moves';
import { Statuses, Weathers } from '../../../src/data/ids/status';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_CAUSE = { type: EffectType.None } as const;

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

describe('Seed Cache', () => {
  it('banks a quarter of what it takes and spends it on a Grass move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SeedCache);

    enemy.damage(NONE_CAUSE, holder, 40, 0);

    const spent = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const plain = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(spent - plain).toBeCloseTo(40 * SEED_CACHE_BANK_FRACTION, 5);
  });

  it('empties the bank once it is spent, and only Grass spends it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SeedCache);

    enemy.damage(NONE_CAUSE, holder, 40, 0);

    const normal = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );
    const plainNormal = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    // A Normal move leaves the bank where it is
    expect(normal).toBeCloseTo(plainNormal, 5);

    const first = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const second = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(first - second).toBeCloseTo(40 * SEED_CACHE_BANK_FRACTION, 5);
  });

  it('fills no further than half its HP', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SeedCache);

    const maxHP = holder.checkStat(Stats.HP, 0);

    // Fed far past the cap, healed back each time so it survives
    for (let i = 0; i < 20; i += 1) {
      enemy.damage(NONE_CAUSE, holder, 100, 0);
      holder.setHealth(maxHP);
    }

    const spent = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const plain = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(spent - plain).toBeCloseTo(maxHP * SEED_CACHE_CAP_FRACTION, 5);
  });
});

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

/** One resolved use of a move, landed or missed */
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

describe('Afterburn', () => {
  it('shortens the wind-up by a step for each Fire move it lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Afterburn);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCastTime(Moves.Flamethrower, target);

    expect(bare).toBeGreaterThan(0);

    for (let landed = 1; landed <= AFTERBURN_MAX_STACKS; landed += 1) {
      rollMove(battle, holder, enemy, Moves.Flamethrower, true);

      expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
        bare * (1 - AFTERBURN_STEP * landed),
        5,
      );
    }

    // Past the cap it holds where it is
    rollMove(battle, holder, enemy, Moves.Flamethrower, true);

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * (1 - AFTERBURN_STEP * AFTERBURN_MAX_STACKS),
      5,
    );
  });

  it('is blown out by a miss or by a move of another type', () => {
    const { battle, teamA, teamB } = createBattle();
    // 100 accuracy is the ceiling, so a pinned roll misses anything short of it
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Afterburn);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCastTime(Moves.Flamethrower, target);

    rollMove(battle, holder, enemy, Moves.Flamethrower, true);
    rollMove(battle, holder, enemy, Moves.FireBlast, false);

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);

    rollMove(battle, holder, enemy, Moves.Flamethrower, true);
    rollMove(battle, holder, enemy, Moves.Tackle, true);

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);
  });

  it('comes back on the field with the flame it started with', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Afterburn);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCastTime(Moves.Flamethrower, target);

    rollMove(battle, holder, enemy, Moves.Flamethrower, true);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);
  });
});

describe('Overpressure', () => {
  it('drives Water moves harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Overpressure);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const water = holder.checkMovePower(Moves.WaterGun, target);
    const other = holder.checkMovePower(Moves.Tackle, target);

    expect(water).toBeCloseTo(40 * OVERPRESSURE_POWER_SCALE, 5);
    expect(other).toBe(40);
  });

  it('fouls its cooldowns with every shot that lands, and vents on another type', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Overpressure);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCooldown(Moves.WaterGun, target);

    expect(bare).toBeGreaterThan(0);

    for (let landed = 1; landed <= OVERPRESSURE_MAX_STACKS; landed += 1) {
      rollMove(battle, holder, enemy, Moves.WaterGun, true);

      expect(holder.checkMoveCooldown(Moves.WaterGun, target)).toBeCloseTo(
        bare * (1 + OVERPRESSURE_COOLDOWN_STEP * landed),
        5,
      );
    }

    // Past the cap the fouling holds where it is
    rollMove(battle, holder, enemy, Moves.WaterGun, true);

    expect(holder.checkMoveCooldown(Moves.WaterGun, target)).toBeCloseTo(
      bare * (1 + OVERPRESSURE_COOLDOWN_STEP * OVERPRESSURE_MAX_STACKS),
      5,
    );

    rollMove(battle, holder, enemy, Moves.Tackle, true);

    expect(holder.checkMoveCooldown(Moves.WaterGun, target)).toBe(bare);
  });

  it('leaves the cannons clean when a shot misses', () => {
    const { battle, teamA, teamB } = createBattle();
    // 100 accuracy is the ceiling, so a pinned roll misses anything short of it
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Overpressure);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCooldown(Moves.WaterGun, target);

    rollMove(battle, holder, enemy, Moves.HydroPump, false);

    expect(holder.checkMoveCooldown(Moves.WaterGun, target)).toBe(bare);
  });
});

describe('Slipstream', () => {
  it('shortens every wind-up on the field, the enemy included', () => {
    const plain = createBattle();
    const bare = createUnit(plain.battle, plain.teamA).checkMoveCastTime(Moves.Flamethrower, {
      type: MoveTargetType.None,
    });

    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Slipstream);

    const target = { type: MoveTargetType.None } as const;

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * SLIPSTREAM_SCALE,
      5,
    );
    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * SLIPSTREAM_SCALE,
      5,
    );
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
  it('rolls tighter with every hit and spends the roll on the next physical move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CurlUp);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bareDefense = holder.checkStat(Stats.Defense, 0);
    const maxHP = holder.checkStat(Stats.HP, 0);

    for (let taken = 1; taken <= CURL_UP_MAX_STACKS + 2; taken += 1) {
      enemy.damage(NONE_CAUSE, holder, 1, 0);
      holder.setHealth(maxHP);

      const curled = Math.min(CURL_UP_MAX_STACKS, taken);

      expect(holder.checkStat(Stats.Defense, 0)).toBeCloseTo(
        bareDefense * (1 + CURL_UP_STEP * curled),
        5,
      );
      expect(holder.checkMovePower(Moves.Tackle, target)).toBeCloseTo(
        40 * (1 + CURL_UP_STEP * curled),
        5,
      );
    }

    // A special move leaves the roll where it is
    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(holder.checkStat(Stats.Defense, 0)).toBeCloseTo(
      bareDefense * (1 + CURL_UP_STEP * CURL_UP_MAX_STACKS),
      5,
    );

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.checkStat(Stats.Defense, 0)).toBe(bareDefense);
    expect(holder.checkMovePower(Moves.Tackle, target)).toBe(40);
  });
});

describe('Regal Hide', () => {
  it('turns physical blows aside until the hide cracks', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.RegalHide);

    const physical = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const special = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);
    const maxHP = holder.checkStat(Stats.HP, 0);

    expect(resolveAttackStat(battle, physical, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * REGAL_HIDE_GUARD_SCALE,
      5,
    );

    // Only the physical half is turned aside while she is whole
    expect(resolveAttackStat(battle, special, enemy, Stats.SpecialAttack, 100)).toBe(100);

    holder.setHealth(maxHP * REGAL_HIDE_THRESHOLD - 1);

    expect(resolveAttackStat(battle, physical, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * REGAL_HIDE_EXPOSED_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, special, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * REGAL_HIDE_EXPOSED_SCALE,
      5,
    );
  });
});

describe('Regal Venom', () => {
  it('poisons badly and hits the poisoned harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.RegalVenom);

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBe(100);

    enemy.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonSting,
      unit: holder,
    });

    // The mild poison never landed
    expect(enemy.status[Statuses.Poisoned]).toBeUndefined();
    expect(enemy.status[Statuses.BadlyPoisoned]).not.toBeUndefined();

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * REGAL_VENOM_SCALE,
      5,
    );
  });

  it('leaves poison from anybody else alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.RegalVenom);

    enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(enemy.status[Statuses.Poisoned]).not.toBeUndefined();
  });
});

describe('Wishing Well', () => {
  it('heals the ally furthest from full each time it acts, never itself', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const scratched = createUnit(battle, teamA);
    holder.addAbility(Abilities.WishingWell);

    const maxHP = hurt.checkStat(Stats.HP, 0);
    holder.setHealth(1);
    hurt.setHealth(maxHP / 4);
    scratched.setHealth(maxHP - 1);

    act(battle, holder);

    expect(hurt.health).toBeCloseTo(maxHP / 4 + maxHP * WISHING_WELL_FRACTION, 5);
    expect(scratched.health).toBe(maxHP - 1);
    expect(holder.health).toBe(1);
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
  it('braces what lands on it mid-cast and refuses a flinch', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.DeepRoots);

    const parent = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    // Standing free: no roots, and a flinch would land
    expect(resolveAttackStat(battle, parent, enemy, Stats.Attack, 100)).toBe(100);
    expect(holder.checkStatusImmunity(Statuses.Flinched, NONE_CAUSE)).toBe(false);

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: holder,
      move: Moves.SolarBeam,
      target: { type: MoveTargetType.Unit, unit: enemy },
    });

    expect(holder.casting).not.toBeUndefined();
    expect(resolveAttackStat(battle, parent, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * DEEP_ROOTS_SCALE,
      5,
    );
    expect(holder.checkStatusImmunity(Statuses.Flinched, NONE_CAUSE)).toBe(true);
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
  it('feeds every time a seeded mind is used', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Psyseed);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    // Nothing is seeded yet
    act(battle, enemy);

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);

    // A move of another type plants nothing either
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
    act(battle, enemy);

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);

    holder.attack(enemy, Moves.Confusion, 40, Types.Psychic, MoveCategories.Special, 0);
    holder.setHealth(maxHP / 2);

    act(battle, enemy);

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * PSYSEED_FRACTION, 5);
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
  it('bites whatever walks onto the field against it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const ally = createUnit(battle, teamA);
    holder.addAbility(Abilities.VineWeb);

    const maxHP = enemy.checkStat(Stats.HP, 0);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: enemy,
      reactivation: false,
    });

    expect(maxHP - enemy.health).toBeCloseTo(maxHP * VINE_WEB_FRACTION, 5);

    // Its own side walks over the vines safely, and a reactivation is
    // not an arrival
    const allyHealth = ally.health;

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: ally,
      reactivation: false,
    });
    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: enemy,
      reactivation: true,
    });

    expect(ally.health).toBe(allyHealth);
    expect(maxHP - enemy.health).toBeCloseTo(maxHP * VINE_WEB_FRACTION, 5);
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
  it('screens the side from special moves and leaves itself open', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.MimedBarrier);

    const atAlly = makeAttack(enemy, ally, Moves.Ember, Types.Fire, MoveCategories.Special);
    const atHolder = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);
    const physical = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const atAllyPhysical = makeAttack(
      enemy,
      ally,
      Moves.Pound,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(resolveAttackStat(battle, atAlly, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * MIMED_BARRIER_ALLY_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, atHolder, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * MIMED_BARRIER_ALLY_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, physical, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * MIMED_BARRIER_SELF_SCALE,
      5,
    );

    // The screen is no help against a punch aimed at somebody else
    expect(resolveAttackStat(battle, atAllyPhysical, enemy, Stats.Attack, 100)).toBe(100);
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
  it('carries its allies past a trap and past a status', () => {
    const { battle, teamA, teamB } = createBattle();
    const ferry = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    ferry.addAbility(Abilities.SafePassage);

    ally.addStatus(Statuses.Cornered, NONE_CAUSE);
    enemy.addStatus(Statuses.Cornered, NONE_CAUSE);

    expect(ally.checkEscape()).toBe(true);
    expect(enemy.checkEscape()).toBe(false);

    const bare = enemy.checkStatusDuration(Statuses.Sleeping, turns(3), NONE_CAUSE);

    expect(ally.checkStatusDuration(Statuses.Sleeping, turns(3), NONE_CAUSE)).toBeCloseTo(
      bare * SAFE_PASSAGE_STATUS_SCALE,
      5,
    );
  });
});

describe('Adaptive Cell', () => {
  it('learns the last shape that hit it and forgets it for a new one', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.AdaptiveCell);

    const fire = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);
    const normal = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, fire, enemy, Stats.SpecialAttack, 100)).toBe(100);

    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(resolveAttackStat(battle, fire, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * ADAPTIVE_CELL_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, normal, enemy, Stats.Attack, 100)).toBe(100);

    enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(resolveAttackStat(battle, normal, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * ADAPTIVE_CELL_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, fire, enemy, Stats.SpecialAttack, 100)).toBe(100);
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

describe('Spiral Shell', () => {
  it('learns one attacker at a time, down to the floor', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.SpiralShell);

    const fromFirst = makeAttack(first, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const fromSecond = makeAttack(
      second,
      holder,
      Moves.Pound,
      Types.Normal,
      MoveCategories.Physical,
    );
    const maxHP = holder.checkStat(Stats.HP, 0);

    for (let blows = 1; blows <= 6; blows += 1) {
      first.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
      holder.setHealth(maxHP);

      expect(resolveAttackStat(battle, fromFirst, first, Stats.Attack, 100)).toBeCloseTo(
        100 * Math.max(SPIRAL_SHELL_FLOOR, 1 - SPIRAL_SHELL_STEP * blows),
        5,
      );
    }

    // Nothing the second attacker has to show for it
    expect(resolveAttackStat(battle, fromSecond, second, Stats.Attack, 100)).toBe(100);
  });
});

describe('Serrated Edge', () => {
  it('leaves a cut that costs the enemy every time it acts', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SerratedEdge);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    const maxHP = enemy.checkStat(Stats.HP, 0);
    enemy.setHealth(maxHP);

    act(battle, enemy);

    expect(maxHP - enemy.health).toBeCloseTo(maxHP * SERRATED_EDGE_FRACTION, 5);

    // The cut closes on its own
    battle.tick(SERRATED_EDGE_DURATION);
    enemy.setHealth(maxHP);

    act(battle, enemy);

    expect(enemy.health).toBe(maxHP);
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
