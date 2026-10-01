-- A raid prize, grunt reward, gift or revived fossil that was caught
-- left its encounter row behind, which now reads as still waiting to
-- be met. Each is matched to its catch by who caught it, where, when
-- and which individual it was. Catching one deletes its row from now on.

delete from encounters e
where e.type in (2, 3, 4, 5, 6, 7)
  and exists (
    select 1 from caught c
    where c.owner = e.player
      and c.type = e.type
      and c.origin_x = e.x
      and c.origin_y = e.y
      and c.origin_timestamp = e.window_at
      and c.individual_value = e.individual_value
  );
