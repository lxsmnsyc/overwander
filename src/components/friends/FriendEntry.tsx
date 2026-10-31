import { type JSX, type ParentProps, Show, children, from } from 'solid-js';
import { type Profile, watchProfile } from '../../auth/profile';
import { ListRow, Meta } from '../styled';
import { m } from '../../i18n/paraglide/messages.js';
import { PlayerFace } from '../profile/PlayerPlate';
import { formatDate } from '../../i18n/format';

/**
 * One trainer in a friends list, a request or a block: their face,
 * their name, and whatever buttons the list offers for them.
 *
 * The name is followed rather than passed in. A row holds a uid, and
 * the profile behind it is what a rename changes — a list carrying
 * names of its own would show whatever they were called on the day the
 * friendship was made
 */
export interface FriendEntryProps extends ParentProps {
  uid: string;
  /** When the tie was made or asked, in milliseconds; zero for none */
  since?: number;
  /** The date said with what it means: "Friends since 12 Aug 2026" */
  when?: (date: string) => string;
  /**
   * Open their profile. The face and the name become the way in, so a
   * row that had a View button beside three others is a row with one
   * fewer button and a plate that does what pressing a trainer looks
   * like it should
   */
  onOpen?: () => void;
}

export default function FriendEntry(props: FriendEntryProps): JSX.Element {
  const profile = from<Profile | null>((set) =>
    watchProfile(props.uid, (record) => {
      set(record);
    }),
  );
  /** A name for somebody whose profile is gone, or who never set one */
  const called = (): string => {
    const nickname = profile()?.nickname ?? '';

    return nickname === '' ? m.friends_unnamed() : nickname;
  };

  const actions = children(() => props.children);

  return (
    <ListRow>
      <Show
        when={props.onOpen}
        fallback={
          <>
            <PlayerFace sprite={profile()?.sprite} />
            <span class="grow truncate font-semibold">{called()}</span>
          </>
        }
      >
        {(open) => (
          <button
            type="button"
            class="flex min-w-0 grow cursor-pointer items-center gap-2 rounded-lg border-0
              bg-transparent p-0 text-left shadow-none transition-colors hover:text-tide-dark
              active:translate-y-0"
            aria-label={m.friends_open_profile({ name: called() })}
            onClick={() => {
              open()();
            }}
          >
            <PlayerFace sprite={profile()?.sprite} />
            <span class="min-w-0 grow truncate font-semibold">{called()}</span>
          </button>
        )}
      </Show>
      <Show when={props.when != null && (props.since ?? 0) > 0}>
        <Meta>{props.when?.(formatDate(props.since ?? 0))}</Meta>
      </Show>
      {/* On a line of their own on a phone, under the name and the date */}
      <Show when={actions.toArray().length > 0}>
        <div class="flex basis-full items-center gap-2 sm:basis-auto">{actions()}</div>
      </Show>
    </ListRow>
  );
}
