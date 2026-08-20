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
import { claimMysteryGift, listMysteryGifts } from '../../auth/gifts';
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
import { Button, DialogSection, HoverCard, Meta, Note, type ToastTone, useToast } from '../styled';

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
  owed: Resource<MysteryGift[]>;
  viewOnly?: boolean;
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

  const gifts = (): MysteryGift[] => props.owed() ?? [];
  const pokemon = (): (CatchGift | EncounterGift)[] =>
    gifts().filter((gift): gift is CatchGift | EncounterGift => gift.kind !== GiftKind.Item);
  const things = (): ItemGift[] =>
    gifts().filter((gift): gift is ItemGift => gift.kind === GiftKind.Item);

  const found = (id: string): CatchGift | EncounterGift | undefined =>
    pokemon().find((gift) => gift.id === id);

  // Read as the records they would become, so the grid's search speaks
  // the same syntax as every other box of squares
  const squares = createMemo<CatchGridEntry[]>(() =>
    pokemon().map((gift) => ({ square: asSquare(gift), caught: asPreview(gift) })),
  );

  const say = (message: string, tone: ToastTone): void => {
    toast.push({ message, tone });
  };

  const take = (gift: string): void => {
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
      <Show when={gifts().length === 0}>
        <Note class="text-center">Nothing is waiting for you.</Note>
      </Show>

      <Show when={pokemon().length > 0}>
        <DialogSection title="Pokemon">
          <CatchGrid
            entries={squares()}
            // The square is a picture; the card over it holds the one
            // button, so a stray press cannot take a gift
            cardOnly
            cell={(entry) => (
              <HoverCard
                class="block size-full"
                trigger={<span class="block size-full" />}
                title="Gift"
                footer={
                  <Show when={props.viewOnly !== true && found(entry().id)}>
                    {(gift) => (
                      <Button
                        tone="primary"
                        disabled={taking() != null}
                        onClick={() => {
                          take(entry().id);
                        }}
                      >
                        {verbFor(gift())}
                      </Button>
                    )}
                  </Show>
                }
              >
                <Show when={found(entry().id)}>
                  {(gift) => (
                    <div class="flex flex-col gap-1.5">
                      {/* The box's own card, reading the gift as the
                          record it is about to become: the same sigil,
                          stars, moves and held items a pokemon in the
                          box is read by */}
                      <CatchCard caught={asPreview(gift())} />
                      <Meta>{gift().reason}</Meta>
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
            cardOnly
            entries={things().map((gift) => ({
              item: gift.item,
              amount: gift.amount,
              said: `${props.viewOnly === true ? '' : 'Claim '}${describeGift(gift)}`,
              card: () => <Meta>{gift.reason}</Meta>,
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
}

export default function GiftsTab(props: GiftsTabProps): JSX.Element {
  const [owed, { refetch }] = createResource(listMysteryGifts);

  return (
    <Suspense fallback={looking()}>
      <GiftShelf
        owed={owed}
        viewOnly={props.viewOnly}
        onClaimed={() => {
          Promise.resolve(refetch()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
