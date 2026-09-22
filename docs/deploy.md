# Deploying the game

The live game is two services and nothing else:

- **Vercel** runs the app. SolidStart builds through Nitro, which detects Vercel
  on its own and writes the serverless output there.
- **Supabase** is the database, the accounts, the row-level security and the
  realtime stream, in a hosted project rather than the local Docker stack.

Nothing else needs to be stood up. There is no separate API, no queue and no
file storage. The world is derived rather than stored, and the sprites ship in
the build as static files.

If you are only running the game on your own machine, read [Running the database
locally](database/local-stack.md) instead. These pages are about the hosted
pair.

## Before you start

- A **Supabase** account, and the **Supabase CLI** on your `PATH`. The CLI is
  what pushes the schema. The dashboard cannot replay a migration folder.
- A **Vercel** account, and the repository on GitHub, GitLab or Bitbucket.
- The two OAuth apps. A deployed build signs in with **Google and GitHub**. The
  email and password form is drawn on a development build, and on any build
  whose host sets `VITE_EMAIL_SIGN_IN`.

## The order to do it in

1. **[The Supabase project](deploy/supabase-project.md).** Create the project,
   then push `supabase/migrations/` to it.
2. **[Authentication](deploy/authentication.md).** Set the site URL and the
   redirect list, then create the Google and GitHub OAuth apps.
3. **[Vercel](deploy/vercel.md).** Import the repository, fill in the
   environment variables, deploy, then check the four paths.

Do steps 1 and 2 before the first deploy. The app has nothing to talk to until
the schema is pushed, and nobody can sign in until the providers are set up.

Two pages cover what comes after the first deploy. [Schema
changes](deploy/schema-changes.md) is the loop for every later release with a
migration in it. [Operating the game](deploy/operating.md) covers running it.

## Contents

| Page                                              | What it covers                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| [The Supabase project](deploy/supabase-project.md) | Creating the project, the region, and pushing the schema with the CLI         |
| [Authentication](deploy/authentication.md)         | The redirect list, the GitHub and Google OAuth apps, and signing in locally   |
| [Vercel](deploy/vercel.md)                         | The build settings, every environment variable, which key is which, first deploy |
| [Schema changes](deploy/schema-changes.md)         | Writing a migration, pushing it, the order against a deploy, previews         |
| [Operating the game](deploy/operating.md)          | Admin, what a deployed build will not do, upkeep, and what each failure means |
| [Self-hosting](deploy/self-hosting.md)             | Running the whole thing yourself, with none of the three accounts above       |

If you would rather not have any of those accounts, [Self-hosting](deploy/self-hosting.md)
covers running the database, the auth server and the app on your own machines.

## See also

- [Running the database locally](database/local-stack.md)
- [Security](database/security.md), for what the policies and grants say
- [The database](database.md), for every table and who may touch it
