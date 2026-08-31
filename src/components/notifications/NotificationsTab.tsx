import { For, type JSX, Show } from 'solid-js';
import { type Notice, NoticeKind } from '../../auth/notifications';
import {
  Badge,
  type BadgeTone,
  Button,
  LIST_PAGE,
  List,
  ListRow,
  Meta,
  Note,
  createPager,
} from '../styled';
import FriendEntry from '../friends/FriendEntry';
import { GameDialog, useGame } from '../app/game-context';
import ProfileSection from '../profile/sections';

/**
 * Everything waiting on the player, in one list.
 *
 * It notices and nothing else: each row says what has arrived and
 * opens the panel that owns it, where the accepting and declining
 * already live. A second place to answer a friend request is a second
 * set of rules to keep in step with the first.
 */

/** What each kind is called, and the colour it is read in */
const KIND_LABELS: Record<NoticeKind, string> = {
  [NoticeKind.RaidInvite]: 'Raid',
  [NoticeKind.DuelInvite]: 'Battle',
  [NoticeKind.FriendRequest]: 'Friend',
  [NoticeKind.TradeOffer]: 'Trade',
  [NoticeKind.AuctionWon]: 'Auction',
  [NoticeKind.AuctionUnsold]: 'Auction',
  [NoticeKind.AuctionOutbid]: 'Auction',
};

const KIND_TONES: Record<NoticeKind, BadgeTone> = {
  [NoticeKind.RaidInvite]: 'ember',
  [NoticeKind.DuelInvite]: 'tide',
  [NoticeKind.FriendRequest]: 'leaf',
  [NoticeKind.TradeOffer]: 'leaf',
  [NoticeKind.AuctionWon]: 'gold',
  [NoticeKind.AuctionUnsold]: 'neutral',
  [NoticeKind.AuctionOutbid]: 'ember',
};

/** What the row says happened, in the words the panel behind it uses */
const KIND_LINES: Record<NoticeKind, string> = {
  [NoticeKind.RaidInvite]: 'called you into a raid',
  [NoticeKind.DuelInvite]: 'called you into a battle',
  [NoticeKind.FriendRequest]: 'asked to be friends',
  [NoticeKind.TradeOffer]: 'offered you a trade',
  [NoticeKind.AuctionWon]: 'You won a lot. It is waiting to be collected.',
  [NoticeKind.AuctionUnsold]: 'Nobody bid on your lot. Take it back.',
  [NoticeKind.AuctionOutbid]: 'You have been outbid, and it is still open.',
};

/** What pressing the row says it will do */
const KIND_ACTIONS: Record<NoticeKind, string> = {
  [NoticeKind.RaidInvite]: 'Open the lobby',
  [NoticeKind.DuelInvite]: 'Open the lobby',
  [NoticeKind.FriendRequest]: 'Open requests',
  [NoticeKind.TradeOffer]: 'Open trades',
  [NoticeKind.AuctionWon]: 'Open bids',
  [NoticeKind.AuctionUnsold]: 'Open selling',
  [NoticeKind.AuctionOutbid]: 'Open bids',
};

/**
 * Which part of the profile answers a notice. The two lobby kinds are
 * not here: neither is answered in the profile
 */
const KIND_SECTIONS: Record<NoticeKind, ProfileSection> = {
  [NoticeKind.RaidInvite]: ProfileSection.Battles,
  [NoticeKind.DuelInvite]: ProfileSection.Battles,
  [NoticeKind.FriendRequest]: ProfileSection.Requests,
  [NoticeKind.TradeOffer]: ProfileSection.Trades,
  [NoticeKind.AuctionWon]: ProfileSection.Bids,
  [NoticeKind.AuctionUnsold]: ProfileSection.Selling,
  [NoticeKind.AuctionOutbid]: ProfileSection.Bids,
};

export interface NotificationsTabProps {
  notices: Notice[];
}

export default function NotificationsTab(props: NotificationsTabProps): JSX.Element {
  const game = useGame();
  const waiting = createPager(() => props.notices, LIST_PAGE);

  /**
   * Where a notice is answered. A lobby is opened at the lobby itself;
   * everything else lands on the panel that holds it, since none of
   * those are one thing to press.
   *
   * Nothing is closed here. One dialog is open at a time, so opening
   * the next one takes this one's place: closing as well put the
   * dialog back to none the instant it was set, and every button on
   * this list read as one that did nothing
   */
  const open = (notice: Notice): void => {
    if (notice.kind === NoticeKind.RaidInvite) {
      game.setRaid(notice.subject);
      game.setDialog(GameDialog.Raids);
      return;
    }
    if (notice.kind === NoticeKind.DuelInvite) {
      game.setDuel(notice.subject);
      game.setDialog(GameDialog.Battles);
      return;
    }
    // The rest are read in the profile: requests, trades, bids and
    // what the player has up for sale are all tabs of it, so it is
    // opened at the one the notice is about
    game.setProfileAt(KIND_SECTIONS[notice.kind]);
    game.setDialog(GameDialog.Profile);
  };

  return (
    <Show
      when={props.notices.length > 0}
      fallback={<Note>Nothing is waiting on you. Invitations and offers land here.</Note>}
    >
      <List>
        <For each={waiting.shown()}>
          {(notice) => (
            <Show
              when={notice.from}
              fallback={
                <ListRow>
                  <Badge tone={KIND_TONES[notice.kind]}>{KIND_LABELS[notice.kind]}</Badge>
                  <span class="grow text-sm">{KIND_LINES[notice.kind]}</span>
                  <Button
                    tone="primary"
                    onClick={() => {
                      open(notice);
                    }}
                  >
                    {KIND_ACTIONS[notice.kind]}
                  </Button>
                </ListRow>
              }
            >
              {/* Somebody sent it, so it is drawn as a person: the same
                  row a friends list uses, with what they did after it */}
              {(sender) => (
                <FriendEntry uid={sender()} since={notice.at} when="">
                  <Badge tone={KIND_TONES[notice.kind]}>{KIND_LABELS[notice.kind]}</Badge>
                  <Meta>{KIND_LINES[notice.kind]}</Meta>
                  <Button
                    tone="primary"
                    onClick={() => {
                      open(notice);
                    }}
                  >
                    {KIND_ACTIONS[notice.kind]}
                  </Button>
                </FriendEntry>
              )}
            </Show>
          )}
        </For>
      </List>
      {waiting.controls()}
    </Show>
  );
}
