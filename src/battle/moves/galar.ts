import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags, MoveCategories, Moves, StatFlags } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { Statuses } from '../../data/ids/status';
import { isBerry } from '../../data/items/berries';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import turns from '../turn';
import type Unit from '../unit';
import { onUnitActs, stealableItem } from '../utils';

/**
 * The Galar and Hisui moves with a rule of their own, each too small
 * to want a file: the ones that lock somebody in, the ones that cost
 * the user to throw, and the ones that read what just happened to a
 * stat.
 *
 * "This turn" in the mainline is a 2-second window here, the same one
 * Payback reads, since a fight with no turns has no other way of
 * saying "just now"
 */

/** What a Clangorous Soul costs, as a share of the user's HP */
export const CLANGOROUS_SOUL_SHARE = 1 / 3;

/** What Steel Beam and Chloroblast cost however they land */
export const RECKLESS_BEAM_SHARE = 0.5;

const RECKLESS_BEAMS = new Set<Moves>([Moves.SteelBeam, Moves.Chloroblast]);

/** How much a Tar Shot makes Fire hurt */
export const TAR_SHOT_FACTOR = 2;

/** How long "just now" is for the moves that read a stat that moved */
const JUST_NOW = turns(1);

/** What Coaching raises on each teammate */
const COACHED = [Stages.Attack, Stages.Defense];

/** What an Octolock wrings out of its target each time it acts */
const OCTOLOCKED = [Stages.Defense, Stages.SpecialDefense];

export default function setupGalarMoves(battle: Battle): void {
  setupLocks(battle);
  setupCosts(battle);
  setupStatWindows(battle);
  setupFood(battle);

  // Tar Shot: Fire burns a tarred pokemon twice as hard, for good
  const tarred = new WeakSet<Unit>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.TarShot && event.target.type === MoveTargetType.Unit) {
      tarred.add(event.target.unit);
    }
  });

  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    if (event.parent.type === Types.Fire && tarred.has(event.parent.target)) {
      event.value *= TAR_SHOT_FACTOR;
    }
  });

  // Scale Shot sheds its scales once the whole volley is out: faster
  // and thinner-skinned, once per cast however many strikes landed
  const shed = new WeakSet<Unit>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
    if (event.move === Moves.ScaleShot) {
      shed.delete(event.source);
    }
  });

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.ScaleShot) {
      event.value = 100;
    }
  });

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    const source = event.parent.source;

    if (event.parent.move !== Moves.ScaleShot || shed.has(source)) {
      return;
    }

    const cause = { type: EffectType.Move, move: Moves.ScaleShot, unit: source } as const;

    shed.add(source);
    source.addStage(Stages.Speed, 1, cause);
    source.addStage(Stages.Defense, -1, cause);
  });

  // Shell Side Arm lands as whichever kind hits this target harder
  battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
    if (event.move !== Moves.ShellSideArm) {
      return;
    }

    const physical =
      event.source.resolveStat(Stats.Attack, StatFlags.Attack) /
      Math.max(1, event.target.resolveStat(Stats.Defense, 0));
    const special =
      event.source.resolveStat(Stats.SpecialAttack, StatFlags.Attack) /
      Math.max(1, event.target.resolveStat(Stats.SpecialDefense, 0));

    if (physical > special) {
      event.category = MoveCategories.Physical;
    }
  });

  // Aura Wheel is Morpeko's own: Electric while it is full, Dark once
  // it has gone Hangry, and nothing at all in anybody else's hands
  const isMorpeko = (unit: Unit): boolean =>
    unit.species === Species.Morpeko || unit.species === Species.MorpekoHangry;

  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move === Moves.AuraWheel && event.source.species === Species.MorpekoHangry) {
      event.type = Types.Dark;
    }
  });

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.move === Moves.AuraWheel && !isMorpeko(event.source)) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.AuraWheel) {
      event.usable = isMorpeko(event.source);
    }
  });

  // Coaching raises the user's teammates and not the user
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Coaching) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const unit of event.source.team.units) {
      if (unit !== event.source && unit.alive) {
        for (const stage of COACHED) {
          unit.addStage(stage, 1, cause);
        }
      }
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable || event.move !== Moves.Coaching) {
      return;
    }

    for (const unit of event.source.team.units) {
      if (unit !== event.source && unit.alive) {
        return;
      }
    }
    event.usable = false;
  });
}

/**
 * Jaw Lock, No Retreat and Octolock: three ways of being kept on the
 * field, each with the Cornered status a Mean Look leaves
 */
function setupLocks(battle: Battle): void {
  const retreatless = new WeakSet<Unit>();
  const octolocked = new WeakMap<Unit, Unit>();
  /** Who each Jaw Lock holds, both ways round, so one leaving frees the other */
  const jawed = new Map<Unit, Unit>();

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.JawLock) {
      event.value = 100;
    }
  });

  // Both of them are held: neither lets go first
  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    const { move, source, target } = event.parent;

    if (move !== Moves.JawLock || !target.alive) {
      return;
    }

    const cause = { type: EffectType.Move, move, unit: source } as const;

    source.addStatus(Statuses.Cornered, cause);
    target.addStatus(Statuses.Cornered, cause);
    jawed.set(source, target);
    jawed.set(target, source);
  });

  // No Retreat is spent once: a pokemon that has sworn it has nothing
  // more to swear
  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.move === Moves.NoRetreat && retreatless.has(event.source)) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.NoRetreat) {
      event.usable = !retreatless.has(event.source);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    if (event.move === Moves.NoRetreat) {
      retreatless.add(event.source);
      event.source.addStatus(Statuses.Cornered, cause);
      return;
    }
    if (event.move === Moves.Octolock && event.target.type === MoveTargetType.Unit) {
      const target = event.target.unit;

      target.addStatus(Statuses.Cornered, cause);
      octolocked.set(target, event.source);
    }
  });

  // Wrung each time the held one acts, the way a residual is paid
  onUnitActs(battle, (unit) => {
    const holder = octolocked.get(unit);

    if (holder == null) {
      return;
    }
    if (!holder.alive || unit.status[Statuses.Cornered] == null) {
      octolocked.delete(unit);
      return;
    }

    const cause = { type: EffectType.Move, move: Moves.Octolock, unit: holder } as const;

    for (const stage of OCTOLOCKED) {
      unit.addStage(stage, -1, cause);
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      octolocked.delete(event.source);

      const partner = jawed.get(event.source);

      jawed.delete(event.source);
      if (partner == null) {
        return;
      }
      jawed.delete(partner);

      const held = partner.status[Statuses.Cornered];

      if (held?.type === EffectType.Move && held.move === Moves.JawLock) {
        partner.removeStatus(Statuses.Cornered, held);
      }
    });
  }
}

/** The moves the user pays HP for, whatever they land on */
function setupCosts(battle: Battle): void {
  const tooThin = (unit: Unit): boolean =>
    unit.health <= unit.checkStat(Stats.HP, 0) * CLANGOROUS_SOUL_SHARE;

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.move === Moves.ClangorousSoul && tooThin(event.source)) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.ClangorousSoul) {
      event.usable = !tooThin(event.source);
    }
  });

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    const unit = event.source;
    let share = 0;

    if (event.move === Moves.ClangorousSoul) {
      share = CLANGOROUS_SOUL_SHARE;
    } else if (RECKLESS_BEAMS.has(event.move)) {
      share = RECKLESS_BEAM_SHARE;
    }
    if (share === 0) {
      return;
    }

    unit.damage(
      { type: EffectType.Move, move: event.move, unit },
      unit,
      Math.ceil(unit.checkStat(Stats.HP, 0) * share),
      DamageFlags.Indirect | DamageFlags.HealthScaled | DamageFlags.Cost,
    );
  });
}

/**
 * Burning Jealousy and Lash Out, which read what a stat did just now:
 * one burns whoever rose, the other hits back for having been dropped
 */
function setupStatWindows(battle: Battle): void {
  const rose = new Map<Unit, number>();
  const fell = new Map<Unit, number>();

  battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
    if (event.value > 0) {
      rose.set(event.source, JUST_NOW);
    } else if (event.value < 0) {
      fell.set(event.source, JUST_NOW);
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const window of [rose, fell]) {
      for (const [unit, left] of window) {
        if (left <= event.duration) {
          window.delete(unit);
        } else {
          window.set(unit, left - event.duration);
        }
      }
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power != null && event.move === Moves.LashOut && fell.has(event.source)) {
      event.power *= 2;
    }
  });

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.BurningJealousy) {
      event.value = rose.has(event.parent.target) ? 100 : 0;
    }
  });

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    const { move, source, target } = event.parent;

    if (move === Moves.BurningJealousy && rose.has(target)) {
      target.addStatus(Statuses.Burned, { type: EffectType.Move, move, unit: source });
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      rose.delete(event.source);
      fell.delete(event.source);
    });
  }
}

/**
 * Stuff Cheeks and Teatime, which eat a held berry on purpose, and
 * Corrosive Gas and Poltergeist, which do something about one held
 */
function setupFood(battle: Battle): void {
  const berryOf = (unit: Unit): ReturnType<typeof stealableItem> => {
    const held = stealableItem(unit);

    return held != null && isBerry(held) ? held : undefined;
  };

  /** Eats a unit's held berry, the way eating it in a pinch would */
  const eat = (unit: Unit, move: Moves, by: Unit): boolean => {
    const berry = berryOf(unit);

    if (berry == null) {
      return false;
    }
    // What the berry does is fired off its trigger; eating it is what
    // spends it
    unit.triggerItem(berry);
    unit.removeItem(berry, { type: EffectType.Move, move, unit: by });
    return true;
  };

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.move === Moves.StuffCheeks && berryOf(event.source) == null) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.StuffCheeks) {
      event.usable = berryOf(event.source) != null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.StuffCheeks) {
      if (eat(event.source, event.move, event.source)) {
        event.source.addStage(Stages.Defense, 2, {
          type: EffectType.Move,
          move: event.move,
          unit: event.source,
        });
      } else {
        event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      }
      return;
    }
    if (event.move === Moves.Teatime) {
      let served = false;

      for (const unit of battle.units()) {
        if (unit.alive && eat(unit, event.move, event.source)) {
          served = true;
        }
      }
      if (!served) {
        event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      }
      return;
    }
    // Corrosive Gas melts whatever it reaches is holding
    if (event.move === Moves.CorrosiveGas && event.target.type === MoveTargetType.Unit) {
      const target = event.target.unit;
      const held = stealableItem(target);

      if (held != null) {
        target.removeItem(held, { type: EffectType.Move, move: event.move, unit: event.source });
      }
    }
  });

  // A Poltergeist has nothing to throw at a target holding nothing
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      event.move === Moves.Poltergeist &&
      event.target.type === MoveTargetType.Unit &&
      stealableItem(event.target.unit) == null
    ) {
      event.immune = true;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Poltergeist) {
      event.usable =
        event.target.type === MoveTargetType.Unit && stealableItem(event.target.unit) != null;
    }
  });
}
