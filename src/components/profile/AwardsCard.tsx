import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
  onCleanup,
} from 'solid-js';
import { type AchievementSheet, listAchievements } from '../../auth/achievements';
import listAwards, { type AwardRecord } from '../../auth/awards';
import {
  type AchievementStanding,
  AchievementTier,
  LINE_DEEDS,
  LINE_NAMES,
  TIER_COLORS,
  TIER_NAMES,
  tierName,
} from '../../data/achievements';
import { TYPE_COLORS, TYPE_NAMES } from '../../data/constants/types';
import {
  TRAINER_BASE_NAMES,
  TRAINER_TYPES,
  type TrainerClass,
} from '../../data/overworld/trainers';
import { AWARD_COLORS, AWARD_NAMES, AWARD_SPRITES } from '../../data/awards';
import Awards, {
  FRONTIER_SYMBOLS,
  HOENN_BADGES,
  HOENN_HONORS,
  JOHTO_BADGES,
  JOHTO_HONORS,
  KALOS_BADGES,
  KALOS_HONORS,
  KANTO_BADGES,
  KANTO_HONORS,
  SINNOH_BADGES,
  SINNOH_HONORS,
  UNOVA_BADGES,
  UNOVA_HONORS,
} from '../../data/ids/awards';
import Npc, { EXECUTIVE_CHARSETS, EXECUTIVE_HONORS } from '../../data/overworld/npc';
import {
  SYNDICATES,
  SYNDICATE_BOSS_CHARSETS,
  SYNDICATE_BOSS_HONORS,
  SYNDICATE_EXECUTIVES,
  SYNDICATE_GRUNT_CHARSETS,
  SYNDICATE_GRUNT_HONORS,
  SYNDICATE_HONORS,
} from '../../data/overworld/syndicate';
import {
  CHAMPION_TITLES,
  ELITE_MEMBERS,
  ELITE_MEMBER_CHARSETS,
  ELITE_MEMBER_HONORS,
  LEGENDS,
  LEGEND_CHARSETS,
  LEGEND_HONORS,
} from '../../data/overworld/experts';
import NpcSprite from '../overworld/NpcSprite';
import ExtraSprite from '../sprites/ExtraSprite';
import {
  Card,
  Detail,
  HoverCard,
  Meta,
  Note,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
} from '../styled';
import { formatNumber, joinSentences } from '../../i18n/format';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * The trainer's shelf, laid out the way the bag's tray is: a grid of
 * squares, every slot drawn whether or not it is earned, with how
 * many times its fight has been won in the corner. An empty slot is
 * the point — it says what is still out there.
 *
 * The badges and the ribbon are drawn from their packed sheet, and
 * each elite mark is the member themselves off their overworld
 * charset; an unearned slot sits greyed
 */

/**
 * Each mark won off a person is that person: their first charset, the
 * portrait the challenge dialog uses: the Elite Four, the legends and
 * Team Rocket's boss all pay one
 */
const PERSON_AWARD_SHEETS = ((): Partial<Record<Awards, string>> => {
  const sheets: Partial<Record<Awards, string>> = {};

  for (const member of ELITE_MEMBERS) {
    sheets[ELITE_MEMBER_HONORS[member]] = ELITE_MEMBER_CHARSETS[member][0];
  }
  for (const legend of LEGENDS) {
    sheets[LEGEND_HONORS[legend]] = LEGEND_CHARSETS[legend][0];
  }
  for (const syndicate of SYNDICATES) {
    sheets[SYNDICATE_BOSS_HONORS[syndicate]] = SYNDICATE_BOSS_CHARSETS[syndicate][0];
    sheets[SYNDICATE_GRUNT_HONORS[syndicate]] = SYNDICATE_GRUNT_CHARSETS[syndicate][0];
    for (const executive of SYNDICATE_EXECUTIVES[syndicate]) {
      sheets[EXECUTIVE_HONORS[executive]] = EXECUTIVE_CHARSETS[executive][0];
    }
  }
  return sheets;
})();

/** The titles that read as a star rather than as a letter */
const CHAMPION_TITLES_SET = new Set<Awards>(Object.values(CHAMPION_TITLES));

/** The height an elite stands at inside their slot */
const ELITE_SPRITE_SIZE = 48;

/**
 * The shelf's order: Kanto's 8 badges, its 4 elite marks, the title
 * and the dex medal, then Johto's 8 badges, its 4 marks and its
 * title and its medal, then Hoenn's, then Sinnoh's 8 badges, its 4
 * marks, its title and its medal, then the marks that belong to no
 * region's walk: Team Rocket's, from the rank and file up, and the
 * legends'. The walk itself, left to right, a region at a time
 */
const SHELF = ((): Awards[] => {
  const walk = new Set<Awards>([
    ...KANTO_BADGES,
    ...KANTO_HONORS,
    Awards.KantoChampion,
    Awards.KantoDexMedal,
    ...JOHTO_BADGES,
    ...JOHTO_HONORS,
    Awards.JohtoChampion,
    Awards.JohtoDexMedal,
    ...HOENN_BADGES,
    ...HOENN_HONORS,
    Awards.HoennChampion,
    Awards.HoennDexMedal,
    ...SINNOH_BADGES,
    ...SINNOH_HONORS,
    Awards.SinnohChampion,
    Awards.SinnohDexMedal,
    ...UNOVA_BADGES,
    ...UNOVA_HONORS,
    Awards.UnovaChampion,
    Awards.UnovaDexMedal,
    ...KALOS_BADGES,
    ...KALOS_HONORS,
    Awards.KalosChampion,
    ...FRONTIER_SYMBOLS,
    ...SYNDICATE_HONORS,
  ]);

  for (const legend of LEGENDS) {
    walk.add(LEGEND_HONORS[legend]);
  }
  return [...walk];
})();

const GRID_COLUMNS = 6;

/**
 * One region's line under the shelf: how many badges are won and, where
 * the region has an Elite Four, how many of its members and whether the
 * Champion is beaten
 */
function summarise(
  region: string,
  badges: number,
  badgeTotal: number,
  elite: [won: number, total: number, champion: boolean] | null,
): string {
  if (elite == null) {
    return m.award_summary_badges({ region, badges, badgeTotal });
  }

  const [honors, honorTotal, champion] = elite;

  return champion
    ? m.award_summary_champion({ region, badges, badgeTotal, honors, honorTotal })
    : m.award_summary_elite({ region, badges, badgeTotal, honors, honorTotal });
}

/**
 * An award's own picture where it has one, for anywhere outside the
 * shelf that names an award as won
 */
export function AwardArt(props: { award: Awards; size: number }): JSX.Element {
  return (
    <Show
      when={AWARD_SPRITES[props.award]}
      keyed
      fallback={
        <span
          class="flex items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{
            width: `${props.size}px`,
            height: `${props.size}px`,
            'background-color': AWARD_COLORS[props.award],
          }}
        >
          {CHAMPION_TITLES_SET.has(props.award) ? '★' : AWARD_NAMES[props.award].slice(0, 1)}
        </span>
      }
    >
      {(sprite) => <ExtraSprite sheet={sprite[0]} name={sprite[1]} label="" size={props.size} />}
    </Show>
  );
}

/** The tray's own edge and padding, and the gap between squares, in pixels */
const TRAY_EDGE = 4 + 6;
const TRAY_GAP = 6;
/** A square's own border and padding, in pixels, which the art sits inside */
const SLOT_EDGE = 2 + 4;

/**
 * How big a square's art can be drawn in a tray this wide. The art is
 * sized to the square rather than drawn as cut, so a narrow screen
 * shrinks it instead of stretching the square or clipping the badge
 */
function artFor(tray: number): number {
  const square = (tray - TRAY_EDGE * 2 - TRAY_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  // No bigger than an elite's portrait, so a wide screen does not blow the badges up
  return Math.max(8, Math.min(ELITE_SPRITE_SIZE, Math.floor(square - SLOT_EDGE * 2)));
}

function Slot(props: { award: Awards; wins: number | null; art: number }): JSX.Element {
  const name = (): string => AWARD_NAMES[props.award];
  const held = (): boolean => props.wins != null;
  const mark = (): string => (CHAMPION_TITLES_SET.has(props.award) ? '★' : name().slice(0, 1));

  return (
    <HoverCard
      class="block w-full"
      title={name()}
      kind={m.award_kind()}
      trigger={
        <button
          type="button"
          aria-label={
            held()
              ? m.award_beaten_label({ name: name(), count: props.wins ?? 0 })
              : m.award_unearned_label({ name: name() })
          }
          class="relative flex aspect-square w-full min-w-0 cursor-default items-center
            justify-center overflow-hidden rounded-lg border-2 border-line bg-paper p-1"
        >
          <Show
            when={AWARD_SPRITES[props.award]}
            keyed
            fallback={
              <Show
                when={PERSON_AWARD_SHEETS[props.award]}
                keyed
                fallback={
                  <span
                    class={`pointer-events-none flex size-3/4 items-center justify-center
                      rounded-full text-base font-semibold ${
                        held()
                          ? 'text-white shadow-sm'
                          : 'border border-dashed border-line text-muted opacity-50'
                      }`}
                    style={held() ? { 'background-color': AWARD_COLORS[props.award] } : undefined}
                  >
                    {mark()}
                  </span>
                }
              >
                {(sheet) => (
                  <NpcSprite
                    npc={Npc.Trainer}
                    sheet={sheet}
                    size={props.art}
                    label=""
                    class={`pointer-events-none ${held() ? '' : 'opacity-40 grayscale'}`}
                  />
                )}
              </Show>
            }
          >
            {(sprite) => (
              <ExtraSprite
                sheet={sprite[0]}
                name={sprite[1]}
                label=""
                size={props.art}
                class={`pointer-events-none ${held() ? '' : 'opacity-40 grayscale'}`}
              />
            )}
          </Show>
          {/* How many times its fight has been won, in the corner the
              bag puts its counts in */}
          <Show when={props.wins} keyed>
            {(wins) => (
              <span
                class="pointer-events-none absolute right-0.5 bottom-0.5 rounded-full border
                  border-line bg-paper px-1 text-[10px] leading-tight font-bold text-ink"
              >
                {wins}
              </span>
            )}
          </Show>
        </button>
      }
    >
      <div class="flex flex-col gap-1">
        <span class="font-semibold">{name()}</span>
        <Detail label={m.award_beaten()}>{m.award_times({ count: props.wins ?? 0 })}</Detail>
        <Show when={!held()}>
          <Meta>{m.award_unearned()}</Meta>
        </Show>
      </div>
    </HoverCard>
  );
}

/**
 * The shelf itself, one component below the resource so a slow read
 * suspends the card's body rather than the page
 */
function Shelf(props: { held: Resource<AwardRecord[]> }): JSX.Element {
  const wins = (): Map<Awards, number> => {
    const held = new Map<Awards, number>();

    for (const entry of props.held() ?? []) {
      held.set(entry.award, entry.wins);
    }
    return held;
  };
  /** How many of these awards the shelf holds */
  const won = (awards: Iterable<Awards>): number => {
    const held = wins();
    let count = 0;

    for (const award of awards) {
      if (held.has(award)) {
        count += 1;
      }
    }
    return count;
  };
  const badges = (): number => won(KANTO_BADGES);
  const honors = (): number => won(KANTO_HONORS);
  const johto = (): number => won(JOHTO_BADGES);
  const marks = (): number => won(JOHTO_HONORS);
  const hoenn = (): number => won(HOENN_BADGES);
  const sinnoh = (): number => won(SINNOH_BADGES);
  const seats = (): number => won(SINNOH_HONORS);
  const unova = (): number => won(UNOVA_BADGES);
  const seated = (): number => won(UNOVA_HONORS);
  const kalos = (): number => won(KALOS_BADGES);
  const chairs = (): number => won(KALOS_HONORS);

  const empties = (): number[] => fillers(SHELF.length);

  /** How wide the tray is drawn, which sizes every square's art */
  const [tray, setTray] = createSignal(0);
  let observer: ResizeObserver | undefined;

  onCleanup(() => {
    observer?.disconnect();
  });

  return (
    <div class="mx-auto flex w-full max-w-lg flex-col gap-2">
      <div
        ref={(element) => {
          observer = new ResizeObserver(([entry]) => {
            setTray(entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width);
          });
          observer.observe(element);
        }}
        class="grid w-full grid-cols-6 gap-1.5 rounded-xl border-4 border-tide bg-parchment p-1.5
          shadow-pop"
      >
        <For each={SHELF}>
          {(award) => <Slot award={award} wins={wins().get(award) ?? null} art={artFor(tray())} />}
        </For>
        {/* The rest of the tray, drawn empty rather than left out: a
            half-built grid reads as a broken one */}
        <For each={empties()}>
          {() => (
            <span
              aria-hidden="true"
              class="aspect-square w-full rounded-lg border-2 border-line-soft bg-paper/40"
            />
          )}
        </For>
      </div>
      <Meta>
        {joinSentences([
          summarise(m.dex_region_kanto(), badges(), KANTO_BADGES.length, [
            honors(),
            KANTO_HONORS.length,
            wins().has(Awards.KantoChampion),
          ]),
          summarise(m.dex_region_johto(), johto(), JOHTO_BADGES.length, [
            marks(),
            JOHTO_HONORS.length,
            wins().has(Awards.JohtoChampion),
          ]),
          summarise(m.dex_region_hoenn(), hoenn(), HOENN_BADGES.length, null),
          summarise(m.dex_region_sinnoh(), sinnoh(), SINNOH_BADGES.length, [
            seats(),
            SINNOH_HONORS.length,
            wins().has(Awards.SinnohChampion),
          ]),
          summarise(m.dex_region_unova(), unova(), UNOVA_BADGES.length, [
            seated(),
            UNOVA_HONORS.length,
            wins().has(Awards.UnovaChampion),
          ]),
          summarise(m.dex_region_kalos(), kalos(), KALOS_BADGES.length, [
            chairs(),
            KALOS_HONORS.length,
            wins().has(Awards.KalosChampion),
          ]),
        ])}
      </Meta>
    </div>
  );
}

/**
 * One achievement as a slot: the name in the square, the tier as the
 * ring and the corner number, and the exact standing on the hover
 */
function LineSlot(props: {
  name: string;
  deed: string;
  standing: AchievementStanding | null;
  tint?: string;
}): JSX.Element {
  const tier = (): AchievementTier => props.standing?.tier ?? AchievementTier.None;
  const count = (): number => props.standing?.count ?? 0;
  const ranked = (): boolean => tier() !== AchievementTier.None;

  const progress = (): string => {
    const next = props.standing?.next;

    return next == null
      ? m.award_progress_top({
          count: formatNumber(count()),
          deed: props.deed,
          tier: TIER_NAMES[tier()],
        })
      : m.award_progress_next({
          count: formatNumber(count()),
          deed: props.deed,
          tier: tierName(tier() + 1),
          next: formatNumber(next),
        });
  };

  return (
    <HoverCard
      class="block w-full"
      title={props.name}
      kind={m.award_achievement_kind()}
      trigger={
        <button
          type="button"
          aria-label={m.award_line_label({
            name: props.name,
            tier: TIER_NAMES[tier()],
            progress: progress(),
          })}
          class={`relative flex aspect-square w-full cursor-default items-center justify-center
            rounded-lg border-2 bg-paper p-1 ${ranked() ? '' : 'border-dashed border-line'}`}
          style={ranked() ? { 'border-color': TIER_COLORS[tier()] } : undefined}
        >
          <span
            class={`pointer-events-none text-center text-[9px] leading-tight font-bold break-words
              ${ranked() ? '' : 'text-muted opacity-60'}`}
            style={props.tint != null && ranked() ? { color: props.tint } : undefined}
          >
            {props.name}
          </span>
          <Show when={ranked()}>
            <span
              class="pointer-events-none absolute right-0.5 bottom-0.5 rounded-full border
                border-line bg-paper px-1 text-[10px] leading-tight font-bold text-ink"
            >
              {tier()}
            </span>
          </Show>
        </button>
      }
    >
      <div class="flex flex-col gap-1">
        <span class="font-semibold">{props.name}</span>
        <Detail label={m.award_tier()}>{TIER_NAMES[tier()]}</Detail>
        <Meta>{progress()}</Meta>
      </div>
    </HoverCard>
  );
}

/**
 * The achievement trays: the general lines, the type lines and the
 * trainer classes, in the same tray dress the awards wear. Standings
 * are the server's derivation from the lifetime counters
 */
function fillers(count: number): number[] {
  const short = Math.ceil(count / GRID_COLUMNS) * GRID_COLUMNS - count;

  const slots: number[] = [];

  for (let at = 0; at < short; at += 1) {
    slots.push(at);
  }
  return slots;
}

function Filler(): JSX.Element {
  return (
    <span
      aria-hidden="true"
      class="aspect-square w-full rounded-lg border-2 border-line-soft bg-paper/40"
    />
  );
}

/**
 * What a trainer slot is tinted with: the type they field. The Ace
 * fields anything, so theirs is left in the tray's own colour
 */
function tintOf(trainer: TrainerClass): string | undefined {
  // The first of what they field, since a slot is one colour and the
  // Aces field everything
  const [type] = TRAINER_TYPES[trainer];

  return TRAINER_TYPES[trainer].length === 0 ? undefined : TYPE_COLORS[type];
}

/** One tray of achievement slots, filled out to whole rows */
function Tray(props: { count: number; children: JSX.Element }): JSX.Element {
  return (
    <div class="mx-auto w-full max-w-lg">
      <div
        class="grid w-full grid-cols-6 gap-1.5 rounded-xl border-4 border-tide bg-parchment p-1.5
          shadow-pop"
      >
        {props.children}
        <For each={fillers(props.count)}>{() => <Filler />}</For>
      </div>
    </div>
  );
}

function LineShelf(props: { sheet: Resource<AchievementSheet> }): JSX.Element {
  return (
    <Tray count={(props.sheet()?.lines ?? []).length}>
      <For each={props.sheet()?.lines ?? []}>
        {([line, standing]) => (
          <LineSlot name={LINE_NAMES[line]} deed={LINE_DEEDS[line]} standing={standing} />
        )}
      </For>
    </Tray>
  );
}

function TypeShelf(props: { sheet: Resource<AchievementSheet> }): JSX.Element {
  return (
    <Tray count={(props.sheet()?.types ?? []).length}>
      <For each={props.sheet()?.types ?? []}>
        {([type, standing]) => (
          <LineSlot
            name={TYPE_NAMES[type]}
            deed={m.award_type_deed({ type: TYPE_NAMES[type] })}
            standing={standing}
            tint={TYPE_COLORS[type]}
          />
        )}
      </For>
    </Tray>
  );
}

function TrainerShelf(props: { sheet: Resource<AchievementSheet> }): JSX.Element {
  return (
    <Tray count={(props.sheet()?.trainers ?? []).length}>
      <For each={props.sheet()?.trainers ?? []}>
        {([trainer, standing]) => (
          <LineSlot
            name={TRAINER_BASE_NAMES[trainer]}
            deed={m.award_trainer_deed({ name: TRAINER_BASE_NAMES[trainer] })}
            standing={standing}
            tint={tintOf(trainer)}
          />
        )}
      </For>
    </Tray>
  );
}

/** Which shelf of the card is open */
const enum AwardShelf {
  Badges = 0,
  Achievements = 1,
  Types = 2,
  Trainers = 3,
}

export interface AwardsCardProps {
  player: string;
}

export default function AwardsCard(props: AwardsCardProps): JSX.Element {
  const [held] = createResource(() => props.player, listAwards);
  const [sheet] = createResource(() => props.player, listAchievements);

  return (
    <Card title={m.profile_section_awards()}>
      {/* A shelf per tab, so none of them is a scroll away */}
      <TabGroup horizontal defaultValue={AwardShelf.Badges} class="flex flex-col gap-3">
        <TabBar>
          <TabButton value={AwardShelf.Badges}>{m.award_tab_badges()}</TabButton>
          <TabButton value={AwardShelf.Achievements}>{m.award_tab_achievements()}</TabButton>
          <TabButton value={AwardShelf.Types}>{m.award_tab_types()}</TabButton>
          <TabButton value={AwardShelf.Trainers}>{m.award_tab_trainers()}</TabButton>
        </TabBar>
        <TabPane value={AwardShelf.Badges}>
          <Suspense fallback={<Note>{m.award_reading()}</Note>}>
            <Shelf held={held} />
          </Suspense>
        </TabPane>
        <TabPane value={AwardShelf.Achievements}>
          <Suspense fallback={<Note>{m.award_counting()}</Note>}>
            <LineShelf sheet={sheet} />
          </Suspense>
        </TabPane>
        <TabPane value={AwardShelf.Types}>
          <Suspense fallback={<Note>{m.award_counting()}</Note>}>
            <TypeShelf sheet={sheet} />
          </Suspense>
        </TabPane>
        <TabPane value={AwardShelf.Trainers}>
          <Suspense fallback={<Note>{m.award_counting()}</Note>}>
            <TrainerShelf sheet={sheet} />
          </Suspense>
        </TabPane>
      </TabGroup>
    </Card>
  );
}
