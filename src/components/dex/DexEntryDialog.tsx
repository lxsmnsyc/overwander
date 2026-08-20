import { For, type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
import { getCandyCount } from '../../auth/candy';
import { EGG_HATCH_STEPS } from '../../auth/egg';
import { type SpeciesDexEntry, getSpeciesDexEntry } from '../../auth/pokedex';
import {
  BIOME_NAMES,
  SPAWN_RARITY_NAMES,
  type SpeciesHabitat,
  TIMES_OF_DAY,
  TIME_OF_DAY_NAMES,
  listSpeciesHabitats,
} from '../../data/biome';
import type Biome from '../../data/ids/biome';
import { getItemData, getSpeciesFossil } from '../../data/items';
import { LAIR_NAMES, getBiomeLairs, getSpeciesLair } from '../../data/overworld/lair';
import { STAT_ORDER, Stats } from '../../data/constants/stats';
import type { Moves } from '../../data/ids/moves';
import type { Species } from '../../data/ids/species';
import { getMoveData } from '../../data/moves';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import { type SpeciesData, getBaseForms, getFamilyName, getSpeciesData } from '../../data/species';
import { STAT_LABELS, describeAbility, detailAbility } from '../catches/CatchDialog';
import MoveCategorySprite from '../sprites/MoveCategorySprite';
import { dexLabel } from './PokedexGrid';
import { hasFemaleSheet } from '../../canvas/species-sprites';
import SpeciesCoat from '../sprites/SpeciesCoat';
import TypeBadge from '../sprites/TypeBadge';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogSection,
  List,
  ListRow,
  Meta,
  Note,
  Row,
  StepButton,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
  TooltipHost,
} from '../styled';

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
 * The ceiling the stat bars are drawn against.
 *
 * A fixed one rather than the biggest stat on the page: a Shuckle's
 * defence should look enormous next to its attack *and* next to a
 * Pidgey's, which it does not if every entry rescales itself to its
 * own best number
 */
const STAT_CEILING = 200;

/**
 * How long one turn on the spot takes, in milliseconds.
 *
 * The sheets spin at the speed a battle wants — a pokemon whipping
 * round mid-fight — which on a page that is being read is a fidget.
 * Four seconds is slow enough that each of the eight facings is
 * actually looked at, which is the point of turning at all
 */
const ROTATION = 4000;

const STAT_BARS: Record<Stats, string> = {
  [Stats.HP]: 'bg-leaf',
  [Stats.Attack]: 'bg-ember',
  [Stats.Defense]: 'bg-tide',
  [Stats.SpecialAttack]: 'bg-ember',
  [Stats.SpecialDefense]: 'bg-tide',
  [Stats.Speed]: 'bg-gold',
};

/**
 * Which list of moves is being read
 */
const enum MoveTab {
  Level = 0,
  Machines = 1,
  Egg = 2,
}

/**
 * Every level the species learns something at, in order, with what it
 * learns there
 */
function listLevelMoves(species: Species): [level: number, moves: Moves[]][] {
  const { level } = getSpeciesData(species).learnSet;

  return Object.keys(level)
    .map(Number)
    .sort((one, other) => one - other)
    .map((threshold): [number, Moves[]] => [threshold, level[threshold]]);
}

/**
 * One biome's worth of the habitat list: the hours it is met there,
 * each with how lucky the walk has to be.
 *
 * Grouped by **place** rather than by hour because that is the
 * question a player is asking — they are standing in a grassland and
 * want to know whether it is worth coming back at night
 */
interface Habitat {
  biome: Biome;
  /**
   * One badge per period it is met in — or a single **Anytime** badge
   * for something met around the clock at the same odds, which is most
   * of what lives anywhere. Four badges all saying the same thing is
   * four times the reading for the same fact
   */
  hours: string[];
}

function groupHabitats(species: Species): Habitat[] {
  const places = new Map<Biome, SpeciesHabitat[]>();

  for (const habitat of listSpeciesHabitats(species)) {
    places.set(habitat.biome, [...(places.get(habitat.biome) ?? []), habitat]);
  }

  return [...places]
    .map(([biome, found]): Habitat => {
      const bands = new Map(found.map((habitat) => [habitat.time, habitat.rarity]));
      const met = TIMES_OF_DAY.filter((time) => bands.has(time));
      const rarities = new Set(met.map((time) => bands.get(time)));

      if (met.length === TIMES_OF_DAY.length && rarities.size === 1) {
        return { biome, hours: [`Anytime · ${SPAWN_RARITY_NAMES[bands.get(met[0]) ?? 0]}`] };
      }
      return {
        biome,
        hours: met.map(
          (time) => `${TIME_OF_DAY_NAMES[time]} · ${SPAWN_RARITY_NAMES[bands.get(time) ?? 0]}`,
        ),
      };
    })
    .sort((one, other) => BIOME_NAMES[one.biome].localeCompare(BIOME_NAMES[other.biome]));
}

/**
 * The place this species is at home in, if it has one, and the biomes
 * that place turns up in.
 *
 * A legendary is not caught by walking into it: it stands in a lair,
 * and a lair is a landmark the world stages in the biomes that could
 * hold it — the Seafoam Islands in cold water, Mt. Ember in a volcano.
 * Naming it is most of what a player needs, since a lair is what they
 * would travel to
 */
function describeLair(species: Species): { name: string; where: string[] } | null {
  const lair = getSpeciesLair(species);

  if (lair == null) {
    return null;
  }

  const where = (Object.keys(BIOME_NAMES).map(Number) as Biome[]).filter((biome) =>
    new Set(getBiomeLairs(biome)).has(lair),
  );

  return { name: LAIR_NAMES[lair], where: where.map((biome) => BIOME_NAMES[biome]) };
}

/**
 * The dex in the order it is printed. Base forms only — a dex is one
 * entry per pokemon rather than one per costume — and the arrows walk
 * this list
 */
function dexOrder(): Species[] {
  return getBaseForms().sort(
    (one, other) => getSpeciesData(one).dexNumber - getSpeciesData(other).dexNumber,
  );
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
function DexEntryBody(
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
      lead={<StepButton label="Previous pokemon" mark="‹" onPress={walk(-1)} />}
      aside={<StepButton label="Next pokemon" mark="›" onPress={walk(1)} />}
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
