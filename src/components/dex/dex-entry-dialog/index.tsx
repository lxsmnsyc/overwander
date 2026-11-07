import { For, type JSX, Show, Suspense, createResource } from 'solid-js';
import BattleData from '../../app/BattleData';
import { getCandyCount } from '../../../auth/candy';
import { getPokedex, getSpeciesDexEntry } from '../../../auth/pokedex';
import type { Species } from '../../../data/ids/species';
import { getSpeciesData, getSpeciesForms, isBaseForm } from '../../../data/species';
import { hasFemaleSheet } from '../../../canvas/sprites/species-sprites';
import { Badge, Button, CloseButton, Dialog, Note, tint } from '../../styled';
import { ArrowLeftIcon, ArrowRightIcon } from '../../icons';
import { TYPE_COLORS, TYPE_NAMES } from '../../../data/constants/types';
import TypeBadge from '../../sprites/TypeBadge';
import { dexLabel } from '../PokedexGrid';
import { answered } from '../../app/resource-reads';
import { DexEntryBody, type DexEntryDialogProps, type DexReads } from './body';
import { dexOrder } from './species-facts';
import { m } from '../../../i18n/paraglide/messages.js';

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

/** A square step to the entry either side, flat where there is none */
function Step(props: {
  label: string;
  onPress: (() => void) | undefined;
  children: JSX.Element;
}): JSX.Element {
  return (
    <Button
      class="size-10 shrink-0 justify-center px-0"
      label={props.label}
      disabled={props.onPress == null}
      onClick={() => {
        props.onPress?.();
      }}
    >
      {props.children}
    </Button>
  );
}

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

  /** The header's wash, in the first type's colour once met */
  const wash = (): string => {
    const species = props.species;

    return species == null || !met()
      ? 'var(--color-line-soft)'
      : tint(TYPE_COLORS[getSpeciesData(species).types[0]], 14);
  };

  return (
    <Dialog
      width="sheet"
      layout="sheet"
      isOpen={props.species != null}
      onClose={props.onClose}
      // Named apart from the dex it was opened out of, and announced by
      // that name; the species itself heads the hero
      title={m.dex_entry_title()}
      quiet
      description={m.dex_entry_description()}
    >
      {/* The hero, as the catch sheet's: the steps either side of the
          name, what it is, and the way out */}
      <div
        class="-mx-4 -mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b-2 border-line-soft
          px-4 py-3 sm:-mx-5 sm:-mt-5 md:px-4.5"
        style={{ background: `linear-gradient(180deg, ${wash()}, var(--color-paper))` }}
      >
        <Step label={m.dex_previous()} onPress={walk(-1)}>
          <ArrowLeftIcon class="size-4" aria-hidden="true" />
        </Step>
        <Show when={props.species}>
          {(species) => (
            <span class="flex min-w-0 grow flex-wrap items-center gap-x-2.5 gap-y-1 md:grow-0">
              <span class="font-display text-base font-semibold text-muted tabular-nums">
                {dexLabel(getSpeciesData(species()).dexNumber)}
              </span>
              <h3 class="m-0 min-w-0 truncate font-display text-2xl leading-tight font-bold md:text-[32px]">
                {met() ? getSpeciesData(species()).name : '???'}
              </h3>
              <span class="text-sm text-muted">
                {met() ? getSpeciesData(species()).category : m.dex_unknown_category()}
              </span>
              <Show when={met()}>
                <span aria-hidden="true" class="hidden h-6 w-0.5 bg-line md:block" />
                <For each={getSpeciesData(species()).types}>
                  {(type) => (
                    <span
                      class="inline-flex h-6 items-center gap-1 rounded-full pr-2.5 pl-1 text-[11px]
                        font-extrabold text-ink"
                      style={{ background: tint(TYPE_COLORS[type], 22) }}
                    >
                      <TypeBadge type={type} size={16} />
                      {TYPE_NAMES[type]}
                    </span>
                  )}
                </For>
                <Badge tone="tide" class="text-xs">
                  {m.dex_seen({ count: tally().seen })}
                </Badge>
                <Badge tone="leaf" class="text-xs">
                  {m.dex_caught({ count: tally().caught })}
                </Badge>
              </Show>
            </span>
          )}
        </Show>
        <span class="ml-auto flex shrink-0 items-center gap-2">
          <Step label={m.dex_next()} onPress={walk(1)}>
            <ArrowRightIcon class="size-4" aria-hidden="true" />
          </Step>
          <CloseButton onPress={props.onClose} />
        </span>
      </div>

      <Suspense fallback={<Note>{m.dex_loading()}</Note>}>
        {/* An entry lists what it can learn and what it can hold, so
            it waits for the two registries the walk does not */}
        <BattleData fallback={<Note>{m.dex_loading()}</Note>}>
          <DexEntryBody {...props} dex={dex} candy={candy} female={female} pokedex={pokedex} />
        </BattleData>
      </Suspense>
    </Dialog>
  );
}
