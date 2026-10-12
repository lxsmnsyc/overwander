import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveAffects, MoveCategories, Moves } from '../../data/ids/moves';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import {
  EFFECT_STAGE_MOVES,
  EFFECT_STATUS_MOVES,
  SELF_STATUS_MOVES,
  STATUS_MOVES,
  TEAM_STATUS_MOVES,
} from '../../data/battle';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import resolveMoveTargets from '../mechanics/move/targeting';
import type Unit from '../unit';
import { getStageMoveEffects } from './stage';

export {
  EFFECT_STAGE_MOVES,
  EFFECT_STATUS_MOVES,
  SELF_STATUS_MOVES,
  STATUS_MOVES,
  TEAM_STATUS_MOVES,
};
export type { AttackStageEffect } from '../../data/battle';

/**
 * The moves that bind whatever they hit. It is read off the effect
 * table rather than written out again, so a binding move added there
 * is one a Binding Band and a Grip Claw already know about
 */
export const TRAPPING_MOVES = new Set<Moves>();

for (const [move, effect] of Object.entries(EFFECT_STATUS_MOVES)) {
  if (effect.status === Statuses.Trapped) {
    // The table is keyed by the move enum, which comes back as a
    // string from Object.entries
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    TRAPPING_MOVES.add(Number(move) as Moves);
  }
}

/**
 * Whether the move carries a secondary attack effect (used by e.g.
 * Sheer Force)
 */
export function hasAttackEffect(move: Moves): boolean {
  return (
    EFFECT_STATUS_MOVES[move] != null ||
    EFFECT_STAGE_MOVES[move] != null ||
    // Tri Attack rolls its own three-way status in its move group
    move === Moves.TriAttack
  );
}

/**
 * The moves that flatter somebody into swinging harder while they are
 * too muddled to aim. Aimed at the far side they are a confusion worth
 * the stat they hand over; aimed at the player's own side they are the
 * stat alone, and only for a pokemon that cannot be confused at all
 * https://bulbapedia.bulbagarden.net/wiki/Swagger_(move)
 */
const FLATTERY_MOVES = new Set<Moves>([Moves.Swagger, Moves.Flatter]);

function setupFlatteryMoves(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      !event.usable ||
      !FLATTERY_MOVES.has(event.move) ||
      event.target.type !== MoveTargetType.Unit
    ) {
      return;
    }

    const target = event.target.unit;
    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;
    const muddled =
      target.status[Statuses.Confused] != null ||
      target.checkStatusImmunity(Statuses.Confused, cause);

    // A teammate is worth flattering only where the confusion cannot
    // land; anybody else is worth it only where it can
    event.usable = target.team.alliance === event.source.team.alliance ? muddled : !muddled;
  });
}

function setupUnitStatusMoves(battle: Battle): void {
  // A status move against somebody who already carries the status, or
  // who cannot take it at all, applies nothing: the AI is told so
  // before it picks one rather than after it has spent the cast
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const status = STATUS_MOVES[event.move];

    // Explicit null check: the first Statuses enum member is 0
    if (
      !event.usable ||
      status == null ||
      // The flattery moves raise a stat as well as muddling the head,
      // so whether they are worth casting is their own question
      FLATTERY_MOVES.has(event.move)
    ) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;
    const takes = (unit: Unit): boolean =>
      unit.status[status] == null && !unit.checkStatusImmunity(status, cause);

    if (event.target.type === MoveTargetType.Unit) {
      event.usable = takes(event.target.unit);
      return;
    }

    // A move cast at nobody (Teeter Dance) is worth it while one foe
    // it reaches would still take the status
    const data = getMoveData(event.move);
    for (const reached of resolveMoveTargets(
      battle,
      event.source,
      event.target,
      data.target,
      data.affects,
    )) {
      if (
        reached.type === MoveTargetType.Unit &&
        reached.unit.team.alliance !== event.source.team.alliance &&
        takes(reached.unit)
      ) {
        return;
      }
    }
    event.usable = false;
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const targetStatus = STATUS_MOVES[event.move];

    // Explicit null check: the first Statuses enum member is 0
    if (targetStatus != null && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(targetStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }

    const selfStatus = SELF_STATUS_MOVES[event.move];

    if (selfStatus != null) {
      event.source.addStatus(selfStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    event.value =
      EFFECT_STATUS_MOVES[event.parent.move]?.chance ??
      EFFECT_STAGE_MOVES[event.parent.move]?.chance ??
      0;
  });

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    const cause = {
      type: EffectType.Move,
      move: event.parent.move,
      unit: event.parent.source,
    } as const;

    const status = EFFECT_STATUS_MOVES[event.parent.move];

    if (status) {
      event.parent.target.addStatus(status.status, cause);
    }

    const stage = EFFECT_STAGE_MOVES[event.parent.move];

    if (stage) {
      const receiver = stage.self ? event.parent.source : event.parent.target;

      for (const one of Array.isArray(stage.stage) ? stage.stage : [stage.stage]) {
        receiver.addStage(one, stage.value, cause);
      }
    }
  });
}

function lowersFoeStages(move: Moves): boolean {
  if (getMoveData(move).affects & MoveAffects.Enemy) {
    for (const effect of getStageMoveEffects(move)) {
      if (effect.value < 0) {
        return true;
      }
    }
  }
  const effect = EFFECT_STAGE_MOVES[move];
  return effect != null && !effect.self && effect.value < 0;
}

/** Whether a foe's move is one the veil would stop */
export const VEIL_THREATS: { [key in TeamStatuses]?: (move: Moves) => boolean } = {
  [TeamStatuses.Reflect]: (move) => getMoveData(move).category === MoveCategories.Physical,
  [TeamStatuses.LightScreen]: (move) => getMoveData(move).category === MoveCategories.Special,
  [TeamStatuses.Safeguard]: (move) =>
    STATUS_MOVES[move] != null || EFFECT_STATUS_MOVES[move] != null,
  [TeamStatuses.Mist]: lowersFoeStages,
};

function setupTeamStatusMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const targetStatus = TEAM_STATUS_MOVES[event.move];
    // Explicit null check: the first TeamStatuses enum member is 0
    if (targetStatus != null) {
      event.source.team.addStatus(targetStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  // A veil already over the side changes nothing, the way calling up
  // a sky already out does not. The AI is told before it spends the
  // cast rather than after
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const status = TEAM_STATUS_MOVES[event.move];

    // Explicit null check: the first TeamStatuses enum member is 0
    if (event.usable && status != null && event.source.team.status[status] != null) {
      event.usable = false;
    }
  });
}

export function setupStatusMoves(battle: Battle): void {
  setupUnitStatusMoves(battle);
  setupTeamStatusMoves(battle);
  setupFlatteryMoves(battle);
}
