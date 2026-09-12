---
'overwander': patch
---

A pokemon that has been to auction can be let go again. Releasing one deleted
its record, which emptied the pointer on any lot that had named it, and the
auctions table refused to hold a pokemon lot with no pokemon in it: the release
came back as a constraint error, and a batch release failed whole because one
member of it had once been on the block. A settled lot may now outlive what it
sold, the way a gift claim already did. A lot that is still running must still
name its pokemon.
