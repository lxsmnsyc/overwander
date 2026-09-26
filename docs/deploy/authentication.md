# Authentication

The redirect list, the two OAuth apps, and signing in with a provider on the
local stack.

**Assumes:** the Supabase project exists and the schema is pushed. See [The
Supabase project](supabase-project.md).

## 1. Set the dashboard fields

Under Authentication in the dashboard:

| Setting                     | What to put there                                                       |
| --------------------------- | ------------------------------------------------------------------------ |
| **Site URL**                | The production origin, `https://your-domain`                            |
| **Redirect URLs**           | `https://your-domain/**`, plus a preview pattern if you want previews    |
| **Google**, **GitHub**      | Enabled, with the client id and secret from each provider                |
| **Email sign-ups**          | Off, unless you want them: the form is not drawn on a deployed build     |

Sign-in is redirect-based. The player is sent back to **the page they left**
rather than to a fixed callback route, so the redirect list needs the `/**`
wildcard rather than a bare origin. Vercel's preview deployments each get their
own hostname, so previews need a pattern of their own,
`https://*-<your-team>.vercel.app/**`, or a second Supabase project to point at.

In each provider's own console, the callback is Supabase's, not the site's:

```text
https://<ref>.supabase.co/auth/v1/callback
```

That decides how many OAuth apps you need: **one per Supabase project, not one
per hostname**. The player's browser goes to the provider, the provider returns
to Supabase, and Supabase returns to whatever page the player left. The site's
own origins are therefore configured in the redirect list above and nowhere
else. Production and every preview deployment share one app.

Signing in for the first time creates the profile row through the `auth.users`
trigger. Nothing about that needs configuring.

## 2. GitHub, step by step

**In GitHub.** Settings, Developer settings, OAuth Apps, New OAuth App. It sits
under your account, or under an organisation if the project should belong to
one:

| Field                        | What to put there                          |
| ---------------------------- | ------------------------------------------ |
| Application name             | What the player is asked to authorise      |
| Homepage URL                 | `https://your-domain`                      |
| Authorization callback URL   | `https://<ref>.supabase.co/auth/v1/callback` |

Create it, then **Generate a new client secret**. The secret is shown once.

**In Supabase.** Authentication, Providers, GitHub. Turn it on, paste the client
id and the secret, and save. The callback URL is printed on that same page,
which is the one to copy into GitHub if you are doing this in the other order.

**Then check it.** Sign in on the deployed site. A first sign-in shows GitHub's
authorisation screen once and comes back signed in.

Three things worth knowing about GitHub in particular:

- **The email may be private.** GitHub only hands over an address if the account
  has a verified one, and Supabase asks for the `user:email` scope to reach it.
  An account with no verified address is refused rather than let in without one.
- **The display name is GitHub's `name`, not the login.** An account that has
  left its name blank arrives with none, and the profile trigger writes
  **Trainer** instead. The player renames themselves in the game, so this is a
  starting point rather than a problem.
- **The avatar is ignored.** A trainer is seen as the overworld character they
  earned, so nothing reads the provider's picture.

## 3. Google, step by step

The same shape as GitHub, with more setup. Google wants to know what the app is
before it lets strangers sign in to it.

**In Google Cloud.** Pick a project or make one, then go to the OAuth consent
screen, which newer consoles file under Google Auth Platform:

| Field                   | What to put there                                     |
| ----------------------- | ------------------------------------------------------ |
| User type or audience   | **External**, unless everyone signing in is in one Workspace |
| App name, support email | What the player is shown on the consent screen         |
| Developer contact       | Where Google writes to you about the app               |
| Scopes                  | The default three: `openid`, `email`, `profile`        |

Those scopes are the non-sensitive ones, so nothing here needs Google's
verification review. Asking for more does.

Then Credentials, Create credentials, **OAuth client ID**, application type
**Web application**:

| Field                          | What to put there                            |
| ------------------------------ | -------------------------------------------- |
| Authorised redirect URI        | `https://<ref>.supabase.co/auth/v1/callback` |
| Authorised JavaScript origins  | Nothing. The game uses the redirect flow, not One Tap |

Creating it shows the client id and secret.

**In Supabase.** Authentication, Providers, Google. Turn it on, paste the id and
the secret, save.

**Then publish it.** An app left in **Testing** only admits the accounts listed
as test users, and hands out sessions that expire after seven days. Players then
look like they are being signed out at random. Publishing to Production is a
button on the consent screen, and with only the default scopes it takes effect
immediately.

Google needs less attention afterwards. Every account has a verified address and
the name comes through, so nobody arrives called **Trainer** unless they signed
in with GitHub.

## Signing in with a provider locally

The local stack runs its own auth server, so it needs its own OAuth app: a
second one whose callback is `http://127.0.0.1:54321/auth/v1/callback`. Most of
the time this is not worth doing. A development build draws the email and
password form, which `VITE_EMAIL_SIGN_IN` also turns on anywhere else, and
`pnpm seed` leaves two accounts ready to use.

If you do want it, add the provider to
[`supabase/config.toml`](../../supabase/config.toml) and keep the secret out of
the file:

```toml
[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)"

[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
```

Put the variables in `.env`, and restart the stack with `pnpm db:stop && pnpm db`
so the auth container picks them up. While you are in that file, note that
`site_url` and `additional_redirect_urls` still name port **4321** and the dev
server runs on **3000**. A local sign-in comes back nowhere until one of them is
corrected.

## See also

- [The Supabase project](supabase-project.md), the step before this one
- [Vercel](vercel.md), the step after it
- [Operating the game](operating.md), for what a failed sign-in means
- [Running the database locally](../database/local-stack.md)
