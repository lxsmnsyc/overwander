import { describe, expect, it } from 'vitest';
import {
  type EffortTrained,
  assignEffort,
  assignableEffort,
  effortBudget,
  effortSpent,
  unusedEffort,
} from '../src/auth/effort';
import {
  BASE_FRIENDSHIP,
  FRIENDSHIP_STEP_INTERVAL,
  HATCHED_FRIENDSHIP,
  LUXURY_FRIENDSHIP_FACTOR,
  MAX_FRIENDSHIP,
  describeFriendship,
  friendshipFactor,
  gainFriendship,
  groomedFriendship,
} from '../src/data/constants/friendship';
import {
  EFFORT_PER_LEVEL,
  MAX_EFFORT_PER_STAT,
  STAT_ORDER,
  Stats,
} from '../src/data/constants/stats';
import { asCaughtPokemon, getMovePoints } from '../src/auth/caught-record';
import { Balls, ItemFlags, ItemTypes, Items } from '../src/data/ids/items';
import { Moves } from '../src/data/ids/moves';
import registerItems, { getItemData } from '../src/data/items';
import { PP_ITEMS, VITAMIN_EFFORT, VITAMIN_PRICE, VITAMIN_STATS } from '../src/data/items/vitamins';
import { WING_EFFORT, WING_STATS } from '../src/data/items/wings';
import { PP_UP_LIMIT, getMovePP, registerMoves } from '../src/data/moves';
import { getItemBand } from '../src/data/overworld/item-pool';
import { registerSpecies } from '../src/data/species';
import { Species } from '../src/data/ids/species';

// The registries the assertions below read: what a move's PP is, and
// what the market makes of a vitamin
registerMoves();
registerSpecies();
registerItems();

function trained(
  level: number,
  values: Partial<Record<Stats, number>> = {},
  bonus = 0,
): EffortTrained {
  return {
    level,
    effortBonus: bonus,
    effortValues: {
      [Stats.HP]: 0,
      [Stats.Attack]: 0,
      [Stats.Defense]: 0,
      [Stats.SpecialAttack]: 0,
      [Stats.SpecialDefense]: 0,
      [Stats.Speed]: 0,
      ...values,
    },
  };
}

describe('effort budget', () => {
  it('pays five points a level', () => {
    // The example the whole design turns on: a level 20 catch has a
    // hundred points nobody has spent yet
    expect(effortBudget(trained(20))).toBe(100);
    expect(unusedEffort(trained(20))).toBe(100);
    expect(effortBudget(trained(100))).toBe(100 * EFFORT_PER_LEVEL);
  });

  it('counts what has been spent against it', () => {
    const caught = trained(20, { [Stats.Attack]: 60 });

    expect(effortSpent(caught)).toBe(60);
    expect(unusedEffort(caught)).toBe(40);
  });

  it('adds what a wing granted on top of the levels', () => {
    // A wing pays for what it granted, so the pool is untouched by it
    const caught = trained(20, { [Stats.Speed]: 3 }, 3);

    expect(effortBudget(caught)).toBe(103);
    expect(unusedEffort(caught)).toBe(100);
  });

  it('holds one stat to what one stat can take', () => {
    const caught = trained(100, { [Stats.Attack]: MAX_EFFORT_PER_STAT - 2 });

    expect(assignableEffort(caught, Stats.Attack)).toBe(2);
  });
});

describe('assigning effort', () => {
  it('moves points into a stat', () => {
    const caught = trained(20);

    expect(assignEffort(caught, Stats.Speed, 40)?.[Stats.Speed]).toBe(40);
  });

  it('refuses to invent points the pokemon has not got', () => {
    const caught = trained(10); // 50 points

    expect(assignEffort(caught, Stats.Speed, 51)).toBeNull();
    expect(assignEffort(caught, Stats.Speed, 50)?.[Stats.Speed]).toBe(50);
  });

  it('refuses to train one stat past its cap', () => {
    const caught = trained(100, { [Stats.Attack]: MAX_EFFORT_PER_STAT });

    expect(assignEffort(caught, Stats.Attack, 1)).toBeNull();
  });

  it('takes points back out, which is what a bitter berry does', () => {
    const caught = trained(20, { [Stats.Attack]: 30 });
    const after = assignEffort(caught, Stats.Attack, -10);

    expect(after?.[Stats.Attack]).toBe(20);
    // The level that paid for them has not been un-taken, so they are
    // back in the pool rather than lost
    expect(unusedEffort({ ...caught, effortValues: after ?? caught.effortValues })).toBe(80);
  });

  it('refuses to take back more than is there', () => {
    expect(assignEffort(trained(20, { [Stats.Attack]: 4 }), Stats.Attack, -8)).toBeNull();
    expect(assignEffort(trained(20), Stats.Attack, 0)).toBeNull();
  });
});

describe('grooming', () => {
  it('buys half of whatever is left to give', () => {
    // The daycare lady's bargain, made on the pokemon: a fresh catch
    // gains a great deal and one that already adores its owner gains
    // almost nothing
    expect(groomedFriendship(BASE_FRIENDSHIP)).toBe(BASE_FRIENDSHIP + 92);
    expect(groomedFriendship(0)).toBe(127);
    expect(groomedFriendship(200)).toBe(227);
    expect(groomedFriendship(254)).toBe(254);
  });

  it('can never buy the last of it', () => {
    let friendship = BASE_FRIENDSHIP;

    // Twenty visits and a small fortune still leave the last point to
    // be walked for
    for (let visit = 0; visit < 20; visit++) {
      friendship = groomedFriendship(friendship);
    }
    expect(friendship).toBeLessThan(MAX_FRIENDSHIP);
  });
});

describe('friendship', () => {
  it('starts where a stranger starts, and higher for something carried', () => {
    expect(BASE_FRIENDSHIP).toBeLessThan(HATCHED_FRIENDSHIP);
    expect(describeFriendship(BASE_FRIENDSHIP)).toBe('used to you');
  });

  it('pays less the better a pokemon already thinks of you', () => {
    expect(gainFriendship(50, 'level')).toBe(55);
    expect(gainFriendship(150, 'level')).toBe(153);
    expect(gainFriendship(250, 'level')).toBe(252);
  });

  it('takes one off for a faint, whatever the pokemon thinks', () => {
    expect(gainFriendship(50, 'faint')).toBe(49);
    expect(gainFriendship(250, 'faint')).toBe(249);
    expect(gainFriendship(0, 'faint')).toBe(0);
  });

  it('never goes past what a friendship can be', () => {
    expect(gainFriendship(MAX_FRIENDSHIP, 'berry')).toBe(MAX_FRIENDSHIP);
    expect(gainFriendship(254, 'walk')).toBe(MAX_FRIENDSHIP);
  });

  it('counts a long walk as several points at once', () => {
    // What a buddy's report is worth: one point per interval walked
    expect(gainFriendship(50, 'walk', 3)).toBe(56);
    expect(FRIENDSHIP_STEP_INTERVAL).toBeGreaterThan(0);
  });

  it('brings a pokemon caught in a Luxury Ball round twice as fast', () => {
    expect(friendshipFactor(Balls.LuxuryBall)).toBe(LUXURY_FRIENDSHIP_FACTOR);
    expect(friendshipFactor(Balls.PokeBall)).toBe(1);
    expect(friendshipFactor(Balls.MasterBall)).toBe(1);

    const factor = friendshipFactor(Balls.LuxuryBall);

    expect(gainFriendship(50, 'level', 1, factor)).toBe(60);
    expect(gainFriendship(150, 'level', 1, factor)).toBe(156);
    // It multiplies the points a walk buys, not the walk itself
    expect(gainFriendship(50, 'walk', 3, factor)).toBe(62);
    expect(gainFriendship(MAX_FRIENDSHIP, 'berry', 1, factor)).toBe(MAX_FRIENDSHIP);
  });

  it('costs more herbal medicine the fonder a pokemon is of you', () => {
    // The one loss that grows with the band: a pokemon that hardly
    // knows the player shrugs a mouthful off, and one that trusted
    // them does not
    expect(gainFriendship(50, 'herb')).toBe(45);
    expect(gainFriendship(150, 'herb')).toBe(145);
    expect(gainFriendship(250, 'herb')).toBe(240);

    // Bitterness is counted in mouthfuls: a root costs two of them
    // and a Revival Herb three
    expect(gainFriendship(50, 'herb', 2)).toBe(40);
    expect(gainFriendship(50, 'herb', 3)).toBe(35);

    // And it stops at nothing rather than going below it
    expect(gainFriendship(3, 'herb')).toBe(0);
  });

  it('never makes a comfortable ball hurt more', () => {
    // A faint is a faint: the ball is a reason to think better of
    // somebody, not to take a knockout harder
    expect(gainFriendship(50, 'faint', 1, friendshipFactor(Balls.LuxuryBall))).toBe(49);
  });
});

describe('move points', () => {
  it('adds a fifth of the move at a time, floored', () => {
    // Tackle is a 35 PP move: a fifth of it is seven, so each point
    // is worth exactly seven and three are worth twenty-one
    expect(getMovePP(Moves.Tackle)).toBe(35);
    expect(getMovePP(Moves.Tackle, 1)).toBe(42);
    expect(getMovePP(Moves.Tackle, 2)).toBe(49);
    expect(getMovePP(Moves.Tackle, 3)).toBe(56);

    // Floored rather than rounded: a fifth of 15 is three
    expect(getMovePP(Moves.Thunderbolt)).toBe(15);
    expect(getMovePP(Moves.Thunderbolt, 1)).toBe(18);
    expect(getMovePP(Moves.Thunderbolt, 3)).toBe(24);
  });

  it('never gives a move more than it will take', () => {
    // The limit is what a PP Max buys, and nothing goes past it —
    // however many points a stored record claims
    expect(getMovePP(Moves.Tackle, PP_UP_LIMIT)).toBe(getMovePP(Moves.Tackle, 99));
    expect(getMovePP(Moves.Tackle, -1)).toBe(getMovePP(Moves.Tackle));
  });

  it('reads a stored record back inside those limits', () => {
    // Firestore hands back whatever is there. A count past the limit
    // would make a move faster than any amount of gold can buy, and
    // anything that is not a count is not a point spent
    const caught = asCaughtPokemon({
      species: Species.Pidgey,
      level: 5,
      movePoints: { [Moves.Tackle]: 99, [Moves.Growl]: 0, [Moves.TailWhip]: 'lots' },
    });

    expect(getMovePoints(caught, Moves.Tackle)).toBe(PP_UP_LIMIT);
    expect(getMovePoints(caught, Moves.Growl)).toBe(0);
    expect(getMovePoints(caught, Moves.Ember)).toBe(0);
    expect(caught.movePoints[String(Moves.TailWhip)]).toBeUndefined();
  });

  it('reads a record written before moves could be trained as untrained', () => {
    expect(asCaughtPokemon({ species: Species.Pidgey, level: 5 }).movePoints).toEqual({});
  });
});

describe('vitamins', () => {
  it('feeds one stat each, ten points at a time', () => {
    // A vitamin is a wing at scale: the same grant, bought rather
    // than found, so the two share one call on the server
    expect(VITAMIN_EFFORT).toBeGreaterThan(WING_EFFORT);
    expect(new Set(VITAMIN_STATS.values())).toEqual(new Set(STAT_ORDER));
    expect(VITAMIN_STATS.get(Items.HPUp)).toBe(Stats.HP);
    expect(VITAMIN_STATS.get(Items.Carbos)).toBe(Stats.Speed);
    expect(VITAMIN_STATS.size).toBe(WING_STATS.size);
  });

  it('is bought rather than found, which is a wing turned around', () => {
    for (const item of VITAMIN_STATS.keys()) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Training);
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(VITAMIN_PRICE);
      // Nothing on the ground hides one: a vitamin is a gold sink
      expect(getItemBand(item)).toBeNull();
    }
    // A wing is the other way round: found, never stocked
    for (const item of WING_STATS.keys()) {
      expect(getItemData(item).flags & ItemFlags.Marketable).toBe(0);
      expect(getItemBand(item)).toBe('uncommon');
    }
  });

  it('sells a PP Max for what three PP Ups cost', () => {
    expect(PP_ITEMS.get(Items.PPUp)).toBe(1);
    expect(PP_ITEMS.get(Items.PPMax)).toBe(PP_UP_LIMIT);
    expect(getItemData(Items.PPMax).buy).toBe(getItemData(Items.PPUp).buy * PP_UP_LIMIT);
    expect(getItemData(Items.PPUp).type).toBe(ItemTypes.Training);
  });
});
