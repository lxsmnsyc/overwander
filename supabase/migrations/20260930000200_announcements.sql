-- Announcements: a line said to everybody who has the game open.
--
-- Maintenance in ten minutes, an event starting, a part of the game
-- closed while something is fixed. The owner writes a row from the
-- dashboard and every open tab shows it as a banner between
-- `starts_at` and `ends_at`, straight away: the table is on the
-- realtime stream, so nothing has to be reloaded to hear it.
--
-- Readable before signing in too, since "the game is down for
-- maintenance" is most useful to somebody who cannot get in. Only the
-- owner writes it. Rows a month past their end are swept.

create table announcements (
  id        bigint generated always as identity primary key,
  message   text not null check (length(message) between 1 and 280),
  starts_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  ends_at   bigint not null,
  check (ends_at > starts_at)
);

alter table announcements enable row level security;

create policy "announcements are read by everybody"
  on announcements
  for select
  to anon, authenticated
  using (true);

grant select on announcements to anon, authenticated;

alter publication supabase_realtime add table announcements;

select cron.schedule(
  'sweep-old-announcements',
  '23 4 * * *',
  $$
  delete from announcements
  where ends_at < (extract(epoch from now()) * 1000)::bigint - 2592000000;
  $$
);
