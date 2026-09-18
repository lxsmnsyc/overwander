import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
import type Battle from '../core';
import { Statuses } from '../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { countsAgainstSlots } from '../../data/constants/slots';
import { createAbility, createContactRecoilAbility } from './__create';

/**
 * The abilities a swap may take: what counts against a slot, and never
 * a shape's own, which is worn rather than carried
 */
function swappableAbilities(unit: Unit): Abilities[] {
  const held: Abilities[] = [];

  // The list is keyed by the ability enum, which comes back as a
  // string from Object.entries
  for (const [ability, carried] of Object.entries(unit.abilities)) {
    const id: Abilities = Number(ability);

    if (carried && countsAgainstSlots(id) && unit.worn[id] == null) {
      held.push(id);
    }
  }

  return held;
}

/** How far a Darmanitan has to fall before it sits down */
export const ZEN_MODE_THRESHOLD = 1 / 2;

const setupAbilities = [
  // https://bulbapedia.bulbagarden.net/wiki/Iron_Barbs_(Ability)
  createContactRecoilAbility(Abilities.IronBarbs),

  /**
   * Illusion dresses its holder as the teammate standing furthest back
   * as it takes the field, and the act drops the moment anything lands
   * on it. Only the look changes: what it is, and what it hits with,
   * never moved
   * https://bulbapedia.bulbagarden.net/wiki/Illusion_(Ability)
   */
  createAbility(Abilities.Illusion, (battle) => {
    /** Who is still wearing somebody else's face */
    const acting = new Set<Unit>();

    function drop(unit: Unit): void {
      if (acting.delete(unit)) {
        unit.setAppearance(unit.species);
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        const source = event.source;

        if (event.reactivation || !source.hasAbility(Abilities.Illusion)) {
          return;
        }

        // The last one on the team, which is the mainline's rule and
        // is the one a player is least likely to be watching
        let worn: Unit | undefined;

        for (const mate of source.team.units) {
          if (mate !== source && mate.alive) {
            worn = mate;
          }
        }

        if (worn == null) {
          return;
        }
        acting.add(source);
        source.setAppearance(worn.species);
      }),

      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (event.success && acting.has(event.target)) {
          event.target.triggerAbility(Abilities.Illusion);
          drop(event.target);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        drop(event.source);
      }),
    ]);
  }),

  /**
   * Mummy spreads itself: whoever touches it catches it in place of
   * whatever they were carrying. One ability rather than the lot, the
   * way Worry Seed takes one, and a worn shape's own is left alone
   * https://bulbapedia.bulbagarden.net/wiki/Mummy_(Ability)
   */
  createAbility(Abilities.Mummy, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !source.alive ||
        source === target ||
        source.hasAbility(Abilities.Mummy) ||
        !target.hasAbility(Abilities.Mummy) ||
        !source.checkMoveContact(event.move, { type: MoveTargetType.Unit, unit: target })
      ) {
        return;
      }

      const held = swappableAbilities(source);

      target.triggerAbility(Abilities.Mummy);

      if (held.length > 0) {
        source.removeAbility(held[Math.floor(battle.random() * held.length)]);
      }
      source.addAbility(Abilities.Mummy);
    }),
  ),

  /**
   * Perish Body: the lid closes on whoever reached in, and the coffin
   * goes with them. It casts the song the engine already counts down
   * rather than counting one of its own
   * https://bulbapedia.bulbagarden.net/wiki/Perish_Body_(Ability)
   */
  createAbility(Abilities.PerishBody, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !source.alive ||
        source === target ||
        !target.hasAbility(Abilities.PerishBody) ||
        source.status[Statuses.Perishing] != null ||
        !source.checkMoveContact(event.move, { type: MoveTargetType.Unit, unit: target })
      ) {
        return;
      }

      const cause = {
        type: EffectType.Ability,
        ability: Abilities.PerishBody,
        unit: target,
      } as const;

      target.triggerAbility(Abilities.PerishBody);
      source.addStatus(Statuses.Perishing, cause);
      target.addStatus(Statuses.Perishing, cause);
    }),
  ),

  /**
   * Zen Mode sits its holder down once a hit has taken it low enough,
   * and stands it back up if it is healed past the line. Only a
   * Darmanitan has the shapes, so anybody else who picks the ability
   * up carries a dead one
   * https://bulbapedia.bulbagarden.net/wiki/Zen_Mode_(Ability)
   */
  createAbility(Abilities.ZenMode, (battle) => {
    function settle(unit: Unit): void {
      if (
        !unit.alive ||
        !unit.hasAbility(Abilities.ZenMode) ||
        getBaseFormSpecies(unit.species) !== Species.Darmanitan
      ) {
        return;
      }

      const low = unit.health < unit.checkStat(Stats.HP, 0) * ZEN_MODE_THRESHOLD;
      const shape = low ? Species.DarmanitanZen : Species.Darmanitan;

      if (unit.species === shape) {
        return;
      }
      unit.triggerAbility(Abilities.ZenMode);
      // The shape carries its own stats and its second type with it,
      // and both shapes share an HP stat, so nothing it is standing on
      // moves underneath it
      unit.setSpecies(shape);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        settle(event.target);
      }),
      battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
        settle(event.source);
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        settle(event.source);
      }),
    ]);
  }),
];

export default function setupGen5Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
