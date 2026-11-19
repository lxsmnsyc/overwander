import { type Accessor, createMemo, createSignal, from } from 'solid-js';
import { signOut } from '../../../auth/actions';
import { type AuctionRecord, canReclaim, listAuctionsBy } from '../../../auth/auctions';
import { hostDuel, inviteToDuel } from '../../../auth/duels';
import { type FriendRequests, watchFriendRequests } from '../../../auth/friends';
import { type Profile, watchProfile } from '../../../auth/profile';
import LobbyRole from '../../../model/lobby-role';
import ProfileSection from '../../../game/session/profile-section';
import { GameDialog, useGame } from '../../app/game-context';
import { createLoad } from '../../app/create-load';
import createFriendTie, { type FriendTieState } from '../../friends/tie';
import describeFailure from '../../../i18n/refusals';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * What the hero and the body of a profile share: who is followed, what
 * is waiting, and what the actions menu does. It is made once by the
 * sheet, so the two halves never follow the same thing twice.
 */

export interface ProfileState {
  player: string;
  /** Whether this is somebody else's profile, being looked at */
  viewOnly: boolean;
  profile: Accessor<Profile | null | undefined>;
  friend: FriendTieState;
  error: Accessor<string | null>;
  said: Accessor<string | null>;
  setSaid: (line: string | null) => void;
  adding: Accessor<boolean>;
  setAdding: (on: boolean) => void;
  editing: Accessor<boolean>;
  setEditing: (on: boolean) => void;
  /** Friend requests the player has not answered yet */
  asking: Accessor<FriendRequests>;
  /** The player's own lots, empty on somebody else's profile */
  lots: Accessor<[string, AuctionRecord][]>;
  refetchLots: () => void;
  /** The open section of the player's own list */
  open: Accessor<ProfileSection>;
  setOpen: (section: ProfileSection) => void;
  /** What is waiting on the player in a section, for its count */
  countFor: (section: ProfileSection) => number;
  leave: () => void;
  /** Whether a lobby is being staged for the trainer being looked at */
  staging: Accessor<boolean>;
  challenge: () => void;
}

export interface ProfileStateOptions {
  player: string;
  viewOnly: boolean;
  section?: ProfileSection;
}

export default function createProfileState(options: ProfileStateOptions): ProfileState {
  const game = useGame();
  // The balance moves whenever the player earns or spends, so the
  // profile is followed rather than read once. Seeded with nothing,
  // so the hero says it is loading instead of holding the sheet
  const profile = createMemo(() =>
    from<Profile | null | undefined>((set) => {
      set(undefined);
      return watchProfile(options.player, (record) => {
        set(record);
      });
    }),
  );
  const [error, setError] = createSignal<string | null>(null);
  const [said, setSaid] = createSignal<string | null>(null);
  const [adding, setAdding] = createSignal(false);
  const [editing, setEditing] = createSignal(false);
  /**
   * Where the reader stands with the trainer they are looking at. On
   * the reader's own profile it stands at None and is never asked:
   * nobody befriends themselves
   */
  const friend = createFriendTie(() => (options.viewOnly ? options.player : null));
  /**
   * What is waiting on an answer. It is followed here rather than in
   * the tab that lists it because the count is wanted on the rail
   * itself, and the same query twice is two subscriptions
   */
  const waiting = createMemo(() =>
    from<FriendRequests | undefined>((set) => {
      // Seeded with nothing, so the rail counts none until they land
      set(undefined);
      if (options.viewOnly) {
        // Nothing to follow: a visited profile is not the reader's,
        // and somebody else's requests are not theirs to see
        return () => undefined;
      }
      return watchFriendRequests(options.player, (requests) => {
        set(requests);
      });
    }),
  );
  const asking = (): FriendRequests => waiting() ?? { incoming: [], outgoing: [] };

  /**
   * What the player has put on the block. Read here rather than in
   * the pane that lists it for the reason the requests are: the count
   * of what is stranded belongs on the rail itself, and reading it in
   * both places would be the same query twice.
   *
   * A load, read below without waiting and only in the browser, so
   * nothing is asked for while the page is being drawn. Somebody
   * else's lots are not the reader's business: the reclaim button on
   * one would be theirs to press, so a visited profile asks for nothing
   */
  const selling = createLoad(() => !options.viewOnly && options.player, listAuctionsBy);
  // Emptied on a visited profile rather than left to the key: a key
  // that goes falsy stops a load asking but does not empty it, so a
  // reader who walked from their own profile to somebody else's would
  // be shown their own lots under the other player's name
  const lots = (): [string, AuctionRecord][] => (options.viewOnly ? [] : (selling.latest() ?? []));

  /**
   * How many lots came back unsold and are still sitting in escrow.
   * Nothing else in the game ever mentions one, so this count is the
   * whole of how a player finds out
   */
  const stranded = (): number => {
    const now = Date.now();
    let count = 0;

    for (const [, lot] of lots()) {
      if (canReclaim(lot, options.player, now)) {
        count += 1;
      }
    }
    return count;
  };

  /**
   * The open section, held here rather than by the group so a group
   * built again keeps its place
   */
  const [open, setOpen] = createSignal(options.section ?? ProfileSection.Battles);

  const countFor = (section: ProfileSection): number => {
    if (section === ProfileSection.Requests) {
      return asking().incoming.length;
    }
    if (section === ProfileSection.Selling) {
      return stranded();
    }
    return 0;
  };

  const leave = (): void => {
    setError(null);
    signOut().catch((caught: unknown) => {
      setError(describeFailure(caught));
    });
  };

  /**
   * Whether a lobby is being staged for this trainer. It is two calls
   * -- open one, call them into it -- and the menu goes dead between
   * them so a second press does not stage a second fight
   */
  const [staging, setStaging] = createSignal(false);

  /**
   * Ask this trainer for a fight: a lobby of the reader's own, with
   * them called into the seat opposite. The lobby is opened over
   * whatever the profile was opened over, which is where the fight is
   * actually arranged
   */
  const challenge = (): void => {
    setError(null);
    setStaging(true);
    hostDuel()
      .then(async (id) => {
        const called = await inviteToDuel(id, options.player, LobbyRole.Fighter);

        if (!called) {
          setError(m.profile_challenge_failed());
        }
        game.setVisiting(null);
        game.setDuel(id);
        game.setDialog(GameDialog.Battles);
      })
      .catch((caught: unknown) => {
        setError(describeFailure(caught));
      })
      .finally(() => {
        setStaging(false);
      });
  };

  return {
    player: options.player,
    viewOnly: options.viewOnly,
    profile,
    friend,
    error,
    said,
    setSaid: (line) => {
      setSaid(line);
    },
    adding,
    setAdding: (on) => {
      setAdding(on);
    },
    editing,
    setEditing: (on) => {
      setEditing(on);
    },
    asking,
    lots,
    refetchLots: () => {
      selling.refresh();
    },
    open,
    setOpen: (section) => {
      setOpen(section);
    },
    countFor,
    leave,
    staging,
    challenge,
  };
}
