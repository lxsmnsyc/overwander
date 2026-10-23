import { enterGymSeat } from '../../auth/gym-seats';
import { RaidAction, type RaidView, canJoinRaids, getRaidKindAt, peekRaid } from '../../auth/raids';
import { createSafariSession, isEncounterRetired } from '../../auth/safari';
import {
  claimApricornTree,
  claimBerryPatch,
  claimItemCache,
  claimNest,
  claimPhenomenon,
  peekNest,
  peekPhenomenonEgg,
  startEncounter,
} from '../../auth/snapshots';
import { claimStopReward, enterStop } from '../../auth/stops';
import type { PlayerIdentity } from '../../auth/user';
import type { ItemStack } from '../../data/overworld/item-pool';
import Landmark from '../../data/overworld/landmark';
import Npc from '../../data/overworld/npc';
import type Phenomenon from '../../data/overworld/phenomenon';
import { PHENOMENON_NAMES } from '../../data/overworld/phenomenon';
import type { EncounterRecord } from '../../model/encounter-record';
import type { GymSeatStanding } from '../../model/gym-seat-record';
import { type StopRecord, stopIdOf } from '../../model/stop-record';
import { throughMouth } from '../../overworld/cave';
import { CHUNK_CELLS, worldCell } from '../../overworld/chunk';
import getWorld from '../../overworld/current';
import { Depth } from '../../overworld/depth';
import type SafariSession from '../../overworld/safari';
import type { ActiveBattle } from '../session/types';
import { GameDialog } from '../session/types';
import { type Store, type WritableStore, createStore } from '../store';
import { BOARD_CELLS, BOARD_CENTER, FIGHT_LANDMARKS, HARVEST_LANDMARKS } from './board-metrics';
import type { BoardView, Placed } from './board-view';
import challengerOf, {
  type StopChallenge,
  championGate,
  eliteGate,
  frontierGate,
} from './challengers';
import { type EggSource, type EggState, stateOf } from './journey';
import type { BoardWalk } from './walk';
import type { BoardWindows } from './windows';

/** An egg the player has been offered, and where */
export interface EggOffer {
  /** Where the egg is, in the words the server knows the cell by */
  spot: Placed;
  /** And where it is on the board, which is where the answer is shown */
  cell: number;
  from: EggSource;
  state: EggState;
}

/** A challenge the player walked into: the stop, who put it and how they look */
export interface Challenge {
  stop: [string, StopRecord];
  npc: Npc;
  coat: string | undefined;
  /** Who is named; null for a syndicate grunt, whom the dialog names itself */
  challenger: StopChallenge | null;
}

export interface InteractDeps {
  user: () => PlayerIdentity | null;
  walk: BoardWalk<BoardView>;
  windows: BoardWindows;
  /** The session around the board */
  setEncounter: (encounter: EncounterRecord | null) => void;
  setDialog: (dialog: GameDialog) => void;
  setBattle: (battle: ActiveBattle) => void;
  setRaid: (raid: string) => void;
  touchRecords: () => void;
  /** Said in passing, over the world */
  remark: (message: string, tone?: 'neutral' | 'leaf' | 'ember') => void;
  /** What a landmark paid out, said over the cell it came from */
  announce: (at: number, empty: string, items: ItemStack[] | null) => void;
  /** An offered egg taken or missed */
  tookEgg: (taken: boolean) => void;
}

/** What the interactions read of the board, handed over once the board has it */
export interface InteractBoard {
  view: () => BoardView | null;
  /** Hear out whoever stands at a cell; the conversation is the interface's */
  talk: (spot: Placed, npc: Npc, player: string) => void;
  /** Something changed that the landmark glow reads */
  recheck: () => void;
}

/**
 * What pressing a cell does, and the one thing at a time it can open
 * over the board: a meeting, a challenge, a passer-by, a portal, a
 * honey tree, a gym seat, a lair or an egg
 */
export interface BoardInteractions {
  /** Hand over the board in view; until then nothing can be reached */
  attach: (board: InteractBoard) => void;
  session: WritableStore<SafariSession<EncounterRecord> | null>;
  /** Whether the meeting on screen happens once, so no overlay press may throw it away */
  once: Store<boolean>;
  /** An interaction in flight, so a second press does not open the same thing twice */
  busy: Store<boolean>;
  challenge: WritableStore<Challenge | null>;
  wanderer: WritableStore<[Placed, Npc] | null>;
  portal: WritableStore<Placed | null>;
  honeyTree: WritableStore<Placed | null>;
  seat: WritableStore<[Placed, GymSeatStanding] | null>;
  lair: WritableStore<[Placed, RaidView | null] | null>;
  /** What the lair dialog says when nothing stands in it */
  lairReason: Store<string | null>;
  eggOffer: WritableStore<EggOffer | null>;
  taking: WritableStore<boolean>;
  /** Cells whose claim is still with the server, by world cell */
  claiming: Store<Set<string>>;
  /** Whether something is open over the board, which refuses a press */
  engaged: () => boolean;
  /** What is going on at a cell, once what this player already had is taken out */
  showing: (view: BoardView, index: number) => Phenomenon | undefined;
  holdsSomething: (view: BoardView | null, index: number) => boolean;
  /** The 3x3 the player stands in the middle of */
  withinReach: (index: number) => boolean;
  /** Reach for a cell the player stands beside */
  reach: (index: number) => void;
  takeEgg: () => void;
  /** Meet a pokemon; `metOnce` for one there is no walking back to */
  meet: (
    user: PlayerIdentity,
    encounter: EncounterRecord,
    metOnce?: boolean,
  ) => Promise<string | null>;
  /** Put a pokemon a fight left waiting in front of the player */
  meetWaiting: (encounter: EncounterRecord) => void;
}

export default function createBoardInteractions(deps: InteractDeps): BoardInteractions {
  const { walk, windows } = deps;
  let board: InteractBoard | null = null;
  const view = (): BoardView | null => board?.view() ?? null;

  const session = createStore<SafariSession<EncounterRecord> | null>(null);
  const once = createStore(false);
  const busy = createStore(false);
  const challenge = createStore<Challenge | null>(null);
  const wanderer = createStore<[Placed, Npc] | null>(null);
  const portal = createStore<Placed | null>(null);
  const honeyTree = createStore<Placed | null>(null);
  const seat = createStore<[Placed, GymSeatStanding] | null>(null);
  const lair = createStore<[Placed, RaidView | null] | null>(null);
  const lairReason = createStore<string | null>(null);
  const eggOffer = createStore<EggOffer | null>(null);
  const taking = createStore(false);
  const claiming = createStore<Set<string>>(new Set());

  /** A board cell said as the world cell it sits on, which does not move as the player walks */
  const keyOf = (index: number): string =>
    [
      walk.x.get() - BOARD_CENTER + (index % BOARD_CELLS),
      walk.y.get() - BOARD_CENTER + Math.floor(index / BOARD_CELLS),
    ].join(',');

  /** The same key for a cell already resolved to its chunk's window */
  const keyAt = (spot: Placed): string =>
    [
      worldCell(spot.snapshot.chunk.x, spot.cell % CHUNK_CELLS),
      worldCell(spot.snapshot.chunk.y, Math.floor(spot.cell / CHUNK_CELLS)),
    ].join(',');

  /** Mark a cell the player has had, which also makes a remembered claim list wrong */
  const taken = (into: WritableStore<Set<string>>, spot: Placed): void => {
    into.update((cells) => new Set(cells).add(keyAt(spot)));
    windows.forgetClaims();
  };

  const engaged = (): boolean =>
    session.get() != null ||
    challenge.get() != null ||
    wanderer.get() != null ||
    portal.get() != null ||
    seat.get() != null ||
    lair.get() != null ||
    eggOffer.get() != null;

  const showing = (loaded: BoardView, index: number): Phenomenon | undefined =>
    windows.spent.get().has(keyOf(index)) ? undefined : loaded.phenomena.get(index);

  /**
   * Whether the cell holds anything to interact with: a landmark, a
   * spawn, or something going on there. The happenings are asked about
   * apart, or a press on a dust cloud would walk onto it and do nothing
   */
  const holdsSomething = (loaded: BoardView | null, index: number): boolean =>
    loaded != null &&
    !claiming.get().has(keyOf(index)) &&
    (loaded.spawns.has(index) || loaded.landmarks.has(index) || showing(loaded, index) != null);

  /** Whether pressing the cell spends it on the spot, rather than opening something */
  const paysOnPress = (loaded: BoardView, index: number): boolean => {
    const landmark = loaded.landmarks.get(index);

    return (landmark != null && HARVEST_LANDMARKS.has(landmark)) || showing(loaded, index) != null;
  };

  /**
   * Whether the player can reach the cell from where they stand.
   * Walking onto something is not how it is triggered: a player steps
   * up beside it and reaches out, so passing through never springs it
   */
  const withinReach = (index: number): boolean =>
    Math.abs((index % BOARD_CELLS) - BOARD_CENTER) <= 1 &&
    Math.abs(Math.floor(index / BOARD_CELLS) - BOARD_CENTER) <= 1;

  /**
   * Held shut while its claim is with the server: nothing opens over
   * the board to stop a second press, so a mashed cell is claimed once
   */
  const holdCell = (index: number, held: boolean): void => {
    const spot = keyOf(index);

    claiming.update((cells) => {
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
   * Meet a spawn (or a grotto's pokemon). `metOnce` is for meetings
   * there is no walking back to, which the dialog's own buttons close
   */
  const meet = async (
    user: PlayerIdentity,
    encounter: EncounterRecord,
    metOnce = false,
  ): Promise<string | null> => {
    if (await isEncounterRetired(user.uid, encounter)) {
      // Ran off or already in the bag: either way nobody is standing there
      return 'Nothing here. This one is done with you.';
    }
    once.set(metOnce);
    session.set(await createSafariSession(user, encounter));
    return null;
  };

  /** The fighting landmarks, which all go through the one challenge flow */
  const challengeAt = async (
    loaded: BoardView,
    user: PlayerIdentity,
    spot: Placed,
    at: number,
    landmark: Landmark,
  ): Promise<string | null> => {
    const grunt = landmark === Landmark.TeamRocket;
    const staged = challengerOf(spot.snapshot, landmark, spot.cell);
    const who = staged?.name ?? 'Team Rocket';
    const stop = await enterStop(spot.snapshot, spot.cell);

    if (stop === 'locked') {
      // The ladder's three gates, each named by whoever stands there
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
      // A beaten grunt may still owe the pokemon they left; everybody
      // else owed only the purse
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
        deps.setEncounter(owed.encounter);
        return null;
      }
      return grunt ? 'They have moved on.' : `${who} is done with you this window.`;
    }
    if (stop == null) {
      // Nobody staged there: the board is behind the world, so it asks again
      windows.askForWindow(true, true);
      return 'Nobody is standing there any more.';
    }
    if (!(await canJoinRaids(user.uid))) {
      return `${who} wants a battle, and you have nothing to fight with.`;
    }
    // Put to the player rather than taken for them; the dialog accepts it
    challenge.set({
      stop,
      npc: grunt ? Npc.RocketGrunt : Npc.Trainer,
      coat: spot.snapshot.getWandererCoats().get(spot.cell),
      challenger: staged,
    });
    return null;
  };

  /** A happening walked into: an egg is asked about first, anything else is had there and then */
  const happeningAt = async (
    user: PlayerIdentity,
    spot: Placed,
    at: number,
    kind: Phenomenon,
  ): Promise<string | null> => {
    const hidden = await peekPhenomenonEgg(spot.snapshot, spot.cell);

    if (hidden != null) {
      eggOffer.set({ spot, cell: at, from: 'grotto', state: stateOf(hidden) });
      return null;
    }

    const claim = await claimPhenomenon(spot.snapshot, spot.cell);

    // Taken, already had, or the hour turned over: the cell is spent for this player either way
    taken(windows.spent, spot);

    if (claim == null) {
      return `${PHENOMENON_NAMES[kind]}, and nothing under it now.`;
    }
    if (claim.kind === 'item') {
      deps.announce(at, 'Nothing was left behind.', claim.items);
      return null;
    }
    if (claim.kind === 'egg') {
      // An egg is peeked at above, unless the hour turned over between the two calls
      return 'An egg, tucked away in the grotto. Walk it warm.';
    }
    return meet(user, claim.encounter, true);
  };

  /** A lair, looked at rather than walked into: nothing is staged until the dialog says so */
  const lairAt = async (user: PlayerIdentity, spot: Placed): Promise<string | null> => {
    const kind = getRaidKindAt(spot.snapshot, spot.cell);

    if (kind == null) {
      return null;
    }

    const standing = await peekRaid(spot.snapshot, spot.cell, kind);

    // A fight they fielded a party in is theirs again rather than a replay
    if (standing?.action === RaidAction.Rejoin && standing.battle != null) {
      deps.setBattle({ id: standing.battle, replay: false, raid: standing.lobby });
      return null;
    }
    // Their own lobby walked back into goes straight through: a host has already decided
    if (standing?.hosting === true && standing.action !== RaidAction.Host) {
      if (standing.battle != null) {
        deps.setBattle({ id: standing.battle, replay: true });
        return null;
      }
      deps.setRaid(standing.lobby);
      deps.setDialog(GameDialog.Raids);
      return null;
    }
    lairReason.set(
      standing != null || (await canJoinRaids(user.uid))
        ? 'The lair is quiet. Nothing has come out this window.'
        : 'You need a pokemon of your own to raid. You can watch one already under way.',
    );
    lair.set([spot, standing]);
    return null;
  };

  const interact = async (
    loaded: BoardView,
    user: PlayerIdentity,
    at: number,
  ): Promise<string | null> => {
    // The board straddles chunks, so two neighbouring cells can be two windows' business
    const spot = loaded.at(at);

    if (spot == null) {
      return 'That is not loaded yet.';
    }

    const spawn = loaded.spawns.get(at);

    if (spawn != null) {
      // The server decides what stands there: a turned-over window's spawn is not met
      const encounter = await startEncounter(spot.snapshot, spawn.id);

      return encounter == null ? 'Too late. The chunk has moved on.' : meet(user, encounter);
    }

    const landmark = loaded.landmarks.get(at);

    if (landmark === Landmark.ItemCache) {
      const stash = await claimItemCache(spot.snapshot, spot.cell);

      // Empty either way: carried off before, or by this press
      taken(windows.dug, spot);
      deps.announce(at, 'Picked clean. Come back next window.', stash);
      return null;
    }
    if (landmark === Landmark.BerryPatch) {
      const berries = await claimBerryPatch(spot.snapshot, spot.cell);

      taken(windows.picked, spot);
      deps.announce(at, 'Bare bushes. Come back next window.', berries == null ? null : [berries]);
      return null;
    }
    if (landmark === Landmark.ApricornTree) {
      const apricorns = await claimApricornTree(spot.snapshot, spot.cell);

      taken(windows.picked, spot);
      deps.announce(
        at,
        'Picked bare. Come back next window.',
        apricorns == null ? null : [apricorns],
      );
      return null;
    }
    if (landmark != null && FIGHT_LANDMARKS.has(landmark)) {
      return challengeAt(loaded, user, spot, at, landmark);
    }
    // What it shows is the region's whole market, so walking to one is the cost of trading
    if (landmark === Landmark.AuctionBoard) {
      deps.setDialog(GameDialog.Auctions);
      return null;
    }
    if (landmark === Landmark.GymSeat) {
      const standing = await enterGymSeat(spot.snapshot, spot.cell);

      if (standing === 'absent') {
        // A seat is a fixture, so this is a stale chunk rather than a seat that moved
        windows.askForWindow(true, true);
        return 'There is no seat there any more.';
      }
      seat.set([spot, standing]);
      return null;
    }
    // The wandering cell, the market stall and the centre open the same counter
    if (
      landmark === Landmark.WanderingNpc ||
      landmark === Landmark.Market ||
      landmark === Landmark.PokemonCenter
    ) {
      const standing = spot.snapshot.getStandingNpc(spot.cell);

      if (standing == null) {
        return 'Nobody is passing through right now.';
      }
      board?.talk(spot, standing, user.uid);
      return null;
    }
    if (landmark === Landmark.Nest) {
      // Looked into rather than emptied: a buddy carries one egg, so a
      // second is a decision about the first, and a bare nest still answers
      const offer = await peekNest(spot.snapshot, spot.cell);

      eggOffer.set({
        spot,
        cell: at,
        from: 'nest',
        state: offer == null ? 'bare' : stateOf(offer),
      });
      return null;
    }

    const happening = showing(loaded, at);

    if (happening != null) {
      return happeningAt(user, spot, at, happening);
    }
    if (landmark === Landmark.HoneyTree) {
      honeyTree.set(spot);
      return null;
    }
    if (landmark === Landmark.CaveMouth) {
      const through = throughMouth(
        getWorld(walk.depth.get()),
        spot.snapshot.chunk.x,
        spot.snapshot.chunk.y,
      );

      if (through == null) {
        // A mouth is cut into the ground rather than rolled, so this is a stale chunk
        windows.askForWindow(true, true);
        return 'There is no way through there any more.';
      }

      const going = walk.depth.get() === Depth.Cave ? Depth.Surface : Depth.Cave;
      const chunk = spot.snapshot.chunk;

      // One cell, not a crossing: a mouth joins the two cells it sits between
      walk.standAt(
        worldCell(chunk.x, through % CHUNK_CELLS),
        worldCell(chunk.y, Math.floor(through / CHUNK_CELLS)),
        going,
      );
      walk.settle();
      deps.remark(going === Depth.Cave ? 'Into the dark.' : 'Back out into the light.');
      return null;
    }
    if (landmark === Landmark.Portal) {
      // Where it goes is derived in the dialog; the key is what the server is for
      portal.set(spot);
      return null;
    }
    return lairAt(user, spot);
  };

  const reach = (index: number): void => {
    // Reaching for something is when it matters most whether the chunk still holds it
    windows.askForWindow();

    const loaded = view();
    const user = deps.user();

    if (loaded == null || user == null || busy.get() || engaged() || !withinReach(index)) {
      return;
    }
    busy.set(true);

    const spends = paysOnPress(loaded, index);

    if (spends) {
      holdCell(index, true);
    }
    // Whatever the cell had to say is said in passing, since none of it is a question
    interact(loaded, user, index)
      .then((said) => {
        if (said != null) {
          deps.remark(said);
        }
      })
      .catch((caught: unknown) => {
        deps.remark(caught instanceof Error ? caught.message : String(caught), 'ember');
      })
      .finally(() => {
        busy.set(false);
        if (spends) {
          holdCell(index, false);
        }
      });
  };

  /**
   * Take the offered egg. The peek wrote nothing, so this is still the
   * first and only write, and a second player at the same nest is unaffected
   */
  const takeEgg = (): void => {
    const offer = eggOffer.get();

    if (offer == null || taking.get()) {
      return;
    }
    taking.set(true);
    (offer.from === 'nest'
      ? claimNest(offer.spot.snapshot, offer.spot.cell)
      : claimPhenomenon(offer.spot.snapshot, offer.spot.cell).then((claim) =>
          claim?.kind === 'egg' ? claim.catchId : null,
        )
    )
      .then((catchId) => {
        taking.set(false);
        eggOffer.set(null);
        deps.tookEgg(catchId != null);
        if (catchId != null) {
          // A new record, under whatever list is showing behind this
          deps.touchRecords();
        }
        // An opened grotto is spent for this player whichever way it went; a nest's ring goes
        if (offer.from === 'grotto') {
          taken(windows.spent, offer.spot);
        } else {
          board?.recheck();
        }
      })
      .catch((caught: unknown) => {
        taking.set(false);
        deps.remark(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  return {
    attach: (attached) => {
      board = attached;
    },
    session,
    once,
    busy,
    challenge,
    wanderer,
    portal,
    honeyTree,
    seat,
    lair,
    lairReason,
    eggOffer,
    taking,
    claiming,
    engaged,
    showing,
    holdsSomething,
    withinReach,
    reach,
    takeEgg,
    meet,
    meetWaiting: (encounter) => {
      const user = deps.user();

      if (user == null) {
        return;
      }
      once.set(true);
      createSafariSession(user, encounter)
        .then((opened) => {
          session.set(opened);
        })
        .catch((caught: unknown) => {
          deps.remark(caught instanceof Error ? caught.message : String(caught), 'ember');
        });
    },
  };
}
