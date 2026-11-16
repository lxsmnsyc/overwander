import { type JSX, Show } from 'solid-js';
import { FriendTie } from '../../../auth/friends';
import { getTitleName } from '../../../data/ids/titles';
import BuddyCard from '../../catches/BuddyCard';
import { useGame } from '../../app/game-context';
import { friendActionLabel } from '../../friends/tie';
import { ActionsIcon } from '../../icons';
import { Menu, type MenuAction, Note, Pill } from '../../styled';
import { formatNumber } from '../../../i18n/format';
import { m } from '../../../i18n/paraglide/messages.js';
import { PlayerFace } from '../PlayerPlate';
import PlayerPlace from '../PlayerPlace';
import TitleBadge from './title-badge';
import type { ProfileState } from './state';

/**
 * The band under the nameplate: who the trainer is on the left, who
 * walks with them on the right, and the actions menu at the edge.
 */

/** What can be done to somebody else: a fight, the tie, shutting them out */
function visitorActions(state: ProfileState): MenuAction[] {
  const actions: MenuAction[] = [
    { label: m.profile_battle(), disabled: state.staging(), onSelect: state.challenge },
    {
      label: friendActionLabel(state.friend.tie()),
      disabled: state.friend.busy(),
      onSelect: state.friend.act,
    },
  ];

  if (state.friend.tie() !== FriendTie.Blocked) {
    actions.push({
      label: m.profile_block(),
      tone: 'danger',
      disabled: state.friend.busy(),
      onSelect: state.friend.block,
    });
  }
  return actions;
}

/** What the player can do about themselves */
function ownActions(state: ProfileState): MenuAction[] {
  return [
    {
      label: m.profile_edit_title(),
      onSelect: () => {
        state.setEditing(true);
      },
    },
    {
      label: m.friends_tie_add(),
      onSelect: () => {
        state.setAdding(true);
      },
    },
    { label: m.ui_sign_out(), tone: 'danger', onSelect: state.leave },
  ];
}

export default function ProfileHero(props: { state: ProfileState }): JSX.Element {
  const game = useGame();

  return (
    <div
      class="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-x-4 gap-y-3 bg-linear-to-b
        from-tide-soft to-paper px-4 pt-7 pb-3.5 sm:px-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]
        md:gap-x-[18px]"
    >
      <Show when={props.state.profile()} fallback={<Note>{m.profile_loading()}</Note>}>
        {(loaded) => (
          // The face beside the name, the badges and where they stand
          <div class="flex min-w-0 items-center gap-3.5">
            <PlayerFace sprite={loaded().sprite} size={72} square />
            <div class="flex min-w-0 flex-col gap-1.5">
              <span class="truncate font-display text-[26px] leading-none font-semibold">
                {loaded().nickname}
              </span>
              <span class="flex flex-wrap gap-1.5">
                <Show when={loaded().title != null && getTitleName(loaded().title ?? -1)} keyed>
                  {(worn) => (
                    <TitleBadge
                      player={props.state.player}
                      title={loaded().title ?? -1}
                      name={worn}
                    />
                  )}
                </Show>
                <Pill tone="gold">{m.ui_gold({ amount: formatNumber(loaded().gold) })}</Pill>
              </span>
              <PlayerPlace player={props.state.player} />
            </div>
          </div>
        )}
      </Show>

      <div class="flex min-w-0 max-md:col-span-2 max-md:row-start-2">
        <BuddyCard
          player={props.state.player}
          viewOnly={props.state.viewOnly}
          onOpen={(catchId) => {
            game.setSheet({ catchId, readOnly: props.state.viewOnly });
          }}
        />
      </div>

      {/* At the hero's right edge, and on a phone beside the name */}
      <div class="self-start max-md:col-start-2 max-md:row-start-1">
        <Menu
          label={m.profile_actions()}
          icon={ActionsIcon}
          class="size-10 justify-center p-0"
          actions={props.state.viewOnly ? visitorActions(props.state) : ownActions(props.state)}
        />
      </div>
    </div>
  );
}
