-- What the host set this fight to allow.
--
-- Every duel used to be held to the mainline's own shape, and the
-- shape was a constant nobody could reach. It is a property of the
-- fight rather than of the game, so it belongs on the lobby the host
-- arranged.
--
-- `limits` is packed the way a battle's is (see
-- src/data/constants/slots.ts): three bits a count, ability then item
-- then move, each stored one less than it reads. It is copied onto the
-- battles row when the host starts, so a fight replays under the rules
-- it was fought under.
--
-- The defaults exist only to fill the lobbies already standing; the
-- server writes both from the TS constants, which stay the authority
-- on what a duel starts as.
alter table duels
  add column limits    integer  not null default 192,
  add column team_size smallint not null default 6;

alter table duels alter column limits drop default;
alter table duels alter column team_size drop default;

-- Nine bits of packing and six seats: what a host may pick inside
-- those is the server's business, but nothing outside them is storable
alter table duels add constraint duels_limits_range check (limits between 0 and 511);
alter table duels add constraint duels_team_size_range check (team_size between 1 and 6);
