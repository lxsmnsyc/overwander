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
- Optionally, the two OAuth apps. Every build signs in with an email and a
  password or a passkey. **Google and GitHub** are offered only where their
  credentials are set.

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

To run it without Cloudflare, see [Without Cloudflare](deploy/server.md#without-cloudflare).

## See also

- [Running the database locally](database/local-stack.md)
- [Security](database/security.md), for who may read and write what
- [The database](database.md), for every table and who may touch it
