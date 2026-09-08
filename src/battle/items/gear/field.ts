import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Items } from '../../../data/ids/items';
import { DamageFlags } from '../../../data/ids/moves';
import { Statuses, type Weathers } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { TRAPPING_MOVES } from '../../moves/status';
import { createHeldItem, holds } from '../__create';
import {
  BINDING_BAND_FACTOR,
  GRIP_CLAW_FACTOR,
  LIGHT_CLAY_FACTOR,
  SCREEN_STATUSES,
  WEATHER_ROCK_FACTOR,
} from './worths';

/** Gear that works on the ground rather than on the holder: how long a sky, a screen or a bind lasts */
/**
 * Both of the items that get their holder out of whatever has hold of
 * it: a Smoke Ball by cover, a Shed Shell by leaving behind the part
 * being gripped
 */
export function setupEscapeItem(item: Items): (battle: Battle) => void {
  return createHeldItem(item, (battle) =>
    battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
      if (!event.success && holds(event.source, item)) {
        event.success = true;

        event.source.triggerItem(item);
      }
    }),
  );
}

// A Destiny Knot ties the other end of the infatuation: whoever charmed
// the holder is charmed straight back
export const setupDestinyKnot = createHeldItem(Items.DestinyKnot, (battle) =>
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (
      event.status !== Statuses.Infatuated ||
      event.cause.type === EffectType.None ||
      !holds(event.source, Items.DestinyKnot)
    ) {
      return;
    }

    const charmer = event.cause.unit;

    if (charmer === event.source || charmer.status[Statuses.Infatuated] != null) {
      return;
    }

    event.source.triggerItem(Items.DestinyKnot);
    charmer.addStatus(Statuses.Infatuated, {
      type: EffectType.Item,
      item: Items.DestinyKnot,
      unit: event.source,
    });
  }),
);

/**
 * A weather rock holds whatever its holder called up out for longer. It
 * answers where the weather is asked for rather than where it lands,
 * because the rock belongs to the one calling it up — a Damp Rock in a
 * raid lengthens its own team's rain and nobody else's
 */
export function setupWeatherRock(rock: {
  item: Items;
  weathers: Set<Weathers>;
}): (battle: Battle) => void {
  return createHeldItem(rock.item, (battle) =>
    battle.on(BattleEvents.CheckUnitWeatherDuration, EventPriority.Post, (event) => {
      if (rock.weathers.has(event.weather) && holds(event.source, rock.item)) {
        event.duration *= WEATHER_ROCK_FACTOR;
      }
    }),
  );
}

// A Light Clay holds a screen up for as long as a rock holds the sky.
// It is read off whoever put the screen up, not off the team standing
// behind it
export const setupLightClay = createHeldItem(Items.LightClay, (battle) =>
  battle.on(BattleEvents.CheckTeamStatusDuration, EventPriority.Post, (event) => {
    if (
      SCREEN_STATUSES.has(event.status) &&
      event.cause.type !== EffectType.None &&
      holds(event.cause.unit, Items.LightClay)
    ) {
      event.duration *= LIGHT_CLAY_FACTOR;
    }
  }),
);

// A Grip Claw holds on for longer, and is read off the one doing the
// holding rather than the one being held
export const setupGripClaw = createHeldItem(Items.GripClaw, (battle) =>
  battle.on(BattleEvents.CheckUnitStatusDuration, EventPriority.Post, (event) => {
    if (
      event.status === Statuses.Trapped &&
      event.cause.type !== EffectType.None &&
      holds(event.cause.unit, Items.GripClaw)
    ) {
      event.duration *= GRIP_CLAW_FACTOR;
    }
  }),
);

/**
 * A Binding Band grips harder: the chip a bind takes every second is a
 * third bigger. It is the binder's own indirect damage, so what
 * identifies it is the move that caused it — anything else that unit is
 * doing to the same target stays whatever size it was
 */
export const setupBindingBand = createHeldItem(Items.BindingBand, (battle) =>
  battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
    if (
      event.flags & DamageFlags.Indirect &&
      event.cause.type === EffectType.Move &&
      TRAPPING_MOVES.has(event.cause.move) &&
      event.target.status[Statuses.Trapped] != null &&
      holds(event.cause.unit, Items.BindingBand)
    ) {
      event.value *= BINDING_BAND_FACTOR;
    }
  }),
);
