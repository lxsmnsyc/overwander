import { Species } from '../ids/species';
import { DRIVES } from './drives';
import { MEMORIES } from './memories';
import { PLATES } from './plates';
import { Types } from '../constants/types';
import { Items } from '../ids/items';

/**
 * The form items: held for the shape they put their holder into.
 *
 * A form item names a set of shapes one species comes in, and while a
 * pokemon of that species is holding it, the shape it fights in is
 * one of them. A shape worn for a fight is a different thing from one
 * a pokemon is put into and keeps: Deoxys and Rotom are rearranged
 * for good through the evolution route, and everything here is put on
 * and taken off with the item.
 *
 * The battle side lives in
 * [`src/battle/items/forms.ts`](../../battle/items/forms.ts).
 */
/** Which shape each Plate paints an Arceus, by the type it lifts */
const ARCEUS_TYPE_FORMS: { [key in Types]?: Species } = {
  [Types.Bug]: Species.ArceusBug,
  [Types.Dark]: Species.ArceusDark,
  [Types.Dragon]: Species.ArceusDragon,
  [Types.Electric]: Species.ArceusElectric,
  [Types.Fairy]: Species.ArceusFairy,
  [Types.Fighting]: Species.ArceusFighting,
  [Types.Fire]: Species.ArceusFire,
  [Types.Flying]: Species.ArceusFlying,
  [Types.Ghost]: Species.ArceusGhost,
  [Types.Grass]: Species.ArceusGrass,
  [Types.Ground]: Species.ArceusGround,
  [Types.Ice]: Species.ArceusIce,
  [Types.Poison]: Species.ArceusPoison,
  [Types.Psychic]: Species.ArceusPsychic,
  [Types.Rock]: Species.ArceusRock,
  [Types.Steel]: Species.ArceusSteel,
  [Types.Water]: Species.ArceusWater,
};

/** The Plate rows, derived so a Plate added later brings its shape */
const ARCEUS_PLATES: [Items, Species[]][] = [...PLATES].flatMap(([plate, type]) => {
  const shape = ARCEUS_TYPE_FORMS[type];

  return shape == null ? [] : [[plate, [shape]] as [Items, Species[]]];
});

/** Which shape each Drive repaints a Genesect, by the type it loads */
const GENESECT_TYPE_FORMS: { [key in Types]?: Species } = {
  [Types.Water]: Species.GenesectDouse,
  [Types.Electric]: Species.GenesectShock,
  [Types.Fire]: Species.GenesectBurn,
  [Types.Ice]: Species.GenesectChill,
};

/** The Drive rows, derived the way the Plate rows are */
const GENESECT_DRIVES: [Items, Species[]][] = [...DRIVES].flatMap(([drive, type]) => {
  const shape = GENESECT_TYPE_FORMS[type];

  return shape == null ? [] : [[drive, [shape]] as [Items, Species[]]];
});

/** Which shape each Memory makes a Silvally, by the type it carries */
const SILVALLY_TYPE_FORMS: { [key in Types]?: Species } = {
  [Types.Fighting]: Species.SilvallyFighting,
  [Types.Flying]: Species.SilvallyFlying,
  [Types.Poison]: Species.SilvallyPoison,
  [Types.Ground]: Species.SilvallyGround,
  [Types.Rock]: Species.SilvallyRock,
  [Types.Bug]: Species.SilvallyBug,
  [Types.Ghost]: Species.SilvallyGhost,
  [Types.Steel]: Species.SilvallySteel,
  [Types.Fire]: Species.SilvallyFire,
  [Types.Water]: Species.SilvallyWater,
  [Types.Grass]: Species.SilvallyGrass,
  [Types.Electric]: Species.SilvallyElectric,
  [Types.Psychic]: Species.SilvallyPsychic,
  [Types.Ice]: Species.SilvallyIce,
  [Types.Dragon]: Species.SilvallyDragon,
  [Types.Dark]: Species.SilvallyDark,
  [Types.Fairy]: Species.SilvallyFairy,
};

/** The Memory rows, derived the way the Plate rows are */
const SILVALLY_MEMORIES: [Items, Species[]][] = [...MEMORIES].flatMap(([memory, type]) => {
  const shape = SILVALLY_TYPE_FORMS[type];

  return shape == null ? [] : [[memory, [shape]] as [Items, Species[]]];
});

export const FORM_ITEMS = new Map<Items, Species[]>([
  // One shape each rather than a set, so an orb is a switch a player
  // sets rather than a roll
  [Items.AdamantOrb, [Species.DialgaOrigin]],
  [Items.LustrousOrb, [Species.PalkiaOrigin]],
  [Items.GriseousOrb, [Species.GiratinaOrigin]],
  [Items.Gracidea, [Species.ShayminSky]],
  [Items.PrisonBottle, [Species.HoopaUnbound]],
  // One mirror for the three genies: each holder takes its own Therian
  // shape, so it is still a switch rather than a roll
  [Items.RevealGlass, [Species.TornadusTherian, Species.ThundurusTherian, Species.LandorusTherian]],
  // Primal Reversion is an Origin forme's rule rather than a Mega's:
  // every holder takes the shape, with no limit to a team
  [Items.BlueOrb, [Species.KyogrePrimal]],
  [Items.RedOrb, [Species.GroudonPrimal]],
  // Galar's heroes take up their relics and fight crowned
  [Items.RustedSword, [Species.ZacianCrowned]],
  [Items.RustedShield, [Species.ZamazentaCrowned]],
  // The seventeen Plates, each of which is already a type booster.
  // Holding one paints an Arceus the type it lifts, which is what the
  // mainline calls Multitype: there is no battle code behind it, only
  // the shape the stone puts it in
  ...ARCEUS_PLATES,
  // The four Drives, each of which already sets a Techno Blast's
  // type. Holding one repaints the machine round the cannon, which
  // is all the mainline means by a Genesect form
  ...GENESECT_DRIVES,
  // The seventeen Memories, each of which already sets a Multi-Attack's
  // type. Holding one sets a Silvally's own, which RKS System answers for
  ...SILVALLY_MEMORIES,
]);

/**
 * The shapes this item rearranges its holder into, or an empty list
 * for everything else in the bag
 */
export function getItemForms(item: Items): Species[] {
  return FORM_ITEMS.get(item) ?? [];
}
