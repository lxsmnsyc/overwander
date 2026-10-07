import { Items } from '../../ids/items';
import { Species } from '../../ids/species';
import type { WildHeldItems } from '.';

/** What the generation 6 species carry, in dex order */
const GEN_6_HELD_ITEMS: [Species, WildHeldItems][] = [
  [Species.Chespin, { common: Items.OranBerry, uncommon: Items.MiracleSeed }],
  [Species.Quilladin, { common: Items.OranBerry, uncommon: Items.MiracleSeed }],
  [Species.Chesnaught, { common: Items.OranBerry, uncommon: Items.MiracleSeed }],
  [Species.Fennekin, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Braixen, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Delphox, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Froakie, { common: Items.OranBerry, uncommon: Items.MysticWater }],
  [Species.Frogadier, { common: Items.OranBerry, uncommon: Items.MysticWater }],
  [Species.Greninja, { common: Items.OranBerry, uncommon: Items.MysticWater }],
  [Species.Bunnelby, { common: Items.OranBerry, uncommon: Items.SilkScarf }],
  [Species.Diggersby, { common: Items.OranBerry, uncommon: Items.SilkScarf }],
  [Species.Fletchling, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Fletchinder, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Talonflame, { common: Items.RawstBerry, uncommon: Items.Charcoal }],
  [Species.Scatterbug, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.Spewpa, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.Vivillon, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonIcySnow, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonPolar, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonTundra, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonContinental, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonGarden, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonElegant, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonModern, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonMarine, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonArchipelago, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonHighPlains, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonSandstorm, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonRiver, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonMonsoon, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonSavannah, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonSun, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonOcean, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonJungle, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonFancy, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
  [Species.VivillonPokeBall, { common: Items.OranBerry, uncommon: Items.SilverPowder }],
];

export default GEN_6_HELD_ITEMS;
