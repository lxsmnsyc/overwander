import type { JSX } from 'solid-js';
import { boostedSteps, isEgg, stepsRemaining } from '../../../../auth/egg';
import { isGuarded, isShadow } from '../../../../auth/caught-record';
import { groomedFriendship } from '../../../../data/constants/friendship';
import CatchPicker, { type CatchOption } from '../../../catches/catch-picker';
import { DialogSection, Meta, Status } from '../../../styled';
import { canLayEggs } from '../../../../overworld/breeding';
import { CENTRED } from '../shared';

/**
 * The counters that take a pokemon and hand it back better off: the
 * pair left to breed, the nurse, the daycare's egg and the groomer.
 * Each is a picker over the same list with a rule of its own about
 * what may be handed over.
 */

export interface BreederCounterProps {
  options: CatchOption[];
  /** The two picked so far, which the picker draws as chosen */
  chosen: string[];
  /** Whether the two picked will have anything to do with each other */
  compatible: boolean;
  onPick: (picked: string[]) => void;
}

export function BreederCounter(props: BreederCounterProps): JSX.Element {
  return (
    <DialogSection class={CENTRED}>
      {/* The pair is picked with the same list every other part of the
          game picks a pokemon with; what makes it a breeding pair is
          the two, and the rule about what can be one.

          Live, so the picker draws no confirm of its own: "Leave 2/2"
          and "Leave them" were two buttons for one press, and the
          second was the only one that did anything */}
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
          // The undiscovered group is left out rather than shown and
          // refused: a legendary is unbreedable whatever it stands
          // beside, so a square for it is a press that can never come
          // to anything
          !isEgg(option.caught) && !option.fighting && canLayEggs(option.caught.species)
        }
        onPick={props.onPick}
      />
      {/* The pairing is checked here only so the button can say so
          first; the refusal itself is the server's */}
      <Status
        message={
          props.chosen.length === 2 && !props.compatible
            ? 'Those two will have nothing to do with each other.'
            : null
        }
      />
    </DialogSection>
  );
}

export interface NurseCounterProps {
  options: CatchOption[];
  busy: boolean;
  /** Whether this one has anything she could see to */
  needsCare: (option: CatchOption) => boolean;
  onHeal: (catchId: string) => void;
}

export function NurseCounter(props: NurseCounterProps): JSX.Element {
  return (
    <DialogSection class={CENTRED}>
      {/* One press, one pokemon seen to. She is free and turns nobody
          away, so there is nothing to weigh up before handing one over
          — a counter that took a party first and a button second was
          two presses for a decision nobody makes */}
      <CatchPicker
        inline
        disabled={props.busy}
        options={props.options}
        value={null}
        verb="Heal"
        empty="You have nothing for her to look at."
        filter={(option) => !isEgg(option.caught) && !option.fighting && props.needsCare(option)}
        reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
        note={(option) => (isShadow(option.caught) ? 'shadow, she would purify it' : null)}
        onPick={(id) => {
          if (id != null) {
            props.onHeal(id);
          }
        }}
      />
      {/* The quote above says she is free; this says free has no
          bottom */}
      <Meta class="block">As many as you bring, as often as you like.</Meta>
    </DialogSection>
  );
}

export interface DaycareCounterProps {
  options: CatchOption[];
  /** Whether she has already warmed one this window */
  warmed: boolean;
  fee: number;
  onWarm: (catchId: string) => void;
}

export function DaycareCounter(props: DaycareCounterProps): JSX.Element {
  return (
    <DialogSection class={CENTRED}>
      {/* The note on each row is what the fee actually buys that egg:
          half of a long walk is further than half of a short one */}
      <CatchPicker
        inline
        options={props.options}
        value={null}
        verb="Warm"
        empty="You have no egg for her."
        filter={(option) =>
          isEgg(option.caught) && !option.fighting && stepsRemaining(option.caught) > 0
        }
        note={(option) => `${option.caught.steps} → ${boostedSteps(option.caught)}`}
        disabled={props.warmed}
        onPick={(id) => {
          if (id != null) {
            props.onWarm(id);
          }
        }}
      />
      {/* What it costs, and whether there is anything left to spend it
          on: one egg a window is her rule, and after it the squares
          would only offer a press the server refuses */}
      <Meta class="block">
        {props.warmed
          ? 'She has warmed her one for you this while.'
          : `${props.fee} gold, once while she is here.`}
      </Meta>
    </DialogSection>
  );
}

export interface GroomerCounterProps {
  options: CatchOption[];
  fee: number;
  onGroom: (catchId: string) => void;
}

export function GroomerCounter(props: GroomerCounterProps): JSX.Element {
  return (
    <DialogSection class={CENTRED}>
      {/* The note is what the fee actually buys this pokemon: half of
          what it has left to give, which is a great deal to one just
          out of its ball and next to nothing to one that already
          adores its owner */}
      <CatchPicker
        inline
        options={props.options}
        value={null}
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
        onPick={(id) => {
          if (id != null) {
            props.onGroom(id);
          }
        }}
      />
      {/* What it costs. The rest of what he is for is said in his own
          words under him */}
      <Meta class="block">{props.fee} gold, once while he is here.</Meta>
    </DialogSection>
  );
}
