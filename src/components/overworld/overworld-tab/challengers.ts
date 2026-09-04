import { AWARD_NAMES } from '../../../data/ids/awards';
import {
  CHAMPION_HONORS,
  CHAMPION_NAMES,
  CHAMPION_TITLES,
  Champion,
  ELITE_MEMBER_NAMES,
  EliteMember,
  FRONTIER_BRAIN_NAMES,
  FRONTIER_BRAIN_RULES,
  FRONTIER_BRAIN_SYMBOLS,
  FRONTIER_BRAIN_TITLES,
  FRONTIER_FACILITY_NAMES,
  FRONTIER_RENTAL_OFFER,
  FRONTIER_TEAM_SIZE,
  FRONTIER_TIME_TURNS,
  FrontierBrain,
  FrontierRule,
  GYM_LEADER_BADGES,
  GYM_LEADER_NAMES,
  GymLeader,
  LEGEND_HONORS,
  LEGEND_NAMES,
  Legend,
  PIKE_CURTAINS,
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
  FRONTIER_PARTY_LEVELS,
  GYM_PARTY_LEVELS,
  LEGEND_PARTY_LEVELS,
  type LevelBand,
  rocketPartyLevels,
} from '../../../overworld/rocket';
import {
  TRAINER_NAMES,
  TRAINER_QUOTES,
  TRAINER_TYPES,
  trainerLevels,
} from '../../../data/overworld/trainers';
import { TYPE_NAMES, type Types } from '../../../data/constants/types';
import type { StopChallenge } from '../RocketStopDialog';

/** The types a class fields, said as a list: "Water and Fighting" */
function saidTypes(types: Types[]): string {
  const named = types.map((type) => TYPE_NAMES[type]);

  return named.length < 2
    ? (named[0] ?? '')
    : `${named.slice(0, -1).join(', ')} and ${named.at(-1)}`;
}

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
  [GymLeader.Roxanne]: 'I studied rock pokemon at the academy. Let us see what you studied.',
  [GymLeader.Brawly]: 'I am a big wave in the making! Come and wipe out on me!',
  [GymLeader.Wattson]: 'Wahahaha! My machines run on my pokemon. Mind the shock!',
  [GymLeader.Flannery]: 'My grandfather left me this gym. I intend to keep it hot.',
  [GymLeader.Norman]: 'I am somebody’s father, and I do not go easy on anybody. Come.',
  [GymLeader.Winona]: 'I have flown with birds all my life. You will not touch us.',
  [GymLeader.Tate]: 'My sister knows what I am about to do. Do you?',
  [GymLeader.Liza]: 'My brother and I share one badge. You still have to earn it.',
  [GymLeader.Juan]: 'Water is elegance, and elegance is strength. Observe.',
};

/** Which league each champion is the top of */
const CHAMPION_LEAGUES: Record<Champion, string> = {
  [Champion.Blue]: 'Kanto',
  [Champion.Lance]: 'Johto',
  [Champion.Wallace]: 'Hoenn',
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
  [EliteMember.Sidney]: 'Hoenn',
  [EliteMember.Phoebe]: 'Hoenn',
  [EliteMember.Glacia]: 'Hoenn',
  [EliteMember.Drake]: 'Hoenn',
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
  [EliteMember.Sidney]: 'No hard feelings, right? Let us just enjoy the fight.',
  [EliteMember.Phoebe]: 'I trained with the spirits on Mt. Pyre. They are still with me.',
  [EliteMember.Glacia]: 'I came here for warmth, and my ice only grew fiercer. See it.',
  [EliteMember.Drake]: 'Do you know what it means to fight beside a dragon? Show me.',
};

/** What a legend says, where they say anything at all */
const LEGEND_GREETINGS: Record<Legend, string> = {
  [Legend.Red]: 'Red says nothing. He reaches for a ball.',
  [Legend.Steven]: 'Steven turns a stone over in his hand. “I was hoping for a real fight.”',
};

/** What a champion says as the last fight of their league is put */
const CHAMPION_GREETINGS: Record<Champion, string> = {
  [Champion.Blue]: 'Blue smirks. “I am the Champion here. Smell ya later.”',
  [Champion.Lance]: 'Lance looks you over. “So you made it this far. Show me your best.”',
  [Champion.Wallace]: 'Wallace bows. “Let us make this beautiful, and let us make it brief.”',
};

/**
 * What a champion's seat asks to see beaten first, said as the tail
 * of the locked message
 */
export function championGate(champion: Champion): string {
  const league = CHAMPION_LEAGUES[champion];

  return `who have beaten all ${CHAMPION_HONORS[champion].length} of ${league}'s Elite Four`;
}

/** What a Brain says as the house is entered */
const FRONTIER_GREETINGS: Record<FrontierBrain, string> = {
  [FrontierBrain.Brandon]: 'You came to my pyramid. Leave everything at the door and climb.',
  [FrontierBrain.Greta]: 'The clock is running. Fight like it matters, because it is judged.',
  [FrontierBrain.Lucy]: 'Pick a curtain. What is behind it is not my doing, and I do not care.',
  [FrontierBrain.Noland]:
    'Nothing here is yours and nothing here is mine. Pick three and let us see.',
  [FrontierBrain.Anabel]:
    'No tricks up here. My three against your three. Begin when you are ready.',
  [FrontierBrain.Spenser]:
    'In my palace nobody takes orders. Bring three whose hearts you already know.',
  [FrontierBrain.Tucker]:
    'Show me your three first. The Dome always answers, and the crowd loves an answer.',
};

/**
 * The house rule, said first, because it is the whole of what makes a
 * Frontier fight different from the Champion's. Each ends in a space:
 * the Tower has no rule at all, and its line opens on the party
 * instead of on a gap
 */
const FRONTIER_RULE_TERMS: Record<FrontierRule, string> = {
  [FrontierRule.None]: '',
  [FrontierRule.Bare]: 'Nothing is held: no items on either side. ',
  [FrontierRule.Timed]: `Judged after ${FRONTIER_TIME_TURNS} turns: whoever has more of their
     party left standing takes it. `,
  [FrontierRule.Curtained]: `A curtain is drawn as you walk in, and one room in
     ${PIKE_CURTAINS.length} is kind: your three arrive poisoned, burned, paralysed, asleep, or
     mended. Hers arrive as they are. `,
  [FrontierRule.Rented]: `The house lends both sides: pick 3 of the ${FRONTIER_RENTAL_OFFER} on
     the table and leave your own box alone. Nothing of yours is on the field, so nothing of
     yours comes off it. `,
  [FrontierRule.Natured]: `Nobody fights on orders: every pokemon here picks by its nature, so a
     bold one guards and a brave one swings whatever the field asks for. `,
  [FrontierRule.Countered]: `The house names nobody until you do: his 3 are drawn against yours
     the moment they are frozen, one apiece, so a team that covers everything covers nothing
     here. `,
};

/** What a Brain's house asks to see: the crown of its region */
export function frontierGate(brain: FrontierBrain): string {
  return `holding the title of ${AWARD_NAMES[FRONTIER_BRAIN_TITLES[brain]]}`;
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
    const types = TRAINER_TYPES[trainer];
    const fields =
      types.length === 0
        ? 'Five fully-grown pokemon of any type'
        : `Their ${saidTypes(types)} pokemon`;

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
  if (landmark === Landmark.FrontierBrain) {
    const brain = snapshot.getFrontierBrain(cell);

    if (brain == null) {
      return null;
    }

    const name = FRONTIER_BRAIN_NAMES[brain];
    const [silver, gold] = FRONTIER_BRAIN_SYMBOLS[brain];

    return {
      name,
      levels: FRONTIER_PARTY_LEVELS,
      bring: FRONTIER_TEAM_SIZE,
      rented: FRONTIER_BRAIN_RULES[brain] === FrontierRule.Rented,
      unseen: FRONTIER_BRAIN_RULES[brain] === FrontierRule.Countered,
      greeting: `${name} keeps the ${FRONTIER_FACILITY_NAMES[brain]}.
        “${FRONTIER_GREETINGS[brain]}”`,
      stakes: `${FRONTIER_RULE_TERMS[FRONTIER_BRAIN_RULES[brain]]} Three of theirs at level
        ${FRONTIER_PARTY_LEVELS[0]}, each carrying two items and two abilities, against three of
        yours. Win and the ${AWARD_NAMES[silver]} is yours, with a purse to match the rank. Hold
        it and they bring their second three out next time, which is what the
        ${AWARD_NAMES[gold]} is for. Lose and you lose nothing but the fight.`,
    };
  }
  return null;
}
