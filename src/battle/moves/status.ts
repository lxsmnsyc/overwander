import { EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

const STATUS_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.PoisonPowder]: Statuses.Poisoned,
  [Moves.SleepPowder]: Statuses.Sleeping,
  [Moves.Toxic]: Statuses.BadlyPoisoned,
};

const EFFECT_STATUS_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.BodySlam]: Statuses.Paralyzed,
  [Moves.Ember]: Statuses.Burned,
  [Moves.Flamethrower]: Statuses.Burned,
  [Moves.FireBlast]: Statuses.Burned,
  [Moves.FireSpin]: Statuses.Trapped,
  [Moves.Bite]: Statuses.Flinched,
  [Moves.IceBeam]: Statuses.Frozen,
  [Moves.Blizzard]: Statuses.Frozen,
};

const EFFECT_STAGE_MOVES: {
  [key in Moves]?: { stage: Stages; value: number };
} = {
  [Moves.Bubble]: { stage: Stages.Speed, value: -1 },
  [Moves.BubbleBeam]: { stage: Stages.Speed, value: -1 },
};

const EFFECT_STATUS_CHANCE: { [key in Moves]?: number } = {
  [Moves.BodySlam]: 30,
  [Moves.Ember]: 10,
  [Moves.Flamethrower]: 10,
  [Moves.FireBlast]: 10,
  [Moves.FireSpin]: 100,
  [Moves.Bite]: 30,
  [Moves.IceBeam]: 10,
  [Moves.Blizzard]: 10,
  [Moves.Bubble]: 10,
  [Moves.BubbleBeam]: 10,
};

function setupUnitStatusMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    const targetStatus = STATUS_MOVES[event.move];

    if (targetStatus && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(targetStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  battle.on(
    BattleEvents.CheckUnitAttackEffectChance,
    EventPriority.Post,
    event => {
      event.value = EFFECT_STATUS_CHANCE[event.parent.move] ?? 0;
    },
  );

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, event => {
    const cause = {
      type: EffectType.Move,
      move: event.parent.move,
      unit: event.parent.source,
    } as const;

    const status = EFFECT_STATUS_MOVES[event.parent.move];

    if (status) {
      event.parent.target.addStatus(status, cause);
    }

    const stage = EFFECT_STAGE_MOVES[event.parent.move];

    if (stage) {
      event.parent.target.addStage(stage.stage, stage.value, cause);
    }
  });
}

const TEAM_STATUS_MOVES: { [key in Moves]?: TeamStatuses } = {
  [Moves.Reflect]: TeamStatuses.Reflect,
};

function setupTeamStatusMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    const targetStatus = TEAM_STATUS_MOVES[event.move];
    if (targetStatus) {
      event.source.team.addStatus(targetStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });
}

export function setupStatusMoves(battle: Battle) {
  setupUnitStatusMoves(battle);
  setupTeamStatusMoves(battle);
}
