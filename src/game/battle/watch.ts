import {
  BattleOutcome,
  type BattleRecord,
  type CandyEarned,
  finishBattle,
  listBattleTeams,
  recordAftermath,
  watchBattle,
} from '../../auth/battles';
import { PLAYER_ALLIANCE, type RaidRecord, clearRaid, getRaid } from '../../auth/raids';
import { BattleModes } from '../../battle/battle';
import BattleKind, { getBattleKind } from '../../model/battle-kind';
import {
  type RaidBattle,
  collectAftermath,
  countDefeated,
  createRaidBattle,
} from '../../overworld/raid/battle';
import { createTrainerBattle } from '../../overworld/stop/battle';
import type { ActiveBattle, PendingReward } from '../session/types';
import { type Store, createStore } from '../store';
import describeFailure from '../../i18n/refusals';

/** How often the units are re-read; the battle itself runs on its own frame timer */
const POLL_INTERVAL = 250;

/**
 * How long the field is held before the fight starts, in seconds. A
 * real-time fight is over in half a minute, so its opening is the only
 * chance to see what each side brought. The engine is seeded, so the
 * hold changes when the fight begins and nothing about how it goes
 */
export const COUNTDOWN = 3;

const COUNTDOWN_TICK = 1000;

export type Outcome = 'won' | 'lost' | 'draw';

/** What each way a fight ends is stamped on its record as */
const OUTCOME_STAMPS: Record<Outcome, BattleOutcome> = {
  won: BattleOutcome.Won,
  lost: BattleOutcome.Lost,
  draw: BattleOutcome.Drawn,
};

export interface BattleWatchEvents {
  /** The field is drawn and the count has begun */
  started: () => void;
  /** The engine has settled the fight, once */
  settled: (outcome: Outcome) => void;
  /** A prize the settled fight left waiting to be collected */
  reward: (reward: PendingReward) => void;
  /** Candy paid after the view was left, so its summary is gone */
  candyInPassing: (earned: CandyEarned[]) => void;
}

/**
 * One battle on the page: rebuilt from its record, counted in, run, and
 * settled by whichever fighter sees it end. A replay settles nothing
 */
export interface BattleWatch {
  /** Followed rather than read once: the outcome is stamped by whoever watches it settle */
  record: Store<BattleRecord | null>;
  /** The engine, once built from the record */
  instance: Store<RaidBattle | null>;
  /** The raid the fight is for, read once: its record is cleared the moment the boss goes down */
  raid: Store<RaidRecord | null>;
  /** Bumped while the fight runs, since the units mutate in place */
  revision: Store<number>;
  /** Seconds left before the fight starts, or null when it is not counting */
  counting: Store<number | null>;
  /** Anything that went wrong writing the result down */
  status: Store<string | null>;
  /** Candy the settled fight paid, for the summary */
  candy: Store<CandyEarned[]>;
  /** Which alliance the player fights under, or null when only watching */
  side: () => number | null;
  outcome: () => Outcome | null;
  /** Whether the player fought in it; a spectator settles nothing and is owed nothing */
  fought: () => boolean;
  /** The other side where it belonged to nobody, kept on the record for replays */
  opponent: () => { name: string; sprite: string } | null;
  /** The canvas has every sheet in hand; the first call starts the count */
  ready: () => void;
  /** Only a replay may be hurried: a fight that counts is played in real time */
  setSpeed: (speed: number) => void;
  /** Whether walking out now has to be confirmed first */
  leaveNeedsAsking: () => boolean;
  /** Out of the fight: a grunt's fight still running is conceded on the way */
  leave: () => void;
  start: () => () => void;
}

export default function createBattleWatch(
  active: ActiveBattle,
  player: () => string | null,
  events: BattleWatchEvents,
): BattleWatch {
  const record = createStore<BattleRecord | null>(null);
  const instance = createStore<RaidBattle | null>(null);
  const raid = createStore<RaidRecord | null>(null);
  const revision = createStore(0);
  const counting = createStore<number | null>(null);
  const status = createStore<string | null>(null);
  const candy = createStore<CandyEarned[]>([]);
  let recorded = false;
  let drawable = false;
  let sounded = false;
  let building = false;
  /** Whether the view has been left, so a late payout is said in passing instead */
  let gone = false;

  const say = (caught: unknown): void => {
    status.set(describeFailure(caught));
  };

  const side = (): number | null => {
    const built = instance.get();
    const uid = player();

    if (built == null || uid == null) {
      return null;
    }
    // Two players can stand on opposite sides of one battle, so the
    // side is looked up rather than taken to be the party's
    for (const [alliance, fielded] of built.units) {
      for (const unit of fielded) {
        if (unit.team.player === uid) {
          return alliance;
        }
      }
    }
    return null;
  };

  const outcome = (): Outcome | null => {
    const built = instance.get();

    if (built == null || !built.battle.settled) {
      return null;
    }

    // A spectator reads it from the party's side, which is what the
    // raid and the grunt's fight are about
    const mine = side() ?? PLAYER_ALLIANCE;

    if (built.battle.winner === built.alliances.get(mine)) {
      return 'won';
    }
    // Nobody left standing, or a stalemate neither side can break, is a draw
    return built.battle.winner == null ? 'draw' : 'lost';
  };

  const fought = (): boolean => {
    const uid = player();

    return uid != null && record.get()?.players.includes(uid) === true;
  };

  const opponent = (): { name: string; sprite: string } | null => {
    if (active.opponent != null) {
      return active.opponent;
    }

    const loaded = record.get();

    return loaded == null || loaded.opponent === ''
      ? null
      : { name: loaded.opponent, sprite: loaded.opponentSprite };
  };

  const build = (loaded: BattleRecord): void => {
    listBattleTeams(loaded)
      .then((teams) => {
        if (gone) {
          return;
        }

        // Rebuilt under the rules it was fought under, read off the
        // record rather than off how the view was opened: a replay
        // arrives with no hints
        const kind = getBattleKind(loaded);
        const built =
          kind === BattleKind.Raid
            ? createRaidBattle(active.id, teams, loaded.limits, loaded.biome)
            : createTrainerBattle(
                active.id,
                teams,
                loaded.limits,
                kind === BattleKind.Player ? BattleModes.PvP : BattleModes.Npc,
                loaded.weather,
                loaded.biome,
                loaded.rules,
              );

        // Set up but not running: the count starts once the canvas has
        // every sheet, so it is not spent over an empty field
        built.battle.initialize();
        instance.set(built);
      })
      .catch((caught: unknown) => {
        // The next record that arrives tries again
        building = false;
        say(caught);
      });
  };

  /** Recorded once, by whichever fighter sees it end */
  const settle = (result: Outcome): void => {
    if (active.replay || !fought() || recorded) {
      return;
    }
    recorded = true;

    const won = result === 'won';
    const stamped = OUTCOME_STAMPS[result];
    const built = instance.get();
    const uid = player();

    (async () => {
      // What the fight cost is owed whichever way it went, and it is
      // written before the outcome is stamped: stamping frees the
      // party, and a freed pokemon can have its berry pulled back. A
      // fight between players settles only for a gym seat's challenger
      if (
        built != null &&
        uid != null &&
        (built.battle.mode !== BattleModes.PvP || active.seat != null)
      ) {
        const aftermath = collectAftermath(built, uid);

        if (aftermath.length > 0) {
          const earned = await recordAftermath(
            active.id,
            aftermath,
            countDefeated(built, uid),
            stamped,
          );

          if (gone) {
            events.candyInPassing(earned);
          } else {
            candy.set(earned);
          }
        }
      }

      await finishBattle(active.id, stamped);

      // The legendary waits on the raid itself, so it can be collected
      // here or from the battle history later
      if (won && active.raid != null) {
        await clearRaid(active.raid);
        events.reward({ raid: active.raid });
      }
      // Only a win closes a stop; losing leaves them standing there
      if (won && active.stop != null) {
        events.reward({ stop: active.stop });
      }
      // A seat is settled either way: the win takes it, and the loss
      // is one more challenge its holder turned away
      if (active.seat != null) {
        events.reward({ seat: active.seat });
      }
    })().catch(say);
  };

  /** Read on every tick of the fight, and acted on the once it settles */
  const check = (): void => {
    const result = outcome();

    if (result == null) {
      return;
    }
    if (!sounded) {
      sounded = true;
      events.settled(result);
    }
    settle(result);
  };

  /**
   * Walking out of a grunt's fight concedes it, since nothing else
   * ever could: the fight lives on a stop the player may never walk
   * back to. A raid is left freely, and a settled fight is `settle`'s
   */
  const concede = (): void => {
    const loaded = record.get();
    const built = instance.get();
    const uid = player();

    if (
      active.replay ||
      recorded ||
      outcome() != null ||
      loaded == null ||
      getBattleKind(loaded) !== BattleKind.Npc ||
      !fought()
    ) {
      return;
    }
    recorded = true;

    // Collected before the engine is torn down, the aftermath first:
    // conceding still pays for whatever the party put down
    const aftermath = built != null && uid != null ? collectAftermath(built, uid) : [];
    const defeated = built != null && uid != null ? countDefeated(built, uid) : 0;

    (async () => {
      if (aftermath.length > 0) {
        events.candyInPassing(
          await recordAftermath(active.id, aftermath, defeated, BattleOutcome.Lost),
        );
      }
      await finishBattle(active.id, BattleOutcome.Lost);
    })().catch(() => {
      // Leaving is not a moment to hold the player in; if the write
      // never lands, the battle lock's own timeout frees the party
    });
  };

  let countdown: ReturnType<typeof setTimeout> | null = null;

  const count = (left: number): void => {
    counting.set(left);
    countdown = setTimeout(() => {
      if (left > 1) {
        count(left - 1);
        return;
      }
      // The last step starts the battle rather than counting to zero
      countdown = null;
      counting.set(null);
      instance.get()?.battle.start();
    }, COUNTDOWN_TICK);
  };

  const stopCounting = (): void => {
    if (countdown != null) {
      clearTimeout(countdown);
      countdown = null;
    }
    counting.set(null);
  };

  const start = (): (() => void) => {
    const unwatch = watchBattle(active.id, (loaded) => {
      record.set(loaded);
      // Built from the first record that arrives; later ones only restamp it
      if (loaded != null && !building) {
        building = true;
        build(loaded);
      }
    });

    if (active.raid != null) {
      getRaid(active.raid)
        .then((found) => {
          raid.set(found);
        })
        .catch(() => {
          // The fight is then named after what kind it is
        });
    }

    const poll = setInterval(() => {
      if (instance.get() != null) {
        revision.update((value) => value + 1);
        check();
      }
    }, POLL_INTERVAL);

    return () => {
      gone = true;
      unwatch();
      clearInterval(poll);
      stopCounting();
      // A battle left running would keep ticking behind the tabs
      instance.get()?.battle.end();
    };
  };

  return {
    record,
    instance,
    raid,
    revision,
    counting,
    status,
    candy,
    side,
    outcome,
    fought,
    opponent,
    ready: () => {
      // Once: a canvas that reported twice would start the count over itself
      if (drawable) {
        return;
      }
      drawable = true;
      count(COUNTDOWN);
      events.started();
    },
    setSpeed: (speed) => {
      const built = instance.get();

      if (built != null && active.replay) {
        built.battle.speed = speed;
      }
    },
    leaveNeedsAsking: () => !active.replay && outcome() == null && record.get() != null && fought(),
    leave: () => {
      concede();
      stopCounting();
      instance.get()?.battle.end();
    },
    start,
  };
}
