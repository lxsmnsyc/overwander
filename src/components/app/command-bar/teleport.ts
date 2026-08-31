import type { CommandArguments } from '../../../core/command';
import { type Arguments, asWhole, refuse } from './arguments';
import type { TeleportWanted } from '../../../server/teleport';
import { given } from '../../../core/command';

/**
 * What `/tp` makes of what it was given.
 *
 * An axis left out is a request for a random one, so the reading has
 * to tell "not asked for" apart from "asked for badly"
 */

/** Who to move, and where to */
export interface TeleportRequest {
  player: string;
  wanted: TeleportWanted;
}

export default function readTeleport(parameters: CommandArguments): Arguments<TeleportRequest> {
  const x = asWhole(given(parameters, 'x'));
  const y = asWhole(given(parameters, 'y'));

  if (x === null || y === null) {
    return refuse('The coordinates have to be numbers.');
  }
  const to = given(parameters, 'to');

  if (to != null && (x != null || y != null)) {
    return refuse('Give a coordinate or somebody to stand beside, not both.');
  }
  return {
    ok: true,
    value: { player: given(parameters, 'player') ?? 'self', wanted: { x, y, to } },
  };
}
