import { type JSX, type Resource, Show, Suspense, createResource, createSignal } from 'solid-js';
import { type CatchGift, GiftKind, type ItemGift, type MysteryGift } from '../../auth/gift-record';
import { claimMysteryGift, listMysteryGifts } from '../../auth/gifts';
import getSigil from '../../data/constants/sigil';
import { getSpeciesData } from '../../data/species';
import CatchBox, { type BoxEntry } from '../catches/CatchBox';
import ItemGrid from '../items/ItemGrid';
import { describeItem } from '../details';
import { useGame } from '../app/game-context';
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
function describeGiven(gift: CatchGift): string {
  return `Lv. ${gift.level} ${getSpeciesData(gift.species).name}${gift.shiny ? ' ✦' : ''}`;
}

function describeGift(gift: MysteryGift): string {
  return gift.kind === GiftKind.Item
    ? `${gift.amount} × ${describeItem(gift.item)}`
    : describeGiven(gift);
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
 * A waiting pokemon as a square of the box. It has no record yet — the
 * record is what claiming it writes — so what is drawn comes off the
 * gift itself
 */
function asSquare(gift: CatchGift): BoxEntry {
  return {
    id: gift.id,
    species: gift.species,
    shiny: gift.shiny,
    egg: false,
    progress: 0,
    fainted: false,
    label: `Claim ${describeGiven(gift)}`,
  };
}

/**
 * The shelf itself, which is where the gifts are read.
 *
 * A list read in the body that declared it throws past every
 * `Suspense` written there and lands on the boundary around the whole
 * page, so the reading half is its own component
 */
function GiftShelf(props: { owed: Resource<MysteryGift[]>; onClaimed: () => void }): JSX.Element {
  const game = useGame();
  const toast = useToast();
  /**
   * Which gift is being taken, or null when none is. One at a time:
   * every button on the shelf goes dead while a claim is in the air,
   * since the shelf is about to be read again anyway
   */
  const [taking, setTaking] = createSignal<string | null>(null);

  const gifts = (): MysteryGift[] => props.owed() ?? [];
  const pokemon = (): CatchGift[] =>
    gifts().filter((gift): gift is CatchGift => gift.kind === GiftKind.Catch);
  const things = (): ItemGift[] =>
    gifts().filter((gift): gift is ItemGift => gift.kind === GiftKind.Item);

  const found = (id: string): CatchGift | undefined => pokemon().find((gift) => gift.id === id);

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
          <CatchBox
            entries={pokemon().map(asSquare)}
            // The square is a picture; the card over it holds the one
            // button, so a stray press cannot take a gift
            cardOnly
            cell={(entry) => (
              <HoverCard
                class="block size-full"
                trigger={<span class="block size-full" />}
                title="Gift"
                footer={
                  <Button
                    tone="primary"
                    disabled={taking() != null}
                    onClick={() => {
                      take(entry().id);
                    }}
                  >
                    Claim
                  </Button>
                }
              >
                <Show when={found(entry().id)}>
                  {(gift) => (
                    <div class="flex flex-col gap-1">
                      <span class="font-semibold">{describeGiven(gift())}</span>
                      {/* The mark it will be known by: two of the same
                            species with the same sigil are the same
                            individual */}
                      <Meta class="font-mono tracking-[0.2em]">
                        {getSigil(gift().individualValue, gift().traitValue)}
                      </Meta>
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
              said: `Claim ${describeGift(gift)}`,
              card: <Meta>{gift.reason}</Meta>,
              footer: (
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
export default function GiftsTab(): JSX.Element {
  const [owed, { refetch }] = createResource(listMysteryGifts);

  return (
    <Suspense fallback={looking()}>
      <GiftShelf
        owed={owed}
        onClaimed={() => {
          Promise.resolve(refetch()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
