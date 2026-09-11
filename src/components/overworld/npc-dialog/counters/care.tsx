import { type JSX, Show } from 'solid-js';
import { boostedSteps, isEgg, stepsRemaining } from '../../../../auth/egg';
import { getCatchSlots, isGuarded, isShadow } from '../../../../auth/caught-record';
import { groomedFriendship } from '../../../../data/constants/friendship';
import { Slots, countAbilitySlots, mostSlots } from '../../../../data/constants/slots';
import type { Items } from '../../../../data/ids/items';
import { getAwakenableAbilities } from '../../../../data/overworld/npc';
import CatchPicker, { type CatchOption } from '../../../catches/catch-picker';
import Price from './price';
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
  /** Whether he has already bred a pair for this player this window */
  done: boolean;
  onPick: (picked: string[]) => void;
}

export function BreederCounter(props: BreederCounterProps): JSX.Element {
  return (
    <DialogSection class={CENTRED}>
      {/* The box goes once he has bred his one pair. The egg is in the
          box by then, and a list still offering a second pair is a
          press the server would only refuse */}
      <Show
        when={!props.done}
        fallback={<Meta class="block">He has bred his one pair for you this while.</Meta>}
      >
        {/* The pair is picked with the same list every other part of
            the game picks a pokemon with; what makes it a breeding
            pair is the two, and the rule about what can be one.

            Live, so the picker draws no confirm of its own: "Leave
            2/2" and "Leave them" were two buttons for one press, and
            the second was the only one that did anything */}
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
      </Show>
    </DialogSection>
  );
}

export interface NurseCounterProps {
  options: CatchOption[];
  busy: boolean;
  /** Whether this one has anything she could see to */
  needsCare: (option: CatchOption) => boolean;
  onHeal: (picked: string[]) => void;
}

export function NurseCounter(props: NurseCounterProps): JSX.Element {
  return (
    <DialogSection class={CENTRED}>
      {/* A party at a time rather than one pokemon at a time. She is
          free and turns nobody away, so what a player wants is
          everything they are carrying seen to, and handing them over
          one press each was a round trip apiece for a decision nobody
          makes.

          A shadow is left out entirely: purifying one is permanent and
          is the Purifying Gem's business, not something to be swept up
          in a heal of six */}
      <CatchPicker
        inline
        multiple
        disabled={props.busy}
        options={props.options}
        value={[]}
        verb="Heal"
        empty="You have nothing for her to look at."
        filter={(option) =>
          !isEgg(option.caught) &&
          !option.fighting &&
          !isShadow(option.caught) &&
          props.needsCare(option)
        }
        reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
        onPick={(picked) => {
          if (Array.isArray(picked) && picked.length > 0) {
            props.onHeal(picked);
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
  /** Whether he has already seen to one for this player this window */
  done: boolean;
  onGroom: (catchId: string) => void;
}

export function GroomerCounter(props: GroomerCounterProps): JSX.Element {
  return (
    <DialogSection class={CENTRED}>
      {/* The box goes once he has done his one thing. What is left is
          what he charges and what he said, which is what a player who
          has just been served is reading */}
      <Show when={!props.done}>
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
      </Show>
      {/* What it costs. The rest of what he is for is said in his own
          words under him */}
      <Meta class="block">
        {props.done
          ? 'He has seen to his one for you this while.'
          : `${props.fee} gold, once while he is here.`}
      </Meta>
    </DialogSection>
  );
}

export interface ChannelerCounterProps {
  options: CatchOption[];
  /** How many Heart Scales the player is carrying */
  scales: number;
  fee: Items;
  busy: boolean;
  /** Whether she has already called one up for this player this window */
  done: boolean;
  onChannel: (catchId: string) => void;
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
    <DialogSection class={CENTRED}>
      <Price fee={props.fee} scales={props.scales} />

      {/* The box goes once she has called one up. She has nothing left
          to offer this while, and a box standing under a spent price is
          a press the server would only refuse */}
      <Show when={!props.done}>
        {/* One press, one pokemon widened. What comes out is the line's
            rather than the player's, so there is nothing to choose
            after picking who — and a pokemon whose line has nothing
            left is filtered out rather than shown and refused */}
        <CatchPicker
          inline
          disabled={props.busy || props.scales < 1}
          options={props.options}
          value={null}
          verb="Call up"
          empty="You have nothing she can reach."
          filter={(option) =>
            !isEgg(option.caught) && !option.fighting && hasSomethingLeft(option.caught)
          }
          note={(option) =>
            `${option.caught.abilities.length} → ${option.caught.abilities.length + 1}`
          }
          onPick={(id) => {
            if (id != null) {
              props.onChannel(id);
            }
          }}
        />
        {/* The squares go grey without a scale, and this is the reason
            why: the badge above says the bag is empty, not what that
            stops */}
        <Status message={props.scales < 1 ? 'She wants a Heart Scale, and you have none.' : null} />
      </Show>
      {/* What she charges, said the way the groomer says his fee. The
          badge is what is in the bag, which is a different question */}
      <Meta class="block">
        {props.done
          ? 'She has called up her one for you this while.'
          : 'One Heart Scale, once while she is here.'}
      </Meta>
    </DialogSection>
  );
}
