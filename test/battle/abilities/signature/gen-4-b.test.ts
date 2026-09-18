// Bonsly through Arceus.

import { describe, expect, it } from 'vitest';
import {
  SEALED_DURATION,
  SEALED_SCALE,
  WOKEN_SCALE,
  WOKEN_STAGES,
} from '../../../../src/battle/abilities/signature/__create';
import { APPLIANCE_SCALE } from '../../../../src/battle/abilities/signature/rotom';
import { LAVADOME_SCALE } from '../../../../src/battle/abilities/signature/heatran-regigigas';
import {
  DEEP_TOLL_FRACTION,
  RANK_AIR_SCALE,
  SKYHUNT_SCALE,
} from '../../../../src/battle/abilities/signature/stunky-to-gible';
import {
  AMBUSH_SCALE,
  AURA_MATCH_SCALE,
  DUST_BATH_FRACTION,
} from '../../../../src/battle/abilities/signature/riolu-to-skorupi';
import {
  EVERGREEN_SCALE,
  FALSE_EYES_THRESHOLD,
  FINISHER_SCALE,
  FINISHER_THRESHOLD,
} from '../../../../src/battle/abilities/signature/croagunk-to-snover';
import { AttackPriority } from '../../../../src/core/event-emitter';
import type Battle from '../../../../src/battle/core';
import {
  BattleEvents,
  EffectType,
  MoveTargetType,
  type UnitDamageEvent,
} from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses, Weathers } from '../../../../src/data/ids/status';
import turns from '../../../../src/battle/turn';
import { unitTarget } from '../../../../src/battle/utils';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, makeAttack, resolveAttackDamage, resolveAttackStat } from './helpers';

describe('the skunk, the bell and the shark', () => {
  it('sprays harder at whatever is already breathing it', () => {
    const { battle, teamA, teamB } = createBattle();
    const skunk = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const clean = createUnit(battle, teamB);

    skunk.addAbility(Abilities.RankAir);

    expect(skunk.checkMovePower(Moves.Tackle, unitTarget(enemy))).toBe(40);

    enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(skunk.checkMovePower(Moves.Tackle, unitTarget(enemy))).toBeCloseTo(
      40 * RANK_AIR_SCALE,
      5,
    );
    expect(skunk.checkMovePower(Moves.Tackle, unitTarget(clean))).toBe(40);

    // The bad poison is the same poison as far as the cloud is concerned
    clean.addStatus(Statuses.BadlyPoisoned, NONE_CAUSE);

    expect(skunk.checkMovePower(Moves.Tackle, unitTarget(clean))).toBeCloseTo(
      40 * RANK_AIR_SCALE,
      5,
    );
  });

  it('tolls for the far side every time the bell swings', () => {
    const { battle, teamA, teamB } = createBattle();
    const bell = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);

    bell.addAbility(Abilities.DeepToll);

    const enemyHP = first.checkStat(Stats.HP, 0);
    const allyHP = ally.checkStat(Stats.HP, 0);

    act(battle, bell);

    expect(first.health).toBeCloseTo(enemyHP - enemyHP * DEEP_TOLL_FRACTION, 5);
    expect(second.health).toBeCloseTo(enemyHP - enemyHP * DEEP_TOLL_FRACTION, 5);
    // Its own side hears nothing
    expect(ally.health).toBe(allyHP);

    act(battle, bell);

    expect(first.health).toBeCloseTo(enemyHP - 2 * enemyHP * DEEP_TOLL_FRACTION, 5);

    // And nobody else's move rings it
    act(battle, ally);

    expect(first.health).toBeCloseTo(enemyHP - 2 * enemyHP * DEEP_TOLL_FRACTION, 5);
  });

  it('reaches what is off the ground, and hits it harder for being there', () => {
    const { battle, teamA, teamB } = createBattle();
    const shark = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const flier = createUnit(battle, teamB);
    const walker = createUnit(battle, teamB);

    shark.addAbility(Abilities.Skyhunt);
    flier.addType(Types.Flying);

    expect(shark.checkMoveImmunity(Moves.MudSlap, unitTarget(flier), Types.Ground)).toBe(false);
    expect(plain.checkMoveImmunity(Moves.MudSlap, unitTarget(flier), Types.Ground)).toBe(true);

    // The lift is for the ones it had to reach up to
    expect(shark.checkMovePower(Moves.MudSlap, unitTarget(flier))).toBeCloseTo(
      20 * SKYHUNT_SCALE,
      5,
    );
    expect(shark.checkMovePower(Moves.MudSlap, unitTarget(walker))).toBe(20);

    // And it is Ground moves that get it, not everything it throws
    expect(shark.checkMovePower(Moves.Tackle, unitTarget(flier))).toBe(40);
  });
});

describe('the aura, the sand and the sting', () => {
  it('rises to whatever is in better shape than it is', () => {
    const { battle, teamA, teamB } = createBattle();
    const reader = createUnit(battle, teamA);
    const whole = createUnit(battle, teamB);
    const hurt = createUnit(battle, teamB);

    reader.addAbility(Abilities.AuraMatch);
    hurt.setHealth(hurt.checkStat(Stats.HP, 0) / 4);

    expect(reader.checkMovePower(Moves.Tackle, unitTarget(whole))).toBe(40);

    reader.setHealth(reader.checkStat(Stats.HP, 0) / 2);

    expect(reader.checkMovePower(Moves.Tackle, unitTarget(whole))).toBeCloseTo(
      40 * AURA_MATCH_SCALE,
      5,
    );
    // The reading is of shares, so anything worse off than it is reads plain
    expect(reader.checkMovePower(Moves.Tackle, unitTarget(hurt))).toBe(40);
  });

  it('rolls in the sand it makes, and in nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const hippo = createUnit(battle, teamA);
    createUnit(battle, teamB);

    hippo.addAbility(Abilities.DustBath);

    const maxHP = hippo.checkStat(Stats.HP, 0);
    hippo.setHealth(maxHP / 2);

    // No sand yet, so reaching for a move puts nothing back
    act(battle, hippo);

    expect(hippo.health).toBeCloseTo(maxHP / 2, 5);

    teamA.weather.current = Weathers.Sandstorm;

    act(battle, hippo);

    expect(hippo.health).toBeCloseTo(maxHP / 2 + maxHP * DUST_BATH_FRACTION, 5);
  });

  it('gets one blow in on each enemy before it is seen', () => {
    const { battle, teamA, teamB } = createBattle();
    const scorpion = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);

    scorpion.addAbility(Abilities.Ambush);
    scorpion.enter();
    first.enter();
    battle.tick(1);

    expect(scorpion.checkMovePower(Moves.Tackle, unitTarget(first))).toBeCloseTo(
      40 * AMBUSH_SCALE,
      5,
    );

    scorpion.attack(first, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(scorpion.checkMovePower(Moves.Tackle, unitTarget(first))).toBe(40);
    // Cover is spent one enemy at a time
    expect(scorpion.checkMovePower(Moves.Tackle, unitTarget(second))).toBeCloseTo(
      40 * AMBUSH_SCALE,
      5,
    );
  });
});

describe('the frog, the fish and the tree', () => {
  it('winds up faster once the target is nearly done', () => {
    const { battle, teamA, teamB } = createBattle();
    const frog = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    frog.addAbility(Abilities.Finisher);

    const whole = frog.checkMoveCastTime(Moves.Flamethrower, unitTarget(enemy));

    expect(whole).toBeGreaterThan(0);

    enemy.setHealth(enemy.checkStat(Stats.HP, 0) * FINISHER_THRESHOLD);

    expect(frog.checkMoveCastTime(Moves.Flamethrower, unitTarget(enemy))).toBeCloseTo(
      whole * FINISHER_SCALE,
      5,
    );
  });

  it('takes the move aimed at a teammate that is worse off', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    fish.addAbility(Abilities.FalseEyes);
    enemy.addMove(Moves.Tackle);
    fish.enter();
    mate.enter();
    enemy.enter();
    battle.tick(1);

    const landed: Unit[] = [];

    battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Post, (event) => {
      if (event.source === enemy && event.target.type === MoveTargetType.Unit) {
        landed.push(event.target.unit);
      }
    });

    // Whole, so the pattern has nothing to draw
    enemy.triggerMove(Moves.Tackle, unitTarget(mate), 0);
    battle.tick(turns(2));

    expect(landed).toEqual([mate]);

    mate.setHealth(mate.checkStat(Stats.HP, 0) * FALSE_EYES_THRESHOLD - 1);

    const hurt = mate.health;
    const whole = fish.health;

    landed.length = 0;

    enemy.triggerMove(Moves.Tackle, unitTarget(mate), 0);
    battle.tick(turns(2));

    // The move itself comes across, so the blow is struck at the fish
    expect(landed).toEqual([fish]);
    expect(fish.health).toBeLessThan(whole);
    expect(mate.health).toBe(hurt);
  });

  it('leaves a blow a Follow Me has already drawn', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const guard = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    fish.addAbility(Abilities.FalseEyes);
    enemy.addMove(Moves.Tackle);
    fish.enter();
    guard.enter();
    mate.enter();
    enemy.enter();
    battle.tick(1);

    // The one drawing everything is the one worth covering, which is
    // exactly when the fish would otherwise take it away
    guard.setHealth(guard.checkStat(Stats.HP, 0) / 4);
    guard.triggerMoveEffect(Moves.FollowMe, { type: MoveTargetType.None }, 0);
    enemy.cast(Moves.Tackle, unitTarget(mate));

    const landed: Unit[] = [];

    battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Post, (event) => {
      if (event.source === enemy && event.target.type === MoveTargetType.Unit) {
        landed.push(event.target.unit);
      }
    });

    battle.tick(turns(4));

    expect(landed).toEqual([guard]);
  });

  it('leaves a blow the teammate was going to shrug off', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const drawer = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    fish.addAbility(Abilities.FalseEyes);
    drawer.addAbility(Abilities.StormDrain);
    enemy.addMove(Moves.WaterGun);
    fish.enter();
    drawer.enter();
    enemy.enter();
    battle.tick(1);

    drawer.setHealth(drawer.checkStat(Stats.HP, 0) / 4);

    const landed: Unit[] = [];

    battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Post, (event) => {
      if (event.source === enemy && event.target.type === MoveTargetType.Unit) {
        landed.push(event.target.unit);
      }
    });

    enemy.triggerMove(Moves.WaterGun, unitTarget(drawer), 0);
    battle.tick(turns(2));

    // The water was the drawer's to eat, so the fish stays out of it
    expect(landed).toEqual([drawer]);
    expect(drawer.stages[Stages.SpecialAttack]).toBe(1);
  });

  it('answers a fire only while its own snow falls', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const tree = createUnit(battle, teamB);

    tree.addAbility(Abilities.Evergreen);

    const parent = makeAttack(attacker, tree, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, parent, attacker, Stats.SpecialAttack, 100)).toBe(100);

    teamB.weather.current = Weathers.Hail;

    expect(resolveAttackStat(battle, parent, attacker, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * EVERGREEN_SCALE,
      5,
    );
  });
});

describe('the moon duo', () => {
  it('Waning Light halves a night on its own team and leaves the far side alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const cause = { type: EffectType.Move, unit: enemy, move: Moves.Hypnosis } as const;

    holder.addAbility(Abilities.WaningLight);

    // Itself included: it is asleep under its own crescent too
    expect(mate.checkStatusDuration(Statuses.Sleeping, 4000, cause)).toBe(2000);
    expect(holder.checkStatusDuration(Statuses.Sleeping, 4000, cause)).toBe(2000);
    expect(enemy.checkStatusDuration(Statuses.Sleeping, 4000, cause)).toBe(4000);
  });

  it('Waxing Dark stretches what it laid down itself and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    holder.addAbility(Abilities.WaxingDark);

    const its = { type: EffectType.Move, unit: holder, move: Moves.Hypnosis } as const;
    const other = { type: EffectType.Move, unit: mate, move: Moves.Hypnosis } as const;

    expect(enemy.checkStatusDuration(Statuses.Sleeping, 4000, its)).toBe(6000);
    // A teammate's sleep is a teammate's, and its own side is never
    // what it is drawing out
    expect(enemy.checkStatusDuration(Statuses.Sleeping, 4000, other)).toBe(4000);
    expect(mate.checkStatusDuration(Statuses.Sleeping, 4000, its)).toBe(4000);
  });

  it('cuts back below what it started at when the two meet', () => {
    const { battle, teamA, teamB } = createBattle();
    const dark = createUnit(battle, teamA);
    const light = createUnit(battle, teamB);
    const mate = createUnit(battle, teamB);

    dark.addAbility(Abilities.WaxingDark);
    light.addAbility(Abilities.WaningLight);

    const cause = { type: EffectType.Move, unit: dark, move: Moves.Hypnosis } as const;

    // 1.5x drawn out and 0.5x cut back, in whichever order they answer
    expect(mate.checkStatusDuration(Statuses.Sleeping, 4000, cause)).toBe(3000);
  });

  it('never compounds, however many are standing', () => {
    const { battle, teamA, teamB } = createBattle();
    const first = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const cause = { type: EffectType.Move, unit: enemy, move: Moves.Hypnosis } as const;

    first.addAbility(Abilities.WaningLight);
    second.addAbility(Abilities.WaningLight);

    expect(first.checkStatusDuration(Statuses.Sleeping, 4000, cause)).toBe(2000);
  });
});

describe('the prince of the sea', () => {
  it('Heartcurrent writes an enemy stage onto itself as the enemy gains it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const cause = { type: EffectType.None } as const;

    holder.addAbility(Abilities.Heartcurrent);

    enemy.addStage(Stages.Attack, 2, cause);

    // The enemy keeps what it raised: nothing was taken off it
    expect(enemy.stages[Stages.Attack]).toBe(2);
    expect(holder.stages[Stages.Attack]).toBe(2);
    // And it is the holder's, not its team's
    expect(mate.stages[Stages.Attack]).toBe(0);
  });

  it('takes gains only, and never its own side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const cause = { type: EffectType.None } as const;

    holder.addAbility(Abilities.Heartcurrent);

    enemy.addStage(Stages.Speed, -1, cause);
    mate.addStage(Stages.Speed, 1, cause);

    expect(holder.stages[Stages.Speed]).toBe(0);
  });

  it('does not answer its own copy when both sides are holding it', () => {
    const { battle, teamA, teamB } = createBattle();
    const first = createUnit(battle, teamA);
    const second = createUnit(battle, teamB);
    const enemy = createUnit(battle, teamB);

    first.addAbility(Abilities.Heartcurrent);
    second.addAbility(Abilities.Heartcurrent);

    enemy.addStage(Stages.SpecialAttack, 1, { type: EffectType.None });

    // The first copies the enemy, and the second does not copy the
    // copy back
    expect(first.stages[Stages.SpecialAttack]).toBe(1);
    expect(second.stages[Stages.SpecialAttack]).toBe(0);
  });
});

describe('the fourth golem', () => {
  it('Titan Seal takes half without giving half back, then wakes', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TitanSeal);

    const clean = resolveAttackDamage(battle, bare, enemy);
    const incoming = resolveAttackDamage(battle, enemy, bare);

    // Sealed: it takes half, and what it deals is left alone, since
    // Slow Start is already halving the Attack behind it
    expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(clean, 5);
    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(incoming * SEALED_SCALE, 5);

    battle.tick(SEALED_DURATION);

    expect(holder.stages[Stages.Attack]).toBe(WOKEN_STAGES);
    expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(clean * WOKEN_SCALE, 5);
    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(incoming, 5);
  });
});

describe('Lavadome', () => {
  /** A blow that has already been worked out, for the dome to answer */
  function landed(source: Unit, target: Unit): UnitDamageEvent {
    return {
      id: 'UnitDamage',
      disabled: false,
      source,
      target,
      value: 100,
      flags: 0,
      success: true,
      cause: { type: EffectType.None },
    };
  }

  it('makes a burn on the far side worth more, whoever the blow came from', () => {
    const { battle, teamA, teamB } = createBattle();
    const heatran = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const cause = { type: EffectType.None } as const;

    heatran.addAbility(Abilities.Lavadome);
    enemy.addStatus(Statuses.Burned, cause);
    mate.addStatus(Statuses.Burned, cause);

    const onEnemy = landed(mate, enemy);

    battle.emit(BattleEvents.UnitDamage, onEnemy);

    expect(onEnemy.value).toBeCloseTo(100 * LAVADOME_SCALE, 5);

    // Its own side burns at the usual rate
    const onMate = landed(enemy, mate);

    battle.emit(BattleEvents.UnitDamage, onMate);

    expect(onMate.value).toBeCloseTo(100, 5);
  });

  it('leaves an enemy that is not burning alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const heatran = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    heatran.addAbility(Abilities.Lavadome);

    const blow = landed(heatran, enemy);

    battle.emit(BattleEvents.UnitDamage, blow);

    expect(blow.value).toBeCloseTo(100, 5);
  });
});

describe('Purebloom', () => {
  it('takes the cost out of poison for its own team and nobody else', () => {
    const { battle, teamA, teamB } = createBattle();
    const flower = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const cause = { type: EffectType.Move, unit: enemy, move: Moves.Toxic } as const;

    flower.addAbility(Abilities.Purebloom);
    flower.addStatus(Statuses.Poisoned, cause);
    mate.addStatus(Statuses.Poisoned, cause);
    // A residual only chips when somebody is behind it
    enemy.addStatus(Statuses.Poisoned, { type: EffectType.Move, unit: mate, move: Moves.Toxic });

    const flowerHP = flower.health;
    const mateHP = mate.health;
    const enemyHP = enemy.health;

    battle.tick(turns(1));

    // Still poisoned, and still on the clock: it just costs nothing
    expect(flower.status[Statuses.Poisoned]).toBeDefined();
    expect(mate.status[Statuses.Poisoned]).toBeDefined();
    expect(flower.health).toBe(flowerHP);
    expect(mate.health).toBe(mateHP);
    expect(enemy.health).toBeLessThan(enemyHP);
  });

  it('leaves a burn alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const flower = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const cause = { type: EffectType.Move, unit: enemy, move: Moves.WillOWisp } as const;

    flower.addAbility(Abilities.Purebloom);
    flower.addStatus(Statuses.Burned, cause);

    const flowerHP = flower.health;

    battle.tick(turns(1));

    expect(flower.health).toBeLessThan(flowerHP);
  });
});

describe('Appliance', () => {
  it('lifts what the machine gives it and leaves the current alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const rotom = createUnit(battle, teamA, [Types.Electric, Types.Fire]);
    const enemy = createUnit(battle, teamB);
    rotom.addAbility(Abilities.Appliance);

    const fire = makeAttack(rotom, enemy, Moves.Overheat, Types.Fire, MoveCategories.Special);
    const electric = makeAttack(
      rotom,
      enemy,
      Moves.ThunderShock,
      Types.Electric,
      MoveCategories.Special,
    );
    const ghost = makeAttack(rotom, enemy, Moves.ShadowBall, Types.Ghost, MoveCategories.Special);

    expect(resolveAttackStat(battle, fire, rotom, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * APPLIANCE_SCALE,
      5,
    );
    // The current it is made of is not what the machine gave it
    expect(resolveAttackStat(battle, electric, rotom, Stats.SpecialAttack, 100)).toBe(100);
    // And a type this shape does not have is nothing to it
    expect(resolveAttackStat(battle, ghost, rotom, Stats.SpecialAttack, 100)).toBe(100);
  });
});

describe('the squirrel, the bird, the stone and the trap', () => {
  it('Sparkfur puts the charge in a teammate rather than in itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const squirrel = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    squirrel.addAbility(Abilities.Sparkfur);
    pinRandom(battle, 0);

    enemy.triggerMove(Moves.Tackle, unitTarget(mate), 0);
    battle.tick(turns(2));

    expect(enemy.status[Statuses.Paralyzed]).toBeDefined();
  });

  it('Birdsong turns a listener around, and only on a sound move', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    bird.addAbility(Abilities.Birdsong);
    pinRandom(battle, 0);

    bird.triggerMove(Moves.Tackle, unitTarget(enemy), 0);
    battle.tick(turns(2));

    expect(enemy.status[Statuses.Confused]).toBeUndefined();

    // Chatter would confuse on its own, so the test uses a sound move
    // that does not
    bird.triggerMove(Moves.BugBuzz, unitTarget(enemy), 0);
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Confused]).toBeDefined();
  });

  it('Soulwell takes in whoever stopped standing, either side', () => {
    const { battle, teamA, teamB } = createBattle();
    const stone = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    stone.addAbility(Abilities.Soulwell);

    const full = stone.health;

    stone.damage({ type: EffectType.None }, stone, Math.floor(full / 2), 0);

    const hurt = stone.health;

    mate.faint(enemy);
    battle.tick(turns(1));

    expect(stone.health).toBeGreaterThan(hurt);

    const healed = stone.health;

    enemy.faint(stone);
    battle.tick(turns(1));

    expect(stone.health).toBeGreaterThan(healed);
  });

  it('Snapvine shuts on each enemy once', () => {
    const { battle, teamA, teamB } = createBattle();
    const vine = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    vine.addAbility(Abilities.Snapvine);

    vine.triggerMove(Moves.Tackle, unitTarget(enemy), 0);
    battle.tick(turns(2));

    expect(enemy.status[Statuses.Trapped]).toBeDefined();

    // The hold runs out, and the trap does not shut on the same one
    // twice
    enemy.removeStatus(Statuses.Trapped, { type: EffectType.None });
    vine.triggerMove(Moves.Tackle, unitTarget(enemy), 0);
    battle.tick(turns(2));

    expect(enemy.status[Statuses.Trapped]).toBeUndefined();
  });
});

describe('Firstlight', () => {
  /** What the chart says, once everybody has answered */
  function effectiveness(battle: Battle, attacker: Unit, target: Unit, type: Types): number {
    const parent = makeAttack(attacker, target, Moves.Judgment, type, MoveCategories.Special);
    let total = 1;

    for (const defending of target.types) {
      const event = {
        id: 'UnitAttackResolveEffectiveness',
        disabled: false,
        parent,
        defendingType: defending,
        multiplier: 1,
      };
      battle.emit(BattleEvents.UnitAttackResolveEffectiveness, event);
      total *= event.multiplier;
    }

    return total;
  }

  it('reads a resistance as none, and leaves the rest of the chart alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const alpha = createUnit(battle, teamA, [Types.Fire]);
    const wet = createUnit(battle, teamB, [Types.Water]);
    const bug = createUnit(battle, teamB, [Types.Bug]);

    expect(effectiveness(battle, alpha, wet, Types.Fire)).toBeCloseTo(0.5, 5);

    alpha.addAbility(Abilities.Firstlight);

    expect(effectiveness(battle, alpha, wet, Types.Fire)).toBeCloseTo(1, 5);
    // A weakness is still a weakness
    expect(effectiveness(battle, alpha, bug, Types.Fire)).toBeCloseTo(2, 5);
  });

  it('leaves an immunity standing, and a type it is not wearing', () => {
    const { battle, teamA, teamB } = createBattle();
    const alpha = createUnit(battle, teamA, [Types.Normal]);
    const ghost = createUnit(battle, teamB, [Types.Ghost]);
    const steel = createUnit(battle, teamB, [Types.Steel]);
    alpha.addAbility(Abilities.Firstlight);

    // Nothing reaches a Ghost with a Normal move, ability or not
    expect(effectiveness(battle, alpha, ghost, Types.Normal)).toBeCloseTo(0, 5);
    // Steel resists Normal, and this is the type it is wearing
    expect(effectiveness(battle, alpha, steel, Types.Normal)).toBeCloseTo(1, 5);
    // Thrown as something it is not wearing, the chart is the chart
    expect(effectiveness(battle, alpha, steel, Types.Grass)).toBeCloseTo(0.5, 5);
  });
});
