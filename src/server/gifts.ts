import 'server-only';
import { Acquisition } from '../auth/caught-record';
import type { EncounterRecord } from '../auth/encounter-record';
import type { CatchGift, EncounterGift, GiftRecord, MysteryGift } from '../auth/gift-record';
import { GiftKind, asGiftRecord } from '../auth/gift-record';
import AleaRNG from '../core/alea';
import { defaultSlots } from '../data/constants/slots';
import Biome from '../data/ids/biome';
import type Abilities from '../data/ids/abilities';
import { Balls, Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders } from '../data/ids/species';
import { Species } from '../data/ids/species';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import deriveEncounter, { EncounterType } from '../overworld/encounter';
import { writeCaughtRecord } from './caught';
import { grantItem } from './inventory';
import { recordSeenSpecies } from './pokedex';
import { getSql, jsonOf, tx } from './db';
import { writeEncounter } from './encounter-io';
import { asNumber, asRecord, asString } from './read';

/**
 * The gifts the game gives.
 *
 * A mystery gift is the one thing a player receives without doing
 * anything: no landmark to walk to, no throw to land, nothing to
 * spend. Everything about one is decided here, because a client that
 * could name its own gift could name a legendary — the player's only
 * say is whether to take it.
 *
 * An offer is for one player or for everybody, and either way the
 * pokemon it holds is rolled once, when the gift is written. That one
 * rolled meeting — the **gift encounter** — is what every taker
 * receives: the same individual, from the same fixed place, however
 * many people take it. Taking it writes a claim row, and that write is
 * what stops a second press being paid twice.
 */

/**
 * What the starter comes at. Low enough that it is the beginning of
 * something rather than a shortcut past it, and the level the games
 * have handed a first pokemon over at since the first of them
 */
export const STARTER_LEVEL = 5;

/**
 * What a first pokemon is no use without. Twenty is enough to walk
 * out and come back with a few more without the game having to hand
 * out another gift for it
 */
export const STARTER_BALLS = 20;

/**
 * The three a trainer has always started from. They are offered to
 * everybody rather than rolled per player: what a first partner is
 * should be a choice somebody makes rather than a die the game throws
 * for them
 */
export const STARTER_SPECIES: Species[] = [Species.Bulbasaur, Species.Charmander, Species.Squirtle];

/**
 * Which gifts these are, and the ids of the rows that hold them. They
 * are
 * named rather than keyed by the player: an open offer has no player
 * to key by, and a name is what makes a second offering of the same
 * thing impossible
 */
function starterGiftId(species: Species): string {
  return `starter-${species}`;
}

const STARTER_BALL_GIFT = 'starterBalls';

/**
 * A personal gift's id, "{gift}:{uid}". The client names the
 * gift and the server names the player, so nobody can ask for
 * somebody else's
 */
export function giftId(gift: string, uid: string): string {
  return `${gift}:${uid}`;
}

/**
 * One gift, ready to be written down
 */
export interface Offer {
  /** The id of the row it goes in, and what the gift calls itself */
  id: string;
  gift: MysteryGift;
  encounter: EncounterRecord | null;
}

/**
 * Put a giving on the shelf, all of it or none of it.
 *
 * The rows are read and written in one transaction, so two tabs
 * signing in together cannot both find nothing there and both offer
 * it. Resolves false when any part of the giving already exists,
 * which is the ordinary answer for anybody who has played before
 */
export async function offer(player: string | null, offers: Offer[], now: number): Promise<boolean> {
  return tx(async (transaction) => {
    const stored = await transaction`
      select 1 from gifts where id = any(${offers.map(({ id }) => id)})
    `;

    if (stored.length > 0) {
      return false;
    }
    for (const entry of offers) {
      await transaction`
        insert into gifts (id, player, offered_at, gift, encounter)
        values (${entry.id}, ${player}, ${now},
                ${jsonOf(transaction, entry.gift)},
                ${entry.encounter == null ? null : jsonOf(transaction, entry.encounter)})
      `;
    }
    return true;
  });
}

/**
 * The chunk a gift's rolls are drawn against.
 *
 * A fateful meeting happened at no coordinate anybody walked to, and
 * what a gift says about *where* is a name rather than a place on the
 * map — so the chunk is only a seed, and it is the same one every
 * time. The window is the world's own, in UTC, so one offer is one
 * meeting however many people take it
 */
const GIFT_CHUNK = 0;

function giftPlace(now: number): ChunkSnapshot {
  return new ChunkSnapshot(
    getWorld().getChunk(GIFT_CHUNK, GIFT_CHUNK),
    Math.floor(now / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL,
    0,
  );
}

/**
 * The gift encounter: the one meeting a gifted pokemon stands for,
 * rolled when the gift is written down.
 *
 * `observer` is who it is rolled for — the player for a gift addressed
 * to one, and the gift's own id for one anybody may take.
 *
 * Whatever was asked for by hand is written over the roll afterwards
 * rather than rolled for. **Shininess included**: everywhere else a
 * coat is the observer's id against the trait value, and a gift is the
 * one pokemon whose coat was decided by whoever wrote it — searching
 * for a roll that happened to agree would be a search for nothing
 */
function rollGift(observer: string, gift: CatchGift | EncounterGift, now: number): EncounterRecord {
  const rng = new AleaRNG(`${observer}:${gift.id}`);
  const rolled = deriveEncounter(
    giftPlace(now),
    [gift.species, rng.int32(), rng.int32()],
    observer,
    // Fateful is what the record already calls a pokemon distributed
    // rather than met, and the level is fixed so a gift cannot be
    // rerolled into a better one. It comes from `Beyond` because
    // nobody met it in a chunk
    { type: EncounterType.Fateful, level: gift.level, biome: Biome.Beyond },
  );

  return {
    ...rolled,
    shiny: gift.shiny,
    shadow: gift.shadow,
    // What the gift says about where and about room travels with the
    // meeting, so a pokemon caught out of one keeps both
    place: gift.place,
    slots: gift.slots,
    gender: gift.gender ?? rolled.gender,
    nature: gift.nature ?? rolled.nature,
    ivs: gift.ivs ?? rolled.ivs,
    ability: gift.abilities[0] ?? rolled.ability,
    // The whole list where a gift named one, so a pokemon written with
    // two abilities keeps both
    abilities: gift.abilities.length > 0 ? gift.abilities : [rolled.ability],
    moves: gift.moves.length > 0 ? gift.moves : rolled.moves,
    items: gift.items.length > 0 ? gift.items : rolled.items,
    spawn: gift.id,
    // Stamped with the taker when the gift is claimed; an offer
    // waiting on every shelf at once belongs to nobody yet
    player: '',
  };
}

/**
 * Put the three starters on every shelf, with the balls to throw at
 * the next one.
 *
 * They are open offers rather than a roll per player: what a first
 * partner is should be a choice, and the same three should be waiting
 * for everybody. The write is all-or-none and refused once the rows
 * exist, so the first player to ask is what creates them and every
 * later ask is a read
 */
async function ensureStarterGifts(now: number): Promise<void> {
  const offers: Offer[] = STARTER_SPECIES.map((species) => {
    const id = starterGiftId(species);
    const gift: CatchGift = {
      kind: GiftKind.Catch,
      id,
      reason: 'A first partner, for a trainer with none.',
      expiresAt: null,
      species,
      level: STARTER_LEVEL,
      shiny: false,
      shadow: false,
      // Filled in from the roll below, which is what every taker of
      // this offer receives
      individualValue: 0,
      traitValue: 0,
      gender: null,
      nature: null,
      ivs: null,
      abilities: [],
      moves: [],
      items: [],
      // Nowhere in particular: a starter is set aside rather than met
      place: '',
      slots: defaultSlots(),
      ball: Balls.PokeBall,
      owner: '',
    };
    const encounter = rollGift(id, gift, now);

    return {
      id,
      gift: {
        ...gift,
        individualValue: encounter.individualValue,
        traitValue: encounter.traitValue,
      },
      encounter,
    };
  });

  await offer(
    null,
    [
      ...offers,
      {
        id: STARTER_BALL_GIFT,
        gift: {
          kind: GiftKind.Item,
          id: STARTER_BALL_GIFT,
          reason: 'Something to throw at the next one.',
          expiresAt: null,
          item: Items.PokeBall,
          amount: STARTER_BALLS,
        },
        encounter: null,
      },
    ],
    now,
  );
}

/**
 * A gift the staff wrote by hand, before it is written down.
 *
 * `player` is a uid, or null for one anybody may take. Everything
 * about the pokemon beyond the species and the level is optional: what
 * is left out is whatever the roll produced, which is what every gift
 * the game gives itself does
 */
export interface StaffGiftCommon {
  reason: string;
  /** Whose it is, or null for an offer that stands on every shelf */
  player: string | null;
  /** When it stops being takeable, or null for one that waits forever */
  expiresAt: number | null;
}

export interface StaffItemGift extends StaffGiftCommon {
  kind: GiftKind.Item;
  item: Items;
  amount: number;
}

interface StaffPokemonGift extends StaffGiftCommon {
  species: Species;
  level: number;
  shiny: boolean;
  shadow: boolean;
  gender: Genders | null;
  nature: Natures | null;
  ivs: number | null;
  abilities: Abilities[];
  moves: Moves[];
  items: Items[];
  /** What the place is called, or empty for a gift that names none */
  place: string;
  /** The room it walks in with, packed */
  slots: number;
}

/** A finished record, handed over whole */
export interface StaffCatchGift extends StaffPokemonGift {
  kind: GiftKind.Catch;
  ball: Balls;
  /** Who had it before them, as a name; empty for nobody */
  owner: string;
}

/**
 * A meeting to be caught rather than a record to be handed over. It
 * names no ball: what the player throws is theirs, and the record ends
 * up saying so
 */
export interface StaffEncounterGift extends StaffPokemonGift {
  kind: GiftKind.Encounter;
}

export type StaffGift = StaffItemGift | StaffCatchGift | StaffEncounterGift;

/**
 * Put a gift on a shelf by hand.
 *
 * This is the dashboard's, and it is the one way a gift is made that
 * the game did not decide on: what a player is owed is otherwise a
 * consequence of what they have done. A personal one is rolled and
 * frozen the moment it is offered, the way the starter is; an open one
 * holds no pokemon of its own, since the person who will take it is
 * not known yet.
 *
 * Resolves false when a gift of that id is already on the shelf
 */
export async function giveGift(spec: StaffGift, now: number): Promise<boolean> {
  const name = `staff-${now.toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  const id = spec.player == null ? name : giftId(name, spec.player);

  if (spec.kind === GiftKind.Item) {
    return offer(
      spec.player,
      [
        {
          id,
          gift: {
            kind: GiftKind.Item,
            id,
            reason: spec.reason,
            expiresAt: spec.expiresAt,
            item: spec.item,
            amount: spec.amount,
          },
          encounter: null,
        },
      ],
      now,
    );
  }

  const pokemon = {
    id,
    reason: spec.reason,
    expiresAt: spec.expiresAt,
    species: spec.species,
    level: spec.level,
    shiny: spec.shiny,
    shadow: spec.shadow,
    // Nobody has rolled it yet: the rolls below are written back onto
    // the gift once the meeting exists
    individualValue: 0,
    traitValue: 0,
    gender: spec.gender,
    nature: spec.nature,
    ivs: spec.ivs,
    abilities: spec.abilities,
    moves: spec.moves,
    items: spec.items,
    place: spec.place,
    slots: spec.slots,
  };
  const gift: CatchGift | EncounterGift =
    spec.kind === GiftKind.Catch
      ? { ...pokemon, kind: GiftKind.Catch, ball: spec.ball, owner: spec.owner }
      : { ...pokemon, kind: GiftKind.Encounter };

  // Rolled for the player it is for, or against the gift's own id when
  // it is for everybody: one meeting has to be settled on before it
  // goes on the shelf
  const encounter = rollGift(spec.player ?? id, gift, now);

  return offer(
    spec.player,
    [
      {
        id,
        gift: {
          ...gift,
          individualValue: encounter.individualValue,
          traitValue: encounter.traitValue,
        },
        encounter,
      },
    ],
    now,
  );
}

/** Whether a gift has stopped being takeable */
function expired(gift: MysteryGift, now: number): boolean {
  return gift.expiresAt != null && gift.expiresAt <= now;
}

/**
 * Everything waiting for a player, offering first whatever they have
 * become owed: their own shelf and every open gift, minus what they
 * have already taken and whatever has run out.
 *
 * Resolves empty far more often than not, which is the ordinary case —
 * a player who has taken their gifts is owed nothing
 */
export async function listMysteryGifts(uid: string, now: number): Promise<MysteryGift[]> {
  await ensureStarterGifts(now);

  // Theirs or nobody's, in one ask: the disjunction the old store
  // answered with two queries is one WHERE here, and the claims come
  // off in the same statement
  const rows = await getSql()`
    select g.id, g.player, g.offered_at, g.gift, g.encounter
    from gifts g
    where (g.player = ${uid} or g.player is null)
      and not exists (
        select 1 from gift_claims c where c.gift_id = g.id and c.player = ${uid}
      )
  `;
  const standing = rows
    .map((entry) => {
      const row = asRecord(entry);

      return {
        id: asString(row.id),
        record: asGiftRecord({
          player: row.player,
          gift: row.gift,
          offeredAt: row.offered_at,
          encounter: row.encounter,
        }),
      };
    })
    .filter(({ record }) => !expired(record.gift, now));

  return standing.map(({ record }) => asShown(record));
}

/**
 * The gift as the shelf draws it: whatever the meeting actually rolled
 * rather than what was asked for.
 *
 * A gift is written with the fields somebody set and nulls for the
 * rest, and the rolls fill the rest in — so a card built from the
 * offer alone would show "whatever it rolls" where the pokemon has
 * long since been decided. The stored meeting is the answer, and it
 * has existed since the gift was written
 */
function asShown(record: GiftRecord): MysteryGift {
  const { gift, encounter } = record;

  if (gift.kind === GiftKind.Item || encounter == null) {
    return gift;
  }
  return {
    ...gift,
    shiny: encounter.shiny,
    individualValue: encounter.individualValue,
    traitValue: encounter.traitValue,
    gender: encounter.gender,
    nature: encounter.nature,
    ivs: encounter.ivs,
    abilities: encounter.abilities ?? [encounter.ability],
    moves: encounter.moves,
    items: encounter.items,
  };
}

/**
 * One line of the dashboard's ledger: a gift as it was offered,
 * whoever it was for, however it has moved since
 */
export interface GiftLedgerRow {
  gift: MysteryGift;
  /** Who it was for, as a nickname (or uid); null for everybody */
  recipient: string | null;
  offeredAt: number;
  /** How many players have taken it */
  claims: number;
  expired: boolean;
}

/**
 * Every gift ever written, newest first, for the dashboard: the
 * player's shelf hides what they have taken and what has run out,
 * and this hides nothing
 */
export async function listAllGifts(now: number): Promise<GiftLedgerRow[]> {
  const rows = await getSql()`
    select g.player, g.offered_at, g.gift, g.encounter, p.nickname,
           (select count(*)::int from gift_claims c where c.gift_id = g.id) as claims
    from gifts g
    left join profiles p on p.id = g.player
    order by g.offered_at desc
  `;

  return rows.map((entry) => {
    const row = asRecord(entry);
    const record = asGiftRecord({
      player: row.player,
      gift: row.gift,
      offeredAt: row.offered_at,
      encounter: row.encounter,
    });
    // The uid stands in where the profile is gone, so the line still
    // says who it was for
    const named = typeof row.nickname === 'string' && row.nickname !== '';
    let recipient: string | null = null;

    if (record.player != null) {
      recipient = named ? asString(row.nickname) : record.player;
    }

    return {
      gift: asShown(record),
      recipient,
      offeredAt: record.offeredAt,
      claims: asNumber(row.claims),
      expired: expired(record.gift, now),
    };
  });
}

/**
 * What taking one left behind: the gift itself, and — for a pokemon —
 * the record it landed in, so the sheet can be opened on it
 */
export interface GiftClaim {
  gift: MysteryGift;
  catchId: string | null;
  /**
   * The meeting now standing in front of them, for a gift that is one;
   * null for everything handed over outright
   */
  encounter: EncounterRecord | null;
}

/**
 * Put a gift's meeting where the game keeps meetings, so the safari
 * opens on it the way it opens on anything else. Left alone if it is
 * already there: a second claim cannot happen, but a retry can
 */
async function stageGiftEncounter(
  uid: string,
  gift: string,
  encounter: EncounterRecord,
): Promise<void> {
  // Idempotent by key: a second staging of the same gift writes
  // nothing, so a retry cannot re-roll or double-count
  const staged = await tx(async (transaction) => {
    const rows = await transaction`
      select 1 from encounters where spawn_id = ${gift} and player = ${uid}
    `;

    if (rows.length > 0) {
      return false;
    }
    await writeEncounter(transaction, encounter);
    return true;
  });

  if (staged) {
    // Met, whatever becomes of the meeting: the dex counts what a
    // player has laid eyes on
    await recordSeenSpecies(uid, encounter.species, encounter.shiny);
  }
}

/**
 * Take one gift.
 *
 * The claim is written before anything is handed over, so a second
 * press or a second tab finds it already taken rather than being paid
 * twice. Resolves null for a gift that is somebody else's, was never
 * offered, has run out, or has already been taken by this player
 */
export async function claimMysteryGift(
  uid: string,
  gift: string,
  now: number,
  offset: number,
  locale: string,
): Promise<GiftClaim | null> {
  const taken = await tx(async (transaction) => {
    const rows = await transaction`
      select player, gift, offered_at, encounter from gifts where id = ${gift}
    `;

    if (rows.at(0) == null) {
      return null;
    }

    const found = asRecord(rows[0]);
    const record = asGiftRecord({
      player: found.player,
      gift: found.gift,
      offeredAt: found.offered_at,
      encounter: found.encounter,
    });

    if ((record.player != null && record.player !== uid) || expired(record.gift, now)) {
      return null;
    }

    // The claim is the whole race: written before anything is handed
    // over, and a second press finds the row already there
    const claimed = await transaction`
      insert into gift_claims (gift_id, player, claimed_at, catch_id)
      values (${gift}, ${uid}, ${now}, null)
      on conflict do nothing
    `;

    return claimed.count > 0 ? record : null;
  });

  if (taken == null) {
    return null;
  }

  if (taken.gift.kind === GiftKind.Item) {
    await grantItem(uid, taken.gift.item, taken.gift.amount);
    return { gift: taken.gift, catchId: null, encounter: null };
  }

  // The meeting was rolled when the gift was written, so what is
  // handed over is what the shelf showed — the taker's name is the
  // only part of it that was not known then
  const stored = taken.encounter;

  if (stored == null) {
    return null;
  }

  const encounter = { ...stored, player: uid };

  // A meeting is staged rather than handed over: it goes where every
  // other encounter goes, and the player throws their own ball at it.
  // Nothing about it can go wrong for them — a Fateful meeting never
  // bolts and never breaks out — so the gift is spent the moment it is
  // put in front of them
  if (taken.gift.kind === GiftKind.Encounter) {
    await stageGiftEncounter(uid, taken.gift.id, encounter);
    return { gift: taken.gift, catchId: null, encounter };
  }

  const catchId = await writeCaughtRecord(
    uid,
    encounter,
    taken.gift.ball,
    Acquisition.Gift,
    now,
    offset,
    locale,
    taken.gift.owner,
  );

  // The claim says which record it became, so what a player was given
  // can be followed to what they now own
  await getSql()`
    update gift_claims set catch_id = ${catchId}
    where gift_id = ${gift} and player = ${uid}
  `;
  return { gift: taken.gift, catchId, encounter: null };
}
