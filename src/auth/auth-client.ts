import { createAuthClient } from 'better-auth/client';
import { passkeyClient } from '@better-auth/passkey/client';
import { twoFactorClient } from 'better-auth/client/plugins';

/**
 * The browser's Better Auth client, talking to this site's own `/api/auth`.
 * The plain client rather than `better-auth/solid`: the app reads only its
 * `$store` atoms, and the Solid hooks import the 1.x store module, which Solid 2
 * no longer has
 */
const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [twoFactorClient(), passkeyClient()],
});

export default authClient;
