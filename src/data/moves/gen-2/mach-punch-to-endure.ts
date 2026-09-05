import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Mach Punch to Endure: the priority moves, the field hazards
 * and the ways out of a losing fight
 */
export default function registerMachPunchToEndure(): void {
  registerMove(Moves.MachPunch, {
    name: 'Mach Punch',
    description: 'Winds up faster than an ordinary move.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 40,
    pp: 30,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.QuickStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.ScaryFace, {
    name: 'Scary Face',
    description: "Drops the target's Speed 2 stages.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Sound, SpriteAnim.RearUp, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.FeintAttack, {
    name: 'Feint Attack',
    description: 'Never misses.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 60,
    pp: 20,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.CarefulWalk, SpriteAnim.QuickStrike, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.SweetKiss, {
    name: 'Sweet Kiss',
    description: 'Confuses the target.',
    type: Types.Fairy,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 75,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Lick, SpriteAnim.Appeal, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.BellyDrum, {
    name: 'Belly Drum',
    description: "Spends 1/2 the user's HP to put its Attack at the top of the scale.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Swell, SpriteAnim.Dance, SpriteAnim.Charge],
  });
  registerMove(Moves.SludgeBomb, {
    name: 'Sludge Bomb',
    description: '30% to poison.',
    type: Types.Poison,
    category: MoveCategories.Special,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.MudSlap, {
    name: 'Mud-Slap',
    description: "Always drops the target's accuracy a stage.",
    type: Types.Ground,
    category: MoveCategories.Special,
    power: 20,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Stomp, SpriteAnim.Attack],
  });
  registerMove(Moves.Octazooka, {
    name: 'Octazooka',
    description: "50% to drop the target's accuracy a stage.",
    type: Types.Water,
    category: MoveCategories.Special,
    power: 65,
    pp: 10,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.Spikes, {
    name: 'Spikes',
    description:
      'Lays spikes: anything swapped in opposite loses 1/8 of its HP, 1/6 at two layers and 1/4 at three.',
    type: Types.Ground,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.Team,
    flags: 0,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.ZapCannon, {
    name: 'Zap Cannon',
    description: 'Always paralyses what it hits.',
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 120,
    pp: 5,
    accuracy: 50,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shock, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.Foresight, {
    name: 'Foresight',
    description: 'The target loses its evasion and its immunities to Normal and Fighting.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.DestinyBond, {
    name: 'Destiny Bond',
    description: 'For 4 seconds, whoever knocks the user out goes down with it.',
    type: Types.Ghost,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.PerishSong, {
    name: 'Perish Song',
    description: 'Everything that hears it faints in 8 seconds unless it is swapped out first.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    affects: MoveAffects.Self | MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Sound, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.IcyWind, {
    name: 'Icy Wind',
    description: 'Hits everything opposite and always drops its Speed a stage.',
    type: Types.Ice,
    category: MoveCategories.Special,
    power: 55,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Wind,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Emit, SpriteAnim.Gas, SpriteAnim.Charge],
  });
  registerMove(Moves.Detect, {
    name: 'Detect',
    description: 'Blocks everything aimed at the user for 2 seconds. It fails if used twice over.',
    type: Types.Fighting,
    category: MoveCategories.Status,
    pp: 5,
    priority: 4,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.QuickStrike, SpriteAnim.Charge],
  });
  registerMove(Moves.BoneRush, {
    name: 'Bone Rush',
    description: 'Strikes 2 to 5 times.',
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 25,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.MultiStrike, SpriteAnim.Swing, SpriteAnim.Attack],
  });
  registerMove(Moves.LockOn, {
    name: 'Lock-On',
    description: "The user's next move against the target cannot miss.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.Outrage, {
    name: 'Outrage',
    description: 'Lands the same hit 3 times over, and leaves the user confused.',
    type: Types.Dragon,
    category: MoveCategories.Physical,
    power: 120,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 2,
    cast: [SpriteAnim.Slam, SpriteAnim.Shake, SpriteAnim.Attack],
  });
  registerMove(Moves.GigaDrain, {
    name: 'Giga Drain',
    description: 'Heals the user for 1/2 the damage dealt.',
    type: Types.Grass,
    category: MoveCategories.Special,
    power: 75,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Endure, {
    name: 'Endure',
    description: 'For 2 seconds the user cannot be put below 1 HP. It fails if used twice over.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    priority: 4,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Swell, SpriteAnim.Charge],
  });
}
