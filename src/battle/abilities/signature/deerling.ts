import { EventPriority } from '../../../core/event-emitter';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { Species } from '../../../data/ids/species';
import { getMoveData } from '../../../data/moves';
import { BattleEvents } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility } from '../__create';
import { isPseudoMove } from './__create';

/**
 * The deer that wears the year, and fights in whatever the year is
 * doing. Its coat is what it was met in, so a winter deer stays a
 * winter deer and the four are four different attackers
 */

/** What the coat is worth to a move it has turned */
export const TURNING_SCALE = 1.2;

/** The element each coat throws a plain move as */
export const COAT_TYPES = new Map<Species, Types>([
  [Species.Deerling, Types.Grass],
  [Species.Sawsbuck, Types.Grass],
  [Species.DeerlingSummer, Types.Fire],
  [Species.SawsbuckSummer, Types.Fire],
  [Species.DeerlingAutumn, Types.Ground],
  [Species.SawsbuckAutumn, Types.Ground],
  [Species.DeerlingWinter, Types.Ice],
  [Species.SawsbuckWinter, Types.Ice],
]);

const setupAbilities = [
  /**
   * Turning: the coat takes the plain moves over, the way Aerilate
   * and Pixilate do, and the boost rides the move it turned rather
   * than everything the holder throws
   */
  createAbility(
    Abilities.Turning,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
          const coat = COAT_TYPES.get(event.source.species);

          if (
            coat != null &&
            event.type === Types.Normal &&
            event.source.hasAbility(Abilities.Turning)
          ) {
            event.type = coat;
          }
        }),

        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const parent = event.parent;
          const source = parent.source;

          // The move is already the coat's type by here, so what it
          // started as is what says the coat turned it. A move that
          // was the coat's element to begin with gains nothing, and a
          // pseudo-move has no registry entry to ask
          if (
            !isPseudoMove(parent.move) &&
            getMoveData(parent.move).type === Types.Normal &&
            COAT_TYPES.has(source.species) &&
            source.hasAbility(Abilities.Turning)
          ) {
            event.value *= TURNING_SCALE;
          }
        }),
      ]),
  ),
];

export default setupAbilities;
