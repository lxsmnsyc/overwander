import { AttackPriority, EventPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { hasFreeItemSlot, stealableItem } from '../utils';
import { createAbility } from './__create';

/**
 * What a shell thick enough to stop a shot turns away: everything
 * thrown rather than swung, which the mainline calls ballistic
 * https://bulbapedia.bulbagarden.net/wiki/Bulletproof_(Ability)
 */
const BALLISTIC_MOVES = new Set<Moves>([
  Moves.AcidSpray,
  Moves.AuraSphere,
  Moves.Barrage,
  Moves.BulletSeed,
  Moves.EggBomb,
  Moves.ElectroBall,
  Moves.EnergyBall,
  Moves.FocusBlast,
  Moves.GyroBall,
  Moves.IceBall,
  Moves.MagnetBomb,
  Moves.MistBall,
  Moves.MudBomb,
  Moves.Octazooka,
  Moves.RockBlast,
  Moves.RockWrecker,
  Moves.SearingShot,
  Moves.SeedBomb,
  Moves.ShadowBall,
  Moves.SludgeBomb,
  Moves.WeatherBall,
  Moves.ZapCannon,
]);

/** Kalos's abilities, which are the same list its starters need */
const setupAbilities = [
  // Chespin: the burr that shrugs off anything thrown at it
  createAbility(Abilities.Bulletproof, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
      if (
        !event.immune &&
        BALLISTIC_MOVES.has(event.move) &&
        event.target.type === MoveTargetType.Unit &&
        event.target.unit.hasAbility(Abilities.Bulletproof)
      ) {
        event.immune = true;
        event.target.unit.triggerAbility(Abilities.Bulletproof);
      }
    }),
  ),

  // Fennekin: Pickpocket the other way round, and without the touch.
  // The trick is worked on whatever it lands a move on, so long as its
  // own hands are empty
  createAbility(Abilities.Magician, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      if (
        !event.success ||
        (event.flags & DamageFlags.Indirect) !== 0 ||
        event.cause.type !== EffectType.Move ||
        event.cause.unit === event.target ||
        !event.cause.unit.hasAbility(Abilities.Magician)
      ) {
        return;
      }

      const thief = event.cause.unit;
      const item = stealableItem(event.target);

      if (item == null || !hasFreeItemSlot(thief)) {
        return;
      }

      thief.triggerAbility(Abilities.Magician);
      event.target.removeItem(item, {
        type: EffectType.Ability,
        ability: Abilities.Magician,
        unit: thief,
      });
      thief.addItem(item);
    }),
  ),
];

export default function setupGen6Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
