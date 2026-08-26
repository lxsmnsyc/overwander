import type { CaughtPokemon } from '../../../auth/caught';
import { getCatchSlots } from '../../../auth/caught-record';
import { isEgg } from '../../../auth/egg';
import describeDate from '../../../core/dates';
import { BIOME_NAMES } from '../../../data/biome';
import { Slots } from '../../../data/constants/slots';
import { STAT_NAMES, STAT_ORDER, Stats, getIV, getOtherStat } from '../../../data/constants/stats';
import Biome from '../../../data/ids/biome';
import type { Items } from '../../../data/ids/items';
import type Natures from '../../../data/ids/natures';
import { getNatureFactor } from '../../../data/ids/natures';
import { EvolutionMethod } from '../../../data/ids/species';
import { getLairTitle } from '../../../data/overworld/lair';
import { type EvolutionData, SUPPORTED_METHODS, getSpeciesData } from '../../../data/species';
import { ENCOUNTER_TYPE_NAMES, EncounterType, isFatefulEncounter, isRaidEncounter } from '../../../overworld/encounter';
import { describeItem } from '../../items/ItemGrid';
import ItemSprite from '../../items/ItemSprite';
import { type JSX, Show } from 'solid-js';
import { getMaxHealth } from '../../../auth/health';
import { ItemFlags } from '../../../data/ids/items';
import { getItemData } from '../../../data/items';

/**
 * How much training one press moves. Four points buy one point of the
 * stat itself, so anything smaller would be a button that sometimes
 * does nothing visible
 */
export const EFFORT_STEP = 4;

/**
 * What a nature does to a stat, as a colour. A nature raises one and
 * lowers another and leaves the rest alone, which is three cases; they
 * are indexed by the sign of what the nature multiplies by, shifted so
 * that a drop is 0, no change is 1 and a boost is 2.
 *
 * Red for the raised one and blue for the lowered one, the way the
 * games have always marked them. Nothing rests on the colour alone —
 * the same bar is longer or shorter for the same reason
 */
export const NATURE_BARS = ['bg-tide', 'bg-leaf', 'bg-ember'] as const;

export const NATURE_NUMBERS = ['text-tide', '', 'text-ember-dark'] as const;

/**
 * And the same three said in a mark rather than in a colour.
 *
 * A nature moves one stat up a tenth and another down a tenth, which
 * is the difference between two of the same species and is worth
 * being able to *see*. It was a colour alone, which says nothing to
 * anybody who cannot tell this blue from this red — and nothing at
 * all to a screen reader
 */
export const NATURE_MARKS = ['▼', '', '▲'] as const;

export const NATURE_WORDS = ['lowered by its nature', '', 'raised by its nature'] as const;

/**
 * Which of the three a nature does to this stat: −1, 0 or 1, shifted
 * to index the tables above
 */
export function natureShift(nature: Natures, stat: Stats): number {
  return Math.sign(getNatureFactor(nature, stat) - 1) + 1;
}

/**
 * What the six are called. Exported because the dex entry prints the
 * species' base stats under the same names: two screens naming the
 * same six differently is two vocabularies for one thing
 */
export const STAT_LABELS: Record<Stats, string> = STAT_NAMES;

/**
 * The six values as a dex prints them, used in the record, in what a
 * bottle cap reports back, and on an auction lot — a bidder is buying
 * these more than they are buying the species
 */
export function describeIVs(ivs: number): string {
  return STAT_ORDER.map((stat) => `${STAT_LABELS[stat]} ${getIV(ivs, stat)}`).join(' · ');
}

/**
 * Where it came from, for the ones that came from somewhere.
 *
 * A fateful meeting happened nowhere: a gift, an event pokemon and a
 * mythical called out of a relic were never standing in a chunk, and
 * the one they are stamped with is only where their owner happened to
 * be at the time. Naming it would invite somebody to walk back there
 * and look, so it is left unsaid — and the record says `Beyond`,
 * which is the world's own word for nowhere
 */
function describeOrigin(caught: CaughtPokemon): string | null {
  const { biome, x, y } = caught.origin;

  // A mythical says `Beyond` and a gift says it too; a legendary or a
  // shadow raid was fought somewhere real, and says where
  if (biome === Biome.Beyond || isFatefulEncounter(caught.type)) {
    return null;
  }
  // The same shape the map writes in its own corner, so a player
  // reading a record and a player looking at the ground are reading
  // the same thing
  return `${BIOME_NAMES[biome]} (${x}, ${y})`;
}

/**
 * Where it was met.
 *
 * A raid prize is named after the place it was fought in — **Caught
 * at Seafoam Islands**, **Caught at Faraway Island** — because that
 * is what the lobby was called and what the player travelled to. All
 * three kinds of raid read that way; a shadow of a place is still
 * that place, with a word in front of it.
 *
 * None of this says how it came to be **theirs** — caught, hatched,
 * won at auction, given. That is the ownership history, which is its
 * own line further up
 */
function describeMet(caught: CaughtPokemon): string {
  if (isRaidEncounter(caught.type)) {
    return `Caught at ${getLairTitle(
      caught.lair,
      caught.origin.biome,
      caught.type === EncounterType.ShadowRaid,
    )}`;
  }
  return ENCOUNTER_TYPE_NAMES[caught.type];
}

/**
 * The line under the ownership history: where this pokemon came from,
 * when, and what it is in.
 *
 * A gift and an event pokemon get a sentence instead of a list. The
 * ball is a formality and the date is already on the line above, so
 * what is left worth saying is that it was never met anywhere — or,
 * where the gift named one, the place it says it came from
 */
export function describeHistory(caught: CaughtPokemon): string {
  if (caught.type === EncounterType.Fateful) {
    // Where a distribution says it happened, which is a name rather
    // than a chunk: nobody walked anywhere to meet this one
    return caught.origin.place == null
      ? 'Met in a fateful encounter.'
      : `Met in a fateful encounter at ${caught.origin.place}.`;
  }
  // The ball is left out. It is on the record and it decides nothing
  // afterwards — what a pokemon was caught in says less about it than
  // where and when, and the line is what those two are for
  return [
    isEgg(caught) ? 'Found' : describeMet(caught),
    describeDate(caught.caughtAt),
    describeOrigin(caught),
  ]
    .filter((part) => part != null)
    .join(' · ');
}

/**
 * Whether the game can measure what this evolution asks for at all.
 *
 * Friendship, weather and party composition have no stored
 * counterpart, so an evolution needing one is never going to happen
 * here — and saying so plainly is kinder than naming a requirement a
 * player could chase forever
 */
function isMeasurableEvolution(evolution: EvolutionData): boolean {
  const { method } = evolution;

  return method !== 0 && (method & ~SUPPORTED_METHODS) === 0;
}

/**
 * How big a held-item picture is drawn in the tray. Small enough that
 * four of them fit across a third of the sheet
 */
export const ITEM_SPRITE = 28;

/**
 * The squares the tray draws: what it is holding, plus the room it
 * still has. The room belongs to the pokemon — a Utility Belt widens
 * it — and is only drawn for somebody who can fill it
 */
export function itemSlots(caught: CaughtPokemon, mine: boolean): null[] {
  return Array.from(
    {
      length: mine
        ? Math.max(caught.items.length, getCatchSlots(caught, Slots.Item))
        : caught.items.length,
    },
    () => null,
  );
}

/**
 * How big an item is drawn inside a condition. Small enough to sit on
 * a line of text without pushing the row open, large enough to be
 * recognised as the stone it is
 */
const CONDITION_ICON = 24;

/**
 * And how big the ball on a history row is: the same size as the text
 * beside it, since it is read as part of the line rather than as a
 * picture of its own
 */
export const HISTORY_BALL = 20;

/**
 * What an evolution asks for, read straight off the row after the
 * picture it leads to: a Haunter's says `+ Trade`, an Eevee's shows
 * the stone, a Charmander's names the level.
 *
 * An item is its icon rather than its name, the way the bag draws it,
 * with the manner in front — **use** for a stone, spent on the spot,
 * and **holding** for something the pokemon must be carrying when the
 * moment comes. The two look nothing alike to play and read alike
 * written down, which is exactly the confusion a picture cannot fix
 * on its own.
 *
 * It says the same thing whether or not the condition is met, because
 * this is what the player is working towards rather than a complaint
 * about today — the button beside it is what reports availability
 */
export function EvolutionCondition(props: { evolution: EvolutionData }): JSX.Element {
  const method = (): number => props.evolution.method;
  const item = (): Items | null => props.evolution.item ?? null;
  const has = (flag: EvolutionMethod): boolean => (method() & flag) !== 0;

  return (
    <Show when={isMeasurableEvolution(props.evolution)} fallback={<span>not possible here</span>}>
      <span class="inline-flex items-center gap-1">
        <Show when={has(EvolutionMethod.Level) ? props.evolution.level : null}>
          {(level) => <span>Lv. {level()}</span>}
        </Show>
        <Show when={has(EvolutionMethod.UsedItem) ? item() : null} keyed>
          {(stone) => (
            <>
              <span>use</span>
              <ItemSprite item={stone} size={CONDITION_ICON} label={describeItem(stone)} />
            </>
          )}
        </Show>
        <Show when={has(EvolutionMethod.HeldItem) ? item() : null} keyed>
          {(carried) => (
            <>
              <span>holding</span>
              <ItemSprite item={carried} size={CONDITION_ICON} label={describeItem(carried)} />
            </>
          )}
        </Show>
        <Show when={has(EvolutionMethod.Trade)}>
          <span>Trade</span>
        </Show>
      </span>
    </Show>
  );
}

/**
 * The same condition as a sentence, for the tooltip over the row.
 *
 * The row itself is shorthand — an icon, a word, a level — which is
 * what makes it readable at a glance and what makes it worth spelling
 * out for anyone who stops on it. It is also what a screen reader is
 * given, since a line of pictures and half-sentences is not something
 * that reads aloud
 */
export function describeEvolutionMethod(evolution: EvolutionData): string {
  if (!isMeasurableEvolution(evolution)) {
    return 'This evolution is not possible here.';
  }

  const { method, item } = evolution;
  const steps: string[] = [];

  if ((method & EvolutionMethod.Level) !== 0 && evolution.level != null) {
    steps.push(`reach Lv. ${evolution.level}`);
  }
  if ((method & EvolutionMethod.UsedItem) !== 0 && item != null) {
    steps.push(`use ${withArticle(describeItem(item))}`);
  }
  if ((method & EvolutionMethod.HeldItem) !== 0 && item != null) {
    steps.push(`have it hold ${withArticle(describeItem(item))}`);
  }
  if ((method & EvolutionMethod.Trade) !== 0) {
    steps.push('trade it away');
  }
  if (steps.length === 0) {
    return 'It evolves on its own.';
  }
  return `To evolve, ${steps.join(' and ')}.`;
}

/**
 * A name with the article that belongs in front of it. Nothing here
 * is plural or proper, so the only question is the vowel
 */
export function withArticle(name: string): string {
  return `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;
}

/**
 * One stat as the pokemon actually has it: the species' base, the
 * value it was born with, the effort put into it, and — for
 * everything but health — what its nature makes of that
 */
export const totalOf = (caught: CaughtPokemon, stat: Stats): number =>
  stat === Stats.HP
    ? getMaxHealth(caught)
    : getOtherStat(
        caught.level,
        getSpeciesData(caught.species).stats[stat],
        getIV(caught.ivs, stat),
        caught.effortValues[stat],
        getNatureFactor(caught.nature, stat),
      );

/**
 * The tallest of the six the bars are drawn against. Health counts
 * with the rest: it is the longest bar on most pokemon, which is
 * the honest picture of a stat that is bigger than the others
 */
export const bestTotal = (caught: CaughtPokemon): number =>
  Math.max(1, ...STAT_ORDER.map((stat) => totalOf(caught, stat)));

/** What it has left, as a share of what it has */
export const healthLeft = (caught: CaughtPokemon): number => {
  const max = getMaxHealth(caught);

  return max <= 0 ? 0 : Math.max(0, Math.min(1, caught.health / max));
};

/**
 * Whether a catch is allowed to hold it at all
 */
export function isHoldable(item: Items): boolean {
  try {
    return (getItemData(item).flags & ItemFlags.Holdable) !== 0;
  } catch {
    // An unregistered item has no flags to read, so it is not
    // offered rather than assumed holdable
    return false;
  }
}
