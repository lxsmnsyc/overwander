import type BasicSprite from '../../../canvas/basic-sprite';
import loadBasicSprite, { UI_SPRITE_ROOT } from '../../../canvas/basic-sprites';
import { type SpriteQuad, cornersOf } from '../../../canvas/placement';
import type { Species } from '../../../data/ids/species';
import { MEGA_STONES, getMegaStone } from '../../../data/items/mega-stones';
import { isMegaSpecies } from '../../../data/species/megas';
import type { SlotBatch } from './draw';

/**
 * The stone a Mega is wearing, floating over it. Not every Mega has
 * art of its own, so this is what tells a watcher it has Mega Evolved
 */

/** What a Mega with no stone wears instead: Rayquaza's Key Stone */
const KEY_STONE = { sheet: 'key', name: 'key-stone-gen6' };

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

function iconOf(species: Species): { sheet: string; name: string } | null {
  if (!isMegaSpecies(species)) {
    return null;
  }
  const stone = getMegaStone(species);
  const held = stone == null ? null : MEGA_STONES.get(stone);

  return held == null ? KEY_STONE : { sheet: 'mega-stones', name: held.icon };
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
 * The mark over one Mega, centred on `x` with the plate's line at `y`.
 * The glow is the stone screened over itself at a larger size, so it
 * takes the stone's own colour
 */
export default function drawMegaMark(
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
