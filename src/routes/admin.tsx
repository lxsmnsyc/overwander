import { A, type RouteSectionProps, useLocation } from '@solidjs/router';
import { type JSX, type ParentProps, Show, from } from 'solid-js';
import { type Profile, watchProfile } from '../auth/profile';
import AdminDialogs from '../components/admin/AdminDialogs';
import AdminShell from '../components/admin/AdminShell';
import { sectionFor } from '../components/admin/sections';
import { StaffProvider } from '../components/admin/staff-context';
import GameProvider from '../components/app/game-context';
import { Card, Note } from '../components/styled';
import { Title } from '@solidjs/meta';
import isStaff, { runsTheGame } from '../auth/staff';
import { useAuth } from '../auth/context';

/**
 * The dashboard, and who is let into it.
 *
 * It is a layout route: every `/admin/*` screen renders inside the
 * shell, and none of them repeats this check. The check itself hides
 * the screen and nothing more — the role is read from the profile,
 * which a browser cannot write, but a browser can still call whatever
 * the screens call, so each of those refuses on its own authority.
 */

/** A refusal or a wait, drawn on its own in the middle of the page */
function Standing(props: ParentProps<{ title: string }>): JSX.Element {
  return (
    <main class="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-16">
      <Card title={props.title}>{props.children}</Card>
    </main>
  );
}

/**
 * The profile is followed rather than read once: a role granted while
 * somebody is sitting on the refusal should open the dashboard under
 * them
 */
/** What a moderator is told where a section is not theirs to open */
const REFUSED = 'This section runs the game itself, and this account keeps order in it.';

function Gate(props: ParentProps<{ uid: string }>): JSX.Element {
  const location = useLocation();

  /**
   * Whether the section standing open is one this role may use. It is
   * read from the path rather than passed down, since a section is
   * opened by navigating to it
   */
  const allowed = (role: string): boolean =>
    sectionFor(location.pathname).runs !== true || runsTheGame(role);

  const profile = from<Profile | null>((set) =>
    watchProfile(props.uid, (record) => {
      set(record);
    }),
  );

  return (
    <Show
      when={profile()}
      fallback={
        <Standing title="Loading">
          <Note>Reading the account…</Note>
        </Standing>
      }
    >
      {(loaded) => (
        <Show
          when={isStaff(loaded().role) && !loaded().banned}
          fallback={
            <Standing title="Not for this account">
              <Note>
                The dashboard is staff only, and this account is{' '}
                {loaded().banned ? 'banned' : 'a player'}. <A href="/">Back to the overworld.</A>
              </Note>
            </Standing>
          }
        >
          {/* The dashboard reuses the game's own panels — the auction
              board, the gift shelf — and those read where the player
              is and open sheets through the game's state, so the
              provider they expect stands here too */}
          <GameProvider>
            <StaffProvider uid={props.uid} role={() => loaded().role}>
              <AdminShell nickname={loaded().nickname}>
                {/* A section a moderator is not offered is a section
                    they cannot open by typing its address either. The
                    server refuses them anyway; this is so the refusal
                    reads as one rather than as a screen whose buttons
                    all fail */}
                <Show when={allowed(loaded().role)} fallback={<Note>{REFUSED}</Note>}>
                  {props.children}
                </Show>
              </AdminShell>
              <AdminDialogs player={props.uid} />
            </StaffProvider>
          </GameProvider>
        </Show>
      )}
    </Show>
  );
}

export default function AdminLayout(props: RouteSectionProps): JSX.Element {
  const auth = useAuth();

  return (
    <>
      <Title>Admin · Overwander</Title>
      <Show
        when={auth.user()}
        fallback={
          <Show
            when={!auth.loading()}
            fallback={
              <Standing title="Loading">
                <Note>Opening the session…</Note>
              </Standing>
            }
          >
            <Standing title="Sign in first">
              <Note>
                The dashboard needs an account. <A href="/">Sign in from the game</A> and come back.
              </Note>
            </Standing>
          </Show>
        }
      >
        {(user) => <Gate uid={user().uid}>{props.children}</Gate>}
      </Show>
    </>
  );
}
