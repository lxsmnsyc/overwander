import { type EggWalk, type WalkReport, walk as reportWalk } from '../../auth/eggs';
import { useDig, useTeleport } from '../../auth/field-moves';
import openSight, { type Sight } from '../../auth/sight';
import Biome, { isIceBiome } from '../../data/ids/biome';
import { Moves } from '../../data/ids/moves';
import type { ItemStack } from '../../data/overworld/item-pool';
import { MAX_STEP_REPORT } from '../../model/egg';
import type { PositionRecord } from '../../model/position-record';
import { cellInChunk, chunkOfCell, worldCell } from '../../overworld/chunk';
import type { Buddy } from '../../overworld/core';
import { Depth } from '../../overworld/depth';
import {
  type CellFacts,
  type FieldMove,
  type Travel,
  canEnter,
  canLand,
  canUseFieldMove,
} from '../../overworld/field-moves';
import { canStep, findPathBeside, findPathNear, stepDuration } from '../../overworld/path';
import { isInWorld } from '../../overworld/world';
import type { FieldMoveOffer } from '../session/types';
import { type Store, type WritableStore, createStore } from '../store';
import {
  BOARD_CELLS,
  BOARD_CENTER,
  PLAYER_CELL,
  SAVE_DELAY,
  SAVE_FLOOR,
  START_CELL,
  STEP_PACE,
  STEP_REPORT_SIZE,
} from './board-metrics';
import type { Journey } from './journey';
import describeFailure from '../../i18n/refusals';

/** What a step onto a board cell needs to know of the board in view */
export interface WalkGround {
  ground: {
    role: (x: number, y: number) => string;
    biome: (x: number, y: number) => Biome;
  };
  landmarks: { has: (index: number) => boolean };
  decorations: { has: (index: number) => boolean };
  walls: { has: (index: number) => boolean };
  underground: boolean;
}

/** What the walk asks of the board it walks, attached once the board can answer */
export interface WalkBoard<View extends WalkGround> {
  /** The buddy walking alongside: undefined while it is read, null when there is none */
  buddy: () => Buddy | null | undefined;
  /** The board in view, once its windows have landed */
  view: () => View | null;
  /** Whether something is open over the board, which stops a walk */
  engaged: () => boolean;
  /** Whether a press on a cell reaches for something rather than walking onto it */
  holdsSomething: (view: View, index: number) => boolean;
  withinReach: (index: number) => boolean;
  reach: (index: number) => void;
  /** A step is a reason to wonder what is around */
  askForWindow: () => void;
}

/** What the walk asks of the session around it */
export interface WalkDeps {
  /** Who is walking, by uid */
  uid: () => string | null;
  /** Where the walk went when another screen took it, or null while this one has it */
  elsewhere: () => PositionRecord | null;
  takeWalk: () => void;
  standHere: (at: PositionRecord) => void;
  setPosition: (at: PositionRecord) => void;
  settleWalk: (
    chunkX: number,
    chunkY: number,
    cellX: number,
    cellY: number,
    depth: Depth,
    steps: number,
  ) => Promise<WalkReport | null>;
  setFieldMoves: (offers: FieldMoveOffer[]) => void;
  /** What the buddy turned up on the way */
  found: (items: ItemStack[]) => void;
  /** A field move the server refused, said in words */
  failed: (message: string) => void;
}

/**
 * The player walking the board: where they stand, the steps between
 * here and where they pressed, riding the buddy, and keeping the
 * server told. The board is a window that follows them, so the world
 * cell they stand on is the one position the game keeps
 */
export interface BoardWalk<View extends WalkGround> {
  /** Hand the walk the board it walks; until then it stands still */
  attach: (board: WalkBoard<View>) => void;
  x: Store<number>;
  y: Store<number>;
  /** The caves are the same coordinates one layer down */
  depth: Store<Depth>;
  /** Whether the walk has been put where the session says the player is */
  placed: Store<boolean>;
  /** The way the player stands, as a step: what the interact key reaches */
  facing: Store<[number, number]>;
  /** Where a pressed walk is heading, re-planned at every step */
  journey: WritableStore<Journey | null>;
  travel: Store<Travel>;
  /** The egg walking with the player, as of the last report */
  carried: Store<EggWalk | null>;
  /** The other players in sight, and this one as they see them */
  sight: Store<Sight | null>;
  /** Stand where the session says, the first time it says anything */
  place: (at: PositionRecord) => void;
  /** Put somewhere by something other than a walk: a portal, a cave mouth, a teleport */
  standAt: (x: number, y: number, depth?: Depth) => void;
  /** Write down where they stand now, with the paces that led there */
  settle: () => void;
  /** Take the walk back from the screen that has it */
  resume: () => void;
  /** Walk toward a board cell, reaching for it if something stands there */
  press: (index: number) => void;
  /** A keyboard step: the first way that can be walked, or a turn toward the first */
  stepBy: (ways: [number, number][]) => void;
  /** How long until the next step may be taken */
  untilNextStep: () => number;
  /** The board cell one step from the player */
  ahead: (way: [number, number]) => number;
  /** The board, the buddy or the session changed: check the ride and the offers again */
  refresh: () => void;
  setCharset: (charset: string) => void;
  dispose: () => void;
}

/** The four sides of a cell, which is where Surf starts */
const SIDES = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

export default function createBoardWalk<View extends WalkGround>(
  session: WalkDeps,
): BoardWalk<View> {
  let board: WalkBoard<View> | null = null;
  /** The session and the board, read as one */
  const deps = {
    ...session,
    buddy: (): Buddy | null | undefined => board?.buddy(),
    view: (): View | null => board?.view() ?? null,
    engaged: (): boolean => board?.engaged() ?? false,
    holdsSomething: (loaded: View, index: number): boolean =>
      board?.holdsSomething(loaded, index) ?? false,
    withinReach: (index: number): boolean => board?.withinReach(index) ?? false,
    reach: (index: number): void => {
      board?.reach(index);
    },
    askForWindow: (): void => {
      board?.askForWindow();
    },
  };
  const x = createStore(START_CELL);
  const y = createStore(START_CELL);
  const depth = createStore<Depth>(Depth.Surface);
  const placed = createStore(false);
  const facing = createStore<[number, number]>([0, 1]);
  const journey = createStore<Journey | null>(null);
  const travel = createStore<Travel>('walk');
  const warping = createStore(false);
  const carried = createStore<EggWalk | null>(null);
  const sight = createStore<Sight | null>(null);
  let charset = '';

  /** The world cell the board's own cell 0 sits on */
  const originX = (): number => x.get() - BOARD_CENTER;
  const originY = (): number => y.get() - BOARD_CENTER;

  const seatOf = (wx: number, wy: number): number | null => {
    const bx = wx - originX();
    const by = wy - originY();

    return bx < 0 || by < 0 || bx >= BOARD_CELLS || by >= BOARD_CELLS
      ? null
      : by * BOARD_CELLS + bx;
  };

  const boardOf = (index: number): [number, number] => [
    originX() + (index % BOARD_CELLS),
    originY() + Math.floor(index / BOARD_CELLS),
  ];

  const ahead = ([dx, dy]: [number, number]): number =>
    (BOARD_CENTER + dy) * BOARD_CELLS + (BOARD_CENTER + dx);

  /*
   * Steps walked and the server
   */

  /**
   * Paces walked but not yet reported, and whether a report is in
   * flight. A walk reports in batches of `STEP_REPORT_SIZE`; `force`
   * is for the moments a walk stops, where the last few are kept
   */
  let pending = 0;
  let reporting = false;
  /** When the position was last written, which is what SAVE_FLOOR is measured from */
  let settledAt = 0;

  const takeReport = (report: WalkReport | null): void => {
    carried.set(report?.egg ?? null);
    // A find lands in the bag while the player is looking at the map,
    // and nothing else would tell them
    if (report != null && report.picked.length > 0) {
      deps.found(report.picked);
    }
  };

  const reportSteps = (force = false): void => {
    if (reporting || pending === 0 || (!force && pending < STEP_REPORT_SIZE)) {
      return;
    }
    // Nobody walking alongside means nothing on the server to credit
    if (deps.buddy() === null) {
      pending = 0;
      return;
    }

    // Past the cap the server would drop them, so the rest wait for the next report
    const steps = Math.min(pending, MAX_STEP_REPORT);

    pending -= steps;
    reporting = true;
    reportWalk(steps)
      .then(takeReport)
      .catch(() => {
        // A dropped report is a few paces; the next one carries on
      })
      .finally(() => {
        reporting = false;
      });
  };

  /**
   * Where they stopped, and what it cost the egg they are carrying.
   * The steps go first and the position follows, so a player never
   * comes back further along than their egg
   */
  const settleAt = (chunk: number, row: number, cx: number, cy: number): void => {
    // A screen that has stood down writes nothing: its coordinates are
    // where the player used to be
    if (deps.elsewhere() != null) {
      return;
    }
    settledAt = Date.now();
    // The paces ride the save, unless a report is already out with them
    const steps = reporting ? 0 : pending;

    if (steps > 0) {
      pending = 0;
      reporting = true;
    }
    // So the world map looks at the chunk the player is in, and a
    // remount picks the walk up rather than the record
    deps.setPosition({
      player: deps.uid() ?? '',
      chunkX: chunk,
      chunkY: row,
      cellX: cx,
      cellY: cy,
      depth: depth.get(),
      movedAt: Date.now(),
    });
    deps
      .settleWalk(chunk, row, cx, cy, depth.get(), steps)
      .then((report) => {
        if (steps > 0) {
          takeReport(report);
        }
      })
      .catch(() => {
        // A position that did not save is a walk that will save it
      })
      .finally(() => {
        if (steps > 0) {
          reporting = false;
        }
      });
  };

  const settle = (): void => {
    settleAt(
      chunkOfCell(x.get()),
      chunkOfCell(y.get()),
      cellInChunk(x.get()),
      cellInChunk(y.get()),
    );
  };

  /**
   * A step is a keypress, so the write is held back to one every
   * SAVE_DELAY: each move clears the last timer, so what lands is where
   * they stopped. SAVE_FLOOR holds the rest, since two steps and a
   * pause over and over is otherwise a write every few seconds
   */
  let saving: ReturnType<typeof setTimeout> | null = null;

  const saveSoon = (): void => {
    if (saving != null) {
      clearTimeout(saving);
      saving = null;
    }
    if (deps.uid() == null || !placed.get()) {
      return;
    }

    const at = [
      chunkOfCell(x.get()),
      chunkOfCell(y.get()),
      cellInChunk(x.get()),
      cellInChunk(y.get()),
    ] as const;

    saving = setTimeout(
      () => {
        saving = null;
        settleAt(...at);
      },
      Math.max(SAVE_DELAY, SAVE_FLOOR - (Date.now() - settledAt)),
    );
  };

  /*
   * Standing and stepping
   */

  const standAt = (wx: number, wy: number, layer?: Depth): void => {
    if (layer != null) {
      depth.set(layer);
    }
    x.set(wx);
    y.set(wy);
    saveSoon();
    stand();
  };

  const move = (dx: number, dy: number): void => {
    // The walk is on another screen: this one is a picture of where the
    // player was until somebody asks for it back
    if (deps.elsewhere() != null) {
      return;
    }
    deps.askForWindow();

    const nx = x.get() + dx;
    const ny = y.get() + dy;

    // The world is finite: a walk into its edge goes nowhere
    if (!isInWorld(chunkOfCell(nx), chunkOfCell(ny))) {
      return;
    }
    x.set(nx);
    y.set(ny);
    saveSoon();
    stand();
    // A cell crossed is a step walked
    pending += 1;
    reportSteps();
  };

  /** What stands on a board cell, as far as a step onto it cares */
  const factsAt = (loaded: View, index: number): CellFacts => {
    const cx = index % BOARD_CELLS;
    const cy = Math.floor(index / BOARD_CELLS);
    const wet = loaded.ground.role(cx, cy) === 'water';
    const biome = loaded.ground.biome(cx, cy);

    return {
      fixture: loaded.landmarks.has(index),
      scenery: loaded.decorations.has(index),
      solid: loaded.walls.has(index),
      // A frozen lake is walked like ground, so only open water needs Surf
      water: wet && biome !== Biome.Volcano && !isIceBiome(biome),
      lava: wet && biome === Biome.Volcano,
    };
  };

  /** Whether a step onto a cell is allowed, however the player is getting about */
  const standable = (loaded: View, index: number): boolean =>
    canEnter(travel.get(), factsAt(loaded, PLAYER_CELL), factsAt(loaded, index));

  /*
   * Pressed walks
   */

  /**
   * When the next step may be taken: the last one's start plus how long
   * it takes. Measured from the step rather than the press, so pressing
   * again mid-walk changes where the player goes but not how fast
   */
  let nextStepAt = 0;

  const untilNextStep = (): number => {
    const owed = nextStepAt - Date.now();

    return owed > 0 ? owed : STEP_PACE;
  };

  /** Reaching for something ends beside it rather than on it */
  const arrived = (plan: Journey): boolean => {
    const standing = seatOf(plan.goalX, plan.goalY);

    return plan.act
      ? standing != null && deps.withinReach(standing)
      : x.get() === plan.goalX && y.get() === plan.goalY;
  };

  /** The walk whose route the other players have been told, so it is told once */
  let announced: Journey | null = null;

  const stepsAlong = (from: number, cells: number[]): [number, number][] => {
    const steps: [number, number][] = [];
    let at = from;

    for (const onto of cells) {
      steps.push([
        (onto % BOARD_CELLS) - (at % BOARD_CELLS),
        Math.floor(onto / BOARD_CELLS) - Math.floor(at / BOARD_CELLS),
      ]);
      at = onto;
    }
    return steps;
  };

  /**
   * One cell of the walk, re-planned from where the player is now,
   * since the chunk moves under a walk. A route that no longer exists
   * ends the walk where it stands: the player can see the board
   */
  const stride = (): void => {
    const plan = journey.get();
    const loaded = deps.view();

    if (plan == null || loaded == null) {
      return;
    }
    // Something opened on the way, and the rest of the walk is not
    // what the player is answering now
    if (deps.engaged()) {
      journey.set(null);
      return;
    }
    if (arrived(plan)) {
      const standing = seatOf(plan.goalX, plan.goalY);

      journey.set(null);
      if (plan.act && standing != null) {
        deps.reach(standing);
      }
      return;
    }

    const goal = seatOf(plan.goalX, plan.goalY);

    // A walk only heads for something the player can see
    if (goal == null) {
      journey.set(null);
      return;
    }

    // Fixtures and rock stop a walk; a pokemon does not, since where
    // one stands this window is not a fact about the ground
    const passable = (index: number): boolean => standable(loaded, index);
    // A goal nothing can stand on is walked up to instead of refused
    const route = plan.act
      ? findPathBeside(PLAYER_CELL, goal, passable)
      : findPathNear(PLAYER_CELL, goal, passable);
    const next = route?.[0];

    if (next == null) {
      journey.set(null);
      return;
    }

    const step: [number, number] = [
      (next % BOARD_CELLS) - (PLAYER_CELL % BOARD_CELLS),
      Math.floor(next / BOARD_CELLS) - Math.floor(PLAYER_CELL / BOARD_CELLS),
    ];

    // A route is a run of single steps; one that jumped would be a
    // teleport with a walk's name on it
    if (Math.max(Math.abs(step[0]), Math.abs(step[1])) !== 1) {
      journey.set(null);
      return;
    }
    // Told once, as all of it: the route found at the first step is the one walked
    if (announced !== plan && route != null) {
      announced = plan;
      sight.get()?.plan(stepsAlong(PLAYER_CELL, route));
    }
    nextStepAt = Date.now() + stepDuration(step, STEP_PACE);
    move(step[0], step[1]);
  };

  /**
   * The walk itself: a step, then the next once that one is done. Only
   * a new press restarts the clock, so pressing again cannot walk
   * faster than the pace
   */
  let pacing: ReturnType<typeof setTimeout> | null = null;

  const stopPacing = (): void => {
    if (pacing != null) {
      clearTimeout(pacing);
      pacing = null;
    }
  };

  const pace = (plan: Journey): void => {
    pacing = null;
    stride();
    // A step can end the walk by arriving or giving up
    if (journey.get() === plan) {
      pacing = setTimeout(pace, untilNextStep(), plan);
    }
  };

  const press = (index: number): void => {
    const loaded = deps.view();

    if (loaded == null) {
      return;
    }

    const [gx, gy] = boardOf(index);

    if (deps.holdsSomething(loaded, index)) {
      journey.set(null);
      if (deps.withinReach(index)) {
        deps.reach(index);
      } else {
        journey.set({ goalX: gx, goalY: gy, act: true });
      }
      return;
    }
    // Scenery is still somewhere to head: the walk stops on the nearest
    // cell that can be stood on
    journey.set(index === PLAYER_CELL ? null : { goalX: gx, goalY: gy, act: false });
  };

  /**
   * A keyboard step: two keys held walk the diagonal, and where that
   * corner is shut the newer key's straight step slides along it. A
   * step into a landmark turns without moving, which leaves the
   * interact key something to act on
   */
  const stepBy = (ways: [number, number][]): void => {
    const loaded = deps.view();
    const first = ways.at(0);

    if (loaded == null || first == null || deps.engaged() || Date.now() < nextStepAt) {
      return;
    }
    // The keyboard is the player walking themselves, so a pressed walk is dropped rather than raced
    journey.set(null);

    const passable = (index: number): boolean => standable(loaded, index);

    for (const way of ways) {
      if (canStep(PLAYER_CELL, way[0], way[1], passable)) {
        facing.set(way);
        nextStepAt = Date.now() + stepDuration(way, STEP_PACE);
        move(way[0], way[1]);
        return;
      }
    }
    facing.set(first);
    stand();
  };

  /*
   * Riding the buddy, Dig and Teleport
   */

  const knows = (field: FieldMove): boolean => canUseFieldMove(deps.buddy()?.species, field);

  const besideWater = (loaded: View): boolean => {
    for (const [dx, dy] of SIDES) {
      if (factsAt(loaded, ahead([dx, dy])).water) {
        return true;
      }
    }
    return false;
  };

  /** Whether the last step was taken on water, so the first one ashore ends a surf */
  let afloat = false;

  const surfOffered = (loaded: View): boolean => {
    if (!knows(Moves.Surf)) {
      return false;
    }
    if (travel.get() === 'surf') {
      return !factsAt(loaded, PLAYER_CELL).water;
    }
    return travel.get() === 'walk' && besideWater(loaded);
  };

  const flyOffered = (loaded: View): boolean => {
    if (!knows(Moves.Fly)) {
      return false;
    }
    if (travel.get() === 'fly') {
      return canLand(factsAt(loaded, PLAYER_CELL));
    }
    return travel.get() === 'walk' && !loaded.underground;
  };

  const toggleSurf = (): void => {
    const loaded = deps.view();

    if (loaded == null) {
      return;
    }
    if (travel.get() === 'surf') {
      if (!factsAt(loaded, PLAYER_CELL).water) {
        travel.set('walk');
      }
    } else if (knows(Moves.Surf) && besideWater(loaded)) {
      afloat = false;
      travel.set('surf');
    }
    refresh();
  };

  const toggleFly = (): void => {
    const loaded = deps.view();

    if (loaded == null) {
      return;
    }
    if (travel.get() === 'fly') {
      if (canLand(factsAt(loaded, PLAYER_CELL))) {
        travel.set('walk');
      }
    } else if (knows(Moves.Fly) && !loaded.underground) {
      travel.set('fly');
    }
    refresh();
  };

  /** Dig or Teleport: the server moves the player, and the board follows */
  const warp = (field: Moves.Dig | Moves.Teleport): void => {
    if (warping.get()) {
      return;
    }
    warping.set(true);
    refresh();
    (field === Moves.Dig ? useDig() : useTeleport())
      .then((at) => {
        warping.set(false);
        if (at == null) {
          deps.failed(
            field === Moves.Dig ? 'There is no way up within reach.' : 'No town is near enough.',
          );
          refresh();
          return;
        }
        journey.set(null);
        travel.set('walk');
        deps.standHere(at);
        refresh();
      })
      .catch((caught: unknown) => {
        warping.set(false);
        deps.failed(describeFailure(caught));
        refresh();
      });
  };

  /** Drop a ride the board no longer allows, and hand the menu bar what can be used here */
  function refresh(): void {
    const loaded = deps.view();

    if (loaded != null && travel.get() !== 'walk') {
      const mode = travel.get();

      // A buddy put away takes the ride with it, and nothing flies underground
      if (
        !knows(mode === 'surf' ? Moves.Surf : Moves.Fly) ||
        (mode === 'fly' && loaded.underground)
      ) {
        travel.set('walk');
      } else if (mode === 'surf') {
        const wet = factsAt(loaded, PLAYER_CELL).water;

        if (afloat && !wet) {
          travel.set('walk');
        }
        afloat = wet;
      }
    }

    const offers: FieldMoveOffer[] = [];

    if (loaded != null) {
      if (surfOffered(loaded)) {
        offers.push({
          name: 'Surf',
          active: travel.get() === 'surf',
          busy: false,
          use: toggleSurf,
        });
      }
      if (flyOffered(loaded)) {
        offers.push({ name: 'Fly', active: travel.get() === 'fly', busy: false, use: toggleFly });
      }
      if (knows(Moves.Dig) && loaded.underground) {
        offers.push({
          name: 'Dig',
          active: false,
          busy: warping.get(),
          use: () => {
            warp(Moves.Dig);
          },
        });
      }
      if (knows(Moves.Teleport)) {
        offers.push({
          name: 'Teleport',
          active: false,
          busy: warping.get(),
          use: () => {
            warp(Moves.Teleport);
          },
        });
      }
    }
    deps.setFieldMoves(offers);
  }

  /*
   * Being seen
   */

  /** Tell the other players where this one stands */
  function stand(): void {
    sight.get()?.stand(depth.get(), x.get(), y.get(), facing.get());
  }

  let seenBy: string | null = null;

  /** Open the sight once placed, for whoever is signed in, and close it on a change */
  const follow = (): void => {
    const uid = placed.get() ? deps.uid() : null;

    if (uid === seenBy) {
      return;
    }
    sight.get()?.close();
    sight.set(null);
    seenBy = uid;
    if (uid == null) {
      return;
    }

    const opened = openSight(uid, STEP_PACE);

    sight.set(opened);
    opened.setCharset(charset);
    opened.setSeen(deps.elsewhere() == null);
    stand();
  };

  journey.subscribe((plan) => {
    stopPacing();
    if (plan == null) {
      // A walk that ends short of its route says where it stopped
      announced = null;
      sight.get()?.plan(null);
      refresh();
      return;
    }

    const owed = nextStepAt - Date.now();

    if (owed > 0) {
      pacing = setTimeout(pace, owed, plan);
    } else {
      pace(plan);
    }
    refresh();
  });

  return {
    attach: (attached) => {
      board = attached;
      refresh();
    },
    x,
    y,
    depth,
    placed,
    facing,
    journey,
    travel,
    carried,
    sight,
    place: (at) => {
      if (placed.get()) {
        return;
      }
      x.set(worldCell(at.chunkX, at.cellX));
      y.set(worldCell(at.chunkY, at.cellY));
      depth.set(at.depth);
      // Last, so nothing that watches a chunk starts watching the wrong one
      placed.set(true);
      follow();
      refresh();
    },
    standAt,
    settle,
    resume: () => {
      const at = deps.elsewhere();

      if (at == null) {
        return;
      }
      x.set(worldCell(at.chunkX, at.cellX));
      y.set(worldCell(at.chunkY, at.cellY));
      deps.takeWalk();
      stand();
    },
    press,
    stepBy,
    untilNextStep,
    ahead,
    refresh: () => {
      follow();
      // A screen that stood down keeps watching but is not seen, and the
      // paces since the last report go now: nothing else will send them
      const away = deps.elsewhere() != null;

      sight.get()?.setSeen(!away);
      if (away) {
        reportSteps(true);
      }
      refresh();
    },
    setCharset: (next) => {
      charset = next;
      sight.get()?.setCharset(next);
    },
    dispose: () => {
      stopPacing();
      if (saving != null) {
        clearTimeout(saving);
        saving = null;
      }
      // Leaving drops a walk that had not reached the end of its delay,
      // so the last of it is settled on the way out
      if (placed.get()) {
        settle();
      }
      sight.get()?.close();
      sight.set(null);
      deps.setFieldMoves([]);
    },
  };
}
