import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js';
import {
  FriendTie,
  acceptFriendRequest,
  blockPlayer,
  dropFriendRequest,
  readFriendTie,
  removeFriend,
  sendFriendRequest,
  unblockPlayer,
} from '../../auth/friends';

/** The one press each standing offers */
const PRESS: Record<FriendTie, (uid: string) => Promise<FriendTie>> = {
  [FriendTie.None]: sendFriendRequest,
  [FriendTie.Friends]: removeFriend,
  [FriendTie.Sent]: dropFriendRequest,
  [FriendTie.Received]: acceptFriendRequest,
  [FriendTie.Blocked]: unblockPlayer,
};

/**
 * Where the reader stands with one other player, and the one press
 * that changes it.
 *
 * A signal rather than a resource because the answer is what a button
 * is *labelled*, and a label cannot be read from inside a Suspense the
 * button is not in
 */
export interface FriendTieState {
  tie: Accessor<FriendTie>;
  /** True while a press is in flight, and while the first read is */
  busy: Accessor<boolean>;
  error: Accessor<string | null>;
  /** Do whatever the tie offers: ask, answer, cancel or undo */
  act: () => void;
  /** Shut them out, which undoes the friendship and both requests */
  block: () => void;
}

export interface FriendTieOptions {
  /**
   * Where the two already stand, for a caller that has just been told
   * — a search answers with the standing, and asking again would be
   * four more reads for something already in hand
   */
  known?: Accessor<FriendTie | null>;
}

export default function createFriendTie(
  player: Accessor<string | null>,
  options: FriendTieOptions = {},
): FriendTieState {
  const [tie, setTie] = createSignal(FriendTie.None);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    const uid = player();
    const already = options.known?.() ?? null;

    setError(null);
    if (uid == null) {
      setTie(FriendTie.None);
      return;
    }
    if (already != null) {
      setTie(already);
      return;
    }
    // A profile can be swapped while the answer for the last one is
    // still coming; the late answer is dropped rather than shown
    let live = true;

    onCleanup(() => {
      live = false;
    });
    setBusy(true);
    readFriendTie(uid)
      .then((found) => {
        if (live) {
          setTie(found);
        }
      })
      .catch(() => {
        // Nothing to say: an unknown standing offers "Add friend",
        // and the press itself reports what went wrong
      })
      .finally(() => {
        if (live) {
          setBusy(false);
        }
      });
  });

  const press = (change: (uid: string) => Promise<FriendTie>): void => {
    const uid = player();

    if (uid == null || busy()) {
      return;
    }
    setError(null);
    setBusy(true);
    change(uid)
      .then((now) => {
        setTie(now);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return {
    tie,
    busy,
    error,
    act: () => {
      press(PRESS[tie()]);
    },
    block: () => {
      press(blockPlayer);
    },
  };
}
