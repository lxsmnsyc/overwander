import { type AuctionRecord, nextBid } from '../../../auth/auctions';
import { Button, Dialog, DialogActions, Field, Meta, Row } from '../../styled';
import { type JSX, createEffect, createSignal, on } from 'solid-js';

/**
 * Why this player may not bid on a lot, or null where they may.
 *
 * All three answers used to be a thing standing where the button would
 * be — a badge reading "yours", a badge reading "winning", a line about
 * not holding enough — so the eye had to find the button again on every
 * lot. The button is always the button now; the reason rides on it, for
 * whoever stops on the one that is dead
 */
export function bidRefusal(auction: AuctionRecord, player: string, gold: number): string | null {
  // A seller may not bid on their own lot, and no purse or outbidding
  // will ever change that
  if (auction.seller === player) {
    return 'Your own lot';
  }
  // The standing bidder is already winning it: bidding against
  // themselves could only cost them gold
  if (auction.bidder === player) {
    return 'You are winning this one';
  }
  return gold >= nextBid(auction) ? null : `${nextBid(auction)} gold is more than you hold`;
}

/**
 * Naming an amount for a lot.
 *
 * A dialog rather than a number box beside every lot: a board is read at
 * a glance, and a form the length of it is one more thing to press by
 * accident and tab through on the way to anywhere else.
 *
 * It is **its own component**, opened by whoever holds the board rather
 * than by the button that asks for it. A hover card is where the button
 * lives now, and a card goes away the moment the pointer does — taking
 * anything mounted inside it, this dialog included, with it
 */
export function BidDialog(props: {
  /** The lot being bid on, or null while nobody is bidding */
  lot: AuctionRecord | null;
  gold: number;
  /**
   * What the lot is called: a player naming an amount should be able to
   * see what they are naming it for
   */
  name?: string;
  onClose: () => void;
  onBid: (amount: number) => void;
}): JSX.Element {
  const [named, setNamed] = createSignal(0);

  /**
   * The floor, for whichever lot is being bid on. Nothing is a lot that
   * cannot be bid on, and its floor is one — the dialog is shut
   */
  const floor = (): number => (props.lot == null ? 1 : nextBid(props.lot));

  /**
   * What the bid would be: what the player typed, never below the floor.
   * The floor moves whenever somebody else bids, and this moves with it
   * rather than leaving a stale number in the box
   */
  const amount = (): number => Math.max(named(), floor());

  // Opened on a fresh lot, so the box starts at what that lot actually
  // costs rather than at what the last one did — and on opening alone,
  // since a raise landing while somebody is typing should move the floor
  // under them rather than retype their bid
  createEffect(
    on(
      () => props.lot != null,
      (open) => {
        if (open) {
          setNamed(floor());
        }
      },
    ),
  );

  return (
    <Dialog
      isOpen={props.lot != null}
      onClose={props.onClose}
      title={props.name == null ? 'Bid' : `Bid on ${props.name}`}
      description="The floor is the seller's least raise. Anything from there to what you are
            holding is a legal bid, so a lot can be put out of reach in one press."
    >
      <Row class="justify-center">
        <Field label="Bid">
          <input
            type="number"
            min={floor()}
            max={props.gold}
            value={amount()}
            onInput={(event) => {
              setNamed(Number(event.currentTarget.value));
            }}
          />
        </Field>
      </Row>
      <Row class="justify-center">
        <Meta>
          {floor()} gold to take it · you hold {props.gold}
        </Meta>
      </Row>

      <DialogActions>
        <Button onClick={props.onClose}>Never mind</Button>
        <Button
          tone="primary"
          disabled={amount() > props.gold}
          onClick={() => {
            props.onBid(amount());
            props.onClose();
          }}
        >
          Bid {amount()} gold
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * What this player may do about a lot: nothing, if it is their own, and
 * otherwise a bid.
 *
 * It is the button and the dialog together, for a caller drawing rows —
 * the player's own bidding history, where the lot they were outbid on is
 * answered without going looking for it again. The board keeps the two
 * apart, since its buttons live in cards
 */
export function BidControls(props: {
  auction: AuctionRecord;
  player: string;
  gold: number;
  name?: string;
  onBid: (amount: number) => void;
}): JSX.Element {
  const [bidding, setBidding] = createSignal(false);

  const refused = (): string | null => bidRefusal(props.auction, props.player, props.gold);

  // A seller sees no button at all on their own lot: a dead button on it
  // is a control offered to the one person it will never work for
  if (props.auction.seller === props.player) {
    return null;
  }

  return (
    <>
      <Button
        tone="primary"
        disabled={refused() != null}
        title={refused() ?? undefined}
        onClick={() => {
          setBidding(true);
        }}
      >
        Bid
      </Button>
      <BidDialog
        lot={bidding() ? props.auction : null}
        gold={props.gold}
        name={props.name}
        onClose={() => {
          setBidding(false);
        }}
        onBid={props.onBid}
      />
    </>
  );
}
