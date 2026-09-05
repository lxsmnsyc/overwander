import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import decode from '../src/server/sprites/png.ts';

/**
 * What colour every berry is, read off its own icon.
 *
 * The board calls a berry patch's cell out in the colour of what is
 * growing in it, and the one honest source for that colour is the
 * picture the player already knows the berry by. Sampling beats a
 * hand-written table twice over: nobody has to decide what "Kelpsy
 * green" is, and a berry whose icon is redrawn is recoloured by
 * running this again.
 *
 * Every solid pixel of an icon is bucketed by hue, and the biggest
 * bucket wins. The one thing that needs a thumb on the scale is the
 * leaf: most berries are drawn hanging off a green sprig, and on the
 * small ones the sprig covers more pixels than the fruit, so a green
 * bucket has to be much the larger to be believed. Berries that are
 * themselves green still come out green, since then there is nothing
 * else in the icon to beat.
 *
 * Writes the table into
 * [`src/data/overworld/berry-plant.ts`](../src/data/overworld/berry-plant.ts)
 * between its two markers.
 */

const ATLAS = join('public', 'sprites', 'ui', 'items', 'berries');
const TARGET = join('src', 'data', 'overworld', 'berry-plant.ts');
const OPEN = 'export const BERRY_COLORS: Record<string, string> = {';
const CLOSE = '};';

/** Where one icon sits on the packed sheet */
interface Frame {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Hue in degrees, saturation and lightness in 0..1 */
function toHsl(r: number, g: number, b: number): [number, number, number] {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const high = Math.max(red, green, blue);
  const low = Math.min(red, green, blue);
  const light = (high + low) / 2;
  const span = high - low;

  if (span === 0) {
    return [0, 0, light];
  }
  const saturation = span / (1 - Math.abs(2 * light - 1));
  let hue: number;

  if (high === red) {
    hue = ((green - blue) / span + 6) % 6;
  } else if (high === green) {
    hue = (blue - red) / span + 2;
  } else {
    hue = (red - green) / span + 4;
  }
  return [hue * 60, saturation, light];
}

/** How much a hue's bucket is believed: a leaf is worth less than a fruit */
function trust(hue: number): number {
  return hue >= 80 && hue <= 150 ? 0.3 : 1;
}

function main(): void {
  const meta = JSON.parse(readFileSync(join(ATLAS, 'data.json'), 'utf8')) as { images: Frame[] };
  const sheet = decode(readFileSync(join(ATLAS, 'image.png')));
  const rows: string[] = [];

  for (const frame of [...meta.images].sort((one, two) => one.name.localeCompare(two.name))) {
    const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();

    for (let y = frame.y; y < frame.y + frame.height; y++) {
      for (let x = frame.x; x < frame.x + frame.width; x++) {
        const at = (y * sheet.width + x) * 4;

        if (sheet.rgba[at + 3] < 200) {
          continue;
        }
        const r = sheet.rgba[at];
        const g = sheet.rgba[at + 1];
        const b = sheet.rgba[at + 2];
        const [hue, saturation, light] = toHsl(r, g, b);

        // The outline, the highlight and the shading say nothing about
        // what colour the berry is
        if (light < 0.15 || light > 0.92 || saturation < 0.25) {
          continue;
        }
        const key = Math.round(hue / 20) * 20;
        const held = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };

        held.count += 1;
        held.r += r;
        held.g += g;
        held.b += b;
        buckets.set(key, held);
      }
    }

    const [, best] =
      [...buckets.entries()].sort(
        (one, two) => two[1].count * trust(two[0]) - one[1].count * trust(one[0]),
      )[0] ?? [];

    if (best == null) {
      continue;
    }
    const hex = [best.r, best.g, best.b]
      .map((total) =>
        Math.round(total / best.count)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');

    rows.push(`  '${frame.name.replace(/\.png$/, '')}': '#${hex}',`);
  }

  const source = readFileSync(TARGET, 'utf8');
  const opens = source.indexOf(OPEN);
  const closes = source.indexOf(`\n${CLOSE}`, opens);

  if (opens < 0 || closes < 0) {
    throw new Error('no BERRY_COLORS table to write into');
  }
  writeFileSync(
    TARGET,
    `${source.slice(0, opens + OPEN.length)}\n${rows.join('\n')}${source.slice(closes)}`,
  );
  console.log(`${rows.length} berries`);
}

main();
