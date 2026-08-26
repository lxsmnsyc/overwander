import { AWARD_NAMES } from '../../../data/ids/awards';
import { CHAMPION_NAME, ELITE_MEMBER_NAMES, EliteMember, GYM_LEADER_BADGES, GYM_LEADER_NAMES, GymLeader } from '../../../data/overworld/experts';
import Landmark from '../../../data/overworld/landmark';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import { CHAMPION_PARTY_LEVEL, ELITE_PARTY_LEVEL, GYM_PARTY_LEVEL } from '../../../overworld/rocket';
import type { ExpertChallenge } from '../RocketStopDialog';

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
};

const ELITE_QUOTES: Record<EliteMember, string> = {
  [EliteMember.Lorelei]: 'Ice has no mercy. Neither do I.',
  [EliteMember.Bruno]: 'We will grind you down with our superior power! Hoo hah!',
  [EliteMember.Agatha]: 'You want to see real ghosts, child? Look closely.',
  [EliteMember.Lance]: 'My dragons know no weakness. Prove me wrong.',
};

/**
 * The named challenger a fighting landmark stages, or null for the
 * rank and file. The name, the level and the stakes are the dialog's
 * copy; who actually stands there is the chunk's own fixture
 */
export default function expertOf(
  snapshot: ChunkSnapshot,
  landmark: Landmark,
  cell: number,
): ExpertChallenge | null {
  if (landmark === Landmark.GymLeader) {
    const leader = snapshot.getGymLeader(cell);

    if (leader == null) {
      return null;
    }

    const name = GYM_LEADER_NAMES[leader];
    const badge = AWARD_NAMES[GYM_LEADER_BADGES[leader]];

    return {
      name,
      level: GYM_PARTY_LEVEL,
      greeting: `${name} takes the challenge. “${GYM_LEADER_QUOTES[leader]}”`,
      stakes: `6 of their best at level ${GYM_PARTY_LEVEL} against as many as you bring. Win and
        the purse is yours, and the ${badge} with it if you do not hold it yet. Lose and you
        lose nothing but the fight.`,
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
      level: ELITE_PARTY_LEVEL,
      greeting: `${name} of the Elite Four rises. “${ELITE_QUOTES[member]}”`,
      stakes: `6 at level ${ELITE_PARTY_LEVEL} against as many as you bring. Win and the purse
        is yours; beat all 4 of the Elite Four and the Champion will see you. Lose and you
        lose nothing but the fight.`,
    };
  }
  if (landmark === Landmark.Champion) {
    return {
      name: CHAMPION_NAME,
      level: CHAMPION_PARTY_LEVEL,
      greeting: `${CHAMPION_NAME} says nothing. He reaches for a ball.`,
      stakes: `6 at level ${CHAMPION_PARTY_LEVEL} against as many as you bring. Win and the
        title of Kanto Champion is yours, with a purse to match. Lose and you lose nothing
        but the fight.`,
    };
  }
  return null;
}
