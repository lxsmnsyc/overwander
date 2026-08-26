-- What a gym seat is worth: the winner takes gold off the loser.
--
-- The three columns are the rails rather than the prize. A seat is
-- fought asynchronously, so the holder is not there to stop a
-- challenger coming back all afternoon; `settled_at` paces the
-- retries and the rolling window caps what one challenger can strip
-- off one seat in a day. The purse itself lives where it always did,
-- on profiles.

alter table gym_challenges
  -- When the last challenge on this seat settled, which is what the
  -- cooldown counts from
  add column settled_at bigint not null default 0,
  -- The start of the day this challenger's take is being counted in,
  -- and what they have taken off this seat inside it
  add column window_at  bigint not null default 0,
  add column taken      integer not null default 0;
