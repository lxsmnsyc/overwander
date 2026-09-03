import { AttackPriority } from '../../core/event-emitter';
import { MAX_STAGE, MIN_STAGE, Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { USELESS_PENALTY } from '../ai/score';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

type StageMovesConfig = { [key in Moves]?: number };

function createStageMove(stage: Stages, config: StageMovesConfig) {
  return (battle: Battle) => {
    battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
      let target = event.source;
      if (event.target.type === MoveTargetType.Unit) {
        target = event.target.unit;
      }
      const move = event.move;
      if (move in config) {
        target.addStage(stage, config[move] ?? 0, {
          type: EffectType.Move,
          unit: event.source,
          move: event.move,
        });
      }
    });
  };
}

const STAGE_MOVE_GROUPS: [Stages, StageMovesConfig][] = [
  [
    Stages.Attack,
    {
      [Moves.Growl]: -1,
      [Moves.SwordsDance]: 2,
      [Moves.Meditate]: 1,
      [Moves.Sharpen]: 1,
      [Moves.Charm]: -2,
      // The target is flattered into swinging harder while it is too
      // confused to aim
      [Moves.Swagger]: 2,
      [Moves.Howl]: 1,
      [Moves.BulkUp]: 1,
      [Moves.DragonDance]: 1,
      [Moves.Tickle]: -1,
      [Moves.FeatherDance]: -2,
      [Moves.Memento]: -2,
    },
  ],
  [
    Stages.SpecialAttack,
    {
      [Moves.Growth]: 1,
      [Moves.TailGlow]: 3,
      [Moves.CalmMind]: 1,
      // Flattery: the target is talked into leaning on a stat it
      // cannot aim with
      [Moves.Flatter]: 1,
      [Moves.Memento]: -2,
    },
  ],
  [
    Stages.SpecialDefense,
    {
      [Moves.Amnesia]: 2,
      [Moves.CalmMind]: 1,
      [Moves.CosmicPower]: 1,
      [Moves.Stockpile]: 1,
      [Moves.Charge]: 1,
      [Moves.MetalSound]: -2,
      [Moves.FakeTears]: -2,
    },
  ],
  [
    Stages.Defense,
    {
      [Moves.Leer]: -1,
      [Moves.TailWhip]: -1,
      [Moves.Withdraw]: 1,
      [Moves.Harden]: 1,
      [Moves.Screech]: -2,
      [Moves.DefenseCurl]: 1,
      [Moves.Barrier]: 2,
      [Moves.AcidArmor]: 2,
      [Moves.IronDefense]: 2,
      [Moves.BulkUp]: 1,
      [Moves.CosmicPower]: 1,
      [Moves.Stockpile]: 1,
      [Moves.Tickle]: -1,
    },
  ],
  [
    Stages.Speed,
    {
      [Moves.StringShot]: -2,
      [Moves.Agility]: 2,
      [Moves.ScaryFace]: -2,
      [Moves.CottonSpore]: -2,
      [Moves.DragonDance]: 1,
    },
  ],
  [
    Stages.Accuracy,
    {
      [Moves.Flash]: -1,
      [Moves.SandAttack]: -1,
      [Moves.SmokeScreen]: -1,
      [Moves.Kinesis]: -1,
    },
  ],
  [
    Stages.Evasion,
    {
      [Moves.DoubleTeam]: 1,
      [Moves.Minimize]: 2,
      [Moves.SweetScent]: -2,
    },
  ],
];

/**
 * The stage change a move applies, if any (used by e.g. the AI)
 */
export function getStageMoveEffect(move: Moves): { stage: Stages; value: number } | undefined {
  for (const [stage, config] of STAGE_MOVE_GROUPS) {
    const value = config[move];

    if (value != null) {
      return { stage, value };
    }
  }
  return undefined;
}

export default function setupStageMoves(battle: Battle): void {
  for (const [stage, config] of STAGE_MOVE_GROUPS) {
    createStageMove(stage, config)(battle);
  }

  // A stage already pinned at the end it is being pushed towards has
  // nowhere to go, so the move spends a cast changing nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const effect = getStageMoveEffect(event.move);

    if (effect == null) {
      return;
    }

    const receiver = event.target.type === MoveTargetType.Unit ? event.target.unit : event.source;
    const current = receiver.stages[effect.stage];

    if (effect.value > 0 ? current >= MAX_STAGE : current <= MIN_STAGE) {
      event.score -= USELESS_PENALTY;
    }
  });
}
