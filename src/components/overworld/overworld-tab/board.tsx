import {
  type BoardView,
  type Placed,
  buildBoardView,
  naming,
} from '../../../game/overworld/board-view';
import { describeItem } from '../../details';
import { m } from '../../../i18n/paraglide/messages.js';
import { useAuth } from '../../../auth/context';
import createBoardWalk, { type BoardWalk } from '../../../game/overworld/walk';
import createBoardWindows from '../../../game/overworld/windows';
import createBoardInteractions from '../../../game/overworld/interact';
import createStoreSignal from '../../app/store-signal';
import LRUMap from '../../../core/lru-map';
import { settled } from '../../app/resource-reads';
import { type Direction, actionOf, forTheGame } from '../../app/keys';
import settings from '../../app/settings';
import { DEFAULT_CHARSET } from '../../../data/overworld/charsets';
import { watchProfile } from '../../../auth/profile';
import { getLocalOffset } from '../../../model/local-time';
import { localNow } from '../../../auth/clock';
import { type RaidView, isRaidLandmark } from '../../../auth/raids';
import type { StopRecord } from '../../../model/stop-record';
import { type BoardCell, boardIndexOf } from '../../../canvas/overworld/board';
import { getSkybox, latitudeOf } from '../../../canvas/overworld/daylight';
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
import Npc from '../../../data/overworld/npc';
import { NPC_VISIT_TAGS, npcName } from '../../../overworld/npcs';
import { type LandmarkStandings, readLandmarkStandings } from '../../../auth/landmark-standings';
import { CellAura, rankOf } from '../../../canvas/overworld/scenery';
import GymSeatDialog from '../GymSeatDialog';
import { VENDOR_KIND_NAMES } from '../../../data/overworld/vendor';
import type Phenomenon from '../../../data/overworld/phenomenon';
import { PHENOMENON_NAMES } from '../../../data/overworld/phenomenon';
import { getSpeciesData } from '../../../data/species';
import { isFeaturedSpecies } from '../../../data/species/day';
import { CHUNK_CELLS, worldCell } from '../../../overworld/chunk';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import { RocketRank } from '../../../overworld/chunk-snapshot';
import type { Buddy } from '../../../overworld/core';
import getWorld from '../../../overworld/current';
import type World from '../../../overworld/world';
import { townAt, townName } from '../../../overworld/town';
import { discoverTown } from '../../../auth/towns';
import { Genders } from '../../../data/ids/species';
import { useGame } from '../../app/game-context';
import { enterGymSeat } from '../../../auth/gym-seats';
import { createCellNotes } from '../cell-notes';
import ItemSprite from '../../items/ItemSprite';
import sayItems, { FIND_TONES } from '../../items/say-items';
import RaidDialog from '../../raids/RaidDialog';
import { Badge, Button, Note, useToast } from '../../styled';
import NestDialog from '../NestDialog';
import PortalDialog from '../PortalDialog';
import HoneyTreeDialog from '../HoneyTreeDialog';
import StopDialog from '../StopDialog';
import SafariDialog from '../SafariDialog';
import ChunkCanvas, { type CellSpot, type RiddenCoat, type SpawnCoat } from '../chunk-canvas';
import type { ConversationHandle } from '../../forms/conversation';
import { visitNpc } from '../visit-npc';
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
} from 'solid-js';
import {
  BOARD_CELLS,
  BOARD_CENTER,
  CLAIM_MEMORY,
  ICON_SIZE,
  STANDINGS_MEMORY,
  TOWN_NAME_PACE,
} from '../../../game/overworld/board-metrics';
import playEffect, { Effect } from '../../app/sound';
import describeFailure from '../../../i18n/refusals';

/**
 * The overworld as the player walks it: the arrows or the bound keys
 * move one cell at a time and stepping off an edge carries them into
 * the adjacent chunk. A step into something that cannot be walked
 * through turns them to face it, and the interact key is what reaches
 * for whatever they are facing
 */

/**
 * The world itself, which is where the buddy and what has fled are
 * both read.
 *
 * Either read in the body that declared it would throw past every
 * `Suspense` written there and land on the boundary around the whole
 * page — the world is what that boundary would blank
 */
/** The fight aura a syndicate stop wears, by who is standing there */
const ROCKET_AURAS: Record<RocketRank, CellAura> = {
  [RocketRank.Grunt]: CellAura.Fight,
  [RocketRank.Executive]: CellAura.Executive,
  [RocketRank.Boss]: CellAura.Boss,
};

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
  const game = useGame();
  const toast = useToast();
  const walk: BoardWalk<BoardView> = createBoardWalk<BoardView>({
    uid: () => auth.user()?.uid ?? null,
    elsewhere: () => game.elsewhere(),
    takeWalk: game.takeWalk,
    standHere: game.standHere,
    setPosition: game.setPosition,
    settleWalk: game.settleWalk,
    setFieldMoves: game.setFieldMoves,
    found: (items) => {
      sayItems(toast, items, m.board_buddy_found());
    },
    failed: (message) => {
      toast.push({ message, tone: 'ember' });
    },
  });

  onCleanup(() => {
    walk.dispose();
  });
  createEffect(() => {
    walk.setCharset(charset());
  });

  const atX = createStoreSignal(walk.x);
  const atY = createStoreSignal(walk.y);
  /**
   * Which layer they are on. The caves are the same coordinates one
   * layer down, so this is half of saying where the player is: the
   * same cell is open ground above and solid rock below
   */
  const atDepth = createStoreSignal(walk.depth);
  /** The world the board is reading, which is the layer they are on */
  const around = (): World => getWorld(atDepth());
  /** The world cell the board's own cell 0 sits on */
  const originX = (): number => atX() - BOARD_CENTER;
  const originY = (): number => atY() - BOARD_CENTER;
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

    // The best band anything in it belongs to, which is what says
    // whether this was a find worth hearing about. Here rather than at
    // each landmark, so a cache, a bush and a phenomenon all ring alike
    const rarest: ReturnType<typeof getItemBand>[] = [];

    for (const stack of items) {
      rarest.push(getItemBand(stack.item));
    }
    if (rarest.includes('special')) {
      playEffect(Effect.SpecialItem);
    } else if (rarest.includes('prized')) {
      playEffect(Effect.PrizedItem);
    }

    for (const stack of items) {
      const said = `${describeItem(stack.item)} ×${stack.amount}`;
      const art = (): JSX.Element => <ItemSprite item={stack.item} size={ICON_SIZE} label="" />;
      const tone = FIND_TONES[getItemBand(stack.item) ?? 'base'];

      // Over the cell where there is a board to hang it on, and in the
      // corner where there is not: a list has no square to point at
      if (!notes.say(x, y, { message: said, art, tone })) {
        toast.push({ message: said, art, tone });
      }
    }
  };

  const placed = createStoreSignal(walk.placed);
  /**
   * The player's own offset from UTC. The world's instants come from
   * the server, but which hour of the day they fall in is theirs —
   * and it scopes everything they see, so a player in another zone
   * walks a chunk of their own
   */
  const zone = getLocalOffset();
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

    if (at != null) {
      walk.place(at);
    }
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
        walk.standAt(worldCell(at.chunkX, at.cellX), worldCell(at.chunkY, at.cellY), at.depth);
      },
      { defer: true },
    ),
  );

  const boardWindows = createBoardWindows({
    walk: walk,
    zone,
    uid: () => auth.user()?.uid ?? null,
    failed: (message) => {
      remark(message, 'ember');
    },
  });

  onCleanup(() => {
    boardWindows.dispose();
  });

  const acts = createBoardInteractions({
    user: () => auth.user(),
    walk,
    windows: boardWindows,
    setEncounter: game.setEncounter,
    setDialog: game.setDialog,
    setBattle: game.setBattle,
    setRaid: game.setRaid,
    touchRecords: game.touchRecords,
    remark,
    announce,
    tookEgg: (got) => {
      toast.push(
        got
          ? {
              title: m.board_egg_title(),
              message: m.board_egg_yours(),
              tone: 'leaf',
            }
          : {
              message: m.board_egg_gone(),
              tone: 'ember',
            },
      );
      if (got) {
        playEffect(Effect.EggGet);
      }
    },
  });

  const session = createStoreSignal(acts.session);
  const setSession = acts.session.set;
  const once = createStoreSignal(acts.once);
  const busy = createStoreSignal(acts.busy);
  const challengeOpen = createStoreSignal(acts.challenge);
  const challenge = (): [string, StopRecord] | null => challengeOpen()?.stop ?? null;
  const wanderer = createStoreSignal(acts.wanderer);
  const setWanderer = acts.wanderer.set;
  const portal = createStoreSignal(acts.portal);
  const honeyTree = createStoreSignal(acts.honeyTree);
  /** Its world cell, as the lathered list names it */
  const treeKey = (): string => {
    const tree = honeyTree();

    return tree == null ? '' : keyAt(tree);
  };
  const seat = createStoreSignal(acts.seat);
  const setSeat = acts.seat.set;
  const lair = createStoreSignal(acts.lair);
  const lairReason = createStoreSignal(acts.lairReason);
  /**
   * The lair dialog is handed a window and a cell of it, so the cell it
   * is given is the chunk's rather than the board's
   */
  const standingLair = (): [number, RaidView | null] | null => {
    const open = lair();

    return open == null ? null : [open[0].cell, open[1]];
  };
  const eggOffer = createStoreSignal(acts.eggOffer);
  const taking = createStoreSignal(acts.taking);
  const engaged = acts.engaged;
  const showing = acts.showing;
  const holdsSomething = acts.holdsSomething;
  const withinReach = acts.withinReach;
  const reach = acts.reach;

  const liveWindows = createStoreSignal(boardWindows.live);
  const askForWindow = boardWindows.askForWindow;

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
          settings().boardEdge,
        )
      : null,
  );

  boardWindows.attach(() => view()?.chunks ?? null);

  const spent = createStoreSignal(boardWindows.spent);
  const picked = createStoreSignal(boardWindows.picked);
  const dug = createStoreSignal(boardWindows.dug);
  const lathered = createStoreSignal(boardWindows.lathered);

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

  /** The conversation the player is in, so a wanderer who walks on can end it */
  let talking: ConversationHandle | undefined;

  /** Walk up to whoever is standing there and hear them out */
  const talkTo = (spot: Placed, npc: Npc, player: string): void => {
    setWanderer([spot, npc]);
    talking = visitNpc({
      npc,
      cell: spot.cell,
      snapshot: spot.snapshot,
      player,
      sheet: spot.snapshot.getWandererCoats().get(spot.cell),
      notify: (said) => {
        toast.push(said);
      },
      // A served visit greys their glow, so the claims are read again
      changed: recheck,
    });
    talking.done
      .catch((caught: unknown) => {
        remark(describeFailure(caught), 'ember');
      })
      .finally(() => {
        talking = undefined;
        setWanderer(null);
        recheck();
      });
  };

  acts.attach({ view, talk: talkTo, recheck });

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

      if (isRaidLandmark(landmark)) {
        if (read.cleared.has(inChunk)) {
          next.set(at, CellAura.Cleared);
        } else if (landmark === Landmark.AlphaRaid && snapshot.getAlphaRaids().has(inChunk)) {
          // An Alpha at home glows like a fight waiting, since that is what it is
          next.set(at, CellAura.Fight);
        } else if (landmark === Landmark.NobleArena && snapshot.getNobleRaids().has(inChunk)) {
          // A Noble at home glows white like a legend in a seat: a lord
          // of the land is in residence
          next.set(at, CellAura.Legend);
        } else if (landmark === Landmark.TeraRaid && snapshot.getTeraRaids().has(inChunk)) {
          // A Tera crystal with somebody in it glows like a fight waiting, the way an Alpha does
          next.set(at, CellAura.Fight);
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
          // An executive or a boss glows in a colour of its own, so the
          // rank is seen from across the board rather than at the door
          next.set(at, ROCKET_AURAS[snapshot.getRocketRank(inChunk) ?? RocketRank.Grunt]);
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
          // A legend in the champion's seat is not the champion
          next.set(at, snapshot.getLegend(inChunk) == null ? CellAura.Fight : CellAura.Legend);
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
      talking?.end();
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
  /**
   * Which way round the board is being looked at. It outlives the
   * chunk it was turned in
   */
  const [yaw, setYaw] = createSignal(0);

  const carried = createStoreSignal(walk.carried);
  const resume = walk.resume;

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
    acts.meetWaiting(waiting);
  });

  const facing = createStoreSignal(walk.facing);
  const sight = createStoreSignal(walk.sight);

  // What the walk reads from the board and the session, changing
  createEffect(() => {
    view();
    buddy();
    auth.user();
    game.elsewhere();
    walk.refresh();
  });

  const ahead = walk.ahead;

  const journey = createStoreSignal(walk.journey);
  const travel = createStoreSignal(walk.travel);

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

  const untilNextStep = walk.untilNextStep;

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

    walk.press(index);
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
   * The ways are tried in order: two keys held together walk the
   * diagonal, and where that corner is shut the newer key's straight
   * step slides along it instead. A step into a landmark or a boulder
   * turns without moving, which is what a mainline game does and what
   * leaves the interact key something to act on. Held to the same pace
   * as a pressed walk, so neither a held key nor a mashed one outruns
   * the other
   */
  const stepBy = walk.stepBy;

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

  walk.attach({
    buddy,
    view,
    engaged,
    holdsSomething,
    withinReach,
    reach,
    askForWindow: () => {
      askForWindow();
    },
  });

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
    let pacing: ReturnType<typeof setTimeout> | null = null;

    const stop = (): void => {
      held = [];
      if (pacing != null) {
        clearTimeout(pacing);
        pacing = null;
      }
    };

    /**
     * The ways the held keys walk, best first: the newest key on each
     * axis together, then each of those alone, the newer first. Two
     * keys on one axis are the newer one, so rolling from left onto
     * right turns round rather than stopping dead
     */
    const ways = (): [number, number][] => {
      let across: Direction | null = null;
      let along: Direction | null = null;

      for (const one of held) {
        if (STEPS[one][0] === 0) {
          along = one;
        } else {
          across = one;
        }
      }
      if (across == null || along == null) {
        const only = across ?? along;

        return only == null ? [] : [STEPS[only]];
      }

      const newer = held.lastIndexOf(across) > held.lastIndexOf(along) ? across : along;
      const older = newer === across ? along : across;

      return [[STEPS[across][0], STEPS[along][1]], STEPS[newer], STEPS[older]];
    };

    /** The next step once this one is done, which a diagonal makes longer */
    const keepPace = (): void => {
      pacing ??= setTimeout(onward, untilNextStep());
    };

    function onward(): void {
      pacing = null;
      if (held.length === 0) {
        stop();
        return;
      }
      stepBy(ways());
      keepPace();
    }

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
      stepBy(ways());
      keepPace();
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
        female: standing.female,
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

      return standing == null ? LANDMARK_NAMES[landmark] : npcName(standing);
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
            <Note>{m.board_loading()}</Note>
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
                beacons={loaded().beacons}
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
                onHerald={(rank) => {
                  playEffect(
                    rank === 'mythical' ? Effect.MythicalAppears : Effect.LegendaryAppears,
                  );
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
                    {(egg().steps >= egg().hatchSteps ? m.board_egg_ready : m.board_egg_steps)({
                      steps: egg().steps,
                      hatch: egg().hatchSteps,
                    })}
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
            <Note>{m.board_elsewhere({ x: at().chunkX, y: at().chunkY })}</Note>
            <Button onClick={resume}>{m.board_walk_here()}</Button>
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
              npc={challengeOpen()?.npc ?? Npc.RocketGrunt}
              sheet={challengeOpen()?.coat}
              challenger={challengeOpen()?.challenger ?? null}
              onClose={() => {
                acts.challenge.set(null);
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
              onAccept={acts.takeEgg}
              onClose={() => {
                acts.eggOffer.set(null);
                acts.taking.set(false);
              }}
            />
            <RaidDialog
              snapshot={lair()?.[0].snapshot ?? null}
              lair={standingLair()}
              reason={lairReason()}
              onClose={() => {
                acts.lair.set(null);
              }}
            />
            <HoneyTreeDialog
              player={user().uid}
              snapshot={honeyTree()?.snapshot ?? null}
              cell={honeyTree()?.cell ?? null}
              lathered={lathered().has(treeKey())}
              onClose={() => {
                acts.honeyTree.set(null);
              }}
              onLathered={(_, encounter) => {
                boardWindows.lathered.update((cells) => new Set(cells).add(treeKey()));
                if (encounter == null) {
                  return;
                }
                acts
                  .meet(user(), encounter, true)
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
                acts.portal.set(null);
              }}
              onTravel={(destination) => {
                // Out of a portal and into the one it opened onto:
                // the far side is a chunk away rather than a step, so
                // the whole position moves at once
                walk.standAt(
                  worldCell(destination.x, destination.cell % CHUNK_CELLS),
                  worldCell(destination.y, Math.floor(destination.cell / CHUNK_CELLS)),
                );
                remark(
                  m.board_through({ name: destination.name, x: destination.x, y: destination.y }),
                );
                // A key was spent getting here, so where it got them is
                // written down now rather than in a second and a half.
                // The paces that led to the portal go with it; the
                // crossing itself is not a walk and adds none
                walk.settle();
              }}
            />
          </>
        )}
      </Show>
    </div>
  );
}
