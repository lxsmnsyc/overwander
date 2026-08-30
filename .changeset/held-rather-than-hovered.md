---
'overwander': patch
---

Cards are held open on a touch screen, and two fingers turn the camera.

A phone has no hover and no right button, which were the two gestures the
interface leaned on. The browser sends a mouse-enter after a tap anyway, so
every tooltip and every hover card opened on the press that was meant for the
thing underneath, and then stood over it.

Both cards now ignore a finger's enter and leave, and open on a hold instead:
half a second on the trigger raises the card and swallows the tap that would
otherwise have followed, and the next press somewhere else puts it away. A
finger that drifts is scrolling rather than asking, so it opens nothing. The
pokemon card over the battle field works the same way, since a finger cannot
rest on a sprite the way a pointer can. A tooltip no longer opens when a press
focuses a button inside it, only when the keyboard reaches one.

The camera is the other half. The chunk board turned on a right-drag and the
battlefield on a left-drag, neither of which a touch screen has, so both now
also take a two-finger twist: the picture follows the angle between the
fingers, the way a map does. A drag or a twist that moved the camera no longer
counts as a press on whatever it finished over, which was already wrong for the
battlefield's mouse drag.
