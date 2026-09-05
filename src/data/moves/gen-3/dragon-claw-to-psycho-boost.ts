import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/**
 * From Dragon Claw to Psycho Boost: the last stretch of Hoenn's list,
 * the setup moves and what the legendaries keep to themselves
 */
export default function registerDragonClawToPsychoBoost(): void {
  registerMove(Moves.DragonClaw, {
    name: 'Dragon Claw',
    description: 'Plain contact damage.',
    type: Types.Dragon,
    category: MoveCategories.Physical,
    power: 80,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Scratch, SpriteAnim.Slice, SpriteAnim.Attack],
  });
  registerMove(Moves.FrenzyPlant, {
    name: 'Frenzy Plant',
    description: 'The user has to recharge afterwards.',
    type: Types.Grass,
    category: MoveCategories.Special,
    power: 150,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.BulkUp, {
    name: 'Bulk Up',
    description: "Raises the user's Attack and Defense a stage each.",
    type: Types.Fighting,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.RaiseArms, SpriteAnim.Charge],
  });
  registerMove(Moves.Bounce, {
    name: 'Bounce',
    description: 'Springs up out of reach, then comes down on the target. 30% to paralyse.',
    type: Types.Flying,
    category: MoveCategories.Physical,
    power: 85,
    pp: 5,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 1,
    cast: [SpriteAnim.Hop, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.MudShot, {
    name: 'Mud Shot',
    description: "Always drops the target's Speed a stage.",
    type: Types.Ground,
    category: MoveCategories.Special,
    power: 55,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.PoisonTail, {
    name: 'Poison Tail',
    description: 'Crits more readily. 10% to poison.',
    type: Types.Poison,
    category: MoveCategories.Physical,
    power: 50,
    pp: 25,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.TailWhip, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Covet, {
    name: 'Covet',
    description: "Takes the target's held item if the user is carrying nothing.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 60,
    pp: 25,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Appeal, SpriteAnim.Scratch, SpriteAnim.Attack],
  });
  registerMove(Moves.VoltTackle, {
    name: 'Volt Tackle',
    description: 'The user takes 1/3 of the damage it deals. 10% to paralyse.',
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 120,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Shock, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.MagicalLeaf, {
    name: 'Magical Leaf',
    description: 'Never misses.',
    type: Types.Grass,
    category: MoveCategories.Special,
    power: 60,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.WaterSport, {
    name: 'Water Sport',
    description: 'For 10 seconds Fire moves hit for 1/2.',
    type: Types.Water,
    category: MoveCategories.Status,
    pp: 15,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.CalmMind, {
    name: 'Calm Mind',
    description: "Raises the user's Special Attack and Special Defense a stage each.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.LeafBlade, {
    name: 'Leaf Blade',
    description: 'Crits more readily.',
    type: Types.Grass,
    category: MoveCategories.Physical,
    power: 90,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact | MoveFlags.Slicing,
    cast: [SpriteAnim.Slice, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.DragonDance, {
    name: 'Dragon Dance',
    description: "Raises the user's Attack and Speed a stage each.",
    type: Types.Dragon,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Dance, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.RockBlast, {
    name: 'Rock Blast',
    description: 'Strikes 2 to 5 times.',
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 25,
    pp: 10,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.MultiStrike, SpriteAnim.Attack],
  });
  registerMove(Moves.ShockWave, {
    name: 'Shock Wave',
    description: 'Never misses.',
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 60,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.WaterPulse, {
    name: 'Water Pulse',
    description: '20% to confuse.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 60,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.DoomDesire, {
    name: 'Doom Desire',
    description: 'Lands on the target 4 seconds later, whatever is standing there by then.',
    type: Types.Steel,
    category: MoveCategories.Special,
    power: 140,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.PsychoBoost, {
    name: 'Psycho Boost',
    description: "Drops the user's Special Attack 2 stages after it lands.",
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 140,
    pp: 5,
    accuracy: 90,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Swell, SpriteAnim.Charge],
  });
}
