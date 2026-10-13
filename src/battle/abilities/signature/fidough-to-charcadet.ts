import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { Items } from '../../../data/ids/items';
import { MoveAttackFlags, Moves } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType, type UnitAttackEvent } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import turns from '../../turn';
import type Unit from '../../unit';
import { hasAnyStatus, hasFreeItemSlot, unitTarget } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';
import { createNextCastPenalty, createTimedMarks, createUnitState } from './__create';

/** How long Fresh Batch takes over each Sitrus Berry */
export const FRESH_BATCH_INTERVAL = turns(10);

/** How long Brine Rebound rests between the Salt Cures it throws */
export const BRINE_REBOUND_COOLDOWN = turns(5);

/** What Kindling leaves of the next wind-up */
export const KINDLING_SCALE = 0.75;

/** Whether a landed attack is one an ability should answer, not the AI weighing one */
function landedForReal(battle: Battle, event: UnitAttackEvent): boolean {
  return event.success && !(event.flags & MoveAttackFlags.Simulated) && !battle.estimating;
}

/** The standing teammate with room in its hands and the smallest share of HP left */
function hungriestMate(unit: Unit): Unit | undefined {
  let hungriest: Unit | undefined;
  let lowest = Infinity;

  for (const mate of unit.team.units) {
    if (mate === unit || !mate.alive || !hasFreeItemSlot(mate)) {
      continue;
    }

    const share = mate.health / mate.checkStat(Stats.HP, 0);

    if (share < lowest) {
      hungriest = mate;
      lowest = share;
    }
  }

  return hungriest;
}

/**
 * The later four of Paldea's southern province: the bakery dog, the
 * olive, the salt and the coal
 */
const fidoughToCharcadet = [
  // Fidough: the dough it carries is shared out to whoever needs it.
  // Each baker keeps its own clock, restarted when it arrives
  createAbility(Abilities.FreshBatch, (battle) => {
    const { state: proving, lifecycles } = createUnitState<number>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const baker of getAbilityHolders(battle, Abilities.FreshBatch)) {
          if (!baker.alive || !baker.hasAbility(Abilities.FreshBatch)) {
            continue;
          }

          const waited = (proving.get(baker) ?? 0) + event.duration;

          if (waited < FRESH_BATCH_INTERVAL) {
            proving.set(baker, waited);
            continue;
          }

          proving.set(baker, 0);

          const mate = hungriestMate(baker);

          if (mate) {
            baker.triggerAbility(Abilities.FreshBatch);
            mate.addItem(Items.SitrusBerry);
          }
        }
      }),
    ]);
  }),

  // Smoliv: the oil that mends also soothes. Its own heals are left
  // out, since the description names a teammate
  createAbility(Abilities.Anoint, (battle) =>
    battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
      const healer = event.source;
      const mate = event.target;

      if (
        event.value <= 0 ||
        mate === healer ||
        mate.team !== healer.team ||
        !mate.alive ||
        !healer.hasAbility(Abilities.Anoint) ||
        !hasAnyStatus(mate, MAJOR_STATUS_CONDITIONS)
      ) {
        return;
      }

      const cause = { type: EffectType.Ability, ability: Abilities.Anoint, unit: healer } as const;

      healer.triggerAbility(Abilities.Anoint);
      for (const status of MAJOR_STATUS_CONDITIONS) {
        if (mate.status[status] != null) {
          mate.removeStatus(status, cause);
        }
      }
    }),
  ),

  // Nacli: water on salt leaves brine, and it throws the brine back.
  // An ally's splash is not something to answer
  createAbility(Abilities.BrineRebound, (battle) => {
    const resting = createTimedMarks(battle);

    return new MergedLifecycle([
      ...resting.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const rock = event.target;
        const thrower = event.source;

        if (
          event.type !== Types.Water ||
          !landedForReal(battle, event) ||
          thrower.team.alliance === rock.team.alliance ||
          !rock.alive ||
          !thrower.alive ||
          resting.has(rock) ||
          !rock.hasAbility(Abilities.BrineRebound)
        ) {
          return;
        }

        resting.mark(rock, BRINE_REBOUND_COOLDOWN);
        rock.triggerAbility(Abilities.BrineRebound);
        rock.triggerMove(Moves.SaltCure, unitTarget(thrower), 0);
      }),
    ]);
  }),

  // Charcadet: a landed Fire move stokes the coal for the next one.
  // Cast time only, so nothing comes off cooldown sooner
  createAbility(Abilities.Kindling, (battle) => {
    const stoked = createNextCastPenalty(battle, KINDLING_SCALE);

    return new MergedLifecycle([
      ...stoked.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.type === Types.Fire &&
          landedForReal(battle, event) &&
          source.alive &&
          source.hasAbility(Abilities.Kindling)
        ) {
          source.triggerAbility(Abilities.Kindling);
          stoked.mark(source);
        }
      }),
    ]);
  }),
];

export default fidoughToCharcadet;
