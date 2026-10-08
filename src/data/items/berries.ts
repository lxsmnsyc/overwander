import { STAGE_NAMES, STAT_NAMES, Stages, Stats } from '../constants/stats';
import { TYPE_NAMES, Types } from '../constants/types';
import { Items } from '../ids/items';
import { Statuses } from '../ids/status';
import { itemText } from './__create';

/**
 * The berries, and what each one is for.
 *
 * A berry is held to trigger on its own in a battle — the field side
 * of that is in [`src/battle/items/berries.ts`](../../battle/items/berries.ts)
 * — but the same two tables answer what it does when a player hands
 * one to a hurt pokemon between fights. What a berry cures and what
 * it restores is a property of the berry, not of the battle, so it is
 * written once here and read from both sides.
 *
 * All of them are consumed by their use, whichever side spends them.
 */

/**
 * What each curing berry takes off. A berry that covers a status
 * cures it in a battle the moment it lands, and out of one the moment
 * it is handed over
 */
export const BERRY_STATUS_CURES = new Map<Items, Set<Statuses>>([
  [Items.CheriBerry, new Set([Statuses.Paralyzed])],
  [Items.ChestoBerry, new Set([Statuses.Sleeping])],
  [Items.PechaBerry, new Set([Statuses.Poisoned, Statuses.BadlyPoisoned])],
  [Items.RawstBerry, new Set([Statuses.Burned])],
  [Items.AspearBerry, new Set([Statuses.Frozen])],
  [Items.PersimBerry, new Set([Statuses.Confused])],
  [
    Items.LumBerry,
    new Set([
      Statuses.Paralyzed,
      Statuses.Sleeping,
      Statuses.Poisoned,
      Statuses.BadlyPoisoned,
      Statuses.Burned,
      Statuses.Frozen,
      Statuses.Confused,
    ]),
  ],
]);

export interface BerryHeal {
  /**
   * Fraction of maximum health at (or below) which the berry
   * triggers on its own in a battle. It is a battle rule only: a
   * player handing one over out of a fight decides for themselves
   * whether it is worth it
   */
  threshold: number;
  heal: (maxHealth: number) => number;
}

/**
 * What each restoring berry gives back
 */
export const BERRY_HEALS = new Map<Items, BerryHeal>([
  [Items.OranBerry, { threshold: 0.5, heal: () => 10 }],
  [Items.SitrusBerry, { threshold: 0.5, heal: (max) => max / 4 }],
]);

/**
 * What each type-resist berry answers. A berry is eaten by a blow of
 * its type that is landing hard, and takes half of it off — the one
 * exception is Chilan, since nothing is weak to Normal and a berry
 * that waited for a super-effective Normal move would never be eaten
 * at all
 */
export const BERRY_RESIST_TYPES = new Map<Items, Types>([
  [Items.OccaBerry, Types.Fire],
  [Items.PasshoBerry, Types.Water],
  [Items.WacanBerry, Types.Electric],
  [Items.RindoBerry, Types.Grass],
  [Items.YacheBerry, Types.Ice],
  [Items.ChopleBerry, Types.Fighting],
  [Items.KebiaBerry, Types.Poison],
  [Items.ShucaBerry, Types.Ground],
  [Items.CobaBerry, Types.Flying],
  [Items.PayapaBerry, Types.Psychic],
  [Items.TangaBerry, Types.Bug],
  [Items.ChartiBerry, Types.Rock],
  [Items.KasibBerry, Types.Ghost],
  [Items.HabanBerry, Types.Dragon],
  [Items.ColburBerry, Types.Dark],
  [Items.BabiriBerry, Types.Steel],
  [Items.ChilanBerry, Types.Normal],
  [Items.RoseliBerry, Types.Fairy],
]);

/**
 * How much of the blow a resist berry takes off
 */
export const BERRY_RESIST_FACTOR = 0.5;

/**
 * The share of health a pinch berry waits for. A quarter left is the
 * moment a fight is decided, which is what makes these berries worth
 * a slot over one that heals
 */
export const BERRY_PINCH_THRESHOLD = 0.25;

/**
 * What each pinch berry lifts. One stage is what the mainline pays,
 * and the Starf's two are the price of not knowing which stat you
 * will get
 */
export const BERRY_PINCH_STAGES = new Map<Items, Stages>([
  [Items.LiechiBerry, Stages.Attack],
  [Items.GanlonBerry, Stages.Defense],
  [Items.SalacBerry, Stages.Speed],
  [Items.PetayaBerry, Stages.SpecialAttack],
  [Items.ApicotBerry, Stages.SpecialDefense],
]);

/**
 * The stats a Starf may lift, which is every stat a stage exists for
 * bar the two that are not stats at all
 */
export const STARF_STAGES: Stages[] = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
];

export const STARF_STAGE_AMOUNT = 2;

/**
 * The berries that wait for the same moment as the stat-lifting ones
 * but buy something other than a stat with it
 */
export const PINCH_BERRIES = new Set<Items>([
  Items.LansatBerry,
  Items.StarfBerry,
  Items.CustapBerry,
  Items.MicleBerry,
]);

/**
 * What a Lansat adds to the holder's odds of a critical hit, and what
 * a Micle adds to the accuracy of the move it is spent on.
 *
 * The critical figure is a number of **stages**, not a multiplier: the
 * ratio a blow is rolled against opens at zero and everything that
 * sharpens a unit — Focus Energy, a Slash, a Scope Lens — adds to it,
 * so anything written as a multiplier would quietly amount to nothing
 */
export const LANSAT_CRITICAL_STAGES = 2;
export const MICLE_ACCURACY = 1.2;

/**
 * What a Custap is worth to the one move it hurries along. Priority
 * here is the same scale a move's own priority is on, so a berry buys
 * what a Quick Attack has
 */
export const CUSTAP_PRIORITY = 1;

/**
 * The bitter berries: a third of the holder's health, and confusion
 * for a holder whose nature dislikes the flavour. Each one is keyed
 * by the stat its flavour belongs to, since that is what a nature
 * lowers
 */
export const BERRY_NATURE_HEALS = new Map<Items, Stats>([
  [Items.FigyBerry, Stats.Attack],
  [Items.WikiBerry, Stats.SpecialAttack],
  [Items.MagoBerry, Stats.Speed],
  [Items.AguavBerry, Stats.SpecialDefense],
  [Items.IapapaBerry, Stats.Defense],
]);

export const BERRY_NATURE_HEAL_THRESHOLD = 0.5;
export const BERRY_NATURE_HEAL_SHARE = 1 / 3;

/**
 * What an Enigma gives back when its holder is hit hard, and what the
 * paybacks take out of whoever landed the blow
 */
export const ENIGMA_HEAL_SHARE = 0.25;
export const BERRY_PAYBACK_SHARE = 0.125;

/**
 * What a holder gets for being hit, by the kind of blow that hit
 * them: a Kee braces against the physical, a Maranga against the
 * special
 */
export const BERRY_BRACE_STAGES = new Map<Items, Stages>([
  [Items.KeeBerry, Stages.Defense],
  [Items.MarangaBerry, Stages.SpecialDefense],
]);

/**
 * The berries a pokemon is fed to take training back off one stat.
 *
 * They are the other half of the wings: a wing puts three points into
 * a stat, and one of these takes ten out of one. What that is for is
 * changing your mind — effort spent on Attack is not lost when a
 * pokemon turns out to want Speed, it is fed back out ten at a time.
 *
 * A pokemon that eats one thinks better of the player for it, the way
 * the mainline has it: the berry is bitter, and being looked after is
 * being looked after
 */
export const BERRY_EFFORT_DROPS = new Map<Items, Stats>([
  [Items.PomegBerry, Stats.HP],
  [Items.KelpsyBerry, Stats.Attack],
  [Items.QualotBerry, Stats.Defense],
  [Items.HondewBerry, Stats.SpecialAttack],
  [Items.GrepaBerry, Stats.SpecialDefense],
  [Items.TamatoBerry, Stats.Speed],
]);

/**
 * How much training one of them takes back off
 */
export const BERRY_EFFORT_DROP = 10;

/**
 * The flavour berries. The mainline grows these for cooking and gives
 * them no held effect at all, so here they are bait and nothing else:
 * handed to a wild pokemon to talk it round, and worth a little more
 * for the throw than a cure berry is
 */
export const BAIT_BERRIES = new Set<Items>([
  Items.RazzBerry,
  Items.BlukBerry,
  Items.NanabBerry,
  Items.WepearBerry,
  Items.PinapBerry,
  Items.CornnBerry,
  Items.MagostBerry,
  Items.RabutaBerry,
  Items.NomelBerry,
  Items.SpelonBerry,
  Items.PamtreBerry,
  Items.WatmelBerry,
  Items.DurinBerry,
  Items.BelueBerry,
]);

/**
 * What feeding one is worth, against the quarter a cure berry buys.
 * Fed to the encounter rather than held, so the multiplier is read by
 * the safari rules in [`src/overworld/safari.ts`](../../overworld/safari.ts)
 */
export const BAIT_CATCH_BONUS = 1.5;

/**
 * The prize berries: the same three fruits a patch bears, grown silver
 * or gold. Every one of them is fed rather than held, and each family
 * buys a different thing with the feeding
 */
export const PRIZE_BERRIES = new Set<Items>([
  Items.SilverRazzBerry,
  Items.GoldenRazzBerry,
  Items.SilverNanabBerry,
  Items.GoldenNanabBerry,
  Items.SilverPinapBerry,
  Items.GoldenPinapBerry,
]);

/**
 * What a Razz grade is worth fed, against the half again plain bait
 * buys. Feeding stacks to four times over, so one gold Razz is most
 * of what feeding can achieve at all
 */
export const RAZZ_CATCH_BONUS = new Map<Items, number>([
  [Items.SilverRazzBerry, 2],
  [Items.GoldenRazzBerry, 3],
]);

/**
 * What a Nanab grade leaves of the encounter's chance to bolt, for the
 * one throw that follows it. A gold one settles the pokemon
 * completely, which is what makes it the berry for something that
 * would otherwise be gone before the third ball
 */
export const NANAB_FLEE_FACTOR = new Map<Items, number>([
  [Items.SilverNanabBerry, 0.5],
  [Items.GoldenNanabBerry, 0],
]);

/**
 * Extra helpings of the catch's own candy a Pinap grade pays.
 *
 * Unlike the other two this rides the **encounter** rather than the
 * next throw: the berry is fed once and paid out whenever the pokemon
 * finally goes in a ball, however many balls that takes. Paid flat,
 * the way the held items are, since the species day already multiplies
 * a catch's own candy
 */
export const PINAP_CANDY_HELPINGS = new Map<Items, number>([
  [Items.SilverPinapBerry, 1],
  [Items.GoldenPinapBerry, 2],
]);

/**
 * The berries that answer to no table: each one is the only thing
 * that does what it does
 */
const OTHER_BERRIES = new Set<Items>([
  Items.LeppaBerry,
  Items.LansatBerry,
  Items.StarfBerry,
  Items.CustapBerry,
  Items.MicleBerry,
  Items.EnigmaBerry,
  Items.JabocaBerry,
  Items.RowapBerry,
]);

/**
 * Whether the item is a berry at all
 */
export function isBerry(item: Items): boolean {
  return (
    BERRY_STATUS_CURES.has(item) ||
    BERRY_HEALS.has(item) ||
    BERRY_RESIST_TYPES.has(item) ||
    BERRY_PINCH_STAGES.has(item) ||
    BERRY_NATURE_HEALS.has(item) ||
    BERRY_BRACE_STAGES.has(item) ||
    BERRY_EFFORT_DROPS.has(item) ||
    BAIT_BERRIES.has(item) ||
    PRIZE_BERRIES.has(item) ||
    OTHER_BERRIES.has(item)
  );
}

/**
 * The bare half of a berry's name, which is what both its icon and its
 * plant are filed under. A grade is two words, and the sheets hyphenate
 * rather than space them
 */
export function berryFruit(name: string): string {
  return name
    .replace(/ berry$/i, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * What a berry does, in one line, for the berries whose line is read
 * off the tables above. A berry moved from one table to another
 * describes itself correctly without being edited; the ones that do
 * their own thing are written out in the text file
 */
export function describeBerry(item: Items): string {
  if (BAIT_BERRIES.has(item)) {
    return itemText('berries', 'bait', { bonus: BAIT_CATCH_BONUS });
  }

  const razz = RAZZ_CATCH_BONUS.get(item);

  if (razz != null) {
    return itemText('berries', 'bait', { bonus: razz });
  }

  const calm = NANAB_FLEE_FACTOR.get(item);

  if (calm != null) {
    return itemText('berries', calm === 0 ? 'nanabStop' : 'nanabHalve', {
      bonus: BAIT_CATCH_BONUS,
    });
  }

  const helpings = PINAP_CANDY_HELPINGS.get(item);

  if (helpings != null) {
    return itemText('berries', helpings === 1 ? 'pinapOne' : 'pinap', {
      bonus: BAIT_CATCH_BONUS,
      helpings,
    });
  }

  const resisted = BERRY_RESIST_TYPES.get(item);

  if (resisted != null) {
    return itemText('berries', resisted === Types.Normal ? 'resistNormal' : 'resist', {
      type: TYPE_NAMES[resisted],
    });
  }

  const pinch = BERRY_PINCH_STAGES.get(item);

  if (pinch != null) {
    return itemText('berries', 'pinch', { stat: STAGE_NAMES[pinch] });
  }

  const nature = BERRY_NATURE_HEALS.get(item);

  if (nature != null) {
    return itemText('berries', 'nature', { stat: STAT_NAMES[nature] });
  }

  const effort = BERRY_EFFORT_DROPS.get(item);

  if (effort != null) {
    return itemText('berries', 'effort', { stat: STAT_NAMES[effort] });
  }
  throw new Error(`No berry line is worked out for item ${item}`);
}
