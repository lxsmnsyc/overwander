import { Types } from '../../constants/types';
import { MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * The two nobody learns. The engine reaches for them itself: Attack
 * fills the gaps while real moves cool, and Struggle is what is left
 * when every move is shut off.
 */
export default function registerEngineMoves(): void {
  /**
   * The plain swing every pokemon has in it.
   *
   * Nobody learns it: the engine reaches for it when a unit may act
   * and every move it knows is still cooling, which in a real-time
   * fight is most of the time. Ten power and its PP make it fill those
   * gaps without ever being worth choosing.
   *
   * Its type is `Unknown` here and resolved to the user's own when it
   * is thrown, in
   * [`attack.ts`](../../battle/moves/attack.ts)
   */
  registerMove(Moves.Attack, {
    name: 'Attack',
    description: 'A feeble swing made of whatever the user is, for the gaps while real moves cool.',
    type: Types.Unknown,
    category: MoveCategories.Physical,
    power: 10,
    pp: 180,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Attack],
  });
  /**
   * What is thrown when there is nothing left to throw.
   *
   * Nobody learns it and nothing teaches it: the engine reaches for it
   * on a pokemon whose every move is spent, disabled or otherwise shut
   * off. Its type is `Unknown`, which is not in the chart, so nothing
   * resists it and nothing is immune, and it costs the user a quarter
   * of its whole health whatever it lands for
   */
  registerMove(Moves.Struggle, {
    name: 'Struggle',
    description:
      "Thrown when every move is shut off. Nothing resists it, and it costs 1/4 of the user's HP.",
    type: Types.Unknown,
    category: MoveCategories.Physical,
    power: 50,
    pp: 1,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Strike, SpriteAnim.Attack],
  });
}
