import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Team from '../team';
import turns from '../turn';
import type Unit from '../unit';
import { onUnitActs } from '../utils';

/**
 * The three Pledges. Two different ones from the same team inside a
 * window combine, the way two in one turn do in the mainline: the
 * second lands at 150 as the pair's type and leaves a field behind
 * https://bulbapedia.bulbagarden.net/wiki/Grass_Pledge_(move)
 */
const WINDOW = turns(1);
const COMBO_POWER = 150;
const FIELD_DURATION = turns(4);

/** What a sea of fire burns off each time a pokemon in it acts */
const SEA_OF_FIRE_SHARE = 1 / 8;
const SWAMP_SPEED = 0.25;
const RAINBOW_CHANCE = 2;

const PLEDGES = new Set<Moves>([Moves.WaterPledge, Moves.FirePledge, Moves.GrassPledge]);

interface Combo {
  type: Types;
  field: TeamStatuses;
  /** A rainbow is over the user's own side; the others are under the target's */
  own: boolean;
}

function comboOf(first: Moves, second: Moves): Combo | undefined {
  const pair = new Set([first, second]);

  if (pair.has(Moves.WaterPledge) && pair.has(Moves.FirePledge)) {
    return { type: Types.Water, field: TeamStatuses.Rainbow, own: true };
  }
  if (pair.has(Moves.FirePledge) && pair.has(Moves.GrassPledge)) {
    return { type: Types.Fire, field: TeamStatuses.SeaOfFire, own: false };
  }
  if (pair.has(Moves.GrassPledge) && pair.has(Moves.WaterPledge)) {
    return { type: Types.Grass, field: TeamStatuses.Swamp, own: false };
  }
  return undefined;
}

export default function setupPledges(battle: Battle): void {
  /** The last Pledge each team landed, and who landed it */
  const pledged = new Map<Team, { unit: Unit; move: Moves; left: number }>();
  /** How long each field still lies on each team */
  const fields = new Map<Team, Map<TeamStatuses, number>>();

  function comboFor(source: Unit, move: Moves): Combo | undefined {
    const last = pledged.get(source.team);

    if (!PLEDGES.has(move) || last == null || last.unit === source || last.move === move) {
      return undefined;
    }
    return comboOf(last.move, move);
  }

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [team, last] of pledged) {
      last.left -= event.duration;
      if (last.left <= 0) {
        pledged.delete(team);
      }
    }
    for (const [team, laid] of fields) {
      for (const [status, left] of laid) {
        if (left > event.duration) {
          laid.set(status, left - event.duration);
          continue;
        }
        laid.delete(status);

        const cause = team.status[status];

        if (cause != null) {
          team.removeStatus(status, cause);
        }
      }
      if (laid.size === 0) {
        fields.delete(team);
      }
    }
    if (pledged.size === 0 && fields.size === 0) {
      timer.stop();
    }
  });

  timer.stop();

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    if (comboFor(event.source, event.move) != null) {
      event.power = COMBO_POWER;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    const combo = comboFor(event.source, event.move);

    if (combo != null) {
      event.type = combo.type;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Post, (event) => {
    if (!PLEDGES.has(event.move)) {
      return;
    }

    const combo = comboFor(event.source, event.move);

    timer.start();

    if (combo == null) {
      pledged.set(event.source.team, { unit: event.source, move: event.move, left: WINDOW });
      return;
    }

    // Spent: a third Pledge starts a new pair rather than joining this one
    pledged.delete(event.source.team);

    let team = event.source.team;

    if (!combo.own) {
      if (event.target.type !== MoveTargetType.Unit) {
        return;
      }
      team = event.target.unit.team;
    }

    team.addStatus(combo.field, { type: EffectType.Move, move: event.move, unit: event.source });

    const laid = fields.get(team) ?? new Map<TeamStatuses, number>();

    laid.set(combo.field, FIELD_DURATION);
    fields.set(team, laid);
  });

  // The rainbow lands after every other chance has been worked out
  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.value != null && event.parent.source.team.status[TeamStatuses.Rainbow] != null) {
      event.value *= RAINBOW_CHANCE;
    }
  });

  onUnitActs(battle, (unit) => {
    if (
      unit.alive &&
      unit.team.status[TeamStatuses.SeaOfFire] != null &&
      !unit.types.has(Types.Fire)
    ) {
      unit.damage(
        { type: EffectType.None },
        unit,
        unit.checkStat(Stats.HP, 0) * SEA_OF_FIRE_SHARE,
        DamageFlags.Indirect | DamageFlags.HealthScaled,
      );
    }
  });

  battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
    if (event.stat === Stats.Speed && event.source.team.status[TeamStatuses.Swamp] != null) {
      event.value *= SWAMP_SPEED;
    }
  });
}
