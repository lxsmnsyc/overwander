import { isGuarded } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import type { LearnResult } from '../../auth/learn-refusal';
import type { Items } from '../../data/ids/items';
import type { Moves } from '../../data/ids/moves';
import type { CatchOption } from '../../components/catches/catch-picker';
import type { Choice } from '../../components/forms/choice';
import { pickCatchThenForm } from '../../components/forms/pick-catch-then';
import { getMoveData } from '../../data/moves';
import { TeachMoveForm } from '../../components/forms/teach-move';
import { scalesHeld } from './shared';
import type { NpcVisit } from './create';

/**
 * The two who sell a move, the reminder and the tutor: one Heart Scale,
 * which pokemon and which move on one screen, and then the same teaching
 * a machine asks
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

/** The pokemon and the move, asked on one screen */
const LessonForm = pickCatchThenForm<Moves>();

/**
 * One lesson after another until the player steps back: a pokemon has
 * more than one move to learn, and a party more than one pokemon
 */
export default async function giveLesson(visit: NpcVisit, lesson: Lesson): Promise<void> {
  let line: string | undefined;

  for (;;) {
    const taught = await teachOnce(visit, lesson, line);

    if (taught == null) {
      return;
    }
    line = taught;
  }
}

/**
 * One lesson: what they say over the next one once it took, the line
 * that stands when the player backs out of the teaching, or null once
 * they step back altogether
 */
async function teachOnce(
  visit: NpcVisit,
  lesson: Lesson,
  line: string | undefined,
): Promise<string | undefined | null> {
  const scales = await visit.carrying(lesson.fee);
  const picked = await visit.form(
    LessonForm,
    {
      player: visit.player,
      verb: lesson.verb,
      action: lesson.verb,
      cost: { item: lesson.fee },
      have: scalesHeld(scales),
      empty: lesson.empty,
      filter: (option) =>
        !isEgg(option.caught) && !option.fighting && lesson.movesOf(option).length > 0,
      reason: (option) => (isGuarded(option.caught) ? 'locked' : null),
      note: (option) => `${lesson.movesOf(option).length} ${lesson.counted}`,
      step: lesson.heading,
      move: (move) => move,
      choices: (option) => {
        const offered: Choice<Moves>[] = [];

        for (const move of lesson.movesOf(option)) {
          offered.push({
            label: getMoveData(move).name,
            value: move,
            refused: lesson.refuses?.(option, move) ?? null,
          });
        }
        return offered;
      },
    },
    { line },
  );

  if (picked == null) {
    return null;
  }

  const [option, move] = picked;
  // Which move it forgets, or the room it has: the teaching a machine asks too
  const taught = await visit.form(TeachMoveForm, {
    catchId: option.id,
    move,
    cost: 'The Heart Scale',
    price: lesson.fee,
    teach: lesson.teach,
  });

  if (taught == null) {
    return line;
  }
  visit.changed();
  return lesson.done;
}
