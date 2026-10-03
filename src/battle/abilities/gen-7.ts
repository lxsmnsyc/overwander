import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { MoveFlags, type Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { createNoContactAbility, createTypeShiftAbility } from './__create';

/** Whether a move is carried on sound, which is what a voice can wet */
function isSound(move: Moves): boolean {
  return (getMoveData(move).flags & MoveFlags.Sound) !== 0;
}

/** Alola's abilities, as far as its lines are written */
const setupAbilities = [
  // Rowlet: it shoots its quills from where it stands
  createNoContactAbility(Abilities.LongReach),

  // Popplio: its songs go out as water rather than as air, and cost
  // nothing extra for it
  createTypeShiftAbility(Abilities.LiquidVoice, isSound, Types.Water),
];

export default function setupGen7Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
