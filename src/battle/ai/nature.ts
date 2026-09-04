import { AttackPriority } from '../../core/event-emitter';
import { BattleEvents, MoveTargetType } from '../events';
import { MoveCategories } from '../../data/ids/moves';
import { NATURE_EFFECTS } from '../../data/ids/natures';
import { Stats } from '../../data/constants/stats';
import type Battle from '../core';
import { checkUnitRating } from './rating';
import { getMoveData } from '../../data/moves';
import type Natures from '../../data/ids/natures';
import type Unit from '../unit';

/**
 * Fighting on temperament rather than on merit: every unit leans
 * towards the kind of move its nature is and towards the target its
 * nature would pick, so the field is chosen for who its pokemon are
 * instead of what they cover.
 *
 * The leaning is a bonus rather than a rule, and it is kept under the
 * try-to-KO bonus on purpose: a pokemon still refuses a move that
 * would do nothing, and still finishes something it can finish. What
 * temperament decides is everything in between
 */

/** What a nature leans towards */
export const enum MoveStyle {
  /** No leaning at all: the five neutral natures fight as usual */
  Balanced = 0,
  Attack = 1,
  Defense = 2,
}

/**
 * The stats that read as a pokemon wanting to swing. Speed says
 * nothing about what to do, only how soon, and the mainline's Palace
 * reads the fast natures as attackers as well
 */
const ATTACKING_STATS = new Set<Stats>([Stats.Attack, Stats.SpecialAttack, Stats.Speed]);

/** What a leaning is worth, below the try-to-KO bonus */
const STYLE_BONUS = 6;

/** Extra for the half of the split the nature actually raised */
const CATEGORY_BONUS = 2;

/**
 * The width of the aiming band, spent either side of nothing: a
 * temperament pays up to half of it for the target it wants and takes
 * the same off the one it does not.
 *
 * It has to be wide enough to turn the ordinary AI's focus fire
 * around rather than merely soften it, since that rule already pays
 * up to 3 for the biggest threat. Signed rather than a plain bonus so
 * that aiming does not quietly outbid the choice of move: a move with
 * one target to weigh and a move with a whole side to weigh are still
 * compared on their own merits
 */
const TARGET_BONUS = 6;

/**
 * How much of a threat one unit is to another, from none of one to
 * all of it. The bands are the focus rule's own, so a temperament
 * reading them backwards reads the same field the default AI does
 */
function threatShare(battle: Battle, source: Unit, target: Unit): number {
  const ratio = checkUnitRating(battle, target) / Math.max(1, checkUnitRating(battle, source));

  if (ratio >= 1.5) {
    return 1;
  }
  if (ratio >= 1) {
    return 2 / 3;
  }
  if (ratio >= 0.5) {
    return 1 / 3;
  }
  return 0;
}

/**
 * What a nature leans towards, read off the one stat it raises, which
 * is the only thing a nature says about a pokemon
 */
export function getMoveStyle(nature: Natures): MoveStyle {
  const effect = NATURE_EFFECTS[nature];

  if (effect == null) {
    return MoveStyle.Balanced;
  }
  return ATTACKING_STATS.has(effect.up) ? MoveStyle.Attack : MoveStyle.Defense;
}

export default function setupNatureAI(battle: Battle): void {
  /**
   * Who a temperament aims at, across the enemies on the field. The
   * ordinary AI concentrates fire on the biggest threat; an attacking
   * nature does the opposite and picks off whatever is nearest to
   * going down, while a defensive one leans harder into the threat it
   * was already answering.
   *
   * Only enemies, since who to help is already answered elsewhere: a
   * status move is worth more on a teammate still in one piece, and
   * that is a rule about how statuses work rather than a temperament
   */
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const source = event.source;
    const target = event.target.unit;
    const style = getMoveStyle(source.nature);

    if (style === MoveStyle.Balanced || target.team.alliance === source.team.alliance) {
      return;
    }

    const share = threatShare(battle, source, target);
    const wanted = style === MoveStyle.Defense ? share : 1 - share;

    event.score += Math.round(TARGET_BONUS * (wanted - 0.5));
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const nature = event.source.nature;
    const style = getMoveStyle(nature);

    if (style === MoveStyle.Balanced) {
      return;
    }

    const category = getMoveData(event.move).category;

    if (style === MoveStyle.Defense) {
      if (category === MoveCategories.Status) {
        event.score += STYLE_BONUS;
      }
      return;
    }
    if (category === MoveCategories.Status) {
      return;
    }

    event.score += STYLE_BONUS;

    // An Adamant pokemon swings and a Modest one blasts: the raised
    // stat says which half of the split it reaches for
    const up = NATURE_EFFECTS[nature]?.up;

    if (
      (up === Stats.Attack && category === MoveCategories.Physical) ||
      (up === Stats.SpecialAttack && category === MoveCategories.Special)
    ) {
      event.score += CATEGORY_BONUS;
    }
  });
}
