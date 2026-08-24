import { action } from '@solidjs/router';
import type { ProcessResult, UploadedImage } from '../server/sprites/extras';
import processExtras from '../server/sprites/extras';
import type { Drawing } from '../server/sprites/files';
import type { OverworldGrid, OverworldResult } from '../server/sprites/overworld';
import processOverworld from '../server/sprites/overworld';
import type { Coats, PmdResult } from '../server/sprites/pmd';
import processPmd from '../server/sprites/pmd';
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
  Coats,
  Drawing,
  OverworldGrid,
  OverworldResult,
  DrawnRole,
  PmdResult,
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

/** A number typed into the form, refused rather than rounded to nothing. */
function count(form: FormData, name: string): number {
  const value = Number.parseInt(String(form.get(name) ?? ''), 10);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('The sheet needs a species number');
  }
  return value;
}

/** What both halves ask for: which pokemon, and how it is packed. */
function naming(form: FormData): { species: number; compact: boolean } {
  return { species: count(form, 'species'), compact: flag(form, 'compact') };
}

function asFile(value: FormDataEntryValue | null, what: string): File {
  if (typeof value === 'string' || value == null) {
    throw new Error(`No ${what} to process`);
  }
  return value;
}

/**
 * One field's file as bytes, or nothing where the picker was left
 * alone. An empty picker still posts a file — one of no name and no
 * length — so emptiness is read off the file rather than off the field
 */
async function fileBytes(form: FormData, name: string): Promise<Uint8Array | undefined> {
  const value = form.get(name);

  if (typeof value === 'string' || value == null || value.size === 0) {
    return undefined;
  }
  return new Uint8Array(await value.arrayBuffer());
}

/**
 * A pokemon's coats into its sheets under `public/sprites/pokemon`.
 *
 * One archive a coat, since that is how the collab site hands them
 * out. Only the plain one has to be there: a species with no female
 * form has two, and the four are packed to one layout because the
 * game keeps one description for all of them
 */
export const packPmd = action(async (form: FormData): Promise<PmdResult> => {
  'use server';
  await requireAdmin(String(form.get('token') ?? ''));

  const coats: Coats = {
    regular: await fileBytes(form, 'regular'),
    shiny: await fileBytes(form, 'shiny'),
    female: await fileBytes(form, 'female'),
    shinyFemale: await fileBytes(form, 'shinyFemale'),
  };

  return processPmd(coats, {
    ...naming(form),
    anims: String(form.get('anims') ?? '').split(/\s+/),
  });
}, 'sprites/pmd');

/**
 * A number typed into the form, where a sensible one has been offered
 * and the field is the caller's to change
 */
function grid(form: FormData, name: string, fallback: number): number {
  const value = Number.parseInt(String(form.get(name) ?? ''), 10);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * A character sheet into its own folder under
 * `public/sprites/overworld`.
 *
 * One image rather than a set: a charset is already a sheet, and what
 * this does to it is cut the margin off every cell without moving any
 * of them off the grid
 */
export const packOverworld = action(async (form: FormData): Promise<OverworldResult> => {
  'use server';
  await requireAdmin(String(form.get('token') ?? ''));

  const picked = asFile(form.get('sheet'), 'sheet');

  return processOverworld(new Uint8Array(await picked.arrayBuffer()), {
    name: String(form.get('name') ?? ''),
    columns: grid(form, 'columns', 4),
    rows: grid(form, 'rows', 4),
    compact: flag(form, 'compact'),
  });
}, 'sprites/overworld');

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
