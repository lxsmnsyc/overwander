---
'overwander': patch
---

A notice opens what it says it will open.

Pressing "Open trades", "Open the lobby" or "Open requests" did nothing at all.
The list set the dialog it was sending the player to and then closed itself, and
closing is the same signal as going nowhere: one dialog is open at a time, so
the second call put it straight back to none. The panel was opened and shut in
the same breath.

Nothing is closed now. Opening the next dialog takes the notice list's place on
its own, which is what the list was relying on in the first place.

The profile also opens at the part the notice is about. A trade offer lands on
trades, a friend request on requests, a lot won or outbid on bids, and an unsold
one on selling. They all used to land on battles, which is a panel that opened
on the wrong thing rather than one that did nothing, and read much the same.
