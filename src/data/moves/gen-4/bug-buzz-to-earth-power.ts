import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Bug Buzz to Earth Power: the special hits Sinnoh handed out,
 * most of which shake the guard loose as they land
 */
export default function registerBugBuzzToEarthPower(): void {
  registerMove(Moves.BugBuzz, {
    name: 'Bug Buzz',
    description: "10% to drop the target's Special Defense 1 stage.",
    type: Types.Bug,
    category: MoveCategories.Special,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sound, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.DragonPulse, {
    name: 'Dragon Pulse',
    description: 'Plain damage from a distance.',
    type: Types.Dragon,
    category: MoveCategories.Special,
    power: 85,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Emit, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.DragonRush, {
    name: 'Dragon Rush',
    description: '20% to make the target flinch.',
    type: Types.Dragon,
    category: MoveCategories.Physical,
    power: 100,
    pp: 10,
    accuracy: 75,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.PowerGem, {
    name: 'Power Gem',
    description: 'Plain damage from a distance.',
    type: Types.Rock,
    category: MoveCategories.Special,
    power: 80,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.DrainPunch, {
    name: 'Drain Punch',
    description: 'Heals the user for 1/2 of what it deals.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    power: 75,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.VacuumWave, {
    name: 'Vacuum Wave',
    description: 'A shorter wind-up than most.',
    type: Types.Fighting,
    category: MoveCategories.Special,
    power: 40,
    pp: 30,
    accuracy: 100,
    priority: 1,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Swing, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.FocusBlast, {
    name: 'Focus Blast',
    description: "10% to drop the target's Special Defense 1 stage.",
    type: Types.Fighting,
    category: MoveCategories.Special,
    power: 120,
    pp: 5,
    accuracy: 70,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.EnergyBall, {
    name: 'Energy Ball',
    description: "10% to drop the target's Special Defense 1 stage.",
    type: Types.Grass,
    category: MoveCategories.Special,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.BraveBird, {
    name: 'Brave Bird',
    description: 'The user takes 1/3 of what it deals.',
    type: Types.Flying,
    category: MoveCategories.Physical,
    power: 120,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Hop, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.EarthPower, {
    name: 'Earth Power',
    description: "10% to drop the target's Special Defense 1 stage.",
    type: Types.Ground,
    category: MoveCategories.Special,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Stomp, SpriteAnim.Emit, SpriteAnim.Charge],
  });
}
