import Abilities from '../../../data/ids/abilities';
import { ItemTypes, Items } from '../../../data/ids/items';
import { getItemData } from '../../../data/items';
import type PaintedVisual from '../moves/__painted';
import { CUE_KINDS, type CueKind } from './kinds';
import { played } from './shapes';

/** Which cue each ability and each item is drawn as */
const ABILITY_CUES: Partial<Record<Abilities, CueKind>> = {
  // What the toucher catches
  [Abilities.Static]: 'Spark',
  [Abilities.LightningRod]: 'Spark',
  [Abilities.FlashFire]: 'Spark',
  [Abilities.FlameBody]: 'Ail',
  [Abilities.PoisonPoint]: 'Ail',
  [Abilities.PoisonTouch]: 'Ail',
  [Abilities.LiquidOoze]: 'Ail',
  [Abilities.Stench]: 'Ail',
  [Abilities.EffectSpore]: 'Ail',
  [Abilities.CuteCharm]: 'Ail',
  [Abilities.RoughSkin]: 'Barb',

  // Something rose
  [Abilities.AngerPoint]: 'Rise',
  [Abilities.Moxie]: 'Rise',
  [Abilities.Justified]: 'Rise',
  [Abilities.Defiant]: 'Rise',
  [Abilities.Competitive]: 'Rise',
  [Abilities.Download]: 'Rise',

  // Something got faster
  [Abilities.Rattled]: 'Rush',
  [Abilities.Steadfast]: 'Rush',
  [Abilities.Unburden]: 'Rush',
  [Abilities.WeakArmor]: 'Rush',
  [Abilities.RunAway]: 'Rush',
  [Abilities.SwiftSwim]: 'Rush',
  [Abilities.Chlorophyll]: 'Rush',

  // Something mended
  [Abilities.Regenerator]: 'Mend',
  [Abilities.RainDish]: 'Mend',
  [Abilities.IceBody]: 'Mend',
  [Abilities.DrySkin]: 'Mend',
  [Abilities.ShedSkin]: 'Mend',
  [Abilities.NaturalCure]: 'Mend',
  [Abilities.Healer]: 'Mend',

  // Something was noticed before it happened
  [Abilities.Anticipation]: 'Notice',
  [Abilities.Forewarn]: 'Notice',
  [Abilities.Frisk]: 'Notice',
  [Abilities.Trace]: 'Notice',
  [Abilities.Pickup]: 'Notice',
  [Abilities.Harvest]: 'Notice',

  // Something weighs on the other side of the field
  [Abilities.Pressure]: 'Menace',
  [Abilities.Unnerve]: 'Menace',
  [Abilities.NeutralizingGas]: 'Menace',
  [Abilities.MoldBreaker]: 'Menace',
  [Abilities.Intimidate]: 'Menace',
  [Abilities.CursedBody]: 'Menace',
  [Abilities.BadDreams]: 'Menace',
  [Abilities.Boss]: 'Menace',
};

export default function abilityCueFor(ability: Abilities): PaintedVisual {
  return played(CUE_KINDS[ABILITY_CUES[ability] ?? 'Pulse']);
}

/**
 * The gear whose trigger the item's own kind cannot describe. A berry
 * is eaten whatever it does, but a held thing does one of several
 * things and the shape should say which
 */
const ITEM_CUES: Partial<Record<Items, CueKind>> = {
  // It took the hit so the holder did not
  [Items.FocusBand]: 'Guard',
  [Items.FocusSash]: 'Guard',
  [Items.AirBalloon]: 'Guard',
  [Items.EjectButton]: 'Guard',
  // It hurt whoever touched it
  [Items.RockyHelmet]: 'Barb',
  [Items.StickyBarb]: 'Barb',
  [Items.DestinyKnot]: 'Barb',
  [Items.RingTarget]: 'Barb',
  // It got there first
  [Items.QuickClaw]: 'Rush',
  [Items.ChoiceScarf]: 'Rush',
};

/**
 * What an item looks like when it goes off.
 *
 * Held items are the quietest thing on the field after abilities — a
 * berry is eaten and a number comes out different — so every trigger
 * draws, and what it draws comes off the item's own kind when nothing
 * more specific is known
 */
export function itemCueFor(item: Items): PaintedVisual {
  const named = ITEM_CUES[item];

  if (named != null) {
    return played(CUE_KINDS[named]);
  }
  try {
    // Eaten rather than worn: berries are the one kind whose trigger
    // is always the same event
    return played(CUE_KINDS[getItemData(item).type === ItemTypes.Berry ? 'Berry' : 'Pulse']);
  } catch {
    // An item with no entry is still an item that fired
    return played(CUE_KINDS.Pulse);
  }
}

export { statusCueFor, statusTriggerFor } from './status';
