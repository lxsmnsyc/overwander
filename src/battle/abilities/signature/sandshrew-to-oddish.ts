import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, type Moves } from '../../../data/ids/moves';
import type Alliance from '../../alliance';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs } from '../../utils';
import { createAbility } from '../__create';
import { createUnitCounter, createUnitState, isPhysicalMove } from './__create';

/** What one blow rolls it tighter by, in armour and in the answer */
export const CURL_UP_STEP = 0.1;

/** How tight it rolls before it can roll no tighter */
export const CURL_UP_MAX_STACKS = 5;

/** What a hurt ally is worth to her, and what a fallen one is worth */
export const BROOD_FURY_HURT_SCALE = 1.35;
export const BROOD_FURY_FALLEN_SCALE = 1.5;

/** The share of health that counts an ally as hurt */
export const BROOD_FURY_THRESHOLD = 1 / 2;

/** What one fresh move is worth after another */
export const WARLORD_STEP = 0.1;

/** How far it presses its own variety */
export const WARLORD_MAX_STACKS = 4;

/** What a wish is worth to the ally who needs it most */
export const WISHING_WELL_FRACTION = 1 / 12;

/** What each lost tail buys */
export const NINE_TAILS_STEP = 0.08;

/** How many tails there are to lose */
export const NINE_TAILS_MAX_STACKS = 9;

/** Whether an ally of this unit is standing hurt */
function alliesAreHurt(battle: Battle, unit: Unit): boolean {
  for (const ally of battle.units()) {
    if (
      ally !== unit &&
      ally.alive &&
      ally.team.alliance === unit.team.alliance &&
      ally.health <= ally.checkStat(Stats.HP, 0) * BROOD_FURY_THRESHOLD
    ) {
      return true;
    }
  }

  return false;
}

/** The ally furthest from full, for the wish to go to */
function neediestAlly(battle: Battle, unit: Unit): Unit | undefined {
  let found: Unit | undefined;
  let lowest = 1;

  for (const ally of battle.units()) {
    if (ally === unit || !ally.alive || ally.team.alliance !== unit.team.alliance) {
      continue;
    }

    const share = ally.health / ally.checkStat(Stats.HP, 0);

    if (share < 1 && share < lowest) {
      found = ally;
      lowest = share;
    }
  }

  return found;
}

const sandshrewToOddish = [
  // Sandshrew: it answers a blow by rolling tighter, and the whole
  // roll goes into the next thing it throws. Weather has nothing to do
  // with it, which is what keeps it fitting a form that never sees sand
  createAbility(Abilities.CurlUp, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        const curled = counter.get(event.source);

        if (
          curled > 0 &&
          event.stat === Stats.Defense &&
          event.source.hasAbility(Abilities.CurlUp)
        ) {
          event.value *= 1 + CURL_UP_STEP * curled;
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const curled = counter.get(event.source);

        if (
          event.power != null &&
          curled > 0 &&
          isPhysicalMove(event.move) &&
          event.source.hasAbility(Abilities.CurlUp)
        ) {
          event.power *= 1 + CURL_UP_STEP * curled;
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;
        const curled = counter.get(target);

        if (
          !event.success ||
          !target.alive ||
          curled >= CURL_UP_MAX_STACKS ||
          !target.hasAbility(Abilities.CurlUp)
        ) {
          return;
        }

        counter.set(target, curled + 1);
        target.triggerAbility(Abilities.CurlUp);
      }),
      // Spent as the blow lands, not as it is weighed: the AI runs the
      // power resolver on moves it only considers
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.success &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          counter.get(source) > 0 &&
          isPhysicalMove(event.move) &&
          source.hasAbility(Abilities.CurlUp)
        ) {
          counter.clear(source);
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Nidoran (female): she fights hardest for what is behind her, and
  // a loss is not something the fight takes back
  createAbility(Abilities.BroodFury, (battle) => {
    // Kept per side rather than per unit: a mother that fell and was
    // sent out again is still avenging the same brood
    const bereaved = new Set<Alliance>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const source = event.source;

        if (event.power == null || !source.hasAbility(Abilities.BroodFury)) {
          return;
        }

        if (bereaved.has(source.team.alliance)) {
          event.power *= BROOD_FURY_FALLEN_SCALE;
        } else if (alliesAreHurt(battle, source)) {
          event.power *= BROOD_FURY_HURT_SCALE;
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        const fallen = event.source;

        for (const unit of battle.units()) {
          if (
            unit !== fallen &&
            unit.alive &&
            unit.team.alliance === fallen.team.alliance &&
            unit.hasAbility(Abilities.BroodFury)
          ) {
            bereaved.add(fallen.team.alliance);
            unit.triggerAbility(Abilities.BroodFury);
          }
        }
      }),
    ]);
  }),

  // Nidoran (male): the widest move pool in the dex, paid for being
  // wide. What it just used is the one thing worth nothing
  createAbility(Abilities.Warlord, (battle) => {
    const { state, lifecycles } = createUnitState<{ move: Moves; stacks: number }>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const held = state.get(event.source);

        if (
          event.power != null &&
          held != null &&
          held.move !== event.move &&
          event.source.hasAbility(Abilities.Warlord)
        ) {
          event.power *= 1 + WARLORD_STEP * held.stacks;
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          !source.hasAbility(Abilities.Warlord)
        ) {
          return;
        }

        const held = state.get(source);

        if (held?.move === event.move) {
          state.set(source, { move: event.move, stacks: 0 });
        } else {
          state.set(source, {
            move: event.move,
            stacks: Math.min(WARLORD_MAX_STACKS, (held?.stacks ?? 0) + 1),
          });
          source.triggerAbility(Abilities.Warlord);
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Clefairy: the wish is for somebody else. It has no clock to hang
  // on, so it is granted as the wisher reaches for a move
  createAbility(
    Abilities.WishingWell,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          if (!unit.hasAbility(Abilities.WishingWell)) {
            return;
          }

          const ally = neediestAlly(battle, unit);

          if (!ally) {
            return;
          }

          unit.triggerAbility(Abilities.WishingWell);

          unit.heal(
            { type: EffectType.Ability, ability: Abilities.WishingWell, unit },
            ally,
            ally.checkStat(Stats.HP, 0) * WISHING_WELL_FRACTION,
            0,
          );
        }),
      ),
  ),

  // Vulpix: every hit it walks away from costs a tail, and every tail
  // it has lost is in the next thing it throws
  createAbility(Abilities.NineTails, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        const lost = counter.get(event.source);

        if (
          lost > 0 &&
          event.stat === Stats.SpecialAttack &&
          event.source.hasAbility(Abilities.NineTails)
        ) {
          event.value *= 1 + NINE_TAILS_STEP * lost;
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;

        if (!event.success || !target.alive || !target.hasAbility(Abilities.NineTails)) {
          return;
        }

        const lost = counter.get(target);

        if (lost < NINE_TAILS_MAX_STACKS) {
          counter.set(target, lost + 1);
          target.triggerAbility(Abilities.NineTails);
        }
      }),
      ...lifecycles,
    ]);
  }),
];

export default sandshrewToOddish;
