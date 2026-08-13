import { Stages, Stats } from '../constants/stats';
import { Types } from '../constants/types';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { Statuses } from '../ids/status';
import { registerItem } from './__create';

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
 * What a berry that does more than cure a status fetches. A cure sells
 * for twenty; these are found in the same patches and are worth
 * carrying for what they do, so they are worth more to somebody who
 * would rather have the gold
 */
export const RARE_BERRY_SELL = 80;

/**
 * The berries added after the ten the game started with, and what
 * each is called. They are registered from this rather than one by
 * one: they cost the same, are held the same way, and differ only in
 * what the tables above say about them
 */
const BERRY_NAMES = new Map<Items, string>([
  [Items.OccaBerry, 'Occa Berry'],
  [Items.PasshoBerry, 'Passho Berry'],
  [Items.WacanBerry, 'Wacan Berry'],
  [Items.RindoBerry, 'Rindo Berry'],
  [Items.YacheBerry, 'Yache Berry'],
  [Items.ChopleBerry, 'Chople Berry'],
  [Items.KebiaBerry, 'Kebia Berry'],
  [Items.ShucaBerry, 'Shuca Berry'],
  [Items.CobaBerry, 'Coba Berry'],
  [Items.PayapaBerry, 'Payapa Berry'],
  [Items.TangaBerry, 'Tanga Berry'],
  [Items.ChartiBerry, 'Charti Berry'],
  [Items.KasibBerry, 'Kasib Berry'],
  [Items.HabanBerry, 'Haban Berry'],
  [Items.ColburBerry, 'Colbur Berry'],
  [Items.BabiriBerry, 'Babiri Berry'],
  [Items.ChilanBerry, 'Chilan Berry'],
  [Items.RoseliBerry, 'Roseli Berry'],
  [Items.LiechiBerry, 'Liechi Berry'],
  [Items.GanlonBerry, 'Ganlon Berry'],
  [Items.SalacBerry, 'Salac Berry'],
  [Items.PetayaBerry, 'Petaya Berry'],
  [Items.ApicotBerry, 'Apicot Berry'],
  [Items.LansatBerry, 'Lansat Berry'],
  [Items.StarfBerry, 'Starf Berry'],
  [Items.CustapBerry, 'Custap Berry'],
  [Items.MicleBerry, 'Micle Berry'],
  [Items.FigyBerry, 'Figy Berry'],
  [Items.WikiBerry, 'Wiki Berry'],
  [Items.MagoBerry, 'Mago Berry'],
  [Items.AguavBerry, 'Aguav Berry'],
  [Items.IapapaBerry, 'Iapapa Berry'],
  [Items.EnigmaBerry, 'Enigma Berry'],
  [Items.KeeBerry, 'Kee Berry'],
  [Items.MarangaBerry, 'Maranga Berry'],
  [Items.JabocaBerry, 'Jaboca Berry'],
  [Items.RowapBerry, 'Rowap Berry'],
  [Items.PomegBerry, 'Pomeg Berry'],
  [Items.KelpsyBerry, 'Kelpsy Berry'],
  [Items.QualotBerry, 'Qualot Berry'],
  [Items.HondewBerry, 'Hondew Berry'],
  [Items.GrepaBerry, 'Grepa Berry'],
  [Items.TamatoBerry, 'Tamato Berry'],
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
    OTHER_BERRIES.has(item)
  );
}

/**
 * The picture of a berry.
 *
 * Every berry sits on the one `berries` sheet under the bare half of
 * its name — a Cheri Berry is `cheri` — so the sprite is derived from
 * the name rather than written out fifty-three more times. The sheet
 * covers every berry the game has, and one it did not cover would
 * draw nothing rather than draw the wrong fruit
 */
function berryIcon(name: string): string {
  return `berries/${name.replace(' Berry', '').toLowerCase()}`;
}

export default function registerBattleBerries(): void {
  // Cures paralysis
  registerItem(Items.CheriBerry, {
    name: 'Cheri Berry',
    type: ItemTypes.Berry,
    icon: 'berries/cheri',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures sleep
  registerItem(Items.ChestoBerry, {
    name: 'Chesto Berry',
    type: ItemTypes.Berry,
    icon: 'berries/chesto',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures poison
  registerItem(Items.PechaBerry, {
    name: 'Pecha Berry',
    type: ItemTypes.Berry,
    icon: 'berries/pecha',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures a burn
  registerItem(Items.RawstBerry, {
    name: 'Rawst Berry',
    type: ItemTypes.Berry,
    icon: 'berries/rawst',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Thaws the holder
  registerItem(Items.AspearBerry, {
    name: 'Aspear Berry',
    type: ItemTypes.Berry,
    icon: 'berries/aspear',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Restores PP of a depleted move
  registerItem(Items.LeppaBerry, {
    name: 'Leppa Berry',
    type: ItemTypes.Berry,
    icon: 'berries/leppa',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Restores a small amount of health when low
  registerItem(Items.OranBerry, {
    name: 'Oran Berry',
    type: ItemTypes.Berry,
    icon: 'berries/oran',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures confusion
  registerItem(Items.PersimBerry, {
    name: 'Persim Berry',
    type: ItemTypes.Berry,
    icon: 'berries/persim',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures any status condition
  registerItem(Items.LumBerry, {
    name: 'Lum Berry',
    type: ItemTypes.Berry,
    icon: 'berries/lum',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Restores a quarter of max health when low
  registerItem(Items.SitrusBerry, {
    name: 'Sitrus Berry',
    type: ItemTypes.Berry,
    icon: 'berries/sitrus',
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });

  // The rest of them are written as one line each: what a berry is
  // worth is the same for all of them, and what each one does is
  // already said by the table it is in
  for (const [item, name] of BERRY_NAMES) {
    registerItem(item, {
      name,
      type: ItemTypes.Berry,
      icon: berryIcon(name),
      flags: ItemFlags.Holdable | ItemFlags.Consumable,
      buy: 0,
      // The scarcer berries are worth more to a seller than the cures
      // are, which is most of what makes them worth digging up
      sell: RARE_BERRY_SELL,
    });
  }
}
