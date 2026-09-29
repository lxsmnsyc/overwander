import { EventPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import { Items } from '../../data/ids/items';
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
  [Species.KyogrePrimal, Abilities.PrimordialSea],
  [Species.GroudonPrimal, Abilities.DesolateLand],
]);

/**
 * The pokemon that only answer their form item through an ability of
 * their own. A Silvally born with a filler keeps its Normal type
 */
const SHAPE_NEEDS = new Map<Species, Abilities>([[Species.Silvally, Abilities.RksSystem]]);

/** The shapes of Necrozma that can let their light out */
const ULTRA_BURST_FROM = new Set<Species>([Species.NecrozmaDuskMane, Species.NecrozmaDawnWings]);

/**
 * Ultra Burst: a fused Necrozma holding its crystal takes the field as
 * Ultra Necrozma. Only a fused shape bursts, so a Necrozma alone keeps
 * its own shape whatever it holds
 */
const ultraBurst = createHeldItem(Items.UltranecroziumZ, (battle) =>
  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;

    if (ULTRA_BURST_FROM.has(unit.species) && holds(unit, Items.UltranecroziumZ)) {
      unit.setSpecies(Species.NecrozmaUltra);
      unit.wearAbility(Abilities.Neuroforce);
    }
  }),
);

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

              const needs = SHAPE_NEEDS.get(base);

              if (
                getBaseFormSpecies(unit.species) !== base ||
                !holds(unit, item) ||
                (needs != null && !unit.hasAbility(needs))
              ) {
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

  setups.push(ultraBurst);

  for (const setup of setups) {
    setup(battle);
  }
}
