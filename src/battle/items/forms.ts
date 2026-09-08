import { EventPriority } from '../../core/event-emitter';
import { FORM_ITEMS } from '../../data/items/form-items';
import { getBaseFormSpecies } from '../../data/ids/species';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { createHeldItem, holds } from './__create';

/**
 * The form items: a held rock that decides which shape its holder
 * fights in.
 *
 * The shape is rolled as the holder reaches the field rather than
 * chosen, so a Meteorite is a gamble every fight rather than a switch
 * a player sets once. Which shapes an item offers is
 * [`FORM_ITEMS`](../../data/items/form-items.ts)
 */
export default function setupFormItems(battle: Battle): void {
  const setups = [...FORM_ITEMS].map(([item, forms]) => {
    // Every shape in the set belongs to one pokemon, so the base form
    // of the first is what the holder has to be
    const base = getBaseFormSpecies(forms[0]);

    return createHeldItem(
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
          }),
        ]),
    );
  });

  for (const setup of setups) {
    setup(battle);
  }
}
