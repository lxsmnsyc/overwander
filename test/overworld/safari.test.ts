import { describe, expect, it } from 'vitest';
import Biome from '../../src/data/ids/biome';
import { Balls, Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { registerSpecies } from '../../src/data/species';
import ChunkSnapshot from '../../src/overworld/chunk-snapshot';
import deriveEncounter, { type Encounter, EncounterType } from '../../src/overworld/encounter';
import { EventPriority } from '../../src/core/event-emitter';
import SafariSession, {
  SafariEvents,
  SafariState,
  ThrowResult,
  encounterKey,
} from '../../src/overworld/safari';
import World from '../../src/overworld/world';

registerSpecies();

const HOUR = 3_600_000;

// Tauros: catch rate 45, base speed 110, Normal type
function makeEncounter(species = Species.Tauros, type = EncounterType.Wild): Encounter {
  const world = new World('overworld');
  const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);

  return { ...deriveEncounter(snapshot, [species, 0, 0]), type };
}

const rolls = (values: number[]) => () => values.shift() ?? 0.999;

describe('safari session', () => {
  it('computes catch chance from rate, ball and feeding', () => {
    const session = new SafariSession(makeEncounter(), rolls([]));

    expect(session.getCatchChance()).toBeCloseTo(45 / 255);

    // Choosing a stronger ball scales the chance
    session.chooseBall(Balls.UltraBall);
    expect(session.getCatchChance()).toBeCloseTo((45 * 2) / 255);

    // Feeding a berry stacks a bonus; inedible items do nothing
    expect(session.feed(Items.OranBerry)).toBe(true);
    expect(session.getCatchChance()).toBeCloseTo((45 * 2 * 1.25) / 255);
    expect(session.feed(Items.FireStone)).toBe(false);
    expect(session.getCatchChance()).toBeCloseTo((45 * 2 * 1.25) / 255);
  });

  it('resolves Quick and Timer Balls by the safari clock', () => {
    const session = new SafariSession(makeEncounter(), rolls([0.99, 0.99]));

    // Quick Ball: 5x on the opening turn only
    session.chooseBall(Balls.QuickBall);
    expect(session.getCatchChance()).toBeCloseTo((45 * 5) / 255);

    // A failed throw consumes the opening turn
    expect(session.throwBall()).toBe(ThrowResult.BrokeFree);
    expect(session.getCatchChance()).toBeCloseTo(45 / 255);

    // Timer Ball: grows per elapsed turn
    session.chooseBall(Balls.TimerBall);
    expect(session.getCatchChance()).toBeCloseTo((45 * (1 + 1229 / 4096)) / 255);

    // Feeding also advances the clock (and stacks its own bonus)
    session.feed(Items.OranBerry);
    expect(session.getCatchChance()).toBeCloseTo((45 * (1 + (2 * 1229) / 4096) * 1.25) / 255);

    // The growth caps at 4x
    session.turn = 30;
    expect(session.getBallModifier()).toBe(4);
  });

  it('answers the Net Ball to Bug and Water types', () => {
    const bug = new SafariSession(makeEncounter(Species.Caterpie), rolls([]));
    const water = new SafariSession(makeEncounter(Species.Magikarp), rolls([]));
    const neither = new SafariSession(makeEncounter(), rolls([]));

    expect(bug.getBallModifier(Balls.NetBall)).toBe(3.5);
    expect(water.getBallModifier(Balls.NetBall)).toBe(3.5);
    expect(neither.getBallModifier(Balls.NetBall)).toBe(1);
  });

  it('gives the Dive Ball its edge in water biomes', () => {
    const land = new SafariSession(makeEncounter(), rolls([]));
    const sea = new SafariSession({ ...makeEncounter(), biome: Biome.Ocean }, rolls([]));
    const swamp = new SafariSession({ ...makeEncounter(), biome: Biome.Swamp }, rolls([]));
    // The shoreline is not water itself
    const beach = new SafariSession({ ...makeEncounter(), biome: Biome.Beach }, rolls([]));

    expect(land.getBallModifier(Balls.DiveBall)).toBe(1);
    expect(sea.getBallModifier(Balls.DiveBall)).toBe(3.5);
    expect(swamp.getBallModifier(Balls.DiveBall)).toBe(3.5);
    expect(beach.getBallModifier(Balls.DiveBall)).toBe(1);
  });

  it('scales the Nest Ball by level and the Repeat Ball by ownership', () => {
    const weak = new SafariSession({ ...makeEncounter(), level: 5 }, rolls([]));
    const middling = new SafariSession({ ...makeEncounter(), level: 21 }, rolls([]));
    const strong = new SafariSession({ ...makeEncounter(), level: 60 }, rolls([]));

    // (41 - level) / 10, capped at 4 and never below a plain ball
    expect(weak.getBallModifier(Balls.NestBall)).toBe(3.6);
    expect(middling.getBallModifier(Balls.NestBall)).toBeCloseTo(2);
    expect(strong.getBallModifier(Balls.NestBall)).toBe(1);

    // The Repeat Ball only knows what the session was told
    expect(new SafariSession(makeEncounter(), rolls([])).getBallModifier(Balls.RepeatBall)).toBe(1);
    expect(
      new SafariSession(makeEncounter(), rolls([]), {
        speciesCaught: true,
      }).getBallModifier(Balls.RepeatBall),
    ).toBe(3.5);
  });

  it('keeps the Dusk Ball to the dark hours', () => {
    // Windows are milliseconds into the day: 12:00 and 22:00
    const noon = new SafariSession({ ...makeEncounter(), timestamp: 12 * HOUR }, rolls([]));
    const night = new SafariSession({ ...makeEncounter(), timestamp: 22 * HOUR }, rolls([]));

    expect(noon.getBallModifier(Balls.DuskBall)).toBe(1);
    expect(night.getBallModifier(Balls.DuskBall)).toBe(3);
  });

  it('is twice as catchable on its family day', () => {
    // The window sits at the epoch, whose day of the year is zero —
    // Bulbasaur's family number, so its line is the day's feature
    const featured = new SafariSession(makeEncounter(Species.Bulbasaur), rolls([]));

    expect(featured.isFeatured()).toBe(true);
    // Bulbasaur's catch rate is 45
    expect(featured.getCatchChance()).toBeCloseTo((45 * 2) / 255);

    // Tauros shares the window but not the family
    const plain = new SafariSession(makeEncounter(), rolls([]));

    expect(plain.isFeatured()).toBe(false);
    expect(plain.getCatchChance()).toBeCloseTo(45 / 255);

    // The bonus stacks with the ball and the feeding, and the chance
    // still caps at certainty rather than running past it
    const stacked = new SafariSession(makeEncounter(Species.Bulbasaur), rolls([]));

    stacked.feed(Items.OranBerry);
    expect(stacked.getCatchChance()).toBeCloseTo((45 * 1.25 * 2) / 255);

    stacked.chooseBall(Balls.UltraBall);
    expect(stacked.getCatchChance()).toBeCloseTo((45 * 2 * 1.25 * 2) / 255);
  });

  it('guarantees the last ball of a well-stocked player', () => {
    // Down to the last ball after walking in with more than a hundred
    const pity = new SafariSession(makeEncounter(), rolls([0.9999]), { startingBalls: 101 });

    pity.ballsLeft = 1;
    expect(pity.isPityThrow()).toBe(true);
    expect(pity.getCatchChance()).toBe(1);
    expect(pity.throwBall()).toBe(ThrowResult.Caught);

    // One ball earlier it is an ordinary throw
    const earlier = new SafariSession(makeEncounter(), rolls([]), { startingBalls: 101 });

    earlier.ballsLeft = 2;
    expect(earlier.isPityThrow()).toBe(false);
    expect(earlier.getCatchChance()).toBeCloseTo(45 / 255);

    // A player who never carried a real stock earns no pity
    const unstocked = new SafariSession(makeEncounter(), rolls([]), { startingBalls: 100 });

    unstocked.ballsLeft = 1;
    expect(unstocked.isPityThrow()).toBe(false);
    expect(unstocked.getCatchChance()).toBeCloseTo(45 / 255);

    // And a session told nothing about the bag behaves as before
    const unknown = new SafariSession(makeEncounter(), rolls([]));

    unknown.ballsLeft = 1;
    expect(unknown.isPityThrow()).toBe(false);
  });

  it('always catches with the Master Ball', () => {
    const session = new SafariSession(makeEncounter(), rolls([0.9999]));

    session.chooseBall(Balls.MasterBall);
    expect(session.getCatchChance()).toBe(1);
    expect(session.throwBall()).toBe(ThrowResult.Caught);
    expect(session.state).toBe(SafariState.Caught);

    // A finished session rejects further actions
    expect(() => session.throwBall()).toThrow('ended');
  });

  it('rolls the flee check after a failed throw', () => {
    // Failed catch, flee roll under Tauros' speed-driven chance
    const fled = new SafariSession(makeEncounter(), rolls([0.99, 0]));

    expect(fled.getFleeChance()).toBeCloseTo(110 / 255);
    expect(fled.throwBall()).toBe(ThrowResult.Fled);
    expect(fled.state).toBe(SafariState.Fled);

    // Failed catch, failed flee: the encounter stays
    const stayed = new SafariSession(makeEncounter(), rolls([0.99, 0.99]));

    expect(stayed.throwBall()).toBe(ThrowResult.BrokeFree);
    expect(stayed.state).toBe(SafariState.Active);
  });

  it('never lets raid encounters flee', () => {
    const session = new SafariSession(
      makeEncounter(Species.Tauros, EncounterType.Raid),
      rolls([0.99, 0]),
    );

    expect(session.getFleeChance()).toBe(0);
    expect(session.throwBall()).toBe(ThrowResult.BrokeFree);
    expect(session.state).toBe(SafariState.Active);
  });

  it('exits on run away without burning the encounter', () => {
    const session = new SafariSession(makeEncounter(), rolls([]));

    session.runAway();
    expect(session.state).toBe(SafariState.Exited);
    expect(() => session.feed(Items.OranBerry)).toThrow('ended');
  });

  it('emits events a UI can hook into', () => {
    const session = new SafariSession(makeEncounter(), rolls([0.99, 0.99, 0]));
    const log: string[] = [];

    session.on(SafariEvents.ChooseBall, EventPriority.Post, (event) => {
      log.push(`ball:${event.ball}`);
    });
    session.on(SafariEvents.Feed, EventPriority.Post, (event) => {
      log.push(`feed:${event.item}@${event.bonus}`);
    });
    session.on(SafariEvents.Throw, EventPriority.Post, (event) => {
      log.push(`throw:${event.result}`);
    });
    session.on(SafariEvents.End, EventPriority.Post, (event) => {
      log.push(`end:${event.state}`);
    });

    session.chooseBall(Balls.GreatBall);
    session.feed(Items.OranBerry);
    session.throwBall(); // breaks free, no flee
    session.throwBall(); // caught

    expect(log).toEqual([
      `ball:${Balls.GreatBall}`,
      `feed:${Items.OranBerry}@1.25`,
      `throw:${ThrowResult.BrokeFree}`,
      `throw:${ThrowResult.Caught}`,
      `end:${SafariState.Caught}`,
    ]);
  });

  it('lets Pre listeners veto actions', () => {
    const session = new SafariSession(makeEncounter(), rolls([0]));

    // A vetoed ball choice never reaches the Exact mechanics
    session.on(SafariEvents.ChooseBall, EventPriority.Pre, (event) => {
      event.disabled = true;
    });
    session.chooseBall(Balls.MasterBall);
    expect(session.ball).toBe(Balls.PokeBall);

    // A vetoed throw rolls nothing and reports a clean break-free
    session.on(SafariEvents.Throw, EventPriority.Pre, (event) => {
      event.disabled = true;
    });
    expect(session.throwBall()).toBe(ThrowResult.BrokeFree);
    expect(session.state).toBe(SafariState.Active);
  });

  it('keys encounters by cell, window and individual value', () => {
    const encounter = makeEncounter();

    expect(encounterKey(encounter)).toBe(`0,0@0:0`);
  });
});
