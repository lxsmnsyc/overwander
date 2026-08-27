-- What a client may write: the profile, and nothing else.
--
-- The stack's own default privileges hand anon and authenticated ALL
-- on every table a migration creates, so the per-table `grant select`
-- lines the later migrations carry never narrowed anything: the
-- privilege was already there. Row level security still refused the
-- writes, but an UPDATE or a DELETE with no policy to match refuses by
-- touching no rows rather than by erroring, so the refusal arrives
-- looking like a write that simply found nothing. Only INSERT raises.
--
-- Taking the privilege away makes the refusal say so, and puts the
-- grants back to saying what the RLS migration always meant them to.
-- Only `profiles` stays writable, on the three columns a player owns;
-- everything else is the server's, written on the direct connection
-- row level security does not apply to.

revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ...and for the tables not written yet, so a new one is closed by
-- default rather than open until somebody remembers
alter default privileges in schema public
  revoke insert, update, delete on tables from anon, authenticated;

grant insert (id, nickname, avatar) on profiles to authenticated;
grant update (nickname, avatar, buddy_id) on profiles to authenticated;
