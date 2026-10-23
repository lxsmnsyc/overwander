import type { Moves } from '../../../../data/ids/moves';
import { TYPE_COLORS } from '../../../../data/constants/types';
import { getMoveData } from '../../../../data/moves';
import { MOVE_COLORS, SHAPE_COLORS, STAGED } from '../../../../data/moves/visual';
import { getStageMoveEffect } from '../../../../battle/moves/stage';
import { Stages } from '../../../../data/constants/stats';
import type { EffectShape } from './shapes';

/**
 * A stat, by colour. A stage picture says which way it went by which
 * way it points, and which stat it was by this: the two together are
 * the whole of what a player needs off one flash
 */
const STAGE_COLORS: Record<Stages, string> = {
  [Stages.Attack]: '#e2603f',
  [Stages.Defense]: '#5c8fd6',
  [Stages.SpecialAttack]: '#b06ad9',
  [Stages.SpecialDefense]: '#4bb58a',
  [Stages.Speed]: '#e8c34a',
  [Stages.Accuracy]: '#7fd0d8',
  [Stages.Evasion]: '#d38ac0',
};

/**
 * What a landing is coloured: the move's own colour, then the stat a
 * staged shape pictures, then the shape's, then the move's type
 */
export default function colorOf(move: Moves, shape: EffectShape): string {
  const named = MOVE_COLORS[move];

  if (named != null) {
    return typeof named === 'number' ? STAGE_COLORS[named] : named;
  }
  if (STAGED.has(shape)) {
    const stage = getStageMoveEffect(move);

    if (stage != null) {
      return STAGE_COLORS[stage.stage];
    }
  }
  return SHAPE_COLORS[shape] ?? TYPE_COLORS[getMoveData(move).type];
}
