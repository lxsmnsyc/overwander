import { AuctionLot, type AuctionRecord } from '../../../auth/auctions';
import { type CaughtPokemon, getCaught } from '../../../auth/caught';
import { describeCatch } from '../../catches/catch-summary';
import { describeItem } from '../../details';
import { type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';

/**
 * The pokemon on the block. A catch on offer is held in escrow rather
 * than copied into the auction, so it is read the way any other catch
 * is — and it stays readable, which is what lets a bidder see what
 * they are bidding on
 */
function CatchLotName(props: { caught: Resource<CaughtPokemon | null> }): JSX.Element {
  return (
    <Show when={props.caught()} fallback={<span>A pokemon</span>}>
      {(loaded) => <span>{describeCatch(loaded())}</span>}
    </Show>
  );
}

function CatchLot(props: { catchId: string }): JSX.Element {
  const [caught] = createResource(() => props.catchId, getCaught);

  return (
    <Suspense fallback={<span>A pokemon</span>}>
      <CatchLotName caught={caught} />
    </Suspense>
  );
}

/**
 * What an item lot is called. Item id 0 is a real item, so absence is
 * tested rather than falsiness — and a catch lot is named by the
 * record it is holding, which has to be read before it can be said
 */
export function nameItemLot(auction: AuctionRecord): string | null {
  return auction.lot === AuctionLot.Item && auction.item != null
    ? describeItem(auction.item)
    : null;
}

/**
 * What is on the block, whichever kind of lot it is.
 *
 * A caller that has already read the catch — the board does, since it
 * searches by name — passes what it found rather than making the row
 * read the same record a second time
 */
export function AuctionLotLabel(props: { auction: AuctionRecord; name?: string }): JSX.Element {
  const named = (): string | null => props.name ?? nameItemLot(props.auction);

  return (
    <Show when={named()} fallback={<CatchLot catchId={props.auction.caught} />}>
      {(name) => <span>{name()}</span>}
    </Show>
  );
}
