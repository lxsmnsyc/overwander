import { Moves } from '../../../../data/ids/moves';
import { TYPE_COLORS } from '../../../../data/constants/types';
import { getMoveData } from '../../../../data/moves';
import { getStageMoveEffect } from '../../../../battle/moves/stage';
import { Stages } from '../../../../data/constants/stats';
import type { EffectShape } from './shapes';

/** What each shape is coloured with, and what the colour is read off */
/**
 * The shapes that are about something other than the move's element.
 *
 * A move is coloured by its type, which is right for anything it
 * throws — but health coming back is about health whatever move sent
 * it, and a miss is about nothing at all
 */
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

const BY_SHAPE: Partial<Record<EffectShape, string>> = {
  // The colour of the health bar, which is what it is refilling
  Mend: '#4cc46a',
  // Gold, the way the mainline has always drawn them — a Normal-type
  // grey would be a picture of nothing
  Stars: '#f0d264',
  Ward: '#9ad8ff',
  // The light itself. A Normal-type grey would be a picture of a
  // shadow rather than of a flash
  Dazzle: '#fff2b4',
  Whiff: '#c8ccd4',
};

const SCREEN_COLORS: Partial<Record<Moves, string>> = {
  [Moves.Reflect]: STAGE_COLORS[Stages.Defense],
  [Moves.LightScreen]: STAGE_COLORS[Stages.SpecialDefense],
};

export default function colorOf(move: Moves, shape: EffectShape): string {
  const screen = SCREEN_COLORS[move];

  if (screen != null) {
    return screen;
  }
  if (shape === 'Boost' || shape === 'Drop') {
    const stage = getStageMoveEffect(move);

    if (stage != null) {
      return STAGE_COLORS[stage.stage];
    }
  }
  return BY_SHAPE[shape] ?? TYPE_COLORS[getMoveData(move).type];
}
