# Operating the game

Making yourself an admin, what a deployed build will not do, the upkeep, and
what each failure means.

**Assumes:** the site is deployed and players can sign in. See
[Vercel](vercel.md).

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
- **The email and password form.** Off unless `VITE_EMAIL_SIGN_IN` is `1` or
  `true`. A development build draws it either way, which is what the browser
  tests sign in with.

## Keeping it running

- **Push migrations before deploying**, always in that order. A build that
  reaches a database missing a table fails at the first read of it rather than
  at start-up, which is a worse place to find out.
- **Free-tier projects pause** after a week of no activity, and a paused project
  answers nothing. A game nobody is playing goes quiet on its own.
- **Backups are the database's.** The world needs none, since it is derived, but
  every catch, bag, auction and friendship is a row.
- **The clock is the server's.** `src/server/*` runs in UTC deliberately, and
  Vercel's functions already do, so nothing needs setting for it.

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

**Every write fails, reads are fine.** `SUPABASE_DB_URL` is unset or wrong. The
game is built to read without it and refuse every write, which looks like a
permissions problem and is not.

**`SUPABASE_DB_URL is not set` in the function logs.** The variable is missing
from that environment. Preview and production are configured separately.

**Sign-in loops back signed out.** The origin is not on the redirect list, or is
there without `/**`. Preview hostnames change per deployment and need a pattern.

**"Not signed in" on every server call, with a valid session.** The server
cannot verify the token. Check that `SUPABASE_URL` names the same project the
browser is signed in to, and that `SUPABASE_JWT_SECRET` is empty rather than
holding a local stack's secret.

**Connections exhausted, or timeouts under load.** The direct connection is
being used instead of the pooler. It is port 6543, transaction mode.

**Looking a player up by email refuses, everything else works.**
`SUPABASE_SERVICE_ROLE_KEY` is unset. Only the auth admin calls need it.

**A player's screen never updates until reload.** Realtime is not reaching them.
The publication is created by the migrations, so the usual cause is a schema
pushed only in part.

## See also

- [Vercel](vercel.md), for the variables named above
- [Authentication](authentication.md), for the redirect list a failed sign-in
  points at
- [Schema changes](schema-changes.md), for the push a partial schema needs
- [Security](../database/security.md), for what each role may do
- [Running the database locally](../database/local-stack.md)
