-- The one extension the schema needs: pg_cron drives the fled-encounter
-- sweep. Everything else is stock Postgres.
create extension if not exists pg_cron;
