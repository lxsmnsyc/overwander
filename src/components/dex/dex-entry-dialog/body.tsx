import { ROTATION, STAT_BARS, STAT_CEILING, describeLair, groupHabitats, listLevelMoves } from './species-facts';
import { EGG_HATCH_STEPS } from '../../../auth/egg';
import type { SpeciesDexEntry } from '../../../auth/pokedex';
import { BIOME_NAMES } from '../../../data/biome';
import { STAT_ORDER } from '../../../data/constants/stats';
import type { Moves } from '../../../data/ids/moves';
import type { Species } from '../../../data/ids/species';
import { SpriteAnim } from '../../../data/ids/sprite-anims';
import { getItemData, getSpeciesFossil } from '../../../data/items';
import { getMoveData } from '../../../data/moves';
import { type SpeciesData, getFamilyName, getSpeciesData } from '../../../data/species';
import { STAT_LABELS } from '../../catches/catch-dialog/describe';
import { describeAbility, detailAbility } from '../../details';
import MoveCategorySprite from '../../sprites/MoveCategorySprite';
import SpeciesCoat from '../../sprites/SpeciesCoat';
import TypeBadge from '../../sprites/TypeBadge';
import { Badge, DialogSection, List, ListRow, Meta, Note, Row, TabBar, TabButton, TabGroup, TabPane, TooltipHost } from '../../styled';
import { dexLabel } from '../PokedexGrid';
import { For, type JSX, type Resource, Show } from 'solid-js';

/**
 * Which list of moves is being read
 */
const enum MoveTab {
  Level = 0,
  Machines = 1,
  Egg = 2,
}

export interface DexEntryDialogProps {
  /**
   * Whose dex is being read. What has been met and what candy is held
   * are the two things on this page that belong to the reader rather
   * than to the species
   */
  player: string;
  /**
   * The species, or null when the entry is shut
   */
  species: Species | null;
  onClose: () => void;
  /**
   * Open a different entry — the one before this one in the dex, or
   * the one after it
   */
  onSpecies: (species: Species) => void;
}


/**
 * The entry itself, which is where the dex and the candy are read.
 *
 * Either read in the body that declared it would throw past every
 * `Suspense` written there and land on the boundary around the page,
 * taking the dialog with it — so the reading half stands on its own
 */
export function DexEntryBody(
  props: DexEntryDialogProps & {
    dex: Resource<SpeciesDexEntry | null>;
    candy: Resource<number>;
    /** Whether this species was drawn a second time for its females. */
    female: Resource<boolean>;
  },
): JSX.Element {
  /**
   * The species and its data together, so everything below can be
   * written against one non-null thing rather than checking twice
   */
  const showing = (): { species: Species; data: SpeciesData } | null => {
    const species = props.species;

    return species == null ? null : { species, data: getSpeciesData(species) };
  };

  const known = (): {
    met: boolean;
    owned: boolean;
    shiny: boolean;
    seen: number;
    caught: number;
  } => {
    const entry = props.dex();

    if (entry == null || entry.species !== props.species) {
      return { met: false, owned: false, shiny: false, seen: 0, caught: 0 };
    }
    return {
      met: entry.met,
      owned: entry.owned,
      shiny: entry.shiny,
      // How many, rather than whether: a dex is kept as much for the
      // hundredth Pidgey as for the first
      seen: entry.seen.total,
      caught: entry.caught.total,
    };
  };

  /**
   * One coat of the pokemon. A coat the reader has not earned is drawn
   * as a shadow rather than left out: the shape is the half of a dex
   * entry that sends somebody out looking
   */
  const coat = (species: Species, shiny: boolean, female = false): JSX.Element => {
    const met = known().met;
    const revealed = shiny ? known().shiny : known().owned;
    const name = getSpeciesData(species).name;
    const sex = female ? '♀' : '♂';
    // Only worth marking which sex it is where the two were drawn
    // differently; everywhere else it is one picture and the mark
    // would be answering a question nobody asked
    const marked = props.female() === true;
    const named = female ? 'female' : 'male';
    const called = [name, shiny ? 'shiny' : null, marked ? named : null]
      .filter((part) => part != null)
      .join(', ');

    return (
      <div class="flex flex-col items-center gap-1">
        <SpeciesCoat
          species={species}
          met={met}
          revealed={revealed}
          shiny={shiny}
          female={female}
          // Turning on the spot, the way a dex shows off what it has
          // on file — a pokemon walking on a page it cannot walk off
          // is a pokemon going nowhere
          animation={SpriteAnim.Rotate}
          duration={ROTATION}
          direction="DownLeft"
          scale={3}
          called={called}
        />
        <Meta>
          {shiny ? 'Shiny' : 'Regular'}
          {marked ? ` ${sex}` : ''}
        </Meta>
      </div>
    );
  };

  /**
   * One move, as a row. The **level** is a column of its own on the
   * far left rather than a word among the numbers on the right: a
   * level-up list is read down that column — "what do I get next" —
   * and a right-aligned number lines the ones and the tens up under
   * each other
   */
  const moveRow = (move: Moves, level?: number): JSX.Element => (
    <ListRow class="justify-between">
      <span class="flex items-center gap-2">
        <Show when={level != null}>
          <span class="w-6 shrink-0 text-right text-sm font-semibold">{level}</span>
        </Show>
        <TypeBadge type={getMoveData(move).type} />
        <MoveCategorySprite category={getMoveData(move).category} />
        <span class="font-medium">{getMoveData(move).name}</span>
      </span>
      <Meta>
        {getMoveData(move).power == null ? '' : `${getMoveData(move).power} power · `}
        {getMoveData(move).pp} PP
      </Meta>
    </ListRow>
  );

  return (
    <>
      <Show when={showing()} fallback={<Note>No such species.</Note>}>
        {(entry) => (
          <div
            class="flex flex-col items-center gap-4 text-center [&>section]:w-full
              [&>section]:border-t [&>section]:border-line-soft [&>section]:pt-4"
          >
            {/* Both coats, standing on the floor of a box with room
                above them, so a tall pokemon and a short one put their
                feet on the same line */}
            <div class="-mb-2 flex min-h-28 flex-wrap items-end justify-center gap-4 pt-2">
              {coat(entry().species, false)}
              {/* Beside its own coat rather than after both of them: a
                  female Venusaur belongs next to the Venusaur it
                  differs from, not at the end of a row of four */}
              <Show when={props.female() === true}>{coat(entry().species, false, true)}</Show>
              {coat(entry().species, true)}
              <Show when={props.female() === true}>{coat(entry().species, true, true)}</Show>
            </div>

            {/* The number is the dex's own and it is known before the
                pokemon is; everything else about an unmet species is
                held back. A page that named it, said what kind of
                pokemon it was and then hid its stats would be a page
                that had given the answer away and was pretending
                otherwise */}
            <div class="flex flex-col items-center gap-1">
              <h3>
                {dexLabel(entry().data.dexNumber)} {known().met ? entry().data.name : '???'}
              </h3>
              {/* The dex's own word for what it is, where a catch sheet
                  carries the sigil: a sigil tells one individual from
                  another, and an entry is about all of them */}
              <Meta>{known().met ? entry().data.category : '??? Pokemon'}</Meta>
              <Show when={known().met}>
                <div class="flex flex-wrap justify-center gap-1">
                  <For each={entry().data.types}>{(type) => <TypeBadge type={type} />}</For>
                </div>
                {/* How many, which is the count the dex is actually
                    kept for: the first of a species is a discovery and
                    the hundredth is a habit, and the two read very
                    differently against a species somebody is hunting */}
                <Row class="justify-center">
                  <Badge tone="tide">{known().seen} seen</Badge>
                  <Badge tone="leaf">{known().caught} caught</Badge>
                </Row>
              </Show>
            </div>

            {/* Everything below is what having met one buys. It is not
                a secret being kept for its own sake — a dex that read
                the same whether or not you had been out looking would
                not be worth filling in */}
            <Show when={known().met}>
              <DialogSection>
                <Row class="justify-center">
                  <Badge>{entry().data.height} m</Badge>
                  <Badge>{entry().data.weight} kg</Badge>
                  <Badge>{EGG_HATCH_STEPS} steps to hatch</Badge>
                  {/* The one number here that is the reader's rather
                      than the species': candy is held per family, and
                      it is what a level costs */}
                  <Badge tone="gold">
                    {props.candy() ?? 0} {getFamilyName(entry().data.family)} candy
                  </Badge>
                </Row>
              </DialogSection>

              <DialogSection title="Abilities">
                {/* Names in a row, with what each does on the card that
                    comes up over it */}
                <Row class="justify-center">
                  <For each={entry().data.abilities}>
                    {(ability) => (
                      <TooltipHost {...detailAbility(ability)}>
                        <Badge>{describeAbility(ability)}</Badge>
                      </TooltipHost>
                    )}
                  </For>
                  <Show when={entry().data.hiddenAbility}>
                    {(hidden) => (
                      // Said rather than left to be worked out from the
                      // order: a hidden ability is rolled far less
                      // often, which is the whole of what makes one
                      // worth hunting
                      <TooltipHost {...detailAbility(hidden())}>
                        <Badge tone="tide">{describeAbility(hidden())} · Hidden</Badge>
                      </TooltipHost>
                    )}
                  </Show>
                </Row>
              </DialogSection>

              <DialogSection title="Base stats">
                <div class="flex flex-col gap-1">
                  <For each={STAT_ORDER}>
                    {(stat) => (
                      <div class="flex items-center gap-2">
                        <Meta class="w-24 shrink-0 text-left">{STAT_LABELS[stat]}</Meta>
                        <span class="w-8 shrink-0 text-right text-sm font-semibold">
                          {entry().data.stats[stat]}
                        </span>
                        <div class="h-1.5 grow overflow-hidden rounded-full bg-line-soft">
                          <div
                            class={`h-full rounded-full ${STAT_BARS[stat]}`}
                            style={{
                              width: `${Math.min(
                                100,
                                (entry().data.stats[stat] / STAT_CEILING) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </DialogSection>

              {/* Where to go looking, and when. Everything registered
                today stands in some pool — what makes a legendary rare
                is the band it is drawn from rather than the absence of
                a home — but a species that stands in none says so
                rather than showing an empty list */}
              <DialogSection title="Where it lives">
                <Show
                  when={groupHabitats(entry().species).length || describeLair(entry().species)}
                  fallback={
                    // Nowhere at all is the answer for two kinds of
                    // species, and they are not the same answer: one
                    // is extinct and comes out of a rock, and the
                    // other simply is not staged anywhere yet
                    <Show
                      when={getSpeciesFossil(entry().species)}
                      fallback={<Note>It is not met in the wild.</Note>}
                    >
                      {(fossil) => (
                        <Note>
                          Extinct. It is only ever met by reviving a {getItemData(fossil()).name}.
                        </Note>
                      )}
                    </Show>
                  }
                >
                  <List>
                    {/* The place it is at home in, first: a player who
                      came to this entry for a legendary came for the
                      name of the lair rather than for the odds of
                      walking into one */}
                    <Show when={describeLair(entry().species)}>
                      {(lair) => (
                        <ListRow class="flex-col items-start gap-0.5 sm:flex-row sm:items-center">
                          <span class="grow text-left font-medium">{lair().name}</span>
                          <span class="flex flex-wrap justify-end gap-1">
                            <Badge tone="tide">Lair</Badge>
                            <For each={lair().where}>{(biome) => <Badge>{biome}</Badge>}</For>
                          </span>
                        </ListRow>
                      )}
                    </Show>
                    <For each={groupHabitats(entry().species)}>
                      {(place) => (
                        <ListRow class="flex-col items-start gap-0.5 sm:flex-row sm:items-center">
                          <span class="grow text-left font-medium">{BIOME_NAMES[place.biome]}</span>
                          <span class="flex flex-wrap justify-end gap-1">
                            <For each={place.hours}>{(hour) => <Badge>{hour}</Badge>}</For>
                          </span>
                        </ListRow>
                      )}
                    </For>
                  </List>
                </Show>
              </DialogSection>

              <DialogSection title="Moves">
                <TabGroup horizontal defaultValue={MoveTab.Level} class="flex flex-col gap-3">
                  <TabBar>
                    <TabButton value={MoveTab.Level}>Level</TabButton>
                    <TabButton value={MoveTab.Machines}>Machines</TabButton>
                    <TabButton value={MoveTab.Egg}>Egg</TabButton>
                  </TabBar>

                  <TabPane value={MoveTab.Level}>
                    <Show
                      when={listLevelMoves(entry().species).length}
                      fallback={<Note>It learns nothing by growing.</Note>}
                    >
                      <List>
                        <For each={listLevelMoves(entry().species)}>
                          {([level, moves]) => (
                            <For each={moves}>{(move) => moveRow(move, level)}</For>
                          )}
                        </For>
                      </List>
                    </Show>
                  </TabPane>

                  {/* One list rather than two: a machine and a tutor are
                    the same question to a player holding the item */}
                  <TabPane value={MoveTab.Machines}>
                    <Show
                      when={entry().data.learnSet.teachable.length}
                      fallback={<Note>Nothing can be taught to it.</Note>}
                    >
                      <List>
                        <For each={entry().data.learnSet.teachable}>{(move) => moveRow(move)}</For>
                      </List>
                    </Show>
                  </TabPane>

                  <TabPane value={MoveTab.Egg}>
                    <Show
                      when={(entry().data.learnSet.egg ?? []).length}
                      fallback={<Note>It inherits nothing.</Note>}
                    >
                      <List>
                        <For each={entry().data.learnSet.egg ?? []}>{(move) => moveRow(move)}</For>
                      </List>
                    </Show>
                  </TabPane>
                </TabGroup>
              </DialogSection>
            </Show>
          </div>
        )}
      </Show>
    </>
  );
}
