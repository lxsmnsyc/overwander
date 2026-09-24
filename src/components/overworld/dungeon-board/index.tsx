import { type JSX, Show, createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js';
import type { PlayerIdentity } from '../../../auth/user';
import { type CaughtPokemon, getCaught } from '../../../auth/caught';
import { dungeonFightSeed } from '../../../auth/dungeon-record';
import {
  type DungeonRun,
  type DungeonWalkEvent,
  leaveDungeonRun,
  meetDungeonLegendary,
  pressInDungeon,
  startDungeonFight,
  walkDungeon,
} from '../../../auth/dungeons';
import { getMaxHealth, isFainted } from '../../../auth/health';
import { watchProfile } from '../../../auth/profile';
import { getItemData } from '../../../data/items';
import type { Moves } from '../../../data/ids/moves';
import { DEFAULT_CHARSET } from '../../../data/overworld/charsets';
import DungeonKind from '../../../data/overworld/dungeon';
import { FRONTIER_TEAM_SIZE, FrontierRule } from '../../../data/overworld/experts';
import Npc from '../../../data/overworld/npc';
import Weather from '../../../data/overworld/weather';
import { getSpeciesData } from '../../../data/species';
import { CAVE_DARK_CELLS, CAVE_LAMP_CELLS } from '../../../data/overworld/cave';
import type { BoardCell } from '../../../canvas/board';
import { CAVERN } from '../../../canvas/sky/lamp';
import { DIRECTIONS, Direction } from '../../../overworld/dungeon/floor';
import { type CellGrid, Thing, cellAhead } from '../../../overworld/dungeon/grid';
import type { DungeonLayout } from '../../../overworld/dungeon/layout';
import { dungeonFoe, getDungeonLayout } from '../../../overworld/dungeon/stage';
import { type Footing, press, spottedBy, thingAt, tread } from '../../../overworld/dungeon/tread';
import { levelInBand } from '../../../overworld/encounter';
import { FRONTIER_PARTY_LEVELS, rentalOffer } from '../../../overworld/stop';
import { useAuth } from '../../../auth/context';
import { type OpenDungeon, useGame } from '../../app/game-context';
import CatchBox, { type BoxEntry } from '../../catches/CatchBox';
import ChunkCanvas from '../chunk-canvas';
import { Badge, Button, Dialog, DialogActions, Meta, useToast } from '../../styled';
import { dungeonTitle, floorName, floorRules, partyIsLit } from '../dungeon-dialog/describe';
import { type FloorView, floorView, roomOf } from './view';
import createGlide from './glide';
import findWalk from './walking';

/** How long a walk waits for more steps before telling the server */
const REPORT_DELAY = 600;

/** How long each step of a pressed walk takes */
const STEP_PACE = 180;

const NOTHING = new Map<number, never>();
const NOTHING_SET = new Set<number>();

const ARROWS: Partial<Record<string, Direction>> = {
  ArrowUp: Direction.North,
  ArrowRight: Direction.East,
  ArrowDown: Direction.South,
  ArrowLeft: Direction.West,
  w: Direction.North,
  d: Direction.East,
  s: Direction.South,
  a: Direction.West,
};

/** A pick taken off the table, or put back on it */
function toggled(picks: number[], pick: number): number[] {
  if (!picks.includes(pick)) {
    return picks.length >= FRONTIER_TEAM_SIZE ? picks : [...picks, pick];
  }

  const kept: number[] = [];

  for (const one of picks) {
    if (one !== pick) {
      kept.push(one);
    }
  }
  return kept;
}

/** What a walk that came to something says about it */
const SAID: Record<DungeonWalkEvent['kind'], string | null> = {
  spotted: null,
  climbed: 'Down to the next floor.',
  shut: null,
  up: 'Back up a floor.',
  fell: 'The floor gave way.',
  out: null,
};

/**
 * A dungeon floor on the board, walked the way the caves are. The walk
 * is played out here with the same rules the server replays it with, and
 * the server is told in runs of steps rather than one at a time
 */
export default function DungeonBoard(props: {
  user: PlayerIdentity;
  open: OpenDungeon;
  onLeave: () => void;
}): JSX.Element {
  const game = useGame();
  const auth = useAuth();
  const toast = useToast();
  const [footing, setFooting] = createSignal<Footing | null>(props.open.run?.state ?? null);
  const [floor, setFloor] = createSignal(props.open.run?.floor ?? 0);
  const [party, setParty] = createSignal<CaughtPokemon[]>([]);
  const [yaw, setYaw] = createSignal(0);
  const [busy, setBusy] = createSignal(false);
  const [seen, setSeen] = createSignal(new Set<number>());
  const [renting, setRenting] = createSignal<number | null>(null);
  const [taken, setTaken] = createSignal<number[]>([]);
  const [charset, setCharset] = createSignal(DEFAULT_CHARSET);
  let pending: Direction[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let queued: Direction[] = [];
  let pacing: ReturnType<typeof setInterval> | undefined;
  const glide = createGlide();

  const run = (): DungeonRun | null => props.open.run;
  const layout = createMemo((): DungeonLayout | null =>
    getDungeonLayout(props.open.snapshot, props.open.cell),
  );
  const grid = (): CellGrid | null => layout()?.floors[floor()]?.grid ?? null;

  // The player's own coat, as the overworld wears it
  createEffect(() => {
    const user = auth.user();

    if (user == null) {
      return;
    }
    onCleanup(
      watchProfile(user.uid, (profile) => {
        setCharset(profile?.sprite ?? DEFAULT_CHARSET);
      }),
    );
  });

  // Whatever the server last said is where the player is
  createEffect(
    on(
      () => props.open.run,
      (held) => {
        if (held?.state == null) {
          return;
        }
        setFooting(held.state);
        if (held.floor !== floor()) {
          setSeen(new Set<number>());
          glide.play([]);
        }
        setFloor(held.floor);
        if (props.open.note != null) {
          toast.push({ message: props.open.note, tone: 'leaf' });
        }
      },
    ),
  );

  // The locked party, for its health and for what it knows
  createEffect(
    on(
      () => run()?.party.join(','),
      () => {
        const reads: Promise<CaughtPokemon | null>[] = [];

        for (const id of run()?.party ?? []) {
          reads.push(getCaught(id));
        }
        Promise.all(reads)
          .then((found) => {
            const kept: CaughtPokemon[] = [];

            for (const one of found) {
              if (one != null) {
                kept.push(one);
              }
            }
            setParty(kept);
          })
          .catch(() => undefined);
      },
    ),
  );

  const known = createMemo(() => {
    const moves = new Set<Moves>();

    for (const one of party()) {
      for (const move of one.moves) {
        moves.add(move);
      }
    }
    return moves;
  });

  // A room counts as seen once the player has stood in it
  createEffect(() => {
    const here = footing();
    const held = grid();
    const plan = layout()?.floors[floor()];

    if (here == null || held == null || plan == null) {
      return;
    }

    const room = roomOf(held, plan.size, here.at);

    if (room >= 0 && !seen().has(room)) {
      setSeen(new Set([...seen(), room]));
    }
  });

  const view = createMemo((): FloorView | null => {
    const here = footing();
    const held = layout();

    if (here == null || held == null) {
      return null;
    }
    return floorView({
      snapshot: props.open.snapshot,
      cell: props.open.cell,
      layout: held,
      floor: floor(),
      footing: { ...here, at: glide.at() ?? here.at },
      beaten: new Set(run()?.beaten ?? []),
      seen: seen(),
    });
  });

  const say = (message: string): void => {
    toast.push({ message, tone: 'neutral' });
  };

  /** Take the server's word for the run, the walk it rejected included */
  const settleOn = (settled: DungeonRun): void => {
    game.setDungeon({ ...props.open, run: settled, note: undefined });
    if (settled.floor !== floor()) {
      glide.play([]);
    }
    setFooting(settled.state);
    setFloor(settled.floor);
  };

  /** Fight whoever is at `cell` on this floor */
  const fight = (cell: number, picks: string[] = []): void => {
    const held = run();
    const plan = layout();
    const floorGrid = grid();

    if (held == null || plan == null || floorGrid == null) {
      return;
    }

    const room = floorGrid.rooms.get(cell);
    const foe =
      room == null ? null : dungeonFoe(props.open.snapshot, props.open.cell, floor(), room);

    if (foe == null) {
      return;
    }
    if (foe.rules === FrontierRule.Rented && picks.length === 0) {
      setTaken([]);
      setRenting(cell);
      return;
    }
    setBusy(true);
    startDungeonFight(held.id, cell, picks)
      .then((battle) => {
        if (battle == null) {
          say('Nobody in the party can fight. Heal them with medicine, or walk out.');
          return;
        }
        game.setBattle({
          id: battle,
          replay: false,
          dungeon: held.id,
          opponent: {
            name: foe.name === '' ? 'Wild pokemon' : foe.name,
            sprite: foe.sprite,
          },
          npc: plan.kind === DungeonKind.Hideout ? Npc.RocketGrunt : Npc.Trainer,
        });
      })
      .catch(() => undefined)
      .finally(() => {
        setBusy(false);
      });
  };

  const react = (event: DungeonWalkEvent | null): void => {
    if (event == null) {
      return;
    }
    if (event.kind === 'spotted') {
      say('You have been spotted.');
      fight(event.cell);
      return;
    }
    if (event.kind === 'out') {
      props.onLeave();
      return;
    }
    if (event.kind === 'shut') {
      say(
        event.want === 'guard'
          ? 'The guard on the stairs is still standing.'
          : 'The stairs want this floor’s pass.',
      );
      return;
    }

    const said = SAID[event.kind];

    if (said != null) {
      say(said);
    }
  };

  /** Tell the server about the steps taken since it was last told */
  const report = async (): Promise<void> => {
    clearTimeout(timer);

    const held = run();
    const steps = pending;

    pending = [];
    if (held == null || steps.length === 0) {
      return;
    }

    const walked = await walkDungeon(held.id, steps);

    if (walked == null) {
      return;
    }
    settleOn(walked.run);
    react(walked.event);
  };

  const reportSoon = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      report().catch(() => undefined);
    }, REPORT_DELAY);
  };

  /** One step, played out here first and reported after */
  const step = (direction: Direction): void => {
    const here = footing();
    const floorGrid = grid();

    if (here == null || floorGrid == null || busy() || renting() != null || glide.at() != null) {
      return;
    }

    const trod = tread(floorGrid, here, direction, known());

    if (trod == null) {
      return;
    }
    setFooting(trod.footing);
    glide.play(trod.path);
    pending.push(direction);

    // Anything that happens is the server's to settle, straight away
    const spotted = spottedBy(floorGrid, trod.footing, new Set(run()?.beaten ?? []));

    if (trod.event != null || spotted != null || pending.length >= 60) {
      setBusy(true);
      report()
        .catch(() => undefined)
        .finally(() => {
          setBusy(false);
        });
      return;
    }
    reportSoon();
  };

  /** Press whatever is faced */
  const pressAhead = (): void => {
    const here = footing();
    const held = run();
    const floorGrid = grid();
    const plan = layout();

    if (here == null || held == null || floorGrid == null || plan == null || busy()) {
      return;
    }

    const local = press(floorGrid, here, known());

    if (local == null) {
      return;
    }
    setBusy(true);
    report()
      .then(async () => {
        const last = floor() === plan.floors.length - 1;
        const ahead = cellAhead(floorGrid, here.at, here.facing);

        // The legendary at the bottom of a Dungeon is met rather than fought
        if (plan.kind === DungeonKind.Dungeon && last && ahead === floorGrid.exit) {
          const met = await meetDungeonLegendary(held.id);

          if (met?.encounter != null) {
            props.onLeave();
            game.setEncounter(met.encounter);
          }
          return;
        }

        const pressed = await pressInDungeon(held.id, here.facing);

        if (pressed == null) {
          return;
        }
        settleOn(pressed.run);
        for (const { item, amount } of pressed.items) {
          toast.push({
            title: amount > 1 ? `${getItemData(item).name} ×${amount}` : getItemData(item).name,
            message: 'Found on the floor.',
            tone: 'leaf',
          });
        }
        if (local.event?.kind === 'take' && local.event.thing === Thing.Key) {
          say('A key. It opens one locked door on this floor.');
        }
        if (local.event?.kind === 'take' && local.event.thing === Thing.Pass) {
          say('The floor’s pass. The stairs will take you now.');
        }
        if (pressed.fight != null) {
          fight(pressed.fight);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setBusy(false);
      });
  };

  // The keyboard walks, and Enter or Space presses what is ahead
  createEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || renting() != null) {
        return;
      }

      const direction = ARROWS[event.key];

      if (direction != null) {
        event.preventDefault();
        queued = [];
        step(direction);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pressAhead();
      }
    };

    window.addEventListener('keydown', onKey);
    onCleanup(() => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
      clearInterval(pacing);
      report().catch(() => undefined);
    });
  });

  /** A pressed cell: the one ahead is pressed, anything further is walked to */
  const onPress = (cell: BoardCell): void => {
    const here = footing();
    const floorGrid = grid();
    const shown = view();

    if (here == null || floorGrid == null || shown == null) {
      return;
    }

    const target = (cell.y + shown.origin[1]) * floorGrid.width + cell.x + shown.origin[0];

    for (const direction of DIRECTIONS) {
      if (
        cellAhead(floorGrid, here.at, direction) === target &&
        thingAt(floorGrid, here, target) != null
      ) {
        setFooting({ ...here, facing: direction });
        pressAhead();
        return;
      }
    }

    queued = findWalk(floorGrid, here, target, known()) ?? [];
    clearInterval(pacing);
    pacing = setInterval(() => {
      // A slide under way finishes before the next step
      if (glide.at() != null) {
        return;
      }

      const next = queued.shift();

      if (next == null) {
        clearInterval(pacing);
        return;
      }
      step(next);
    }, STEP_PACE);
  };

  const giveUp = (): void => {
    const held = run();

    if (held == null) {
      return;
    }
    setBusy(true);
    report()
      .then(async () => leaveDungeonRun(held.id))
      .then((left) => {
        if (left != null) {
          props.onLeave();
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setBusy(false);
      });
  };

  const crate = (): BoxEntry[] => {
    const held = run();
    const cell = renting();
    const floorGrid = grid();
    const room = cell == null ? undefined : floorGrid?.rooms.get(cell);
    const squares: BoxEntry[] = [];

    if (held == null || room == null) {
      return squares;
    }
    for (const [at, [species, , traitValue]] of rentalOffer(
      dungeonFightSeed(held.id, floor(), room),
    ).entries()) {
      squares.push({
        id: `${at}`,
        species,
        shiny: false,
        egg: false,
        progress: 0,
        fainted: false,
        mark: taken().includes(at) ? 'picked' : undefined,
        label: `${getSpeciesData(species).name}, Lv. ${levelInBand(traitValue, FRONTIER_PARTY_LEVELS)}`,
      });
    }
    return squares;
  };

  /** The keys and the pass in hand, if any */
  const carrying = (): string | null => {
    const here = footing();
    const held: string[] = [];

    if (here != null && here.keys > 0) {
      held.push(`Keys ${here.keys}`);
    }
    if (here?.pass === true) {
      held.push('Pass');
    }
    return held.length === 0 ? null : held.join(' · ');
  };

  /** The locked party's health, one line */
  const partyLine = (): string => {
    const parts: string[] = [];

    for (const one of party()) {
      const name = getSpeciesData(one.species).name;

      parts.push(isFainted(one) ? `${name} fainted` : `${name} ${one.health}/${getMaxHealth(one)}`);
    }
    return parts.join(' · ');
  };

  const title = (): string => {
    const held = layout();

    return held == null ? 'Dungeon' : dungeonTitle(held, props.open.snapshot, props.open.cell);
  };

  const at = (): [number, number] => {
    const here = footing();
    const floorGrid = grid();

    const shown = glide.at() ?? here?.at;

    return shown == null || floorGrid == null
      ? [0, 0]
      : [shown % floorGrid.width, Math.floor(shown / floorGrid.width)];
  };

  const facing = (): [number, number] => {
    const turned = footing()?.facing ?? Direction.South;

    return [[0, 1, 0, -1][turned], [-1, 0, 1, 0][turned]];
  };

  return (
    <div class="relative h-full w-full" style={{ 'background-color': CAVERN.colour }}>
      <Show when={view()}>
        {(shown) => (
          <ChunkCanvas
            biome={props.open.snapshot.chunk.biome}
            weather={Weather.Clear}
            lamp={partyIsLit(party()) ? CAVE_LAMP_CELLS : CAVE_DARK_CELLS}
            underground
            lit={shown().lit}
            charset={charset()}
            yaw={yaw()}
            latitude={0}
            onTurn={(turned) => {
              setYaw(turned);
            }}
            caption={title()}
            at={at()}
            origin={shown().origin}
            facing={facing()}
            landmarks={shown().landmarks}
            pictures={shown().pictures}
            phenomena={NOTHING}
            ground={shown().ground}
            groundKey={`${run()?.id ?? ''}:${floor()}`}
            wanderers={NOTHING}
            coats={shown().coats}
            facings={shown().facings}
            berries={NOTHING}
            picked={NOTHING_SET}
            dug={NOTHING_SET}
            auras={NOTHING}
            decorations={shown().decorations}
            spawns={shown().spawns}
            marks={shown().marks}
            label={() => ''}
            onPress={onPress}
          />
        )}
      </Show>

      {/* Where you are, and who you brought, over the corner of the floor */}
      <div class="pointer-events-none absolute top-2 left-2 flex max-w-[60%] flex-col gap-1">
        <Badge tone="tide">
          {title()} · {floorName(layout()?.kind ?? DungeonKind.Dungeon, floor())}
        </Badge>
        <Show when={layout()?.floors[floor()]}>{(plan) => <Meta>{floorRules(plan())}</Meta>}</Show>
        <Show when={carrying()}>{(held) => <Meta>{held()}</Meta>}</Show>
        <Meta>{partyLine()}</Meta>
      </div>
      <div class="absolute top-2 right-2">
        <Button disabled={busy()} onClick={giveUp}>
          Give up the run
        </Button>
      </div>

      <Dialog
        isOpen={renting() != null}
        onClose={() => {
          setRenting(null);
        }}
        title="The house lends the party"
        description={`Pick ${FRONTIER_TEAM_SIZE} to rent for this floor.`}
      >
        <CatchBox
          entries={crate()}
          capacity={crate().length}
          columns={3}
          onOpen={(id) => {
            const pick = Number(id);

            setTaken(toggled(taken(), pick));
          }}
        />
        <DialogActions>
          <Button
            tone="primary"
            disabled={taken().length !== FRONTIER_TEAM_SIZE}
            onClick={() => {
              const cell = renting();

              setRenting(null);
              if (cell != null) {
                const picks: string[] = [];

                for (const one of taken()) {
                  picks.push(String(one));
                }
                fight(cell, picks);
              }
            }}
          >
            Battle
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
