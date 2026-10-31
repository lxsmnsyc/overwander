import { type JSX, createEffect, createSignal } from 'solid-js';
import type { DuelRules } from '../../auth/duels';
import { TEAM_SIZE } from '../../auth/teams';
import { withLimit } from '../../data/constants/battle-limits';
import { Slots, getSlots, leastSlots, mostSlots } from '../../data/constants/slots';
import { BST_CAPS, DuelBan } from '../../data/constants/duel-bans';
import { Button, Checkbox, Dialog, DialogActions, Hint, HintList, Note, Select } from '../styled';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * What the host is setting the fight to.
 *
 * A duel used to be held to the mainline's shape and nothing else,
 * which is the right default and a poor rule: a fight between two
 * people is theirs to arrange. All four are shown at their current
 * values from the moment it opens, so the dialog is a form rather than
 * a question, and Save is what commits it.
 */
export interface DuelRulesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** What the lobby is set to now */
  rules: DuelRules;
  onSubmit: (rules: DuelRules) => void;
}

/**
 * The counts on offer for one slot kind, low to high. Each kind has
 * its own range, so moves start at the four every pokemon already has
 */
const slotChoices = (kind: Slots): number[] => {
  const least = leastSlots(kind);

  const choices: number[] = [];

  for (let count = least; count <= mostSlots(kind); count++) {
    choices.push(count);
  }
  return choices;
};

const TEAM_CHOICES: number[] = [];

for (let count = 1; count <= TEAM_SIZE; count++) {
  TEAM_CHOICES.push(count);
}

/** The stat total caps, with none first, read when shown so the label follows the locale */
function readBstOptions(): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = [];

  for (const cap of BST_CAPS) {
    options.push({ value: cap, label: cap === 0 ? m.duel_rules_no_cap() : String(cap) });
  }
  return options;
}

const countOptions = (counts: number[]): { value: number; label: string }[] => {
  const options: { value: number; label: string }[] = [];

  for (const count of counts) {
    options.push({ value: count, label: String(count) });
  }
  return options;
};

export default function DuelRulesDialog(props: DuelRulesDialogProps): JSX.Element {
  const [draft, setDraft] = createSignal<DuelRules>(props.rules);

  // Reopened on a lobby somebody else changed: the form starts from
  // what the lobby says now rather than from the last thing typed
  createEffect(() => {
    if (props.isOpen) {
      setDraft(props.rules);
    }
  });

  const slotsOf = (kind: Slots): number => getSlots(draft().limits, kind);

  const setSlots = (kind: Slots, count: number): void => {
    setDraft((held) => ({ ...held, limits: withLimit(held.limits, kind, count) }));
  };

  const banField = (label: string, ban: DuelBan, description?: string): JSX.Element => (
    <Checkbox
      label={label}
      description={description}
      checked={(draft().bans & ban) !== 0}
      onChange={(barred) => {
        setDraft((held) => ({ ...held, bans: barred ? held.bans | ban : held.bans & ~ban }));
      }}
    />
  );

  const slotField = (label: string, kind: Slots): JSX.Element => (
    <Select
      label={label}
      value={slotsOf(kind)}
      options={countOptions(slotChoices(kind))}
      onChange={(count) => {
        setSlots(kind, count);
      }}
    />
  );

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={m.duel_rules_title()}
      aside={
        <Hint title={m.duel_rules_hint_title()}>
          <HintList>
            <li>{m.duel_rules_hint_ceiling()}</li>
            <li>{m.duel_rules_hint_order()}</li>
            <li>{m.duel_rules_hint_ready()}</li>
            <li>{m.duel_rules_hint_barred()}</li>
          </HintList>
        </Hint>
      }
      description={m.duel_rules_description()}
    >
      {slotField(m.duel_rules_moves(), Slots.Move)}
      {slotField(m.duel_rules_abilities(), Slots.Ability)}
      {slotField(m.duel_rules_held_items(), Slots.Item)}
      <Select
        label={m.duel_rules_team_size()}
        value={draft().teamSize}
        options={countOptions(TEAM_CHOICES)}
        onChange={(count) => {
          setDraft((held) => ({ ...held, teamSize: count }));
        }}
      />
      <Select
        label={m.duel_rules_max_bst()}
        value={draft().maxBst}
        options={readBstOptions()}
        onChange={(cap) => {
          setDraft((held) => ({ ...held, maxBst: cap }));
        }}
      />
      {banField(m.duel_rules_no_legendaries(), DuelBan.Legendary)}
      {banField(m.duel_rules_no_mythicals(), DuelBan.Mythical)}
      {banField(
        m.duel_rules_no_item_forms(),
        DuelBan.ItemForms,
        m.duel_rules_no_item_forms_description(),
      )}

      <Note>{m.duel_rules_note()}</Note>

      <DialogActions>
        <Button
          tone="primary"
          onClick={() => {
            props.onSubmit(draft());
          }}
        >
          {m.battle_save()}
        </Button>
        <Button onClick={props.onClose}>{m.battle_cancel()}</Button>
      </DialogActions>
    </Dialog>
  );
}
