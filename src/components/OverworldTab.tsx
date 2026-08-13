import type { User } from 'firebase/auth';
import {
  For,
  type JSX,
  Show,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { getBuddyEffects } from '../auth/buddy';
import { useAuth } from '../auth/context';
import { getLocalOffset } from '../auth/local-time';
import type { EncounterRecord } from '../auth/encounter-record';
import { RaidKind, type RaidView, canJoinRaids, hostMythicalRaid, peekRaid } from '../auth/raids';
import { savePosition } from '../auth/positions';
import { enterRocketStop } from '../auth/rockets';
import type { RocketRecord } from '../auth/rocket-record';
import { createSafariSession, getRetiredKeys, isEncounterRetired } from '../auth/safari';
import type { NestOffer } from '../server/overworld';
import {
  claimBerryPatch,
  claimItemCache,
  claimNest,
  claimPhenomenon,
  peekNest,
  peekPhenomenonEgg,
  startEncounter,
  visitChunk,
  watchSnapshotWindow,
} from '../auth/snapshots';
import { type EggWalk, walk } from '../auth/eggs';
import { BIOME_COLORS, BIOME_NAMES } from '../data/biome';
import type Biome from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import type { ItemStack } from '../data/overworld/item-pool';
import Landmark, { LANDMARK_NAMES } from '../data/overworld/landmark';
import Npc, { NPC_NAMES } from '../data/overworld/npc';
import { PHENOMENON_NAMES } from '../data/overworld/phenomenon';
import { getItemData } from '../data/items';
import { getInventory } from '../auth/inventory';
import { getRaidSpecies } from '../data/items/raid-items';
import { getSpeciesData } from '../data/species';
import { CHUNK_CELLS } from '../overworld/chunk';
import { type SnapshotRecord, type SpawnRoll, spawnId } from '../auth/snapshot-record';
import ChunkSnapshot, { SPAWN_COUNT } from '../overworld/chunk-snapshot';
import { LURE_SPAWN_BONUS } from '../overworld/abilities/__create';
import type { Buddy } from '../overworld/core';
import createOverworld from '../overworld/setup';
import type { Spawn } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { isInWorld } from '../overworld/world';
import type SafariSession from '../overworld/safari';
import { spawnKey } from '../overworld/safari';
import ChunkCanvas from './ChunkCanvas';
import watchLive from './watch';
import NpcDialog from './NpcDialog';
import PortalDialog from './PortalDialog';
import NestDialog, { type EggSource, type EggState } from './NestDialog';
import RaidDialog from './RaidDialog';
import RocketStopDialog from './RocketStopDialog';
import ItemSprite from './ItemSprite';
import SafariDialog from './SafariDialog';
import { Badge, Button, Note, useToast } from './styled';
import { GameDialog, useGame } from './game-context';

/**
 * How many spawns a visit publishes: the ordinary eight plus the
 * three a lure draws in, rolled for every window so that a lure
 * changes who can see them rather than whether they exist
 */
const PUBLISHED_SPAWNS = SPAWN_COUNT + LURE_SPAWN_BONUS;

/**
 * Where a player entering a chunk without a stored position starts
 */
const START_CELL = CHUNK_CELLS / 2;

/**
 * How long the game waits before writing down where somebody is. A
 * walk is a run of keypresses, and what is worth keeping is where it
 * ended
 */
const SAVE_DELAY = 1500;

/**
 * How many paces are walked before the egg being carried is told
 * about them. Reporting every cell would be a write per keypress;
 * reporting in batches costs the walker nothing, since the server
 * credits against the time that passed rather than the moment the
 * report arrived
 */
const STEP_REPORT_SIZE = 8;

/**
 * How often the chunk may be asked for while the player is playing.
 *
 * The window it is showing lasts five minutes, and asking for it again
 * is a write: whoever asks for an expired one rolls the next set of
 * spawns for everybody standing there. Left on a timer, a player who
 * walked away from the screen kept rolling windows for a chunk nobody
 * was looking at, once every five minutes, for as long as the tab was
 * open.
 *
 * So it is asked for when it is actually worth asking: when the page
 * comes back to the front, and while the player is doing something —
 * and no more than once in five seconds, since a walk is twenty
 * presses and each one is not a question about the world
 */
const REFRESH_DEBOUNCE = 5000;

/**
 * How big the picture on one of those lines is. Small: the line is
 * two words wide, and the picture is there to be recognised rather
 * than admired
 */
const ICON_SIZE = 24;

function describeItem(item: Items): string {
  try {
    return getItemData(item).name;
  } catch {
    return `Item #${item}`;
  }
}

/**
 * What a stash came to, read out: "3 Poke Ball, 2 Ultra Ball and a
 * Fire Stone". A single piece is named without a count, since one of
 * something is what a cache used to always be
 */
function describeStash(stash: ItemStack[]): string {
  const parts = stash.map(({ item, amount }) =>
    amount === 1 ? describeItem(item) : `${amount} × ${describeItem(item)}`,
  );

  if (parts.length <= 1) {
    return parts[0] ?? 'nothing';
  }
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * Whether an egg the world is holding is still going spare, or is one
 * this player has already had out of this window
 */
function stateOf(offer: NestOffer): EggState {
  return offer.taken ? 'taken' : 'offered';
}

/**
 * Where a chunk is, in the words the game names it by: the country
 * and the two numbers that pick it out of the world. It is said on
 * the bar along the bottom of the screen and told to a screen reader
 * as the name of the board, which is the same fact twice and so is
 * written once
 */
function naming(chunk: ChunkView): string {
  return `${BIOME_NAMES[chunk.biome]} (${chunk.x}, ${chunk.y})`;
}

interface ChunkView {
  x: number;
  y: number;
  biome: Biome;
  snapshot: ChunkSnapshot;
  landmarks: Map<number, Landmark>;
  /**
   * The window's spawns by cell, each with the id it was published
   * under, so an interaction can derive the same encounter every
   * observer sees
   */
  spawns: Map<number, { id: string; spawn: Spawn }>;
  caches: Map<number, ItemStack[]>;
}

/**
 * Build the chunk's view from the window and the spawns the store
 * currently holds. Everything else — landmarks, caches, grottos,
 * raids — re-derives from the chunk seed and the window, so the
 * subscription only has to carry those two
 */
function buildChunkView(
  x: number,
  y: number,
  timestamp: number,
  offset: number,
  published: SpawnRoll[],
  player: string | null,
  buddy: Buddy | null,
  fled: Set<string>,
): ChunkView {
  const chunk = getWorld().getChunk(x, y);
  const snapshot = new ChunkSnapshot(chunk, timestamp, offset);
  // Rolling locally reproduces the published placement — same seed,
  // same window, same count — and is what pins each spawn to a cell
  snapshot.getSpawns(PUBLISHED_SPAWNS);

  const spawns = new Map<number, { id: string; spawn: Spawn }>();
  const cells = [...snapshot.getSpawnCells()];
  // The same engine the server stages encounters with: a lure decides
  // how many of the window's rolls are there for this player
  const overworld = createOverworld(player ?? '', player == null ? null : buddy);
  const visible = overworld.checkSpawnCount(SPAWN_COUNT);

  cells.forEach(([cell], index) => {
    // Roll order and publication order are the same, so the nth
    // placed cell carries the nth published spawn
    if (index >= visible || index >= published.length) {
      return;
    }

    const stored = published[index];

    // One that has already run from this player is not standing
    // there any more — for them. It stays in the window, since the
    // window is everybody's, and it is left out of what this player
    // is shown rather than out of what was rolled
    if (fled.has(spawnKey(x, y, timestamp, stored.individualValue))) {
      return;
    }

    spawns.set(cell, {
      // The name is derived from the window rather than stored with
      // the roll, so the two cannot disagree about which spawn it is
      id: spawnId(snapshot.key, timestamp, index),
      spawn: [stored.species, stored.individualValue, stored.traitValue],
    });
  });

  return {
    x,
    y,
    biome: chunk.biome,
    snapshot,
    landmarks: chunk.getLandmarkCells(),
    spawns,
    caches: snapshot.getItemCaches(),
  };
}

/**
 * The overworld as the player walks it: arrow keys or WASD move one
 * cell at a time, stepping off an edge carries them into the
 * adjacent chunk, and landing on a spawn or a landmark triggers its
 * interaction
 */
export default function OverworldTab(): JSX.Element {
  const auth = useAuth();
  const [chunkX, setChunkX] = createSignal(0);
  const [chunkY, setChunkY] = createSignal(0);
  const [cellX, setCellX] = createSignal(START_CELL);
  const [cellY, setCellY] = createSignal(START_CELL);
  const [session, setSession] = createSignal<SafariSession<EncounterRecord> | null>(null);
  const game = useGame();
  const toast = useToast();

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
  const announce = (empty: string, items: ItemStack[] | null): void => {
    if (items == null || items.length === 0) {
      remark(empty);
      return;
    }

    for (const stack of items) {
      toast.push({
        message: `${describeItem(stack.item)} ×${stack.amount}`,
        art: <ItemSprite item={stack.item} size={ICON_SIZE} label="" />,
        tone: 'leaf',
      });
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
  const [challenge, setChallenge] = createSignal<[string, RocketRecord] | null>(null);
  /**
   * The passer-by the player has stopped at: the cell they are
   * standing on and who is on it this window, until their business is
   * done or declined
   */
  const [wanderer, setWanderer] = createSignal<[number, Npc] | null>(null);
  /**
   * The portal cell the player is standing at, or null. What it opens
   * onto is derived in the dialog rather than here
   */
  const [portal, setPortal] = createSignal<number | null>(null);
  /**
   * The lair the player is standing in front of, and what it holds.
   * Looking at one stages nothing — the dialog's button is where a
   * lobby is opened or joined
   */
  const [lair, setLair] = createSignal<[number, RaidView | null] | null>(null);
  /**
   * What the lair dialog says when there is nothing standing in it
   */
  const [lairReason, setLairReason] = createSignal<string | null>(null);
  /**
   * The raid items the player carries, each with what it calls. They
   * are used where the player stands, so they live here rather than
   * in the bag listing
   */
  const [relics, { refetch: refetchRelics }] = createResource(
    () => auth.user()?.uid ?? null,
    async (uid) => {
      const carried = await getInventory(uid);

      return carried
        .map((entry) => ({ ...entry, species: getRaidSpecies(entry.item) }))
        .filter(
          (entry): entry is typeof entry & { species: Species } =>
            entry.species != null && entry.amount > 0,
        );
    },
  );

  /**
   * Spend a relic: the lobby opens where the player is standing, and
   * the Raids tab is where it is fought from
   */
  const callMythical = (snapshot: ChunkSnapshot, item: Items): void => {
    hostMythicalRaid(snapshot, item)
      .then(async (lobby) => {
        await refetchRelics();

        if (lobby == null) {
          remark('That relic called nothing.');
          return;
        }
        game.setRaid(lobby[0]);
        game.setDialog(GameDialog.Raids);
      })
      .catch((caught: unknown) => {
        remark(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  // Where they were put by the provider, which is the one place the
  // position is worked out: a tab panel unmounts when it is left, so
  // walking back into the Overworld is a remount, and it must pick up
  // where the walk left off rather than start again
  createEffect(() => {
    const at = game.position();

    if (at == null || placed()) {
      return;
    }
    setChunkX(at.chunkX);
    setChunkY(at.chunkY);
    setCellX(at.cellX);
    setCellY(at.cellY);
    // Last, so nothing that watches a chunk starts watching the wrong
    // one: the whole overworld waits on being placed
    setPlaced(true);
  });

  /**
   * Walking into a chunk publishes (or adopts) the window's spawns;
   * everything after that arrives through the subscriptions below,
   * so a window rolling over or a spawn another player caught shows
   * up without a reload
   */
  const refreshWindow = (): void => {
    // The window always rolls the lure's extras, so every player of
    // the chunk shares one set of rolls whoever publishes them
    visitChunk(getWorld().getChunk(chunkX(), chunkY()), PUBLISHED_SPAWNS, zone).catch(
      (caught: unknown) => {
        remark(caught instanceof Error ? caught.message : String(caught), 'ember');
      },
    );
  };

  /**
   * When the chunk was last asked for. It is a plain variable rather
   * than a signal: nothing renders off it, and a debounce that caused
   * a redraw would be a strange thing
   */
  let askedAt = 0;

  /**
   * Ask for the chunk, unless it was just asked for.
   *
   * Coming back to the page always asks — the window has very likely
   * turned over while it was in the background, and that is the moment
   * a player wants to see what is standing there now. Everything else
   * a player does asks at most every five seconds
   */
  const askForWindow = (whatever = false): void => {
    const at = Date.now();

    if (!whatever && at - askedAt < REFRESH_DEBOUNCE) {
      return;
    }
    askedAt = at;
    refreshWindow();
  };

  // Arriving somewhere is always worth a look: this runs on being
  // placed and again on every chunk walked into, since `refreshWindow`
  // reads the coordinates
  createEffect(() => {
    if (!placed()) {
      return;
    }
    askedAt = Date.now();
    refreshWindow();
  });

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

    document.addEventListener('visibilitychange', onReturn);
    globalThis.addEventListener('focus', onReturn);

    onCleanup(() => {
      document.removeEventListener('visibilitychange', onReturn);
      globalThis.removeEventListener('focus', onReturn);
    });
  });

  // One subscription for the whole window: what time it is here and
  // what is standing in the chunk arrive together, since they are one
  // document. A spawn caught by another player disappears from every
  // screen the moment the window is rewritten
  const window = watchLive<SnapshotRecord>((set) => {
    // Nothing is watched until the player has been put somewhere:
    // chunk 0,0 is not where they are, and publishing its window
    // would be a visit nobody made. Being placed is what opens it,
    // which is why this is `watchLive` and not `from` — see the note
    // there, and note that walking into the next chunk re-opens it
    // for the same reason
    if (!placed()) {
      return null;
    }
    return watchSnapshotWindow(getWorld().getChunk(chunkX(), chunkY()), zone, (record) => {
      if (record != null) {
        set(record);
      }
    });
  });

  // What walks beside the player changes what the chunk holds, so the
  // buddy's effects are read alongside it
  const [buddy] = createResource(() => auth.user()?.uid ?? null, getBuddyEffects);

  /**
   * What has run from this player. Re-read when a meeting ends, since
   * the one that just fled is the one that has to stop being drawn
   */
  const [fled, { refetch: refetchFled }] = createResource(
    () => auth.user()?.uid ?? null,
    async (uid) => getRetiredKeys(uid),
  );

  const view = (): ChunkView | null => {
    const record = window();

    return record == null
      ? null
      : buildChunkView(
          chunkX(),
          chunkY(),
          record.timestamp,
          zone,
          record.spawns,
          auth.user()?.uid ?? null,
          buddy() ?? null,
          fled() ?? new Set(),
        );
  };

  // Where they are, said on the bar at the bottom of the screen. The
  // bar is a sibling of the world rather than a child of it, so the
  // words are published upwards and cleared on the way out — a battle
  // takes the page, and the place under it is not where the player is
  // standing any more
  createEffect(() => {
    const standing = view();

    game.setPlace(standing == null ? null : naming(standing));
  });

  onCleanup(() => {
    game.setPlace(null);
  });

  const cell = (): number => cellY() * CHUNK_CELLS + cellX();

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
    cell: number;
    from: EggSource;
    state: EggState;
    message: string | null;
  } | null>(null);
  const [taking, setTaking] = createSignal(false);
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
    const loaded = view();

    if (offer == null || loaded == null || taking()) {
      return;
    }
    setTaking(true);
    (offer.from === 'nest'
      ? claimNest(loaded.snapshot, offer.cell)
      : claimPhenomenon(loaded.snapshot, offer.cell).then((claim) =>
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
                    ? 'It is gone — somebody else may have been here, or the window has turned over.'
                    : 'Carry it as your buddy and walk. Nothing about it is known until it opens.',
              },
        );

        if (catchId != null) {
          // A new record, under whatever list is showing behind this
          game.touchRecords();
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

  /**
   * Hand the paces walked so far to the server. A walk in progress
   * reports in batches of `STEP_REPORT_SIZE`; `force` is for the
   * moments a walk **stops** — the same moments the position is
   * written down — where the last few paces are worth keeping even
   * though they are not a batch
   */
  const reportSteps = (force = false): void => {
    if (reporting || pending === 0 || (!force && pending < STEP_REPORT_SIZE)) {
      return;
    }

    const steps = pending;

    pending = 0;
    reporting = true;
    walk(steps)
      .then((report) => {
        setCarried(report?.egg ?? null);

        // A find is worth saying out loud: it lands in the bag while
        // the player is looking at the map rather than at their
        // inventory, and nothing else would tell them
        if (report != null && report.picked.length > 0) {
          remark(`Your buddy picked up ${describeStash(report.picked)}.`, 'leaf');
        }
      })
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
    reportSteps(true);
    // What the rest of the game is told, so the world map's camera is
    // looking at the chunk the player is actually in — and so a
    // remount of this tab picks the walk up rather than the record
    game.setPosition({
      player: auth.user()?.uid ?? '',
      chunkX: chunk,
      chunkY: row,
      cellX: x,
      cellY: y,
      movedAt: Date.now(),
    });
    savePosition(chunk, row, x, y).catch((caught: unknown) => {
      remark(caught instanceof Error ? caught.message : String(caught), 'ember');
    });
  };

  // ...and remembered as they walk. A step is a keypress, so the
  // writes are held back to one every SAVE_DELAY: the effect re-runs
  // on every move and clears the timer it set last time, so what
  // lands is where they stopped rather than every square they crossed
  createEffect(() => {
    const user = auth.user();
    const at = { chunkX: chunkX(), chunkY: chunkY(), cellX: cellX(), cellY: cellY() };

    if (user == null || !placed()) {
      return;
    }

    const timer = setTimeout(() => {
      settle(at.chunkX, at.chunkY, at.cellX, at.cellY);
    }, SAVE_DELAY);

    onCleanup(() => {
      clearTimeout(timer);
    });
  });

  // Leaving the tab unmounts it, which would drop a walk that had not
  // reached the end of its delay — so the last of it is settled on the
  // way out rather than thrown away
  onCleanup(() => {
    if (placed()) {
      settle(chunkX(), chunkY(), cellX(), cellY());
    }
  });

  const move = (deltaX: number, deltaY: number): void => {
    // A step is a reason to wonder what is around, at most every few
    // seconds of walking
    askForWindow();

    let x = cellX() + deltaX;
    let y = cellY() + deltaY;
    let chunk = chunkX();
    let row = chunkY();

    // Walking off an edge carries into the neighboring chunk, and
    // the player re-enters it from the opposite edge
    if (x < 0) {
      chunk -= 1;
      x = CHUNK_CELLS - 1;
    } else if (x >= CHUNK_CELLS) {
      chunk += 1;
      x = 0;
    }
    if (y < 0) {
      row -= 1;
      y = CHUNK_CELLS - 1;
    } else if (y >= CHUNK_CELLS) {
      row += 1;
      y = 0;
    }

    // The world is finite: its outermost chunks have no neighbor to
    // step into, so a walk into the edge goes nowhere
    if (!isInWorld(chunk, row)) {
      return;
    }
    setChunkX(chunk);
    setChunkY(row);
    setCellX(x);
    setCellY(y);
    // A cell crossed is a step walked, and an egg only moves while it
    // is the one being carried
    pending += 1;
    reportSteps();
  };

  /**
   * Meet a spawn (or a grotto's pokemon): the encounter is derived
   * once per player and the safari session opens over it
   */
  const meet = async (user: User, encounter: EncounterRecord): Promise<string | null> => {
    if (await isEncounterRetired(user.uid, encounter)) {
      // Either it ran off or it is already in the bag; from the cell's
      // side those are the same thing — nobody is standing there
      return 'Nothing here — this one is done with you.';
    }
    setSession(await createSafariSession(user, encounter));
    return null;
  };

  const interact = async (loaded: ChunkView, user: User, at: number): Promise<string | null> => {
    const spawn = loaded.spawns.get(at);

    if (spawn != null) {
      // The server decides what is standing there: a spawn from a
      // window that has turned over is no longer met
      const encounter = await startEncounter(loaded.snapshot, spawn.id);

      return encounter == null ? 'It is gone — the chunk has moved on.' : meet(user, encounter);
    }

    const landmark = loaded.landmarks.get(at);

    if (landmark === Landmark.ItemCache) {
      const stash = await claimItemCache(loaded.snapshot, at);

      // What came out of the ground is put in front of them rather
      // than said under the map: a player pressing a cell is looking
      // at the cell
      announce('The cache is empty until the next window.', stash);
      return null;
    }
    if (landmark === Landmark.BerryPatch) {
      const berries = await claimBerryPatch(loaded.snapshot, at);

      announce('The patch is bare until the next window.', berries == null ? null : [berries]);
      return null;
    }
    if (landmark === Landmark.WanderingNpc) {
      const standing = loaded.snapshot.getWanderingNpcs().get(at);

      if (standing == null) {
        return 'Nobody is passing through right now.';
      }
      // One of the people a crossroads brings is not there to trade.
      // The grunt's own dialog is what the challenge is put in, so the
      // branch is here rather than inside the wanderer's
      if (standing === Npc.RocketGrunt) {
        const stop = await enterRocketStop(loaded.snapshot, at);

        if (stop == null) {
          // Either the window stages no grunt here, or this player has
          // already put the one it stages on the ground
          return 'The grunt has moved on.';
        }
        if (!(await canJoinRaids(user.uid))) {
          return 'A Team Rocket grunt blocks the way — and you have no pokemon to answer with.';
        }
        // The challenge is put to the player rather than taken for
        // them; the dialog is what accepts it
        setChallenge(stop);
        return null;
      }
      // What they want is put to the player rather than taken from
      // them; the dialog is where the fee is agreed to
      setWanderer([at, standing]);
      return null;
    }
    if (landmark === Landmark.Nest) {
      // Looked into rather than emptied. Every other landmark pays out
      // the moment it is pressed, because everything else they pay is
      // simply better to have; an egg is not. A buddy carries one egg
      // and walks it open, so a second one is a decision about the
      // first, and the player is the one to make it
      const offer = await peekNest(loaded.snapshot, at);

      // A bare nest opens the dialog too. A player who pressed a cell
      // asked a question, and the answer belongs where they are
      // looking rather than in a line under the map
      setEggOffer({
        cell: at,
        from: 'nest',
        state: offer == null ? 'bare' : stateOf(offer),
        message: null,
      });
      return null;
    }
    if (landmark === Landmark.Phenomenon) {
      const showing = loaded.snapshot.getPhenomena().get(at);
      // The grotto's egg is the one thing here that is asked about
      // first; an item and a pokemon are walked into as they always
      // were, and neither is worth a question
      const hidden = await peekPhenomenonEgg(loaded.snapshot, at);

      if (hidden != null) {
        setEggOffer({ cell: at, from: 'grotto', state: stateOf(hidden), message: null });
        return null;
      }

      const claim = await claimPhenomenon(loaded.snapshot, at);

      if (claim == null) {
        // Either the hour staged nothing here, or this player has
        // already had what it staged
        return `${showing == null ? 'It' : PHENOMENON_NAMES[showing]} — nothing there now.`;
      }
      if (claim.kind === 'item') {
        // Shown the way a cache or a patch is shown: something was
        // found, and a player pressing a cell is looking at the cell
        // rather than at the line under the map
        announce('Nothing was left behind.', claim.items);
        return null;
      }
      if (claim.kind === 'egg') {
        // Unreachable in practice — an egg is peeked at above and
        // taken through the dialog — but the claim can still answer
        // one if the hour turned over between the two calls
        return 'An egg, tucked away in the grotto. Walk with it to hatch it.';
      }
      return meet(user, claim.encounter);
    }
    if (landmark === Landmark.Portal) {
      // Where it goes is derived from the chunk it stands in, so the
      // dialog can list every destination without asking anything of
      // the server. The key is what the server is for
      setPortal(at);
      return null;
    }
    if (landmark === Landmark.LegendaryLair || landmark === Landmark.ShadowLair) {
      const kind = landmark === Landmark.ShadowLair ? RaidKind.Shadow : RaidKind.Legendary;
      // Looked at rather than walked into: nothing is staged until the
      // dialog's button is pressed, so a player who thinks better of it
      // leaves no lobby standing behind them
      const standing = await peekRaid(loaded.snapshot, at, kind);

      // Either the window stages no raid here, it has been cleared, or
      // there is nothing standing and nothing to stage it with. The
      // dialog opens for all of it: a player who pressed a lair is
      // looking at the lair, not at the line under the map
      setLairReason(
        standing != null || (await canJoinRaids(user.uid))
          ? 'The lair is quiet right now — nothing has come out of it this window.'
          : 'You need a pokemon of your own to raid. You can watch one already under way.',
      );
      setLair([at, standing]);
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
    createSafariSession(user, waiting)
      .then(setSession)
      .catch((caught: unknown) => {
        remark(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  });

  /**
   * Whether the cell holds anything to interact with. A landmark or
   * a spawn is a thing; empty ground is not
   */
  const holdsSomething = (loaded: ChunkView | null, index: number): boolean =>
    loaded != null && (loaded.spawns.has(index) || loaded.landmarks.has(index));

  /**
   * Whether the player can reach the cell from where they stand: the
   * 3x3 they are in the middle of. Walking *onto* a pokemon or a
   * landmark is not how anything is triggered — a player steps up
   * beside it and reaches out, so passing through a cell never
   * springs it on them
   */
  const withinReach = (index: number): boolean => {
    const x = index % CHUNK_CELLS;
    const y = Math.floor(index / CHUNK_CELLS);

    return Math.abs(x - cellX()) <= 1 && Math.abs(y - cellY()) <= 1;
  };

  const reach = (index: number): void => {
    // Reaching for something is the moment it matters most whether the
    // chunk still holds what it is showing
    askForWindow();

    const loaded = view();
    const user = auth.user();

    if (loaded == null || user == null || busy() || !withinReach(index)) {
      return;
    }
    setBusy(true);
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
      });
  };

  const titleOf = (index: number): string => {
    const loaded = view();
    const landmark = loaded?.landmarks.get(index);
    const spawn = loaded?.spawns.get(index);

    if (spawn != null) {
      return getSpeciesData(spawn.spawn[0]).name;
    }
    if (landmark == null) {
      return '';
    }

    // A wandering cell is named for whoever is on it this window, and
    // a phenomenon for whatever is going on there this hour, so a
    // player can see from across the chunk whether it is worth the
    // walk
    if (landmark === Landmark.WanderingNpc) {
      const standing = loaded?.snapshot.getWanderingNpcs().get(index);

      return standing == null ? LANDMARK_NAMES[landmark] : NPC_NAMES[standing];
    }
    if (landmark === Landmark.Phenomenon) {
      const showing = loaded?.snapshot.getPhenomena().get(index);

      return showing == null ? LANDMARK_NAMES[landmark] : PHENOMENON_NAMES[showing];
    }
    return LANDMARK_NAMES[landmark];
  };

  return (
    <div class="relative h-full w-full">
      <Show
        when={view()}
        fallback={
          <div class="flex h-full items-center justify-center">
            <Note>Loading chunk…</Note>
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
                not, so there is always a margin around it — left grey
                it read as a picture of a world on a page, rather than
                as being somewhere */}
            <div
              class="flex h-full w-full items-center justify-center px-3 pt-8 pb-20
                transition-colors [container-type:size]"
              style={{ 'background-color': BIOME_COLORS[loaded().biome] }}
            >
              <ChunkCanvas
                biome={loaded().biome}
                // The camera belongs to the player rather than to the
                // chunk: walking over a boundary swaps the board out
                // and a camera living down there would face front
                // again every time
                yaw={yaw()}
                onTurn={(turned) => {
                  setYaw(turned);
                }}
                caption={naming(loaded())}
                player={cell()}
                landmarks={loaded().landmarks}
                spawns={
                  new Map([...loaded().spawns].map(([at, standing]) => [at, standing.spawn[0]]))
                }
                reachable={(index) =>
                  !busy() && holdsSomething(loaded(), index) && withinReach(index)
                }
                label={titleOf}
                onReach={reach}
                onWalk={move}
              />
            </div>

            {/* What the player is carrying and what they can spend
                here, over the corner of the map rather than under it.
                Both are things about this moment — an egg a few paces
                from hatching, a relic that can only be used where
                somebody is standing — and neither is worth a strip of
                the world when there is no egg and no relic */}
            <div class="pointer-events-none absolute top-2 right-2 flex flex-col items-end gap-1">
              <Show when={carried()}>
                {(egg) => (
                  <Badge tone={egg().steps >= egg().hatchSteps ? 'leaf' : 'neutral'}>
                    Egg · {egg().steps} / {egg().hatchSteps}
                    {egg().steps >= egg().hatchSteps ? ' · ready' : ''}
                  </Badge>
                )}
              </Show>
              {/* A mythical stands on no landmark: the only way to
                  face one is to spend the relic that calls it, and it
                  is spent whatever the raid comes to */}
              <For each={relics()}>
                {(entry) => (
                  <Button
                    class="pointer-events-auto"
                    onClick={() => {
                      callMythical(loaded().snapshot, entry.item);
                    }}
                  >
                    Use {describeItem(entry.item)} × {entry.amount}
                  </Button>
                )}
              </For>
            </div>
          </>
        )}
      </Show>

      <Show when={auth.user()}>
        {(user) => (
          <>
            <SafariDialog
              user={user()}
              session={session()}
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
                Promise.resolve(refetchFled()).catch(() => {
                  // Worst case it is drawn until the window turns over
                });
              }}
              onClose={() => {
                setSession(null);
                // A meeting that ended in a flight leaves the chunk
                // with one fewer pokemon in it for this player
                Promise.resolve(refetchFled()).catch(() => {
                  // Worst case the spawn is drawn until the window
                  // turns over, and interacting with it says it has
                  // already fled — which is what happened before
                });
              }}
            />
            <RocketStopDialog
              user={user()}
              challenge={challenge()}
              onClose={() => {
                setChallenge(null);
              }}
            />
            <NpcDialog
              player={user().uid}
              snapshot={view()?.snapshot ?? null}
              standing={wanderer()}
              onClose={() => {
                setWanderer(null);
              }}
            />
            <NestDialog
              offer={eggOffer()}
              busy={taking()}
              onAccept={takeEgg}
              onClose={() => {
                setEggOffer(null);
                setTaking(false);
              }}
            />
            <RaidDialog
              snapshot={view()?.snapshot ?? null}
              lair={lair()}
              reason={lairReason()}
              onClose={() => {
                setLair(null);
              }}
            />
            <PortalDialog
              player={user().uid}
              snapshot={view()?.snapshot ?? null}
              cell={portal()}
              onClose={() => {
                setPortal(null);
              }}
              onTravel={(destination) => {
                // Out of a portal and into the one it opened onto:
                // the far side is a chunk away rather than a step, so
                // the whole position moves at once
                setChunkX(destination.x);
                setChunkY(destination.y);
                setCellX(destination.cell % CHUNK_CELLS);
                setCellY(Math.floor(destination.cell / CHUNK_CELLS));
                remark(
                  `Through to ${BIOME_NAMES[destination.biome]} — chunk ${destination.x}, ${destination.y}.`,
                );
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
