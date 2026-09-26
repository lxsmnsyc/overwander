-- A day's grace before a release is final.
--
-- rAthena waits `char_del_delay` before a deleted character is gone,
-- so a slip or a stolen login is not permanent at once. With the
-- server's `RELEASE_GRACE` variable on, a release does the same: the
-- pokemon's owner is cleared, which hides it from every policy and
-- refuses it to every server call the way escrow does, and these
-- columns say who let it go, when, and what candy it paid. Within the
-- day the player can take it back, spending that candy again. Past it,
-- the sweep below deletes the row, and the delete cascades as an
-- immediate release always did.
--
-- An escrowed lot has no owner either, but never a `released_by`,
-- which is what tells the two apart. The sweep runs whether the
-- variable is on or not, since a release made while it was on is
-- still owed its end.

alter table caught
  add column released_by    uuid references auth.users(id) on delete cascade,
  add column released_at    bigint,
  add column released_candy integer;

create index caught_released on caught (released_by, released_at)
  where released_by is not null;

select cron.schedule(
  'sweep-released-catches',
  '17 * * * *',
  $$
  delete from caught
  where released_by is not null
    and released_at < (extract(epoch from now()) * 1000)::bigint - 86400000;
  $$
);
