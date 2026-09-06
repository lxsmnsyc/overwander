---
'overwander': patch
---

A pokemon claimed from a gift can be released again. Letting one go came back refused with "gift_claims only backfill catch_id once", because the claim's pointer at the catch nulls itself on delete and the write-once guard read that as a second backfill.
