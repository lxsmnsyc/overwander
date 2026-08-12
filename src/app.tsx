import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { type JSX, Suspense } from 'solid-js';
import AuthProvider from './auth/context';
import registerGameData from './data';
import './app.css';

// Species, moves, items and spawn pools are inert until registered,
// and both the server render and the client hydration need them
registerGameData();

export default function App(): JSX.Element {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <AuthProvider>
            <Title>Poketerra</Title>
            {/* No bar over the top. The game is one page — the world,
                with what the player wants pulled over it — and a nav
                offering to leave it was three links to two pages that
                no longer exist and one that is a demo */}
            <Suspense>{props.children}</Suspense>
          </AuthProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
