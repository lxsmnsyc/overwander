import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * A digest per sound effect, so a sound can be cached forever and a
 * re-rendered one is still fetched.
 *
 * The same idea as `sprite-stamps.ts`, but written as a module rather
 * than a list fetched at runtime: the sounds ship with the app rather
 * than on the sprite host, so the stamps can ride in the bundle and a
 * sound is never held up waiting on a list.
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

  for (const file of (await readdir(ROOT)).sort()) {
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
