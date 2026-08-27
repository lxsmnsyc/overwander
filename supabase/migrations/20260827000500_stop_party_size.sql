-- A fighting stop's party outgrew the grunt's three it was written for.
--
-- Giovanni fields six, and so do a gym leader, an Elite Four member and
-- the Champion; a duelling trainer fields up to five. The slot check
-- still described a grunt, so walking up to any of them failed on the
-- insert and the challenge never opened.

alter table rocket_party drop constraint rocket_party_slot_check;
alter table rocket_party add constraint rocket_party_slot_check check (slot between 0 and 5);
