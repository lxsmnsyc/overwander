-- Seeing other players on the overworld.
--
-- The world is cut into sectors, and each sector is a private realtime
-- channel named `sight:<generation>:<depth>:<x>:<y>`. A player tracks
-- their presence and broadcasts their walk on the sector they stand in,
-- and listens to every sector within sight. Nothing is stored: these
-- policies only decide who may join the channels.
--
-- Any signed-in player may hear and speak on any sector. Where a
-- trainer stands is already as public as their nickname, and what is
-- said here is only ever drawn. The payload is the sender's own word,
-- including the uid it claims, so nothing that decides anything reads
-- it.

create policy "sight is heard by players"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.topic() like 'sight:%'
    and realtime.messages.extension in ('broadcast', 'presence')
  );

create policy "sight is spoken by players"
  on realtime.messages
  for insert
  to authenticated
  with check (
    realtime.topic() like 'sight:%'
    and realtime.messages.extension in ('broadcast', 'presence')
  );
