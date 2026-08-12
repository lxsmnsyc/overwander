import { execFileSync, spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

/**
 * Start the emulators for a test run, clearing away a dead one first.
 *
 * The Firebase CLI supervises the Firestore emulator as a separate
 * Java process, and the pair of them routinely outlive the run that
 * started them: a suite cut short with Ctrl-C, a killed terminal, a
 * crash. What is left behind is a set of ports held open by an
 * emulator with nothing driving it, and the next `emulators:start`
 * gives up on the first one it finds taken.
 *
 * Playwright only runs this at all when the auth emulator is *not*
 * answering, which is the definition of "no working emulator set is
 * up". So anything still holding one of these ports at this point is
 * an orphan of a previous run, and clearing it is the only way the
 * suite recovers by itself rather than by hand.
 *
 * **Every** port, not just the two the services are on. This used to
 * clear Firestore and the hub and nothing else, and the run it was
 * meant to rescue died anyway on
 *
 *     Error: Could not start Emulator UI, port taken.
 *
 * — because the UI comes up alongside the two services asked for, and
 * a UI that cannot have its port takes the whole start down with it.
 * A half-cleared orphan is no better than an uncleared one.
 *
 * Run by Node directly, types and all — it strips them itself, which
 * is what keeps this a checked, linted part of the repository rather
 * than a shell command hidden in a config file.
 *
 * Usage: node e2e/emulators.ts <project-id>
 */

/**
 * Everything an `emulators:start` binds, in the order it gives up on
 * them: the UI, the hub, the logging stream, Firestore and its
 * websocket, and auth. They come from `firebase.json` where that says
 * anything, and from the CLI's own defaults where it does not
 */
const PORTS = [4000, 4400, 4500, 8080, 9150, 9099];

/**
 * How long an orphan is given to let go after being asked to, and how
 * often it is checked on. A CLI shutting down takes a second or two to
 * bring its Java child down with it; anything still holding on after
 * this was not going to
 */
const RELEASE_TIMEOUT = 10_000;
const RELEASE_POLL = 250;

const project = process.argv.at(2);

if (project == null) {
  // This is a command-line tool, and what it has to say goes where a
  // command-line tool says things
  // oxlint-disable-next-line eslint/no-console
  console.error('emulators: a project id is required');
  process.exit(1);
}

/**
 * Whoever is listening on the port. `lsof` exits non-zero when nobody
 * is, which is the normal case and not a failure — and a machine
 * without `lsof` at all answers the same way, which leaves the
 * emulators to speak for themselves
 */
function holdersOf(port: number): number[] {
  try {
    return execFileSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map(Number)
      .filter((pid) => Number.isInteger(pid) && pid > 0);
  } catch {
    return [];
  }
}

function held(): Map<number, number[]> {
  const taken = new Map<number, number[]>();

  for (const port of PORTS) {
    const holders = holdersOf(port);

    if (holders.length > 0) {
      taken.set(port, holders);
    }
  }
  return taken;
}

/**
 * Ask everything holding one of the ports to go away.
 *
 * One signal per process rather than one per port: the CLI holds four
 * of them and its Java child holds the rest, so signalling by port
 * would send the same process the same signal four times
 */
function clear(signal: NodeJS.Signals): boolean {
  const taken = held();
  const pids = new Set([...taken.values()].flat());

  for (const pid of pids) {
    // Said out loud on purpose: killing somebody's process is not
    // something a test harness should do quietly
    // oxlint-disable-next-line eslint/no-console
    console.warn(
      `emulators: clearing an orphaned emulator (pid ${pid}, ${signal}) holding ${[...taken]
        .filter(([, holders]) => holders.includes(pid))
        .map(([port]) => port)
        .join(', ')}`,
    );
    try {
      process.kill(pid, signal);
    } catch {
      // It died between being listed and being signalled, which is
      // the outcome being asked for
    }
  }
  return pids.size > 0;
}

if (clear('SIGTERM')) {
  // Waited for rather than assumed. A CLI told to stop takes a moment
  // to bring its Java child down, and starting a new set on top of a
  // shutting-down one fails exactly the way an orphan does
  const deadline = Date.now() + RELEASE_TIMEOUT;

  while (held().size > 0 && Date.now() < deadline) {
    await sleep(RELEASE_POLL);
  }
  // Anything still standing after being asked politely is not going
  // to, and one taken port is enough to end the run
  if (held().size > 0) {
    clear('SIGKILL');
    await sleep(RELEASE_POLL);
  }
}

const child = spawn(
  'pnpm',
  ['exec', 'firebase', 'emulators:start', '--project', project, '--only', 'firestore,auth'],
  { stdio: 'inherit' },
);

child.on('exit', (code, signal) => {
  process.exit(signal == null ? (code ?? 0) : 1);
});
