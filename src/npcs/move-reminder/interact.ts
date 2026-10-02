import { remindMove } from '../../auth/npcs';
import { REMINDER_FEE, getRecallableMoves } from '../../data/overworld/npc';
import type { NpcScript } from '../create';
import giveLesson from '../lessons';

/** The Move Reminder: a Heart Scale, and a move the pokemon grew past */
const reminder: NpcScript = async (visit) =>
  giveLesson(visit, {
    fee: REMINDER_FEE,
    verb: 'Remind',
    empty: 'You have nothing that has forgotten anything.',
    heading: 'What it has learned and lost',
    counted: 'forgotten',
    movesOf: (option) =>
      getRecallableMoves(option.caught.species, option.caught.level, option.caught.moves),
    teach: async (catchId, move, replaces) =>
      remindMove(visit.snapshot, visit.cell, catchId, move, replaces),
    done: 'A hum, a tap on the head, and it remembers. (−1 Heart Scale)',
  });

export default reminder;
