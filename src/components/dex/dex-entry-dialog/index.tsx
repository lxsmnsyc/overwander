import { type JSX, Suspense, createResource } from 'solid-js';
import { getCandyCount } from '../../../auth/candy';
import { getSpeciesDexEntry } from '../../../auth/pokedex';
import type { Species } from '../../../data/ids/species';
import { getSpeciesData } from '../../../data/species';
import { hasFemaleSheet } from '../../../canvas/species-sprites';
import { Button, Dialog, DialogActions, Note, StepButton } from '../../styled';
import { DexEntryBody, type DexEntryDialogProps } from './body';
import { dexOrder } from './species-facts';

export type { DexEntryDialogProps };

/**
 * One species in full: what it is, where it lives and what it can do.
 *
 * It is the catch sheet's opposite number. A catch sheet is about one
 * individual — its values, its nature, what it is carrying, what can
 * be done to it — and every line of it is a fact about that pokemon.
 * This is about the **species**, so nothing on it can be pressed and
 * nothing on it changes: two players reading the same entry read the
 * same thing.
 *
 * What the reader has earned decides only how much of the picture they
 * get. A species met but never kept is a silhouette, and a coat never
 * owned is a silhouette beside it — while the numbers underneath are
 * the dex's, and the dex knows what it knows whether or not the player
 * has ever held one.
 */

/**
 * One species in full, opened out of the dex and over it.
 *
 * What the reader has met and what candy they hold are read one
 * component down, under the boundary this puts inside the panel: a
 * dex still arriving replaces the entry rather than the page
 */
export default function DexEntryDialog(props: DexEntryDialogProps): JSX.Element {
  // What the reader has met. It decides which sprites are drawn in
  // full and nothing else on the page
  const [dex] = createResource(
    () => (props.species == null ? null : ([props.player, props.species] as const)),
    async ([player, species]) => getSpeciesDexEntry(player, species),
  );

  const [candy] = createResource(
    () => (props.species == null ? null : ([props.player, props.species] as const)),
    async ([player, species]) => getCandyCount(player, getSpeciesData(species).family),
  );

  /**
   * Whether there is a second drawing to show. Asked here and read in
   * the body, so the page waits for the answer with everything else
   * rather than growing a column halfway through being looked at
   */
  const [female] = createResource(
    () => props.species ?? null,
    async (species) => hasFemaleSheet(species),
  );

  /**
   * The entry either side of this one. The ends of the dex are ends
   * rather than a loop: somebody pressing "next" through the whole of
   * it should stop at the last one instead of finding themselves back
   * at the first wondering what they missed
   */
  const neighbour = (step: number): Species | null => {
    const species = props.species;

    if (species == null) {
      return null;
    }

    const listed = dexOrder();
    const at = listed.indexOf(species);
    const wanted = at + step;

    return at < 0 || wanted < 0 || wanted >= listed.length ? null : listed[wanted];
  };

  const walk = (step: number): (() => void) | undefined => {
    const next = neighbour(step);

    if (next == null) {
      return undefined;
    }
    return () => {
      props.onSpecies(next);
    };
  };

  return (
    <Dialog
      width="wide"
      isOpen={props.species != null}
      onClose={props.onClose}
      // Named apart from the dex it was opened out of: two dialogs
      // both called "Pokedex" are two panels a player cannot tell
      // apart when one is standing on the other
      title="Dex Entry"
      // The dex either side of this entry. In the top bar rather than
      // beside the sprite: they walk the dex rather than the pokemon,
      // and they stay put however far down the entry is scrolled
      lead={<StepButton label="Previous pokemon" way="previous" onPress={walk(-1)} />}
      aside={<StepButton label="Next pokemon" way="next" onPress={walk(1)} />}
      terse
      description="One species in full: what it is, where it lives, and everything it can learn."
    >
      <Suspense fallback={<Note>Reading the dex…</Note>}>
        <DexEntryBody {...props} dex={dex} candy={candy} female={female} />
      </Suspense>

      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
