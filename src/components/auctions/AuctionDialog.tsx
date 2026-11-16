import { type JSX, type Resource, Show, Suspense, createResource, createSignal } from 'solid-js';
import {
  AuctionLot,
  MAX_INCREMENT,
  MAX_STARTING_BID,
  MIN_INCREMENT,
  MIN_STARTING_BID,
  openCatchAuction,
  openItemAuction,
} from '../../auth/auctions';
import { type CaughtPokemon, getCaught } from '../../auth/caught';
import { isEgg } from '../../model/egg';
import type { AuctionSubject } from '../../game/session/types';
import { getSpeciesData } from '../../data/species';
import { describeItem } from '../details';
import ItemSprite from '../items/ItemSprite';
import { Button, Dialog, DialogActions, List, Meta, RowCard, RowText, Status } from '../styled';
import { CatchFace } from './LotFace';
import { NATURE_NAMES } from '../../data/ids/text';
import { GENDER_LABELS } from '../catches/catch-summary';
import { AUCTION_DURATION } from '../../model/auction-record';
import describeFailure from '../../i18n/refusals';
import { formatNumber } from '../../i18n/format';
import { m } from '../../i18n/paraglide/messages.js';

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

export type { AuctionSubject };

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

/**
 * The listing itself, which is where the record is read.
 *
 * A record read in the body that declared it lands on the boundary
 * around the page rather than on the dialog panel's own, so the
 * reading half stands on its own
 */
function ListingBody(
  props: AuctionDialogProps & { caught: Resource<CaughtPokemon | null>; onDone: () => void },
): JSX.Element {
  const [asking, setAsking] = createSignal(MIN_STARTING_BID);
  const [raise, setRaise] = createSignal(MIN_INCREMENT);
  const [status, setStatus] = createSignal<string | null>(null);
  // Whether the last press has been asked once: the second press lists
  const [confirming, setConfirming] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

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

    const record = props.caught();

    if (record == null) {
      return m.auction_this_pokemon();
    }
    return isEgg(record) ? m.ui_egg() : getSpeciesData(record.species).name;
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
    props.onDone();
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
              ? m.auction_put_up_failed_item()
              : m.auction_put_up_failed_catch(),
          );
          return;
        }
        props.onListed?.();
        close();
      })
      .catch((thrown: unknown) => {
        setBusy(false);
        setConfirming(false);
        setStatus(describeFailure(thrown));
      });
  };

  /**
   * What is standing on the block, as the lot row at the top of both
   * dialogs: its picture in a square, its name over a line about it.
   *
   * A pokemon is its sprite (an egg is drawn as an egg the way it is
   * everywhere else) and an item is its icon, the same picture the bag
   * draws, so what is about to be parted with is recognised rather
   * than read
   */
  const portrait = (): JSX.Element => (
    <List>
      <RowCard>
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-[12px] border-2
            border-line-soft bg-line-soft/60 p-0.5"
          aria-hidden="true"
        >
          <Show
            when={props.subject?.lot === AuctionLot.Item ? props.subject.item : null}
            keyed
            fallback={
              <Show when={props.subject?.lot === AuctionLot.Catch ? props.subject.catchId : null}>
                {(id) => (
                  <Suspense>
                    <CatchFace catchId={id()} />
                  </Suspense>
                )}
              </Show>
            }
          >
            {(item) => <ItemSprite item={item} size={32} label="" />}
          </Show>
        </span>
        <RowText
          name={named()}
          line={
            props.subject?.lot === AuctionLot.Item ? (
              m.auction_item_line()
            ) : (
              <Show when={props.caught()} fallback={m.auction_reading_record()}>
                {(record) => (
                  <Show when={!isEgg(record())} fallback={m.ui_egg()}>
                    {GENDER_LABELS[record().gender]()} · {NATURE_NAMES[record().nature]}
                  </Show>
                )}
              </Show>
            )
          }
        />
      </RowCard>
    </List>
  );

  const pressLabel = (): string => {
    if (busy()) {
      return m.auction_putting_up();
    }
    return confirming() ? m.trade_sure() : m.auction_put_up_day();
  };

  return (
    <Dialog
      isOpen={props.subject != null}
      onClose={close}
      title={m.auction_put_up_title({ name: named() })}
      width="medium"
      description={m.auction_description()}
    >
      {portrait()}

      <label class="flex flex-col gap-1">
        <span class="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
          {m.auction_opening_bid()}
        </span>
        <input
          type="number"
          class="h-[46px] w-full text-base"
          min={MIN_STARTING_BID}
          max={MAX_STARTING_BID}
          value={asking()}
          onInput={(event) => {
            setAsking(Number(event.currentTarget.value));
            setConfirming(false);
          }}
        />
        <Meta>
          {m.auction_terms_note({
            raise: formatNumber(raise()),
            hours: AUCTION_DURATION / 3_600_000,
          })}
        </Meta>
      </label>

      {/* The rest of the terms, in quiet rows: how much a bid must raise
          it, and what listing means */}
      <List>
        <RowCard tone="quiet">
          <label class="flex grow items-center gap-3">
            <span class="grow text-sm font-extrabold">{m.auction_least_raise()}</span>
            <input
              type="number"
              class="h-10 w-[120px]"
              min={MIN_INCREMENT}
              max={MAX_INCREMENT}
              value={raise()}
              onInput={(event) => {
                setRaise(Number(event.currentTarget.value));
                setConfirming(false);
              }}
            />
          </label>
        </RowCard>
        <RowCard tone="quiet">
          <span class="text-[13px] leading-snug">
            {props.subject?.lot === AuctionLot.Item
              ? m.auction_confirm_item({
                  asking: formatNumber(asking()),
                  raise: formatNumber(raise()),
                })
              : m.auction_confirm_catch({
                  asking: formatNumber(asking()),
                  raise: formatNumber(raise()),
                })}{' '}
            <Meta>{m.auction_confirm_payment()}</Meta>
          </span>
        </RowCard>
      </List>

      <Status message={status()} />

      {/* One sheet: the terms, then what listing means. The last press
          asks twice in place, since a lot cannot be taken back off the
          block */}
      <DialogActions stack>
        <Button
          tone="primary"
          disabled={
            busy() ||
            !sensible() ||
            (props.subject?.lot === AuctionLot.Catch && props.caught() == null)
          }
          onClick={() => {
            if (!confirming()) {
              setStatus(null);
              setConfirming(true);
              return;
            }
            list();
          }}
        >
          {pressLabel()}
        </Button>
        <Button disabled={busy()} onClick={close}>
          {m.ui_never_mind()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Putting one thing on the block.
 *
 * The pokemon is read one component down, under this boundary: a
 * record read here would throw to the page and take the world with
 * it, and a lot is listed from the middle of somewhere else
 */
export default function AuctionDialog(props: AuctionDialogProps): JSX.Element {
  const [caught] = createResource(
    () => (props.subject?.lot === AuctionLot.Catch ? props.subject.catchId : null),
    getCaught,
  );

  return <ListingBody {...props} caught={caught} onDone={props.onClose} />;
}
