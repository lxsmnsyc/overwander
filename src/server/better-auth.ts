import 'server-only';
import { betterAuth } from 'better-auth';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { jwt } from 'better-auth/plugins/jwt';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import EMAIL_SIGN_IN from '../auth/sign-in-options';
import { createProfile } from './profile';

/**
 * Accounts, sessions and sign-in, run by this server with Better Auth.
 * The tables are the app's own (`users`, `sessions`, `identities`,
 * `verifications`, `jwks`), and a user's id is the uuid every game
 * table points at. Server functions trust the short-lived JWT the
 * browser fetches from `/api/auth/token` (see `./auth.ts`)
 */

/** Where the routes are mounted, under the site's own origin */
export const AUTH_PATH = '/api/auth';

function env(name: string): string {
  return process.env[name] ?? '';
}

/** A provider is offered only where both of its credentials are set */
function provider(prefix: string): { clientId: string; clientSecret: string } | undefined {
  const clientId = env(`${prefix}_CLIENT_ID`);
  const clientSecret = env(`${prefix}_CLIENT_SECRET`);

  return clientId === '' || clientSecret === '' ? undefined : { clientId, clientSecret };
}

// The instance's type is Better Auth's own, inferred from these options and too long to write
// oxlint-disable-next-line typescript/explicit-function-return-type
function createAuth() {
  const baseURL = env('BETTER_AUTH_URL');
  const google = provider('GOOGLE');
  const github = provider('GITHUB');

  return betterAuth({
    baseURL: baseURL === '' ? undefined : baseURL,
    basePath: AUTH_PATH,
    secret: env('BETTER_AUTH_SECRET'),
    database: new Pool({ connectionString: env('DATABASE_URL'), max: 5 }),
    advanced: { database: { generateId: 'uuid' } },
    user: {
      modelName: 'users',
      fields: { emailVerified: 'email_verified', createdAt: 'created_at', updatedAt: 'updated_at' },
    },
    session: {
      modelName: 'sessions',
      fields: {
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        userId: 'user_id',
      },
    },
    account: {
      modelName: 'identities',
      fields: {
        accountId: 'account_id',
        providerId: 'provider_id',
        userId: 'user_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    verification: {
      modelName: 'verifications',
      fields: { expiresAt: 'expires_at', createdAt: 'created_at', updatedAt: 'updated_at' },
    },
    emailAndPassword: {
      enabled: EMAIL_SIGN_IN,
      autoSignIn: true,
      password: {
        hash: hashPassword,
        // Accounts brought over from Supabase keep their bcrypt hashes until they change password
        verify: async ({ hash, password }) =>
          hash.startsWith('$2')
            ? bcrypt.compare(password, hash)
            : verifyPassword({ hash, password }),
      },
    },
    socialProviders: {
      ...(google == null ? {} : { google }),
      ...(github == null ? {} : { github }),
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await createProfile(user.id, user.name);
          },
        },
      },
    },
    plugins: [
      jwt({
        jwks: { keyPairConfig: { alg: 'EdDSA', crv: 'Ed25519' } },
        jwt: { expirationTime: '15m' },
        schema: {
          jwks: {
            fields: {
              publicKey: 'public_key',
              privateKey: 'private_key',
              createdAt: 'created_at',
              expiresAt: 'expires_at',
            },
          },
        },
      }),
    ],
  });
}

let instance: ReturnType<typeof createAuth> | null = null;

/** The one Better Auth instance, made on first use so the environment is read at run time */
export default function getAuth(): ReturnType<typeof createAuth> {
  instance ??= createAuth();
  return instance;
}
