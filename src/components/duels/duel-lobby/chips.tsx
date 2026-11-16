import { For, type JSX, Show } from 'solid-js';
import { DuelBan } from '../../../data/constants/duel-bans';
import { Slots, getSlots } from '../../../data/constants/slots';
import { CounterTerms, TERM_CHIP } from '../../forms/terms';
import { Button } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';

/** What each ban reads as on the rules chips */
const BAN_CHIPS: [DuelBan, () => string][] = [
  [DuelBan.Legendary, m.duel_rules_no_legendaries],
  [DuelBan.Mythical, m.duel_rules_no_mythicals],
  [DuelBan.ItemForms, m.duel_rules_no_item_forms],
];

export interface RuleChipsProps {
  teamSize: number;
  limits: number;
  maxBst: number;
  bans: number;
  /** Only the host changes the rules */
  onChange?: () => void;
  busy: boolean;
}

/**
 * What the other side agrees to when they say they are ready, as a row
 * of chips with the host's Change rules at its right end
 */
export default function RuleChips(props: RuleChipsProps): JSX.Element {
  return (
    <CounterTerms
      rows={[
        { label: m.duels_term_team(), value: m.duels_per_side({ count: props.teamSize }) },
        { label: m.duel_rules_moves(), value: String(getSlots(props.limits, Slots.Move)) },
        { label: m.duel_rules_abilities(), value: String(getSlots(props.limits, Slots.Ability)) },
        { label: m.duels_term_items(), value: String(getSlots(props.limits, Slots.Item)) },
      ]}
    >
      {/* Nothing is recorded: no candy, no aftermath, and what the party spent comes back */}
      <Show when={props.maxBst > 0}>
        <span class={`${TERM_CHIP} bg-line-soft`}>
          <span class="font-semibold text-muted">{m.duels_stat_total()}</span>≤ {props.maxBst}
        </span>
      </Show>
      <For each={BAN_CHIPS}>
        {([ban, label]) => (
          <Show when={(props.bans & ban) !== 0}>
            <span class={`${TERM_CHIP} bg-ember-soft text-ember-dark`}>{label()}</span>
          </Show>
        )}
      </For>
      <span class={`${TERM_CHIP} bg-line-soft`}>{m.duels_unranked()}</span>
      <Show when={props.onChange}>
        {(change) => (
          <>
            <span class="grow" />
            <Button disabled={props.busy} onClick={change()}>
              {m.duels_change_rules()}
            </Button>
          </>
        )}
      </Show>
    </CounterTerms>
  );
}
