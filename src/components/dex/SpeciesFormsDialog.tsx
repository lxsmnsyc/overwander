import { type JSX, type Resource, Suspense, createResource } from 'solid-js';
import { type PokedexView, getPokedex } from '../../auth/pokedex';
import type { Species } from '../../data/ids/species';
import { getSpeciesData, getSpeciesForms } from '../../data/species';
import { Button, Dialog, DialogActions, Meta, Note } from '../styled';
import { useGame } from '../app/game-context';
import PokedexGrid, { type DexEntry, dexLabel, formLabel } from './PokedexGrid';

/**
 * The forms one pokemon comes in, as the box of squares the dex itself
 * is read from.
 *
 * A form is its own species and its own row in the record, but it is
 * not its own line in the printed dex: twenty-eight unowns would be
 * twenty-eight rows all numbered 201 and all called Unown. So the dex
 * prints one row, pressing it asks **which form**, and the entry is on
 * the other side of that question.
 *
 * It is also where a hunt for the alphabet is read: one grid, and the
 * gaps in it are the letters still out there.
 */

export interface SpeciesFormsDialogProps {
  /** Whose dex is being read: which forms are filled in is theirs. */
  player: string;
  /** The species whose forms are being looked through, or null. */
  species: Species | null;
  onClose: () => void;
  /** Open one form's own entry. */
  onSpecies: (species: Species) => void;
}

/**
 * The squares, which is where the record is read. Its own component
 * because a resource read in the body that declared it throws past
 * every boundary written there
 */
function FormsBox(props: {
  species: Species;
  dex: Resource<PokedexView>;
  onSpecies: (species: Species) => void;
}): JSX.Element {
  const entries = (): DexEntry[] => {
    const view = props.dex();
    const seen = new Set(view?.seen.map((tally) => tally.species) ?? []);
    const caught = new Set(view?.caught.map((tally) => tally.species) ?? []);

    return getSpeciesForms(props.species).map((species): DexEntry => {
      const data = getSpeciesData(species);

      return {
        species,
        dexNumber: data.dexNumber,
        name: data.name,
        seen: seen.has(species),
        caught: caught.has(species),
        label: formLabel(species),
      };
    });
  };

  const found = (): number => entries().filter((entry) => entry.seen || entry.caught).length;

  return (
    <>
      <PokedexGrid
        entries={entries()}
        squares={entries().length}
        label={`Forms, ${entries().length} of them.`}
        onOpen={props.onSpecies}
      />
      <Meta>
        {found()} of {entries().length} found
      </Meta>
    </>
  );
}

export default function SpeciesFormsDialog(props: SpeciesFormsDialogProps): JSX.Element {
  const game = useGame();

  // Re-read whenever anything the player owns changes. This dialog is
  // mounted for the life of the page, so a dex read once at start-up
  // would still be the start-up one the day a letter is finally
  // caught
  const [dex] = createResource(
    () => [props.player, game.records()] as const,
    async ([player]) => getPokedex(player),
  );

  /**
   * The number rather than the name. It is what the row this was
   * opened from showed, and naming a pokemon nobody has met yet would
   * give away the one thing an unmet row deliberately withholds
   */
  const named = (): string => {
    const species = props.species;

    return species == null ? 'Forms' : `${dexLabel(getSpeciesData(species).dexNumber)} Forms`;
  };

  return (
    <Dialog
      isOpen={props.species != null}
      onClose={props.onClose}
      title={named()}
      terse
      description="Every form this pokemon comes in. Open one for its own entry."
    >
      <Suspense fallback={<Note>Reading the dex…</Note>}>
        {props.species == null ? null : (
          <FormsBox species={props.species} dex={dex} onSpecies={props.onSpecies} />
        )}
      </Suspense>

      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
