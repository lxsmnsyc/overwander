import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Flash Cannon to Rock Wrecker: the fourth stretch of Sinnoh's
 * list, where the beams and the two moves that bend the field are
 */
export default function registerFlashCannonToRockWrecker(): void {
  registerMove(Moves.FlashCannon, {
    name: 'Flash Cannon',
    description: "10% to drop the target's Special Defense 1 stage.",
    type: Types.Steel,
    category: MoveCategories.Special,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.RockClimb, {
    name: 'Rock Climb',
    description: '20% to confuse.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 90,
    pp: 20,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Defog, {
    name: 'Defog',
    description:
      "Clears spikes from both sides and the target side's screens, and drops the target's Evasion 1 stage.",
    type: Types.Flying,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.Unit,
    flags: MoveFlags.Wind,
    cast: [SpriteAnim.FlapAround, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.TrickRoom, {
    name: 'Trick Room',
    description: 'For 10 seconds every wind-up on the field is read the other way round.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 5,
    priority: -7,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.DracoMeteor, {
    name: 'Draco Meteor',
    description: "Drops the user's Special Attack 2 stages after it lands.",
    type: Types.Dragon,
    category: MoveCategories.Special,
    power: 130,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.Discharge, {
    name: 'Discharge',
    description: '30% to paralyse.',
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.LavaPlume, {
    name: 'Lava Plume',
    description: '30% to burn.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.LeafStorm, {
    name: 'Leaf Storm',
    description: "Drops the user's Special Attack 2 stages after it lands.",
    type: Types.Grass,
    category: MoveCategories.Special,
    power: 130,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.PowerWhip, {
    name: 'Power Whip',
    description: 'Plain contact damage.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 120,
    pp: 10,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.RockWrecker, {
    name: 'Rock Wrecker',
    description: 'The user has to recharge afterwards.',
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 150,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Swell, SpriteAnim.Charge],
  });
}
