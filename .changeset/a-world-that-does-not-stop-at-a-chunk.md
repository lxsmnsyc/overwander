---
'overwander': minor
---

- The climate is read a cell at a time, so a chunk can hold two countries and a border wanders through the ground instead of falling on a chunk boundary
- Lakes, rivers and ridges of rock are world-wide fields now, so they run from one chunk into the next rather than being grown inside one
- The board draws the neighbouring chunks' own ground past its edges, and every cell is drawn from its own country's tileset
- The board is a window on the world with the player in the middle of it rather than the chunk they are standing in, so the world scrolls as they walk and there is no boundary to cross and nothing to wait for at one
- A board straddles four or nine chunks at once, and their windows are all watched and all visited, so what is standing on the far side of a boundary is live before the player gets there
- The board is a circle rather than a square, so a player sees the same distance in every direction
- The country is drawn twenty cells out, past the edge of the picture on every side, while the board itself is the ten cells the player can press, and everything standing on it is inside those
- Scenery, landmarks and pokemon may stand on any cell of a chunk: the clear rim every chunk used to keep drew empty corridors across the world every sixteen cells
- A new /demo/world page paints the world's ground a cell at a time, with the chunk grid over it
