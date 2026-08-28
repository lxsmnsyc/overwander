import { type ChunkView, buildChunkView, naming } from './chunk-view';
import challengerOf from './challengers';
import { describeItem } from '../../details';
import { type Journey, describeStash, stateOf } from './journey';
import { useAuth } from '../../../auth/context';
import { DEFAULT_CHARSET } from '../../../data/overworld/charsets';
import { watchProfile } from '../../../auth/profile';
import { type EggWalk, walk } from '../../../auth/eggs';
import type { EncounterRecord } from '../../../auth/encounter-record';
import { getLocalOffset } from '../../../auth/local-time';
import { savePosition } from '../../../auth/positions';
import {
  RaidKind,
  type RaidView,
  canJoinRaids,
  hostMythicalRaid,
  peekRaid,
} from '../../../auth/raids';
import { type RocketRecord, rocketStopId } from '../../../auth/rocket-record';
import { claimRocketReward, enterRocketStop } from '../../../auth/rockets';
import { createSafariSession, isEncounterRetired } from '../../../auth/safari';
import type { SnapshotRecord } from '../../../auth/snapshot-record';
import {
  claimBerryPatch,
  claimItemCache,
  claimNest,
  claimPhenomenon,
  listClaimedItemCaches,
  listClaimedPhenomena,
  listPickedBerryPatches,
  peekNest,
  peekPhenomenonEgg,
  startEncounter,
  visitChunk,
  watchSnapshotWindow,
} from '../../../auth/snapshots';
import type { PlayerIdentity } from '../../../auth/user';
import { type BoardCell, borderExit, chunkCellOf } from '../../../canvas/board';
import { latitudeOf } from '../../../canvas/daylight';
import { BIOME_COLORS, BIOME_NAMES } from '../../../data/biome';
import type { Items } from '../../../data/ids/items';
import type { Species } from '../../../data/ids/species';
import { DECORATION_NAMES } from '../../../data/overworld/decoration';
import {
  CHAMPION_NAME,
  ELITE_MEMBER_NAMES,
  GYM_LEADER_NAMES,
} from '../../../data/overworld/experts';
import type { ItemStack } from '../../../data/overworld/item-pool';
import Landmark, { LANDMARK_NAMES } from '../../../data/overworld/landmark';
import Npc, { NPC_NAMES } from '../../../data/overworld/npc';
import type { GymSeatStanding } from '../../../auth/gym-seat-record';
import { enterGymSeat } from '../../../auth/gym-seats';
import GymSeatDialog from '../GymSeatDialog';
import { VENDOR_KIND_NAMES } from '../../../data/overworld/vendor';
import type Phenomenon from '../../../data/overworld/phenomenon';
import { PHENOMENON_NAMES } from '../../../data/overworld/phenomenon';
import { getSpeciesData } from '../../../data/species';
import { CHUNK_CELLS } from '../../../overworld/chunk';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import type { Buddy } from '../../../overworld/core';
import getWorld from '../../../overworld/current';
import { findPathBeside, findPathNear } from '../../../overworld/path';
import type SafariSession from '../../../overworld/safari';
import { isInWorld } from '../../../overworld/world';
import { GameDialog, useGame } from '../../app/game-context';
import watchLive from '../../app/watch';
import ItemSprite from '../../items/ItemSprite';
import RaidDialog from '../../raids/RaidDialog';
import { Badge, Button, Note, useToast } from '../../styled';
import NestDialog, { type EggSource, type EggState } from '../NestDialog';
import PortalDialog from '../PortalDialog';
import RocketStopDialog, { type StopChallenge } from '../RocketStopDialog';
import SafariDialog from '../SafariDialog';
import ChunkCanvas, { CROSSING_IN, CROSSING_OUT, type Crossing } from '../chunk-canvas';
import NpcDialog from '../npc-dialog';
import {
  For,
  type JSX,
  type Resource,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js';
import {
  CROSSING_LIMIT,
  FIGHT_LANDMARKS,
  ICON_SIZE,
  PUBLISHED_SPAWNS,
  REFRESH_DEBOUNCE,
  SAVE_DELAY,
  START_CELL,
  STEP_PACE,
  STEP_REPORT_SIZE,
} from './metrics';

/**
 * The overworld as the player walks it: arrow keys or WASD move one
 * cell at a time, stepping off an edge carries them into the
 * adjacent chunk, and landing on a spawn or a landmark triggers its
 * interaction
 */
/**
 * The world itself, which is where the relics, the buddy and what has
 * fled are all read.
 *
 * Any of them read in the body that declared it would throw past every
 * `Suspense` written there and land on the boundary around the whole
 * page — the world is what that boundary would blank
 */
export default function OverworldBoard(props: {
  relics: Resource<{ item: Items; amount: number; species: Species }[]>;
  buddy: Resource<Buddy | null>;
  fled: Resource<Set<string>>;
  onRelicSpent: () => void;
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
  const [chunkX, setChunkX] = createSignal(0);
  const [chunkY, setChunkY] = createSignal(0);
  const [cellX, setCellX] = createSignal(START_CELL);
  const [cellY, setCellY] = createSignal(START_CELL);
  /**
   * Where they are standing, as one number: the cell index every part
   * of the game names a square by
   */
  const cell = (): number => cellY() * CHUNK_CELLS + cellX();
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
        art: () => <ItemSprite item={stack.item} size={ICON_SIZE} label="" />,
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
  const [wanderer, setWanderer] = createSignal<[number, Npc] | null>(null);
  /**
   * The portal cell the player is standing at, or null. What it opens
   * onto is derived in the dialog rather than here
   */
  const [portal, setPortal] = createSignal<number | null>(null);
  /**
   * The gym seat the player has walked up to: the cell, and where
   * this player stands with it — who holds it, when they may
   * challenge again, and whether they are the one just beaten off it
   */
  const [seat, setSeat] = createSignal<[number, GymSeatStanding] | null>(null);
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
  const relics = (): { item: Items; amount: number; species: Species }[] | undefined =>
    props.relics();

  /**
   * Spend a relic: the lobby opens where the player is standing, and
   * the Raids tab is where it is fought from
   */
  const callMythical = (snapshot: ChunkSnapshot, item: Items): void => {
    hostMythicalRaid(snapshot, item)
      .then((lobby) => {
        props.onRelicSpent();

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
  const buddy = (): Buddy | null | undefined => props.buddy();

  /**
   * What has run from this player. Re-read when a meeting ends, since
   * the one that just fled is the one that has to stop being drawn
   */
  const fled = (): Set<string> | undefined => props.fled();

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

  /**
   * The board being left behind, while it is being left behind.
   *
   * Crossing a boundary re-opens the window subscription, and what it
   * holds is null until the next chunk's window arrives — so the world
   * had nothing to draw for a round trip and put a line of text on the
   * screen instead. That is a flash of the whole page, every time
   * somebody walks off an edge.
   *
   * Held here, the old chunk stays on screen and is carried off by the
   * canvas while the new one is in the air. The player's cell is held
   * with it: they are already standing on the far side by then, and
   * their marker jumping to the opposite edge of a board they have not
   * left yet is the same flash in miniature
   */
  const [frozen, setFrozen] = createSignal<{ view: ChunkView; player: number } | null>(null);
  const [crossing, setCrossing] = createSignal<Crossing | null>(null);
  /**
   * Whether the board has finished being carried off. The other half
   * of the wait is the new window, and the crossing turns round when
   * both are done
   */
  const [gone, setGone] = createSignal(true);

  /**
   * What is on screen: the board being carried off, or the one the
   * player is standing in
   */
  const shown = (): ChunkView | null => frozen()?.view ?? view();

  /**
   * The cells whose happening this player has already walked into.
   *
   * A phenomenon is claimed once an hour per player, so one already
   * taken is a cell that would answer nothing. It is dropped from the
   * board the moment it pays out rather than left standing to be
   * pressed again, and re-read from the store on arrival so it stays
   * dropped across a reload or a walk back into the chunk
   */
  const [spent, setSpent] = createSignal<Set<number>>(new Set());

  createEffect(() => {
    const loaded = view();

    if (loaded == null) {
      return;
    }

    let live = true;

    listClaimedPhenomena(loaded.snapshot)
      .then((cells) => {
        if (live) {
          setSpent(new Set(cells));
        }
      })
      .catch(() => {
        // A board that cannot say what was already taken draws them
        // all: pressing a spent one costs a refusal, not a mistake
      });
    onCleanup(() => {
      live = false;
    });
  });

  /**
   * The patches this player has already stripped this window.
   *
   * Read from the store on arrival rather than only remembered from the
   * press, so a bare bush stays bare across a reload or a walk back
   * into the chunk. The markers behind it are keyed by the window, so
   * the set empties itself when the patches grow again
   */
  const [picked, setPicked] = createSignal<Set<number>>(new Set());

  /**
   * The caches this player has already dug up this window, which the
   * board draws open and empty. Read from the store for the same
   * reason the bare bushes are: an emptied cache should stay emptied
   * across a reload
   */
  const [dug, setDug] = createSignal<Set<number>>(new Set());

  createEffect(() => {
    const loaded = view();

    if (loaded == null) {
      return;
    }

    let live = true;

    listPickedBerryPatches(loaded.snapshot)
      .then((cells) => {
        if (live) {
          setPicked(new Set(cells));
        }
      })
      .catch(() => {
        // A board that cannot say which bushes are bare draws them all
        // in fruit: pressing one costs a refusal, not a mistake
      });
    listClaimedItemCaches(loaded.snapshot)
      .then((cells) => {
        if (live) {
          setDug(new Set(cells));
        }
      })
      .catch(() => {
        // The same bargain the bushes make
      });
    onCleanup(() => {
      live = false;
    });
  });

  /**
   * What is going on at a cell, once what this player has already had
   * is taken out of it
   */
  const showing = (loaded: ChunkView, index: number): Phenomenon | undefined =>
    spent().has(index) ? undefined : loaded.snapshot.getPhenomena().get(index);

  /**
   * Everything still going on, as the canvas draws it
   */
  const happenings = (loaded: ChunkView): Map<number, Phenomenon> => {
    const live = new Map(loaded.snapshot.getPhenomena());

    for (const taken of spent()) {
      live.delete(taken);
    }
    return live;
  };

  const cross = (deltaX: number, deltaY: number): void => {
    const standing = view();

    if (standing == null) {
      // Nothing is drawn yet, so there is nothing to carry off — which
      // is the first chunk of a session and nothing else
      return;
    }
    setFrozen({ view: standing, player: cell() });
    setGone(false);
    setCrossing({ dx: deltaX, dy: deltaY, phase: 'out' });
  };

  // The clock: each half of a crossing lasts as long as it lasts, and
  // the out half has a floor under it — a window that never arrives
  // must not leave a player looking at a chunk they walked out of
  createEffect(() => {
    const step = crossing();

    if (step == null) {
      return;
    }

    const ending = setTimeout(
      () => {
        if (step.phase === 'out') {
          setGone(true);
        } else {
          setCrossing(null);
        }
      },
      step.phase === 'out' ? CROSSING_OUT : CROSSING_IN,
    );
    const stalled =
      step.phase === 'out'
        ? setTimeout(() => {
            setFrozen(null);
            setCrossing(null);
          }, CROSSING_LIMIT)
        : null;

    onCleanup(() => {
      clearTimeout(ending);
      if (stalled != null) {
        clearTimeout(stalled);
      }
    });
  });

  // ...and the turn: the old board is off the screen and the new one
  // has arrived, so it is let go of and brought on from the far side
  createEffect(() => {
    const step = crossing();

    if (step?.phase !== 'out' || !gone() || view() == null) {
      return;
    }
    setFrozen(null);
    setCrossing({ ...step, phase: 'in' });
  });

  // Where they are, said at the top of the menu. The menu is a sibling
  // of the world rather than a child of it, so the words are published
  // upwards and cleared on the way out — a battle takes the page, and
  // the place under it is not where the player is standing any more
  createEffect(() => {
    // What is drawn rather than where they are standing: while a
    // boundary is being crossed those differ for a moment, and the
    // words under a picture should be about the picture
    const standing = shown();

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
                    ? 'It is gone. Somebody beat you to it, or the window turned over.'
                    : 'Yours now. Walk it warm and see what hatches.',
              },
        );

        if (catchId != null) {
          // A new record, under whatever list is showing behind this
          game.touchRecords();
        }
        // A grotto that has been opened is spent for this player,
        // whichever way the answer went: the cell stops being drawn
        if (offer.from === 'grotto') {
          setSpent((cells) => new Set(cells).add(offer.cell));
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

    // Leaving the chunk: hold on to what is drawn, so the board can be
    // carried off the screen rather than taken off it
    if (chunk !== chunkX() || row !== chunkY()) {
      cross(deltaX, deltaY);
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
  const meet = async (user: PlayerIdentity, encounter: EncounterRecord): Promise<string | null> => {
    if (await isEncounterRetired(user.uid, encounter)) {
      // Either it ran off or it is already in the bag; from the cell's
      // side those are the same thing — nobody is standing there
      return 'Nothing here. This one is done with you.';
    }
    setSession(await createSafariSession(user, encounter));
    return null;
  };

  const interact = async (
    loaded: ChunkView,
    user: PlayerIdentity,
    at: number,
  ): Promise<string | null> => {
    const spawn = loaded.spawns.get(at);

    if (spawn != null) {
      // The server decides what is standing there: a spawn from a
      // window that has turned over is no longer met
      const encounter = await startEncounter(loaded.snapshot, spawn.id);

      return encounter == null ? 'Too late. The chunk has moved on.' : meet(user, encounter);
    }

    const landmark = loaded.landmarks.get(at);

    if (landmark === Landmark.ItemCache) {
      const stash = await claimItemCache(loaded.snapshot, at);

      // Empty either way: the stash was already carried off, or this
      // press carried it off
      setDug((cells) => new Set(cells).add(at));
      // What came out of the ground is put in front of them rather
      // than said under the map: a player pressing a cell is looking
      // at the cell
      announce('Picked clean. Come back next window.', stash);
      return null;
    }
    if (landmark === Landmark.BerryPatch) {
      const berries = await claimBerryPatch(loaded.snapshot, at);

      // Bare either way: the bush was already stripped, or this press
      // stripped it
      setPicked((cells) => new Set(cells).add(at));
      announce('Bare bushes. Come back next window.', berries == null ? null : [berries]);
      return null;
    }
    // The landmarks somebody fights at share one flow: Team Rocket's
    // ambush, the trainer's duel, and the experts' ladder, all put in
    // the challenge dialog rather than the wanderer's
    if (landmark != null && FIGHT_LANDMARKS.has(landmark)) {
      const grunt = landmark === Landmark.TeamRocket;
      const staged = challengerOf(loaded.snapshot, landmark, at);
      const who = staged?.name ?? 'Team Rocket';
      const stop = await enterRocketStop(loaded.snapshot, at);

      if (stop === 'locked') {
        return landmark === Landmark.EliteFour
          ? `${who} only faces challengers holding all 8 Kanto badges.`
          : `${who} only faces challengers who have beaten the Elite Four.`;
      }
      if (stop === 'beaten') {
        // A beaten grunt may still owe the pokemon they left:
        // claiming again pays nothing and hands it back until it is
        // caught. Everybody else owed only the purse
        const owed = grunt
          ? await claimRocketReward(
              rocketStopId(
                loaded.snapshot.chunk,
                loaded.snapshot.npcTimestamp,
                at,
                loaded.snapshot.offset,
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
        askForWindow(true);
        return 'Nobody is standing there any more.';
      }
      if (!(await canJoinRaids(user.uid))) {
        return `${who} wants a battle, and you have nothing to fight with.`;
      }
      // The challenge is put to the player rather than taken for
      // them; the dialog is what accepts it
      setChallengerNpc(grunt ? Npc.RocketGrunt : Npc.Trainer);
      setChallenger(staged);
      setChallengeCoat(loaded.snapshot.getWandererCoats().get(at));
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
      const standing = await enterGymSeat(loaded.snapshot, at);

      if (standing === 'absent') {
        // The board is behind the world: the seat is a fixture, so
        // this is a stale chunk rather than a seat that moved
        askForWindow(true);
        return 'There is no seat there any more.';
      }
      setSeat([at, standing]);
      return null;
    }
    // The wandering cell and the market stall open the same counter:
    // who is standing there is the snapshot's answer either way
    if (landmark === Landmark.WanderingNpc || landmark === Landmark.Market) {
      const standing = loaded.snapshot.getStandingNpc(at);

      if (standing == null) {
        return 'Nobody is passing through right now.';
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
    const happening = showing(loaded, at);

    if (happening != null) {
      const showingKind = happening;
      // The grotto's egg is the one thing here that is asked about
      // first; an item and a pokemon are walked into as they always
      // were, and neither is worth a question
      const hidden = await peekPhenomenonEgg(loaded.snapshot, at);

      if (hidden != null) {
        setEggOffer({ cell: at, from: 'grotto', state: stateOf(hidden), message: null });
        return null;
      }

      const claim = await claimPhenomenon(loaded.snapshot, at);

      // Taken, or already had, or the hour turned over under them.
      // Every one of those leaves the cell spent for this player, so
      // it stops being drawn rather than standing there to be pressed
      // again for nothing
      setSpent((cells) => new Set(cells).add(at));

      if (claim == null) {
        return `${PHENOMENON_NAMES[showingKind]}, and nothing under it now.`;
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
        return 'An egg, tucked away in the grotto. Walk it warm.';
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
          ? 'The lair is quiet. Nothing has come out this window.'
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
   * Whether the cell holds anything to interact with: a landmark, a
   * spawn, or something going on there. Empty ground is not.
   *
   * The happenings have to be asked about separately now that they
   * are not landmarks. Left out, a press on a dust cloud walks the
   * player onto it and does nothing — the reach that triggers it is
   * only taken for a cell that holds something
   */
  const holdsSomething = (loaded: ChunkView | null, index: number): boolean =>
    loaded != null &&
    (loaded.spawns.has(index) || loaded.landmarks.has(index) || showing(loaded, index) != null);

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
  const arrived = (plan: Journey): boolean =>
    plan.act ? withinReach(plan.goal) : cell() === plan.goal;

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
  const stride = (): void => {
    const plan = journey();
    const loaded = view();

    if (plan == null || loaded == null) {
      return;
    }

    if (arrived(plan)) {
      setJourney(null);
      if (plan.act) {
        reach(plan.goal);
      } else if (plan.exit != null) {
        move(plan.exit[0], plan.exit[1]);
      }
      return;
    }

    const here = cell();
    // The chunk's fixtures stop a walk: a landmark is walked up to and
    // a tree is walked round, because both are standing there. A
    // pokemon is not — where one is this window is not a fact about
    // the ground, and a route that bent round every spawn made a busy
    // chunk feel like a maze
    // Solid rock stops a walk the way a fixture does
    const passable = (index: number): boolean =>
      !loaded.landmarks.has(index) && !loaded.decorations.has(index) && !loaded.rocks.has(index);
    // A goal nothing can stand on is walked up to instead of refused,
    // so a press on a boulder still takes the player over to it
    const route = plan.act
      ? findPathBeside(here, plan.goal, passable)
      : findPathNear(here, plan.goal, passable);
    const next = route?.[0];

    if (next == null) {
      setJourney(null);
      return;
    }
    steppedAt = Date.now();
    move(
      (next % CHUNK_CELLS) - (here % CHUNK_CELLS),
      Math.floor(next / CHUNK_CELLS) - Math.floor(here / CHUNK_CELLS),
    );
  };

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

  // A walk belongs to the chunk it was started in: its goal is a cell
  // number, and cell 42 of the chunk next door is somewhere else
  // entirely. Crossing a boundary — on foot, or through a portal —
  // ends it
  createEffect(() => {
    chunkX();
    chunkY();
    setJourney(null);
  });

  /**
   * A square the player has asked to be at.
   *
   * Three things it can be. Something they are already standing beside
   * is reached for where they stand; anything else worth pressing is
   * walked up to and then reached for; a threshold is walked to and
   * stepped over, into the chunk beyond
   */
  const press = (target: BoardCell): void => {
    const loaded = view();

    if (loaded == null) {
      return;
    }

    const exit = borderExit(target);

    if (exit != null) {
      setJourney({ goal: exit.cell, exit: exit.step, act: false });
      return;
    }

    const index = chunkCellOf(target);

    if (index == null) {
      return;
    }
    if (holdsSomething(loaded, index)) {
      setJourney(null);

      if (withinReach(index)) {
        reach(index);
      } else {
        setJourney({ goal: index, exit: null, act: true });
      }
      return;
    }
    // Scenery is not a thing to reach for, but it is still somewhere
    // to head: the walk stops on the nearest cell that can be stood on
    setJourney(index === cell() ? null : { goal: index, exit: null, act: false });
  };

  const titleOf = (index: number): string => {
    // The board on screen rather than the one they are standing in:
    // a cell is named for what is drawn on it
    const loaded = shown();
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
    if (landmark === Landmark.WanderingNpc) {
      const standing = loaded?.snapshot.getWanderingNpcs().get(index);

      return standing == null ? LANDMARK_NAMES[landmark] : NPC_NAMES[standing];
    }
    // A stall is named for the counter it set up this window, so a
    // player short of vitamins can see which one to walk to
    if (landmark === Landmark.Market) {
      const counter = loaded?.snapshot.getVendorKind(index);

      return counter == null ? LANDMARK_NAMES[landmark] : VENDOR_KIND_NAMES[counter];
    }
    // The boss is named when he is actually standing there: 1/64 is
    // worth crossing the chunk for
    if (landmark === Landmark.TeamRocket && loaded?.snapshot.isRocketBoss(index) === true) {
      return 'Giovanni';
    }
    // The experts are named outright: which leader keeps this gym is
    // what decides whether the walk is worth it
    if (landmark === Landmark.GymLeader) {
      const leader = loaded?.snapshot.getGymLeader(index);

      return leader == null ? LANDMARK_NAMES[landmark] : GYM_LEADER_NAMES[leader];
    }
    if (landmark === Landmark.EliteFour) {
      const member = loaded?.snapshot.getEliteMember(index);

      return member == null ? LANDMARK_NAMES[landmark] : ELITE_MEMBER_NAMES[member];
    }
    if (landmark === Landmark.Champion) {
      return CHAMPION_NAME;
    }
    return LANDMARK_NAMES[landmark];
  };

  return (
    <div class="relative h-full w-full">
      <Show
        // What is drawn, which is the board being carried off while one
        // is: the live view is null for a round trip after a boundary
        // is crossed, and taking the world off the screen for that is
        // the flash this holds it up to avoid
        when={shown()}
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
                not, so there is always country around it — left grey
                it read as a picture of a world on a page, rather than
                as being somewhere.

                Edge to edge, with nothing laid out around it: the
                canvas is the whole of this, and where the board sits
                inside it is the projection's business rather than the
                page's */}
            <div
              class="absolute inset-0 transition-colors"
              style={{ 'background-color': BIOME_COLORS[loaded().biome] }}
            >
              <ChunkCanvas
                biome={loaded().biome}
                weather={loaded().weather}
                charset={charset()}
                // The camera belongs to the player rather than to the
                // chunk: walking over a boundary swaps the board out
                // and a camera living down there would face front
                // again every time
                yaw={yaw()}
                // How far north or south the chunk is, which is the
                // one thing about the light that is the world's rather
                // than the clock's
                latitude={latitudeOf(loaded().y)}
                onTurn={(turned) => {
                  setYaw(turned);
                }}
                caption={naming(loaded())}
                // Held with the board while one is being carried off:
                // they are standing in the next chunk by then, and
                // their marker has no business on this one
                player={frozen()?.player ?? cell()}
                crossing={crossing()}
                landmarks={loaded().landmarks}
                phenomena={happenings(loaded())}
                spots={loaded().spots}
                shallows={loaded().shallows}
                rocks={loaded().rocks}
                wanderers={loaded().snapshot.getWanderingNpcs()}
                coats={loaded().snapshot.getWandererCoats()}
                // What is on each bush this window, which is what
                // decides the plant drawn on the patch. The snapshot's
                // own map rather than one built here: a prop is a
                // getter, and the draw loop reads this once a cell a
                // frame
                berries={loaded().snapshot.getBerryPatches()}
                picked={picked()}
                dug={dug()}
                decorations={loaded().decorations}
                spawns={
                  new Map(
                    [...loaded().spawns].map(([at, standing]) => [
                      at,
                      { species: standing.spawn[0], shiny: standing.shiny },
                    ]),
                  )
                }
                label={titleOf}
                onPress={press}
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
                // Worst case it is drawn until the window turns over
                props.onFled();
              }}
              onClose={() => {
                setSession(null);
                // A meeting that ended in a flight leaves the chunk
                // with one fewer pokemon in it for this player
                // Worst case the spawn is drawn until the window turns
                // over, and interacting with it says it has already fled
                props.onFled();
              }}
            />
            <RocketStopDialog
              user={user()}
              challenge={challenge()}
              npc={challengerNpc()}
              sheet={challengeCoat()}
              challenger={challenger()}
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
            <GymSeatDialog
              user={user()}
              snapshot={view()?.snapshot ?? null}
              cell={seat()?.[0] ?? null}
              standing={seat()?.[1] ?? null}
              onClose={() => {
                setSeat(null);
              }}
              onChange={() => {
                // The seat moved under the dialog, so what it is
                // showing is re-read rather than guessed at
                const standing = seat();
                const loaded = view();

                if (standing != null && loaded != null) {
                  enterGymSeat(loaded.snapshot, standing[0])
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
                  `Through to ${BIOME_NAMES[destination.biome]}. Chunk ${destination.x}, ${destination.y}.`,
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
