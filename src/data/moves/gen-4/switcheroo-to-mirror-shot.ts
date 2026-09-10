import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Switcheroo to Mirror Shot: the last of Sinnoh's third stretch,
 * the quick hits and the three fangs
 */
export default function registerSwitcherooToMirrorShot(): void {
  registerMove(Moves.Switcheroo, {
    name: 'Switcheroo',
    description: 'Trades what the user is holding for what the target is.',
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.GigaImpact, {
    name: 'Giga Impact',
    description: 'The user has to recharge afterwards.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 150,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.NastyPlot, {
    name: 'Nasty Plot',
    description: "Raises the user's Special Attack 2 stages.",
    type: Types.Dark,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.BulletPunch, {
    name: 'Bullet Punch',
    description: 'A shorter wind-up than most.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 40,
    pp: 30,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.QuickStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.Avalanche, {
    name: 'Avalanche',
    description: '2x power if the user has been hurt in the last 2 seconds, but a long wind-up.',
    type: Types.Ice,
    category: MoveCategories.Physical,
    power: 60,
    pp: 10,
    accuracy: 100,
    priority: -4,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.RearUp, SpriteAnim.Attack],
  });
  registerMove(Moves.IceShard, {
    name: 'Ice Shard',
    description: 'A shorter wind-up than most.',
    type: Types.Ice,
    category: MoveCategories.Physical,
    power: 40,
    pp: 30,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Attack],
  });
  registerMove(Moves.ShadowClaw, {
    name: 'Shadow Claw',
    description: 'Lands a critical more often than most.',
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 70,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.Scratch, SpriteAnim.Slice, SpriteAnim.Attack],
  });
  registerMove(Moves.ThunderFang, {
    name: 'Thunder Fang',
    description: '10% to paralyse, and 10% to make the target flinch.',
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 65,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Bite,
    cast: [SpriteAnim.Bite, SpriteAnim.Shock, SpriteAnim.Attack],
  });
  registerMove(Moves.IceFang, {
    name: 'Ice Fang',
    description: '10% to freeze, and 10% to make the target flinch.',
    type: Types.Ice,
    category: MoveCategories.Physical,
    power: 65,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Bite,
    cast: [SpriteAnim.Bite, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.FireFang, {
    name: 'Fire Fang',
    description: '10% to burn, and 10% to make the target flinch.',
    type: Types.Fire,
    category: MoveCategories.Physical,
    power: 65,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Bite,
    cast: [SpriteAnim.Bite, SpriteAnim.Emit, SpriteAnim.Attack],
  });
  registerMove(Moves.ShadowSneak, {
    name: 'Shadow Sneak',
    description: 'A shorter wind-up than most.',
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 40,
    pp: 30,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.MudBomb, {
    name: 'Mud Bomb',
    description: "30% to drop the target's Accuracy 1 stage.",
    type: Types.Ground,
    category: MoveCategories.Special,
    power: 65,
    pp: 10,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.PsychoCut, {
    name: 'Psycho Cut',
    description: 'Lands a critical more often than most.',
    type: Types.Psychic,
    category: MoveCategories.Physical,
    power: 70,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Slicing,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Slice, SpriteAnim.Shoot, SpriteAnim.Attack],
  });
  registerMove(Moves.ZenHeadbutt, {
    name: 'Zen Headbutt',
    description: '20% to make the target flinch.',
    type: Types.Psychic,
    category: MoveCategories.Physical,
    power: 80,
    pp: 15,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.RearUp, SpriteAnim.Attack],
  });
  registerMove(Moves.MirrorShot, {
    name: 'Mirror Shot',
    description: "30% to drop the target's Accuracy 1 stage.",
    type: Types.Steel,
    category: MoveCategories.Special,
    power: 65,
    pp: 10,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
}
