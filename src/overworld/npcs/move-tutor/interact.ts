import { tutorMove } from '../../../auth/npcs';
import { TUTOR_FEE, getTutorableMoves, tutorRefuses } from '../../../data/overworld/npc';
import { m } from '../../../i18n/paraglide/messages.js';
import type { NpcScript } from '../create';
import giveLesson from '../lessons';

/** The Move Tutor: the reminder's conversation, for a move nothing grows into */
const tutor: NpcScript = async (visit) =>
  giveLesson(visit, {
    fee: TUTOR_FEE,
    verb: m.npc_tutor_action(),
    empty: m.npc_tutor_empty(),
    heading: m.npc_tutor_heading(),
    counted: (count) => m.npc_tutor_count({ count }),
    movesOf: (option) => getTutorableMoves(option.caught.species, option.caught.moves),
    refuses: (option, move) =>
      tutorRefuses(move, option.caught.friendship) ? m.npc_tutor_friendship() : null,
    teach: async (catchId, move, replaces) =>
      tutorMove(visit.snapshot, visit.cell, catchId, move, replaces),
    done: m.npc_tutor_done(),
  });

export default tutor;
