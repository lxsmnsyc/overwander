---
'overwander': minor
---

The sky is sized for the board, not for the monitor.

Every fall was a density per square pixel, so the cost of the weather was
whatever the window was worth. The same blizzard was about 1,900 flakes on a
1280x720 board, 6,300 at 1080p and 22,500 on a 4K monitor, and each of those
flakes was a smaller share of the board than the last. The board is fitted to
the window, so a wider window is the same board drawn larger, and the sky over
it should be the same sky drawn larger too.

Falls are now described for one reference screen and scaled to the window:
count comes off the reference, and length, thickness, speed, drift and the
margin they wrap in are all multiplied by how much larger the window is. The
scale is clamped at both ends, below which a drop is a hairline and above which
the count is allowed to grow again rather than a raindrop being drawn four
pixels wide. The tiled skies weave their tile in reference space and stretch
the pattern, so the cloth is still built once.

Rain on a large monitor now reads as rain rather than as a fine mist, and a
phone gets a full board's worth of weather instead of a sparse one.
