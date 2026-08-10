import {
  For,
  type JSX,
  Show,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
} from 'solid-js';
import { BattleOutcome, finishBattle, getBattle, listBattleTeams } from '../auth/battles';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, clearRaid, getRaid } from '../auth/raids';
import { getSpeciesData } from '../data/species';
import { type RaidBattle, createRaidBattle, isAllianceDown } from '../overworld/raid';
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
  const [record] = createResource(() => props.active.id, getBattle);
  const [instance, setInstance] = createSignal<RaidBattle | null>(null);
  const [status, setStatus] = createSignal<string | null>(null);
  // The units mutate in place, so the view re-reads them on a timer
  const [revision, setRevision] = createSignal(0);
  const [settled, setSettled] = createSignal(false);

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

        const built = createRaidBattle(props.active.id, teams);

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

  const bossDown = (): boolean => {
    revision();
    const built = instance();

    return built != null && isAllianceDown(built.units.get(BOSS_ALLIANCE) ?? []);
  };

  const partyDown = (): boolean => {
    revision();
    const built = instance();

    return built != null && isAllianceDown(built.units.get(PLAYER_ALLIANCE) ?? []);
  };

  const leave = (): void => {
    instance()?.battle.end();
    setInstance(null);
    game.setBattle(null);
  };

  // A raid battle is settled once, by whoever is watching it end
  createEffect(() => {
    const won = bossDown();
    const lost = partyDown();
    const raidId = props.active.raid;

    if (props.active.replay || settled() || (!won && !lost)) {
      return;
    }
    setSettled(true);
    (async () => {
      await finishBattle(props.active.id, won ? BattleOutcome.Won : BattleOutcome.Lost);

      if (won && raidId != null) {
        const raid = await getRaid(raidId);

        await clearRaid(raidId);
        // The legendary is met back in the overworld, where the
        // player is standing
        if (raid != null) {
          game.setReward({ raid: raidId, species: raid.species });
        }
      }
    })().catch((caught: unknown) => {
      setStatus(caught instanceof Error ? caught.message : String(caught));
    });
  });

  return (
    <section>
      <h1>{props.active.replay ? 'Replay' : 'Raid Battle'}</h1>
      <Show when={props.active.replay}>
        <p>A replay awards nothing — the result already stands.</p>
      </Show>

      <Show when={instance()} fallback={<p>Building the battle…</p>}>
        {(built) => (
          <For each={[...built().units]}>
            {([alliance, units]) => (
              <>
                <h2>{alliance === BOSS_ALLIANCE ? 'Boss' : 'Party'}</h2>
                <ul>
                  <For each={units}>
                    {(unit) => (
                      <li>
                        {getSpeciesData(unit.species).name} · Lv. {unit.level} ·{' '}
                        {(() => {
                          revision();
                          return Math.max(0, unit.health);
                        })()}{' '}
                        HP
                      </li>
                    )}
                  </For>
                </ul>
              </>
            )}
          </For>
        )}
      </Show>

      <Show when={bossDown()}>
        <p role="status">
          {props.active.replay
            ? 'The boss went down.'
            : 'The raid boss is down — it is waiting in the overworld.'}
        </p>
      </Show>
      <Show when={partyDown()}>
        <p role="status">The party fainted.</p>
      </Show>
      <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>

      <p>
        <button
          type="button"
          onClick={() => {
            const collect = !props.active.replay && bossDown();

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
