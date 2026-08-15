import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { TYPE_EFFECTIVENESS, TypeEffectiveness, Types } from '../../data/constants/types';
import { Items } from '../../data/ids/items';
import { DamageFlags, MoveCategories, MoveFlags, type Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { Statuses, TeamStatuses, Weathers } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import {
  BattleEvents,
  type CheckUnitCanUpdateStageEvent,
  EffectType,
  MoveTargetType,
} from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { hasFreeItemSlot, onUnitActs, unitTarget } from '../utils';
import { TRAPPING_MOVES } from '../moves/status';
import { createEffectivenessTracker, createHeldItem, holds } from './__create';

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
 * What a Zoom Lens is worth against a target already casting or
 * channelling. The mainline gives it to whoever moves second, which
 * has no analog here; a committed pokemon is the same idea. Twice a
 * Wide Lens, since the moment has to be caught rather than waited for
 */
export const ZOOM_LENS_ACCURACY = 1.2;

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
 * What a Sticky Barb costs whoever is stuck with it — the Black
 * Sludge's share, since a barb is rubbish that bites
 */
export const STICKY_BARB_SHARE = 1 / 8;

/**
 * What an Iron Ball and a Float Stone do to their carrier: one halves
 * its speed and grounds it, the other halves what it weighs
 */
export const IRON_BALL_SPEED = 0.5;
export const FLOAT_STONE_WEIGHT = 0.5;

/**
 * How much later a Lagging Tail makes its holder act. It is the
 * mirror of a Quick Claw's hurry, on the same scale a move's own
 * priority is on — the mainline's "moves last in its bracket" has no
 * bracket to be last in here
 */
export const LAGGING_TAIL_PRIORITY = -1;

/**
 * What touching a Rocky Helmet costs, as a share of the toucher
 */
export const ROCKY_HELMET_SHARE = 1 / 6;

/**
 * What a Light Clay is worth: the mainline's five turns of screen
 * become eight, which is the same bargain a weather rock strikes with
 * the sky
 */
export const LIGHT_CLAY_FACTOR = 1.6;

/**
 * What the two binding items are worth. A Grip Claw is the mainline's
 * flat seven turns against the usual four or five, so here it is the
 * same proportion of a bind's few seconds; a Binding Band deepens the
 * chip instead, which is the other half of what being held costs
 */
export const GRIP_CLAW_FACTOR = 1.75;
export const BINDING_BAND_FACTOR = 4 / 3;

/**
 * How often a King's Rock or a Razor Fang leaves whoever was hit
 * reeling
 */
export const KINGS_ROCK_CHANCE = 0.1;

/**
 * What a Razor Claw is worth: the doubling a Scope Lens buys, since
 * the two are the same item wearing different names
 */
export const RAZOR_CLAW_CRITICAL_STAGES = SCOPE_LENS_CRITICAL_STAGES;

/**
 * The screens a Light Clay holds up. Nothing else a team can be under
 * is a thing anybody put there on purpose
 */
const SCREEN_STATUSES = new Set<TeamStatuses>([TeamStatuses.Reflect, TeamStatuses.LightScreen]);

/**
 * What a weather rock is worth, which is what a Light Clay is worth:
 * the mainline's five turns become eight
 */
export const WEATHER_ROCK_FACTOR = 1.6;

/**
 * The rocks, and the sky each one holds out for longer. Hail and snow
 * are the same weather as far as an Icy Rock is concerned — it is the
 * cold it keeps, not the shape of it
 */
const WEATHER_ROCKS: { item: Items; weathers: Set<Weathers> }[] = [
  { item: Items.DampRock, weathers: new Set([Weathers.Rain]) },
  { item: Items.HeatRock, weathers: new Set([Weathers.Sunny]) },
  { item: Items.IcyRock, weathers: new Set([Weathers.Hail, Weathers.Snow]) },
  { item: Items.SmoothRock, weathers: new Set([Weathers.Sandstorm]) },
];

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

/**
 * A residual item, paid out as its holder reaches for a move rather
 * than on a clock
 */
function createResidualGear(
  item: Items,
  effect: (unit: Unit, maxHealth: number) => void,
): (battle: Battle) => void {
  return createHeldItem(
    item,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          if (unit.alive && holds(unit, item)) {
            effect(unit, unit.checkStat(Stats.HP, 0));
          }
        }),
      ),
  );
}

function heal(unit: Unit, item: Items, amount: number): void {
  unit.triggerItem(item);
  unit.heal({ type: EffectType.Item, item, unit }, unit, Math.max(1, Math.floor(amount)), 0);
}

function bite(unit: Unit, item: Items, amount: number): void {
  unit.damage(
    { type: EffectType.Item, item, unit },
    unit,
    Math.max(1, Math.floor(amount)),
    DamageFlags.Indirect | DamageFlags.HealthScaled,
  );
}

const setupLeftovers = createResidualGear(Items.Leftovers, (unit, maxHealth) => {
  if (unit.health < maxHealth) {
    heal(unit, Items.Leftovers, maxHealth * LEFTOVERS_SHARE);
  }
});

// Rubbish is food to the ones that live on it and poison to everybody
// else
const setupBlackSludge = createResidualGear(Items.BlackSludge, (unit, maxHealth) => {
  if (!unit.types.has(Types.Poison)) {
    bite(unit, Items.BlackSludge, maxHealth * BLACK_SLUDGE_SHARE);
  } else if (unit.health < maxHealth) {
    heal(unit, Items.BlackSludge, maxHealth * LEFTOVERS_SHARE);
  }
});

// A barb sticks in whoever is carrying it, Poison type or not
const setupStickyBarbResidual = createResidualGear(Items.StickyBarb, (unit, maxHealth) => {
  bite(unit, Items.StickyBarb, maxHealth * STICKY_BARB_SHARE);
});

/**
 * A Sticky Barb changes hands on contact, if the hand it caught is
 * empty. Nobody is holding it on purpose, so it goes to whoever
 * touched it rather than costing them anything
 */
const setupStickyBarbTransfer = createHeldItem(Items.StickyBarb, (battle) =>
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      !event.success ||
      event.flags & DamageFlags.Indirect ||
      event.cause.type !== EffectType.Move ||
      event.cause.unit === event.target ||
      !holds(event.target, Items.StickyBarb) ||
      !event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target))
    ) {
      return;
    }

    const attacker = event.cause.unit;

    // A full grip keeps it out: the barb catches on whoever has room
    // for it, which is the record's answer rather than the battle's
    if (!attacker.alive || !hasFreeItemSlot(attacker)) {
      return;
    }

    const cause = { type: EffectType.Item, item: Items.StickyBarb, unit: event.target } as const;

    event.target.triggerItem(Items.StickyBarb);
    event.target.removeItem(Items.StickyBarb, cause);
    attacker.addItem(Items.StickyBarb);
  }),
);

// An Iron Ball drags its carrier down in both senses
const setupIronBall = createHeldItem(
  Items.IronBall,
  (battle) =>
    new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (event.stat === Stats.Speed && holds(event.source, Items.IronBall)) {
          event.value *= IRON_BALL_SPEED;
        }
      }),

      battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Post, (event) => {
        if (!event.grounded && holds(event.source, Items.IronBall)) {
          event.grounded = true;
        }
      }),
    ]),
);

// A Float Stone lifts what its holder weighs, which is what a Low Kick
// reads
const setupFloatStone = createHeldItem(Items.FloatStone, (battle) =>
  battle.on(BattleEvents.CheckUnitWeight, EventPriority.Post, (event) => {
    if (holds(event.source, Items.FloatStone)) {
      event.weight *= FLOAT_STONE_WEIGHT;
    }
  }),
);

// A Lagging Tail is a Quick Claw backwards, and never rolls for it:
// whoever carries one is always the later
const setupLaggingTail = createHeldItem(Items.LaggingTail, (battle) =>
  battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
    if (holds(event.source, Items.LaggingTail)) {
      event.priority += LAGGING_TAIL_PRIORITY;
    }
  }),
);

/**
 * A Ring Target takes away what its holder's own typing would have
 * shrugged off. Only that: the immunity is cleared when the holder's
 * types are what explain it, so a Levitate or an absorbing ability
 * keeps its answer
 */
const setupRingTarget = createHeldItem(Items.RingTarget, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune ||
      event.target.type !== MoveTargetType.Unit ||
      !holds(event.target.unit, Items.RingTarget)
    ) {
      return;
    }

    for (const defending of event.target.unit.types) {
      if (TYPE_EFFECTIVENESS[event.type][defending] === TypeEffectiveness.Immune) {
        event.immune = false;
        event.target.unit.triggerItem(Items.RingTarget);
        return;
      }
    }
  }),
);

/**
 * Protective Pads answer the contact check rather than each of the
 * things that read it, so one veto covers a Rocky Helmet, a Static, a
 * Sticky Barb and everything else that waits to be touched. What the
 * holder's own abilities make of the blow is their business: a Tough
 * Claws still reads the move's own flag
 */
const setupProtectivePads = createHeldItem(Items.ProtectivePads, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveContact, EventPriority.Post, (event) => {
    if (event.contact && holds(event.source, Items.ProtectivePads)) {
      event.contact = false;
    }
  }),
);

// A Shell Bell takes its share out of what its holder just did to
// somebody else. Indirect damage is nobody's blow, so nothing a status
// or a recoil does feeds it
const setupShellBell = createHeldItem(Items.ShellBell, (battle) =>
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

    if (attacker.alive && holds(attacker, Items.ShellBell)) {
      heal(attacker, Items.ShellBell, event.value * SHELL_BELL_SHARE);
    }
  }),
);

// A Big Root deepens every drain. Only a drain that gives health back:
// an ability that turns one against the drainer leaves a negative
// behind, and a root is no reason to bleed harder for it
const setupBigRoot = createHeldItem(Items.BigRoot, (battle) =>
  battle.on(BattleEvents.CheckUnitDrain, EventPriority.Post, (event) => {
    if (event.value > 0 && holds(event.source, Items.BigRoot)) {
      event.value *= BIG_ROOT_FACTOR;
    }
  }),
);

// A band lifts the half of the game it belongs to
function setupBand(item: Items, boosted: MoveCategories): (battle: Battle) => void {
  return createHeldItem(item, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        getMoveData(event.move).category === boosted &&
        holds(event.source, item)
      ) {
        event.power *= BAND_FACTOR;
      }
    }),
  );
}

/**
 * An Expert Belt pays only on a blow that was already landing hard,
 * which is a thing no power check can know: how hard a move lands is
 * worked out against the defender's types while the damage resolves.
 * So it rides the damage rather than the power
 */
const setupExpertBelt = createHeldItem(Items.ExpertBelt, (battle) => {
  const landingHard = createEffectivenessTracker(battle);

  return battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    if (landingHard(event.parent) && holds(event.parent.source, Items.ExpertBelt)) {
      event.value *= EXPERT_BELT_FACTOR;
    }
  });
});

const setupMetronome = createHeldItem(Items.Metronome, (battle) => {
  /**
   * What each holder has been repeating. It is the battle's own
   * bookkeeping rather than the unit's, the way a Choice lock is: the
   * count belongs to the item, and losing it — or leaving the field —
   * is what forgets it
   */
  const streaks = new Map<Unit, Streak>();

  function forget(unit: Unit): void {
    streaks.delete(unit);
  }

  return new MergedLifecycle([
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

      if (
        event.power == null ||
        streak == null ||
        streak.move !== event.move ||
        !holds(event.source, Items.Metronome)
      ) {
        return;
      }

      event.power *= Math.min(METRONOME_LIMIT, 1 + METRONOME_STEP * streak.repeats);
    }),

    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      if (event.item === Items.Metronome) {
        forget(event.source);
      }
    }),
    battle.on(BattleEvents.UnitDisableItem, EventPriority.Post, (event) => {
      if (event.item === Items.Metronome) {
        forget(event.source);
      }
    }),
    battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
      forget(event.source);
    }),
  ]);
});

// A Wide Lens steadies its holder's aim
const setupWideLens = createHeldItem(Items.WideLens, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (event.accuracy != null && holds(event.source, Items.WideLens)) {
      event.accuracy *= WIDE_LENS_ACCURACY;
    }
  }),
);

// A Bright Powder muddles the aim of whoever is pointing at the holder
const setupBrightPowder = createHeldItem(Items.BrightPowder, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (
      event.accuracy != null &&
      event.target.type === MoveTargetType.Unit &&
      holds(event.target.unit, Items.BrightPowder)
    ) {
      event.accuracy *= BRIGHT_POWDER_EVASION;
    }
  }),
);

// A target in the middle of its own move is a target that is not going
// anywhere
const setupZoomLens = createHeldItem(Items.ZoomLens, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (
      event.accuracy == null ||
      event.target.type !== MoveTargetType.Unit ||
      !holds(event.source, Items.ZoomLens)
    ) {
      return;
    }

    const target = event.target.unit;

    if (target.casting != null || target.channeling != null) {
      event.accuracy *= ZOOM_LENS_ACCURACY;
    }
  }),
);

const setupScopeLens = createHeldItem(Items.ScopeLens, (battle) =>
  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    if (holds(event.parent.source, Items.ScopeLens)) {
      event.value += SCOPE_LENS_CRITICAL_STAGES;
    }
  }),
);

// A species lens is worth twice a Scope Lens to the one pokemon it was
// made for, and nothing to anybody else
function setupSpeciesLens(item: Items, species: Species): (battle: Battle) => void {
  return createHeldItem(item, (battle) =>
    battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
      const source = event.parent.source;

      if (source.species === species && holds(source, item)) {
        event.value += SPECIES_LENS_CRITICAL_STAGES;
      }
    }),
  );
}

const setupQuickClaw = createHeldItem(Items.QuickClaw, (battle) => {
  /**
   * Whoever the claw is hurrying. It is rolled as the cast opens rather
   * than in the priority check, because the check is asked over and
   * over — by the AI rating a move it may never throw, and by the
   * engine working out the wind-up — and a claw that rolled fresh each
   * time would be a different item on every question
   */
  const hurried = new Set<Unit>();

  function calm(unit: Unit): void {
    hurried.delete(unit);
  }

  return new MergedLifecycle([
    battle.on(BattleEvents.UnitCast, EventPriority.Pre, (event) => {
      if (holds(event.source, Items.QuickClaw) && battle.random() < QUICK_CLAW_CHANCE) {
        hurried.add(event.source);
        event.source.triggerItem(Items.QuickClaw);
      } else {
        calm(event.source);
      }
    }),

    battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
      if (hurried.has(event.source)) {
        event.priority += QUICK_CLAW_PRIORITY;
      }
    }),

    // The hurry is the cast's, so it goes when the cast does
    battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
      calm(event.source);
    }),
    battle.on(BattleEvents.UnitStopCast, EventPriority.Post, (event) => {
      calm(event.source);
    }),
    battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
      calm(event.source);
    }),
  ]);
});

// A Focus Band leaves its holder standing on 1 HP now and then, and is
// not spent doing it. Indirect damage is not a blow, so nothing a
// status or a recoil does can be endured this way
const setupFocusBand = createHeldItem(Items.FocusBand, (battle) =>
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
);

// A Rocky Helmet takes a share out of whoever put a hand on its holder.
// Indirect, so nothing about the blow — drain, recoil, an item of the
// attacker's own — reads it as a hit of its own
const setupRockyHelmet = createHeldItem(Items.RockyHelmet, (battle) =>
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      !event.success ||
      event.flags & DamageFlags.Indirect ||
      event.cause.type !== EffectType.Move ||
      event.cause.unit === event.target ||
      !holds(event.target, Items.RockyHelmet) ||
      !event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target))
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
);

const setupSafetyGoggles = createHeldItem(
  Items.SafetyGoggles,
  (battle) =>
    new MergedLifecycle([
      // Nothing powdered reaches the eyes behind them
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
    ]),
);

// A Utility Umbrella keeps the sun and the rain off its holder: the
// weather is still out there, but as far as this unit is concerned
// there is none
const setupUtilityUmbrella = createHeldItem(Items.UtilityUmbrella, (battle) =>
  battle.on(BattleEvents.CheckUnitWeather, EventPriority.Post, (event) => {
    if (UMBRELLA_WEATHERS.has(event.weather) && holds(event.source, Items.UtilityUmbrella)) {
      event.weather = Weathers.None;
    }
  }),
);

/**
 * Both of the items that get their holder out of whatever has hold of
 * it: a Smoke Ball by cover, a Shed Shell by leaving behind the part
 * being gripped
 */
function setupEscapeItem(item: Items): (battle: Battle) => void {
  return createHeldItem(item, (battle) =>
    battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
      if (!event.success && holds(event.source, item)) {
        event.success = true;

        event.source.triggerItem(item);
      }
    }),
  );
}

// A Destiny Knot ties the other end of the infatuation: whoever charmed
// the holder is charmed straight back
const setupDestinyKnot = createHeldItem(Items.DestinyKnot, (battle) =>
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
);

/**
 * A weather rock holds whatever its holder called up out for longer. It
 * answers where the weather is asked for rather than where it lands,
 * because the rock belongs to the one calling it up — a Damp Rock in a
 * raid lengthens its own team's rain and nobody else's
 */
function setupWeatherRock(rock: {
  item: Items;
  weathers: Set<Weathers>;
}): (battle: Battle) => void {
  return createHeldItem(rock.item, (battle) =>
    battle.on(BattleEvents.CheckUnitWeatherDuration, EventPriority.Post, (event) => {
      if (rock.weathers.has(event.weather) && holds(event.source, rock.item)) {
        event.duration *= WEATHER_ROCK_FACTOR;
      }
    }),
  );
}

// A Light Clay holds a screen up for as long as a rock holds the sky.
// It is read off whoever put the screen up, not off the team standing
// behind it
const setupLightClay = createHeldItem(Items.LightClay, (battle) =>
  battle.on(BattleEvents.CheckTeamStatusDuration, EventPriority.Post, (event) => {
    if (
      SCREEN_STATUSES.has(event.status) &&
      event.cause.type !== EffectType.None &&
      holds(event.cause.unit, Items.LightClay)
    ) {
      event.duration *= LIGHT_CLAY_FACTOR;
    }
  }),
);

// A Grip Claw holds on for longer, and is read off the one doing the
// holding rather than the one being held
const setupGripClaw = createHeldItem(Items.GripClaw, (battle) =>
  battle.on(BattleEvents.CheckUnitStatusDuration, EventPriority.Post, (event) => {
    if (
      event.status === Statuses.Trapped &&
      event.cause.type !== EffectType.None &&
      holds(event.cause.unit, Items.GripClaw)
    ) {
      event.duration *= GRIP_CLAW_FACTOR;
    }
  }),
);

/**
 * A Binding Band grips harder: the chip a bind takes every second is a
 * third bigger. It is the binder's own indirect damage, so what
 * identifies it is the move that caused it — anything else that unit is
 * doing to the same target stays whatever size it was
 */
const setupBindingBand = createHeldItem(Items.BindingBand, (battle) =>
  battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
    if (
      event.flags & DamageFlags.Indirect &&
      event.cause.type === EffectType.Move &&
      TRAPPING_MOVES.has(event.cause.move) &&
      event.target.status[Statuses.Trapped] != null &&
      holds(event.cause.unit, Items.BindingBand)
    ) {
      event.value *= BINDING_BAND_FACTOR;
    }
  }),
);

/**
 * A King's Rock or a Razor Fang makes whatever its holder throws
 * liable to leave the target reeling. It rides the attack rather than
 * the move, so it is a chance on every blow that lands rather than on
 * one particular kind of blow — and a move that already flinches does
 * not get a second roll
 */
function setupFlinchItem(item: Items): (battle: Battle) => void {
  return createHeldItem(item, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (
        !event.success ||
        event.category === MoveCategories.Status ||
        !event.target.alive ||
        event.target.status[Statuses.Flinched] != null ||
        !holds(event.source, item) ||
        battle.random() >= KINGS_ROCK_CHANCE
      ) {
        return;
      }

      event.source.triggerItem(item);
      event.target.addStatus(Statuses.Flinched, {
        type: EffectType.Item,
        item,
        unit: event.source,
      });
    }),
  );
}

/**
 * A Razor Claw sharpens its holder the way a Scope Lens does. It is
 * the other half of what the claw is for, and works whether or not the
 * evolution it gates is reachable
 */
const setupRazorClaw = createHeldItem(Items.RazorClaw, (battle) =>
  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    if (holds(event.parent.source, Items.RazorClaw)) {
      event.value += RAZOR_CLAW_CRITICAL_STAGES;
    }
  }),
);

/**
 * A Clear Amulet is a Guard Spec nobody has to spend: it refuses every
 * stat drop somebody else tries, for as long as it is carried, and
 * says nothing about what its holder does to itself
 */
const setupClearAmulet = createHeldItem(Items.ClearAmulet, (battle) => {
  function refuse(event: CheckUnitCanUpdateStageEvent, lowered: boolean): void {
    if (
      event.success &&
      lowered &&
      event.cause.type !== EffectType.None &&
      event.cause.unit !== event.source &&
      holds(event.source, Items.ClearAmulet)
    ) {
      event.success = false;
    }
  }

  return new MergedLifecycle([
    battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
      refuse(event, event.value < 0);
    }),
    battle.on(BattleEvents.CheckUnitCanRemoveStage, EventPriority.Post, (event) => {
      refuse(event, event.value > 0);
    }),
  ]);
});

const SETUPS: ((battle: Battle) => void)[] = [
  setupLeftovers,
  setupBlackSludge,
  setupStickyBarbResidual,
  setupStickyBarbTransfer,
  setupIronBall,
  setupFloatStone,
  setupLaggingTail,
  setupRingTarget,
  setupProtectivePads,
  setupShellBell,
  setupBigRoot,
  ...[...BAND_CATEGORIES].map(([item, category]) => setupBand(item, category)),
  setupExpertBelt,
  setupMetronome,
  setupWideLens,
  setupBrightPowder,
  setupZoomLens,
  setupScopeLens,
  ...[...SPECIES_LENSES].map(([item, species]) => setupSpeciesLens(item, species)),
  setupQuickClaw,
  setupFocusBand,
  setupRockyHelmet,
  setupSafetyGoggles,
  setupUtilityUmbrella,
  setupEscapeItem(Items.SmokeBall),
  setupEscapeItem(Items.ShedShell),
  setupDestinyKnot,
  ...WEATHER_ROCKS.map(setupWeatherRock),
  setupLightClay,
  setupGripClaw,
  setupBindingBand,
  setupClearAmulet,
  // These three are registered with the trade items, since the
  // evolution each gates is the other half of what it is for
  setupFlinchItem(Items.KingsRock),
  setupFlinchItem(Items.RazorFang),
  setupRazorClaw,
];

export default function setupGear(battle: Battle): void {
  for (const setup of SETUPS) {
    setup(battle);
  }
}
