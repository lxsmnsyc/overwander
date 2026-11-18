import { For, Show, createMemo, from } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { type Notice, NoticeKind } from '../../auth/notifications';
import { Button, LIST_PAGE, List, Meta, Note, Pill, type PillTone, createPager } from '../styled';
import { type Profile, watchProfile } from '../../auth/profile';
import { PlayerFace } from '../profile/PlayerPlate';
import { formatDate, formatRelative } from '../../i18n/format';
import { GameDialog, useGame } from '../app/game-context';
import ProfileSection from '../../game/session/profile-section';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * Everything waiting on the player, in one list.
 *
 * It notices and nothing else: each row says what has arrived and
 * opens the panel that owns it, where the accepting and declining
 * already live. A second place to answer a friend request is a second
 * set of rules to keep in step with the first.
 */

/** What each kind is called, and the colour it is read in */
const KIND_LABELS: Record<NoticeKind, () => string> = {
  [NoticeKind.RaidInvite]: m.notices_label_raid_invite,
  [NoticeKind.DuelInvite]: m.notices_label_duel_invite,
  [NoticeKind.FriendRequest]: m.notices_label_friend_request,
  [NoticeKind.TradeOffer]: m.notices_label_trade_offer,
  [NoticeKind.AuctionWon]: m.notices_label_auction_won,
  [NoticeKind.AuctionUnsold]: m.notices_label_auction_unsold,
  [NoticeKind.AuctionOutbid]: m.notices_label_auction_outbid,
};

const KIND_TONES: Record<NoticeKind, PillTone> = {
  [NoticeKind.RaidInvite]: 'ember',
  [NoticeKind.DuelInvite]: 'tide',
  [NoticeKind.FriendRequest]: 'leaf',
  [NoticeKind.TradeOffer]: 'leaf',
  [NoticeKind.AuctionWon]: 'gold',
  [NoticeKind.AuctionUnsold]: 'neutral',
  [NoticeKind.AuctionOutbid]: 'ember',
};

/** The colour edge down a row's left side, by what kind of notice it is */
const KIND_EDGES: Record<PillTone, string> = {
  ember: 'bg-ember',
  tide: 'bg-tide',
  leaf: 'bg-leaf',
  gold: 'bg-gold',
  arcane: 'bg-arcane',
  neutral: 'bg-line',
  plain: 'bg-line',
};

/** What the row says happened, in the words the panel behind it uses */
const KIND_LINES: Record<NoticeKind, () => string> = {
  [NoticeKind.RaidInvite]: m.notices_line_raid_invite,
  [NoticeKind.DuelInvite]: m.notices_line_duel_invite,
  [NoticeKind.FriendRequest]: m.notices_line_friend_request,
  [NoticeKind.TradeOffer]: m.notices_line_trade_offer,
  [NoticeKind.AuctionWon]: m.notices_line_auction_won,
  [NoticeKind.AuctionUnsold]: m.notices_line_auction_unsold,
  [NoticeKind.AuctionOutbid]: m.notices_line_auction_outbid,
};

/** What pressing the row says it will do */
const KIND_ACTIONS: Record<NoticeKind, () => string> = {
  [NoticeKind.RaidInvite]: m.notices_action_raid_invite,
  [NoticeKind.DuelInvite]: m.notices_action_duel_invite,
  [NoticeKind.FriendRequest]: m.notices_action_friend_request,
  [NoticeKind.TradeOffer]: m.notices_action_trade_offer,
  [NoticeKind.AuctionWon]: m.notices_action_auction_won,
  [NoticeKind.AuctionUnsold]: m.notices_action_auction_unsold,
  [NoticeKind.AuctionOutbid]: m.notices_action_auction_outbid,
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

/**
 * The sender, followed so a rename shows here too. Seeded with nothing,
 * so a row draws without its face and name until the profile lands
 * rather than holding the list
 */
function readSender(uid: string): () => Profile | null | undefined {
  return createMemo(() =>
    from<Profile | null | undefined>((set) => {
      set(undefined);
      return watchProfile(uid, (record) => {
        set(record);
      });
    }),
  );
}

function SenderFace(props: { uid: string }): JSX.Element {
  const profile = readSender(props.uid);

  return <PlayerFace sprite={profile()?.sprite} size={40} />;
}

function SenderName(props: { uid: string }): JSX.Element {
  const profile = readSender(props.uid);

  return (
    <span class="truncate text-sm font-extrabold">
      {(profile()?.nickname ?? '') === '' ? m.friends_unnamed() : profile()?.nickname}
    </span>
  );
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
    <Show when={props.notices.length > 0} fallback={<Note>{m.notices_empty()}</Note>}>
      <List>
        <For each={waiting.shown()}>
          {(notice) => (
            <li
              class="relative flex min-h-[60px] flex-wrap items-center gap-x-3 gap-y-1.5 overflow-hidden
                rounded-[14px] border-2 border-line-soft bg-paper py-2.5 pr-3.5 pl-5"
            >
              <span
                aria-hidden="true"
                class={`absolute inset-y-0 left-0 w-1.5 ${KIND_EDGES[KIND_TONES[notice.kind]]}`}
              />
              {/* Somebody sent it, so it is drawn as a person: their face,
                  then their name beside what kind of notice it is */}
              <Show when={notice.from}>{(sender) => <SenderFace uid={sender()} />}</Show>
              <div class="flex min-w-0 grow basis-48 flex-col gap-0.5">
                <span class="flex min-w-0 flex-wrap items-center gap-2">
                  <Pill tone={KIND_TONES[notice.kind]}>{KIND_LABELS[notice.kind]()}</Pill>
                  <Show when={notice.from}>{(sender) => <SenderName uid={sender()} />}</Show>
                </span>
                <Meta>{KIND_LINES[notice.kind]()}</Meta>
              </div>
              <Meta title={formatDate(notice.at)}>{formatRelative(notice.at)}</Meta>
              <Button
                tone="primary"
                onClick={() => {
                  open(notice);
                }}
              >
                {KIND_ACTIONS[notice.kind]()}
              </Button>
            </li>
          )}
        </For>
      </List>
      {waiting.controls()}
    </Show>
  );
}
