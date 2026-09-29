-- A pokemon may know up to 8 moves (SLOT_LIMITS in
-- src/data/constants/slots.ts), but the move rows stopped at slot 6,
-- so teaching the 8th failed the check.

alter table public.caught_moves
  drop constraint caught_moves_slot_check,
  add constraint caught_moves_slot_check check (slot >= 0 and slot <= 7);
