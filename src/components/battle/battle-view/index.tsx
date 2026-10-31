import { type JSX, Show, createResource, createSignal, onCleanup, onMount } from 'solid-js';
import type Unit from '../../../battle/unit';
import type { CandyEarned } from '../../../auth/battles';
import { useAuth } from '../../../auth/context';
import playEffect, { Effect } from '../../app/sound';
import { forTheGame } from '../../app/keys';
import createStoreSignal from '../../app/store-signal';
import { RaidKind, getRaidTitle } from '../../../auth/raids';
import { BattleModes } from '../../../battle/battle';
import BattleKind, { getBattleKind } from '../../../model/battle-kind';
import Npc from '../../../data/overworld/npc';
import createBattleWatch, { type Outcome } from '../../../game/battle/watch';
import BattleField from '../BattleField';
import BattleTopBar from '../BattleTopBar';
import CandySprite from '../../sprites/CandySprite';
import VerdictDialog from './VerdictDialog';
import { type Contribution, type SideSummary, readContributions, readSides } from './summary';
import CatchDialog from '../../catches/catch-dialog';
import { getFamilyName } from '../../../data/species';
import { Button, Dialog, DialogActions, Note, Status, useToast } from '../../styled';
import type { ActiveBattle, PendingReward, Spoils } from '../../app/game-context';
import { type Profile, getProfiles } from '../../../auth/profile';
import { m } from '../../../i18n/paraglide/messages.js';

export interface BattleViewProps {
  active: ActiveBattle;
  /** Out of the fight, to wherever the view was opened from */
  onLeave: () => void;
  /** A prize the settled fight left waiting to be collected */
  onReward: (reward: PendingReward) => void;
  /** What that prize came to, once claimed, for the summary to show */
  spoils?: () => Spoils | null;
}

/** How large a candy is drawn on the toast that says a fight paid it */
const CANDY_ART = 24;

/**
 * A battle, taking the whole page. The fight itself, from building it
 * to settling it, is `src/game/battle/watch.ts`; this draws it
 */

export default function BattleView(props: BattleViewProps): JSX.Element {
  const auth = useAuth();
  const toast = useToast();

  /**
   * What the team brought home for having fought: a pile a family,
   * each drawn as the family's own candy, one line per pile since which
   * pile grew is the thing being reported
   */
  const sayCandy = (earned: CandyEarned[]): void => {
    for (const pile of earned) {
      toast.push({
        title: m.battle_candy_earned({ count: pile.count, family: getFamilyName(pile.family) }),
        art: () => <CandySprite family={pile.family} size={CANDY_ART} label="" />,
        tone: 'leaf',
      });
    }
  };

  const watch = createBattleWatch(props.active, () => auth.user()?.uid ?? null, {
    // Over the count rather than after it: the fanfare is what the
    // three seconds are for
    started: () => {
      playEffect(Effect.BattleStart);
    },
    // Said the moment it settles, rather than when the dialog over it
    // is read: the fight is what the player is watching
    settled: (result) => {
      if (result === 'won') {
        playEffect(Effect.BattleWon);
      } else if (result === 'lost') {
        playEffect(Effect.BattleLost);
      } else {
        playEffect(Effect.BattleDraw);
      }
    },
    reward: (reward) => {
      props.onReward(reward);
    },
    candyInPassing: sayCandy,
  });

  onMount(() => {
    onCleanup(watch.start());
  });

  const record = createStoreSignal(watch.record);
  const instance = createStoreSignal(watch.instance);
  const staged = createStoreSignal(watch.raid);
  const revision = createStoreSignal(watch.revision);
  const counting = createStoreSignal(watch.counting);
  const status = createStoreSignal(watch.status);
  const candy = createStoreSignal(watch.candy);
  // Whether the player has closed the verdict. Once, per battle: the
  // view is rebuilt for the next one, so nothing has to reset it
  const [dismissed, setDismissed] = createSignal(false);
  // Whether the player is being asked to confirm walking out of a live fight
  const [leaving, setLeaving] = createSignal(false);
  /**
   * The catch sheet a pressed pokemon opened, if it stands for a
   * record at all: a raid boss belongs to nobody and has none
   */
  const [opened, setOpened] = createSignal<Unit | null>(null);
  const [speed, setSpeed] = createSignal(1);

  const outcome = (): Outcome | null => {
    revision();
    instance();
    return watch.outcome();
  };

  const lair = (): string | null => {
    const found = staged();

    return found == null ? null : getRaidTitle(found);
  };

  /** A Max Raid's name already says what the fight is, so it goes up alone */
  const standsAlone = (): boolean => staged()?.kind === RaidKind.Max;

  const opponent = (): { name: string; sprite: string } | null => {
    record();
    return watch.opponent();
  };

  const title = (): string => {
    if (props.active.stop != null) {
      // A stop is not only a grunt: a duelling trainer, a gym leader
      // and the Champion are all fought from one, and each was named
      // on the way in
      return opponent()?.name ?? m.ow_team_rocket();
    }
    if (instance()?.battle.mode === BattleModes.PvP) {
      return props.active.seat == null ? m.battle_title_battle() : m.battle_title_gym_seat();
    }

    const named = lair();

    if (named == null) {
      return m.battle_title_raid();
    }
    return standsAlone() ? named : m.battle_title_raid_named({ name: named });
  };

  /**
   * What a win says. A replay settles nothing, so it only reports
   * what happened; a fight that counted says where the prize went
   */
  const victory = (): string => {
    if (props.active.replay) {
      return m.battle_victory_replay();
    }
    if (props.active.stop != null) {
      // Only a grunt leaves the pokemon they were beaten with; everyone
      // else keeps their party and pays a purse
      if (props.active.npc === Npc.Trainer) {
        return m.battle_victory_trainer({ name: opponent()?.name ?? m.battle_the_trainer() });
      }
      return m.battle_victory_grunt({ name: opponent()?.name ?? m.battle_the_grunt() });
    }
    // A fight between players pays nothing on purpose, so what a win
    // says is the win itself
    if (instance()?.battle.mode === BattleModes.PvP && props.active.seat == null) {
      return m.battle_victory_pvp();
    }
    return m.battle_victory_raid();
  };

  /** The fight's contributions and its sides, both only once the battle has settled */
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
      const unique = new Set<string>();

      for (const row of contributions()) {
        if (row.player !== '') {
          unique.add(row.player);
        }
      }
      return unique.size > 0 ? [...unique].sort().join(',') : null;
    },
    async (key): Promise<Map<string, Profile>> => getProfiles(key.split(',')),
  );

  /** Whether this fight ranks whole teams rather than single pokemon */
  const raiding = (): boolean => instance()?.battle.mode === BattleModes.Raid;

  const verdict = (): { title: string; said: string } | null => {
    switch (outcome()) {
      case 'won':
        return { title: m.battle_victory(), said: victory() };
      case 'lost':
        return { title: m.battle_defeat(), said: m.battle_defeat_said() };
      case 'draw':
        return {
          title: m.battle_draw(),
          said: m.battle_draw_said(),
        };
      // Still being fought, so there is no verdict to give
      case null:
      default:
        return null;
    }
  };

  /** Out of the fight, in one batch; where it goes is the opener's to say */
  const leave = (): void => {
    watch.leave();
    // The battle is deliberately not cleared here: unsetting it takes
    // this whole view down, and the canvas is still reading it while
    // it is disposed
    props.onLeave();
  };

  /**
   * What leaving now would mean, for the confirmation to say: a
   * grunt's fight is conceded, anything else just goes on unfinished
   */
  const leavingSaid = (): string => {
    const loaded = record();

    if (loaded != null && getBattleKind(loaded) === BattleKind.Npc) {
      return m.battle_leave_concedes();
    }
    return m.battle_leave_locked();
  };

  /**
   * The Leave press. Walking out of a fight still being fought is
   * asked about first, while a replay, a spectator or a finished field
   * is left without ceremony
   */
  const askToLeave = (): void => {
    if (watch.leaveNeedsAsking()) {
      setLeaving(true);
      return;
    }
    leave();
  };

  /**
   * Escape leaves, the way the button does, and only while nothing on
   * the page has the keyboard: a dialog open over the fight answers its
   * own Escape by closing
   */
  onMount(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !forTheGame(event)) {
        return;
      }
      event.preventDefault();
      askToLeave();
    };

    window.addEventListener('keydown', onKey);
    onCleanup(() => {
      window.removeEventListener('keydown', onKey);
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
              <Note>{m.battle_building()}</Note>
            </div>
          }
        >
          {(built) => (
            <BattleField
              battle={built().battle}
              biome={record()?.biome}
              player={auth.user()?.uid ?? ''}
              onPick={(unit) => {
                // A pokemon that stands for no record — the raid boss,
                // and anything a demo or a test builds outright — has
                // no sheet to open
                if (unit.caught !== '') {
                  setOpened(unit);
                }
              }}
              onReady={watch.ready}
            />
          )}
        </Show>

        {/* What the fight is, how each side stands, and the way out */}
        <Show when={instance()}>
          {(built) => (
            <BattleTopBar
              battle={built().battle}
              player={auth.user()?.uid ?? ''}
              title={title()}
              replay={props.active.replay}
              speed={speed()}
              onSpeed={
                props.active.replay
                  ? (next) => {
                      setSpeed(next);
                      watch.setSpeed(next);
                    }
                  : undefined
              }
              onLeave={askToLeave}
            />
          )}
        </Show>

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
        title={m.battle_leave_title()}
        description={m.battle_leave_description()}
        terse
      >
        <p class="text-center">{leavingSaid()}</p>
        <DialogActions>
          <Button tone="primary" onClick={leave}>
            {m.battle_leave_anyway()}
          </Button>
          <Button
            onClick={() => {
              setLeaving(false);
            }}
          >
            {m.battle_keep_fighting()}
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
        outcome={outcome()}
        spoils={props.spoils?.() ?? null}
        candy={candy()}
        dismissed={dismissed()}
        onDismiss={() => {
          setDismissed(true);
        }}
        raiding={raiding()}
        sides={sides()}
        names={names}
        player={auth.user()?.uid ?? ''}
        opponent={opponent()}
        teams={raiding() ? (record()?.teams ?? null) : null}
        replay={props.active.replay}
        onLeave={leave}
      />
    </section>
  );
}
