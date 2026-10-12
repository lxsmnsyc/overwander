import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import type Battle from '../../battle/core';
import BattleField from '../../components/battle/BattleField';
import BattleParty from '../../components/battle/BattleParty';
import BattleTopBar from '../../components/battle/BattleTopBar';
import BiomePicker, { biomeFrom } from './BiomePicker';
import { Badge, Button, Meta, Note, Select, Switch } from '../../components/styled';
import type { Species } from '../../data/ids/species';
import { Stats } from '../../data/constants/stats';
import { EffectType, MoveTargetType } from '../../battle/events';
import { NOBLE_THRESHOLDS } from '../../battle/abilities/noble';
import { Statuses } from '../../data/ids/status';
import { FRENZY_MOVES, getNobleBurst } from '../../data/moves/frenzy-moves';
import { getMoveData } from '../../data/moves';
import { getSpeciesData } from '../../data/species';
import { CANON_NOBLES } from '../../data/overworld/nobles';
import { DEMO_TEAMS, DEMO_TEAM_SIZE, createDemoRaidTeams } from '../../overworld/demo-raid';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE } from '../../overworld/raid';
import { type RaidBattle, createRaidBattle } from '../../overworld/raid-battle';

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

/** The canon Noble picker's way of saying "any species by rule" */
const NOBODY = 0;

/** Any Noble, or one of Hisui's five pinned */
function nobleOptions(): { value: number; label: string }[] {
  const options = [{ value: NOBODY, label: 'Any, by the seed' }];

  for (const species of CANON_NOBLES.keys()) {
    options.push({ value: species, label: getSpeciesData(species).name });
  }
  return options;
}

/** What the Noble is doing right now, for watching a burst or a stagger come */
function nobleState(staged: RaidBattle, _revision: number): string {
  const noble = (staged.units.get(BOSS_ALLIANCE) ?? []).at(0);

  if (noble == null) {
    return 'No Noble';
  }
  if (!noble.alive || noble.health <= 0) {
    return 'Calmed';
  }

  const frenzy = Math.round((noble.health / noble.checkStat(Stats.HP, 0)) * 100);

  if (noble.status[Statuses.Staggered] != null) {
    return `Staggered, Frenzy ${frenzy}%`;
  }
  if (noble.casting != null && FRENZY_MOVES.has(noble.casting.move)) {
    return `Winding up ${getMoveData(noble.casting.move).name}, Frenzy ${frenzy}%`;
  }
  return `Raging, Frenzy ${frenzy}%`;
}

/** Have the Noble wind up its burst at once, dropping whatever it was casting */
function burstNow(staged: RaidBattle): void {
  const noble = (staged.units.get(BOSS_ALLIANCE) ?? []).at(0);

  if (noble == null || !noble.alive) {
    return;
  }
  noble.stopCast();
  noble.stopChannel();
  noble.cast(getNobleBurst(noble.species), { type: MoveTargetType.None });
}

/**
 * Take a Noble's Frenzy to just under its next stagger, so a stagger
 * can be watched without waiting the fight out
 */
function drainToStagger(staged: RaidBattle): void {
  const noble = (staged.units.get(BOSS_ALLIANCE) ?? []).at(0);
  const hitter = (staged.units.get(PLAYER_ALLIANCE) ?? []).at(0);

  if (noble == null || hitter == null || !noble.alive) {
    return;
  }

  const max = noble.checkStat(Stats.HP, 0);
  let below = 0;

  for (const share of NOBLE_THRESHOLDS) {
    if (noble.health > max * share) {
      below = share;
      break;
    }
  }
  hitter.damage(
    { type: EffectType.None },
    noble,
    Math.max(1, noble.health - Math.floor(max * below) + 1),
    0,
  );
}

export default function RaidDemoBoard(): JSX.Element {
  const choices = nobleOptions();
  // The seed lives in the URL rather than in a signal, so the fight
  // on screen is a link somebody else can open and watch the same
  // frames of
  const [params, setParams] = useSearchParams<{
    seed?: string;
    shadow?: string;
    totem?: string;
    max?: string;
    alpha?: string;
    noble?: string;
    biome?: string;
  }>();
  const seed = (): string => params.seed ?? DEFAULT_SEED;
  // The shadow raid, staged on request: it is the fight the field
  // paints a haze under, and nothing else on this page is a shadow
  const shadow = (): boolean => params.shadow === '1';
  const totem = (): boolean => params.totem === '1';
  const max = (): boolean => params.max === '1';
  const alpha = (): boolean => params.alpha === '1';
  // Any truthy value stages a Noble; a species id pins which one
  const noble = (): boolean => params.noble != null;
  const pinned = (): Species | null => {
    const id = Number(params.noble);

    return Number.isInteger(id) && id > 1 ? id : null;
  };
  const [built, setBuilt] = createSignal<RaidBattle | null>(null);
  const [revision, setRevision] = createSignal(0);

  createEffect(() => {
    const staged = createRaidBattle(
      `demo:${seed()}`,
      createDemoRaidTeams(seed(), shadow(), totem(), max(), alpha(), noble(), pinned()),
    );

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

      <Switch
        label="Totem raid"
        description="Stages a Totem, which calls its ally to its side at 1/2 HP."
        checked={totem()}
        onChange={(on) => {
          setParams({ totem: on ? '1' : undefined });
        }}
      />

      <Switch
        label="Max Raid"
        description="Stages a Gigantamax boss, Dynamaxed for the whole fight."
        checked={max()}
        onChange={(on) => {
          setParams({ max: on ? '1' : undefined });
        }}
      />

      <Switch
        label="Alpha"
        description="Stages an Alpha that brings six of its kind back at 3/4, 1/2 and 1/4 HP."
        checked={alpha()}
        onChange={(on) => {
          setParams({ alpha: on ? '1' : undefined });
        }}
      />

      <Switch
        label="Noble"
        description="Stages a frenzied Noble that staggers at 3/4, 1/2 and 1/4 and bursts between, with every party packing Balms."
        checked={noble()}
        onChange={(on) => {
          setParams({ noble: on ? '1' : undefined });
        }}
      />

      <Select
        label="Canon Noble"
        class="w-64"
        value={pinned() ?? NOBODY}
        options={choices}
        onChange={(chosen) => {
          setParams({ noble: chosen === NOBODY ? '1' : String(chosen) });
        }}
      />

      <BiomePicker
        value={biomeFrom(params.biome)}
        onChange={(biome) => {
          setParams({ biome: String(biome) });
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
              class="relative h-[60vh] w-full overflow-hidden rounded-panel border-4 border-tide
              shadow-pop"
            >
              <BattleTopBar battle={staged.battle} player="" title="Raid demo" />
              {/* The same field the game plays on, cards and all:
                  hovering a pokemon reads it in full. Nothing is
                  opened by pressing one — a demo's pokemon stand for
                  no record, so there is no sheet behind them */}
              <BattleField
                battle={staged.battle}
                biome={biomeFrom(params.biome)}
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

      <Show when={noble() ? built() : null}>
        {(staged) => (
          <Badge tone="neutral" data-noble-state="">
            {nobleState(staged(), revision())}
          </Badge>
        )}
      </Show>

      <Show when={noble() ? built() : null}>
        {(staged) => (
          <Button
            onClick={() => {
              drainToStagger(staged());
            }}
          >
            Drain the Frenzy to the next stagger
          </Button>
        )}
      </Show>

      <Show when={noble() ? built() : null}>
        {(staged) => (
          <Button
            onClick={() => {
              burstNow(staged());
            }}
          >
            Unleash a burst now
          </Button>
        )}
      </Show>

      <Show when={outcome()}>{(said) => <p role="status">{said()}</p>}</Show>
    </main>
  );
}
