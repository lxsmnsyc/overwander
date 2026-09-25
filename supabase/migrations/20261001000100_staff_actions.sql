-- What staff did, one row per change they made.
--
-- rAthena writes every GM command to `atcommandlog`; this is the same
-- record for the dashboard and the command bar: who acted, on whom,
-- what they did, the particulars, and when. Roles, bans, gifts and
-- teleports are the changes staff can make today.
--
-- Written only while the server's `STAFF_LOG` variable is on, so a
-- server that does not want it has an empty table. Only the server
-- reads or writes it; the owner reads it in the dashboard. Nothing
-- sweeps it: a record of who banned whom is kept.

create table staff_actions (
  id     bigint generated always as identity primary key,
  actor  uuid not null references auth.users(id),
  action text not null,
  target uuid references auth.users(id) on delete set null,
  detail jsonb not null default '{}',
  at     bigint not null
);

create index staff_actions_at on staff_actions (at desc);
create index staff_actions_target on staff_actions (target, at desc) where target is not null;

alter table staff_actions enable row level security;
