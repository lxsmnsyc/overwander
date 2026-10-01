import { AttackPriority } from '../../core/event-emitter';
import { MAX_STAGE, MIN_STAGE, Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories, MoveTargets, Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import { MOVE_WEATHERS } from '../../data/moves/weather';
import type Battle from '../core';
import { BattleModes } from '../core';
import {
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  type CheckUnitAttackEffectChanceEvent,
  type CheckUnitAttackEffectEvent,
  type EffectCause,
  EffectType,
  MoveTargetType,
  type UnitAttackEvent,
} from '../events';
import { TERRAIN_BOOSTED } from '../mechanics/terrain';
import { CHIP_IMMUNE_TYPES, WEATHER_DAMAGE } from '../mechanics/weather';
import resolveMoveTargets from '../mechanics/move/targeting';
import { FORCED_SWITCH_MOVES } from '../moves/switch-out';
import { getStageMoveEffects } from '../moves/stage';
import {
  type AttackStageEffect,
  EFFECT_STAGE_MOVES,
  EFFECT_STATUS_MOVES,
  TEAM_STATUS_MOVES,
  VEIL_THREATS,
} from '../moves/status';
import { GUARDS } from '../moves/team-guards';
import { TERRAIN_MOVES } from '../moves/terrain';
import type Unit from '../unit';
import { type AIContext, effectIn, getAIContext } from './context';
import { knowsMove } from './fog';
import { wantsWeather } from './weather-wants';
import { AFFLICTIONS, MoveRole, ROLE_BASE, getMoveRoles } from './roles';
import { KILL_BONUS } from './score';

type Relevance = (event: CheckUnitAIMoveScoreEvent, context: AIContext) => number;

/** No role, however long it lasts, outbids finishing a foe */
const ROLE_CAP = KILL_BONUS - 1;

/** Any duration will do: only the ratio a caster's gear stretches it by is read */
const DURATION_PROBE = 1000;

function moveCause(event: CheckUnitAIMoveScoreEvent): EffectCause {
  return { type: EffectType.Move, move: event.move, unit: event.source };
}

function isDamaging(move: Moves): boolean {
  return getMoveData(move).category !== MoveCategories.Status;
}

function healthRatio(unit: Unit): number {
  return unit.health / Math.max(1, unit.checkStat(Stats.HP, 0));
}

/** Everybody a move lands on: its target, or whoever a move cast at nobody reaches */
function receivers(battle: Battle, event: CheckUnitAIMoveScoreEvent): Unit[] {
  if (event.target.type === MoveTargetType.Unit) {
    return [event.target.unit];
  }

  const data = getMoveData(event.move);
  const found: Unit[] = [];

  for (const reached of resolveMoveTargets(
    battle,
    event.source,
    event.target,
    data.target,
    data.affects,
  )) {
    if (reached.type === MoveTargetType.Unit) {
      found.push(reached.unit);
    }
  }
  return found.length > 0 ? found : [event.source];
}

/** Whether a unit's side knows it carries a move that passes the test */
function carries(viewer: Unit, unit: Unit, test: (move: Moves) => boolean): boolean {
  for (const state of Object.values(unit.moves)) {
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (state && knowsMove(viewer, unit, state.move) && test(state.move)) {
      return true;
    }
  }
  return false;
}

// --- Shield ---

/** What each team guard turns away */
const GUARD_TURNS: { [key in TeamStatuses]?: (move: Moves) => boolean } = {
  [TeamStatuses.WideGuard]: (move) =>
    isDamaging(move) && getMoveData(move).target === MoveTargets.None,
  [TeamStatuses.QuickGuard]: (move) => (getMoveData(move).priority ?? 0) > 0,
  [TeamStatuses.MatBlock]: isDamaging,
  [TeamStatuses.CraftyShield]: (move) => !isDamaging(move),
};

/** A shield is worth raising when a hit is already on its way */
const shield: Relevance = (event, context) => {
  const source = event.source;

  if (event.move === Moves.Substitute) {
    // Worth the most at full health and nothing at half, where the
    // quarter it costs leaves too little behind it
    return Math.max(0, (healthRatio(source) - 0.5) / 0.5);
  }

  // Only worth raising if it is up before the hit lands
  const ready = effectIn(source, event.move, event.target);
  const guard = GUARDS[event.move];

  if (guard != null) {
    const turns = GUARD_TURNS[guard] ?? isDamaging;

    for (const friend of context.friends()) {
      if (context.incoming(friend, turns, ready)) {
        return 1;
      }
    }
    return 0;
  }
  if (event.move === Moves.MagnetRise) {
    return context.foesKnow((move) => getMoveData(move).type === Types.Ground) ? 0.5 : 0;
  }
  return context.incoming(source, isDamaging, ready) ? 1 : 0;
};

// --- Team setup ---

/** A veil pays off over the whole fight, so it fades as the team loses health */
const teamSetup: Relevance = (event, context) => {
  const status = TEAM_STATUS_MOVES[event.move];

  if (status != null) {
    const threatens = VEIL_THREATS[status];

    if (threatens == null) {
      return 0;
    }

    // A foe that has shown the threat is a sure thing; one whose stats
    // lean that way is a fair guess
    let expected = 0;

    if (context.foesKnow(threatens)) {
      expected = 1;
    } else if (context.foesLean(status)) {
      expected = 0.5;
    }

    const lasting =
      event.source.team.checkStatusDuration(status, DURATION_PROBE, moveCause(event)) /
      DURATION_PROBE;

    return expected * lasting * context.healthShare();
  }
  if (event.move === Moves.LuckyChant) {
    return context.healthShare() / 4;
  }
  return context.healthShare();
};

// --- Hazards and the field ---

const hazard: Relevance = (_, context) => context.healthShare();

/** Whether a unit gains from a weather: a move it boosts, or chip it is spared */
function gainsFromWeather(
  viewer: Unit,
  unit: Unit,
  boosts: Map<Types, number> | undefined,
  spared: Set<Types> | undefined,
): boolean {
  if (spared != null) {
    for (const type of unit.types) {
      if (spared.has(type)) {
        return true;
      }
    }
  }
  return (
    boosts != null &&
    carries(
      viewer,
      unit,
      (move) => isDamaging(move) && (boosts.get(getMoveData(move).type) ?? 1) > 1,
    )
  );
}

/** A field effect is worth setting when it favours the caster's side over the foe's */
const field: Relevance = (event, context) => {
  const source = event.source;
  let ours: (unit: Unit) => boolean;

  const weather = MOVE_WEATHERS.get(event.move);
  const terrain = TERRAIN_MOVES.get(event.move);

  let lasting = 1;

  if (weather != null) {
    const boosts = WEATHER_DAMAGE[weather];
    const spared = CHIP_IMMUNE_TYPES[weather];

    ours = (unit) => gainsFromWeather(source, unit, boosts, spared) || wantsWeather(unit, weather);
    lasting = source.checkWeatherDuration(weather, DURATION_PROBE) / DURATION_PROBE;
  } else if (terrain != null) {
    const boosted = TERRAIN_BOOSTED[terrain];

    if (boosted == null) {
      return 0;
    }
    ours = (unit) =>
      carries(source, unit, (move) => isDamaging(move) && getMoveData(move).type === boosted);
  } else if (event.move === Moves.TrickRoom) {
    return context.slowerSide() ? context.healthShare() : 0;
  } else {
    return 0;
  }

  let friends = false;
  let foes = false;

  for (const friend of context.friends()) {
    friends ||= ours(friend);
  }
  for (const foe of context.foes()) {
    foes ||= ours(foe);
  }
  // A sky that only the foe gains from is one worth not calling up
  let side = 0;

  if (friends) {
    side = foes ? 0.5 : 1;
  } else if (foes) {
    side = -1;
  }
  return side * lasting * context.healthShare();
};

// --- Afflicting ---

/** A status spreads early: worth most on a foe that has the most health left to lose */
const status: Relevance = (event, context) => {
  let total = 0;
  let count = 0;

  for (const unit of receivers(context.battle, event)) {
    if (unit.team.alliance !== event.source.team.alliance) {
      total += healthRatio(unit);
      count += 1;
    }
  }
  return count > 0 ? total / count : 0;
};

// --- Stages ---

/** How much a stage matters to the unit it moves, as far as the caster can tell */
function stageMatters(viewer: Unit, unit: Unit, stage: Stages): number {
  switch (stage) {
    case Stages.Attack:
      return carries(viewer, unit, (move) => getMoveData(move).category === MoveCategories.Physical)
        ? 1
        : 0;
    case Stages.SpecialAttack:
      return carries(viewer, unit, (move) => getMoveData(move).category === MoveCategories.Special)
        ? 1
        : 0;
    case Stages.Speed:
    case Stages.Defense:
      // Speed sets every cooldown, and every foe carries a physical swing
      return 1;
    case Stages.SpecialDefense:
      return 0.5;
    default:
      return 0.5;
  }
}

/** The share of the way a stage still has to go before it is pinned */
function room(current: number, rising: boolean): number {
  return rising ? (MAX_STAGE - current) / MAX_STAGE : (current - MIN_STAGE) / -MIN_STAGE;
}

/**
 * A boost is worth most early and on a stat the unit uses, and less
 * each time it stacks. A raid boss never sets up: it is the clock the
 * party is racing
 */
const selfBoost: Relevance = (event, context) => {
  const source = event.source;

  if (context.battle.mode === BattleModes.Raid && source.hasAbility(Abilities.Boss)) {
    return 0;
  }

  const receiver = event.target.type === MoveTargetType.Unit ? event.target.unit : source;
  const effects = getStageMoveEffects(event.move);
  const cause = moveCause(event);
  let best = effects.length > 0 ? 0 : 0.5;

  for (const effect of effects) {
    // What the receiver would really take: a Contrary turns a rise into
    // a drop, which is no boost at all
    if (effect.value > 0 && receiver.resolveStageChange(effect.stage, effect.value, cause) > 0) {
      const worth =
        stageMatters(source, receiver, effect.stage) *
        Math.min(1, room(receiver.stages[effect.stage], true));

      best = Math.max(best, worth);
    }
  }
  return best * healthRatio(receiver);
};

/** A drop is worth most on a stat the foe has room to lose */
const foeDrop: Relevance = (event, context) => {
  let best = 0;

  for (const unit of receivers(context.battle, event)) {
    if (unit.team.alliance === event.source.team.alliance) {
      continue;
    }
    for (const effect of getStageMoveEffects(event.move)) {
      if (
        effect.value < 0 &&
        unit.resolveStageChange(effect.stage, effect.value, moveCause(event)) < 0
      ) {
        best = Math.max(best, Math.min(1, room(unit.stages[effect.stage], false)));
      }
    }
  }
  return best * context.healthShare();
};

// --- Disruption and support ---

/** Most disruption is weighed by the move's own rules; these two know when they pay */
const disruption: Relevance = (event) => {
  if (event.target.type !== MoveTargetType.Unit) {
    return 0;
  }

  const target = event.target.unit;

  if (event.move === Moves.Taunt) {
    return carries(event.source, target, (move) => !isDamaging(move) && move !== Moves.Attack)
      ? 1
      : 0;
  }
  if (FORCED_SWITCH_MOVES.has(event.move)) {
    let raised = 0;

    for (const stage of [
      Stages.Attack,
      Stages.Defense,
      Stages.SpecialAttack,
      Stages.SpecialDefense,
      Stages.Speed,
    ]) {
      raised += Math.max(0, target.stages[stage]);
    }
    return Math.min(1, raised / 4);
  }
  return 0;
};

const support: Relevance = (event) => {
  if (event.move !== Moves.HelpingHand || event.target.type !== MoveTargetType.Unit) {
    return 0;
  }

  const ally = event.target.unit;

  return ally !== event.source && carries(event.source, ally, isDamaging) ? 1 : 0;
};

const RELEVANCE: { [role in MoveRole]?: Relevance } = {
  [MoveRole.Shield]: shield,
  [MoveRole.TeamSetup]: teamSetup,
  [MoveRole.Hazard]: hazard,
  [MoveRole.Field]: field,
  [MoveRole.Status]: status,
  [MoveRole.SelfBoost]: selfBoost,
  [MoveRole.FoeDrop]: foeDrop,
  [MoveRole.Disruption]: disruption,
  [MoveRole.Support]: support,
};

// --- A hit's side effects ---

/**
 * How often a hit's side effect lands, from the engine's own checks:
 * Serene Grace doubles it and Sheer Force closes it off. Only a hit
 * aimed at one target is read, which is where the effects are
 */
function effectChance(event: CheckUnitAIMoveScoreEvent): number {
  const source = event.source;

  // Only a foe the hit can touch takes what comes with it
  if (
    event.target.type !== MoveTargetType.Unit ||
    event.target.unit.team.alliance === source.team.alliance ||
    source.checkMoveImmunity(
      event.move,
      event.target,
      source.checkMoveType(event.move, event.target),
    )
  ) {
    return 0;
  }

  const data = getMoveData(event.move);
  const parent: UnitAttackEvent = {
    id: 'UnitAttack',
    disabled: false,
    source,
    target: event.target.unit,
    move: event.move,
    value: data.power ?? 0,
    category: data.category,
    type: source.checkMoveType(event.move, event.target),
    flags: MoveAttackFlags.Simulated,
    success: true,
  };
  const gate: CheckUnitAttackEffectEvent = {
    id: 'CheckUnitAttackEffect',
    disabled: false,
    parent,
    success: true,
  };
  source.battle.emit(BattleEvents.CheckUnitAttackEffect, gate);

  if (!gate.success) {
    return 0;
  }

  const chance: CheckUnitAttackEffectChanceEvent = {
    id: 'CheckUnitAttackEffectChance',
    disabled: false,
    parent,
    value: 0,
  };
  source.battle.emit(BattleEvents.CheckUnitAttackEffectChance, chance);
  return Math.min(1, (chance.value ?? 0) / 100);
}

function stagesOf(effect: AttackStageEffect): Stages[] {
  return Array.isArray(effect.stage) ? effect.stage : [effect.stage];
}

/** A status the target can still take, worth most on a healthy one */
const afflicts: Relevance = (event) => {
  const effect = EFFECT_STATUS_MOVES[event.move];

  if (
    effect == null ||
    event.target.type !== MoveTargetType.Unit ||
    !AFFLICTIONS.has(effect.status)
  ) {
    return 0;
  }

  const target = event.target.unit;

  return target.checkStatusImmunity(effect.status, moveCause(event)) ? 0 : healthRatio(target);
};

/** A drop the target would really take, with room left to fall */
const weakens: Relevance = (event) => {
  const effect = EFFECT_STAGE_MOVES[event.move];

  if (effect == null || effect.self === true || event.target.type !== MoveTargetType.Unit) {
    return 0;
  }

  const target = event.target.unit;
  let best = 0;

  for (const stage of stagesOf(effect)) {
    if (target.resolveStageChange(stage, effect.value, moveCause(event)) < 0) {
      best = Math.max(best, room(target.stages[stage], false));
    }
  }
  return best;
};

/** A rise on the user it would really take, on a stat it uses */
const boostsSelf: Relevance = (event) => {
  const effect = EFFECT_STAGE_MOVES[event.move];
  const source = event.source;

  if (effect == null || !effect.self || effect.value <= 0) {
    return 0;
  }

  let best = 0;

  for (const stage of stagesOf(effect)) {
    if (source.resolveStageChange(stage, effect.value, moveCause(event)) > 0) {
      best = Math.max(best, stageMatters(source, source, stage) * room(source.stages[stage], true));
    }
  }
  return best * healthRatio(source);
};

/** Each side effect, weighed as the role it stands for */
const SECONDARY: { [role in MoveRole]?: [MoveRole, Relevance] } = {
  [MoveRole.Afflicts]: [MoveRole.Status, afflicts],
  [MoveRole.Weakens]: [MoveRole.FoeDrop, weakens],
  [MoveRole.SelfBoost]: [MoveRole.SelfBoost, boostsSelf],
};

/**
 * Scores a move by what it is cast for: each role's base, scaled by how
 * much it matters here. A damaging move counts only its shield, since
 * its side effects are chances and the hit is scored on its own
 */
export default function setupRoleScoring(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const damaging = isDamaging(event.move);
    const context = getAIContext(battle, event.source);
    const chance = damaging ? effectChance(event) : 0;

    for (const role of getMoveRoles(event.move)) {
      // A hit's side effect is worth its role times how often it lands
      const secondary = damaging ? SECONDARY[role] : undefined;

      if (secondary != null) {
        const [as, relevance] = secondary;

        if (chance > 0) {
          event.score += Math.round(ROLE_BASE[as] * chance * relevance(event, context));
        }
        continue;
      }

      const relevance = RELEVANCE[role];

      if (relevance == null || (damaging && role !== MoveRole.Shield)) {
        continue;
      }
      event.score += Math.min(ROLE_CAP, Math.round(ROLE_BASE[role] * relevance(event, context)));
    }
  });
}
