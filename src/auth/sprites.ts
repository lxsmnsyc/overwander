import { action } from '@solidjs/router';
import type { ProcessResult, UploadedImage } from '../server/sprites/extras';
import processExtras from '../server/sprites/extras';
import type { Drawing } from '../server/sprites/files';
import type { PokengineGrid, PokengineResult } from '../server/sprites/pokengine';
import processPokengine, { parseOrder } from '../server/sprites/pokengine';
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

export type { Drawing, PokengineGrid, PokengineResult, ProcessResult, UploadedImage };

/** Only a development build can process sprites at all. */
export function canProcessSprites(): boolean {
  return import.meta.env.DEV;
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

/** Loose images into one sheet under `public/sprites/extras`. */
export const packExtras = action(async (form: FormData): Promise<ProcessResult> => {
  'use server';
  await requireAdmin(String(form.get('token') ?? ''));

  // Every file under the one name, which is what a `multiple` picker
  // posts: `get` would take the first and quietly drop the rest
  const pending: Promise<UploadedImage>[] = [];

  for (const value of form.getAll('images')) {
    const file = asFile(value, 'image');

    pending.push(
      file.arrayBuffer().then((buffer) => ({ name: file.name, bytes: new Uint8Array(buffer) })),
    );
  }

  return processExtras(
    await Promise.all(pending),
    // A sheet of loose images is about nothing in particular, so it is
    // named rather than filed under a species
    { name: String(form.get('name') ?? ''), compact: flag(form, 'compact') },
  );
}, 'sprites/extras');
