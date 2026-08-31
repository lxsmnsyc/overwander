# overwander

## 1.4.0

### Minor Changes

- 8d55d60: The dashboard's gift ledger now has a search box over it, and no longer
  lists what the game paid out on its own.

  Daily quest and weekly hunt rewards ride the same gift rows as anything
  written by hand, one per slot per player, so a live game writes far more
  of them than staff ever will. They are left out now, the way quest
  rewards already were, and the boards they came from are where they
  belong.

  The box takes the same grammar as the bag and the auction board: a plain
  word, `field:value` pairs, `is:` for the yes-or-no facts, `!` to refuse
  one and `|` to accept any of several. A gift can be asked for by who it
  was written for, what is on the shelf, the sentence it carries, its
  level or amount, how many players have taken it and how long ago it was
  written, with `is:waiting`, `is:taken`, `is:expired`, `is:open` and
  `is:shiny` among the facts. One box narrows both the pokemon and the
  items, the way the auction board narrows its two trays.

- cf75934: The battle history names whoever you actually fought.

  Every fight staged from an overworld stop was listed as "Team Rocket Grunt" with
  no picture, whether it was a grunt, Giovanni, a duelling trainer, a gym leader,
  one of the Elite Four or the Champion. Now each row shows the name and the
  character they were wearing when you walked up to them.

  It has to be remembered rather than worked out again. Who is standing at a
  landmark is the window's roll, and the window turns over within the hour, so a
  fight read back a week later has nothing left to derive it from. A battle now
  keeps the name and the coat the way it already kept the species a raid was
  fought against, and a replay's verdict reads them too, so watching an old fight
  back names the same person the history does.

  Fights recorded before this keep saying "Team Rocket Grunt", since there is
  nothing to look up for them.

- d86c111: A shiny sparkles as it comes into a fight.

  The overworld announces a shiny with a glint the first time it is drawn. A
  battle never did, so the one coat worth looking twice at walked onto the field
  saying nothing about itself. Now it throws the same glint as it arrives, once,
  and is over in about a second.

- fd633ab: A shadow's haze and a purified one's light are drawn again on the
  battle field.

  The auras were painted onto one canvas that every aura on the field
  shared. The batched pass hands a canvas over as a texture and draws it
  later in the frame, so two of them in the same fight both came out as
  whichever was painted last, at whichever size that one happened to be:
  one aura stretched over the wrong feet, and the other missing. Each
  aura now keeps a canvas of its own.

  The raid demo can stage a shadow boss, which is the fight the haze is
  drawn for. Nothing on that page was a shadow before, so there was
  nothing to look at.

### Patch Changes

- fd633ab: The board calls out the cell somebody is standing in, and stops calling out the
  one the player is.

  The keyboard's cursor rests on the player until it is moved, so a board with
  focus drew a blue square under the character and left it there. It said nothing:
  the character is already where the character is, and the square only competed
  with them. It is drawn now only where the cursor has actually been walked to.

  The mark that was going spare has gone to the people standing at landmarks. A
  nurse and a Rocket grunt are two figures in coats and nothing about the coats
  tells them apart, which used to be answered by a ring under their feet; the cell
  itself is ruled instead, in the game's own two colours, ember for a fight and
  tide for a counter. It is the larger mark of the two and it is the same one the
  cursor leaves, so a player reads one thing on this board rather than two.

  Every called-out cell is ruled on a dark line under the colour, which the ring
  did and the cursor did not: a blue square on snow was most of the way to
  invisible.

- fd633ab: A dark day is dark, and a lamp lights one cell.

  The sky that puts the lights out was drawing a night-blue veil at seven eighths,
  which left the country legible straight through it: the one weather whose whole
  point is that the board is gone except where something is lit was showing you
  the board. It is black now, and all of it.

  The lamps are measured off the cell rather than picked by eye. Walking alone a
  player sees half a cell's diagonal, which is exactly the circle that holds one
  cell: whatever they are standing on is lit, corners and all, and nothing beyond
  it is. An Illuminate buddy carries a lantern worth two cells.

  That lantern is now a reach of its own rather than a multiple of the one it
  replaces. Two cells is two cells whatever a player walking alone can see, which
  is what a lantern is, and it means the two numbers can be read side by side
  instead of one being the other times something.

  Between the black and the tighter lamp a dark day is a great deal darker than it
  was. That is the intent: finding a pokemon in one is meant to be feeling your
  way from landmark to landmark.

- 32d9c6f: The player's guide says what the game has been doing since Kanto shipped.

  Four releases of world and battle work had landed without the guide following
  them, so several pages described a game that no longer existed. What is now
  written down: a sky crowds its own types into a chunk at twice their weight, and
  a dark day is the one sky you cannot see across; the eight field abilities that
  were added to the four already there, from Stench keeping pokemon away to Frisk
  reading what one is carrying; the eleven species a nest holds back until their
  babies arrive; and what a phenomenon can and cannot leave behind.

  Two pages were wrong rather than merely short. Switching is a walk across the
  field, so a move already in the air follows the swap onto whoever took the spot
  rather than missing, which the battle page had backwards. The engine notes now
  carry the three gates a move passes through and the two demo pages that sit
  beside the raid.

- fd633ab: The weather stands in the world instead of on the glass.

  Every drop used to live in screen pixels, wrapped in a flat stripe the size of
  the window. The board turned under all of it and none of it moved: walk the
  camera round a thunderstorm and the rain did not care. The aurora's folds were
  laid across the width of the frame and the rainbow's centre was nailed to seven
  tenths of the way across it, so both followed the player round like a smudge on
  the lens.

  A drop is now a place in the world, put through the board's own camera. Near
  drops are large and slow and far ones fine, the whole field sweeps when the
  camera turns, and a sandstorm blows along a compass direction rather than across
  the frame. A streak lies back along the way it is actually travelling, which
  matters most for the skies that are more sideways than down.

  The far sky is built as geometry where a place is what it wants. The aurora is a
  ring of folds hanging over the board, bright over the far ground and fading as
  it comes round in front, and meteors cross on a bearing.

  The bows and the mirage are light rather than shape. A rainbow is a field of
  colour worked out for every pixel and laid over the whole picture: bands of the
  spectrum that walk across it, bend as they go, and slide when the camera turns.
  A fogbow is the same field with the colour drained, which is what a fogbow is,
  and a fata morgana lies its bands flat and stacks them, so the country comes
  apart in strata the way it does over a hot road. The arch they were drawn as
  first was worse than the flat version: a real bow is at infinity and cannot be
  walked around, and one built over the chunk read as a hoop standing in the
  field.

  Two things fell out of the work. Weather is drawn back to two fifths of the
  density the tables ask for, because drops that stand in the world pile up down
  the near half of the volume and read far heavier than the same number ever did
  flat against the glass. And the far half of the volume, which projects into a
  mat of sub-pixel drops along the horizon, is thinned by depth. Between them the
  sky costs less than it did even for the three heavy skies that gave up their
  scrolling-tile shortcut: a downpour at 1280x720 went from 8.99ms a frame to
  2.19, a sandstorm from 8.22 to 0.69.

  The weather demo has no board to stand in, so it keeps the flat sky.

- fd633ab: The weather demo stands its skies on a board.

  It used to draw them over a flat checkered country, which was fine while the sky
  was painted on the glass and useless the moment it stopped being: weather that
  stands in the world needs a world to stand in, so on that page every sky was
  falling back to the flat version of itself and the demo was quietly showing the
  wrong picture.

  There is a board now, drawn through the same camera the overworld uses, its
  cells checkered and its marks standing on the ground rather than on the screen.
  Drag it to walk the camera round, which is the only way to see what weather in
  the world is actually doing, and it takes a two-finger twist the same way the
  overworld does. The drag is the overworld's own: a bit of the plane is taken
  hold of and the board turns so it stays under the pointer, rather than the
  sideways slide the page started with.

  Both switches that made the page worth having are still there and there is a
  third. Turning WebGL off gives the 2D pass, which is the only way to catch the
  two renderers drifting apart. Taking it off the board gives the flat sky every
  painter still falls back to without a camera, so that path stays somewhere it
  can be looked at rather than only somewhere it can be tested.

- 6aa24b1: The battle AI weighs several kinds of move it was reading wrongly, and a
  pokemon with nothing that works no longer stands still for the rest of
  the fight.

  Fixed-damage moves carry no power, so Seismic Toss, Night Shade, Dragon
  Rage, Sonic Boom, Super Fang, Psywave and the three one-hit knockouts
  were all read as doing nothing at all and picked only when everything
  else was worse. They are asked what they take off now. A multi-hit move
  is counted for every strike rather than the first, and how often a move
  lands is part of what it is worth, so a thirty percent Fissure no longer
  weighs the same as a certainty.

  Moves that cost the user something now say so: an Explosion while the
  user is healthy, recoil on a pokemon that cannot afford it, a Jump Kick
  whose miss would be fatal, the turn Hyper Beam spends recharging, and
  the cast anything with a wind-up spends before it lands. A rampage is
  exempt, since it strikes on every one of those. Stat-stage moves are
  declined once the stage they push is pinned, which they only were in
  raids before, and Haze is declined by the side that is ahead, since it
  clears the user's own boosts along with everybody else's. Healing is
  weighed by what it would actually put back rather than by a threshold,
  and a drain is worth more to a pokemon that is hurt.

  Two things that were plainly wrong: weighing a move against a target
  holding a resist berry ate the berry, and the AI's damage estimate drew
  from the battle's random stream once per move it considered.

  Struggle covers a pokemon that cannot reach anybody rather than only one
  whose moves have been shut off. A Normal type facing nothing but Ghosts
  has a full move set and no way to touch anyone with it, and used to
  stand there until the fight ended. A cooldown is still not that: a
  pokemon waiting for its moves to come back waits, the way it always did.
  Raid bosses stand there too, since a boss struggling itself down would
  hand the lobby the raid.

## 1.3.0

### Minor Changes

- e716fc8: A sky now decides who turns up, not only how good they are.

  Weather used to be worth a floor under the values of whatever it was about: a
  Water type met in the rain came out better, and the rain did nothing to make one
  turn up. Now it crowds its own types into the chunk's spawns at twice their
  ordinary weight, the way a species day crowds its family, so walking into a
  storm is a reason to look for what a storm is about.

  The bands do not move, so a favoured rare stays rare and only wins its band more
  often, and a sky can only crowd what already lives there: rain over a grassland
  roughly doubles a small share of it, and rain over a coral reef changes nothing
  because everything there was already Water. Twice rather than the species day's
  four times, since a day is one family for one day and a sky is a whole type for
  an hour.

  The four rarest skies are left out. Meteor Shower, Fata Morgana, Dark Day and
  Fogbow are kind to every type, and lifting every entry by one factor is the pool
  they started with; what those are worth is already in what they hand over.

  This changes what a chunk is holding under a typed sky, the way anything
  touching world generation does.

- c326077: Eight abilities that now do something out in the world.

  - **Keen Eye** and **Intimidate** keep the weak away: the bottom of the band a
    wild meeting rolls in lifts by three levels, so a chunk stops fielding what is
    far below the pokemon at your side.
  - **Hustle**, **Pressure** and **Vital Spirit** do the opposite, and the top of
    the band lifts instead. They are separate rules rather than one shifted band,
    so a player walking with one of each gets both.
  - **Stench** is the Pure Incense worn rather than carried: two fewer pokemon
    come near, and never fewer than none.
  - **Compound Eyes** finds what a pokemon has in its mouth. The two rare held
    item slots turn up two and a half times as often, taking a rare one from a
    hundredth of meetings to a fortieth. The common slot is left where it is: it
    is already half of every meeting, and widening it would hand something over
    every time without making the thing worth searching for any likelier.
  - **Frisk** says what is standing in front of you is carrying, on a badge in the
    corner of the safari, before anything is thrown at it.

  Each is a listener on a question the overworld asks, the way the lures and
  Synchronize already were, so nothing that stages a meeting or draws a screen
  names an ability.

## 1.2.0

### Minor Changes

- 9bb1562: A page for looking at the weather, at `/demo/weather`.

  A sky is derived from the country and the hour, so seeing a particular one meant
  finding the one place and window that rolls it. This stages any of the twenty
  six over any biome's ground, at any strength, running or stopped a frame at a
  time, with the sky in the address so a link is a demonstration. It says what the
  weather does to the world as well as what it looks like: the types it favours,
  the shiny and hidden ability multipliers, whether meetings carry an egg move or
  come out shadowed, whether it carries into battle.

  It draws through both of the board's painters rather than only the one a browser
  happens to give. The WebGL pass draws every drop with a pace of its own and the
  2D fallback tiles its fall, and a switch between them is the only way to see the
  two drift apart, since nothing else in the game can reach the fallback on
  purpose.

- 9bb1562: Five skies that were not saying what they are.

  - **Dark Day** is no longer a wash. Noon gone dark hid the things a player was
    standing there to find, so it is drawn as a dark room instead: near black
    everywhere, with a pool of light around the player and around every landmark.
    A wild pokemon carries no light, so finding one under this sky means walking
    a lamp onto it. The lights are cut out of the dark rather than laid over it,
    so two standing close together share one pool instead of stacking into a
    bright spot.
  - **Illuminate is a lantern out here**, on top of the lure it already was: a
    buddy that has it more than doubles how far its owner sees under a dark sky.
    The overworld engine asks how far a lamp reaches the way it asks everything
    else, so the ability is a listener and nothing that draws the board names it.
  - **Fata Morgana** and **Fogbow** had no visuals at all and rendered exactly
    like a clear sky, which was the whole of what the two rarest skies in the game
    looked like. The mirage is a warm veil with fine shimmering strata over
    dead-still air; the fogbow is a rainbow with the colour gone, broad and white
    with a blush at either edge, standing in fog's own veil.
  - **The aurora** was one gradient band screened over the board, which read as a
    white smear. It is drawn fold by fold now, green low and violet at the crown,
    each fold hanging to its own depth and lighting to its own brightness as the
    wave walks along the sky.
  - **The meteor shower** was a fall, and a sparse fall is thin rain. It is a few
    shooting stars at a time instead, each a bright head with a tail that fades
    out behind it, drawn in as it sets out rather than arriving whole.
  - **A thunderstorm has lightning.** The sky lights up every few seconds, jittered
    rather than on a beat, with the stroke and its return, and some strikes
    further off than others.

  Both painters do all of it: the WebGL pass and the 2D fallback the board uses
  when a browser will not give a context.

### Patch Changes

- 9bb1562: A raid lobby shows each party at a size worth looking at.

  Every row in the lobby drew two frames around the same thing: the row's own
  bordered container, and inside it the strip of squares, which draws a frame of
  its own. The name plate shared that container, so the strip was pushed onto a
  second line and capped at 240 pixels, which is six squares of about 33 pixels
  each. At that size one pokemon looks much like another, which defeats the point
  of showing a party before the fight.

  The row carries no frame now. The name plate wears one instead, and the strip
  takes the width the row has left: on a wide screen that is roughly 500 pixels,
  so the squares are about two and a half times what they were, and the row is
  shorter than the two-line version it replaces. On a narrow screen the plate
  sits above the strip and the strip takes the whole width, which is still
  larger than the old cap.

- 9bb1562: Two fixes to the pictures on a catch sheet's evolution list, both of them the
  sheet asking the dex the wrong question.

  A shiny's sheet no longer gives away an evolution the reader has never held
  sparkling. What a pokemon turns into is drawn to what the reader has earned of
  it: a shadow until they have owned one, which is the half of a dex entry that
  sends somebody out looking. The row asked about the ordinary coat whatever it was
  standing on, so a shiny Pidgey whose owner had kept an ordinary Pidgeotto was
  shown a full Pidgeotto, and a shiny Pidgeotto they had never held was drawn for
  them anyway. A shiny is its own half of an entry, so the row asks about the coat
  it is actually going to become.

  The shadow is the ordinary sheet with the colour taken out rather than a shiny
  sheet fetched in order to be hidden, since the two are the same shape and only
  one of them is already in hand.

  A species the reader was given but never met is no longer drawn as Missingno. The
  row read the met tally alone, and a gift arrives without a meeting, so a
  Pidgeotto that had only ever been handed over was a pokemon the sheet claimed
  nobody had laid eyes on while one stood in the reader's own party. Owning one
  counts as having met it, which is what the dex itself has always said.

- 9bb1562: Selecting a run of pokemon no longer slows down as the run grows.

  Picking the thirtieth pokemon in the Catches dialog lagged, and the reason was
  that almost nothing on the way to a square was held. Every press rebuilt the
  whole box: the list was filtered, sorted by date, searched and ordered again,
  and the set of what was already picked was rebuilt once per square rather than
  once per press. That last one is what made it worse the more was selected, since
  the cost was everything on the page multiplied by everything picked.

  Worse, the page itself was sliced on demand, and a grid asks for the page it is
  drawing once per square. Measured against a list of two hundred with a box
  thirty wide, fifty reads of the page rebuilt the list fifty times; it now builds
  once and the rest are free. The live picker also handed its selection to the
  caller and was handed the same selection straight back, redrawing the box a
  second time for a press that had already been drawn.

  The list, the search over it, the page under it and the set of what is picked
  are all held now, a square looks its own record up by id instead of scanning for
  it, and an echo from the caller is recognised and ignored.

## 1.1.1

### Patch Changes

- 25a81af: A trade evolution now opens for what the pokemon was when it changed hands. A
  Machop that was traded and then grew into a Machoke wants a handover of its own
  before it becomes a Machamp, where it used to become one for free. The record
  also remembers what came the other way, for the lines that ask.

  Razor Claw and Razor Fang are no longer filed as trade items. Neither is handed
  over before a trade in any generation: both are held through a level at night,
  so both are held items here and neither can be spent.

- 25a81af: The sky has a tier above its showpieces, and there are four of them.

  Weather is read off two channels, wetness and energy, and a showpiece has always
  been the corner where both run high. The corner is not what made those skies
  rare, though: a sky wired into eight countries turns up on far more ground than
  one wired into five, however narrow its band, so the meteor shower was the eighth
  rarest weather in the game while its own description called it the rarest there
  is.

  The field has four corners and only one of them was doing anything. All four have
  a sky now, each reached from further out than a showpiece and each falling over
  every country in the world, so the band rather than the map is the whole of what
  holds them back. They are the four rarest weathers there are, at roughly one
  window in twelve hundred each.

  Each favours **every type at once**, which nothing else does: every other sky
  picks a type or two, so a meeting under one of these carries the weather's floor
  of 10 under its values whoever is being raised. Each then does one thing no other
  weather does, and no two touch the same part of what a pokemon is.

  A **meteor shower** doubles the odds of a shiny coat. It is the sky that was
  already here, moved to a band of its own and opened to every country.

  A **fata morgana** doubles the odds of a hidden ability. It is the mirage that
  rises off dead-still air and stacks a distant coastline into cliffs, and what it
  is worth is the mirage's own joke: it shows what was not there to be seen.

  A **dark day** is noon gone dark under smoke carried from somewhere else, in air
  that is bone dry and moving hard. About a third of what is met in the wild under
  one comes out a **shadow**. It is the only place outside Team Rocket that a
  shadow comes from, and a shadow is worth having, since purifying keeps the mark
  and adds two points to every value. A third rather than all of it: a sky that
  closed every heart under it would make the shadow a property of the window rather
  than of the meeting, and a player who found one would be collecting rather than
  deciding.

  A **fogbow** is a rainbow with the colour gone, formed in fog fine enough to
  scatter the light white instead of splitting it, which takes air holding all it
  can and nothing moving it. Anything met in the wild under one already knows one
  of its line's **egg moves**, which breeding was the only way to come by. About
  half the families have an egg move at all, so half of what is met under a fogbow
  is handed nothing.

  Shadows are **half as likely to be caught** as they were, whether they were found
  under a dark day, taken off a grunt or won out of a raid. A closed heart does not
  want to be held, and it is the one thing purifying puts right. The penalty is
  flat rather than scaled, because the reason has nothing to do with the species or
  its level: the same thing is wrong with every shadow. It multiplies with the
  ball, the berries, the day and the level rather than replacing any of them, so a
  better ball buys exactly what it always bought. Nothing that never fled starts
  fleeing, so where a shadow was given rather than found the only cost is balls.

  Sandstorms fall over the **badlands and the cold deserts** as well as the desert.
  A sandstorm was the second rarest sky in the game at one window in 655, and by
  accident rather than design: it is an ordinary stirred sky that happened to sit
  on the smallest country there is. Bare eroded sediment and cold desert both raise
  their own sand, and the world's worst sandstorms come off cold ones. It is one
  window in 172 now, which is where an ordinary sky belongs. The savanna and the
  shrubland keep their dust haze, since grass cover means dust carried in rather
  than sand lifted.

  This changes what the sky over an existing chunk is doing, the way anything
  touching world generation does.

- 2388a68: The board's ground and grid are drawn on a layer of their own, in batches.

  A tilted cell is not a rectangle, so every one of the 324 tiles was laid
  through its own skewed transform: a save, a transform, a blit and a restore
  each. The grid over them was 324 more paths, built and stroked one cell at a
  time. Together that is most of what a phone was spending a frame on, and none
  of it fell when the window did.

  Both now go into one buffer on a WebGL layer beneath the board, handed over in
  a few calls: one per run of tiles that came off the same sheet, and one for the
  whole grid. The layer sits under everything because nothing on the board is
  drawn beneath the ground, so the order the passes already ran in is the order
  they still run in. A browser that will not give a WebGL context, or one that
  takes it away again, falls back to drawing both exactly as before.

  The grid still rules every cell's own four edges rather than ruling a lattice,
  so two cells sharing an edge lay their lines over each other and that edge
  stays the weight it has always been.

  Two things look slightly different, both of them corrections. A tile is laid on
  its cell's true four corners rather than on the parallelogram a 2D transform can
  describe, so it sits on the grid line drawn under it. And the label shown while
  a chunk is still arriving is no longer painted over by the ground it was meant
  to be read against.

  The weather is batched the same way. A blizzard was about two thousand stroked
  drops a frame; it is one draw call now. Rain, a downpour and a sandstorm used to
  be drawn as two scrolling sheets rather than drop by drop, which was only ever a
  way of not paying for eleven thousand strokes. A batch does not charge for them,
  so those three get their own paces back.

  The batching happens off the page and is laid into the picture where each pass
  belongs, rather than on canvases stacked over the board. A canvas above another
  cannot be washed by it: the hour's light is multiplied over the whole picture,
  and a multiply has to read what is under it. Drawn off to one side and blitted
  in, the ground is inside the picture and every pass after it behaves as it
  always did.

  One thing is not identical. A tile's texels land through a different rasteriser
  now, so the pattern inside a tile can shift by a pixel here and there. Same
  tiles, same colours, same edges: it shows up in a pixel comparison and not on a
  board being played.

  The stand-in art is gone with it. A decoration used to be drawn as a cone or a
  mound, and a landmark as a lettered disc, for as long as their sheets took to
  arrive. Every decoration and every landmark that is drawn as a thing has a
  picture now, so a cell shows nothing until its own picture is in hand rather
  than something the game does not otherwise use.

  The ring under a person stays. It is not a stand-in: a charset says which coat
  somebody is wearing and nothing about whether walking up to them starts a fight,
  which is the whole of what the ring is for. It is drawn once into a shared sheet
  and stamped from there, which is where the art that has no picture is headed.

  Everything else on the board followed it into the batch: the phenomena, the ring
  under a person, the ring of ground within reach, the scenery, the plants, the
  people, the pokemon and their shadows, the cursor and the border round the
  board. Each sprite class answers with the rectangle it would have drawn instead
  of drawing it, and its own `draw` is written in terms of that answer, so the two
  ways of putting a sprite on the board cannot come to disagree.

  The phenomena are the one thing here that is drawn in code and moves while it is
  drawn, so each is repainted into a small picture of its own once a frame rather
  than once a cell. A picture that size costs nothing to hand over; the whole
  screen would cost too much, which is the rule the rest of this follows too.

  The battlefield's own ground is batched now as well. It is 448 tiles a frame at
  the ordinary camera, laid the same way the board's were: a save, a skewed
  transform, a blit and a restore each, whatever the fight is doing. Writing them
  into a batch costs about half a millisecond against six for painting them.

  It sits on a WebGL canvas stacked under the one the fight is drawn on, rather
  than off the page and copied in. Nothing on the battlefield is washed over the
  whole picture the way the hour's light washes the board, so there is nothing
  here that has to read what is beneath it, and a stacked layer costs nothing per
  frame where a copy would cost a full screen of it.

  A cell of a tilted plane is not a parallelogram, and a 2D context can only draw
  one: the tile used to be fitted to the longer of each pair of opposite edges so
  that neighbours lapped over rather than falling short. It is drawn on its four
  true corners now. Tiles are sampled half a texel inside their own edges, since
  a sheet packs them against each other and a sampler at an edge reaches past it.

  The field's own colour is the layer's background rather than a rectangle painted
  over the canvas every frame, so a biome with no tileset packed for it looks
  exactly as it did.

  The compass is four marks now rather than four letters. Each is a triangle
  pointing the way it stands for, and north is the game's own ember, so which edge
  of the board is which is read as a shape and a colour rather than as four
  letters read one at a time. They stand where the letters stood and turn with the
  board the same way, each on a halo of its own so it shows against pale country
  and dark alike.

  It is also the last thing on the board that was writing. A triangle is three
  corners, which the batch takes as it takes anything else, so nothing on the
  board needs a font any more.

  The board is one pass now. The batch learned the two blend modes the hour's light
  is made of, and that was the whole of what kept the picture in two pieces: a
  multiply has to read what is under it, so the light could not be laid on a canvas
  stacked over the board and had to be painted onto the same one, which meant
  copying the batched layer across twice a frame. Both copies are gone.

  For a wash to mean anything it has to fall on something opaque, so the layer
  paints the country itself rather than letting the page show through. That is the
  same colour the page behind it was painted anyway. It does mean the ground
  outside the board is darkened by the evening the same way the ground inside it
  is, where before the light was multiplied over the board and laid flat over the
  country beside it.

  Everything else that was still painted went with it: the waiting label, the
  sparkle a shiny throws, the dots that stand in for a sheet still coming, the
  aurora's curtains and the rainbow's arc. Words are baked at the size and in the
  font they are drawn in rather than baked once and stretched, which is what made
  a scaled halo come out heavier than the stroke drew it.

  Shadows are the thing itself now. A pokemon or a person on the board throws its
  own silhouette rather than an ellipse standing in for one, and a shadow at dawn
  is recognisably the shape that cast it. It costs the same one quad the sprite
  did.

  It is a skew rather than a turn. The edge under the feet stays square to the
  picture and exactly where the picture put it, so a shadow is always joined to the
  thing that cast it; only the far edge leans, and it leans the way the light
  throws it. What carries the direction is the pose. A shadow is the silhouette from where the
  light stands, so which of a sheet's eight frames is laid down is the angle
  between the way the thing faces and the way the light is, not the shadow's own
  bearing: something looking straight at the light lays its front down, and the
  same thing with the light off its left lays its right down.

  Two things about the light itself were wrong and are fixed with it. The board
  counts down the picture, so a step north is a step toward smaller numbers, and
  the shadow's bearing was read as though it counted up: everything with any north
  or south in it lay the wrong way round, and turning the board swung it somewhere
  else again rather than turning it. And the bearing was laid back by a number of
  its own rather than by the board's, so it pointed a few degrees off the ground it
  was supposed to be lying on. Both now come from the tilt the board is drawn at,
  and a test holds the shadow's bearing against the board's own projection of the
  same step at every hour and every turn.

  The battlefield followed. The pokemon, their shadows, the auras a shadow or a
  purified one stands in, the health and cast bars, the name of whatever is being
  wound up, and the weather are all written into the batch now; a fight is a
  handful of calls where it was several a pokemon. Move effects stay painted on the
  canvas above: there is at most one on screen, and a layer that is never copied
  costs nothing to leave there.

- 25a81af: A nest no longer lays the wrong stage of a line.

  An egg is the first stage of whatever it holds, found by walking a line back
  until nothing evolves into it. For eleven Kanto species that walk stops one
  stage short, because the stage in front of them is a baby a later generation
  added and the game has not registered yet: a Pikachu hatches from a Pichu, and
  until there is a Pichu the nest was laying a Pikachu.

  Those eleven are left out of nests until their babies arrive: Pikachu, Clefairy,
  Jigglypuff, Hitmonlee, Hitmonchan, Jynx, Electabuzz and Magmar, whose babies are
  Johto's, and Chansey, Mr. Mime and Snorlax, whose are further off. Nothing else
  about them changes: they are still met in the wild, still bred and still
  evolved. Every biome still has nests.

  This changes what an existing nest is holding, the way anything touching world
  generation does. An egg already laid keeps what it was laid as.

- 3b2d892: A note over the board says the whole reward rather than the first few letters.

  The little cards that pop over a cell when a cache pays out were one line
  clipped with an ellipsis inside a narrow box, which left about fifteen
  characters for the item's name and the count beside it. Anything longer read as
  "Silver Nanab Ber…", and the line for a cache that was already empty rarely fit
  at all. It is the only place the payout is named, so a clipped one is a reward
  the player was never told about.

  The card is wider now and its line wraps instead of clipping, so a note grows to
  two short lines rather than losing its end.

- 25a81af: Four fixes to what the game shows and what a stray press can throw away.

  - **A stop fight is named for whoever is standing there.** The summary called
    every side nobody owns a Team Rocket grunt, and drew it as the character the
    game starts everybody as, because an unowned side has no profile to read a
    face from. A duelling trainer, a gym leader, one of the Elite Four, the
    Champion and Giovanni are all fought from a stop, and each now keeps their
    own name and the coat they were wearing out in the world, in the summary, the
    title and the line a win is announced with.
  - **A meeting that happens once is answered by its buttons.** A phenomenon's
    pokemon and a prize won in a raid, off a grunt, from a quest or off the gift
    shelf are all spent as they are opened, so an accidental press on the world
    behind the dialog threw the whole thing away. Those close on "Run away" and
    nothing else. A wild pokemon on a cell is still standing there afterwards,
    and closes as it always did.
  - **Purifying says what it costs before it happens.** The gem asked twice
    without saying why, and Nurse Joy purified a shadow for good as a side effect
    of an ordinary heal, with only a note on the row. Both now warn, and hers
    asks twice for a shadow alone.
  - The vendor's basket reads down the middle: the purse, the running total and
    the button that spends it were spread between the right edge and the centre.

- 2388a68: An encounter is marked shiny with the same sparkles everything else uses.

  The safari dialog was named `Lv. 12 ✦ Gyarados ♂`, using a text glyph the rest
  of the interface stopped marking shinies with: the box, the catch sheet and the
  buddy card all draw the sparkles icon instead. One screen still spelling it out
  in a character is one screen the player has to learn twice.

  The title now carries the icon. It is left in the title bar's own white rather
  than the gold a card draws it in, because gold on that blue is barely a colour
  at all, and the word "Shiny" rides along for a screen reader, since the dialog
  is announced by this heading and a picture says nothing to one.

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
