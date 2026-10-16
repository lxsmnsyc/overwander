import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, EffectType, type UnitAttackEvent } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import turns from '../../turn';
import type Unit from '../../unit';
import { hasAnyStatus, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createTimedMarks } from './__create';

/** How much of a Grass critical hit Petal Scatter throws onto the rest */
export const PETAL_SCATTER_FRACTION = 1 / 4;

/** How long Wake rests between the wakes it leaves */
export const WAKE_COOLDOWN = turns(4);

/** Every standing enemy of the holder other than the one it hit */
function otherEnemies(battle: Battle, holder: Unit, hit: Unit): Unit[] {
  const others: Unit[] = [];

  for (const other of battle.units(holder.team.alliance)) {
    if (other !== hit && other.alive) {
      others.push(other);
    }
  }
  return others;
}

/** Whether a landed attack is one an ability should answer, not the AI weighing one */
function landedForReal(battle: Battle, event: UnitAttackEvent): boolean {
  return (
    event.success &&
    !(event.flags & MoveAttackFlags.Simulated) &&
    !battle.estimating &&
    event.source.team.alliance !== event.target.team.alliance
  );
}

/**
 * Paldea's three starters, each a performer: one of its blows reaches
 * past the pokemon it was thrown at. The magician's flourish scatters
 * petals, the singer's fire spreads, and the dancer's steps leave a wake
 */
const setupAbilities = [
  // Sprigatito: the critical hit is the trick, and the petals land on
  // the audience. The splash is indirect, so it never sets itself off
  createAbility(Abilities.PetalScatter, (battle) => {
    const before = new WeakMap<UnitAttackEvent, { criticals: number; health: number }>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
        if (event.source.hasAbility(Abilities.PetalScatter)) {
          before.set(event, { criticals: event.source.criticals, health: event.target.health });
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const was = before.get(event);
        const source = event.source;

        // The resolver counts the critical hits that land, so a count
        // that moved is this attack's
        if (
          was == null ||
          event.type !== Types.Grass ||
          !landedForReal(battle, event) ||
          source.criticals === was.criticals
        ) {
          return;
        }

        const dealt = was.health - event.target.health;

        if (dealt <= 0) {
          return;
        }

        source.triggerAbility(Abilities.PetalScatter);
        for (const other of otherEnemies(battle, source, event.target)) {
          source.damage(
            { type: EffectType.Ability, ability: Abilities.PetalScatter, unit: source },
            other,
            dealt * PETAL_SCATTER_FRACTION,
            DamageFlags.Indirect,
          );
        }
      }),
    ]);
  }),

  // Fuecoco: a burn from its song catches on the weakest one listening.
  // The second burn is the ability's own, so it never spreads again
  createAbility(Abilities.SpreadingFlame, (battle) =>
    battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      const cause = event.cause;

      if (event.status !== Statuses.Burned || cause.type !== EffectType.Move) {
        return;
      }

      const holder = cause.unit;

      if (
        !holder.hasAbility(Abilities.SpreadingFlame) ||
        holder.team.alliance === event.source.team.alliance ||
        holder.checkMoveType(cause.move, unitTarget(event.source)) !== Types.Fire
      ) {
        return;
      }

      let weakest: Unit | undefined;
      let lowest = Infinity;

      for (const other of otherEnemies(battle, holder, event.source)) {
        const share = other.health / other.checkStat(Stats.HP, 0);

        if (!hasAnyStatus(other, MAJOR_STATUS_CONDITIONS) && share < lowest) {
          weakest = other;
          lowest = share;
        }
      }

      if (weakest == null) {
        return;
      }

      holder.triggerAbility(Abilities.SpreadingFlame);
      weakest.addStatus(Statuses.Burned, {
        type: EffectType.Ability,
        ability: Abilities.SpreadingFlame,
        unit: holder,
      });
    }),
  ),

  // Quaxly: the water it kicks up drags at everyone opposite, not only
  // the one it struck
  createAbility(Abilities.Wake, (battle) => {
    const resting = createTimedMarks(battle);

    return new MergedLifecycle([
      ...resting.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.type !== Types.Water ||
          !landedForReal(battle, event) ||
          !source.alive ||
          resting.has(source) ||
          !source.hasAbility(Abilities.Wake)
        ) {
          return;
        }

        const cause = { type: EffectType.Ability, ability: Abilities.Wake, unit: source } as const;

        resting.mark(source, WAKE_COOLDOWN);
        source.triggerAbility(Abilities.Wake);
        if (event.target.alive) {
          event.target.addStage(Stages.Speed, -1, cause);
        }
        for (const other of otherEnemies(battle, source, event.target)) {
          other.addStage(Stages.Speed, -1, cause);
        }
      }),
    ]);
  }),
];

export default setupAbilities;
