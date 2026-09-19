import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/** From Forest's Curse to Electrify, where the terrains arrive */
export default function registerForestsCurseToElectrify(): void {
  registerMove(Moves.PetalBlizzard, {
    name: 'Petal Blizzard',
    description: "Hits everything opposite and the user's teammates.",
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 90,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.Twirl, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.DisarmingVoice, {
    name: 'Disarming Voice',
    description: 'Hits everything opposite, and never misses. It is a sound.',
    type: Types.Fairy,
    category: MoveCategories.Special,
    power: 40,
    pp: 15,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.DrainingKiss, {
    name: 'Draining Kiss',
    description: 'Heals the user for 3/4 the damage dealt.',
    type: Types.Fairy,
    category: MoveCategories.Special,
    power: 50,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Lick, SpriteAnim.Appeal, SpriteAnim.Attack],
  });
}
