import { describe, expect, it } from 'vitest';
import { MAX_IV, Stats, getIV, getOtherStat, setIV } from '../../src/data/constants/stats';
import Biome from '../../src/data/ids/biome';
import Natures, { getNatureFactor } from '../../src/data/ids/natures';
import { Balls, Items } from '../../src/data/ids/items';
import { Genders, Species } from '../../src/data/ids/species';
import Phenomenon from '../../src/data/overworld/phenomenon';
import { BASE_FRIENDSHIP, caughtFriendship } from '../../src/data/constants/friendship';
import { registerSpecies } from '../../src/data/species';
import ChunkSnapshot from '../../src/overworld/chunk-snapshot';
import deriveEncounter, { type Encounter, EncounterType } from '../../src/overworld/encounter';
import { EventPriority } from '../../src/core/event-emitter';
import SafariSession, {
  LEVEL_CATCH_FLOOR,
  SHADOW_CATCH_FACTOR,
  SafariEvents,
  SafariState,
  ThrowResult,
  encounterKey,
  levelCatchFactor,
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

/**
 * What a throw at this encounter is worth before the ball, the treats
 * and the day are counted: the species' own rate, less whatever its
 * level shrugs off. The level is the world's — an encounter is derived
 * rather than written by hand — so the expectation is worked out the
 * same way rather than typed in
 */
function pull(encounter: Encounter, rate = 45): number {
  return (rate * levelCatchFactor(encounter.level)) / 255;
}

describe('safari session', () => {
  it('computes catch chance from rate, ball, feeding and level', () => {
    const encounter = makeEncounter();
    const session = new SafariSession(encounter, rolls([]));

    expect(session.getCatchChance()).toBeCloseTo(pull(encounter));

    // Choosing a stronger ball scales the chance
    session.chooseBall(Balls.UltraBall);
    expect(session.getCatchChance()).toBeCloseTo(pull(encounter) * 2);

    // Feeding a berry stacks a bonus; inedible items do nothing
    expect(session.feed(Items.OranBerry)).toBe(true);
    expect(session.getCatchChance()).toBeCloseTo(pull(encounter) * 2 * 1.25);
    expect(session.feed(Items.FireStone)).toBe(false);

    // A Razz grade is worth more fed than plain bait is
    const razzed = new SafariSession(encounter, rolls([]));

    razzed.feed(Items.GoldenRazzBerry);
    expect(razzed.getCatchChance()).toBeCloseTo(pull(encounter) * 3);

    // A grade whose own job is elsewhere is still bait, so feeding one
    // is never worse than feeding the fruit it was grown from
    const calmed = new SafariSession(encounter, rolls([]));

    calmed.feed(Items.SilverNanabBerry);
    expect(calmed.getCatchChance()).toBeCloseTo(pull(encounter) * 1.5);
    expect(session.getCatchChance()).toBeCloseTo(pull(encounter) * 2 * 1.25);
  });

  it('leaves half a throw at a shadow', () => {
    const plain = makeEncounter();
    const shadow = { ...plain, shadow: true };

    expect(new SafariSession(shadow, rolls([])).getCatchChance()).toBeCloseTo(
      new SafariSession(plain, rolls([])).getCatchChance() * SHADOW_CATCH_FACTOR,
    );

    // It multiplies with everything else rather than replacing any of
    // it, so a better ball still buys exactly what it always bought
    const thrown = new SafariSession(shadow, rolls([]));

    thrown.chooseBall(Balls.UltraBall);
    expect(thrown.getCatchChance()).toBeCloseTo(pull(plain) * 2 * SHADOW_CATCH_FACTOR);
  });

  it('takes a level as the mainline takes a health bar', () => {
    // Nothing is fought before it is caught, so how grown the thing
    // standing there is stands in for how hurt it is
    expect(levelCatchFactor(1)).toBeCloseTo(1);
    expect(levelCatchFactor(100)).toBeCloseTo(LEVEL_CATCH_FLOOR);
    // Evenly between the two, and never past either end
    expect(levelCatchFactor(50)).toBeCloseTo(1 - (1 - LEVEL_CATCH_FLOOR) * (49 / 99));
    expect(levelCatchFactor(0)).toBeCloseTo(1);
    expect(levelCatchFactor(140)).toBeCloseTo(LEVEL_CATCH_FLOOR);

    for (let level = 2; level <= 100; level++) {
      expect(levelCatchFactor(level), `level ${level}`).toBeLessThan(levelCatchFactor(level - 1));
    }

    // ...and it is the whole of the difference between two of the same
    // species met at different ages
    const young = new SafariSession({ ...makeEncounter(), level: 5 }, rolls([]));
    const grown = new SafariSession({ ...makeEncounter(), level: 60 }, rolls([]));

    expect(young.getCatchChance()).toBeGreaterThan(grown.getCatchChance());
    expect(grown.getCatchChance()).toBeCloseTo((45 * levelCatchFactor(60)) / 255);
  });

  it('takes one treat at a time, and another once a ball misses', () => {
    const session = new SafariSession(makeEncounter(), rolls([0.99, 0.99, 0.99, 0.99]));

    expect(session.canFeed()).toBe(true);
    expect(session.feed(Items.OranBerry)).toBe(true);

    // Still chewing: nothing else goes in, and a refused feeding
    // moves neither the bonus nor the clock
    expect(session.canFeed()).toBe(false);
    expect(session.feed(Items.OranBerry)).toBe(false);
    expect(session.catchBonus).toBeCloseTo(1.25);
    expect(session.turn).toBe(1);

    // A ball it shook off leaves it open to another one
    expect(session.throwBall()).toBe(ThrowResult.BrokeFree);
    expect(session.canFeed()).toBe(true);
    expect(session.feed(Items.OranBerry)).toBe(true);
    expect(session.catchBonus).toBeCloseTo(1.25 * 1.25);

    // A caught encounter is not hungry, whatever the flag says
    const caught = new SafariSession(makeEncounter(), rolls([0]));

    expect(caught.throwBall()).toBe(ThrowResult.Caught);
    expect(caught.canFeed()).toBe(false);
  });

  it('resolves Quick and Timer Balls by the safari clock', () => {
    const encounter = makeEncounter();
    const session = new SafariSession(encounter, rolls([0.99, 0.99]));

    // Quick Ball: 5x on the opening turn only
    session.chooseBall(Balls.QuickBall);
    expect(session.getCatchChance()).toBeCloseTo(pull(encounter) * 5);

    // A failed throw consumes the opening turn
    expect(session.throwBall()).toBe(ThrowResult.BrokeFree);
    expect(session.getCatchChance()).toBeCloseTo(pull(encounter));

    // Timer Ball: grows per elapsed turn
    session.chooseBall(Balls.TimerBall);
    expect(session.getCatchChance()).toBeCloseTo(pull(encounter) * (1 + 1229 / 4096));

    // Feeding also advances the clock (and stacks its own bonus)
    session.feed(Items.OranBerry);
    expect(session.getCatchChance()).toBeCloseTo(pull(encounter) * (1 + (2 * 1229) / 4096) * 1.25);

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

  it("answers the Fast, Heavy and Moon Balls off the species' own numbers", () => {
    // Tauros is 110 base Speed; Caterpie is 45
    expect(new SafariSession(makeEncounter(), rolls([])).getBallModifier(Balls.FastBall)).toBe(4);
    expect(
      new SafariSession(makeEncounter(Species.Caterpie), rolls([])).getBallModifier(Balls.FastBall),
    ).toBe(1);

    // Caterpie is 2.9 kg, Tauros 88.4, Snorlax 460
    expect(
      new SafariSession(makeEncounter(Species.Caterpie), rolls([])).getBallModifier(
        Balls.HeavyBall,
      ),
    ).toBe(1);
    expect(new SafariSession(makeEncounter(), rolls([])).getBallModifier(Balls.HeavyBall)).toBe(1);
    expect(
      new SafariSession(makeEncounter(Species.Snorlax), rolls([])).getBallModifier(Balls.HeavyBall),
    ).toBe(4);

    // The Moon Ball answers a whole line: Clefairy takes the stone,
    // and Clefable above it and Cleffa below it are its relatives
    for (const species of [Species.Clefairy, Species.Clefable, Species.Cleffa]) {
      expect(
        new SafariSession(makeEncounter(species), rolls([])).getBallModifier(Balls.MoonBall),
        String(species),
      ).toBe(4);
    }
    expect(new SafariSession(makeEncounter(), rolls([])).getBallModifier(Balls.MoonBall)).toBe(1);
  });

  it('gives the Lure Ball whatever a ripple brought up', () => {
    const walked = new SafariSession(makeEncounter(), rolls([]));
    const rippled = new SafariSession(
      { ...makeEncounter(), phenomenon: Phenomenon.RipplingWater },
      rolls([]),
    );
    const dusty = new SafariSession(
      { ...makeEncounter(), phenomenon: Phenomenon.DustCloud },
      rolls([]),
    );

    expect(walked.getBallModifier(Balls.LureBall)).toBe(1);
    expect(rippled.getBallModifier(Balls.LureBall)).toBe(5);
    expect(dusty.getBallModifier(Balls.LureBall)).toBe(1);
  });

  it('throws the Level and Love Balls from behind the buddy', () => {
    const encounter = { ...makeEncounter(), level: 10, gender: Genders.Female };
    const alone = new SafariSession(encounter, rolls([]));

    // A player walking alone has no buddy to measure against, so both
    // are worth what a plain ball is
    expect(alone.getBallModifier(Balls.LevelBall)).toBe(1);
    expect(alone.getBallModifier(Balls.LoveBall)).toBe(1);

    const behind = (
      level: number,
      species = Species.Tauros,
      gender = Genders.Male,
    ): SafariSession =>
      new SafariSession(encounter, rolls([]), { buddy: { species, gender, level } });

    // The mainline ladder: four times over, twice over, above it, and
    // level with it
    expect(behind(40).getBallModifier(Balls.LevelBall)).toBe(8);
    expect(behind(20).getBallModifier(Balls.LevelBall)).toBe(4);
    expect(behind(11).getBallModifier(Balls.LevelBall)).toBe(2);
    expect(behind(10).getBallModifier(Balls.LevelBall)).toBe(1);

    // The Love Ball wants its own species back the other way round
    expect(behind(10).getBallModifier(Balls.LoveBall)).toBe(8);
    expect(behind(10, Species.Tauros, Genders.Female).getBallModifier(Balls.LoveBall)).toBe(1);
    expect(behind(10, Species.Caterpie).getBallModifier(Balls.LoveBall)).toBe(1);

    // Neither side may be genderless: there is no other way round
    const genderless = { ...makeEncounter(Species.Magnemite), gender: Genders.Genderless };

    expect(
      new SafariSession(genderless, rolls([]), {
        buddy: { species: Species.Magnemite, gender: Genders.Genderless, level: 10 },
      }).getBallModifier(Balls.LoveBall),
    ).toBe(1);
  });

  it('catches with the Friend Ball as with a plain one', () => {
    // What it is thrown for happens after the catch
    expect(new SafariSession(makeEncounter(), rolls([])).getBallModifier(Balls.FriendBall)).toBe(1);
    expect(caughtFriendship(Balls.FriendBall, false)).toBe(200);
    expect(caughtFriendship(Balls.PokeBall, false)).toBe(BASE_FRIENDSHIP);
    // A shadow arrives thinking nothing of anybody, Friend Ball or not
    expect(caughtFriendship(Balls.FriendBall, true)).toBe(0);
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
    const bulbasaur = makeEncounter(Species.Bulbasaur);
    const featured = new SafariSession(bulbasaur, rolls([]));

    expect(featured.isFeatured()).toBe(true);
    // Bulbasaur's catch rate is 45
    expect(featured.getCatchChance()).toBeCloseTo(pull(bulbasaur) * 2);

    // Tauros shares the window but not the family
    const tauros = makeEncounter();
    const plain = new SafariSession(tauros, rolls([]));

    expect(plain.isFeatured()).toBe(false);
    expect(plain.getCatchChance()).toBeCloseTo(pull(tauros));

    // The bonus stacks with the ball and the feeding, and the chance
    // still caps at certainty rather than running past it
    const stacked = new SafariSession(bulbasaur, rolls([]));

    stacked.feed(Items.OranBerry);
    expect(stacked.getCatchChance()).toBeCloseTo(pull(bulbasaur) * 1.25 * 2);

    stacked.chooseBall(Balls.UltraBall);
    expect(stacked.getCatchChance()).toBeCloseTo(pull(bulbasaur) * 2 * 1.25 * 2);
  });

  it('wears the encounter down a percent a ball', () => {
    // Every miss is nothing much and the misses add up: what used to
    // be a free catch on the hundredth ball is paid out along the way
    const meeting = makeEncounter();
    // Nothing lands and nothing bolts, so the session runs as long as
    // the throws do
    const session = new SafariSession({ ...meeting, type: EncounterType.LegendaryRaid }, rolls([]));

    expect(session.throws).toBe(0);
    expect(session.getCatchChance()).toBeCloseTo(pull(meeting));

    session.throwBall();
    expect(session.throws).toBe(1);
    expect(session.getCatchChance()).toBeCloseTo(pull(meeting) * 1.01);

    for (let ball = 0; ball < 9; ball++) {
      session.throwBall();
    }
    expect(session.throws).toBe(10);
    expect(session.getCatchChance()).toBeCloseTo(pull(meeting) * 1.01 ** 10);

    // Feeding is not throwing: the treat is paid for in its own bonus
    session.feed(Items.OranBerry);
    expect(session.throws).toBe(10);
    expect(session.getCatchChance()).toBeCloseTo(pull(meeting) * 1.25 * 1.01 ** 10);
  });

  it('leaves nothing certain but the Master Ball', () => {
    // The bag used to decide this: a player who walked in with a
    // hundred balls was handed their last one. Nothing about how full
    // a bag is reaches the throw any more
    const session = new SafariSession(
      { ...makeEncounter(), type: EncounterType.LegendaryRaid },
      rolls([]),
    );

    session.ballsLeft = 1;
    expect(session.getCatchChance()).toBeLessThan(1);

    for (let ball = 0; ball < 100; ball++) {
      session.throwBall();
    }
    // A hundred balls in it is half again as likely as it was, and
    // still a throw rather than a certainty
    expect(session.getCatchChance()).toBeCloseTo(pull(makeEncounter()) * 1.01 ** 100);
    expect(session.getCatchChance()).toBeLessThan(1);
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
    // Failed catch, flee roll under the Tauros' own speed — its
    // stat rather than its species' printed base
    const meeting = makeEncounter();
    const fled = new SafariSession(meeting, rolls([0.99, 0]));

    expect(fled.getSpeed()).toBe(
      getOtherStat(
        meeting.level,
        110,
        getIV(meeting.ivs, Stats.Speed),
        0,
        getNatureFactor(meeting.nature, Stats.Speed),
      ),
    );
    expect(fled.getFleeChance()).toBeCloseTo(fled.getSpeed() / 255);
    expect(fled.throwBall()).toBe(ThrowResult.Fled);
    expect(fled.state).toBe(SafariState.Fled);

    // A Nanab grade cuts the roll it bolts on. Silver halves it, and
    // the same throw that fled above now breaks free instead
    const calmed = new SafariSession(makeEncounter(), rolls([0.99, 0.5]));

    expect(calmed.feed(Items.SilverNanabBerry)).toBe(true);
    expect(calmed.getFleeChance()).toBeCloseTo((calmed.getSpeed() / 255) * 0.5);
    expect(calmed.throwBall()).toBe(ThrowResult.BrokeFree);

    // And the treat is gone with the throw, so the next one is rolled
    // against the whole chance again
    expect(calmed.fedItem).toBe(null);
    expect(calmed.getFleeChance()).toBeCloseTo(calmed.getSpeed() / 255);

    // Gold settles it completely: nothing bolts from the ball after one
    const settled = new SafariSession(makeEncounter(), rolls([0.99, 0]));

    settled.feed(Items.GoldenNanabBerry);
    expect(settled.getFleeChance()).toBe(0);
    expect(settled.throwBall()).toBe(ThrowResult.BrokeFree);

    // Failed catch, failed flee: the encounter stays
    const stayed = new SafariSession(makeEncounter(), rolls([0.99, 0.99]));

    expect(stayed.throwBall()).toBe(ThrowResult.BrokeFree);
    expect(stayed.state).toBe(SafariState.Active);
  });

  it('reads the individual rather than the species for a flee', () => {
    // The same species, one of them faster than the other by the two
    // things that make one pokemon faster than another of its kind
    const base = makeEncounter();
    const quick = {
      ...base,
      level: 40,
      ivs: setIV(base.ivs, Stats.Speed, MAX_IV),
      nature: Natures.Jolly,
    };
    const slow = { ...quick, ivs: setIV(base.ivs, Stats.Speed, 0), nature: Natures.Brave };

    expect(new SafariSession(quick, rolls([])).getFleeChance()).toBeGreaterThan(
      new SafariSession(slow, rolls([])).getFleeChance(),
    );

    // ...and the same individual grown up bolts more readily than it
    // did young, which is the other half of the level being counted:
    // easy to catch and easy to keep, or neither
    const young = new SafariSession({ ...quick, level: 5 }, rolls([]));
    const grown = new SafariSession({ ...quick, level: 60 }, rolls([]));

    expect(young.getFleeChance()).toBeLessThan(grown.getFleeChance());
    // Even the fastest stays catchable
    expect(new SafariSession({ ...quick, level: 100 }, rolls([])).getFleeChance()).toBe(0.5);
  });

  it('never lets what was fought for flee', () => {
    // A legendary raid's prize, a shadow raid's and a beaten grunt's
    // drop are three kinds of meeting, and none of them bolts
    for (const type of [
      EncounterType.LegendaryRaid,
      EncounterType.ShadowRaid,
      EncounterType.Rocket,
    ]) {
      const session = new SafariSession(makeEncounter(Species.Tauros, type), rolls([0.99, 0]));

      expect(session.getFleeChance()).toBe(0);
      expect(session.throwBall()).toBe(ThrowResult.BrokeFree);
      expect(session.state).toBe(SafariState.Active);
    }
  });

  it('hands a gift over whatever is thrown at it', () => {
    // A gift cannot run and cannot break out: the throw is a
    // formality, and the ball the player used is the one the record
    // ends up naming. The roll is the worst one there is, and it is
    // caught anyway
    const session = new SafariSession(
      makeEncounter(Species.Tauros, EncounterType.Fateful),
      rolls([0.999]),
    );

    expect(session.getFleeChance()).toBe(0);
    expect(session.getCatchChance()).toBe(1);
    expect(session.throwBall()).toBe(ThrowResult.Caught);
    expect(session.state).toBe(SafariState.Caught);
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
