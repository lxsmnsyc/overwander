import { EventPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import { FORM_ITEMS } from '../../data/items/form-items';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
import { getShadowlessSpecies, getTrueShadowShape } from '../../data/species/true-shadow';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { createHeldItem, holds } from './__create';

/**
 * The ability a shape brings on top of what the catch carries. Worn
 * rather than rolled: the base species' pool never holds a form's own
 * ability, so this is the only way it reaches a fight
 */
const SHAPE_ABILITIES = new Map<Species, Abilities>([
  [Species.DialgaOrigin, Abilities.Unaware],
  [Species.PalkiaOrigin, Abilities.ShadowTag],
  [Species.GiratinaOrigin, Abilities.Levitate],
  [Species.ShayminSky, Abilities.SereneGrace],
  [Species.KyogrePrimal, Abilities.PrimordialSea],
  [Species.GroudonPrimal, Abilities.DesolateLand],
  [Species.TornadusTherian, Abilities.Regenerator],
  [Species.ThundurusTherian, Abilities.VoltAbsorb],
  [Species.LandorusTherian, Abilities.Intimidate],
]);

/**
 * The pokemon that only answer their form item through an ability of
 * their own. An Arceus born with a filler keeps its Normal type
 */
const SHAPE_NEEDS = new Map<Species, Abilities>([[Species.Arceus, Abilities.Multitype]]);

/**
 * The form items: a held thing that decides which shape its holder
 * fights in.
 *
 * The shape is rolled as the holder reaches the field rather than
 * chosen, so an item naming several shapes of one pokemon is a gamble
 * every fight rather than a switch a player sets once. An item naming
 * one shape per pokemon is that switch. Which shapes each offers is
 * [`FORM_ITEMS`](../../data/items/form-items.ts)
 */
export default function setupFormItems(battle: Battle): void {
  const setups: ((battle: Battle) => void)[] = [];

  for (const [item, forms] of FORM_ITEMS) {
    setups.push(
      createHeldItem(
        item,
        (inner) =>
          new MergedLifecycle([
            inner.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
              const unit = event.source;
              const base = getBaseFormSpecies(unit.species);
              const needs = SHAPE_NEEDS.get(base);

              if (!holds(unit, item) || (needs != null && !unit.hasAbility(needs))) {
                return;
              }

              // One item may serve several pokemon, so only the
              // holder's own shapes are in the draw
              const own: Species[] = [];

              for (const form of forms) {
                if (getBaseFormSpecies(form) === base) {
                  own.push(form);
                }
              }
              if (own.length === 0) {
                return;
              }

              const shape = own[Math.floor(inner.random() * own.length)];
              // A true shadow takes its own colours of the shape, or none
              const worn =
                getShadowlessSpecies(unit.species) == null ? shape : getTrueShadowShape(shape);

              if (worn == null) {
                return;
              }
              if (unit.species !== worn) {
                unit.setSpecies(worn);
              }

              const bonus = SHAPE_ABILITIES.get(shape);

              if (bonus != null) {
                unit.wearAbility(bonus);
              }
            }),
          ]),
      ),
    );
  }

  for (const setup of setups) {
    setup(battle);
  }
}
