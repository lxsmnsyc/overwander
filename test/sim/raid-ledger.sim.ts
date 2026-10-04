import { writeFileSync } from 'node:fs';
import { beforeAll, it } from 'vitest';
import registerGameData from '../../src/data';
import type Abilities from '../../src/data/ids/abilities';
import { Species } from '../../src/data/ids/species';
import { getSpeciesData } from '../../src/data/species';
import { readSheets, runRaid } from './raid-sim';

/**
 * One TEAMS.md team, alone, against one raid boss, with where the
 * damage went both ways. Run with
 * `pnpm exec vitest run --config vitest.sim.ts test/sim/raid-ledger.sim.ts`.
 * RAID_SHEETS picks the team by title, RAID_BOSS the boss by species
 * id, RAID_ABILITY replaces the boss' rolled ability, and RAID_OUT
 * names the report file
 */
beforeAll(() => {
  registerGameData();
});

function sorted(ledger: Map<string, number>): [string, number][] {
  return [...ledger].sort((a, b) => b[1] - a[1]);
}

it('ledgers one raid', () => {
  const title = process.env.RAID_SHEETS ?? 'Raids, without';
  const sheet = readSheets('TEAMS.md').find((one) => one.title.includes(title));

  if (sheet == null) {
    throw new Error(`No team titled ${title}`);
  }

  const boss = Number(process.env.RAID_BOSS ?? Species.Mewtwo) as Species;
  const ability =
    process.env.RAID_ABILITY == null ? undefined : (Number(process.env.RAID_ABILITY) as Abilities);
  const result = runRaid('ledger', sheet.members, boss, 0, ability);
  const lines = [
    `${sheet.title} vs ${getSpeciesData(boss).name}: ${result.won ? 'won' : 'lost'} in ` +
      `${(result.duration / 1000).toFixed(0)}s, standing ${result.standing}`,
  ];
  let total = 0;

  for (const [, value] of result.dealt) {
    total += value;
  }
  lines.push(`dealt to boss (${total.toFixed(0)}):`);
  for (const [key, value] of sorted(result.dealt)) {
    lines.push(
      `  ${value.toFixed(0).padStart(7)} ${((100 * value) / total).toFixed(1).padStart(5)}%  ${key}`,
    );
  }
  lines.push('taken by party:');
  for (const [key, value] of sorted(result.taken)) {
    lines.push(`  ${value.toFixed(0).padStart(7)}  ${key}`);
  }
  lines.push(`boss casts: ${result.bossCasts.join(', ')}`);
  writeFileSync(process.env.RAID_OUT ?? 'raid-ledger.txt', `${lines.join('\n')}\n`);
});
