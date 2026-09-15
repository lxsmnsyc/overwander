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
  // The petals themselves. A Normal-type grey would be a picture of
  // dust blowing past rather than of a scent
  Petals: '#f2a0c8',
  Whiff: '#c8ccd4',
  // Dialga's steel blue and Palkia's pink, which the Dragon type's colour is neither of
  Stall: '#8fb0f0',
  Rend: '#f07ccf',
  // Light whatever plate it carries: the move's type changes in battle and the picture cannot know
  Verdict: '#fff2b4',
  // Latias' red-white down and Latios' blue light, so the pair read as each other's counterpart
  Plume: '#f6a9bd',
  Lustre: '#8cc8ff',
  // Jirachi's gold, Regigigas' pale stone and Cresselia's moonlight, where the type's colour is grey
  Starfall: '#ffe27a',
  Grip: '#e2dcc0',
  Moonlit: '#e0d4ff',
  // A plush doll, water, a brass metronome and Mew's pink, where the type's colour is grey
  Doll: '#e6d3a3',
  Flop: '#7cc4f0',
  Wag: '#e8c86a',
  Shimmer: '#f0a8e0',
};

/** The shapes that picture a stat moving, and so take the stat's colour */
const STAGED = new Set<EffectShape>([
  'Boost',
  'Drop',
  'Blades',
  'Dance',
  'Sheen',
  'Mirage',
  'Scheme',
]);

const MOVE_COLORS: Partial<Record<Moves, string>> = {
  [Moves.Reflect]: STAGE_COLORS[Stages.Defense],
  [Moves.LightScreen]: STAGE_COLORS[Stages.SpecialDefense],
  // Protect's green shell; Detect keeps its type's orange
  [Moves.Protect]: '#8fe39a',
};

export default function colorOf(move: Moves, shape: EffectShape): string {
  const named = MOVE_COLORS[move];

  if (named != null) {
    return named;
  }
  if (STAGED.has(shape)) {
    const stage = getStageMoveEffect(move);

    if (stage != null) {
      return STAGE_COLORS[stage.stage];
    }
  }
  return BY_SHAPE[shape] ?? TYPE_COLORS[getMoveData(move).type];
}
