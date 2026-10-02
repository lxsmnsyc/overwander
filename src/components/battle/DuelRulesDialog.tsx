import { type JSX, createEffect, createSignal } from 'solid-js';
import type { DuelRules } from '../../auth/duels';
import { TEAM_SIZE } from '../../auth/teams';
import { withLimit } from '../../data/constants/battle-limits';
import { Slots, getSlots, leastSlots, mostSlots } from '../../data/constants/slots';
import { BST_CAPS, DuelBan } from '../../data/constants/duel-bans';
import { Button, Checkbox, Dialog, DialogActions, Hint, HintList, Note, Select } from '../styled';

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

/** The stat total caps, with none first */
const BST_OPTIONS: { value: number; label: string }[] = [];

for (const cap of BST_CAPS) {
  BST_OPTIONS.push({ value: cap, label: cap === 0 ? 'No cap' : String(cap) });
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
      title="Rules of the fight"
      aside={
        <Hint title="About duel rules">
          <HintList>
            <li>
              Each limit is a ceiling. A pokemon fights with what it has, cut down to the limit.
            </li>
            <li>
              A list is cut from the top, so order a pokemon's moves, abilities and held items on
              its sheet.
            </li>
            <li>Changing a rule takes both sides' Ready away.</li>
            <li>A pokemon the new rules bar is taken out of its party.</li>
          </HintList>
        </Hint>
      }
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
      <Select
        label="Highest base stat total"
        value={draft().maxBst}
        options={BST_OPTIONS}
        onChange={(cap) => {
          setDraft((held) => ({ ...held, maxBst: cap }));
        }}
      />
      {banField('No legendaries', DuelBan.Legendary)}
      {banField('No mythicals', DuelBan.Mythical)}
      {banField(
        'No held-item forms',
        DuelBan.ItemForms,
        'A pokemon holding an item that changes its form, such as a Plate or an orb, stays out.',
      )}

      <Note>
        A ceiling, not an allowance: a pokemon fights with what it actually has, cut to this. Both
        sides lose their ready, and a party longer than the new team size loses its tail.
      </Note>

      <DialogActions>
        <Button
          tone="primary"
          onClick={() => {
            props.onSubmit(draft());
          }}
        >
          Save
        </Button>
        <Button onClick={props.onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
