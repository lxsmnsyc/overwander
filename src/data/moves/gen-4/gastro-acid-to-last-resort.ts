import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * From Gastro Acid to Last Resort: the moves that go after what a
 * pokemon is rather than what it has left, and the three that trade
 * stat changes across the field
 */
export default function registerGastroAcidToLastResort(): void {
  registerMove(Moves.GastroAcid, {
    name: 'Gastro Acid',
    description: "Shuts off 1 of the target's abilities until it leaves the field.",
    type: Types.Poison,
    category: MoveCategories.Status,
    pp: 10,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Gas, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.LuckyChant, {
    name: 'Lucky Chant',
    description: "Nothing lands a critical on the user's team for 10 seconds.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 30,
    target: MoveTargets.Team,
    affects: MoveAffects.Team | MoveAffects.Own,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Sing, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.MeFirst, {
    name: 'Me First',
    description: 'Cuts off the move the target is casting and fires it back at 1.5x power.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    priority: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.Copycat, {
    name: 'Copycat',
    description: 'Casts whatever move was used last, by anybody.',
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 20,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Twirl, SpriteAnim.Charge],
  });
  registerMove(Moves.PowerSwap, {
    name: 'Power Swap',
    description: "Trades the user's Attack and Special Attack stages for the target's.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.GuardSwap, {
    name: 'Guard Swap',
    description: "Trades the user's Defense and Special Defense stages for the target's.",
    type: Types.Psychic,
    category: MoveCategories.Status,
    pp: 10,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Twirl, SpriteAnim.Withdraw, SpriteAnim.Charge],
  });
  registerMove(Moves.Punishment, {
    name: 'Punishment',
    description: 'The more stages the target has raised, the harder it hits, up to 200 power.',
    type: Types.Dark,
    category: MoveCategories.Physical,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.LastResort, {
    name: 'Last Resort',
    description: 'Only usable once every other move the user knows has been cast this fight.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 140,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.MultiStrike, SpriteAnim.Attack],
  });
}
