-- Awards: gym badges, Elite Four marks and champion titles, one row
-- per player per award. Award numbers match the Awards enum in
-- src/data/ids/awards.ts. Anybody signed in may read them -- a
-- profile shows its badges to visitors -- but only the server writes
-- them: an award is a battle outcome, not a client claim.

create table awards (
  player    uuid not null references auth.users(id) on delete cascade,
  award     smallint not null,
  earned_at bigint not null,
  primary key (player, award)
);

alter table awards enable row level security;
create policy read on awards for select to authenticated using (true);
