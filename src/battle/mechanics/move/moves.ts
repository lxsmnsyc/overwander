import { EventPriority } from '../../../core/event-emitter';
import { Slots } from '../../../data/constants/slots';
import { TYPE_EFFECTIVENESS, TypeEffectiveness, Types } from '../../../data/constants/types';
import { MoveFlags, Moves } from '../../../data/ids/moves';
import { PP_UP_LIMIT, getMoveData, getMovePP } from '../../../data/moves';
import type Battle from '../../core';
import type { MoveState } from '../../events';
import { BattleEvents, MoveTargetType } from '../../events';
import type Unit from '../../unit';
import { MOVE_DELAY } from './timing';

/**
 * What a unit's move set is: what it may be fielded with, what it may
 * be aimed at, and what nothing can touch
 */
function isTypeImmune(offendingType: Types, defendingType: Types): boolean {
  return TYPE_EFFECTIVENESS[offendingType][defendingType] === TypeEffectiveness.Immune;
}

function isUnitImmune(unit: Unit, offending: Types): boolean {
  for (const defending of unit.types) {
    if (isTypeImmune(offending, defending)) {
      return true;
    }
  }
  return false;
}

function createMoveState(source: Unit, move: Moves): MoveState {
  return {
    source,
    move,
    disabled: false,
    cooldown: undefined,
    // Nothing has been spent on it until whoever fields the unit says
    // so, which is what keeps a wild pokemon's moves plain
    points: 0,
  };
}

/**
 * Moves occupying the unit's slots. The innate swing is exempt: it is
 * what a pokemon does when it has nothing else left, so a move set
 * full to the brim still has it
 */
function countMoves(unit: Unit): number {
  let count = 0;

  for (const key in unit.moves) {
    // tsc requires the assertion to index the Moves-mapped record;
    // tsgolint resolves the const enum to number and disagrees
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const move = Number(key) as Moves;

    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (unit.moves[move] != null && move !== Moves.Attack) {
      count += 1;
    }
  }

  return count;
}

export default function setupMoveMechanics(battle: Battle): void {
  // A unit knows what it has room for, held to what the fight allows
  battle.on(BattleEvents.UnitAddMove, EventPriority.Pre, (event) => {
    if (
      event.source.moves[event.move] == null &&
      event.move !== Moves.Attack &&
      countMoves(event.source) >= event.source.checkSlots(Slots.Move)
    ) {
      event.disabled = true;
    }
  });

  battle.on(BattleEvents.UnitAddMove, EventPriority.Exact, (event) => {
    event.source.moves[event.move] = createMoveState(event.source, event.move);
  });
  battle.on(BattleEvents.UnitSetMovePoints, EventPriority.Exact, (event) => {
    const data = event.source.moves[event.move];

    // Only a move the unit actually has: points for one it does not
    // know belong to nothing, and inventing a state for them would
    // give it a move it was never fielded with
    if (data) {
      data.points = Math.min(Math.max(0, Math.floor(event.points)), PP_UP_LIMIT);
    }
  });
  battle.on(BattleEvents.UnitRemoveMove, EventPriority.Exact, (event) => {
    // Deleted rather than blanked: the record is walked with
    // Object.values by both the AI and the field readout, and a slot
    // that is present but empty reads as a move with no state at all.
    // A forgotten move is not a move the unit knows nothing about, it
    // is a move the unit does not have.
    //
    // Through `Reflect` rather than the `delete` keyword only because
    // the key is computed, which the lint refuses on the grounds that
    // a record with dynamic keys wants to be a `Map`. This one is a
    // record keyed by a move id everywhere else in the engine
    Reflect.deleteProperty(event.source.moves, event.move);
  });
  battle.on(BattleEvents.UnitEnableMove, EventPriority.Exact, (event) => {
    const current = event.source.moves[event.move];
    if (current) {
      current.disabled = false;
    }
  });
  battle.on(BattleEvents.UnitDisableMove, EventPriority.Exact, (event) => {
    const current = event.source.moves[event.move];
    if (current) {
      current.disabled = true;
    }
  });

  // Checks
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Exact, (event) => {
    event.type = getMoveData(event.move).type;
  });
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Exact, (event) => {
    if (event.target.type === MoveTargetType.Unit) {
      event.immune = isUnitImmune(event.target.unit, event.type);
    }
  });
  // Powder- and spore-based moves cannot affect Grass types
  // (modern mechanics)
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Exact, (event) => {
    if (
      !event.immune &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.types.has(Types.Grass) &&
      getMoveData(event.move).flags & MoveFlags.Powder
    ) {
      event.immune = true;
    }
  });
  /**
   * Ground moves reach whatever is standing on the ground and nothing
   * else, so standing is the whole answer — it overrides the type
   * chart in both directions. A Flying type is out of reach until
   * something brings it down (the Grounded status, an Iron Ball), and
   * then it is as reachable as anybody
   */
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Exact, (event) => {
    if (event.type === Types.Ground && event.target.type === MoveTargetType.Unit) {
      event.immune = !event.target.unit.checkGrounded();
    }
  });
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Exact, (event) => {
    event.accuracy = getMoveData(event.move).accuracy;
  });
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    event.power = getMoveData(event.move).power;
  });
  battle.on(BattleEvents.CheckUnitMovePP, EventPriority.Exact, (event) => {
    // What the move is registered with, plus whatever its owner spent
    // on it. Everything that changes PP afterwards — Pressure halving
    // it — is a multiplier at a later priority, so the order the two
    // land in does not matter
    event.pp = getMovePP(event.move, event.source.moves[event.move]?.points ?? 0);
  });
  battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Exact, (event) => {
    event.priority = getMoveData(event.move).priority ?? 0;
  });
  battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Exact, (event) => {
    event.steps = getMoveData(event.move).steps ?? 0;
  });
  battle.on(BattleEvents.CheckUnitMoveContact, EventPriority.Exact, (event) => {
    event.contact = (getMoveData(event.move).flags & MoveFlags.Contact) !== 0;
  });
  battle.on(BattleEvents.CheckUnitMoveDelay, EventPriority.Exact, (event) => {
    event.duration = getMoveData(event.move).delay ?? MOVE_DELAY;
  });
}
