import type { JSX } from '@solidjs/web';
import { type ParentProps, Show, children, createMemo, from } from 'solid-js';
import { type Profile, watchProfile } from '../../auth/profile';
import { Pill, type PillTone, RowActions, RowCard, RowText } from '../styled';
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
  /** The line under the name, where it is not a date: "Wants to be friends" */
  line?: string;
  /** What hovering the row says, such as the date a request was made */
  title?: string;
  /** The row's state in one word, in a pill before the buttons */
  pill?: { text: string; tone: PillTone };
}

export default function FriendEntry(props: FriendEntryProps): JSX.Element {
  // Seeded with nothing, so the row draws a stand-in name until the
  // profile lands instead of holding the list
  const profile = createMemo(() =>
    from<Profile | null | undefined>((set) => {
      set(undefined);
      return watchProfile(props.uid, (record) => {
        set(record);
      });
    }),
  );
  /** A name for somebody whose profile is gone, or who never set one */
  const called = (): string => {
    const nickname = profile()?.nickname ?? '';

    return nickname === '' ? m.friends_unnamed() : nickname;
  };
  /** What stands under the name: the line the list gave, else the date said */
  const line = (): string | undefined => {
    if (props.line != null) {
      return props.line;
    }
    return props.when != null && (props.since ?? 0) > 0
      ? props.when(formatDate(props.since ?? 0))
      : undefined;
  };

  const actions = children(() => props.children);
  const text = (): JSX.Element => <RowText name={called()} line={line()} />;

  return (
    <RowCard title={props.title}>
      <Show
        when={props.onOpen}
        fallback={
          <>
            <PlayerFace sprite={profile()?.sprite} size={40} />
            {text()}
          </>
        }
      >
        {(open) => (
          <button
            type="button"
            class="flex min-w-0 grow basis-40 cursor-pointer items-center gap-2.5 rounded-lg
              border-0 bg-transparent p-0 text-left shadow-none transition-colors
              hover:text-tide-dark active:translate-y-0"
            aria-label={m.friends_open_profile({ name: called() })}
            onClick={() => {
              open()();
            }}
          >
            <PlayerFace sprite={profile()?.sprite} size={40} />
            {text()}
          </button>
        )}
      </Show>
      <Show when={props.pill}>{(pill) => <Pill tone={pill().tone}>{pill().text}</Pill>}</Show>
      {/* On a line of their own on a phone, under the name and the date */}
      <Show when={actions.toArray().length > 0}>
        <RowActions>{actions()}</RowActions>
      </Show>
    </RowCard>
  );
}
