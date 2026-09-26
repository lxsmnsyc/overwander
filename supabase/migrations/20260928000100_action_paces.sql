-- How fast each player may act, one token bucket per kind of action.
--
-- Every call into the server spends from the player's `any` bucket, and
-- the loops a script would want to run fast (throws, treats, claims and
-- the steps a walk reports) spend from a bucket of their own as well.
-- A bucket refills at `per_ms` tokens a millisecond up to `burst`, so a
-- quick double press passes and a sustained flood does not. The server
-- checks and spends in one statement beside the ban check it already
-- makes, so pacing costs no extra round trip.
--
-- Only the server reads or writes this; browsers get no policy.

create table action_paces (
  player uuid not null references auth.users(id) on delete cascade,
  action text not null,
  at     bigint not null,
  tokens double precision not null,
  burst  double precision not null,
  per_ms double precision not null,
  primary key (player, action)
);

alter table action_paces enable row level security;
