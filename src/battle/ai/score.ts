import { Stats } from '../../data/constants/stats';
import type { CheckUnitAIMoveScoreEvent } from '../events';

/**
 * The vocabulary a scoring listener writes in. It lives apart from the
 * chooser because an effect that changes what a move is worth says so
 * next to the effect, and the chooser already reads those modules back
 * for what they know.
 *
 * Gen 4/5 cartridge AI style: every usable move starts at a base score
 * per candidate target and listeners nudge it from there.
 *
 * https://bulbapedia.bulbagarden.net/wiki/Artificial_intelligence_in_the_Pok%C3%A9mon_games
 */
export const BASE_SCORE = 100;

/**
 * The gen 4 "useless move" penalty: enough to lose against any
 * neutral option, so the move is only picked when everything is bad
 */
export const USELESS_PENALTY = 10;

/**
 * What a move costs to use when using it hands something back: a
 * drain into Liquid Ooze, a status into Synchronize, a punch into
 * Static. Smaller than the useless penalty on purpose — the move
 * still does its job, so it loses to an equally good one that is free
 * and beats doing nothing at all
 */
export const RISKY_PENALTY = 3;

/**
 * What a step of winding up costs. A move that spends a step before it
 * lands is a move whose damage arrives a cast late, and the opening in
 * between is free for everybody else.
 *
 * A move whose steps are not idle — a rampage strikes on every one of
 * them — hands this back itself
 */
export const STEP_PENALTY = 4;

/**
 * The most a move can lose to being unreliable, at zero accuracy. Set
 * so that a 30% move gives up more than the try-to-KO bonus: an
 * opening spent on a miss is the whole cost of the cast
 */
export const ACCURACY_PENALTY = 8;

/**
 * What a heal is worth at its best, when all of it lands
 */
export const HEAL_BONUS = 7;

/**
 * How little a unit can be missing before healing is a wasted cast
 */
const HEAL_WASTE_THRESHOLD = 0.1;

/**
 * Weigh a self-heal by what it would actually restore: a heal that
 * would spill over is worth nothing, and one that fills a real hole is
 * worth more than a hit. Every healing move weighs the same way and
 * only the fraction it restores differs
 */
export function scoreSelfHeal(event: CheckUnitAIMoveScoreEvent, fraction: number): void {
  const source = event.source;
  const maxHP = Math.max(1, source.checkStat(Stats.HP, 0));
  const missing = (maxHP - source.health) / maxHP;

  if (missing < HEAL_WASTE_THRESHOLD) {
    event.score -= USELESS_PENALTY;
    return;
  }

  event.score += Math.round(HEAL_BONUS * Math.min(1, missing / fraction));
}
