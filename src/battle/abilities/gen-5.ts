import { EventPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import { getSpeciesData } from '../../data/species';
import { getFoldedDragon } from '../../data/species/fusion';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { createMoldBreakerAbility } from './__create';
import { FOLDED_CREEDS, HUSK_CREED } from './signature/tao-trio';

/**
 * What Unova brought. The two dragons carry Mold Breaker under their
 * own names, so both go through its factory
 */
const setupAbilities = [
  createMoldBreakerAbility(Abilities.Turboblaze),
  createMoldBreakerAbility(Abilities.Teravolt),
];

/**
 * The dragon inside a fusion is still fighting, so the shape wears
 * what that dragon fights with. A fusion is a kept shape rather than
 * a rolled one, so nothing hands the catch these: they belong to the
 * shape and lift the moment it comes apart
 */
function setupFoldedDragons(battle: Battle): void {
  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;
    const dragon = getFoldedDragon(unit.species);

    if (dragon == null) {
      return;
    }

    for (const ability of getSpeciesData(dragon).abilities) {
      unit.wearAbility(ability);
    }

    const creed = FOLDED_CREEDS.get(unit.species);

    // The dragon's conviction comes with it, for a holder that was
    // granted the husk's own: a signature is granted rather than
    // rolled, so a fusion passes on what the dragon brought rather
    // than handing out a second gift
    if (creed != null && unit.hasAbility(HUSK_CREED)) {
      unit.wearAbility(creed);
    }
  });
}

export default function setupGen5Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
  setupFoldedDragons(battle);
}
