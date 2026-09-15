import { EventPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import { FORM_ITEMS } from '../../data/items/form-items';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
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
]);

/**
 * The form items: a held thing that decides which shape its holder
 * fights in.
 *
 * The shape is rolled as the holder reaches the field rather than
 * chosen, so an item naming several shapes is a gamble every fight
 * rather than a switch a player sets once. An item naming one shape
 * is that switch. Which shapes each offers is
 * [`FORM_ITEMS`](../../data/items/form-items.ts)
 */
export default function setupFormItems(battle: Battle): void {
  const setups: ((battle: Battle) => void)[] = [];

  for (const [item, forms] of FORM_ITEMS) {
    // Every shape in the set belongs to one pokemon, so the base form
    // of the first is what the holder has to be
    const base = getBaseFormSpecies(forms[0]);

    setups.push(
      createHeldItem(
        item,
        (inner) =>
          new MergedLifecycle([
            inner.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
              const unit = event.source;

              if (getBaseFormSpecies(unit.species) !== base || !holds(unit, item)) {
                return;
              }

              const shape = forms[Math.floor(inner.random() * forms.length)];

              if (unit.species !== shape) {
                unit.setSpecies(shape);
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
