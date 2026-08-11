import type { User } from 'firebase/auth';
import {
  For,
  type JSX,
  Show,
  createEffect,
  createResource,
  createSignal,
  from,
  onCleanup,
  onMount,
} from 'solid-js';
import { getBuddyEffects } from '../auth/buddy';
import { useAuth } from '../auth/context';
import { getLocalOffset } from '../auth/local-time';
import type { EncounterRecord } from '../auth/encounter-record';
import {
  RaidKind,
  type RaidView,
  canJoinRaids,
  claimRaidReward,
  hostMythicalRaid,
  peekRaid,
} from '../auth/raids';
import { claimRocketReward, enterRocketStop } from '../auth/rockets';
import type { RocketRecord } from '../auth/rocket-record';
import { createSafariSession, isEncounterFled } from '../auth/safari';
import {
  type SpawnRecord,
  claimBerryPatch,
  claimHiddenGrotto,
  claimItemCache,
  claimNest,
  startEncounter,
  visitChunk,
  watchSnapshotWindow,
  watchSpawns,
} from '../auth/snapshots';
import { type EggWalk, walk } from '../auth/eggs';
import { BIOME_NAMES, TIME_OF_DAY_NAMES } from '../data/biome';
import type Biome from '../data/ids/biome';
import { getTimeOfDay } from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import type { ItemStack } from '../data/overworld/item-pool';
import Landmark, { LANDMARK_NAMES } from '../data/overworld/landmark';
import type Npc from '../data/overworld/npc';
import { NPC_NAMES } from '../data/overworld/npc';
import { getItemData } from '../data/items';
import { getInventory } from '../auth/inventory';
import { getRaidSpecies } from '../data/items/raid-items';
import { getSpeciesData } from '../data/species';
import { CHUNK_CELLS } from '../overworld/chunk';
import ChunkSnapshot, { SPAWN_COUNT } from '../overworld/chunk-snapshot';
import { LURE_SPAWN_BONUS } from '../overworld/abilities/__create';
import type { Buddy } from '../overworld/core';
import createOverworld from '../overworld/setup';
import type { Spawn } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { isInWorld } from '../overworld/world';
import pickStartPosition from '../overworld/start';
import type SafariSession from '../overworld/safari';
import ChunkCanvas from './ChunkCanvas';
import NpcDialog from './NpcDialog';
import RaidDialog from './RaidDialog';
import RocketStopDialog from './RocketStopDialog';
import SafariDialog from './SafariDialog';
import { GameTab, useGame } from './game-context';

/**
 * How many spawns a visit publishes: the ordinary six plus the two a
 * lure draws in, rolled for every window so that a lure changes who
 * can see them rather than whether they exist
 */
const PUBLISHED_SPAWNS = SPAWN_COUNT + LURE_SPAWN_BONUS;

/**
 * Where a player entering a chunk without a stored position starts
 */
const START_CELL = CHUNK_CELLS / 2;

/**
 * How many paces are walked before the egg being carried is told
 * about them. Reporting every cell would be a write per keypress;
 * reporting in batches costs the walker nothing, since the server
 * credits against the time that passed rather than the moment the
 * report arrived
 */
const STEP_REPORT_SIZE = 8;

const MOVES = new Map<string, [x: number, y: number]>([
  ['ArrowUp', [0, -1]],
  ['ArrowDown', [0, 1]],
  ['ArrowLeft', [-1, 0]],
  ['ArrowRight', [1, 0]],
  ['w', [0, -1]],
  ['s', [0, 1]],
  ['a', [-1, 0]],
  ['d', [1, 0]],
]);

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
  published: [string, SpawnRecord][],
  player: string | null,
  buddy: Buddy | null,
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

    const [id, stored] = published[index];

    spawns.set(cell, {
      id,
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
  const [status, setStatus] = createSignal<string | null>(null);
  const [session, setSession] = createSignal<SafariSession<EncounterRecord> | null>(null);
  const game = useGame();

  // Where the player is walking is theirs alone — the game stores no
  // position — but the world map needs a place to point its camera, so
  // it is published as they move
  createEffect(() => {
    game.setChunk([chunkX(), chunkY()]);
  });

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
   * The lair the player is standing in front of, and what it holds.
   * Looking at one stages nothing — the dialog's button is where a
   * lobby is opened or joined
   */
  const [lair, setLair] = createSignal<[number, RaidView] | null>(null);

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
    setStatus(null);
    hostMythicalRaid(snapshot, item)
      .then(async (lobby) => {
        await refetchRelics();

        if (lobby == null) {
          setStatus('That relic called nothing.');
          return;
        }
        game.setRaid(lobby[0]);
        game.setTab(GameTab.Raids);
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  // A player who has not walked anywhere yet starts somewhere in the
  // starting region rather than at the origin. The draw is seeded by
  // their uid, so it is the same place every time until a position
  // is actually stored
  createEffect(() => {
    const user = auth.user();

    if (user == null || placed()) {
      return;
    }

    const start = pickStartPosition(getWorld(), user.uid);

    setPlaced(true);
    setChunkX(start.chunkX);
    setChunkY(start.chunkY);
    setCellX(start.cellX);
    setCellY(start.cellY);
  });

  /**
   * Walking into a chunk publishes (or adopts) the window's spawns;
   * everything after that arrives through the subscriptions below,
   * so a window rolling over or a spawn another player caught shows
   * up without a reload
   */
  createEffect(() => {
    const chunk = getWorld().getChunk(chunkX(), chunkY());

    // The window always rolls the lure's extras, so every player of
    // the chunk shares one set of rolls whoever publishes them
    visitChunk(chunk, PUBLISHED_SPAWNS, zone).catch((caught: unknown) => {
      setStatus(caught instanceof Error ? caught.message : String(caught));
    });
  });

  const snapshotWindow = from<number | null>((set) =>
    watchSnapshotWindow(getWorld().getChunk(chunkX(), chunkY()), zone, (timestamp) => {
      set(timestamp);
    }),
  );

  const published = from<[string, SpawnRecord][]>((set) => {
    const timestamp = snapshotWindow();

    if (timestamp == null) {
      return () => undefined;
    }
    return watchSpawns(getWorld().getChunk(chunkX(), chunkY()), zone, timestamp, (spawns) => {
      set(spawns);
    });
  });

  // What walks beside the player changes what the chunk holds, so the
  // view waits on it the same way it waits on the window
  const [buddy] = createResource(
    () => auth.user()?.uid ?? null,
    async (uid) => getBuddyEffects(uid),
  );

  const view = (): ChunkView | null => {
    const timestamp = snapshotWindow();

    return timestamp == null
      ? null
      : buildChunkView(
          chunkX(),
          chunkY(),
          timestamp,
          zone,
          published() ?? [],
          auth.user()?.uid ?? null,
          buddy() ?? null,
        );
  };

  const cell = (): number => cellY() * CHUNK_CELLS + cellX();

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

  const reportSteps = (): void => {
    if (reporting || pending < STEP_REPORT_SIZE) {
      return;
    }

    const steps = pending;

    pending = 0;
    reporting = true;
    walk(steps)
      .then(setCarried)
      .catch(() => {
        // A dropped report is a few paces, not an error worth
        // interrupting the walk over; the next one carries on
      })
      .finally(() => {
        reporting = false;
      });
  };

  const move = (deltaX: number, deltaY: number): void => {
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

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // The dialogs own the keyboard while they are open
      if (session() != null) {
        return;
      }

      const delta = MOVES.get(event.key.length === 1 ? event.key.toLowerCase() : event.key);

      if (delta == null) {
        return;
      }
      event.preventDefault();
      move(delta[0], delta[1]);
    };

    window.addEventListener('keydown', onKeyDown);
    onCleanup(() => {
      window.removeEventListener('keydown', onKeyDown);
    });
  });

  /**
   * Meet a spawn (or a grotto's pokemon): the encounter is derived
   * once per player and the safari session opens over it
   */
  const meet = async (user: User, encounter: EncounterRecord): Promise<string | null> => {
    if (await isEncounterFled(user.uid, encounter)) {
      return 'Nothing here — it already fled from you.';
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

      return stash == null
        ? 'The cache is empty until the next window.'
        : `Found ${describeStash(stash)}.`;
    }
    if (landmark === Landmark.BerryPatch) {
      const berries = await claimBerryPatch(loaded.snapshot, at);

      return berries == null
        ? 'The patch is bare until the next window.'
        : `Picked ${describeStash([berries])}.`;
    }
    if (landmark === Landmark.WanderingNpc) {
      const standing = loaded.snapshot.getWanderingNpcs().get(at);

      if (standing == null) {
        return 'Nobody is passing through right now.';
      }
      // What they want is put to the player rather than taken from
      // them; the dialog is where the fee is agreed to
      setWanderer([at, standing]);
      return null;
    }
    if (landmark === Landmark.Nest) {
      const egg = await claimNest(loaded.snapshot, at);

      // What is in it is not on offer: an egg shows nothing about
      // itself until it has been carried far enough to open
      return egg == null
        ? 'The nest is bare until tomorrow.'
        : 'An egg is lying in the nest. Walk with it to hatch it.';
    }
    if (landmark === Landmark.HiddenGrotto) {
      const claim = await claimHiddenGrotto(loaded.snapshot, at);

      if (claim == null) {
        return 'The grotto is quiet until the next window.';
      }
      if (claim.kind === 'item') {
        return `The grotto held ${describeStash(claim.items)}.`;
      }
      return meet(user, claim.encounter);
    }
    if (landmark === Landmark.TeamRocketStop) {
      const stop = await enterRocketStop(loaded.snapshot, at);

      if (stop == null) {
        // Either the window stages no grunt here, or this player has
        // already put the one it stages on the ground
        return 'The stop is deserted right now.';
      }
      if (!(await canJoinRaids(user.uid))) {
        return 'A Team Rocket grunt blocks the way — and you have no pokemon to answer with.';
      }
      // The challenge is put to the player rather than taken for
      // them; the dialog is what accepts it
      setChallenge(stop);
      return null;
    }
    if (landmark === Landmark.LegendaryLair || landmark === Landmark.ShadowLair) {
      const kind = landmark === Landmark.ShadowLair ? RaidKind.Shadow : RaidKind.Legendary;
      // Looked at rather than walked into: nothing is staged until the
      // dialog's button is pressed, so a player who thinks better of it
      // leaves no lobby standing behind them
      const standing = await peekRaid(loaded.snapshot, at, kind);

      if (standing == null) {
        // Either the window stages no raid here, it has been cleared,
        // or there is nothing standing and nothing to stage it with
        return (await canJoinRaids(user.uid))
          ? 'The lair is quiet right now.'
          : 'You need a pokemon of your own to raid — you can only watch a raid already under way.';
      }
      setLair([at, standing]);
      return null;
    }
    return null;
  };

  // A cleared raid leaves its legendary waiting, and a beaten grunt
  // what they dropped; both are met the moment the player is back in
  // the overworld
  createEffect(() => {
    const reward = game.reward();
    const user = auth.user();

    if (reward == null || user == null) {
      return;
    }
    game.setReward(null);
    (reward.stop == null ? claimRaidReward(reward.raid) : claimRocketReward(reward.stop))
      .then(async (collected) => {
        if (collected == null) {
          setStatus('There is nothing left to collect.');
          return;
        }
        // The purse lands in the profile straight away; the pokemon
        // is still to be met
        setStatus(
          reward.stop == null
            ? `The raid paid ${collected.gold} gold.`
            : `The grunt dropped ${collected.gold} gold and fled.`,
        );
        setSession(await createSafariSession(user, collected.encounter));
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
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
    const loaded = view();
    const user = auth.user();

    if (loaded == null || user == null || busy() || !withinReach(index)) {
      return;
    }
    setStatus(null);
    setBusy(true);
    interact(loaded, user, index)
      .then(setStatus)
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
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

    // A wandering cell is named for whoever is on it this window, so a
    // player can see from across the chunk whether it is worth the
    // walk
    const standing =
      landmark === Landmark.WanderingNpc
        ? loaded?.snapshot.getWanderingNpcs().get(index)
        : undefined;

    return standing == null ? LANDMARK_NAMES[landmark] : NPC_NAMES[standing];
  };

  return (
    <section>
      <h2>Overworld</h2>
      <p>
        Move with the arrow keys or WASD. Stepping off an edge crosses into the next chunk. Step
        within a cell of a pokemon or a landmark — anywhere in the ring around it — and click it to
        deal with it; walking over one does nothing on its own.
      </p>

      <Show when={view()} fallback={<p>Loading chunk…</p>}>
        {(loaded) => (
          <>
            <p>
              Chunk {loaded().x}, {loaded().y} · {BIOME_NAMES[loaded().biome]} ·{' '}
              {new Date(loaded().snapshot.timestamp).toISOString().slice(11, 16)} UTC ·{' '}
              {TIME_OF_DAY_NAMES[getTimeOfDay(loaded().snapshot.timestamp)]}
            </p>

            {/* The chunk is drawn rather than laid out: one element
                instead of 256, and the ring the player can act on is
                shaded rather than left to be guessed at */}
            <ChunkCanvas
              biome={loaded().biome}
              player={cell()}
              landmarks={loaded().landmarks}
              spawns={new Set(loaded().spawns.keys())}
              reachable={(index) =>
                !busy() && holdsSomething(loaded(), index) && withinReach(index)
              }
              label={titleOf}
              onReach={reach}
            />

            <p>
              Cell {cellX()}, {cellY()}
            </p>

            {/* Only a buddy walks, and only an egg has anywhere to
                walk to, so this appears when one is being carried */}
            <Show when={carried()}>
              {(egg) => (
                <p>
                  Egg · {egg().steps} / {egg().hatchSteps} steps
                  {egg().steps >= egg().hatchSteps ? ' · ready to hatch' : ''}
                </p>
              )}
            </Show>

            {/* A mythical stands on no landmark: the only way to
                face one is to spend the relic that calls it, and it
                is spent whatever the raid comes to */}
            <Show when={relics()?.length}>
              <h4>Raid items</h4>
              <ul>
                <For each={relics()}>
                  {(entry) => (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          callMythical(loaded().snapshot, entry.item);
                        }}
                      >
                        Use {describeItem(entry.item)} × {entry.amount}
                      </button>{' '}
                      — calls {getSpeciesData(entry.species).name}, and is spent doing it
                    </li>
                  )}
                </For>
              </ul>
            </Show>
            <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
          </>
        )}
      </Show>

      <Show when={auth.user()}>
        {(user) => (
          <>
            <SafariDialog
              user={user()}
              session={session()}
              onClose={() => {
                setSession(null);
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
            <RaidDialog
              snapshot={view()?.snapshot ?? null}
              lair={lair()}
              onClose={() => {
                setLair(null);
              }}
            />
          </>
        )}
      </Show>
    </section>
  );
}
