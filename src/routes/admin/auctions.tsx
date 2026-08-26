import { type JSX, Show } from 'solid-js';
import AuctionTab from '../../components/auctions/auction-tab';
import { Note } from '../../components/styled';
import { useAuth } from '../../auth/context';

/**
 * The board, read rather than used.
 *
 * It is the player's own auction panel with the bidding taken out:
 * every lot is drawn the same way and opens the same record, and
 * nothing on it moves gold. Staff watching the market are not a
 * bidder in it
 */
export default function AdminAuctionsPage(): JSX.Element {
  const auth = useAuth();

  return (
    <Show when={auth.user()} fallback={<Note>Reading the board…</Note>}>
      {(user) => <AuctionTab player={user().uid} viewOnly />}
    </Show>
  );
}
