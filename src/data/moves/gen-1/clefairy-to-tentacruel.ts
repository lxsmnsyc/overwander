import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * The middle of the dex, Clefairy to Tentacruel: the sleepers, the
 * spore carriers and the first psychics
 */
export default function registerClefairyToTentacruelMoves(): void {
  registerMove(Moves.Pound, {
    name: 'Pound',
    description: 'Plain contact damage.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 35,
    power: 40,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Slap, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Sing, {
    name: 'Sing',
    description: 'Puts the target to sleep. It is a sound.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 55,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Sound, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.DoubleSlap, {
    name: 'Double Slap',
    description: 'Strikes 2 to 5 times.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 10,
    power: 15,
    accuracy: 85,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slap, SpriteAnim.MultiStrike, SpriteAnim.Jab, SpriteAnim.Double],
  });
  registerMove(Moves.Minimize, {
    name: 'Minimize',
    description:
      "Raises the user's evasion 2 stages, but Body Slam and Stomp then never miss it and hit 2x.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.Metronome, {
    name: 'Metronome',
    description: 'Casts a move at random, bar itself, Mirror Move and the two nobody learns.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shake, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.DefenseCurl, {
    name: 'Defense Curl',
    description: "Raises the user's Defense a stage.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 40,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.LightScreen, {
    name: 'Light Screen',
    description: "Cuts special damage against the user's side by 1/3 for 10 seconds.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Roar, {
    name: 'Roar',
    description:
      'Throws the target off the field and drags its weakest teammate in. Slow, and a sound.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    priority: -6,
    target: MoveTargets.Unit,
    flags: MoveFlags.Sound,
    steps: 1,
    cast: [SpriteAnim.Sound, SpriteAnim.RearUp, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.ConfuseRay, {
    name: 'Confuse Ray',
    description: 'Confuses the target.',
    type: Types.Ghost,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.Disable, {
    name: 'Disable',
    description:
      'Shuts off the move the target is using — interrupting it — or its last, for 5 seconds.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.LeechLife, {
    name: 'Leech Life',
    description: 'Heals the user for 1/2 the damage dealt.',
    type: Types.Bug,
    category: MoveCategories.Physical,
    pp: 10,
    power: 80,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Bite, SpriteAnim.Jab, SpriteAnim.Attack],
  });
  registerMove(Moves.Haze, {
    name: 'Haze',
    description: "Resets every stat stage on the field, the user's included.",
    type: Types.Ice,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Gas, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.Absorb, {
    name: 'Absorb',
    description: 'Heals the user for 1/2 the damage dealt.',
    type: Types.Grass,
    category: MoveCategories.Special,
    pp: 25,
    power: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  // Rampage: every step lands the same attack
  registerMove(Moves.PetalDance, {
    name: 'Petal Dance',
    description: 'Lands the same hit 3 times over, and leaves the user confused.',
    type: Types.Grass,
    category: MoveCategories.Special,
    pp: 10,
    power: 120,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    steps: 2,
    cast: [SpriteAnim.Dance, SpriteAnim.Twirl, SpriteAnim.Attack],
  });
  registerMove(Moves.Spore, {
    name: 'Spore',
    description: 'Puts the target to sleep. A powder, so Grass ignores it.',
    type: Types.Grass,
    category: MoveCategories.Status,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Powder,
    cast: [SpriteAnim.Gas, SpriteAnim.Shake, SpriteAnim.Charge],
  });
  registerMove(Moves.KarateChop, {
    name: 'Karate Chop',
    description: 'Crits more readily.',
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 25,
    power: 50,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Chop, SpriteAnim.Slice, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Hypnosis, {
    name: 'Hypnosis',
    description: 'Puts the target to sleep.',
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    accuracy: 60,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.Amnesia, {
    name: 'Amnesia',
    description: "Raises the user's Special Defense 2 stages.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Shake, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.Recover, {
    name: 'Recover',
    description: 'Heals the user 1/2 its HP.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 5,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Swell, SpriteAnim.RearUp, SpriteAnim.Charge],
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
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Kick, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Slam, {
    name: 'Slam',
    description: 'Plain contact damage.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    power: 80,
    accuracy: 75,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Constrict, {
    name: 'Constrict',
    description: "10% to drop the target's Speed a stage.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 35,
    power: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.Barrier, {
    name: 'Barrier',
    description: "Raises the user's Defense 2 stages.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Withdraw, SpriteAnim.RearUp, SpriteAnim.Charge],
  });
}
