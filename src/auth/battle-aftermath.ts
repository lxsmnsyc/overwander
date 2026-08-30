import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';

/**
 * What a battle did to one catch: what it spent, what it has left,
 * and what it is still carrying.
 *
 * A berry eaten in a raid is gone afterwards, the way it is in the
 * mainline games, and so is the health the boss took off it. The
 * fight reports all three together because they belong together — a
 * pokemon that ate its Sitrus Berry is a pokemon whose health that
 * berry restored, and writing one without the other would describe a
 * fight that did not happen.
 *
 * It lives in its own module because both the battle side (which
 * collects it) and the privileged server (which acts on it) name the
 * shape, and neither should have to import the other.
 */
export default interface BattleAftermath {
  /**
   * The caught/{catchId} the unit was built from; a unit standing for
   * no record — the raid boss, a grunt's party — never appears here
   */
  caught: string;
  /**
   * The items it lost, at most one copy of each
   */
  items: Items[];
  /**
   * The health it walked out with. Zero is a fainted pokemon, which
   * cannot be fielded again until something heals it
   */
  health: number;
  /**
   * Every non-volatile status it walked out with, as a mask of
   * `StatusFlags`. A unit can carry several at once; everything
   * volatile ended with the battle
   */
  statuses: number;
  /**
   * The coins its Pay Days scattered, picked up when the fight
   * settles
   */
  coins: number;
  /**
   * What its Sketch turned into, if it drew one. It is the only thing
   * here that changes what a pokemon **is** rather than what it has
   * left, so it settles for raids and npc fights only: a sketch drawn
   * against another player is a sketch that ends with the battle
   */
  sketched?: Moves;
}
