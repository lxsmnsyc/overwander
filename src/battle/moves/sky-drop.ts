import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Sky Drop carries its target up on the first step and drops it on the
 * second. The user's own vanishing is the semi-invulnerable group's;
 * this is the one being carried
 * https://bulbapedia.bulbagarden.net/wiki/Sky_Drop_(move)
 */
const HEAVIEST = 200;

/** What the carried pokemon wears while it is up there */
const CARRIED = [Statuses.SkyDropped, Statuses.Invulnerable, Statuses.Floating];

function canCarry(unit: Unit): boolean {
  return unit.checkWeight() < HEAVIEST && unit.status[Statuses.Invulnerable] == null;
}

export default function setupSkyDrop(battle: Battle): void {
  /**
   * Who each user has up in the air with it. A boss' Sky Drop reaches
   * every enemy, so one user can be carrying several at once
   */
  const carrying = new Map<Unit, Set<Unit>>();

  function setDown(carried: Unit): void {
    for (const status of CARRIED) {
      const cause = carried.status[status];

      if (cause?.type === EffectType.Move && cause.move === Moves.SkyDrop) {
        carried.removeStatus(status, cause);
      }
    }
  }

  function release(carrier: Unit): void {
    const carried = carrying.get(carrier);

    if (carried != null) {
      carrying.delete(carrier);
      for (const unit of carried) {
        setDown(unit);
      }
    }
  }

  /** Lets one go, and forgets the carrier once its hands are empty */
  function drop(carrier: Unit, carried: Unit): boolean {
    const held = carrying.get(carrier);

    if (held == null || !held.delete(carried)) {
      return false;
    }
    if (held.size === 0) {
      carrying.delete(carrier);
    }
    setDown(carried);
    return true;
  }

  battle.on(BattleEvents.CheckUnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    if (
      event.success &&
      event.move === Moves.SkyDrop &&
      event.steps === 1 &&
      event.target.type === MoveTargetType.Unit
    ) {
      event.success = canCarry(event.target.unit);
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.SkyDrop) {
      event.usable = event.target.type === MoveTargetType.Unit && canCarry(event.target.unit);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (
      event.move !== Moves.SkyDrop ||
      event.steps !== 1 ||
      event.target.type !== MoveTargetType.Unit
    ) {
      return;
    }

    const carried = event.target.unit;
    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;
    const held = carrying.get(event.source) ?? new Set<Unit>();

    held.add(carried);
    carrying.set(event.source, held);

    for (const status of CARRIED) {
      carried.addStatus(status, cause);
    }
  });

  // Set down before the drop is rolled, or its own hiding would make it
  // miss. A drop with nobody carried lands nothing
  battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
    if (
      event.move !== Moves.SkyDrop ||
      event.steps !== 0 ||
      event.target.type !== MoveTargetType.Unit
    ) {
      return;
    }

    if (!drop(event.source, event.target.unit)) {
      event.disabled = true;
    }
  });

  // A Flying type is dropped from a height it can fly out of
  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.SkyDrop && event.parent.target.types.has(Types.Flying)) {
      event.value = 0;
    }
  });

  // A carrier stopped short lets go
  battle.on(BattleEvents.UnitInterrupt, EventPriority.Post, (event) => {
    release(event.source);
  });
  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      release(event.source);

      for (const [carrier, held] of carrying) {
        held.delete(event.source);
        if (held.size === 0) {
          carrying.delete(carrier);
        }
      }
    });
  }

  // Knocked out of the carrier's hands by something else, Smack Down
  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status !== Statuses.SkyDropped) {
      return;
    }
    for (const [carrier, held] of carrying) {
      if (held.has(event.source)) {
        drop(carrier, event.source);
        carrier.interrupt();
      }
    }
  });
}
