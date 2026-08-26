-- The title a player wears on their profile, or null for none. The
-- number is a Title id from src/data/ids/titles.ts. No client grant:
-- entitlement is derived from counters and awards, so the server is
-- the only writer.

alter table profiles add column title smallint;
