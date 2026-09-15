`batchedQuery` (src/utils/batched-query.ts) gathers calls made in the same moment into one read. Use it where those calls reliably arrive together.

- Browser: yes, where many components each read one key as they mount (list rows, cards, lobby parties, history pages). See `getCaughtBatched`, `getTeamBatched`, `getTeamSnapshotBatched`, `getProfileBatched`.
- Server, across requests: no. Serverless instances may never see them together, and one failed query fails every request in the batch.
- Server, within one request: read many keys with one query instead (`readCaughtMany`, `readStacksIn`, `= any(${ids})`). Use a batch only for fan-out through code that cannot take a list, and never inside a transaction.
- Give `key` for object queries, `limit` (50) for ids sent in a URL, return a `Map` from the callback, and read lists through `settled`.

Full convention: `.agents/skills/batched-queries/SKILL.md`.
