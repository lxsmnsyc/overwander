import { EventPriority } from '../../core/event-emitter';
import { STAT_ORDER } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
import { MEGA_STONES } from '../../data/items/mega-stones';
import { getSpeciesData } from '../../data/species/__create';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Team from '../team';
import type Unit from '../unit';

/**
 * The Mega this unit could take here, or null where it has none. A
 * stone has to name the shape the unit is in now; Rayquaza needs no
 * stone, only Dragon Ascent
 */
export function megaOf(unit: Unit): Species | null {
  if (unit.species === Species.Rayquaza && unit.moves[Moves.DragonAscent] != null) {
    return Species.RayquazaMega;
  }
  for (const [item, stone] of MEGA_STONES) {
    // Held rather than enabled: nothing that stops an item working
    // stops a stone, the way the mainline has it
    if (unit.items[item] != null && getBaseFormSpecies(stone.mega) === unit.species) {
      return stone.mega;
    }
  }
  return null;
}

function megaTotal(mega: Species): number {
  let total = 0;

  for (const stat of STAT_ORDER) {
    total += getSpeciesData(mega).stats[stat];
  }
  return total;
}

/**
 * The one unit on a team that Mega Evolves: the highest level, then
 * the biggest Mega, then whoever stands earlier in the party
 */
export function pickMega(team: Team): Unit | null {
  let best: Unit | null = null;
  let bestTotal = 0;

  for (const unit of team.units) {
    const mega = megaOf(unit);

    if (mega == null || !unit.alive) {
      continue;
    }
    const total = megaTotal(mega);

    if (
      best == null ||
      unit.level > best.level ||
      (unit.level === best.level && total > bestTotal)
    ) {
      best = unit;
      bestTotal = total;
    }
  }
  return best;
}

/**
 * Mega Evolution. A team has one, and it goes to the holder the pick
 * names as that holder takes the field. The shape's own ability is
 * worn on top of the catch's, the way an Origin forme's is
 */
export default function setupMegas(battle: Battle): void {
  const spent = new Set<Team>();

  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;
    const mega = megaOf(unit);

    if (mega == null || spent.has(unit.team) || pickMega(unit.team) !== unit) {
      return;
    }
    spent.add(unit.team);
    unit.setSpecies(mega);
    unit.wearAbility(getSpeciesData(mega).abilities[0]);
  });
}
