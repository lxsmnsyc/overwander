-- Boxes: folders a player files their catches into. A catch with no box
-- is in Default, which is not a row, so every existing catch lands
-- there with nothing rewritten.

create table public.boxes (
    id text primary key,
    player uuid not null references public.users(id) on delete cascade,
    name text not null,
    colour smallint not null default 0,
    position smallint not null,
    made_at bigint not null,
    constraint boxes_name_charset check (name ~ '^[[:alpha:][:digit:] ''.♀♂-]{1,24}$'),
    constraint boxes_colour_range check (colour >= 0 and colour <= 9),
    constraint boxes_position_range check (position >= 0)
);

comment on table public.boxes is 'Folders a player files their catches into. Default is no row';

create index boxes_player on public.boxes using btree (player, position);

-- Deleting a box sends what was in it back to Default. A slot is a
-- place in the box's grid and may leave gaps, which is what lets a
-- living dex keep a square for what it is missing.
alter table public.caught
  add column box text references public.boxes(id) on delete set null,
  add column box_slot integer,
  add constraint caught_box_slot_range check (box_slot >= 0 and box_slot < 100000);

comment on column public.caught.box is 'The box it is filed in, or null for Default';

comment on column public.caught.box_slot is 'Its square in that box, counted from 0, where gaps are allowed';

create unique index caught_box_slot on public.caught using btree (box, box_slot) where (box is not null);

-- A box is its owner's, so a pokemon that changes hands leaves it.
create function public.unfile_on_handover() returns trigger
    language plpgsql
    as $$
begin
  if new.owner is distinct from old.owner then
    new.box := null;
    new.box_slot := null;
  end if;
  return new;
end;
$$;

create trigger unfile_on_handover before update of owner on public.caught
  for each row execute function public.unfile_on_handover();
