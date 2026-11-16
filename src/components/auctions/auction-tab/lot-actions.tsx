import { bidRefusal } from './bidding';
import { describeRemaining, describeStanding, now } from './time';
import { type AuctionRecord, isLive } from '../../../auth/auctions';
import { useGame } from '../../app/game-context';
import type { ItemAction } from '../../items/ItemGrid';
import { Button, Detail, Pill } from '../../styled';
import { type JSX, Show } from 'solid-js';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * What a lot that has stopped taking bids is waiting for: the player to
 * come and get it. A won lot is collected and an unsold one is taken
 * back, which are the same button with different words on it
 */
export interface LotClaim {
  said: string;
  label: string;
  onClaim: () => void;
}

export interface LotKit {
  player: string;
  viewOnly?: boolean;
  gold: () => number;
  describeSeller: (auction: AuctionRecord) => string;
  claimOf: (id: string, auction: AuctionRecord) => LotClaim | undefined;
  /** Opens the bid dialog for a lot */
  onBid: (id: string) => void;
}

/**
 * What a lot says and offers: the card over its square, the buttons in
 * that card, and the choices on an item's square.
 */
export default function createLotActions(kit: LotKit): {
  lotDetails: (auction: AuctionRecord) => JSX.Element;
  lotActions: (id: string, auction: AuctionRecord) => JSX.Element;
  lotChoices: (id: string, auction: AuctionRecord) => ItemAction[];
} {
  const game = useGame();
  /**
   * Whose lot it is and what it stands at, for the card that comes up
   * over a square.
   *
   * A tray of squares has nowhere to write either (a picture is what a
   * lot is recognised by, which is the whole reason the board is drawn
   * this way), so both are in the window over one, and the seller is the
   * way to their profile: what somebody else has caught and fought is
   * most of what says whether their lot is worth bidding on
   */
  const lotStateWord = (auction: AuctionRecord): string => {
    if (isLive(auction, now())) {
      return m.auction_pill_running();
    }
    return auction.bidder === '' ? m.auction_pill_unsold() : m.auction_pill_sold();
  };

  const lotDetails = (auction: AuctionRecord): JSX.Element => (
    <>
      <Pill tone={isLive(auction, now()) ? 'gold' : 'neutral'} class="self-start">
        {lotStateWord(auction)}
      </Pill>
      <Detail label={m.auction_owned_by()}>
        {auction.seller === kit.player ? m.auction_you() : kit.describeSeller(auction)}
      </Detail>
      <Detail label={m.auction_bidding()}>
        {describeStanding(auction)} · {describeRemaining(auction.endsAt, now())}
      </Detail>
    </>
  );

  const lotActions = (id: string, auction: AuctionRecord): JSX.Element => (
    <Show when={kit.viewOnly !== true}>
      <Show
        when={kit.claimOf(id, auction)}
        fallback={
          // The button asks; the dialog it asks for stands with the panel
          // rather than inside this card. A card is put away the moment
          // the pointer leaves it, and it takes whatever is mounted inside
          // it: this dialog, gone before it could be typed in
          <Show when={auction.seller !== kit.player}>
            <Button
              tone="primary"
              disabled={bidRefusal(auction, kit.player, kit.gold()) != null}
              title={bidRefusal(auction, kit.player, kit.gold()) ?? undefined}
              onClick={() => {
                kit.onBid(id);
              }}
            >
              {m.auction_bid()}
            </Button>
          </Show>
        }
      >
        {(taking) => (
          <Button tone="primary" onClick={taking().onClaim}>
            {taking().label}
          </Button>
        )}
      </Show>
    </Show>
  );

  /**
   * What can be done with one lot: look up whose it is, and bid on it
   * or collect it. Two of them on a live lot, which is what puts the
   * tray's squares under a card rather than a label
   */
  const lotChoices = (id: string, auction: AuctionRecord): ItemAction[] => {
    const choices: ItemAction[] = [];

    // A board is where a seller worth trading with again is found, so
    // whose it is presses
    if (auction.seller !== kit.player) {
      choices.push({
        label: kit.describeSeller(auction),
        onPress: () => {
          game.setVisiting(auction.seller);
        },
      });
    }
    if (kit.viewOnly === true) {
      return choices;
    }

    const taking = kit.claimOf(id, auction);

    if (taking != null) {
      choices.push({ label: taking.label, tone: 'primary', onPress: taking.onClaim });
      return choices;
    }
    if (auction.seller === kit.player) {
      return choices;
    }
    const refusal = bidRefusal(auction, kit.player, kit.gold());

    // The button asks; the dialog it asks for stands with the panel
    // rather than inside the tray, which is put away the moment the
    // pointer leaves it
    choices.push({
      label: m.auction_bid(),
      tone: 'primary',
      disabled: refusal != null,
      title: refusal ?? undefined,
      onPress: () => {
        kit.onBid(id);
      },
    });
    return choices;
  };

  return { lotDetails, lotActions, lotChoices };
}
