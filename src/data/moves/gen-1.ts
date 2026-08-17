import { Types } from '../constants/types';
import { MoveCategories, MoveFlags, MoveTargetFlags, Moves } from '../ids/moves';
import { registerMove } from './__create';

// Flight time of a thrown/shot projectile before its impact cue
const PROJECTILE_DELAY = 800;

export default function registerGen1Moves(): void {
  registerMove(Moves.Tackle, {
    name: 'Tackle',
    description: 'Plain contact damage.',
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
    description: 'Drops the Attack of everything opposite by a stage. It is a sound.',
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
    description:
      'Roots the target: an eighth of its pool every two seconds, drained to the seeder. Grass is immune.',
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
    description: 'Plain contact damage.',
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
    description: 'Poisons the target. A powder, so Grass ignores it.',
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
    description: 'Hits everything opposite, and crits more readily.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 55,
    pp: 25,
    accuracy: 95,
    target: MoveTargetFlags.Multiple | MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: ['Slice', 'Shoot', 'Attack'],
  });
  registerMove(Moves.Growth, {
    name: 'Growth',
    description: "Raises the user's Special Attack a stage.",
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Swell', 'RearUp', 'Charge'],
  });
  registerMove(Moves.SolarBeam, {
    name: 'Solar Beam',
    description: 'Winds up unless the sun is out. Fog, rain, hail and sandstorm halve it.',
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
    description: "Raises the user's Attack two stages.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Dance', 'Twirl', 'Charge'],
  });
  registerMove(Moves.Toxic, {
    name: 'Toxic',
    description: 'Badly poisons the target: it bites harder the longer it holds.',
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
    description: '30% to paralyse. Never misses a minimized target, and doubles on it.',
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
    description: 'The user takes a quarter of the damage it deals.',
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
    description: 'The user takes a third of the damage it deals.',
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
    description:
      'Every hit the user takes raises its Attack a stage, until it casts something else.',
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
    description: 'Heals the user for half the damage dealt.',
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
    description: "Replaces itself with the target's last move.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Twirl', 'Shake', 'Charge'],
  });
  registerMove(Moves.DoubleTeam, {
    name: 'Double Team',
    description: "Raises the user's evasion a stage.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    target: 0,
    flags: 0,
    cast: ['Twirl', 'Dance', 'Double'],
  });
  registerMove(Moves.Bide, {
    name: 'Bide',
    description: 'Channels twice as long, then throws back double the damage taken while biding.',
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
    description: "Cuts physical damage against the user's side by a third for ten seconds.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargetFlags.Team | MoveTargetFlags.Own,
    flags: 0,
    cast: ['RearUp', 'Emit', 'Charge'],
  });
  registerMove(Moves.Rest, {
    name: 'Rest',
    description:
      'The user sleeps at full health, cured of everything. Nothing happens if it cannot sleep.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 5,
    target: 0,
    flags: 0,
    cast: ['Sleep', 'Withdraw', 'Charge'],
  });
  registerMove(Moves.HyperBeam, {
    name: 'Hyper Beam',
    description: 'The user must recharge for a second after it lands.',
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
    description: 'Puts the target to sleep. A powder, so Grass ignores it.',
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
    description: 'Plain contact damage.',
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
    description: 'Spends a quarter of the pool on a decoy that takes hits for the user.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: 0,
    flags: 0,
    cast: ['Twirl', 'Withdraw', 'Charge'],
  });
  registerMove(Moves.Scratch, {
    name: 'Scratch',
    description: 'Plain contact damage.',
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
    description: '10% to burn.',
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
    description: 'Drops the Defense of everything opposite by a stage.',
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
    description: 'Crits more readily.',
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
    description: '10% to burn.',
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
    description:
      'Binds the target: an eighth of its pool a second for four seconds, and no escape.',
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
    description: 'Plain contact damage.',
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
    description: 'Plain contact damage.',
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
    description: 'The user takes a quarter of the damage it deals.',
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
    description: "Deals the user's level in damage, whatever the stats say.",
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
    description: 'Deals a flat 40 damage.',
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
    description:
      'The user burrows out of sight, then strikes. Only Earthquake — for double — and Fissure reach it.',
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
    description: '10% to burn.',
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
    description: 'Hits everything opposite, and never misses.',
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
    description: "Raises the user's Defense a stage as it winds up, then hits.",
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
    description: 'Plain contact damage.',
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
    description: 'Hits everything opposite, and doubles on anything underground from Dig.',
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
    description: "Takes the target's whole health, at 30% accuracy. Sturdy shrugs it off.",
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
    description:
      'The user takes to the air, then strikes. Only Gust — for double — and Thunder reach it.',
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
    description: 'Drops the Defense of everything opposite by a stage.',
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
    description: "Hits everything opposite, 10% to drop the target's Speed a stage.",
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
    description: 'Plain damage.',
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
    description: '30% to flinch.',
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
    description: "Raises the user's Defense a stage.",
    type: Types.Water,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Shake', 'Charge'],
  });
  registerMove(Moves.HydroPump, {
    name: 'Hydro Pump',
    description: 'Plain damage.',
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
    description: "10% to drop the target's Speed a stage.",
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
    description: '10% to freeze.',
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
    description: 'Hits everything opposite, 10% to freeze, and never misses in hail or snow.',
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
    description:
      'Returns double the last physical hit taken, at whoever landed it rather than the chosen target.',
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
    description: 'Hits everything opposite.',
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
    description: 'Drops the Speed of everything opposite by two stages.',
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
    description: "Raises the user's Defense a stage.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Swell', 'Charge'],
  });
  registerMove(Moves.Confusion, {
    name: 'Confusion',
    description: '10% to confuse.',
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
    description: 'Paralyses the target. A powder, so Grass ignores it.',
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
    description: 'Confuses the target. It is a sound.',
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
    description: 'Throws the target off the field and drags its weakest teammate in. Slow to cast.',
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
    description: '10% to confuse.',
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
    description: "10% to drop the target's Special Defense a stage.",
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
    description: "Deals between half and one and a half times the user's level.",
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
    description: 'Swaps the user out for its strongest teammate. Slow to cast.',
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
    description: "Drops the target's accuracy a stage.",
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
    description: '30% to poison.',
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
    description: 'Strikes two to five times, a quarter-second apart.',
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
    description: 'The user crits far more readily until it leaves the field.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Swell', 'RearUp', 'Charge'],
  });
  registerMove(Moves.Twineedle, {
    name: 'Twineedle',
    description: 'Strikes twice, each strike with a 20% chance to poison.',
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
    description: 'Strikes two to five times.',
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
    description: "Raises the user's Speed two stages.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Dance', 'Hop', 'Charge'],
  });
  registerMove(Moves.Gust, {
    name: 'Gust',
    description: 'Doubles on anything in the air from Fly.',
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
    description: "Drops the target's accuracy a stage.",
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
    description: 'Winds up faster than an ordinary move.',
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
    description: 'Plain contact damage.',
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
    description: "Uses the target's last move back at it.",
    type: Types.Flying,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Twirl', 'RearUp', 'Charge'],
  });
  registerMove(Moves.RazorWind, {
    name: 'Razor Wind',
    description: 'Winds up, then fires. Crits more readily.',
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
    description: 'Winds up, then dives. Crits more readily, and 30% to flinch.',
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
    description: '10% to flinch.',
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
    description: 'Halves whatever health the target has left.',
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
    description: 'Plain contact damage.',
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
    description: 'Plain contact damage.',
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
    description:
      'Binds the target: an eighth of its pool a second for four seconds, and no escape.',
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
    description: 'Paralyses the target.',
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
    description: "Drops the target's Defense two stages. It is a sound.",
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
    description: "Hits everything opposite, 10% to drop the target's Special Defense a stage.",
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
    description: 'Hits everything opposite, 30% to flinch.',
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
    description: '10% to paralyse.',
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
    description: 'Paralyses the target.',
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
    description: '30% to paralyse. Never misses in rain, 50% accuracy in sun.',
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
    description: '10% to paralyse.',
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
    description: 'Plain damage — no coins are scattered here.',
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
    description: 'Strikes two to five times.',
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
    description: 'Strikes twice.',
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
    description: 'Plain contact damage.',
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
    description: "Takes the target's whole health, at 30% accuracy. Sturdy shrugs it off.",
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
    description: 'Lands the same hit three times over, and leaves the user confused.',
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
    description: 'Plain contact damage.',
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
    description: 'Puts the target to sleep. It is a sound.',
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
    description: 'Strikes two to five times.',
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
    description:
      "Raises the user's evasion two stages, but Body Slam and Stomp then never miss it and double.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Shake', 'Charge'],
  });
  registerMove(Moves.Metronome, {
    name: 'Metronome',
    description: 'Casts a move at random, bar itself, Mirror Move and the two nobody learns.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Shake', 'Twirl', 'Charge'],
  });
  registerMove(Moves.DefenseCurl, {
    name: 'Defense Curl',
    description: "Raises the user's Defense a stage.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Twirl', 'Charge'],
  });
  registerMove(Moves.LightScreen, {
    name: 'Light Screen',
    description: "Cuts special damage against the user's side by a third for ten seconds.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargetFlags.Team | MoveTargetFlags.Own,
    flags: 0,
    cast: ['RearUp', 'Emit', 'Charge'],
  });
  registerMove(Moves.Roar, {
    name: 'Roar',
    description:
      'Throws the target off the field and drags its weakest teammate in. Slow, and a sound.',
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
    description: 'Confuses the target.',
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
    description:
      'Shuts off the move the target is using — interrupting it — or its last, for five seconds.',
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
    description: 'Heals the user for half the damage dealt.',
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
    description: "Resets every stat stage on the field, the user's included.",
    type: Types.Ice,
    category: MoveCategories.Status,
    pp: 30,
    target: 0,
    flags: 0,
    cast: ['Gas', 'Emit', 'Charge'],
  });
  registerMove(Moves.Absorb, {
    name: 'Absorb',
    description: 'Heals the user for half the damage dealt.',
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
    description: 'Lands the same hit three times over, and leaves the user confused.',
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
    description: 'Puts the target to sleep. A powder, so Grass ignores it.',
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
    description: 'Crits more readily.',
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
    description: 'Puts the target to sleep.',
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
    description: "Raises the user's Special Defense two stages.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Shake', 'RearUp', 'Charge'],
  });
  registerMove(Moves.Recover, {
    name: 'Recover',
    description: 'Heals the user half its pool.',
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
    description:
      'Hits for what the target weighs: 20 power under 10 kg, rising to 120 at 200 kg and over.',
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
    description: 'Plain contact damage.',
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
    description: "10% to drop the target's Speed a stage.",
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
    description: "Raises the user's Defense two stages.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'RearUp', 'Charge'],
  });
  registerMove(Moves.RockThrow, {
    name: 'Rock Throw',
    description: 'Plain damage.',
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
    description: 'Hits everything opposite, and costs the user its own life.',
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
    description: 'Hits everything opposite, and costs the user its own life.',
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
    description: '30% to flinch. Never misses a minimized target, and doubles on it.',
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
    description: '30% to flinch.',
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
    description: 'Deals a flat 20 damage.',
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
    description: '20% to burn, freeze or paralyse, rolled evenly between the three.',
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
    description: "10% to drop the target's Attack a stage.",
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
    description: 'Poisons the target.',
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
    description: '30% to poison.',
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
    description:
      'Binds the target: an eighth of its pool a second for four seconds, and no escape.',
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
    description: 'Strikes two to five times.',
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
    description: '30% to paralyse.',
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
    description: "Deals the user's level in damage, whatever the stats say.",
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
    description: 'Only works on a sleeping target. Heals the user for half the damage dealt.',
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
    description:
      'Binds the target: an eighth of its pool a second for four seconds, and no escape.',
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
    description: "Raises the user's Attack a stage.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
    cast: ['RearUp', 'Swell', 'Charge'],
  });
  registerMove(Moves.ViceGrip, {
    name: 'Vice Grip',
    description: 'Plain contact damage.',
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
    description: "Takes the target's whole health, at 30% accuracy. Sturdy shrugs it off.",
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
    description: 'Crits more readily.',
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
    description: 'Strikes two to five times.',
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
    description: 'Plain damage.',
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
    description: '10% to flinch.',
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
    description: 'Strikes twice.',
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
    description: 'Strikes two to five times.',
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
    description: '10% to burn.',
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
    description: '10% to freeze.',
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
    description: '10% to paralyse.',
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
    description: '30% to flinch.',
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
    description: 'A miss costs the user half its pool.',
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
    description: 'A miss costs the user half its pool.',
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
    description: '40% to poison.',
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
    description: "Drops the target's accuracy a stage.",
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
    description: '20% to confuse.',
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
    description: '20% to flinch.',
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
    description: 'Puts the target to sleep.',
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
    description: 'Does nothing whatsoever.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: 0,
    flags: 0,
    cast: ['Hop', 'Shake', 'Attack'],
  });
  registerMove(Moves.Mist, {
    name: 'Mist',
    description: "For ten seconds, nobody else can lower a stat stage on the user's side.",
    type: Types.Ice,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargetFlags.Team | MoveTargetFlags.Own,
    flags: 0,
    cast: ['Gas', 'Emit', 'Charge'],
  });
  registerMove(Moves.Transform, {
    name: 'Transform',
    description:
      "Copies the target's look, types, stats bar health, stages and moves until the user leaves.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: 0,
    cast: ['Twirl', 'Swell', 'Charge'],
  });
  registerMove(Moves.AcidArmor, {
    name: 'Acid Armor',
    description: "Raises the user's Defense two stages.",
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 20,
    target: 0,
    flags: 0,
    cast: ['Withdraw', 'Swell', 'Charge'],
  });
  registerMove(Moves.Sharpen, {
    name: 'Sharpen',
    description: "Raises the user's Attack a stage.",
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
    description:
      'The user becomes the type of the first move it carries, and drops the types it had.',
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
    description: "Drops the target's accuracy a stage.",
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
    description: 'Heals the user half its pool.',
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
    description: 'A feeble swing made of whatever the user is, for the gaps while real moves cool.',
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
    description:
      'Thrown when every move is shut off. Nothing resists it, and it costs a quarter of the pool.',
    type: Types.Unknown,
    category: MoveCategories.Physical,
    power: 50,
    pp: 1,
    target: MoveTargetFlags.Enemy | MoveTargetFlags.Unit,
    flags: MoveFlags.Contact,
    cast: ['Strike', 'Attack'],
  });
}
