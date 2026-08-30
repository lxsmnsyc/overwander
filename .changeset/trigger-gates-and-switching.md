---
'overwander': patch
---

Three gates for a move, and a switch you can fight through.

- **`CheckUnitTriggerMove`, `CheckUnitTriggerMoveTarget` and
  `CheckUnitTriggerMoveEffect`**: the questions asked before a move fires,
  before it goes ahead against each one it reached, and before it resolves on
  them. Each is asked by the call it guards, the way a refused cast is never emitted,
  so a refusal means the event never runs at all. Dream Eater answers the last
  one instead of disabling the effect it was aimed at.
- The trigger events moved onto the attack priority scale, so anything that
  needs to bracket a move has the `Prepare` and `Cleanup` rungs the attack
  events already had.
- **A switch is a walk, not a vanishing.** A pokemon crossing the field keeps
  casting what it had started, and anything aimed at it follows the swap onto
  whoever took the spot: a cast, a channel, and now a move already in the air.
  Only a Teleport takes its user out of the world: that one still interrupts,
  still stops the pair acting, and is still untouchable while it goes.
- `UnitSwitch` and `UnitFinishSwitch` carry the cause that started them, which
  is what tells those two apart.
