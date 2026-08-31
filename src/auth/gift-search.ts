import { type CatchGift, type EncounterGift, GiftKind, type MysteryGift } from './gift-record';
import type { QueryVocabulary } from '../core/query';
import { alternatives, askedTerms, holds, parseControls, within } from '../core/query';
import { getItemData } from '../data/items';
import { getSpeciesData } from '../data/species';

/**
 * What a search box over the gift ledger can be asked.
 *
 * The grammar is the bag's and the board's: a plain word, `field:value`
 * pairs that narrow, `is:` for the yes-or-no facts, `!` to refuse one
 * and `|` to accept any of several. The ledger is the one list where
 * every line was written by hand, so what somebody looks for in it is
 * who it went to, what it was and whether anybody came for it.
 */

/** What the ledger already knows about a row, handed to the search */
export interface GiftContext {
  /** Who it was for, as the ledger says it; null or absent for everybody */
  recipient?: string | null;
  /** How many players have taken it */
  claims?: number;
  expired?: boolean;
  offeredAt?: number;
  /** What time it is, for how long ago it was written */
  now?: number;
}

/** What the gift is called, which is what a plain word matches */
export function describeGiftName(gift: MysteryGift): string {
  return gift.kind === GiftKind.Item
    ? getItemData(gift.item).name
    : getSpeciesData(gift.species).name;
}

/** The pokemon behind a gift, where it is one */
function given(gift: MysteryGift): CatchGift | EncounterGift | null {
  return gift.kind === GiftKind.Item ? null : gift;
}

/** How many days ago it was written, for `offered:` */
function daysSince(context: GiftContext): number {
  const at = context.offeredAt ?? 0;

  return at === 0 ? 0 : Math.floor(((context.now ?? Date.now()) - at) / (24 * 60 * 60 * 1000));
}

/** One yes-or-no fact about a row, by the word a search calls it */
const MARKS = new Map<string, (gift: MysteryGift, context: GiftContext) => boolean>(
  Object.entries<(gift: MysteryGift, context: GiftContext) => boolean>({
    item: (gift) => gift.kind === GiftKind.Item,
    pokemon: (gift) => gift.kind !== GiftKind.Item,
    encounter: (gift) => gift.kind === GiftKind.Encounter,
    shiny: (gift) => given(gift)?.shiny === true,
    shadow: (gift) => given(gift)?.shadow === true,
    // An offer with nobody's name on it stands on every shelf at once,
    // which is the one thing about a row that changes what it costs
    open: (_gift, context) => context.recipient == null,
    personal: (_gift, context) => context.recipient != null,
    taken: (_gift, context) => (context.claims ?? 0) > 0,
    waiting: (_gift, context) => (context.claims ?? 0) === 0,
    expired: (_gift, context) => context.expired === true,
    dated: (gift) => gift.expiresAt != null,
  }),
);

function marked(gift: MysteryGift, value: string, wanted: boolean, context: GiftContext): boolean {
  return alternatives(value).some((word) => {
    const mark = MARKS.get(word.trim().toLowerCase());

    return mark?.(gift, context) === wanted;
  });
}

/** What one field asks of one row */
type GiftField = (gift: MysteryGift, value: string, context: GiftContext) => boolean;

const FIELDS = new Map<string, GiftField>(
  Object.entries<GiftField>({
    // "everybody" reads the empty recipient, since that is the word
    // the line itself uses for one
    for: (_gift, value, context) =>
      context.recipient == null ? holds('everybody', value) : holds(context.recipient, value),
    name: (gift, value) => holds(describeGiftName(gift), value),
    // The sentence the card carries, which is where a distribution
    // says what it was for
    reason: (gift, value) => holds(gift.reason, value),
    level: (gift, value) => {
      const pokemon = given(gift);

      return pokemon != null && within(value, pokemon.level);
    },
    amount: (gift, value) => gift.kind === GiftKind.Item && within(value, gift.amount),
    taken: (_gift, value, context) => within(value, context.claims ?? 0),
    offered: (_gift, value, context) => within(value, daysSince(context)),
    is: (gift, value, context) => marked(gift, value, true, context),
    not: (gift, value, context) => marked(gift, value, false, context),
  }),
);

/**
 * Whether one row answers the whole search. A field nobody has heard
 * of matches nothing, as everywhere else. A plain word is asked of the
 * three things a line says out loud: what it is, why it was given and
 * who it went to
 */
export default function matchesGift(
  gift: MysteryGift,
  query: string,
  context: GiftContext = {},
): boolean {
  return askedTerms(query).every((term) => {
    const answered =
      term.field === ''
        ? holds(describeGiftName(gift), term.value) ||
          holds(gift.reason, term.value) ||
          holds(context.recipient ?? 'everybody', term.value)
        : FIELDS.get(term.field)?.(gift, term.value, context) === true;

    return term.negated ? !answered : answered;
  });
}

/** What each `sort:` word reads off a row */
const SORTS = new Map<string, (gift: MysteryGift, context: GiftContext) => number | string>(
  Object.entries<(gift: MysteryGift, context: GiftContext) => number | string>({
    name: (gift) => describeGiftName(gift).toLowerCase(),
    for: (_gift, context) => (context.recipient ?? '').toLowerCase(),
    offered: (_gift, context) => context.offeredAt ?? 0,
    taken: (_gift, context) => context.claims ?? 0,
    level: (gift) => given(gift)?.level ?? 0,
  }),
);

/**
 * One short line per field, and the values it is known to take. Which
 * fields exist is read off the tables that answer them, so a field
 * added there turns up in the guide on its own
 */
const HINTS: Record<string, string> = {
  for: 'Who it was written for',
  name: 'What is on the shelf',
  reason: 'The sentence it carries',
  level: 'What level a pokemon gift is',
  amount: 'How many of an item it holds',
  taken: 'How many players have taken it',
  offered: 'Days since it was written',
  is: 'A fact it has',
  not: 'A fact it lacks',
  sort: 'Arrange by',
  order: 'Which way round',
};

const VALUES: Record<string, () => string[]> = {
  is: () => [...MARKS.keys()],
  not: () => [...MARKS.keys()],
  sort: () => [...SORTS.keys()],
  order: () => ['asc', 'desc'],
};

/** What the ledger's box can be asked, with the arranging terms on the end */
export const GIFT_VOCABULARY: QueryVocabulary = {
  fields: [...FIELDS.keys(), 'sort', 'order'].map((name) => ({
    name,
    hint: HINTS[name] ?? '',
    values: VALUES[name],
  })),
};

/**
 * The rows a search asked for, in the order it asked for them. The two
 * arranging terms hide nothing, so this runs over whatever the
 * predicate already kept
 */
export function orderGifts<T>(
  rows: T[],
  query: string,
  of: (row: T) => { gift: MysteryGift; context?: GiftContext },
): T[] {
  const controls = parseControls(query);
  const read = SORTS.get(controls.sort);

  if (read == null) {
    return rows;
  }
  return [...rows].sort((left, right) => {
    const first = of(left);
    const second = of(right);
    const one = read(first.gift, first.context ?? {});
    const two = read(second.gift, second.context ?? {});
    const order =
      typeof one === 'string' && typeof two === 'string'
        ? one.localeCompare(two)
        : Number(one) - Number(two);

    return controls.descending ? -order : order;
  });
}
