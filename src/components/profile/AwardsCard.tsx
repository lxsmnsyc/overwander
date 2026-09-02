import { For, type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
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
import { TRAINER_NAMES, TRAINER_TYPES, type TrainerClass } from '../../data/overworld/trainers';
import Awards, {
  AWARD_NAMES,
  JOHTO_BADGES,
  JOHTO_HONORS,
  KANTO_BADGES,
  KANTO_HONORS,
} from '../../data/ids/awards';
import Npc from '../../data/overworld/npc';
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
import { Card, Detail, HoverCard, Meta, Note } from '../styled';

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
 * Where each award's picture sits, where one ships: the extras sheet
 * and the name on it. A region's badges are one sheet, in gym order
 */
const AWARD_SPRITES: Partial<Record<Awards, [sheet: string, name: string]>> = {
  [Awards.BoulderBadge]: ['badges/kanto', 'Kanto'],
  [Awards.CascadeBadge]: ['badges/kanto', 'Kanto (1)'],
  [Awards.ThunderBadge]: ['badges/kanto', 'Kanto (2)'],
  [Awards.RainbowBadge]: ['badges/kanto', 'Kanto (3)'],
  [Awards.SoulBadge]: ['badges/kanto', 'Kanto (4)'],
  [Awards.MarshBadge]: ['badges/kanto', 'Kanto (5)'],
  [Awards.VolcanoBadge]: ['badges/kanto', 'Kanto (6)'],
  [Awards.EarthBadge]: ['badges/kanto', 'Kanto (7)'],
  [Awards.KantoChampion]: ['badges/kanto', 'Champion Ribbon'],
  [Awards.ZephyrBadge]: ['badges/johto', 'Johto'],
  [Awards.HiveBadge]: ['badges/johto', 'Johto (1)'],
  [Awards.PlainBadge]: ['badges/johto', 'Johto (2)'],
  [Awards.FogBadge]: ['badges/johto', 'Johto (3)'],
  [Awards.StormBadge]: ['badges/johto', 'Johto (4)'],
  [Awards.MineralBadge]: ['badges/johto', 'Johto (5)'],
  [Awards.GlacierBadge]: ['badges/johto', 'Johto (6)'],
  [Awards.RisingBadge]: ['badges/johto', 'Johto (7)'],
};

/**
 * Each mark won off a person is that person: their first charset, the
 * portrait the challenge dialog uses. The Elite Four and the legends
 * both pay one
 */
const PERSON_AWARD_SHEETS: Partial<Record<Awards, string>> = Object.fromEntries([
  ...ELITE_MEMBERS.map((member): [Awards, string] => [
    ELITE_MEMBER_HONORS[member],
    ELITE_MEMBER_CHARSETS[member][0],
  ]),
  ...LEGENDS.map((legend): [Awards, string] => [LEGEND_HONORS[legend], LEGEND_CHARSETS[legend][0]]),
]);

/** The titles that read as a star rather than as a letter */
const CHAMPION_TITLES_SET = new Set<Awards>(Object.values(CHAMPION_TITLES));

/** The height an elite stands at inside their slot */
const ELITE_SPRITE_SIZE = 48;

/**
 * Each award's colour, for the earned state of its disc
 */
const AWARD_COLORS: Record<Awards, string> = {
  [Awards.BoulderBadge]: '#8a8f98',
  [Awards.CascadeBadge]: '#4aa3df',
  [Awards.ThunderBadge]: '#f2a636',
  [Awards.RainbowBadge]: '#58b858',
  [Awards.SoulBadge]: '#c964b8',
  [Awards.MarshBadge]: '#caa53d',
  [Awards.VolcanoBadge]: '#d95340',
  [Awards.EarthBadge]: '#7ca35c',
  [Awards.LoreleiDefeated]: '#9fd7e8',
  [Awards.BrunoDefeated]: '#c98a4b',
  [Awards.AgathaDefeated]: '#8a6fb8',
  [Awards.LanceDefeated]: '#5a78c9',
  [Awards.KantoChampion]: '#e0b64f',
  [Awards.KantoDexMedal]: '#d0342c',
  [Awards.ZephyrBadge]: '#8fb8d8',
  [Awards.HiveBadge]: '#d0a63c',
  [Awards.PlainBadge]: '#d97b8f',
  [Awards.FogBadge]: '#8c7fb8',
  [Awards.StormBadge]: '#c96b3c',
  [Awards.MineralBadge]: '#7f9aa8',
  [Awards.GlacierBadge]: '#6fb4d9',
  [Awards.RisingBadge]: '#5f9e6a',
  [Awards.WillDefeated]: '#b48fd0',
  [Awards.KogaDefeated]: '#8f5fa8',
  [Awards.KarenDefeated]: '#5c4f56',
  [Awards.JohtoBrunoDefeated]: '#c98a4b',
  [Awards.JohtoChampion]: '#e0b64f',
  [Awards.RedDefeated]: '#d0342c',
};

/**
 * The shelf's order: Kanto's 8 badges, its 4 elite marks, the title
 * and the dex medal, then Johto's 8 badges, its 4 marks and its
 * title, and the legends' marks last, which belong to no region's
 * walk. The walk itself, left to right, a region at a time
 */
const SHELF: Awards[] = [
  ...new Set([
    ...KANTO_BADGES,
    ...KANTO_HONORS,
    Awards.KantoChampion,
    Awards.KantoDexMedal,
    ...JOHTO_BADGES,
    ...JOHTO_HONORS,
    Awards.JohtoChampion,
    ...LEGENDS.map((legend) => LEGEND_HONORS[legend]),
  ]),
];

const GRID_COLUMNS = 6;

function Slot(props: { award: Awards; wins: number | null }): JSX.Element {
  const name = (): string => AWARD_NAMES[props.award];
  const held = (): boolean => props.wins != null;
  const mark = (): string => (CHAMPION_TITLES_SET.has(props.award) ? '★' : name().slice(0, 1));

  return (
    <HoverCard
      class="block w-full"
      title="Info"
      trigger={
        <button
          type="button"
          aria-label={
            held()
              ? `${name()}, beaten ${props.wins} ${props.wins === 1 ? 'time' : 'times'}`
              : `${name()}, not yet earned`
          }
          class="relative flex aspect-square w-full cursor-default items-center justify-center
            rounded-lg border-2 border-line bg-paper p-1"
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
                    size={ELITE_SPRITE_SIZE}
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
        <Detail label="Beaten">
          {props.wins ?? 0} {props.wins === 1 ? 'time' : 'times'}
        </Detail>
        <Show when={!held()}>
          <Meta>Not yet earned.</Meta>
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
  const wins = (): Map<Awards, number> =>
    new Map((props.held() ?? []).map((entry) => [entry.award, entry.wins]));
  const badges = (): number => KANTO_BADGES.filter((badge) => wins().has(badge)).length;
  const honors = (): number => KANTO_HONORS.filter((honor) => wins().has(honor)).length;
  const johto = (): number => JOHTO_BADGES.filter((badge) => wins().has(badge)).length;
  const marks = (): number => JOHTO_HONORS.filter((honor) => wins().has(honor)).length;

  const empties = (): number[] =>
    Array.from(
      { length: Math.ceil(SHELF.length / GRID_COLUMNS) * GRID_COLUMNS - SHELF.length },
      (_, at) => at,
    );

  return (
    <div class="mx-auto flex w-full max-w-lg flex-col gap-2">
      <div
        class="grid w-full grid-cols-6 gap-1.5 rounded-xl border-4 border-tide bg-parchment p-1.5
          shadow-pop"
      >
        <For each={SHELF}>{(award) => <Slot award={award} wins={wins().get(award) ?? null} />}</For>
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
        Kanto: {badges()} of {KANTO_BADGES.length} badges, {honors()} of {KANTO_HONORS.length} of
        the Elite Four{wins().has(Awards.KantoChampion) ? ', Champion' : ''}. Johto: {johto()} of{' '}
        {JOHTO_BADGES.length} badges, {marks()} of {JOHTO_HONORS.length} of the Elite Four
        {wins().has(Awards.JohtoChampion) ? ', Champion' : ''}.
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
      ? `${count().toLocaleString('en-US')} ${props.deed}. ${TIER_NAMES[tier()]}.`
      : `${count().toLocaleString('en-US')} ${props.deed}. ${tierName(tier() + 1)} at ${next.toLocaleString('en-US')}.`;
  };

  return (
    <HoverCard
      class="block w-full"
      title="Info"
      trigger={
        <button
          type="button"
          aria-label={`${props.name}, ${TIER_NAMES[tier()]}. ${progress()}`}
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
        <Detail label="Tier">{TIER_NAMES[tier()]}</Detail>
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

  return Array.from({ length: short }, (_, at) => at);
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
  const type = TRAINER_TYPES[trainer];

  return type == null ? undefined : TYPE_COLORS[type];
}

function AchievementShelves(props: { sheet: Resource<AchievementSheet> }): JSX.Element {
  return (
    <div class="mx-auto flex w-full max-w-lg flex-col gap-2">
      <Meta>Achievements</Meta>
      <div
        class="grid w-full grid-cols-6 gap-1.5 rounded-xl border-4 border-tide bg-parchment p-1.5
          shadow-pop"
      >
        <For each={props.sheet()?.lines ?? []}>
          {([line, standing]) => (
            <LineSlot name={LINE_NAMES[line]} deed={LINE_DEEDS[line]} standing={standing} />
          )}
        </For>
        <For each={fillers((props.sheet()?.lines ?? []).length)}>{() => <Filler />}</For>
      </div>
      <Meta>Type specialists</Meta>
      <div
        class="grid w-full grid-cols-6 gap-1.5 rounded-xl border-4 border-tide bg-parchment p-1.5
          shadow-pop"
      >
        <For each={props.sheet()?.types ?? []}>
          {([type, standing]) => (
            <LineSlot
              name={TYPE_NAMES[type]}
              deed={`${TYPE_NAMES[type]} pokemon caught`}
              standing={standing}
              tint={TYPE_COLORS[type]}
            />
          )}
        </For>
        <For each={fillers((props.sheet()?.types ?? []).length)}>{() => <Filler />}</For>
      </div>
      <Meta>Trainers beaten</Meta>
      <div
        class="grid w-full grid-cols-6 gap-1.5 rounded-xl border-4 border-tide bg-parchment p-1.5
          shadow-pop"
      >
        <For each={props.sheet()?.trainers ?? []}>
          {([trainer, standing]) => (
            <LineSlot
              name={TRAINER_NAMES[trainer]}
              deed={`${TRAINER_NAMES[trainer]}s beaten`}
              standing={standing}
              tint={tintOf(trainer)}
            />
          )}
        </For>
        <For each={fillers((props.sheet()?.trainers ?? []).length)}>{() => <Filler />}</For>
      </div>
    </div>
  );
}

export interface AwardsCardProps {
  player: string;
}

export default function AwardsCard(props: AwardsCardProps): JSX.Element {
  const [held] = createResource(() => props.player, listAwards);
  const [sheet] = createResource(() => props.player, listAchievements);

  return (
    <Card title="Awards">
      <Suspense fallback={<Note>Reading the shelf…</Note>}>
        <Shelf held={held} />
      </Suspense>
      <Suspense fallback={<Note>Counting the lifetime…</Note>}>
        <AchievementShelves sheet={sheet} />
      </Suspense>
    </Card>
  );
}
