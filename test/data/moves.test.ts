import { describe, expect, it } from 'vitest';
import registerBiomeSpawns from '../../src/data/biome';
import EggGroups from '../../src/data/ids/egg-groups';
import registerAbilities from '../../src/data/abilities';
import { Types } from '../../src/data/constants/types';
import { MoveAffects, MoveCategories, MoveTargets, Moves } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
import { Species } from '../../src/data/ids/species';
import registerItems, { getTeachableMoves } from '../../src/data/items';
import { getMoveData, getRegisteredMoves, registerMoves } from '../../src/data/moves';
import {
  SPRITE_ANIMS,
  SpriteAnim,
  asSpriteAnim,
  spriteAnimName,
  spriteAnimOf,
} from '../../src/data/ids/sprite-anims';
import {
  CAST_ANIMATIONS,
  DEFAULT_CAST,
  isCommonCast,
  isLoopingCast,
  pickCast,
} from '../../src/data/constants/cast';
import pickStatusCast, { STATUS_CAST } from '../../src/data/constants/status-cast';
import {
  getEggMoves,
  getRegisteredSpecies,
  getSpeciesData,
  registerSpecies,
} from '../../src/data/species';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('egg moves', () => {
  it('names moves this registry actually holds', () => {
    let carried = 0;

    for (const species of getRegisteredSpecies()) {
      const egg = getEggMoves(species);

      carried += egg.length > 0 ? 1 : 0;
      for (const move of egg) {
        // A later generation's egg move has nothing here to name, so
        // the lists are kept to what a Gen 1 battle can actually cast
        expect(() => getMoveData(move)).not.toThrow();
      }
      // A line's list is a set: inheriting the same move twice is
      // nothing
      expect(new Set(egg).size).toBe(egg.length);
    }

    expect(carried).toBeGreaterThan(0);
  });

  it('gives them to the base stage, and to nothing that cannot breed', () => {
    for (const species of getRegisteredSpecies()) {
      const data = getSpeciesData(species);

      if (getEggMoves(species).length === 0) {
        continue;
      }

      // What hatches is what inherits: an evolution carries what it
      // hatched with rather than a list of its own
      for (const evolution of data.evolvesInto ?? []) {
        expect(getEggMoves(evolution.species)).toEqual([]);
      }
      // Nothing that can never be hatched inherits anything. A baby
      // is the exception: it is Undiscovered itself, since it cannot
      // be a parent, and the stage above it is the one that lays it
      const hatchable = (data.evolvesInto ?? []).some(
        (evolution) =>
          !new Set(getSpeciesData(evolution.species).eggGroups).has(EggGroups.NoEggsDiscovered),
      );

      if (!hatchable) {
        expect(new Set(data.eggGroups).has(EggGroups.NoEggsDiscovered)).toBe(false);
      }
    }
  });

  it('keeps the moves a line is known for passing down', () => {
    // The elemental punches are the classic inheritance: an Abra or a
    // Gastly never learns one on its own
    for (const species of [Species.Abra, Species.Gastly]) {
      const egg = new Set(getEggMoves(species));

      expect(egg.has(Moves.FirePunch)).toBe(true);
      expect(egg.has(Moves.IcePunch)).toBe(true);
      expect(egg.has(Moves.ThunderPunch)).toBe(true);
    }

    // A legendary has nobody to inherit from
    expect(getEggMoves(Species.Mewtwo)).toEqual([]);
    expect(getEggMoves(Species.Articuno)).toEqual([]);
  });
});

describe('the moves nobody knows', () => {
  it('numbers them out of the dex', () => {
    // A move id is a slot in the dex, and these three have no slot:
    // one is what a confused pokemon hits itself with, one is what is
    // left when everything else is shut off, and one is the swing
    // thrown while everything else is cooling. Held past the range, a
    // record carrying a real move can never be read as any of them —
    // the same reason Missingno and the egg are numbered where they
    // are
    expect(Moves.Struggle).toBe(100_000);
    expect(Moves._Confused).toBe(100_001);
    expect(Moves.Attack).toBe(100_002);

    for (const move of getRegisteredMoves()) {
      if (move !== Moves.Struggle && move !== Moves.Attack) {
        expect(move, getMoveData(move).name).toBeLessThan(100_000);
      }
    }
  });

  it('makes the fallback swing feeble and constant', () => {
    const attack = getMoveData(Moves.Attack);

    // A tenth of a real move, so it fills the gaps between cooldowns
    // without ever being worth waiting for
    expect(attack.power).toBe(10);
    // And back about once a second: PP here is how often a move comes
    // round, and the basis it is divided into is 180
    expect(attack.pp).toBe(180);
    // Typeless as registered; what it is actually thrown as is read
    // off the pokemon throwing it
    expect(attack.type).toBe(Types.Unknown);
  });

  it('leaves the moves nobody knows out of every list one can be reached from', () => {
    for (const species of getRegisteredSpecies()) {
      const { learnSet } = getSpeciesData(species);
      const teachable = new Set(learnSet.teachable);
      const named = getSpeciesData(species).name;

      expect(teachable.has(Moves.Struggle), named).toBe(false);
      expect(teachable.has(Moves.Attack), named).toBe(false);
      for (const learned of Object.values(learnSet.level)) {
        expect(new Set(learned).has(Moves.Struggle)).toBe(false);
        expect(new Set(learned).has(Moves.Attack)).toBe(false);
      }
    }

    // And no machine teaches either: machines are derived from what
    // the species can be taught, so the check above is what keeps
    // them out
    expect(new Set(getTeachableMoves()).has(Moves.Struggle)).toBe(false);
    expect(new Set(getTeachableMoves()).has(Moves.Attack)).toBe(false);
  });
});

describe('the moves added back to the dex', () => {
  it('gives Porygon its Conversion and Kadabra its Kinesis', () => {
    // Both were missing, and both are the move the species is known
    // for: Porygon knows Conversion from the moment it is switched on,
    // and Kinesis is the spoon-bending Kadabra is named after
    expect(new Set(getSpeciesData(Species.Porygon).learnSet.level[1]).has(Moves.Conversion)).toBe(
      true,
    );
    expect(new Set(getSpeciesData(Species.Kadabra).learnSet.level[1]).has(Moves.Kinesis)).toBe(
      true,
    );
    // Alakazam keeps what Kadabra learned
    expect(new Set(getSpeciesData(Species.Alakazam).learnSet.level[1]).has(Moves.Kinesis)).toBe(
      true,
    );
  });

  it('teaches Soft-Boiled to Chansey, the fairies and the one who was not supposed to exist', () => {
    const taught = getRegisteredSpecies().filter((species) =>
      new Set(getSpeciesData(species).learnSet.teachable).has(Moves.SoftBoiled),
    );

    // The fairies come by it from a gen 3 tutor rather than from the
    // machine the other two carry
    expect(new Set(taught)).toEqual(
      new Set([
        Species.Clefairy,
        Species.Clefable,
        Species.Chansey,
        Species.Mew,
        Species.Cleffa,
        Species.Togepi,
        Species.Togetic,
      ]),
    );
  });

  it('registers all four with data a battle can read', () => {
    for (const move of [Moves.Conversion, Moves.Kinesis, Moves.SoftBoiled, Moves.Struggle]) {
      expect(() => getMoveData(move)).not.toThrow();
    }

    // Struggle is typeless on purpose: `Unknown` is in no column of
    // the chart, so nothing resists it and nothing is immune to it
    expect(getMoveData(Moves.Struggle).type).toBe(Types.Unknown);
    expect(getMoveData(Moves.Struggle).power).toBe(50);
  });
});

describe('how a move is cast and what it reaches', () => {
  it('names a shape and a side for whatever it lands on', () => {
    for (const move of getRegisteredMoves()) {
      const { name, target, affects } = getMoveData(move);
      const shape = affects & (MoveAffects.Unit | MoveAffects.Team);
      const sides =
        affects & (MoveAffects.Self | MoveAffects.Own | MoveAffects.Ally | MoveAffects.Enemy);

      // Nothing lands on units and whole teams at once
      expect(shape, name).not.toBe(MoveAffects.Unit | MoveAffects.Team);

      if (target === MoveTargets.Unit) {
        expect(shape, name).toBe(MoveAffects.Unit);
      } else if (target === MoveTargets.Team) {
        expect(shape, name).toBe(MoveAffects.Team);
      }

      // A move that reaches a shape says whose, and one that reaches
      // no shape reaches nobody in particular: the weather, the
      // field, whatever the caster does to itself
      expect(shape === 0, name).toBe(sides === 0);
    }
  });

  it('takes the enemy side as the default for whatever it is cast at', () => {
    expect(getMoveData(Moves.Tackle).affects).toBe(MoveAffects.Unit | MoveAffects.Enemy);
    expect(getMoveData(Moves.Spikes).affects).toBe(MoveAffects.Team | MoveAffects.Enemy);
    expect(getMoveData(Moves.SwordsDance).affects).toBe(0);
  });
});

describe('move descriptions', () => {
  it('has every registered move say what it does', () => {
    const moves = getRegisteredMoves();

    expect(moves.length).toBeGreaterThan(0);

    for (const move of moves) {
      const data = getMoveData(move);

      // The line is what the picker prints under the name and what a
      // card over a move shows, so a blank one is a move a player is
      // asked to choose blind
      expect(data.description, `${data.name} says nothing about itself`).not.toBe('');
      expect(data.description.endsWith('.'), `${data.name} does not end its line`).toBe(true);
    }
  });
});

describe('move damage', () => {
  /**
   * The damaging moves that carry no power because they work out their
   * own figure: the fixed-damage group, Counter's return and Bide's.
   * Everything else with a category and no power lands nothing at all,
   * since the shared hit resolver needs a base power to attack with
   */
  const COMPUTES_ITS_OWN = new Set<Moves>([
    Moves.SeismicToss,
    Moves.NightShade,
    Moves.DragonRage,
    Moves.SonicBoom,
    Moves.Fissure,
    Moves.HornDrill,
    Moves.Guillotine,
    Moves.SuperFang,
    Moves.Psywave,
    Moves.Counter,
    Moves.Bide,
    Moves.MirrorCoat,
    // Johto's own: power read off health, off friendship, off the
    // shake of the ground, off what was in the parcel
    Moves.Flail,
    Moves.Reversal,
    Moves.Return,
    Moves.Frustration,
    Moves.Magnitude,
    Moves.Present,
    // Hoenn's own: power read off what Stockpile stored, off the gap
    // between the two sides' HP, and off nothing at all for the one
    // that ends a fight outright
    Moves.SpitUp,
    Moves.Endeavor,
    Moves.SheerCold,
    // Sinnoh's own: power read off the Speed between the two sides,
    // off what either of them is carrying, off the damage just taken,
    // off the PP left and off what the target has left
    Moves.GyroBall,
    Moves.NaturalGift,
    Moves.MetalBurst,
    Moves.Fling,
    Moves.TrumpCard,
    Moves.WringOut,
    Moves.CrushGrip,
    // And the one read off how far the target has pulled ahead
    Moves.Punishment,
    // Unova's own: power read off Speed, off weight, and off the
    // user's own HP
    Moves.ElectroBall,
    Moves.HeavySlam,
    Moves.HeatCrash,
    Moves.FinalGambit,
    // Alola's own: power read off what the target has left, and off
    // friendship for the two partner moves
    Moves.NaturesMadness,
    Moves.PikaPapow,
    Moves.VeeveeVolley,
  ]);

  it('gives every damaging move something to hit with', () => {
    for (const move of getRegisteredMoves()) {
      const data = getMoveData(move);

      if (data.category === MoveCategories.Status || COMPUTES_ITS_OWN.has(move)) {
        continue;
      }
      expect(data.power, `${data.name} deals no damage at all`).toBeGreaterThan(0);
    }
  });
});

describe('sprite animation numbers', () => {
  it('names every number and numbers every name', () => {
    for (const anim of SPRITE_ANIMS) {
      expect(spriteAnimOf(spriteAnimName(anim)), spriteAnimName(anim)).toBe(anim);
    }
    // Matched without regard to case, since an archive's filenames are
    // not this game's to spell
    expect(spriteAnimOf('idle')).toBe(SpriteAnim.Idle);
    expect(spriteAnimOf('  Walk ')).toBe(SpriteAnim.Walk);
    // A name this game has no number for is nothing rather than a guess
    expect(spriteAnimOf('Nap')).toBe(null);
    expect(asSpriteAnim(SPRITE_ANIMS.length)).toBe(null);
  });

  it('keeps the numbers every sheet was written with', () => {
    // The numbers are in a hundred and fifty description files, so they
    // are append-only: this is what a renumbering would trip over
    expect(SpriteAnim.Idle).toBe(0);
    expect(SpriteAnim.Attack).toBe(3);
    expect(SpriteAnim.Swing).toBe(10);
    expect(SpriteAnim.Bite).toBe(34);
    expect(new Set(SPRITE_ANIMS).size, 'no two share a number').toBe(SPRITE_ANIMS.length);
  });
});

describe('move cast animations', () => {
  const named = new Set<SpriteAnim>(CAST_ANIMATIONS);

  it('gives every move a preference that cannot run out', () => {
    const moves = getRegisteredMoves();

    expect(moves.length).toBeGreaterThan(0);

    for (const move of moves) {
      const { name, cast } = getMoveData(move);

      // A move with no preference would fall to the same clip as
      // every other move, which is the state this field exists to
      // leave behind
      expect(cast.length, name).toBeGreaterThan(0);

      for (const animation of cast) {
        expect(named.has(animation), `${name}: ${spriteAnimName(animation)}`).toBe(true);
      }

      // The walk is preferred-first and stops at the first clip the
      // sprite has, so the **last** entry has to be one every sheet
      // carries. Anything else is a move that can fall off the end
      expect(
        isCommonCast(cast[cast.length - 1]),
        `${name}: ${cast.map(spriteAnimName).join(' → ')}`,
      ).toBe(true);

      // Asking for the same clip twice is a typo rather than a
      // preference: the second ask can never be reached
      expect(new Set(cast).size, name).toBe(cast.length);
    }
  });

  it('says which clips repeat rather than filling a window', () => {
    // Standing about, walking, shivering, gathering itself: things a
    // pokemon keeps doing. Stretched to a window they play once, in
    // slow motion
    for (const looping of [
      SpriteAnim.Charge,
      SpriteAnim.Sleep,
      SpriteAnim.Hurt,
      SpriteAnim.Walk,
      SpriteAnim.Idle,
      SpriteAnim.Shake,
      SpriteAnim.Dance,
      SpriteAnim.Rotate,
    ]) {
      expect(isLoopingCast(looping), spriteAnimName(looping)).toBe(true);
    }

    // And the gestures, which are fitted to whatever has to be filled
    for (const once of [
      SpriteAnim.Attack,
      SpriteAnim.Shoot,
      SpriteAnim.Strike,
      SpriteAnim.Slice,
      SpriteAnim.Swing,
      SpriteAnim.Double,
      SpriteAnim.Hop,
    ]) {
      expect(isLoopingCast(once), spriteAnimName(once)).toBe(false);
    }
  });

  it('walks the preference against the sprite in hand', () => {
    const punchy = pickCast(
      [SpriteAnim.Punch, SpriteAnim.Uppercut, SpriteAnim.Attack],
      (name) => name !== SpriteAnim.Punch,
    );

    // The first clip this sheet actually has, not the first named
    expect(pickCast([SpriteAnim.Punch, SpriteAnim.Uppercut, SpriteAnim.Attack], () => true)).toBe(
      SpriteAnim.Punch,
    );
    expect(punchy).toBe(SpriteAnim.Uppercut);
    expect(
      pickCast(
        [SpriteAnim.Punch, SpriteAnim.Uppercut, SpriteAnim.Attack],
        (name) => name === SpriteAnim.Attack,
      ),
    ).toBe(SpriteAnim.Attack);

    // A sheet with none of the named clips still has to be given
    // something it can play: the common clip every sheet carries
    expect(pickCast([SpriteAnim.Punch, SpriteAnim.Uppercut], (name) => name === DEFAULT_CAST)).toBe(
      DEFAULT_CAST,
    );
    expect(isCommonCast(DEFAULT_CAST)).toBe(true);
    // ...and a sheet missing even that is still told what it should
    // have looked like. It should not happen, since every sheet has
    // the ten, but a sprite is a file on disk and a file can be wrong,
    // and naming the clip is what lets the field stand in for it
    expect(pickCast([SpriteAnim.Punch, SpriteAnim.Uppercut], () => false)).toBe(DEFAULT_CAST);
  });
});

describe('status animations', () => {
  const named = new Set<SpriteAnim>(CAST_ANIMATIONS);

  it('gives every drawn status a preference that cannot run out', () => {
    for (const [status, cast] of STATUS_CAST) {
      expect(cast.length, String(status)).toBeGreaterThan(0);

      for (const animation of cast) {
        expect(named.has(animation), `${status}: ${spriteAnimName(animation)}`).toBe(true);
      }

      // The same rule the move casts follow, for the same reason: the
      // walk stops at the first clip the sheet has, so the last entry
      // has to be one every sheet carries
      expect(
        isCommonCast(cast[cast.length - 1]),
        `${status}: ${cast.map(spriteAnimName).join(' → ')}`,
      ).toBe(true);
      expect(new Set(cast).size, String(status)).toBe(cast.length);
    }

    // A status may be drawn one way only. Two entries for the same one
    // would make the second unreachable
    expect(new Set(STATUS_CAST.map(([status]) => status)).size).toBe(STATUS_CAST.length);
  });

  it('draws what is being done to a pokemon standing about', () => {
    const anySheet = (): boolean => true;

    expect(pickStatusCast((status) => status === Statuses.Sleeping, anySheet)).toBe(
      SpriteAnim.Sleep,
    );
    expect(pickStatusCast((status) => status === Statuses.Dormant, anySheet)).toBe(
      SpriteAnim.Sleep,
    );
    expect(pickStatusCast((status) => status === Statuses.Flinched, anySheet)).toBe(
      SpriteAnim.Hurt,
    );

    // The telling clips are the uncommon ones, so a sheet drawn
    // without them still has to say something: a paralyzed pokemon on
    // a sheet with no Shock and no Shake is drawn hurt
    expect(pickStatusCast((status) => status === Statuses.Paralyzed, anySheet)).toBe(
      SpriteAnim.Shock,
    );
    expect(
      pickStatusCast(
        (status) => status === Statuses.Paralyzed,
        (name) => name === SpriteAnim.Hurt,
      ),
    ).toBe(SpriteAnim.Hurt);

    // Nothing worth drawing is not an animation, it is the absence of
    // one: the caller idles
    expect(pickStatusCast(() => false, anySheet)).toBe(null);
  });

  it('draws the status that decides whether it moves at all', () => {
    // Confused and paralyzed at once is drawn paralyzed: confusion
    // costs a pokemon its aim, paralysis costs it the turn
    expect(
      pickStatusCast(
        (status) => status === Statuses.Confused || status === Statuses.Paralyzed,
        () => true,
      ),
    ).toBe(SpriteAnim.Shock);

    // And a flinch beats everything, because it is the one that is
    // about to end
    expect(
      pickStatusCast(
        (status) => status === Statuses.Flinched || status === Statuses.Sleeping,
        () => true,
      ),
    ).toBe(SpriteAnim.Hurt);
  });
});
