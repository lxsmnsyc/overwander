-- Which pokemon is folded into which.
--
-- The `hidden` flag added earlier says a row is inside something, but
-- not what. The fusion is one to one, so the name of the other half
-- sits on the base, which is the row every reader already has in
-- hand: taking the pair apart is a read of what is loaded rather than
-- a search for whatever points back.
alter table caught add column fused_with text references caught(id) on delete set null;

comment on column caught.fused_with is
  'The pokemon folded into this one, which is hidden for as long as it is in there';
