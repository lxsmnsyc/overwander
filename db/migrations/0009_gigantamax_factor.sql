-- The Gigantamax Factor is a catch flag. Max Mushrooms set it on a species
-- with a Gigantamax form, and it stays through a trade and an evolution.

alter table public.caught
  add column gigantamax boolean default false not null;

comment on column public.caught.gigantamax is 'Carries the Gigantamax Factor, given by Max Mushrooms';
