-- A beaten seat is freed rather than handed over.
--
-- The challenger who wins takes the purse and opens the cell; they
-- then have to sit down on it like anybody else, with whatever their
-- party has left. What they must not face is the trainer they just
-- beat sitting straight back down, so the ousted holder is barred
-- from their own seat for a while.
--
-- The row survives the seat being emptied rather than being deleted:
-- gym_challenges hangs off it, and that is where the retry cooldown
-- and the daily take are kept. Cascading those away on every win
-- would hand every challenger a clean slate.

alter table gym_seats
  alter column holder drop not null,
  alter column snapshot_id drop not null,
  -- Who was just turned out, and when. Together they are the bar; a
  -- seat somebody takes clears both
  add column ousted    uuid references auth.users(id) on delete set null,
  add column freed_at  bigint not null default 0;
