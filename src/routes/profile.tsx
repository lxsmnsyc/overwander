import { Title } from '@solidjs/meta';
import { type JSX, Show, createResource, createSignal } from 'solid-js';
import { useAuth } from '../auth/context';
import { type Profile, ensureProfile, saveProfile } from '../auth/profile';
import { Button, Card, Field, Note, Row, Status } from '../components/styled';

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
      class="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Field stacked label="Nickname">
        <input
          value={nickname()}
          onInput={(event) => {
            setNickname(event.currentTarget.value);
          }}
        />
      </Field>
      <Field stacked label="Avatar URL">
        <input
          value={avatar()}
          onInput={(event) => {
            setAvatar(event.currentTarget.value);
          }}
        />
      </Field>
      <Show when={avatar()}>
        {(url) => (
          <img
            src={url()}
            alt="Avatar preview"
            width={64}
            height={64}
            class="size-16 rounded-full border border-line object-cover"
          />
        )}
      </Show>
      <Row>
        <Button type="submit" tone="primary">
          Save
        </Button>
      </Row>
      <Status message={status()} />
    </form>
  );
}

export default function ProfilePage(): JSX.Element {
  const auth = useAuth();
  // First sight seeds the profile from the auth method's details
  const [profile] = createResource(auth.user, async (user) => ensureProfile(user));

  return (
    <main class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
      <Title>Profile - Poketerra</Title>
      <h1>Profile</h1>
      <Card>
        <Show when={auth.user()} fallback={<Note>Sign in to edit your profile.</Note>}>
          {(user) => (
            <Show when={profile()} fallback={<Note>Loading profile…</Note>}>
              {(loaded) => <ProfileForm uid={user().uid} initial={loaded()} />}
            </Show>
          )}
        </Show>
      </Card>
    </main>
  );
}
