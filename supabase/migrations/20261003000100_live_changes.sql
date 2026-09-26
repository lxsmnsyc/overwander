-- The live feed the app's own server runs in place of Supabase Realtime.
--
-- Every change to a table the browser follows is sent on `live_changes`,
-- where the server listens and passes it to whoever follows that table.
-- A notification holds at most 8000 bytes, so a row too large goes out
-- with neither side, and every follower of the table reads again.

create function notify_change() returns trigger
language plpgsql as $$
declare
  payload text;
begin
  payload := json_build_object(
    'table', tg_table_name,
    'op', tg_op,
    'new', case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    'old', case when tg_op = 'INSERT' then null else to_jsonb(old) end
  )::text;
  if octet_length(payload) > 7900 then
    payload := json_build_object('table', tg_table_name, 'op', tg_op, 'new', null, 'old', null)::text;
  end if;
  perform pg_notify('live_changes', payload);
  return null;
end;
$$;

create trigger live_changes after insert or update or delete on announcements
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on auctions
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on battles
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on battle_teams
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on profiles
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on raids
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on raid_watchers
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on snapshots
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on teams
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on bag_items
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on bag_candies
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on positions
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on friends
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on blocks
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on friend_requests
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on trades
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on raid_invites
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on duel_invites
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on duels
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on duel_members
  for each row execute function notify_change();

create trigger live_changes after insert or update or delete on duel_catches
  for each row execute function notify_change();
