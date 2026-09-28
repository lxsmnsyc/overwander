import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, MoveFlags, MoveTargetPriorities, type Moves } from '../../data/ids/moves';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import { checkTeamUnit } from '../ai/rating';
import { abilitiesOf } from '../moves/ability-moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { onUnitActs } from '../utils';
import {
  createAbility,
  createLimberAbility,
  createNoContactAbility,
  createThickFatAbility,
  createTypeShiftAbility,
} from './__create';

/** What a blow on something that has not yet acted is worth */
export const STAKEOUT_SCALE = 2;

/** The level a Wishiwashi can first call a school at */
export const SCHOOLING_LEVEL = 20;

/** The share of its HP a school holds together above */
export const SCHOOLING_THRESHOLD = 1 / 4;

/** What the bubble does for its own Water moves */
export const WATER_BUBBLE_SCALE = 2;

/** The share of its HP a Wimp Out holder bolts below */
export const WIMP_OUT_THRESHOLD = 1 / 2;

const FIRE = new Set([Types.Fire]);

/**
 * What Receiver will not take up: the ones that copy in their own
 * right, and the ones only a particular shape can use
 */
const UNRECEIVABLE = new Set<Abilities>([
  Abilities.Receiver,
  Abilities.Trace,
  Abilities.Forecast,
  Abilities.FlowerGift,
  Abilities.Multitype,
  Abilities.Illusion,
  Abilities.WonderGuard,
  Abilities.ZenMode,
  Abilities.Imposter,
  Abilities.StanceChange,
  Abilities.PowerConstruct,
  Abilities.Schooling,
]);

/** Whether a move is carried on sound, which is what a voice can wet */
function isSound(move: Moves): boolean {
  return (getMoveData(move).flags & MoveFlags.Sound) !== 0;
}

/** Alola's abilities, as far as its lines are written */
const setupAbilities = [
  // Rowlet: it shoots its quills from where it stands
  createNoContactAbility(Abilities.LongReach),

  // Popplio: its songs go out as water rather than as air, and cost
  // nothing extra for it
  createTypeShiftAbility(Abilities.LiquidVoice, isSound, Types.Water),

  // Yungoos: the mainline's "switched in this turn" has no turn to
  // hang on, so the window is from an entrance to that unit's first
  // move. An entrance before a holder stood on the field goes unseen
  createAbility(Abilities.Stakeout, (battle) => {
    const fresh = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          fresh.add(event.source);
        }
      }),
      ...onUnitActs(battle, (unit) => {
        fresh.delete(unit);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        fresh.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        fresh.delete(event.source);
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const target = event.target;

        if (
          event.power != null &&
          target.type === MoveTargetType.Unit &&
          target.unit.team.alliance !== event.source.team.alliance &&
          fresh.has(target.unit) &&
          event.source.hasAbility(Abilities.Stakeout)
        ) {
          event.power *= STAKEOUT_SCALE;
        }
      }),
    ]);
  }),

  /**
   * Wishiwashi: the school forms while it holds above a quarter of its
   * HP and scatters below, the way Zen Mode sits a Darmanitan down. Only
   * a Wishiwashi has the shapes
   * https://bulbapedia.bulbagarden.net/wiki/Schooling_(Ability)
   */
  createAbility(Abilities.Schooling, (battle) => {
    function settle(unit: Unit): void {
      if (
        !unit.alive ||
        !unit.hasAbility(Abilities.Schooling) ||
        getBaseFormSpecies(unit.species) !== Species.Wishiwashi
      ) {
        return;
      }

      const schooled =
        unit.level >= SCHOOLING_LEVEL &&
        unit.health > unit.checkStat(Stats.HP, 0) * SCHOOLING_THRESHOLD;
      const shape = schooled ? Species.WishiwashiSchool : Species.Wishiwashi;

      if (unit.species === shape) {
        return;
      }
      unit.triggerAbility(Abilities.Schooling);
      // Both shapes share an HP stat, so its health stands where it was
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

  // Dewpider: the bubble it carries keeps fire off and a burn out, and
  // puts its own weight behind the water it throws
  // https://bulbapedia.bulbagarden.net/wiki/Water_Bubble_(Ability)
  createThickFatAbility(Abilities.WaterBubble, FIRE),
  createLimberAbility(Abilities.WaterBubble, [Statuses.Burned]),
  createAbility(Abilities.WaterBubble, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        parent.type === Types.Water &&
        event.unit === parent.source &&
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        parent.source.hasAbility(Abilities.WaterBubble)
      ) {
        event.value *= WATER_BUBBLE_SCALE;
      }
    }),
  ),

  /**
   * Passimian: a fallen teammate's ability is picked up where Receiver
   * was, the first one it does not already carry. Once it has, there is
   * no Receiver left to take another
   * https://bulbapedia.bulbagarden.net/wiki/Receiver_(Ability)
   */
  createAbility(Abilities.Receiver, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const fallen = event.source;

      for (const holder of fallen.team.units) {
        if (holder === fallen || !holder.alive || !holder.hasAbility(Abilities.Receiver)) {
          continue;
        }

        for (const ability of abilitiesOf(fallen)) {
          if (!UNRECEIVABLE.has(ability) && !holder.hasAbility(ability)) {
            holder.triggerAbility(Abilities.Receiver);
            holder.removeAbility(Abilities.Receiver);
            holder.addAbility(ability);
            return;
          }
        }
      }
    }),
  ),

  /**
   * Wimpod, and Wishiwashi as a filler: damage that takes it across
   * half its HP sends it off the field for its strongest teammate. What
   * it spent on purpose does not count, and a trap holds it
   * https://bulbapedia.bulbagarden.net/wiki/Wimp_Out_(Ability)
   */
  createAbility(Abilities.WimpOut, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const unit = event.target;
      const line = unit.checkStat(Stats.HP, 0) * WIMP_OUT_THRESHOLD;

      if (
        !event.success ||
        !unit.alive ||
        event.flags & DamageFlags.Cost ||
        unit.health >= line ||
        unit.health + event.value < line ||
        !unit.hasAbility(Abilities.WimpOut)
      ) {
        return;
      }

      const replacement = checkTeamUnit(battle, unit.team, MoveTargetPriorities.Strongest, unit);

      if (replacement == null || !unit.checkEscape() || !replacement.checkEscape()) {
        return;
      }
      unit.triggerAbility(Abilities.WimpOut);
      unit.forceSwitch(replacement, {
        type: EffectType.Ability,
        ability: Abilities.WimpOut,
        unit,
      });
    }),
  ),
];

export default function setupGen7Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
