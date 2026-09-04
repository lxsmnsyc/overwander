import { action } from '@solidjs/router';
import type { ProcessResult, UploadedImage } from '../server/sprites/extras';
import processExtras from '../server/sprites/extras';
import type { Drawing } from '../server/sprites/files';
import type { PokengineGrid, PokengineResult } from '../server/sprites/pokengine';
import processPokengine, { parseOrder } from '../server/sprites/pokengine';
import type { GraftResult } from '../server/sprites/graft';
import graftWall, { parseBiomes } from '../server/sprites/graft';
import type { RecolorResult } from '../server/sprites/recolor';
import recolorTileset, { parseSwaps } from '../server/sprites/recolor';
import type { TerrainBlock, TilesetResult, TilesetSheet } from '../server/sprites/tileset';
import processTileset, { parseSpeeds, parseTerrains } from '../server/sprites/tileset';
import type { DrawnRole } from '../data/constants/tileset-rip';
import { DRAWN_ROLES } from '../data/constants/tileset-rip';
import { requireAdmin } from '../server/roles';

/**
 * What the sprite processor asks the server to do.
 *
 * Each takes the **form** rather than arguments. A file is what these
 * are for, and a file belongs in a multipart body: reading it into a
 * typed array on the client only to serialise it through a function
 * call is a copy of the whole archive for nothing. Everything else the
 * call needs — the caller's token included — rides along as a named
 * input in the same form.
 *
 * All of them write into `public/`, so all of them refuse anywhere but
 * a development build. That is checked on the server, which is the only
 * side of the pair a deployed build runs.
 */

export type {
  Drawing,
  PokengineGrid,
  PokengineResult,
  DrawnRole,
  ProcessResult,
  RecolorResult,
  TerrainBlock,
  TilesetResult,
  TilesetSheet,
  UploadedImage,
};

/** Only a development build can process sprites at all. */
export function canProcessSprites(): boolean {
  return import.meta.env.DEV;
}

/** Which terrain the form named for each role, where it named one. */
function drawnFrom(form: FormData): Partial<Record<DrawnRole, string>> {
  const draws: Partial<Record<DrawnRole, string>> = {};

  for (const role of DRAWN_ROLES) {
    const name = String(form.get(`draws-${role}`) ?? '').trim();

    if (name.length > 0) {
      draws[role] = name;
    }
  }
  return draws;
}

/** A checkbox that was never ticked is not in the form at all. */
function flag(form: FormData, name: string): boolean {
  return form.get(name) === 'on';
}

function asFile(value: FormDataEntryValue | null, what: string): File {
  if (typeof value === 'string' || value == null) {
    throw new Error(`No ${what} to process`);
  }
  return value;
}

/**
 * A Pokengine community charset into its own folder under
 * `public/sprites/overworld`.
 *
 * The format is fixed — three walk frames across, four facings down —
 * so what is asked for is the name, the sheet's own row order, whether
 * to cut the margin off every cell, and the artist's credit, which the
 * pack writes into the credits page beside the sheet
 */
export const packPokengine = action(async (form: FormData): Promise<PokengineResult> => {
  'use server';
  await requireAdmin(String(form.get('token') ?? ''));

  const picked = asFile(form.get('sheet'), 'sheet');

  return processPokengine(new Uint8Array(await picked.arrayBuffer()), {
    name: String(form.get('name') ?? ''),
    order: parseOrder(String(form.get('order') ?? 'down up right left')),
    compact: flag(form, 'compact'),
    credit: String(form.get('credit') ?? ''),
  });
}, 'sprites/pokengine');

/**
 * A dungeon tileset rip into `public/sprites/biome/{biome}`.
 *
 * The sheet says where its own table, legend and palettes are, so the
 * only things asked for here are the ones written on it in English:
 * which column is which terrain, and how many drawings of each it
 * holds
 */
export const packBiome = action(async (form: FormData): Promise<TilesetResult> => {
  'use server';
  await requireAdmin(String(form.get('token') ?? ''));

  const picked = asFile(form.get('sheet'), 'sheet');

  return processTileset(new Uint8Array(await picked.arrayBuffer()), {
    biome: Number.parseInt(String(form.get('biome') ?? ''), 10),
    terrains: parseTerrains(String(form.get('terrains') ?? '')),
    speeds: parseSpeeds(String(form.get('speeds') ?? '')),
    // Blank means the first terrain of that role, which is what every
    // sheet packed before there was a choice took
    draws: drawnFrom(form),
  });
}, 'sprites/biome');

/**
 * A packed biome, palette-swapped into another biome's folder. No
 * file rides along: the source is what an earlier pack wrote, and the
 * map is typed in — run it empty first to be told the sheet's colours
 */
export const recolorBiome = action(async (form: FormData): Promise<RecolorResult> => {
  'use server';
  await requireAdmin(String(form.get('token') ?? ''));

  return recolorTileset({
    source: Number.parseInt(String(form.get('source') ?? ''), 10),
    biome: Number.parseInt(String(form.get('biome') ?? ''), 10),
    swaps: parseSwaps(String(form.get('swaps') ?? '')),
  });
}, 'sprites/recolor');

/**
 * One packed biome's wall written over another's. No file rides along:
 * both sheets are what earlier packs wrote
 */
export const graftBiomeWall = action(async (form: FormData): Promise<GraftResult> => {
  'use server';
  await requireAdmin(String(form.get('token') ?? ''));

  return graftWall({
    from: Number.parseInt(String(form.get('from') ?? ''), 10),
    biomes: parseBiomes(String(form.get('biomes') ?? '')),
  });
}, 'sprites/graft');

/** Loose images into one sheet under `public/sprites/extras`. */
export const packExtras = action(async (form: FormData): Promise<ProcessResult> => {
  'use server';
  await requireAdmin(String(form.get('token') ?? ''));

  // Every file under the one name, which is what a `multiple` picker
  // posts: `get` would take the first and quietly drop the rest
  const picked = form.getAll('images').map((value) => asFile(value, 'image'));

  return processExtras(
    await Promise.all(
      picked.map(async (file) => ({
        name: file.name,
        bytes: new Uint8Array(await file.arrayBuffer()),
      })),
    ),
    // A sheet of loose images is about nothing in particular, so it is
    // named rather than filed under a species
    { name: String(form.get('name') ?? ''), compact: flag(form, 'compact') },
  );
}, 'sprites/extras');
