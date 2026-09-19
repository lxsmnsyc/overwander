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
  // Sleep's blue, sunlight, moonlight, leaves, a wishing star, feathers, and the health bar's green under a swarm
  Slumber: '#bcd4ff',
  Sunbeam: '#ffd27a',
  Moonbeam: '#d8dcff',
  Greening: '#7cd67a',
  Wishing: '#ffe27a',
  Feathers: '#e8e0d0',
  Swarm: '#4cc46a',
  // A brass bell
  Chime: '#ffd86a',
  // Yveltal's crimson, Rayquaza's green, a diamond's pale pink and white steam, where the types' colours are none of them
  Oblivion: '#d6384a',
  Ascent: '#5ad07a',
  Diamonds: '#f4d4f0',
  Steam: '#dfeaf4',
  // Yellow spores and eyes, gold applause, an anger mark's red and a curse's purple, where the types' colours say none of them
  Spores: '#f0d84a',
  Stare: '#f0c830',
  Applause: '#ffe07a',
  Vein: '#e8404a',
  Nail: '#8a5ab0',
  // Night sky, bees, a tail light, stored orbs, a sprout, feathers, cotton, silk and tears
  Cosmos: '#b8a8ff',
  Hive: '#f0c040',
  Lantern: '#fff27a',
  Stack: '#f0c890',
  Sprout: '#7cd67a',
  Tickle: '#f0e6d8',
  Cotton: '#f4f4ec',
  Silk: '#f0f0f0',
  Tears: '#8cc8ff',
  // Plasma, whichever drive Techno Blast carries: the move's type changes in battle and the picture cannot know
  Techno: '#a8dcff',
  // Reshiram's blue fire, and Meloetta's green where the Normal type's grey is nothing
  Azure: '#5aa8ff',
  Aria: '#8fe0b0',
  // A shell's pale cream, where the Normal type's grey reads as stone
  Smash: '#d8c8a8',
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
  'Haste',
  'Polish',
  'Flex',
  'Howl',
  'Blank',
  'Curl',
  'Flutter',
  'Windup',
]);

const MOVE_COLORS: Partial<Record<Moves, string>> = {
  [Moves.Reflect]: STAGE_COLORS[Stages.Defense],
  [Moves.LightScreen]: STAGE_COLORS[Stages.SpecialDefense],
  [Moves.Barrier]: STAGE_COLORS[Stages.Defense],
  // Protect's green shell; Detect keeps its type's orange
  [Moves.Protect]: '#8fe39a',
  // Hyper Beam's orange, Solar Beam's sunlight and Aura Sphere's blue, which their types' colours are not
  [Moves.HyperBeam]: '#ffb04a',
  [Moves.SolarBeam]: '#fff0a0',
  [Moves.AuraSphere]: '#5aa8ff',
  // A lullaby's pink, and Perish Song's notes gone dark
  [Moves.Sing]: '#f0a8d0',
  [Moves.PerishSong]: '#6a4a8c',
  // A gold blade for the Swords of Justice, and Keldeo's aqua one
  [Moves.SacredSword]: '#ffd86a',
  [Moves.SecretSword]: '#7ad8ff',
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
