import { EventPriority } from '../../core/event-emitter';
import type { Species } from '../../data/ids/species';
import { ZENITH_SHARDS } from '../../data/items/zenith-shards';
import { getZenithForm, getZenithOwner, isZenithSpecies } from '../../data/species/zeniths';
import type Battle from '../battle';
import { BattleEvents } from '../events';
import type Team from '../team';
import type Unit from '../unit';
import { pickShapeHolder } from './mega';

/**
 * The Zenith this unit could reach here, or null where it has none.
 * The shard has to name the unit's pokemon, and a pokemon kept in
 * another shape (an Attack Deoxys) reaches the Zenith of that shape
 */
export function zenithOf(unit: Unit): Species | null {
  for (const [item, shape] of ZENITH_SHARDS) {
    // Held rather than enabled, the way a Mega Stone is
    if (unit.items[item] != null) {
      const zenith = getZenithForm(shape.zenith, unit.species);

      if (zenith != null) {
        return zenith;
      }
    }
  }
  return null;
}

/** Whether the unit is a Zenith, or holds what would make it one */
export function isZenithHolder(unit: Unit): boolean {
  return zenithOf(unit) != null || isZenithSpecies(unit.species);
}

/** The one unit on a team that reaches its Zenith */
export function pickZenith(team: Team): Unit | null {
  return pickShapeHolder(team, zenithOf);
}

/**
 * Zeniths. A team reaches one, on top of and apart from its Mega, and
 * it goes to the holder the pick names as that holder takes the
 * field. The shape's ability is worn on top of the catch's own
 */
export default function setupZeniths(battle: Battle): void {
  const spent = new Set<Team>();

  // A Zenith that changes shape changes into its Zenith of that shape,
  // so a stance or a weather does not take the Zenith off it
  battle.on(BattleEvents.UnitSetSpecies, EventPriority.Pre, (event) => {
    const into = getZenithForm(event.source.species, event.species);

    if (into != null) {
      event.species = into;
    }
  });

  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;
    const zenith = zenithOf(unit);

    if (zenith == null || spent.has(unit.team) || pickZenith(unit.team) !== unit) {
      return;
    }
    const shape = getZenithOwner(zenith);

    spent.add(unit.team);
    unit.setSpecies(zenith);
    if (shape != null) {
      unit.wearAbility(shape.ability);
    }
  });
}
