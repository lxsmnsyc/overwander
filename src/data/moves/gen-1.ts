import { Types } from '../constants/types';
import {
  MoveCategories,
  MoveFlags,
  Moves,
  MoveTargetFlags,
} from '../ids/moves';
import { registerMove } from './__create';

export function registerGen1Moves() {
  registerMove(Moves.Tackle, {
    name: 'Tackle',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 40,
    pp: 35,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
  });
  registerMove(Moves.Growl, {
    name: 'Growl',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 100,
    target:
      MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Sound,
  });
  registerMove(Moves.LeechSeed, {
    name: 'Leech Seed',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
  registerMove(Moves.VineWhip, {
    name: 'Vine Whip',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 45,
    pp: 25,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
  });
  registerMove(Moves.PoisonPowder, {
    name: 'Poison Powder',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 35,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
  registerMove(Moves.RazorLeaf, {
    name: 'Razor Leaf',
    type: Types.Grass,
    category: MoveCategories.Physical,
    pp: 25,
    accuracy: 95,
    target:
      MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
  registerMove(Moves.Growth, {
    name: 'Growth',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
  });
  registerMove(Moves.SolarBeam, {
    name: 'Solar Beam',
    type: Types.Grass,
    category: MoveCategories.Special,
    pp: 10,
    power: 120,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    steps: 1,
  });
  registerMove(Moves.SwordsDance, {
    name: 'Swords Dance',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
  });
  registerMove(Moves.Toxic, {
    name: 'Toxic',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
  registerMove(Moves.BodySlam, {
    name: 'Body Slam',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
  });
}
