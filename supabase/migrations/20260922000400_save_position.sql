-- Saving a position without the round trip through the app server.
--
-- It is the commonest write in the game, one per pause in every walk,
-- and all it ever was is an upsert of one row. Keyed to `auth.uid()`,
-- a definer function gives what the server gave: a caller writes
-- their own row and nobody else's. The stamp is the database's clock,
-- handed back so a device knows its own write coming around the
-- stream.
--
-- Nothing else that rode the save comes with it. Standing in a biome
-- is what discovers it, and which biome a chunk is is derived from
-- the world seed in code rather than here, so that mark stays with
-- the server and is sent only when the biome changes.
--
-- The bounds are the world's: 4096 chunks across from its middle, 16
-- cells to a chunk, two layers. They are here so a row cannot be
-- written that no walk could reach, not as a claim about the ground:
-- a position is the player's own report of themselves, and nothing
-- in the game trusts it.

create function save_position(
  p_generation smallint,
  p_chunk_x integer,
  p_chunk_y integer,
  p_cell_x smallint,
  p_cell_y smallint,
  p_depth smallint
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player uuid := auth.uid();
  v_now bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  if v_player is null then
    raise exception 'not signed in';
  end if;
  if p_generation not in (1, 2) then
    raise exception 'bad generation';
  end if;
  if p_chunk_x not between -2048 and 2047 or p_chunk_y not between -2048 and 2047 then
    raise exception 'bad chunk';
  end if;
  if p_cell_x not between 0 and 15 or p_cell_y not between 0 and 15 then
    raise exception 'bad cell';
  end if;
  if p_depth not in (0, 1) then
    raise exception 'bad depth';
  end if;

  insert into positions (player, generation, chunk_x, chunk_y, cell_x, cell_y, depth, moved_at)
  values (v_player, p_generation, p_chunk_x, p_chunk_y, p_cell_x, p_cell_y, p_depth, v_now)
  on conflict (player, generation) do update set
    chunk_x = excluded.chunk_x,
    chunk_y = excluded.chunk_y,
    cell_x = excluded.cell_x,
    cell_y = excluded.cell_y,
    depth = excluded.depth,
    moved_at = excluded.moved_at;

  return v_now;
end;
$$;

revoke execute on function save_position from public;
grant execute on function save_position to authenticated;
