# Deploying the game

The live game is two pieces:

- **The server** runs everything else in Docker on a machine you control: the
  app, its Postgres database, accounts and the live feed. A Cloudflare tunnel is
  the only way in.
- **The sprite host** serves the sprites and sounds, published to Cloudflare
  from `public/` on each release.

A game still on Supabase moves over once, with [Moving off Supabase](deploy/moving-off-supabase.md).

There is no separate API, no queue and no file storage. The world is derived
rather than stored.

If you are only running the game on your own machine, read [Running the database
locally](database/local-stack.md) instead. These pages are about the hosted
pair.

## Before you start

- A **Cloudflare** account, for the tunnel and the sprite host.
- A machine that runs **Docker**, with the repository cloned on it.
- The two OAuth apps. A deployed build signs in with **Google and GitHub**. The
  email and password form is drawn on a development build, and on any build
  whose host sets `VITE_EMAIL_SIGN_IN`.

## The order to do it in

1. **[Authentication](deploy/authentication.md).** Create the Google and GitHub
   OAuth apps.
2. **[The server](deploy/server.md).** Create the tunnel, fill in the
   environment variables, schedule the deploy and backup scripts, deploy, then
   check the four paths. The first start creates the schema.

Two pages cover what comes after the first deploy. [Schema
changes](deploy/schema-changes.md) is the loop for every later release with a
migration in it. [Operating the game](deploy/operating.md) covers running it.

## Contents

| Page                                                 | What it covers                                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [Moving off Supabase](deploy/moving-off-supabase.md) | The one-time move of a live game's data from Supabase to the server's own database                    |
| [Authentication](deploy/authentication.md)           | The redirect list, the GitHub and Google OAuth apps, and signing in locally                           |
| [The server](deploy/server.md)                       | The tunnel, every environment variable, which key is which, the release deploy, first deploy, backups |
| [Schema changes](deploy/schema-changes.md)           | Writing a migration, and the order against a deploy                                                   |
| [Operating the game](deploy/operating.md)            | Admin, what a deployed build will not do, upkeep, and what each failure means                         |
| [Self-hosting](deploy/self-hosting.md)               | Running the whole thing yourself, with none of the three accounts above                               |

If you would rather not have any of those accounts, [Self-hosting](deploy/self-hosting.md)
covers running the database, the auth server and the app on your own machines.

## See also

- [Running the database locally](database/local-stack.md)
- [Security](database/security.md), for what the policies and grants say
- [The database](database.md), for every table and who may touch it
