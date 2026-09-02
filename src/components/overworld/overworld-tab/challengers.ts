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
  getEliteBadges,
} from '../../../data/overworld/experts';
import Landmark from '../../../data/overworld/landmark';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import {
  CHAMPION_PARTY_LEVELS,
  ELITE_PARTY_LEVELS,
  GYM_PARTY_LEVELS,
  type LevelBand,
} from '../../../overworld/rocket';
import {
  TRAINER_NAMES,
  TRAINER_QUOTES,
  TRAINER_TYPES,
  TrainerClass,
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
  [GymLeader.Blue]: 'Smell ya later... after I flatten you, that is.',
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
  [Champion.Red]: 'Kanto',
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

/** What a champion says as the last fight of their league is put */
const CHAMPION_GREETINGS: Record<Champion, string> = {
  [Champion.Red]: 'Red says nothing. He reaches for a ball.',
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
  if (landmark === Landmark.Trainer) {
    const trainer = snapshot.getTrainerClass(cell);

    if (trainer == null) {
      return null;
    }

    const name = TRAINER_NAMES[trainer];
    const levels = trainerLevels(trainer);
    const type = TRAINER_TYPES[trainer];
    const fields =
      trainer === TrainerClass.AceTrainer
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
      stakes: `6 of their best at ${saidLevels(GYM_PARTY_LEVELS)} against as many as you bring.
        Win and the purse is yours, and the ${badge} with it if you do not hold it yet. Lose and
        you lose nothing but the fight.`,
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
      stakes: `6 at ${saidLevels(ELITE_PARTY_LEVELS)} against as many as you bring. Win and the
        purse is yours; beat all 4 of the Elite Four and the Champion will see you. Lose and you
        lose nothing but the fight.`,
    };
  }
  if (landmark === Landmark.Champion) {
    const champion = snapshot.getChampion(cell);

    if (champion == null) {
      return null;
    }

    const name = CHAMPION_NAMES[champion];

    return {
      name,
      levels: CHAMPION_PARTY_LEVELS,
      greeting: CHAMPION_GREETINGS[champion],
      stakes: `Their own six at ${saidLevels(CHAMPION_PARTY_LEVELS)} against as many as you
        bring. Win and the title of ${AWARD_NAMES[CHAMPION_TITLES[champion]]} is yours, with a
        purse to match. Lose and you lose nothing but the fight.`,
    };
  }
  return null;
}
