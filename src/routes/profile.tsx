import { Title } from '@solidjs/meta';
import { type JSX, Show, createResource, createSignal } from 'solid-js';
import { useAuth } from '../auth/context';
import { type Profile, ensureProfile, saveProfile } from '../auth/profile';

function ProfileForm(props: { uid: string; initial: Profile }): JSX.Element {
  const [nickname, setNickname] = createSignal(props.initial.nickname);
  const [avatar, setAvatar] = createSignal(props.initial.avatar ?? '');
  const [status, setStatus] = createSignal<string | null>(null);

  const save = (): void => {
    setStatus(null);
    saveProfile(props.uid, { nickname: nickname(), avatar: avatar() || null })
      .then(() => setStatus('Saved'))
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <label>
        Nickname
        <input
          value={nickname()}
          onInput={(event) => {
            setNickname(event.currentTarget.value);
          }}
        />
      </label>
      <label>
        Avatar URL
        <input
          value={avatar()}
          onInput={(event) => {
            setAvatar(event.currentTarget.value);
          }}
        />
      </label>
      <Show when={avatar()}>{(url) => <img src={url()} alt="Avatar preview" width={64} />}</Show>
      <button type="submit">Save</button>
      <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
    </form>
  );
}

export default function ProfilePage(): JSX.Element {
  const auth = useAuth();
  // First sight seeds the profile from the auth method's details
  const [profile] = createResource(auth.user, async (user) => ensureProfile(user));

  return (
    <main>
      <Title>Profile - Poketerra</Title>
      <h1>Profile</h1>
      <Show when={auth.user()} fallback={<p>Sign in to edit your profile.</p>}>
        {(user) => (
          <Show when={profile()} fallback={<p>Loading profile…</p>}>
            {(loaded) => <ProfileForm uid={user().uid} initial={loaded()} />}
          </Show>
        )}
      </Show>
    </main>
  );
}
