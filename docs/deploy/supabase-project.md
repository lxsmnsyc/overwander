# The Supabase project

Creating the hosted project, and pushing the schema into it.

**Assumes:** nothing yet. This is the first step. You need a Supabase account
and the Supabase CLI on your `PATH`.

## 1. Create the project

Create a project, and note two things while you do:

- **The region.** Every privileged write travels over a direct Postgres
  connection, so the distance between the app's region and the database's is
  paid on every write. Pick one, then point Vercel's functions at the same part
  of the world. See [Vercel](vercel.md).
- **The database password.** It is shown once, and it is half of
  `SUPABASE_DB_URL`.

The project's Postgres major version should be **17**, which is what
[`supabase/config.toml`](../../supabase/config.toml) pins locally. New projects
are already there.

## 2. Push the schema

[`supabase/migrations/`](../../supabase/migrations) is the whole database:
tables, functions, triggers, the row-level security, the grants and what is
published to realtime. Push it before the first deploy. The app has nothing to
talk to until it is there.

```bash
supabase login
supabase link --project-ref <ref>   # the ref is in the project's URL
supabase db push
```

Then check two things in the dashboard's SQL editor:

```sql
select extname from pg_extension where extname = 'pg_cron';
select jobname, schedule from cron.job;
```

**pg_cron** is the one extension the schema needs, and three jobs hang off it:
the fled-encounter sweep, the claim sweep and the encounter sweep. The first
migration creates the extension. If the push fails on that line, enable
`pg_cron` under Database, Extensions and push again.

Migrations are never edited once pushed. A schema change is a new file, pushed
the same way, and nothing on Vercel runs one for you. [Schema
changes](schema-changes.md) is the whole of that loop.

## See also

- [Authentication](authentication.md), the next step
- [Vercel](vercel.md), for the environment variables this project supplies
- [Schema changes](schema-changes.md), for every migration after the first push
- [Running the database locally](../database/local-stack.md)
- [The database](../database.md), for every table and who may touch it
