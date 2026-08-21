-- Social: friendships (stored once per direction, so "who are mine"
-- is a prefix scan), requests, and one-sided blocks.

create table friends (
  owner  uuid not null references auth.users(id) on delete cascade,
  friend uuid not null references auth.users(id) on delete cascade,
  since  bigint not null,
  primary key (owner, friend),
  check (owner <> friend)
);

create table friend_requests (
  sender    uuid not null references auth.users(id) on delete cascade,
  recipient uuid not null references auth.users(id) on delete cascade,
  sent_at   bigint not null,
  primary key (sender, recipient),
  check (sender <> recipient)
);

create index friend_requests_recipient on friend_requests (recipient);

create table blocks (
  blocker uuid not null references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  since   bigint not null,
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
