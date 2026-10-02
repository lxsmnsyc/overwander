import { isGuarded } from '../auth/caught-record';
import { isEgg } from '../auth/egg';
import type { LearnResult } from '../auth/learn-refusal';
import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type { CatchOption } from '../components/catches/catch-picker';
import { PickCatchForm } from '../components/forms/pick-catch';
import { PickMoveForm } from '../components/forms/pick-move';
import { TeachMoveForm } from '../components/forms/teach-move';
import { scalesHeld } from './shared';
import type { NpcVisit } from './create';

/**
 * The two who sell a move, the reminder and the tutor: one Heart Scale,
 * which pokemon, which move, and then the same teaching a machine asks
 */
export interface Lesson {
  fee: Items;
  verb: string;
  empty: string;
  /** The label over the moves on offer */
  heading: string;
  /** What the count of moves on offer is, on each square */
  counted: string;
  movesOf: (option: CatchOption) => Moves[];
  /** Why a move on offer cannot be taught to this one yet, or null */
  refuses?: (option: CatchOption, move: Moves) => string | null;
  /** The server's teaching, which takes the scale in the same write */
  teach: (catchId: string, move: Moves, replaces: number) => Promise<LearnResult>;
  /** What they say once it took */
  done: string;
}

export default async function giveLesson(visit: NpcVisit, lesson: Lesson): Promise<void> {
  const scales = await visit.carrying(lesson.fee);
  const picked = await visit.form(PickCatchForm, {
    player: visit.player,
    action: 'Next',
    verb: lesson.verb,
    cost: { item: lesson.fee },
    have: scalesHeld(scales),
    empty: lesson.empty,
    filter: (option) =>
      !isEgg(option.caught) && !option.fighting && lesson.movesOf(option).length > 0,
    reason: (option) => (isGuarded(option.caught) ? 'locked' : null),
    note: (option) => `${lesson.movesOf(option).length} ${lesson.counted}`,
  });

  if (picked == null) {
    return;
  }

  const [option] = picked;
  const move = await visit.form(PickMoveForm, {
    moves: lesson.movesOf(option),
    step: lesson.heading,
    action: lesson.verb,
    cost: { item: lesson.fee },
    have: scalesHeld(scales),
    refuses: (offered) => lesson.refuses?.(option, offered) ?? null,
  });

  if (move == null) {
    return;
  }

  const taught = await visit.form(TeachMoveForm, {
    catchId: option.id,
    move,
    cost: 'The Heart Scale',
    price: lesson.fee,
    teach: lesson.teach,
  });

  if (taught == null) {
    return;
  }
  visit.changed();
  await visit.say(lesson.done);
}
