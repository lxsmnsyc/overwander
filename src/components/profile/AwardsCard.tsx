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
import {
  TRAINER_BASE_NAMES,
  TRAINER_TYPES,
  type TrainerClass,
} from '../../data/overworld/trainers';
import Awards, {
  AWARD_NAMES,
  FRONTIER_SYMBOLS,
  HOENN_BADGES,
  HOENN_HONORS,
  JOHTO_BADGES,
  JOHTO_HONORS,
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
  [Awards.StoneBadge]: ['badges/hoenn', 'Hoenn'],
  [Awards.KnuckleBadge]: ['badges/hoenn', 'Hoenn (1)'],
  [Awards.DynamoBadge]: ['badges/hoenn', 'Hoenn (2)'],
  [Awards.HeatBadge]: ['badges/hoenn', 'Hoenn (3)'],
  [Awards.BalanceBadge]: ['badges/hoenn', 'Hoenn (4)'],
  [Awards.FeatherBadge]: ['badges/hoenn', 'Hoenn (5)'],
  [Awards.MindBadge]: ['badges/hoenn', 'Hoenn (6)'],
  [Awards.RainBadge]: ['badges/hoenn', 'Hoenn (7)'],
  [Awards.SilverBraveSymbol]: ['badges/frontier-emerald', 'brave-silver'],
  [Awards.GoldBraveSymbol]: ['badges/frontier-emerald', 'brave-gold'],
  [Awards.SilverGutsSymbol]: ['badges/frontier-emerald', 'guts-silver'],
  [Awards.GoldGutsSymbol]: ['badges/frontier-emerald', 'guts-gold'],
  [Awards.SilverLuckSymbol]: ['badges/frontier-emerald', 'luck-silver'],
  [Awards.GoldLuckSymbol]: ['badges/frontier-emerald', 'luck-gold'],
  [Awards.SilverKnowledgeSymbol]: ['badges/frontier-emerald', 'knowledge-silver'],
  [Awards.GoldKnowledgeSymbol]: ['badges/frontier-emerald', 'knowledge-gold'],
  [Awards.SilverAbilitySymbol]: ['badges/frontier-emerald', 'ability-silver'],
  [Awards.GoldAbilitySymbol]: ['badges/frontier-emerald', 'ability-gold'],
  [Awards.SilverSpiritsSymbol]: ['badges/frontier-emerald', 'spirits-silver'],
  [Awards.GoldSpiritsSymbol]: ['badges/frontier-emerald', 'spirits-gold'],
  [Awards.SilverTacticsSymbol]: ['badges/frontier-emerald', 'tactics-silver'],
  [Awards.GoldTacticsSymbol]: ['badges/frontier-emerald', 'tactics-gold'],
  // Sinnoh's sheet names its badges by number rather than by region,
  // and the numbers are the gym order
  [Awards.CoalBadge]: ['badges/sinnoh', '1'],
  [Awards.ForestBadge]: ['badges/sinnoh', '2'],
  [Awards.CobbleBadge]: ['badges/sinnoh', '3'],
  [Awards.FenBadge]: ['badges/sinnoh', '4'],
  [Awards.RelicBadge]: ['badges/sinnoh', '5'],
  [Awards.MineBadge]: ['badges/sinnoh', '6'],
  [Awards.IcicleBadge]: ['badges/sinnoh', '7'],
  [Awards.BeaconBadge]: ['badges/sinnoh', '8'],
  // Unova's sheet is numbered the same way, and its gym order runs
  // the first league's eight then the two the sequels open
  [Awards.TrioBadge]: ['badges/unova', '1'],
  [Awards.BasicBadge]: ['badges/unova', '2'],
  [Awards.InsectBadge]: ['badges/unova', '3'],
  [Awards.BoltBadge]: ['badges/unova', '4'],
  [Awards.QuakeBadge]: ['badges/unova', '5'],
  [Awards.JetBadge]: ['badges/unova', '6'],
  [Awards.FreezeBadge]: ['badges/unova', '7'],
  [Awards.LegendBadge]: ['badges/unova', '8'],
  [Awards.ToxicBadge]: ['badges/unova', '9'],
  [Awards.WaveBadge]: ['badges/unova', '10'],
};

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
  [Awards.GiovanniDefeated]: '#b0453c',
  [Awards.ArcherDefeated]: '#6f7fa8',
  [Awards.ArianaDefeated]: '#c2536f',
  [Awards.ProtonDefeated]: '#4f8f7a',
  [Awards.PetrelDefeated]: '#7a6f8f',
  [Awards.RocketGruntDefeated]: '#3f4550',
  [Awards.JohtoDexMedal]: '#d0a63c',
  [Awards.StoneBadge]: '#a9a29a',
  [Awards.KnuckleBadge]: '#c96b4a',
  [Awards.DynamoBadge]: '#e8c34a',
  [Awards.HeatBadge]: '#d9542f',
  [Awards.BalanceBadge]: '#b8894a',
  [Awards.FeatherBadge]: '#8fb8d0',
  [Awards.MindBadge]: '#c96fa8',
  [Awards.RainBadge]: '#4a8fd0',
  [Awards.HoennDexMedal]: '#3f9e6a',
  [Awards.SidneyDefeated]: '#5c4f56',
  [Awards.PhoebeDefeated]: '#8f6fb8',
  [Awards.GlaciaDefeated]: '#9fd7e8',
  [Awards.DrakeDefeated]: '#c9603c',
  [Awards.HoennChampion]: '#e0b64f',
  [Awards.StevenDefeated]: '#7f9aa8',
  [Awards.SilverBraveSymbol]: '#b8bcc4',
  [Awards.GoldBraveSymbol]: '#e0b64f',
  [Awards.SilverGutsSymbol]: '#b8bcc4',
  [Awards.GoldGutsSymbol]: '#e0b64f',
  [Awards.SilverLuckSymbol]: '#b8bcc4',
  [Awards.GoldLuckSymbol]: '#e0b64f',
  [Awards.SilverKnowledgeSymbol]: '#b8bcc4',
  [Awards.GoldKnowledgeSymbol]: '#e0b64f',
  [Awards.SilverAbilitySymbol]: '#b8bcc4',
  [Awards.GoldAbilitySymbol]: '#e0b64f',
  [Awards.SilverSpiritsSymbol]: '#b8bcc4',
  [Awards.GoldSpiritsSymbol]: '#e0b64f',
  [Awards.SilverTacticsSymbol]: '#b8bcc4',
  [Awards.GoldTacticsSymbol]: '#e0b64f',
  [Awards.MagmaGruntDefeated]: '#8c3a2a',
  [Awards.TabithaDefeated]: '#b0553c',
  [Awards.CourtneyDefeated]: '#c96b5a',
  [Awards.MaxieDefeated]: '#a83a2a',
  [Awards.AquaGruntDefeated]: '#2a5a8c',
  [Awards.MattDefeated]: '#3c7ab0',
  [Awards.ShellyDefeated]: '#5a95c9',
  [Awards.ArchieDefeated]: '#2a4a9e',
  [Awards.CoalBadge]: '#6f747c',
  [Awards.ForestBadge]: '#5aa46a',
  [Awards.CobbleBadge]: '#c98a4b',
  [Awards.FenBadge]: '#4aa3b8',
  [Awards.RelicBadge]: '#8a6fb8',
  [Awards.MineBadge]: '#8f9aa8',
  [Awards.IcicleBadge]: '#9fd7e8',
  [Awards.BeaconBadge]: '#f2c14a',
  [Awards.AaronDefeated]: '#6fae5a',
  [Awards.BerthaDefeated]: '#b8935a',
  [Awards.FlintDefeated]: '#d9542f',
  [Awards.LucianDefeated]: '#7f6fc9',
  [Awards.SinnohChampion]: '#e0b64f',
  [Awards.SinnohDexMedal]: '#4a7fc9',
  [Awards.GalacticGruntDefeated]: '#4a4f6a',
  [Awards.MarsDefeated]: '#c9536f',
  [Awards.JupiterDefeated]: '#8f5fa8',
  [Awards.SaturnDefeated]: '#4a8fa8',
  [Awards.CyrusDefeated]: '#3c5a8c',
  [Awards.SilverTowerPrint]: '#b9c0c9',
  [Awards.GoldTowerPrint]: '#e0b64f',
  [Awards.SilverFactoryPrint]: '#b9c0c9',
  [Awards.GoldFactoryPrint]: '#e0b64f',
  [Awards.SilverArcadePrint]: '#b9c0c9',
  [Awards.GoldArcadePrint]: '#e0b64f',
  [Awards.SilverCastlePrint]: '#b9c0c9',
  [Awards.GoldCastlePrint]: '#e0b64f',
  [Awards.SilverHallPrint]: '#b9c0c9',
  [Awards.GoldHallPrint]: '#e0b64f',
  [Awards.TrioBadge]: '#7fbf6a',
  [Awards.BasicBadge]: '#8f9ecb',
  [Awards.InsectBadge]: '#a8c94f',
  [Awards.BoltBadge]: '#e9c33f',
  [Awards.QuakeBadge]: '#b08a52',
  [Awards.JetBadge]: '#6fbfe0',
  [Awards.FreezeBadge]: '#9fd9e8',
  [Awards.LegendBadge]: '#c26a3f',
  [Awards.ToxicBadge]: '#a05fb8',
  [Awards.WaveBadge]: '#4f9fd0',
  [Awards.ShauntalDefeated]: '#7a6fa8',
  [Awards.MarshalDefeated]: '#b8563f',
  [Awards.GrimsleyDefeated]: '#4f4a52',
  [Awards.CaitlinDefeated]: '#d9a3c9',
  [Awards.UnovaDexMedal]: '#5aa87f',
  [Awards.UnovaChampion]: '#e0b64f',
  [Awards.NDefeated]: '#4f8f7a',
  [Awards.PlasmaGruntDefeated]: '#3f5a6f',
  [Awards.ColressDefeated]: '#7f9fc9',
  [Awards.ZinzolinDefeated]: '#6f5f9f',
  [Awards.GhetsisDefeated]: '#8f7f4f',
  [Awards.AlderDefeated]: '#c4552e',
};

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

  const empties = (): number[] => fillers(SHELF.length);

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
        {wins().has(Awards.JohtoChampion) ? ', Champion' : ''}. Hoenn: {hoenn()} of{' '}
        {HOENN_BADGES.length} badges. Sinnoh: {sinnoh()} of {SINNOH_BADGES.length} badges, {seats()}{' '}
        of {SINNOH_HONORS.length} of the Elite Four
        {wins().has(Awards.SinnohChampion) ? ', Champion' : ''}. Unova: {unova()} of{' '}
        {UNOVA_BADGES.length} badges, {seated()} of {UNOVA_HONORS.length} of the Elite Four
        {wins().has(Awards.UnovaChampion) ? ', Champion' : ''}.
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
            deed={`${TYPE_NAMES[type]} pokemon caught`}
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
            deed={`${TRAINER_BASE_NAMES[trainer]}s beaten`}
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
    <Card title="Awards">
      {/* A shelf per tab, so none of them is a scroll away */}
      <TabGroup horizontal defaultValue={AwardShelf.Badges} class="flex flex-col gap-3">
        <TabBar>
          <TabButton value={AwardShelf.Badges}>Badges</TabButton>
          <TabButton value={AwardShelf.Achievements}>Achievements</TabButton>
          <TabButton value={AwardShelf.Types}>Type specialists</TabButton>
          <TabButton value={AwardShelf.Trainers}>Trainers beaten</TabButton>
        </TabBar>
        <TabPane value={AwardShelf.Badges}>
          <Suspense fallback={<Note>Reading the shelf…</Note>}>
            <Shelf held={held} />
          </Suspense>
        </TabPane>
        <TabPane value={AwardShelf.Achievements}>
          <Suspense fallback={<Note>Counting the lifetime…</Note>}>
            <LineShelf sheet={sheet} />
          </Suspense>
        </TabPane>
        <TabPane value={AwardShelf.Types}>
          <Suspense fallback={<Note>Counting the lifetime…</Note>}>
            <TypeShelf sheet={sheet} />
          </Suspense>
        </TabPane>
        <TabPane value={AwardShelf.Trainers}>
          <Suspense fallback={<Note>Counting the lifetime…</Note>}>
            <TrainerShelf sheet={sheet} />
          </Suspense>
        </TabPane>
      </TabGroup>
    </Card>
  );
}
