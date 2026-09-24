import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import HIDEOUT_TERRAIN from '../src/data/overworld/dungeon-terrain.ts';

/**
 * The hideout's floor and walls, added to the terrain sheet.
 *
 * Nothing on the source rip is a hideout, so two of the overworld's own
 * pieces are recoloured to read as one: the dark cobbles for the floor,
 * and the ring cliff for the rock walls. Both go slate, which is the pick
 * made off `tileset-review/dungeon/picks.png`. They are laid into the
 * free end of the sheet's last row and filed under a biome number no
 * country uses, so a hideout's floor asks for them the way a country
 * asks for its own. Running it twice changes nothing
 */

const SHEET = 'public/sprites/terrain/biome-tiles';

/** Hue, saturation and how dark: the slate the picks settled on */
const SLATE: [number, number, number] = [225, 0.1, 0.55];

/** Where the free end of the last row starts */
const FREE: [number, number] = [480, 816];

interface Piece {
  from: string;
  tone: [number, number, number];
  fill: number[];
  art: number[] | null;
  corner: number[] | null;
  skirt: number[] | null;
  cornerSkirt: number[] | null;
}

interface Pack {
  pieces: Piece[];
  terrains: { biome: number; role: string; name: string; piece: number }[];
}

/** Every pixel moved to one hue and saturation, lightness kept in order */
function recolour(data: Buffer, [hue, sat, dark]: [number, number, number]): void {
  for (let at = 0; at < data.length; at += 4) {
    const r = data[at] / 255;
    const g = data[at + 1] / 255;
    const b = data[at + 2] / 255;
    const l = ((Math.max(r, g, b) + Math.min(r, g, b)) / 2) * dark;
    const c = (1 - Math.abs(2 * l - 1)) * sat;
    const h = hue / 60;
    const x = c * (1 - Math.abs((h % 2) - 1));
    // The six sextants of the hue wheel, in order
    const sextants: [number, number, number][] = [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ];
    const [r1, g1, b1] = sextants[Math.min(5, Math.floor(h))];
    const m = l - c / 2;

    data[at] = Math.round((r1 + m) * 255);
    data[at + 1] = Math.round((g1 + m) * 255);
    data[at + 2] = Math.round((b1 + m) * 255);
  }
}

// The sheet's own description, written by this repository
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const pack = JSON.parse(readFileSync(`${SHEET}.json`, 'utf8')) as Pack;
const base = sharp(`${SHEET}.png`).ensureAlpha();
const { data: pixels, info } = await base.raw().toBuffer({ resolveWithObject: true });

/** Copy a rectangle of the sheet to `to`, recoloured */
function carry(from: number[], to: [number, number]): number[] {
  const [x, y, width, height] = from;
  const block = Buffer.alloc(width * height * 4);

  for (let row = 0; row < height; row++) {
    pixels.copy(
      block,
      row * width * 4,
      ((y + row) * info.width + x) * 4,
      ((y + row) * info.width + x + width) * 4,
    );
  }
  recolour(block, SLATE);
  for (let row = 0; row < height; row++) {
    block.copy(
      pixels,
      ((to[1] + row) * info.width + to[0]) * 4,
      row * width * 4,
      (row + 1) * width * 4,
    );
  }
  return [to[0], to[1], width, height];
}

/** A piece recoloured into the free row, with its tone read off the new fill */
function slate(name: string, at: [number, number]): number {
  const source = pack.pieces.find((piece) => piece.from === name);

  if (source?.art == null || source.corner == null) {
    throw new Error(`no ${name} to recolour`);
  }

  const art = carry(source.art, at);
  const corner = carry(source.corner, [at[0] + 48, at[1]]);
  const fill = carry(source.fill, [at[0] + 80, at[1]]);
  const piece: Piece = {
    from: `${name}-slate`,
    tone: [SLATE[0], SLATE[1], 0.5 * SLATE[2]],
    fill,
    art,
    corner,
    skirt: null,
    cornerSkirt: null,
  };
  const held = pack.pieces.findIndex((one) => one.from === piece.from);

  if (held >= 0) {
    pack.pieces[held] = piece;
    return held;
  }
  pack.pieces.push(piece);
  return pack.pieces.length - 1;
}

const floor = slate('dark-cobbles', FREE);
const wall = slate('ring-cliff', [FREE[0] + 96, FREE[1]]);
// Water no hideout floor has yet, borrowed so the role is never empty
const water = pack.terrains.find((one) => one.biome === 28 && one.role === 'water')?.piece ?? floor;

pack.terrains = pack.terrains.filter((one) => one.biome !== HIDEOUT_TERRAIN);
for (const [role, piece] of [
  ['ground', floor],
  ['blend', floor],
  ['face', wall],
  ['wall', wall],
  ['water', water],
] as const) {
  pack.terrains.push({ biome: HIDEOUT_TERRAIN, role, name: `hideout-${role}`, piece });
}

await sharp(pixels, { raw: info }).png().toFile(`${SHEET}.png`);
writeFileSync(`${SHEET}.json`, `${JSON.stringify(pack, null, 2)}\n`);
console.log('hideout terrain', { floor, wall, water });
