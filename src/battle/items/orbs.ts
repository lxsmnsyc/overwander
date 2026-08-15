import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { Items } from '../../data/ids/items';
import { DamageFlags, MoveCategories } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { BattleEvents, EffectType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { hasAttackEffect } from '../moves/status';
import type Unit from '../unit';
import type Battle from '../core';
import { createHeldItem, holds } from './__create';

/**
 * The orbs: held for what they do to their own holder.
 */

/**
 * What a Life Orb adds to a blow, and what it takes back out of the
 * one throwing it
 */
export const LIFE_ORB_FACTOR = 1.3;
export const LIFE_ORB_RECOIL = 0.1;

/**
 * How long a Flame or Toxic Orb takes to work on whoever is carrying
 * it. The mainline waits for the end of the turn; here it is a few
 * seconds of holding something that was never safe to hold
 */
export const ORB_DELAY = 5000;

/**
 * What each affliction orb inflicts on its holder
 */
const AFFLICTIONS = new Map<Items, Statuses>([
  [Items.FlameOrb, Statuses.Burned],
  [Items.ToxicOrb, Statuses.BadlyPoisoned],
]);

// A Life Orb lifts every damaging move its holder throws, and takes a
// tenth of it back for each one that lands
const setupLifeOrb = createHeldItem(
  Items.LifeOrb,
  (battle) =>
    new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (event.power != null && holds(event.source, Items.LifeOrb)) {
          event.power *= LIFE_ORB_FACTOR;
        }
      }),

      // Indirect damage the holder does to itself, so nothing about the
      // blow — drain, recoil, a foe's own reactions — reads it as a hit
      battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
        if (
          !event.success ||
          event.category === MoveCategories.Status ||
          !holds(event.source, Items.LifeOrb) ||
          !event.source.alive
        ) {
          return;
        }

        // Sheer Force already pays for its power with the move's
        // effect, so the orb does not charge again — but only on the
        // moves it actually took something from
        if (event.source.hasAbility(Abilities.SheerForce) && hasAttackEffect(event.move)) {
          return;
        }

        const recoil = Math.max(
          1,
          Math.floor(event.source.checkStat(Stats.HP, 0) * LIFE_ORB_RECOIL),
        );

        event.source.damage(
          { type: EffectType.Item, item: Items.LifeOrb, unit: event.source },
          event.source,
          recoil,
          DamageFlags.Indirect,
        );
      }),
    ]),
);

/**
 * An affliction orb works on whoever carries it for a few seconds and
 * then does what it was always going to do, once
 */
function setupAfflictionOrb(item: Items, status: Statuses): (battle: Battle) => void {
  return createHeldItem(item, (battle) => {
    // How long each holder has been carrying it. It empties once the
    // orb has done its work, so an orb afflicts once rather than every
    // few seconds
    const carried = new Map<Unit, number>();

    return battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const unit of battle.units()) {
        if (!holds(unit, item) || !unit.alive) {
          carried.delete(unit);
          continue;
        }

        const held = (carried.get(unit) ?? 0) + event.duration;

        carried.set(unit, held);

        if (held >= ORB_DELAY && unit.status[status] == null) {
          unit.addStatus(status, { type: EffectType.Item, item, unit });
          carried.delete(unit);
        }
      }
    });
  });
}

const SETUPS: ((battle: Battle) => void)[] = [
  setupLifeOrb,
  ...[...AFFLICTIONS].map(([item, status]) => setupAfflictionOrb(item, status)),
];

export default function setupOrbs(battle: Battle): void {
  for (const setup of SETUPS) {
    setup(battle);
  }
}
