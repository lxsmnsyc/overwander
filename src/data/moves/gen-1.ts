import { Types } from '../constants/types';
import { MoveCategories, MoveFlags, MoveTargetFlags, Moves } from '../ids/moves';
import { registerMove } from './__create';

// Flight time of a thrown/shot projectile before its impact cue
const PROJECTILE_DELAY = 250;

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
  });
  registerMove(Moves.Growl, {
    name: 'Growl',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
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
    delay: PROJECTILE_DELAY,
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
    flags: MoveFlags.Powder,
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
    power: 85,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
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
  });
  registerMove(Moves.Mimic, {
    name: 'Mimic',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
  registerMove(Moves.DoubleTeam, {
    name: 'Double Team',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.Reflect, {
    name: 'Reflect',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargetFlags.Team | MoveTargetFlags.Own,
    flags: 0,
  });
  registerMove(Moves.Rest, {
    name: 'Rest',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 5,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.SleepPowder, {
    name: 'Sleep Powder',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Powder,
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
  });
  registerMove(Moves.Substitute, {
    name: 'Substitute',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.Leer, {
    name: 'Leer',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.SeismicToss, {
    name: 'Seismic Toss',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
  });
  registerMove(Moves.DragonRage, {
    name: 'Dragon Rage',
    type: Types.Dragon,
    category: MoveCategories.Special,
    pp: 10,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.Fissure, {
    name: 'Fissure',
    type: Types.Ground,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 30,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.TailWhip, {
    name: 'Tail Whip',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 100,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.Withdraw, {
    name: 'Withdraw',
    type: Types.Water,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.Harden, {
    name: 'Harden',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.StunSpore, {
    name: 'Stun Spore',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 75,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Powder,
  });
  registerMove(Moves.Supersonic, {
    name: 'Supersonic',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 55,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Sound,
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
  });
  registerMove(Moves.Psywave, {
    name: 'Psywave',
    type: Types.Psychic,
    category: MoveCategories.Special,
    pp: 15,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.Flash, {
    name: 'Flash',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.FocusEnergy, {
    name: 'Focus Energy',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.Agility, {
    name: 'Agility',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.MirrorMove, {
    name: 'Mirror Move',
    type: Types.Flying,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.SuperFang, {
    name: 'Super Fang',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
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
  });
  registerMove(Moves.Glare, {
    name: 'Glare',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
  registerMove(Moves.Screech, {
    name: 'Screech',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 85,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Sound,
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
  });
  registerMove(Moves.ThunderWave, {
    name: 'Thunder Wave',
    type: Types.Electric,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.HornDrill, {
    name: 'Horn Drill',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 30,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
  });
  // TODO rampage lock (repeat use, confusion afterwards)
  registerMove(Moves.Thrash, {
    name: 'Thrash',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    power: 120,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
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
  });
  registerMove(Moves.Sing, {
    name: 'Sing',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 55,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Sound,
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
  });
  registerMove(Moves.Minimize, {
    name: 'Minimize',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: 0,
    flags: 0,
  });
  registerMove(Moves.Metronome, {
    name: 'Metronome',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
  registerMove(Moves.DefenseCurl, {
    name: 'Defense Curl',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
  });
  registerMove(Moves.LightScreen, {
    name: 'Light Screen',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargetFlags.Team | MoveTargetFlags.Own,
    flags: 0,
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
  });
  registerMove(Moves.ConfuseRay, {
    name: 'Confuse Ray',
    type: Types.Ghost,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
  registerMove(Moves.Disable, {
    name: 'Disable',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.Haze, {
    name: 'Haze',
    type: Types.Ice,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.PetalDance, {
    name: 'Petal Dance',
    type: Types.Grass,
    category: MoveCategories.Special,
    pp: 10,
    power: 120,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
  });
  registerMove(Moves.Spore, {
    name: 'Spore',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Powder,
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
  });
  registerMove(Moves.Hypnosis, {
    name: 'Hypnosis',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 60,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
  registerMove(Moves.Amnesia, {
    name: 'Amnesia',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
  });
  registerMove(Moves.Recover, {
    name: 'Recover',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: 0,
    flags: 0,
  });
  // TODO weight-based power once species declare their weight
  registerMove(Moves.LowKick, {
    name: 'Low Kick',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 20,
    power: 50,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
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
  });
  registerMove(Moves.Barrier, {
    name: 'Barrier',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.PoisonGas, {
    name: 'Poison Gas',
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 40,
    accuracy: 90,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.NightShade, {
    name: 'Night Shade',
    type: Types.Ghost,
    category: MoveCategories.Special,
    pp: 15,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
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
  });
  registerMove(Moves.Meditate, {
    name: 'Meditate',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
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
  });
  registerMove(Moves.Guillotine, {
    name: 'Guillotine',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 30,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
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
  });
  registerMove(Moves.SmokeScreen, {
    name: 'Smokescreen',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
  });
}
