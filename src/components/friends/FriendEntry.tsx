import { type JSX, type ParentProps, Show, from } from 'solid-js';
import { type Profile, watchProfile } from '../../auth/profile';
import { ListRow, Meta } from '../styled';
import { PlayerFace } from '../profile/PlayerPlate';

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
  /** What that date means: "Friends since", "Asked" */
  when?: string;
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

    return nickname === '' ? 'Unnamed trainer' : nickname;
  };

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
            aria-label={`${called()}, open their profile`}
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
        <Meta>
          {props.when} {new Date(props.since ?? 0).toLocaleDateString()}
        </Meta>
      </Show>
      {props.children}
    </ListRow>
  );
}
