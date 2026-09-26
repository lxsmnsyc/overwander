-- A revision on every catch, so a box can be kept rather than read whole.
--
-- A browser that already holds a box asks only for each catch's id and
-- revision, then reads in full just the catches that are new or whose
-- revision moved. Anything missing from the answer has been released,
-- traded or put in escrow. The revision is raised here rather than by
-- the writers, so no write can forget it: every update of the row
-- raises it, and so does any change to what is embedded with it.

alter table caught add column revision integer not null default 0;

create function raise_caught_revision() returns trigger
language plpgsql
as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;

create trigger raise_revision before update on caught
  for each row execute function raise_caught_revision();

-- Once per statement rather than per row: a moveset is rewritten as a
-- delete and an insert of four rows, and that is two raises, not eight.
-- The empty update is enough, since the trigger above does the raising.
create function raise_revision_from_children() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    update caught set revision = revision
      where id in (select distinct caught_id from gone);
  else
    update caught set revision = revision
      where id in (select distinct caught_id from arrived);
  end if;
  return null;
end;
$$;

create trigger raise_parent_on_insert after insert on caught_moves
  referencing new table as arrived
  for each statement execute function raise_revision_from_children();
create trigger raise_parent_on_update after update on caught_moves
  referencing new table as arrived
  for each statement execute function raise_revision_from_children();
create trigger raise_parent_on_delete after delete on caught_moves
  referencing old table as gone
  for each statement execute function raise_revision_from_children();

create trigger raise_parent_on_insert after insert on caught_abilities
  referencing new table as arrived
  for each statement execute function raise_revision_from_children();
create trigger raise_parent_on_update after update on caught_abilities
  referencing new table as arrived
  for each statement execute function raise_revision_from_children();
create trigger raise_parent_on_delete after delete on caught_abilities
  referencing old table as gone
  for each statement execute function raise_revision_from_children();

create trigger raise_parent_on_insert after insert on caught_items
  referencing new table as arrived
  for each statement execute function raise_revision_from_children();
create trigger raise_parent_on_update after update on caught_items
  referencing new table as arrived
  for each statement execute function raise_revision_from_children();
create trigger raise_parent_on_delete after delete on caught_items
  referencing old table as gone
  for each statement execute function raise_revision_from_children();

-- History is append-only, so an insert is the only change it has
create trigger raise_parent_on_insert after insert on caught_history
  referencing new table as arrived
  for each statement execute function raise_revision_from_children();
