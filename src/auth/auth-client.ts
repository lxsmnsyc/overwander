import { createAuthClient } from 'better-auth/solid';

/** The browser's Better Auth client, talking to this site's own `/api/auth` */
const authClient = createAuthClient({ basePath: '/api/auth' });

export default authClient;
