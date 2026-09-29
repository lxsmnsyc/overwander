import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveFlags, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { getMoveData } from '../../../data/moves';
import { BattleEvents, EffectType, type UnitAttackEvent } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { isWeatherRainy } from '../../utils';
import { createAbility } from '../__create';
import { createUnitCounter, isPseudoMove } from './__create';

/** What a super-effective blow is worth to the beast built to land them */
export const MEMORY_ECHO_SCALE = 1.2;

/** How often a bite rattles the target's mind */
export const PSYCHIC_GNASH_CHANCE = 0.2;

/** What rain does for a wreck's Ghost and Grass moves */
export const GHOST_SHIP_SCALE = 1.3;

/** The most Defense its scales ring up in one visit */
export const WAR_CLANGOR_CAP = 3;

const SHIP_TYPES = new Set([Types.Ghost, Types.Grass]);

function hasFlag(move: Moves, flag: MoveFlags): boolean {
  return (getMoveData(move).flags & flag) !== 0;
}

/**
 * Poni and the sea: the beast made to beat any type, the fish that
 * grinds its teeth, the anchor that haunts the wrecks, and the scaled
 * warrior whose clangour hardens it
 */
const setupAbilities = [
  // Type: Null: the effectiveness comes one defending type at a time, so
  // it is gathered per attack and read once the blow resolves
  createAbility(Abilities.MemoryEcho, (battle) => {
    const effectiveness = new WeakMap<UnitAttackEvent, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
        effectiveness.set(event.parent, (effectiveness.get(event.parent) ?? 1) * event.multiplier);
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        if (
          (effectiveness.get(event.parent) ?? 1) > 1 &&
          event.parent.source.hasAbility(Abilities.MemoryEcho)
        ) {
          event.value *= MEMORY_ECHO_SCALE;
        }
      }),
    ]);
  }),

  // Bruxish: the grinding of its teeth is a psychic noise
  createAbility(Abilities.PsychicGnash, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        !event.success ||
        !target.alive ||
        target === source ||
        !source.hasAbility(Abilities.PsychicGnash) ||
        isPseudoMove(event.move) ||
        !hasFlag(event.move, MoveFlags.Bite) ||
        battle.random() >= PSYCHIC_GNASH_CHANCE
      ) {
        return;
      }
      source.triggerAbility(Abilities.PsychicGnash);
      target.addStatus(Statuses.Confused, {
        type: EffectType.Ability,
        ability: Abilities.PsychicGnash,
        unit: source,
      });
    }),
  ),

  // Dhelmise: in the rain the wreck it haunts comes alive
  createAbility(Abilities.GhostShip, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        event.power != null &&
        source.hasAbility(Abilities.GhostShip) &&
        SHIP_TYPES.has(source.checkMoveType(event.move, event.target)) &&
        isWeatherRainy(source)
      ) {
        event.power *= GHOST_SHIP_SCALE;
      }
    }),
  ),

  // Jangmo-o: every sound it lands rings its scales harder
  createAbility(Abilities.WarClangor, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          !source.hasAbility(Abilities.WarClangor) ||
          isPseudoMove(event.move) ||
          !hasFlag(event.move, MoveFlags.Sound) ||
          counter.get(source) >= WAR_CLANGOR_CAP
        ) {
          return;
        }
        counter.set(source, counter.get(source) + 1);
        source.triggerAbility(Abilities.WarClangor);
        source.addStage(Stages.Defense, 1, {
          type: EffectType.Ability,
          ability: Abilities.WarClangor,
          unit: source,
        });
      }),
    ]);
  }),
];

export default setupAbilities;
