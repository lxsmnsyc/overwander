import { type JSX, type ParentProps, Show, from } from 'solid-js';
import { type Profile, watchProfile } from '../../auth/profile';
import { ListRow, Meta } from '../styled';

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
}

function Face(props: { profile: Profile | null; called: string }): JSX.Element {
  return (
    <Show
      when={props.profile?.avatar}
      fallback={
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed
            border-line bg-line-soft text-sm font-semibold text-muted"
          aria-hidden="true"
        >
          {props.called.slice(0, 1).toUpperCase()}
        </span>
      }
    >
      {(avatar) => (
        <img
          src={avatar()}
          alt=""
          width={32}
          height={32}
          class="size-8 shrink-0 rounded-full border-2 border-tide object-cover"
        />
      )}
    </Show>
  );
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
      <Face profile={profile() ?? null} called={called()} />
      <span class="grow truncate font-semibold">{called()}</span>
      <Show when={props.when != null && (props.since ?? 0) > 0}>
        <Meta>
          {props.when} {new Date(props.since ?? 0).toLocaleDateString()}
        </Meta>
      </Show>
      {props.children}
    </ListRow>
  );
}
