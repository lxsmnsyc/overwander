# overwander

## 1.1.0

### Minor Changes

- 352fec7: One walk, however many screens are signed in.

  A player signed in twice had two boards writing one position row, each
  overwriting the other every second and a half, with neither screen aware of it.
  Now the row is streamed, and a screen that sees it standing in a chunk it is
  not in stands down: it stops walking, hands over the paces it had not reported
  yet, and says where the walk went. One press takes it back, which stands the
  other screen down in turn.

  Only the chunk is compared. Two screens in the same chunk write cells over each
  other and neither view moves, which is untidy and harmless, and a rule that
  noticed it would fire on every ordinary step. A screen also recognises its own
  writes coming back around the subscription, since one that could not would
  stand itself down mid-walk.

### Patch Changes

- 352fec7: The board and the field stop at two real pixels each.

  Both canvases are the size of the page and sized their backing store at the
  whole of `devicePixelRatio`, so a phone reporting 3 was drawing nine times the
  pixels of one reporting 1, and every full-screen fill over them was paid for at
  that size. Everything on them comes from pixel-art sheets that are sharp at two
  and no sharper at three.

  The cap lives in one place both canvases read, which also gives the field the
  floor the board already had: a browser that reports nothing useful is drawn for
  one pixel each rather than sized to `NaN`.

- 5fb7d5f: Cards are held open on a touch screen, and two fingers turn the camera.

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

- 352fec7: The sky is sized for the board, not for the monitor.

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

- 468d90d: Three gates for a move, and a switch you can fight through.

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

## 1.0.0

### Major Changes

- 5b5cd19: **Kanto**, the first release: an endless world, the original 151 pokemon living
  in it, and everything you do with them.

  - **The world**: 25 kinds of country generated from a shared seed, so no loading
    screens, no edges, and two players standing in the same field see the same
    things. Pokemon, berries, raids and the people at the crossroads all turn over
    on their own schedules.
  - **Pokemon**: all 151, each settled before you meet it, with shinies, hidden
    abilities, shadows, size records, and a featured family the whole world shares.
  - **Catching**: no wild battles. Walk up, throw one of fourteen balls, feed a
    berry to settle it, or back away and risk it bolting.
  - **Battles**: real time, both sides at once. Moves wind up, swing and recover,
    quick pokemon land several hits before a slow one connects, and conditions
    carry out of the fight.
  - **Raids**: a lair holds a legendary for a few hours for up to twenty players,
    mythicals answer a spent relic, and Team Rocket grunts block the road with
    shadowed parties.
  - **The league**: duelling trainers, eight gym leaders, the Elite Four and the
    Champion, plus gym seats held by other players and private duels between two
    who both agreed to it.
  - **Quests and awards**: a quest board, three dailies and a weekly hunt, four
    tiers of achievements, and one title worn over your name.
  - **Raising**: family-shared candy, chosen stat training with wings, friendship
    from walking together, and evolution by level, stone, friendship or trade.
  - **Eggs**: found in nests or asked of the breeder, hatched on steps, halved by
    a Flame Body buddy, inheriting from both parents.
  - **People**: a different helper at each crossroads, from the vendor and Nurse
    Joy to the Fossil Scientist, who is the only road to Omanyte, Kabuto and
    Aerodactyl.
  - **Items**: caches, berry patches, phenomena, Pickup, and gear that keeps
    working in battle, including a Utility Belt for a second held item.
  - **Trading**: an auction house for the genuinely scarce, one lot a day each,
    and friend trades that let a traded pokemon evolve the way only a traded one
    can.
  - **Friends and gifts**: friend codes, retractable requests, gifts set aside for
    you, and four waiting on day one.
