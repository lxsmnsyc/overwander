import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { type JSX, Show, Suspense } from 'solid-js';
import AuthProvider, { useAuth } from './auth/context';
import registerGameData from './data';
import './app.css';

// Species, moves, items and spawn pools are inert until registered,
// and both the server render and the client hydration need them
registerGameData();

/**
 * The catches page is player-scoped, so the link only exists once a
 * session resolves and can name the uid
 */
function CatchesLink(): JSX.Element {
  const auth = useAuth();

  return <Show when={auth.user()}>{(user) => <a href={`/${user().uid}/catches`}>Catches</a>}</Show>;
}

export default function App(): JSX.Element {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <AuthProvider>
            <Title>SolidStart - Basic</Title>
            <a href="/">Index</a>
            <a href="/about">About</a>
            <a href="/login">Sign in</a>
            <a href="/profile">Profile</a>
            <CatchesLink />
            <Suspense>{props.children}</Suspense>
          </AuthProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
