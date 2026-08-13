import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Items } from '../../data/ids/items';
import { DamageFlags, MoveCategories, MoveFlags, type Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { Statuses, Weathers } from '../../data/ids/status';
import { FOUND_GEAR, MARKET_GEAR } from '../../data/items/gear';
import { getMoveData } from '../../data/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { onUnitActs } from '../utils';
import { createEffectivenessTracker, createHeldItems, holds } from './__create';

/**
 * The gear: held items that work for as long as they are carried.
 *
 * None of them is ever spent, so each is a standing rule rather than a
 * moment — which is what makes them the plainest held items in the
 * game and the easiest to build a pokemon around. Every one rides a
 * hook the engine already has: the residual ones are paid out where
 * Solar Power and Rain Dish are, the ones that lift a stat or a power
 * ride the same checks a Choice Band does, and the ones that answer
 * being hit ride the damage event a Rough Skin does.
 */

/**
 * The mainline pays a Leftovers out at the end of every turn, and the
 * closest thing to a turn a real-time fight has is a move: the payout
 * comes as its holder reaches for one. See
 * [`onUnitActs`](../utils.ts), which is where the abilities that work
 * the same way — Solar Power, Rain Dish, Dry Skin — are paid from too
 */

/**
 * What a Leftovers is worth each time, and what a Black Sludge is
 * worth to the ones it is not food for. The sludge takes twice what
 * the leftovers give: it is rubbish, and holding rubbish costs more
 * than eating well pays
 */
export const LEFTOVERS_SHARE = 1 / 16;
export const BLACK_SLUDGE_SHARE = 1 / 8;

/**
 * What a Shell Bell hands back out of the damage its holder just did
 */
export const SHELL_BELL_SHARE = 1 / 8;

/**
 * What a Big Root adds to everything its holder drains
 */
export const BIG_ROOT_FACTOR = 1.3;

/**
 * What a Muscle Band and a Wise Glasses add to the half of the game
 * each of them belongs to
 */
export const BAND_FACTOR = 1.1;

/**
 * What an Expert Belt adds to a blow that was already landing hard.
 * It is the one power item that pays nothing at all against a
 * pokemon its holder has no answer for
 */
export const EXPERT_BELT_FACTOR = 1.2;

/**
 * What a Metronome adds for each repeat of the same move, and the
 * most it ever reaches. Doing one thing over and over is exactly what
 * a real-time fight makes easy, so the ceiling is what keeps a
 * Metronome from being a reason never to do anything else
 */
export const METRONOME_STEP = 0.2;
export const METRONOME_LIMIT = 2;

/**
 * What the lenses are worth: a tenth more of the holder's own
 * accuracy, a tenth off the accuracy of anything aimed at the holder
 */
export const WIDE_LENS_ACCURACY = 1.1;
export const BRIGHT_POWDER_EVASION = 0.9;

/**
 * How much likelier a critical becomes, in stages. The ratio a blow is
 * rolled against opens at zero and doubles the odds with every stage
 * on it, so a Scope Lens is worth one doubling to anybody and the two
 * species lenses are worth two to the one pokemon each was made for
 */
export const SCOPE_LENS_CRITICAL_STAGES = 1;
export const SPECIES_LENS_CRITICAL_STAGES = 2;

/**
 * How often a Quick Claw hurries its holder, and by how much. The
 * bracket is the same scale a move's own priority is on, so a claw
 * that fires buys what a Quick Attack has: a shorter wind-up
 */
export const QUICK_CLAW_CHANCE = 0.2;
export const QUICK_CLAW_PRIORITY = 1;

/**
 * How often a Focus Band leaves its holder standing on 1 HP. Unlike a
 * Sash it is not spent doing it, and unlike a Sash it does not care
 * what health the holder started the blow on — which is why it is a
 * tenth of the time rather than every time
 */
export const FOCUS_BAND_CHANCE = 0.1;

/**
 * What touching a Rocky Helmet costs, as a share of the toucher
 */
export const ROCKY_HELMET_SHARE = 1 / 6;

/**
 * The weathers an umbrella is any use against. It keeps the sun and
 * the rain off its holder — and nothing else: a sandstorm goes round
 * an umbrella, which is what the goggles are for
 */
const UMBRELLA_WEATHERS = new Set<Weathers>([
  Weathers.Sunny,
  Weathers.Rain,
  Weathers.ExtremeSunny,
  Weathers.HeavyRain,
]);

/**
 * The lenses that belong to one species. A Lucky Punch is a boxing
 * glove nothing but a Chansey has the hands for, and a Stick is the
 * leek a Farfetch'd was already carrying
 */
const SPECIES_LENSES: Map<Items, Species> = new Map([
  [Items.LuckyPunch, Species.Chansey],
  [Items.Stick, Species.Farfetchd],
]);

/**
 * The two items that lift one half of the game each
 */
const BAND_CATEGORIES: Map<Items, MoveCategories> = new Map([
  [Items.MuscleBand, MoveCategories.Physical],
  [Items.WiseGlasses, MoveCategories.Special],
]);

/**
 * What a Metronome holder has been doing, and for how long
 */
interface Streak {
  move: Moves;
  repeats: number;
}

export default createHeldItems(
  () => [...MARKET_GEAR.keys(), ...FOUND_GEAR.keys()],
  (battle) => {
    const landingHard = createEffectivenessTracker(battle);

    /**
     * What each Metronome holder has been repeating. It is the battle's
     * bookkeeping rather than the unit's, the way a Choice lock is:
     * the count belongs to the item, and losing the item — or leaving
     * the field — is what forgets it
     */
    const streaks = new Map<Unit, Streak>();

    /**
     * Whoever a Quick Claw is hurrying. It is rolled as the cast opens
     * rather than in the priority check, because the check is asked
     * over and over — by the AI rating a move it may never throw, and
     * by the engine working out the wind-up — and a claw that rolled
     * fresh each time would be a different item on every question
     */
    const hurried = new Set<Unit>();

    return new MergedLifecycle([
      // The residual gear, paid out on the move rather than on the clock
      ...onUnitActs(battle, (unit) => {
        if (!unit.alive) {
          return;
        }

        const maxHealth = unit.checkStat(Stats.HP, 0);

        // Rubbish is food to the ones that live on it and poison to
        // everybody else
        if (holds(unit, Items.BlackSludge) && !unit.types.has(Types.Poison)) {
          unit.damage(
            { type: EffectType.Item, item: Items.BlackSludge, unit },
            unit,
            Math.max(1, Math.floor(maxHealth * BLACK_SLUDGE_SHARE)),
            DamageFlags.Indirect | DamageFlags.HealthScaled,
          );
          return;
        }

        for (const item of [Items.Leftovers, Items.BlackSludge]) {
          if (holds(unit, item) && unit.health < maxHealth) {
            unit.triggerItem(item);
            unit.heal(
              { type: EffectType.Item, item, unit },
              unit,
              Math.max(1, Math.floor(maxHealth * LEFTOVERS_SHARE)),
              0,
            );
            return;
          }
        }
      }),

      // A Shell Bell takes its share out of what its holder just did to
      // somebody else. Indirect damage is nobody's blow, so nothing a
      // status or a recoil does feeds it
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          event.cause.type !== EffectType.Move ||
          event.cause.unit === event.target
        ) {
          return;
        }

        const attacker = event.cause.unit;

        if (!attacker.alive || !holds(attacker, Items.ShellBell)) {
          return;
        }

        const healed = Math.max(1, Math.floor(event.value * SHELL_BELL_SHARE));

        attacker.triggerItem(Items.ShellBell);
        attacker.heal(
          { type: EffectType.Item, item: Items.ShellBell, unit: attacker },
          attacker,
          healed,
          0,
        );
      }),

      // A Big Root deepens every drain. Only a drain that gives health
      // back: an ability that turns one against the drainer leaves a
      // negative behind, and a root is no reason to bleed harder for it
      battle.on(BattleEvents.CheckUnitDrain, EventPriority.Post, (event) => {
        if (event.value > 0 && holds(event.source, Items.BigRoot)) {
          event.value *= BIG_ROOT_FACTOR;
        }
      }),

      // The bands, each lifting the half of the game it belongs to
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (event.power == null) {
          return;
        }

        const category = getMoveData(event.move).category;

        for (const [item, boosted] of BAND_CATEGORIES) {
          if (category === boosted && holds(event.source, item)) {
            event.power *= BAND_FACTOR;
            return;
          }
        }
      }),

      /**
       * An Expert Belt pays only on a blow that was already landing hard,
       * which is a thing no power check can know: how hard a move lands
       * is worked out against the defender's types while the damage
       * resolves. So it rides the damage rather than the power
       */
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        if (landingHard(event.parent) && holds(event.parent.source, Items.ExpertBelt)) {
          event.value *= EXPERT_BELT_FACTOR;
        }
      }),

      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        if (!holds(event.source, Items.Metronome)) {
          return;
        }

        const streak = streaks.get(event.source);

        streaks.set(
          event.source,
          streak != null && streak.move === event.move
            ? { move: event.move, repeats: streak.repeats + 1 }
            : { move: event.move, repeats: 0 },
        );
      }),

      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const streak = streaks.get(event.source);

        if (event.power == null || streak == null || streak.move !== event.move) {
          return;
        }
        if (!holds(event.source, Items.Metronome)) {
          return;
        }

        event.power *= Math.min(METRONOME_LIMIT, 1 + METRONOME_STEP * streak.repeats);
      }),

      battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
        if (event.item === Items.Metronome) {
          streaks.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitDisableItem, EventPriority.Post, (event) => {
        if (event.item === Items.Metronome) {
          streaks.delete(event.source);
        }
      }),

      // A Wide Lens steadies its holder's aim; a Bright Powder muddles
      // the aim of whoever is pointing at the holder
      battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
        if (event.accuracy == null) {
          return;
        }

        if (holds(event.source, Items.WideLens)) {
          event.accuracy *= WIDE_LENS_ACCURACY;
        }
        if (
          event.target.type === MoveTargetType.Unit &&
          holds(event.target.unit, Items.BrightPowder)
        ) {
          event.accuracy *= BRIGHT_POWDER_EVASION;
        }
      }),

      // The lenses, general and species
      battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
        const source = event.parent.source;

        if (holds(source, Items.ScopeLens)) {
          event.value += SCOPE_LENS_CRITICAL_STAGES;
        }

        for (const [item, species] of SPECIES_LENSES) {
          if (source.species === species && holds(source, item)) {
            event.value += SPECIES_LENS_CRITICAL_STAGES;
          }
        }
      }),

      battle.on(BattleEvents.UnitCast, EventPriority.Pre, (event) => {
        if (holds(event.source, Items.QuickClaw) && battle.random() < QUICK_CLAW_CHANCE) {
          hurried.add(event.source);
          event.source.triggerItem(Items.QuickClaw);
        } else {
          hurried.delete(event.source);
        }
      }),

      battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
        if (hurried.has(event.source)) {
          event.priority += QUICK_CLAW_PRIORITY;
        }
      }),

      // The hurry is the cast's, so it goes when the cast does
      battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
        hurried.delete(event.source);
      }),
      battle.on(BattleEvents.UnitStopCast, EventPriority.Post, (event) => {
        hurried.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        hurried.delete(event.source);
        streaks.delete(event.source);
      }),

      // A Focus Band leaves its holder standing on 1 HP now and then, and
      // is not spent doing it. Indirect damage is not a blow, so nothing
      // a status or a recoil does can be endured this way
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        if (
          event.target.alive &&
          !(event.flags & DamageFlags.Indirect) &&
          event.value >= event.target.health &&
          holds(event.target, Items.FocusBand) &&
          battle.random() < FOCUS_BAND_CHANCE
        ) {
          event.value = event.target.health - 1;

          event.target.triggerItem(Items.FocusBand);
        }
      }),

      // A Rocky Helmet takes a share out of whoever put a hand on its
      // holder. Indirect, so nothing about the blow — drain, recoil, an
      // item of the attacker's own — reads it as a hit of its own
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          event.cause.type !== EffectType.Move ||
          event.cause.unit === event.target ||
          !holds(event.target, Items.RockyHelmet) ||
          !(getMoveData(event.cause.move).flags & MoveFlags.Contact)
        ) {
          return;
        }

        const attacker = event.cause.unit;

        if (!attacker.alive) {
          return;
        }

        event.target.triggerItem(Items.RockyHelmet);
        attacker.damage(
          { type: EffectType.Item, item: Items.RockyHelmet, unit: event.target },
          attacker,
          Math.max(1, Math.floor(attacker.checkStat(Stats.HP, 0) * ROCKY_HELMET_SHARE)),
          DamageFlags.Indirect,
        );
      }),

      // Safety Goggles: nothing powdered reaches the eyes behind them
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          event.target.type === MoveTargetType.Unit &&
          holds(event.target.unit, Items.SafetyGoggles) &&
          getMoveData(event.move).flags & MoveFlags.Powder
        ) {
          event.immune = true;
        }
      }),

      // And nothing the weather is throwing about, either
      battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
        if (
          event.success &&
          event.cause.type === EffectType.Weather &&
          holds(event.target, Items.SafetyGoggles)
        ) {
          event.success = false;
        }
      }),

      // A Utility Umbrella keeps the sun and the rain off its holder: the
      // weather is still out there, but as far as this unit is concerned
      // there is none
      battle.on(BattleEvents.CheckUnitWeather, EventPriority.Post, (event) => {
        if (UMBRELLA_WEATHERS.has(event.weather) && holds(event.source, Items.UtilityUmbrella)) {
          event.weather = Weathers.None;
        }
      }),

      // A Smoke Ball gets its holder out of anything, including whatever
      // was holding on to it
      battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
        if (!event.success && holds(event.source, Items.SmokeBall)) {
          event.success = true;

          event.source.triggerItem(Items.SmokeBall);
        }
      }),

      // A Destiny Knot ties the other end of the infatuation: whoever
      // charmed the holder is charmed straight back
      battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
        if (
          event.status !== Statuses.Infatuated ||
          event.cause.type === EffectType.None ||
          !holds(event.source, Items.DestinyKnot)
        ) {
          return;
        }

        const charmer = event.cause.unit;

        if (charmer === event.source || charmer.status[Statuses.Infatuated] != null) {
          return;
        }

        event.source.triggerItem(Items.DestinyKnot);
        charmer.addStatus(Statuses.Infatuated, {
          type: EffectType.Item,
          item: Items.DestinyKnot,
          unit: event.source,
        });
      }),
    ]);
  },
);
