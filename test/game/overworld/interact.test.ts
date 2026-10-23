import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/auth/snapshots', () => ({
  claimBerryPatch: vi.fn().mockResolvedValue({ item: 1, amount: 2 }),
  claimItemCache: vi.fn().mockResolvedValue(null),
  claimApricornTree: vi.fn().mockResolvedValue(null),
  claimNest: vi.fn().mockResolvedValue('egg-1'),
  claimPhenomenon: vi.fn().mockResolvedValue(null),
  peekNest: vi.fn().mockResolvedValue({ taken: false }),
  peekPhenomenonEgg: vi.fn().mockResolvedValue(null),
  startEncounter: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../../src/auth/stops', () => ({
  enterStop: vi.fn().mockResolvedValue(null),
  claimStopReward: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../../src/auth/gym-seats', () => ({ enterGymSeat: vi.fn() }));
vi.mock('../../../src/auth/raids', () => ({
  RaidAction: { Host: 0, Join: 1, Rejoin: 2 },
  canJoinRaids: vi.fn().mockResolvedValue(true),
  getRaidKindAt: () => null,
  peekRaid: vi.fn(),
}));
vi.mock('../../../src/game/overworld/challengers', () => ({
  default: () => null,
  championGate: () => '',
  eliteGate: () => '',
  frontierGate: () => '',
}));
vi.mock('../../../src/auth/safari', () => ({
  createSafariSession: vi.fn(),
  isEncounterRetired: vi.fn(),
}));

const { createStore } = await import('../../../src/game/store');
const { default: createBoardInteractions } = await import('../../../src/game/overworld/interact');
const { default: Landmark } = await import('../../../src/data/overworld/landmark');
const { BOARD_CELLS, PLAYER_CELL } = await import('../../../src/game/overworld/board-metrics');

const SNAPSHOT = { chunk: { x: 3, y: 4 } };

/** A board with one landmark beside the player */
function boardWith(landmark: number, at: number): unknown {
  return {
    at: (index: number) => (index === at ? { snapshot: SNAPSHOT, cell: 5 } : null),
    spawns: new Map(),
    landmarks: new Map([[at, landmark]]),
    phenomena: new Map(),
  };
}

function interactions(board: unknown): {
  acts: ReturnType<typeof createBoardInteractions>;
  said: string[];
  announced: string[];
  picked: ReturnType<typeof createStore<Set<string>>>;
} {
  const said: string[] = [];
  const announced: string[] = [];
  const picked = createStore<Set<string>>(new Set());
  const windowsStub = {
    spent: createStore<Set<string>>(new Set()),
    picked,
    dug: createStore<Set<string>>(new Set()),
    askForWindow: () => {},
    forgetClaims: () => {},
  };
  const acts = createBoardInteractions({
    user: () => ({ uid: 'me', email: null, displayName: null }),
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    walk: { x: createStore(100), y: createStore(100), depth: createStore(0) } as never,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    windows: windowsStub as never,
    setEncounter: () => {},
    setDialog: () => {},
    setBattle: () => {},
    setRaid: () => {},
    touchRecords: () => {},
    remark: (message) => {
      said.push(message);
    },
    announce: (_at, empty, items) => {
      announced.push(items == null ? empty : `${items.length} found`);
    },
    tookEgg: () => {},
  });

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  acts.attach({ view: () => board as never, talk: () => {}, recheck: () => {} });
  return { acts, said, announced, picked };
}

describe('createBoardInteractions', () => {
  it('reaches only the cells around the player', () => {
    expect(interactions(null).acts.withinReach(PLAYER_CELL + 1)).toBe(true);
    expect(interactions(null).acts.withinReach(PLAYER_CELL + 2)).toBe(false);
    expect(interactions(null).acts.withinReach(PLAYER_CELL + BOARD_CELLS * 2)).toBe(false);
  });

  it('strips a berry patch, says what it gave, and marks it picked', async () => {
    const at = PLAYER_CELL + 1;
    const { acts, announced, picked } = interactions(boardWith(Landmark.BerryPatch, at));

    acts.reach(at);
    expect(acts.busy.get()).toBe(true);
    await vi.waitFor(() => {
      expect(acts.busy.get()).toBe(false);
    });
    expect(announced).toEqual(['1 found']);
    expect(picked.get().size).toBe(1);
  });

  it('asks the world again when a stop has nobody standing at it', async () => {
    const at = PLAYER_CELL - 1;
    const { acts, said } = interactions(boardWith(Landmark.TeamRocket, at));

    acts.reach(at);
    await vi.waitFor(() => {
      expect(said).toEqual(['Nobody is standing there any more.']);
    });
    expect(acts.challenge.get()).toBeNull();
  });

  it('offers a nest egg rather than taking it, and refuses presses while it is open', async () => {
    const at = PLAYER_CELL + BOARD_CELLS;
    const { acts } = interactions(boardWith(Landmark.Nest, at));

    acts.reach(at);
    await vi.waitFor(() => {
      expect(acts.eggOffer.get()?.state).toBe('offered');
    });
    expect(acts.engaged()).toBe(true);
    acts.takeEgg();
    await vi.waitFor(() => {
      expect(acts.eggOffer.get()).toBeNull();
    });
  });
});
