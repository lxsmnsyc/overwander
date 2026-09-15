---
'overwander': patch
---

- Stopping on the overworld saves your position and steps in one request, and a save is no longer read back again.
- The overworld board only asks for a chunk's spawns when its window is missing or has run out, instead of every few seconds of walking.
- Quest completion checks pause while the game's tab is hidden, and run once when you come back.
- A shiny's sparkle in battle waits for the fight to start instead of sitting frozen through the countdown.
- A shiny's sparkle on the overworld plays through instead of stopping halfway and vanishing.
- A position that fails to load no longer replaces your saved spot with a new starting point.
- A tab left open across an update no longer sends nest, phenomenon and spawn claims to the wrong action.
