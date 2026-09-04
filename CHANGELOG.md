# overwander

## 1.6.2

### Patch Changes

- e5baf44: Dex bookkeeping, and the line between a legendary and a mythical.

  - A pokemon that arrives without ever being met is written to both tallies, so
    the caught column can no longer climb past the seen one. Evolving and
    hatching were the two ways it could.
  - Every battle now writes down what the other side fielded, staged rather than
    settled: a raid boss, a Team Rocket party, a gym seat's holder or a duelling
    player's team is met by standing in front of it. It is one statement inside
    one transaction, however many were on the field.
  - **Legendaries and mythicals are separate tiers**, with a band each. A
    legendary sits in the special band at 1/4096; a mythical sits in a band of
    its own, eight times thinner at 1/32768, in the one place it lives.
  - Giovanni's sixth is drawn from the lairs the world stages, so his party can
    no longer end in a mythical.
  - Changes world generation.

- 621336d: A pokemon whose sheet is missing a clip no longer stands still through it in a fight. It plays the clip it has and the field moves the body instead: a lunge for a missing attack, a knock back for a hurt, a bounce for a hop, a spring for a double, a turn for a rotate.
- 621336d: The evolutions in a catch's sheet stand the way the pokemon above them stands, whether or not they have been met. They used to be drawn asleep until one was registered.
- e9f60e5: A mythical spawns at the same 1/4096 as a legendary, rather than 1/32768.

  Changes world generation.

- 9098acb: A first entrance and an admin teleport put the player on ground they can stand on, rather than possibly inside scenery or rock.
- e9f60e5: A battle logs every fighter's sightings in one transaction, rather than one per player.

## 1.6.1

### Patch Changes

- 05c1040: A Utility Belt can be spent on a pokemon.

  The item was findable and the server has always known how to widen a record by
  a slot, but the bag was never told about it. Nothing matched it, so the picker
  offered no pokemon to use it on and pressing it through the catch sheet was
  refused as a remedy that would heal nothing.

  It is offered on any pokemon with room left to add, and spending it says how
  many held items the pokemon can carry now.

- 4d931d8: Fewer database round trips on the paths players press most: Nurse Joy reads a whole party at once, marking a box of catches is one read and one write, a catch pays all its candy in one write, the battle aftermath asks two questions instead of three, and a guard that only needs to know who owns a pokemon no longer reads its moves, abilities, items and history.
- 835a0f3: A pokemon that was named before it changed hands keeps that name: only its first trainer may rename it. One that arrives unnamed is still the new owner's to name.

## 1.6.0

### Minor Changes

- 9c34ad9: - A meeting opens on the ball you last threw, where you still carry one, and on
  the first ball in the bag where you do not.
  - New setting, Encounters: Keep the last ball, on to start with. Off, every
    meeting opens on a Poke Ball.
- 9c34ad9: - The overworld walks on the keyboard again: the arrows or WASD move a cell at a
  time, and holding a direction keeps walking.
  - A step into a landmark, a boulder or a tree turns the player to face it
    without moving them, and Enter reaches for whatever they are facing.
  - The board's blue keyboard cursor is gone. What Enter acts on is what the
    player is facing.
  - New setting, Controls: the four directions, Interact and Menu can be bound to
    other keys. The arrows always walk whatever they say.
  - M puts the keyboard on the menu bar.
  - Escape leaves a battle, the way the Leave button does.
  - The command bar opens on `/` rather than Ctrl+K.

### Patch Changes

- a3935f6: - The profile's lots and a battle's raid title neither hold their screen up
  while they arrive nor drop what they had while they are re-read.
  - `createAsyncMemo` is gone. It was `createResource` rewritten by hand, and
    nothing imported it.
- a3935f6: - Evolution rows on a catch sheet draw their pokemon at one size, so a
  branching line lines up.
  - The pokemon on a catch sheet idles rather than walking on the spot, and what
    it turns into faces the same way.
- a3935f6: - The world stays where it is when a pokemon runs off, instead of blanking to
  "Reading the world…" while what has fled is re-read.
  - Taking one pokemon out of a box no longer restarts the idle of every sprite
    in it.
  - A catch sheet fills in an evolution registered since it was last opened,
    instead of holding the silhouette.
- 0b237cd: - A trade evolution reads one stored answer instead of two stored facts. What a
  handover opens is settled where the handover happens, so `traded_as` and
  `traded_for` give way to `can_evolve`.
  - A traded pokemon keeps what it earned and nothing more: a Machop swapped and
    then levelled is still a Machoke nobody traded, and a sale still shuts the
    lines that name a partner.
- 9c34ad9: The end to end tests read the board off the canvas that carries its name. The
  chunk is painted on one canvas and pressed on another, the painting one comes
  first, and it is `aria-hidden`: every question the tests asked the board came
  back empty, which read as a world that had not loaded.

## 1.5.0

### Minor Changes

- 228d8a7: A command bar for staff who run the game, opened with Ctrl+K from the
  overworld.

  - `/tp` moves a player, to chunk coordinates or to where somebody else stands.
  - `/locate` finds the nearest chunk answering to a species, a biome or a sky.
  - `/gift-item`, `/gift-catch` and `/gift-encounter` put something on one
    player's shelf or on everybody's.
  - `/ban` and `/unban` shut a player out of the game and let them back in.
  - `/view` opens somebody's profile.

  A player is named by nickname, email address or friend code, and the bar
  finishes the command, its parameters and their values as they are typed.

### Patch Changes

- 228d8a7: A notice opens what it says it will open, and lands on the panel it
  is about rather than on battles.

- 228d8a7: The lamp a dark day leaves you walks with you, and lies on the
  ground.

  - It is drawn from where the player is rather than from the cell they are
    nearest, so the pool travels with them.
  - It is laid back by the board's own tilt, so it is the ellipse a lamp on that
    ground would cast.
  - Walking alone lights a cell and a half, and an Illuminate buddy three.

## 1.4.0

### Minor Changes

- 8d55d60: The dashboard's gift ledger has a search box, taking the same grammar
  as the bag and the auction board, and no longer lists what the game paid out
  on its own.

- cf75934: The battle history names and draws whoever you actually fought,
  rather than calling every overworld stop a Team Rocket grunt. Fights recorded
  before this keep the old name, since there is nothing to look up for them.

- d86c111: A shiny throws its glint as it comes into a fight, the way it does in
  the overworld.

- fd633ab: A shadow's haze and a purified one's light are drawn again on the
  battle field, each on a canvas of its own. The raid demo can stage a shadow
  boss.

### Patch Changes

- fd633ab: The board rules the cell somebody is standing in, ember for a fight
  and tide for a counter, and stops drawing the cursor under the player.

- fd633ab: A dark day is black rather than a veil. Walking alone lights the one
  cell you stand on; an Illuminate buddy carries a lantern worth two.

- 32d9c6f: The player's guide says what the game has been doing since Kanto
  shipped.

  - A sky crowds its own types, and a dark day is the one sky you cannot see
    across.
  - The eight field abilities are in the buddy table.
  - Nests hold back the eleven species whose babies do not exist yet.
  - A phenomenon leaves nothing from the special band.
  - Switching is a walk, so a move in the air follows the swap rather than
    missing.
  - The engine notes carry the three move gates and the two demo pages.

- fd633ab: The weather stands in the world instead of on the glass.

  - A drop is a place, so the field sweeps when the camera turns and a sandstorm
    blows along a compass direction.
  - The aurora is a ring of folds over the board, and meteors cross on a
    bearing.
  - A rainbow, a fogbow and a fata morgana are fields of light laid over the
    picture rather than arches drawn in it.
  - Density is down to two fifths, and the sky costs less: a downpour at
    1280x720 went from 8.99ms a frame to 2.19, a sandstorm from 8.22 to 0.69.

- fd633ab: The weather demo stands its skies on a board, drawn through the
  overworld's camera and turned the same way, with a third switch for the flat
  sky.

- 6aa24b1: The battle AI weighs several kinds of move it was reading wrongly.

  - Fixed-damage moves are asked what they take off rather than read as doing
    nothing.
  - A multi-hit move is counted for every strike, and how often a move lands is
    part of what it is worth.
  - A move that costs the user something says so: Explosion, recoil, a fatal
    Jump Kick, a recharge, and the cast a wind-up spends.
  - Stat-stage moves are declined once the stage is pinned, and Haze by the side
    that is ahead.
  - Healing is weighed by what it puts back, and a drain is worth more to a hurt
    pokemon.
  - Weighing a move no longer eats the target's resist berry or draws from the
    battle's random stream.
  - Struggle covers a pokemon that cannot reach anybody, not only one whose
    moves are shut off. Raid bosses stand there still.

## 1.3.0

### Minor Changes

- e716fc8: A sky crowds the types it favours into a chunk's spawns, at twice
  their ordinary weight. The four rarest are left out, since they favour
  everything.

  This changes what a chunk is holding under a typed sky, the way anything
  touching world generation does.

- c326077: Eight abilities that do something out in the world.

  - **Keen Eye** and **Intimidate** lift the bottom of a wild meeting's level
    band by three.
  - **Hustle**, **Pressure** and **Vital Spirit** lift the top by three.
  - **Stench** keeps two pokemon away, the Pure Incense worn rather than
    carried.
  - **Compound Eyes** turns the two rare held-item slots up two and a half times
    as often.
  - **Frisk** says what a wild pokemon is carrying before anything is thrown at
    it.

## 1.2.0

### Minor Changes

- 9bb1562: A page for looking at the weather, at `/demo/weather`: any of the
  twenty six skies over any biome's ground, at any strength, through both
  painters, with the sky in the address.

- 9bb1562: Five skies that were not saying what they are.

  - **Dark Day** is drawn as a dark room, lit only around the player and the
    landmarks.
  - **Illuminate** is a lantern out here: it more than doubles how far its owner
    sees under a dark sky.
  - **Fata Morgana** and **Fogbow** have visuals at all: a shimmering warm veil,
    and a rainbow with the colour gone.
  - **The aurora** is drawn fold by fold rather than as one band.
  - **The meteor shower** is a few shooting stars rather than a sparse fall.
  - **A thunderstorm has lightning**, every few seconds and jittered.

### Patch Changes

- 9bb1562: A raid lobby draws each party about two and a half times larger, in
  one frame rather than two.

- 9bb1562: Two fixes to a catch sheet's evolution list.

  - A shiny's row asks about the shiny coat, so it no longer gives away an
    evolution the reader has never held sparkling.
  - A species owned but never met draws its silhouette rather than Missingno.

- 9bb1562: Selecting a run of pokemon no longer slows down as the run grows. The
  list, the search over it, the page under it and the set of what is picked are
  all held.

## 1.1.1

### Patch Changes

- 25a81af: Two fixes to what a trade is worth.

  - A trade evolution opens for what the pokemon was when it changed hands, and
    the record remembers what came the other way.
  - Razor Claw and Razor Fang are held items rather than trade items.

- 25a81af: The sky has a tier above its showpieces, and there are four of them.
  Each falls over every country, at about one window in twelve hundred, and each
  favours every type at once.

  - A **meteor shower** doubles the odds of a shiny coat.
  - A **fata morgana** doubles the odds of a hidden ability.
  - A **dark day** meets a shadow about a third of the time.
  - A **fogbow** hands over one of the line's egg moves.
  - Shadows are half as likely to be caught, however they were found.
  - Sandstorms fall over the badlands and the cold deserts as well as the
    desert.

  This changes what the sky over an existing chunk is doing, the way anything
  touching world generation does.

- 2388a68: The board, its weather and the battlefield are drawn in batches on a
  WebGL layer, with the 2D painter as a fallback.

  - The stand-in art is gone: a cell shows nothing until its own picture is in
    hand.
  - A pokemon or a person throws its own silhouette rather than an ellipse, laid
    the way the light throws it.
  - The shadow's bearing follows the board's own tilt, so it no longer lies the
    wrong way round.
  - The compass is four marks rather than four letters, and nothing on the board
    needs a font.

- 25a81af: A nest lays the first stage it has. Eleven species whose babies the
  game has not registered yet are left out until those arrive.

  This changes what an existing nest is holding, the way anything touching world
  generation does. An egg already laid keeps what it was laid as.

- 3b2d892: A note over the board wraps rather than clipping, so a reward is
  named in full.

- 25a81af: Four fixes to what the game shows and what a stray press can throw
  away.

  - A stop fight is named and drawn for whoever is standing there, not for a
    Team Rocket grunt.
  - A meeting that happens once closes on "Run away" and nothing else.
  - Purifying warns before it happens, and Nurse Joy asks twice for a shadow.
  - The vendor's basket reads down the middle.

- 2388a68: The safari dialog marks a shiny with the sparkles icon the rest of
  the interface uses, and says the word for a screen reader.

## 1.1.0

### Minor Changes

- 352fec7: One walk, however many screens are signed in. A screen that sees the
  walk standing in a chunk it is not in stands down and hands over the paces it
  had not reported; one press takes it back.

### Patch Changes

- 352fec7: The board and the field cap their backing store at two real pixels
  each, and a browser that reports nothing useful gets one rather than `NaN`.

- 5fb7d5f: Cards are held open on a touch screen, and two fingers turn the
  camera.

  - A hover card or tooltip opens on a half-second hold and ignores a finger's
    enter and leave.
  - The board and the battlefield take a two-finger twist as well as a drag.
  - A drag or a twist that moved the camera no longer counts as a press.

- 352fec7: The sky is sized for the board rather than for the monitor, so rain
  on a large screen reads as rain and a phone gets a full board's worth of it.

- 468d90d: Three gates for a move, and a switch you can fight through.

  - `CheckUnitTriggerMove`, `CheckUnitTriggerMoveTarget` and
    `CheckUnitTriggerMoveEffect` are asked by the calls they guard, so a refusal
    means the event never runs.
  - The trigger events moved onto the attack priority scale, for the `Prepare`
    and `Cleanup` rungs.
  - A switch is a walk: the crosser keeps casting, and anything aimed at it
    follows the swap onto whoever took the spot. Only Teleport takes its user
    out of the world.
  - `UnitSwitch` and `UnitFinishSwitch` carry the cause that started them.

## 1.0.0

### Major Changes

- 5b5cd19: **Kanto**, the first release: an endless world, the original 151
  pokemon living in it, and everything you do with them.

  - **The world**: 25 kinds of country generated from a shared seed, so no
    loading screens, no edges, and two players standing in the same field see
    the same things. Pokemon, berries, raids and the people at the crossroads
    all turn over on their own schedules.
  - **Pokemon**: all 151, each settled before you meet it, with shinies, hidden
    abilities, shadows, size records, and a featured family the whole world
    shares.
  - **Catching**: no wild battles. Walk up, throw one of fourteen balls, feed a
    berry to settle it, or back away and risk it bolting.
  - **Battles**: real time, both sides at once. Moves wind up, swing and
    recover, quick pokemon land several hits before a slow one connects, and
    conditions carry out of the fight.
  - **Raids**: a lair holds a legendary for a few hours for up to twenty
    players, mythicals answer a spent relic, and Team Rocket grunts block the
    road with shadowed parties.
  - **The league**: duelling trainers, eight gym leaders, the Elite Four and the
    Champion, plus gym seats held by other players and private duels between two
    who both agreed to it.
  - **Quests and awards**: a quest board, three dailies and a weekly hunt, four
    tiers of achievements, and one title worn over your name.
  - **Raising**: family-shared candy, chosen stat training with wings,
    friendship from walking together, and evolution by level, stone, friendship
    or trade.
  - **Eggs**: found in nests or asked of the breeder, hatched on steps, halved
    by a Flame Body buddy, inheriting from both parents.
  - **People**: a different helper at each crossroads, from the vendor and Nurse
    Joy to the Fossil Scientist, who is the only road to Omanyte, Kabuto and
    Aerodactyl.
  - **Items**: caches, berry patches, phenomena, Pickup, and gear that keeps
    working in battle, including a Utility Belt for a second held item.
  - **Trading**: an auction house for the genuinely scarce, one lot a day each,
    and friend trades that let a traded pokemon evolve the way only a traded one
    can.
  - **Friends and gifts**: friend codes, retractable requests, gifts set aside
    for you, and four waiting on day one.
