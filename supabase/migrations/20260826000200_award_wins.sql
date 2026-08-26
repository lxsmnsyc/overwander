-- Awards remember how many times their fight has been won, not only
-- that it was: a gym can be re-fought every window, and the count is
-- the shelf's bragging right. Existing rows count the win that
-- earned them.

alter table awards add column wins bigint not null default 1;
