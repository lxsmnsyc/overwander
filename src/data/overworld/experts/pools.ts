import { isGrownSpecies } from '../../biome';
import { Types } from '../../constants/types';
import EggGroups from '../../ids/egg-groups';
import { Species } from '../../ids/species';
import { getRegisteredSpecies, getSpeciesData, isBaseForm } from '../../species';
import { EVERY_LAIR, getLairResidents } from '../lair';
import { EliteMember } from './elite';
import { GYM_LEADER_TYPES, GymLeader } from './gym-leaders';

/**
 * Every expert fields a full 6, whatever their rank; the rank sets
 * the level instead
 */
export const EXPERT_PARTY_SIZE = 6;

/**
 * What counts as an expert's own.
 *
 * A type alone is too narrow for some of them: Kanto has one
 * fully-grown Ghost and one fully-grown Dragon, so Agatha and Lance
 * would each field six of the same pokemon. The wideners are the ones
 * the mainline's own teams are built from. **Kinship** the type table
 * misses, since Lance's Gyarados is a dragon by breeding and nothing
 * else; and the odd pokemon that is simply **theirs**, since Bruno's
 * Onix answers to no rule at all.
 *
 * Every route is still held to the rare band, so `also` cannot smuggle
 * a Magikarp or a Mewtwo onto a team
 */
export interface ExpertPool {
  /** The types that count as theirs; empty for an expert with none */
  types: Types[];
  /** Egg groups that count as theirs besides */
  eggGroups?: EggGroups[];
  /** Named species no rule reaches */
  also?: Species[];
}

/**
 * What each of the Elite Four fields.
 *
 * Each widening is the one their mainline team actually shows. Bruno
 * brings hard ground along with the muscle, Agatha's ghosts keep the
 * company they keep, and Lance's dragons are read off the breeding
 * table rather than the type chart
 */
export const ELITE_MEMBER_POOLS: Record<EliteMember, ExpertPool> = {
  // Slowbro is hers in every game she appears in and there is nothing
  // icy about him, so he is named rather than derived
  [EliteMember.Lorelei]: { types: [Types.Ice], also: [Species.Slowbro] },
  // The Ground half brings the heavy ground with it, and overlaps
  // Brock's rock at Golem and Rhydon, which is right: they are the
  // same pokemon a fighting specialist and a rock specialist would
  // both want. Onix is named, since a Steelix above him puts him
  // below the band the rules read
  [EliteMember.Bruno]: {
    types: [Types.Fighting, Types.Ground],
    also: [Species.Onix],
  },
  // Not the Poison **type**, which in Kanto is Koga's pool exactly
  // and would make her a second Koga. The Amorphous group is what her
  // ghosts have in common, and her Golbat and Arbok are named
  [EliteMember.Agatha]: {
    types: [Types.Ghost],
    eggGroups: [EggGroups.Amorphous],
    also: [Species.Golbat, Species.Arbok],
  },
  // The Dragon egg group is the whole point: it is why a Gyarados
  // stands on a dragon master's team. Aerodactyl is a dragon by
  // neither rule and by every eye, so he is named
  [EliteMember.Lance]: {
    types: [Types.Dragon],
    eggGroups: [EggGroups.Dragon],
    also: [Species.Aerodactyl],
  },
  // Johto's three each field a type wide enough to stand on its own,
  // so none of them needs a widener
  [EliteMember.Will]: { types: [Types.Psychic] },
  [EliteMember.Koga]: { types: [Types.Poison] },
  [EliteMember.Karen]: { types: [Types.Dark] },
  [EliteMember.JohtoBruno]: {
    types: [Types.Fighting, Types.Ground],
    also: [Species.Onix],
  },
  // Hoenn's four field their type and nothing else: each of their
  // mainline teams is that type all the way down, Sableye and Kingdra
  // included, so there is nothing for a widener to reach
  [EliteMember.Sidney]: { types: [Types.Dark] },
  [EliteMember.Phoebe]: { types: [Types.Ghost] },
  [EliteMember.Glacia]: { types: [Types.Ice] },
  [EliteMember.Drake]: { types: [Types.Dragon] },
};

/**
 * The one an elite is remembered for, standing last the way a gym
 * leader's does. Bruno's is his Machamp in both leagues, since Bruno
 * is in both
 */
export const ELITE_MEMBER_SIGNATURES: Record<EliteMember, Species> = {
  [EliteMember.Lorelei]: Species.Lapras,
  [EliteMember.Bruno]: Species.Machamp,
  [EliteMember.Agatha]: Species.Gengar,
  [EliteMember.Lance]: Species.Dragonite,
  [EliteMember.Will]: Species.Xatu,
  [EliteMember.Koga]: Species.Crobat,
  [EliteMember.Karen]: Species.Houndoom,
  [EliteMember.JohtoBruno]: Species.Machamp,
  [EliteMember.Sidney]: Species.Absol,
  [EliteMember.Phoebe]: Species.Dusclops,
  [EliteMember.Glacia]: Species.Walrein,
  [EliteMember.Drake]: Species.Salamence,
};

/**
 * And what a gym leader fields: their own type and nothing more, read
 * off the table above rather than kept twice
 */
export function getGymLeaderPool(leader: GymLeader): ExpertPool {
  return { types: [GYM_LEADER_TYPES[leader]] };
}

/**
 * The one pokemon a leader is remembered for, which stands in their
 * sixth slot however the other five roll. It is the mainline ace,
 * so several of them are below the band the other five are drawn
 * from: Brock's Onix is a middle stage now that a Steelix exists,
 * and he brings it anyway
 */
export const GYM_LEADER_SIGNATURES: Record<GymLeader, Species> = {
  [GymLeader.Brock]: Species.Onix,
  [GymLeader.Misty]: Species.Starmie,
  [GymLeader.LtSurge]: Species.Raichu,
  [GymLeader.Erika]: Species.Vileplume,
  [GymLeader.Koga]: Species.Weezing,
  [GymLeader.Sabrina]: Species.Alakazam,
  [GymLeader.Blaine]: Species.Arcanine,
  [GymLeader.Giovanni]: Species.Rhydon,
  [GymLeader.Falkner]: Species.Pidgeotto,
  [GymLeader.Bugsy]: Species.Scyther,
  [GymLeader.Whitney]: Species.Miltank,
  [GymLeader.Morty]: Species.Gengar,
  [GymLeader.Chuck]: Species.Poliwrath,
  [GymLeader.Jasmine]: Species.Steelix,
  [GymLeader.Pryce]: Species.Piloswine,
  [GymLeader.Clair]: Species.Kingdra,
  [GymLeader.Roxanne]: Species.Nosepass,
  [GymLeader.Brawly]: Species.Hariyama,
  [GymLeader.Wattson]: Species.Manectric,
  [GymLeader.Flannery]: Species.Torkoal,
  [GymLeader.Norman]: Species.Slaking,
  [GymLeader.Winona]: Species.Altaria,
  [GymLeader.Tate]: Species.Solrock,
  [GymLeader.Liza]: Species.Lunatone,
  // The same ace Clair brings, which is the mainline's own doing:
  // two water-and-dragon gyms, one Kingdra between them
  [GymLeader.Juan]: Species.Kingdra,
};

/**
 * The species an expert may field out of a roster: the **rare** band
 * of it, which is the fully-evolved and single-line species, narrowed
 * to what their pool counts as theirs.
 *
 * The band is the whole of what separates them from a duelling
 * trainer: a leader fielding the same Bellsprout a player meets in the
 * grass is a leader nobody remembers beating. It leaves the babies and
 * the legendaries out with the half-grown, which is right for both.
 * A legendary belongs to its raid, and the egg to nothing at all.
 *
 * Which roster is the caller's: an elite fields their own region,
 * a gym leader every region there is
 */
const LAIR_SPECIES = new Set(EVERY_LAIR.flatMap(getLairResidents));

function filterExpertPool(roster: Species[], pool: ExpertPool): Species[] {
  const types = new Set(pool.types);
  const groups = new Set(pool.eggGroups);
  const named = new Set(pool.also);

  return roster.filter((species) => {
    if (species === Species.Egg || LAIR_SPECIES.has(species) || !isBaseForm(species)) {
      return false;
    }
    // Naming beats the band as well as the type rules. Bruno's Onix
    // and Agatha's Golbat are middle stages now that a Steelix and a
    // Crobat exist, and they are still the pokemon those two field
    if (named.has(species)) {
      return true;
    }
    if (!isGrownSpecies(species)) {
      return false;
    }
    // An expert with no specialty takes the band whole
    if (types.size === 0) {
      return true;
    }

    const data = getSpeciesData(species);

    return (
      data.types.some((type) => types.has(type)) ||
      data.eggGroups.some((group) => groups.has(group))
    );
  });
}

/**
 * The five an expert rolls, which is their kind's band from every
 * region rather than the one they are standing in. A gym is a fight
 * about a type, so a steel gym should reach a Steelix wherever the
 * badge is handed out, and Karen's dark has nothing at all in Kanto
 */
export function getWorldExpertPool(pool: ExpertPool): Species[] {
  return filterExpertPool(getRegisteredSpecies(), pool);
}

export function getGymLeaderRoster(leader: GymLeader): Species[] {
  return getWorldExpertPool(getGymLeaderPool(leader));
}

export function getEliteMemberRoster(member: EliteMember): Species[] {
  return getWorldExpertPool(ELITE_MEMBER_POOLS[member]);
}
