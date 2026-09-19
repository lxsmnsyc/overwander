import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * Relic Song turns a Meloetta over: the singer becomes the dancer and
 * the dancer becomes the singer again. Nobody else it is sung by
 * changes shape
 * https://bulbapedia.bulbagarden.net/wiki/Relic_Song_(move)
 */
const STEPS = new Map<Species, Species>([
  [Species.Meloetta, Species.MeloettaPirouette],
  [Species.MeloettaPirouette, Species.Meloetta],
]);

export default function setupRelicSong(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move !== Moves.RelicSong) {
      return;
    }

    const step = STEPS.get(event.source.species);

    if (step != null) {
      event.source.setSpecies(step);
    }
  });
}
