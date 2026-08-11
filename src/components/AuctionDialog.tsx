import { type JSX, Show, createResource, createSignal } from 'solid-js';
import {
  AuctionLot,
  MAX_INCREMENT,
  MAX_STARTING_BID,
  MIN_INCREMENT,
  MIN_STARTING_BID,
  openCatchAuction,
  openItemAuction,
} from '../auth/auctions';
import { getCaught } from '../auth/caught';
import { isShiny } from '../auth/caught-record';
import { isEgg } from '../auth/egg';
import type { Items } from '../data/ids/items';
import { Species } from '../data/ids/species';
import { getSpeciesData } from '../data/species';
import { describeItem } from './InventoryPicker';
import SpriteDisplay from './SpriteDisplay';
import { Button, Dialog, DialogActions, Field, Meta, Note, Row, Status } from './styled';

/**
 * Putting one thing on the block — a pokemon, or a single item out of
 * the bag.
 *
 * It is a dialog of its own rather than a section of the sell card,
 * because listing is one decision made about one lot: the player
 * should be looking at the thing they are about to part with while
 * they name a price for it. That is the whole of the layout — what it
 * is, what it costs to open, and what it costs to raise.
 *
 * Submitting does not list it. It **switches to a second dialog** that
 * says what is about to happen in words, because a lot cannot be taken
 * back off the block: it goes up for a day, and comes back only if the
 * day ends with nobody having bid at all
 */

/**
 * What is being put up. It is the same shape the auction record uses
 * to say what a lot holds, so the dialog and the lot it opens are
 * describing the thing the same way
 */
export type AuctionSubject =
  | { lot: AuctionLot.Catch; catchId: string }
  | { lot: AuctionLot.Item; item: Items };

export interface AuctionDialogProps {
  /**
   * What to list, or null when the dialog is closed
   */
  subject: AuctionSubject | null;
  onClose: () => void;
  /**
   * Fired once a lot is actually open, so the board and the records
   * behind the dialog can catch up
   */
  onListed?: () => void;
}

export default function AuctionDialog(props: AuctionDialogProps): JSX.Element {
  const [asking, setAsking] = createSignal(MIN_STARTING_BID);
  const [raise, setRaise] = createSignal(MIN_INCREMENT);
  const [status, setStatus] = createSignal<string | null>(null);
  // Whether the second dialog is the one showing. The first is where
  // the terms are named; this one is where they are agreed to
  const [confirming, setConfirming] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  const [caught] = createResource(
    () => (props.subject?.lot === AuctionLot.Catch ? props.subject.catchId : null),
    getCaught,
  );

  /**
   * What is being sold, by name. An egg says only that it is one —
   * what is inside it is the buyer's to find out, and the seller's
   * dialog should not say more than the lot will
   */
  const named = (): string => {
    const subject = props.subject;

    if (subject?.lot === AuctionLot.Item) {
      return describeItem(subject.item);
    }

    const record = caught();

    if (record == null) {
      return 'This pokemon';
    }
    return isEgg(record) ? 'Egg' : getSpeciesData(record.species).name;
  };

  const sensible = (): boolean =>
    Number.isInteger(asking()) &&
    Number.isInteger(raise()) &&
    asking() >= MIN_STARTING_BID &&
    asking() <= MAX_STARTING_BID &&
    raise() >= MIN_INCREMENT &&
    raise() <= MAX_INCREMENT;

  const close = (): void => {
    setStatus(null);
    setConfirming(false);
    setBusy(false);
    props.onClose();
  };

  const list = (): void => {
    const subject = props.subject;

    if (subject == null || !sensible()) {
      return;
    }

    const terms = { startingBid: asking(), increment: raise() };

    setStatus(null);
    setBusy(true);
    (subject.lot === AuctionLot.Item
      ? openItemAuction(subject.item, terms)
      : openCatchAuction(subject.catchId, terms)
    )
      .then((id) => {
        setBusy(false);

        if (id == null) {
          // The refusal is worth reading, so the confirmation steps
          // back to the form rather than closing over it
          setConfirming(false);
          setStatus(
            subject.lot === AuctionLot.Item
              ? 'It could not be put up — you may already have an auction running, or no longer carry one.'
              : 'It could not be put up — you may already have an auction running, or it may be a favorite, an egg or your buddy.',
          );
          return;
        }
        props.onListed?.();
        close();
      })
      .catch((thrown: unknown) => {
        setBusy(false);
        setConfirming(false);
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  /**
   * What is standing on the block, drawn the size a dialog can hold.
   *
   * A pokemon is its sprite, and an egg is drawn as an egg the way it
   * is everywhere else. An **item** has no picture yet, so it is its
   * own name, set large — a placeholder for the icon that belongs
   * there, rather than an empty frame pretending to be one
   */
  const portrait = (): JSX.Element => (
    <Show
      when={props.subject?.lot !== AuctionLot.Item}
      fallback={
        <div class="flex min-h-24 items-center justify-center">
          <span class="text-center text-lg font-semibold">{named()}</span>
        </div>
      }
    >
      <Show when={caught()} fallback={<Note>Reading the record…</Note>}>
        {(record) => (
          <div class="flex justify-center">
            <SpriteDisplay
              species={isEgg(record()) ? Species.Egg : record().species}
              shiny={!isEgg(record()) && isShiny(record())}
              animation="Idle"
              direction="down"
              scale={4}
              label={named()}
            />
          </div>
        )}
      </Show>
    </Show>
  );

  return (
    <>
      {/* The terms. Both dialogs are siblings rather than one over the
          other: only ever one of them is open, so neither is fighting
          the other for the click that closes it */}
      <Dialog
        isOpen={props.subject != null && !confirming()}
        onClose={close}
        title={`Auction ${named()}`}
        description="What it opens at, and the least a bid may raise it by. A lot stands for a day."
      >
        {portrait()}

        <Row>
          <Field label="Opening bid">
            <input
              type="number"
              min={MIN_STARTING_BID}
              max={MAX_STARTING_BID}
              value={asking()}
              onInput={(event) => {
                setAsking(Number(event.currentTarget.value));
              }}
            />
          </Field>
          <Field label="Least raise">
            <input
              type="number"
              min={MIN_INCREMENT}
              max={MAX_INCREMENT}
              value={raise()}
              onInput={(event) => {
                setRaise(Number(event.currentTarget.value));
              }}
            />
          </Field>
        </Row>

        <Status message={status()} />

        <DialogActions>
          <Button onClick={close}>Never mind</Button>
          <Button
            tone="primary"
            disabled={!sensible() || (props.subject?.lot === AuctionLot.Catch && caught() == null)}
            onClick={() => {
              setStatus(null);
              setConfirming(true);
            }}
          >
            Put it up
          </Button>
        </DialogActions>
      </Dialog>

      {/* The second dialog: the same pokemon, and what listing it
          actually means, in the words the player will remember if it
          sells for less than they hoped */}
      <Dialog
        isOpen={props.subject != null && confirming()}
        onClose={() => {
          setConfirming(false);
        }}
        title={`Put ${named()} up for auction?`}
        description="It leaves your records the moment the lot opens."
      >
        {portrait()}

        <Note>
          Opening at {asking()} gold, raised {raise()} at a time. It stands for a day and cannot be
          taken back off the block — it comes back only if the day ends with nobody having bid.
          {props.subject?.lot === AuctionLot.Item
            ? ' One piece goes up, not the stack.'
            : ' It goes up held items and all.'}
        </Note>
        <Meta>Whoever wins it pays what they bid; the gold is yours when they collect it.</Meta>

        <Status message={status()} />

        <DialogActions>
          <Button
            disabled={busy()}
            onClick={() => {
              setConfirming(false);
            }}
          >
            Back
          </Button>
          <Button tone="danger" disabled={busy()} onClick={list}>
            {busy() ? 'Putting it up…' : 'Put it up for a day'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
