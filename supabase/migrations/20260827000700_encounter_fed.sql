-- A Pinap pays its extra candy when the pokemon is caught, which is a
-- later call than the one that fed it. The catch is recorded from the
-- server's own staged row, so the row is where the fed berry has to
-- live: nothing else survives between the feeding and the catch.
--
-- Null for every encounter nobody fed, which is most of them.

alter table encounters add column fed integer;
