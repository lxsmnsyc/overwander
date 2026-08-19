import { action } from '@solidjs/router';
import type { ProcessResult, UploadedImage } from '../server/sprites/extras';
import processExtras from '../server/sprites/extras';
import type { Coats, PmdResult } from '../server/sprites/pmd';
import processPmd from '../server/sprites/pmd';
import { requireAdmin } from '../server/roles';

/**
 * What the sprite processor asks the server to do.
 *
 * Both take the **form** rather than arguments. A file is what these
 * are for, and a file belongs in a multipart body: reading it into a
 * typed array on the client only to serialise it through a function
 * call is a copy of the whole archive for nothing. Everything else the
 * call needs — the caller's token included — rides along as a named
 * input in the same form.
 *
 * Both write into `public/`, so both refuse anywhere but a development
 * build. That is checked on the server, which is the only side of the
 * pair a deployed build runs.
 */

export type { Coats, ProcessResult, PmdResult, UploadedImage };

/** Only a development build can process sprites at all. */
export function canProcessSprites(): boolean {
  return import.meta.env.DEV;
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
    { ...naming(form), female: flag(form, 'female'), shiny: false },
  );
}, 'sprites/extras');
