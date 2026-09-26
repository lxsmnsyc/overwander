import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * A digest per sound effect, so a sound can be cached forever and a
 * re-rendered one is still fetched.
 *
 * The same idea as `sprite-stamps.ts`, but written as a module rather
 * than a list fetched at runtime: the files are served from the sprite
 * host, but the stamps ride in the app's bundle, so a sound is never
 * held up waiting on a list.
 *
 * It runs as part of the build, so what ships is always a digest of
 * what shipped beside it. The committed copy is for `pnpm dev`.
 */

/** Where the sounds are, relative to the working directory */
const ROOT = 'public/sounds/effects';

const OUTPUT = 'src/components/app/sound-stamps.ts';

/** Eight hex characters, the length the sprite stamps keep */
const STAMP_LENGTH = 8;

const EXTENSION = '.ogg';

async function main(): Promise<void> {
  const lines: string[] = [];
  const found = existsSync(ROOT) ? (await readdir(ROOT)).sort() : [];

  // The sounds are published to the sprite host, so a build for the
  // app alone has none of them. Writing then would empty the stamps
  // every sound is asked for with, so the committed copy is left alone
  if (!found.some((file) => file.endsWith(EXTENSION))) {
    process.stdout.write(`${ROOT}: no sounds here, so nothing to stamp\n`);
    return;
  }

  for (const file of found) {
    if (!file.endsWith(EXTENSION)) {
      continue;
    }

    const stamp = createHash('sha256')
      .update(await readFile(join(ROOT, file)))
      .digest('hex')
      .slice(0, STAMP_LENGTH);

    lines.push(`  ${file.slice(0, -EXTENSION.length)}: '${stamp}',`);
  }

  await writeFile(
    OUTPUT,
    `// Written by scripts/sound-stamps.ts; run it rather than editing this

/** The digest each sound under \`public/sounds/effects\` is asked for with */
const SOUND_STAMPS: Readonly<Partial<Record<string, string>>> = {
${lines.join('\n')}
};

export default SOUND_STAMPS;
`,
    'utf8',
  );
  process.stdout.write(`${OUTPUT}: ${lines.length} sounds\n`);
}

await main();
