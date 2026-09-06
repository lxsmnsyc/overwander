-- Releasing a pokemon that had been claimed from a gift came back
-- refused, with "gift_claims only backfill catch_id once".
--
-- The claim's catch_id is a foreign key that nulls on delete, so
-- letting the pokemon go makes the database itself update the claim
-- row. The write-once trigger could not tell that update from a
-- player rewriting a claim, and refused it, which rolled the whole
-- release back.
--
-- The rule it was written for still holds: a claim is backfilled once
-- with the catch it became, and nothing about which gift it was or
-- who took it ever changes. What is added is the other direction: the
-- catch it named is gone, so the pointer goes with it.
--
-- One narrowing comes with it. A claim whose pointer a release has
-- emptied reads as one that was never backfilled, so it could be
-- pointed at a catch again. Nothing does: the table is closed to
-- clients, the server backfills once inside the claim transaction,
-- and the claim row itself is what stops a gift being taken twice.
-- The pointer is provenance, and no query reads it.

create or replace function guard_gift_claim() returns trigger
language plpgsql as $$
begin
  -- Which gift, whose, and when are settled when the claim is written
  if new.gift_id <> old.gift_id
     or new.player <> old.player
     or new.claimed_at <> old.claimed_at then
    raise exception 'a gift claim keeps its gift, its player and its hour';
  end if;
  -- The backfill: nothing becomes the catch the gift turned into
  if old.catch_id is null then
    return new;
  end if;
  -- The release: a claim outlives the pokemon it handed over, so it
  -- keeps its shape and loses its pointer.
  --
  -- Only where the catch is really gone, which is what makes this the
  -- foreign key's own write rather than somebody unpicking a claim
  -- that still points at a living pokemon
  if new.catch_id is null
     and not exists (select 1 from caught where id = old.catch_id) then
    return new;
  end if;
  raise exception 'gift_claims only backfill catch_id once';
end;
$$;
