import 'server-only';
import type { Drawing, SheetName } from './files';
import { extraDestination, writeSheet } from './files';
import pack from './packing';
import type { Raster } from './raster';
import { blank, blit, decode, encode } from './raster';
import computeTrim from './trim';

/**
 * Loose images into one sheet.
 *
 * The plain half of the packer tool: whatever was picked goes in, each
 * image is one picture, and the description says where each of them
 * landed. Nothing here knows about animations — that is the PMD side,
 * which has `AnimData.xml` to tell it what a frame is.
 */

/** One file as it arrives from the page. */
export interface UploadedImage {
  name: string;
  bytes: Uint8Array;
}

export interface ExtraOptions extends SheetName {
  /** Whether each image is cropped to its own content before packing. */
  compact: boolean;
}

interface Entry {
  name: string;
  raster: Raster;
  /** Where the kept part starts inside the source image. */
  trim: [x: number, y: number];
  w: number;
  h: number;
  sourceWidth: number;
  sourceHeight: number;
}

/** One image's place in the finished sheet. */
export interface SheetImage {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  trim: [x: number, y: number];
}

export interface ExtraSheet {
  compact: boolean;
  width: number;
  height: number;
  images: SheetImage[];
}

/** What the page is told once the files are on disk. */
export interface ProcessResult {
  written: string[];
  width: number;
  height: number;
  images: number;
  /** The sheet itself: what it cost, and what it cost before */
  drawing: Drawing;
}

async function entryFor(image: UploadedImage, compact: boolean): Promise<Entry> {
  const raster = await decode(image.bytes);
  const trim = compact
    ? computeTrim(raster, raster.width, raster.height, 1, 1)
    : { x: 0, y: 0, width: raster.width, height: raster.height };

  return {
    // Named by its file rather than by its position, since the name is
    // what the game asks for the picture by
    name: image.name.replace(/\.[^.]+$/, ''),
    raster,
    trim: [trim.x, trim.y],
    w: trim.width,
    h: trim.height,
    sourceWidth: raster.width,
    sourceHeight: raster.height,
  };
}

export default async function processExtras(
  images: UploadedImage[],
  options: ExtraOptions,
): Promise<ProcessResult> {
  if (images.length === 0) {
    throw new Error('No images to pack');
  }
  const entries = await Promise.all(images.map(async (image) => entryFor(image, options.compact)));
  const layout = pack(entries);
  const sheet = blank(layout.width, layout.height);
  const placed: SheetImage[] = [];

  for (const { box, x, y } of layout.placed) {
    blit(
      sheet,
      box.raster,
      { x: box.trim[0], y: box.trim[1], width: box.w, height: box.h },
      { x, y },
    );
    placed.push({
      name: box.name,
      x,
      y,
      width: box.w,
      height: box.h,
      sourceWidth: box.sourceWidth,
      sourceHeight: box.sourceHeight,
      trim: box.trim,
    });
  }

  const data: ExtraSheet = {
    compact: options.compact,
    width: layout.width,
    height: layout.height,
    // By name, so the file does not change because the picker handed
    // the files over in a different order
    images: placed.sort((one, two) => one.name.localeCompare(two.name)),
  };

  const drawn = encode(sheet);
  const written = await writeSheet(
    extraDestination(options),
    drawn.bytes,
    JSON.stringify(data, null, 2),
  );

  return {
    written: written.map((file) => file.path),
    width: data.width,
    height: data.height,
    images: data.images.length,
    drawing: { ...written[0], as: drawn.as, bytes: drawn.bytes.length, plain: drawn.plain },
  };
}
