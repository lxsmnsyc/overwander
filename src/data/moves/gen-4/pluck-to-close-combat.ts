import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * From Pluck to Close Combat: what a team does for itself, and the
 * two moves that pay for their damage
 */
export default function registerPluckToCloseCombat(): void {
  registerMove(Moves.Pluck, {
    name: 'Pluck',
    description: "Eats the target's berry and gets the effect the target would have had.",
    type: Types.Flying,
    category: MoveCategories.Physical,
    power: 60,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Bite, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.Tailwind, {
    name: 'Tailwind',
    description: "2x Speed for the user's whole team for 6 seconds.",
    type: Types.Flying,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.FlapAround, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Acupressure, {
    name: 'Acupressure',
    description: 'Raises 1 stat of the user or a teammate 2 stages, picked at random.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Jab, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.MetalBurst, {
    name: 'Metal Burst',
    description: 'Strikes back for 1.5x the damage the user has taken in the last 2 seconds.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Ricochet, SpriteAnim.Shock, SpriteAnim.Attack],
  });
  registerMove(Moves.UTurn, {
    name: 'U-turn',
    description: 'The user swaps out for a teammate once it lands.',
    type: Types.Bug,
    category: MoveCategories.Physical,
    power: 70,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 1,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.CloseCombat, {
    name: 'Close Combat',
    description: "Drops the user's Defense and Special Defense 1 stage each.",
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 120,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.MultiStrike, SpriteAnim.Punch, SpriteAnim.Attack],
  });
}
