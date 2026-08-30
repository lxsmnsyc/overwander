-- One walk, many devices.
--
-- A player signed in on two screens has two boards writing this row.
-- Streaming it lets each one see a chunk it is not standing in and
-- stand down, rather than the two of them dragging the walk back and
-- forth. The table's read policy is what keeps the stream honest: a
-- socket watching it sees its own row and nobody else's.
alter publication supabase_realtime add table positions;
