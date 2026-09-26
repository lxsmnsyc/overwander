import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * A Keldeo that knows Secret Sword fights in its Resolute form, the
 * way the mainline shows it. The shape changes nothing but the look
 */
export default function setupSecretSword(battle: Battle): void {
  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;

    if (unit.species === Species.Keldeo && unit.moves[Moves.SecretSword] != null) {
      unit.setSpecies(Species.KeldeoResolute);
    }
  });
}
