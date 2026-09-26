# Schema changes

Writing a migration, pushing it to a live project, and the order to do that in
against a deploy.

**Assumes:** the site is deployed and the schema has been pushed at least once.
See [The Supabase project](supabase-project.md) and [Vercel](vercel.md).

Nothing on Vercel touches the database. A release with a migration in it is two
deployments, yours and the CLI's, and the order between them is the only part
that can go wrong.

## 1. Write it locally

```bash
supabase migration new gym_seat_freeing   # writes a timestamped empty file
# edit supabase/migrations/<timestamp>_gym_seat_freeing.sql
pnpm db:reset                             # replay everything, including the new one
pnpm test:rules                           # the policies still say what they should
```

`pnpm db:reset` is the real test of a migration. It replays the folder from
nothing, which is what a fresh environment does. A file that only works against
your current database is a file that works once.

A new table needs two things beyond its columns, both easy to forget because the
originals were done in bulk: **its own grants**, and **its own policy** or a
deliberate decision to have none. [Changing the
schema](../database/local-stack.md#changing-the-schema) covers both, and
[Security](../database/security.md) covers what the existing policies say.

If the browser is meant to watch the new table live, it also needs a line in the
realtime publication, and `replica identity full` if the client filters updates
or merges deletes:

```sql
alter publication supabase_realtime add table gym_seats;
alter table gym_seats replica identity full;
```

## 2. See what the project is missing

```bash
supabase migration list        # local files against what the project has applied
supabase db push --dry-run     # exactly what would run
```

`migration list` prints a row per file with a **Local** and a **Remote** column.
Anything with a local version and no remote one is what the next push will
apply, in that order.

## 3. Push it, then deploy

```bash
supabase db push
```

The order depends on which way the change cuts:

| The change                                  | Order                                                |
| ------------------------------------------- | ---------------------------------------------------- |
| **Adding** a table, column, index or policy | **Push, then deploy.** The old code ignores what it does not know about |
| **Dropping or renaming** one                | **Deploy, then push.** The new code stops using it first |

A rename is therefore two releases rather than one. Add the new column and write
to both, deploy, backfill, then drop the old one in a later migration once
nothing reads it. The alternative is a window where the live site is talking to
a schema that no longer has what it asks for, and that window is however long
the Vercel build takes.

Two more things worth knowing before pushing to a live project:

- **There are no down migrations here.** A mistake is fixed by a new file, not by
  reversing an old one. Nothing in this repository has ever needed a rollback,
  which is a reason to keep migrations small rather than a reason to trust them.
- **Creating an index locks the table against writes** while it builds. On a
  table with any size to it, build it with `create index concurrently` from the
  dashboard's SQL editor, and keep the plain `create index` in the migration file
  for the environments that replay from empty.

## 4. Check it landed

In the SQL editor:

```sql
select jobname, schedule from cron.job;    -- if the migration scheduled one
select * from pg_policies where tablename = 'gym_seats';
```

`supabase migration list` should now show the same version on both sides. Then
deploy the app, or let the push be the whole of the release if no code changed.

The app deploys when the Version Packages pull request is merged, not on every
push to `main` (see [Vercel](vercel.md#3-deploy-on-release)). Push an adding
migration before merging that pull request. Push a dropping one after the
release has deployed.

## Preview deployments share whatever they point at

A preview pointed at the production project is talking to the production
database, so a migration pushed to try something out is pushed to the live game.
Give previews their own Supabase project if you expect to be pushing
half-finished schema at them, and their own environment variables to match.

## See also

- [The Supabase project](supabase-project.md), for the first push
- [Vercel](vercel.md), for the environment a preview needs
- [Operating the game](operating.md), for what each failure means
- [Changing the schema](../database/local-stack.md#changing-the-schema), for
  grants and policies on a new table
- [Security](../database/security.md), for what the existing policies say
