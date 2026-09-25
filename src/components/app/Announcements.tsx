import { For, type JSX, createSignal, onCleanup, onMount } from 'solid-js';
import { type Announcement, liveAnnouncements, watchAnnouncements } from '../../auth/announcements';
import { serverNow } from '../../auth/clock';
import { CloseIcon } from '../icons';
import watchLive from './watch';

/** Where the announcements a player has put away are remembered */
const DISMISSED_KEY = 'dismissed-announcements';

/** How often the banner checks whether one has started or ended */
const RECHECK_PACE = 30_000;

function readDismissed(): Set<number> {
  try {
    const held: unknown = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]');
    const dismissed = new Set<number>();

    if (Array.isArray(held)) {
      for (const id of held) {
        if (typeof id === 'number') {
          dismissed.add(id);
        }
      }
    }
    return dismissed;
  } catch {
    // Storage that cannot be read shows everything again, which is the safe side
    return new Set();
  }
}

function writeDismissed(dismissed: ReadonlySet<number>): void {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
  } catch {
    // Put away for this visit only
  }
}

/**
 * What the game is saying to everybody, over whatever is on screen. A
 * player may put one away, and it stays away on this device; a new one
 * shows however many were put away before it
 */
export default function Announcements(): JSX.Element {
  const announcements = watchLive<Announcement[]>((set) => watchAnnouncements(serverNow, set));
  const [now, setNow] = createSignal(0);
  const [dismissed, setDismissed] = createSignal<ReadonlySet<number>>(new Set());

  onMount(() => {
    setDismissed(readDismissed());
    setNow(serverNow());

    const timer = setInterval(() => {
      setNow(serverNow());
    }, RECHECK_PACE);

    onCleanup(() => {
      clearInterval(timer);
    });
  });

  const dismiss = (id: number): void => {
    const next = new Set(dismissed());

    next.add(id);
    setDismissed(next);
    writeDismissed(next);
  };

  return (
    <div
      class="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-2 px-4"
      role="status"
    >
      <For each={liveAnnouncements(announcements() ?? [], now(), dismissed())}>
        {(announcement) => (
          <div
            class="pointer-events-auto flex max-w-xl items-start gap-2 rounded-xl border-2
              border-gold bg-gold-soft px-3 py-2 text-sm font-bold text-ink shadow-pop"
          >
            <span class="min-w-0 flex-1 break-words">{announcement.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              class="inline-flex shrink-0 cursor-pointer items-center rounded-full border-0
                bg-transparent p-0.5 text-ink shadow-none hover:text-gold"
              onClick={() => {
                dismiss(announcement.id);
              }}
            >
              <CloseIcon class="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
