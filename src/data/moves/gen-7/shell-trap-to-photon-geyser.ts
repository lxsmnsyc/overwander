import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/** From Shell Trap to Photon Geyser */
export default function registerShellTrapToPhotonGeyser(): void {
  registerMove(Moves.ShellTrap, {
    name: 'Shell Trap',
    description:
      'A long wind-up that only goes off, at once, when a physical move hits the user. Hits everything opposite.',
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 150,
    pp: 5,
    accuracy: 100,
    priority: -3,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
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
  registerMove(Moves.StompingTantrum, {
    name: 'Stomping Tantrum',
    description: "2x after the user's last move failed.",
    type: Types.Ground,
    category: MoveCategories.Physical,
    power: 75,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Stomp, SpriteAnim.Rumble, SpriteAnim.Attack],
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
  registerMove(Moves.SpectralThief, {
    name: 'Spectral Thief',
    description: 'Takes every stage the target has raised before it hits.',
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 90,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.SunsteelStrike, {
    name: 'Sunsteel Strike',
    description: "Ignores the target's abilities.",
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 100,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.RearUp, SpriteAnim.Attack],
  });
  registerMove(Moves.MoongeistBeam, {
    name: 'Moongeist Beam',
    description: "Ignores the target's abilities.",
    type: Types.Ghost,
    category: MoveCategories.Special,
    power: 100,
    pp: 5,
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
  registerMove(Moves.MultiAttack, {
    name: 'Multi-Attack',
    description: 'Thrown as the type of the Memory the user is holding.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 120,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.MindBlown, {
    name: 'Mind Blown',
    description:
      "Hits everything opposite and the user's teammates, and costs the user 1/2 its HP.",
    type: Types.Fire,
    category: MoveCategories.Special,
    power: 150,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Own | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.PlasmaFists, {
    name: 'Plasma Fists',
    description: 'Every Normal move thrown in the next 2 seconds lands as Electric.',
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 100,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.Shock, SpriteAnim.Attack],
  });
  registerMove(Moves.PhotonGeyser, {
    name: 'Photon Geyser',
    description: "Physical when the user's Attack is higher. Ignores the target's abilities.",
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 100,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
}
