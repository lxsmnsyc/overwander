import type { InventoryEntry } from '../../../auth/inventory';
import { reviveFossil } from '../../../auth/npcs';
import type { Items } from '../../../data/ids/items';
import { isFossil } from '../../../data/items';
import {
  FOSSIL_SPECIES,
  getFossilPairSpecies,
  getFossilPartners,
  isFossilHalf,
  isFossilTop,
} from '../../../data/items/fossils';
import { FOSSIL_BENCH_LIMIT, FOSSIL_REVIVE_LEVEL } from '../../../data/overworld/fossil';
import { getSpeciesData } from '../../../data/species';
import playEffect, { Effect } from '../../../components/app/sound';
import { describeItem } from '../../../components/details';
import { PickItemForm } from '../../../components/forms/pick-item';
import AnimatedSprite from '../../../components/sprites/AnimatedSprite';
import { Detail } from '../../../components/styled';
import type { NpcScript } from '../create';

/** What is inside a rock, which is the whole of what a player is choosing */
function inside(item: Items): string {
  const species = FOSSIL_SPECIES.get(item);

  return species == null ? '' : getSpeciesData(species).name;
}

/** What a half and the one it is put beside make together */
function insidePair(item: Items, pair: Items): string {
  const species = getFossilPairSpecies(item, pair);

  return species == null ? '' : getSpeciesData(species).name;
}

/** The most of any one other half the player could put beside this one */
function mostPartners(half: Items, fossils: InventoryEntry[]): number {
  const partners = new Set(getFossilPartners(half));
  let most = 0;

  for (const entry of fossils) {
    if (partners.has(entry.item)) {
      most = Math.max(most, entry.amount);
    }
  }
  return most;
}

/**
 * The fossil scientist: put the rocks on the bench and see what was in
 * them. A player carrying four of one rock wants them all opened, so
 * the bench takes a count, and keeps taking rocks until the player
 * steps away. A Galar half is picked first with its count, then the
 * other half it is put beside
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
      blocked: (entry) => {
        if (!isFossilHalf(entry.item) || mostPartners(entry.item, fossils) > 0) {
          return null;
        }
        return isFossilTop(entry.item) ? 'Needs a bottom half' : 'Needs a top half';
      },
      card: (entry) =>
        isFossilHalf(entry.item) ? (
          <Detail label="Half">{isFossilTop(entry.item) ? 'The top' : 'The bottom'}</Detail>
        ) : (
          <Detail label="Inside">{inside(entry.item)}</Detail>
        ),
      // A half's count is how many pairs, so it is capped by its partners too
      most: (entry) =>
        isFossilHalf(entry.item)
          ? Math.min(FOSSIL_BENCH_LIMIT, entry.amount, mostPartners(entry.item, fossils))
          : Math.min(FOSSIL_BENCH_LIMIT, entry.amount),
    });

    if (pick == null) {
      return;
    }

    const [item, amount] = pick;
    let pair: Items | null = null;

    if (isFossilHalf(item)) {
      const partners = new Set(getFossilPartners(item));
      const others: InventoryEntry[] = [];

      for (const entry of fossils) {
        if (partners.has(entry.item)) {
          others.push(entry);
        }
      }

      const other = await visit.form(PickItemForm, {
        player: visit.player,
        verb: 'Pair with',
        entries: others,
        none: 'You are carrying nothing that fits it.',
        intro: `${describeItem(item)} needs its other half.`,
        step: isFossilTop(item) ? 'Choose a bottom half' : 'Choose a top half',
        counts: true,
        blocked: (entry) => (entry.amount < amount ? `Fewer than ${amount}` : null),
        card: (entry) => <Detail label="Inside">{insidePair(item, entry.item)}</Detail>,
      });

      // Walking away from the second half goes back to the bench
      if (other == null) {
        continue;
      }
      pair = other[0];
    }

    const revived = await reviveFossil(visit.snapshot, visit.cell, item, pair, amount);

    if (revived == null || revived.length === 0) {
      await visit.say('Nothing came of it. Those rocks are not in your bag any more.');
      continue;
    }

    const from =
      pair == null ? describeItem(item) : `${describeItem(item)} and ${describeItem(pair)}`;

    // One sound for the handover, however many rocks were on the bench
    playEffect(Effect.FossilRevive);
    for (const one of revived) {
      visit.notify({
        title: getSpeciesData(one.species).name,
        message: `Level ${one.level}, out of ${from}.${one.shiny ? ' It sparkles.' : ''}`,
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
