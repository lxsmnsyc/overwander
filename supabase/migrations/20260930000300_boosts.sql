-- Boosts: an event's worth of extra reward, without a deploy.
--
-- "Double candy this weekend" is a row here rather than a constant in
-- the code: a reward, the factor it is multiplied by, and the window it
-- runs for, in epoch milliseconds. Two boosts on one reward that
-- overlap do not multiply; the larger one counts.
--
-- Only rewards the server pays are boosted: candy from a catch, a
-- hatching or a fight, and gold from a stop or a raid. What the world
-- rolls (what spawns, how often it sparkles) is derived on the client
-- from the seed, so a boost there would have the two disagreeing about
-- what is standing on a cell.
--
-- Only the server reads it; an event is announced to players through
-- `announcements`.

create table boosts (
  id        bigint generated always as identity primary key,
  reward    text not null check (reward in ('candy', 'gold')),
  factor    numeric not null check (factor >= 1 and factor <= 10),
  starts_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  ends_at   bigint not null,
  check (ends_at > starts_at)
);

create index boosts_running on boosts (reward, ends_at);

alter table boosts enable row level security;
