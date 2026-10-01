# Authentication

Accounts are run by the game's own server with [Better Auth](https://better-auth.com).
Players sign in with an email and a password, or a passkey. Google and GitHub are
optional. This page covers the settings, password links, two-factor and passkeys,
the two OAuth apps, and signing in locally.

**Assumes:** nothing yet. This is the first step.

## 1. The server's settings

Set these in the server's `.env`. `.env.example` documents each one.

| Variable                                   | What to put there                                                     |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                       | A long random string, such as the output of `openssl rand -base64 32` |
| `BETTER_AUTH_URL`                          | The production origin, `https://your-domain`                          |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional. From the Google OAuth client (step 3)                       |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Optional. From the GitHub OAuth app (step 2)                          |

- Changing `BETTER_AUTH_SECRET` signs every player out.
- The email and password form is always offered.
- A provider's button appears only when both of its values are set. Leave both
  empty to turn that provider off. A restart is enough, with no new build.
- Passkeys belong to the host in `BETTER_AUTH_URL`. Changing the domain means
  every player adds their passkeys again.
- The routes live under `/api/auth` on the site itself. Each provider's callback is
  `https://your-domain/api/auth/callback/<provider>`.
- Sign-in sends the player back to the page they left.
  A first sign-in creates the account and its profile. The profile takes the
  provider's name, or **Trainer** when there is none.

## Password links

The game sends no email, so a player who needs a password gets a link from
staff. It is how players who used to sign in with Google or GitHub move to a
password: the link adds one to the account they already have, and nothing else
about the account changes.

- **From the dashboard.** Open the player under Players, then **Make a password
  link** and copy it. Only admins and the owner see this, and only for accounts
  ranked below their own. Each link is recorded in the staff log.
- **From the server,** for an account nobody ranks above, such as the owner's:

  ```bash
  pnpm password-link <email or nickname>
  ```

  It reads `.env`, so it reaches production.

A link opens `/reset-password`, works once, and lasts 7 days. A new link for the
same account replaces the old one. The player then signs in with the account's
email and the new password. The email is shown on the player's admin page.

## Two-factor and passkeys

Both are under Settings, **Security**. The section asks for the account's
password first, and for 15 minutes after that the server accepts changes to
either. An account without a password needs a password link before it can use
them.

- **Authenticator app.** Setting it up shows a QR code and ten backup codes.
  From then on, a password sign-in also asks for the app's code, or one backup
  code. A device can be trusted for 30 days.
- **Passkeys.** Each one signs in by itself, with no password or code.

A player who loses both their authenticator app and their backup codes can't
sign in with a password. Remove their `two_factors` row and set
`two_factor_enabled` to false on their `users` row, then give them a password
link.

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

## Signing in with a provider locally

Most of the time this is not needed. `pnpm seed` makes two accounts that sign in
with the email and password form.

To sign in with a provider anyway, make a separate OAuth app whose callback is
`http://localhost:3000/api/auth/callback/<provider>`. Put its id and secret in
`.env.development.local` and restart `pnpm dev`.

## See also

- [The server](server.md), the step after it
- [Operating the game](operating.md), for what a failed sign-in means
