import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs } from '../../utils';
import { createAbility } from '../__create';
import { createUnitState } from './__create';

/**
 * What the second road out of the first town holds: the dreamers, the
 * pigeons and the bolts.
 */

/** What each idle second is worth to a dozing Munna, and how many it banks */
export const DOZE_SHARE = 1 / 16;
export const DOZE_MAX_SECONDS = 8;

/** How long a second is on the battle clock, in milliseconds */
const DOZE_SECOND = 1000;

/** What one stage of Speed is worth to a charging Zebstrika, and the ceiling */
export const STORM_DASH_STEP = 0.1;
export const STORM_DASH_MAX_STAGES = 5;

/** What a dozing unit has banked: whole seconds, and the part second under way */
interface Doze {
  seconds: number;
  waited: number;
}

const setupAbilities = [
  /**
   * Doze: a Munna sleeps through everything that is not its own move,
   * and wakes long enough to spend the rest. The bank is paid as it
   * reaches for a move, where the residual items are paid, so the
   * sleep is worth nothing to anybody who keeps it busy
   */
  createAbility(Abilities.Doze, (battle) => {
    const { state, lifecycles } = createUnitState<Doze>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const unit of battle.units()) {
          if (
            !unit.alive ||
            !unit.hasAbility(Abilities.Doze) ||
            unit.casting != null ||
            unit.channeling != null
          ) {
            continue;
          }

          const kept = state.get(unit) ?? { seconds: 0, waited: 0 };
          const waited = kept.waited + event.duration;

          state.set(unit, {
            seconds: Math.min(DOZE_MAX_SECONDS, kept.seconds + Math.floor(waited / DOZE_SECOND)),
            waited: waited % DOZE_SECOND,
          });
        }
      }),
      ...onUnitActs(battle, (unit) => {
        const banked = state.get(unit)?.seconds ?? 0;
        const maxHealth = unit.checkStat(Stats.HP, 0);

        if (banked === 0 || !unit.alive || unit.health >= maxHealth) {
          return;
        }
        state.set(unit, { seconds: 0, waited: 0 });
        unit.triggerAbility(Abilities.Doze);
        unit.heal(
          { type: EffectType.Ability, ability: Abilities.Doze, unit },
          unit,
          Math.max(1, Math.floor(maxHealth * DOZE_SHARE * banked)),
          0,
        );
      }),
    ]);
  }),

  /**
   * Homing: a pigeon that has found somebody once finds them again.
   * The first blow is rolled for like anybody's; after that its moves
   * cannot miss that target, however much evasion is piled up
   */
  createAbility(Abilities.Homing, (battle) => {
    /** Who each holder has already landed something on */
    const found = new WeakMap<Unit, Set<Unit>>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
        if (
          event.accuracy == null ||
          event.target.type !== MoveTargetType.Unit ||
          !event.source.hasAbility(Abilities.Homing) ||
          !found.get(event.source)?.has(event.target.unit)
        ) {
          return;
        }

        event.accuracy = undefined;
        event.source.triggerAbility(Abilities.Homing);
      }),

      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          !event.source.hasAbility(Abilities.Homing)
        ) {
          return;
        }

        const marked = found.get(event.source) ?? new Set<Unit>();

        marked.add(event.target);
        found.set(event.source, marked);
      }),
    ]);
  }),

  /**
   * Storm Dash: a Zebstrika hits as hard as it is running, so its own
   * Agility and its Motor Drive each pay twice. Read off the stage
   * rather than the stat, so a paralysis does not also cost it damage
   */
  createAbility(Abilities.StormDash, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const held = event.source.stages[Stages.Speed];

      if (event.power == null || held <= 0 || !event.source.hasAbility(Abilities.StormDash)) {
        return;
      }

      event.power *= 1 + STORM_DASH_STEP * Math.min(STORM_DASH_MAX_STAGES, held);
    }),
  ),
];

export default setupAbilities;
