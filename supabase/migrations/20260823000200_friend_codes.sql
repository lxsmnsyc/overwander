-- Friend codes: the shareable handle a player is added by.
--
-- The code replaces the lookup by email address. It is readable only
-- by its owner and resolved through the server, so the codes cannot
-- be scraped off the table; sharing one is the owner's own doing,
-- which is the whole check on who may ask.

create table friend_codes (
  player uuid primary key references auth.users(id) on delete cascade,
  code   text not null unique
);

alter table friend_codes enable row level security;
create policy read on friend_codes for select to authenticated
  using (player = auth.uid());

grant select on friend_codes to authenticated;
grant all on friend_codes to service_role;
