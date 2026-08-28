-- The sky a fight was started under, so a trainer met out on the road
-- is fought under the weather that was over the road at the time.
--
-- Stored rather than derived for the reason `biome` is, plus one of
-- its own: the sky is quantised to the hour, so a fight walked back
-- into an hour later would replay under a different one. Clear is the
-- default, and clear does nothing, so every battle that is not an
-- overworld trainer's carries no weather at all.
alter table battles add column weather smallint not null default 0;
