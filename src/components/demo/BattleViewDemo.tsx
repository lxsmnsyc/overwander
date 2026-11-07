import { useSearchParams } from '@solidjs/router';
import { type JSX, Show, createEffect, createResource, createSignal, onCleanup } from 'solid-js';
import type { Profile } from '../../auth/profile';
import type { TeamSnapshotRecord } from '../../auth/teams';
import { BattleModes } from '../../battle/battle';
import type Unit from '../../battle/unit';
import { Stats } from '../../data/constants/stats';
import { Balls, Items } from '../../data/ids/items';
import { getSpeciesData } from '../../data/species';
import { RaidKind } from '../../model/raid-record';
import { BOSS_ALLIANCE } from '../../overworld/raid';
import { type RaidBattle, createRaidBattle } from '../../overworld/raid/battle';
import { createDemoRaidTeams } from '../../overworld/raid/demo';
import { createTrainerBattle } from '../../overworld/stop/battle';
import BattleData from '../app/BattleData';
import type { Spoils } from '../app/game-context';
import BattleField from '../battle/BattleField';
import BattleTopBar from '../battle/BattleTopBar';
import Countdown from '../battle/battle-view/Countdown';
import Inspector from '../battle/battle-view/Inspector';
import ResultsScreen from '../battle/battle-view/results';
import { readSides } from '../battle/battle-view/summary';

/**
 * The battle view's furniture over fights staged in the browser, for
 * looking at every state of it without a lobby or a record: a duel, a
 * replay, a spectator, the countdown, a won or lost verdict, and a raid
 * of each kind. Nothing is recorded. The address picks the state:
 *
 * - `scene`: `duel` (the default) or `raid`
 * - `kind`: the raid's kind (`legendary`, `shadow`, `mythical`, `totem`,
 *   `max`, `alpha`, `noble`, `tera`)
 * - `replay=1`, `spectate=1`
 * - `count=3`: hold the countdown at that number
 * - `inspect=own|foe`: dock the inspector on that side's first pokemon
 * - `verdict=won|lost|draw`: open the results once the field is drawn
 * - `boss=0.4`: set the boss's health to that share once it starts
 * - `seat=held|freed`: the seat line among the rewards
 */

const KINDS: Record<string, RaidKind> = {
  legendary: RaidKind.Legendary,
  shadow: RaidKind.Shadow,
  mythical: RaidKind.Mythical,
  totem: RaidKind.Totem,
  max: RaidKind.Max,
  alpha: RaidKind.Alpha,
  noble: RaidKind.Noble,
  tera: RaidKind.Tera,
};

const TITLES: Record<RaidKind, string> = {
  [RaidKind.Legendary]: 'Raid Battle: Spear Pillar',
  [RaidKind.Shadow]: 'Raid Battle: Shadow Lair',
  [RaidKind.Mythical]: 'Raid Battle: Faraway Island',
  [RaidKind.Totem]: 'Raid Battle: Totem Den',
  [RaidKind.Max]: 'Max Raid',
  [RaidKind.Alpha]: 'Raid Battle: Alpha',
  [RaidKind.Noble]: 'Raid Battle: Noble Arena',
  [RaidKind.Tera]: 'Raid Battle: Tera crystal',
};

/** Who reads the field: the first party, or nobody for a spectator */
const PLAYER = 'demo-1';

/** How many pokemon each side of a duel fields */
const DUEL_SIZE = 3;

/** A record id, so Open sheet is offered on the reader's own pokemon */
const DEMO_CATCH = 'demo-catch';

/** The balls the duel's parties sit in, so each plate shows a mix */
const DEMO_BALLS: Balls[] = [
  Balls.UltraBall,
  Balls.DuskBall,
  Balls.LuxuryBall,
  Balls.GreatBall,
  Balls.QuickBall,
  Balls.PremierBall,
];

/** How long after the field is drawn the inspector docks and the results open */
const INSPECT_AFTER = 1200;
const VERDICT_AFTER = 9000;
const BOSS_AFTER = 1500;

function stageDuel(seed: string): RaidBattle {
  const rolled = createDemoRaidTeams(seed);
  const teams: TeamSnapshotRecord[] = [];

  // Two of the rolled parties face each other, three apiece
  for (const [at, team] of rolled.slice(1, 3).entries()) {
    const catches = [];

    for (const [slot, caught] of team.catches.slice(0, DUEL_SIZE).entries()) {
      catches.push({
        ...caught,
        caught: at === 0 ? DEMO_CATCH : '',
        ball: DEMO_BALLS[(at * DUEL_SIZE + slot) % DEMO_BALLS.length],
      });
    }
    teams.push({ player: `demo-${at + 1}`, alliance: at, catches });
  }
  return createTrainerBattle(`demo-duel:${seed}`, teams, undefined, BattleModes.PvP);
}

function stageRaid(seed: string, kind: RaidKind): RaidBattle {
  return createRaidBattle(
    `demo-view:${seed}`,
    createDemoRaidTeams(
      seed,
      kind === RaidKind.Shadow,
      kind === RaidKind.Totem,
      kind === RaidKind.Max,
      kind === RaidKind.Alpha,
      kind === RaidKind.Noble,
      null,
      kind === RaidKind.Tera,
    ),
  );
}

/** The first pokemon on the reader's side, or on the other side */
function findUnit(built: RaidBattle, own: boolean): Unit | null {
  for (const alliance of built.battle.alliances) {
    for (const team of alliance.teams) {
      if ((team.player === PLAYER) === own) {
        const first = [...team.units].at(0);

        if (first != null) {
          return first;
        }
      }
    }
  }
  return null;
}

/** The reader's result the address asks for */
function readOutcome(asked: string | undefined): 'won' | 'lost' | 'draw' | null {
  if (asked === 'won' || asked === 'lost' || asked === 'draw') {
    return asked;
  }
  return null;
}

function Stage(): JSX.Element {
  const [params] = useSearchParams<{
    scene?: string;
    kind?: string;
    seed?: string;
    replay?: string;
    spectate?: string;
    count?: string;
    inspect?: string;
    verdict?: string;
    boss?: string;
    seat?: string;
  }>();
  const seed = params.seed ?? 'field-kit';
  const kind = params.scene === 'raid' ? (KINDS[params.kind ?? ''] ?? RaidKind.Legendary) : null;
  const built = kind == null ? stageDuel(seed) : stageRaid(seed, kind);
  const player = params.spectate === '1' ? '' : PLAYER;
  const replay = params.replay === '1';
  const [speed, setSpeed] = createSignal(1);
  const [inspected, setInspected] = createSignal<Unit | null>(null);
  const [ready, setReady] = createSignal(false);
  const [verdict, setVerdict] = createSignal<{ title: string; said: string } | null>(null);
  const [dismissed, setDismissed] = createSignal(false);
  // Nobody here has a profile, so every side is named by its fallback
  const [names] = createResource(async () => {
    await Promise.resolve();
    return new Map<string, Profile>();
  });

  built.battle.initialize();
  onCleanup(() => {
    built.battle.end();
  });

  // Once the field is drawn: the boss's health, the inspector, the results
  createEffect(() => {
    if (!ready()) {
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const share = Number(params.boss);

    // A beat after the field is drawn, so the banner's callout shows
    if (kind != null && share > 0) {
      timers.push(
        setTimeout(() => {
          const team = [...(built.alliances.get(BOSS_ALLIANCE)?.teams ?? [])].at(0);
          const boss = team == null ? undefined : [...team.units].at(0);

          boss?.setHealth(boss.checkStat(Stats.HP, 0) * share);
        }, BOSS_AFTER),
      );
    }

    if (params.inspect != null) {
      timers.push(
        setTimeout(() => {
          setInspected(findUnit(built, params.inspect === 'own'));
        }, INSPECT_AFTER),
      );
    }
    if (params.verdict != null) {
      timers.push(
        setTimeout(() => {
          setVerdict(
            params.verdict === 'lost'
              ? { title: 'Defeat', said: 'The party fainted.' }
              : {
                  title: 'Victory',
                  said: 'Mika is beaten. They keep their party, and the purse is yours.',
                },
          );
        }, VERDICT_AFTER),
      );
    }
    onCleanup(() => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    });
  });

  const lead = findUnit(built, true);
  const spoils = (): Spoils => ({
    gold: params.verdict === 'lost' ? -120 : 1240,
    award: null,
    items: params.verdict === 'lost' ? [] : [{ item: Items.RareCandy, amount: 2 }],
    waiting: null,
    seat: params.seat === 'held' || params.seat === 'freed' ? params.seat : null,
  });

  return (
    <main class="fixed inset-0 overflow-hidden bg-shade">
      <section class="relative h-full w-full">
        <BattleField
          battle={built.battle}
          player={player}
          onPick={(unit) => {
            setInspected(unit);
          }}
          onReady={() => {
            if (params.count == null) {
              built.battle.start();
            }
            setReady(true);
          }}
        />
        <BattleTopBar
          battle={built.battle}
          player={player}
          title={kind == null ? 'Battle' : TITLES[kind]}
          replay={replay}
          speed={speed()}
          onSpeed={replay ? setSpeed : undefined}
          onLeave={() => undefined}
          kind={kind}
          raised={inspected() != null}
        />
        <div class="pointer-events-none absolute inset-0 z-20 mx-auto max-w-[calc(100dvh*16/9)] @container">
          <Inspector
            battle={built.battle}
            unit={inspected()}
            raid={kind != null}
            onClose={() => {
              setInspected(null);
            }}
            onOpenSheet={() => undefined}
          />
        </div>
        <Countdown left={params.count == null ? null : Number(params.count)} />
        <Show when={ready()}>
          <ResultsScreen
            verdict={verdict}
            outcome={readOutcome(params.verdict)}
            spoils={spoils()}
            candy={
              lead == null || params.verdict === 'lost'
                ? []
                : [{ family: getSpeciesData(lead.species).family, count: 3 }]
            }
            dismissed={dismissed()}
            onDismiss={() => {
              setDismissed(true);
            }}
            raiding={kind != null}
            sides={verdict() == null ? [] : readSides(built)}
            names={names}
            player={player}
            opponent={kind == null ? { name: 'Mika', sprite: '' } : null}
            teams={null}
            replay={replay}
            onLeave={() => undefined}
          />
        </Show>
      </section>
    </main>
  );
}

/** The stage, once the fight registries are loaded */
export default function BattleViewDemo(): JSX.Element {
  return (
    <BattleData>
      <Stage />
    </BattleData>
  );
}
