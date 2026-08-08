import { EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

export const STATUS_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.PoisonPowder]: Statuses.Poisoned,
  [Moves.SleepPowder]: Statuses.Sleeping,
  [Moves.Toxic]: Statuses.BadlyPoisoned,
  [Moves.StunSpore]: Statuses.Paralyzed,
  [Moves.Supersonic]: Statuses.Confused,
  [Moves.ThunderWave]: Statuses.Paralyzed,
  [Moves.Glare]: Statuses.Paralyzed,
  [Moves.Sing]: Statuses.Sleeping,
};

export const SELF_STATUS_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.FocusEnergy]: Statuses.FocusEnergy,
  [Moves.Minimize]: Statuses.Minimized,
};

const EFFECT_STATUS_MOVES: {
  [key in Moves]?: { status: Statuses; chance: number };
} = {
  [Moves.BodySlam]: { status: Statuses.Paralyzed, chance: 30 },
  [Moves.Ember]: { status: Statuses.Burned, chance: 10 },
  [Moves.Flamethrower]: { status: Statuses.Burned, chance: 10 },
  [Moves.FireBlast]: { status: Statuses.Burned, chance: 10 },
  [Moves.FireSpin]: { status: Statuses.Trapped, chance: 100 },
  [Moves.Wrap]: { status: Statuses.Trapped, chance: 100 },
  [Moves.RockSlide]: { status: Statuses.Flinched, chance: 30 },
  [Moves.Bite]: { status: Statuses.Flinched, chance: 30 },
  [Moves.IceBeam]: { status: Statuses.Frozen, chance: 10 },
  [Moves.Blizzard]: { status: Statuses.Frozen, chance: 10 },
  [Moves.Confusion]: { status: Statuses.Confused, chance: 10 },
  [Moves.Psybeam]: { status: Statuses.Confused, chance: 10 },
  [Moves.PoisonSting]: { status: Statuses.Poisoned, chance: 30 },
  [Moves.Twineedle]: { status: Statuses.Poisoned, chance: 20 },
  [Moves.SkyAttack]: { status: Statuses.Flinched, chance: 30 },
  [Moves.HyperFang]: { status: Statuses.Flinched, chance: 10 },
  [Moves.ThunderShock]: { status: Statuses.Paralyzed, chance: 10 },
  [Moves.Thunder]: { status: Statuses.Paralyzed, chance: 30 },
  [Moves.Thunderbolt]: { status: Statuses.Paralyzed, chance: 10 },
};

const EFFECT_STAGE_MOVES: {
  [key in Moves]?: { stage: Stages; value: number; chance: number };
} = {
  [Moves.Bubble]: { stage: Stages.Speed, value: -1, chance: 10 },
  [Moves.BubbleBeam]: { stage: Stages.Speed, value: -1, chance: 10 },
  [Moves.Psychic]: { stage: Stages.SpecialDefense, value: -1, chance: 10 },
  [Moves.Acid]: { stage: Stages.SpecialDefense, value: -1, chance: 10 },
};

/**
 * Whether the move carries a secondary attack effect (used by e.g.
 * Sheer Force)
 */
export function hasAttackEffect(move: Moves) {
  return EFFECT_STATUS_MOVES[move] != null || EFFECT_STAGE_MOVES[move] != null;
}

function setupUnitStatusMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
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

  battle.on(
    BattleEvents.CheckUnitAttackEffectChance,
    EventPriority.Post,
    event => {
      event.value =
        EFFECT_STATUS_MOVES[event.parent.move]?.chance ??
        EFFECT_STAGE_MOVES[event.parent.move]?.chance ??
        0;
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
      event.parent.target.addStatus(status.status, cause);
    }

    const stage = EFFECT_STAGE_MOVES[event.parent.move];

    if (stage) {
      event.parent.target.addStage(stage.stage, stage.value, cause);
    }
  });
}

const TEAM_STATUS_MOVES: { [key in Moves]?: TeamStatuses } = {
  [Moves.Reflect]: TeamStatuses.Reflect,
  [Moves.LightScreen]: TeamStatuses.LightScreen,
};

function setupTeamStatusMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
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
}

export function setupStatusMoves(battle: Battle) {
  setupUnitStatusMoves(battle);
  setupTeamStatusMoves(battle);
}
