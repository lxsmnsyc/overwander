import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import type { Stages } from '../../../../data/constants/stats';
import type Abilities from '../../../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories } from '../../../../data/ids/moves';
import { getMoveData } from '../../../../data/moves';
import { Statuses } from '../../../../data/ids/status';
import type Battle from '../../../battle';
import { BattleEvents, EffectType, MoveTargetType } from '../../../events';
import { type Lifecycle, MergedLifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import { createAbility, getAbilityHolders } from '../../__create';

/**
 * What the three Sinnoh starters share: each is braced for one kind of
 * blow. The first one of that kind each fight lands for half of what
 * it was worth, or fails outright where it is a status move, and what
 * the holder does with it is the family's own.
 *
 * A status move is vetoed in the query and paid for on the real
 * failure, so a speculative immunity check never spends the brace
 */
export function createBraceAbility(
  ability: Abilities,
  blow: MoveCategories,
  build: (battle: Battle) => { answer: (unit: Unit) => void; lifecycles?: Lifecycle[] },
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    /** Who has already taken the blow it was braced for */
    const spent = new Set<Unit>();
    const { answer, lifecycles = [] } = build(battle);

    function braced(unit: Unit): boolean {
      return !spent.has(unit) && unit.hasAbility(ability);
    }

    function brace(unit: Unit): void {
      spent.add(unit);
      unit.triggerAbility(ability);
      answer(unit);
    }

    if (blow !== MoveCategories.Status) {
      return new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.value > 0 &&
            parent.category === blow &&
            !(parent.flags & MoveAttackFlags.Simulated) &&
            braced(parent.target)
          ) {
            event.value /= 2;
            brace(parent.target);
          }
        }),
        ...lifecycles,
      ]);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          getMoveData(event.move).category === MoveCategories.Status &&
          braced(event.target.unit)
        ) {
          event.immune = true;
        }
      }),
      // Spent only when a real move actually failed against it
      battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          parent.target.type === MoveTargetType.Unit &&
          parent.target.unit !== parent.source &&
          getMoveData(parent.move).category === MoveCategories.Status &&
          braced(parent.target.unit)
        ) {
          brace(parent.target.unit);
        }
      }),
      ...lifecycles,
    ]);
  });
}

/**
 * What the creation trio share: while one of them is standing, every
 * unit on the far side reads one of its stages a step lower than it
 * is.
 *
 * Asked rather than written: nothing is applied to the enemy, so the
 * step comes back the moment the holder leaves the field, two holders
 * never stack, and Clear Body and Mist have nothing to refuse. The AI
 * sees it because scoring asks the same question the resolver does
 */
export function createFieldDragAbility(
  ability: Abilities,
  stage: Stages,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitStage, EventPriority.Post, (event) => {
      if (event.stage !== stage) {
        return;
      }

      for (const holder of getAbilityHolders(battle, ability)) {
        if (
          holder.alive &&
          holder !== event.source &&
          holder.team.alliance !== event.source.team.alliance &&
          holder.hasAbility(ability)
        ) {
          event.value -= 1;
          return;
        }
      }
    }),
  );
}

/**
 * What the moon duo share: how long a night runs. One halves what
 * settles on its own team, itself included, and the other stretches
 * what it put on the far side, so a status the dark drew out comes
 * back to less than it started at when the light is standing opposite.
 *
 * Asked at the duration check rather than written anywhere, and it
 * answers once, so two holders never compound
 */
export function createNightfallAbility(
  ability: Abilities,
  scale: number,
  own: boolean,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitStatusDuration, EventPriority.Post, (event) => {
      for (const holder of getAbilityHolders(battle, ability)) {
        if (!holder.alive || !holder.hasAbility(ability)) {
          continue;
        }

        // The light covers its own party; the dark only stretches what
        // it inflicted itself
        const covered = own
          ? holder.team === event.source.team
          : holder.team.alliance !== event.source.team.alliance &&
            event.cause.type !== EffectType.None &&
            event.cause.unit === holder;

        if (covered) {
          event.duration *= scale;
          return;
        }
      }
    }),
  );
}

/**
 * What the lake trio share: each of them hands its own side the thing
 * it was made to hold as it arrives, one stage of it, in the stat
 * that reads as knowledge, feeling or resolve.
 *
 * The mirror of the birds' wingbeat, which takes a stage off the far
 * side instead. Its own party rather than its whole alliance: a lake
 * gives to the people standing at it
 */
export function createLakeGiftAbility(
  ability: Abilities,
  stage: Stages,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(
    ability,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(ability)) {
            event.source.triggerAbility(ability);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== ability) {
            return;
          }

          const source = event.source;
          const cause = { type: EffectType.Ability, ability, unit: source } as const;

          for (const mate of source.team.units) {
            if (mate.alive) {
              mate.addStage(stage, 1, cause);
            }
          }
        }),
      ]),
  );
}

/** Which of Sinnoh's two fossils an ability is */
export type SinnohFossilSide = 'rams' | 'shields';

/**
 * What Cranidos and Shieldon share: cover, and what it is worth. The
 * skull walks through whatever is put in front of it, a guard and a
 * substitute alike; the face-shield hands its own guard to everybody
 * standing with it. Meeting each other, what the one puts up is the
 * one thing the other ignores
 */
export function createSinnohFossilAbility(
  ability: Abilities,
  side: SinnohFossilSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  if (side === 'rams') {
    return createAbility(
      ability,
      (battle) =>
        new MergedLifecycle([
          battle.on(BattleEvents.CheckUnitMoveGuard, EventPriority.Post, (event) => {
            if (!event.walks && event.source.hasAbility(ability)) {
              event.walks = true;
            }
          }),
          // A substitute is the other thing standing in the way, and
          // the flag is what every shield already honours
          battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
            if (event.source.hasAbility(ability)) {
              event.flags |= MoveAttackFlags.Piercing;
            }
          }),
        ]),
    );
  }

  return createAbility(ability, (battle) => {
    // A second holder would hand the guard straight back
    let spreading = false;

    return battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      if (spreading || event.status !== Statuses.Protected || !event.source.hasAbility(ability)) {
        return;
      }

      spreading = true;
      event.source.triggerAbility(ability);

      for (const mate of event.source.team.units) {
        if (mate !== event.source && mate.alive) {
          mate.addStatus(Statuses.Protected, event.cause);
        }
      }

      spreading = false;
    });
  });
}
