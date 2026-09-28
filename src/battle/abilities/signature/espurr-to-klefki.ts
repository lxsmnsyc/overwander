import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Slots } from '../../../data/constants/slots';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents } from '../../events';
import type Unit from '../../unit';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility } from '../__create';
import { createUnitState } from './__create';

/** How long a cat holds back, and what it is worth either side of that */
export const RESTRAINT_HELD = 3;
export const RESTRAINT_PENALTY = 0.8;
export const RESTRAINT_RELEASE = 1.25;

/** What the first hit in a stance costs whoever landed it */
export const TURN_THE_BLADE_SCALE = 0.5;

/** The one extra pocket a key ring carries */
export const KEYRING_SLOTS = 1;

/**
 * The sword and the key: the cat that holds its power in until it
 * cannot, the blade that turns the first blow of each stance, and the
 * ring that carries one key more than anything else
 */
const setupAbilities = [
  createAbility(Abilities.Restraint, (battle) => {
    // How many moves each holder has spent holding back
    const { state, lifecycles } = createUnitState<number>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const source = event.parent.source;

        if (!source.hasAbility(Abilities.Restraint)) {
          return;
        }
        event.value *=
          (state.get(source) ?? 0) < RESTRAINT_HELD ? RESTRAINT_PENALTY : RESTRAINT_RELEASE;
      }),
      // Counted on the blow rather than on the resolve, so a
      // speculative one never spends any of the three
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const spent = state.get(source) ?? 0;

        if (
          (event.flags & MoveAttackFlags.Simulated) !== 0 ||
          spent >= RESTRAINT_HELD ||
          !source.hasAbility(Abilities.Restraint)
        ) {
          return;
        }
        state.set(source, spent + 1);

        if (spent + 1 === RESTRAINT_HELD) {
          source.triggerAbility(Abilities.Restraint);
        }
      }),
    ]);
  }),

  createAbility(Abilities.TurnTheBlade, (battle) => {
    // Which shapes each holder has already turned a blow in, so a
    // stance change arms the next one
    const { state, lifecycles } = createUnitState<Set<number>>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const target: Unit = event.parent.target;

        if (
          event.value <= 0 ||
          (event.parent.flags & MoveAttackFlags.Simulated) !== 0 ||
          !target.hasAbility(Abilities.TurnTheBlade)
        ) {
          return;
        }

        const turned = state.get(target) ?? new Set<number>();

        if (turned.has(target.species)) {
          return;
        }
        turned.add(target.species);
        state.set(target, turned);
        event.value *= TURN_THE_BLADE_SCALE;
        target.triggerAbility(Abilities.TurnTheBlade);
      }),
    ]);
  }),

  // The extra pocket is the ring's own, but a fight that allows one
  // item allows this one too: a rule about the fight outranks it
  createAbility(Abilities.Keyring, (battle) =>
    battle.on(BattleEvents.CheckUnitSlots, EventPriority.Post, (event) => {
      if (event.kind === Slots.Item && event.source.hasAbility(Abilities.Keyring)) {
        event.value = Math.min(event.value + KEYRING_SLOTS, battle.checkLimit(Slots.Item));
      }
    }),
  ),
];

export default setupAbilities;
