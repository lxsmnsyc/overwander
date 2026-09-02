import { AWARD_NAMES } from '../../../data/ids/awards';
import {
  CHAMPION_HONORS,
  CHAMPION_NAMES,
  CHAMPION_TITLES,
  Champion,
  ELITE_MEMBER_NAMES,
  EliteMember,
  GYM_LEADER_BADGES,
  GYM_LEADER_NAMES,
  GymLeader,
  LEGEND_HONORS,
  LEGEND_NAMES,
  Legend,
  getEliteBadges,
} from '../../../data/overworld/experts';
import Landmark from '../../../data/overworld/landmark';
import Npc, {
  GIOVANNI_HONOR,
  GIOVANNI_NAME,
  NPC_NAMES,
  ROCKET_EXECUTIVE_HONORS,
  ROCKET_EXECUTIVE_NAMES,
  ROCKET_EXECUTIVE_QUOTES,
  ROCKET_GRUNT_HONOR,
} from '../../../data/overworld/npc';
import { RocketRank } from '../../../overworld/chunk-snapshot';
import { NPC_QUOTES } from '../npc-dialog/shared';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import {
  CHAMPION_PARTY_LEVELS,
  ELITE_PARTY_LEVELS,
  GYM_PARTY_LEVELS,
  LEGEND_PARTY_LEVELS,
  type LevelBand,
  rocketPartyLevels,
} from '../../../overworld/rocket';
import {
  TRAINER_NAMES,
  TRAINER_QUOTES,
  TRAINER_TYPES,
  isAceTrainer,
  trainerLevels,
} from '../../../data/overworld/trainers';
import { TYPE_NAMES } from '../../../data/constants/types';
import type { StopChallenge } from '../RocketStopDialog';

/** A band said the way a lineup reads it: "levels 45-65" */
function saidLevels([lowest, highest]: LevelBand): string {
  return `levels ${lowest}-${highest}`;
}

/**
 * What each expert says as the challenge is put. Their quotes live
 * here with the challenge builder rather than in the wanderer's
 * table: an expert is a person, not a role a cell rolls
 */
const GYM_LEADER_QUOTES: Record<GymLeader, string> = {
  [GymLeader.Brock]: 'Rock is solid, kid. Show me you are harder.',
  [GymLeader.Misty]: 'My water pokemon are tougher than they look. So am I.',
  [GymLeader.LtSurge]: 'Ten-hut! Survive my electric barrage and the badge is yours, baby!',
  [GymLeader.Erika]: 'The grass is calm today. Shall we?',
  [GymLeader.Koga]: 'A ninja’s poison works slowly. Your defeat will not.',
  [GymLeader.Sabrina]: 'I foresaw this fight. I did not foresee you winning.',
  [GymLeader.Blaine]: 'My fire burns hot! Bring water. It will not help.',
  [GymLeader.Giovanni]: 'You have interfered for the last time. Kneel before me.',
  [GymLeader.Falkner]: 'My father’s birds are watching. Do not embarrass me in front of them.',
  [GymLeader.Bugsy]: 'I have studied bug pokemon my whole life. You have not.',
  [GymLeader.Whitney]: 'You look tough! But I am tougher, and I am not going to cry about it.',
  [GymLeader.Morty]: 'The ghosts show me things. Right now they are showing me you losing.',
  [GymLeader.Chuck]: 'I train under waterfalls! Your pokemon train under a roof!',
  [GymLeader.Jasmine]: 'Um... I am sorry. My steel pokemon do not go down easily.',
  [GymLeader.Pryce]: 'I have seen ninety winters. You will not last one of them.',
  [GymLeader.Clair]: 'I am the greatest dragon master. Try to prove otherwise.',
};

/** Which league each champion is the top of */
const CHAMPION_LEAGUES: Record<Champion, string> = {
  [Champion.Blue]: 'Kanto',
  [Champion.Lance]: 'Johto',
};

/** Which league each seat belongs to, for the copy that names it */
const ELITE_MEMBER_LEAGUES: Record<EliteMember, string> = {
  [EliteMember.Lorelei]: 'Kanto',
  [EliteMember.Bruno]: 'Kanto',
  [EliteMember.Agatha]: 'Kanto',
  [EliteMember.Lance]: 'Kanto',
  [EliteMember.Will]: 'Johto',
  [EliteMember.Koga]: 'Johto',
  [EliteMember.Karen]: 'Johto',
  [EliteMember.JohtoBruno]: 'Johto',
};

const ELITE_QUOTES: Record<EliteMember, string> = {
  [EliteMember.Lorelei]: 'Ice has no mercy. Neither do I.',
  [EliteMember.Bruno]: 'We will grind you down with our superior power! Hoo hah!',
  [EliteMember.Agatha]: 'You want to see real ghosts, child? Look closely.',
  [EliteMember.Lance]: 'My dragons know no weakness. Prove me wrong.',
  [EliteMember.Will]: 'I have trained all my life for this. I will not lose to you.',
  [EliteMember.Koga]: 'Fufufu! You are already standing in my poison. Shall we begin?',
  [EliteMember.Karen]: 'Strong pokemon. Weak pokemon. Only your favourites matter. Show me yours.',
  [EliteMember.JohtoBruno]: 'I have come back stronger. Feel the fists of Johto!',
};

/** What a legend says, which in the one case there is so far is nothing */
const LEGEND_GREETINGS: Record<Legend, string> = {
  [Legend.Red]: 'Red says nothing. He reaches for a ball.',
};

/** What a champion says as the last fight of their league is put */
const CHAMPION_GREETINGS: Record<Champion, string> = {
  [Champion.Blue]: 'Blue smirks. “I am the Champion here. Smell ya later.”',
  [Champion.Lance]: 'Lance looks you over. “So you made it this far. Show me your best.”',
};

/**
 * What a champion's seat asks to see beaten first, said as the tail
 * of the locked message
 */
export function championGate(champion: Champion): string {
  const league = CHAMPION_LEAGUES[champion];

  return `who have beaten all ${CHAMPION_HONORS[champion].length} of ${league}'s Elite Four`;
}

/**
 * What an elite's seat asks to see, said as the tail of the locked
 * message. Each seat asks for its own league's gyms and no more,
 * Bruno's two included
 */
export function eliteGate(member: EliteMember): string {
  const asked = getEliteBadges(member);

  return `holding all ${asked.length} ${ELITE_MEMBER_LEAGUES[member]} badges`;
}

/**
 * The named challenger a fighting landmark stages, or null for the
 * rank and file — a Team Rocket grunt, whom the dialog names itself.
 * The name, the levels and the stakes are the dialog's copy; who
 * actually stands there is the chunk's roll
 */
export default function challengerOf(
  snapshot: ChunkSnapshot,
  landmark: Landmark,
  cell: number,
): StopChallenge | null {
  if (landmark === Landmark.TeamRocket) {
    const rank = snapshot.getRocketRank(cell);

    if (rank == null) {
      return null;
    }

    const executive = snapshot.getRocketExecutive(cell);
    const levels = rocketPartyLevels(rank);

    if (rank === RocketRank.Giovanni) {
      return {
        name: GIOVANNI_NAME,
        levels,
        greeting: `${GIOVANNI_NAME} himself bars the way. “So you are the one. Show me what you
          have.”`,
        stakes: `Six of his at ${saidLevels(levels)}, each carrying two items and two abilities,
          against as many as you bring. Beat him and he leaves one of the six behind, the
          legendary among them, keeping both its abilities and the room for a second item, along
          with a purse worth the trouble and the mark for ${AWARD_NAMES[GIOVANNI_HONOR]}. Lose and
          you lose nothing but the fight.`,
      };
    }
    if (executive != null) {
      const name = ROCKET_EXECUTIVE_NAMES[executive];

      return {
        name,
        levels,
        greeting: `${name} of Team Rocket blocks the way. “${ROCKET_EXECUTIVE_QUOTES[executive]}”`,
        stakes: `Six of the country's best at ${saidLevels(levels)}, each carrying an item and
          two abilities, against as many as you bring. Win and they drop a purse, one of the six
          with both its abilities, whatever they were carrying, and the mark for
          ${AWARD_NAMES[ROCKET_EXECUTIVE_HONORS[executive]]}. Lose and you lose nothing but the
          fight. They will be here all window.`,
      };
    }

    const name = NPC_NAMES[Npc.RocketGrunt];

    return {
      name,
      levels,
      greeting: `A ${name} blocks the way. “${NPC_QUOTES[Npc.RocketGrunt]}”`,
      stakes: `Six of theirs at ${saidLevels(levels)} against as many as you bring. Win and the
        grunt drops a purse, one of the three they were not fighting with, and the mark for
        ${AWARD_NAMES[ROCKET_GRUNT_HONOR]} if you do not hold it yet. Lose and you lose nothing
        but the fight. They will be here all window.`,
    };
  }
  if (landmark === Landmark.Trainer) {
    const trainer = snapshot.getTrainerClass(cell);

    if (trainer == null) {
      return null;
    }

    const name = TRAINER_NAMES[trainer];
    const levels = trainerLevels(trainer);
    const type = TRAINER_TYPES[trainer];
    const fields = isAceTrainer(trainer)
      ? 'Five fully-grown pokemon of any type'
      : `Their ${TYPE_NAMES[type ?? 0]} pokemon`;

    return {
      name,
      levels,
      greeting: `A ${name} squares up. “${TRAINER_QUOTES[trainer]}”`,
      stakes: `${fields} at ${saidLevels(levels)} against as many as you bring. Win and the purse
        is yours; they keep their pokemon. Lose and you lose nothing but the fight. They will be
        here all window.`,
    };
  }
  if (landmark === Landmark.GymLeader) {
    const leader = snapshot.getGymLeader(cell);

    if (leader == null) {
      return null;
    }

    const name = GYM_LEADER_NAMES[leader];
    const badge = AWARD_NAMES[GYM_LEADER_BADGES[leader]];

    return {
      name,
      levels: GYM_PARTY_LEVELS,
      greeting: `${name} takes the challenge. “${GYM_LEADER_QUOTES[leader]}”`,
      stakes: `6 of their best at ${saidLevels(GYM_PARTY_LEVELS)}, every one of them holding
        something, against as many as you bring. Win and the purse is yours, and the ${badge}
        with it if you do not hold it yet. Lose and you lose nothing but the fight.`,
    };
  }
  if (landmark === Landmark.EliteFour) {
    const member = snapshot.getEliteMember(cell);

    if (member == null) {
      return null;
    }

    const name = ELITE_MEMBER_NAMES[member];

    return {
      name,
      levels: ELITE_PARTY_LEVELS,
      greeting: `${name} of the Elite Four rises. “${ELITE_QUOTES[member]}”`,
      stakes: `6 at ${saidLevels(ELITE_PARTY_LEVELS)}, each carrying an item and two abilities,
        against as many as you bring. Win and the purse is yours, along with something out of
        their own bag; beat all 4 of the Elite Four and the Champion will see you. Lose and you
        lose nothing but the fight.`,
    };
  }
  if (landmark === Landmark.Champion) {
    const legend = snapshot.getLegend(cell);

    if (legend != null) {
      return {
        name: LEGEND_NAMES[legend],
        levels: LEGEND_PARTY_LEVELS,
        greeting: LEGEND_GREETINGS[legend],
        stakes: `Their own six at level ${LEGEND_PARTY_LEVELS[0]}, each carrying three items and
          three abilities, against as many as you bring. No badge is asked for. Win and the mark
          for ${AWARD_NAMES[LEGEND_HONORS[legend]]} is yours, with the largest purse in the game
          and something out of the rarest two bands there are. Lose and you lose nothing but the
          fight.`,
      };
    }

    const champion = snapshot.getChampion(cell);

    if (champion == null) {
      return null;
    }

    const name = CHAMPION_NAMES[champion];

    return {
      name,
      levels: CHAMPION_PARTY_LEVELS,
      greeting: CHAMPION_GREETINGS[champion],
      stakes: `Their own six at ${saidLevels(CHAMPION_PARTY_LEVELS)}, each carrying two items
        and two abilities, against as many as you bring. Win and the title of
        ${AWARD_NAMES[CHAMPION_TITLES[champion]]} is yours, with the largest purse a walk pays
        and something worth keeping besides. Lose and you lose nothing but the fight.`,
    };
  }
  return null;
}
