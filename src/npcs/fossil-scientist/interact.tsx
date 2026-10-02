import type { InventoryEntry } from '../../auth/inventory';
import { reviveFossil } from '../../auth/npcs';
import type { Items } from '../../data/ids/items';
import { isFossil } from '../../data/items';
import { FOSSIL_SPECIES } from '../../data/items/fossils';
import { FOSSIL_BENCH_LIMIT, FOSSIL_REVIVE_LEVEL } from '../../data/overworld/fossil';
import { getSpeciesData } from '../../data/species';
import playEffect, { Effect } from '../../components/app/sound';
import { describeItem } from '../../components/details';
import { PickItemForm } from '../../components/forms/pick-item';
import AnimatedSprite from '../../components/sprites/AnimatedSprite';
import { Detail } from '../../components/styled';
import type { NpcScript } from '../create';

/** What is inside a rock, which is the whole of what a player is choosing */
function inside(item: Items): string {
  const species = FOSSIL_SPECIES.get(item);

  return species == null ? '' : getSpeciesData(species).name;
}

/**
 * The fossil scientist: put the rocks on the bench and see what was in
 * them. A player carrying four of one rock wants them all opened, so
 * the bench takes a count, and keeps taking rocks until the player
 * steps away
 */
const scientist: NpcScript = async (visit) => {
  for (;;) {
    const fossils: InventoryEntry[] = [];

    for (const entry of await visit.bag()) {
      if (isFossil(entry.item) && entry.amount > 0) {
        fossils.push(entry);
      }
    }

    const pick = await visit.form(PickItemForm, {
      player: visit.player,
      verb: 'Revive',
      entries: fossils,
      none: 'You are carrying nothing he can open.',
      // What comes out is the rock's business, but a party planned around it wants the level
      intro: `Whatever is in there comes out at level ${FOSSIL_REVIVE_LEVEL}.`,
      step: 'Choose a fossil',
      counts: true,
      card: (entry) => <Detail label="Inside">{inside(entry.item)}</Detail>,
      most: (entry) => Math.min(FOSSIL_BENCH_LIMIT, entry.amount),
    });

    if (pick == null) {
      return;
    }

    const [item, amount] = pick;
    const revived = await reviveFossil(visit.snapshot, visit.cell, item, amount);

    if (revived == null || revived.length === 0) {
      await visit.say('Nothing came of it. Those rocks are not in your bag any more.');
      continue;
    }
    // One sound for the handover, however many rocks were on the bench
    playEffect(Effect.FossilRevive);
    for (const one of revived) {
      visit.notify({
        title: getSpeciesData(one.species).name,
        message: `Level ${one.level}, out of ${describeItem(item)}.${one.shiny ? ' It sparkles.' : ''}`,
        art: () => (
          <span class="flex size-8 items-center justify-center">
            <AnimatedSprite
              species={one.species}
              shiny={one.shiny}
              direction="DownLeft"
              fill
              still
              label=""
            />
          </span>
        ),
        tone: 'leaf',
      });
    }
    visit.changed();
    await visit.say('Marvelous! Alive and well after all that time.');
  }
};

export default scientist;
