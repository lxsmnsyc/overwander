import { remindMove } from '../../../auth/npcs';
import { REMINDER_FEE, getRecallableMoves } from '../../../data/overworld/npc';
import { m } from '../../../i18n/paraglide/messages.js';
import type { NpcScript } from '../create';
import giveLesson from '../lessons';

/** The Move Reminder: a Heart Scale, and a move the pokemon grew past */
const reminder: NpcScript = async (visit) =>
  giveLesson(visit, {
    fee: REMINDER_FEE,
    verb: m.npc_reminder_action(),
    empty: m.npc_reminder_empty(),
    heading: m.npc_reminder_heading(),
    counted: (count) => m.npc_reminder_count({ count }),
    movesOf: (option) =>
      getRecallableMoves(option.caught.species, option.caught.level, option.caught.moves),
    teach: async (catchId, move, replaces) =>
      remindMove(visit.snapshot, visit.cell, catchId, move, replaces),
    done: m.npc_reminder_done(),
  });

export default reminder;
