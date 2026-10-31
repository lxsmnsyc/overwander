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
} from '../../model/gift-record';
import { GameDialog, useGame } from '../app/game-context';
import { type GiftLedgerRow, listAllGifts } from '../../auth/admin';
import { claimMysteryGift, listMysteryGifts } from '../../auth/gifts';
import type { CaughtPokemon } from '../../auth/caught';
import { BASE_FRIENDSHIP } from '../../data/constants/friendship';
import { createStatsField } from '../../data/constants/stats';
import Biome from '../../data/ids/biome';
import { Balls } from '../../data/ids/items';
import Natures from '../../data/ids/natures';
import { Genders } from '../../data/ids/species';
import { EncounterType } from '../../overworld/encounter';
import { getMaxHealth } from '../../model/health';
import { getSpeciesData } from '../../data/species';
import sayItems from '../items/say-items';
import CatchCard from '../catches/CatchCard';
import type { BoxEntry } from '../catches/CatchBox';
import CatchGrid, { type CatchGridEntry } from '../catches/CatchGrid';
import ItemGrid, { type ItemCell } from '../items/ItemGrid';
import { describeItem } from '../details';
import playEffect, { Effect } from '../app/sound';
import {
  Badge,
  Button,
  HoverCard,
  Meta,
  Note,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
  type ToastTone,
  useToast,
} from '../styled';
import describeGiftReason from '../../i18n/gift-reasons';
import { m } from '../../i18n/paraglide/messages.js';

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
  const name = getSpeciesData(gift.species).name;

  return gift.shiny
    ? m.gifts_given_shiny({ level: gift.level, name })
    : m.ui_level_name({ level: gift.level, name });
}

function describeGift(gift: MysteryGift): string {
  return gift.kind === GiftKind.Item
    ? m.gifts_item_amount({ amount: gift.amount, item: describeItem(gift.item) })
    : describeGiven(gift);
}

/**
 * A gift as the shelf holds it. The note is the dashboard's extra
 * line, absent when a player is reading their own shelf
 */
interface ShelfRow {
  gift: MysteryGift;
  note?: string;
}

/** The shelf's three tabs: pokemon handed over, items, and pokemon to meet */
const enum GiftView {
  Catches = 0,
  Items = 1,
  Encounters = 2,
}

type PokemonRow = ShelfRow & { gift: CatchGift | EncounterGift };

type ItemRow = ShelfRow & { gift: ItemGift };

function isPokemonRow(row: ShelfRow): row is PokemonRow {
  return row.gift.kind !== GiftKind.Item;
}

function isItemRow(row: ShelfRow): row is ItemRow {
  return row.gift.kind === GiftKind.Item;
}

function takenTimes(claims: number): string {
  return claims === 0 ? m.gifts_ledger_not_taken() : m.gifts_ledger_taken({ count: claims });
}

/** The ledger's line: whose it is, and how it has moved since */
function describeLedger(row: GiftLedgerRow): string {
  const parts = [
    row.recipient == null
      ? m.gifts_ledger_everybody()
      : m.gifts_ledger_for({ name: row.recipient }),
    takenTimes(row.claims),
  ];

  if (row.expired) {
    parts.push(m.gifts_ledger_expired());
  }
  return parts.join(' · ');
}

/**
 * What the button on a square says. A meeting is not handed over: it
 * is put in front of the player, and the ball is theirs to throw
 */
function verbFor(gift: CatchGift | EncounterGift): string {
  return gift.kind === GiftKind.Encounter ? m.gifts_meet() : m.gifts_claim();
}

/**
 * What stands in the shelf's place while it is being read. The
 * boundary and the first read both show it, and only one of them can
 * be on screen at a time
 */
function looking(): JSX.Element {
  return <Note class="text-center">{m.ui_looking()}</Note>;
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
    canEvolve: false,
    featProgress: 0,
    gigantamax: false,
    teraType: null,
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
    box: null,
    slot: null,
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
    female: gift.gender === Genders.Female,
    egg: false,
    progress: 0,
    fainted: false,
    label:
      gift.kind === GiftKind.Encounter
        ? m.gifts_meet_label({ gift: describeGiven(gift) })
        : m.gifts_claim_label({ gift: describeGiven(gift) }),
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
  const gifts = (): ShelfRow[] => props.owed() ?? [];
  const pokemonOf = (kind: GiftKind): PokemonRow[] => {
    const rows: PokemonRow[] = [];

    for (const row of gifts()) {
      if (isPokemonRow(row) && row.gift.kind === kind) {
        rows.push(row);
      }
    }
    return rows;
  };
  const pokemon = (): PokemonRow[] => {
    const rows: PokemonRow[] = [];

    for (const row of gifts()) {
      if (isPokemonRow(row)) {
        rows.push(row);
      }
    }
    return rows;
  };
  const things = (): ItemRow[] => {
    const rows: ItemRow[] = [];

    for (const row of gifts()) {
      if (isItemRow(row)) {
        rows.push(row);
      }
    }
    return rows;
  };

  const found = (id: string): PokemonRow | undefined => {
    for (const row of pokemon()) {
      if (row.gift.id === id) {
        return row;
      }
    }
    return undefined;
  };

  /**
   * One kind of waiting pokemon as squares, read as the records they
   * would become so the grid's search speaks the same syntax as every
   * other box
   */
  const squaresOf = (kind: GiftKind): CatchGridEntry[] => {
    const entries: CatchGridEntry[] = [];

    for (const { gift } of pokemonOf(kind)) {
      entries.push({ square: asSquare(gift), caught: asPreview(gift) });
    }
    return entries;
  };
  const handed = createMemo(() => squaresOf(GiftKind.Catch));
  const meetings = createMemo(() => squaresOf(GiftKind.Encounter));

  /** What an empty tab says, which for the ledger is about everybody */
  const emptily = (offered: () => string, waiting: () => string): string =>
    props.everything === true ? offered() : waiting();

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
          say(m.gifts_gone(), 'ember');
          return;
        }
        // A meeting is not received: it is standing there, and the
        // shelf gets out of the way so the player can throw at it
        if (claimed.encounter != null) {
          say(m.gifts_meeting_waiting({ gift: describeGift(claimed.gift) }), 'leaf');
          game.setDialog(GameDialog.None);
          game.setEncounter(claimed.encounter);
          return;
        }
        // An item is drawn rather than named, the way every other
        // payout in the game says what it handed over
        if (claimed.gift.kind === GiftKind.Item) {
          sayItems(toast, [claimed.gift], m.gifts_mystery_gift());
        } else {
          say(m.gifts_received({ gift: describeGift(claimed.gift) }), 'leaf');
        }
        // A pokemon out of a gift is a new record, and the box behind
        // this panel is showing the old list
        if (claimed.gift.kind !== GiftKind.Item) {
          playEffect(Effect.PokemonGet);
        }
        game.touchRecords();
      })
      .catch(() => {
        say(m.gifts_failed(), 'ember');
      })
      .finally(() => {
        setTaking(null);
        props.onClaimed();
      });
  };

  const itemCells = (): ItemCell[] => {
    const cells: ItemCell[] = [];

    for (const { gift, note } of things()) {
      cells.push({
        item: gift.item,
        amount: gift.amount,
        said:
          props.viewOnly === true
            ? describeGift(gift)
            : m.gifts_claim_label({ gift: describeGift(gift) }),
        // Claiming is the only thing a shelf square does, so the
        // square is the button. A visited tray has none at all
        actions:
          props.viewOnly === true
            ? []
            : [
                {
                  label: m.gifts_claim(),
                  tone: 'primary' as const,
                  disabled: taking() != null,
                  onPress: () => {
                    take(gift.id);
                  },
                },
              ],
        card: () => (
          <>
            <Meta>{describeGiftReason(gift.reason)}</Meta>
            <Show when={note}>{(said) => <Meta>{said()}</Meta>}</Show>
          </>
        ),
      });
    }
    return cells;
  };

  /** A box of waiting pokemon, with the card over each square where the taking happens */
  const box = (entries: CatchGridEntry[]): JSX.Element => (
    <CatchGrid
      entries={entries}
      // The card carries one button, so the square presses it too; a
      // visited shelf has nothing to press anywhere
      cardOnly={props.viewOnly === true}
      onOpen={props.viewOnly === true ? undefined : take}
      cell={(entry) => (
        <HoverCard
          class="block size-full"
          trigger={<span class="block size-full" />}
          title={m.gifts_card_title()}
          kind={m.gifts_mystery_gift()}
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
                {/* The box's own card, reading the gift as the record
                    it is about to become */}
                <CatchCard caught={asPreview(row().gift)} />
                <Meta>{describeGiftReason(row().gift.reason)}</Meta>
                <Show when={row().note}>{(said) => <Meta>{said()}</Meta>}</Show>
              </div>
            )}
          </Show>
        </HoverCard>
      )}
    />
  );

  /** A tab's name, with how many are on it */
  const counted = (name: string, count: number): JSX.Element => (
    <>
      {name}
      <Show when={count > 0}>
        <Badge class="ml-1.5">{count}</Badge>
      </Show>
    </>
  );

  /**
   * The tab picked, or null until one is. Until then it is the first tab
   * with something on it, which is only known once the shelf has arrived
   */
  const [picked, setPicked] = createSignal<GiftView | null>(null);
  const first = (): GiftView => {
    if (handed().length > 0) {
      return GiftView.Catches;
    }
    if (things().length > 0) {
      return GiftView.Items;
    }
    return meetings().length > 0 ? GiftView.Encounters : GiftView.Catches;
  };

  return (
    <TabGroup
      horizontal
      value={picked() ?? first()}
      onChange={(value) => {
        setPicked(value);
      }}
      class="flex flex-col gap-3"
    >
      <TabBar>
        <TabButton value={GiftView.Catches}>
          {counted(m.gifts_tab_catches(), handed().length)}
        </TabButton>
        <TabButton value={GiftView.Items}>
          {counted(m.gifts_tab_items(), things().length)}
        </TabButton>
        <TabButton value={GiftView.Encounters}>
          {counted(m.gifts_tab_encounters(), meetings().length)}
        </TabButton>
      </TabBar>
      <TabPane value={GiftView.Catches}>
        <Show
          when={handed().length > 0}
          fallback={
            <Note class="text-center">
              {emptily(m.gifts_offered_pokemon, m.gifts_waiting_pokemon)}
            </Note>
          }
        >
          {box(handed())}
        </Show>
      </TabPane>
      <TabPane value={GiftView.Items}>
        <Show
          when={things().length > 0}
          fallback={
            <Note class="text-center">{emptily(m.gifts_offered_items, m.gifts_waiting_items)}</Note>
          }
        >
          <ItemGrid entries={itemCells()} />
        </Show>
      </TabPane>
      <TabPane value={GiftView.Encounters}>
        <Show
          when={meetings().length > 0}
          fallback={
            <Note class="text-center">
              {emptily(m.gifts_offered_meetings, m.gifts_waiting_meetings)}
            </Note>
          }
        >
          {box(meetings())}
        </Show>
      </TabPane>
    </TabGroup>
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
  const [owed, { refetch }] = createResource<ShelfRow[]>(async () => {
    const rows: ShelfRow[] = [];

    if (props.everything === true) {
      for (const row of await listAllGifts()) {
        rows.push({ gift: row.gift, note: describeLedger(row) });
      }
    } else {
      for (const gift of await listMysteryGifts()) {
        rows.push({ gift });
      }
    }
    return rows;
  });

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
