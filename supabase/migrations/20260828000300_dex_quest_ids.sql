-- The pokedex quests are generated per region now, so they carry
-- generated ids: DEX_QUEST_BASE + region * 100 + rung, which puts
-- Kanto's three rungs at 1100, 1101 and 1102. They were written out by
-- hand at 31, 32 and 33, beside the quests that are still written.
--
-- Claims are the only thing that remembers a quest by number, so they
-- are carried across. Baselines are not: a dex requirement counts a
-- collection rather than an activity and never had one.

update quest_claims set quest = 1100 where quest = 31;
update quest_claims set quest = 1101 where quest = 32;
update quest_claims set quest = 1102 where quest = 33;
