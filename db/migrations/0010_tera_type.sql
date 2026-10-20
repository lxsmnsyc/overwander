-- The Tera type is rolled when a catch is written and changed with 50 Tera
-- Shards. A catch made before it holds none and reads as its species' first
-- type, and it stays through a trade and an evolution.

alter table public.caught
  add column tera_type smallint;

comment on column public.caught.tera_type is 'The type it Terastallizes into; null reads as its species'' first type';
