import {
  type BoardView,
  type Placed,
  type WatchedWindow,
  boardChunks,
  buildBoardView,
  naming,
  runningWindows,
  viewChunks,
} from './board-view';
import challengerOf, { championGate, eliteGate, frontierGate } from './challengers';
import { describeItem } from '../../details';
import { type Journey, stateOf } from './journey';
import { useAuth } from '../../../auth/context';
import type { Unwatch } from '../../../auth/supabase';
import LRUMap from '../../../core/lru-map';
import { settled } from '../../app/resource-reads';
import { type Direction, actionOf, forTheGame } from '../../app/keys';
import settings from '../../app/settings';
import { DEFAULT_CHARSET } from '../../../data/overworld/charsets';
import { watchProfile } from '../../../auth/profile';
import openSight, { type Sight } from '../../../auth/sight';
import { MAX_STEP_REPORT } from '../../../auth/egg';
import type { SnapshotRecord } from '../../../auth/snapshot-record';
import { type EggWalk, type WalkReport, walk } from '../../../auth/eggs';
import type { EncounterRecord } from '../../../auth/encounter-record';
import { getLocalOffset } from '../../../auth/local-time';
import { localNow } from '../../../auth/clock';
import { RaidAction, RaidKind, type RaidView, canJoinRaids, peekRaid } from '../../../auth/raids';
import { type StopRecord, stopIdOf } from '../../../auth/stop-record';
import { claimStopReward, enterStop } from '../../../auth/stops';
import { createSafariSession, isEncounterRetired } from '../../../auth/safari';
import {
  claimApricornTree,
  claimBerryPatch,
  claimItemCache,
  claimNest,
  claimPhenomenon,
  listClaimedItemCaches,
  listClaimedPhenomena,
  listLatheredHoneyTrees,
  listPickedBerryPatches,
  peekNest,
  peekPhenomenonEgg,
  startEncounter,
  visitChunkWindow,
  watchSnapshotWindow,
} from '../../../auth/snapshots';
import type { PlayerIdentity } from '../../../auth/user';
import { type BoardCell, boardIndexOf } from '../../../canvas/board';
import { getSkybox, latitudeOf } from '../../../canvas/daylight';
import { CAVERN } from '../../../canvas/sky';
import { DECORATION_NAMES } from '../../../data/overworld/decoration';
import {
  CHAMPION_NAMES,
  ELITE_MEMBER_NAMES,
  FRONTIER_BRAIN_NAMES,
  GYM_LEADER_NAMES,
  LEGEND_NAMES,
} from '../../../data/overworld/experts';
import { type ItemStack, getItemBand } from '../../../data/overworld/item-pool';
import Landmark, { LANDMARK_NAMES } from '../../../data/overworld/landmark';
import Npc, { NPC_NAMES, NPC_VISIT_TAGS } from '../../../data/overworld/npc';
import type { GymSeatStanding } from '../../../auth/gym-seat-record';
import { enterGymSeat } from '../../../auth/gym-seats';
import { type LandmarkStandings, readLandmarkStandings } from '../../../auth/landmark-standings';
import { CellAura, type SpawnRank } from '../chunk-canvas/scenery';
import GymSeatDialog from '../GymSeatDialog';
import { VENDOR_KIND_NAMES } from '../../../data/overworld/vendor';
import type Phenomenon from '../../../data/overworld/phenomenon';
import { PHENOMENON_NAMES } from '../../../data/overworld/phenomenon';
import type { Species } from '../../../data/ids/species';
import { getSpeciesData } from '../../../data/species';
import { isFeaturedSpecies } from '../../../data/species/day';
import { isLegendarySpecies, isMythicalSpecies } from '../../../data/biome';
import { CHUNK_CELLS, cellInChunk, chunkOfCell, worldCell } from '../../../overworld/chunk';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../../../overworld/chunk-snapshot';
import type { Buddy } from '../../../overworld/core';
import getWorld from '../../../overworld/current';
import type World from '../../../overworld/world';
import { Depth } from '../../../overworld/depth';
import { throughMouth } from '../../../overworld/cave';
import { townAt, townName } from '../../../overworld/town';
import { discoverTown } from '../../../auth/towns';
import { findPathBeside, findPathNear } from '../../../overworld/path';
import type SafariSession from '../../../overworld/safari';
import { isInWorld } from '../../../overworld/world';
import Biome, { isIceBiome } from '../../../data/ids/biome';
import { Moves } from '../../../data/ids/moves';
import { Genders } from '../../../data/ids/species';
import {
  type CellFacts,
  type FieldMove,
  type Travel,
  canEnter,
  canLand,
  canUseFieldMove,
} from '../../../overworld/field-moves';
import { useDig, useTeleport } from '../../../auth/field-moves';
import { type FieldMoveOffer, GameDialog, useGame } from '../../app/game-context';
import { createCellNotes } from '../cell-notes';
import ItemSprite from '../../items/ItemSprite';
import sayItems from '../../items/say-items';
import RaidDialog from '../../raids/RaidDialog';
import { Badge, Button, Note, useToast } from '../../styled';
import NestDialog, { type EggSource, type EggState } from '../NestDialog';
import PortalDialog from '../PortalDialog';
import HoneyTreeDialog from '../HoneyTreeDialog';
import StopDialog, { type StopChallenge } from '../StopDialog';
import SafariDialog from '../SafariDialog';
import ChunkCanvas, { type CellSpot, type RiddenCoat, type SpawnCoat } from '../chunk-canvas';
import NpcDialog from '../npc-dialog';
import {
  type JSX,
  type Resource,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js';
import {
  BOARD_CELLS,
  BOARD_CENTER,
  CLAIM_MEMORY,
  FIGHT_LANDMARKS,
  HARVEST_LANDMARKS,
  ICON_SIZE,
  PLAYER_CELL,
  PUBLISHED_SPAWNS,
  REFRESH_DEBOUNCE,
  SAVE_DELAY,
  SAVE_FLOOR,
  STANDINGS_MEMORY,
  START_CELL,
  STEP_PACE,
  STEP_REPORT_SIZE,
  TOWN_NAME_PACE,
} from './metrics';
import playEffect, { Effect } from '../../app/sound';

/**
 * The overworld as the player walks it: the arrows or the bound keys
 * move one cell at a time and stepping off an edge carries them into
 * the adjacent chunk. A step into something that cannot be walked
 * through turns them to face it, and the interact key is what reaches
 * for whatever they are facing
 */
/**
 * What each claim list answered, by player, list, chunk and window.
 *
 * A claim changes when the player takes something or the window turns
 * over, and neither happens because they walked a square. Kept outside
 * the board, so coming back from a battle or another tab asks nothing
 */
const claimed = new LRUMap<string, Promise<number[]>>(CLAIM_MEMORY);

/**
 * The chunk windows last seen, by layer, zone and chunk. A board mounted
 * again starts from any that are still live instead of reading each one
 */
const keptWindows = new LRUMap<string, SnapshotRecord>(CLAIM_MEMORY);

/**
 * The world itself, which is where the buddy and what has fled are
 * both read.
 *
 * Either read in the body that declared it would throw past every
 * `Suspense` written there and land on the boundary around the whole
 * page — the world is what that boundary would blank
 */
/** Which of the one-per-world kinds a spawn is, or null for everything else */
function rankOf(species: Species): SpawnRank {
  if (isLegendarySpecies(species)) {
    return 'legendary';
  }
  return isMythicalSpecies(species) ? 'mythical' : null;
}

/** The four who keep a house of their own, each a standing fight */
const EXPERT_LANDMARKS = new Set<Landmark>([
  Landmark.GymLeader,
  Landmark.EliteFour,
  Landmark.Champion,
  Landmark.FrontierBrain,
]);

export default function OverworldBoard(props: {
  buddy: Resource<Buddy | null>;
  fled: Resource<Set<string>>;
  onFled: () => void;
}): JSX.Element {
  const auth = useAuth();

  /**
   * The character the player walks as, which is theirs to choose and
   * is earned. Watched rather than read once: changing it in the
   * profile should change who is standing on the chunk behind it
   */
  const [charset, setCharset] = createSignal(DEFAULT_CHARSET);

  createEffect(() => {
    const user = auth.user();

    if (user == null) {
      setCharset(DEFAULT_CHARSET);
      return;
    }
    onCleanup(
      watchProfile(user.uid, (profile) => {
        setCharset(profile?.sprite ?? DEFAULT_CHARSET);
      }),
    );
  });
  /**
   * Where the player is standing, in world cells.
   *
   * The board is a window that follows them rather than the chunk they
   * happen to be in, so this is the one position the game keeps: the
   * chunk and the cell inside it are worked out from it when the
   * server has to be told where somebody is
   */
  const [atX, setAtX] = createSignal(START_CELL);
  const [atY, setAtY] = createSignal(START_CELL);
  /**
   * Which layer they are on. The caves are the same coordinates one
   * layer down, so this is half of saying where the player is: the
   * same cell is open ground above and solid rock below
   */
  const [atDepth, setAtDepth] = createSignal<Depth>(Depth.Surface);
  /** The world the board is reading, which is the layer they are on */
  const around = (): World => getWorld(atDepth());
  const chunkX = (): number => chunkOfCell(atX());
  const chunkY = (): number => chunkOfCell(atY());
  /** The world cell the board's own cell 0 sits on */
  const originX = (): number => atX() - BOARD_CENTER;
  const originY = (): number => atY() - BOARD_CENTER;
  /**
   * Where they are standing on the board, which is the middle of it
   * and always will be: the window moves, they do not
   */
  const cell = (): number => PLAYER_CELL;
  /** A board cell said as a world cell, and the way back */
  const boardOf = (index: number): [number, number] => [
    originX() + (index % BOARD_CELLS),
    originY() + Math.floor(index / BOARD_CELLS),
  ];
  const seatOf = (x: number, y: number): number | null => {
    const bx = x - originX();
    const by = y - originY();

    return bx < 0 || by < 0 || bx >= BOARD_CELLS || by >= BOARD_CELLS
      ? null
      : by * BOARD_CELLS + bx;
  };
  /**
   * How a cell is remembered between steps.
   *
   * A board cell is where something is *now*: take one step east and
   * cell 100 is the square next to the one it was. Anything held on to
   * — a bush stripped, a cache dug, a claim in flight — is keyed by
   * the world cell instead, which does not move
   */
  const keyOf = (index: number): string => boardOf(index).join(',');
  /** The same key for a cell already resolved to its chunk's window */
  const keyAt = (spot: Placed): string =>
    [
      worldCell(spot.snapshot.chunk.x, spot.cell % CHUNK_CELLS),
      worldCell(spot.snapshot.chunk.y, Math.floor(spot.cell / CHUNK_CELLS)),
    ].join(',');
  /** Those keys back on the board, dropping what has since walked off it */
  const seatsIn = (keys: Set<string>): Set<number> => {
    const seats = new Set<number>();

    for (const key of keys) {
      const parts = key.split(',');
      const standing = seatOf(Number(parts[0]), Number(parts[1]));

      if (standing != null) {
        seats.add(standing);
      }
    }
    return seats;
  };
  const [session, setSession] = createSignal<SafariSession<EncounterRecord> | null>(null);
  /**
   * Whether the meeting on screen is one that happens once: a
   * phenomenon's pokemon, or one won and waiting. Both are spent as
   * they are opened, so an overlay press must not be able to throw
   * one away
   */
  const [once, setOnce] = createSignal(false);
  const game = useGame();
  const toast = useToast();
  /**
   * How the board says where a cell is, once it is drawn. Held in a
   * signal rather than a variable because what reads it is built
   * before the canvas that answers it
   */
  const [spotOf, setSpotOf] = createSignal<((cell: number) => CellSpot | null) | null>(null);
  // Asked by world cell, since the board's own seat for a cell moves every step
  const notes = createCellNotes(() => {
    const found = spotOf();

    if (found == null) {
      return null;
    }
    return (x, y) => {
      const seat = seatOf(x, y);

      return seat == null ? null : found(seat);
    };
  });

  /**
   * Say something in passing: over the world for a few seconds, and
   * gone. Nothing here is a question — what a toast reports has
   * already happened — so nothing waits on it being read
   */
  const remark = (message: string, tone?: 'neutral' | 'leaf' | 'ember'): void => {
    toast.push({ message, tone });
  };

  /**
   * Say what a landmark just paid out: **one line per thing**, and the
   * thing itself drawn beside its name.
   *
   * It used to be one card carrying a gallery of everything at once,
   * with the landmark's name over the top of it. That is a lot of
   * screen for a fact that reads "three Poke Balls" — and the name of
   * the landmark is the thing the player just pressed, so it is the
   * one part they already know. A stack of short lines says the same
   * in the corner
   */
  const announce = (at: number, empty: string, items: ItemStack[] | null): void => {
    const [x, y] = boardOf(at);

    if (items == null || items.length === 0) {
      if (!notes.say(x, y, { message: empty, tone: 'neutral' })) {
        remark(empty);
      }
      return;
    }

    for (const stack of items) {
      const said = `${describeItem(stack.item)} ×${stack.amount}`;
      const art = (): JSX.Element => <ItemSprite item={stack.item} size={ICON_SIZE} label="" />;

      // Over the cell where there is a board to hang it on, and in the
      // corner where there is not: a list has no square to point at
      if (!notes.say(x, y, { message: said, art, tone: 'leaf' })) {
        toast.push({ message: said, art, tone: 'leaf' });
      }
    }
  };

  /**
   * Whether an interaction is in flight, so a second click on the
   * same cell does not open the same thing twice
   */
  const [busy, setBusy] = createSignal(false);
  const [placed, setPlaced] = createSignal(false);
  /**
   * The player's own offset from UTC. The world's instants come from
   * the server, but which hour of the day they fall in is theirs —
   * and it scopes everything they see, so a player in another zone
   * walks a chunk of their own
   */
  const zone = getLocalOffset();
  /**
   * The grunt standing in the player's way, once they have walked
   * into one: the stop's id and what it is fielding, until the
   * challenge is taken or declined
   */
  const [challenge, setChallenge] = createSignal<[string, StopRecord] | null>(null);

  /**
   * Who put the challenge: the grunt's ambush or the trainer's duel.
   * It decides the dialog's copy and what winning promises; the coat
   * is the style they were wandering in, so the portrait matches
   */
  const [challengerNpc, setChallengerNpc] = createSignal<Npc>(Npc.RocketGrunt);

  const [challengeCoat, setChallengeCoat] = createSignal<string | undefined>(undefined);

  /**
   * Whose challenge is on the table, named: the duellist's class, the
   * gym's leader, an elite's seat or the Champion. Null for a Team
   * Rocket grunt, whom the dialog names itself
   */
  const [challenger, setChallenger] = createSignal<StopChallenge | null>(null);
  /**
   * The passer-by the player has stopped at: the cell they are
   * standing on and who is on it this window, until their business is
   * done or declined
   */
  const [wanderer, setWanderer] = createSignal<[Placed, Npc] | null>(null);
  /**
   * The portal cell the player is standing at, or null. What it opens
   * onto is derived in the dialog rather than here
   */
  const [portal, setPortal] = createSignal<Placed | null>(null);
  /** The honey tree the player is standing at, or null */
  const [honeyTree, setHoneyTree] = createSignal<Placed | null>(null);
  /** Its world cell, as the lathered list names it */
  const treeKey = (): string => {
    const tree = honeyTree();

    return tree == null ? '' : keyAt(tree);
  };
  /**
   * The gym seat the player has walked up to: the cell, and where
   * this player stands with it — who holds it, when they may
   * challenge again, and whether they are the one just beaten off it
   */
  const [seat, setSeat] = createSignal<[Placed, GymSeatStanding] | null>(null);
  /**
   * The lair the player is standing in front of, and what it holds.
   * Looking at one stages nothing — the dialog's button is where a
   * lobby is opened or joined
   */
  const [lair, setLair] = createSignal<[Placed, RaidView | null] | null>(null);
  /**
   * What the lair dialog says when there is nothing standing in it
   */
  const [lairReason, setLairReason] = createSignal<string | null>(null);
  /**
   * The two dialogs that are handed a window and a cell of it. The
   * board says where things are in its own numbers, so the cell they
   * are given is the chunk's rather than the board's
   */
  const standingNpc = (): [number, Npc] | null => {
    const open = wanderer();

    return open == null ? null : [open[0].cell, open[1]];
  };
  const standingLair = (): [number, RaidView | null] | null => {
    const open = lair();

    return open == null ? null : [open[0].cell, open[1]];
  };
  /**
   * The raid items the player carries, each with what it calls. They
   * are used where the player stands, so they live here rather than
   * in the bag listing
   */
  // Where they were put by the provider, which is the one place the
  // position is worked out: a tab panel unmounts when it is left, so
  // walking back into the Overworld is a remount, and it must pick up
  // where the walk left off rather than start again
  createEffect(() => {
    const at = game.position();

    if (at == null || placed()) {
      return;
    }
    setAtX(worldCell(at.chunkX, at.cellX));
    setAtY(worldCell(at.chunkY, at.cellY));
    setAtDepth(at.depth);
    // Last, so nothing that watches a chunk starts watching the wrong
    // one: the whole overworld waits on being placed
    setPlaced(true);
  });

  // Put somewhere by something other than a walk (a staff teleport, Dig
  // or Teleport), which has to move the board's own coordinates. Deferred
  // so a remount after a battle does not replay a move walked away from
  createEffect(
    on(
      game.moved,
      (at) => {
        if (at == null || !placed()) {
          return;
        }
        setAtX(worldCell(at.chunkX, at.cellX));
        setAtY(worldCell(at.chunkY, at.cellY));
        setAtDepth(at.depth);
      },
      { defer: true },
    ),
  );

  /**
   * The windows of every chunk the board overlaps, by chunk key.
   *
   * One subscription apiece: what time it is there and what is
   * standing in it arrive together, since they are one document, and a
   * spawn caught by another player disappears from every screen the
   * moment its window is rewritten. Kept as a map rather than a single
   * value because the board straddles chunks now, and a board waiting
   * on all four of them at once would blank whenever any one of them
   * turned over
   */
  const [windows, setWindows] = createSignal<Map<string, WatchedWindow>>(new Map());

  /**
   * The chunks the board is showing. A memo compared by content so
   * that a step staying inside the same four is not a reason to open
   * the subscriptions again: the window moves a cell at a time and the
   * chunks under it change every sixteen
   */
  const overlapped = createMemo(() => boardChunks(originX(), originY()), [], {
    equals: (was, now) => {
      if (was.length !== now.length) {
        return false;
      }
      for (const [at, [x, y]] of was.entries()) {
        if (x !== now[at][0] || y !== now[at][1]) {
          return false;
        }
      }
      return true;
    },
  });

  /**
   * The windows the board is showing, named by chunk and by the
   * instant each was rolled. What is read once per window rather than
   * once per step hangs off this: a step that changes neither is not a
   * reason to ask the server anything
   */
  const windowKey = createMemo(() => {
    const parts: string[] = [];

    for (const [x, y] of overlapped()) {
      parts.push(`${x},${y}@${windows().get(`${x},${y}`)?.record.timestamp ?? ''}`);
    }
    return parts.join(' ');
  });

  /** Every chunk the board draws, which is further out than the ones it watches */
  const seen = createMemo(() => viewChunks(originX(), originY()), [], {
    equals: (was, now) => was.join(' ') === now.join(' '),
  });

  /**
   * The subscription open on each chunk the board is watching.
   *
   * Held across the effect rather than inside it, so a step that
   * changes which chunks are in range stops the ones that left and
   * starts the ones that arrived instead of closing every socket and
   * opening it again. The set turns over every eight cells or so,
   * and each fresh watcher costs a read
   */
  const watched = new Map<string, Unwatch>();
  /** Which layer those subscriptions are open on */
  const watchedLayer: { depth: Depth | null } = { depth: null };

  /**
   * Seeing into a chunk publishes (or adopts) its window's spawns;
   * everything after that arrives through the subscriptions below,
   * so a window rolling over or a spawn another player caught shows
   * up without a reload.
   *
   * Every chunk the board overlaps, not only the one the player is
   * standing in: what is drawn is what is being looked at, and a
   * quarter of the board left unrolled would be a field with nothing
   * in it until the player crossed into it
   */
  /** Chunks with a visit on its way, so a second ask for one waits on the first */
  const visiting = new Set<string>();

  const visit = (x: number, y: number, known?: SnapshotRecord | null): void => {
    const key = `${x},${y}`;

    if (visiting.has(key)) {
      return;
    }
    visiting.add(key);

    const depth = untrack(atDepth);

    // The window always rolls the lure's extras, so every player of
    // the chunk shares one set of rolls whoever publishes them
    visitChunkWindow(around().getChunk(x, y), PUBLISHED_SPAWNS, zone, known)
      .then((record) => {
        // Taken as it was published, since the watch lets its own window's echo pass unread
        if (watchedLayer.depth !== depth || !watched.has(key)) {
          return;
        }
        keptWindows.set(`${depth}|${zone}|${key}`, record);
        setWindows((held) => new Map(held).set(key, { x, y, record }));
      })
      .catch((caught: unknown) => {
        remark(caught instanceof Error ? caught.message : String(caught), 'ember');
      })
      .finally(() => {
        visiting.delete(key);
      });
  };

  /** Whether a window still stands, which is when visiting its chunk would only read it again */
  const isLive = (record: WatchedWindow['record']): boolean =>
    record.spawns.length > 0 && localNow(zone) < record.timestamp + SNAPSHOT_INTERVAL;

  /**
   * Visit the chunks whose window is missing or has run out; the watch
   * below already carries a live one's changes. `everything` is for a
   * board caught behind the world, which may be wrong about what is live
   */
  const refreshWindow = (everything = false): void => {
    const held = windows();

    for (const [x, y] of overlapped()) {
      const record = held.get(`${x},${y}`)?.record;

      if (everything || record == null || !isLive(record)) {
        // A board caught behind the world cannot trust what it holds, so that is read again
        visit(x, y, everything ? undefined : record);
      }
    }
  };

  /**
   * When the chunk was last asked for. It is a plain variable rather
   * than a signal: nothing renders off it, and a debounce that caused
   * a redraw would be a strange thing
   */
  let askedAt = 0;

  /**
   * Ask for the chunk, unless it was just asked for. `whatever` skips
   * the five-second wait, for coming back to the page or a window
   * running out. A chunk walked into is asked for by its watch instead
   */
  const askForWindow = (whatever = false, everything = false): void => {
    const at = Date.now();

    if (!whatever && at - askedAt < REFRESH_DEBOUNCE) {
      return;
    }
    askedAt = at;
    refreshWindow(everything);
  };

  /**
   * The page coming back to the front.
   *
   * A tab left open all afternoon is showing an afternoon-old chunk.
   * Nothing is polling for it any more, so the moment somebody looks
   * at the page again is the moment to find out what is there
   */
  onMount(() => {
    const onReturn = (): void => {
      if (document.visibilityState === 'visible' && placed()) {
        askForWindow(true);
      }
    };

    // Only a return from hidden: a tab that was merely unfocused kept its timers running
    document.addEventListener('visibilitychange', onReturn);

    onCleanup(() => {
      document.removeEventListener('visibilitychange', onReturn);
    });
  });

  createEffect(() => {
    // Nothing is watched until the player has been put somewhere:
    // chunk 0,0 is not where they are, and publishing its window
    // would be a visit nobody made
    if (!placed()) {
      return;
    }

    const wanted = overlapped();
    const depth = atDepth();
    const keys = new Set<string>();

    // A cave has the same chunk coordinates as the ground above it, so a
    // change of layer drops every window: kept, the board drew one layer's
    // spawns under the other layer's ids and met a different pokemon
    if (depth !== watchedLayer.depth) {
      for (const stop of watched.values()) {
        stop();
      }
      watched.clear();
      setWindows(new Map());
      watchedLayer.depth = depth;
    }

    for (const [x, y] of wanted) {
      keys.add(`${x},${y}`);
    }

    for (const [key, stop] of watched) {
      if (!keys.has(key)) {
        stop();
        watched.delete(key);
      }
    }
    // What the board has walked away from is dropped rather than left
    // to be drawn if the player walks back before it is re-read
    setWindows((held) => {
      const kept = new Map<string, WatchedWindow>();

      for (const [key, watching] of held) {
        if (keys.has(key)) {
          kept.set(key, watching);
        }
      }
      return kept;
    });

    for (const [x, y] of wanted) {
      const key = `${x},${y}`;

      if (watched.has(key)) {
        continue;
      }

      const kept = keptWindows.get(`${depth}|${zone}|${key}`);

      watched.set(
        key,
        watchSnapshotWindow(
          around().getChunk(x, y),
          zone,
          (record) => {
            // A read that was already on its way when the layer changed
            if (watchedLayer.depth !== depth) {
              return;
            }
            if (record == null) {
              keptWindows.delete(`${depth}|${zone}|${key}`);
            } else {
              keptWindows.set(`${depth}|${zone}|${key}`, record);
            }
            setWindows((held) => {
              const next = new Map(held);

              if (record == null) {
                next.delete(key);
              } else {
                next.set(key, { x, y, record });
              }
              return next;
            });
            // Nobody has published this window yet, so this board does
            // and keeps what it published
            if (record == null || !isLive(record)) {
              visit(x, y, record);
            }
          },
          () => untrack(windows).get(key)?.record.timestamp,
          kept == null || !isLive(kept) ? undefined : kept,
        ),
      );
    }
  });

  onCleanup(() => {
    for (const stop of watched.values()) {
      stop();
    }
    watched.clear();
  });

  /** Bumped when a window the board is showing runs out */
  const [expiries, setExpiries] = createSignal(0);

  // Nothing else asks for a window while the player stands still, so the
  // soonest one to run out is what wakes the board to ask for the next
  createEffect(() => {
    const held = windows();

    if (!placed()) {
      return;
    }

    const now = localNow(zone);
    let soonest = Number.POSITIVE_INFINITY;

    for (const { record } of held.values()) {
      const ends = record.timestamp + SNAPSHOT_INTERVAL;

      if (ends > now) {
        soonest = Math.min(soonest, ends);
      }
    }
    if (!Number.isFinite(soonest)) {
      return;
    }

    const timer = setTimeout(() => {
      setExpiries((count) => count + 1);
      // A hidden tab asks nothing: coming back to the page catches up
      if (document.visibilityState === 'visible') {
        askForWindow(true);
      }
    }, soonest - now);

    onCleanup(() => {
      clearTimeout(timer);
    });
  });

  // Rather than staying pressable and answering "too late"
  const liveWindows = createMemo(() => {
    expiries();
    return runningWindows(windows(), localNow(zone));
  });

  // What walks beside the player changes what the chunk holds, so the
  // buddy's effects are read alongside it
  const buddy = (): Buddy | null | undefined => settled(props.buddy);

  /**
   * What has run from this player. Re-read when a meeting ends, since
   * the one that just fled is the one that has to stop being drawn
   */
  const fled = (): Set<string> | undefined => settled(props.fled);

  /**
   * What is on the board.
   *
   * A memo, and not a plain call: half the game asks for it (a walk
   * asks four times a second, a press asks twice) and building it is
   * four windows' worth of rolling. Read plainly, every one of those
   * asks was a fresh world.
   *
   * Null only until the player has been put somewhere, which is the
   * one wait worth a loading screen. Everything after that draws,
   * window landed or not
   */
  const view = createMemo(() =>
    placed()
      ? buildBoardView(
          originX(),
          originY(),
          liveWindows(),
          zone,
          auth.user()?.uid ?? null,
          buddy() ?? null,
          fled() ?? new Set(),
          atDepth(),
          localNow(zone),
        )
      : null,
  );

  /**
   * The cells whose happening this player has already walked into.
   *
   * A phenomenon is claimed once an hour per player, so one already
   * taken is a cell that would answer nothing. It is dropped from the
   * board the moment it pays out rather than left standing to be
   * pressed again, and re-read from the store on arrival so it stays
   * dropped across a reload or a walk back into the chunk
   */
  const [spent, setSpent] = createSignal<Set<string>>(new Set());

  /**
   * A claim list read from every chunk the board draws, gathered into
   * one set of world cells. Out past the watched chunks there is no
   * window to hand the server, so the current one stands in: a claim is
   * stamped with its landmark or phenomenon window, which the clock
   * alone decides
   */
  const gather = (
    named: string,
    ask: (snapshot: ChunkSnapshot) => Promise<number[]>,
    take: (cells: Set<string>) => void,
    /** The window the list's claims are stamped with, which is what makes a remembered answer stale */
    stamp: (snapshot: ChunkSnapshot) => number,
  ): void => {
    const loaded = untrack(view);

    if (loaded == null) {
      return;
    }

    const who = untrack(() => auth.user()?.uid ?? '');
    const held = new Map<string, (typeof loaded.chunks)[number]>();

    for (const piece of loaded.chunks) {
      held.set(`${piece.x},${piece.y}`, piece);
    }

    const current = Math.floor(localNow(zone) / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;
    const lists: Promise<string[]>[] = [];
    let live = true;

    for (const [x, y] of untrack(seen)) {
      const piece = held.get(`${x},${y}`) ?? {
        x,
        y,
        snapshot: new ChunkSnapshot(untrack(around).getChunk(x, y), current, zone),
        world: (at: number): [number, number] => [
          x * CHUNK_CELLS + (at % CHUNK_CELLS),
          y * CHUNK_CELLS + Math.floor(at / CHUNK_CELLS),
        ],
      };

      lists.push(
        (async (): Promise<string[]> => {
          // The player is in the key because a claim is theirs: signing
          // in as somebody else must not read back the last one's
          const key = `${who}|${named}|${piece.snapshot.depth}|${piece.x},${piece.y}|${stamp(piece.snapshot)}`;
          const known = claimed.get(key) ?? ask(piece.snapshot);

          claimed.set(key, known);
          try {
            const cells: string[] = [];

            for (const taken of await known) {
              cells.push(piece.world(taken).join(','));
            }
            return cells;
          } catch (caught) {
            // A list that failed is not the answer for the rest of the
            // window: it is asked again the next time the board looks
            claimed.delete(key);
            throw caught;
          }
        })(),
      );
    }

    Promise.all(lists)
      .then((found) => {
        if (live) {
          take(new Set(found.flat()));
        }
      })
      .catch(() => {
        // A board that cannot say what was already taken draws it all:
        // pressing a spent cell costs a refusal, not a mistake
      });
    onCleanup(() => {
      live = false;
    });
  };

  /** Patches, caches and honey trees refill with the landmarks, not with the spawns */
  const landmarkWindow = (snapshot: ChunkSnapshot): number => snapshot.landmarkTimestamp;

  /**
   * Forget what the server said about claims.
   *
   * Called when this player takes something, which is the one thing
   * that can make a remembered list wrong. A press is rare next to a
   * step, so the whole lot is dropped rather than the one entry: the
   * next look asks again and the board agrees with the store
   */
  const forgetClaims = (): void => {
    claimed.clear();
  };

  createEffect(() => {
    // Read again when a window turns over, and not when the player
    // takes a step: the board moves under them constantly
    windowKey();
    seen();
    gather(
      'phenomena',
      listClaimedPhenomena,
      (cells) => {
        setSpent(cells);
      },
      (snapshot) => snapshot.phenomenonTimestamp,
    );
  });

  /**
   * The patches this player has already stripped this window.
   *
   * Read from the store on arrival rather than only remembered from the
   * press, so a bare bush stays bare across a reload or a walk back
   * into the chunk. The markers behind it are keyed by the window, so
   * the set empties itself when the patches grow again
   */
  const [picked, setPicked] = createSignal<Set<string>>(new Set());

  /**
   * The caches this player has already dug up this window, which the
   * board draws open and empty. Read from the store for the same
   * reason the bare bushes are: an emptied cache should stay emptied
   * across a reload
   */
  const [dug, setDug] = createSignal<Set<string>>(new Set());

  /** The honey trees this player has lathered this window, by world cell */
  const [lathered, setLathered] = createSignal<Set<string>>(new Set());

  createEffect(() => {
    windowKey();
    seen();
    gather(
      'patches',
      listPickedBerryPatches,
      (cells) => {
        setPicked(cells);
      },
      landmarkWindow,
    );
    gather(
      'caches',
      listClaimedItemCaches,
      (cells) => {
        setDug(cells);
      },
      landmarkWindow,
    );
    gather(
      'honey',
      listLatheredHoneyTrees,
      (cells) => {
        setLathered(cells);
      },
      landmarkWindow,
    );
  });

  /**
   * The glow under each landmark saying where this player stands with
   * it. Re-read when a dialog that can change it closes; a battle
   * unmounts the board, so coming back from one reads it afresh
   */
  const [rechecked, setRechecked] = createSignal(0);
  /**
   * Standings already read, by chunk and window, so walking back into a
   * chunk asks nothing. Kept briefly, since a seat can change hands
   * without this player doing anything
   */
  const standingsRead = new LRUMap<string, { at: number; read: Promise<LandmarkStandings> }>(
    CLAIM_MEMORY,
  );
  const recheck = (): void => {
    standingsRead.clear();
    setRechecked((count) => count + 1);
  };

  // A step inside the same chunk and windows asks nothing new, so the
  // read waits for one of those, or a recheck, to change
  const standingsAsk = createMemo(
    (): { snapshot: ChunkSnapshot; uid: string; key: string; rechecked: number } | null => {
      const loaded = view();
      const user = auth.user();

      if (loaded == null || user == null) {
        return null;
      }
      const { snapshot } = loaded;

      return {
        snapshot,
        uid: user.uid,
        key: `${user.uid}|${snapshot.key}|${snapshot.raidTimestamp}|${snapshot.npcTimestamp}|${snapshot.nestTimestamp}`,
        rechecked: rechecked(),
      };
    },
    null,
    {
      equals: (before, after) =>
        before?.key === after?.key && before?.rechecked === after?.rechecked,
    },
  );
  const [standings, setStandings] = createSignal<{
    snapshot: ChunkSnapshot;
    read: LandmarkStandings;
  } | null>(null);

  createEffect(() => {
    const ask = standingsAsk();

    if (ask == null) {
      return;
    }

    let live = true;
    const now = Date.now();
    let known = standingsRead.get(ask.key);

    if (known == null || now - known.at > STANDINGS_MEMORY) {
      known = { at: now, read: readLandmarkStandings(ask.snapshot, ask.uid) };
      standingsRead.set(ask.key, known);
    }

    const { read: reading } = known;

    reading
      .then((read) => {
        if (live) {
          setStandings({ snapshot: ask.snapshot, read });
        }
      })
      .catch(() => {
        // No glow is the board as it was: every press still asks, and the next look reads again
        standingsRead.delete(ask.key);
      });
    onCleanup(() => {
      live = false;
    });
  });

  // The standings name chunk cells and the glow sits on board cells,
  // so each landmark is placed back into the chunk it was read for
  const auras = createMemo(() => {
    const loaded = view();
    const held = standings();
    const uid = auth.user()?.uid;
    const next = new Map<number, CellAura>();

    if (loaded == null || held == null || uid == null) {
      return next;
    }
    const { snapshot, read } = held;
    const latheredNow = lathered();

    for (const [at, landmark] of loaded.landmarks) {
      const spot = loaded.at(at);

      if (spot == null || spot.snapshot.key !== snapshot.key) {
        continue;
      }
      const inChunk = spot.cell;

      if (landmark === Landmark.LegendaryLair || landmark === Landmark.ShadowLair) {
        if (read.cleared.has(inChunk)) {
          next.set(at, CellAura.Cleared);
        }
      } else if (landmark === Landmark.GymSeat) {
        const holder = read.seats.get(inChunk);

        if (holder != null) {
          next.set(at, holder === uid ? CellAura.Mine : CellAura.Fight);
        }
      } else if (landmark === Landmark.Trainer || landmark === Landmark.TeamRocket) {
        const staged =
          snapshot.getTrainerStops().has(inChunk) || snapshot.getRocketStops().has(inChunk);

        if (staged && !read.beaten.has(inChunk)) {
          next.set(at, CellAura.Fight);
        }
      } else if (EXPERT_LANDMARKS.has(landmark)) {
        // An expert's house is a fight waiting like any other. Whether
        // they will take the challenge is theirs to say at the door
        const staged =
          landmark === Landmark.FrontierBrain
            ? snapshot.getFrontierBrain(inChunk) != null
            : snapshot.getGymStops().has(inChunk) ||
              snapshot.getEliteStops().has(inChunk) ||
              snapshot.getChampionStops().has(inChunk);

        if (staged && !read.beaten.has(inChunk)) {
          next.set(at, CellAura.Fight);
        }
      } else if (landmark === Landmark.WanderingNpc) {
        const standing = snapshot.getStandingNpc(inChunk);

        if (standing != null && NPC_VISIT_TAGS.has(standing) && !read.visited.has(inChunk)) {
          next.set(at, CellAura.Fresh);
        }
      } else if (landmark === Landmark.Nest) {
        if (snapshot.getNests().has(inChunk) && !read.taken.has(inChunk)) {
          next.set(at, CellAura.Fresh);
        }
      } else if (landmark === Landmark.HoneyTree) {
        // Still holding this window's honey for this player, the way an unclaimed nest does
        if (!latheredNow.has(keyAt(spot))) {
          next.set(at, CellAura.Fresh);
        }
      }
    }
    return next;
  });

  /**
   * The cells whose claim is still with the server.
   *
   * A cache, a patch, a tree and a happening all pay out on the press
   * itself: nothing opens over the board to stop a second press, and
   * the cell goes on looking exactly as it did until the answer comes
   * back. Held shut until it does, so a mashed cell is claimed once
   */
  const [claiming, setClaiming] = createSignal<Set<string>>(new Set());

  const holdCell = (index: number, held: boolean): void => {
    const spot = keyOf(index);

    setClaiming((cells) => {
      const next = new Set(cells);

      if (held) {
        next.add(spot);
      } else {
        next.delete(spot);
      }
      return next;
    });
  };

  /**
   * What is going on at a cell, once what this player has already had
   * is taken out of it
   */
  const showing = (loaded: BoardView, index: number): Phenomenon | undefined =>
    spent().has(keyOf(index)) ? undefined : loaded.phenomena.get(index);

  /**
   * Everything still going on, as the canvas draws it
   */
  const happenings = (loaded: BoardView): Map<number, Phenomenon> => {
    const live = new Map(loaded.phenomena);

    for (const taken of seatsIn(spent())) {
      live.delete(taken);
    }
    return live;
  };

  /**
   * Shut a wanderer's dialog once they have walked on.
   *
   * Three hours is long enough to be standing in one when the window
   * turns over, and the person who was there is then somebody else.
   * Everything the dialog offers is derived from the live window by
   * the server, so what is on screen would be refused anyway: it is
   * closed rather than left offering a stranger's business
   */
  createEffect(() => {
    const open = wanderer();

    if (open != null && open[0].snapshot.getStandingNpc(open[0].cell) !== open[1]) {
      setWanderer(null);
    }
  });

  /**
   * Which regions this session has already reported, so standing in a
   * plaza does not ask about the same town on every redraw. The row
   * itself is written once and for good
   */
  const reported = new Set<string>();
  /**
   * And which town they are standing in, which is a different question:
   * the register is answered once a session, and the name is said every
   * time somebody walks in. Leaving and coming back is walking in again
   */
  let standingIn: string | null = null;
  /** The town last named and when, so pacing along its edge does not repeat it */
  let named: string | null = null;
  let namedAt = 0;

  // Walking into a town says its name and puts it on everybody's
  // register. The register costs nothing, takes nothing and is not a
  // claim: it is what makes the town somewhere the portals will cross
  // to, for everybody
  createEffect(() => {
    // Nothing until the walk knows where it is. The board stands in the
    // middle of chunk zero until the stored position lands, and a town
    // sitting there is not one anybody has been to
    if (!placed()) {
      return;
    }
    // Read on the layer they are on: a cave under a town is not the
    // town, and somebody crossing beneath it has walked into nothing
    const town = townAt(around(), atX(), atY());
    const key = town == null ? null : `${town.regionX},${town.regionY}`;

    if (key !== standingIn) {
      standingIn = key;
      // The one place in the world with a name of its own. A border is
      // not drawn anywhere, so being told is how a player knows
      if (town != null && (key !== named || Date.now() - namedAt >= TOWN_NAME_PACE)) {
        named = key;
        namedAt = Date.now();
        remark(townName(town), 'leaf');
      }
    }
    if (key == null || town == null || reported.has(key)) {
      return;
    }
    reported.add(key);
    discoverTown(town.regionX, town.regionY).catch(() => {
      // Nothing on screen is riding on it: the name is derived either
      // way, and only crossing to the town wants the register
      reported.delete(key);
    });
  });

  // Where they are, said at the top of the menu. The menu is a sibling
  // of the world rather than a child of it, so the words are published
  // upwards and cleared on the way out — a battle takes the page, and
  // the place under it is not where the player is standing any more
  createEffect(() => {
    const standing = view();

    game.setPlace(standing == null ? null : naming(standing));
    game.setWeather(standing == null ? null : standing.weather);
  });

  onCleanup(() => {
    game.setPlace(null);
    game.setWeather(null);
  });

  /**
   * An egg that has been found and not yet accepted.
   *
   * Both places one turns up — a nest, and the one grotto in sixty-four
   * that is hiding one instead of a pokemon — offer it the same way,
   * so they share the dialog and the answer. `message` is what came of
   * accepting, once the player has: while it is null the dialog is
   * still asking
   */
  const [eggOffer, setEggOffer] = createSignal<{
    /** Where the egg is, in the words the server knows the cell by */
    spot: Placed;
    /** And where it is on the board, which is where the answer is shown */
    cell: number;
    from: EggSource;
    state: EggState;
    message: string | null;
  } | null>(null);
  const [taking, setTaking] = createSignal(false);

  /**
   * Whether the player is in the middle of something.
   *
   * Every one of these is a dialog standing over the board, and the
   * board underneath it is still a board: a press on it walked the
   * player away from whatever they had opened, and a press on another
   * landmark opened a second thing behind the first. So a press is
   * refused for as long as one of them is up, and the way on is to
   * finish or close what is already open.
   *
   * `busy` is the other half of it and a shorter one: the moment
   * between the press and whatever it opens
   */
  const engaged = (): boolean =>
    session() != null ||
    challenge() != null ||
    wanderer() != null ||
    portal() != null ||
    seat() != null ||
    lair() != null ||
    eggOffer() != null;
  /**
   * Which way round the board is being looked at. It outlives the
   * chunk it was turned in
   */
  const [yaw, setYaw] = createSignal(0);

  /**
   * Take it. The claim is the same call the landmark always made —
   * the peek above wrote nothing, so this is still the first and only
   * write, and a second player standing at the same nest is unaffected
   */
  const takeEgg = (): void => {
    const offer = eggOffer();

    if (offer == null || taking()) {
      return;
    }
    setTaking(true);
    (offer.from === 'nest'
      ? claimNest(offer.spot.snapshot, offer.spot.cell)
      : claimPhenomenon(offer.spot.snapshot, offer.spot.cell).then((claim) =>
          claim?.kind === 'egg' ? claim.catchId : null,
        )
    )
      .then((catchId) => {
        setTaking(false);
        setEggOffer((standing) =>
          standing == null
            ? null
            : {
                ...standing,
                message:
                  catchId == null
                    ? 'It is gone. Somebody beat you to it, or the window turned over.'
                    : 'Yours now. Walk it warm and see what hatches.',
              },
        );

        if (catchId != null) {
          playEffect(Effect.EggGet);
          // A new record, under whatever list is showing behind this
          game.touchRecords();
        }
        // A grotto that has been opened is spent for this player,
        // whichever way the answer went: the cell stops being drawn
        if (offer.from === 'grotto') {
          setSpent((cells) => new Set(cells).add(keyAt(offer.spot)));
          forgetClaims();
        } else {
          // Its ring goes once the egg is taken
          recheck();
        }
      })
      .catch((caught: unknown) => {
        setTaking(false);
        setEggOffer((standing) =>
          standing == null
            ? null
            : {
                ...standing,
                message: caught instanceof Error ? caught.message : String(caught),
              },
        );
      });
  };

  /**
   * The egg walking with the player, as of the last report. Null
   * while they carry none — which is most of the time, and costs
   * nothing to keep asking about
   */
  const [carried, setCarried] = createSignal<EggWalk | null>(null);
  /**
   * Paces walked but not yet reported, and whether a report is in
   * flight. Neither belongs in a signal: nothing renders from them
   */
  let pending = 0;
  let reporting = false;
  /** When the position was last written, which is what SAVE_FLOOR is measured from */
  let settledAt = 0;

  /**
   * Hand the paces walked so far to the server. A walk in progress
   * reports in batches of `STEP_REPORT_SIZE`; `force` is for the
   * moments a walk **stops** — the same moments the position is
   * written down — where the last few paces are worth keeping even
   * though they are not a batch
   */
  const takeReport = (report: WalkReport | null): void => {
    setCarried(report?.egg ?? null);

    // A find is worth saying out loud: it lands in the bag while
    // the player is looking at the map rather than at their
    // inventory, and nothing else would tell them
    if (report != null && report.picked.length > 0) {
      sayItems(toast, report.picked, 'Your buddy found');
    }
  };

  const reportSteps = (force = false): void => {
    if (reporting || pending === 0 || (!force && pending < STEP_REPORT_SIZE)) {
      return;
    }
    // Nobody walking alongside means nothing on the server to credit
    if (buddy() === null) {
      pending = 0;
      return;
    }

    // Past the cap the server would drop them, so the rest wait for the next report
    const steps = Math.min(pending, MAX_STEP_REPORT);

    pending -= steps;
    reporting = true;
    walk(steps)
      .then(takeReport)
      .catch(() => {
        // A dropped report is a few paces, not an error worth
        // interrupting the walk over; the next one carries on
      })
      .finally(() => {
        reporting = false;
      });
  };

  /**
   * Where they stopped, and what it cost the egg they are carrying.
   *
   * The two settle together on purpose. A position saved without the
   * paces that led to it would have a player come back further along
   * than their egg — the walk would have happened to the map and not
   * to the egg — so the steps go first and the position follows
   */
  const settle = (chunk: number, row: number, x: number, y: number): void => {
    // A screen that has stood down writes nothing. Its coordinates are
    // where the player used to be, and putting them back would take
    // the walk off whichever screen has it
    if (game.elsewhere() != null) {
      return;
    }
    settledAt = Date.now();
    // The paces ride the save, unless a report is already out with them
    const steps = reporting ? 0 : pending;

    if (steps > 0) {
      pending = 0;
      reporting = true;
    }
    // What the rest of the game is told, so the world map's camera is
    // looking at the chunk the player is actually in — and so a
    // remount of this tab picks the walk up rather than the record
    game.setPosition({
      player: auth.user()?.uid ?? '',
      chunkX: chunk,
      chunkY: row,
      cellX: x,
      cellY: y,
      depth: atDepth(),
      movedAt: Date.now(),
    });
    game
      .settleWalk(chunk, row, x, y, atDepth(), steps)
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

  /**
   * Standing down ends the walk here, so the paces walked since the
   * last report go now. Nothing else will send them: the settle they
   * would have ridden is refused for as long as another screen has the
   * walk
   */
  createEffect(() => {
    if (game.elsewhere() != null) {
      reportSteps(true);
    }
  });

  /**
   * Take the walk back: stand where the other screen left the player
   * and write it down, which is what stands that screen down in turn
   */
  const resume = (): void => {
    const at = game.elsewhere();

    if (at == null) {
      return;
    }
    setAtX(worldCell(at.chunkX, at.cellX));
    setAtY(worldCell(at.chunkY, at.cellY));
    game.takeWalk();
  };

  // ...and remembered as they walk. A step is a keypress, so the
  // writes are held back to one every SAVE_DELAY: the effect re-runs
  // on every move and clears the timer it set last time, so what
  // lands is where they stopped rather than every square they crossed.
  // SAVE_FLOOR holds the rest of the wait, since a walk of two steps
  // and a pause, over and over, is otherwise a write every few seconds
  createEffect(() => {
    const user = auth.user();
    const at = {
      chunkX: chunkX(),
      chunkY: chunkY(),
      cellX: cellInChunk(atX()),
      cellY: cellInChunk(atY()),
    };

    if (user == null || !placed()) {
      return;
    }

    const owed = Math.max(SAVE_DELAY, SAVE_FLOOR - (Date.now() - settledAt));
    const timer = setTimeout(() => {
      settle(at.chunkX, at.chunkY, at.cellX, at.cellY);
    }, owed);

    onCleanup(() => {
      clearTimeout(timer);
    });
  });

  // Leaving the tab unmounts it, which would drop a walk that had not
  // reached the end of its delay — so the last of it is settled on the
  // way out rather than thrown away
  onCleanup(() => {
    if (placed()) {
      settle(chunkX(), chunkY(), cellInChunk(atX()), cellInChunk(atY()));
    }
  });

  const move = (deltaX: number, deltaY: number): void => {
    // The walk is on another screen: this one is a picture of where
    // the player was until somebody asks for it back
    if (game.elsewhere() != null) {
      return;
    }
    // A step is a reason to wonder what is around, at most every few
    // seconds of walking
    askForWindow();

    const x = atX() + deltaX;
    const y = atY() + deltaY;

    // The world is finite: its outermost chunks have nothing beyond
    // them, so a walk into the edge goes nowhere
    if (!isInWorld(chunkOfCell(x), chunkOfCell(y))) {
      return;
    }

    // Nothing else happens: a boundary is a line on a map now, and
    // crossing one moves the window a cell like every other step
    setAtX(x);
    setAtY(y);
    // A cell crossed is a step walked, and an egg only moves while it
    // is the one being carried
    pending += 1;
    reportSteps();
  };

  /**
   * Meet a spawn (or a grotto's pokemon): the encounter is derived
   * once per player and the safari session opens over it.
   *
   * `once` is for the meetings there is no walking back to: the cell
   * is spent as it is claimed, so the dialog is closed by its own
   * buttons rather than by a press on the world behind it
   */
  const meet = async (
    user: PlayerIdentity,
    encounter: EncounterRecord,
    metOnce = false,
  ): Promise<string | null> => {
    if (await isEncounterRetired(user.uid, encounter)) {
      // Either it ran off or it is already in the bag; from the cell's
      // side those are the same thing — nobody is standing there
      return 'Nothing here. This one is done with you.';
    }
    setOnce(metOnce);
    setSession(await createSafariSession(user, encounter));
    return null;
  };

  const interact = async (
    loaded: BoardView,
    user: PlayerIdentity,
    at: number,
  ): Promise<string | null> => {
    // Which window the cell belongs to. The board straddles chunks, so
    // the square under the player and the one beside it can be two
    // different windows' business
    const spot = loaded.at(at);

    if (spot == null) {
      return 'That is not loaded yet.';
    }

    const spawn = loaded.spawns.get(at);

    if (spawn != null) {
      // The server decides what is standing there: a spawn from a
      // window that has turned over is no longer met
      const encounter = await startEncounter(spot.snapshot, spawn.id);

      return encounter == null ? 'Too late. The chunk has moved on.' : meet(user, encounter);
    }

    const landmark = loaded.landmarks.get(at);

    if (landmark === Landmark.ItemCache) {
      const stash = await claimItemCache(spot.snapshot, spot.cell);

      // The best band anything in it belongs to, which is what says
      // whether this was a dig worth hearing about
      const rarest: ReturnType<typeof getItemBand>[] = [];

      for (const held of stash ?? []) {
        rarest.push(getItemBand(held.item));
      }

      if (rarest.includes('special')) {
        playEffect(Effect.SpecialItem);
      } else if (rarest.includes('prized')) {
        playEffect(Effect.PrizedItem);
      }
      // Empty either way: the stash was already carried off, or this
      // press carried it off
      setDug((cells) => new Set(cells).add(keyAt(spot)));
      forgetClaims();
      // What came out of the ground is put in front of them rather
      // than said under the map: a player pressing a cell is looking
      // at the cell
      announce(at, 'Picked clean. Come back next window.', stash);
      return null;
    }
    if (landmark === Landmark.BerryPatch) {
      const berries = await claimBerryPatch(spot.snapshot, spot.cell);

      // Bare either way: the bush was already stripped, or this press
      // stripped it
      setPicked((cells) => new Set(cells).add(keyAt(spot)));
      forgetClaims();
      announce(at, 'Bare bushes. Come back next window.', berries == null ? null : [berries]);
      return null;
    }
    if (landmark === Landmark.ApricornTree) {
      const apricorns = await claimApricornTree(spot.snapshot, spot.cell);

      // Picked either way, and worth saying what they are for: an
      // apricorn is nothing until Kurt has it
      setPicked((cells) => new Set(cells).add(keyAt(spot)));
      forgetClaims();
      announce(at, 'Picked bare. Come back next window.', apricorns == null ? null : [apricorns]);
      return null;
    }
    // The landmarks somebody fights at share one flow: Team Rocket's
    // ambush, the trainer's duel, and the experts' ladder, all put in
    // the challenge dialog rather than the wanderer's
    if (landmark != null && FIGHT_LANDMARKS.has(landmark)) {
      const grunt = landmark === Landmark.TeamRocket;
      const staged = challengerOf(spot.snapshot, landmark, spot.cell);
      const who = staged?.name ?? 'Team Rocket';
      const stop = await enterStop(spot.snapshot, spot.cell);

      if (stop === 'locked') {
        // The ladder's three gates, each named by whoever is standing
        // there: an elite asks for their own league's badges, a
        // champion for their own league's Elite Four, and a Frontier
        // house for the crown of the region it stands in
        const seated =
          landmark === Landmark.EliteFour ? spot.snapshot.getEliteMember(spot.cell) : null;
        const crowned =
          landmark === Landmark.Champion && spot.snapshot.getLegend(spot.cell) == null
            ? spot.snapshot.getChampion(spot.cell)
            : null;
        const housed =
          landmark === Landmark.FrontierBrain ? loaded.snapshot.getFrontierBrain(at) : null;
        let asked: string | null = null;

        if (seated != null) {
          asked = eliteGate(seated);
        } else if (crowned != null) {
          asked = championGate(crowned);
        } else if (housed != null) {
          asked = frontierGate(housed);
        }
        return asked == null
          ? `${who} is not taking challengers.`
          : `${who} only faces challengers ${asked}.`;
      }
      if (stop === 'beaten') {
        // A beaten grunt may still owe the pokemon they left:
        // claiming again pays nothing and hands it back until it is
        // caught. Everybody else owed only the purse
        const owed = grunt
          ? await claimStopReward(
              stopIdOf(
                spot.snapshot.chunk,
                spot.snapshot.npcTimestamp,
                spot.cell,
                spot.snapshot.offset,
              ),
            )
          : null;

        if (owed?.encounter != null) {
          game.setEncounter(owed.encounter);
          return null;
        }
        return grunt ? 'They have moved on.' : `${who} is done with you this window.`;
      }
      if (stop == null) {
        // The server stages nobody there: the board is behind the
        // world — a window rolled over, or the game was updated
        // under an open tab — so it is asked for again rather than
        // blamed on a fight that was never won
        askForWindow(true, true);
        return 'Nobody is standing there any more.';
      }
      if (!(await canJoinRaids(user.uid))) {
        return `${who} wants a battle, and you have nothing to fight with.`;
      }
      // The challenge is put to the player rather than taken for
      // them; the dialog is what accepts it
      setChallengerNpc(grunt ? Npc.RocketGrunt : Npc.Trainer);
      setChallenger(staged);
      setChallengeCoat(spot.snapshot.getWandererCoats().get(spot.cell));
      setChallenge(stop);
      return null;
    }
    // The board is the only way to the auctions now. What it shows is
    // the region's whole market rather than this chunk's, so walking
    // to one is the cost of trading rather than a choice of board
    if (landmark === Landmark.AuctionBoard) {
      game.setDialog(GameDialog.Auctions);
      return null;
    }
    if (landmark === Landmark.GymSeat) {
      const standing = await enterGymSeat(spot.snapshot, spot.cell);

      if (standing === 'absent') {
        // The board is behind the world: the seat is a fixture, so
        // this is a stale chunk rather than a seat that moved
        askForWindow(true, true);
        return 'There is no seat there any more.';
      }
      setSeat([spot, standing]);
      return null;
    }
    // The wandering cell, the market stall and the centre open the
    // same counter: who is standing there is the snapshot's answer
    // either way
    if (
      landmark === Landmark.WanderingNpc ||
      landmark === Landmark.Market ||
      landmark === Landmark.PokemonCenter
    ) {
      const standing = spot.snapshot.getStandingNpc(spot.cell);

      if (standing == null) {
        return 'Nobody is passing through right now.';
      }
      // What they want is put to the player rather than taken from
      // them; the dialog is where the fee is agreed to
      setWanderer([spot, standing]);
      return null;
    }
    if (landmark === Landmark.Nest) {
      // Looked into rather than emptied. Every other landmark pays out
      // the moment it is pressed, because everything else they pay is
      // simply better to have; an egg is not. A buddy carries one egg
      // and walks it open, so a second one is a decision about the
      // first, and the player is the one to make it
      const offer = await peekNest(spot.snapshot, spot.cell);

      // A bare nest opens the dialog too. A player who pressed a cell
      // asked a question, and the answer belongs where they are
      // looking rather than in a line under the map
      setEggOffer({
        spot,
        cell: at,
        from: 'nest',
        state: offer == null ? 'bare' : stateOf(offer),
        message: null,
      });
      return null;
    }
    const happening = showing(loaded, at);

    if (happening != null) {
      const showingKind = happening;
      // The grotto's egg is the one thing here that is asked about
      // first; an item and a pokemon are walked into as they always
      // were, and neither is worth a question
      const hidden = await peekPhenomenonEgg(spot.snapshot, spot.cell);

      if (hidden != null) {
        setEggOffer({ spot, cell: at, from: 'grotto', state: stateOf(hidden), message: null });
        return null;
      }

      const claim = await claimPhenomenon(spot.snapshot, spot.cell);

      // Taken, or already had, or the hour turned over under them.
      // Every one of those leaves the cell spent for this player, so
      // it stops being drawn rather than standing there to be pressed
      // again for nothing
      setSpent((cells) => new Set(cells).add(keyAt(spot)));
      forgetClaims();

      if (claim == null) {
        return `${PHENOMENON_NAMES[showingKind]}, and nothing under it now.`;
      }
      if (claim.kind === 'item') {
        // Shown the way a cache or a patch is shown: something was
        // found, and a player pressing a cell is looking at the cell
        // rather than at the line under the map
        announce(at, 'Nothing was left behind.', claim.items);
        return null;
      }
      if (claim.kind === 'egg') {
        // Unreachable in practice — an egg is peeked at above and
        // taken through the dialog — but the claim can still answer
        // one if the hour turned over between the two calls
        return 'An egg, tucked away in the grotto. Walk it warm.';
      }
      return meet(user, claim.encounter, true);
    }
    if (landmark === Landmark.HoneyTree) {
      setHoneyTree(spot);
      return null;
    }
    if (landmark === Landmark.CaveMouth) {
      const through = throughMouth(around(), spot.snapshot.chunk.x, spot.snapshot.chunk.y);

      if (through == null) {
        // The board is behind the world: a mouth is cut into the
        // ground rather than rolled onto it, so this is a stale chunk
        askForWindow(true, true);
        return 'There is no way through there any more.';
      }

      const going = atDepth() === Depth.Cave ? Depth.Surface : Depth.Cave;
      const chunk = spot.snapshot.chunk;

      // One cell, not a crossing: a mouth joins the two cells it sits
      // between, so going under moves a player into the hillside
      // rather than anywhere they did not walk to
      setAtDepth(going);
      setAtX(worldCell(chunk.x, through % CHUNK_CELLS));
      setAtY(worldCell(chunk.y, Math.floor(through / CHUNK_CELLS)));
      settle(chunk.x, chunk.y, through % CHUNK_CELLS, Math.floor(through / CHUNK_CELLS));
      remark(going === Depth.Cave ? 'Into the dark.' : 'Back out into the light.');
      return null;
    }
    if (landmark === Landmark.Portal) {
      // Where it goes is derived from the chunk it stands in, so the
      // dialog can list every destination without asking anything of
      // the server. The key is what the server is for
      setPortal(spot);
      return null;
    }
    if (landmark === Landmark.LegendaryLair || landmark === Landmark.ShadowLair) {
      const kind = landmark === Landmark.ShadowLair ? RaidKind.Shadow : RaidKind.Legendary;
      // Looked at rather than walked into: nothing is staged until the
      // dialog's button is pressed, so a player who thinks better of it
      // leaves no lobby standing behind them
      const standing = await peekRaid(spot.snapshot, spot.cell, kind);

      // Their own lobby, walked back into. The dialog exists to put
      // the lair to somebody deciding about it, and a host has already
      // decided: it opened with a Join button on a raid they were
      // standing in. Straight through to the lobby, or to the fight
      // where they have already started it. A fight they lost is not
      // theirs any more: the lair is open to host again
      if (standing?.hosting === true && standing.action !== RaidAction.Host) {
        if (standing.battle != null) {
          game.setBattle({ id: standing.battle, replay: true });
          return null;
        }
        game.setRaid(standing.lobby);
        game.setDialog(GameDialog.Raids);
        return null;
      }

      // Either the window stages no raid here, it has been cleared, or
      // there is nothing standing and nothing to stage it with. The
      // dialog opens for all of it: a player who pressed a lair is
      // looking at the lair, not at the line under the map
      setLairReason(
        standing != null || (await canJoinRaids(user.uid))
          ? 'The lair is quiet. Nothing has come out this window.'
          : 'You need a pokemon of your own to raid. You can watch one already under way.',
      );
      setLair([spot, standing]);
      return null;
    }
    return null;
  };

  // A cleared raid leaves its legendary waiting, and a beaten grunt
  // what they dropped. Both are collected by the game itself the
  // moment the fight is won — the world is not on screen then — and
  // what is left for the world to do is put the pokemon in front of
  // the player as soon as they are back in it
  createEffect(() => {
    const waiting = game.encounter();
    const user = auth.user();

    if (waiting == null || user == null) {
      return;
    }
    game.setEncounter(null);
    setOnce(true);
    createSafariSession(user, waiting)
      .then(setSession)
      .catch((caught: unknown) => {
        remark(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  });

  /**
   * Whether the cell holds anything to interact with: a landmark, a
   * spawn, or something going on there. Empty ground is not.
   *
   * The happenings have to be asked about separately now that they
   * are not landmarks. Left out, a press on a dust cloud walks the
   * player onto it and does nothing — the reach that triggers it is
   * only taken for a cell that holds something
   */
  const holdsSomething = (loaded: BoardView | null, index: number): boolean =>
    loaded != null &&
    !claiming().has(keyOf(index)) &&
    (loaded.spawns.has(index) || loaded.landmarks.has(index) || showing(loaded, index) != null);

  /**
   * Whether pressing the cell spends it on the spot, rather than
   * opening something the player answers afterwards
   */
  const paysOnPress = (loaded: BoardView, index: number): boolean => {
    const landmark = loaded.landmarks.get(index);

    return (landmark != null && HARVEST_LANDMARKS.has(landmark)) || showing(loaded, index) != null;
  };

  /**
   * Whether the player can reach the cell from where they stand: the
   * 3x3 they are in the middle of. Walking *onto* a pokemon or a
   * landmark is not how anything is triggered — a player steps up
   * beside it and reaches out, so passing through a cell never
   * springs it on them
   */
  const withinReach = (index: number): boolean =>
    Math.abs((index % BOARD_CELLS) - BOARD_CENTER) <= 1 &&
    Math.abs(Math.floor(index / BOARD_CELLS) - BOARD_CENTER) <= 1;

  const reach = (index: number): void => {
    // Reaching for something is the moment it matters most whether the
    // chunk still holds what it is showing
    askForWindow();

    const loaded = view();
    const user = auth.user();

    if (loaded == null || user == null || busy() || engaged() || !withinReach(index)) {
      return;
    }
    setBusy(true);
    // Held shut for as long as the answer takes: `busy` is dropped the
    // moment this one lands, and the cell would be pressable again
    // before the board had any reason to look different
    const spends = paysOnPress(loaded, index);

    if (spends) {
      holdCell(index, true);
    }
    // Whatever the cell had to say, said in passing.
    //
    // It used to be a line pinned over the bottom of the map, and it
    // stayed there until the next press — so "nothing there now" from
    // a phenomenon an hour ago sat under a player who had since walked
    // half a chunk. Nothing an interaction reports is a question, and
    // none of it is worth keeping: a toast says it and takes itself
    // away
    interact(loaded, user, index)
      .then((said) => {
        if (said != null) {
          remark(said);
        }
      })
      .catch((caught: unknown) => {
        remark(caught instanceof Error ? caught.message : String(caught), 'ember');
      })
      .finally(() => {
        setBusy(false);
        if (spends) {
          holdCell(index, false);
        }
      });
  };

  /**
   * The way the player is standing, as a step.
   *
   * A step into something that cannot be walked through still turns
   * them to face it, which is the whole of what makes the interact key
   * mean anything: what is in front of the player is a fact about
   * where they are looking, not about where they last arrived from
   */
  const [facing, setFacing] = createSignal<[number, number]>([0, 1]);

  /**
   * The other players in sight, and this one as they see them. Opened
   * once the board is placed, so nobody sees the player at the start
   * cell on the way to where they really are
   */
  const [sight, setSight] = createSignal<Sight | null>(null);
  // By uid, so a refreshed session is not a reason to rejoin every channel
  const seer = createMemo(() => auth.user()?.uid ?? null);

  createEffect(() => {
    const uid = seer();

    if (uid == null || !placed()) {
      return;
    }

    const opened = openSight(uid, STEP_PACE);

    setSight(opened);
    onCleanup(() => {
      opened.close();
      setSight(null);
    });
  });
  createEffect(() => {
    sight()?.setCharset(charset());
  });
  // A screen that stood down keeps watching but is not seen, or a
  // player on two screens would stand in two places
  createEffect(() => {
    sight()?.setSeen(game.elsewhere() == null);
  });
  createEffect(() => {
    sight()?.stand(atDepth(), atX(), atY(), facing());
  });

  /**
   * The cell one step from where the player stands. Always on the
   * board: they stand in the middle of it, and the middle is eight
   * cells from every edge
   */
  const ahead = ([dx, dy]: [number, number]): number =>
    (BOARD_CENTER + dy) * BOARD_CELLS + (BOARD_CENTER + dx);

  /**
   * Where the player is walking, if they are.
   *
   * A press says where to be; this is what is left of it while they
   * get there. It is re-planned at every step rather than kept as a
   * list of squares, because the chunk moves under a walk — a window
   * turns over, another player takes a spawn, a pokemon appears in the
   * way — and a route worked out once would walk straight through
   * whatever arrived after it was drawn
   */
  const [journey, setJourney] = createSignal<Journey | null>(null);

  /** How the player is getting about: on foot, or riding the buddy over water or through the air */
  const [travel, setTravel] = createSignal<Travel>('walk');

  /** What stands on a board cell, as far as a step onto it cares */
  const factsAt = (loaded: BoardView, index: number): CellFacts => {
    const x = index % BOARD_CELLS;
    const y = Math.floor(index / BOARD_CELLS);
    const wet = loaded.ground.role(x, y) === 'water';
    const biome = loaded.ground.biome(x, y);

    return {
      fixture: loaded.landmarks.has(index),
      scenery: loaded.decorations.has(index),
      solid: loaded.walls.has(index),
      // A frozen lake is walked like ground, so only open water needs Surf
      water: wet && biome !== Biome.Volcano && !isIceBiome(biome),
      lava: wet && biome === Biome.Volcano,
    };
  };

  /**
   * Whether a step onto a cell is allowed, from where the player stands
   * and however they are getting about. It is the same answer whether
   * the walk was pressed for or walked with the keyboard
   */
  const standable = (loaded: BoardView, index: number): boolean =>
    canEnter(travel(), factsAt(loaded, cell()), factsAt(loaded, index));

  /** Whether the buddy can learn a field move, which is all a field move asks */
  const knows = (field: FieldMove): boolean => canUseFieldMove(buddy()?.species, field);

  /** Whether open water touches the player's cell, which is where Surf starts */
  const besideWater = (loaded: BoardView): boolean => {
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ] as const) {
      if (factsAt(loaded, ahead([dx, dy])).water) {
        return true;
      }
    }
    return false;
  };

  /** Whether the last step was taken on water, so the first one ashore ends a surf */
  let afloat = false;

  createEffect(() => {
    const loaded = view();
    const mode = travel();

    if (loaded == null || mode === 'walk') {
      return;
    }
    // A buddy put away takes the ride with it, and nothing flies underground
    if (
      !knows(mode === 'surf' ? Moves.Surf : Moves.Fly) ||
      (mode === 'fly' && loaded.underground)
    ) {
      setTravel('walk');
      return;
    }
    if (mode === 'surf') {
      const wet = factsAt(loaded, cell()).water;

      if (afloat && !wet) {
        setTravel('walk');
      }
      afloat = wet;
    }
  });

  /** Whether Surf can be pressed here: to start beside water, or to stop on dry ground */
  const surfOffered = (loaded: BoardView): boolean => {
    if (!knows(Moves.Surf)) {
      return false;
    }
    if (travel() === 'surf') {
      return !factsAt(loaded, cell()).water;
    }
    return travel() === 'walk' && besideWater(loaded);
  };

  /** Whether Fly can be pressed here: to take off above ground, or to land where a walk could stand */
  const flyOffered = (loaded: BoardView): boolean => {
    if (!knows(Moves.Fly)) {
      return false;
    }
    if (travel() === 'fly') {
      return canLand(factsAt(loaded, cell()));
    }
    return travel() === 'walk' && !loaded.underground;
  };

  /** Start or stop surfing. It starts beside water and stops on dry ground */
  const toggleSurf = (): void => {
    const loaded = view();

    if (loaded == null) {
      return;
    }
    if (travel() === 'surf') {
      if (!factsAt(loaded, cell()).water) {
        setTravel('walk');
      }
      return;
    }
    if (knows(Moves.Surf) && besideWater(loaded)) {
      afloat = false;
      setTravel('surf');
    }
  };

  /** Take off, or come down where a walk could stand */
  const toggleFly = (): void => {
    const loaded = view();

    if (loaded == null) {
      return;
    }
    if (travel() === 'fly') {
      if (canLand(factsAt(loaded, cell()))) {
        setTravel('walk');
      }
      return;
    }
    if (knows(Moves.Fly) && !loaded.underground) {
      setTravel('fly');
    }
  };

  /** Whether a Dig or Teleport is on its way to the server */
  const [warping, setWarping] = createSignal(false);

  /** Dig or Teleport: the server moves the player, and the board follows */
  const warp = (field: Moves.Dig | Moves.Teleport): void => {
    if (warping()) {
      return;
    }
    setWarping(true);
    (field === Moves.Dig ? useDig() : useTeleport())
      .then((at) => {
        setWarping(false);
        if (at == null) {
          toast.push({
            message:
              field === Moves.Dig ? 'There is no way up within reach.' : 'No town is near enough.',
            tone: 'ember',
          });
          return;
        }
        setJourney(null);
        setTravel('walk');
        game.standHere(at);
      })
      .catch((caught: unknown) => {
        setWarping(false);
        toast.push({
          message: caught instanceof Error ? caught.message : String(caught),
          tone: 'ember',
        });
      });
  };

  // The moves usable where the player stands, handed to the menu bar
  createEffect(() => {
    const loaded = view();
    const offers: FieldMoveOffer[] = [];

    if (loaded != null) {
      if (surfOffered(loaded)) {
        offers.push({ name: 'Surf', active: travel() === 'surf', busy: false, use: toggleSurf });
      }
      if (flyOffered(loaded)) {
        offers.push({ name: 'Fly', active: travel() === 'fly', busy: false, use: toggleFly });
      }
      if (knows(Moves.Dig) && loaded.underground) {
        offers.push({
          name: 'Dig',
          active: false,
          busy: warping(),
          use: () => {
            warp(Moves.Dig);
          },
        });
      }
      if (knows(Moves.Teleport)) {
        offers.push({
          name: 'Teleport',
          active: false,
          busy: warping(),
          use: () => {
            warp(Moves.Teleport);
          },
        });
      }
    }
    game.setFieldMoves(offers);
  });
  onCleanup(() => {
    game.setFieldMoves([]);
  });

  /** The buddy as the player is drawn riding it */
  const mount = (): RiddenCoat | null => {
    const riding = buddy();

    return travel() === 'walk' || riding == null
      ? null
      : {
          species: riding.species,
          shiny: riding.shiny,
          female: riding.gender === Genders.Female,
        };
  };

  /** Where a walk to open ground is heading, for the board to mark */
  const walkGoal = createMemo<[number, number] | null>(
    () => {
      const plan = journey();

      return plan == null || plan.act ? null : [plan.goalX, plan.goalY];
    },
    null,
    { equals: (was, now) => was?.[0] === now?.[0] && was?.[1] === now?.[1] },
  );

  /**
   * When the last cell of a walk was stepped. The pace is measured from
   * it rather than from the press, so pressing again mid-walk changes
   * where the player is going without changing how fast they get there
   */
  let steppedAt = 0;

  /**
   * Whether the walk has arrived. Reaching for something ends beside
   * it rather than on it: standing on top of what you are looking at
   * is not what walking up to something means
   */
  const arrived = (plan: Journey): boolean => {
    const standing = seatOf(plan.goalX, plan.goalY);

    return plan.act
      ? standing != null && withinReach(standing)
      : atX() === plan.goalX && atY() === plan.goalY;
  };

  /**
   * One cell of the walk: work out the way from where they are now,
   * and take a single step along it.
   *
   * Stopping is as much a part of this as walking. A route that no
   * longer exists — the way blocked, the goal now standing under a
   * pokemon — ends the walk where it stands rather than casting about
   * for somewhere else to go, since the player can see the board and
   * will press again
   */
  /** The walk whose route the other players have been told, so it is told once */
  let announced: Journey | null = null;

  /** A route of board cells as the steps between them */
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

  const stride = (): void => {
    const plan = journey();
    const loaded = view();

    if (plan == null || loaded == null) {
      return;
    }

    // Something opened on the way — a grunt stepped out, a pokemon was
    // walked up to — and the rest of the walk is not what the player
    // is answering now. The walk is dropped rather than held: they can
    // see where they stand when the dialog is gone
    if (engaged()) {
      setJourney(null);
      return;
    }

    if (arrived(plan)) {
      const standing = seatOf(plan.goalX, plan.goalY);

      setJourney(null);
      if (plan.act && standing != null) {
        reach(standing);
      }
      return;
    }

    const goal = seatOf(plan.goalX, plan.goalY);

    // The goal has been left behind: a walk only ever heads for
    // something the player can see, so one off the board is one that
    // is not being walked to any more
    if (goal == null) {
      setJourney(null);
      return;
    }

    const here = cell();
    // The chunk's fixtures stop a walk: a landmark is walked up to and
    // a tree is walked round, because both are standing there. A
    // pokemon is not — where one is this window is not a fact about
    // the ground, and a route that bent round every spawn made a busy
    // chunk feel like a maze
    // Solid rock stops a walk the way a fixture does
    const passable = (index: number): boolean => standable(loaded, index);
    // A goal nothing can stand on is walked up to instead of refused,
    // so a press on a boulder still takes the player over to it
    const route = plan.act
      ? findPathBeside(here, goal, passable)
      : findPathNear(here, goal, passable);
    const next = route?.[0];

    if (next == null) {
      setJourney(null);
      return;
    }
    const step: [number, number] = [
      (next % BOARD_CELLS) - (here % BOARD_CELLS),
      Math.floor(next / BOARD_CELLS) - Math.floor(here / BOARD_CELLS),
    ];

    // A route is a run of single straight steps and nothing else. A
    // walk is what carries the egg and what the world is seen from, so
    // one that jumped would be a teleport with a walk's name on it
    if (Math.abs(step[0]) + Math.abs(step[1]) !== 1) {
      setJourney(null);
      return;
    }
    // Told once, as all of it: the ground and what stands on it are
    // fixed, so the route found at the first step is the one walked
    if (announced !== plan && route != null) {
      announced = plan;
      sight()?.plan(stepsAlong(here, route));
    }
    steppedAt = Date.now();
    move(step[0], step[1]);
  };

  // A walk that ends short of its route says where it stopped
  createEffect(() => {
    if (journey() == null) {
      announced = null;
      untrack(sight)?.plan(null);
    }
  });

  /**
   * The walk itself: a step, and then one every `STEP_PACE` until it
   * arrives or gives up.
   *
   * The first step is taken the moment the press lands, unless one was
   * taken less than a pace ago — a new press restarts this effect, and
   * stepping straight away on every press let a player who kept
   * re-pressing walk as fast as they could click. What is owed from the
   * last step is waited out first, and only then does the clock resume.
   *
   * Everything the step reads is read outside the effect's tracking,
   * so the only thing that restarts the clock is a **new** press: read
   * plainly, a step that moves the player would re-run this, clear the
   * timer and step again immediately, which is a walk at the speed of
   * the message queue
   */
  createEffect(() => {
    if (journey() == null) {
      return;
    }
    const owed = Math.max(0, STEP_PACE - (Date.now() - steppedAt));
    let waiting: ReturnType<typeof setTimeout> | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    const pace = (): void => {
      // The clock is started before the step, not after. A step can end
      // the walk from inside itself, by arriving or by crossing an
      // edge, and ending it disposes this effect there and then: a
      // clock started afterwards is one nothing holds a handle to. Those
      // outlive the walk, and every one of them drives the next walk, so
      // two of them is a player moving three cells a pace
      timer = setInterval(() => {
        untrack(stride);
      }, STEP_PACE);
      untrack(stride);
    };

    if (owed > 0) {
      waiting = setTimeout(pace, owed);
    } else {
      pace();
    }

    onCleanup(() => {
      if (waiting != null) {
        clearTimeout(waiting);
      }
      if (timer != null) {
        clearInterval(timer);
      }
    });
  });

  /**
   * A square the player has asked to be at.
   *
   * Something they are already standing beside is reached for where
   * they stand; anything else worth pressing is walked up to and then
   * reached for; bare ground is simply walked to
   */
  const press = (target: BoardCell): void => {
    const loaded = view();

    // A press while a claim is in flight is a second press on it: the
    // board looks the same, and dropping it here leaves the walk it
    // would otherwise have cancelled alone
    if (loaded == null || engaged() || busy()) {
      return;
    }

    const index = boardIndexOf(target);

    if (index == null) {
      return;
    }

    const [x, y] = boardOf(index);

    if (holdsSomething(loaded, index)) {
      setJourney(null);

      if (withinReach(index)) {
        reach(index);
      } else {
        setJourney({ goalX: x, goalY: y, act: true });
      }
      return;
    }
    // Scenery is not a thing to reach for, but it is still somewhere
    // to head: the walk stops on the nearest cell that can be stood on
    setJourney(index === cell() ? null : { goalX: x, goalY: y, act: false });
  };

  /** Which way each direction goes, in cells */
  const STEPS: Record<Direction, [number, number]> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };

  /**
   * A step taken on the keyboard: turn that way, and walk if the
   * ground there can be stood on.
   *
   * A step into a landmark or a boulder turns without moving, which is
   * what a mainline game does and what leaves the interact key
   * something to act on. Held to the same pace as a pressed walk, so
   * neither a held key nor a mashed one outruns the other
   */
  const stepBy = (step: [number, number]): void => {
    const loaded = view();

    if (loaded == null || engaged() || Date.now() - steppedAt < STEP_PACE) {
      return;
    }
    setFacing(step);
    // The keyboard is the player walking themselves, so a walk they
    // pressed for is dropped rather than raced
    setJourney(null);

    // A step into something standing there turns the player and
    // nothing more, which is what leaves the interact key an answer
    if (!standable(loaded, ahead(step))) {
      return;
    }
    steppedAt = Date.now();
    move(step[0], step[1]);
  };

  /**
   * Reach for whatever the player is facing. Nothing in front of them
   * is nothing to answer: the key is not a press on the ground they
   * are standing next to
   */
  const reachAhead = (): void => {
    const loaded = view();
    const target = ahead(facing());

    if (loaded == null || !holdsSomething(loaded, target)) {
      return;
    }
    reach(target);
  };

  /**
   * Walking with the keyboard, for as long as a key is held.
   *
   * The directions held down are kept in the order they were pressed
   * so that rolling from one onto another without letting go turns the
   * corner, rather than stopping dead or carrying on the old way. The
   * browser's own key repeat is ignored: the game keeps the pace, and
   * the machine's repeat rate is not the game's
   */
  onMount(() => {
    let held: Direction[] = [];
    let pacing: ReturnType<typeof setInterval> | null = null;

    const stop = (): void => {
      held = [];
      if (pacing != null) {
        clearInterval(pacing);
        pacing = null;
      }
    };

    const onward = (): void => {
      const going = held.at(-1);

      if (going == null) {
        stop();
        return;
      }
      stepBy(STEPS[going]);
    };

    const down = (event: KeyboardEvent): void => {
      if (event.repeat || !forTheGame(event)) {
        return;
      }

      const action = actionOf(event, settings().keys);

      if (action == null) {
        return;
      }
      if (action === 'interact') {
        event.preventDefault();
        reachAhead();
        return;
      }
      // The bar along the bottom answers its own key
      if (action === 'menu') {
        return;
      }
      event.preventDefault();
      const pressed: Direction[] = [];

      for (const one of held) {
        if (one !== action) {
          pressed.push(one);
        }
      }
      pressed.push(action);
      held = pressed;
      stepBy(STEPS[action]);
      pacing ??= setInterval(onward, STEP_PACE);
    };

    const up = (event: KeyboardEvent): void => {
      const action = actionOf(event, settings().keys);

      if (action == null) {
        return;
      }
      const still: Direction[] = [];

      for (const one of held) {
        if (one !== action) {
          still.push(one);
        }
      }
      held = still;
      if (held.length === 0) {
        stop();
      }
    };

    // `globalThis` rather than `window`: the chunk's own snapshot
    // signal is called that in this body
    globalThis.addEventListener('keydown', down);
    globalThis.addEventListener('keyup', up);
    // A key held while the page goes away is a key that is never
    // released, and a player who comes back to a board walking on its
    // own has to press that direction again to stop it
    globalThis.addEventListener('blur', stop);
    onCleanup(() => {
      stop();
      globalThis.removeEventListener('keydown', down);
      globalThis.removeEventListener('keyup', up);
      globalThis.removeEventListener('blur', stop);
    });
  });

  /**
   * What the canvas is handed, worked out once each.
   *
   * A prop is a getter, and the draw loop reads several of these once
   * a cell a frame: built inline, each of them was a fresh map for
   * every square of the board, sixty times a second
   */
  const afoot = createMemo(() => {
    const loaded = view();

    return loaded == null ? new Map<number, Phenomenon>() : happenings(loaded);
  });
  const pickedHere = createMemo(() => seatsIn(picked()));
  const dugHere = createMemo(() => seatsIn(dug()));
  const standingHere = createMemo(() => {
    const loaded = view();

    const coats = new Map<number, SpawnCoat>();

    if (loaded == null) {
      return coats;
    }
    for (const [at, standing] of loaded.spawns) {
      coats.set(at, {
        id: standing.id,
        species: standing.spawn[0],
        shiny: standing.shiny,
        // Against the window's own instant, which is what the
        // server weighted the pool by
        featured: isFeaturedSpecies(standing.spawn[0], loaded.snapshot.timestamp),
        rank: rankOf(standing.spawn[0]),
      });
    }
    return coats;
  });

  const titleOf = (index: number): string => {
    const loaded = view();
    const landmark = loaded?.landmarks.get(index);
    const spawn = loaded?.spawns.get(index);

    if (spawn != null) {
      return getSpeciesData(spawn.spawn[0]).name;
    }
    // What is going on is named before the ground it is going on
    const happening = loaded == null ? null : showing(loaded, index);

    if (happening != null) {
      return PHENOMENON_NAMES[happening];
    }
    if (landmark == null) {
      // Scenery is named and nothing more: it is worth knowing what
      // is standing there, and there is nothing to do about it
      const decoration = loaded?.decorations.get(index);

      return decoration == null ? '' : DECORATION_NAMES[decoration];
    }

    // A wandering cell is named for whoever is on it this window, and
    // a phenomenon for whatever is going on there this hour, so a
    // player can see from across the chunk whether it is worth the
    // walk
    // Everything below is the window's answer about one cell, and the
    // board straddles chunks: the square beside the player can belong
    // to a different window than the one they are standing in
    const spot = loaded?.at(index) ?? null;

    if (spot == null) {
      return LANDMARK_NAMES[landmark];
    }
    if (landmark === Landmark.WanderingNpc) {
      const standing = spot.snapshot.getWanderingNpcs().get(spot.cell);

      return standing == null ? LANDMARK_NAMES[landmark] : NPC_NAMES[standing];
    }
    // A stall is named for the counter it set up this window, so a
    // player short of vitamins can see which one to walk to
    if (landmark === Landmark.Market) {
      const counter = spot.snapshot.getVendorKind(spot.cell);

      return counter == null ? LANDMARK_NAMES[landmark] : VENDOR_KIND_NAMES[counter];
    }
    // The boss is named when he is actually standing there: 1/64 is
    // worth crossing the field for
    if (landmark === Landmark.TeamRocket && spot.snapshot.isRocketBoss(spot.cell)) {
      return 'Giovanni';
    }
    // The experts are named outright: which leader keeps this gym is
    // what decides whether the walk is worth it
    if (landmark === Landmark.GymLeader) {
      const leader = spot.snapshot.getGymLeader(spot.cell);

      return leader == null ? LANDMARK_NAMES[landmark] : GYM_LEADER_NAMES[leader];
    }
    if (landmark === Landmark.EliteFour) {
      const member = spot.snapshot.getEliteMember(spot.cell);

      return member == null ? LANDMARK_NAMES[landmark] : ELITE_MEMBER_NAMES[member];
    }
    if (landmark === Landmark.Champion) {
      const legend = spot.snapshot.getLegend(spot.cell);

      if (legend != null) {
        return LEGEND_NAMES[legend];
      }

      const champion = spot.snapshot.getChampion(spot.cell);

      return champion == null ? LANDMARK_NAMES[landmark] : CHAMPION_NAMES[champion];
    }
    if (landmark === Landmark.FrontierBrain) {
      const brain = spot.snapshot.getFrontierBrain(spot.cell);

      return brain == null ? LANDMARK_NAMES[landmark] : FRONTIER_BRAIN_NAMES[brain];
    }
    return LANDMARK_NAMES[landmark];
  };

  return (
    <div class="relative h-full w-full">
      <Show
        when={view()}
        fallback={
          <div class="flex h-full items-center justify-center">
            <Note>Loading the world…</Note>
          </div>
        }
      >
        {(loaded) => (
          <>
            {/* The chunk is drawn rather than laid out: one element
                instead of 256, and the ring the player can act on is
                shaded rather than left to be guessed at. Where this is
                is written into the corner of it — it is a fact about
                the picture, so it belongs in the picture.

                The box around it is sized rather than laid out: the
                canvas asks for the shorter of its container's two
                sides, so the container has to be one those units can
                measure */}
            {/* The page takes the colour of the country the player is
                standing in. The board is a square and the screen is
                not, so there is always country around it — left grey
                it read as a picture of a world on a page, rather than
                as being somewhere.

                Edge to edge, with nothing laid out around it: the
                canvas is the whole of this, and where the board sits
                inside it is the projection's business rather than the
                page's */}
            <div
              class="absolute inset-0 transition-colors"
              style={{
                'background-color': loaded().underground
                  ? CAVERN.colour
                  : getSkybox(localNow(), latitudeOf(loaded().chunkY)).horizon,
              }}
            >
              <ChunkCanvas
                biome={loaded().biome}
                weather={loaded().weather}
                lamp={loaded().lamp}
                underground={loaded().underground}
                charset={charset()}
                strangers={sight()?.strangers ?? null}
                mount={mount()}
                // The camera belongs to the player rather than to the
                // chunk: walking over a boundary swaps the board out
                // and a camera living down there would face front
                // again every time
                yaw={yaw()}
                // How far north or south this is, which is the one
                // thing about the light that is the world's rather
                // than the clock's
                latitude={latitudeOf(loaded().chunkY)}
                onTurn={(turned) => {
                  setYaw(turned);
                }}
                caption={naming(loaded())}
                at={[atX(), atY()]}
                origin={[originX(), originY()]}
                facing={facing()}
                landmarks={loaded().landmarks}
                phenomena={afoot()}
                ground={loaded().ground}
                wanderers={loaded().wanderers}
                coats={loaded().coats}
                // What is on each bush this window, which is what
                // decides the plant drawn on the patch
                berries={loaded().berries}
                picked={pickedHere()}
                dug={dugHere()}
                auras={auras()}
                decorations={loaded().decorations}
                spawns={standingHere()}
                goal={walkGoal()}
                label={titleOf}
                // Said when one is actually drawn rather than when a
                // window says one was rolled: the board straddles
                // several chunks and reaches further than it draws, so
                // the two are not the same shiny and were never the
                // same moment
                onShiny={() => {
                  playEffect(Effect.ShinySparkle);
                }}
                onPress={press}
                onPlaced={(found) => {
                  // Stored rather than called: a setter handed a
                  // function would run it as an updater
                  setSpotOf(() => found);
                }}
              />
              {notes.view()}
            </div>

            {/* How close the carried egg is, over the corner of the
                map rather than under it. It is a thing about this
                moment and not worth a strip of the world when there is
                no egg */}
            <div class="pointer-events-none absolute top-2 right-2 flex flex-col items-end gap-1">
              <Show when={carried()}>
                {(egg) => (
                  <Badge tone={egg().steps >= egg().hatchSteps ? 'leaf' : 'neutral'}>
                    Egg · {egg().steps} / {egg().hatchSteps}
                    {egg().steps >= egg().hatchSteps ? ' · ready' : ''}
                  </Badge>
                )}
              </Show>
            </div>
          </>
        )}
      </Show>

      {/* The walk went to another screen, so this one is a picture of
          where the player used to be. It is drawn over the board
          rather than in place of it: what is underneath is still worth
          looking at, and one press brings the walk back here */}
      <Show when={game.elsewhere()}>
        {(at) => (
          <div
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3
              bg-paper/80 p-4 text-center backdrop-blur-sm"
          >
            <Note>
              This walk is being played on another screen, in chunk {at().chunkX}, {at().chunkY}.
            </Note>
            <Button onClick={resume}>Walk here instead</Button>
          </div>
        )}
      </Show>

      <Show when={auth.user()}>
        {(user) => (
          <>
            <SafariDialog
              user={user()}
              session={session()}
              insistent={once()}
              // A Frisk buddy reads what is standing there before
              // anything is thrown at it
              revealsHeld={view()?.revealsHeld === true}
              revealsFlight={view()?.revealsFlight === true}
              revealsAbility={view()?.revealsAbility === true}
              onCaught={(catchId) => {
                // The encounter is finished the moment it is caught, so
                // the safari closes and the sheet for what was caught
                // opens in its place
                setSession(null);
                game.setSheet({ catchId });
                // And it is off the map: a caught pokemon is retired
                // from this player's world the same way one that ran
                // off is, so the cell it was standing on is empty
                // ground now rather than a pokemon already in the bag
                // Worst case it is drawn until the window turns over
                props.onFled();
              }}
              onClose={() => {
                setSession(null);
                // A won raid's claim lands while its pokemon is being met
                recheck();
                // A meeting that ended in a flight leaves the chunk
                // with one fewer pokemon in it for this player
                // Worst case the spawn is drawn until the window turns
                // over, and interacting with it says it has already fled
                props.onFled();
              }}
            />
            <StopDialog
              user={user()}
              challenge={challenge()}
              npc={challengerNpc()}
              sheet={challengeCoat()}
              challenger={challenger()}
              onClose={() => {
                setChallenge(null);
                recheck();
              }}
            />
            <NpcDialog
              player={user().uid}
              snapshot={wanderer()?.[0].snapshot ?? null}
              standing={standingNpc()}
              onClose={() => {
                setWanderer(null);
                recheck();
              }}
            />
            <GymSeatDialog
              user={user()}
              snapshot={seat()?.[0].snapshot ?? null}
              cell={seat()?.[0].cell ?? null}
              standing={seat()?.[1] ?? null}
              onClose={() => {
                setSeat(null);
                recheck();
              }}
              onChange={() => {
                recheck();
                // The seat moved under the dialog, so what it is
                // showing is re-read rather than guessed at
                const standing = seat();

                if (standing != null) {
                  enterGymSeat(standing[0].snapshot, standing[0].cell)
                    .then((held) => {
                      setSeat(held === 'absent' ? null : [standing[0], held]);
                    })
                    .catch(() => {
                      setSeat(null);
                    });
                }
              }}
            />
            <NestDialog
              offer={eggOffer()}
              busy={taking()}
              buddy={buddy() ?? null}
              onAccept={takeEgg}
              onClose={() => {
                setEggOffer(null);
                setTaking(false);
              }}
            />
            <RaidDialog
              snapshot={lair()?.[0].snapshot ?? null}
              lair={standingLair()}
              reason={lairReason()}
              onClose={() => {
                setLair(null);
              }}
            />
            <HoneyTreeDialog
              player={user().uid}
              snapshot={honeyTree()?.snapshot ?? null}
              cell={honeyTree()?.cell ?? null}
              lathered={lathered().has(treeKey())}
              onClose={() => {
                setHoneyTree(null);
              }}
              onLathered={(_, encounter) => {
                setLathered((cells) => new Set(cells).add(treeKey()));
                if (encounter == null) {
                  return;
                }
                meet(user(), encounter, true)
                  .then((said) => {
                    if (said != null) {
                      remark(said);
                    }
                  })
                  .catch(() => undefined);
              }}
            />
            <PortalDialog
              player={user().uid}
              snapshot={portal()?.snapshot ?? null}
              cell={portal()?.cell ?? null}
              onClose={() => {
                setPortal(null);
              }}
              onTravel={(destination) => {
                // Out of a portal and into the one it opened onto:
                // the far side is a chunk away rather than a step, so
                // the whole position moves at once
                setAtX(worldCell(destination.x, destination.cell % CHUNK_CELLS));
                setAtY(worldCell(destination.y, Math.floor(destination.cell / CHUNK_CELLS)));
                remark(`Through to ${destination.name}. Chunk ${destination.x}, ${destination.y}.`);
                // A key was spent getting here, so where it got them is
                // written down now rather than in a second and a half.
                // The paces that led to the portal go with it; the
                // crossing itself is not a walk and adds none
                settle(
                  destination.x,
                  destination.y,
                  destination.cell % CHUNK_CELLS,
                  Math.floor(destination.cell / CHUNK_CELLS),
                );
              }}
            />
          </>
        )}
      </Show>
    </div>
  );
}
