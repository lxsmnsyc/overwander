import type { JSX } from 'solid-js';
import { STAT_LABELS } from '../catches/catch-dialog/describe';
import type { Items } from '../../data/ids/items';
import SpeciesCoat from '../sprites/SpeciesCoat';
import type { ToastRequest } from '../styled';
import { describeItem } from '../details';
import type { Spent } from './use-item';

/**
 * What using an item says, as a toast.
 *
 * Most items report a sentence and nothing else. The ones that move a
 * stat's effort report the pokemon it happened to and the two numbers,
 * because that is the whole of what a vitamin does and a sentence
 * about "points it did not have to earn" left the player to go and
 * look in the stats pane to find out whether anything had changed.
 */
export default function spentToast(item: Items, spent: Spent): ToastRequest {
  const { about, trained } = spent;

  if (about == null || trained == null) {
    return { message: spent.said, tone: spent.tone };
  }
  const art = (): JSX.Element => (
    <SpeciesCoat
      species={about.species}
      met
      revealed
      shiny={about.shiny}
      female={about.female}
      fill
    />
  );

  return {
    art,
    title: `${about.name} used ${describeItem(item)}`,
    // The arrow says which way it went, so a berry taking points off
    // reads as plainly as a vitamin putting them on
    message: `${STAT_LABELS[trained.stat]} ${trained.from} → ${trained.to}`,
    tone: spent.tone,
  };
}
