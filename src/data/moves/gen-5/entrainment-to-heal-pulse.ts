import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Entrainment to Heal Pulse: the moves that answer what somebody
 * else on the field is doing
 */
export default function registerEntrainmentToHealPulse(): void {
  registerMove(Moves.Entrainment, {
    name: 'Entrainment',
    description: "Replaces the target's abilities with the user's.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.AfterYou, {
    name: 'After You',
    description: 'A teammate winding up a move casts it at once.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.Round, {
    name: 'Round',
    description: "2x power if a teammate's Round landed in the last 2 seconds. It is a sound.",
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 60,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Sound, SpriteAnim.Charge],
  });
  registerMove(Moves.EchoedVoice, {
    name: 'Echoed Voice',
    description:
      'Lands 40 harder for each Echoed Voice within 2 seconds of the last, up to 200. It is a sound.',
    type: Types.Normal,
    category: MoveCategories.Special,
    power: 40,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sound, SpriteAnim.Sing, SpriteAnim.Charge],
  });
  registerMove(Moves.ChipAway, {
    name: 'Chip Away',
    description: "Ignores the target's stat stages.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 70,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Scratch, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.ClearSmog, {
    name: 'Clear Smog',
    description: "Never misses, and resets the target's stat stages.",
    type: Types.Poison,
    category: MoveCategories.Special,
    power: 50,
    pp: 15,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Gas, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.StoredPower, {
    name: 'Stored Power',
    description: '20 more power for every stage the user has raised.',
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 20,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.QuickGuard, {
    name: 'Quick Guard',
    description:
      "For 2 seconds, moves with a shortened wind-up are turned away from the user's team.",
    type: Types.Fighting,
    category: MoveCategories.Status,
    pp: 15,
    priority: 3,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.RaiseArms, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.AllySwitch, {
    name: 'Ally Switch',
    description:
      'The user trades places with a teammate, and what was aimed at either follows the swap.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 15,
    priority: 2,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.Hop],
  });
  registerMove(Moves.Scald, {
    name: 'Scald',
    description: '30% to burn. Thaws the user and the target.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.ShellSmash, {
    name: 'Shell Smash',
    description:
      "Raises the user's Attack, Special Attack and Speed 2 stages, and drops its Defense and Special Defense a stage.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.HealPulse, {
    name: 'Heal Pulse',
    description: 'Heals a teammate 1/2 of its HP.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    affects: MoveAffects.Unit | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
}
