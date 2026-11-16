import { For, type JSX, Show } from 'solid-js';
import BidsList from '../../auctions/BidsList';
import SellingList from '../../auctions/SellingList';
import BattleHistory from '../../battle/BattleHistory';
import FriendsTab from '../../friends/FriendsTab';
import RequestsTab from '../../friends/RequestsTab';
import TradesTab from '../../trades/TradesTab';
import ProfileSection from '../../../game/session/profile-section';
import {
  Button,
  RailCount,
  RailTab,
  RailTabs,
  Segmented,
  Status,
  TabGroup,
  TabPane,
} from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';
import AwardsCard from '../awards-card';
import TeamsCard from '../TeamsCard';
import type { ProfileState } from './state';

/**
 * Under the hero: a rail of the player's own sections beside the open
 * one, or, on somebody else's profile, Battles and Awards on a segmented
 * control with no rail. The pane is a plain container for whatever
 * section is open.
 */

/** The player's own sections, grouped for the rail, each with its colour square */
function readSectionGroups(): {
  label: string;
  sections: [ProfileSection, string, string][];
}[] {
  return [
    {
      label: m.profile_group_record(),
      sections: [
        [ProfileSection.Battles, m.profile_section_battles(), '#2360C8'],
        [ProfileSection.Awards, m.profile_section_awards(), '#F59A3B'],
        [ProfileSection.Teams, m.pick_team_saved_tab(), '#6E46C9'],
      ],
    },
    {
      label: m.profile_group_social(),
      sections: [
        [ProfileSection.Friends, m.profile_section_friends(), '#36B26F'],
        [ProfileSection.Requests, m.profile_section_requests(), '#2BA3A3'],
        [ProfileSection.Trades, m.profile_section_trades(), '#2360C8'],
      ],
    },
    {
      label: m.profile_group_market(),
      sections: [
        [ProfileSection.Bids, m.profile_section_bids(), '#E94B6A'],
        [ProfileSection.Selling, m.profile_section_selling(), '#D6372A'],
      ],
    },
  ];
}

/** The pane every section stands in: a plain column that scrolls */
const PANE = 'flex min-h-0 min-w-0 grow flex-col gap-2.5 md:overflow-y-auto md:px-5 md:py-3';

/** What the profile said or refused, above whatever section is open */
function Statuses(props: { state: ProfileState }): JSX.Element {
  return (
    <>
      <Status message={props.state.said()} />
      <Status message={props.state.error()} tone="alert" />
      <Status message={props.state.friend.error()} tone="alert" />
    </>
  );
}

function VisitedBody(props: { state: ProfileState }): JSX.Element {
  // Visited, what they have fought and earned is all there is
  const open = (): ProfileSection =>
    props.state.open() === ProfileSection.Awards ? ProfileSection.Awards : ProfileSection.Battles;

  return (
    <div class={PANE}>
      <Segmented
        label={m.profile_sections()}
        value={open()}
        options={[
          { value: ProfileSection.Battles, label: m.profile_section_battles() },
          { value: ProfileSection.Awards, label: m.profile_section_awards() },
        ]}
        onChange={(value) => {
          props.state.setOpen(value);
        }}
        class="self-start"
      />
      <Statuses state={props.state} />
      <Show
        when={open() === ProfileSection.Awards}
        fallback={<BattleHistory player={props.state.player} viewOnly />}
      >
        <AwardsCard player={props.state.player} />
      </Show>
    </div>
  );
}

function OwnBody(props: { state: ProfileState }): JSX.Element {
  const state = (): ProfileState => props.state;

  return (
    // A rail from `md` up, a row of chips that scrolls sideways on a phone
    <TabGroup
      horizontal
      value={state().open()}
      onChange={(value) => {
        state().setOpen(value);
      }}
      class="flex min-h-0 grow flex-col gap-3 md:flex-row md:gap-0"
    >
      <RailTabs label={m.profile_sections()} class="md:w-[190px] md:px-2.5 md:py-3 md:pl-3.5">
        <For each={readSectionGroups()}>
          {(group) => (
            <>
              <span
                aria-hidden="true"
                class="hidden px-2.5 pt-2.5 pb-1 text-[11px] font-extrabold tracking-[0.12em]
                  text-muted uppercase first:pt-0.5 md:block"
              >
                {group.label}
              </span>
              <For each={group.sections}>
                {([section, label, tone]) => (
                  <RailTab value={section}>
                    <span
                      aria-hidden="true"
                      class="size-4 shrink-0 rounded-[5px] md:size-[22px] md:rounded-[7px]"
                      style={{ background: tone }}
                    />
                    <span class="truncate">{label}</span>
                    <Show when={state().countFor(section) > 0}>
                      <RailCount hot>{state().countFor(section)}</RailCount>
                    </Show>
                  </RailTab>
                )}
              </For>
            </>
          )}
        </For>
      </RailTabs>

      <div class={PANE}>
        <Statuses state={state()} />
        <TabPane value={ProfileSection.Battles}>
          <BattleHistory player={state().player} />
        </TabPane>
        <TabPane value={ProfileSection.Awards}>
          <AwardsCard player={state().player} />
        </TabPane>
        {/* The saved parties the raid and duel team pickers fill from */}
        <TabPane value={ProfileSection.Teams}>
          <TeamsCard player={state().player} />
        </TabPane>
        <TabPane value={ProfileSection.Friends}>
          <div class="flex flex-col gap-2.5">
            <div class="flex flex-wrap items-center justify-end gap-2">
              <Button
                tone="primary"
                onClick={() => {
                  state().setAdding(true);
                }}
              >
                {m.friends_tie_add()}
              </Button>
            </div>
            <FriendsTab player={state().player} />
          </div>
        </TabPane>
        {/* What they have been asked and can still take back */}
        <TabPane value={ProfileSection.Requests}>
          <RequestsTab waiting={state().asking()} />
        </TabPane>
        {/* Offers to answer, waiting on an answer, and what has changed hands */}
        <TabPane value={ProfileSection.Trades}>
          <TradesTab player={state().player} />
        </TabPane>
        <TabPane value={ProfileSection.Bids}>
          <BidsList player={state().player} />
        </TabPane>
        {/* Lots on the block, and unsold ones waiting to come out of escrow */}
        <TabPane value={ProfileSection.Selling}>
          <SellingList
            player={state().player}
            lots={state().lots()}
            onChanged={state().refetchLots}
          />
        </TabPane>
      </div>
    </TabGroup>
  );
}

export default function ProfileBody(props: { state: ProfileState }): JSX.Element {
  return (
    <Show when={props.state.viewOnly} fallback={<OwnBody state={props.state} />}>
      <VisitedBody state={props.state} />
    </Show>
  );
}
