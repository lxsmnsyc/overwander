import {
  ROTATION,
  STAT_BARS,
  STAT_CEILING,
  describeLairs,
  groupHabitats,
  listLevelMoves,
  townHours,
} from './species-facts';
import { EGG_HATCH_STEPS } from '../../../model/egg';
import type { PokedexView, SpeciesDexEntry } from '../../../auth/pokedex';
import { BIOME_NAMES } from '../../../data/biome';
import { STAT_ORDER } from '../../../data/constants/stats';
import { Items } from '../../../data/ids/items';
import type { Moves } from '../../../data/ids/moves';
import type { Species } from '../../../data/ids/species';
import { SpriteAnim } from '../../../data/ids/sprite-anims';
import { getItemData, getSpeciesFossil } from '../../../data/items';
import { getMoveData } from '../../../data/moves';
import {
  type EvolutionData,
  type SpeciesData,
  getBaseSpecies,
  getFamilyName,
  getSpeciesData,
} from '../../../data/species';
import {
  EvolutionCondition,
  STAT_LABELS,
  describeEvolutionMethod,
} from '../../catches/catch-dialog/describe';
import MoveTooltip from '../../moves/MoveTooltip';
import { getSpeciesSignature } from '../../../data/abilities';
import { describeAbility, describeItem, detailAbility } from '../../details';
import MoveCategorySprite from '../../sprites/MoveCategorySprite';
import SpeciesCoat from '../../sprites/SpeciesCoat';
import { Sigil } from '../../sprites/TypeBadge';
import { ArrowRightIcon } from '../../icons';
import {
  Badge,
  DialogSection,
  Hint,
  HintList,
  List,
  ListRow,
  Meta,
  Note,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
  TooltipHost,
} from '../../styled';
import { For, type JSX, type Resource, Show, createEffect, createSignal, on } from 'solid-js';
import { answered, failed, readable } from '../../app/resource-reads';
import { m } from '../../../i18n/paraglide/messages.js';

/** How many stages a line is walked to, so a data loop cannot run away */
const LINE_LIMIT = 24;

/** One stage of an evolution line, and what it takes to reach it */
interface LineStage {
  species: Species;
  depth: number;
  from?: EvolutionData;
}

/** The sum of a species' base stats */
function totalOf(data: SpeciesData): number {
  let total = 0;

  for (const stat of STAT_ORDER) {
    total += data.stats[stat];
  }
  return total;
}

/** The rock it comes out of, or the two halves that make one */
function nameFossils(fossils: Items[]): string {
  const names: string[] = [];

  for (const fossil of fossils) {
    names.push(getItemData(fossil).name);
  }
  return names.join(m.dex_fossil_and());
}

/** One half of a two-way switch, pressed or not */
function Toggle(props: {
  pressed: boolean;
  onPress: () => void;
  children: JSX.Element;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={props.pressed}
      class={`rounded-none border-2 px-2 py-0.5 text-xs font-bold shadow-none first:rounded-l-lg
        last:rounded-r-lg active:translate-y-0 ${
          props.pressed
            ? 'border-tide bg-tide text-on-accent hover:text-on-accent'
            : 'border-line bg-paper text-ink'
        }`}
      onClick={() => {
        props.onPress();
      }}
    >
      {props.children}
    </button>
  );
}

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
  /**
   * Where the reader's dex and candy come from. Left out, they are the
   * player's own; a demo hands in made-up answers instead
   */
  reads?: DexReads;
}

/** The three things an entry reads about its reader */
export interface DexReads {
  entry: (player: string, species: Species) => SpeciesDexEntry | Promise<SpeciesDexEntry>;
  candy: (player: string, species: Species) => number | Promise<number>;
  pokedex: (player: string) => PokedexView | Promise<PokedexView>;
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
    /** The reader's whole dex, for drawing the rest of the line */
    pokedex: Resource<PokedexView>;
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

  /** Which coat the portrait shows. Both reset when the entry turns to another species */
  const [shiny, setShiny] = createSignal(false);
  const [female, setFemale] = createSignal(false);

  createEffect(
    on(
      () => props.species,
      () => {
        setShiny(false);
        setFemale(false);
      },
    ),
  );

  /**
   * What the reader's dex says about any species, for the evolution
   * line. Read without waiting, so an unarrived dex draws silhouettes
   * that fill in rather than holding the entry up
   */
  const dexKnows = (species: Species): { met: boolean; owned: boolean; shiny: boolean } => {
    const view = answered(props.pokedex);
    let owned = false;
    let sparkled = false;
    let seen = false;

    for (const tally of view?.caught ?? []) {
      if (tally.species === species) {
        owned = true;
        sparkled = tally.shiny > 0;
        break;
      }
    }
    for (const tally of view?.seen ?? []) {
      if (tally.species === species) {
        seen = true;
        break;
      }
    }
    return { met: seen || owned, owned, shiny: sparkled };
  };

  /** The whole line this species belongs to, from its first stage down */
  const lineOf = (species: Species): LineStage[] => {
    const stages: LineStage[] = [];
    const walk = (at: Species, depth: number, from?: EvolutionData): void => {
      if (stages.length > LINE_LIMIT) {
        return;
      }
      stages.push({ species: at, depth, from });
      for (const next of getSpeciesData(at).evolvesInto ?? []) {
        if (next.species !== at) {
          walk(next.species, depth + 1, next);
        }
      }
    };

    walk(getBaseSpecies(species), 0);
    return stages;
  };

  /**
   * One move, as a row. The **level** is a column of its own on the
   * far left rather than a word among the numbers on the right: a
   * level-up list is read down that column — "what do I get next" —
   * and a right-aligned number lines the ones and the tens up under
   * each other
   */
  const moveRow = (move: Moves, level?: number): JSX.Element => (
    <li class="list-none">
      {/* The whole row opens the move's card, so its type mark is a plain
          picture rather than a tooltip of its own */}
      <MoveTooltip class="block" move={move}>
        <span class="flex items-center justify-between gap-2 rounded-lg px-1 py-0.5 hover:bg-tide-soft">
          <span class="flex items-center gap-2">
            <Show when={level != null}>
              <span class="w-6 shrink-0 text-right text-sm font-semibold">{level}</span>
            </Show>
            <Sigil type={getMoveData(move).type} />
            <MoveCategorySprite category={getMoveData(move).category} />
            <span class="font-medium">{getMoveData(move).name}</span>
          </span>
          <Meta>
            <Show
              when={getMoveData(move).power != null}
              fallback={m.catch_pp_amount({ pp: getMoveData(move).pp })}
            >
              {m.dex_move_power_pp({
                power: getMoveData(move).power ?? 0,
                pp: getMoveData(move).pp,
              })}
            </Show>
          </Meta>
        </span>
      </MoveTooltip>
    </li>
  );

  return (
    <Show when={showing()} fallback={<Note>{m.dex_no_species()}</Note>}>
      {(entry) => (
        // The left column holds still and the right one scrolls, so the
        // pokemon stays in view while its lists are read
        <div
          class="flex flex-col gap-4 md:grid md:min-h-0 md:flex-1
            md:grid-cols-[16rem_minmax(0,1fr)] md:gap-0"
        >
          <div
            class="flex min-h-0 flex-col items-center gap-2 text-center md:border-r-2
              md:border-line-soft md:pr-4"
          >
            {/* A fixed square the sprite is fitted to, so every species
                takes the same room */}
            <div class="relative size-36 shrink-0">
              <SpeciesCoat
                species={entry().species}
                met={known().met}
                revealed={shiny() ? known().shiny : known().owned}
                shiny={shiny()}
                female={female()}
                animation={SpriteAnim.Rotate}
                duration={ROTATION}
                direction="DownLeft"
                fill
                sized
                called={[
                  entry().data.name,
                  ...(shiny() ? [m.dex_coat_shiny()] : []),
                  ...(props.female() === true
                    ? [female() ? m.dex_coat_female() : m.dex_coat_male()]
                    : []),
                ].join(', ')}
              />
            </div>

            <div class="flex flex-wrap items-center justify-center gap-1.5">
              <div class="flex" role="group" aria-label={m.dex_coat()}>
                <Toggle
                  pressed={!shiny()}
                  onPress={() => {
                    setShiny(false);
                  }}
                >
                  {m.dex_coat_regular()}
                </Toggle>
                <Toggle
                  pressed={shiny()}
                  onPress={() => {
                    setShiny(true);
                  }}
                >
                  {m.catch_shiny()}
                </Toggle>
              </div>
              {/* Only where the females were drawn differently */}
              <Show when={props.female() === true}>
                <div class="flex" role="group" aria-label={m.dex_sex()}>
                  <Toggle
                    pressed={!female()}
                    onPress={() => {
                      setFemale(false);
                    }}
                  >
                    ♂
                  </Toggle>
                  <Toggle
                    pressed={female()}
                    onPress={() => {
                      setFemale(true);
                    }}
                  >
                    ♀
                  </Toggle>
                </div>
              </Show>
            </div>

            <Show when={known().met}>
              <div class="flex flex-wrap items-center justify-center gap-1.5">
                <Badge>{entry().data.height} m</Badge>
                <Badge>{entry().data.weight} kg</Badge>
                <Badge tone="gold">
                  {m.battle_candy_earned({
                    count: failed(props.candy) == null ? (readable(props.candy) ?? 0) : '?',
                    family: getFamilyName(entry().data.family),
                  })}
                </Badge>
                <Badge>{m.dex_hatch_steps({ count: EGG_HATCH_STEPS })}</Badge>
              </div>

              <section class="flex min-h-0 w-full flex-1 flex-col gap-1 border-t border-line-soft pt-2">
                <span class="flex items-center gap-1.5">
                  <h3 class="text-left">{m.dex_line()}</h3>
                  <Hint title={m.dex_line_help()}>
                    <HintList>
                      <li>{m.dex_line_help_hover()}</li>
                      <li>{m.dex_line_help_press()}</li>
                      <li>{m.dex_line_help_unmet()}</li>
                    </HintList>
                  </Hint>
                </span>
                {/* A long branching line scrolls inside its own box */}
                <ul class="m-0 flex min-h-0 list-none flex-col gap-1 overflow-y-auto p-0">
                  <For each={lineOf(entry().species)}>
                    {(stage) => (
                      <li
                        class={`flex items-center gap-2 rounded-lg px-1 text-left text-sm ${
                          stage.species === entry().species ? 'bg-tide-soft' : ''
                        }`}
                        style={{ 'padding-left': `${stage.depth * 12 + 4}px` }}
                      >
                        {/* What it takes is on the tooltip, so the line stays one
                            name a row */}
                        <TooltipHost
                          class="flex min-w-0 items-center gap-2"
                          name={
                            dexKnows(stage.species).met ? getSpeciesData(stage.species).name : '???'
                          }
                          description={
                            stage.from == null
                              ? m.dex_line_start()
                              : describeEvolutionMethod(stage.from)
                          }
                          extra={() => (
                            <Show when={stage.from}>
                              {(from) => (
                                <span class="text-xs">
                                  <EvolutionCondition evolution={from()} />
                                </span>
                              )}
                            </Show>
                          )}
                        >
                          <Show when={stage.depth > 0}>
                            <ArrowRightIcon
                              class="size-3.5 shrink-0 text-muted"
                              aria-hidden="true"
                            />
                          </Show>
                          {/* Centred in its square: a sheet whose cell is not square
                              is fitted by its longer side and would otherwise sit
                              against one edge, leaving a gap before the name */}
                          <span class="flex size-9 shrink-0 items-center justify-center">
                            <SpeciesCoat
                              species={stage.species}
                              met={dexKnows(stage.species).met}
                              revealed={dexKnows(stage.species).owned}
                              centred
                              animation={SpriteAnim.Idle}
                              unmet={SpriteAnim.Idle}
                              direction="DownLeft"
                              fill
                            />
                          </span>
                          <span class="flex min-w-0 flex-col">
                            <Show
                              when={stage.species !== entry().species}
                              fallback={<span class="truncate font-bold">{entry().data.name}</span>}
                            >
                              <button
                                type="button"
                                class="truncate border-0 bg-transparent p-0 text-left text-sm
                                font-medium text-ink shadow-none hover:text-tide-dark"
                                onClick={() => {
                                  props.onSpecies(stage.species);
                                }}
                              >
                                {dexKnows(stage.species).met
                                  ? getSpeciesData(stage.species).name
                                  : '???'}
                              </button>
                            </Show>
                          </span>
                        </TooltipHost>
                      </li>
                    )}
                  </For>
                </ul>
              </section>
            </Show>
          </div>

          {/* Everything that runs long, scrolling on its own */}
          <div class="flex min-h-0 flex-col gap-4 md:overflow-y-auto md:pl-4">
            <Show when={known().met} fallback={<Note>{m.dex_meet_first()}</Note>}>
              <DialogSection
                title={m.dex_base_stats()}
                hint={
                  <Hint title={m.dex_base_stats_help()}>
                    <HintList>
                      <li>{m.dex_base_stats_help_start()}</li>
                      <li>{m.dex_base_stats_help_own()}</li>
                      <li>{m.dex_base_stats_help_bars({ max: STAT_CEILING })}</li>
                    </HintList>
                  </Hint>
                }
              >
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
                  <Meta class="text-right">{m.dex_total({ total: totalOf(entry().data) })}</Meta>
                </div>
              </DialogSection>

              <div class="grid gap-4 sm:grid-cols-2">
                <DialogSection
                  title={m.catch_abilities()}
                  hint={
                    <Hint title={m.catch_abilities_help()}>
                      <HintList>
                        <li>{m.dex_abilities_help_born()}</li>
                        <li>{m.dex_abilities_help_hidden()}</li>
                        <li>
                          {m.dex_abilities_help_signature({
                            patch: describeItem(Items.AbilityPatch),
                          })}
                        </li>
                        <li>
                          {m.dex_abilities_help_more({
                            capsule: describeItem(Items.AbilityCapsule),
                          })}
                        </li>
                      </HintList>
                    </Hint>
                  }
                >
                  <ul class="m-0 grid list-none grid-cols-2 gap-1 p-0">
                    <For each={entry().data.abilities}>
                      {(ability) => (
                        <li>
                          <TooltipHost class="block" kind="ability" {...detailAbility(ability)}>
                            <Badge class="w-full justify-center" wrap>
                              {describeAbility(ability)}
                            </Badge>
                          </TooltipHost>
                        </li>
                      )}
                    </For>
                    <For each={entry().data.hiddenAbilities}>
                      {(hidden) => (
                        <li>
                          <TooltipHost class="block" kind="ability" {...detailAbility(hidden)}>
                            <Badge tone="tide" class="w-full justify-center" wrap>
                              {describeAbility(hidden)}
                            </Badge>
                          </TooltipHost>
                        </li>
                      )}
                    </For>
                    <Show when={getSpeciesSignature(entry().species)}>
                      {(signature) => (
                        <li>
                          <TooltipHost class="block" kind="ability" {...detailAbility(signature())}>
                            <Badge tone="gold" class="w-full justify-center" wrap>
                              {describeAbility(signature())}
                            </Badge>
                          </TooltipHost>
                        </li>
                      )}
                    </Show>
                  </ul>
                </DialogSection>

                <DialogSection
                  title={m.dex_habitat()}
                  hint={
                    <Hint title={m.dex_habitat_help()}>
                      <HintList>
                        <li>{m.dex_habitat_help_biomes()}</li>
                        <li>{m.dex_habitat_help_towns()}</li>
                        <li>{m.dex_habitat_help_lairs()}</li>
                      </HintList>
                    </Hint>
                  }
                >
                  <Show
                    when={
                      groupHabitats(entry().species).length ||
                      townHours(entry().species).length ||
                      describeLairs(entry().species).length
                    }
                    fallback={
                      // Nowhere at all is the answer for two kinds of
                      // species, and they are not the same answer: one
                      // is extinct and comes out of a rock, and the
                      // other simply is not staged anywhere yet
                      <Show
                        when={getSpeciesFossil(entry().species)}
                        fallback={<Note>{m.dex_habitat_none()}</Note>}
                      >
                        {(fossils) => (
                          <Note>{m.dex_extinct({ fossils: nameFossils(fossils()) })}</Note>
                        )}
                      </Show>
                    }
                  >
                    <List>
                      {/* The place it is at home in, first: a player who
                        came to this entry for a legendary came for the
                        name of the lair rather than for the odds of
                        walking into one */}
                      <For each={describeLairs(entry().species)}>
                        {(lair) => (
                          <ListRow class="flex-col items-start gap-0.5 sm:flex-row sm:items-center">
                            <span class="grow text-left font-medium">{lair.name}</span>
                            <span class="flex flex-wrap justify-end gap-1">
                              <Badge tone="tide">{m.dex_lair()}</Badge>
                              <For each={lair.where}>{(biome) => <Badge>{biome}</Badge>}</For>
                            </span>
                          </ListRow>
                        )}
                      </For>
                      <For each={groupHabitats(entry().species)}>
                        {(place) => (
                          <ListRow class="flex-col items-start gap-0.5 sm:flex-row sm:items-center">
                            <span class="grow text-left font-medium">
                              {place.biome == null ? m.dex_all_biomes() : BIOME_NAMES[place.biome]}
                            </span>
                            <span class="flex flex-wrap justify-end gap-1">
                              <For each={place.hours}>{(hour) => <Badge>{hour}</Badge>}</For>
                            </span>
                          </ListRow>
                        )}
                      </For>
                      <Show when={townHours(entry().species).length}>
                        <ListRow class="flex-col items-start gap-0.5 sm:flex-row sm:items-center">
                          <span class="grow text-left font-medium">{m.dex_towns()}</span>
                          <span class="flex flex-wrap justify-end gap-1">
                            <For each={townHours(entry().species)}>
                              {(hour) => <Badge>{hour}</Badge>}
                            </For>
                          </span>
                        </ListRow>
                      </Show>
                    </List>
                  </Show>
                </DialogSection>
              </div>

              <DialogSection
                title={m.catch_moves()}
                hint={
                  <Hint title={m.catch_moves_help()}>
                    <HintList>
                      <li>{m.dex_moves_help_level()}</li>
                      <li>{m.dex_moves_help_machines()}</li>
                      <li>{m.dex_moves_help_egg()}</li>
                      <li>{m.dex_moves_help_hover()}</li>
                    </HintList>
                  </Hint>
                }
              >
                <TabGroup horizontal defaultValue={MoveTab.Level} class="flex flex-col gap-3">
                  <TabBar>
                    <TabButton value={MoveTab.Level}>{m.dex_tab_level()}</TabButton>
                    <TabButton value={MoveTab.Machines}>{m.item_pocket_machines()}</TabButton>
                    <TabButton value={MoveTab.Egg}>{m.ui_egg()}</TabButton>
                  </TabBar>

                  <TabPane value={MoveTab.Level}>
                    <Show
                      when={listLevelMoves(entry().species).length}
                      fallback={<Note>{m.dex_moves_none_level()}</Note>}
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
                      fallback={<Note>{m.dex_moves_none_machines()}</Note>}
                    >
                      <List>
                        <For each={entry().data.learnSet.teachable}>{(move) => moveRow(move)}</For>
                      </List>
                    </Show>
                  </TabPane>

                  <TabPane value={MoveTab.Egg}>
                    <Show
                      when={(entry().data.learnSet.egg ?? []).length}
                      fallback={<Note>{m.dex_moves_none_egg()}</Note>}
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
        </div>
      )}
    </Show>
  );
}
