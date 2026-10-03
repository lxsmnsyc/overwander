import { tutorMove } from '../../../auth/npcs';
import { TUTOR_FEE, getTutorableMoves, tutorRefuses } from '../../../data/overworld/npc';
import type { NpcScript } from '../create';
import giveLesson from '../lessons';

/** The Move Tutor: the reminder's conversation, for a move nothing grows into */
const tutor: NpcScript = async (visit) =>
  giveLesson(visit, {
    fee: TUTOR_FEE,
    verb: 'Teach',
    empty: 'You have nothing he could teach.',
    heading: 'What he could teach it',
    counted: 'to learn',
    movesOf: (option) => getTutorableMoves(option.caught.species, option.caught.moves),
    refuses: (option, move) =>
      tutorRefuses(move, option.caught.friendship) ? 'Needs max friendship' : null,
    teach: async (catchId, move, replaces) =>
      tutorMove(visit.snapshot, visit.cell, catchId, move, replaces),
    done: 'One lesson, well spent. (−1 Heart Scale)',
  });

export default tutor;
