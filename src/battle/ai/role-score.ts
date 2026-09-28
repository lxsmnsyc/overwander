import { AttackPriority } from '../../core/event-emitter';
import { MAX_STAGE, MIN_STAGE, Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { MoveCategories, MoveTargets, Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import { MOVE_WEATHERS } from '../../data/moves/weather';
import type Battle from '../core';
import { BattleModes } from '../core';
import { BattleEvents, type CheckUnitAIMoveScoreEvent, MoveTargetType } from '../events';
import { TERRAIN_BOOSTED } from '../mechanics/terrain';
import { CHIP_IMMUNE_TYPES, WEATHER_DAMAGE } from '../mechanics/weather';
import resolveMoveTargets from '../mechanics/move/targeting';
import { FORCED_SWITCH_MOVES } from '../moves/switch-out';
import { getStageMoveEffects } from '../moves/stage';
import { TEAM_STATUS_MOVES, VEIL_THREATS } from '../moves/status';
import { GUARDS } from '../moves/team-guards';
import { TERRAIN_MOVES } from '../moves/terrain';
import type Unit from '../unit';
import { type AIContext, getAIContext } from './context';
import { knowsMove } from './fog';
import { MoveRole, ROLE_BASE, getMoveRoles } from './roles';

type Relevance = (event: CheckUnitAIMoveScoreEvent, context: AIContext) => number;

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

  const guard = GUARDS[event.move];

  if (guard != null) {
    const turns = GUARD_TURNS[guard] ?? isDamaging;

    for (const friend of context.friends()) {
      if (context.incoming(friend, turns)) {
        return 1;
      }
    }
    return 0;
  }
  if (event.move === Moves.MagnetRise) {
    return context.foesKnow((move) => getMoveData(move).type === Types.Ground) ? 0.5 : 0;
  }
  return context.incoming(source, isDamaging) ? 1 : 0;
};

// --- Team setup ---

/** A veil pays off over the whole fight, so it fades as the team loses health */
const teamSetup: Relevance = (event, context) => {
  const status = TEAM_STATUS_MOVES[event.move];

  if (status != null) {
    const threatens = VEIL_THREATS[status];

    return threatens != null && context.foesKnow(threatens) ? context.healthShare() : 0;
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

  if (weather != null) {
    const boosts = WEATHER_DAMAGE[weather];
    const spared = CHIP_IMMUNE_TYPES[weather];

    ours = (unit) => gainsFromWeather(source, unit, boosts, spared);
  } else if (terrain != null) {
    const boosted = TERRAIN_BOOSTED[terrain];

    if (boosted == null) {
      return 0;
    }
    ours = (unit) =>
      carries(source, unit, (move) => isDamaging(move) && getMoveData(move).type === boosted);
  } else if (event.move === Moves.TrickRoom) {
    return slowerSide(context) ? context.healthShare() : 0;
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
  if (!friends) {
    return 0;
  }
  return (foes ? 0.5 : 1) * context.healthShare();
};

/** Whether the caster's side is the slower one on average */
function slowerSide(context: AIContext): boolean {
  let ours = 0;
  let friends = 0;
  let theirs = 0;
  let foes = 0;

  for (const friend of context.friends()) {
    ours += friend.resolveStat(Stats.Speed, 0);
    friends += 1;
  }
  for (const foe of context.foes()) {
    theirs += foe.resolveStat(Stats.Speed, 0);
    foes += 1;
  }
  return friends > 0 && foes > 0 && ours / friends < theirs / foes;
}

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
  let best = effects.length > 0 ? 0 : 0.5;

  for (const effect of effects) {
    if (effect.value > 0) {
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
      if (effect.value < 0) {
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

/**
 * Scores a move by what it is cast for: each role's base, scaled by how
 * much it matters here. A damaging move counts only its shield, since
 * its side effects are chances and the hit is scored on its own
 */
export default function setupRoleScoring(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const damaging = isDamaging(event.move);
    const context = getAIContext(battle, event.source);

    for (const role of getMoveRoles(event.move)) {
      const relevance = RELEVANCE[role];

      if (relevance == null || (damaging && role !== MoveRole.Shield)) {
        continue;
      }
      event.score += Math.round(ROLE_BASE[role] * relevance(event, context));
    }
  });
}
