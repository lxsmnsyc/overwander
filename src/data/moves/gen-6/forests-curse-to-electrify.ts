import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/** From Forest's Curse to Electrify, where the terrains arrive */
export default function registerForestsCurseToElectrify(): void {
  registerMove(Moves.ForestsCurse, {
    name: "Forest's Curse",
    description: "Adds Grass to the target's types, in place of anything Trick-or-Treat added.",
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
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
  registerMove(Moves.FreezeDry, {
    name: 'Freeze-Dry',
    description: '2x on Water, whatever the chart says. 10% to freeze.',
    type: Types.Ice,
    category: MoveCategories.Special,
    power: 70,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
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
  registerMove(Moves.PartingShot, {
    name: 'Parting Shot',
    description:
      "Drops the target's Attack and Special Attack a stage each, then swaps the user out. It is a sound.",
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    steps: 1,
    cast: [SpriteAnim.Sound, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.TopsyTurvy, {
    name: 'Topsy-Turvy',
    description: 'Turns every stat stage on the target the other way up.',
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.Emit, SpriteAnim.Charge],
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
  registerMove(Moves.CraftyShield, {
    name: 'Crafty Shield',
    description: "For 2 seconds, status moves are turned away from the user's team.",
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 10,
    priority: 3,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.FlowerShield, {
    name: 'Flower Shield',
    description: 'Raises the Defense of every Grass type on the field a stage.',
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.Electrify, {
    name: 'Electrify',
    description: "The target's next move within 2 seconds lands as Electric.",
    type: Types.Electric,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
}
