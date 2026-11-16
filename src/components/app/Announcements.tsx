import { For, type JSX, createSignal, onCleanup, onMount } from 'solid-js';
import { type Announcement, liveAnnouncements, watchAnnouncements } from '../../auth/announcements';
import { serverNow } from '../../auth/clock';
import { CloseIcon } from '../icons';
import watchLive from './watch';
import { m } from '../../i18n/paraglide/messages.js';

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
  const announcements = watchLive<Announcement[]>((set) => watchAnnouncements(set));
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
    // aria-live rather than role="status", which app.css draws as a panel even when empty
    <div
      class="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      <For each={liveAnnouncements(announcements() ?? [], now(), dismissed())}>
        {(announcement) => (
          <div
            class="motion-crossfade pointer-events-auto flex max-w-140 items-start gap-2.5
              rounded-[14px] border-2 border-gold bg-gold-soft px-3.5 py-2.5 text-sm font-bold
              text-ink shadow-pop
              animate-[rise-in_var(--motion-base)_var(--ease-spring)_backwards]"
          >
            <span class="min-w-0 flex-1 break-words">{announcement.message}</span>
            <button
              type="button"
              aria-label={m.ui_dismiss()}
              class="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center
                rounded-[9px] border-0 bg-transparent p-0 text-gold-dark shadow-none
                hover:bg-gold/30 hover:text-ink"
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
