import { describe, expect, it } from 'vitest';
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

// Tauros: catch rate 45, base speed 110
function makeEncounter(type = EncounterType.Wild): Encounter {
  const world = new World('overworld');
  const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);

  return { ...deriveEncounter(snapshot, [Species.Tauros, 0, 0]), type };
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
    const session = new SafariSession(makeEncounter(EncounterType.Raid), rolls([0.99, 0]));

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
