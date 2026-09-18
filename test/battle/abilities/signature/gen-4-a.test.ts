// Turtwig through Bronzor.

import { describe, expect, it } from 'vitest';
import {
  CHORUS_SCALE,
  FLOCK_CEILING,
  FLOCK_SCALE,
  LODGE_SCALE,
} from '../../../../src/battle/abilities/signature/starly-to-kricketot';
import {
  PATCHWORK_MAX_PATCHES,
  TWO_SEAS_SCALE,
} from '../../../../src/battle/abilities/signature/burmy-to-shellos';
import {
  CARRY_OFF_CHANCE,
  SPRINGHEEL_MAX_JUMPS,
  VELVET_CLAWS_SCALE,
} from '../../../../src/battle/abilities/signature/drifloon-to-glameow';
import {
  FLOAT_SAC_THRESHOLD,
  POLLEN_DOLE_FRACTION,
  SECOND_BLOOM_FRACTION,
  SECOND_BLOOM_STAGES,
} from '../../../../src/battle/abilities/signature/combee-to-cherubi';
import { Species } from '../../../../src/data/ids/species';
import { AttackPriority } from '../../../../src/core/event-emitter';
import { BattleEvents, MoveTargetType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { DamageFlags, MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import turns from '../../../../src/battle/turn';
import { unitTarget } from '../../../../src/battle/utils';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE } from './helpers';

/**
 * How deep a chain of answers is allowed to run before a test calls
 * it runaway. Ordinary play nests about a dozen events
 */
const RUNAWAY_DEPTH = 200;

/** The bus as a plain emitter, so a test can count what goes over it */
interface Emitting {
  emit(type: never, event: never): void;
}

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

describe('the lion and the two fossils', () => {
  it('sees through evasion and through a hiding place', () => {
    const { battle, teamA, teamB } = createBattle();
    const lion = createUnit(battle, teamA);
    const dodger = createUnit(battle, teamB);

    dodger.addStage(Stages.Evasion, 6, NONE_CAUSE);

    const parent = {
      id: 'UnitTriggerMove',
      disabled: false,
      source: lion,
      move: Moves.Tackle,
      target: { type: MoveTargetType.Unit, unit: dodger },
      steps: 0,
    } as const;

    const resolve = (): number | undefined => {
      const event = {
        id: 'UnitTriggerMoveResolveAccuracy',
        disabled: false,
        parent,
        accuracy: undefined as number | undefined,
      };
      battle.emit(BattleEvents.UnitTriggerMoveResolveAccuracy, event);
      return event.accuracy;
    };

    expect(resolve()).toBeCloseTo(100 / 3);

    lion.addAbility(Abilities.GleamEyes);

    expect(resolve()).toBeCloseTo(100);

    // A lowered accuracy of its own is still paid: only the evasion
    // half is taken back out
    lion.addStage(Stages.Accuracy, -2, NONE_CAUSE);

    expect(resolve()).toBeCloseTo(100 * (3 / 5));
  });

  it('reaches a target that is underground', () => {
    const { battle, teamA, teamB } = createBattle();
    // The accuracy roll always lands, so a miss is the hiding place
    pinRandom(battle, 0);
    const lion = createUnit(battle, teamA);
    const digger = createUnit(battle, teamB);

    lion.enter();
    digger.enter();
    battle.tick(1);

    digger.triggerMove(Moves.Dig, unitTarget(lion), 1);
    battle.tick(turns(1));

    expect(digger.status[Statuses.Invulnerable]).toBeDefined();

    const reaches = (): boolean => {
      const event = {
        id: 'UnitTriggerMoveRollHit' as const,
        disabled: false,
        parent: {
          id: 'UnitTriggerMove' as const,
          disabled: false,
          source: lion,
          move: Moves.Tackle,
          target: unitTarget(digger),
          steps: 0,
        },
        hit: false,
      };
      battle.emit(BattleEvents.UnitTriggerMoveRollHit, event);
      return event.hit;
    };

    expect(reaches()).toBe(false);

    lion.addAbility(Abilities.GleamEyes);

    expect(reaches()).toBe(true);
  });

  it('rams through a guard and through a substitute', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const skull = createUnit(battle, teamA);
    const guarded = createUnit(battle, teamB);

    skull.enter();
    guarded.enter();
    battle.tick(1);

    guarded.addStatus(Statuses.Protected, NONE_CAUSE);

    expect(skull.checkMoveImmunity(Moves.Tackle, unitTarget(guarded), Types.Normal)).toBe(true);

    skull.addAbility(Abilities.Ramrod);

    expect(skull.checkMoveImmunity(Moves.Tackle, unitTarget(guarded), Types.Normal)).toBe(false);

    // The guard does not survive being walked through, the way Feint
    // leaves it
    expect(guarded.status[Statuses.Protected]).toBeUndefined();

    guarded.addStatus(Statuses.Substituted, NONE_CAUSE);

    const behind = guarded.health;

    skull.attack(guarded, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(1);

    expect(guarded.health).toBeLessThan(behind);
  });

  it('hands the guard it puts up to everybody standing with it', () => {
    const { battle, teamA, teamB } = createBattle();
    const shield = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    shield.addAbility(Abilities.Bulwark);
    shield.enter();
    ally.enter();
    enemy.enter();
    battle.tick(1);

    shield.addStatus(Statuses.Protected, NONE_CAUSE);

    expect(ally.status[Statuses.Protected]).toBeDefined();

    // The far side is nobody it stands with
    expect(enemy.status[Statuses.Protected]).toBeUndefined();
  });
});

describe('the bagworm and the sea slug', () => {
  it('patches a hole once, and only so many holes', () => {
    const { battle, teamA, teamB } = createBattle();
    const worm = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    worm.addAbility(Abilities.Patchwork);
    worm.enter();
    attacker.enter();
    battle.tick(1);

    attacker.attack(worm, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(1);

    expect(worm.stages[Stages.Defense]).toBe(1);
    expect(worm.stages[Stages.SpecialDefense]).toBe(1);

    // The same hole is already patched
    attacker.attack(worm, Moves.BodySlam, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(1);

    expect(worm.stages[Stages.Defense]).toBe(1);

    attacker.attack(worm, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    battle.tick(1);
    attacker.attack(worm, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);
    battle.tick(1);
    attacker.attack(worm, Moves.ThunderShock, 40, Types.Electric, MoveCategories.Special, 0);
    battle.tick(1);

    // Three holes is what the case is worth
    expect(worm.stages[Stages.Defense]).toBe(PATCHWORK_MAX_PATCHES);
    expect(worm.stages[Stages.SpecialDefense]).toBe(PATCHWORK_MAX_PATCHES);
  });

  it('pays each shell for its own half of the sea', () => {
    const { battle, teamA, teamB } = createBattle();
    const west = createUnit(battle, teamA);
    const east = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    west.setSpecies(Species.Shellos);
    east.setSpecies(Species.ShellosEast);
    west.addAbility(Abilities.TwoSeas);
    east.addAbility(Abilities.TwoSeas);

    const target = unitTarget(enemy);

    expect(west.checkMovePower(Moves.WaterGun, target)).toBeCloseTo(40 * TWO_SEAS_SCALE, 5);
    expect(west.checkMovePower(Moves.MudSlap, target)).toBe(20);

    expect(east.checkMovePower(Moves.MudSlap, target)).toBeCloseTo(20 * TWO_SEAS_SCALE, 5);
    expect(east.checkMovePower(Moves.WaterGun, target)).toBe(40);
  });
});

describe('the comb, the sac and the blossom', () => {
  it('sends what it gathers to whoever needs it most', () => {
    const { battle, teamA, teamB } = createBattle();
    const bee = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const scratched = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    bee.addAbility(Abilities.PollenDole);
    bee.enter();
    hurt.enter();
    scratched.enter();
    enemy.enter();
    battle.tick(1);

    const pool = hurt.checkStat(Stats.HP, 0);

    hurt.setHealth(pool / 4);
    scratched.setHealth(pool / 2);

    const before = hurt.health;
    const beside = scratched.health;

    bee.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(1);

    expect(hurt.health - before).toBeCloseTo(pool * POLLEN_DOLE_FRACTION, 5);

    // Only the worst hurt one is paid
    expect(scratched.health).toBe(beside);
  });

  it('floats over the ground until the sac is opened', () => {
    const { battle, teamA, teamB } = createBattle();
    const weasel = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    weasel.addAbility(Abilities.FloatSac);
    weasel.enter();
    enemy.enter();
    battle.tick(1);

    expect(weasel.checkGrounded()).toBe(false);

    const pool = weasel.checkStat(Stats.HP, 0);

    enemy.damage(NONE_CAUSE, weasel, pool * FLOAT_SAC_THRESHOLD + 1, 0);

    expect(weasel.checkGrounded()).toBe(true);

    // Healing does not put the air back in
    weasel.heal(NONE_CAUSE, weasel, pool, 0);

    expect(weasel.checkGrounded()).toBe(true);
  });

  it('opens once when it is worth opening', () => {
    const { battle, teamA, teamB } = createBattle();
    const cherry = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    cherry.addAbility(Abilities.SecondBloom);
    cherry.enter();
    enemy.enter();
    battle.tick(1);

    const pool = cherry.checkStat(Stats.HP, 0);

    enemy.damage(NONE_CAUSE, cherry, pool * 0.6, 0);

    expect(cherry.stages[Stages.SpecialAttack]).toBe(SECOND_BLOOM_STAGES);
    expect(cherry.health).toBeCloseTo(pool * 0.4 + pool * SECOND_BLOOM_FRACTION, 5);

    // The blossom is already open
    const opened = cherry.health;

    enemy.damage(NONE_CAUSE, cherry, 10, 0);

    expect(cherry.health).toBe(opened - 10);
    expect(cherry.stages[Stages.SpecialAttack]).toBe(SECOND_BLOOM_STAGES);
  });
});

describe('the balloon, the ears and the claws', () => {
  it('blows the target away on the roll, and leaves it alone otherwise', () => {
    const { battle, teamA, teamB } = createBattle();
    const balloon = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    createUnit(battle, teamB);

    balloon.addAbility(Abilities.CarryOff);
    balloon.enter();
    enemy.enter();
    battle.tick(1);

    const casts: Moves[] = [];

    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === balloon) {
        casts.push(event.move);
      }
    });

    // The roll sits on the edge, so nothing takes hold
    pinRandom(battle, CARRY_OFF_CHANCE);
    balloon.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(casts).toEqual([]);

    pinRandom(battle, 0);
    balloon.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    // The string is Whirlwind's, so whatever the move does is what
    // happens to the target
    expect(casts).toEqual([Moves.Whirlwind]);
  });

  it('uncoils three times and no more', () => {
    const { battle, teamA, teamB } = createBattle();
    const rabbit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    rabbit.addAbility(Abilities.Springheel);
    rabbit.enter();
    enemy.enter();
    battle.tick(1);

    for (let at = 0; at < SPRINGHEEL_MAX_JUMPS + 2; at++) {
      rabbit.attack(enemy, Moves.Tackle, 10, Types.Normal, MoveCategories.Physical, 0);
      battle.tick(1);
    }

    expect(rabbit.stages[Stages.Speed]).toBe(SPRINGHEEL_MAX_JUMPS);
  });

  it('claws harder at whatever made itself comfortable', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const smug = createUnit(battle, teamB);
    const plain = createUnit(battle, teamB);

    cat.addAbility(Abilities.VelvetClaws);

    expect(cat.checkMovePower(Moves.Scratch, unitTarget(smug))).toBe(40);

    smug.addStage(Stages.Attack, 1, NONE_CAUSE);

    expect(cat.checkMovePower(Moves.Scratch, unitTarget(smug))).toBeCloseTo(
      40 * VELVET_CLAWS_SCALE,
      5,
    );

    // The mark stays once it is made, and nobody else carries it
    smug.addStage(Stages.Attack, -1, NONE_CAUSE);

    expect(cat.checkMovePower(Moves.Scratch, unitTarget(smug))).toBeCloseTo(
      40 * VELVET_CLAWS_SCALE,
      5,
    );
    expect(cat.checkMovePower(Moves.Scratch, unitTarget(plain))).toBe(40);

    // And a move that never touches it is a move that never touches it
    expect(cat.checkMovePower(Moves.ShadowBall, unitTarget(smug))).toBe(80);
  });
});
