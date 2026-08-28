-- The character a trainer is seen as, in place of a picture from
-- anywhere on the web.
--
-- Not writable from the client, which is the difference from the
-- avatar it replaces: a sprite is earned, so the check on what was
-- earned has to happen somewhere the player cannot reach. The column
-- privileges on `avatar` go with the column itself.
alter table profiles drop column avatar;

alter table profiles
  add column sprite text not null default 'characters/frlg/red';
