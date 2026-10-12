import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { MEGA_STONES } from '../../data/items/mega-stones';
import { SIGNATURE_CRYSTALS, TYPE_CRYSTALS } from '../../data/items/z-crystals';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { isMegaHolder } from '../items/megas';
import { OHKO_MOVES } from '../moves/fixed-damage';
import { FORCED_SWITCH_MOVES } from '../moves/switch-out';
import type Team from '../team';
import type Unit from '../unit';

/**
 * Dynamax. A unit holding a Dynamax Band grows the first time it drops
 * below 1/2 HP, once a side a fight, with nothing to press. It keeps
 * the size for its next `DYNAMAX_ACTS` casts and then shrinks back.
 * The Max Moves it throws meanwhile are `src/battle/moves/max-moves.ts`
 * https://bulbapedia.bulbagarden.net/wiki/Dynamax
 */

/** How many of its own casts a Dynamax lasts: the mainline's three turns */
export const DYNAMAX_ACTS = 3;

/** What Dynamaxing multiplies max HP by */
export const DYNAMAX_HEALTH_SCALE = 2;

/** What the anti-Dynamax moves are worth against a Dynamaxed target */
export const ANTI_DYNAMAX_FACTOR = 2;

/** Casts each Dynamaxed unit has left, Infinity for one that never shrinks */
const actsLeft = new WeakMap<Unit, number>();

/** Units whose last cast is in the air, to shrink once it lands */
const due = new WeakSet<Unit>();

/** The moves that do nothing to a Dynamaxed target */
const REFUSED_MOVES = new Set<Moves>([
  ...FORCED_SWITCH_MOVES,
  ...OHKO_MOVES,
  // Read off weight, which a giant has none of in the mainline's terms
  Moves.LowKick,
  Moves.GrassKnot,
  Moves.HeatCrash,
  Moves.HeavySlam,
  // What holds a pokemon to part of its move set does not take
  Moves.Disable,
  Moves.Encore,
  Moves.Torment,
  Moves.Instruct,
]);

/** What a Dynamaxed unit shrugs off, whoever put it there */
const REFUSED_STATUSES = new Set<Statuses>([
  Statuses.Flinched,
  Statuses.Encored,
  Statuses.Tormented,
]);

/** The three moves made for fighting a Dynamax */
const ANTI_DYNAMAX_MOVES = new Set<Moves>([
  Moves.BehemothBlade,
  Moves.BehemothBash,
  Moves.DynamaxCannon,
]);

export function isDynamaxed(unit: Unit): boolean {
  return unit.dynamaxed;
}

/**
 * Grow the unit: max and current HP doubled. `permanent` keeps it
 * that size for the rest of the fight (a raid boss), otherwise it
 * shrinks after `acts` of its own casts
 */
export function dynamax(unit: Unit, options?: { permanent?: boolean; acts?: number }): void {
  if (unit.dynamaxed || !unit.alive) {
    return;
  }
  actsLeft.set(unit, options?.permanent === true ? Infinity : (options?.acts ?? DYNAMAX_ACTS));
  unit.dynamaxed = true;
  unit.setHealth(unit.health * DYNAMAX_HEALTH_SCALE);
}

/** Shrink back, keeping the share of HP it had */
export function revertDynamax(unit: Unit): void {
  if (!unit.dynamaxed) {
    return;
  }
  const share = unit.health / Math.max(1, unit.checkStat(Stats.HP, 0));

  actsLeft.delete(unit);
  due.delete(unit);
  unit.dynamaxed = false;
  unit.setHealth(share * unit.checkStat(Stats.HP, 0));
}

/** Casts left before it shrinks, Infinity for a permanent one, 0 when not Dynamaxed */
export function dynamaxActsLeft(unit: Unit): number {
  return actsLeft.get(unit) ?? 0;
}

/** Whether it holds any Mega Stone or Z-Crystal, whoever the stone is for */
function holdsStoneOrCrystal(unit: Unit): boolean {
  for (const held of [MEGA_STONES, TYPE_CRYSTALS, SIGNATURE_CRYSTALS]) {
    for (const item of held.keys()) {
      if (unit.items[item] != null) {
        return true;
      }
    }
  }
  return false;
}

/** Whether the band may grow this unit at all. Held rather than enabled, the way a stone is */
export function canDynamax(unit: Unit): boolean {
  return unit.items[Items.DynamaxBand] != null && !isMegaHolder(unit) && !holdsStoneOrCrystal(unit);
}

export default function setupDynamaxMechanics(battle: Battle): void {
  /** The sides that have grown somebody this fight */
  const spent = new WeakSet<Team>();
  const before = new WeakMap<object, number>();

  battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
    if (event.stat === Stats.HP && event.source.dynamaxed) {
      event.value *= DYNAMAX_HEALTH_SCALE;
    }
  });

  // The trigger: crossing from 1/2 HP or more to under it
  battle.on(BattleEvents.UnitSetHealth, EventPriority.Pre, (event) => {
    before.set(event, event.source.health);
  });
  battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
    const unit = event.source;
    const half = unit.checkStat(Stats.HP, 0) / 2;
    const was = before.get(event) ?? 0;

    if (
      unit.alive &&
      unit.health > 0 &&
      unit.health < half &&
      was >= half &&
      !spent.has(unit.team) &&
      canDynamax(unit)
    ) {
      spent.add(unit.team);
      dynamax(unit);
    }
  });

  // A cast that finished as a giant is an act, and the last one
  // shrinks it once its move has landed. Read at Pre, so a cast that
  // grew it halfway through is not counted
  const giant = new WeakSet<Unit>();

  battle.on(BattleEvents.UnitFinishCast, EventPriority.Pre, (event) => {
    if (event.source.dynamaxed) {
      giant.add(event.source);
    }
  });
  battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
    const left = actsLeft.get(event.source);

    if (left == null || !giant.has(event.source)) {
      return;
    }
    giant.delete(event.source);
    actsLeft.set(event.source, left - 1);
    if (left - 1 <= 0) {
      due.add(event.source);
    }
  });
  battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Post, (event) => {
    if (due.has(event.source)) {
      revertDynamax(event.source);
    }
  });
  // A last move that never went off still ends it before the next one starts
  battle.on(BattleEvents.UnitCast, EventPriority.Pre, (event) => {
    if (due.has(event.source)) {
      revertDynamax(event.source);
    }
  });
  battle.on(BattleEvents.UnitLeavesField, EventPriority.Pre, (event) => {
    revertDynamax(event.source);
  });
  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    actsLeft.delete(event.source);
    due.delete(event.source);
    event.source.dynamaxed = false;
  });

  // Every move a giant throws goes off in one, the charged and rampaging ones included
  battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Post, (event) => {
    if (event.source.dynamaxed) {
      event.steps = 0;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      REFUSED_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit !== event.source &&
      event.target.unit.dynamaxed
    ) {
      event.immune = true;
    }
  });
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
    if (
      event.usable &&
      REFUSED_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit !== event.source &&
      event.target.unit.dynamaxed
    ) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      event.source.dynamaxed &&
      REFUSED_STATUSES.has(event.status) &&
      !(event.cause.type !== EffectType.None && event.cause.unit === event.source)
    ) {
      event.immune = true;
    }
  });

  // Nothing sends a giant away: only a move of its own may take it off the field
  battle.on(BattleEvents.UnitSwitch, EventPriority.Pre, (event) => {
    const cause = event.cause;

    if (
      event.source.dynamaxed &&
      event.source !== event.target &&
      !(cause.type === EffectType.Move && cause.unit === event.source)
    ) {
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (
      event.power != null &&
      ANTI_DYNAMAX_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.dynamaxed
    ) {
      event.power *= ANTI_DYNAMAX_FACTOR;
    }
  });
}
