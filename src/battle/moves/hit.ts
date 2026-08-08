import { EventPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type { Battle } from '../core';
import { BattleEvents, MoveTargetType } from '../events';

const HIT_MOVES = new Set([
  Moves.Tackle,
  Moves.VineWhip,
  Moves.RazorLeaf,
  Moves.SolarBeam,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.HyperBeam,
  Moves.Cut,
  Moves.Scratch,
  Moves.Ember,
  Moves.Slash,
  Moves.Flamethrower,
  Moves.FireSpin,
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Submission,
  Moves.Dig,
  Moves.FireBlast,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Strength,
  Moves.Earthquake,
  Moves.Fly,
  Moves.Bubble,
  Moves.WaterGun,
  Moves.Bite,
  Moves.HydroPump,
  Moves.BubbleBeam,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Surf,
  Moves.Confusion,
  Moves.Psybeam,
  Moves.Psychic,
]);

export function setupHitMoves(battle: Battle) {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, event => {
    if (
      HIT_MOVES.has(event.move) &&
      event.target.type === MoveTargetType.Unit &&
      event.steps === 0
    ) {
      event.source.attack(
        event.target.unit,
        event.move,
        event.source.checkMovePower(event.move, event.target) ?? 0,
        event.source.checkMoveType(event.move, event.target),
        getMoveData(event.move).category,
        MoveAttackFlags.Critical,
      );
    }
  });
}
