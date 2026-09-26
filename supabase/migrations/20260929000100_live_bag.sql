-- The bag, told to its owner as it changes.
--
-- Every screen that shows the bag used to read it whole, again after
-- every action. The browser now reads it once and keeps it, and these
-- triggers tell it what changed: each write to `bag_items` or
-- `bag_candies` is broadcast on the private channel `bag:<uid>` of the
-- player it belongs to, carrying the row as it now stands, or the row
-- that went for a stack spent to its last.
--
-- Broadcast rather than `postgres_changes`, for the delete: a delete
-- cannot be filtered on that stream, so every subscriber would be sent
-- every player's emptied stack. A broadcast is addressed to one topic,
-- and only its owner may listen on it.

create function broadcast_bag_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid := case when tg_op = 'DELETE' then old.player else new.player end;
begin
  perform realtime.broadcast_changes(
    'bag:' || owner::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    case when tg_op = 'DELETE' then null else new end,
    case when tg_op = 'INSERT' then null else old end
  );
  return null;
end;
$$;

create trigger bag_items_broadcast
  after insert or update or delete on public.bag_items
  for each row execute function broadcast_bag_change();

create trigger bag_candies_broadcast
  after insert or update or delete on public.bag_candies
  for each row execute function broadcast_bag_change();

-- Only the owner hears their bag, and nobody may speak on it: the
-- triggers write these messages as the table owner
create policy "a bag is heard by its owner"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.topic() = 'bag:' || (select auth.uid())::text
    and realtime.messages.extension = 'broadcast'
  );
