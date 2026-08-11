import { type JSX, Show, createEffect, createSignal, from, onCleanup } from 'solid-js';
import {
  BattleOutcome,
  type BattleRecord,
  finishBattle,
  listBattleTeams,
  recordAftermath,
  watchBattle,
} from '../auth/battles';
import { useAuth } from '../auth/context';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, clearRaid } from '../auth/raids';
import { type RaidBattle, collectAftermath, createRaidBattle } from '../overworld/raid';
import type Alliance from '../battle/alliance';
import { createRocketBattle } from '../overworld/rocket';
import BattleCanvas from './BattleCanvas';
import BattleField from './BattleField';
import { type ActiveBattle, GameTab, useGame } from './game-context';

/**
 * How often the view re-reads the units; the battle itself runs on
 * its own frame timer
 */
const POLL_INTERVAL = 250;

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
        // under raid rules, with the boss side marked
        const built = fighting
          ? createRocketBattle(props.active.id, teams)
          : createRaidBattle(props.active.id, teams);

        built.battle.initialize();
        built.battle.start();
        setInstance(built);
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });

    onCleanup(() => {
      cancelled = true;
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
   * What the fight is called: a raid names itself, a stop names the
   * grunt standing in the way
   */
  const title = (): string => (props.active.rocket == null ? 'Raid Battle' : 'Team Rocket');

  /**
   * What to call a side. A raid has a boss to name; a trainer fight
   * has an opponent, which is whichever side is not the player's
   */
  const sideOf = (built: RaidBattle, alliance: Alliance): string => {
    if (alliance.boss) {
      return 'Boss';
    }
    if (props.active.rocket != null && alliance !== built.alliances.get(PLAYER_ALLIANCE)) {
      return 'Team Rocket';
    }
    return 'Party';
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

  const leave = (): void => {
    instance()?.battle.end();
    setInstance(null);
    game.setBattle(null);
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
    <section>
      <h1>{props.active.replay ? 'Replay' : title()}</h1>
      <Show when={props.active.replay}>
        <p>A replay awards nothing — the result already stands.</p>
      </Show>

      <Show when={instance()} fallback={<p>Building the battle…</p>}>
        {(built) => (
          <>
            {/* The field at a glance — who is up, what is coming —
                over the readout that says the rest of it */}
            <BattleCanvas battle={built().battle} player={auth.user()?.uid ?? ''} />
            <BattleField battle={built().battle} label={(alliance) => sideOf(built(), alliance)} />
          </>
        )}
      </Show>

      <Show when={outcome() === 'won'}>
        <p role="status">{victory()}</p>
      </Show>
      <Show when={outcome() === 'lost'}>
        <p role="status">The party fainted.</p>
      </Show>
      <Show when={outcome() === 'draw'}>
        <p role="status">The battle ground to a halt with nobody able to act.</p>
      </Show>
      <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>

      <p>
        <button
          type="button"
          onClick={() => {
            const collect = !props.active.replay && outcome() === 'won';

            leave();
            // A cleared raid sends the player back to where the
            // legendary is standing
            game.setTab(collect ? GameTab.Overworld : game.tab());
          }}
        >
          {props.active.replay ? 'Exit replay' : 'Leave battle'}
        </button>
      </p>
    </section>
  );
}
