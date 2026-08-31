import { Items } from '../ids/items';
import { Species } from '../ids/species';

/**
 * What a wild pokemon is carrying when it is met.
 *
 * The mainline has given the same species different things to hold in
 * different generations — a Grimer carried a Nugget in Johto and
 * Black Sludge from Sinnoh on — so this table is the union of all of
 * them rather than any one game's list, cut to the three best for
 * each species. Where a species has fewer than three worth carrying,
 * it carries fewer.
 *
 * The slots are ranked by what the item is worth, because half of
 * every meeting hands the common one over: a berry or a small find
 * there, the type item or the trade item at a twentieth, and the
 * signature item — the one that is only worth anything in those hands
 * — at a hundredth. A market-priced item in the common slot would pay
 * a player more for walking than for playing. The roll is in
 * [`src/overworld/encounter.ts`](../../overworld/encounter.ts), off
 * the same trait value the nature and the ability come from, so two
 * players meeting one spawn see it holding the same thing.
 */

/**
 * The odds of each slot. The first two are the mainline's own; the
 * third is this game's, and it exists because the union above gives
 * some species a signature item worth more than a 5% slot should hand
 * out
 */
export const WILD_HELD_COMMON = 0.5;
export const WILD_HELD_UNCOMMON = 0.05;
export const WILD_HELD_RARE = 0.01;

export interface WildHeldItems {
  /**
   * Carried by half of them, and worth the least
   */
  common?: Items;
  /**
   * One in twenty
   */
  uncommon?: Items;
  /**
   * One in a hundred, and always the one worth having
   */
  rare?: Items;
}

/**
 * Every species that carries anything, in dex order. A line holds
 * what its first form holds, so a species reads the same all the way
 * up — and reading down the table beside the dex is how a gap gets
 * spotted
 */
const SPECIES_HELD_ITEMS = new Map<Species, WildHeldItems>([
  [Species.Bulbasaur, { common: Items.OranBerry, uncommon: Items.MiracleSeed }],
  [Species.Ivysaur, { common: Items.OranBerry, uncommon: Items.MiracleSeed }],
  [Species.Venusaur, { common: Items.OranBerry, uncommon: Items.MiracleSeed }],
  [Species.Charmander, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Charmeleon, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Charizard, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Squirtle, { common: Items.OranBerry, uncommon: Items.MysticWater }],
  [Species.Wartortle, { common: Items.OranBerry, uncommon: Items.MysticWater }],
  [Species.Blastoise, { common: Items.OranBerry, uncommon: Items.MysticWater }],
  [Species.Caterpie, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.Metapod, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [
    Species.Butterfree,
    { common: Items.OranBerry, uncommon: Items.SilverPowder, rare: Items.LaxIncense },
  ],
  [Species.Weedle, { common: Items.PechaBerry, uncommon: Items.PoisonBarb }],
  [Species.Kakuna, { common: Items.PechaBerry, uncommon: Items.PoisonBarb }],
  [
    Species.Beedrill,
    { common: Items.PechaBerry, uncommon: Items.PoisonBarb, rare: Items.SilverPowder },
  ],
  [
    Species.Pidgey,
    { common: Items.OranBerry, uncommon: Items.SharpBeak, rare: Items.BrightPowder },
  ],
  [
    Species.Pidgeotto,
    { common: Items.OranBerry, uncommon: Items.SharpBeak, rare: Items.BrightPowder },
  ],
  [
    Species.Pidgeot,
    { common: Items.OranBerry, uncommon: Items.SharpBeak, rare: Items.BrightPowder },
  ],
  [Species.Rattata, { common: Items.OranBerry, uncommon: Items.SilkScarf, rare: Items.QuickClaw }],
  [Species.Raticate, { common: Items.OranBerry, uncommon: Items.SilkScarf, rare: Items.QuickClaw }],
  [
    Species.Spearow,
    { common: Items.OranBerry, uncommon: Items.SharpBeak, rare: Items.BrightPowder },
  ],
  [
    Species.Fearow,
    { common: Items.OranBerry, uncommon: Items.SharpBeak, rare: Items.BrightPowder },
  ],
  [Species.Ekans, { common: Items.PechaBerry, uncommon: Items.PoisonBarb }],
  [Species.Arbok, { common: Items.PechaBerry, uncommon: Items.PoisonBarb }],
  [Species.Pikachu, { common: Items.OranBerry, uncommon: Items.Magnet, rare: Items.LightBall }],
  [Species.Raichu, { common: Items.OranBerry, uncommon: Items.Magnet, rare: Items.LightBall }],
  [
    Species.Sandshrew,
    { common: Items.TinyMushroom, uncommon: Items.SoftSand, rare: Items.QuickClaw },
  ],
  [
    Species.Sandslash,
    { common: Items.TinyMushroom, uncommon: Items.SoftSand, rare: Items.QuickClaw },
  ],
  [
    Species.NidoranF,
    { common: Items.PechaBerry, uncommon: Items.PoisonBarb, rare: Items.MoonStone },
  ],
  [
    Species.Nidorina,
    { common: Items.PechaBerry, uncommon: Items.PoisonBarb, rare: Items.MoonStone },
  ],
  [
    Species.Nidoqueen,
    { common: Items.PechaBerry, uncommon: Items.PoisonBarb, rare: Items.MoonStone },
  ],
  [
    Species.NidoranM,
    { common: Items.PechaBerry, uncommon: Items.PoisonBarb, rare: Items.MoonStone },
  ],
  [
    Species.Nidorino,
    { common: Items.PechaBerry, uncommon: Items.PoisonBarb, rare: Items.MoonStone },
  ],
  [
    Species.Nidoking,
    { common: Items.PechaBerry, uncommon: Items.PoisonBarb, rare: Items.MoonStone },
  ],
  [Species.Clefairy, { common: Items.OranBerry, uncommon: Items.Stardust, rare: Items.MoonStone }],
  [Species.Clefable, { common: Items.OranBerry, uncommon: Items.Stardust, rare: Items.MoonStone }],
  [Species.Vulpix, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Ninetales, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [
    Species.Jigglypuff,
    { common: Items.OranBerry, uncommon: Items.SilkScarf, rare: Items.MoonStone },
  ],
  [
    Species.Wigglytuff,
    { common: Items.OranBerry, uncommon: Items.SilkScarf, rare: Items.MoonStone },
  ],
  [Species.Zubat, { common: Items.PechaBerry, uncommon: Items.SharpBeak, rare: Items.PoisonBarb }],
  [Species.Golbat, { common: Items.PechaBerry, uncommon: Items.SharpBeak, rare: Items.PoisonBarb }],
  [
    Species.Oddish,
    { common: Items.OranBerry, uncommon: Items.MiracleSeed, rare: Items.PoisonBarb },
  ],
  [Species.Gloom, { common: Items.OranBerry, uncommon: Items.MiracleSeed, rare: Items.PoisonBarb }],
  [
    Species.Vileplume,
    { common: Items.OranBerry, uncommon: Items.MiracleSeed, rare: Items.PoisonBarb },
  ],
  [Species.Paras, { common: Items.TinyMushroom, uncommon: Items.BigMushroom }],
  [Species.Parasect, { common: Items.TinyMushroom, uncommon: Items.BigMushroom }],
  [
    Species.Venonat,
    { common: Items.OranBerry, uncommon: Items.SilverPowder, rare: Items.LaxIncense },
  ],
  [
    Species.Venomoth,
    { common: Items.OranBerry, uncommon: Items.SilverPowder, rare: Items.LaxIncense },
  ],
  [
    Species.Diglett,
    { common: Items.TinyMushroom, uncommon: Items.SoftSand, rare: Items.QuickClaw },
  ],
  [
    Species.Dugtrio,
    { common: Items.TinyMushroom, uncommon: Items.SoftSand, rare: Items.QuickClaw },
  ],
  [Species.Meowth, { common: Items.OranBerry, uncommon: Items.Stardust, rare: Items.Nugget }],
  [Species.Persian, { common: Items.OranBerry, uncommon: Items.Stardust, rare: Items.Nugget }],
  [
    Species.Psyduck,
    { common: Items.OranBerry, uncommon: Items.MysticWater, rare: Items.TwistedSpoon },
  ],
  [
    Species.Golduck,
    { common: Items.OranBerry, uncommon: Items.MysticWater, rare: Items.TwistedSpoon },
  ],
  [Species.Mankey, { common: Items.OranBerry, uncommon: Items.BlackBelt, rare: Items.FocusBand }],
  [Species.Primeape, { common: Items.OranBerry, uncommon: Items.BlackBelt, rare: Items.FocusBand }],
  [Species.Growlithe, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Arcanine, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [
    Species.Poliwag,
    { common: Items.OranBerry, uncommon: Items.KingsRock, rare: Items.MysticWater },
  ],
  [
    Species.Poliwhirl,
    { common: Items.OranBerry, uncommon: Items.KingsRock, rare: Items.MysticWater },
  ],
  [
    Species.Poliwrath,
    { common: Items.OranBerry, uncommon: Items.KingsRock, rare: Items.MysticWater },
  ],
  [Species.Abra, { common: Items.OranBerry, uncommon: Items.TwistedSpoon }],
  [Species.Kadabra, { common: Items.OranBerry, uncommon: Items.TwistedSpoon }],
  [Species.Alakazam, { common: Items.OranBerry, uncommon: Items.TwistedSpoon }],
  [Species.Machop, { common: Items.OranBerry, uncommon: Items.BlackBelt, rare: Items.FocusBand }],
  [Species.Machoke, { common: Items.OranBerry, uncommon: Items.BlackBelt, rare: Items.FocusBand }],
  [Species.Machamp, { common: Items.OranBerry, uncommon: Items.BlackBelt, rare: Items.FocusBand }],
  [
    Species.Bellsprout,
    { common: Items.OranBerry, uncommon: Items.MiracleSeed, rare: Items.BigRoot },
  ],
  [
    Species.Weepinbell,
    { common: Items.OranBerry, uncommon: Items.MiracleSeed, rare: Items.BigRoot },
  ],
  [
    Species.Victreebel,
    { common: Items.OranBerry, uncommon: Items.MiracleSeed, rare: Items.BigRoot },
  ],
  [
    Species.Tentacool,
    { common: Items.PechaBerry, uncommon: Items.PoisonBarb, rare: Items.MysticWater },
  ],
  [
    Species.Tentacruel,
    { common: Items.PechaBerry, uncommon: Items.PoisonBarb, rare: Items.MysticWater },
  ],
  [
    Species.Geodude,
    { common: Items.TinyMushroom, uncommon: Items.Everstone, rare: Items.HardStone },
  ],
  [
    Species.Graveler,
    { common: Items.TinyMushroom, uncommon: Items.Everstone, rare: Items.HardStone },
  ],
  [Species.Golem, { common: Items.TinyMushroom, uncommon: Items.Everstone, rare: Items.HardStone }],
  [Species.Ponyta, { common: Items.RawstBerry, uncommon: Items.Charcoal, rare: Items.QuickClaw }],
  [Species.Rapidash, { common: Items.RawstBerry, uncommon: Items.Charcoal, rare: Items.QuickClaw }],
  [
    Species.Slowpoke,
    { common: Items.OranBerry, uncommon: Items.KingsRock, rare: Items.MysticWater },
  ],
  [
    Species.Slowbro,
    { common: Items.OranBerry, uncommon: Items.KingsRock, rare: Items.MysticWater },
  ],
  [Species.Magnemite, { common: Items.OranBerry, uncommon: Items.MetalCoat, rare: Items.Magnet }],
  [Species.Magneton, { common: Items.OranBerry, uncommon: Items.MetalCoat, rare: Items.Magnet }],
  [Species.Farfetchd, { common: Items.OranBerry, uncommon: Items.SharpBeak, rare: Items.Stick }],
  [Species.Doduo, { common: Items.OranBerry, uncommon: Items.SharpBeak, rare: Items.QuickClaw }],
  [Species.Dodrio, { common: Items.OranBerry, uncommon: Items.SharpBeak, rare: Items.QuickClaw }],
  [
    Species.Seel,
    { common: Items.AspearBerry, uncommon: Items.NeverMeltIce, rare: Items.MysticWater },
  ],
  [
    Species.Dewgong,
    { common: Items.AspearBerry, uncommon: Items.NeverMeltIce, rare: Items.MysticWater },
  ],
  [Species.Grimer, { common: Items.PechaBerry, uncommon: Items.Nugget, rare: Items.BlackSludge }],
  [Species.Muk, { common: Items.PechaBerry, uncommon: Items.Nugget, rare: Items.BlackSludge }],
  [Species.Shellder, { common: Items.Pearl, uncommon: Items.BigPearl, rare: Items.PearlString }],
  [Species.Cloyster, { common: Items.Pearl, uncommon: Items.BigPearl, rare: Items.PearlString }],
  [Species.Gastly, { common: Items.OranBerry, uncommon: Items.SpellTag, rare: Items.SmokeBall }],
  [Species.Haunter, { common: Items.OranBerry, uncommon: Items.SpellTag, rare: Items.SmokeBall }],
  [Species.Gengar, { common: Items.OranBerry, uncommon: Items.SpellTag, rare: Items.SmokeBall }],
  [Species.Onix, { common: Items.TinyMushroom, uncommon: Items.MetalCoat, rare: Items.HardStone }],
  // A Big Root deepens what Dream Eater takes, which is the whole
  // of what this line is for
  [
    Species.Drowzee,
    { common: Items.ChestoBerry, uncommon: Items.TwistedSpoon, rare: Items.BigRoot },
  ],
  [Species.Hypno, { common: Items.ChestoBerry, uncommon: Items.TwistedSpoon, rare: Items.BigRoot }],
  [Species.Krabby, { common: Items.Pearl, uncommon: Items.BigPearl }],
  [Species.Kingler, { common: Items.Pearl, uncommon: Items.BigPearl }],
  [Species.Voltorb, { common: Items.OranBerry, uncommon: Items.Magnet, rare: Items.CellBattery }],
  [Species.Electrode, { common: Items.OranBerry, uncommon: Items.Magnet, rare: Items.CellBattery }],
  [
    Species.Exeggcute,
    { common: Items.OranBerry, uncommon: Items.MiracleSeed, rare: Items.SitrusBerry },
  ],
  [
    Species.Exeggutor,
    { common: Items.OranBerry, uncommon: Items.MiracleSeed, rare: Items.SitrusBerry },
  ],
  [
    Species.Cubone,
    { common: Items.TinyMushroom, uncommon: Items.HardStone, rare: Items.ThickClub },
  ],
  [
    Species.Marowak,
    { common: Items.TinyMushroom, uncommon: Items.HardStone, rare: Items.ThickClub },
  ],
  [
    Species.Hitmonlee,
    { common: Items.OranBerry, uncommon: Items.BlackBelt, rare: Items.FocusBand },
  ],
  [
    Species.Hitmonchan,
    { common: Items.OranBerry, uncommon: Items.BlackBelt, rare: Items.FocusBand },
  ],
  [
    Species.Lickitung,
    { common: Items.OranBerry, uncommon: Items.SilkScarf, rare: Items.Leftovers },
  ],
  [
    Species.Koffing,
    { common: Items.PechaBerry, uncommon: Items.SmokeBall, rare: Items.BlackSludge },
  ],
  [
    Species.Weezing,
    { common: Items.PechaBerry, uncommon: Items.SmokeBall, rare: Items.BlackSludge },
  ],
  [
    Species.Rhyhorn,
    { common: Items.TinyMushroom, uncommon: Items.Protector, rare: Items.HardStone },
  ],
  [
    Species.Rhydon,
    { common: Items.TinyMushroom, uncommon: Items.Protector, rare: Items.HardStone },
  ],
  [Species.Chansey, { common: Items.OranBerry, uncommon: Items.SilkScarf, rare: Items.LuckyEgg }],
  [Species.Tangela, { common: Items.OranBerry, uncommon: Items.MiracleSeed, rare: Items.BigRoot }],
  [
    Species.Kangaskhan,
    { common: Items.OranBerry, uncommon: Items.SilkScarf, rare: Items.Leftovers },
  ],
  [
    Species.Horsea,
    { common: Items.OranBerry, uncommon: Items.DragonScale, rare: Items.MysticWater },
  ],
  [
    Species.Seadra,
    { common: Items.OranBerry, uncommon: Items.DragonScale, rare: Items.MysticWater },
  ],
  [
    Species.Goldeen,
    { common: Items.OranBerry, uncommon: Items.MysticWater, rare: Items.SharpBeak },
  ],
  [
    Species.Seaking,
    { common: Items.OranBerry, uncommon: Items.MysticWater, rare: Items.SharpBeak },
  ],
  [Species.Staryu, { common: Items.Stardust, uncommon: Items.StarPiece, rare: Items.CometShard }],
  [Species.Starmie, { common: Items.Stardust, uncommon: Items.StarPiece, rare: Items.CometShard }],
  [
    Species.MrMime,
    { common: Items.OranBerry, uncommon: Items.TwistedSpoon, rare: Items.LightClay },
  ],
  [
    Species.Scyther,
    { common: Items.OranBerry, uncommon: Items.MetalCoat, rare: Items.SilverPowder },
  ],
  [
    Species.Jynx,
    { common: Items.AspearBerry, uncommon: Items.NeverMeltIce, rare: Items.TwistedSpoon },
  ],
  [
    Species.Electabuzz,
    { common: Items.OranBerry, uncommon: Items.Electirizer, rare: Items.Magnet },
  ],
  [Species.Magmar, { common: Items.RawstBerry, uncommon: Items.Magmarizer, rare: Items.Charcoal }],
  [
    Species.Pinsir,
    { common: Items.OranBerry, uncommon: Items.SilverPowder, rare: Items.MuscleBand },
  ],
  [Species.Tauros, { common: Items.OranBerry, uncommon: Items.SilkScarf, rare: Items.MuscleBand }],
  [
    Species.Magikarp,
    { common: Items.TinyMushroom, uncommon: Items.MysticWater, rare: Items.DragonScale },
  ],
  [
    Species.Gyarados,
    { common: Items.OranBerry, uncommon: Items.MysticWater, rare: Items.DragonFang },
  ],
  [
    Species.Lapras,
    { common: Items.AspearBerry, uncommon: Items.MysticWater, rare: Items.NeverMeltIce },
  ],
  [Species.Ditto, { common: Items.QuickPowder, uncommon: Items.MetalPowder }],
  [Species.Porygon, { common: Items.OranBerry, uncommon: Items.UpGrade, rare: Items.Metronome }],
  [
    Species.Omanyte,
    { common: Items.TinyMushroom, uncommon: Items.HardStone, rare: Items.Everstone },
  ],
  [
    Species.Omastar,
    { common: Items.TinyMushroom, uncommon: Items.HardStone, rare: Items.Everstone },
  ],
  [
    Species.Kabuto,
    { common: Items.TinyMushroom, uncommon: Items.HardStone, rare: Items.Everstone },
  ],
  [
    Species.Kabutops,
    { common: Items.TinyMushroom, uncommon: Items.HardStone, rare: Items.Everstone },
  ],
  [
    Species.Aerodactyl,
    { common: Items.TinyMushroom, uncommon: Items.SharpBeak, rare: Items.HardStone },
  ],
  [
    Species.Snorlax,
    { common: Items.OranBerry, uncommon: Items.SitrusBerry, rare: Items.Leftovers },
  ],
  [
    Species.Dratini,
    { common: Items.OranBerry, uncommon: Items.DragonFang, rare: Items.DragonScale },
  ],
  [
    Species.Dragonair,
    { common: Items.OranBerry, uncommon: Items.DragonFang, rare: Items.DragonScale },
  ],
  [
    Species.Dragonite,
    { common: Items.OranBerry, uncommon: Items.DragonFang, rare: Items.DragonScale },
  ],
]);

export function getSpeciesHeldItems(species: Species): WildHeldItems | undefined {
  return SPECIES_HELD_ITEMS.get(species);
}

/**
 * The item a roll of 0 to 1 lands on, or null for an empty-handed
 * meeting.
 *
 * Rarest slot first, cumulative: a species with all three hands over
 * the rare one on the bottom hundredth of the roll, the uncommon on
 * the twentieth above that, and the common one on the half above
 * those.
 *
 * `boost` widens the two rare slots and leaves the common one where
 * it is, for a player walking with something that finds what a
 * pokemon is carrying. Widening all three would only saturate: the
 * common slot is already half of every meeting, so doubling it hands
 * over something every time and the thing actually worth looking for
 * would be no likelier than before
 */
export function pickHeldItem(
  held: WildHeldItems | undefined,
  roll: number,
  boost = 1,
): Items | null {
  if (held == null) {
    return null;
  }

  let threshold = 0;

  if (held.rare != null) {
    threshold += WILD_HELD_RARE * boost;

    if (roll < threshold) {
      return held.rare;
    }
  }
  if (held.uncommon != null) {
    threshold += WILD_HELD_UNCOMMON * boost;

    if (roll < threshold) {
      return held.uncommon;
    }
  }
  if (held.common != null) {
    threshold += WILD_HELD_COMMON;

    if (roll < threshold) {
      return held.common;
    }
  }
  return null;
}
