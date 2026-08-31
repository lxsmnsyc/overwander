import type { CommandArguments } from '../../../core/command';
import { type Arguments, refuse } from './arguments';
import { given } from '../../../core/command';

/**
 * What the commands that act on one trainer were given.
 *
 * None of them defaults to the caller. Banning or opening a profile
 * with nobody named is far more likely to be a half-typed line than a
 * request about yourself
 */

export interface PlayerRequest {
  /** However they were named: a nickname, an address or a code */
  player: string;
  /** What a ban is explained with, empty where none was given */
  reason: string;
}

export default function readPlayer(parameters: CommandArguments): Arguments<PlayerRequest> {
  const player = given(parameters, 'player')?.trim() ?? '';

  if (player === '') {
    return refuse('Say who, with player:.');
  }
  return { ok: true, value: { player, reason: given(parameters, 'reason')?.trim() ?? '' } };
}
