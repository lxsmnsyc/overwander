import { Items } from '../../ids/items';
import { Species } from '../../ids/species';
import type { WildHeldItems } from '.';

/** What the generation 1 species carry, in dex order */
const GEN_1_HELD_ITEMS: [Species, WildHeldItems][] = [
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
  [Species.Eevee, { common: Items.OranBerry, uncommon: Items.SilkScarf }],
  [Species.Vaporeon, { common: Items.OranBerry, uncommon: Items.SilkScarf }],
  [Species.Jolteon, { common: Items.OranBerry, uncommon: Items.SilkScarf }],
  [Species.Flareon, { common: Items.OranBerry, uncommon: Items.SilkScarf }],
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
];

export default GEN_1_HELD_ITEMS;
