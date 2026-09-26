-- What a meeting has built up between throws, kept by the server.
--
-- Throws and treats are decided on the server now, so the feeding
-- bonus, the throw count, the safari clock and whether it is still
-- chewing are stored beside the meeting instead of living in one
-- browser tab. Null is a meeting nobody has thrown at or fed yet.
alter table encounters add column safari jsonb;
