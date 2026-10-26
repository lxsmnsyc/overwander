import { getCandyCost, useCandy } from '../../auth/candy';
import type { Moves } from '../../data/ids/moves';
import type { CaughtPokemon } from '../../model/caught-record';
import { getLevelMovesBetween, nextOfferLevel } from '../../model/level-moves';
import { type Store, createStore } from '../store';

/**
 * How long the sheet waits after the last candy press before sending
 * them. Long enough to gather a run of presses, short enough that a
 * player who pressed once and looked away is not left wondering
 */
export const CANDY_SETTLE = 500;

/**
 * A move about to be learned, and where it came from. `rest` is the
 * queue behind it: a level can offer more than one move, and each is
 * its own question
 */
export interface Teaching {
  /**
   * Whose question it is. The grid behind the sheet stays live while
   * the question is up, so it names its catch rather than reading the
   * sheet's
   */
  catchId: string;
  move: Moves;
  rest: Moves[];
  /** Grown into rather than taught: the candy already paid for it */
  levelled: boolean;
}

export interface CandyFeedDeps {
  /** The record of one particular catch, or null once it is not the one being read */
  recordOf: (catchId: string) => CaughtPokemon | null;
  /** The catch the sheet is showing now */
  showing: () => string | null;
  /** The pile of candy the bag last said */
  candies: () => number;
  /** A run landed, at a level or none; `here` is whether the sheet is still on that pokemon */
  grew: (level: number | null, here: boolean, levelledUp: boolean) => void;
  failed: (message: string) => void;
}

/**
 * Feeding candy from the catch sheet, and the moves a level asks about.
 *
 * A candy is pressed several times in a row, and one call a press was
 * a round trip between each of them. The presses are counted and shown
 * at once instead, and sent as one call when the player stops; every
 * level with a move to offer is landed on and settled on the way, since
 * the store teaches a levelled move only while the pokemon stands on
 * the level that offers it
 */
export interface CandyFeed {
  /** Levels pressed for but not yet sent */
  queued: Store<number>;
  /** The level the server last said it reached, held until the record catches up */
  reached: Store<number>;
  /** The question being asked, if any */
  teaching: Store<Teaching | null>;
  feed: () => void;
  /** The level as the sheet shows it, presses and all */
  shownLevel: (record: CaughtPokemon | null) => number;
  /** The pile as the sheet shows it, with what the presses would spend taken off */
  shownCandies: (record: CaughtPokemon | null) => number;
  /** A different pokemon on the sheet is a different pile of presses */
  switched: () => void;
  /** The bag was read again, which may make it the truth again */
  candiesRead: () => void;
  /** Ask about a machine's move, which is taught rather than grown into */
  teach: (catchId: string, move: Moves) => void;
  /** Ask about what a run of levels offers, queued behind a question about the same pokemon */
  offerLevelMoves: (
    catchId: string,
    caught: CaughtPokemon | null,
    from: number,
    to?: number,
  ) => void;
  /** The question was answered: step to the next one, or let a waiting run go on */
  nextTeaching: () => void;
  /** Send what is still counted, and let a run waiting on a question finish */
  dispose: () => void;
}

export default function createCandyFeed(deps: CandyFeedDeps): CandyFeed {
  const queued = createStore(0);
  const reached = createStore(0);
  const teaching = createStore<Teaching | null>(null);
  /**
   * The pile as it was when the last handover went out, and what it
   * should come to now that it has landed. The presses are taken off
   * what the bag last said, so without this the pile would jump back up
   * for the moment between a handover landing and the bag being read
   */
  const settling = createStore<{ was: number; now: number } | null>(null);
  let feeding: ReturnType<typeof setTimeout> | null = null;
  /** Whose presses are being counted, which a run keeps however long the player waits */
  let feedingFor: string | null = null;
  /** Whoever is waiting for the last question to be answered */
  let answering: (() => void) | null = null;
  /** Whether a run is already out, so a second does not overlap it */
  let running = false;
  /** Whether the sheet is gone, so nothing schedules itself after it */
  let closed = false;

  const awaitTeaching = async (): Promise<void> => {
    if (teaching.get() == null) {
      return;
    }
    return new Promise<void>((resolve) => {
      answering = resolve;
    });
  };

  const nextTeaching = (): void => {
    const current = teaching.get();
    const rest = current?.rest ?? [];
    const done = current == null || rest.length === 0;

    teaching.set(done ? null : { ...current, move: rest[0], rest: rest.slice(1) });
    if (done) {
      const waiting = answering;

      answering = null;
      waiting?.();
    }
  };

  /**
   * Ask about what the levels from `from` to `to` offer, minus what it
   * knows. Saying no is allowed; it is final once the next candy takes
   * the pokemon past the level
   */
  const offerLevelMoves = (
    catchId: string,
    caught: CaughtPokemon | null,
    from: number,
    to: number = from,
  ): void => {
    if (caught == null) {
      return;
    }

    const learning = getLevelMovesBetween(caught, from, to);

    if (learning.length === 0) {
      return;
    }
    // Queued behind a question about the same pokemon rather than over
    // it: those levels are paid for
    teaching.update((asked) =>
      asked?.catchId === catchId
        ? { ...asked, rest: [...asked.rest, ...learning] }
        : { catchId, move: learning[0], rest: learning.slice(1), levelled: true },
    );
  };

  const heldCandies = (): number => {
    const held = deps.candies();
    const settled = settling.get();

    return settled?.was === held ? settled.now : held;
  };

  /**
   * Hand the presses over, landing on every level with a move to offer
   * and waiting there until it is answered. Everything between two
   * offers goes in one call, which for most feedings is the whole run
   */
  const feedRun = async (catchId: string, levels: number): Promise<number | null> => {
    // Held rather than read every time round: a press on the grid behind
    // the sheet moves the record on, and the run still owes this pokemon
    let known = deps.recordOf(catchId);
    let at = Math.max(known?.level ?? 0, reached.get());
    let left = levels;
    let last: number | null = null;

    while (left > 0) {
      const caught = deps.recordOf(catchId) ?? known;

      known = caught;

      const asks = caught == null ? null : nextOfferLevel(caught, at);
      const step = asks == null ? left : Math.min(left, asks - at);
      const grown = await useCandy(catchId, step);

      // The pile ran out, or it is at the cap: what landed so far stands
      if (grown == null) {
        break;
      }
      left -= grown - at;
      at = grown;
      last = grown;
      if (deps.showing() === catchId) {
        reached.set(grown);
      }
      offerLevelMoves(catchId, caught, grown);
      await awaitTeaching();
    }
    return last;
  };

  const flushCandy = (): void => {
    const catchId = feedingFor;
    const levels = queued.get();

    feeding = null;
    if (catchId == null || levels < 1 || running) {
      return;
    }
    // What the sheet already knows it reached, so a second handover sent
    // before the first was read back does not offer those moves again
    const from = Math.max(deps.recordOf(catchId)?.level ?? 0, reached.get());
    // A run that lands after the player clicked on another pokemon must
    // not write its numbers over theirs
    const here = (): boolean => deps.showing() === catchId;

    running = true;
    feedRun(catchId, levels)
      .then((level) => {
        const grewAny = level != null && level > from;

        if (here()) {
          queued.update((waiting) => Math.max(0, waiting - levels));
          reached.set(level ?? 0);
          // What it actually cost: the levels the pile stretched to, taken
          // off what the sheet already believes
          const grown = Math.max(0, (level ?? from) - from);
          const record = deps.recordOf(catchId);

          settling.set({
            was: deps.candies(),
            now: Math.max(0, heldCandies() - grown * getCandyCost(record ?? { shadow: false })),
          });
        }
        deps.grew(level, here(), grewAny);
      })
      .catch((caught: unknown) => {
        if (here()) {
          queued.update((waiting) => Math.max(0, waiting - levels));
        }
        deps.failed(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        running = false;
        // Presses made while the run was out, or while a question was up, are still owed
        if (!closed && queued.get() > 0) {
          feeding = setTimeout(flushCandy, 0);
        }
      });
  };

  return {
    queued,
    reached,
    teaching,
    feed: () => {
      const catchId = deps.showing();

      if (catchId == null) {
        return;
      }
      feedingFor = catchId;
      queued.update((waiting) => waiting + 1);
      if (feeding != null) {
        clearTimeout(feeding);
        feeding = null;
      }

      const caught = deps.recordOf(catchId);
      const at = Math.max(caught?.level ?? 0, reached.get());
      const asks = caught == null ? null : nextOfferLevel(caught, at);

      // A press that reaches a level with a move in it goes at once: the
      // question is the thing the player pressed for
      if (asks != null && at + queued.get() >= asks) {
        flushCandy();
        return;
      }
      feeding = setTimeout(flushCandy, CANDY_SETTLE);
    },
    shownLevel: (record) => Math.max(record?.level ?? 0, reached.get()) + queued.get(),
    shownCandies: (record) =>
      Math.max(0, heldCandies() - queued.get() * getCandyCost(record ?? { shadow: false })),
    switched: () => {
      queued.set(0);
      reached.set(0);
      settling.set(null);
    },
    candiesRead: () => {
      const settled = settling.get();

      if (settled != null && deps.candies() !== settled.was) {
        settling.set(null);
      }
    },
    teach: (catchId, move) => {
      teaching.set({ catchId, move, rest: [], levelled: false });
    },
    offerLevelMoves,
    nextTeaching,
    dispose: () => {
      closed = true;
      // A run parked on a question the player will never see now finishes
      const waiting = answering;

      answering = null;
      waiting?.();
      if (feeding != null) {
        clearTimeout(feeding);
        flushCandy();
      }
    },
  };
}
