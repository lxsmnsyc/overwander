import type BasicSprite from '../../../canvas/sprites/basic-sprite';
import loadBasicSprite, { UI_SPRITE_ROOT } from '../../../canvas/sprites/basic-sprites';
import { type SpriteQuad, cornersOf } from '../../../canvas/sprites/placement';
import type { Items } from '../../../data/ids/items';
import type { Species } from '../../../data/ids/species';
import { getItemData } from '../../../data/items';
import { FORM_ITEMS } from '../../../data/items/form-items';
import { getMegaStone } from '../../../data/items/mega-stones';
import { getFusionItem } from '../../../data/species/fusion';
import { isMegaSpecies } from '../../../data/species/megas';
import { getShadowlessSpecies } from '../../../data/species/true-shadow';
import { getZenithBase, getZenithShape } from '../../../data/species/zeniths';
import { isStandIn } from '../../../canvas/sprites/species-sprites';
import type { SlotBatch } from './draw';

/**
 * The stone a Mega is wearing, the shard a Zenith is, or the item a held
 * shape is (an orb, a Plate, a Drive, the Reveal Glass), floating over it.
 * Not every one of those shapes has art of its own, and no Zenith does,
 * so this is what tells a watcher the shape has changed
 */

/** What a Mega with no stone wears instead: Rayquaza's Key Stone */
const KEY_STONE = { sheet: 'key', name: 'key-stone-gen6' };

/** Which item holds each shape a form item puts its holder in */
const SHAPE_ITEMS = (() => {
  const items = new Map<Species, Items>();

  for (const [item, forms] of FORM_ITEMS) {
    for (const form of forms) {
      items.set(form, item);
    }
  }
  return items;
})();

/** How far above the cast plate it floats */
const MARK_RISE = 22;

/** How far it bobs, and how long one bob and one pulse of the glow take */
const MARK_BOB = 2;
const MARK_BOB_PACE = 1400;
const MARK_GLOW_PACE = 900;

/** How much bigger than the stone its glow reaches, per pass */
const GLOW_SCALES = [1.35, 1.7];

const sheets = new Map<string, BasicSprite | null>();

/** A sheet once it has arrived, asked for the first time it is wanted */
function sheetOf(name: string): BasicSprite | null {
  if (!sheets.has(name)) {
    sheets.set(name, null);
    loadBasicSprite(`${UI_SPRITE_ROOT}/items/${name}`).then((sprite) => {
      sheets.set(name, sprite);
    });
  }
  return sheets.get(name) ?? null;
}

/** The shard that puts a pokemon in this Zenith, or null for anything that is not one */
function zenithShardOf(species: Species): Items | null {
  const base = getZenithBase(species);

  return base == null ? null : (getZenithShape(base)?.shard ?? null);
}

function iconOf(worn: Species): { sheet: string; name: string } | null {
  // A true shadow's shape wears what its counterpart's does
  const species = getShadowlessSpecies(worn) ?? worn;
  // A fusion drawn as its partner wears the item that joined them, until
  // the shape is drawn
  const item =
    SHAPE_ITEMS.get(species) ??
    (isMegaSpecies(species) ? getMegaStone(species) : null) ??
    zenithShardOf(species) ??
    (isStandIn(species) ? getFusionItem(species) : null);

  if (item != null) {
    // An item's icon is its sheet and its name, cut at the last slash
    // since a shard's sheet sits in a folder of its own
    const icon = getItemData(item).icon;
    const cut = icon.lastIndexOf('/');

    return { sheet: icon.slice(0, cut), name: icon.slice(cut + 1) };
  }
  return isMegaSpecies(species) ? KEY_STONE : null;
}

/** Whether this shape floats a mark over it, so another mark can sit above it */
export function wearsFormMark(species: Species): boolean {
  return iconOf(species) != null;
}

function paint(context: CanvasRenderingContext2D, quad: SpriteQuad, alpha: number): void {
  context.globalAlpha = alpha;
  context.drawImage(
    quad.sheet,
    quad.source.x,
    quad.source.y,
    quad.source.width,
    quad.source.height,
    quad.left,
    quad.top,
    quad.width,
    quad.height,
  );
}

/**
 * The mark over one changed shape, centred on `x` with the plate's line at `y`.
 * The glow is the stone screened over itself at a larger size, so it
 * takes the stone's own colour
 */
export default function drawFormMark(
  context: CanvasRenderingContext2D,
  species: Species,
  x: number,
  y: number,
  clock: number,
  alpha: number,
  onto?: SlotBatch,
): void {
  const icon = iconOf(species);
  const sheet = icon == null ? null : sheetOf(icon.sheet);

  if (icon == null || sheet == null) {
    return;
  }

  const at = y - MARK_RISE + Math.sin((clock / MARK_BOB_PACE) * Math.PI * 2) * MARK_BOB;
  const pulse = 0.5 + 0.5 * Math.sin((clock / MARK_GLOW_PACE) * Math.PI * 2);
  const body = sheet.quadOf(icon.name, x, at);

  if (body == null) {
    return;
  }

  const previous = context.globalCompositeOperation;
  const was = context.globalAlpha;

  for (const scale of GLOW_SCALES) {
    const halo = sheet.quadOf(icon.name, x, at, { scale });
    const strength = alpha * (0.25 + 0.35 * pulse) * (GLOW_SCALES[0] / scale);

    if (halo == null) {
      continue;
    }
    if (onto == null) {
      context.globalCompositeOperation = 'screen';
      paint(context, halo, strength);
      context.globalCompositeOperation = previous;
    } else {
      onto.batch.quad(
        halo.sheet,
        halo.source,
        cornersOf(halo),
        strength,
        undefined,
        'smooth',
        'screen',
      );
    }
  }

  if (onto == null) {
    paint(context, body, alpha);
    context.globalAlpha = was;
  } else {
    onto.batch.quad(body.sheet, body.source, cornersOf(body), alpha);
  }
}
