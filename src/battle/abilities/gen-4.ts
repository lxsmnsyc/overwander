import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import type Unit from '../unit';
import { ItemTypes } from '../../data/ids/items';
import { getItemData } from '../../data/items';
import { BattleEvents, EffectType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { SEALED_DURATION } from './signature/__create';
import { hasAnyStatus } from '../utils';
import {
  createAbility,
  createStatusBoostAbility,
  createThickFatAbility,
  getAbilityHolders,
} from './__create';

/** What a burn is worth to a Special Attack that feeds on it. */
const FLARE_BOOST_SCALE = 1.5;

/** The one burn, for the ability that reads it that way. */
const BURN_HELD = new Set([Statuses.Burned]);

/** Either poison is what the pincers were waiting for. */
const POISONS_HELD = new Set([Statuses.Poisoned, Statuses.BadlyPoisoned]);

/** What standing beside a friend is worth. */
const FRIEND_GUARD_SCALE = 0.75;

/** What a mind is taken away from its owner with. */
const AROMA_VEIL_STATUSES = new Set([
  Statuses.Encored,
  Statuses.HealBlocked,
  Statuses.Infatuated,
  Statuses.Taunted,
  Statuses.Tormented,
]);

/** The one type the bronze turns away. */
const HEATPROOF_TYPES = new Set([Types.Fire]);

/** And how much of a burn it feels, fire being fire. */
const HEATPROOF_BURN_SCALE = 0.5;

/**
 * How long a Regigigas is still getting going. It is the seal's own
 * window on purpose: it carries both, so the time it stands weak is
 * exactly the time nothing can punish it for standing weak
 */
const SLOW_START_DURATION = SEALED_DURATION;

/** What a pouch is worth on top of whatever the berry did. */
const CHEEK_POUCH_SHARE = 1 / 3;

/** What Attack and Speed are worth while it is still getting going. */
const SLOW_START_SCALE = 0.5;

/** The two stats a slow start holds back. */
const SLOW_START_STATS = new Set([Stats.Attack, Stats.Speed]);

/** Whoever on the unit's own team is holding the veil over it. */
function isUnderAromaVeil(battle: Battle, unit: Unit): Unit | null {
  for (const veil of getAbilityHolders(battle, Abilities.AromaVeil)) {
    if (veil.alive && veil.team === unit.team && veil.hasAbility(Abilities.AromaVeil)) {
      return veil;
    }
  }

  return null;
}

/** What Sinnoh brought to the pools. */
const setupAbilities = [
  // https://bulbapedia.bulbagarden.net/wiki/Flare_Boost_(Ability)
  createStatusBoostAbility(Abilities.FlareBoost, BURN_HELD, Stats.SpecialAttack, FLARE_BOOST_SCALE),

  // https://bulbapedia.bulbagarden.net/wiki/Klutz_(Ability)
  createAbility(Abilities.Klutz, (battle) =>
    battle.on(BattleEvents.CheckUnitItem, EventPriority.Post, (event) => {
      // The item is still held and still knocked off or tricked away;
      // what it does is what the holder cannot reach
      if (event.enabled && event.source.hasAbility(Abilities.Klutz)) {
        event.enabled = false;
      }
    }),
  ),

  /**
   * Merciless answers before the roll rather than after it, so armour
   * (Battle Armor, Shell Armor) still refuses the critical at Post the
   * way it refuses a rolled one
   * https://bulbapedia.bulbagarden.net/wiki/Merciless_(Ability)
   */
  createAbility(Abilities.Merciless, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Pre, (event) => {
      if (
        !event.critical &&
        event.parent.source.hasAbility(Abilities.Merciless) &&
        hasAnyStatus(event.parent.target, POISONS_HELD)
      ) {
        event.critical = true;
      }
    }),
  ),

  /**
   * Friend Guard covers the holder's own team and never the holder,
   * so two of them stand behind each other rather than behind
   * themselves
   * https://bulbapedia.bulbagarden.net/wiki/Friend_Guard_(Ability)
   */
  createAbility(Abilities.FriendGuard, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const target = event.target;

      if (event.value <= 0) {
        return;
      }

      for (const guard of getAbilityHolders(battle, Abilities.FriendGuard)) {
        if (
          guard !== target &&
          guard.alive &&
          guard.team === target.team &&
          guard.hasAbility(Abilities.FriendGuard)
        ) {
          event.value *= FRIEND_GUARD_SCALE;
          return;
        }
      }
    }),
  ),

  /**
   * Aroma Veil covers the holder's own team, itself included, so a
   * lone holder is still under it
   * https://bulbapedia.bulbagarden.net/wiki/Aroma_Veil_(Ability)
   */
  createAbility(
    Abilities.AromaVeil,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            AROMA_VEIL_STATUSES.has(event.status) &&
            isUnderAromaVeil(battle, event.source) != null
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was refused
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          const veil = AROMA_VEIL_STATUSES.has(event.status)
            ? isUnderAromaVeil(battle, event.source)
            : null;

          if (veil != null) {
            veil.triggerAbility(Abilities.AromaVeil);
          }
        }),
      ]),
  ),

  /**
   * Slow Start counts from the arrival rather than from the ability,
   * so a unit handed one mid-fight is not started over
   * https://bulbapedia.bulbagarden.net/wiki/Slow_Start_(Ability)
   */
  createAbility(Abilities.SlowStart, (battle) => {
    const stood = new Map<Unit, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          stood.set(event.source, 0);
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        stood.delete(event.source);
      }),
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const slow of getAbilityHolders(battle, Abilities.SlowStart)) {
          const time = stood.get(slow) ?? 0;

          if (slow.alive && time < SLOW_START_DURATION) {
            stood.set(slow, time + event.duration);
          }
        }
      }),
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (
          SLOW_START_STATS.has(event.stat) &&
          event.source.hasAbility(Abilities.SlowStart) &&
          (stood.get(event.source) ?? 0) < SLOW_START_DURATION
        ) {
          event.value *= SLOW_START_SCALE;
        }
      }),
    ]);
  }),

  /**
   * The pouch pays out on the berry going down, so only a berry the
   * holder ate itself counts: one knocked off or tricked away is
   * somebody else taking it
   * https://bulbapedia.bulbagarden.net/wiki/Cheek_Pouch_(Ability)
   */
  createAbility(Abilities.CheekPouch, (battle) =>
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      const unit = event.source;

      if (
        event.cause.type === EffectType.Item &&
        unit.alive &&
        unit.hasAbility(Abilities.CheekPouch) &&
        getItemData(event.item).type === ItemTypes.Berry
      ) {
        unit.triggerAbility(Abilities.CheekPouch);
        unit.heal(
          { type: EffectType.Ability, ability: Abilities.CheekPouch, unit },
          unit,
          Math.max(1, Math.floor(unit.checkStat(Stats.HP, 0) * CHEEK_POUCH_SHARE)),
          0,
        );
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Heatproof_(Ability)
  createThickFatAbility(Abilities.Heatproof, HEATPROOF_TYPES),

  // Its other half, and a separate setup because the two answer
  // unrelated questions: what a Fire move is worth, and what a burn
  // takes
  createAbility(Abilities.Heatproof, (battle) =>
    battle.on(BattleEvents.CheckUnitStatusDamage, EventPriority.Post, (event) => {
      if (event.status === Statuses.Burned && event.source.hasAbility(Abilities.Heatproof)) {
        event.value *= HEATPROOF_BURN_SCALE;
      }
    }),
  ),
];

export default function setupGen4Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
