import { type JSX, Suspense, createResource, createSignal, from } from 'solid-js';
import {
  AuctionLot,
  type AuctionRecord,
  getSellerStanding,
  watchOpenAuctions,
} from '../../../auth/auctions';
import { isLockLive } from '../../../auth/battle-lock';
import { getBuddy } from '../../../auth/buddy';
import { syncServerClock } from '../../../auth/clock';
import { type CaughtPokemon, countCaught, getCaught, listCaughtMarked } from '../../../auth/caught';

import { getProfile } from '../../../auth/profile';

import type { CatchOption } from '../../catches/catch-picker';

import { Note } from '../../styled';
import { AuctionBoard, type AuctionTabProps } from './board';

export type { AuctionTabProps };

/**
 * The auction board and the seller's side of it.
 *
 * Everything it is drawn from — the lots on it, who listed them, the
 * player's buddy, what they may sell and what they already have
 * running — is read one component down, under this boundary
 */
export default function AuctionTab(props: AuctionTabProps): JSX.Element {
  // Everything nobody has collected yet: a bid raises a listing under
  // whoever is looking at it, so the board is followed rather than
  // read once
  const auctions = from<[string, AuctionRecord][]>((set) =>
    watchOpenAuctions((open) => {
      // Newest first. Every lot runs exactly a day, so when it closes
      // is when it was listed — the most recently put up is the one
      // nobody has seen yet, and the one worth opening the board for
      set(open.sort(([, one], [, other]) => other.endsAt - one.endsAt));
    }),
  );

  /**
   * The pokemon on the block, read once for the whole board.
   *
   * It is keyed on which catches are up rather than on the listings
   * themselves, so a bid landing somewhere on the board — which
   * rewrites a listing every time — does not send the board back to
   * read every pokemon on it again
   */
  const [lots] = createResource(
    () => {
      const caught = new Set<string>();

      for (const [, auction] of auctions() ?? []) {
        if (auction.lot === AuctionLot.Catch) {
          caught.add(auction.caught);
        }
      }
      return [...caught].sort().join(',');
    },
    async (key): Promise<Map<string, CaughtPokemon>> => {
      const found = new Map<string, CaughtPokemon>();
      const reads: Promise<void>[] = [];

      for (const id of key.split(',')) {
        if (id === '') {
          continue;
        }
        reads.push(
          (async (): Promise<void> => {
            const caught = await getCaught(id);

            if (caught != null) {
              found.set(id, caught);
            }
          })(),
        );
      }
      await Promise.all(reads);
      return found;
    },
  );

  /**
   * Everyone who has a lot on the board, by what they are called.
   * Profiles are readable by every signed-in player, and a board of
   * lots with no sellers on it is a shop with the labels torn off
   */
  const [sellers] = createResource(
    () => {
      const selling = new Set<string>();

      for (const [, auction] of auctions() ?? []) {
        selling.add(auction.seller);
      }
      return [...selling].sort().join(',');
    },
    async (key): Promise<Map<string, string>> => {
      const named = new Map<string, string>();
      const reads: Promise<void>[] = [];

      for (const uid of key.split(',')) {
        if (uid === '') {
          continue;
        }
        reads.push(
          (async (): Promise<void> => {
            const seller = await getProfile(uid);

            if (seller != null) {
              named.set(uid, seller.nickname);
            }
          })(),
        );
      }
      await Promise.all(reads);
      return named;
    },
  );

  // Bumped whenever something leaves the player's hands or lands in
  // them, so the two pickers below re-read what there is to sell
  const [revision, setRevision] = createSignal(0);

  const refresh = (): void => {
    setRevision(revision() + 1);
  };

  /**
   * The pokemon at the player's side, which is not for sale. It is
   * re-read on the same revision the pickers are, since sending the
   * buddy home is how a player makes that one sellable
   */
  const [buddy] = createResource(
    () => [props.player, revision()] as const,
    async ([player]) => getBuddy(player),
  );

  /**
   * Why a pokemon in the list cannot be put up. The server decides all
   * three again when the listing actually arrives; this is so a player
   * is told before they press rather than after
   */
  /**
   * Whether this is the only pokemon they have, which is the one that
   * may not be sold
   */
  const [onlyOne] = createResource(
    () => props.player,
    async (uid) => (await countCaught(uid)) <= 1,
  );

  /**
   * The pokemon that could go on the block, asked of the **database**
   * rather than read out of the whole box and sifted here.
   *
   * That is what the record's `auctionable` column is for: a player
   * with three hundred catches has perhaps three that qualify.
   *
   * `filter` below still asks `isAuctionableCatch` of every row that
   * comes back. The field is an index, not an authority — a record
   * written before it existed, or by something that forgot to keep it,
   * is caught here rather than shown as sellable and refused by the
   * server
   */
  const [sellable] = createResource(
    () => [props.player, revision()] as const,
    async ([player]): Promise<CatchOption[]> => {
      const [records, clock] = await Promise.all([
        listCaughtMarked(player, 'auctionable'),
        syncServerClock(),
      ]);

      const options: CatchOption[] = [];

      for (const [id, caught] of records) {
        options.push({ id, caught, fighting: isLockLive(caught, clock) });
      }
      return options;
    },
  );

  /**
   * The auction the player has running, if any. A seller runs one at a
   * time, so this is what the sell form asks before it offers anything
   */
  const [standing, { refetch: refetchStanding }] = createResource(
    () => props.player,
    getSellerStanding,
  );

  return (
    <Suspense fallback={<Note>Reading the board…</Note>}>
      <AuctionBoard
        {...props}
        auctions={() => auctions() ?? undefined}
        lots={lots}
        sellers={sellers}
        buddy={buddy}
        onlyOne={onlyOne}
        sellable={sellable}
        standing={standing}
        revision={revision()}
        onChanged={() => {
          Promise.resolve(refetchStanding()).catch(() => undefined);
          refresh();
        }}
      />
    </Suspense>
  );
}
