# Authentication

Accounts are run by the game's own server with [Better Auth](https://better-auth.com).
This page covers its settings, the two OAuth apps, and signing in locally.

**Assumes:** nothing yet. This is the first step.

## 1. The server's settings

Set these in the server's `.env`. `.env.example` documents each one.

| Variable                                   | What to put there                                                     |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                       | A long random string, such as the output of `openssl rand -base64 32` |
| `BETTER_AUTH_URL`                          | The production origin, `https://your-domain`                          |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | From the Google OAuth client (step 3)                                 |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | From the GitHub OAuth app (step 2)                                    |

- Changing `BETTER_AUTH_SECRET` signs every player out.
- A provider works only when both of its values are set.
- The routes live under `/api/auth` on the site itself. Each provider's callback is
  `https://your-domain/api/auth/callback/<provider>`.
- Sign-in sends the player back to the page they left.
- The email and password form is drawn only on a development build, or where
  `VITE_EMAIL_SIGN_IN` is `1` or `true`. The server refuses email sign-ups
  everywhere else.

A first sign-in creates the account and its profile. The profile takes the
provider's name, or **Trainer** when there is none.

## 2. GitHub

**In GitHub.** Settings, Developer settings, OAuth Apps, New OAuth App:

| Field                      | What to put there                              |
| -------------------------- | ---------------------------------------------- |
| Application name           | What the player is asked to authorise          |
| Homepage URL               | `https://your-domain`                          |
| Authorization callback URL | `https://your-domain/api/auth/callback/github` |

Create it, then **Generate a new client secret**. The secret is shown once. Put
the id and the secret in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

Things to know about GitHub:

- An account with no verified email address is refused.
- The name is GitHub's `name`, not the login. An account with a blank name
  arrives as **Trainer**, and the player can rename themselves in the game.
- The avatar is ignored. A trainer is seen as the overworld character they earned.

## 3. Google

**In Google Cloud.** Set up the OAuth consent screen first:

| Field                   | What to put there                                            |
| ----------------------- | ------------------------------------------------------------ |
| User type or audience   | **External**, unless everyone signing in is in one Workspace |
| App name, support email | What the player is shown on the consent screen               |
| Scopes                  | The default three: `openid`, `email`, `profile`              |

Then Credentials, Create credentials, **OAuth client ID**, type **Web application**:

| Field                         | What to put there                              |
| ----------------------------- | ---------------------------------------------- |
| Authorised redirect URI       | `https://your-domain/api/auth/callback/google` |
| Authorised JavaScript origins | Nothing                                        |

Put the id and the secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

**Publish the app.** An app left in **Testing** only admits its listed test
users, and its sessions expire after seven days. Publishing is a button on the
consent screen, and with the default scopes it takes effect at once.

## Moving from Supabase Auth

Migration `20261003000200_accounts.sql` copies every account into the new
tables with the same id. It also copies each Google and GitHub link, and each
password hash. Players sign in exactly as before.

Only the OAuth callbacks change, because Supabase's callback is replaced by the
site's own:

- **Google.** Add `https://your-domain/api/auth/callback/google` to the existing
  client's redirect URIs, beside Supabase's. Both work until the new build is live.
- **GitHub.** An OAuth app holds one callback, so make a second app for the new
  server. Accounts are matched by the player's GitHub user id, which is the same
  under every app.

## Signing in with a provider locally

Most of the time this is not needed. A development build draws the email and
password form, and `pnpm seed` makes two accounts ready to use.

To sign in with a provider anyway, make a separate OAuth app whose callback is
`http://localhost:3000/api/auth/callback/<provider>`. Put its id and secret in
`.env` and restart `pnpm dev`.

## See also

- [The server](server.md), the step after it
- [Operating the game](operating.md), for what a failed sign-in means
