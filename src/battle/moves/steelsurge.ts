import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { TYPE_EFFECTIVENESS, TYPE_EFFECTIVENESS_FACTOR, Types } from '../../data/constants/types';
import { DamageFlags } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, type EffectCause } from '../events';
import { registerSideCondition } from '../mechanics/side-conditions';
import type Team from '../team';
import type Unit from '../unit';
import walksOverHazards from './hazards';

/**
 * The sharp steel G-Max Steelsurge leaves over a side: Stealth Rock
 * in every way but its type, so whatever walks in loses an eighth of
 * its health scaled by how it takes a Steel move. It has no team
 * status of its own, so the side keeps it here
 * https://bulbapedia.bulbagarden.net/wiki/G-Max_Steelsurge_(move)
 */
const BASE_DAMAGE = 1 / 8;

const HUNG = new WeakMap<Team, EffectCause>();

export function steelOver(team: Team): boolean {
  return HUNG.has(team);
}

/** Lay the steel over a side, unless it is already there */
export function setSteelsurge(team: Team, cause: EffectCause): void {
  if (!HUNG.has(team)) {
    HUNG.set(team, cause);
  }
}

/** Take a side's steel down, answering whether there was any */
export function clearSteelsurge(team: Team): boolean {
  return HUNG.delete(team);
}

function steelAgainst(unit: Unit): number {
  let factor = 1;

  for (const type of unit.types) {
    const matchup = TYPE_EFFECTIVENESS[Types.Steel][type];

    if (matchup != null) {
      factor *= TYPE_EFFECTIVENESS_FACTOR[matchup];
    }
  }
  return factor;
}

export default function setupSteelsurge(battle: Battle): void {
  registerSideCondition(battle, {
    read: (team) => (steelOver(team) ? 1 : undefined),
    write: (team, value, cause) => {
      if (value == null) {
        clearSteelsurge(team);
      } else {
        setSteelsurge(team, cause);
      }
    },
  });

  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;
    const cause = HUNG.get(unit.team);

    if (!unit.alive || cause == null || walksOverHazards(unit)) {
      return;
    }

    const factor = steelAgainst(unit);

    if (factor === 0) {
      return;
    }

    unit.damage(
      cause,
      unit,
      unit.checkStat(Stats.HP, 0) * BASE_DAMAGE * factor,
      DamageFlags.Indirect | DamageFlags.HealthScaled,
    );
  });
}
