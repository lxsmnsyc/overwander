import { type Accessor, createEffect, onCleanup } from 'solid-js';
import { getDueQuests } from '../../auth/quests';

/**
 * Telling a player that something they were doing anyway has come
 * due.
 *
 * Progress is counters the server bumps wherever the play happens, so
 * nothing on the client knows a quest was finished — the board would
 * say so the next time it was opened, which is exactly when a player
 * is not walking. This asks, and says the difference.
 *
 * The first answer after signing in is swallowed: a returning player
 * with four quests standing wants the board, not four toasts. What is
 * announced after that is what crossed while they were looking at
 * something else
 */

/** How often the asking happens while nothing else prompts it */
const SWEEP_INTERVAL = 180_000;

export default function watchDueQuests(
  player: Accessor<string | null>,
  /** Bumped wherever the collection changes, as a reason to look again */
  records: Accessor<number>,
  say: (name: string) => void,
): void {
  const announced = new Set<string>();
  let seeded = false;

  createEffect(() => {
    if (player() == null) {
      return;
    }
    records();

    let cancelled = false;

    const sweep = (): void => {
      getDueQuests()
        .then((due) => {
          if (cancelled) {
            return;
          }
          for (const quest of due) {
            if (!announced.has(quest.key) && seeded) {
              say(quest.name);
            }
            announced.add(quest.key);
          }
          // Something claimed is something that may come due again:
          // a rotating ask keeps its key only for its own window
          for (const key of announced) {
            if (!due.some((quest) => quest.key === key)) {
              announced.delete(key);
            }
          }
          seeded = true;
        })
        .catch(() => {
          // A board nobody could read is not worth interrupting play
          // over; the next sweep asks again
        });
    };

    sweep();

    const timer = setInterval(sweep, SWEEP_INTERVAL);

    onCleanup(() => {
      cancelled = true;
      clearInterval(timer);
    });
  });
}
