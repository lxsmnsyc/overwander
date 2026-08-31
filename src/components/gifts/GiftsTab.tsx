import {
  type JSX,
  type Resource,
  Show,
  Suspense,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import {
  type CatchGift,
  type EncounterGift,
  GiftKind,
  type ItemGift,
  type MysteryGift,
} from '../../auth/gift-record';
import { GameDialog, useGame } from '../app/game-context';
import { type GiftLedgerRow, listAllGifts } from '../../auth/admin';
import { claimMysteryGift, listMysteryGifts } from '../../auth/gifts';
import matchesGift, { GIFT_VOCABULARY, type GiftContext, orderGifts } from '../../auth/gift-search';
import type { CaughtPokemon } from '../../auth/caught';
import { BASE_FRIENDSHIP } from '../../data/constants/friendship';
import { createStatsField } from '../../data/constants/stats';
import Biome from '../../data/ids/biome';
import { Balls } from '../../data/ids/items';
import Natures from '../../data/ids/natures';
import { Genders } from '../../data/ids/species';
import { EncounterType } from '../../overworld/encounter';
import { getMaxHealth } from '../../auth/health';
import { getSpeciesData } from '../../data/species';
import CatchCard from '../catches/CatchCard';
import type { BoxEntry } from '../catches/CatchBox';
import CatchGrid, { type CatchGridEntry } from '../catches/CatchGrid';
import ItemGrid from '../items/ItemGrid';
import { describeItem } from '../details';
import {
  Button,
  DialogSection,
  HoverCard,
  Meta,
  Note,
  Search,
  type ToastTone,
  useToast,
} from '../styled';

/**
 * What the game is holding for the player, and the taking of it.
 *
 * A gift is not news to be acknowledged: it is something waiting on a
 * shelf until somebody comes for it. So it is a shelf — the box of
 * squares for pokemon and the tray of pictures for everything else,
 * the same two the collection and the bag are read in — and the card
 * over a square is where the taking happens.
 */

/**
 * What a gifted pokemon is, written the way it is written everywhere
 * else: the level, the name, and the star that says it sparkles
 */
function describeGiven(gift: CatchGift | EncounterGift): string {
  return `Lv. ${gift.level} ${getSpeciesData(gift.species).name}${gift.shiny ? ' ✦' : ''}`;
}

function describeGift(gift: MysteryGift): string {
  return gift.kind === GiftKind.Item
    ? `${gift.amount} × ${describeItem(gift.item)}`
    : describeGiven(gift);
}

/**
 * A gift as the shelf holds it. The note is the dashboard's extra
 * line, absent when a player is reading their own shelf
 */
interface ShelfRow {
  gift: MysteryGift;
  note?: string;
  /** What the ledger knows beyond the gift itself, for the box that narrows it */
  context?: GiftContext;
}

function takenTimes(claims: number): string {
  if (claims === 0) {
    return 'not taken yet';
  }
  return claims === 1 ? 'taken once' : `taken ${claims} times`;
}

/** The ledger's line: whose it is, and how it has moved since */
function describeLedger(row: GiftLedgerRow): string {
  const parts = [
    row.recipient == null ? 'For everybody' : `For ${row.recipient}`,
    takenTimes(row.claims),
  ];

  if (row.expired) {
    parts.push('expired');
  }
  return parts.join(' · ');
}

/**
 * What the button on a square says. A meeting is not handed over: it
 * is put in front of the player, and the ball is theirs to throw
 */
function verbFor(gift: CatchGift | EncounterGift): string {
  return gift.kind === GiftKind.Encounter ? 'Meet' : 'Claim';
}

/**
 * What stands in the shelf's place while it is being read. The
 * boundary and the first read both show it, and only one of them can
 * be on screen at a time
 */
function looking(): JSX.Element {
  return <Note class="text-center">Looking…</Note>;
}

/**
 * The waiting pokemon written as a record, so the card that reads a
 * catch can read a gift.
 *
 * Everything on a gift's card is a fact about the individual — the
 * sigil, the nature, the stars, what it knows and what it carries —
 * and the box already has a card that says all of it. The fields
 * below that a gift has no answer for are what a fresh catch has:
 * nothing spent, nothing fought, nobody's yet
 */
function asPreview(gift: CatchGift | EncounterGift): CaughtPokemon {
  const values = createStatsField();
  const preview = {
    owner: '',
    type: EncounterType.Fateful,
    species: gift.species,
    nickname: '',
    level: gift.level,
    individualValue: gift.individualValue,
    traitValue: gift.traitValue,
    ivs: gift.ivs ?? gift.individualValue,
    gender: gift.gender ?? Genders.Genderless,
    nature: gift.nature ?? Natures.Hardy,
    shiny: gift.shiny,
    shadow: false,
    egg: false,
    favorite: false,
    guarded: false,
    traded: false,
    tradedAs: null,
    tradedFor: null,
    auctionable: false,
    moves: gift.moves,
    movePoints: {},
    abilities: gift.abilities,
    slots: gift.slots,
    items: gift.items,
    history: [],
    lockedAt: 0,
    steps: 0,
    hatchSteps: 0,
    steppedAt: 0,
    statuses: 0,
    lair: null,
    ball: gift.kind === GiftKind.Catch ? gift.ball : Balls.PokeBall,
    caughtAt: '',
    locale: '',
    effortValues: values,
    effortBonus: 0,
    walked: 0,
    friendship: BASE_FRIENDSHIP,
    origin: { timestamp: 0, x: 0, y: 0, biome: Biome.Beyond, place: gift.place },
  };

  // Whole, because nothing has happened to it yet
  return { ...preview, health: getMaxHealth(preview) };
}

/**
 * A waiting pokemon as a square of the box. It has no record yet — the
 * record is what claiming it writes — so what is drawn comes off the
 * gift itself
 */
function asSquare(gift: CatchGift | EncounterGift): BoxEntry {
  return {
    id: gift.id,
    species: gift.species,
    shiny: gift.shiny,
    egg: false,
    progress: 0,
    fainted: false,
    label: `${verbFor(gift)} ${describeGiven(gift)}`,
  };
}

/**
 * The shelf itself, which is where the gifts are read.
 *
 * A list read in the body that declared it throws past every
 * `Suspense` written there and lands on the boundary around the whole
 * page, so the reading half is its own component
 */
function GiftShelf(props: {
  owed: Resource<ShelfRow[]>;
  viewOnly?: boolean;
  /** Whether this is the dashboard's ledger rather than a shelf */
  everything?: boolean;
  onClaimed: () => void;
}): JSX.Element {
  const game = useGame();
  const toast = useToast();
  /**
   * Which gift is being taken, or null when none is. One at a time:
   * every button on the shelf goes dead while a claim is in the air,
   * since the shelf is about to be read again anyway
   */
  const [taking, setTaking] = createSignal<string | null>(null);
  /**
   * What the ledger's box has been asked. A player's own shelf holds a
   * handful of things and narrows nothing; the ledger is every gift
   * ever written by hand
   */
  const [query, setQuery] = createSignal('');

  const offered = (): ShelfRow[] => props.owed() ?? [];
  const gifts = createMemo<ShelfRow[]>(() => {
    if (props.everything !== true) {
      return offered();
    }
    return orderGifts(
      offered().filter((row) => matchesGift(row.gift, query(), row.context)),
      query(),
      (row) => ({ gift: row.gift, context: row.context }),
    );
  });
  const pokemon = (): (ShelfRow & { gift: CatchGift | EncounterGift })[] =>
    gifts().filter(
      (row): row is ShelfRow & { gift: CatchGift | EncounterGift } =>
        row.gift.kind !== GiftKind.Item,
    );
  const things = (): (ShelfRow & { gift: ItemGift })[] =>
    gifts().filter((row): row is ShelfRow & { gift: ItemGift } => row.gift.kind === GiftKind.Item);

  const found = (id: string): (ShelfRow & { gift: CatchGift | EncounterGift }) | undefined =>
    pokemon().find((row) => row.gift.id === id);

  // Read as the records they would become, so the grid's search speaks
  // the same syntax as every other box of squares
  const squares = createMemo<CatchGridEntry[]>(() =>
    pokemon().map(({ gift }) => ({ square: asSquare(gift), caught: asPreview(gift) })),
  );

  /**
   * What an empty list says. A ledger narrowed to nothing has to say so
   * rather than read as a game nobody has ever given anything
   */
  const emptily = (): string => {
    if (props.everything !== true) {
      return 'Nothing is waiting for you.';
    }
    return query().length === 0 ? 'Nothing has been offered yet.' : 'No gift matches that.';
  };

  const say = (message: string, tone: ToastTone): void => {
    toast.push({ message, tone });
  };

  const take = (gift: string): void => {
    // One at a time: the buttons grey out, but a square press arrives
    // through no button
    if (taking() != null) {
      return;
    }
    setTaking(gift);
    claimMysteryGift(gift)
      .then((claimed) => {
        if (claimed == null) {
          say('That gift is no longer waiting.', 'ember');
          return;
        }
        // A meeting is not received: it is standing there, and the
        // shelf gets out of the way so the player can throw at it
        if (claimed.encounter != null) {
          say(`${describeGift(claimed.gift)} is waiting for you.`, 'leaf');
          game.setDialog(GameDialog.None);
          game.setEncounter(claimed.encounter);
          return;
        }
        say(`Received ${describeGift(claimed.gift)}.`, 'leaf');
        // A pokemon out of a gift is a new record, and the box behind
        // this panel is showing the old list
        game.touchRecords();
      })
      .catch(() => {
        say('That gift could not be taken.', 'ember');
      })
      .finally(() => {
        setTaking(null);
        props.onClaimed();
      });
  };

  return (
    <div class="flex flex-col gap-4">
      {/* One box over both sections, the way the auction board narrows
          its two trays with one: a gift is looked for by who it went
          to and whether anybody came for it, neither of which is a
          fact about the pokemon on the square */}
      <Show when={props.everything}>
        <Search
          vocabulary={GIFT_VOCABULARY}
          example="is:waiting"
          placeholder="Name, or for:red is:waiting"
          value={query()}
          onChange={(value) => {
            setQuery(value);
          }}
        />
      </Show>

      <Show when={gifts().length === 0}>
        <Note class="text-center">{emptily()}</Note>
      </Show>

      <Show when={pokemon().length > 0}>
        <DialogSection title="Pokemon">
          <CatchGrid
            entries={squares()}
            // The ledger has a box of its own above both sections
            bare={props.everything === true}
            // The card carries one button, so the square presses it
            // too; a visited shelf has nothing to press anywhere
            cardOnly={props.viewOnly === true}
            onOpen={props.viewOnly === true ? undefined : take}
            cell={(entry) => (
              <HoverCard
                class="block size-full"
                trigger={<span class="block size-full" />}
                title="Gift"
                footer={
                  <Show when={props.viewOnly !== true && found(entry().id)}>
                    {(row) => (
                      <Button
                        tone="primary"
                        disabled={taking() != null}
                        onClick={() => {
                          take(entry().id);
                        }}
                      >
                        {verbFor(row().gift)}
                      </Button>
                    )}
                  </Show>
                }
              >
                <Show when={found(entry().id)}>
                  {(row) => (
                    <div class="flex flex-col gap-1.5">
                      {/* The box's own card, reading the gift as the
                          record it is about to become: the same sigil,
                          stars, moves and held items a pokemon in the
                          box is read by */}
                      <CatchCard caught={asPreview(row().gift)} />
                      <Meta>{row().gift.reason}</Meta>
                      <Show when={row().note}>{(said) => <Meta>{said()}</Meta>}</Show>
                    </div>
                  )}
                </Show>
              </HoverCard>
            )}
          />
        </DialogSection>
      </Show>

      <Show when={things().length > 0}>
        <DialogSection title="Items">
          <ItemGrid
            bare
            // The card carries one button, so the square presses it
            // too; a visited tray has nothing to press anywhere
            cardOnly={props.viewOnly === true}
            entries={things().map(({ gift, note }) => ({
              item: gift.item,
              amount: gift.amount,
              said: `${props.viewOnly === true ? '' : 'Claim '}${describeGift(gift)}`,
              onPress:
                props.viewOnly === true
                  ? undefined
                  : () => {
                      take(gift.id);
                    },
              card: () => (
                <>
                  <Meta>{gift.reason}</Meta>
                  <Show when={note}>{(said) => <Meta>{said()}</Meta>}</Show>
                </>
              ),
              footer: () =>
                props.viewOnly === true ? (
                  <></>
                ) : (
                  <Button
                    tone="primary"
                    disabled={taking() != null}
                    onClick={() => {
                      take(gift.id);
                    }}
                  >
                    Claim
                  </Button>
                ),
            }))}
          />
        </DialogSection>
      </Show>
    </div>
  );
}

/**
 * What the game is holding for the player. The shelf is read one
 * component down, under this boundary, so a shelf still arriving
 * replaces itself rather than the page it is standing on
 */
export interface GiftsTabProps {
  /**
   * Whether the shelf is being read rather than taken from. The
   * dashboard shows it that way: a gift is taken in the world — a
   * meeting has to be stood in front of somebody who is standing
   * somewhere — so a button here would be one that led nowhere
   */
  viewOnly?: boolean;
  /**
   * The dashboard's ledger instead of the reader's shelf: every gift
   * ever written, whoever it was for, taken or not, run out or not.
   * Implies viewOnly, and is refused server-side below admin
   */
  everything?: boolean;
}

export default function GiftsTab(props: GiftsTabProps): JSX.Element {
  const [owed, { refetch }] = createResource<ShelfRow[]>(async () =>
    props.everything === true
      ? (await listAllGifts()).map((row) => ({
          gift: row.gift,
          note: describeLedger(row),
          context: {
            recipient: row.recipient,
            claims: row.claims,
            expired: row.expired,
            offeredAt: row.offeredAt,
          },
        }))
      : (await listMysteryGifts()).map((gift) => ({ gift })),
  );

  return (
    <Suspense fallback={looking()}>
      <GiftShelf
        owed={owed}
        viewOnly={props.viewOnly === true || props.everything === true}
        everything={props.everything}
        onClaimed={() => {
          Promise.resolve(refetch()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
