-- A battle feat counted across fights (Stantler's Psyshield Bash,
-- Hisuian Qwilfish's Barb Barrage, white-striped Basculin's recoil)
-- keeps its running total on the catch. It is capped at the feat's goal
-- by the server, and cleared by a handover or the evolution it opens.

alter table public.caught
  add column feat_progress integer default 0 not null,
  add constraint caught_feat_progress_range check (feat_progress >= 0 and feat_progress <= 100000);

comment on column public.caught.feat_progress is 'The running total of a battle feat counted across fights';
