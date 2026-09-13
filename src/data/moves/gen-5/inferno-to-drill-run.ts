import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * From Inferno to Drill Run: the three Pledges and the moves that
 * sweep a whole side
 */
export default function registerInfernoToDrillRun(): void {
  registerMove(Moves.Inferno, {
    name: 'Inferno',
    description: 'Burns the target if it lands.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 100,
    pp: 5,
    accuracy: 50,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.WaterPledge, {
    name: 'Water Pledge',
    description:
      "Lands at 150 after a teammate's Fire or Grass Pledge in the last 2 seconds. With Fire it leaves a rainbow over the user's team, with Grass a swamp under the target's.",
    type: Types.Water,
    category: MoveCategories.Special,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.FirePledge, {
    name: 'Fire Pledge',
    description:
      "Lands at 150 after a teammate's Grass or Water Pledge in the last 2 seconds. With Grass it leaves a sea of fire under the target's team, with Water a rainbow over the user's.",
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.GrassPledge, {
    name: 'Grass Pledge',
    description:
      "Lands at 150 after a teammate's Water or Fire Pledge in the last 2 seconds. With Water it leaves a swamp under the target's team, with Fire a sea of fire.",
    type: Types.Grass,
    category: MoveCategories.Special,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.VoltSwitch, {
    name: 'Volt Switch',
    description: 'The user swaps out for a teammate once it lands.',
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 70,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    steps: 1,
    cast: [SpriteAnim.Shock, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.StruggleBug, {
    name: 'Struggle Bug',
    description: "Hits everything opposite, and drops each one's Special Attack a stage.",
    type: Types.Bug,
    category: MoveCategories.Special,
    power: 50,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Shake, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Bulldoze, {
    name: 'Bulldoze',
    description:
      "Hits the user's own team and everything opposite, and drops each one's Speed a stage.",
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 60,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Stomp, SpriteAnim.Rumble, SpriteAnim.Hop],
  });
  registerMove(Moves.FrostBreath, {
    name: 'Frost Breath',
    description: 'Always lands a critical.',
    type: Types.Ice,
    category: MoveCategories.Special,
    power: 60,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.DragonTail, {
    name: 'Dragon Tail',
    description: 'Throws the target off the field and drags its weakest teammate in. Slow to cast.',
    type: Types.Dragon,
    category: MoveCategories.Physical,
    power: 60,
    pp: 10,
    accuracy: 90,
    priority: -6,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.TailWhip, SpriteAnim.Swing],
  });
  registerMove(Moves.WorkUp, {
    name: 'Work Up',
    description: "Raises the user's Attack and Special Attack a stage each.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.Electroweb, {
    name: 'Electroweb',
    description: "Hits everything opposite, and drops each one's Speed a stage.",
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 55,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.WildCharge, {
    name: 'Wild Charge',
    description: 'The user takes 1/4 of the damage it deals.',
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 90,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.DrillRun, {
    name: 'Drill Run',
    description: 'Lands a critical more often than most.',
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 80,
    pp: 10,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Rotate],
  });
}
