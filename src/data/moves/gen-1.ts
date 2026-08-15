import { Types } from '../constants/types';
import { MoveCategories, MoveFlags, MoveTargetFlags, Moves } from '../ids/moves';
import { registerMove } from './__create';

// Flight time of a thrown/shot projectile before its impact cue
const PROJECTILE_DELAY = 800;

export default function registerGen1Moves(): void {
  registerMove(Moves.Tackle, {
    name: 'Tackle',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 40,
    pp: 35,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Strike', 'Attack'],
  });
  registerMove(Moves.Growl, {
    name: 'Growl',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Sound,
    cast: ['RearUp', 'Shake', 'Charge'],
  });
  registerMove(Moves.LeechSeed, {
    name: 'Leech Seed',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Shake', 'Attack'],
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
    cast: ['Swing', 'Strike', 'Attack'],
  });
  registerMove(Moves.PoisonPowder, {
    name: 'Poison Powder',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 35,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Powder,
    cast: ['Gas', 'Shake', 'Charge'],
  });
  registerMove(Moves.RazorLeaf, {
    name: 'Razor Leaf',
    type: Types.Grass,
    category: MoveCategories.Physical,
    pp: 25,
    accuracy: 95,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Slice', 'Shoot', 'Attack'],
  });
  registerMove(Moves.Growth, {
    name: 'Growth',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Swell', 'RearUp', 'Charge'],
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
    cast: ['SpAttack', 'Shoot', 'Charge'],
  });
  registerMove(Moves.SwordsDance, {
    name: 'Swords Dance',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Dance', 'Twirl', 'Charge'],
  });
  registerMove(Moves.Toxic, {
    name: 'Toxic',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Gas', 'Shoot', 'Charge'],
  });
  registerMove(Moves.BodySlam, {
    name: 'Body Slam',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    power: 85,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Strike', 'Attack'],
  });
  registerMove(Moves.TakeDown, {
    name: 'Take Down',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 90,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Strike', 'Attack'],
  });
  registerMove(Moves.DoubleEdge, {
    name: 'Double Edge',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    power: 120,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Strike', 'Attack'],
  });
  registerMove(Moves.Rage, {
    name: 'Rage',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Strike', 'Swell', 'Attack'],
  });
  registerMove(Moves.MegaDrain, {
    name: 'Mega Drain',
    type: Types.Grass,
    category: MoveCategories.Special,
    pp: 15,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['SpAttack', 'Emit', 'Charge'],
  });
  registerMove(Moves.Mimic, {
    name: 'Mimic',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Twirl', 'Shake', 'Charge'],
  });
  registerMove(Moves.DoubleTeam, {
    name: 'Double Team',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    target: 0,
    flags: 0,
    cast: ['Twirl', 'Dance', 'Double'],
  });
  registerMove(Moves.Bide, {
    name: 'Bide',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    steps: 1,
    priority: 1,
    cast: ['Withdraw', 'Swell', 'Charge'],
  });
  registerMove(Moves.Reflect, {
    name: 'Reflect',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargetFlags.Team | MoveTargetFlags.Own,
    flags: 0,
    cast: ['RearUp', 'Emit', 'Charge'],
  });
  registerMove(Moves.Rest, {
    name: 'Rest',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 5,
    target: 0,
    flags: 0,
    cast: ['Sleep', 'Withdraw', 'Charge'],
  });
  registerMove(Moves.HyperBeam, {
    name: 'Hyper Beam',
    type: Types.Normal,
    category: MoveCategories.Special,
    pp: 5,
    power: 150,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['SpAttack', 'Shoot', 'Charge'],
  });
  registerMove(Moves.SleepPowder, {
    name: 'Sleep Powder',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Powder,
    cast: ['Gas', 'Shake', 'Charge'],
  });
  registerMove(Moves.Cut, {
    name: 'Cut',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 30,
    power: 50,
    accuracy: 95,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slice', 'Strike', 'Attack'],
  });
  registerMove(Moves.Substitute, {
    name: 'Substitute',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: 0,
    flags: 0,
    cast: ['Twirl', 'Withdraw', 'Charge'],
  });
  registerMove(Moves.Scratch, {
    name: 'Scratch',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 35,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['MultiScratch', 'Strike', 'Attack'],
  });
  registerMove(Moves.Ember, {
    name: 'Ember',
    type: Types.Fire,
    category: MoveCategories.Special,
    pp: 25,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Emit', 'Attack'],
  });
  registerMove(Moves.Leer, {
    name: 'Leer',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['RearUp', 'Shake', 'Charge'],
  });
  registerMove(Moves.Slash, {
    name: 'Slash',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 70,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slice', 'Strike', 'Attack'],
  });
  registerMove(Moves.Flamethrower, {
    name: 'Flamethrower',
    type: Types.Fire,
    category: MoveCategories.Special,
    pp: 15,
    power: 90,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Emit', 'Shoot', 'Attack'],
  });
  registerMove(Moves.FireSpin, {
    name: 'Fire Spin',
    type: Types.Fire,
    category: MoveCategories.Special,
    pp: 15,
    power: 35,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Emit', 'Twirl', 'Shoot'],
  });
  registerMove(Moves.MegaPunch, {
    name: 'Mega Punch',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 80,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Punch', 'Uppercut', 'Attack'],
  });
  registerMove(Moves.MegaKick, {
    name: 'Mega Kick',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    power: 120,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Kick', 'Stomp', 'Attack'],
  });
  registerMove(Moves.Submission, {
    name: 'Submission',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 20,
    power: 80,
    accuracy: 80,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'MultiStrike', 'Attack'],
  });
  registerMove(Moves.SeismicToss, {
    name: 'Seismic Toss',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Uppercut', 'Attack'],
  });
  registerMove(Moves.DragonRage, {
    name: 'Dragon Rage',
    type: Types.Dragon,
    category: MoveCategories.Special,
    pp: 10,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Emit', 'Shoot', 'Charge'],
  });
  registerMove(Moves.Dig, {
    name: 'Dig',
    type: Types.Ground,
    category: MoveCategories.Physical,
    pp: 10,
    power: 80,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    steps: 1,
    cast: ['Withdraw', 'Stomp', 'Charge'],
  });
  registerMove(Moves.FireBlast, {
    name: 'Fire Blast',
    type: Types.Fire,
    category: MoveCategories.Special,
    pp: 5,
    power: 110,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Emit', 'Shoot', 'Charge'],
  });
  registerMove(Moves.Swift, {
    name: 'Swift',
    type: Types.Normal,
    category: MoveCategories.Special,
    pp: 20,
    power: 60,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'MultiStrike', 'Attack'],
  });
  registerMove(Moves.SkullBash, {
    name: 'Skull Bash',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    power: 130,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    steps: 1,
    cast: ['Withdraw', 'Strike', 'Charge'],
  });
  registerMove(Moves.Strength, {
    name: 'Strength',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    power: 80,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Strike', 'Attack'],
  });
  registerMove(Moves.Earthquake, {
    name: 'Earthquake',
    type: Types.Ground,
    category: MoveCategories.Physical,
    pp: 10,
    power: 100,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Stomp', 'Slam', 'Charge'],
  });
  registerMove(Moves.Fissure, {
    name: 'Fissure',
    type: Types.Ground,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 30,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Stomp', 'Slam', 'Charge'],
  });
  registerMove(Moves.Fly, {
    name: 'Fly',
    type: Types.Flying,
    category: MoveCategories.Physical,
    pp: 15,
    power: 90,
    accuracy: 95,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    steps: 1,
    cast: ['Hop', 'Strike', 'Charge'],
  });
  registerMove(Moves.TailWhip, {
    name: 'Tail Whip',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Swing', 'Shake', 'Attack'],
  });
  registerMove(Moves.Bubble, {
    name: 'Bubble',
    type: Types.Water,
    category: MoveCategories.Special,
    pp: 30,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Emit', 'Attack'],
  });
  registerMove(Moves.WaterGun, {
    name: 'Water Gun',
    type: Types.Water,
    category: MoveCategories.Special,
    pp: 25,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Emit', 'Attack'],
  });
  registerMove(Moves.Bite, {
    name: 'Bite',
    type: Types.Dark,
    category: MoveCategories.Physical,
    pp: 25,
    power: 60,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Bite', 'Strike', 'Attack'],
  });
  registerMove(Moves.Withdraw, {
    name: 'Withdraw',
    type: Types.Water,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Shake', 'Charge'],
  });
  registerMove(Moves.HydroPump, {
    name: 'Hydro Pump',
    type: Types.Water,
    category: MoveCategories.Special,
    pp: 5,
    power: 110,
    accuracy: 80,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Emit', 'Shoot', 'Charge'],
  });
  registerMove(Moves.BubbleBeam, {
    name: 'Bubble Beam',
    type: Types.Water,
    category: MoveCategories.Special,
    pp: 20,
    power: 65,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Emit', 'Attack'],
  });
  registerMove(Moves.IceBeam, {
    name: 'Ice Beam',
    type: Types.Ice,
    category: MoveCategories.Special,
    pp: 10,
    power: 90,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Shoot', 'Emit', 'Attack'],
  });
  registerMove(Moves.Blizzard, {
    name: 'Blizzard',
    type: Types.Ice,
    category: MoveCategories.Special,
    pp: 5,
    power: 110,
    accuracy: 70,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Emit', 'Shoot', 'Charge'],
  });
  registerMove(Moves.Counter, {
    name: 'Counter',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 20,
    accuracy: 100,
    priority: -5,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Uppercut', 'Strike', 'Attack'],
  });
  registerMove(Moves.Surf, {
    name: 'Surf',
    type: Types.Water,
    category: MoveCategories.Special,
    pp: 15,
    power: 90,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Emit', 'Swell', 'Charge'],
  });
  registerMove(Moves.StringShot, {
    name: 'String Shot',
    type: Types.Bug,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 95,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Emit', 'Attack'],
  });
  registerMove(Moves.Harden, {
    name: 'Harden',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Swell', 'Charge'],
  });
  registerMove(Moves.Confusion, {
    name: 'Confusion',
    type: Types.Psychic,
    category: MoveCategories.Special,
    pp: 25,
    power: 50,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['SpAttack', 'Emit', 'Charge'],
  });
  registerMove(Moves.StunSpore, {
    name: 'Stun Spore',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Powder,
    cast: ['Gas', 'Shake', 'Charge'],
  });
  registerMove(Moves.Supersonic, {
    name: 'Supersonic',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 55,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Sound,
    cast: ['RearUp', 'Emit', 'Charge'],
  });
  registerMove(Moves.Whirlwind, {
    name: 'Whirlwind',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    priority: -6,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    steps: 1,
    cast: ['Swing', 'Twirl', 'Charge'],
  });
  registerMove(Moves.Psybeam, {
    name: 'Psybeam',
    type: Types.Psychic,
    category: MoveCategories.Special,
    pp: 20,
    power: 65,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['SpAttack', 'Shoot', 'Attack'],
  });
  registerMove(Moves.Psychic, {
    name: 'Psychic',
    type: Types.Psychic,
    category: MoveCategories.Special,
    pp: 10,
    power: 90,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['SpAttack', 'Emit', 'Charge'],
  });
  registerMove(Moves.Psywave, {
    name: 'Psywave',
    type: Types.Psychic,
    category: MoveCategories.Special,
    pp: 15,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['SpAttack', 'Shoot', 'Attack'],
  });
  registerMove(Moves.Teleport, {
    name: 'Teleport',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    priority: -6,
    target: 0,
    flags: 0,
    steps: 1,
    cast: ['Twirl', 'Hop', 'Charge'],
  });
  registerMove(Moves.Flash, {
    name: 'Flash',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Emit', 'Swell', 'Charge'],
  });
  registerMove(Moves.PoisonSting, {
    name: 'Poison Sting',
    type: Types.Poison,
    category: MoveCategories.Physical,
    pp: 35,
    power: 15,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Jab', 'Strike', 'Attack'],
  });
  registerMove(Moves.FuryAttack, {
    name: 'Fury Attack',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 15,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['MultiStrike', 'Jab', 'Double'],
  });
  registerMove(Moves.FocusEnergy, {
    name: 'Focus Energy',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Swell', 'RearUp', 'Charge'],
  });
  registerMove(Moves.Twineedle, {
    name: 'Twineedle',
    type: Types.Bug,
    category: MoveCategories.Physical,
    pp: 20,
    power: 25,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['MultiStrike', 'Jab', 'Double'],
  });
  registerMove(Moves.PinMissile, {
    name: 'Pin Missile',
    type: Types.Bug,
    category: MoveCategories.Physical,
    pp: 20,
    power: 25,
    accuracy: 95,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['MultiStrike', 'Shoot', 'Double'],
  });
  registerMove(Moves.Agility, {
    name: 'Agility',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Dance', 'Hop', 'Charge'],
  });
  registerMove(Moves.Gust, {
    name: 'Gust',
    type: Types.Flying,
    category: MoveCategories.Special,
    pp: 35,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Swing', 'Shoot', 'Attack'],
  });
  registerMove(Moves.SandAttack, {
    name: 'Sand Attack',
    type: Types.Ground,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Stomp', 'Shake', 'Attack'],
  });
  registerMove(Moves.QuickAttack, {
    name: 'Quick Attack',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 30,
    power: 40,
    accuracy: 100,
    priority: 1,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['QuickStrike', 'Strike', 'Attack'],
  });
  registerMove(Moves.WingAttack, {
    name: 'Wing Attack',
    type: Types.Flying,
    category: MoveCategories.Physical,
    pp: 35,
    power: 60,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Strike', 'Swing', 'Attack'],
  });
  registerMove(Moves.MirrorMove, {
    name: 'Mirror Move',
    type: Types.Flying,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Twirl', 'RearUp', 'Charge'],
  });
  registerMove(Moves.RazorWind, {
    name: 'Razor Wind',
    type: Types.Normal,
    category: MoveCategories.Special,
    pp: 10,
    power: 80,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    steps: 1,
    cast: ['Shoot', 'Swing', 'Charge'],
  });
  registerMove(Moves.SkyAttack, {
    name: 'Sky Attack',
    type: Types.Flying,
    category: MoveCategories.Physical,
    pp: 5,
    power: 140,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    steps: 1,
    cast: ['Hop', 'Strike', 'Charge'],
  });
  registerMove(Moves.HyperFang, {
    name: 'Hyper Fang',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    power: 80,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Bite', 'Strike', 'Attack'],
  });
  registerMove(Moves.SuperFang, {
    name: 'Super Fang',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Bite', 'Strike', 'Attack'],
  });
  registerMove(Moves.Peck, {
    name: 'Peck',
    type: Types.Flying,
    category: MoveCategories.Physical,
    pp: 35,
    power: 35,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Jab', 'QuickStrike', 'Attack'],
  });
  registerMove(Moves.DrillPeck, {
    name: 'Drill Peck',
    type: Types.Flying,
    category: MoveCategories.Physical,
    pp: 20,
    power: 80,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Jab', 'Twirl', 'Attack'],
  });
  registerMove(Moves.Wrap, {
    name: 'Wrap',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 15,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Twirl', 'Attack'],
  });
  registerMove(Moves.Glare, {
    name: 'Glare',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['RearUp', 'Shake', 'Charge'],
  });
  registerMove(Moves.Screech, {
    name: 'Screech',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Sound,
    cast: ['RearUp', 'Shake', 'Charge'],
  });
  registerMove(Moves.Acid, {
    name: 'Acid',
    type: Types.Poison,
    category: MoveCategories.Special,
    pp: 30,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Gas', 'Shoot', 'Attack'],
  });
  registerMove(Moves.RockSlide, {
    name: 'Rock Slide',
    type: Types.Rock,
    category: MoveCategories.Physical,
    pp: 10,
    power: 75,
    accuracy: 90,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Slam', 'Attack'],
  });
  registerMove(Moves.ThunderShock, {
    name: 'Thunder Shock',
    type: Types.Electric,
    category: MoveCategories.Special,
    pp: 30,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Shock', 'Shoot', 'Attack'],
  });
  registerMove(Moves.ThunderWave, {
    name: 'Thunder Wave',
    type: Types.Electric,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Shock', 'Emit', 'Charge'],
  });
  registerMove(Moves.Thunder, {
    name: 'Thunder',
    type: Types.Electric,
    category: MoveCategories.Special,
    pp: 10,
    power: 110,
    accuracy: 70,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Shock', 'Emit', 'Charge'],
  });
  registerMove(Moves.Thunderbolt, {
    name: 'Thunderbolt',
    type: Types.Electric,
    category: MoveCategories.Special,
    pp: 15,
    power: 90,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Shock', 'Emit', 'Attack'],
  });
  registerMove(Moves.PayDay, {
    name: 'Pay Day',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Ricochet', 'Attack'],
  });
  registerMove(Moves.FurySwipes, {
    name: 'Fury Swipes',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    power: 18,
    accuracy: 80,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['MultiScratch', 'MultiStrike', 'Double'],
  });
  registerMove(Moves.DoubleKick, {
    name: 'Double Kick',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 30,
    power: 30,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Kick', 'MultiStrike', 'Double'],
  });
  registerMove(Moves.HornAttack, {
    name: 'Horn Attack',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 25,
    power: 65,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Jab', 'Strike', 'Attack'],
  });
  registerMove(Moves.HornDrill, {
    name: 'Horn Drill',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 30,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Jab', 'Twirl', 'Attack'],
  });
  // Rampage: every step lands the same attack
  registerMove(Moves.Thrash, {
    name: 'Thrash',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    power: 120,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    steps: 2,
    cast: ['MultiStrike', 'Strike', 'Attack'],
  });
  registerMove(Moves.Pound, {
    name: 'Pound',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 35,
    power: 40,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Strike', 'Attack'],
  });
  registerMove(Moves.Sing, {
    name: 'Sing',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 55,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Sound,
    cast: ['RearUp', 'Dance', 'Charge'],
  });
  registerMove(Moves.DoubleSlap, {
    name: 'Double Slap',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    power: 15,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['MultiStrike', 'Jab', 'Double'],
  });
  registerMove(Moves.Minimize, {
    name: 'Minimize',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Shake', 'Charge'],
  });
  registerMove(Moves.Metronome, {
    name: 'Metronome',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Shake', 'Twirl', 'Charge'],
  });
  registerMove(Moves.DefenseCurl, {
    name: 'Defense Curl',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Twirl', 'Charge'],
  });
  registerMove(Moves.LightScreen, {
    name: 'Light Screen',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargetFlags.Team | MoveTargetFlags.Own,
    flags: 0,
    cast: ['RearUp', 'Emit', 'Charge'],
  });
  registerMove(Moves.Roar, {
    name: 'Roar',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    priority: -6,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Sound,
    steps: 1,
    cast: ['RearUp', 'Swell', 'Charge'],
  });
  registerMove(Moves.ConfuseRay, {
    name: 'Confuse Ray',
    type: Types.Ghost,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Emit', 'Shoot', 'Charge'],
  });
  registerMove(Moves.Disable, {
    name: 'Disable',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Emit', 'RearUp', 'Charge'],
  });
  registerMove(Moves.LeechLife, {
    name: 'Leech Life',
    type: Types.Bug,
    category: MoveCategories.Physical,
    pp: 10,
    power: 80,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Bite', 'Jab', 'Attack'],
  });
  registerMove(Moves.Haze, {
    name: 'Haze',
    type: Types.Ice,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Gas', 'Emit', 'Charge'],
  });
  registerMove(Moves.Absorb, {
    name: 'Absorb',
    type: Types.Grass,
    category: MoveCategories.Special,
    pp: 25,
    power: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['SpAttack', 'Emit', 'Charge'],
  });
  // Rampage: every step lands the same attack
  registerMove(Moves.PetalDance, {
    name: 'Petal Dance',
    type: Types.Grass,
    category: MoveCategories.Special,
    pp: 10,
    power: 120,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    steps: 2,
    cast: ['Dance', 'Twirl', 'Attack'],
  });
  registerMove(Moves.Spore, {
    name: 'Spore',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Powder,
    cast: ['Gas', 'Shake', 'Charge'],
  });
  registerMove(Moves.KarateChop, {
    name: 'Karate Chop',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 25,
    power: 50,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slice', 'Strike', 'Attack'],
  });
  registerMove(Moves.Hypnosis, {
    name: 'Hypnosis',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 60,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Emit', 'RearUp', 'Charge'],
  });
  registerMove(Moves.Amnesia, {
    name: 'Amnesia',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Shake', 'RearUp', 'Charge'],
  });
  registerMove(Moves.Recover, {
    name: 'Recover',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: 0,
    flags: 0,
    cast: ['Swell', 'RearUp', 'Charge'],
  });
  // Power is the target's weight; the registered figure is what the
  // dex shows and what a targetless rating reads. See
  // [`src/battle/moves/weight.ts`](../../battle/moves/weight.ts)
  registerMove(Moves.LowKick, {
    name: 'Low Kick',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 20,
    power: 50,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Kick', 'Strike', 'Attack'],
  });
  registerMove(Moves.Slam, {
    name: 'Slam',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 80,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Strike', 'Attack'],
  });
  registerMove(Moves.Constrict, {
    name: 'Constrict',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 35,
    power: 10,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Strike', 'Attack'],
  });
  registerMove(Moves.Barrier, {
    name: 'Barrier',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'RearUp', 'Charge'],
  });
  registerMove(Moves.RockThrow, {
    name: 'Rock Throw',
    type: Types.Rock,
    category: MoveCategories.Physical,
    pp: 15,
    power: 50,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Swing', 'Attack'],
  });
  registerMove(Moves.SelfDestruct, {
    name: 'Self-Destruct',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    power: 200,
    accuracy: 100,
    target:
      MoveTargetFlags.Multiple |
      MoveTargetFlags.Self |
      MoveTargetFlags.Enemy |
      MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Swell', 'Emit', 'Charge'],
  });
  registerMove(Moves.Explosion, {
    name: 'Explosion',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    power: 250,
    accuracy: 100,
    target:
      MoveTargetFlags.Multiple |
      MoveTargetFlags.Self |
      MoveTargetFlags.Enemy |
      MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Swell', 'Emit', 'Charge'],
  });
  registerMove(Moves.Stomp, {
    name: 'Stomp',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 65,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Stomp', 'Slam', 'Attack'],
  });
  registerMove(Moves.Headbutt, {
    name: 'Headbutt',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    power: 70,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Strike', 'RearUp', 'Attack'],
  });
  registerMove(Moves.SonicBoom, {
    name: 'Sonic Boom',
    type: Types.Normal,
    category: MoveCategories.Special,
    pp: 20,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Emit', 'Attack'],
  });
  registerMove(Moves.TriAttack, {
    name: 'Tri Attack',
    type: Types.Normal,
    category: MoveCategories.Special,
    pp: 10,
    power: 80,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['SpAttack', 'MultiStrike', 'Shoot'],
  });
  registerMove(Moves.AuroraBeam, {
    name: 'Aurora Beam',
    type: Types.Ice,
    category: MoveCategories.Special,
    pp: 20,
    power: 65,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Shoot', 'Emit', 'Attack'],
  });
  registerMove(Moves.PoisonGas, {
    name: 'Poison Gas',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Gas', 'Emit', 'Charge'],
  });
  registerMove(Moves.Sludge, {
    name: 'Sludge',
    type: Types.Poison,
    category: MoveCategories.Special,
    pp: 20,
    power: 65,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Gas', 'Shoot', 'Attack'],
  });
  registerMove(Moves.Clamp, {
    name: 'Clamp',
    type: Types.Water,
    category: MoveCategories.Physical,
    pp: 15,
    power: 35,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Bite', 'Withdraw', 'Attack'],
  });
  registerMove(Moves.SpikeCannon, {
    name: 'Spike Cannon',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    power: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['MultiStrike', 'Shoot', 'Double'],
  });
  registerMove(Moves.Lick, {
    name: 'Lick',
    type: Types.Ghost,
    category: MoveCategories.Physical,
    pp: 30,
    power: 30,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Lick', 'Jab', 'Attack'],
  });
  registerMove(Moves.NightShade, {
    name: 'Night Shade',
    type: Types.Ghost,
    category: MoveCategories.Special,
    pp: 15,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['SpAttack', 'Emit', 'Charge'],
  });
  registerMove(Moves.DreamEater, {
    name: 'Dream Eater',
    type: Types.Psychic,
    category: MoveCategories.Special,
    pp: 15,
    power: 100,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['SpAttack', 'Emit', 'Charge'],
  });
  registerMove(Moves.Bind, {
    name: 'Bind',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 15,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Twirl', 'Attack'],
  });
  registerMove(Moves.Meditate, {
    name: 'Meditate',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
    cast: ['RearUp', 'Swell', 'Charge'],
  });
  registerMove(Moves.ViceGrip, {
    name: 'Vice Grip',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 30,
    power: 55,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Bite', 'Strike', 'Attack'],
  });
  registerMove(Moves.Guillotine, {
    name: 'Guillotine',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 30,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slice', 'Bite', 'Attack'],
  });
  registerMove(Moves.Crabhammer, {
    name: 'Crabhammer',
    type: Types.Water,
    category: MoveCategories.Physical,
    pp: 10,
    power: 100,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Slam', 'Strike', 'Attack'],
  });
  registerMove(Moves.Barrage, {
    name: 'Barrage',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 15,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['MultiStrike', 'Shoot', 'Double'],
  });
  registerMove(Moves.EggBomb, {
    name: 'Egg Bomb',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    power: 100,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Shoot', 'Ricochet', 'Attack'],
  });
  registerMove(Moves.BoneClub, {
    name: 'Bone Club',
    type: Types.Ground,
    category: MoveCategories.Physical,
    pp: 20,
    power: 65,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Swing', 'Strike', 'Attack'],
  });
  registerMove(Moves.Bonemerang, {
    name: 'Bonemerang',
    type: Types.Ground,
    category: MoveCategories.Physical,
    pp: 10,
    power: 50,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Ricochet', 'Shoot', 'Swing'],
  });
  registerMove(Moves.CometPunch, {
    name: 'Comet Punch',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 15,
    power: 18,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['MultiStrike', 'Punch', 'Double'],
  });
  registerMove(Moves.FirePunch, {
    name: 'Fire Punch',
    type: Types.Fire,
    category: MoveCategories.Physical,
    pp: 15,
    power: 75,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Punch', 'Uppercut', 'Attack'],
  });
  registerMove(Moves.IcePunch, {
    name: 'Ice Punch',
    type: Types.Ice,
    category: MoveCategories.Physical,
    pp: 15,
    power: 75,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Punch', 'Uppercut', 'Attack'],
  });
  registerMove(Moves.ThunderPunch, {
    name: 'Thunder Punch',
    type: Types.Electric,
    category: MoveCategories.Physical,
    pp: 15,
    power: 75,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Punch', 'Uppercut', 'Attack'],
  });
  registerMove(Moves.RollingKick, {
    name: 'Rolling Kick',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 15,
    power: 60,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Kick', 'Twirl', 'Attack'],
  });
  registerMove(Moves.JumpKick, {
    name: 'Jump Kick',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 10,
    power: 100,
    accuracy: 95,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Kick', 'Hop', 'Attack'],
  });
  registerMove(Moves.HiJumpKick, {
    name: 'High Jump Kick',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 10,
    power: 130,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Kick', 'Hop', 'Attack'],
  });
  registerMove(Moves.Smog, {
    name: 'Smog',
    type: Types.Poison,
    category: MoveCategories.Special,
    pp: 20,
    power: 30,
    accuracy: 70,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Gas', 'Emit', 'Attack'],
  });
  registerMove(Moves.SmokeScreen, {
    name: 'Smokescreen',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Gas', 'Emit', 'Charge'],
  });
  registerMove(Moves.DizzyPunch, {
    name: 'Dizzy Punch',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    power: 70,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Punch', 'Twirl', 'Attack'],
  });
  registerMove(Moves.Waterfall, {
    name: 'Waterfall',
    type: Types.Water,
    category: MoveCategories.Physical,
    pp: 15,
    power: 80,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Emit', 'Hop', 'Charge'],
  });
  registerMove(Moves.LovelyKiss, {
    name: 'Lovely Kiss',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Lick', 'RearUp', 'Charge'],
  });
  // Famously does nothing at all
  registerMove(Moves.Splash, {
    name: 'Splash',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
    cast: ['Hop', 'Shake', 'Attack'],
  });
  registerMove(Moves.Mist, {
    name: 'Mist',
    type: Types.Ice,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargetFlags.Team | MoveTargetFlags.Own,
    flags: 0,
    cast: ['Gas', 'Emit', 'Charge'],
  });
  registerMove(Moves.Transform, {
    name: 'Transform',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Twirl', 'Swell', 'Charge'],
  });
  registerMove(Moves.AcidArmor, {
    name: 'Acid Armor',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Swell', 'Charge'],
  });
  registerMove(Moves.Sharpen, {
    name: 'Sharpen',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Swell', 'RearUp', 'Charge'],
  });
  // https://bulbapedia.bulbagarden.net/wiki/Conversion_(move)
  registerMove(Moves.Conversion, {
    name: 'Conversion',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Swell', 'RearUp', 'Charge'],
  });
  // https://bulbapedia.bulbagarden.net/wiki/Kinesis_(move)
  registerMove(Moves.Kinesis, {
    name: 'Kinesis',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 80,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Twirl', 'Shake', 'Charge'],
  });
  // https://bulbapedia.bulbagarden.net/wiki/Soft-Boiled_(move)
  registerMove(Moves.SoftBoiled, {
    name: 'Soft-Boiled',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: 0,
    flags: 0,
    cast: ['Swell', 'RearUp', 'Charge'],
  });
  /**
   * What is thrown when there is nothing left to throw.
   *
   * Nobody learns it and nothing teaches it: the engine reaches for it
   * on a pokemon whose every move is spent, disabled or otherwise shut
   * off. It is typeless — `Unknown` is not in the chart, so nothing
   * resists it and nothing is immune — and it costs the user a quarter
   * of its whole health whatever it lands for
   */
  /**
   * The plain swing every pokemon has in it.
   *
   * Nobody learns it and it is in no move set: the engine reaches for
   * it when a unit is able to act and has nothing it may cast — every
   * move it knows still cooling — which on a cartridge is not a state
   * that exists and here is most of a fight. Standing still through
   * those gaps made a battle read as two pokemon waiting for timers.
   *
   * It is deliberately feeble. Ten power is a tenth of a real move and
   * the PP is what makes it come back about once a second, so it fills
   * the gaps without ever being worth choosing over something the
   * pokemon actually knows.
   *
   * Its type is `Unknown` here and resolved when it is thrown — see
   * [`attack.ts`](../../battle/moves/attack.ts) — to whatever the user
   * is: a Charmander's swing is Fire, which is the same thing as
   * saying a pokemon attacks with what it is made of
   */
  registerMove(Moves.Attack, {
    name: 'Attack',
    type: Types.Unknown,
    category: MoveCategories.Physical,
    power: 10,
    pp: 180,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Strike', 'Attack'],
  });
  registerMove(Moves.Struggle, {
    name: 'Struggle',
    type: Types.Unknown,
    category: MoveCategories.Physical,
    power: 50,
    pp: 1,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Strike', 'Attack'],
  });
}
