import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import type Unit from '../unit';
import { BattleEvents } from '../events';
import { MergedLifecycle } from '../lifecycle';
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
