import {
  type JSX,
  Show,
  batch,
  createEffect,
  createResource,
  createSignal,
  from,
  onCleanup,
} from 'solid-js';
import type Unit from '../../../battle/unit';
import {
  BattleOutcome,
  type BattleRecord,
  finishBattle,
  listBattleTeams,
  recordAftermath,
  watchBattle,
} from '../../../auth/battles';
import { useAuth } from '../../../auth/context';
import {
  BOSS_ALLIANCE,
  PLAYER_ALLIANCE,
  clearRaid,
  getRaid,
  getRaidTitle,
} from '../../../auth/raids';
import { BattleModes } from '../../../battle/core';
import BattleKind, { getBattleKind } from '../../../auth/battle-kind';
import { type RaidBattle, collectAftermath, createRaidBattle } from '../../../overworld/raid';
import { createTrainerBattle } from '../../../overworld/rocket';
import BattleField from '../BattleField';
import VerdictDialog from './VerdictDialog';
import { type Contribution, type SideSummary, readContributions, readSides } from './summary';
import CatchDialog from '../../catches/catch-dialog';
import { Badge, Button, Dialog, DialogActions, Note, Status } from '../../styled';
import { type ActiveBattle, GameDialog, useGame } from '../../app/game-context';
import { type Profile, getProfiles } from '../../../auth/profile';

/**
 * How often the view re-reads the units; the battle itself runs on
 * its own frame timer
 */
const POLL_INTERVAL = 250;

/**
 * How long the field is held before the fight starts, in seconds.
 *
 * A real-time battle is over in half a minute and nobody presses
 * anything in it, so the moment it opens is the only chance a player
 * has to see what they brought and what they are up against. Dropped
 * straight in, the first exchange had already landed before the
 * sprites finished loading. The engine is seeded and deterministic —
 * holding the start changes nothing about how the fight goes, only
 * when it begins
 */
const COUNTDOWN = 3;

/**
 * How often the countdown is stepped, in milliseconds
 */
const COUNTDOWN_TICK = 1000;

export interface BattleViewProps {
  active: ActiveBattle;
}

/**
 * A battle, taking the whole page. A raid battle settles its raid
 * when it ends — the outcome is stamped, a win shuts the lobby and
 * leaves the legendary waiting in the overworld. A replay settles
 * nothing and can be walked out of at any point
 */
export default function BattleView(props: BattleViewProps): JSX.Element {
  const game = useGame();
  const auth = useAuth();
  // Followed rather than read once: the outcome is stamped by
  // whoever watches the fight settle, and that may not be this player
  const record = from<BattleRecord | null>((set) =>
    watchBattle(props.active.id, (battle) => {
      set(battle);
    }),
  );
  const [instance, setInstance] = createSignal<RaidBattle | null>(null);
  const [status, setStatus] = createSignal<string | null>(null);
  // The units mutate in place, so the view re-reads them on a timer
  const [revision, setRevision] = createSignal(0);
  const [recorded, setRecorded] = createSignal(false);
  // Whether the player has closed the verdict. Once, per battle: the
  // view is rebuilt for the next one, so nothing has to reset it
  const [dismissed, setDismissed] = createSignal(false);
  // Whether the player is being asked to confirm walking out of a
  // live fight
  const [leaving, setLeaving] = createSignal(false);
  /**
   * Seconds left before the fight starts, or null once it has
   */
  const [counting, setCounting] = createSignal<number | null>(null);
  /**
   * Whether the canvas has every pokemon's sheet in hand. Nothing is
   * counted down and nothing is started until it does
   */
  const [drawable, setDrawable] = createSignal(false);
  /**
   * The catch sheet a pressed pokemon opened, if it stands for a
   * record at all: a raid boss belongs to nobody and has none
   */
  const [opened, setOpened] = createSignal<Unit | null>(null);
  createEffect(() => {
    const loaded = record();

    if (loaded == null || instance() != null) {
      return;
    }

    let cancelled = false;

    listBattleTeams(loaded)
      .then((teams) => {
        if (cancelled) {
          return;
        }

        // Rebuilt under the rules it was fought under, read off the
        // record rather than off how the view was opened: a replay
        // arrives with no hints, and a grunt's fight replayed as a
        // raid is a different fight
        const kind = getBattleKind(loaded);
        let built: RaidBattle;

        if (kind === BattleKind.Raid) {
          built = createRaidBattle(props.active.id, teams, loaded.limits);
        } else {
          built = createTrainerBattle(
            props.active.id,
            teams,
            loaded.limits,
            kind === BattleKind.Player ? BattleModes.PvP : BattleModes.Npc,
          );
        }

        // Built and set up, but not yet running. The canvas says when
        // it has every sheet the fight needs, and the countdown starts
        // from there: three, two, one over an empty field is three
        // seconds of the fight spent on nothing
        built.battle.initialize();
        setInstance(built);
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });

    onCleanup(() => {
      cancelled = true;
    });
  });

  // Three, two, one. The last step starts the battle rather than
  // counting to zero and leaving it to somebody else
  createEffect(() => {
    const built = instance();
    const left = counting();

    if (built == null || left == null) {
      return;
    }

    const timer = setTimeout(() => {
      if (left > 1) {
        setCounting(left - 1);
        return;
      }
      setCounting(null);
      built.battle.start();
    }, COUNTDOWN_TICK);

    onCleanup(() => {
      clearTimeout(timer);
    });
  });

  createEffect(() => {
    if (instance() == null) {
      return;
    }

    const timer = setInterval(() => {
      setRevision((value) => value + 1);
    }, POLL_INTERVAL);

    onCleanup(() => {
      clearInterval(timer);
    });
  });

  // A battle left running would keep ticking behind the tabs
  onCleanup(() => {
    instance()?.battle.end();
  });

  /**
   * How the battle ended, once the engine says it has. The outcome
   * mechanics settle it when nothing can act any more, so the view
   * only has to read the verdict
   */
  const outcome = (): 'won' | 'lost' | 'draw' | null => {
    revision();
    const built = instance();

    if (built == null || !built.battle.settled) {
      return null;
    }
    if (built.battle.winner === built.alliances.get(PLAYER_ALLIANCE)) {
      return 'won';
    }
    if (built.battle.winner === built.alliances.get(BOSS_ALLIANCE)) {
      return 'lost';
    }
    // Nobody left standing, or a stalemate neither side can break
    return 'draw';
  };

  /**
   * What the fight is called: a raid is named for the lair it is being
   * fought in, and a stop names the grunt standing in the way.
   *
   * The lair is read once rather than followed. The name of a place
   * does not change while somebody is fighting in it, and the raid
   * record is cleared the moment the boss goes down — a subscription
   * would watch its own prize delete the title out from under it
   */
  const [lair, setLair] = createSignal<string | null>(null);

  createEffect(() => {
    const raidId = props.active.raid;

    if (raidId == null) {
      return;
    }

    let cancelled = false;

    getRaid(raidId)
      .then((staged) => {
        if (!cancelled && staged != null) {
          setLair(getRaidTitle(staged));
        }
      })
      .catch(() => {
        // The fight is the same fight unnamed: it falls back to what
        // kind of battle it is
      });

    onCleanup(() => {
      cancelled = true;
    });
  });

  const title = (): string => {
    if (props.active.rocket != null) {
      return 'Team Rocket';
    }

    const named = lair();

    return named == null ? 'Raid Battle' : `Raid Battle: ${named}`;
  };

  /**
   * What a win says. A replay settles nothing, so it only reports
   * what happened; a fight that counted says where the prize went
   */
  const victory = (): string => {
    if (props.active.replay) {
      return 'The other side went down.';
    }
    if (props.active.rocket != null) {
      return 'The grunt is beaten — what they dropped is waiting in the overworld.';
    }
    return 'The raid boss is down — it is waiting in the overworld.';
  };
  /**
   * The fight's contributions and its sides, both only once the
   * battle has settled. `revision` is read so they are re-counted as
   * the units mutate
   */
  const contributions = (): Contribution[] => {
    revision();
    const built = instance();

    return built == null || !built.battle.settled ? [] : readContributions(built);
  };

  const sides = (): SideSummary[] => {
    revision();
    const built = instance();

    return built == null || !built.battle.settled ? [] : readSides(built);
  };

  /**
   * Who the rows belong to, by nickname. Read once when the verdict
   * lands, keyed on who is in it; the reader is "You"
   */
  const [names] = createResource(
    () => {
      const players = [...new Set(contributions().map((row) => row.player))].filter(Boolean);

      return players.length > 0 ? players.sort().join(',') : null;
    },
    async (key): Promise<Map<string, Profile>> => getProfiles(key.split(',')),
  );

  /** Whether this fight ranks whole teams rather than single pokemon */
  const raiding = (): boolean => instance()?.battle.mode === BattleModes.Raid;

  /** The raid's damage shares, keyed by who dealt them — the boss under '' */
  const shares = (): Map<string, number> =>
    new Map(contributions().map((row) => [row.player, row.dealt]));

  /**
   * What the end of the fight is called, and what it says. A replay
   * settles nothing, so it only reports what happened; a fight that
   * counted says where the prize went
   */
  const verdict = (): { title: string; said: string } | null => {
    switch (outcome()) {
      case 'won':
        return { title: 'Victory', said: victory() };
      case 'lost':
        return { title: 'Defeat', said: 'The party fainted.' };
      case 'draw':
        return {
          title: 'A draw',
          said: 'Both sides went down together.',
        };
      // Still being fought, so there is no verdict to give
      case null:
      default:
        return null;
    }
  };

  /**
   * Whether the signed-in player fought in this battle. A spectator
   * — anyone who walked in on a raid already under way — watches the
   * same deterministic fight but settles nothing and is owed nothing
   */
  const fought = (): boolean => {
    const user = auth.user();

    return user != null && record()?.players.includes(user.uid) === true;
  };

  /**
   * Walking out of a grunt's fight concedes it: the loss is stamped
   * and the party's aftermath written on the way out. Nothing else
   * ever could — the fight lives on a stop the player may never walk
   * back to, and an Unfinished battle holds its stop until the window
   * rolls. A raid is left freely (the lobby restages, and the fight
   * may be someone else's to finish), and a fight that already
   * settled is the recording effect's to write
   */
  const concede = (): void => {
    const loaded = record();
    const built = instance();
    const user = auth.user();

    if (
      props.active.replay ||
      recorded() ||
      outcome() != null ||
      loaded == null ||
      getBattleKind(loaded) !== BattleKind.Npc ||
      !fought()
    ) {
      return;
    }
    setRecorded(true);

    // Collected before the engine is torn down; the writes then run
    // behind the teardown. Aftermath first — stamping the outcome
    // frees the party, and a freed pokemon can have its berry pulled
    // back
    const aftermath = built != null && user != null ? collectAftermath(built, user.uid) : [];

    (async () => {
      if (aftermath.length > 0) {
        await recordAftermath(props.active.id, aftermath);
      }
      await finishBattle(props.active.id, BattleOutcome.Lost);
    })().catch(() => {
      // Leaving is not a moment to hold the player in; if the write
      // never lands, the battle lock's own timeout frees the party
    });
  };

  /**
   * Out of the fight and back into the world, in one batch.
   *
   * The lobby goes with the battle, because a lobby watching its own
   * record reopens the fight the moment that record names one. So does
   * whatever panel was open when the fight began: leaving a battle
   * means standing in the overworld, not back in the dialog Start was
   * pressed in
   */
  const leave = (): void => {
    concede();
    instance()?.battle.end();
    batch(() => {
      // The instance is deliberately **not** cleared here. Unsetting
      // the battle takes this whole view down, and its own cleanup
      // ends the engine; clearing it first only empties the accessor
      // that the canvas and the card rows are still reading from while
      // they are being disposed
      setCounting(null);
      game.setRaid(null);
      game.setDialog(GameDialog.None);
      game.setBattle(null);
    });
  };

  /**
   * What leaving now would mean, for the confirmation to say: a
   * grunt's fight is conceded, anything else just goes on unfinished
   */
  const leavingSaid = (): string => {
    const loaded = record();

    if (loaded != null && getBattleKind(loaded) === BattleKind.Npc) {
      return 'Walking out concedes the fight: it counts as a loss, and what the party spent stays spent.';
    }
    return 'The party stays locked to the fight until it settles or times out. Walk back into the lair to rejoin it.';
  };

  /**
   * The Leave press. Walking out of a fight still being fought is
   * asked about first — for a grunt's fight it concedes — while a
   * replay, a spectator or a finished field is left without ceremony
   */
  const askToLeave = (): void => {
    if (props.active.replay || outcome() != null || record() == null || !fought()) {
      leave();
      return;
    }
    setLeaving(true);
  };

  // A raid battle is recorded once, by whichever fighter sees it end
  createEffect(() => {
    const result = outcome();
    const raidId = props.active.raid;

    if (props.active.replay || !fought() || recorded() || result == null) {
      return;
    }

    const won = result === 'won';
    const stop = props.active.rocket;
    const seat = props.active.seat;
    const built = instance();
    const user = auth.user();

    setRecorded(true);
    (async () => {
      // What the fight cost is owed whichever way it went: a berry
      // eaten against a boss that survived is still eaten, and health
      // it took off is still gone. Only this player's own catches are
      // reported, and the aftermath is written before the outcome is
      // stamped — stamping it frees the party, and a freed pokemon
      // can have its berry pulled back
      // A fight between players settles for the gym seat's challenger
      // and nobody else: their party was really there. Every other
      // player-versus-player fight settles nothing, and the server
      // refuses one anyway, so this only spares the round trip
      if (
        built != null &&
        user != null &&
        (built.battle.mode !== BattleModes.PvP || seat != null)
      ) {
        const aftermath = collectAftermath(built, user.uid);

        if (aftermath.length > 0) {
          await recordAftermath(props.active.id, aftermath);
        }
      }

      await finishBattle(props.active.id, won ? BattleOutcome.Won : BattleOutcome.Lost);

      if (won && raidId != null) {
        // The legendary waits on the raid itself, so it can be
        // collected here or from the battle history later
        await clearRaid(raidId);
        game.setReward({ raid: raidId });
      }
      // A beaten grunt keeps what they owe on their own stop, so it
      // is collected back in the overworld — and only a win closes
      // the stop; losing leaves them standing there
      if (won && stop != null) {
        game.setReward({ stop });
      }
      // A seat is settled either way: the win takes it, and the loss
      // is one more challenge its holder turned away
      if (seat != null) {
        game.setReward({ seat });
      }
    })().catch((caught: unknown) => {
      setStatus(caught instanceof Error ? caught.message : String(caught));
    });
  });

  return (
    <section class="flex h-full w-full flex-col overflow-hidden">
      {/* The field is the page. What each pokemon is — its level, its
          moves, what it carries, what is stuck to it — is a card that
          comes up over whichever one the pointer is on, rather than a
          row of them along each edge: a row lying over each end of the
          field covered exactly the pokemon a player was watching */}
      <div class="relative min-h-0 grow">
        <Show
          when={instance()}
          fallback={
            <div class="flex h-full w-full items-center justify-center">
              <Note>Building the battle…</Note>
            </div>
          }
        >
          {(built) => (
            <BattleField
              battle={built().battle}
              player={auth.user()?.uid ?? ''}
              onPick={(unit) => {
                // A pokemon that stands for no record — the raid boss,
                // and anything a demo or a test builds outright — has
                // no sheet to open
                if (unit.caught !== '') {
                  setOpened(unit);
                }
              }}
              onReady={() => {
                // Once. A canvas that reported twice would start the
                // countdown over the top of itself
                if (!drawable()) {
                  setDrawable(true);
                  setCounting(COUNTDOWN);
                }
              }}
            />
          )}
        </Show>

        {/* What the fight is, in the corner it is least in the way */}
        <div class="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
          <span
            class="rounded-full border-2 border-tide bg-paper/95 px-3 py-1 text-sm font-bold
            shadow-pop backdrop-blur-sm"
          >
            {props.active.replay ? 'Replay' : title()}
          </span>
          <Show when={props.active.replay}>
            <Badge>Awards nothing</Badge>
          </Show>
        </div>

        {/* And the way out, in the other one */}
        <div class="absolute top-3 right-3">
          <Button tone="primary" onClick={askToLeave}>
            Leave
          </Button>
        </div>

        {/* Three seconds to look at the field before anything happens
            in it. It is drawn over the middle of the fight because the
            fight is what it is counting down to */}
        <Show when={counting()}>
          {(left) => (
            <div
              class="pointer-events-none absolute inset-0 flex items-center justify-center"
              role="status"
            >
              <span
                class="rounded-full border-4 border-tide bg-paper/90 px-6 py-3 text-4xl
                  font-extrabold tabular-nums shadow-pop backdrop-blur-sm"
              >
                {left()}
              </span>
            </div>
          )}
        </Show>

        {/* Anything that went wrong writing the result down. It is not
            the verdict — that has a dialog of its own — so it sits out
            of the way rather than under the field */}
        <div
          class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3
          text-center"
        >
          <Status message={status()} />
        </div>
      </div>

      {/* Pressing a pokemon opens its sheet. Anybody else's — a
          teammate's in a raid, the other trainer's in a stop — is
          shown and nothing more, since none of it is the reader's to
          change */}
      <CatchDialog
        player={auth.user()?.uid ?? ''}
        catchId={opened()?.caught ?? null}
        readOnly={opened() != null && opened()?.team.player !== auth.user()?.uid}
        onClose={() => {
          setOpened(null);
        }}
      />

      {/* Walking out of a live fight is confirmed first, because it
          cannot be walked back: a grunt's fight is conceded on the
          way out, and a raid holds the party until it settles */}
      <Dialog
        isOpen={leaving()}
        onClose={() => {
          setLeaving(false);
        }}
        title="Leave the battle?"
        description="Whether to walk out of a fight that is still going."
        terse
      >
        <p class="text-center">{leavingSaid()}</p>
        <DialogActions>
          <Button
            onClick={() => {
              setLeaving(false);
            }}
          >
            Keep fighting
          </Button>
          <Button tone="primary" onClick={leave}>
            Leave anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* A fight that has been won or lost says so rather than leaving
          a line of text under a field that is no longer moving. It
          opens the moment the engine settles it, and closing it leaves
          the player on the finished field rather than walking them out
          — the prize is already recorded either way */}
      <VerdictDialog
        verdict={verdict}
        dismissed={dismissed()}
        onDismiss={() => {
          setDismissed(true);
        }}
        raiding={raiding()}
        sides={sides()}
        names={names}
        player={auth.user()?.uid ?? ''}
        rocket={props.active.rocket != null}
        teams={raiding() ? (record()?.teams ?? null) : null}
        shares={shares()}
        replay={props.active.replay}
        onLeave={leave}
      />
    </section>
  );
}
