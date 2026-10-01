# Schema changes

The server applies every pending file in [`db/migrations/`](../../db/migrations)
as it starts, before it answers a request. A release with a migration in it is
one deploy.

**Assumes:** the server is running. See [The server](server.md).

## 1. Write it locally

See [Changing the schema](../database/local-stack.md#changing-the-schema). Run
`pnpm db:reset` before shipping, since that replays the folder from nothing the
way a new server does.

## 2. Mind which way it cuts

The migration runs as the new build starts. The old build is still serving for
that moment:

| The change                                   | How to ship it                                      |
| -------------------------------------------- | --------------------------------------------------- |
| **Adding** a table, column, index or trigger | In the same release as the code that uses it        |
| **Dropping or renaming** one                 | A release after the one whose code stopped using it |

A rename is therefore two releases. Add the new column and write to both, then
drop the old one in a later release once nothing reads it.

- **There are no down migrations.** A mistake is fixed by a new file.
- **Creating an index locks the table against writes** while it builds. On a large
  table, run `create index concurrently` by hand first. The file's plain
  `create index if not exists` then finds it there.

## 3. Check it landed

```bash
docker compose exec db psql -U postgres -d overwander \
  -c 'select version, applied_at from schema_migrations order by version'
```

A migration that fails stops the server, and `docker compose logs app` names the
statement. Nothing of it was applied, so fix the file and deploy again.

## See also

- [The server](server.md), for the deploy itself
- [Operating the game](operating.md), for what each failure means
