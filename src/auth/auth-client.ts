import { createAuthClient } from 'better-auth/solid';
import { passkeyClient } from '@better-auth/passkey/client';
import { twoFactorClient } from 'better-auth/client/plugins';

/** The browser's Better Auth client, talking to this site's own `/api/auth` */
const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [twoFactorClient(), passkeyClient()],
});

export default authClient;
