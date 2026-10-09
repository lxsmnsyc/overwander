import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import {
  MoveAffects,
  MoveAttackFlags,
  MoveFlags,
  MoveTargets,
  Moves,
} from '../../../data/ids/moves';
import { Statuses, TeamStatuses, Terrains } from '../../../data/ids/status';
import { getMoveData } from '../../../data/moves';
import type { Items } from '../../../data/ids/items';
import { isBerry } from '../../../data/items/berries';
import type Battle from '../../core';
import {
  BattleEvents,
  type EffectCause,
  EffectType,
  MoveTargetType,
  type UnitHealEvent,
} from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import type Unit from '../../unit';
import { countHeldItems, hasFreeItemSlot } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';
import {
  createTimedMarks,
  enemyHolder,
  isPseudoMove,
  isSingleTargetMove,
  sideHolder,
} from './__create';

/** How long the escort and the lookout each wait before they answer again */
export const STEEL_ESCORT_COOLDOWN = turns(5);
export const EARLY_WARNING_COOLDOWN = turns(5);

/** What the cotton makes a field heal worth to the team it covers */
export const COTTON_CRADLE_SCALE = 1.5;

/** The screens a snapping shell bites through, the ones Brick Break breaks */
const SCREENS = [TeamStatuses.Reflect, TeamStatuses.LightScreen, TeamStatuses.AuroraVeil];

/** Moves that take an item off somebody and into the taker's hands */
const THIEVING_MOVES = new Set<Moves>([Moves.Thief, Moves.Covet]);

/** Whether the item was taken by this unit rather than eaten, traded or knocked off */
function isTheft(cause: EffectCause, thief: Unit): boolean {
  if (cause.type === EffectType.Ability) {
    return cause.unit === thief;
  }

  return cause.type === EffectType.Move && cause.unit === thief && THIEVING_MOVES.has(cause.move);
}

/** The teammate furthest from full with nothing in its hands and room for something */
function emptyHandedMate(holder: Unit): Unit | undefined {
  let found: Unit | undefined;
  let lowest = Number.POSITIVE_INFINITY;

  for (const mate of holder.team.units) {
    if (mate === holder || !mate.alive || countHeldItems(mate) > 0 || !hasFreeItemSlot(mate)) {
      continue;
    }

    const share = mate.health / mate.checkStat(Stats.HP, 0);

    if (share < lowest) {
      found = mate;
      lowest = share;
    }
  }

  return found;
}

/** Whether a move goes out over the whole of the caster's far side */
function hitsWholeSide(caster: Unit, move: Moves): boolean {
  if (isPseudoMove(move)) {
    return false;
  }

  // Asked rather than read, so a move a raid boss has widened counts
  const { target, affects } = caster.checkMoveTargeting(move);

  return (
    target === MoveTargets.None &&
    (affects & MoveAffects.Unit) !== 0 &&
    (affects & MoveAffects.Enemy) !== 0
  );
}

/**
 * Whether a heal is one the cotton cradles: a seed draining for its
 * planter, roots drawing up, or the grass underfoot. A drain and a
 * root heal under the very cause their status was put on with, and
 * Grassy Terrain is the one heal in the engine with no cause at all
 */
function isFieldHeal(battle: Battle, event: UnitHealEvent): boolean {
  const target = event.target;
  const cause = event.cause;

  if (cause.type === EffectType.None) {
    return target.checkTerrain() === Terrains.Grassy;
  }
  if (target.status[Statuses.Rooted] === cause) {
    return true;
  }
  if (cause.unit !== target) {
    return false;
  }

  for (const seeded of battle.units()) {
    if (seeded.status[Statuses.Seeding] === cause) {
      return true;
    }
  }

  return false;
}

/**
 * Postwick, Route 1 and the Wild Area: the squirrel that eats what the
 * other side was saving, the bird and the bug that keep watch, the fox
 * that fences what it steals, the cotton, the sheep, the snapper and
 * the pup
 */
const setupAbilities = [
  // Skwovet: whatever an enemy goes to eat ends up in its cheeks. The
  // berry goes in without passing through its hands, so a full grip
  // does not refuse it
  createAbility(Abilities.PantryRaid, (battle) => {
    // Two raiders facing each other would pass one berry back and forth
    let raiding = false;

    return battle.on(BattleEvents.UnitTriggerItem, EventPriority.Pre, (event) => {
      if (raiding || !isBerry(event.item)) {
        return;
      }

      const raider = enemyHolder(battle, event.source, Abilities.PantryRaid);

      if (raider == null) {
        return;
      }

      event.disabled = true;
      raiding = true;
      raider.triggerAbility(Abilities.PantryRaid);
      battle.emit(BattleEvents.UnitTriggerItem, {
        id: 'UnitTriggerItem',
        disabled: false,
        source: raider,
        item: event.item,
      });
      raiding = false;
    });
  }),

  // Rookidee: a spread move coming at its side is met with a wall of
  // steel before it lands
  createAbility(Abilities.SteelEscort, (battle) => {
    const resting = createTimedMarks(battle);

    return new MergedLifecycle([
      ...resting.lifecycles,
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        const caster = event.source;

        if (!hitsWholeSide(caster, event.move)) {
          return;
        }

        for (const escort of getAbilityHolders(battle, Abilities.SteelEscort)) {
          if (
            !escort.alive ||
            escort.team.alliance === caster.team.alliance ||
            resting.has(escort) ||
            !escort.hasAbility(Abilities.SteelEscort)
          ) {
            continue;
          }

          resting.mark(escort, STEEL_ESCORT_COOLDOWN);
          escort.triggerAbility(Abilities.SteelEscort);
          escort.triggerMove(Moves.WideGuard, { type: MoveTargetType.Team, team: escort.team }, 0);
        }
      }),
    ]);
  }),

  // Blipbug: the hairs pick up an enemy winding up at a teammate, and
  // the teammate is warned in time to guard
  createAbility(Abilities.EarlyWarning, (battle) => {
    const resting = createTimedMarks(battle);

    return new MergedLifecycle([
      ...resting.lifecycles,
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        const caster = event.source;
        // Read off the cast rather than the event: a Follow Me may
        // already have turned it
        const aimed = caster.casting?.target ?? event.target;

        if (aimed.type !== MoveTargetType.Unit || !isSingleTargetMove(event.move)) {
          return;
        }

        const mate = aimed.unit;

        if (!mate.alive || mate.team.alliance === caster.team.alliance) {
          return;
        }

        for (const lookout of mate.team.units) {
          if (
            lookout === mate ||
            !lookout.alive ||
            resting.has(lookout) ||
            !lookout.hasAbility(Abilities.EarlyWarning)
          ) {
            continue;
          }

          resting.mark(lookout, EARLY_WARNING_COOLDOWN);
          lookout.triggerAbility(Abilities.EarlyWarning);
          mate.triggerMove(Moves.Detect, { type: MoveTargetType.None }, 0);
          return;
        }
      }),
    ]);
  }),

  // Nickit: what it lifts is passed on before it reaches its own
  // paws, so the next theft finds them empty
  createAbility(Abilities.Fence, (battle) => {
    // What each fence has just lifted, waiting to land in its hands
    const lifted = new Map<Unit, Items>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
        const cause = event.cause;

        if (
          cause.type !== EffectType.None &&
          cause.unit !== event.source &&
          isTheft(cause, cause.unit) &&
          cause.unit.hasAbility(Abilities.Fence)
        ) {
          lifted.set(cause.unit, event.item);
        }
      }),
      battle.on(BattleEvents.UnitAddItem, EventPriority.Pre, (event) => {
        const fence = event.source;

        if (lifted.get(fence) !== event.item) {
          return;
        }

        lifted.delete(fence);

        const mate = emptyHandedMate(fence);

        if (mate == null) {
          return;
        }

        event.disabled = true;
        fence.triggerAbility(Abilities.Fence);
        mate.addItem(event.item);
      }),
    ]);
  }),

  // Gossifleur: the cotton cushions whatever the field gives back, so
  // its team draws more from seed, root and grass
  createAbility(Abilities.CottonCradle, (battle) =>
    // Before Exact, which is where the health actually goes back
    battle.on(BattleEvents.UnitHeal, EventPriority.Pre, (event) => {
      if (
        event.value > 0 &&
        sideHolder(battle, event.target, Abilities.CottonCradle) != null &&
        isFieldHeal(battle, event)
      ) {
        event.value *= COTTON_CRADLE_SCALE;
      }
    }),
  ),

  // Wooloo: the fleece goes up once, and what is left underneath is
  // lighter and quicker for it
  createAbility(Abilities.Shorn, (battle) => {
    const singed = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          !event.success ||
          event.type !== Types.Fire ||
          event.flags & MoveAttackFlags.Simulated ||
          !target.alive ||
          singed.has(target) ||
          !target.hasAbility(Abilities.Shorn)
        ) {
          return;
        }

        singed.add(target);
        target.triggerAbility(Abilities.Shorn);
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability !== Abilities.Shorn) {
          return;
        }

        const source = event.source;
        const burn = source.status[Statuses.Burned];

        if (burn != null) {
          source.removeStatus(Statuses.Burned, {
            type: EffectType.Ability,
            ability: Abilities.Shorn,
            unit: source,
          });
        }
        source.triggerMove(Moves.Agility, { type: MoveTargetType.None }, 0);
      }),
    ]);
  }),

  // Chewtle: a jaw that snaps shells snaps screens the same way
  createAbility(Abilities.ShellSnap, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
      const source = event.source;
      const team = event.target.team;

      if (
        event.flags & MoveAttackFlags.Simulated ||
        isPseudoMove(event.move) ||
        (getMoveData(event.move).flags & MoveFlags.Bite) === 0 ||
        !source.hasAbility(Abilities.ShellSnap)
      ) {
        return;
      }

      let snapped = false;
      const cause = {
        type: EffectType.Ability,
        ability: Abilities.ShellSnap,
        unit: source,
      } as const;

      for (const screen of SCREENS) {
        if (team.status[screen] != null) {
          if (!snapped) {
            snapped = true;
            source.triggerAbility(Abilities.ShellSnap);
          }
          team.removeStatus(screen, cause);
        }
      }
    }),
  ),

  // Yamper: every burst of pace sets the tail sparking
  createAbility(
    Abilities.Zoomies,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
          if (
            event.stage === Stages.Speed &&
            event.value > 0 &&
            event.source.hasAbility(Abilities.Zoomies)
          ) {
            event.source.triggerAbility(Abilities.Zoomies);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Zoomies) {
            event.source.triggerMove(Moves.Charge, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),
];

export default setupAbilities;
