import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags, Moves } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';
import {
  createReignAbility,
  createSealedAbility,
  createSwornAbility,
  createUnitCounter,
  createWingbeatAbility,
} from './__create';

/** What Eternatus drains from each enemy as it acts */
export const DARKEST_DAY_FRACTION = 1 / 16;

/** How many landed moves make one Bulk Up */
export const KATA_INTERVAL = 3;

const setupAbilities = [
  // Zacian and Zamazenta: the sword strikes back, the shield steps in front
  createSwornAbility(Abilities.SwornBlade, 'strikes'),
  createSwornAbility(Abilities.SwornShield, 'guards'),

  // Eternatus: the Darkest Day feeds on everything across the field
  createAbility(
    Abilities.DarkestDay,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          for (const holder of getAbilityHolders(battle, Abilities.DarkestDay)) {
            if (
              !unit.alive ||
              !holder.alive ||
              holder.team.alliance === unit.team.alliance ||
              !holder.hasAbility(Abilities.DarkestDay)
            ) {
              continue;
            }

            const cause = {
              type: EffectType.Ability,
              ability: Abilities.DarkestDay,
              unit: holder,
            } as const;
            const before = unit.health;

            holder.triggerAbility(Abilities.DarkestDay);
            holder.damage(
              cause,
              unit,
              unit.checkStat(Stats.HP, 0) * DARKEST_DAY_FRACTION,
              DamageFlags.Indirect,
            );

            // It heals what was taken, not what was asked for
            const lost = before - unit.health;

            if (lost > 0) {
              holder.heal(cause, holder, lost, 0);
            }
          }
        }),
      ),
  ),

  // Kubfu and Urshifu: a form drilled in threes. A multi-hit move is one
  // move, so a unit counts once between one act and the next
  createAbility(Abilities.Kata, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);
    const counted = new Set<Unit>();

    return new MergedLifecycle([
      ...lifecycles,
      ...onUnitActs(battle, (unit) => {
        counted.delete(unit);
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          counted.has(source) ||
          !source.alive ||
          !source.hasAbility(Abilities.Kata)
        ) {
          return;
        }

        counted.add(source);

        const landed = counter.get(source) + 1;

        if (landed < KATA_INTERVAL) {
          counter.set(source, landed);
          return;
        }

        counter.clear(source);
        source.triggerAbility(Abilities.Kata);
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.Kata) {
          event.source.triggerMove(Moves.BulkUp, { type: MoveTargetType.None }, 0);
        }
      }),
    ]);
  }),

  // Regieleki and Regidrago: the two golems that wake in the stats the
  // first three left free
  createSealedAbility(Abilities.VoltSeal, Stages.Speed),
  createSealedAbility(Abilities.WyrmSeal, Stages.SpecialAttack),

  // Calyrex and its steeds: the king's reins
  createReignAbility(Abilities.Frostreign, Stages.Attack),
  createReignAbility(Abilities.Shadereign, Stages.SpecialAttack),
  createReignAbility(Abilities.Crownreign, 'mend'),

  // The Galarian birds: each mirrors its Kanto counterpart's wingbeat,
  // and the two cancel when they meet
  createWingbeatAbility(Abilities.Glarewing, Stages.Speed),
  createWingbeatAbility(Abilities.Strikewing, Stages.SpecialDefense),
  createWingbeatAbility(Abilities.Wrathwing, Stages.Defense),
];

export default setupAbilities;
