import { type JSX, createEffect, createSignal } from 'solid-js';
import type { DuelRules } from '../../auth/duels';
import { TEAM_SIZE } from '../../auth/teams';
import { MAX_LIMIT_SLOTS, MIN_LIMIT_SLOTS, withLimit } from '../../data/constants/battle-limits';
import { Slots, getSlots } from '../../data/constants/slots';
import { Button, Dialog, DialogActions, Note, Select } from '../styled';

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

/** The counts on offer for one slot kind, low to high */
const SLOT_CHOICES = Array.from(
  { length: MAX_LIMIT_SLOTS - MIN_LIMIT_SLOTS + 1 },
  (_, at) => MIN_LIMIT_SLOTS + at,
);

const TEAM_CHOICES = Array.from({ length: TEAM_SIZE }, (_, at) => at + 1);

const countOptions = (counts: number[]): { value: number; label: string }[] =>
  counts.map((count) => ({ value: count, label: String(count) }));

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

  const slotField = (label: string, kind: Slots): JSX.Element => (
    <Select
      label={label}
      value={slotsOf(kind)}
      options={countOptions(SLOT_CHOICES)}
      onChange={(count) => {
        setSlots(kind, count);
      }}
    />
  );

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Rules of the fight"
      description="What each pokemon may bring, and how many of them a side may field."
    >
      {slotField('Moves', Slots.Move)}
      {slotField('Abilities', Slots.Ability)}
      {slotField('Held items', Slots.Item)}
      <Select
        label="Team size"
        value={draft().teamSize}
        options={countOptions(TEAM_CHOICES)}
        onChange={(count) => {
          setDraft((held) => ({ ...held, teamSize: count }));
        }}
      />

      <Note>
        A ceiling, not an allowance: a pokemon fights with what it actually has, cut to this. Both
        sides lose their ready, and a party longer than the new team size loses its tail.
      </Note>

      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button
          tone="primary"
          onClick={() => {
            props.onSubmit(draft());
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
