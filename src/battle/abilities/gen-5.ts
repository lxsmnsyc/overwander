import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { MoveCategories, type Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { Statuses } from '../../data/ids/status';
import { isDanceMove } from '../../data/moves/flags';
import { getSpeciesData } from '../../data/species';
import { getWornPartner } from '../../data/species/fusion';
import type Battle from '../battle';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import {
  createAbility,
  createContactRecoilAbility,
  createFurCoatAbility,
  createMoldBreakerAbility,
  createMummyAbility,
  getAbilityHolders,
} from './__create';
import { FOLDED_CREEDS, HUSK_CREED } from './signature/gen-5/tao-trio';

/** How far a Darmanitan has to fall before it sits down */
export const ZEN_MODE_THRESHOLD = 1 / 2;

/**
 * Each Darmanitan's standing shape and the Zen shape it sits down
 * into, by either of the two. Galarian Darmanitan has a Zen shape of
 * its own but no sprite for it yet, so it is left out until it does
 */
const ZEN_SHAPES = new Map<Species, { standing: Species; zen: Species }>();

for (const shapes of [{ standing: Species.Darmanitan, zen: Species.DarmanitanZen }]) {
  ZEN_SHAPES.set(shapes.standing, shapes);
  ZEN_SHAPES.set(shapes.zen, shapes);
}

/** How far an Archen has to fall before it loses heart, and what that costs it */
const DEFEATIST_THRESHOLD = 1 / 2;
const DEFEATIST_SCALE = 0.5;

/** What a coat thick enough to turn a blow is worth against one */
const FUR_COAT_SCALE = 0.5;

/** What having the victory sprite on the team is worth to its aim */
const VICTORY_STAR_SCALE = 1.1;

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

    function dress(source: Unit): void {
      if (!source.hasAbility(Abilities.Illusion)) {
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
    }

    return new MergedLifecycle([
      // Dressed before the field is first drawn: the units only walk on
      // when the fight starts, and a countdown spent showing the real
      // face would give the act away before it began
      battle.on(BattleEvents.Initialize, EventPriority.Post, () => {
        for (const unit of battle.units()) {
          dress(unit);
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          dress(event.source);
        }
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

  // Whoever touches it catches it
  createMummyAbility(Abilities.Mummy),

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
      const shapes = ZEN_SHAPES.get(unit.species);

      if (!unit.alive || !unit.hasAbility(Abilities.ZenMode) || shapes == null) {
        return;
      }

      const low = unit.health < unit.checkStat(Stats.HP, 0) * ZEN_MODE_THRESHOLD;
      const shape = low ? shapes.zen : shapes.standing;

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

  /**
   * Defeatist: at half its HP or under, it hits with half its Attack
   * and Special Attack. Written on the stat, so anything asking what
   * it hits like hears the same answer as the move does
   * https://bulbapedia.bulbagarden.net/wiki/Defeatist_(Ability)
   */
  createAbility(Abilities.Defeatist, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const unit = event.source;

      if (
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        unit.hasAbility(Abilities.Defeatist) &&
        unit.health <= unit.checkStat(Stats.HP, 0) * DEFEATIST_THRESHOLD
      ) {
        event.value *= DEFEATIST_SCALE;
      }
    }),
  ),

  /** Fur Coat: the coat turns a blow, and answers nothing thrown at it */
  createFurCoatAbility(Abilities.FurCoat, MoveCategories.Physical, FUR_COAT_SCALE),

  /**
   * Victory Star: the whole team aims better for having it there,
   * the holder included
   */
  createAbility(Abilities.VictoryStar, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
      if (event.accuracy == null) {
        return;
      }

      // It covers its own team, never the whole alliance
      for (const mate of event.source.team.units) {
        if (mate.alive && mate.hasAbility(Abilities.VictoryStar)) {
          event.accuracy *= VICTORY_STAR_SCALE;
          return;
        }
      }
    }),
  ),

  /**
   * Dancer: whoever dances, it dances too, straight after and for
   * free. A dance aimed at the dancer itself is re-aimed at the
   * holder, so a Swords Dance sharpens the copier rather than the
   * one it copied. A copy is never copied in turn, as in the mainline,
   * or a field of dancers would keep answering each other forever
   */
  createAbility(Abilities.Dancer, (battle) => {
    /** Holders part way through a copy, so a copy never copies itself */
    const dancing = new Set<Unit>();
    /**
     * The dance each holder last copied. It lands after the copy is
     * thrown, so it is kept until the holder casts something of its own
     */
    const copied = new Map<Unit, Moves>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
        if (!isDanceMove(event.move) || copied.get(event.source) === event.move) {
          return;
        }

        const lead = event.source;
        const aimed =
          event.target.type === MoveTargetType.Unit && event.target.unit === lead
            ? null
            : event.target;

        for (const holder of getAbilityHolders(battle, Abilities.Dancer)) {
          if (!holder.alive || holder === lead || dancing.has(holder)) {
            continue;
          }

          const back = aimed ?? ({ type: MoveTargetType.Unit, unit: holder } as const);

          holder.triggerAbility(Abilities.Dancer);
          dancing.add(holder);
          copied.set(holder, event.move);

          const steps = holder.checkMoveSteps(event.move, back);

          holder.triggerMove(event.move, back, steps);

          if (steps > 0) {
            holder.channel(event.move, back, steps - 1);
          }

          dancing.delete(holder);
        }
      }),
      battle.on(BattleEvents.UnitCast, EventPriority.Pre, (event) => {
        copied.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        dancing.delete(event.source);
        copied.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        dancing.delete(event.source);
        copied.delete(event.source);
      }),
    ]);
  }),

  // The two dragons carry Mold Breaker under their own names, so both
  // go through its factory
  createMoldBreakerAbility(Abilities.Turboblaze),
  createMoldBreakerAbility(Abilities.Teravolt),
];

/**
 * What Unova brought. The two dragons carry Mold Breaker under their
 * own names, so both go through its factory
 */

/**
 * The dragon inside a fusion is still fighting, so the shape wears
 * what that dragon fights with. A fusion is a kept shape rather than
 * a rolled one, so nothing hands the catch these: they belong to the
 * shape and lift the moment it comes apart
 */
function setupFoldedDragons(battle: Battle): void {
  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;
    const dragon = getWornPartner(unit.species);

    if (dragon == null) {
      return;
    }

    for (const ability of getSpeciesData(dragon).abilities) {
      unit.wearAbility(ability);
    }

    const creed = FOLDED_CREEDS.get(unit.species);

    // The dragon's conviction comes with it, for a holder that was
    // granted the husk's own: a signature is granted rather than
    // rolled, so a fusion passes on what the dragon brought rather
    // than handing out a second gift
    if (creed != null && unit.hasAbility(HUSK_CREED)) {
      unit.wearAbility(creed);
    }
  });
}

export default function setupGen5Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
  setupFoldedDragons(battle);
}
