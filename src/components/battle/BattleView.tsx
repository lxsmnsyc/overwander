import {
  For,
  type JSX,
  Show,
  batch,
  createEffect,
  createResource,
  createSignal,
  from,
  onCleanup,
} from 'solid-js';
import type Team from '../../battle/team';
import type Unit from '../../battle/unit';
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
import { BattleModes } from '../../battle/core';
import BattleKind, { getBattleKind } from '../../auth/battle-kind';
import { type RaidBattle, collectAftermath, createRaidBattle } from '../../overworld/raid';
import { createTrainerBattle } from '../../overworld/rocket';
import BattleField from './BattleField';
import TeamsPreview from './TeamsPreview';
import CatchDialog from '../catches/CatchDialog';
import { Badge, Button, Dialog, DialogActions, Note, Status } from '../styled';
import { type ActiveBattle, GameDialog, useGame } from '../app/game-context';
import { type Profile, getProfiles } from '../../auth/profile';
import PlayerPlate from '../profile/PlayerPlate';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { getSpeciesData } from '../../data/species';
import Npc, { NPC_NAMES } from '../../data/overworld/npc';
import type { Species } from '../../data/ids/species';
import { SpriteAnim } from '../../data/ids/sprite-anims';

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
   * One line of the summary: who, and how much of the other side's
   * health they took
   */
  interface Contribution {
    label: string;
    player: string;
    dealt: number;
  }

  /**
   * One side of a player or trainer fight: whose it was, what the
   * whole team took off the other side, and each pokemon's own share
   */
  interface SideSummary {
    player: string;
    lead: Species;
    dealt: number;
    units: { species: Species; dealt: number }[];
  }

  /**
   * The fight's contributions, largest first. A raid ranks whole
   * teams — the boss included, since how hard it hit back is part of
   * the story; player and npc fights are small enough to rank every
   * unit on its own
   */
  const contributions = (): Contribution[] => {
    revision();
    const built = instance();

    if (built == null || !built.battle.settled) {
      return [];
    }

    const rows: Contribution[] = [];

    if (built.battle.mode === BattleModes.Raid) {
      const teams = new Map<Team, number>();

      for (const fielded of built.units.values()) {
        for (const unit of fielded) {
          teams.set(unit.team, (teams.get(unit.team) ?? 0) + unit.dealt);
        }
      }
      for (const [team, dealt] of teams) {
        const lead = [...team.units].at(0);

        rows.push({
          // A side no player owns is named for what led it out
          label: team.player === '' && lead != null ? getSpeciesData(lead.species).name : '',
          player: team.player,
          dealt,
        });
      }
    } else {
      for (const fielded of built.units.values()) {
        for (const unit of fielded) {
          rows.push({
            label: getSpeciesData(unit.species).name,
            player: unit.team.player,
            dealt: unit.dealt,
          });
        }
      }
    }
    return rows.sort((one, other) => other.dealt - one.dealt);
  };

  /**
   * The fight by sides, for the summary of a player or trainer
   * battle: each team under its owner, largest total first, each
   * pokemon under its team, largest share first
   */
  const sides = (): SideSummary[] => {
    revision();
    const built = instance();

    if (built == null || !built.battle.settled) {
      return [];
    }

    const teams = new Map<Team, SideSummary>();

    for (const fielded of built.units.values()) {
      for (const unit of fielded) {
        let side = teams.get(unit.team);

        if (side == null) {
          side = { player: unit.team.player, lead: unit.species, dealt: 0, units: [] };
          teams.set(unit.team, side);
        }
        side.dealt += unit.dealt;
        side.units.push({ species: unit.species, dealt: unit.dealt });
      }
    }
    return [...teams.values()]
      .map((side) => ({
        ...side,
        units: side.units.sort((one, other) => other.dealt - one.dealt),
      }))
      .sort((one, other) => other.dealt - one.dealt);
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
   * What a side's header calls its owner. The reader is "You"; a side
   * nobody owns is the grunt where a grunt was fought, and otherwise
   * whatever led it out
   */
  const sideName = (side: SideSummary): string => {
    if (side.player === '') {
      return props.active.rocket == null
        ? getSpeciesData(side.lead).name
        : NPC_NAMES[Npc.RocketGrunt];
    }
    if (side.player === auth.user()?.uid) {
      return 'You';
    }
    return names()?.get(side.player)?.nickname ?? 'A trainer';
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
   * Out of the fight and back into the world, in one batch.
   *
   * The lobby goes with the battle, because a lobby watching its own
   * record reopens the fight the moment that record names one. So does
   * whatever panel was open when the fight began: leaving a battle
   * means standing in the overworld, not back in the dialog Start was
   * pressed in
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
      // A fight between players settles nothing; the server refuses
      // one anyway, so this only spares the round trip
      if (built != null && user != null && built.battle.mode !== BattleModes.PvP) {
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
            terse
          >
            {/* What happened, in the panel rather than on the bar. The
                bar carries the word — Victory, Defeat — and a sentence
                set under it in the header's own smaller type reads as
                a caption to the title rather than as the news */}
            <p class="text-center">{said().said}</p>

            {/* Who did what, side by side. Each team stands under its
                owner — the face, the name and the team's whole take —
                with each pokemon's own share listed beneath. A raid
                says all of this on the team list below instead */}
            <Show when={!raiding() && sides().length > 0}>
              <div class="flex flex-col gap-3">
                <For each={sides()}>
                  {(side) => (
                    <section class="flex flex-col gap-1">
                      <div class="flex items-center justify-between gap-4">
                        <PlayerPlate
                          name={sideName(side)}
                          avatar={names()?.get(side.player)?.avatar ?? null}
                        />
                        <span class="text-sm text-muted">
                          {Math.round(side.dealt).toLocaleString()} damage
                        </span>
                      </div>
                      <ul class="flex list-none flex-col gap-0.5 pl-3">
                        <For each={side.units}>
                          {(unit) => (
                            <li class="flex items-center justify-between gap-4">
                              <span class="flex items-center gap-1.5">
                                {/* Fitted to one square cell, the way a
                                    box square fits its sprite, so every
                                    row's picture is the same size */}
                                <span class="relative size-8 shrink-0">
                                  <span class="absolute inset-0.5 flex items-center justify-center">
                                    <AnimatedSprite
                                      species={unit.species}
                                      animation={SpriteAnim.Idle}
                                      direction="DownLeft"
                                      label={getSpeciesData(unit.species).name}
                                      fill
                                    />
                                  </span>
                                </span>
                                {getSpeciesData(unit.species).name}
                              </span>
                              <span class="text-sm text-muted">
                                {Math.round(unit.dealt).toLocaleString()} damage
                              </span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </section>
                  )}
                </For>
              </div>
            </Show>

            {/* The teams as they were frozen for this fight, each
                player's face and name beside what they fielded and
                the share of the damage that was theirs. Raids only:
                a trainer fight already said all of this side by side
                above, and a demo battle stands on no record */}
            <Show when={raiding() ? record() : null}>
              {(stamped) => (
                <TeamsPreview
                  teams={stamped().teams}
                  player={auth.user()?.uid ?? ''}
                  dealt={shares()}
                />
              )}
            </Show>

            {/* Centred, like everything else in the panel. The
                verdict is one line about what happened and two things
                to do about it, and buttons pushed to the right of a
                centred sentence read as belonging to something else */}
            <DialogActions>
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
