import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { BIOME_TYPES, GROUND_EFFECTS } from '../../data/biome/ground';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../battle';
import { BattleEvents, EffectType } from '../events';
import { scoreAsCall } from '../ai/choose-move';

/**
 * The three moves that read the ground they are fought on.
 *
 * Ground rather than terrain: a terrain is a field a move lays down,
 * which this engine has an enum and an event waiting for, and this is
 * the place the fight is happening in.
 *
 * A battle carries its biome, so what these answer is the place
 * rather than a default: a Camouflage in a swamp is Poison, a Nature
 * Power on a glacier is an Icy Wind, and a Secret Power in a forest
 * puts the target to sleep. What each biome counts as, and what a type
 * is worth to each of the three, are `src/data/biome/ground.yaml`, so a
 * biome added later needs one line rather than three.
 */

/**
 * Open ground: what all three answer where the fight is being had
 * nowhere in particular, which is a demo, a replay staged without its
 * record, or a biome nothing has been decided for
 */
const OPEN_GROUND = { type: Types.Normal, move: Moves.Swift, status: Statuses.Paralyzed } as const;

/** What Secret Power's status lands at */
const SECRET_POWER_CHANCE = 30;

/** The type the ground counts as, for a battle that knows where it is */
export function groundType(battle: Battle): Types {
  const biome = battle.biome;

  return (biome == null ? undefined : BIOME_TYPES[biome]) ?? OPEN_GROUND.type;
}

/** The move the ground throws */
export function groundMove(battle: Battle): Moves {
  return GROUND_EFFECTS[groundType(battle)]?.move ?? OPEN_GROUND.move;
}

/** The status the ground leaves */
export function groundStatus(battle: Battle): Statuses {
  return GROUND_EFFECTS[groundType(battle)]?.status ?? OPEN_GROUND.status;
}

export default function setupGroundMoves(battle: Battle): void {
  // The ground decides the move, so it is worth exactly that move
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.NaturePower) {
      scoreAsCall(battle, event, groundMove(battle));
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.Camouflage) {
      const type = groundType(battle);

      for (const held of [...event.source.types]) {
        event.source.removeType(held);
      }
      event.source.addType(type);
      return;
    }

    if (event.move !== Moves.NaturePower) {
      return;
    }

    const called = groundMove(battle);
    const steps = event.source.checkMoveSteps(called, event.target);

    event.source.triggerMove(called, event.target, steps);

    if (steps > 0) {
      event.source.channel(called, event.target, steps - 1);
    }
  });

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    if (event.parent.move === Moves.SecretPower) {
      event.parent.target.addStatus(groundStatus(battle), {
        type: EffectType.Move,
        move: Moves.SecretPower,
        unit: event.parent.source,
      });
    }
  });

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.SecretPower) {
      event.value = SECRET_POWER_CHANCE;
    }
  });
}
