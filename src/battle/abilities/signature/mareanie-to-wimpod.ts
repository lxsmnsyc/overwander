import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createUnitState } from './__create';

/** What the dome lets through of the first blow after each entrance */
export const TOXIC_DOME_SCALE = 0.5;

/** How often its fire leaves poison behind */
export const FUME_FLARE_CHANCE = 0.2;

/** What its hug is worth on a target that is smitten with it */
export const FOND_CRUSH_SCALE = 1.3;

/** What the first move it lands after each entrance is worth */
export const OPENING_SLASH_SCALE = 1.5;

/**
 * Wela Volcano and Route 8: the star that shuts itself in a dome, the
 * lizard whose fire carries its poison, the bear whose hugs crush, and
 * the isopod that comes back swinging each time it bolts
 */
const setupAbilities = [
  // Mareanie: the dome is up each time it takes the field, and spent by
  // the first blow that lands on it
  createAbility(Abilities.ToxicDome, (battle) => {
    const { state: spent, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const { flags, source, target } = event.parent;

        if (
          event.value <= 0 ||
          flags & MoveAttackFlags.Simulated ||
          source.team.alliance === target.team.alliance ||
          spent.get(target) === true ||
          !target.hasAbility(Abilities.ToxicDome)
        ) {
          return;
        }
        spent.set(target, true);
        event.value *= TOXIC_DOME_SCALE;
        target.triggerAbility(Abilities.ToxicDome);
        target.triggerMove(Moves.Toxic, unitTarget(source), 0);
      }),
    ]);
  }),

  // Salandit: poison comes off its flames as well as its breath
  createAbility(Abilities.FumeFlare, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        !event.success ||
        !target.alive ||
        target === source ||
        !source.hasAbility(Abilities.FumeFlare) ||
        event.type !== Types.Fire ||
        battle.random() >= FUME_FLARE_CHANCE
      ) {
        return;
      }
      source.triggerAbility(Abilities.FumeFlare);
      target.addStatus(Statuses.Poisoned, {
        type: EffectType.Ability,
        ability: Abilities.FumeFlare,
        unit: source,
      });
    }),
  ),

  // Stufful: whatever has fallen for it gets hugged the hardest
  createAbility(Abilities.FondCrush, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const target = event.target;

      if (
        event.power != null &&
        target.type === MoveTargetType.Unit &&
        target.unit.status[Statuses.Infatuated] != null &&
        event.source.hasAbility(Abilities.FondCrush)
      ) {
        event.power *= FOND_CRUSH_SCALE;
      }
    }),
  ),

  // Wimpod: every retreat reloads the opening blow, which is what keeps
  // bolting worth something
  createAbility(Abilities.OpeningSlash, (battle) => {
    const { state: spent, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const { flags, source } = event.parent;

        if (
          event.value <= 0 ||
          flags & MoveAttackFlags.Simulated ||
          spent.get(source) === true ||
          !source.hasAbility(Abilities.OpeningSlash)
        ) {
          return;
        }
        spent.set(source, true);
        source.triggerAbility(Abilities.OpeningSlash);
        event.value *= OPENING_SLASH_SCALE;
      }),
    ]);
  }),
];

export default setupAbilities;
