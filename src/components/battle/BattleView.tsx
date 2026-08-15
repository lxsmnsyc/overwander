import { type JSX, Show, batch, createEffect, createSignal, from, onCleanup } from 'solid-js';
import {
  BattleOutcome,
  type BattleRecord,
  finishBattle,
  listBattleTeams,
  recordAftermath,
  watchBattle,
} from '../../auth/battles';
import { useAuth } from '../../auth/context';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, clearRaid, getRaid, getRaidTitle } from '../../auth/raids';
import { type RaidBattle, collectAftermath, createRaidBattle } from '../../overworld/raid';
import { createRocketBattle } from '../../overworld/rocket';
import BattleCanvas from './BattleCanvas';
import BattleParty from './BattleParty';
import { Badge, Button, Dialog, DialogActions, Note, Status } from '../styled';
import { type ActiveBattle, GameDialog, useGame } from '../app/game-context';

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
  /**
   * Seconds left before the fight starts, or null once it has
   */
  const [counting, setCounting] = createSignal<number | null>(null);
  /**
   * Whether the canvas has every pokemon's sheet in hand. Nothing is
   * counted down and nothing is started until it does
   */
  const [drawable, setDrawable] = createSignal(false);

  createEffect(() => {
    const loaded = record();

    if (loaded == null || instance() != null) {
      return;
    }

    const fighting = props.active.rocket != null;
    let cancelled = false;

    listBattleTeams(loaded)
      .then((teams) => {
        if (cancelled) {
          return;
        }

        // A stop's fight is an ordinary trainer battle; a raid runs
        // under raid rules, with the boss side marked. What either
        // allows a unit to bring is the record's, so a fight replays
        // under the rules it was fought under
        const built = fighting
          ? createRocketBattle(props.active.id, teams, loaded.limits)
          : createRaidBattle(props.active.id, teams, loaded.limits);

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
   * Out of the fight and back into the world.
   *
   * All of it goes at once, in one batch. The lobby is let go of as
   * well as the battle — the lobby watches its own record and opens
   * the battle the moment that record names one, so a player still
   * standing in a started lobby was put straight back into the fight
   * they had just left — and so is whatever panel was open when the
   * fight began.
   *
   * That last part is the difference between Leave working and Leave
   * *looking* like it did nothing. The battle was started from inside
   * the raids dialog, so leaving it used to put that dialog back on
   * screen: the panel a player pressed Start in reappeared over the
   * world, which reads as the button having done nothing at all.
   * Leaving a battle means being in the overworld, so that is where it
   * puts them
   */
  const leave = (): void => {
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
   * Whether the signed-in player fought in this battle. A spectator
   * — anyone who walked in on a raid already under way — watches the
   * same deterministic fight but settles nothing and is owed nothing
   */
  const fought = (): boolean => {
    const user = auth.user();

    return user != null && record()?.players.includes(user.uid) === true;
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
      if (built != null && user != null) {
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
    })().catch((caught: unknown) => {
      setStatus(caught instanceof Error ? caught.message : String(caught));
    });
  });

  return (
    <section class="flex h-full w-full flex-col overflow-hidden">
      {/* The field is **between** the two sets of cards rather than
          under both of them.

          It used to take the whole page with the cards floating over
          it, which cost the fight the two strips it most needed: a
          raid boss is drawn at the top of the field and the player's
          own row at the bottom, so a card row lying over each end
          covered exactly the pokemon a player was watching. Sandwiched,
          the canvas gets whatever is left and the sprites are never
          behind anything */}
      {/* In a fight between two trainers, the other side is at the top,
          on their end of the field. A raid gets none of this: the boss
          is one pokemon drawn twice the size of everything else and
          needs no card, and a lobby of strangers' parties is a wall of
          them */}
      <Show when={props.active.rocket == null ? null : instance()}>
        {(built) => (
          <div class="shrink-0 overflow-x-auto px-3 pt-3">
            <BattleParty battle={built().battle} player={auth.user()?.uid ?? ''} theirs />
          </div>
        )}
      </Show>

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
            <BattleCanvas
              battle={built().battle}
              player={auth.user()?.uid ?? ''}
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
          <Button tone="primary" onClick={leave}>
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

      {/* The player's own pokemon along the bottom: what each of them
          has left, and which of their moves are off cooldown */}
      <Show when={instance()}>
        {(built) => (
          <div class="shrink-0 overflow-x-auto px-3 pb-3">
            <BattleParty battle={built().battle} player={auth.user()?.uid ?? ''} />
          </div>
        )}
      </Show>

      {/* A fight that has been won or lost says so rather than leaving
          a line of text under a field that is no longer moving. It
          opens the moment the engine settles it, and closing it leaves
          the player on the finished field rather than walking them out
          — the prize is already recorded either way */}
      <Show when={verdict()}>
        {(said) => (
          <Dialog
            isOpen={!dismissed()}
            onClose={() => {
              setDismissed(true);
            }}
            title={said().title}
            description={said().said}
          >
            {/* Centred, like everything else in the panel. The
                verdict is one line about what happened and two things
                to do about it, and buttons pushed to the right of a
                centred sentence read as belonging to something else */}
            <DialogActions center>
              <Button
                onClick={() => {
                  setDismissed(true);
                }}
              >
                Stay and look
              </Button>
              <Button tone="primary" onClick={leave}>
                {props.active.replay ? 'Exit replay' : 'Leave battle'}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Show>
    </section>
  );
}
