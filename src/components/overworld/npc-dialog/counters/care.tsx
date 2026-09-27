import { type JSX, Show } from 'solid-js';
import { boostedSteps, isEgg, stepsRemaining } from '../../../../auth/egg';
import { getCatchSlots, isGuarded, isShadow } from '../../../../auth/caught-record';
import { groomedFriendship } from '../../../../data/constants/friendship';
import { Slots, countAbilitySlots, mostSlots } from '../../../../data/constants/slots';
import type { Items } from '../../../../data/ids/items';
import { getAwakenableAbilities } from '../../../../data/overworld/npc';
import CatchPicker, { type CatchOption } from '../../../catches/catch-picker';
import { DialogSection, Status } from '../../../styled';
import { canLayEggs } from '../../../../overworld/breeding';
import { CounterSpent, CounterStep, CounterTerms, PickOne } from '../terms';

/**
 * The counters that take a pokemon and hand it back better off. Each
 * is the terms, then a pick, and the button at the foot pays for it
 */

/** A counter's column: the terms first, then whatever it picks from */
const COLUMN = 'flex flex-col gap-3';

/** What the terms say the player holds of the gold a counter charges */
function goldHeld(gold: number, fee: number): { amount: number; short: boolean; unit: string } {
  return { amount: gold, short: gold < fee, unit: 'gold' };
}

/** And of the Heart Scales one charges */
function scalesHeld(scales: number): { amount: number; short: boolean; unit: string } {
  return { amount: scales, short: scales < 1, unit: scales === 1 ? 'Heart Scale' : 'Heart Scales' };
}

export interface BreederCounterProps {
  options: CatchOption[];
  /** The two picked so far, which the picker draws as chosen */
  chosen: string[];
  /** Whether the two picked will have anything to do with each other */
  compatible: boolean;
  /** Whether he has already bred a pair for this player this window */
  done: boolean;
  gold: number;
  fee: number;
  spent: string;
  onPick: (picked: string[]) => void;
}

export function BreederCounter(props: BreederCounterProps): JSX.Element {
  return (
    <DialogSection class={COLUMN}>
      <CounterTerms cost={{ gold: props.fee }} have={goldHeld(props.gold, props.fee)} />
      <Show when={!props.done} fallback={<CounterSpent says={props.spent} />}>
        <CounterStep>Choose a pair</CounterStep>
        {/* Live, so the picker draws no confirm of its own: the Breed
            button at the foot is the one press */}
        <CatchPicker
          inline
          multiple
          live
          max={2}
          options={props.options}
          value={props.chosen}
          verb="Breed"
          empty="You have nothing to breed."
          filter={(option) =>
            // A legendary is unbreedable whatever it stands beside, so
            // it is left out rather than shown and refused
            !isEgg(option.caught) && !option.fighting && canLayEggs(option.caught.species)
          }
          onPick={props.onPick}
        />
        <Status
          message={
            props.chosen.length === 2 && !props.compatible
              ? 'Those two will have nothing to do with each other.'
              : null
          }
        />
      </Show>
    </DialogSection>
  );
}

export interface NurseCounterProps {
  options: CatchOption[];
  picked: string[];
  busy: boolean;
  /** Whether this one has anything she could see to */
  needsCare: (option: CatchOption) => boolean;
  onPick: (picked: string[]) => void;
}

export function NurseCounter(props: NurseCounterProps): JSX.Element {
  return (
    <DialogSection class={COLUMN}>
      <CounterStep>Choose who to heal</CounterStep>
      {/* A party at a time. A shadow is left out: purifying one is the
          Purifying Gem's business, not something swept up in a heal */}
      <CatchPicker
        inline
        multiple
        live
        disabled={props.busy}
        options={props.options}
        value={props.picked}
        verb="Heal"
        empty="You have nothing for her to look at."
        filter={(option) =>
          !isEgg(option.caught) &&
          !option.fighting &&
          !isShadow(option.caught) &&
          props.needsCare(option)
        }
        reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
        onPick={props.onPick}
      />
    </DialogSection>
  );
}

export interface DaycareCounterProps {
  options: CatchOption[];
  picked: string | null;
  busy: boolean;
  /** Whether she has already warmed one this window */
  warmed: boolean;
  fee: number;
  gold: number;
  spent: string;
  onPick: (id: string | null) => void;
}

export function DaycareCounter(props: DaycareCounterProps): JSX.Element {
  return (
    <DialogSection class={COLUMN}>
      <CounterTerms cost={{ gold: props.fee }} have={goldHeld(props.gold, props.fee)} />
      <Show when={!props.warmed} fallback={<CounterSpent says={props.spent} />}>
        {/* The note is what the fee buys that egg: half of a long walk
            is further than half of a short one */}
        <PickOne
          options={props.options}
          picked={props.picked}
          onPick={props.onPick}
          busy={props.busy}
          verb="Warm"
          empty="You have no egg for her."
          filter={(option) =>
            isEgg(option.caught) && !option.fighting && stepsRemaining(option.caught) > 0
          }
          note={(option) => `${option.caught.steps} → ${boostedSteps(option.caught)}`}
          detail={(option) => `Steps ${option.caught.steps} → ${boostedSteps(option.caught)}`}
        />
      </Show>
    </DialogSection>
  );
}

export interface GroomerCounterProps {
  options: CatchOption[];
  picked: string | null;
  busy: boolean;
  fee: number;
  gold: number;
  /** Whether he has already seen to one for this player this window */
  done: boolean;
  spent: string;
  onPick: (id: string | null) => void;
}

export function GroomerCounter(props: GroomerCounterProps): JSX.Element {
  return (
    <DialogSection class={COLUMN}>
      <CounterTerms cost={{ gold: props.fee }} have={goldHeld(props.gold, props.fee)} />
      <Show when={!props.done} fallback={<CounterSpent says={props.spent} />}>
        {/* The note is what the fee buys: half of what it has left to
            give, a great deal to one just caught and little to a friend */}
        <PickOne
          options={props.options}
          picked={props.picked}
          onPick={props.onPick}
          busy={props.busy}
          verb="Groom"
          empty="You have nothing for him to see to."
          filter={(option) =>
            !isEgg(option.caught) &&
            !option.fighting &&
            !isShadow(option.caught) &&
            groomedFriendship(option.caught.friendship) > option.caught.friendship
          }
          note={(option) =>
            `${option.caught.friendship} → ${groomedFriendship(option.caught.friendship)}`
          }
          detail={(option) =>
            `Friendship ${option.caught.friendship} → ${groomedFriendship(option.caught.friendship)}`
          }
        />
      </Show>
    </DialogSection>
  );
}

export interface ChannelerCounterProps {
  options: CatchOption[];
  picked: string | null;
  /** How many Heart Scales the player is carrying */
  scales: number;
  fee: Items;
  busy: boolean;
  /** Whether she has already called one up for this player this window */
  done: boolean;
  spent: string;
  onPick: (id: string | null) => void;
}

/**
 * Whether she has anything left to call up out of this one: room on
 * the record, and something in its line it does not already carry
 */
function hasSomethingLeft(caught: CatchOption['caught']): boolean {
  return (
    getCatchSlots(caught, Slots.Ability) < mostSlots(Slots.Ability) &&
    countAbilitySlots(caught.abilities) >= getCatchSlots(caught, Slots.Ability) &&
    getAwakenableAbilities(caught.species, caught.abilities).length > 0
  );
}

export function ChannelerCounter(props: ChannelerCounterProps): JSX.Element {
  return (
    <DialogSection class={COLUMN}>
      <CounterTerms cost={{ item: props.fee }} have={scalesHeld(props.scales)} />
      <Show when={!props.done} fallback={<CounterSpent says={props.spent} />}>
        {/* What comes out is the line's rather than the player's, so a
            pokemon whose line has nothing left is left out */}
        <PickOne
          options={props.options}
          picked={props.picked}
          onPick={props.onPick}
          busy={props.busy}
          verb="Call up"
          empty="You have nothing she can reach."
          filter={(option) =>
            !isEgg(option.caught) && !option.fighting && hasSomethingLeft(option.caught)
          }
          note={(option) =>
            `${option.caught.abilities.length} → ${option.caught.abilities.length + 1}`
          }
          detail={(option) =>
            `Abilities ${option.caught.abilities.length} → ${option.caught.abilities.length + 1}`
          }
        />
        <Status message={props.scales < 1 ? 'She wants a Heart Scale, and you have none.' : null} />
      </Show>
    </DialogSection>
  );
}

export interface DojoCounterProps {
  options: CatchOption[];
  picked: string | null;
  /** How many Heart Scales the player is carrying */
  scales: number;
  fee: Items;
  busy: boolean;
  onPick: (id: string | null) => void;
}

export function DojoCounter(props: DojoCounterProps): JSX.Element {
  return (
    <DialogSection class={COLUMN}>
      <CounterTerms cost={{ item: props.fee }} have={scalesHeld(props.scales)} />
      {/* A pokemon already holding as many moves as any can is left out */}
      <PickOne
        options={props.options}
        picked={props.picked}
        onPick={props.onPick}
        busy={props.busy}
        verb="Train"
        empty="You have nothing he can train further."
        filter={(option) =>
          !isEgg(option.caught) &&
          !option.fighting &&
          getCatchSlots(option.caught, Slots.Move) < mostSlots(Slots.Move)
        }
        note={(option) =>
          `${getCatchSlots(option.caught, Slots.Move)} → ${getCatchSlots(option.caught, Slots.Move) + 1} moves`
        }
        detail={(option) =>
          `Move slots ${getCatchSlots(option.caught, Slots.Move)} → ${getCatchSlots(option.caught, Slots.Move) + 1}`
        }
      />
      <Status message={props.scales < 1 ? 'He wants a Heart Scale, and you have none.' : null} />
    </DialogSection>
  );
}
