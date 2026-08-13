import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { MoveCategories, type Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { getMoveData } from '../../data/moves';
import { isFullyEvolved } from '../../data/species';
import { BattleEvents } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { createHeldItems, holds } from './__create';

/**
 * Stat-enhancing held items: what a pokemon carries to be stronger
 * than it is.
 *
 * The general ones each take something back for what they give — a
 * Choice item locks its holder into the move it opened with, an
 * Assault Vest will not let one cast a status move — so carrying one
 * is a decision rather than a free half of a stat. The relics take
 * nothing back, because they are worth nothing to anybody but the
 * species they belong to.
 *
 * Every one of them rides `CheckUnitStat`, so what they change is the
 * stat itself: everything downstream — the damage, the turn order,
 * the AI's own reading of the field — sees the boosted number without
 * having to know an item is behind it.
 */

/**
 * Half again, which is what the mainline has paid for a stat item
 * since they were introduced
 */
export const STAT_BOOST_FACTOR = 1.5;

/**
 * A relic doubles what it touches: the species it belongs to is built
 * around getting one
 */
export const RELIC_BOOST_FACTOR = 2;

/**
 * The choice items and the stat each buys
 */
const CHOICE_ITEMS: Map<Items, Stats> = new Map([
  [Items.ChoiceBand, Stats.Attack],
  [Items.ChoiceSpecs, Stats.SpecialAttack],
  [Items.ChoiceScarf, Stats.Speed],
]);

/**
 * The relics: the item, the species that can use it, and the stats it
 * doubles for them
 */
interface RelicBoost {
  item: Items;
  species: Set<Species>;
  stats: Set<Stats>;
}

const RELICS: RelicBoost[] = [
  {
    // A Pikachu carrying its own charge hits twice as hard both ways
    item: Items.LightBall,
    species: new Set([Species.Pikachu]),
    stats: new Set([Stats.Attack, Stats.SpecialAttack]),
  },
  {
    // The bone a Cubone already fights with, and keeps carrying once
    // it is a Marowak
    item: Items.ThickClub,
    species: new Set([Species.Cubone, Species.Marowak]),
    stats: new Set([Stats.Attack]),
  },
  {
    item: Items.MetalPowder,
    species: new Set([Species.Ditto]),
    stats: new Set([Stats.Defense]),
  },
  {
    item: Items.QuickPowder,
    species: new Set([Species.Ditto]),
    stats: new Set([Stats.Speed]),
  },
];

export default createHeldItems(
  () => [
    ...CHOICE_ITEMS.keys(),
    Items.AssaultVest,
    Items.Eviolite,
    ...RELICS.map((relic) => relic.item),
  ],
  (battle) => {
    /**
     * What each Choice holder opened with. It is the battle's own
     * bookkeeping rather than the unit's: the lock belongs to the
     * item, and losing the item — or leaving the field — forgets it
     */
    const committed = new Map<Unit, Moves>();

    function choiceItemOf(unit: Unit): Items | null {
      for (const item of CHOICE_ITEMS.keys()) {
        if (holds(unit, item)) {
          return item;
        }
      }
      return null;
    }

    return new MergedLifecycle([
      // Half again of the stat the item buys
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        for (const [item, stat] of CHOICE_ITEMS) {
          if (event.stat === stat && holds(event.source, item)) {
            event.value *= STAT_BOOST_FACTOR;
            return;
          }
        }
      }),

      // The price of it: the first move a Choice holder reaches for
      // is the only one it may reach for again
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        if (choiceItemOf(event.source) != null) {
          committed.set(event.source, event.move);
        }
      }),

      battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
        const locked = committed.get(event.source);

        if (event.success && locked != null && locked !== event.move) {
          event.success = choiceItemOf(event.source) == null;
        }
      }),

      // The lock is the item's, so it goes when the item does;
      // leaving the field clears it the way switching out does in the
      // mainline
      battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
        if (CHOICE_ITEMS.has(event.item)) {
          committed.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitDisableItem, EventPriority.Post, (event) => {
        if (CHOICE_ITEMS.has(event.item)) {
          committed.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        committed.delete(event.source);
      }),

      // An Assault Vest is half again of Special Defense, paid for by
      // never casting a status move
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (event.stat === Stats.SpecialDefense && holds(event.source, Items.AssaultVest)) {
          event.value *= STAT_BOOST_FACTOR;
        }
      }),

      battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
        if (
          event.success &&
          holds(event.source, Items.AssaultVest) &&
          getMoveData(event.move).category === MoveCategories.Status
        ) {
          event.success = false;
        }
      }),

      // An Eviolite is for what is not finished growing: half again
      // of both defenses while the species still has somewhere to
      // evolve to
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (event.stat !== Stats.Defense && event.stat !== Stats.SpecialDefense) {
          return;
        }
        if (!holds(event.source, Items.Eviolite)) {
          return;
        }
        if (!isFullyEvolved(event.source.species)) {
          event.value *= STAT_BOOST_FACTOR;
        }
      }),

      // The relics, which double a stat for the one species that
      // knows what to do with them and nothing for anyone else
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        for (const relic of RELICS) {
          if (
            relic.species.has(event.source.species) &&
            relic.stats.has(event.stat) &&
            holds(event.source, relic.item)
          ) {
            event.value *= RELIC_BOOST_FACTOR;
          }
        }
      }),
    ]);
  },
);
