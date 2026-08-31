import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import type Battle from '../../battle/core';
import BattleField from '../../components/battle/BattleField';
import BattleParty from '../../components/battle/BattleParty';
import { Badge, Button, Meta, Note, Switch } from '../../components/styled';
import { DEMO_TEAMS, DEMO_TEAM_SIZE, createDemoRaidTeams } from '../../overworld/demo-raid';
import {
  BOSS_ALLIANCE,
  PLAYER_ALLIANCE,
  type RaidBattle,
  createRaidBattle,
} from '../../overworld/raid';

/**
 * A raid to look at: a boss, five parties, and nothing else, staged
 * out of a seed. No session, no writes, no consequences.
 *
 * It runs the real engine on the real shapes, the same
 * `createRaidBattle` and `TeamSnapshotRecord` a lobby uses, because a
 * demo of something else would test nothing.
 *
 * The seed is in the URL, so a fight is a link and two people watch
 * the same frames
 */

/**
 * How often the readout re-reads the units. The battle runs on its
 * own frame timer; this is only how often the numbers under it catch
 * up
 */
const POLL_INTERVAL = 250;

/**
 * The fight a bare `/demo/raid` shows.
 *
 * A named default rather than a rolled one, because the page is
 * rendered on the server and hydrated on the client: rolling at
 * module scope would give the two a different fight and the hydration
 * would tear. Rolling happens on a press, which only ever happens on
 * the client
 */
const DEFAULT_SEED = 'poketerra';

/**
 * A fresh seed, short enough to read out of the address bar
 */
function rollSeed(): string {
  return Math.floor(Math.random() * 0xffff_ffff).toString(36);
}

/**
 * Whose cards to show in a demo nobody is signed in to: the first
 * party that went into the raid
 */
function firstParty(battle: Battle): string {
  for (const alliance of battle.alliances) {
    if (alliance.boss) {
      continue;
    }
    for (const team of alliance.teams) {
      if (team.player !== '') {
        return team.player;
      }
    }
  }
  return '';
}

export default function RaidDemo(): JSX.Element {
  // The seed lives in the URL rather than in a signal, so the fight
  // on screen is a link somebody else can open and watch the same
  // frames of
  const [params, setParams] = useSearchParams<{ seed?: string; shadow?: string }>();
  const seed = (): string => params.seed ?? DEFAULT_SEED;
  // The shadow raid, staged on request: it is the fight the field
  // paints a haze under, and nothing else on this page is a shadow
  const shadow = (): boolean => params.shadow === '1';
  const [built, setBuilt] = createSignal<RaidBattle | null>(null);
  const [revision, setRevision] = createSignal(0);

  createEffect(() => {
    const staged = createRaidBattle(`demo:${seed()}`, createDemoRaidTeams(seed(), shadow()));

    // Initialized but not started: the canvas starts it once it has
    // every sheet, the way a real fight waits
    staged.battle.initialize();
    setBuilt(staged);

    // A battle left running would keep ticking behind whatever
    // replaced it — a new seed, or the page being left
    onCleanup(() => {
      staged.battle.end();
    });
  });

  createEffect(() => {
    if (built() == null) {
      return;
    }

    const timer = setInterval(() => {
      setRevision((value) => value + 1);
    }, POLL_INTERVAL);

    onCleanup(() => {
      clearInterval(timer);
    });
  });

  /**
   * How it ended, once the engine says it has. The outcome mechanics
   * settle it when nothing can act any more; there is nobody here to
   * win it, so it is only reported
   */
  const outcome = (): string | null => {
    revision();

    const staged = built();

    if (staged == null || !staged.battle.settled) {
      return null;
    }
    if (staged.battle.winner === staged.alliances.get(BOSS_ALLIANCE)) {
      return 'The boss is still standing.';
    }
    if (staged.battle.winner === staged.alliances.get(PLAYER_ALLIANCE)) {
      return 'The parties took it down.';
    }
    return 'Nobody left standing.';
  };

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      <Title>Raid demo · Overwander</Title>

      {/* The way to another fight sits with the title rather than
          under the field: the field is as tall as a lobby is big, and
          a button below it is a button nobody scrolls to */}
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="grow">Raid demo</h1>
        <Badge>seed {seed()}</Badge>
        <Button
          tone="primary"
          onClick={() => {
            setParams({ seed: rollSeed() });
          }}
        >
          Roll another
        </Button>
      </div>

      <Note>
        One boss against {DEMO_TEAMS} parties of {DEMO_TEAM_SIZE}, rolled from the seed and fought
        by the same engine a real raid runs on. Nothing here is recorded, nothing is won, and nobody
        is charged — it is here so the battle mechanics and the sprite animations can be watched.
      </Note>

      <Switch
        label="Shadow raid"
        description="Stages the boss as a shadow, which is what the haze under it is drawn for."
        checked={shadow()}
        onChange={(on) => {
          setParams({ shadow: on ? '1' : undefined });
        }}
      />

      <Meta>The seed is in the address — the same one is the same fight, frame for frame.</Meta>

      {/* Keyed, and it has to be: the canvas and the readout both
          bind to the battle they were mounted with — they hang their
          listeners on it once and hold the roster they read from it —
          so a new seed needs new ones. Left unkeyed, rolling another
          fight ends the old battle and then goes on drawing it, which
          looks exactly like a demo that has frozen */}
      <Show keyed when={built()} fallback={<Note>Staging the raid…</Note>}>
        {(staged) => (
          <>
            {/* No party is the viewer's, so the canvas draws the
                fighting side at the bottom the way it does for anyone
                who walked in on a raid already under way */}
            {/* The canvas takes the room it is given, and on a page
                that is a column of prose it has to be given some: a
                height of "all of it" measured against a container of
                "as tall as its contents" is a field nought pixels
                high */}
            <div
              class="h-[60vh] w-full overflow-hidden rounded-panel border-4 border-tide
              shadow-pop"
            >
              {/* The same field the game plays on, cards and all:
                  hovering a pokemon reads it in full. Nothing is
                  opened by pressing one — a demo's pokemon stand for
                  no record, so there is no sheet behind them */}
              <BattleField
                battle={staged.battle}
                player=""
                onReady={() => {
                  staged.battle.start();
                }}
              />
            </div>
            {/* The demo has no signed-in player, so it stands in as
                the first party: the cards are about somebody's own
                pokemon, and here that is whoever went in first */}
            <BattleParty battle={staged.battle} player={firstParty(staged.battle)} />
          </>
        )}
      </Show>

      <Show when={outcome()}>{(said) => <p role="status">{said()}</p>}</Show>
    </main>
  );
}
