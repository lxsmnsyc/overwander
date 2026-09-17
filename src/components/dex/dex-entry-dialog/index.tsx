import { For, type JSX, Show, Suspense, createResource } from 'solid-js';
import BattleData from '../../app/battle-data';
import { getCandyCount } from '../../../auth/candy';
import { getPokedex, getSpeciesDexEntry } from '../../../auth/pokedex';
import type { Species } from '../../../data/ids/species';
import { getSpeciesData, getSpeciesForms, isBaseForm } from '../../../data/species';
import { hasFemaleSheet } from '../../../canvas/species-sprites';
import { Badge, CloseButton, Dialog, Divider, Meta, Note, StepButton } from '../../styled';
import TypeBadge from '../../sprites/TypeBadge';
import { dexLabel } from '../PokedexGrid';
import { answered } from '../../app/resource-reads';
import { DexEntryBody, type DexEntryDialogProps, type DexReads } from './body';
import { dexOrder } from './species-facts';

export type { DexEntryDialogProps, DexReads };

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
    async ([player, species]) => (props.reads?.entry ?? getSpeciesDexEntry)(player, species),
  );

  const [candy] = createResource(
    () => (props.species == null ? null : ([props.player, props.species] as const)),
    async ([player, species]) =>
      props.reads == null
        ? getCandyCount(player, getSpeciesData(species).family)
        : props.reads.candy(player, species),
  );

  /**
   * Whether there is a second drawing to show. Asked here and read in
   * the body, so the page waits for the answer with everything else
   * rather than growing a column halfway through being looked at
   */
  // The whole dex, for the stages of the line other than this one
  const [pokedex] = createResource(
    () => (props.species == null ? null : props.player),
    async (player) => (props.reads?.pokedex ?? getPokedex)(player),
  );

  /**
   * Whether the reader has met this species, read without waiting so the
   * top row never holds the panel up
   */
  const tally = (): { met: boolean; seen: number; caught: number } => {
    const entry = answered(dex);

    if (entry == null || entry.species !== props.species) {
      return { met: false, seen: 0, caught: 0 };
    }
    return { met: entry.met, seen: entry.seen.total, caught: entry.caught.total };
  };
  const met = (): boolean => tally().met;

  const [female] = createResource(
    () => props.species ?? null,
    async (species) => hasFemaleSheet(species),
  );

  /**
   * The entry either side of this one. The ends are ends rather than a
   * loop: somebody pressing "next" through the whole of it should stop
   * at the last one instead of finding themselves back at the first
   * wondering what they missed.
   *
   * **Which list is being walked depends on what is showing.** A base
   * form is a dex entry like any other, so it walks the printed dex; an
   * alternate form walks its own set of forms and stops at either end
   */
  const neighbour = (step: number): Species | null => {
    const species = props.species;

    if (species == null) {
      return null;
    }

    const listed = isBaseForm(species) ? dexOrder() : getSpeciesForms(species);
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
      width="broad"
      layout="sheet"
      isOpen={props.species != null}
      onClose={props.onClose}
      // Named apart from the dex it was opened out of, and announced by
      // that name; the species itself heads the top row
      title="Dex Entry"
      quiet
      bar={
        <>
          <StepButton label="Previous pokemon" way="previous" onPress={walk(-1)} />
          <span class="mr-auto flex min-w-0 flex-wrap items-center gap-2 text-left">
            <Show when={props.species}>
              {(species) => (
                <>
                  <h3 class="truncate">
                    {dexLabel(getSpeciesData(species()).dexNumber)}{' '}
                    {met() ? getSpeciesData(species()).name : '???'}
                  </h3>
                  <Meta>{met() ? getSpeciesData(species()).category : '??? Pokemon'}</Meta>
                  <Show when={met()}>
                    <Divider />
                    <For each={getSpeciesData(species()).types}>
                      {(type) => <TypeBadge type={type} />}
                    </For>
                    <Badge tone="tide">{tally().seen} seen</Badge>
                    <Badge tone="leaf">{tally().caught} caught</Badge>
                  </Show>
                </>
              )}
            </Show>
          </span>
          <StepButton label="Next pokemon" way="next" onPress={walk(1)} />
          <CloseButton onPress={props.onClose} />
        </>
      }
      description="One species in full: what it is, where it lives, and everything it can learn."
    >
      <Suspense fallback={<Note>Reading the dex…</Note>}>
        {/* An entry lists what it can learn and what it can hold, so
            it waits for the two registries the walk does not */}
        <BattleData fallback={<Note>Reading the dex…</Note>}>
          <DexEntryBody {...props} dex={dex} candy={candy} female={female} pokedex={pokedex} />
        </BattleData>
      </Suspense>
    </Dialog>
  );
}
