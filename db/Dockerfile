# The game's database: Postgres 17 with pg_cron, which runs the sweeps
# the baseline schedules. pg_cron has to be loaded at start and pointed
# at the one database it schedules in.
FROM postgres:17
RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-17-cron \
  && rm -rf /var/lib/apt/lists/*
CMD ["postgres", "-c", "shared_preload_libraries=pg_cron", "-c", "cron.database_name=overwander"]
