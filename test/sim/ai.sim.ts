import { beforeAll, it } from 'vitest';
import type { MoveRole } from '../../src/battle/ai/roles';
import { Moves } from '../../src/data/ids/moves';
import { getMoveData } from '../../src/data/moves';
import registerGameData from '../../src/data';
import {
  ROLE_NAMES,
  type SimOptions,
  type SimResult,
  castRoles,
  rollTeams,
  runBattle,
} from './ai-sim';

/**
 * Plays AI-against-AI battles and reports what the AI casts, so a change
 * to the scoring is measured rather than guessed. Run with `pnpm ai:sim`;
 * SIM_BATTLES, SIM_SIZE and SIM_LEVEL override the defaults
 */
const BATTLES = Number(process.env.SIM_BATTLES ?? 40);
const OPTIONS: SimOptions = {
  size: Number(process.env.SIM_SIZE ?? 3),
  level: Number(process.env.SIM_LEVEL ?? 50),
  abilities: 1,
  items: 1,
};

function percent(part: number, whole: number): string {
  return whole === 0 ? '-' : `${((100 * part) / whole).toFixed(1)}%`;
}

function report(results: SimResult[]): string {
  const lines: string[] = [];
  let casts = 0;
  let timedOut = 0;
  let draws = 0;
  let duration = 0;
  const byRole = new Map<MoveRole, { all: number; won: number; lost: number }>();
  const byMove = new Map<Moves, number>();
  let wonCasts = 0;
  let lostCasts = 0;

  for (const result of results) {
    duration += result.duration;
    if (result.timedOut) {
      timedOut += 1;
    } else if (result.winner == null) {
      draws += 1;
    }
    for (const cast of result.casts) {
      casts += 1;
      byMove.set(cast.move, (byMove.get(cast.move) ?? 0) + 1);

      const side = result.winner == null ? null : cast.side === result.winner;

      if (side === true) {
        wonCasts += 1;
      } else if (side === false) {
        lostCasts += 1;
      }
      for (const role of castRoles(cast.move)) {
        const tally = byRole.get(role) ?? { all: 0, won: 0, lost: 0 };

        tally.all += 1;
        if (side === true) {
          tally.won += 1;
        } else if (side === false) {
          tally.lost += 1;
        }
        byRole.set(role, tally);
      }
    }
  }

  lines.push(
    `${results.length} battles, ${OPTIONS.size} a side at level ${OPTIONS.level}`,
    `average length ${(duration / results.length / 1000).toFixed(1)}s, ${timedOut} timed out, ${draws} drawn`,
    `${casts} casts, ${percent(byMove.get(Moves.Attack) ?? 0, casts)} of them the basic Attack`,
    '',
    'role          casts   share   winners  losers   lean',
  );

  const roles = [...byRole].sort((one, two) => two[1].all - one[1].all);

  for (const [role, tally] of roles) {
    // Above 1 means the winning side cast the role more than the losing one did
    const winShare = wonCasts === 0 ? 0 : tally.won / wonCasts;
    const lostShare = lostCasts === 0 ? 0 : tally.lost / lostCasts;
    const lean = lostShare === 0 ? '-' : (winShare / lostShare).toFixed(2);

    lines.push(
      `${ROLE_NAMES[role].padEnd(12)} ${String(tally.all).padStart(6)} ${percent(tally.all, casts).padStart(7)} ${percent(tally.won, wonCasts).padStart(8)} ${percent(tally.lost, lostCasts).padStart(7)} ${lean.padStart(6)}`,
    );
  }

  lines.push('', 'most cast moves');

  const moves = [...byMove].sort((one, two) => two[1] - one[1]);

  for (const [move, count] of moves.slice(0, 15)) {
    lines.push(
      `  ${getMoveData(move).name.padEnd(18)} ${String(count).padStart(6)} ${percent(count, casts).padStart(7)}`,
    );
  }
  return lines.join('\n');
}

beforeAll(() => {
  registerGameData();
});

it('reports what the AI casts across simulated battles', () => {
  const results: SimResult[] = [];

  for (let at = 0; at < BATTLES; at++) {
    const seed = `battle-${at}`;

    results.push(runBattle(seed, rollTeams(seed, OPTIONS)));
  }
  process.stdout.write(`\n${report(results)}\n\n`);
});
