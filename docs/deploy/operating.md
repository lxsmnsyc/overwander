# Operating the game

Making yourself an admin, what a deployed build will not do, the upkeep, and
what each failure means.

**Assumes:** the site is deployed and players can sign in. See
[The server](server.md).

## Making yourself an admin

A development build hands every new account the `admin` role. That grant is
behind `import.meta.env.DEV`, so it is not merely skipped in a deployed build,
it is not in the bundle. Grant it by hand once, in the SQL editor:

```sql
update profiles set role = 'admin' where id = '<your uid>';
```

Your uid is the account's id under Authentication, Users. What each role may do
is in [Security](../database/security.md).

## What does not work on a deployed build, by design

- **The sprite tools.** The sprite processor at `/sprite-processor` writes
  finished sheets into `public/`, which is only ever right on a machine where
  `public/` is the working tree. A deployed server serves those files out of a
  bundle, so the write is refused rather than attempted. It is behind no
  sign-in. On the machine it works on, the person at the keyboard owns those
  files already, so the refusal is the whole guard.

## Optional features

Three features are off by default, so a small self-hosted server keeps no rows
and makes no promises it does not want. Each is a server environment variable,
on only when it is exactly `1` or `true` and read on every call, so turning one
on or off takes a redeploy of the variables and nothing else. What was already
written stays when one is turned off.

| Variable         | What it does                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `ECONOMY_LEDGER` | Keeps `ledger`: every change to gold, an item or a candy stack, swept at 60 days                        |
| `RELEASE_GRACE`  | Holds a release for a day, when it can be taken back for the candy it paid, before the sweep deletes it |
| `STAFF_LOG`      | Keeps `staff_actions`: every role set, ban, gift and teleport, who did it, and when                     |

Read the two records in the dashboard's table editor; players never can.

## Keeping it running

- **Migrations run as the server starts.** A release with a migration in it is
  one deploy. See [Schema changes](schema-changes.md).
- **Backups are yours.** The world needs none, since it is derived, but every
  catch, bag, auction and friendship is a row. See [Backups](server.md#6-backups).
- **The clock is the server's.** `src/server/*` runs in UTC deliberately, and
  `src/server/timezone.ts` pins it, so nothing needs setting for it.

## Telling everybody something

Add a row to `announcements` in the dashboard's table editor: a `message` of up
to 280 characters and an `ends_at` in epoch milliseconds. `starts_at` defaults
to now, so leave it empty to show the line at once or set it to schedule one.
Every open tab shows it as a banner straight away, the sign-in screen included,
and each player can put it away on their own device. Rows a month past their end
are swept.

Maintenance in ten minutes, for an hour from now:

```sql
insert into announcements (message, ends_at)
values ('The game closes for maintenance in ten minutes.',
        (extract(epoch from now()) * 1000)::bigint + 3600000);
```

## When something is wrong

**The server keeps restarting.** A migration failed, or the database is not up.
`docker compose logs app` names the failing statement, and
`docker compose ps` shows whether `db` is healthy.

**Sign-in loops back signed out.** `BETTER_AUTH_URL` is not the origin players
open, so the session cookie is set for another site.

**"Not signed in" on every server call, with a valid session.** The server
cannot read its signing keys from the `jwks` table. Check that the `db`
container is healthy.

**Connections exhausted, or timeouts under load.** The server holds at most ten
connections, five more for accounts, and one for the live feed. Postgres allows
a hundred by default.

**A player's screen never updates until reload.** The live feed is not reaching
them. Check the tunnel passes WebSockets (it does unless a Cloudflare rule turns
them off), and that `select count(*) from pg_trigger where tgname = 'live_changes'`
is 21.

## Running an event

Add a row to `boosts` in the dashboard: a `reward` (`candy` or `gold`), a
`factor` from 1 to 10, and an `ends_at` in epoch milliseconds. `starts_at`
defaults to now. Candy covers catches, hatchings and fights; gold covers stops
and raids. Two boosts on one reward that overlap do not multiply: the larger one
counts. Each server instance rereads the table once a minute, so a boost starts
and stops within a minute of its stamps.

Double candy for the weekend, starting now:

```sql
insert into boosts (reward, factor, ends_at)
values ('candy', 2, (extract(epoch from now()) * 1000)::bigint + 2 * 86400000);
```

Only what the server pays can be boosted. What spawns and how often it sparkles
is rolled on the client from the world seed, so a boost there would have the two
disagreeing. Players are not told about a boost by itself; announce it.

A boost is deleted a day after it ends, by an hourly `pg_cron` job
(`sweep-old-boosts`), so there is nothing to tidy up by hand.

## See also

- [The server](server.md), for the variables named above
- [Authentication](authentication.md), for the redirect list a failed sign-in
  points at
- [Schema changes](schema-changes.md), for the push a partial schema needs
- [Security](../database/security.md), for what each role may do
- [Running the database locally](../database/local-stack.md)
