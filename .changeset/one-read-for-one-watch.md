---
'overwander': patch
---

A live view reads once when it opens rather than twice, since the subscription connecting is the same read arriving over the socket. A dropped socket still re-reads when it comes back.
