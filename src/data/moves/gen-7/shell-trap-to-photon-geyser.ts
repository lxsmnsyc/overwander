import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/** From Shell Trap to Photon Geyser */
export default function registerShellTrapToPhotonGeyser(): void {
  registerMove(Moves.FleurCannon, {
    name: 'Fleur Cannon',
    description: "Drops the user's Special Attack 2 stages after it lands.",
    type: Types.Fairy,
    category: MoveCategories.Special,
    power: 130,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.PsychicFangs, {
    name: 'Psychic Fangs',
    description: "Breaks Reflect and Light Screen on the target's side, then bites.",
    type: Types.Psychic,
    category: MoveCategories.Physical,
    power: 85,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Bite,
    cast: [SpriteAnim.Bite, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.ShadowBone, {
    name: 'Shadow Bone',
    description: "20% to drop the target's Defense a stage.",
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 85,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Swing, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.Accelerock, {
    name: 'Accelerock',
    description: 'Winds up faster than an ordinary move.',
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 40,
    pp: 20,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Liquidation, {
    name: 'Liquidation',
    description: "20% to drop the target's Defense a stage.",
    type: Types.Water,
    category: MoveCategories.Physical,
    power: 85,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.PrismaticLaser, {
    name: 'Prismatic Laser',
    description: 'The user must recharge for 2 seconds after it lands.',
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 160,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.TearfulLook, {
    name: 'Tearful Look',
    description:
      "Drops the target's Attack and Special Attack a stage each. A guard does not stop it.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.ZingZap, {
    name: 'Zing Zap',
    description: '30% to make the target flinch.',
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 80,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Shock, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.NaturesMadness, {
    name: "Nature's Madness",
    description: 'Halves whatever health the target has left.',
    type: Types.Fairy,
    category: MoveCategories.Special,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
}
