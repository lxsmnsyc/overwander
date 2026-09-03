import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { MoveFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { STATUS_MOVES } from '../moves/status';
import { createAbility, createAbsorbStageAbility, movesFlagged } from './__create';

/** What a poison hands back instead of taking, per residual. */
const POISON_HEAL_FRACTION = 1 / 8;

/** Both poisons pay out, the way both would otherwise chip. */
const POISONS = new Set<Statuses>([Statuses.Poisoned, Statuses.BadlyPoisoned]);

/**
 * The mainline's Wind Rider also rises when a Tailwind starts behind
 * it. Nothing here blows one, so this is the half that has something
 * to answer: the wind aimed at it
 * https://bulbapedia.bulbagarden.net/wiki/Wind_Rider_(Ability)
 */
/**
 * Truant loafs on alternate turns in the mainline, and there are no
 * turns here to alternate between. So it loafs by the clock instead:
 * the move lock Hyper Beam leaves behind, laid on every move it
 * finishes rather than on one of them
 * https://bulbapedia.bulbagarden.net/wiki/Truant_(Ability)
 */
const setupAbilities = [
  createAbsorbStageAbility(Abilities.WindRider, Stages.Attack, movesFlagged(MoveFlags.Wind)),

  /**
   * Poison Heal answers the residual rather than the status: the
   * poison lands, it stays, and everything else it costs (the AI
   * refusing to poison at all, a cure spending a move) reads the same
   * as ever. Only the health it takes turns around
   * https://bulbapedia.bulbagarden.net/wiki/Poison_Heal_(Ability)
   */
  createAbility(
    Abilities.PoisonHeal,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Pre, (event) => {
          if (!POISONS.has(event.status) || !event.source.hasAbility(Abilities.PoisonHeal)) {
            return;
          }
          // The chip never happens: the residual is turned away here
          // and paid back instead
          event.disabled = true;

          const holder = event.source;

          holder.triggerAbility(Abilities.PoisonHeal);
          holder.heal(
            { type: EffectType.Ability, ability: Abilities.PoisonHeal, unit: holder },
            holder,
            holder.checkStat(Stats.HP, 0) * POISON_HEAL_FRACTION,
            0,
          );
        }),
        // Poisoning it is worse than a wasted cast: it is a heal on a
        // timer, so the AI is refused it outright
        battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
          const status = STATUS_MOVES[event.move];

          // Explicit null check: the first Statuses enum member is 0
          if (
            event.usable &&
            status != null &&
            POISONS.has(status) &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.PoisonHeal)
          ) {
            event.usable = false;
          }
        }),
      ]),
  ),

  createAbility(Abilities.Truant, (battle) =>
    battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.Truant)) {
        event.source.addStatus(Statuses.Recharging, {
          type: EffectType.Ability,
          ability: Abilities.Truant,
          unit: event.source,
        });
      }
    }),
  ),
];

export default function setupGen3Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
