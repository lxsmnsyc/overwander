import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { createAbility, createStatusBoostAbility, createThickFatAbility } from './__create';

/** What a burn is worth to a Special Attack that feeds on it. */
const FLARE_BOOST_SCALE = 1.5;

/** The one burn, for the ability that reads it that way. */
const BURN_HELD = new Set([Statuses.Burned]);

/** The one type the bronze turns away. */
const HEATPROOF_TYPES = new Set([Types.Fire]);

/** And how much of a burn it feels, fire being fire. */
const HEATPROOF_BURN_SCALE = 0.5;

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
