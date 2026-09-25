# overwander

## 4.18.0

### Minor Changes

- 4ba82de: Reshiram, Zekrom and Kyurem can be met, and Kyurem can be fused.

  - Dragonspiral Tower stands in taiga and tundra and holds Reshiram and Zekrom,
    one of the two each time. Giant Chasm stands in tundra and glacier and holds
    Kyurem. Each of the three is also a wild spawn where its lair stands.
  - Their signatures are one idea told three ways. Truth Creed hits 1.3x an enemy
    carrying a status condition, Ideal Creed 1.3x an enemy carrying a raised stat
    stage, and Hollow Creed 1.3x an enemy carrying neither.
  - Turboblaze and Teravolt are new, and both do what Mold Breaker does: the
    target's abilities cannot hinder their moves.
  - The mainline gives each of them one ability, so each carries three of this
    registry's own. Reshiram has Flash Fire, Pressure and Serene Grace, Zekrom
    Motor Drive, Pressure and Sheer Force, and Kyurem Snow Warning, Ice Body and
    Intimidate.
  - The DNA Splicers are new. Used on a Kyurem they ask which dragon to fold in,
    and the pokemon picked goes inside the fusion rather than being spent: it
    leaves the boxes until the two are taken apart again, which the same pair
    does. The fused pokemon names what is inside it, so nothing is lost. Black Kyurem takes Zekrom's Attack and Teravolt, White Kyurem takes
    Reshiram's Special Attack and Turboblaze, and neither may be folded out of a
    fight, an egg or the buddy slot.
  - Changes world generation.

- bb78f7b: The three that ride the storm clouds, and the shrine they come back to:

  - Tornadus, Thundurus and Landorus all stand in the grassland, at any hour, out of the Abundant Shrine. One lair holds all three, the way the burned tower holds the beasts.
  - Each carries one gift, told three ways: Windfall has its team throw Flying moves at 1.3x, Stormfall does the same for Electric and Landfall for Ground. Three of them standing together lift three different elements.
  - Tornadus can be born with Wind Rider or Snow Warning, Thundurus with Lightning Rod or Drizzle, and Landorus with Harvest or Sand Stream.
  - Each one's second shape is written and none of them can be reached yet: the mirror that turns one into the other works the way the Meteorite does for a Deoxys, and it waits until the other two shapes are drawn.

- 931108b: The three Unova mythicals, and the machinery two of them needed:

  - Victini stands on the rocky coast, Meloetta in the woodland and Genesect in the desert, at any hour.
  - Three new lairs: Liberty Garden for Victini, the Abyssal Ruins for Meloetta and the P2 Laboratory for Genesect. No biome hosts one, so the world never puts a mythical on the map.
  - Three new relics, found in the rarest band of the overworld item pool and nowhere else. The Liberty Pass calls Victini, the Music Box calls Meloetta and the Colress Machine calls Genesect. Each is spent when its raid starts.
  - Victory Star now works: the holder's whole team, itself included, throws moves at 1.1x accuracy.
  - Winner's Share is Victini's own. Each enemy that faints gives its whole team +1 Attack and +1 Special Attack.
  - Countertune is Meloetta's own. Changing shape swaps its Attack and Special Attack stages, and swaps its two defences.
  - Overclock is Genesect's own. It casts 25% faster above 1/2 HP, and at or below that it loses 1/16 of its HP each time it acts.
  - Relic Song turns a Meloetta from its singing shape into its dancing one, and back again.
  - A Genesect holding a Drive now fights in that Drive's shape. The Drive already set the type of its Techno Blast.
  - Dancer now works: whenever anybody uses a dance move, the holder casts the same one straight after, for free. Rain Dance does not count as a dance.
  - Victini can also be born with Flash Fire, Inner Focus or Magic Guard. Meloetta with Soundproof, Healer or Dancer. Genesect with Analytic, Synchronize or Adaptability.

### Patch Changes

- daa0a46: The catch dialog shows the pokemon's level before its category.
- 5aaf21c: People standing past the live part of the board wear their own coats, so a far syndicate, gym leader or trainer no longer looks like a Rocket grunt or an Ace Trainer.

## 4.17.0

### Minor Changes

- d4307a7: The time of day runs on a game clock where each period lasts 90 minutes, unless a deploy sets it to follow the local clock.

### Patch Changes

- 01411af: On a short screen the catch sheet's left column scrolls, so its evolutions no longer spill over the history line.
- 8a2fcbe: A town in the portal's list shows its distance and country on a line under its name, so a far town's distance stays inside its row.

## 4.16.2

### Patch Changes

- e82e285: The place card on the menu bar says what the weather does and which types it favors again, without a hover.

## 4.16.1

### Patch Changes

- f04e837: The bag is read once and kept up to date as it changes, so opening the bag, a
  picker or a dialog that shows item counts no longer reads it again each time.
- 70912c6: - A berry, apricorn, cache, nest or phenomenon claim and what it pays land
  together, so a failure can no longer spend a landmark without paying it.
  - Lathering a honey tree spends the jar in the same step as the lather.
  - A hatched egg's candy lands in the same step as the hatching.
- 0961303: - The catch sheet no longer reads the pokemon and the bag a second time to
  list its evolutions.
  - Throwing or feeding in an encounter no longer reads the whole bag again.
  - Counting one item or one family's candy reads only that row.
  - A bag or candy read that fails says so instead of showing an empty bag.
- 44dfa65: A raid lobby updates from the live stream when a party joins or leaves, rather
  than every member reading the whole lobby again, and only the party that joined
  is read.
- 7a938fd: - The server refuses a player acting faster than the game can: every call is
  paced, and throws, treats, claims and walked steps have limits of their own.
- c5099be: Pay Day coins are only paid out for a pokemon that could have used the move,
  and never more than the casts the fight had time for.
- 653ead2: A read or save the database refuses is explained in the game's own words
  instead of showing the database's message.
- 24a4a57: A tab that does not say which version of the game it is running is asked to
  reload before it can call the server, the same as a tab from an older version.
- eca6f39: Steps walked are counted toward quests only once the walk itself is saved, so a
  walk that fails to save is no longer counted.
- 86e3305: - Every throw and treat in an encounter is decided on the server: the ball is
  spent, the catch is rolled and the pokemon is written together.
  - An encounter can no longer be caught more than once.
  - Feeding and throws carry over when an encounter is closed and met again.

## 4.16.0

### Minor Changes

- ccf396b: - Cobalion, Terrakion, Virizion and Keldeo can be met. Cobalion keeps the
  Guidance Chamber in the mountains, Terrakion the Trial Chamber in the
  mountains and badlands, and Virizion the Rumination Field in the temperate
  forests and woodlands.
  - Keldeo is a mythical, so no lair stages it. It waits in the bogs, and the
    Colt's Petal calls one out to be fought.
  - A Keldeo that knows Secret Sword fights in its Resolute form.
  - A form with no art of its own is drawn as its base form instead of
    Missingno.
  - Iron Vigil, Stone Vigil, Leaf Vigil and Tide Vigil each guard the holder's
    team while it stands: physical moves land at 0.8x, special moves at 0.8x,
    indirect damage at 0.8x with no poison, and enemies can neither flinch a
    teammate nor knock its stats down.
  - All four reach three of this registry's own abilities beside Justified:
    Sturdy, Clear Body and Inner Focus for Cobalion, Sand Rush, Rock Head and
    Moxie for Terrakion, Chlorophyll, Leaf Guard and Serene Grace for Virizion,
    and Swift Swim, Analytic and Steadfast for Keldeo.
  - Changes world generation.
- 85e0f35: Route 12 and the last of the region's roads, and the three families along them:

  - Durant works the badlands and the mountain by day, and Heatmor comes over the same badlands and the volcano after dark, which is when it opens the nest.
  - Larvesta and Volcarona stand in the desert by day, and on no other ground. The moth is a legendary here and the grub is as rare as a baby.
  - The Relic Castle is a legendary lair in the desert, with Volcarona in it. A raid in the desert can stage it, the way one in the mountain can stage Mt. Ember.
  - Each family brings its own signature ability: Anteater has Heatmor hit 1.5x into Bug and Steel, Ant Guard has Fire moves land on Durant at 0.5x, and Ember Halo costs every enemy 1/16 of its HP each time it acts near a Volcarona. Heatmor into Durant comes out at 0.75x, so the ant wins the exchange it was built to lose.
  - Heatmor can be born with Sheer Force, Durant with Compound Eyes, and Volcarona with Drought or Magic Guard.

- ab0083d: Twist Mountain and the moor below it, and the four families around them:

  - Cubchoo and Beartic across the tundra and the glacier by day, Cryogonal over the glacier and the alpine tundra after dark, Tynamo through Eelektross on the mountain and in the bog at the same hours, and Mienfoo and Mienshao on the mountain and in the montane forest by day.
  - A Tynamo knows four moves and never learns a fifth until it is something else, which is how the games have it.
  - Each family brings its own signature ability: Frost Fangs has Beartic's contact moves hit 1.25x with a 20% chance to freeze, Crystal Chain holds a freeze on an enemy open twice as long while Cryogonal stands, Latch On stops whatever Eelektross closes on from fleeing and bleeds it 1/16 each time it acts, and Sleeve Guard has contact moves land on Mienshao at 0.75x.
  - Cryogonal can be born with Ice Body, Snow Warning or Clear Body, Eelektross with Volt Absorb, Strong Jaw or Water Absorb, and Mienshao with Iron Fist. Beartic needs nothing invented, because Rattled walks up from the Cubchoo below it.

## 4.15.1

### Patch Changes

- a09533a: A pokemon's burn, poison, paralysis, sleep or freeze shows as a coloured square beside its health on its hover card and catch sheet, named when hovered.
- 1718dd7: Coming back from a battle no longer puts the player back where a teleport last dropped them.

## 4.15.0

### Minor Changes

- 46d2add: Other players walking nearby on the overworld are drawn on the board, in
  their own charset, a couple of seconds behind where they walked.

### Patch Changes

- 612d57b: Opening a box or a pokemon picker reads only the pokemon that are new or
  changed since it was last opened, instead of the whole collection.
- 4afafc8: - On a phone, the catches box's sort and select controls sit under the search rather than squeezing it.
  - On a phone, the catches box's selection buttons wrap, so Close stays on screen.
  - On a phone, the portal's town list leaves out the biome so the town names have room.
- ff045f7: Saved teams load their pokemon in one request instead of one at a time.
- 475c014: Redrawn sprites, such as the Unova candies, now show up in place of the old ones.
- 8737c4a: The battle summary is laid out anew:

  - It lists what the fight paid: gold, a badge, items, candy, and the pokemon waiting in the overworld.
  - The two sides face each other, marked Won or Lost, with each side's share of the damage.
  - Each pokemon shows its level and the health it finished on, or that it fainted.
  - The best damage dealer is named under the sides.
  - Rewards claimed after you leave the battle still arrive as notes in passing.

## 4.14.0

### Minor Changes

- d0ddcaa: Celestial Tower and the road to it, and the three families around them:

  - Litwick, Lampent and Chandelure over the bog and the woodland after dark, Elgyem and Beheeyem out in the desert and the cold desert, and Golett and Golurk across the badlands and the steppe. All three families keep to the evening and the night.
  - Lampent becomes a Chandelure on a Dusk Stone, which is the first Unova line to evolve on a stone rather than a level.
  - Each family brings its own signature ability: Hexlight has a lamp hit 1.4x into anything that already carries a status, Swap Field casts Wonder Room as a Beheeyem arrives, and Broken Seal gives a Golurk 2 stages of Attack for 1 of Defense the first time it drops below half.
  - Chandelure can be born with Illuminate, Beheeyem with Forewarn, and Golurk with Stamina.
  - Agatha fields the Ghost type and her named Golbat and Arbok, and no longer draws on the whole Amorphous egg group. That widener dated from when Kanto had one fully grown Ghost, and it had come to reach Gardevoir, Gallade and Castform.

- 82f6e65: Dragonspiral Tower and the tunnels under it, and the three families around them:

  - Axew, Fraxure and Haxorus on the mountain and in the montane forest by day, Druddigon on the mountain and the badlands and in every cave, and Deino, Zweilous and Hydreigon across the badlands and the volcano after dark.
  - Each family brings its own signature ability: Scoring takes a stage of Defense off with every physical move Haxorus lands, Sunwarmed has Druddigon cast a quarter faster while the sun is up, and Three Heads has every move Hydreigon lands also bite a second enemy for a third of the damage.
  - Haxorus can be born with Hyper Cutter, Druddigon with Intimidate, and Hydreigon with Berserk or Pressure.
  - A fully grown wild pokemon can now be met up to level 80 rather than 60. Hydreigon does not exist below level 64, which the old ceiling had no room for.

- fa1c90f: The last two roads out of Opelucid, and the three families along them:

  - Pawniard and Bisharp in the badlands and the shrubland after dark, Rufflet and Braviary on the mountain and the steppe by day, and Vullaby and Mandibuzz over the badlands and the desert at the same hours.
  - Every Rufflet and Braviary is male and every Vullaby and Mandibuzz is female, the way the games have them.
  - Each family brings its own signature ability: Honed gives Bisharp 1 stage of Attack every time an enemy raises a stat of its own, Warcry gives Braviary 2 stages of Attack every time one of its teammates falls, and Bonewear gives Mandibuzz 1 stage of each defence every time an enemy does.
  - Mandibuzz can be born with Guts. Braviary needs nothing invented, because Hustle walks up from the Rufflet below it.
  - A wild pokemon at the end of a two-stage line can now be met up to level 70 rather than 50. Bisharp, Braviary and Mandibuzz all arrive above the old ceiling.

### Patch Changes

- 86b1eb7: Badges and other extra sprites show again on the awards shelf.
- b561303: The world map's pan and recenter buttons and the catch list's sort direction button draw centered icons instead of text arrows.
- 560e6df: - The portal shows itself and its fee, and lists every town nearest first with its biome, distance and direction, with a search to narrow the list.
  - An egg's dialog names the buddy you would put down to carry it.
- 234fd69: - The Fossil Scientist lays your fossils out in his own dialog rather than opening a second window.
  - The Channeler shows her Heart Scale fee and how many you carry, the way the Move Reminder and Tutor do.
- 2094137: The Move Reminder and Move Tutor ask in two steps:

  - First pick a pokemon from your box.
  - Then that pokemon stands on its own above the moves on offer, with a button to change it.
  - The fee and how many Heart Scales you have sit at the top.
  - The list of moves pages past twenty.

- 1c22442: More items turn up on the ground, and phenomena leave more:

  - Rare: the trade and held evolution items (King's Rock, Dragon Scale, Up-Grade and the rest), the Linking Cord, Rare Candies, the six vitamins and PP Ups.
  - Scarce: Kurt's seven apricorn balls.
  - Prized: the PP Max and the Explorer Kit.
  - A phenomenon's item half is now a stash of one to three kinds, one to three of each, like an item cache.

- 564b864: The item bands are reworked:

  - Uncommon finds turn up 1 time in 4, a new scarce band 1 time in 16, rare stays 1 in 64, and prized is 1 in 256 instead of 1 in 512.
  - Scarce holds the gear and training: Ultra Balls, Relic Silver, the healing from Hyper Potions up to Revives, the wings, the one-shots, the type boosters and everyday gear, the weather rocks and the training kit.
  - The Max Revive moves from prized to rare, and using one no longer asks twice.
  - The six power items and the Ability Patch are commoner within the prized band.
  - A beaten executive, Elite Four member, champion or legend leaves a stash of one to three kinds, like an item cache.
  - Executives and the Elite Four draw it from scarce, rare and prized; champions and legends from rare, prized and special, with a legend the richest.

- e18845a: The vendor and the chef show their stock in their own dialog, with Buy and Sell tabs and your gold beside them.
- 234fd69: - A challenge on the road says what winning pays and losing costs, the level range of their party, and how many you may bring.
  - A gym seat shows its holder with a button to their profile, and sets out what winning and losing do side by side.

## 4.13.0

### Minor Changes

- 4a37ee0: The pokedex is easier to move around:

  - A chip per region shows how many of its pokemon you have seen and caught, and pressing it turns to that region.
  - A search finds a dex number, or the name of a pokemon you have already met.
  - The dex can show everything, only what you have caught, or only what you are missing.
  - Each page says which region it is in, and the squares are larger.

- 30ccf57: The world map can be steered without a keyboard:

  - Drag the map to pan it, on a mouse or a touch screen.
  - Buttons in the map's corner pan it a chunk at a time, or return it to you.
  - The map shows where you are and where it is looking.
  - The sky switch and a key to the colours sit on the map itself.
  - Each notable sky in view is a button that pans the map to it.

### Patch Changes

- d18800d: The bag is laid out anew:

  - Its pockets are one list down the side: All, one pocket per kind of item you carry, then Candies.
  - Each pocket shows how many different things it holds.
  - The bag reopens on the pocket you last had open.

- ed17a99: - The honey tree's dialog shows the tree, and its Lather button shows the jar and how many are left, like the safari's Throw.
  - A pokemon's evolution row no longer puts a "+" in front of a single condition.
- 8b2f095: The catches box is laid out anew:

  - A sort menu and a direction button sit beside the search, and they stay in step with a typed `sort:`.
  - The box's page control sits above the squares and says which catches are showing out of how many.
  - While selecting, the actions sit at the foot of the dialog with a count of what is picked.

## 4.12.2

### Patch Changes

- 1b69db3: The game menu and the bar under the world are laid out anew:

  - The menu's keys sit in three labelled rows: You, Play and Inbox.
  - Settings and the day or night switch sit together at the foot of the menu.
  - The menu button shows how many notices are waiting.
  - The bar names the place, the weather, the time of day and the clock together, and pressing them opens when each part of the world next turns over.
  - Field moves are buttons on the bar, and Surf or Fly shows as pressed while it is on.
  - The "What the bar shows" setting is gone, since the bar now shows both.

- a7f00c4: The battle lobby is laid out anew:

  - The two seats face each other, and the host's seat is marked.
  - Your party and ready buttons sit on your own seat.
  - An open seat offers to take it or to invite somebody to it.
  - The rules are one line, and spectators are folded under "Watching" until opened.

- 4495039: The profile is laid out anew:

  - Your details and your buddy share one trainer card.
  - Your profile lists its sections down the side, grouped as Record, Social and Market, with no tabs inside tabs.
  - Requests, Bids and Selling are sections of their own, and a notice opens the one it is about.
  - Each waiting count shows once, on the section that holds it.

- da590a9: The list of raids is laid out anew:

  - Each raid shows its boss asleep, the boss's types, and an Open button.
  - A raid says how far away it is and in which direction, rather than its chunk coordinates.
  - The list says when the next raids arrive, and it pages past twenty.

- da590a9: Settings are laid out anew:

  - Settings are grouped into Display, Controls, World, Play, Audio and About, listed down the side.
  - Settings reopens on the section you last had open.
  - About counts the dex from the game's own data, so it now says gens 1 to 5 rather than gen 1 alone.

- 13d3adc: The raid lobby is laid out anew:

  - The boss sits beside the trainer list on a wide screen, and the list fills the height of the panel.
  - The boss card shows what it is weak to, resists and is immune to, with both of its types counted together.
  - The list counts the trainers against the limit and marks the host.
  - Spectators are folded under "Watching" until opened.
  - The way out is called Leave, and forming a team reads "Form another team" once you have one in.
  - The host is told why Start is not ready.

## 4.12.1

### Patch Changes

- b629e26: A trainer, a grunt or a stall no longer stands on the water in a flooded field. A chunk whose dry ground runs out used to put the next landmark on the nearest wet cell whatever it was, so a country that is almost all lake could field a Bird Keeper out on the water. Only what can be afloat takes a wet cell now, and a duel is afloat on the open sea alone, where the country's trainers are narrowed to its swimmers and sailors.
- 37f0d8b: Everything with a time window now runs on your own clock:

  - Item caches, berry and apricorn patches, honey trees, nests and happenings turn over in your time zone, the same as spawns.
  - Nests and happenings roll from your own time of day and your own species day.
  - Daily quests and the weekly hunt turn over at your own midnight.
  - Eggs of the day's featured family get their step bonus on your own date.
  - Evolutions that need day or night go by your own time of day.

- e3300f2: - The compass marks stay at the board's edges when you stand on a terrace, instead of staying at the lowest ground.
  - High ground near the camera is no longer cut away as you climb.
  - Pointing at the ground picks the tile drawn under the pointer, never one hidden behind a terrace.
- e3300f2: - The ground climbs through 20 terrace levels instead of 3, so mountains are a real climb with a cliff about every ten cells.
  - Every town stands flat on one level, so nothing in it is on a cliff.
  - A town's edge no longer leaves a single tile sticking out.
  - The ground round a town climbs or drops to it in a staircase of one-level cliffs, with no ledge between them for anything to be stranded on.
  - Flooded caves fill to the same height as before.

## 4.12.0

### Minor Changes

- afc2a7f: Chargestone Cave and the three families in it:

  - Joltik and Galvantula, Ferroseed and Ferrothorn, and Klink, Klang and Klinklang. All three are met underground and on the mountain above it, the gears by day and the other two after dark.
  - Iron Barbs now works: whoever lands a contact move on a Ferroseed loses 1/8 of their HP to the spikes. The line had no working ability at all before this, and Rough Skin is now built from the same shared rule rather than its own copy of it.
  - Each family brings its own signature ability: Static Feed has Joltik drink any bolt that lands on anybody, Thorn Curtain puts Ferroseed's spikes between a contact move and its teammates, and Meshing pays a gear for having something to turn against.
  - Galvantula can be born with Static, Klinklang with Motor Drive, and Ferrothorn with Overcoat or Sturdy.

- 4e078bd: Driftveil and the Cold Storage, and the four families around them:

  - Basculin in the bog and the swamp at any hour, Ducklett and Swanna over the same water by day, Vanillite and its line across the tundra and the glacier, and Alomomola out in the ocean and the coral reef.
  - Basculin comes in two schools that will not share a river. The red stripe throws itself about and the blue one takes the landing, which is the whole difference between them, and each is its own dex entry.
  - Each family brings its own signature ability: Blood Water turns a school harder on whatever is already failing, Swan Dance adds Speed to every dance a Swanna uses, Flash Freeze has the first Ice move a Vanillite lands freeze outright, and Tide Pool makes every heal on Alomomola's team worth half again.
  - Swanna can be born with Rain Dish, Alomomola with Unaware, and either Basculin with Swift Swim.

- 79d13de: Route 5 and the four families along it:

  - Zorua and Zoroark through the temperate forest and the woodland after dark, Minccino and Cinccino across the grassland and the shrubland by day, Solosis and its line in the same places by day, and Gothita and its line there at night.
  - Illusion now works: a Zorua takes the field looking like the teammate standing furthest back, and the act drops the moment anything lands on it. Only the look changes. The line had no working ability at all before this.
  - Each family brings its own signature ability: Bluff lets the first super effective blow pass straight through a Zorua, Clean Sweep has Cinccino tidy every hazard and screen off both sides as it arrives, and the two the games hand out one apiece pair up, with Fixation aiming what Gothita's team throws at whichever enemy is failing and Division taking a quarter of every blow aimed at one of Solosis' teammates.
  - Cinccino can be born with Sturdy, Gothitelle with Synchronize, Reuniclus with Telepathy, and Zoroark with Pickpocket, Prankster or Trace.

## 4.11.0

### Minor Changes

- a0640cd: A host can now offer signing in with an address and a password by setting VITE_EMAIL_SIGN_IN, rather than the form being drawn on a development build alone.

### Patch Changes

- 8d2e3d8: The docs now cover self-hosting: running the database, the auth server, the realtime stream and the app on your own machines, with none of the three hosting accounts the live game uses.
- d08c1a5: Battles, the parties frozen into them and the raids they were fought in are deleted after 30 days, so battle history reaches back a month.
- c9b0a53: A screen that offers a choice from your box reads only what it shows, so walking up to somebody with a large collection sends about half the data it used to.
- 94bf9f0: A duel lobby is deleted a day after it was staged, whether or not its fight ever started.
- 2bf1d76: The paces walked are reported to the egg being carried about once a minute rather than every few seconds, and a position is written at most once every eight seconds while walking.
- dda630a: A walk saves its position straight to the database rather than through the game server, and the biome it discovers is marked on its own when the ground underfoot changes.
- 3431d53: A run of catches asks once whether a quest has come due, rather than once for each catch.
- fd62a92: Spawn windows and their rolls are deleted a day after they turn over, rather than kept for every chunk and zone anybody has walked.
- 66ea06a: The safari asks everything it needs to open at once rather than one question after another, so the dialog appears sooner.

## 4.10.1

### Patch Changes

- 3d22983: The weather map follows the clock while it is open, so a page left open shows this hour's sky rather than the hour it was opened in. It also names the seed and the generation it is reading.
- 4fc6dac: The world map's weather now reads the same hour as the ground under you, rather than the hour it is in UTC.

## 4.10.0

### Minor Changes

- 2190cfc: Route 4 and the first half of the Desert Resort:

  - Sandile, Krokorok and Krookodile, and Darumaka and Darmanitan, across the desert and the badlands by day. Maractus stands in both.
  - Dwebble and Crustle are written but do not spawn yet, since the sprite collection has drawn no Crustle.
  - Darmanitan now sits down into its Zen shape below half its HP and stands back up above it, which turns what it hits with into what it thinks with and makes it far harder to shift. The shape is its own dex entry.
  - Each family brings its own signature ability: Death Roll bites harder on a throat it already has hold of, Glancing Blow still lands a quarter of a move that missed, Dry Spell makes a clear sky worth something to a cactus, and Slab lets the rock take the first share of what is aimed at Dwebble.
  - Krookodile can be born with Rough Skin, Maractus with Rattled and Crustle with Solid Rock.

- 09b218a: The three elemental monkeys:

  - Pansage and Simisage, Pansear and Simisear, and Panpour and Simipour. Each evolves on a stone, a Leaf Stone, a Fire Stone and a Water Stone.
  - None of the three spawns yet. They are staged as a set, and the sprite collection has drawn neither Simisear nor Simipour.
  - Each brings its own signature ability, built on the one the trio shares: the first time a blow takes it under half its HP it spends the tuft it carries on the whole enemy side, once a battle. Leaf Crown seeds every enemy, Ember Tuft burns every enemy and Geyser Tail traps every enemy in a whirlpool.
  - Simisage can be born with Sap Sipper or Harvest, Simisear with Flash Fire or Moxie, and Simipour with Water Absorb or Analytic.
  - A Grass type now shrugs off Leech Seed however the seed reaches it, rather than only when the move puts it there.

- 9af3677: The rest of the Desert Resort, the Relic Castle and what Castelia leaves behind:

  - Scraggy and Scrafty across the badlands and the steppe after dark, Sigilyph over the desert and the badlands by day, Yamask and Cofagrigus in the same places at night, and Trubbish and Garbodor through the badlands and the bog.
  - Mummy now works: whoever lands a contact move on a Yamask loses one of their own abilities and catches Mummy in its place. The line had no working ability at all before this.
  - Perish Body is new as well: whoever reaches into a Cofagrigus is marked to faint in 3 turns, and the coffin goes with them.
  - Each family brings its own signature ability: Gang Up pays Scrafty for the gang at its back, Ward Circle keeps hazards off the ground Sigilyph patrols, Death Mask takes 2 stages off whoever it watched finish a teammate, and Litterbug drops Toxic Spikes wherever Trubbish turns up.
  - Scrafty can be born with Guts, Sigilyph with Compound Eyes, and Cofagrigus with Cursed Body, Pressure or Perish Body.

### Patch Changes

- 9e87707: Trainers and gym leaders no longer field a pokemon nobody can meet. A line that is written but held out of every spawn pool, usually because its art is unfinished or the counterpart it is paired with does not exist yet, is now left out of their rosters as well. Unfezant, Zebstrika, Throh and Sawk were the four this was letting through.

  Trainers and gym leaders now field the alternate forms a pokemon is kept in rather than only default forms. A Rotom in an appliance and a Wormadam in its cloak are somebody's pokemon like any other, and an appliance is an address rather than a stage left to grow out of. A shape worn mid-fight stays out, and a set that differs only in its coat, such as the Unown letters, is fielded as the one pokemon it is.

## 4.9.1

### Patch Changes

- d8fd147: A mythical raid is fought on the ground of the country that mythical is met in, rather than on a bare field.
- f192310: A Frontier Brain stands in their house on the board: their own sprite, their name on the cell, and the cell called out as a fight. They were drawn as nobody at all.
- f004bdb: The world demo's weather map takes its hour from a chunk snapshot, the way the board does, so it no longer shows a different hour's sky when this machine's clock and the server's disagree.
- 7dc3484: The world demo's weather map now shows the sky the game is showing: it counts its hours off the zone's wall clock and the server's clock the way a chunk does, and it opens on the live world's seed and generation.

## 4.9.0

### Minor Changes

- 5225e71: The four families of Pinwheel Forest:

  - Sewaddle, Swadloon and Leavanny, the tailors of the temperate forest and the woodland. A Swadloon evolves once it is fond enough of its trainer.
  - Venipede, Whirlipede and Scolipede, the centipedes of the same woods after dark.
  - Cottonee and Whimsicott, blown across the grassland and the shrubland, and Petilil and Lilligant, rooted in the forest and the grassland. Both lines take a Sun Stone to evolve.
  - Each family brings its own signature ability: Tailor dresses a hurt teammate in leaves, Hurry Venom makes its poison bite harder, and the forest's two halves pair up, with Spore Drift putting a Whimsicott's powder on anything at all and Pollen Waltz sharing a Lilligant's dances with its team.
  - Scolipede can be born with Rough Skin, Whimsicott with Magic Bounce and Lilligant with Serene Grace.
  - The expert builder no longer hands a pokemon a move whose promise its line can never keep, such as a Dream Eater on something that cannot put anybody to sleep.

- 6847b59: The five families the rest of Pinwheel Forest holds:

  - Timburr, Gurdurr and Conkeldurr, working the temperate forest and the woodland. A Gurdurr evolves on being traded.
  - Tympole, Palpitoad and Seismitoad, croaking through the bog and the swamp after dark.
  - Audino, alone in the same woods by day.
  - Throh and Sawk, the two halves of one dojo. Both are written but neither spawns yet, since the sprite collection has drawn no Throh.
  - Each family brings its own signature ability: Ward keeps a hurt teammate on their feet, Load Bearing trades what Timburr's line carries for what it swings, Ripple Out carries a quarter of a landed blow to every other enemy, and the dojo pairs up, with Red Belt covering its team against physical moves and Blue Belt arming its team's own.
  - Conkeldurr can be born with Rock Head, Audino with Friend Guard, Throh with Stamina and Sawk with Scrappy.

## 4.8.0

### Minor Changes

- 4bfbf6a: The world map can show the sky: each chunk is washed in the colour of its weather, and the four rarest are ringed and listed with their coordinates, so a player can see where one is and walk to it.

### Patch Changes

- 0b2f0d6: A wild legendary or mythical announces itself: light is drawn in to it and goes off in a flash, leaving a ring rolling out along the ground. It then stands on a seal of slowly turning broken rings for as long as it is there, gold for a legendary and magenta for a mythical.
- 55f99f4: A border runs through a chunk, so what a player meets now comes from the country the cell they are standing on belongs to, not the country in the middle of the chunk:

  - Wild spawns, and whether ice is walked like land.
  - What is in a stash, what sleeps in a nest, and which phenomena appear and what they give.
  - A duelling trainer's class, and a Team Rocket stop's party, loot and backdrop.
  - The place name under the map.

- 2247e85: The board's glow now says what is left to do at more landmarks:

  - A honey tree glows until you have lathered it this window.
  - A gym leader, an Elite Four member, a Champion and a Frontier Brain each glow until you have beaten them this window, the way a trainer does.

- 4bfbf6a: The four rarest skies are about three times more common, and each now falls as often as the others:

  - A meteor shower, a fata morgana, a dark day and a fogbow each fall on about 1 window in 400 over a chunk, against 1 in 1,100 or worse before.
  - Each one covers more ground and lasts longer, about 6 chunks across for 2 hours.
  - The fogbow was the rarest of the four and the dark day the second rarest. All four are now worth the same to find.

- 6449a95: A flying shadow passes over water as well as over dry ground, so a pond in a country that has fliers can show one.

## 4.7.0

### Minor Changes

- 71c9329: The families along Unova's second road:

  - Munna and Musharna, the dreamers of the grassland and the woodland in the evening and at night. Munna takes a Moon Stone to evolve.
  - Pidove, Tranquill and Unfezant, the pigeons of the grassland and the woodland.
  - Blitzle and Zebstrika, the bolts of the grassland and the steppe.
  - Each family brings its own signature ability: Doze banks the seconds a Munna sleeps through, Homing means a pigeon never misses anybody it has landed a move on, and Storm Dash pays a Zebstrika for every stage of Speed it is running on.
  - Musharna can be born with Comatose, Unfezant with Defiant and Zebstrika with Reckless.
  - The Pidove and Blitzle lines are in the dex and in the data, but they are not out in the world yet: nobody has drawn Tranquill, Blitzle or Zebstrika.

- a126580: The families of Unova's first cave:

  - Roggenrola, Boldore and Gigalith, the ore of the caves, the mountains and the badlands. Boldore evolves when it is traded.
  - Woobat and Swoobat, the bats of the caves, the mountains and the montane forest after dark.
  - Drilbur and Excadrill, the diggers of the caves, the badlands and the desert.
  - Each family brings its own signature ability: Aftershock shocks whoever leaves it standing on 1 HP, Heart Mark leaves the mark of a Woobat's nose on an enemy as it arrives, and Torque trades a longer wind-up for harder blows.
  - Gigalith can be born with Sand Stream, Swoobat with Infiltrator and Excadrill with Tough Claws.

### Patch Changes

- 72e0a50: Weather comes in wider fronts:

  - A weather system now spans about 24 chunks rather than 8, with ragged edges.
  - A front is misty at its edge, rainy inside and stormy at its core, so walking into a storm passes through the rain first.
  - Windy air only stirs a dry sky. It no longer turns rain into a storm.
  - A chunk's sky reads the country most common round it, so one odd chunk of ground no longer breaks a front apart.
  - The four rarest skies still turn up about as often, but now cover a patch of country rather than a single chunk.

## 4.6.1

### Patch Changes

- e4a1e9a: A kelp forest's rocks have life on them: Krabby, Seel, Shellos, Buizel and Tangela by day, with Kingler, Dewgong, Gastrodon, Floatzel, Tangrowth and Shuckle behind them, Wingull and Pelipper overhead until dusk, and the crabs, seals, slugs and otters alone after dark. The Unowns were the only thing standing above the waterline before, which made an alphabet easier to meet than it should be.
- 2cf05e9: - A wild meeting stops at level 100. A buddy with Hustle, Pressure or Vital Spirit lifts the top of the band by 3, which on a legendary's band of 1 to 100 was handing out levels 101 to 103. Nothing can hold a pokemon above the cap, so catching one failed.
- 1275f91: - A catch sheet reads in order of what a player looks for: stats, then its abilities and what it is holding, then its moves.
  - A shiny's sparkle is the same size on every pokemon. Sized off the sprite, it was smallest on the small ones, which are the hardest to spot in the overworld to begin with.
- 6815869: - Caves roll the cave pool. Underground spawns were read from the biome overhead, so a cave under a grassland held that grassland's pokemon and nothing that lives in the dark.

## 4.6.0

### Minor Changes

- 60107b8: - Caves hold water. A waterway is a passage in its own right, cut through the rock and filled wall to wall, so chambers are joined by rivers you ride over rather than walk along.
  - Where the rock is wet it holds a water table, and every part of a cave at or below it is flooded, so a low chamber fills to its brim.
  - A cave system is either wet or dry, so the water gathers in some networks and none of it is in others. A way in keeps a cell of dry landing around it.
  - The countries above ground carry far less standing water. A lake now needs a basin under it as well as the field above the line, so the ponds gather in a few low stretches instead of one every thirty cells everywhere.
  - Water is laid in 3x3 blocks rather than 2x2, so nothing narrower than three cells is drawn as water at all.
  - A route crosses water on made ground: the road between two towns dries what it runs over, so a stream or the edge of a lake is a causeway to walk across rather than a gap in the paving. The open sea is the one water nobody has built over.
  - A cave under a crater holds lava, and it keeps the same distance from the border that lava above ground does, so the two liquids never meet.

### Patch Changes

- 6d03191: - A cave is dark because nothing lights it: the ground is lit at the corners of every cell and whatever stands on it is lit where it stands, so a lamp throws a pool that falls off across the floor instead of a hole cut in a veil.
  - Nothing a lamp does not reach underground is visible at all.
  - A day the sky has put out is lit the same way.
  - Night pulls every country toward one colour instead of only darkening it, so a pale biome is no longer brighter at midnight than a dark one is at dusk.
  - The sun no longer reaches underground, and nothing throws a sun shadow there.
  - The board demo can be set to an hour of the day, and to what a player is carrying into the dark.
- 6d03191: - Trees, scenery, landmarks and berry bushes have a shadow under them, the way a pokemon does.
  - A shadow is a round patch on the ground again, the same whatever the hour: nothing leans its own picture along the sun any more.

## 4.5.0

### Minor Changes

- ae650d7: - Every town now has a gym leader, a gym seat and an auction board, so a badge run is a walk from town to town.
  - An Elite Four member stands in 1 town in 4, up from 1 in 7.
  - A champion sits in about 1 town in 7, up from 1 in 12.
  - A portal stands in a town and nowhere else. A region with no town no longer has one out in the country.
  - Changes world generation.

### Patch Changes

- f5cbb03: A coral reef's islands have life on them: Krabby, Corphish, Wingull, Shellos and Slowpoke by day, with Kingler, Crawdaunt, Pelipper, Gastrodon, Slowbro, Shuckle and Slowking behind them, and the crabs, slugs and Shuckle alone after dark. The Unowns were the only thing standing there before, which made an alphabet easier to meet than it should be.

## 4.4.0

### Minor Changes

- 2dcce12: The families a walk out of Unova's first town meets:
  - Patrat and Watchog, the scouts of the grassland and the steppe. Watchog keeps watch in the evening and at night.
  - Lillipup, Herdier and Stoutland, the dogs of the grassland and the woodland. A Stoutland also walks the steppe and the tundra.
  - Purrloin and Liepard, the thieves of the woodland and the grassland after dark.
  - Each family brings its own signature ability: Spotter calls the shot for the team, Loyal Guard stands over a hurt teammate, and Cat Burglar takes what the target is holding.

## 4.3.0

### Minor Changes

- 28e97cd: Teams: save up to 6 parties under a name in your profile, then load one with a press when a raid or a duel asks you to form a team.

### Patch Changes

- 9630dd9: - Future Sight and Doom Desire draw their own picture when the delayed strike lands, instead of arriving as a bare hit.
  - A raid lobby lists the host's party first, whoever formed a party soonest.
- 2df43a7: An egg's catch sheet is one column: the egg, how far along it is and the button that hatches it, with no empty stat and move columns and no candy giving away what is inside.

## 4.2.0

### Minor Changes

- eab7b7a: A Fata Morgana hands over abilities rather than widening the odds of one:

  - 1 meeting in 8 under one keeps a second ability out of its line's hidden pool, on top of the one it rolled.
  - 1 meeting in 64 keeps its family's signature ability as well, so a wild pokemon can walk out with 3.
  - The sky no longer doubles the odds of rolling a hidden ability. What it would have rolled under any other sky is what it rolls under this one, and the species day is now the only thing that widens that band.
  - Wild meetings, raid prizes, nest eggs, bred eggs and revived fossils all count. A bred egg reads the sky over the breeder it was collected from, and an ability its mother passed replaces the one it rolled without costing it the sky's gift.
  - Every egg and every revived fossil arrives with room for what the sky handed it. A nest egg's extra ability was being dropped on the way into the collection.
  - An Ability Patch is still the only way to write a signature into a pokemon already caught.
  - A catch now always arrives with room for every ability it walks in with.

- a4ee086: A fogbow hands over move room rather than a single move:

  - 1 meeting in 4 under one walks out with room for a 5th move, and 1 in 16 with room for a 6th as well.
  - What fills the extra room is drawn from the line's egg moves and its machine and tutor moves together, so an inherited move is as likely as a taught one, and never something it already knows.
  - Nothing it learned is given up for the room, which is what the old rule cost: the inherited move used to take a level-up move's place.
  - Wild meetings, raid prizes, nest eggs, bred eggs and revived fossils all count. A bred egg reads the sky over the breeder it was collected from, and the room goes behind what its parents passed rather than in place of it. A gift arrives under its own rules.
  - Nothing else in the game widens a pokemon's move list, so this is the only way past four.
  - An evolution reads its line's egg moves off the stage it hatches at, so it is no longer handed nothing.

### Patch Changes

- f715521: A dark day closes hearts beyond the wild:

  - 1 arrival in 4 under one is a shadow, down from 1 in 3.
  - A legendary raid's prize, a nest egg, a bred egg and a revived fossil can all come out shadowed now, as well as a wild meeting. A nest used to promise that nothing shadowed came out of one.
  - A mythical raid's prize is beyond the sky's reach. A shadow raid's prize, a syndicate's pokemon and a gift all arrive with the answer already written.
  - A shadowed nest egg takes twice as long to hatch, the way a bred one does.

## 4.1.1

### Patch Changes

- dbca38a: Experts build sheets on what a move really lands:
  - Giga Impact and the other moves that leave the user standing still are worth half their power.
  - Last Resort is rarely worth a slot, since it does nothing until every other move has been cast.
  - A move that strikes several times is worth every strike, and Skill Link counts them all.
  - Moves whose power is worked out at the cast, such as Seismic Toss, Return, Heavy Slam and Gyro Ball, are worth a slot again.
  - A move with priority is worth a little more, because it winds up faster.
- dbca38a: Experts weigh the recoil of Flare Blitz, Brave Bird, Wood Hammer and Head Smash against how much HP the pokemon has.
- 60bf1ea: Five held items to find and carry:
  - Soul Dew: 1.2x damage from a Latios' or Latias' Psychic and Dragon moves.
  - Soothe Bell: its holder warms to its trainer 2x as fast, on top of whatever its ball is worth.
  - Macho Brace: a wing or vitamin used on its holder is worth 2x the effort, but its Speed is halved.
  - Heavy-Duty Boots: its holder walks over spikes, toxic spikes and stealth rock.
  - Loaded Dice: a move of its holder's that strikes several times never lands fewer than 4.

## 4.1.0

### Minor Changes

- a000151: Unova's 92 moves are in, along with the Douse, Shock, Burn and Chill Drives that set Techno Blast's type.

  - Hone Claws, Wide Guard, Guard Split, Power Split, Wonder Room, Psyshock
  - Venoshock, Autotomize, Rage Powder, Telekinesis, Magic Room, Smack Down
  - Storm Throw, Flame Burst, Sludge Wave, Quiver Dance, Heavy Slam, Synchronoise
  - Electro Ball, Soak, Flame Charge, Coil, Low Sweep, Acid Spray, Foul Play
  - Simple Beam, Entrainment, After You, Round, Echoed Voice, Chip Away
  - Clear Smog, Stored Power, Quick Guard, Ally Switch, Scald, Shell Smash
  - Heal Pulse, Hex, Sky Drop, Shift Gear, Circle Throw, Incinerate, Quash
  - Acrobatics, Reflect Type, Retaliate, Final Gambit, Bestow, Inferno
  - Water Pledge, Fire Pledge, Grass Pledge, Volt Switch, Struggle Bug, Bulldoze
  - Frost Breath, Dragon Tail, Work Up, Electroweb, Wild Charge, Drill Run
  - Dual Chop, Heart Stamp, Horn Leech, Sacred Sword, Razor Shell, Heat Crash
  - Leaf Tornado, Steamroller, Cotton Guard, Night Daze, Psystrike, Tail Slap
  - Hurricane, Head Charge, Gear Grind, Searing Shot, Techno Blast, Relic Song
  - Secret Sword, Glaciate, Bolt Strike, Blue Flare, Fiery Dance, Freeze Shock
  - Ice Burn, Snarl, Icicle Crash, V-create, Fusion Flare, Fusion Bolt

  Some moves read the real-time fight rather than a turn.

  - Round and Retaliate double their power when a teammate sang a Round or fainted in the last 2 seconds.
  - Fusion Flare and Fusion Bolt double their power when the other one landed in the last 2 seconds.
  - Echoed Voice lands 40 harder for each one within 2 seconds of the last, up to 200.
  - Two different Pledges from one team within 2 seconds combine at 150 power and leave a rainbow, a sea of fire or a swamp for 8 seconds.
  - A sea of fire burns 1/8 of a pokemon's HP each time it acts.
  - After You makes a teammate's wind-up finish at once.
  - Quash sends a target's wind-up back to the start.
  - Quick Guard turns away moves with a shortened wind-up.
  - Flame Burst splashes the target's own team.
  - Wonder Room and Magic Room end when cast a second time.

  A raid boss is kept out of the ones a raid breaks.

  - A boss is never staged with Final Gambit, Quash, Guard Split, Power Split, After You, Ally Switch or Bestow.
  - A boss shrugs off Quash, Sky Drop, Guard Split and Power Split aimed at it.

  Some are drawn the way an earlier move that does the same thing is drawn.

  - Drill Run turns like Horn Drill, and Wild Charge arrives crackling like Volt Tackle.
  - Hurricane blows like Aeroblast.
  - Wide Guard and Quick Guard put up Protect's shell.
  - Wonder Room and Magic Room lay a room over the field like Trick Room.
  - Rage Powder is a cloud of powder, and Cotton Guard drifts cotton like Cotton Spore.
  - Heal Pulse brings health back, and Heart Stamp sends up hearts.
  - Electroweb winds round the target like Bind.
  - Snarl and Echoed Voice roll sound arcs out like Roar, and Round drifts notes like Sing.
  - Smack Down brings rocks down on the target.

  Some have a picture of their own.

  - Psyshock and Psystrike hang shards of psychic force round the target and drive them in.
  - Synchronoise pulses waves out of the target and the pokemon that used it together.
  - Stored Power circles orbs round the target that close in and burst.
  - Final Gambit lights up the pokemon that used it and lands one heavy blow.
  - Struggle Bug sends tiny bugs zigzagging in on the target.
  - Techno Blast fires a line of plasma that rings out in hexagons.
  - V-create drives a V of fire down onto the target, and Searing Shot flings fireballs that burst on it.
  - Blue Flare raises a column of blue fire, and Bolt Strike brings bolts down on the target from every side.
  - Fusion Flare and Fusion Bolt drop a ball of fire or lightning out of the sky.
  - Freeze Shock and Ice Burn break ice spikes up round the target, crackling with sparks or licked by fire.
  - Glaciate spreads frost across the ground under the target.
  - Sacred Sword and Secret Sword drop a great sword point first through the target.
  - Relic Song spirals notes up round the target.
  - Quiver Dance flutters glittering wings up round the pokemon.
  - Shell Smash cracks the pokemon's shell and bursts it off in pieces.
  - Shift Gear turns two meshing gears, and Coil winds a spiral up round the body.
  - Autotomize drops pieces off the pokemon as it speeds away, and Work Up throbs with power like Bulk Up.
  - Heavy Slam and Heat Crash spread a shadow under the target before the ground gives way.
  - Fire, Water and Grass Pledge raise a column of fire, water or leaves out of the ground.
  - Acrobatics swoops in on quick loops, and Sky Drop streaks down onto the ground.
  - Dragon Tail swings like Iron Tail, and Steamroller rolls a spiked wheel over the target.
  - Foul Play draws the target's strength out of it and turns it back in a dark blow.
  - Horn Leech drives a horn in and draws green light back to the pokemon that used it.
  - Head Charge rushes in behind speed lines and lands a hard hit.
  - Inferno closes a ring of fire on the target, and Fiery Dance swirls flames in on it.
  - Incinerate blows hot air across the target like Heat Wave, and Flame Burst flings embers out to either side.

- 17cba35: - Unova's three starters can be caught, with their evolutions. That is nine
  species, with learnsets, sprites and a candy each. A new trainer picks a
  starter from fifteen.
  - Leaf Opening takes 1 stage of Speed off whatever a Snivy's first landed move
    of the fight hits.
  - Ember Opening makes a Tepig's first landed move of the fight hit 1.5x.
  - Shell Opening raises an Oshawott's Defense 2 stages when its first move of the
    fight lands.
  - Serperior also reaches Infiltrator and Unnerve, Emboar reaches Iron Fist, and
    Samurott reaches Swift Swim and Sniper. These are not in the mainline.
  - Snivy appears in the shrublands and steppes. Tepig appears in the badlands and
    deserts. Oshawott appears on the rocky coasts and in the kelp forests, both in
    the water and on the shore.
  - Changes world generation.

### Patch Changes

- 2f3ecaf: A fight's top bar fits a phone: it drops the health bars onto a row of their own, so the speed buttons and Leave stay reachable.
- dce0b79: Experts weigh the recoil of Flare Blitz, Brave Bird, Wood Hammer and Head Smash against how much HP the pokemon has.
- 2e75026: Kanto's, Johto's and Hoenn's pokemon learn Unova's moves by level, machine, tutor and egg, as they do in Black, White, Black 2 and White 2.
- 49b0b9e: - The AI no longer treats a move that raises several stats, such as Dragon Dance or Calm Mind, as useless once only one of those stats is maxed.
  - The AI does not use Follow Me when no teammate is standing.
  - The AI does not use Role Play or Skill Swap when there is no ability to copy or trade.
- e2b5d6e: Sprite sheets are kept by the browser instead of being checked on every visit, and a repacked sheet is still picked up.

## 4.0.2

### Patch Changes

- 20d80eb: Built expert teams:
  - Count a rampage move at its full power.
  - Skip a move's drawback when the pokemon's ability prevents it, such as a rampage for Own Tempo or recoil for Rock Head.
  - Leave out moves the pokemon's ability ruins, such as a stat raise with Contrary or Rest when it cannot sleep.
  - Carry moves that help a teammate with the right ability, such as Swagger for Own Tempo or Charm for Contrary.
- ef04fd2: A raid host who lost can host the lair again, instead of being sent back to the lost fight.
- 5d71772: - The catch sheet and dex entry draw a pokemon at its real height, standing on the portrait's floor.
  - A move's category badge on the catch sheet stands as tall as its name.
- 5d71772: Me First no longer cuts off a raid boss's move.

## 4.0.1

### Patch Changes

- 1274683: Pokemon are drawn to their real heights in battle and on the board, so a Tyranitar stands taller than a Houndoom in both.
- b25219c: - The catch sheet's two columns size apart, so a long block on one side no longer stretches the other.
  - A catch's nature is shown in the Stats header.
- b82a80c: A new player starts in a random town rather than anywhere in the open country.
- b82a80c: Nurse Joy heals as many pokemon as you bring in one handover, rather than six at a time.
- 52453e7: Pressing things on the board is more reliable while walking:

  - The highlight follows the board as it slides, so it always shows the cell a press would reach.
  - A press acts on what was under the pointer when it went down, not where the board had moved by the time it came up.
  - Pressing a pokemon, a person or a landmark on its body selects it, rather than the ground behind it.

- c676474: Tab labels sit centred in their tabs.
- b25219c: - A row of tabs that does not fit scrolls sideways instead of wrapping onto a second line.
  - Releasing a pokemon closes its sheet without it flashing back up first.
- 57754bd: Buying and selling at the market stall works again, instead of being refused with "Invalid input".
- 93a7b4c: A trainer is named for the look they are met in, so a Black Belt dressed as a Crush Girl is called a Crush Girl, and the same goes for the Picnicker, Cowgirl, Lady, Waitress, Idol, Socialite, Battle Girl and Cameraman.
- b25219c: A trainer's challenge dialog shows their greeting under them.

## 4.0.0

### Major Changes

- c1bebbd: Sinnoh.

  All 107 of it, the 113 moves it brought, and a signature ability for every one
  of the 246 families, which nothing outside the family can have. With them:

  - The eight gym leaders, Roark to Volkner, and the Elite Four and Cynthia behind
    them, which makes a fourth league and a fourth crown.
  - Sinnoh's Battle Frontier: five more houses, each fought under its own rule,
    with a silver print and a gold one to take from each.
  - Uxie, Mesprit and Azelf, Dialga, Palkia and Giratina, Heatran, Regigigas and
    Cresselia, with Manaphy, Darkrai, Shaymin and Arceus.
  - Team Galactic, who keep the crime landmark in the cold country.
  - Rotom in six shapes and Arceus in eighteen, with the Origin Formes, the cloaks
    and the shells, each one chosen with an item rather than rolled.
  - New stages for 28 older lines, so a Magneton, a Rhydon and a Togetic are no
    longer the end of theirs.
  - The Ability Capsule and the Ability Patch, which is the only way to a
    signature.
  - Honey Trees in the forests, and a nest egg worth more than a wild catch.

  The world changes under all of it. Sinnoh's species join the biomes they belong
  to, the towns and the caves, 17 lairs and 42 more duelling stops stand in the country, water and ice
  carry spawns of their own, and every legendary can be met in the wild where its
  lair sits. What a chunk holds has changed everywhere.

### Minor Changes

- ece2eaf: Verdant Field, the Bulbasaur line's signature ability: Grass moves hit 1.2x and
  Water moves 0.8x for everybody on the field while it stands.
- a1db2ac: Sinnoh's pokedex chain, and the professor it pays.

  - **Sinnoh Pokedex** on the quest board, asking for 21 caught, then 54, then
    103, which is every species of the region but Darkrai, Manaphy, Shaymin and
    Arceus.
  - The last rung hangs the **Sinnoh Dex Medal** on the shelf and hands over a
    Master Ball, the way the other three regions' do.
  - Filling it unlocks **Professor Rowan** in both of the looks he is drawn in.

- c2f6cef: Shaymin can be met, in both of its shapes.

  - Flower Paradise holds Shaymin, and Shaymin is a mythical, so Oak's Letter
    found in the special band of the item pool is the only way to one.
  - Purebloom is its signature. Poison costs its teammates no HP while it stands,
    itself included. The poison is still on them and still runs its clock, so
    anything that reads a poisoned target still reads one.
  - The Gracidea is new. A Shaymin holding it fights in its Sky Forme, which is
    worn rather than met: the dex fills the shape in the day the one it lies down
    in is. Nobody sells one, so the prized band of the overworld item pool is the
    only way to one.
  - Sky Forme carries Serene Grace, which is the shape's own ability and stays
    with the shape.
  - The mainline gives Shaymin only Natural Cure, so it carries three of this
    registry's own: Chlorophyll, Harvest and Leaf Guard.
  - Changes world generation.

- 7dcdbbd: Team Galactic keeps the crime landmark in the cold country.

  - **Cyrus** at the top, with **Mars**, **Jupiter** and **Saturn** under him, and
    a uniform for the rank and file.
  - Their country is the glaciers, the tundra, the taiga, the montane forest and
    the Beyond, which Team Rocket held before.
  - Each of them pays their own mark, and the uniform pays one for clearing a cell
    of grunts.
  - Everybody is named team and rank first, as in **Team Galactic Commander Mars**.
  - Changes world generation.

- a30e3b7: Rotom can be met, and it can be moved between all six of its shapes.

  - Rotom is found in woodland and temperate forest.
  - The Rotom Catalog is new. Using one on a Rotom offers every one of its shapes
    but the one it is in, so a player picks the machine rather than rolling for
    it, and the Catalog is spent doing it. Nobody sells one, so a second shape
    costs a second Catalog found in the ground.
  - Appliance is the family's signature. Its moves of the type its shape gives
    it, Electric aside, hit 1.3x: Ghost as it is met, then Fire, Water, Ice,
    Flying or Grass in a machine.
  - Each machine keeps the move the mainline gives it: Overheat, Hydro Pump,
    Blizzard, Air Slash and Leaf Storm.
  - The mainline gives Rotom only Levitate, so it carries three of this
    registry's own: Motor Drive, Static and Magnet Pull.
  - A change of shape no longer counts as a stage when a species' spawn band is
    worked out, so a Rotom stands in the same band whichever machine it is in.
  - Changes world generation.

- 1f7fd02: A world can be grown with a second generation, which never repeats and keeps its placements steady.

  - The live world is unchanged. A deployment can switch to the second with `VITE_WORLD_GENERATION=2`.
  - Positions, found towns, gym seats, raids, stops and claims are kept per generation, so switching hides the other world's instead of losing them.
  - The second generation's terrain fields do not tile, where the first repeats every 6,144 chunks.
  - Its rock and water edges carry a finer octave, and every biome keeps the share of the world it has now.
  - Adding a roll to how the second generation places things no longer moves anything already placed.
  - Working out the ground is faster on both generations.
  - The board and world demos can show either generation.

- bfeb925: A pokemon behind a substitute is drawn behind it: the doll steps in front and the pokemon dims to a shadow of itself while it is up, and the two swap back when it breaks.
- 4158e03: Ember Field, the Charmander line's signature ability: Fire moves hit 1.2x and
  Grass moves 0.8x for everybody on the field while it stands.
- a05e08a: Manaphy and Phione can be met.

  - The Sea Temple holds Manaphy, and Manaphy is a mythical, so the Manaphy Egg
    found in the special band of the item pool is the only way to one.
  - A Manaphy's egg hatches into a Phione and never into another Manaphy, which
    is the only way a Phione is reached. Nothing else in the registry lays
    something other than the bottom of its own line, and no pool stages a Phione.
  - Heartcurrent is the family's signature. Every stat stage an enemy gains is
    written onto the holder as well, the same stage and the same size. It takes
    nothing off the enemy, so nothing refuses it, and a copy is never copied
    back.
  - The mainline gives both only Hydration, so each carries three of this
    registry's own: Water Absorb, Healer and Friend Guard for Manaphy, Swift
    Swim, Rain Dish and Storm Drain for Phione.
  - The Manaphy Egg's picture is the egg's own art, shrunk to an item's cell.

- a9a4f14: A buddy can use field moves it is able to learn, from a button on the menu bar that lists only the moves usable where the player stands.

  - Open water can no longer be walked onto. Surf rides the buddy across it, starting beside water and ending on the first step ashore.
  - Fly crosses water, trees and cliffs, never lava, and comes down only where a walk could stand. It works above ground only.
  - Dig climbs out of a cave to the nearest mouth, like an escape rope that is never spent.
  - Teleport sends the player to the portal of the nearest town, found or not.
  - While surfing or flying the player is drawn as the buddy, walking as they walk.

- e478792: Deluge Field, the Squirtle line's signature ability: Water moves hit 1.2x and
  Fire moves 0.8x for everybody on the field while it stands.
- b4e7334: - The Embedded Tower is a new lair on beaches, home to Kyogre, Groudon and Rayquaza.
  - Kyogre, Groudon and Rayquaza can be met in the wild on beaches.
- 0a02e80: Four more Kanto families have a signature ability.

  - Powder Burst on Caterpie. Its status moves reach every enemy on the field, not
    only the one it aimed at.
  - Twin Stinger on Weedle. Each physical move it uses strikes twice at 60% power.
  - Slipstream on Pidgey. Cast and channel times are 20% shorter for its party
    while it stands.
  - Nibble on Rattata. Every move it lands takes another 1/32 of the target's HP,
    whatever its armour.

- e10b093: Pachirisu, Chatot, Spiritomb and Carnivine can be met.

  - Pachirisu lives in temperate forest, woodland and taiga. Chatot lives in
    tropical seasonal forest, temperate forest and woodland by day. Spiritomb
    lives in badlands, bog and woodland after dark. Carnivine lives in swamp,
    mangrove and tropical rainforest.
  - Sparkfur is Pachirisu's signature. Anything that touches one of its teammates
    is paralyzed 30% of the time, itself included.
  - Birdsong is Chatot's. Its damaging sound moves confuse the target 20% of the
    time.
  - Soulwell is Spiritomb's. It heals 1/4 of its HP whenever anybody on the field
    faints, either side.
  - Snapvine is Carnivine's. The first move it lands on each enemy binds them as
    well, cast as the move rather than written as a hold of its own.
  - Cheek Pouch is new. Eating a berry also puts 1/3 of the eater's HP back,
    whatever the berry was for, and only a berry it ate itself counts.
  - The mainline leaves each of the four short, so they carry some of this
    registry's own: Cheek Pouch for Pachirisu, Soundproof for Chatot, Cursed Body
    and Shadow Tag for Spiritomb, and Strong Jaw, Gluttony and Unnerve for
    Carnivine.
  - Changes world generation.

- f8ba0f5: Seven more of Hoenn's trainer classes stand at duelling stops: the Pokémon
  Breeder, the Pokémon Ranger, the Collector, the Reporter, the Rich Boy, the
  Parasol Lady and the Young Couple.

  - Their coats shipped with Hoenn and were worn by nobody. Each is unlocked by
    beating enough of that class, like every other coat.
  - Six of them are trades Sinnoh brought, so Hoenn's wins and Sinnoh's climb the
    one line and pay the one title.
  - Changes world generation.

- a20c6ee: Honey Trees grow in forests:

  - Lather one with Honey once per window to draw out a pokemon and meet it on the spot.
  - Weedle, Kakuna, Wurmple, Silcoon, Cascoon, Combee, Burmy, Aipom, Teddiursa, Heracross, Pinsir and Munchlax now come only from Honey Trees.
  - Honey is sold at the medicine stall and turns up in forest caches.

- 12bc343: - Navel Rock is a new lair in the deep ocean, home to Lugia and Ho-Oh.
  - Ho-Oh can be met in the wild in the deep ocean.
- 43ea9bc: A new overworld setting picks how the edge of the board meets the sky:

  - Haze, the default, dissolves the country into the sky pixel by pixel toward the edge.
  - Full board draws the ground to every corner of the screen.
  - Plain keeps the board as it was.

- 40c4f35: - A legendary can be at home in more than one lair, and its dex entry lists every one.
  - Regirock, Regice and Registeel can also be raided at Rock Peak Ruins, Iceberg Ruins and Iron Ruins.
- 4e2919c: - Battle history rows watch a replay and copy a link to the battle from two icon buttons.
  - A replay can be played at 1x, 2x or 3x speed from its top bar.
- 61accf0: Five more Hoenn families have a signature ability.

  - Ore Hunger on Aron. Steel and Rock moves deal it no damage and heal it 1/4 of
    what they would have.
  - Mind Over Body on Meditite. It takes 0.5x damage while it is casting or
    channelling a move.
  - Jolt Start on Electrike. Its first move of a battle goes off a step ahead of
    everything and hits 1.5x.
  - Cheer On on Plusle. Each time it acts, the teammate lowest on HP gains a stage
    in its best stat, up to 3 times a battle.
  - Jeer At on Minun. Each time it acts, the enemy highest on HP loses a stage in
    its best stat, up to 3 times a battle.

- 66c6f7b: Five more Hoenn families have a signature ability.

  - Silt Bed on Barboach. Every grounded pokemon on the field, its own side
    included, has Speed count 0.9x.
  - Dirty Fighter on Corphish. Its moves hit 1.3x against a target still at full
    HP.
  - Spin Balance on Baltoy. It cannot be flinched, cannot be forced off the field,
    and its stages cannot be lowered.
  - Root Hold on Lileep. A move it lands stops that target fleeing for 6 seconds
    and counts their Speed 0.7x meanwhile.
  - Claw Rush on Anorith. Its moves hit 1.3x against any target slower than it.

- dc36690: The three legendary beasts and Larvitar have a signature ability. The beasts
  share one, told three ways.

  - Risen Thunder on Raikou. The first blow that would finish it leaves it on 1
    HP, cured, and a stage faster. Once per battle.
  - Risen Flame on Entei. The same, and a stage stronger.
  - Risen Tide on Suicune. The same, and a stage harder to hurt.
  - Tyrant on Larvitar. Nothing on the enemy side can raise a stat while it
    stands.

- 26c1b85: Four more Hoenn families have a signature ability.

  - Feeding Frenzy on Carvanha. It gains a stage of Attack whenever any enemy
    faints, up to 3 of them.
  - Spout on Wailmer. Its Water moves reach every enemy on the field, not only the
    one it aimed at.
  - Magma Vent on Numel. The first time it drops below 1/2 HP, every enemy loses
    1/8 of their HP, once per battle.
  - Body Heat on Torkoal. Its Defense and Special Defense count 1.3x while the Sun
    is up.

- f6e8326: The first four Johto families have a signature ability.

  - Sapmark on Chikorita. Anything it lands a move on loses 1/16 of its HP each
    time it acts, and Chikorita drinks the same.
  - Embermark on Cyndaquil. Anything it lands a move on loses 1/16 of its HP each
    time it acts, or 1/8 while it is burned.
  - Jawmark on Totodile. The one thing it has its jaws in loses 1/8 of its HP each
    time it acts, only ever one at a time.
  - Sentry on Sentret. Nobody in its party can be hit by a critical hit while it
    stands.

- ba062b6: Four more Johto families have a signature ability.

  - Delivery on Delibird. It hands a Berry Juice to the teammate lowest on HP as
    it arrives on the field.
  - Escort on Mantine. Its teammates' Special Defense counts 1.3x while it stands.
  - Steelmolt on Skarmory. It lays a layer of Spikes on the enemy side as a hit
    drops it to 3/4 and to 1/2 HP.
  - Pack Howl on Houndour. Every teammate gains a stage of Attack as it arrives on
    the field.

- a9abdd8: Four more Kanto families have a signature ability.

  - Second Head on Doduo. Every third move it lands strikes again at once for 50%
    power.
  - Sleek Hide on Seel. Contact moves hit it at 0.75x and everything else at 1.1x.
  - Corrosive Ooze on Grimer. Whoever lands a contact move on it has their held
    item destroyed.
  - Spike Shell on Shellder. Contact moves hit it at 0.5x, and whoever lands one
    takes 1/8 of their own HP.

- f457749: The last three Kanto families have a signature ability, which completes Kanto.

  - Serene Storm on Dratini. Weather it calls up never clears on its own, and its
    party takes no damage from any weather.
  - Genetic Apex on Mewtwo. Its highest battle stat counts 1.25x and its lowest
    counts 0.8x.
  - Ancestral Memory on Mew. Any type that has already hit it once hits it at
    0.85x thereafter.

- 1366919: Four more Johto families have a signature ability.

  - Hidden Den on Dunsparce. While anybody else in its party stands, enemies
    cannot aim a single-target move at it.
  - Sand Rider on Gligar. While sand blows, its moves cannot miss and everything
    hits it at 0.75x.
  - Bully on Snubbull. Its moves hit 1.3x against a target whose Attack has been
    lowered.
  - Last Barb on Qwilfish. When it faints, it casts Toxic at whoever finished it.

- 4d2b066: Four more Hoenn families have a signature ability.

  - Soul Harvest on Duskull. It heals 1/4 of its HP whenever anything on the field
    faints, either side.
  - Fruit Crop on Tropius. Every 8 seconds it grows a Sitrus Berry, if its hands
    are empty.
  - Ringing Head on Chimecho. Enemy cast and channel times run 25% longer while it
    stands.
  - Doom Mark on Absol. A move it lands marks that target, and the next blow
    anybody lands on them within 4 seconds hits 1.3x.

- 739e945: Four more Kanto families have a signature ability.

  - Static Field on Electabuzz. Its Speed rises 15% for each contact hit it has
    taken, up to 4 of them.
  - Blast Furnace on Magmar. Its Fire moves burn the target 30% of the time.
  - Snapjaw on Pinsir. Its moves hit 1.5x against a target that is casting or
    channelling.
  - Bullheaded on Tauros. Its contact moves hit 1.3x, and everything hits it 1.15x
    in return.

- 82096f7: Four more Hoenn families have a signature ability.

  - Scarred Beauty on Feebas. Its Special Attack counts 1.4x while it carries
    poison, sleep, paralysis, a burn or a freeze.
  - Weather Worn on Castform. Under any weather its moves deal 1.3x and everything
    hits it at 0.85x.
  - Blend In on Kecleon. While it has stood still for 2 seconds, moves aimed at it
    are half as accurate.
  - Malice Pool on Shuppet. Its moves hit 10% harder for each lowered stage on the
    target, up to 50%.

- 67ddfb9: Four more Kanto families have a signature ability.

  - Night Terror on Gastly. An enemy it damages cannot be healed for the next 4
    seconds.
  - Living Tunnel on Onix. Its teammates take 0.8x from Rock and Ground moves
    while it stands, and it takes those at 1.2x.
  - Dream Feast on Drowzee. Landing a move on a sleeping target heals it 1/8 of
    its HP.
  - Heavy Pincer on Krabby. Its contact moves hit 1.45x while it is at or above
    1/2 HP.

- 94150a7: The first four Hoenn families have a signature ability. The three starters share
  one, each growing in the stat its line is built on.

  - Sap Surge on Treecko. It gains a stage of Speed each time it acts, up to 3 of
    its own.
  - Ember Surge on Torchic. It gains a stage of Attack each time it lands a move,
    up to 3 of its own.
  - Silt Surge on Mudkip. It gains a stage of Special Defense each time it takes a
    hit, up to 3 of its own.
  - Pack Hunt on Poochyena. Its moves hit 1.2x against anything a teammate has
    already damaged.

- 69b7503: Four more Johto families have a signature ability.

  - Watchful Roost on Hoothoot. It casts Reflect over its party as it arrives on
    the field.
  - Relay on Ledyba. Whenever it is switched out, its stat stages carry to the
    teammate coming in.
  - Silk Snare on Spinarak. It casts String Shot at every standing enemy as it
    arrives on the field.
  - Lantern Lure on Chinchou. It casts Confuse Ray at an enemy as it arrives on
    the field.

- 6b19cc2: Four more Kanto families have a signature ability.

  - Lullaby on Jigglypuff. Sleep it inflicts lasts 1.5x as long, and its moves hit
    1.5x against a sleeping target.
  - Bloodthirst on Zubat. Draining moves and Leech Seed restore 1.5x for it, and
    every other heal on it is halved.
  - Deep Roots on Oddish. It casts Ingrain on itself as it arrives on the field.
  - Fungal Bloom on Paras. Heals 1/8 of its HP each time it lands a status
    condition on an enemy.

- 060e8f4: Four more Kanto families have a signature ability.

  - Taste Everything on Lickitung. A contact move it lands on a berry holder eats
    that berry, healing or curing it as the berry would.
  - Smog Screen on Koffing. Enemy moves are 15% less accurate while it stands.
  - Corkscrew on Rhyhorn. Its contact moves hit 1.15x and ignore any Defense the
    target has raised.
  - Cushioned on Chansey. No single hit takes more than 1/4 of its HP off it.

- 655421d: Three more Hoenn families have a signature ability.

  - Shared Heart on Luvdisc. Whenever a teammate is healed, it heals half of that
    amount as well.
  - Skull Charge on Bagon. Its contact moves deal 1.4x, and it takes 1/8 of the
    damage they deal back.
  - Hive Mind on Beldum. Its moves hit 10% harder for each teammate standing with
    it, up to 3 of them.

- fe89caa: Four more Kanto families have a signature ability.

  - Overhead Throw on Machop. Its contact moves hit 1.4x against a heavier target
    and 1.1x against a lighter one.
  - Digest on Bellsprout. Landing a move on a target at or below 1/4 HP heals it
    1/4 of its own HP.
  - Tentacle Grasp on Tentacool. No enemy it has landed a move on may flee while
    it is still standing.
  - Solid Core on Geodude. Physical moves hit it at 0.7x and special moves at
    1.3x.

- 65287b2: Four more Kanto families have a signature ability.

  - Late Bloomer on Magikarp. Its moves hit 5% harder for every 10 seconds it has
    been in the fight, up to 1.5x.
  - Safe Passage on Lapras. It casts Safeguard over its party as it arrives, and
    its teammates cannot be stopped from fleeing.
  - Formless on Ditto. Critical hits land on it as ordinary hits, and its stages
    cannot be lowered.
  - Latent Potential on Eevee. Whichever of its five battle stats is lowest counts
    1.3x.

- e6adad6: Five more Hoenn families have a signature ability.

  - Shove on Makuhita. A contact move it lands on an enemy winding a move up
    flinches them, costing them that cast.
  - Magnetize on Nosepass. Enemy moves aimed at one of its teammates are pulled
    onto it instead.
  - Kitten Pace on Skitty. Its Speed counts 1.3x while it is at full HP.
  - Shadow Tax on Sableye. A move it lands removes one raised stage from the
    target.
  - Jaw Claim on Mawile. A move it lands moves one raised stage from the target
    onto itself.

- 4dc8672: Four more Kanto families have a signature ability.

  - Blind Rage on Mankey. 1.4x Attack and 15% less accuracy, and nothing can heal
    it.
  - Chase Down on Growlithe. Its moves hit 1.5x against a target at or below 1/3
    HP, and that target cannot flee from it.
  - Hypnotic Spiral on Poliwag. Whoever lands a contact move on it takes 30%
    longer over their next cast.
  - Teleport Guard on Abra. It blinks away from the first attack that would land,
    then needs 10 seconds to do it again.

- 09aedc0: Four more Kanto families have a signature ability.

  - Queen's Court on Nidoran female. Her Defense and Special Defense are 1.15x for
    each poisoned enemy on the field, counting up to 3.
  - King's Court on Nidoran male. His Attack and Special Attack are 1.15x for each
    poisoned enemy on the field, counting up to 3.
  - Wishing Well on Clefairy. Each time it acts, it casts Wish on the teammate
    lowest on HP.
  - Nine Tails on Vulpix. Its Special Attack rises 8% for each hit it has taken,
    up to 9 hits.

- 0a18837: Four more Johto families have a signature ability.

  - Momentum on Phanpy. Its moves hit 1.1x for each move it has landed since
    taking the field, up to 1.5x.
  - Mind Fog on Stantler. Enemy Special Attack counts 0.85x while it stands.
  - Palette on Smeargle. Its moves take the type of the last move that hit it.
  - Cowbell on Miltank. It casts Heal Bell over its party as it arrives on the
    field.

- ddcfed5: Four more Kanto families have a signature ability.

  - Gallop on Ponyta. Its Speed rises 10% each time it acts, up to 1.5x, and any
    hit it takes clears it.
  - Delayed Reaction on Slowpoke. It feels half of each hit at once and the other
    half 4 seconds later.
  - Repulsion Field on Magnemite. Special moves hit at 0.9x for everybody on the
    field, its own included.
  - Leek Duelist on Farfetch'd. Critical stage 2 higher and criticals 1.25x
    harder, and everything hits it 1.25x in return.

- 5651f2e: Four more Kanto families have a signature ability.

  - Rollback on Porygon. The first time it drops below 1/2 HP, its health goes
    back to what it was 4 seconds earlier.
  - Helix Shell on Omanyte. Its Defense and Special Defense count as 1.25x against
    every blow it takes.
  - Dome Blade on Kabuto. Its blows count the target's Defense or Special Defense
    as 0.75x.
  - Predator's Dive on Aerodactyl. Its first move against each enemy hits 1.5x.

- 495e83f: The Regi trio and the Eon pair have a signature ability.

  - Stone Seal on Regirock. For 8 seconds it deals and takes 0.5x, then deals
    1.25x and gains 2 stages of Defense.
  - Frost Seal on Regice. The same seal, waking into 2 stages of Special Defense.
  - Iron Seal on Registeel. The same seal, waking into 2 stages of Attack.
  - Eon Shield on Latias. Its teammates take 0.8x damage while it stands, itself
    excluded.
  - Eon Lance on Latios. Its moves deal 1.25x and count Reflect and Light Screen
    for nothing.

- cecc3b6: Four more Hoenn families have a signature ability.

  - Mycelium on Shroomish. Anything carrying poison, sleep, paralysis, a burn or a
    freeze takes 1.2x from every blow while it stands.
  - Wide Swing on Slakoth. Its physical moves reach every enemy on the field, not
    only the one it aimed at.
  - Vanishing Act on Nincada. For 1 second after it lands a move, single-target
    moves aimed at it miss.
  - Echo Chamber on Whismur. A sound move it lands echoes 2 seconds later for 1/4
    of the damage it dealt.

- eaa7335: Four more Johto families have a signature ability.

  - Fermenter on Shuckle. Each time it acts with a free hand, a Berry Juice
    appears in it.
  - Heave on Heracross. The first contact move it lands on each enemy casts
    Whirlwind at them.
  - Sharp Claw on Sneasel. Each contact move it lands drops the target's Defense
    by a stage.
  - Sweet Paw on Teddiursa. Its contact moves heal it 1/8 of the damage they deal.

- 8894e66: Four more Johto families have a signature ability.

  - Magma Trail on Slugma. An enemy it has landed a move on loses 1/16 of its HP
    each time it acts, while it stands.
  - Icebreaker on Swinub. A move it lands tears Reflect and Light Screen off the
    target's side.
  - Coral Bloom on Corsola. Whenever it is healed, the teammate lowest on HP is
    healed the same amount.
  - Standoff on Remoraid. Nothing it uses counts as contact, so it never sets off
    what answers a touch.

- eaeb532: Four more Kanto families have a signature ability.

  - Full Belly on Snorlax. It heals 1/16 of its HP every time it acts, and its
    cast times are 25% longer.
  - Frostwing on Articuno. Every enemy loses a stage of Speed as it arrives on the
    field.
  - Stormwing on Zapdos. Every enemy loses a stage of Special Defense as it
    arrives on the field.
  - Emberwing on Moltres. Every enemy loses a stage of Defense as it arrives on
    the field.

- 1f2f045: Four more Hoenn families have a signature ability.

  - Cold Snap on Snorunt. Whoever lands a contact move on it is frozen 20% of the
    time.
  - Applause on Spheal. It heals 1/16 of its HP each time a teammate lands a move.
  - Pearl Guard on Clamperl. Its Special Attack and Special Defense count 1.5x
    while it holds an item.
  - Unchanged on Relicanth. Every move hits it for neutral damage, so it has no
    weaknesses and no resistances. Relicanth's fourth ability is now Multiscale
    rather than Solid Rock.

- 00b5d68: Four more Kanto families have a signature ability.

  - Relentless on Spearow. Each move it lands on the same target as the last hits
    10% harder, up to 1.4x.
  - Squeeze on Ekans. While it casts or channels, the last enemy it touched loses
    1/16 of its HP each second.
  - Chain Lightning on Pikachu. An Electric move it lands arcs to one other
    standing enemy for 1/3 of the damage.
  - Curl Up on Sandshrew. Each hit it takes casts Defense Curl on itself.

- af40b8f: Four more Hoenn families have a signature ability.

  - Stored Bounce on Spoink. Half of each hit it takes is stored, up to 1/2 its
    HP, and the next move it lands deals the lot on top.
  - Unique Spots on Spinda. It arrives with 2 stages in one random stat and 1
    stage off another, rolled fresh each time.
  - Antlion Pit on Trapinch. Any enemy move that misses it costs that enemy 1/8 of
    their HP.
  - Patient Stalk on Cacnea. Its moves hit 10% harder for each second it has stood
    idle, up to 50%, spent on the next one it lands.

- 4705c3b: Four more Kanto families have a signature ability.

  - Core Reset on Staryu. Each time it acts, one stat drop on it is undone.
  - Mimed Barrier on Mr. Mime. It casts Light Screen over its party as it arrives,
    and physical moves hit it at 1.15x itself.
  - Clean Cut on Scyther. Its critical hits ignore every stage on the target's
    defending stat.
  - Icy Charm on Jynx. Its moves hit 1.5x against a target that is infatuated or
    confused.

- 95f2283: Four more Johto families have a signature ability.

  - False Wood on Sudowoodo. It counts as a Grass type for working out what hurts
    it, until the first hit lands on it.
  - Updraft on Hoppip. It cannot be trapped, its Speed cannot be lowered, and it
    always gets away.
  - Tailthrow on Aipom. It casts Fling as it arrives on the field, throwing its
    held item at an enemy.
  - Sunlit Charge on Sunkern. Its channelled moves hit 1.3x and cannot be
    interrupted.

- 1f19363: Five more Hoenn families have a signature ability.

  - Cloud Step on Swablu. The first move aimed at it each battle deals no damage
    to it.
  - Feud Claws on Zangoose. Its moves hit 1.4x against a poisoned target.
  - Deepening Venom on Seviper. A move it lands on a poisoned target turns that
    poison into the badly-poisoned kind.
  - Moon Pull on Lunatone. Its party takes 0.85x damage while it stands, unless a
    Sun Glare holder stands too.
  - Sun Glare on Solrock. Enemies take 1.15x damage while it stands, unless a Moon
    Pull holder stands too.

- 0e5b269: Four more Hoenn families have a signature ability.

  - Migrant's Wind on Taillow. It casts Tailwind over its party as it arrives on
    the field.
  - Gull's Greed on Wingull. Every heal an enemy receives is 0.75x, and it takes
    the quarter for itself.
  - Empath on Ralts. Its Special Attack counts 1.3x while a teammate is below 1/2
    HP.
  - Surface Walk on Surskit. It takes no damage from hazards or from weather.

- 9b199e7: Four more Kanto families have a signature ability.

  - Vine Web on Tangela. It lays a layer of Spikes on the enemy side each time it
    arrives.
  - Mother's Shield on Kangaskhan. Enemy moves aimed at a teammate below 1/2 HP
    are aimed at her instead.
  - Whirl Current on Horsea. Enemy cast times are 20% longer while rain is
    falling.
  - Upstream on Goldeen. Its moves hit 1.35x against any target with more HP than
    its own.

- d3a6e64: Four more Johto families have a signature ability.

  - Fair Share on Togepi. A move under 100% accuracy that just hit somebody in its
    party cannot hit that one again next time.
  - Prophecy on Natu. It casts Future Sight at an enemy as it arrives on the
    field.
  - Live Wire on Mareep. It casts Thunder Wave at an enemy as it arrives on the
    field.
  - Spillover on Marill. Healing past its full HP is thrown at an enemy as damage
    rather than wasted.

- 79b597d: The last three Johto families have a signature ability, which finishes the
  region. The tower duo share one, told either side of a fall.

  - Silver Aegis on Lugia. The first blow that would finish a teammate leaves it
    on 1 HP instead. Once per battle.
  - Rainbow Rekindling on Ho-Oh. The first teammate to fall gets back up on 1/3 of
    its HP. Once per battle.
  - Timeline Split on Celebi. The first time it drops below 1/2 HP, every stat
    drop on it is undone and every status cleared.

- 91eabf5: Four more Johto families have a signature ability.

  - Ruinous Script on Unown. Held items do nothing on the enemy side while it
    stands.
  - Backlash on Wobbuffet. It banks 1/4 of every hit it takes, and pays the bank
    back to whoever last struck it when it next acts.
  - Ambidextrous on Girafarig. Its moves are worked out from whichever of its
    Attack and Special Attack is higher.
  - Shrapnel on Pineco. When it faints, it casts Spikes and Toxic Spikes onto the
    enemy side.

- 4bf05cf: Four more Kanto families have a signature ability.

  - Dust Storm on Venonat. Its Special Attack rises 12% for every enemy carrying a
    status, up to 4 of them.
  - Undermine on Diglett. Each move it lands leaves that enemy taking 5% more from
    everybody, up to 25%, for the rest of the fight.
  - Cutpurse on Meowth. The first move it lands on each enemy knocks their held
    item away.
  - Headache Burst on Psyduck. At or below 1/2 HP its Special Attack is 1.5x and
    its Psychic moves cannot miss.

- 07023c5: Four more Hoenn families have a signature ability.

  - Tail Light on Volbeat. Evasion counts for nothing on the enemy side while it
    stands.
  - Lure Scent on Illumise. Enemy Speed counts 0.85x while it stands.
  - Perennial on Roselia. The first time it drops below 1/4 HP it heals 1/3 of its
    HP and is cured, once per battle.
  - Bottomless on Gulpin. It heals 1/8 of its HP whenever any held item is
    consumed on the field.

- ae187ac: Four more Kanto families have a signature ability.

  - Overload on Voltorb. Its Speed doubles below 1/2 HP.
  - Psyseed on Exeggcute. An enemy its Psychic moves damage has Leech Seed cast on
    it.
  - Mourning Bone on Cubone. Its moves hit 1.4x while it is the only one left
    standing in its party.
  - Second Wind on Tyrogue. The first time it falls below 1/4 HP it heals 1/3 of
    its HP, once per battle.

- 739d0b3: The last five Hoenn families have a signature ability.

  - Primal Sea on Kyogre. Below 1/2 HP it gains 2 stages of Special Attack and its
    Water moves deal 1.3x, for good.
  - Primal Land on Groudon. The same waking, in Attack and Ground moves.
  - Primal Sky on Rayquaza. The same waking, in Special Attack and Dragon moves.
  - Seven Wishes on Jirachi. Every 7 times it acts, its whole party heals 1/4 of
    their HP and it alone is cured.
  - Form Drift on Deoxys. Every 6 seconds it gains a stage in its highest battle
    stat and loses one in its lowest.

- 40c981e: Four more Johto families have a signature ability.

  - Resonance on Yanma. Its sound moves reach every enemy on the field, not only
    the one it aimed at.
  - Contagious Yawn on Wooper. It casts Yawn at an enemy as it arrives on the
    field.
  - Magpie on Murkrow. Any held item taken off somebody else on the field goes
    into its empty hands.
  - Shared Misery on Misdreavus. The first time it drops below 1/3 of its HP it
    casts Pain Split at the healthiest enemy.

- e276b45: Four more Hoenn families have a signature ability.

  - Crooked Run on Zigzagoon. Each time it acts, moves aimed at it are 0.9x as
    accurate, stacking 3 times, and a landed blow clears it.
  - Cocoon on Wurmple. The first time it drops below 1/2 HP, it shells over for 4
    seconds and both deals and takes 0.5x damage.
  - Water Bloom on Lotad. It calls up Rain as it takes the field, and heals 1/16
    of its HP each time it acts in Rain.
  - Sun Root on Seedot. It calls up Sun as it takes the field, and its moves deal
    1.3x damage in Sun.

- 0f53068: Sinnoh's 113 moves are in.

  - Roost, Gravity, Miracle Eye, Wake-Up Slap, Hammer Arm
  - Gyro Ball, Healing Wish, Brine, Natural Gift, Feint
  - Pluck, Tailwind, Acupressure, Metal Burst, U-turn, Close Combat
  - Payback, Assurance, Embargo, Fling, Psycho Shift, Trump Card
  - Heal Block, Wring Out, Power Trick
  - Gastro Acid, Lucky Chant, Me First, Copycat, Power Swap, Guard Swap
  - Punishment, Last Resort, Worry Seed, Sucker Punch, Toxic Spikes, Heart Swap
  - Aqua Ring, Magnet Rise, Flare Blitz, Force Palm, Aura Sphere, Rock Polish
  - Poison Jab, Dark Pulse, Night Slash, Aqua Tail, Seed Bomb, Air Slash,
    X-Scissor
  - Bug Buzz, Dragon Pulse, Dragon Rush, Power Gem, Drain Punch, Vacuum Wave
  - Focus Blast, Energy Ball, Brave Bird, Earth Power, Switcheroo, Giga Impact
  - Nasty Plot, Bullet Punch, Avalanche, Ice Shard, Shadow Claw, Shadow Sneak
  - Thunder Fang, Ice Fang, Fire Fang, Mud Bomb, Psycho Cut, Zen Headbutt, Mirror
    Shot
  - Flash Cannon, Rock Climb, Defog, Trick Room, Draco Meteor, Discharge, Lava
    Plume
  - Leaf Storm, Power Whip, Rock Wrecker, Cross Poison, Gunk Shot, Iron Head,
    Magnet Bomb
  - Stone Edge, Captivate, Stealth Rock, Grass Knot, Chatter, Judgment, Bug Bite
  - Charge Beam, Wood Hammer, Aqua Jet, Attack Order
  - Defend Order, Heal Order, Head Smash, Double Hit, Roar of Time, Spacial Rend
  - Lunar Dance, Crush Grip, Magma Storm, Dark Void, Seed Flare, Ominous Wind,
    Shadow Force

  Some moves read the real-time fight rather than a turn.

  - Payback and Assurance double their power against a target that has cast or
    been hurt in the last 2 seconds.
  - Trump Card gets stronger with every one played this fight, rather than as its
    PP runs down.
  - Sucker Punch and Me First wait for a target that is mid-cast on a damaging
    move. Me First cuts that cast off.
  - Last Resort waits until every other move the user knows has been cast this
    fight.
  - Avalanche answers for a wound the user took in the last 2 seconds.
  - Trick Room reverses cast times instead of turn order. Cooldowns are left to
    Speed.
  - Defog clears hazards from both sides, which is the modern rule.
  - Stealth Rock costs an eighth of a pokemon's HP, scaled by how it takes a Rock
    move.
  - Healing Wish and Lunar Dance are spent on a teammate already on the field,
    since nothing is sent in to replace a fallen pokemon. Lunar Dance also clears
    what its target is waiting on, so every move is ready at once.

- 7e094d8: - Sinnoh's three starters can be caught, with their evolutions. That is nine
  species, with learnsets, sprites and a candy each. A new trainer picks a
  starter from twelve.
  - Bark Brace halves the first physical blow a Turtwig takes each fight and roots
    it.
  - Cinder Brace halves the first special blow a Chimchar takes each fight and
    adds 1.5x to its next move that lands.
  - Crest Brace fails the first status move aimed at a Piplup each fight and
    raises its Special Attack 1 stage.
  - Torterra also reaches Sturdy and Harvest, Infernape reaches Vital Spirit and
    Flash Fire, and Empoleon reaches Defiant and Filter. These are not in the
    mainline.
  - Turtwig appears in the temperate rainforests, montane forests and woodlands.
    Chimchar appears in the montane forests and mountains. Piplup appears in the
    polar oceans, rocky coasts and glaciers.
  - Changes world generation.
- 6c6a420: Sinnoh's trainer classes stand at duelling stops: 42 of them, covering every
  type the region grows.

  - 16 are trades nobody had before, among them the Pokémon Ranger, the Worker,
    the Rancher, the Pokémon Breeder, the Cyclist, the Policeman, the Parasol
    Lady, the Collector, the Twins and the Young Couple. Each climbs its own
    achievement line and pays its own pair of titles.
  - The other 26 are Sinnoh's own of trades already on the road, under Sinnoh's
    names for them: a Guitarist is a Rocker, an Aroma Lady a Sage, a Roughneck a
    Biker, a Clown a Juggler.
  - Every class is drawn in its Diamond and Pearl coat, which its own wins unlock.
  - Changes world generation.

- 76ad50f: Cynthia takes Sinnoh's champion seat.

  - She asks to see all four of Sinnoh's Elite Four beaten, and pays the **Sinnoh
    Champion** title.
  - She fields the six she is known for: Spiritomb, Roserade, Togekiss, Lucario,
    Milotic and Garchomp, in that order.
  - Her coat is on the shelf for whoever takes the seat.
  - Changes world generation: a champion's seat rolls between four people now
    rather than three.

- 5ecc949: Sinnoh's gym leaders, and the eight badges they pay.

  - **Roark**, **Gardenia**, **Maylene**, **Crasher Wake**, **Fantina**, **Byron**,
    **Candice** and **Volkner**, seated in the countries their own type answers
    to alongside the leaders of the other three regions.
  - The **Coal**, **Forest**, **Cobble**, **Fen**, **Relic**, **Mine**, **Icicle**
    and **Beacon** badges, on the shelf after Hoenn's.
  - Each of them is drawn in their Diamond and Pearl coat, unlocked by their
    badge.
  - Sinnoh has no Elite Four or Champion yet, so its badges open no seat.
  - Hoenn's and Sinnoh's badges are drawn from their own art on the shelf, where
    Hoenn's was a lettered disc before.
  - Changes world generation.

- 0708df0: Sinnoh's Elite Four, seated above its gyms.

  - **Aaron**, **Bertha**, **Flint** and **Lucian**, each keeping the seats of the
    country their own type answers to.
  - Each asks to see all eight of Sinnoh's badges before they will fight, and
    leaves their mark on the shelf when they lose.
  - Aaron fields the Drapion he closes with in his own games, which is neither a
    bug nor reachable by any rule; Bertha fields the Sudowoodo.
  - Sinnoh has no champion yet, so its four marks open no seat above them.
  - Changes world generation.

- 6604ae0: Sinnoh's Battle Frontier: five houses, six keepers, and a print apiece.

  - **Palmer** keeps the Battle Tower and asks nothing, and **Thorton** keeps the
    Battle Factory and rents both sides, the way Hoenn's Tower and Factory do.
  - **Dahlia** keeps the Battle Arcade. A panel is spun as the challenge is taken
    and lands on both sides: a sky for the whole fight, every held item left at
    the door, everybody poisoned, or everybody mended.
  - **Darach** and **Caitlin** keep the Battle Castle between them. Nothing puts
    health back on the challenger's side for the whole fight, while the house
    heals as usual. Whichever of them a chunk seats, the Castle Print is what it
    pays.
  - **Argenta** keeps the Battle Hall, which is one pokemon a side. Hers is drawn
    against yours the moment your party is frozen.
  - Each house hangs a silver print for the win and a gold one for beating its
    second three.
  - Changes world generation.

- 6160982: Riolu, Hippopotas and Skorupi can be caught, with their evolutions.

  - Riolu is a baby, so it turns up in the prized band the way Pichu and Wynaut
    do. It evolves into Lucario by friendship in the morning or during the day.
  - Riolu and Lucario appear in mountains, montane forest and alpine tundra.
  - Hippopotas and Hippowdon appear in deserts, badlands and savanna.
  - Skorupi and Drapion appear in the evening and at night, in deserts, shrubland
    and steppe.
  - Aura Match makes a Riolu's moves hit 1.25x against a target holding a larger
    share of its HP than the Riolu has.
  - Dust Bath heals a Hippopotas 1/16 of its HP every time it reaches for a move
    while sand blows.
  - Ambush makes the first move a Skorupi lands on each enemy hit 1.3x.
  - Merciless lands a critical on a poisoned target. Battle Armor and Shell Armor
    still refuse it.
  - Changes world generation.

- 2bd251d: Burmy and Shellos can be caught, with their evolutions. Both come in more than
  one form.

  - A Burmy wears the cloak of the biome it is met in and keeps it through
    evolution.
  - Plant cloaks appear in the forests, sandy cloaks on the beaches and deserts,
    trash cloaks in the badlands, mountains and steppe.
  - Each Wormadam cloak has its own types and its own hidden ability.
  - A male Burmy evolves into Mothim instead.
  - Patchwork raises a Burmy's Defense and Special Defense 1 stage for the first
    hit of each type it takes, 3 times a fight.
  - Shellos and Gastrodon come in a west and an east shell. Which one the world
    stages depends on the side of the map.
  - Two Seas gives the west shell 1.25x on Water moves and the east shell 1.25x on
    Ground moves.
  - Changes world generation.

- 4d4b205: Drifloon, Buneary and Glameow can be caught, with their evolutions.

  - Drifloon and Drifblim appear in the evening and at night.
  - Buneary evolves into Lopunny by friendship.
  - Carry Off gives a Drifloon a 20% chance to blow the target away when it lands
    an attack.
  - Springheel raises a Buneary's Speed 1 stage for each of the first 3 attacks it
    lands.
  - Velvet Claws make a Glameow's contact moves hit 1.25x against anything that
    has raised a stat that fight.
  - Flare Boost gives a burned holder 1.5x Special Attack.
  - Klutz stops a holder's item from doing anything.
  - Changes world generation.

- afb2bdd: Combee, Buizel and Cherubi can be caught, with their evolutions.

  - Only a female Combee evolves into Vespiquen.
  - Cherrim's open blossom is a worn form, the way Castform's skies are.
  - Pollen Dole heals the worst hurt teammate for 1/16 of its HP each time a
    Combee lands an attack.
  - Float Sac keeps a Buizel above Ground moves and hazards until a blow takes it
    under 1/2 HP.
  - Second Bloom heals a Cherubi for 1/4 of its HP and raises its Special Attack 1
    stage, once a fight.
  - Changes world generation.

- 67502ba: Heatran and Regigigas can be met.

  - Stark Mountain sits in volcanoes and holds Heatran. Snowpoint Temple sits in
    glaciers and tundra and holds Regigigas.
  - Lavadome is Heatran's signature. A burned enemy takes 1.25x from everything
    while Heatran stands, whoever the blow came from, and its own side burns at
    the usual rate.
  - Titan Seal is Regigigas', and it is the fourth of the Regis' seals. For 8
    seconds it takes 0.5x, and it then deals 1.25x and gains 2 stages of Attack.
    Unlike the other three it deals its damage whole while sealed, because Slow
    Start is already halving the Attack behind it.
  - Slow Start is new. Attack and Speed are halved for a holder's first 8
    seconds on the field, which is the same window its seal covers it for.
  - The mainline gives Heatran only Flash Fire and Flame Body and Regigigas only
    Slow Start, so each carries more of this registry's own: Magma Armor and
    White Smoke for Heatran, Iron Fist, Sturdy and Intimidate for Regigigas.
  - Changes world generation.

- 2601cf6: Croagunk, Finneon and Snover can be caught, with their evolutions.

  - Croagunk and Toxicroak appear in swamp, bog and mangrove.
  - Finneon and Lumineon appear in ocean, coral reef and kelp forest.
  - Snover and Abomasnow appear in alpine tundra, taiga and tundra.
  - Finisher makes a Croagunk's moves wind up 25% faster against a target at or
    below 1/4 HP. Cooldowns are untouched.
  - False Eyes brings a single-target move aimed at a Finneon's teammate below
    1/2 HP to the Finneon instead. A move that teammate was immune to anyway is
    left alone, so a Storm Drain or Water Absorb teammate keeps what it draws.
  - A Follow Me now outranks the abilities that pull a move somewhere else.
    Lightning Rod no longer takes a move off the pokemon that called for it, and
    draws a move through the same rule everything else that redirects does.
  - Evergreen makes Fire moves hit a Snover at 0.5x while hail or snow falls,
    which is the weather its own Snow Warning brings.
  - Changes world generation.

- 0e8999f: Shinx, Cranidos and Shieldon can be caught, with their evolutions.

  - The Skull Fossil and the Armor Fossil are dug up and sold like the other five.
    Cranidos and Shieldon are revived from them.
  - Gleam Eyes let a Shinx ignore raised evasion and hit a target that is in the
    air or underground.
  - Ramrod lets a Cranidos strike through Protect, Detect and a Substitute.
  - Bulwark gives a Shieldon's guard to its whole team for as long as its own
    lasts.
  - Changes world generation.

- a6ecd30: Arceus can be met, in all eighteen of its shapes.

  - The Hall of Origin holds Arceus, and Arceus is a mythical, so the Azure Flute
    found in the special band of the item pool is the only way to one.
  - Multitype needs no battle code. Each of the seventeen Plates names one shape,
    the way each orb names one Origin Forme, and the shape's own data carries the
    type the Plate lifts. So a Plate both paints an Arceus and boosts what it
    throws, which is what the mainline does.
  - The shapes are worn rather than met: the dex fills all seventeen in the day
    the bare one is.
  - Firstlight is the signature. Its moves of the type it is wearing are never
    resisted: a resistance is read as no resistance, a weakness is still a
    weakness, and an immunity still holds.
  - The mainline gives Arceus only Multitype, so it carries three of this
    registry's own: Mold Breaker, Filter and Adaptability.
  - Changes world generation.

- 5ce2cad: Stunky, Bronzor and Gible can be caught, with their evolutions.

  - Stunky and Skuntank appear in the evening and at night, in shrubland,
    grassland and woodland.
  - Bronzor and Bronzong appear in mountains, badlands and alpine tundra.
  - Gible, Gabite and Garchomp appear in mountains, badlands and deserts, as
    rarely as the other pseudo-legendaries.
  - Rank Air makes a Stunky's moves hit 1.25x against a poisoned target.
  - Deep Toll costs each enemy 1/16 of their HP every time a Bronzor reaches for
    a move.
  - Skyhunt lets a Gible's Ground moves reach a target that is off the ground,
    and hit it 1.2x.
  - Heatproof halves what a Fire move and a burn take off its holder.
  - Changes world generation.

- 8ad7ab0: Dialga, Palkia and Giratina can be met, each in its other shape as well.

  - Spear Pillar sits on mountains and alpine tundra and holds Dialga and Palkia,
    so which of the two answers is a roll. Turnback Cave sits in badlands and bog
    and holds Giratina alone.
  - Time Drag, Space Drift and Void Weight make every enemy read one stage a step
    lower while the holder stands: Speed for Dialga, accuracy for Palkia, Attack
    for Giratina. Nothing is written to the enemy, so it lifts the moment the
    holder leaves the field and two of them never stack.
  - The Adamant, Lustrous and Griseous Orbs are new. A member of the trio holding
    its own orb fights in its Origin Forme, which is worn rather than met: the
    dex fills the shape in the day its own is. Nobody sells one, so the prized
    band of the overworld item pool is the only way to one.
  - Origin Forme carries an ability of its own. Giratina Origin has Levitate, as
    it does in the mainline, Dialga Origin has Unaware and Palkia Origin has
    Shadow Tag.
  - The mainline gives all three only Pressure and Telepathy, so each carries two
    of this registry's own: Speed Boost and Analytic for Dialga, Infiltrator and
    Magic Guard for Palkia, Contrary and Cursed Body for Giratina.
  - Changes world generation.

- e966e01: Uxie, Mesprit and Azelf can be met.

  - Each sleeps under its own lake. Lake Acuity sits in taiga and tundra, Lake
    Verity in temperate forest and woodland, and Lake Valor in grassland and bog.
    A lair holds one of them, the way the sealed chambers hold one golem each.
  - Mindgift, Heartgift and Willgift give the holder's whole team 1 stage as it
    takes the field: accuracy for Uxie, Special Attack for Mesprit, Attack for
    Azelf. It is the Kanto birds' wingbeat aimed at its own side.
  - The mainline gives all three only Levitate, so each carries three of this
    registry's own: Anticipation, Frisk and Forewarn for Uxie, Synchronize,
    Serene Grace and Healer for Mesprit, Inner Focus, Own Tempo and Clear Body
    for Azelf.
  - Changes world generation.

- f8c372c: Starly, Bidoof and Kricketot can be caught, with their evolutions.

  - Murmuration raises a Starly's damage 1.05x for each teammate still standing,
    up to 1.25x.
  - Lodgework cuts indirect damage to a Bidoof's team by 25%.
  - Chorus raises the damage of sound moves from a Kricketot's team by 1.2x.
  - Changes world generation.

- 9792f37: Cresselia and Darkrai can be met, one off each of two islands.

  - Fullmoon Island sits in the ocean and holds Cresselia, which the world stages
    in the evening and at night. Newmoon Island holds Darkrai, and Darkrai is a
    mythical, so the Member Card is the only way to that one.
  - Waning Light halves how long a status runs on Cresselia's own team, itself
    included. Waxing Dark makes a status Darkrai puts on an enemy run 1.5x as
    long. Both are asked at the same question, so meeting each other leaves a
    night shorter than it started, and neither compounds with a second holder.
  - Aroma Veil is new. Its holder's teammates cannot be taunted, tormented,
    encored, charmed or heal blocked.
  - The mainline gives Cresselia only Levitate and Darkrai only Bad Dreams, so
    each carries three of this registry's own: Healer, Illuminate and Aroma Veil
    for Cresselia, Unnerve, Prankster and Infiltrator for Darkrai.
  - Changes world generation.

- 9cfb247: Two new items work on a pokemon's abilities, both found in the prized band.

  - The **Ability Capsule** does what the Channeler does, without her: it widens
    a pokemon and draws one more of the abilities its line can reach into the new
    slot, up to the four a pokemon may hold. Which ability comes up is a roll.
  - The **Ability Patch** writes that family's signature ability into a pokemon.
    A signature is never rolled at birth and the Channeler never calls one up, so
    a patch is the only way to one. A pokemon with a slot standing empty gains it;
    a full one gives up an ability the player chooses, and neither can be undone.
  - Both are found in the prized band and neither is sold.

- 4e2919c: Any battle can be watched from `/battle/{battleId}` by a signed-in player, played back from its record.
- 8985eae: Water and ice have spawns of their own.

  - Ponds, rivers and seas spawn what lives in water, and a sea's islands spawn what lives on land.
  - Frozen water in cold biomes has its own spawns, and it can still be walked on.
  - Nothing that only swims appears on land, and nothing that only walks appears in water.
  - Uxie, Mesprit and Azelf can also be met in the waters of their lakes.
  - Changes world generation.

- e7892a3: Six Hoenn families reach the stages Sinnoh added to them.

  - Budew hatches from a Roselia and turns into one at high friendship in the
    morning or during the day. Roselia becomes Roserade with a Shiny Stone.
  - Chingling hatches from a Chimecho and turns into one at high friendship in
    the evening or at night.
  - Kirlia becomes Gallade with a Dawn Stone, if it is male.
  - Nosepass becomes Probopass with a Thunder Stone, which is what the newer
    games ask for instead of a magnetic field.
  - Dusclops becomes Dusknoir when it is handed over holding a Reaper Cloth.
  - Snorunt becomes Froslass with a Dawn Stone, if it is female.
  - Levitate is on Probopass here, for the three small noses it keeps in the air.
  - Iron Fist is on Dusknoir here, for the punches it is the only one of its line
    to throw.
  - Roselia and Chimecho now hatch from their babies, so their egg moves belong
    to Budew and Chingling.
  - Changes world generation.

- ace462b: Ten Johto families reach the stages Sinnoh added to them.

  - Bonsly hatches from a Sudowoodo and becomes one at 20 knowing Mimic.
  - Mantyke hatches from a Mantine and becomes one at 32.
  - Aipom becomes Ambipom at 32 knowing Double Hit.
  - Misdreavus becomes Mismagius with a Dusk Stone, and Murkrow becomes
    Honchkrow with one.
  - Sneasel becomes Weavile at 35 holding a Razor Claw, in the evening or at
    night, and gives up the claw. Gligar becomes Gliscor the same way with a Razor Fang.
  - Togetic becomes Togekiss with a Shiny Stone.
  - Yanma becomes Yanmega at 33 knowing Ancient Power, and Piloswine becomes
    Mamoswine at 45 knowing it.
  - An evolution can now ask for a move the pokemon knows. Four lines use it.
  - Cursed Body, Infiltrator and Magic Bounce are on Mismagius here, Friend Guard
    on Togekiss, and Slush Rush on Mamoswine.
  - Friend Guard is new: its teammates take 0.75x from everything while it
    stands.
  - Sudowoodo and Mantine now hatch from their babies, so their egg moves belong
    to Bonsly and Mantyke.
  - A trainer fields the last stage of a line their own region holds. A Johto
    Medium walks a Misdreavus, because Mismagius is Sinnoh's.
  - Changes world generation.

- 7393d3c: Twelve Kanto families reach the stages Sinnoh added to them.

  - Mime Jr. hatches from a Mr. Mime and becomes one at 20 knowing Mimic.
  - Happiny hatches from a Chansey and becomes one at 15 in daylight, holding an
    Oval Stone, which the evolution uses up.
  - Munchlax hatches from a Snorlax and becomes one at high friendship.
  - Magneton becomes Magnezone with a Thunder Stone.
  - Lickitung becomes Lickilicky at 33 knowing Rollout, and Tangela becomes
    Tangrowth at 38 knowing Ancient Power.
  - Rhydon becomes Rhyperior when it is handed over holding a Protector.
    Electabuzz, Magmar and Porygon2 do the same with an Electirizer, a Magmarizer
    and a Dubious Disc.
  - Eevee has two more ways to go: a Leaf Stone for Leafeon and an Ice Stone for
    Glaceon.
  - The Oval Stone is new, and the Shiny, Dusk, Dawn and Ice Stones are stocked
    and buried now that lines ask for them. So are the Protector, Electirizer,
    Magmarizer, Reaper Cloth, Dubious Disc, Razor Claw and Razor Fang.
  - Levitate is on Magnezone here, Thick Fat on Lickilicky, Sap Sipper on
    Tangrowth, Iron Fist on Electivire, and Flash Fire with Solar Power on
    Magmortar.
  - Magic Bounce is on Mr. Mime here. Mime Jr. brings nothing the adult did not
    already have, so the line was a stage short of four abilities.
  - Chansey, Mr. Mime and Snorlax now hatch from their babies, so their egg moves
    and their hatch costs belong to Happiny, Mime Jr. and Munchlax. The Pichu,
    Cleffa, Igglybuff, Tyrogue, Smoochum, Elekid and Magby lines were reading the
    default hatch cost for the same reason, and now read their own.
  - Changes world generation.

### Patch Changes

- 54cc800: A raid boss no longer faints to Destiny Bond. A boss faints only when its HP
  reaches zero.
- dae72bc: Stat drops now land on a raid boss. Growl, Screech, Intimidate and everything
  else that lowers a stat were refused before.
- f9fcd82: - The battle ground fades into fog toward the horizon and darkens at the edges, so the fight stands out from bright biomes.
  - Each side stands inside a faint ring on the ground.
  - One bar across the top of a battle shows its name, each side's health and how many are still standing, and the Leave button.
  - In a raid, the boss has a wide health bar of its own in that bar.
- 0e8999f: A rental support is no longer given a nature that raises its attacking stat.
- 34b375d: A confused pokemon hitting itself no longer breaks the fight. The self-hit is
  not a registered move, so the confusion status now answers for it: typeless,
  unmissable, no contact and no steps.
- bfeb925: Aeroblast is drawn as a storm aimed at something: wind winding out of the caster and widening onto whatever it is pointed at, held for as long as the move lasts, rather than an orb thrown across the field and a beam at the end of it.
- bfeb925: X-Scissor and Cross Chop land as two cuts crossing into an X. Every slash in the game is drawn as a straight tapered blade rather than a rounded curve, so an edge reads as an edge.
- 34b375d: Asking whether a pokemon has an ability is cheaper, which a raid of 49 pokemon
  felt.

  - A unit that does not carry the ability answers on its own instead of asking
    the whole field.
  - Effects that ask whether a holder is standing read the ability's own holder
    list instead of sweeping every unit.

- ae21751: Brick Break breaks screens only when it lands, so a miss or a Ghost type leaves them standing.
- 644489f: - The pokemon sheet fits on one screen: portrait beside moves, abilities and held items, then evolutions beside stats.
  - The pokemon's name, gender and shiny mark head the sheet in place of a title bar.
  - Each move shows its type and category next to its name.
  - Stats show the total, IV and EV side by side, with EVs typed into the same table.
  - The portrait is the same size for every species.
  - "View in Pokedex" and a red Release entry are in the Actions menu.
  - The level button reads "Level Up" with its candy cost in a badge.
  - The full ownership history opens in its own dialog.
  - Moves, abilities, held items and stats each have an info icon that explains how they work.
- ae21751: Move, ability and item descriptions now match how they work. Among them:

  - Binding moves say 1/8 of HP every 2 seconds for 8 seconds, and Hyper Beam's recharge is 2 seconds.
  - Self-Destruct and Explosion cost their power in HP and hit teammates too, as do Earthquake and Surf.
  - Black Sludge heals a Poison type 1/16, and Blunder Policy gives +2 Speed.
  - Luck Incense and Amulet Coin say they work while your buddy carries them.
  - Plus, Prankster, Tangled Feet, Quick Feet and Keen Eye say what they do here.

- 43640f6: - The dex entry is headed by the species' number, name, category, types and seen and caught counts, with the arrows and an × to close.
  - Its portrait, sizes, candy and evolution line stay in view on the left while stats, abilities, where it lives and moves scroll on the right.
  - One portrait with Regular and Shiny toggles, and male and female toggles where the two differ, replaces the row of coats.
  - The evolution line shows every stage, with what each takes on hover and unmet stages as silhouettes; pressing a stage opens its entry.
  - Base stats show their total.
  - Abilities sit in two columns, with hidden ones in blue and the family's signature in gold.
  - Each move opens its card on hover.
  - Each section has an info icon explaining it.
- 10155a5: An item cache or honey tree already used this window is drawn that way across the whole board, not only near the player.
- 43640f6: - Evolutions that need friendship, a time of day, a known move or a stat comparison now say so, such as Espeon and Umbreon, Ambipom and Hitmonlee.
  - Shedinja's evolution says a Poke Ball is carried rather than used.
- 0cd82ac: Every legendary can be met in the wild in each biome that hosts its lair.
- 6f53d12: Forms bring what is theirs in battle:

  - Holding its orb, Origin Dialga gains Unaware, Origin Palkia gains Shadow Tag and Origin Giratina gains Levitate.
  - Holding a Gracidea, Sky Shaymin gains Serene Grace.
  - A form's ability takes no ability slot and cannot be copied, traded or taken.
  - Cherrim opens into its Sunshine Form in the sun and closes when the sun goes.

- 8c856c7: - Guillotine closes two great pincers on the target and snaps them shut, cutting a line of light through it.
  - Horn Drill grinds a spinning drill into the target, throwing sparks, and punches straight through it.
- dd04bb5: - The bag, quests, duel rules and the auction's Sell card each have an info icon that explains how they work.
  - The menu shows a count on Profile for requests, trades and auction lots waiting, on Gifts for gifts to claim, and on Quests for quests ready to claim.
- The mark each blow leaves is drawn in the battle field, in front of the pokemon it hit.
- 9bedebe: Hoenn's 135 pokemon learn Sinnoh's moves. That is 264 level-up entries, 543
  teachable moves per species, 204 family-wide ones and 63 egg moves, taken from
  Diamond, Pearl, Platinum and HeartGold/SoulSilver.
- 4e7a29a: Johto's 100 pokemon learn Sinnoh's moves. That is 238 level-up entries, 430
  teachable moves per species, 122 family-wide ones and 44 egg moves, taken from
  Diamond, Pearl, Platinum and HeartGold/SoulSilver.
- 1fd2691: Kanto's 151 pokemon learn Sinnoh's moves. That is 324 level-up entries, 449
  teachable moves per species, 281 family-wide ones and 53 egg moves, taken from
  Diamond, Pearl, Platinum and HeartGold/SoulSilver.
- fa874db: A volcano's lava can no longer be walked on, and nothing spawns, stands or lands on it.
- dc2a981: - The menu button on the overworld shows its icon without the word "Menu".
  - A profile shows the gold and the worn title on the same row.
  - Opening the Friends tab on a profile no longer jumps back to Battles.
  - The Add friend button sits beside the Friends heading.
  - Friend requests are a Requests tab inside Friends, and the Friends tab shows how many are waiting.
  - Awards are split into Badges, Achievements, Type specialists and Trainers beaten tabs.
  - Trades are split into Pending and Settled tabs.
  - Bids and Selling are one Auction tab, with a tab for each.
  - Gifts are split into Catches, Items and Encounters tabs, each with its own search.
  - The bag is split into Items and Candies tabs, with a tab for each type of item.
- 7eefb56: A meteor shower makes a shiny 8x as likely, up from 2x.
- 84b6512: - In battle, the name of a move being cast shows sharp on a plate in the move's type colour, so its type reads at a glance.
  - The plate pops in when a cast starts, floats away when it lands, and shakes off in red when it is interrupted.
- 32ec624: A nest egg is worth more than a wild catch of the same species:

  - Two of its six stats hatch perfect, and it has a hidden ability one time in five.
  - It knows two egg moves, the first one its line can otherwise only get through chain breeding.
  - The weather you take it under counts, the way it does for a wild meeting.
  - It hatches in half the steps.
  - It hatches with room for a second ability and a second held item.

- 34b375d: - A raid boss is immune to Power Swap, Guard Swap and Heart Swap. A landed swap
  used to copy stages onto one side rather than trade them.
  - Taunt, Torment, Imprison and Encore no longer hold a boss to part of its move
    set. Disable already did not.
  - A boss is no longer staged with those three swaps, or with Healing Wish, Lunar
    Dance, Helping Hand and Follow Me. All four are spent on a teammate a lone
    boss does not have.
- 34b375d: A raid boss is immune to Role Play, Skill Swap, Gastro Acid and Worry Seed, and
  the AI no longer picks them against one. They could take the Boss ability off
  it, which is what carries the raid's HP pool and its immunities. A shadow can no
  longer be copied off a pokemon either.
- af20025: The battle AI sings Perish Song only when the other side stands to lose more HP to it than its own side, the singer included.
- ae21751: A PP Up or PP Max can no longer be spent on a move whose PP it would not raise, such as Sketch.
- ccb2661: Raid bosses take and heal fixed amounts rather than shares of their HP:

  - Super Fang, Endeavor and one-hit KO moves now land on a boss for up to 200 damage.
  - Burns, poison, seeds, weather and other indirect damage take up to 200 a hit, up from 100.
  - A boss heals up to 1,000 HP a second, rather than 1/8 of its HP.
  - A boss has 60x its species' HP, up from 20x.

- 211a36a: Rayquaza and the Sky Pillar are found in the ocean rather than on mountains.
- 739e945: Every signature ability now carries its name and description in the ability
  registry, so the ones added after the Rattata line are no longer nameless in the
  dex, the search box and the command bar. A test checks the registry against the
  abilities the battle engine implements.
- 35ca919: Every server call now checks its arguments before it acts. A request with a
  coordinate outside the world, a list longer than the game allows, or a field of
  the wrong kind is refused instead of being read.
- f61c24a: More moves land as a picture of their own:

  - Roar of Time throws out rings that freeze in place and then shatter.
  - Spacial Rend tears a pink gash in the air that gapes open and snaps shut.
  - Judgment brings shafts of light down all around the target.
  - Seed Flare bursts upward in a green-white flash.
  - Shadow Force darkens the target, then cuts it from behind with a heavy hit.
  - Mist Ball bursts into a cloud of down, and Luster Purge draws light in before it flares out.
  - Doom Desire drops a falling star that bursts on the target.
  - Crush Grip closes two great hands on the target and squeezes.
  - Psycho Boost spirals psychic light into the target, then blasts out of it.
  - Lunar Dance raises a crescent moon with smaller ones circling.
  - Heart Swap sends two hearts trading places between the pokemon.
  - Dark Void swallows the target in a black sphere ringed in red.
  - Magma Storm winds a vortex of lava up around the target.
  - Sacred Fire stands on the target as a pillar of fire with rainbow edges.
  - Blast Burn cracks the ground under the target and erupts in fire.
  - Hydro Cannon slams a great ball of water into the target, and a ring of water spouts bursts up around it.
  - Fire Punch, Ice Punch and Thunder Punch land with flames, frost or sparks breaking off the blow.
  - Flare Blitz and Volt Tackle arrive wrapped in fire or lightning, and Brave Bird in pale blue fire.
  - Fire Fang, Ice Fang and Thunder Fang break flames, frost or sparks off the bite.
  - Draco Meteor brings meteors streaking down onto the target.
  - Outrage, Thrash and Petal Dance land as a run of heavy blows, with petals flying for Petal Dance.
  - Earth Power splits the ground under the target and light bursts up out of it.
  - Heat Wave blows a wavering wall of hot air and embers across the target.
  - Dark Pulse sends dark rings pulsing out from the pokemon that used it.
  - Sheer Cold freezes the target in a block of ice that cracks and shatters.
  - Protect and Detect throw up a shell of hexagons that flashes as it rises.
  - Substitute's doll drops into place from above with a bounce and a puff of dust.
  - Splash flops about in a few hops of spray, and nothing happens.
  - Metronome ticks over the pokemon's head, then scatters colour as it picks.
  - Transform runs bands of light up the pokemon that is changing.
  - Swords Dance circles the pokemon with swords that close in and cross overhead.
  - Dragon Dance winds two strands of aura up around the pokemon.
  - Iron Defense and Harden run a metal sheen across the body.
  - Double Team and Minimize slide copies of the pokemon out to either side.
  - Calm Mind and Nasty Plot gather light into the head under a halo.
  - Weather Ball drops a ball made of the current weather that bursts as fire, water, ice or rock.
  - Hyper Beam and Solar Beam fire a far thicker beam that holds on the target while shockwaves roll off it.
  - Giga Impact arrives wrapped in a dark purple aura and sends a wide wave along the ground.
  - Focus Punch and Dynamic Punch charge a glowing fist, then land a blow that goes off like a blast.
  - Close Combat lands a flurry of quick blows, then one last heavy one.
  - Aura Sphere and Focus Blast burst on the target into rings of aura.
  - Pin Missile, Bullet Seed, Icicle Spear, Rock Blast and Bone Rush fly in one piece at a time, as needles, seeds, icicles, rocks or bones.
  - Double Kick and Triple Kick land their kicks from alternating sides.
  - Rest blows a sleep bubble with Zs drifting up.
  - Morning Sun and Moonlight bring a shaft of warm sunlight or cool moonlight down on the pokemon.
  - Synthesis draws leaves spiralling in, and Aromatherapy drifts petals over the pokemon.
  - Wish sends a star up into the sky that comes back down on the pokemon.
  - Roost lets feathers drift down and settle, and Heal Order brings a swarm of bees.
  - Sing, Grass Whistle and Perish Song drift music notes round the target, dark ones for Perish Song.
  - Roar, Hyper Voice and Bug Buzz roll shock arcs out toward the target.
  - Heal Bell swings a golden bell that rings out.
  - Leaf Blade draws one long blade across the target that sheds leaves.
  - Night Slash sweeps a dark crescent round the target.
  - Psycho Cut throws spinning psychic blades, and Air Slash throws blades of wind.
  - Fury Cutter cuts again and again, each cut bigger than the last.
  - Toxic bubbles up round the target from a pool of poison.
  - Stun Spore drifts yellow spores down that crackle.
  - Glare opens an eye over the target that flashes.
  - Encore claps sparkles together over the target's head.
  - Taunt throbs an anger mark on the target's head.
  - Curse drives a nail into the target in three blows.
  - Agility streaks speed lines past the pokemon and leaves afterimages behind.
  - Rock Polish rubs the pokemon to a shine with glints popping.
  - Bulk Up throbs twice with power, and Howl sends rings up off the pokemon's head.
  - Amnesia floats empty thought bubbles off the pokemon's head.
  - Cosmic Power circles stars round the pokemon.
  - Barrier puts up a pane of glass the way Reflect does.
  - Defend Order lines bees up into a wall in front of the pokemon.
  - Charge crackles electricity in over the body, and Tail Glow lights a pulsing light at the tail.
  - Stockpile stacks orbs over the pokemon one at a time.
  - Growth pushes a sprout up out of the ground.
  - Withdraw and Defense Curl close a shell round the pokemon.
  - Growl rolls sound arcs out toward the target, and Screech and Metal Sound send jagged ones.
  - Scary Face opens an eye over the target, and Charm sends up hearts.
  - Tickle brushes feathers at the target's sides, and Feather Dance drifts feathers down on it.
  - Cotton Spore drifts cotton puffs down that stick to the target.
  - String Shot shoots strands of silk that wind round the target.
  - Fake Tears drops tears from the target's eyes.
  - Memento sends the pokemon that used it up in dark smoke.
  - Defog blows the fog away from the target.
  - Tri Attack turns three orbs of fire, ice and lightning in on the target, each bursting as its element.
  - Flame Wheel rolls into the target as a ring of fire.
  - Waterfall drives a column of water up through the target.

- f5786b2: The raid demo grants each pokemon its family's signature ability instead of the
  one it would have rolled, boss included, so the signatures can be watched
  somewhere. Every signature is now registered under the family it was written
  for, which is what the demo asks for one by.
- bfeb925: The Sinnoh moves are drawn as themselves rather than by their type alone:

  - Roost, Heal Order, Healing Wish and Lunar Dance draw health coming back.
  - Aqua Ring puts three turning hoops of water round the pokemon and leaves them there.
  - Stealth Rock and Toxic Spikes are laid on the ground, the way Spikes is.
  - Trick Room is a room over the field and Gravity is a weight on it, both new pictures.
  - Every special move of a type that had none before now arrives as something: Dark Pulse, Dragon Pulse, Focus Blast, Judgment and nine others shared one flower burst.
  - Dive, Bounce and Shadow Force no longer draw a hit on the target while the caster is out of reach.

- dd04bb5: A raid or duel invitation disappears once its lobby has started, been cleared or, for a raid, its window has closed.
- bfeb925: Sweet Scent is drawn as a breeze of pink petals over everything it reaches, rather than as the evasion it takes off, and nothing crosses the field before it any more. A move with a picture of its own now keeps it even where it moves a stat.
- 195acc5: The sprite processor is its own page at /sprite-processor now, rather than a section of the admin dashboard, and asks nobody to sign in. It still only runs on a development build, which is the whole of what guards it.
- 0ec290b: A trainer's challenge dialog shows their team without a paragraph of stakes under it.
- bfeb925: U-turn lands its blow on the first step and swaps out on the second, rather than doing both at once after a step that did nothing. It is drawn as what it is now: something thrown out to the target and back to where it started, and then the leaving.
- ccb2661: - In battle, a pokemon that changes how it looks, such as a Transform or a form change, flashes and swells as it swaps to the new look.
  - It keeps its old look until the new one has loaded, instead of vanishing for a moment.

## 3.3.4

### Patch Changes

- fbd7cae: - Nurse Joy heals a whole party in one go, instead of sometimes refusing it right after the server starts.
  - Releasing several pokemon and spending points on moves no longer fail at random right after the server starts.
- d338a5f: Spite fails against a raid boss, the same way Disable does.

## 3.3.3

### Patch Changes

- 383c9c6: Nurse Joy heals a pokemon that is not a shadow to its own maximum health, instead of a few points past it.

## 3.3.2

### Patch Changes

- b336a09: Cave and dark-day lamps keep their shape and place after the screen changes size, such as when a phone's address bar hides.
- 7a99fa0: A pokemon taken in a trade or won at auction now counts as caught in the pokedex.

## 3.3.1

### Patch Changes

- 0ab5847: - A shiny's sparkle has a new sound.
  - The game plays no other sound effects for now.
- 8af2008: - Stopping on the overworld saves your position and steps in one request, and a save is no longer read back again.
  - The overworld board only asks for a chunk's spawns when its window is missing or has run out, instead of every few seconds of walking.
  - Quest completion checks pause while the game's tab is hidden, and run once when you come back.
  - A shiny's sparkle in battle waits for the fight to start instead of sitting frozen through the countdown.
  - A shiny's sparkle on the overworld plays through instead of stopping halfway and vanishing.
  - A position that fails to load no longer replaces your saved spot with a new starting point.
  - A tab left open across an update no longer sends nest, phenomenon and spawn claims to the wrong action.
  - A tab left open across an update reloads on its next action instead of running it against the new version.

## 3.3.0

### Minor Changes

- 8583a37: - Settings can turn the overworld's grid lines on. They are off by default.
  - Settings can draw the board flat on wide screens too.
- c873fb8: Pressing open ground marks that square with a ring and an outline until the walk there ends.

### Patch Changes

- 8c6b4a2: The site's icon is a grass tile standing on a cliff, sharp at every size and on phone home screens.
- debb944: Shadow and purified auras are redrawn and stand out in the dark theme:
  - A shadow pokemon stands in dark violet flames with rising embers.
  - A purified pokemon stands in a golden ring with pillars of light and rising stars.
- 0c3d514: An Illuminate buddy or a held Explorer Kit lights the dark 5 cells out, up from 3.
- fecce21: - A shiny's sparkle opens with a ring and rays of light, then scatters turning glints in gold, white and pale blue.
  - On the board the sparkle is drawn at full strength rather than shrunk below a pixel.
- 57f2488: The board picks up a new buddy, a hatched one, or an item given to or taken from a catch straight away, rather than after a reload.
- 484ceb9: - A pokemon met right after going into or out of a cave is the one drawn on the board.
  - A pokemon caught there leaves the board.
- 0c3d514: Every cell of cave floor can be walked to from a cave mouth.
- 6eff42c: On a phone, the game bar shows only the menu and a details button, which opens the place, weather, world clock and gold.
- 0f1c5cb: Moves are drawn in the battle field with depth:

  - A move in the air and a move landing both cross the field in perspective, and pass behind whoever stands nearer the camera.
  - Sparks, spray and debris fly around the pokemon and fall back to the ground.
  - Fire, lightning, beams and healing light up the ground under them.
  - Coils wrap round a pokemon, shields rise as a dome, and screens stand up as panes of glass.
  - Heavy hits such as Earthquake, Explosion and Fissure shake the field.
  - Statuses landing and biting are drawn round the pokemon in depth, from rising poison bubbles to a cage of bars.
  - Shadow and purified auras stand round the pokemon in battle, and a shiny's sparkle bursts in the field.
  - A shadow pokemon's aura is a dark purple storm cloud that swells out from its feet, with arcs of purple lightning.
  - Weather falls through the battle field in depth: rain splashes on the ground, hail bounces, sand and fog drift between the pokemon, and sunlight falls in shafts.

- 76a54d9: Releasing, trading or listing pokemon at the same moment can no longer leave you with none.
- 6d1dba8: - The raid lobby no longer reloads when a player forms a team or walks in; only what changed is added.
  - A raid lobby reads its teams, and every party's pokemon, in one request each instead of one per team or pokemon.
  - Battle history reads a page's teams and opponents in one request each instead of one per battle.
  - The auction board, auction lot lists and trade lists read their pokemon in one request instead of one per lot or trade.
  - The overworld board reads its landmark glows once per chunk and window instead of on every step.
  - Landmark glows sit on the landmark they describe.
  - Auction notifications follow only the lots you sell or bid on, instead of re-reading every auction on each bid anywhere.
  - Won and unsold auction notifications appear when the lot ends, without waiting for another bid somewhere.
  - The overworld board reads which caches, berry patches and happenings you have already claimed in one request instead of three per chunk.
  - A catch's previous owners, the raids you were invited to, and your duel lobbies are each read in one request instead of one per entry.
  - Friend, request, notification and invite lists, and the auction board, read their players' profiles in one request instead of one per row.
- b28c728: A nest whose egg you have not taken yet glows blue on the board, the way a wanderer you have not met does.
- b28c728: A Nincada that evolves into a Ninjask while you carry a Poke Ball also leaves a Shedinja, instead of Shedinja being a choice in the Ninjask's place.
- 82ff3e6: On a phone the overworld board shows a smaller area around the player, so each cell is drawn larger.
- d4caf2f: - Scenery no longer has a shadow drawn into its picture, so pieces of the same kind look alike.
  - The round bush is no longer cut off at its right edge.
- 5040e61: Soft-edged pictures on the overworld board, such as auras, sparkles and labels, no longer show bright fringes along their edges.
- 60817e7: Pokemon leave the board when their spawn window runs out, and the next window is fetched right away, even while the player stands still.
- c8e26e7: - A road or route that meets a cliff always cuts a way up it.
  - The safari heading marks a shadow pokemon, and a species you have caught before.
- 7ce3f64: The site loads again instead of answering every page with a server error.
- d6124e3: - Walking into a town shows just its name, and pacing along its edge no longer repeats it.
  - A change of weather fades in over a few seconds instead of switching at once.
  - What a cache, patch or tree gave stays over the tile it came from while the player walks away.
- 5954a14: - The overworld no longer slows down the longer a player walks.
  - The board frees its graphics when a battle takes over the screen.
  - Each step and each frame of the board does less work, and moving the pointer within a cell no longer redraws it.

## 3.2.0

### Minor Changes

- 98ab1f8: - There are caves under the world, at the same coordinates. Step into one and you are under the cell you stood on; walk to another mouth and you come out as far across the world as you walked.
  - Caves are inside the rock you can see, so they are the way under a ridge the surface makes you walk around. About a fifth of the ground down there is open, and a network runs roughly seven chunks before it ends.
  - Nothing grows underground, and a passage never steps diagonally, so every cave corner can be walked round.
  - A cave under the open sea is its own network, cut off from the mainland by the shore. Kyogre, Articuno and Lugia keep their lairs in them.
  - Caves hold pokemon that stand nowhere else, the same at every hour, along with item caches, nests, Team Rocket, duelling trainers and both kinds of raid lair. There are no towns, no markets and no portals underground.
  - The Escape Rope climbs out of a cave at the nearest mouth, up to 8 chunks off, and is spent doing it. It is found in the same caches everything else is.
  - A cave is dark whatever the hour: you see 2 cells carrying nothing, and 3 with an Illuminate buddy or the new Explorer Kit. The two are worth the same and do not stack.
- 98ab1f8: - The climate is read a cell at a time, so a chunk can hold two countries and a border wanders through the ground instead of falling on a chunk boundary
  - Lakes, rivers and ridges of rock are world-wide fields now, so they run from one chunk into the next rather than being grown inside one
  - The board draws the neighbouring chunks' own ground past its edges, and every cell is drawn from its own country's tileset
  - The board is a window on the world with the player in the middle of it rather than the chunk they are standing in, so the world scrolls as they walk and there is no boundary to cross and nothing to wait for at one
  - A board straddles four or nine chunks at once, and their windows are all watched and all visited, so what is standing on the far side of a boundary is live before the player gets there
  - The board is a circle rather than a square, so a player sees the same distance in every direction
  - The country is drawn twenty cells out, past the edge of the picture on every side, and every square of it can be pressed and walked to, so nothing on the screen is out of reach
  - The world is live within ten cells of the player, which is how near a pokemon has to be to be standing there, and no circle is drawn to say so
  - Scenery, landmarks and pokemon may stand on any cell of a chunk: the clear rim every chunk used to keep drew empty corridors across the world every sixteen cells
  - A new /demo/world page paints the world's ground a cell at a time, with the chunk grid over it
  - Towns: one settled circle 28 cells across in each 8x8 chunk region that has dry ground for it, holding nine to fourteen lots of market, auction board, gym seat and the ladder
  - The region's portal stands on the town's plaza, dead centre, where every street of the town begins
  - A chunk of open country rolls two to four landmarks instead of five to eight, so what is left out there is what a player goes out for
  - Every region has exactly one portal, in its town where it has one, so the network is even and reaches every country including the open seas
  - A town levels the ground it stands on, and no two towns have the same charter
  - A town's streets have wild pokemon of their own, the kind that live around people, from one list every town shares
  - Porygon is met on town streets rather than beside a portal
  - Walking into a town says its name, and walking out and back in says it again
  - A town has streets: its plaza is paved and a road runs out of it to every lot, turning square corners rather than cutting across, drawn from whatever country the town stands in
  - A street stops at a lot's door rather than paving it and goes round any other lot in its way, so nobody stands in the road and no road stops dead at a back wall
  - The board keeps the subscriptions it already has when it moves, and remembers what the server said about a window's claims, so a walk asks it a fraction of what it used to
  - The world map marks the towns in view at the size they really are, and says so when the pointer is over one
- 98ab1f8: - Every town has a Pokémon Center with Nurse Joy behind the counter. She no longer turns up at wandering cells, so the open country has none.
  - Every town has a name of its own, built out of the country it stands on and the county it stands in, such as Rimefell Village, Ashmarch. No two towns anywhere share a name.
  - Walking into a town puts it on the map for everybody. A town one player found is a town every player can travel to, and a town nobody has been to cannot be crossed to.
  - A portal now asks for a town by name, finishing the name as it is typed, and opens onto that town's plaza. It used to ask for a biome and send the traveller to the nearest portal there.
- a9647f3: Landmarks wear a turning ring that shows where you stand with them:

  - Gold under a lair whose raid you won this window.
  - Red under a trainer or grunt you have not beaten yet, and under a seat somebody else holds.
  - Green under the seat you hold.
  - Blue under a once-a-window wanderer you have not been served by yet.
  - Teal under a hidden grotto you have not claimed yet.

- 98ab1f8: - The ground is drawn from tilesets: each biome has a ground, a cliff, water and paving, laid water first and seams last.
  - Terraces stand up on the laid-back board, with a rock wall between one level and the next. Nothing is laid over the ground at the lip of a step: the top of a cliff is the country's own ground.
  - The board is drawn as a scene with a depth buffer, so a cliff hides what stands behind it a pixel at a time and a sprite beside the corner of a step is covered exactly where the rock is nearer.
  - The grid, the marks on a cell and a thrown shadow lie on the ground they belong to, so a cliff in front of them hides them and whatever stands there covers them.
  - The picture is centred on the ground the player is standing on, so walking up a terrace carries the camera up with them and the ring round them is drawn on the level they are on.
  - A cliff is a step between levels and nothing else. It stops a walk unless a road, a route, a natural pass or water cuts through it.
  - The dungeon tileset rips are gone, with the loader, the processor's three tileset tools and the scripts that wrote them: one pack of terrain answers every country now, and a battle's floor is that country's own ground tile.
  - Water is laid in 2x2 blocks, so every water cell has three others square with it: a hairline river dries up rather than being drawn as a row of puddles, and no cell is left touching the water only at a corner.
  - Water never sits at the lip of a step with dry ground below it. Where the ground below is water too the step is a fall, drawn in the water's own art rather than in rock, and nothing stops a crossing there.
  - Water on a step is always a way through it, whatever shape the step takes.
  - A step with a way through it, a road, a route or a pass, is drawn as a ramp: the cell slopes straight down the step to the ground below instead of standing a wall, so a step a player can climb no longer looks like a cliff.
  - A dry way through a step opens only where it leads somewhere. It needs lower ground straight beside it, and at a corner of the cliff every cliff tile beside it has to open too.
  - Natural passes cross every cliff about every twenty cells, so a player walking beside a terrace is never far from a way up it.
  - Scenery is never placed beside a way through a cliff.
  - Only the edge between water and ground follows the camera. The rest of the country keeps its way round as the board is turned, so the ground no longer spins under a walk.
  - Nothing above ground walls a cell off any more. The stone field still says where a hillside is, which is where a cave has its way in, which water may not stand on and where the shallows are drawn, but a step between two levels is the only thing on the surface that stops a walk.
  - A volcano's lava stays in its crater: it dries off a cell short of the country's edge, so it never runs into an ordinary pool next door.
  - Small islands break the surface of the open seas, a few cells of the country's own ground with a long way of water round them, so the sea is no longer featureless.
  - The coast stands at sea level, so a beach meets the open sea without a cliff. The sea's own water and foam edge the shore.
  - Routes between towns are drawn as beaten-earth trails in each country's colours. Nothing is drawn where a route crosses water.
  - A town's open ground is drawn as the same worn trail, with its streets paved over it.
  - Each building in a town stands on a paved plot joined to its street.
  - Scenery is never placed on a route.
- eda11cc: - The world map rings each chunk a town stands in.
  - A Detailed world map setting draws the ground itself: water, the level of the land and its cliffs, towns and the routes between them.

### Patch Changes

- 98ab1f8: The sky behind the board follows the time of day instead of the biome. Caves show darkness behind the board.
- 98ab1f8: - A portal is drawn as a gatepost with a poke ball set into it, and a gym seat as the gym's own signage.
  - Both raid lairs are drawn as the statue the gym seat used to be. A shadow lair is the same statue in violet, so the two are told apart by colour rather than shape.
  - A lair no longer changes with the biome it stands in, and a shadow lair is no longer sometimes boarded over.
- 98ab1f8: The rocky coast's walls are grey sea stone rather than rust-brown rock, so they sit with its shingle and water.
- fd6b2ca: Deoxys can be met on beaches, the way every other mythical is met in its home biome.
- bcb3132: The awards shelf draws Hoenn's eight badges and the Battle Frontier's symbols from their sprites, where they were lettered discs.
- c55fb89: - A player saved on a tree, rock, landmark or cliff comes back on the nearest open cell.
- 98ab1f8: A lake or a river in dry country holds only pokemon that can be in the water or over it: what swims, the Flying types, and the hoverers. An ocean or a swamp is unchanged, since everything in its pool was chosen for it.
- 98ab1f8: A live view reads once when it opens rather than twice, since the subscription connecting is the same read arriving over the socket. A dropped socket still re-reads when it comes back.
- 98ab1f8: Open seas have scenery standing in the water.
- 98ab1f8: A town's streets are drawn as beaten paths that tile and turn corners, rather than as a wash of flat colour.
- 98ab1f8: - Trees are drawn without the flat shadow the source art laid under them, so the board's own shadows are the only ones on the ground.
  - A savanna waterhole is drawn as the same clear pond the woodland has, rather than as brown water that looked dried out.
- 98ab1f8: A walk across open ground heads toward its goal in a staircase instead of running one direction and then the other.

## 3.1.0

### Minor Changes

- b3d01d0: A pokemon that grows on candy is heard growing. It plays once for the run rather than once a level, and stays quiet where the candy could not be used.
- 18162aa: Nurse Joy's counter plays a jingle when she hands a party back healed. It follows the sound slider like the rest, and stays quiet when there was nothing to heal.
- 5467ca7: A battle is announced and answered: a fanfare plays over the count in, and the fight ends on one sound for a win and another for a loss. A draw takes the loss.
- 0cba996: An encounter makes a noise now: the ball knocks once for every shake it takes, opens with a sound of its own when the pokemon breaks out, and a flight is heard whether the pokemon bolted or the player walked away.
- 93e9f0c: Anything handed over says so:

  - An egg taken from a nest, a grotto or the breeder.
  - A rock bought off the fossil maniac.
  - A pokemon received, whether it came out of a fossil, an evolution, a trade, a gift or a ball.
  - A dig that turned up a prized item, and a different sound for a special one.
  - The ball clicking shut on a pokemon that stayed in it, before the fanfare for what was caught.

### Patch Changes

- cf340b1: The fossil scientist opens rocks the way the vendor sells: press a fossil, say how many, and up to six come off the bench in one handover. The sound for what came out plays once for the handover rather than once for each pokemon.
- 67e21d9: A family's candy is named and painted after the pokemon the line is known as.
  Both were taken from the species the line hatches as, so eight families answered
  to a baby a later generation put underneath them: a bag read "Pichu candy" for a
  Pikachu's, and the sweet was painted in Pichu's colours. Marill, Wobbuffet,
  Clefairy, Jigglypuff, Jynx, Electabuzz and Magmar were the others. The three
  Hitmons keep Tyrogue's name, which is the one name that covers them.
- 67e21d9: A family's candy is painted in as many of its own colours as its pokemon has,
  up to four. Two colours make a ball of the first with stripes of the second, a
  third splits the middle of the ball off from its top and bottom, and a fourth
  takes the middle stripe. The colours are read off the pokemon the family is
  named after.
- 2041143: A pokemon that has been to auction can be let go again. Releasing one deleted
  its record, which emptied the pointer on any lot that had named it, and the
  auctions table refused to hold a pokemon lot with no pokemon in it: the release
  came back as a constraint error, and a batch release failed whole because one
  member of it had once been on the block. A settled lot may now outlive what it
  sold, the way a gift claim already did. A lot that is still running must still
  name its pokemon.
- 46e7095: - A dialog whose close is refused stays on screen. Escape or a press on the
  overlay put the panel away even where the handler declined, which left the
  board underneath refusing every press: a safari encounter dismissed while the
  ball was still rocking stranded the player where they stood.
  - A safari encounter cannot be dismissed while a ball is in the air. The press
    is refused outright rather than heard and dropped.
- 2041143: A fight against the world no longer holds a pokemon to one ability and one held
  item. Every trainer stop, gym, league seat and Frontier house now allows what a
  raid allows, so both sides bring what they were built with:

  - An expert's six are composed with 2 abilities and 2 items apiece, and half of
    that was thrown away before the fight started.
  - A player's pokemon carries the belt they packed, so a Sacred Ash sitting under
    a Leftovers stopped doing nothing.
  - Fights between players are unchanged: a duel and a gym seat keep the mainline
    shape of one ability and one held item.

- b3e4746: Beldum, Metang and Metagross are as catchable as the other pseudo-legendary lines. The mainline puts them at a rate rarer than most legendaries, which made the one family nobody could throw at.
- 03b0db3: Spawns a lure drew into a chunk stay standing there for the rest of the window. Putting the buddy that drew them away no longer takes them off the board, and the server no longer refuses to stage the ones it had already shown.
- 03b0db3: Nurse Joy's counter and the write behind it ask one shared question about whether a pokemon needs seeing to, so a pokemon at full health carrying a status is offered to her and healed.
- 46e7095: - A ball that holds stays on the safari panel. The pokemon's sprite came back
  under the "Caught!" line, which read as it getting out again.
  - The ball lies still between shakes. The three ran into each other as one long
    wobble rather than as three separate answers.

## 3.0.0

### Major Changes

- 8a835cb: Hoenn.

  All 135 of it, the 102 moves it brought, and the 17 abilities, Wonder Guard and
  Pure Power and Truant among them. With them:

  - The eight gym leaders, Roxanne to Juan, and the Elite Four and Wallace behind
    them, which makes a third league and a third crown.
  - The Battle Frontier: seven houses above a champion, each fought under its own
    rule rather than against its own roster, and a silver symbol and a gold one to
    take from each.
  - Regirock, Regice, Registeel, Latias, Latios, Kyogre, Groudon and Rayquaza,
    with Jirachi and Deoxys.
  - Team Aqua and Team Magma, who keep the crime landmark on the water and on the
    dry country while Team Rocket keeps the rest.
  - A ball rocks up to three times before it holds, and 20 more buddy abilities
    have a say in a safari.
  - Speed shortens cooldowns, so every point of it now does something.
  - 21 mints, one for every nature, so a pokemon is no longer stuck with the roll
    it was met on.
  - From the Elite Four upwards a trainer's six are composed rather than levelled
    into: cores, supports, one weather, and gear priced against what carries it.

  The world changes under all of it. Hoenn's species join the biomes they belong
  to, nine lairs and 24 more duelling stops stand in the country, berry patches
  and apricorn trees only grow where they could, and trainers are met out on the
  open seas. What a chunk holds has changed everywhere.

### Minor Changes

- 0a42366: A thrown ball now rocks up to three times before it holds, and how far it got is what the meeting says about how close the throw came. The odds are unchanged: each shake is an independent check, and three of them multiply back to the old catch chance.

  Some throws come out critical and hold on a single shake. How often depends on how many species the player has caught. A Super Luck buddy doubles how often one comes along, and a Sniper buddy gives the shake behind one two chances instead of one.

- 9ad09f7: Three more things a buddy is worth in the field:

  - Magma Armor halves an egg's walk, the same as Flame Body.
  - Trace shows what a wild pokemon's ability is before a ball is thrown.
  - Lightning Rod, Motor Drive, Volt Absorb, Storm Drain, Water Absorb, Sap Sipper and Flash Fire make a pokemon of their own type half again as easy to catch.

- 64f66af: A buddy carrying the Catching Charm puts half again on every throw, and the charm turns up in the rarest band of found items.
- 0990c16: Hoenn's crown, and the man who wore it before.

  - **Wallace** takes the champion's seat, asking for all four of Hoenn's Elite
    Four marks and paying the **Hoenn Champion** title. He fields the six he
    defends Ever Grande with, Milotic last.
  - **Steven** is a legend, met in a champion's seat one window in sixty-four like
    Red, asking for nothing and paying his own mark. He fields the steel he is met
    with on the mountain, Metagross last.
  - Beating either pays the coat they are standing in: Wallace's two, and Steven's
    one. Red's starting coat stays free, since it is what half the game begins in.
  - Changes world generation.

- 7b39df3: **Lucy** keeps the Battle Pike, the Frontier's third house.

  - Her fight is walked through a curtain: your three arrive poisoned, burned,
    paralysed, asleep, or mended, one room in 5 being the kind one. Hers arrive as
    they are.
  - The room is drawn when the challenge is accepted and frozen into the party, so
    everybody watching the fight back walks through the one the challenger did.
  - What the curtain leaves travels out with the party, and the kind room is the
    only thing in the game that mends one by fighting.
  - She fields Seviper, Shuckle and Milotic, and pays the **Luck Symbol**, silver
    or gold.
  - Changes world generation.

- 2481a1e: Hoenn's pokedex chain, and the professor it pays.

  - **Hoenn Pokedex** on the quest board, asking for 27 caught, then 68, then 133,
    which is every species of the region but Jirachi and Deoxys.
  - The last rung hangs the **Hoenn Dex Medal** on the shelf and hands over a
    Master Ball, the way the other two regions' do.
  - Filling it unlocks **Professor Birch** to wear.

- 529ea72: A syndicate grunt now fields two out of each of the biome's three spawn bands rather than one common, two uncommon and three rare, and leaves any one of its six behind rather than only the half it was not fighting with. Changes world generation.
- 9fadbe8: - Mints change a pokemon's nature for good. There are 21, one per nature that moves a stat, plus a Serious Mint for a pokemon that should move none.
  - The wandering chef sells every mint, and the ground hides them in the prized band.
  - Every vendor counter now lays out 12 kinds rather than 6, or its whole shelf where it carries fewer than 12.
- ae35af0: Two Hoenn water lines, one of them a fork.

  - **Spheal**, **Sealeo** and **Walrein** at dex 363 to 365, on the glacier and
    in the polar ocean. Sealeo at 32, Walrein at 44. Walrein carries Slush Rush
    beyond the mainline's set.
  - **Clamperl** at dex 366, on the reef and in the ocean, opening into
    **Huntail** or **Gorebyss** in the deep ocean depending on what it was
    holding when it changed hands.
  - The **Deep Sea Tooth** and **Deep Sea Scale** are spendable now, so both are
    priced at 3,000 gold and turn up where a stone does. The rest of the trade
    items stay priceless until their lines land.
  - Changes world generation.

- 733c205: The Wish Tag has a picture of its own: a pale paper tag with a gold star, made
  from the member card's shape rather than borrowing it.
- 733c205: Jirachi, and the tag a wish is written on.

  - **Jirachi** at dex 385, a Steel and Psychic mythical of the badlands. Serene
    Grace, and Levitate, Healer and Magic Bounce beyond the mainline's one.
  - It stands in the badlands' mythical band at every hour, the same thinnest odds
    Mew and Celebi walk at.
  - **Forina**, the valley it sleeps under. A mythical's lair, so no biome hosts
    it and no landmark ever rolls it.
  - The **Wish Tag** joins the special band of the item pool: spending it calls
    Jirachi out to the valley the comet passes over, wherever the player is
    standing.
  - Changes world generation.

- 61cc84e: - **The Aron family** at dex 304 through 306, on the mountain and the badlands
  by day.
  - **The Trapinch family** at dex 328 through 330, in the desert and the
    badlands by day.
  - **Heavy Metal**, which the Aron line carries: it weighs 2x what it looks
    like, so a Low Kick lands harder on it.
  - Aggron reaches Battle Armor, which the mainline does not give it, since a
    final evolution is filled to four.
  - Changes world generation.
- a29fef1: From the Elite Four upwards, a trainer's pokemon fight with the four moves their species is best with rather than the last four they levelled into, and their held gear follows those moves. Reaches the Elite Four, Champions, legends, Giovanni, his executives and all seven Frontier houses.
- eeb39b2: - **Skitty and Delcatty** at dex 300 and 301, on grassland and shrubland by
  day, with Skitty taking a Moon Stone.
  - **Meditite and Medicham** at dex 307 and 308, on the mountain and in montane
    forest by day.
  - **Electrike and Manectric** at dex 309 and 310, on the savanna and the steppe
    by day.
  - **Normalize**, Skitty's own: everything it uses comes out Normal-type, so a
    ghost takes nothing from any of it.
  - **Pure Power** and **Minus**, which the other two lines carry. Plus now
    answers Minus as well as another Plus, which is how the mainline has paired
    them since Gen 5.
  - Delcatty reaches Limber, Medicham reaches Inner Focus and Levitate, and
    Manectric reaches Quick Feet, none of which the mainline gives them, since a
    final evolution is filled to four.
  - Changes world generation.
- 053e7bc: Trainers are met out on the open seas, and only the ones who could be there: the swimmers, fishermen, sailors and tubers a country puts on its water.
- 181d3f5: Hoenn's five two-stage water lines.

  - **Carvanha** and **Sharpedo** at dex 318 and 319, in the ocean and on the
    reef. Sharpedo carries Intimidate and Unnerve beyond the mainline's pair.
  - **Wailmer** and **Wailord** at 320 and 321, in the ocean and the deep. Wailord
    carries Damp.
  - **Barboach** and **Whiscash** at 339 and 340, in the swamp and the bog.
    Whiscash carries Sturdy.
  - **Corphish** and **Crawdaunt** at 341 and 342, in the mangroves and the swamp.
    Crawdaunt carries Tough Claws.
  - **Feebas** and **Milotic** at 349 and 350: the fish in the bog, the one it
    becomes in the kelp. A Feebas turns either on a **Prism Scale** handed over or
    on reaching level 40 fond enough, standing in for the beauty this game does
    not keep. The Prism Scale is priced and spendable now.
  - A species reachable by more than one road is settled by whichever road is
    open, so an evolution never spends an item the other road did not ask for.
  - Changes world generation.

- d2e6ce4: - **Taillow and Swellow** at dex 276 and 277, over grassland and savanna by
  day.
  - **Wingull and Pelipper** at dex 278 and 279, on the beach and the rocky coast
    by day. Pelipper brings its own rain.
  - Swellow reaches Gale Wings and Big Pecks, which the mainline does not give
    it, since a final evolution is filled to four.
  - Changes world generation.
- 1122d9e: The 102 moves Hoenn brought, with what each of them does:

  - Taunt, Torment and Imprison hold a pokemon out of part of its move set, and Yawn puts one to sleep 4 seconds after it hears it.
  - Focus Punch is lost if the user is hit while winding it up, and Revenge hits twice as hard for the same thing.
  - Stockpile fills its store over 3 steps, a charge and a pair of stat stages each, and Spit Up and Swallow are worth what it put away.
  - Follow Me takes what an ally was about to take, Magic Coat turns a status move back on its caster, and Snatch takes a self-cast move for itself.
  - Trick swaps held items, Knock Off knocks one away, Recycle picks up what was used, and Role Play and Skill Swap move abilities about.
  - Wish heals 4 seconds later and can be left with a party member, Ingrain roots a pokemon down, and Doom Desire lands like a Future Sight.
  - Nature Power, Secret Power and Camouflage read the ground the fight is on: a battle now carries its biome, and a swamp, a glacier and a forest each throw something different.
  - Fake Out is one surprise per trip onto the field rather than a window, and Uproar is a rampage like Thrash that keeps the field awake for as long as it runs.

- e6ed216: - **The Lotad family** at dex 270 through 272, on the bog and in the mangrove
  by day, with Lombre taking a Water Stone.
  - **The Seedot family** at dex 273 through 275, in woodland and shrubland after
    dark, with Nuzleaf taking a Leaf Stone.
  - **Wind Rider**, Shiftry's own: it takes nothing from a move that rides on the
    wind and gains an Attack stage instead. Gust, Whirlwind, Razor Wind, Icy
    Wind, Twister, Silver Wind, Heat Wave, Air Cutter and Blizzard all ride one.
  - Ludicolo reaches Hydration, which the mainline does not give it, since a
    final evolution is filled to four.
  - Changes world generation.
- 7c1e7d3: - **Poochyena and Mightyena** at dex 261 and 262, out on the savanna and the
  shrubland after dark.
  - **Zigzagoon and Linoone** at dex 263 and 264, on grassland and in woodland at
    any hour.
  - Linoone reaches Frisk, which the mainline does not give it, since a final
    evolution is filled to four.
  - Changes world generation.
- 915a1b0: The first nine of Hoenn: the three starters and what they become.

  - **Treecko, Torchic and Mudkip**, each with its two evolutions, at dex 252
    through 260, with sheets under `sprites/pokemon/hoenn`.
  - **Hoenn is a region the game knows about**, spanning dex 252 to 386.
  - A new trainer now chooses a first partner from three regions rather than two.
  - Sceptile reaches Chlorophyll and Leaf Guard, Blaziken Iron Fist and Moxie,
    Swampert Rain Dish and Water Veil, none of which the mainline gives them.
  - Changes world generation: Treecko is found in tropical rainforest and
    tropical seasonal forest, Torchic on the savanna and the volcano, Mudkip in
    swamp and bog.

- e156ee0: Hoenn's trainer classes stand at duelling stops: 24 of them, covering every type the region grows.

  Changes world generation.

- 8ccb833: Hoenn's gym leaders, and the eight badges they pay.

  - **Roxanne**, **Brawly**, **Wattson**, **Flannery**, **Norman**, **Winona**,
    **Tate**, **Liza** and **Juan**, seated in the countries their own type
    answers to alongside Kanto's and Johto's leaders.
  - The **Stone**, **Knuckle**, **Dynamo**, **Heat**, **Balance**, **Feather**,
    **Mind** and **Rain** badges, on the shelf after Johto's.
  - Mossdeep is one gym kept by two people: whichever of Tate or Liza a chunk
    seats, the Mind Badge is what it pays.
  - Sootopolis is Juan's, which leaves Wallace for a champion's seat.
  - Each of them is drawn in their own Ruby and Sapphire coat, unlocked by their
    badge, with Roxanne, Flannery, Tate and Liza carrying an Omega Ruby one too.
  - Hoenn has no Elite Four or Champion yet, so its badges open no seat.
  - Changes world generation.

- 170bc18: Hoenn's Elite Four.

  - **Sidney** on dark ground, **Phoebe** in the damp, **Glacia** in the cold and
    **Drake** on the water and in the green, seated the way the other two leagues'
    seats are.
  - Each asks to see all eight of Hoenn's badges before they will fight, and pays
    their own mark: **Sidney**, **Phoebe**, **Glacia** and **Drake Defeated**.
  - Each fields their type and nothing else, since their mainline teams carry no
    widener, and each stands last behind their own ace: Absol, Dusclops, Walrein
    and Salamence.
  - Hoenn has no champion yet, so its four marks are the top of that region's walk.
  - Changes world generation.

- cd1380e: - **The Nincada family** at dex 290 through 292, in woodland and badlands after
  dark. Shedinja is met nowhere: it is the other thing a Nincada can become at
  Lv. 20, and it costs the Poke Ball the mainline asks you to be carrying.
  - **The Whismur family** at dex 293 through 295, on the badlands and the steppe
    by day.
  - **Wonder Guard**, Shedinja's own: only a move it is weak to lands at all,
    while status moves, poison and the weather still reach it.
  - Shedinja reaches Cursed Body and Exploud reaches Berserk, neither of which
    the mainline gives them, since a final evolution is filled to four.
  - Changes world generation.
- 9ef18b9: **Anabel** keeps the Battle Tower, the Frontier's fifth house.

  - She asks nothing: three of hers against three of yours, under the ordinary
    rules. The Tower is the fight the other four houses are read against.
  - What she has instead of a rule is the hand: Alakazam, Entei and Snorlax at
    level 100.
  - She pays the **Ability Symbol**, silver or gold.
  - Changes world generation.

- 5df65cb: Spenser keeps the Battle Palace, the sixth Frontier house: every pokemon on the field picks its moves and its targets by its own nature, and the Spirits Symbol is what taking it pays. Changes world generation.
- 06b6adf: **Noland** keeps the Battle Factory, the Frontier's fourth house.

  - The house lends both sides. 6 rentals are laid on the table, you pick 3, and
    Noland draws his own 3 out of the same crate.
  - Nothing of yours is on the field, so nothing of yours comes off it: no health
    lost, no item spent, no candy earned. The purse and the symbol are what the
    fight pays.
  - The crate is every species an expert could field, from every region, so the
    Factory gets harder as the game registers more of them.
  - The table is drawn off the challenge, so walking away and back deals the same
    6, and a watched replay sees the hand that was actually played.
  - He pays the **Knowledge Symbol**, silver or gold.
  - Changes world generation.

- 9e784be: The Hoenn version exclusives that never evolve, ten in all, each one the other
  half of a pair.

  - **Sableye** and **Mawile** at dex 302 and 303.
  - **Plusle** and **Minun** at dex 311 and 312, which only work beside somebody.
  - **Volbeat** and **Illumise** at dex 313 and 314, one male-only and one
    female-only.
  - **Zangoose** and **Seviper** at dex 335 and 336, sharing a plain: the
    mongoose hunts by day and the snake after dark.
  - **Lunatone** and **Solrock** at dex 337 and 338, one under the moon and one
    under the sun.
  - **Stall**, **Toxic Boost** and **Battery**, which those lines carry. Battery
    lifts its teammates' special moves to 1.3x and never its own.
  - Changes world generation.

- 8fa7ddc: The Hoenn pokemon that stay exactly what they hatched as.

  - **Torkoal** at dex 324, on the volcano and the mountain, bringing its own sun.
  - **Spinda** at dex 327, on grassland and in montane forest.
  - **Kecleon** at dex 352 and **Tropius** at dex 357, in tropical rainforest and
    tropical seasonal forest.
  - **Absol** at dex 359, on the mountain and the alpine tundra after dark.
  - **Relicanth** at dex 369, in the ocean and the deep ocean.
  - **Luvdisc** at dex 370, on the reef and the beach.
  - **White Smoke** and **Color Change**, which Torkoal and Kecleon carry. Color
    Change turns the holder the type of whatever move just hit it, whole rather
    than adding to it.
  - Changes world generation.

- 317bece: - **Surskit and Masquerain** at dex 283 and 284, on the swamp and the bog by
  day.
  - **Shroomish and Breloom** at dex 285 and 286, in temperate and tropical
    rainforest after dark.
  - **Poison Heal**, which the Shroomish line carries: poison restores 1/8 of its
    HP each time it would take some, and the AI will not waste a cast poisoning
    it.
  - Changes world generation.
- d603b6e: - **The Ralts family** at dex 280 through 282, in temperate and montane forest
  by day.
  - **The Slakoth family** at dex 287 through 289, in tropical rainforest and
    woodland by day.
  - **Truant**, Slakoth's own: it loafs about for 2 seconds after every move it
    finishes. The mainline alternates turns, and there are none here to
    alternate between, so it loafs by the clock instead.
  - Gardevoir reaches Healer and Slaking reaches Comatose and Oblivious, none of
    which the mainline gives them, since a final evolution is filled to four.
  - Changes world generation.
- e896c7c: The last of Hoenn's two-stage lines.

  - **Makuhita** and **Hariyama** on the mountain and in the montane forest by
    day. Hariyama carries Stamina.
  - **Gulpin** and **Swalot** in the bog and the swamp. Swalot carries Poison
    Touch.
  - **Numel** and **Camerupt** on the volcano and in the badlands.
  - **Spoink** and **Grumpig** on the mountain and in the shrubland. Grumpig
    carries Forewarn.
  - **Cacnea** in the deserts by day, and **Cacturne** after dark, carrying Rough
    Skin and Sand Rush.
  - **Swablu** and **Altaria** on the mountain and the grassland. Altaria carries
    Gale Wings and Healer.
  - **Baltoy** and **Claydol** in the desert and the badlands at any hour. Claydol
    carries Analytic, Filter and Sand Force.
  - **Shuppet** and **Banette** in the woodland and the temperate forest at night.
    Banette carries Aftermath.
  - **Duskull** and **Dusclops** in the badlands and the woodland at night.
    Dusclops is left as the mainline has it: a Dusknoir stands above it later.
  - **Snorunt** and **Glalie** on the glacier and the alpine tundra. Glalie
    carries Snow Warning.
  - **Simple**, which Numel has: every stat change it takes counts 2x. Contrary
    now shares its machinery instead of keeping a copy.
  - Changes world generation.

- a637881: The eon pair, and the island they keep to.

  - **Latias** at dex 380 and **Latios** at 381, legendaries in the open ocean.
    Each is single-gendered, so a player who wants both needs both lairs to come
    round.
  - **Southern Island**, out in open water, holding the two of them the way the
    Burned Tower holds the beasts.
  - Beyond Levitate, both carry Multiscale and Speed Boost; Latias adds Healer
    and Latios Magic Bounce.
  - The demo raid no longer stages a worn shape. A Rainy Castform is only ever
    worn, so it could be rolled onto the field and then undressed by Forecast the
    moment the fight started.
  - Changes world generation.

- af968ad: Castform, and the three skies it wears.

  - **Castform** at dex 351, on grassland and the steppe at any hour.
  - **Forecast**, which puts the holder into the shape the sky calls for: Fire in
    sun, Water in rain, Ice in hail, and plain under anything else.
  - A form can now be **worn rather than met**. A worn shape is never spawned or
    caught, so meeting the pokemon fills it in: seeing a Castform fills all four
    of its dex squares.
  - Changes world generation.

- 545d93f: Tucker keeps the Battle Dome, the last Frontier house: he names nobody until your three are frozen, then fields three drawn against them, and the Tactics Symbol is what taking it pays. Changes world generation.
- 6f9f324: The five Hoenn species the region was still missing.

  - **Azurill** at dex 298, a baby of the Marill line in the bogs, swamps and
    temperate rainforest. Marill hatches from one now rather than from itself, and
    the line's inherited moves moved down to the stage that lays the egg.
  - **Nosepass** at dex 299 on the mountain and in the badlands, and **Roselia**
    at 315 on grassland and shrubland. Both stand in the uncommon band: Probopass
    and Roserade are still to come, so neither is the end of its line.
  - **Chimecho** at 358 on the mountain and in the montane forest. Healer, Own
    Tempo and Forewarn beyond the mainline's Levitate.
  - **Wynaut** at 360, a baby of the Wobbuffet line on the mountain, in woodland
    and on grassland. Wobbuffet hatches from one now.
  - Roselia and Chimecho wait on a baby of their own, so a nest lays neither until
    Budew and Chingling land.
  - Changes world generation.

- 29ee35f: Deoxys, in all four of its arrangements.

  - **Deoxys** at dex 386, a mythical: the world stages none, and the **Aurora
    Ticket** found in the special band is the only way to the raid at **Birth
    Island**.
  - Its Attack, Defense and Speed shapes are reached by rearranging it. Using a
    **Meteorite** on a Deoxys offers every shape but the one it is in, so a
    player picks the arrangement rather than rolling for it, and the rock is
    spent doing it. Any shape walks back to any other, so each of the four fills
    its own dex square once it has been stood in.
  - **Meteorite**, found in the prized band and stocked by nobody, so a second
    arrangement costs a second rock.
  - A change of shape does not count as a stage when a spawn band is worked out,
    so a Deoxys reads the same band in all four arrangements.
  - Changes world generation.

- 9ef18b9: A Frontier Brain keeps a second team for anybody who has already beaten them.

  - Holding a house's silver symbol is what brings the Brain's second three out the
    next time you walk in, and beating those is what the gold symbol is for.
  - Greta's second is Gengar, Breloom and Umbreon; Lucy's is Seviper, Steelix and
    Gyarados; Anabel's is Raikou, Snorlax and Latios. Brandon fields the same three
    either time, and Noland rents both meetings.
  - The gold symbol was a clean win before this, which was a way of scoring one
    fight twice rather than two fights.

- 9f6fc27: Overworld charsets for the seven Frontier Brains: Anabel, Tucker, Greta, Spenser, Noland, Lucy and Brandon.
- 63b76a3: The weather trio, each sealed in its own place.

  - **Kyogre** at dex 382 in the deep ocean, **Groudon** at 383 on the volcano,
    **Rayquaza** at 384 on the mountain. All three are legendaries; Rayquaza
    keeps the mainline's easier catch rate of 45 where the other two are 3.
  - Three lairs: **Marine Cave**, **Terra Cave** and the **Sky Pillar**.
  - **Air Lock**, which Rayquaza carries: weather does nothing to anybody while
    it is up. It is Cloud Nine's effect, so both now share one implementation.
  - Beyond their one mainline ability each: Kyogre carries Swift Swim, Water
    Absorb and Pressure; Groudon Magma Armor, Stamina and Pressure; Rayquaza
    Pressure, Intimidate and Multiscale.
  - Changes world generation.

- 0d01477: The three golems, and the chambers they were sealed in.

  - **Regirock** at dex 377 in the desert and the badlands, **Regice** at 378 on
    the glacier and in the polar ocean, **Registeel** at 379 on the mountain and
    in the badlands. All three are legendaries: special band, catch rate 3, and a
    raid boss a lobby can face.
  - Three lairs to hold them: **Desert Ruins**, **Island Cave** and **Ancient
    Tomb**, one golem apiece. Unlike the Burned Tower, none of them is shared.
  - Beyond the mainline's pair each: Regirock carries Solid Rock and Sand Force,
    Regice carries Filter and Slush Rush, Registeel carries Steelworker and
    Filter.
  - Changes world generation.

- b15b372: Team Magma and Team Aqua keep the crime landmark in their own biomes: Aqua on the water, Magma on the volcanoes and dry country, Team Rocket everywhere else. Each has its own boss, executives, uniform and marks, and everybody is named team and rank first, as in Team Aqua Leader Archie. A pokemon taken off any of them is now recorded as taken from a syndicate rather than from Team Rocket, so the catch search term is `met:syndicate`. Changes world generation.
- 2c3e7b3: The Battle Frontier opens, with two of its seven houses.

  - A **Frontier Brain** landmark, the rank above the Champion. It takes nobody
    who does not hold the crown of the region it stands in, and it is the first
    fight in the game whose **rules** differ rather than its roster: three a side,
    and the house's own terms on top.
  - **Brandon** keeps the Battle Pyramid, walked with nothing in hand: neither side
    carries a held item, and what a pokemon was holding is left at the door rather
    than spent.
  - **Greta** keeps the Battle Arena, judged rather than waited out: after 10 turns
    the fight stops and the side holding the greater share of what it brought takes
    it. An even fight is a draw.
  - Both field their own three at level 100 and pay 200,000 to 400,000. Beating one
    hangs its **silver symbol** on the shelf, and beating it without losing a
    pokemon hangs the **gold** one instead.
  - A battle now records the house rule it was fought under, so a replay is the
    fight that happened.
  - Changes world generation.

- f59cfbe: The two Hoenn lines that take the longest to grow up.

  - **Bagon**, **Shelgon** and **Salamence** at dex 371 to 373, on the mountain
    and the alpine tundra by day and evening. Shelgon at 30, Salamence at 50.
  - **Beldum**, **Metang** and **Metagross** at dex 374 to 376, in the badlands
    and the cold desert at any hour. Metang at 20, Metagross at 45. A Beldum
    knows one move and no machine teaches it another.
  - **Steelworker**, which Metagross carries alongside Levitate: steel moves hit
    1.5x whatever the holder's own types are.
  - Changes world generation.

- 01b9d56: Hoenn's fossils, and what is inside them.

  - **Root Fossil** and **Claw Fossil**, dug out of the prized band or bought
    off the Fossil Maniac for 12,000 gold, and spent at the Scientist's bench.
  - **Lileep** and **Cradily** at dex 345 and 346, **Anorith** and **Armaldo** at
    347 and 348. Both evolve at 40, and neither line spawns anywhere: a fossil is
    the only way to either.
  - The maniac now draws his two out of five, so which pair he is carrying is
    worth checking again.
  - Cradily carries Water Absorb and Stamina beyond the mainline's pair, and
    Armaldo carries Sturdy and Adaptability.
  - Changes world generation.

- 353cd97: Seven more buddy abilities have a say in a safari:

  - Magnet Pull holds a Steel type in place completely.
  - Purified throws truer at a shadow.
  - Gluttony carries feeding half again as far before it stops counting.
  - Harvest keeps a fed treat working through a missed throw.
  - Honey Gather finds a berry every 384 steps walked.
  - Forewarn and Anticipation say how ready a wild pokemon is to run before the first ball.
  - Pickpocket takes what a pokemon that ran off was carrying.

- 0e06703: - **The Wurmple family** at dex 265 through 269, in woodland and temperate
  forest: Wurmple at any hour, Silcoon and Beautifly by day, Cascoon and Dustox
  after dark.
  - **An evolution can ask what a pokemon was born as.** A Wurmple spins a
    Silcoon if it is male and a Cascoon if it is female. The mainline reads a
    hidden number instead.
  - A catch dialog shows only the branch its pokemon fits, since gender is not
    something a player can work towards.
  - Changes world generation.

### Patch Changes

- d69d9e2: - A critical hit is even money two stages up and certain three, in place of the doubling that never reached a certainty.
  - A blow a substitute ate, or an immunity refused, no longer carries its secondary effect.
  - The type chart and the same-type bonus no longer scale a status move.
- 3782e2d: - Every ability that does something beside a walking player now says so in its description, where before all 35 described only their battle behaviour.
  - Cleanse Tag names the 3 spawns it keeps away, and the Amulet Coin and Luck Incense say a raid or a grunt counts.
  - A Purified buddy makes a wild shadow 1.5x easier to catch. It had been doing nothing at all since a shadow became a half rather than a third as catchable.
- 61746fe: A move that deals no damage is no longer stopped by the type chart, so a Ghost hears a Growl, a Normal type sees a Confuse Ray, and a Foresight identifies what it was made for. Thunder Wave still fails against a Ground type.
- 61746fe: Soft-Boiled and Milk Drink can be aimed at a party member, and heal a share of that pokemon's HP rather than the caster's.
- d69d9e2: Taking a unit off a team, or a team out of an alliance, now removes it rather than putting it back.
- 9766004: A raid boss is never staged with Role Play, Skill Swap, Memento, Grudge, Endeavor, Wish, Ingrain, Slack Off or Swallow.
- 699d6a2: The credits list is kept as the drawings under each artist's name rather than a
  pair per drawing, and names that differ only in case, or by a tag in brackets,
  are read as one person.
- f45cc79: From the Elite Four upwards, an expert's held gear is priced rather than ordered: a Life Orb goes to something that hits hard enough to pay the recoil, a Choice item to a pokemon built around one blow, Leftovers to a wall, and an orb only to an ability that turns the status into a gain. Nobody carries two Choice items, two orbs or two type boosters. Gym leaders and below still carry what suits their species.
- d154cd3: - Every Hoenn move draws its own picture: eruptions and spouts pour down, Ingrain and Frenzy Plant put roots up through the floor, Dive goes under and Bounce goes up, and the rest land as the shape their name says.
  - A sound move is heard rather than seen, read off the move's own sound flag instead of a list.
  - Taunt, Torment, Imprison, Ingrain, Yawn, Follow Me, Magic Coat, Snatch, Grudge, Uproar and Helping Hand now leave a mark on the pokemon carrying them.
- Ice Ball rolls 5 times in one cast, and Flatter, Tickle, Feather Dance, Memento, Metal Sound and Fake Tears may be aimed at an ally.
- 3cc175e: The gen 3 moves say how they are cast apart from who they reach, and the ones that may be aimed at a teammate reach the caster's own party.
- 0162774: The Johto species learn what gen 3 teaches them, on top of everything they already knew.
- e45da99: The Kanto species learn what gen 3 teaches them, on top of everything they already knew.
- 18b80cc: Berry patches and apricorn trees only appear where they could grow: no patch on the deserts, the badlands, the volcano, the glacier or the alpine tundra, and no tree there or on the tundra, the steppe and the bare mountain. Changes world generation.
- aacf421: Arena Trap and Shadow Tag buddies halve the chance a wild pokemon bolts after a failed throw, stacking with a Nanab berry.
- 0463130: A stop dialog no longer repeats the challenger's team size and level band above the stake line, which already says both. A Team Rocket grunt's stake line now names the level band the way every other challenger's does.
- 9892926: Speed now shortens cooldowns: every 512 points halves what is left of a move's wait, closing on 95% off, read with stages, abilities and held items in. Everything that moved Speed did nothing before this.
- f45cc79: The NPC battle machinery is named for stops rather than for Team Rocket, since
  it has served gym leaders, the Elite Four, the Champion, duelling trainers and
  Frontier Brains for a while now. The two tables keep their names, because a
  scheduled sweep deletes from them.
- 5a33a1e: Teeter Dance confuses everything else on the field rather than the far side alone.
- 4d64635: A built party is now composed rather than assembled: two cores and four supports, the weather settled once for all six by what the cores gain or lose under it, and no move handed to half the party. Moves, abilities, natures and gear are all chosen for the job and against each other, so nothing awakens an ability its own four moves never ask for, a Life Orb goes to the two doing the attacking, and a Choice item never locks a pokemon out of half its sheet.

## 2.4.1

### Patch Changes

- b563bd3: A raid relic now opens its lobby when it is pressed in the bag, where before it opened an empty pokemon picker. The buttons the overworld drew over the corner of the map are gone: the bag is the one place a relic is used.
- b563bd3: The fullscreen switch now sits on the menu bar beside the gold, rather than behind the menu button.

## 2.4.0

### Minor Changes

- 54e2f88: A pokemon's moves, abilities and held items can be put in the order its owner wants:

  - Drag an entry into place on the pokemon's own page, or hold Alt and press the arrows.
  - All three lists are saved together on one press, so rearranging costs one request.
  - The order decides what it brings to a fight that allows fewer than it has, which is taken from the top of each list.

### Patch Changes

- 534bfd3: - A pokemon holds at most 4 abilities. The Channeler refuses one that already has four, where before she would widen it to eight.
  - A pokemon has room for 4 to 8 moves and 1 to 8 held items, and a duel rule may ask for any count inside those ranges.
  - A catch stored with more room than the new ceilings allow reads inside them, keeping every ability it already carries.

## 2.3.0

### Minor Changes

- a27fe06: A fullscreen switch over the keypad in the menu, beside the day and night one. It gives the whole game the screen, so the browser's own bars stop costing the board a strip of its height, and it is left out where the browser has no fullscreen to give.
- b5fed81: The overworld board is drawn two ways, chosen by the shape of the screen:

  - A screen taller than it is wide draws it flat from straight above: square cells the same size wherever they sit, the round shadow the board already used at night under everything standing on it, and the weather falling against the glass.
  - A wider screen draws it laid back under the camera, as before.
  - In both, anything standing in front of the player fades while it covers them and comes back as they step out from behind it.
  - A new page at /demo/board stands the board in a frame of any shape, for looking at either.

### Patch Changes

- cade09c: The Clear Amulet is drawn from the charm's own art rather than as a paper tag on a cord.
- 0dcdf4e: A trade evolution taken with a Linking Cord spends the held item it asks for, so a Seadra that pulls the cord loses its Dragon Scale
- 11ac6fa: A move offer, a bottle and a run of candy stay with the pokemon they were begun on, so a press on the box behind the sheet cannot answer them for whoever was clicked
- 2a5f075: Giovanni fields the legendary of a lair his biome hosts, or a sixth rare where it hosts none
- 1ca21f4: Item squares say what they are in a tooltip rather than a hover card. A card is
  kept only where a square offers more than one thing to do, which today is an
  auction lot: its seller and its bid. Everywhere else the card was a window
  covering the tray being read from.
- 660702b: Moves that work out their own power as they land now deal damage: Fling, Return, Frustration, Flail, Reversal, Gyro Ball, Magnitude, Present, Punishment, Spit Up, Trump Card and Natural Gift all missed the plain-hit path because their registry entries carry no base power.
- 0fbcefc: Every wandering role is dressed from its own charset, and the numbered Gen 4 npc sheets nobody wore any more are gone from the build
- 3711168: Dialogs, toasts and every other floating panel are drawn in a container that stands last inside the app rather than beside it, so they sit under the same root as the page they cover.

## 2.2.0

### Minor Changes

- c2eab95: A shiny sparkles out loud: when one is standing in a chunk the player walks into, and when one is standing in front of them. It plays at the Sound volume in settings.

### Patch Changes

- 1f42a6a: Sorting a box of pokemon reorders the squares. A `sort:` term, and the level order the team pickers ask for, were worked out and then thrown away: the grid was drawn from the unsorted list, so every party picker still opened newest-first.
- 1f42a6a: The ripple under a pokemon of the day's featured family reaches past the cell it stands on, so it is visible from under the sprite: three rings instead of two, drawn thicker, holding their light most of the way out.
- 64b4988: Pressing a landmark after its window has turned over refreshes the chunk and pays out, instead of reporting nothing and leaving the player to walk out of the chunk and back in.
- c2eab95: Using a vitamin, a wing or a bitter berry reports the pokemon it was used on and what the stat's effort moved from and to, instead of a sentence that left the player to open the stats pane to find out whether anything had changed.
- 1f42a6a: The aurora is brighter and reaches across the whole sky again: the picture spans the arc in front rather than a whole turn of it, so no part of the view is left blank, and the light the overlapping folds used to pile up is put back.

## 2.1.2

### Patch Changes

- 4f293c5: A pokemon claimed from a gift can be released again. Letting one go came back refused with "gift_claims only backfill catch_id once", because the claim's pointer at the catch nulls itself on delete and the write-once guard read that as a second backfill.
- 9d8a176: The team picker opens sorted by level, highest first, for both raids and duels. Typing a `sort:` of your own still overrides it.
- 4c028ed: The aurora is worked out into a field and drawn in one pass, the way a rainbow already was, instead of a blit per fold per band. Its colours and the way it hangs are unchanged.

## 2.1.1

### Patch Changes

- 96e3489: A box of pokemon and a bag arrange from the top end when a search sorts them, so `sort:level` opens with the highest rather than the lowest. `order:asc` turns it around.
- 48b00b1: The breeder, the groomer and the Channeler put their box away once they have done their one thing for the window, and say so instead.
- 528faca: - Nurse Joy takes a whole party at once and sees to them on one press, and no longer offers to purify a shadow along the way.
  - An NPC counter reports what happened in a toast rather than in a line at the foot of its panel.
  - The auction's sell box lists only what can actually go up, rather than greying out the rest.
- a325d01: - A battle holds where it is while the page is hidden or another window has the focus, and picks up from there rather than playing out the time away.
  - A stalled frame hands the fight a moment at most, so a tab coming back from the background no longer fights minutes of the battle in one frame with nobody at the controls.
- f37ad4c: - A run of candy presses stops on each level that has a move to offer and waits there until the question is answered, so a queued move can actually be learned.
  - The question comes up as soon as the presses reach the level that offers it, rather than after the presses settle.
  - The candy button is held while a levelled move is waiting on an answer, since pressing past it would take the offer away.
- 94eb1a2: The buddy card's sprite opens that pokemon's sheet.
  A trainer in a friends or requests list is opened by pressing their face and name, and the View button beside them is gone.
- 448e984: Searching the box for `is:hurt` narrows on the server rather than in the browser.
- 4f85ee1: A move queued from a run of candy presses can now be learned: the levels are handed over one at a time, so each is offered against the level the pokemon is standing on rather than only the last of the run.
- bfcca8a: - A candy is drawn the size the items beside it are, rather than at half of it.
  - A box square marks a shadow and a purified pokemon, the way it already marks a shiny one, and the line it is named by says so too.
- 69d4ebe: Walking into a chunk no longer shows the previous one's pokemon standing on it for a moment: a window is drawn only against the chunk it was opened for.
- 4f85ee1: Effort is typed as a total per stat, held between what is already saved and 252, rather than pressed up four at a time.
  Training can no longer take effort back off a stat, which is a bitter berry's job.
- 043c619: A run of candy presses offers the moves of every level it grew through, and a second handful landing mid-question queues behind it rather than replacing what was still being asked.
- 69d4ebe: The overworld no longer slows down as more of the world is walked: each frame advances only the pokemon standing in the chunk on screen, and the sheets are held in a bounded cache that lets go of what has not been drawn lately.
- 21ac61f: - A box of pokemon reads every row rather than stopping at the store's page cap, so a large collection no longer loses a different handful of them on each read.
  - A read the store refuses says so, rather than drawing as a box with nothing in it.
  - The box waits for the move, ability and item data before searching, so `move:`, `ability:`, `item:` and `ball:` find what they name on a cold open.
  - A backslash typed into `place:`, `nickname:` or `from:` is searched for rather than emptying the box.
- bfcca8a: The candy pile on a catch sheet stays where the levels left it, instead of jumping back to what it was before the presses and falling again when the bag is read back.
- 4f85ee1: The safari's bag names what is in a square with a tooltip rather than a hover card.
- 96e3489: - A candy sits in the middle of its square, rather than four pixels low.
  - The search box's information mark sits on the middle of the field rather than above it.

## 2.1.0

### Minor Changes

- f4c121a: A stall can set up as a machine stall, laying out 12 machines drawn from every move a pokemon can be taught: the first place besides a gym leader that a machine comes from.

  Changes world generation.

- 2089d5b: Every family's candy is drawn as its own sweet: the bag holds a tray of them instead of a list, and the catch sheet, the fight's payout and a release all show the pile they pay.

### Patch Changes

- 2089d5b: A wandering NPC's counter keeps working when the 5-minute spawn window turns over under it, rather than going dead until it is closed and the person is walked up to again.
- 2089d5b: Releasing says that what the pokemon was holding comes back to the bag, on the sheet and on the box's own bar.
- 2089d5b: A berry patch and an apricorn tree are called out in one colour each, so the board says which crop it is rather than which fruit.
- 2089d5b: - The bag keeps the "use it on" list open after a potion or a candy, so several can be spent without reopening it.
  - Effort points are laid out across the stats and saved in one press, rather than a round trip per +4.
  - Candy presses on the catch sheet gather up and are sent together when you stop pressing.

## 2.0.1

### Patch Changes

- 94e3154: Letting a pokemon go pays 1 family candy for every 25 levels it reached rather than its rarity, so a pokemon at level 76 or above hands back 4.
- 94e3154: - A raid relic is spent when the raid starts, not when the lobby opens, so a lobby you walk out of costs you nothing.
  - A host who leaves a lobby other people are still in hands it over to whoever joined first, rather than leaving a raid nobody can start.
  - One relic opens one lobby a window wherever you press it, rather than a separate lobby in every chunk.
- 37b6506: A silhouetted coat is solid black in both themes, rather than a faded shape that turned white at night.
- 5b56147: Trade evolution items can be held, so a Kingdra and a Porygon2 are reachable: a Dragon Scale or an Up-Grade could be carried but never handed to the pokemon that needed one.
- ea21abe: Beating a trainer, a gym leader or one of the league says the purse is yours, rather than sending you to look for a pokemon waiting in the overworld that only a Rocket fight leaves.
- 94e3154: A quest reward, a mystery gift and a buddy's find each draw the item they handed over, the way a cache and a berry patch already did.
- e19ac57: A pokemon whose health pool changes mid-battle keeps the share of health it had, rather than being set to whatever number moved the pool.
- cf9a3a3: A throw shuts the encounter's buttons until the server answers it, and a cache, a berry patch, an apricorn tree or a happening cannot be pressed again while its claim is in flight.
- ea21abe: - A berry patch and an apricorn tree are called out in the colour of what they bear.
  - A pokemon of the day's featured family ripples on the board.
  - Walking back into a raid you host opens the lobby, rather than asking about the lair first.
  - A lobby you host is not dismissed by a press on the overlay or by Escape.
  - The teach and tutor move lists show the move category badge.
- 37b6506: The cell under the cursor lights up on the chunk board.
- 8800c74: The Channeler shows the heart scales in your bag and states her fee in words, the way the tutor and the reminder do, instead of a badge reading "1" with a sentence hanging off it.

## 2.0.0

### Major Changes

- 48a2210: Johto.

  All 100 of it, and the twenty-seven faces Unown wears, each its own species in
  the dex. With them:

  - The eight gym leaders, from Falkner to Clair, keeping gyms in the countries
    that suit them.
  - Kurt and his seven apricorn balls, carved from trees that grow in the world.
  - Raikou, Entei and Suicune, Lugia and Ho-Oh, and Celebi.
  - Team Rocket has ranks now: Archer, Ariana, Proton and Petrel, and a mark for
    every coat you put down.
  - A Legend may be standing in a champion's seat.
  - The 83 Johto moves, drawn on the canvas rather than played off a sheet.

  The world is reseeded under all of it. A spawn band follows the shape of an
  evolution line rather than lumping its stages together, and a wild pokemon's
  level is read from that line, so what a chunk holds and what level you meet it
  at have both changed everywhere.

### Minor Changes

- 94f522a: The move demo has an Always hits switch, on by default, so a move like Fissure can be watched without waiting out its accuracy.
- 2e792dd: - Togepi and Togetic, Qwilfish, Shuckle, Corsola, Delibird, Skarmory, Smeargle,
  and the Larvitar line, eleven species in all, with their Gold and Silver
  learnsets and egg moves.
  - Togepi is the first baby, and is met in the prized band rather than bred.
  - Super Luck raises its holder's critical hit ratio a stage.
  - Contrary turns every stat change its holder takes the other way round.
  - Storm Drain keeps Water moves off its holder and raises its Special Attack a
    stage instead.
  - Mirror Armor sends a stat drop back at whoever aimed it.
  - Prankster puts its holder's status moves ahead of ordinary priority.
  - Sand Stream whips up a sandstorm when its holder reaches the field.
  - Qwilfish takes Rough Skin, Shuckle Harvest, Corsola Storm Drain, Delibird Gale
    Wings, Skarmory Mirror Armor and Smeargle Prankster.
  - A baby may now carry egg moves while sitting in the Undiscovered egg group,
    since the stage above it is the one that lays the egg.
  - The eleven join the spawn pools of the ocean, kelp forest, rocky coast, coral
    reef, beach, mountain, badlands, tundra, glacier, alpine tundra, grassland,
    woodland, shrubland and temperate forest, so the wild changes for every
    existing player.
- 6b11118: A News key on the menu: every release, newest first, with its page from the releases docs behind it.
- 9028d05: A `/demo/shadow` page: one board, one hour of light and one camera angle, through
  the painter the overworld draws with. The hour, the camera and the latitude are
  sliders, and a bar on the ground drawn from the light alone says where the shadow
  ought to fall, so a shadow that has stopped following the sun is visible at a
  glance rather than after a walk.
- 6d8d761: The Sun Stone is stocked and buried like the other stones, so a Sunkern can become a Sunflora. It is dug up on savanna, desert and tropical seasonal forest ground.
- a896088: - Marill and Azumarill.
  - Huge Power doubles its holder's Attack.
  - Azumarill is a Water Veil holder, which the mainline does not give it.
  - Marill and Azumarill join the bog, swamp and temperate rainforest pools, so
    the wild changes for every existing player.
- 8c9d02a: Apricorn trees stand in the world now. A tree bears one colour of apricorn and
  three to five of them, on the same clock a berry patch fruits on, and the colour
  is the tree's own for good since the tree is drawn bearing it. Picking one fills
  the bag with apricorns, which is what Kurt has been waiting to carve into his
  seven balls.
- ce21d24: Apricorn trees are drawn as trees. There is one for each of the seven apricorns,
  green in the canopy with fruit the colour of the apricorn it bears, grown from
  the Nanab berry plant by `pnpm apricorn-trees`: the fruit takes its colour from
  the apricorn's own icon, so a repainted icon repaints the tree.
- 427cbf7: - Every Team Rocket rank now leaves a mark, and each is worth the coat it was met
  in: one shared by the rank and file, one for each of the four executives, and
  Giovanni's own.
  - A Kanto gym leader's Heart Gold look is unlocked by that gym's badge together
    with Johto's crown, since it is the same gym years later. Fuchsia's is Janine's
    by then, so the Soul Badge pays her.
  - Johto has a dex chain of its own, with its own medal at the top of it.
  - Filling Kanto's dex pays Professor Oak in both his looks, Johto's pays Professor
    Elm, and holding both pays Oak as Johto draws him.
- 49a0286: - The credits are a list rather than a page: `public/credits.json` holds the art
  sources and their terms, the packages, the artists and the landmark and
  decoration names, and `docs/credits.md` keeps the half that has to be
  explained.
  - The About tab reads that file, so the credits screen names everybody instead
    of four sources and a note saying the rest ships with the source. Artists are
    deduped, with their works grouped under them.
  - `pnpm import-sprites` scans every sheet's own credits into the list, so a
    pokemon cannot ship without its artists reaching a player. The sprite
    processor writes a packed charset's artist into the same file instead of
    editing a markdown table.
  - The landmark, decoration and tree artists are credited for the first time.
- 533b5d4: Sentret, Hoothoot, Ledyba and Spinarak and their evolutions, eight species in
  all, with their Gold and Silver learnsets, egg moves and spawn pools. Sentret
  walks grassland, woodland and steppe by day; Hoothoot the woodlands and montane
  forest at night; Ledyba the open forests by day; Spinarak the woodlands and
  rainforest at night.

  Three of the finals were a hidden ability short of four, and got one this
  registry chose: Furret takes Scrappy, Noctowl Infiltrator, Ariados Poison
  Touch. Ledian needed none, since Ledyba's Rattled walks up to meet its own Iron
  Fist.

- 47c01d4: - A gym leader's six now each hold an item chosen for that species, drawn off the
  wild held-item table and narrowed to what does something in a fight. A relic
  nothing else can use comes first, then the answer to being half-grown, then the
  best of what that species carries.
  - The Elite Four and the Rocket executives field the same, with a second ability
    besides: the one thing a player cannot get by catching the same species.
  - A champion's party and Giovanni's carry two items and two abilities apiece.
  - What Team Rocket leaves behind keeps how it was raised. An executive's prize
    walks away with both its abilities, and Giovanni's with both and the room for a
    second held item.
- 06058de: - Johto's eight gym leaders, from Falkner to Clair, keeping gyms in the countries
  their type belongs to alongside Kanto's eight, and Johto's eight badges with
  their own sheet on the trainer's shelf.
  - Johto's Elite Four: Will, Koga and Karen take seats beside Kanto's, and Bruno
    keeps one in each league. The two Bruno seats are two fights with two marks, so
    walking one region's gyms earns that region's Bruno and that mark alone.
  - Lance stands as Johto's champion, in his Heart Gold coat, fielding the six he
    defends the Indigo Plateau with. A champion seat now rolls between him and Red,
    asks for its own league's Elite Four, and pays its own league's title.
  - Every leader, elite and champion fields five of their own kind and their
    signature sixth, and the five are drawn from every region rather than the one
    they are standing in.
  - The cell under somebody standing at a landmark is coloured by what walking up
    to them does: amber for a gym, violet for the Elite Four, gold for a champion,
    beside the ember and tide already there.
  - Every expert's charset is a sprite a player can wear once they hold that
    expert's badge, mark or title.
- 0bc7c5c: Pictures for the Johto moves, drawn on the canvas rather than played off the
  effects atlas.

  - Three new shapes: a ghost closing in on what it is aimed at (Shadow Ball,
    Nightmare, Curse, Destiny Bond, Spite), hearts rising off the target
    (Attract, Sweet Kiss, Charm), and spikes settling along the ground (Spikes).
  - A move that bites or cuts now takes its picture from the flag it already
    carries, so Crunch closes teeth and Metal Claw rakes an edge without either
    being named.
  - The gap before a move lands: Sludge Bomb, Present and Spikes are lobbed, Bone
    Rush tumbles, Magnitude comes up through the floor, and Future Sight is held
    rather than sent.
  - A cue for each of the nine new conditions, and a bite cue for the two that
    take health every time their holder acts.

- f3e3546: The Johto moves: all 83 of them, in the Kanto learnsets, and backed by the
  engine.

  - **Move data**: 83 new entries, with Dark and Steel arriving as attacking
    types. Rain Dance, Sunny Day and Sandstorm were already here as weather.
  - **Learnsets**: every one of the 151 species merged with its Gold, Silver and
    Crystal lists. A move reachable both ways is kept once, at the earliest level
    either game teaches it, and what a whole family gains goes onto the family's
    shared list.
  - **The fight**: secondary statuses and stat drops, the drains, the three heals
    that read the sky, the crit pair, the multi-hits, Outrage, the priority moves
    and the plain stage droppers all work off the tables that were already there.
  - **New mechanics**: guards (Protect, Detect, Endure), holds (Mean Look, Spider
    Web, Encore, Spite), the ghost pair (Curse, Nightmare, Destiny Bond, Perish
    Song), the party moves (Belly Drum, Pain Split, Psych Up, Heal Bell,
    Safeguard, Baton Pass), the copies (Sketch, Conversion 2, Mirror Coat), the
    hazard (Spikes, swept by Rapid Spin), and the attacks that work out their own
    power (Flail, Reversal, Return, Frustration, Present, Magnitude, Beat Up,
    Hidden Power).
  - **Pursuit** catches a target on its way out: the chase is spent the moment
    the swap is declared, at double power, and the walk is no shelter from it.
  - **Sketch keeps what it drew**, out of a raid or an npc fight. A sketch drawn
    in any fight between players ends with the battle, the gym challenger's
    included.
  - A pokemon now carries its **friendship** into battle, which is what Return
    and Frustration are worth in its hands.

- 4b9827f: The first nine of Johto: the three starters and what they become.

  - **Chikorita, Cyndaquil and Totodile**, each with its two evolutions, at dex
    152 through 160, with sheets under `sprites/pokemon/johto`.
  - **Johto is a region the game knows about.** It spans dex 152 to 251, so the
    dex pages it the way it pages Kanto, and the nine registered so far are what
    fills it. The gym seat still answers Kanto for every chunk: a region needs
    more than a starting line to field one.
  - **Six starters on the shelf, not three.** A new trainer chooses a first
    partner from either region's grass, fire and water. The shelf is written gift
    by gift now rather than all-or-none, because an all-or-none write is refused
    once any row of it exists, and the three Kanto starters already stand on
    every shelf there is.
  - Each line is findable in the world it suits: Chikorita on grassland, in
    woodland and in temperate forest, Cyndaquil on the mountain and the volcano,
    Totodile in the mangrove and the swamp, with the middle stages uncommon and
    the full evolutions rare.

- e7a1541: - A trainer class belongs to a region now, and the trades both regions put on the
  road are on it twice: a Swimmer (Kanto) and a Swimmer (Johto) are the same
  trade in two places, drawn differently, fielding what their own region grows,
  and counted and titled apart.
  - Johto brings four trades of its own besides: the Sage fields grass, the Skier
    ice, the Scientist steel, and its Poké Maniac and Burglar the dragons of the
    Dragon's Den and the dark outside it. Every type the game grows has somebody on
    the road fielding it now.
  - A class fields its own region's species rather than the country's, so a Johto
    trainer brings Johto's pokemon wherever they are met.
- 2b52ecc: Six more of Johto's trainer classes stand at duelling cells: the Firebreather
  fields fire, the Medium ghost, the Teacher psychic, the School Kid electric, the
  Youngster ground and the Camper rock. Johto's road now covers every type the game
  grows.
- ce21d24: - The seven apricorns. Each is a ball nobody has carved yet: nothing holds one,
  nothing uses one, no counter lists one, and its line names the ball its colour
  makes.
  - Kurt joins the wanderers, in his own Heart Gold charset. His bench takes a
    basket of one colour and hands back that many of the ball it makes, free,
    as often as a player has apricorns.
  - Apricorn Tree, as a landmark kind with its own resolver: one colour a tree and
    a handful of it, the way a berry patch bears fruit. It is deliberately out of
    the landmark roll until the trees are drawn, so nothing generates a cell with
    nothing on it.
- 42ad32e: - Kurt's seven apricorn balls. The Fast Ball answers 100 base Speed, the Heavy
  Ball climbs to 4x by weight, the Moon Ball a whole Moon Stone line, the Lure
  Ball whatever a ripple startled out, and the Level and Love Balls throw from
  behind the buddy walking beside the player. The Friend Ball catches like a
  plain one and hands over a pokemon at 200 friendship.
  - A meeting now remembers what startled it out, which is what the Lure Ball
    reads.
  - None of the seven is sold, bought back, or hidden in a stash: nothing prices
    them, so every counter that filters on a price passes them over, and a test
    holds them out of the pools as well.
- a7e22eb: - Slugma, Remoraid, Houndour and Phanpy and their evolutions, eight species in
  all, with their Gold and Silver learnsets and egg moves.
  - Magma Armor keeps its holder from being frozen.
  - Suction Cups stops anything dragging its holder off the field.
  - Moody raises one stat two stages and drops another one stage each time its
    holder acts.
  - Stamina raises Defense a stage every time a hit lands on its holder.
  - Magcargo takes Solid Rock, Houndoom Strong Jaw and Donphan Stamina.
  - The eight join the spawn pools of the volcano, badlands, mountain, ocean, kelp
    forest, coral reef, savanna, shrubland and steppe, so the wild changes for
    every existing player.
- d71f00a: The data a fight needs is fetched when something needs it, rather than shipped
  with the first frame.

  - `registerWorldData()` at boot registers the species and the spawn pools,
    which is what the overworld reads to draw itself. Moves, abilities and items
    are dynamically imported by `ensureBattleData()` on first ask, memoized, and
    prefetched behind the first frame once the app has mounted.
  - Panels that read one of those registries — the box, the dex, the bag, the
    gifts, the quest board, a catch sheet, a fight — sit inside a `BattleData`
    boundary that waits for them. The server has no first frame to protect, so it
    takes the whole dex at import instead and every privileged read stays
    synchronous.
  - The battle engine and the modules that field one are loaded only when a fight
    starts: the raid and trainer builders split into a record half both sides
    read and a fight half only a browser does, and the battle view is a
    `clientOnly` component.
  - The engine leaves the eagerly loaded chunks: the move and item registries are
    now two chunks of their own, and the engine rides with the battle canvas in
    the chunk a fight fetches.

- 54b1804: - New **Legend** tier of trainer. One turns up in a champion's seat one window in
  sixty-four, and under the four skies that favour every type for certain. Nothing
  is asked of a challenger: no badge case, no league.
  - A legend fields their own named six at level 100, each carrying three abilities
    and three held items.
  - Beating one pays their mark, a purse of 250,000 to 500,000, and an item off the
    rare band or, one time in twenty-one, the special one: the only fight in the
    game that reaches the special band. The mark is worth the Legend Breaker title
    and the other coats that legend is drawn in.
  - Red is the first legend, with his Mt. Silver party.
  - Blue takes the Kanto champion's seat, fielding his Fire Red six.
  - Giovanni keeps Kanto's eighth gym, which is a Ground gym now rather than the one
    gym with no specialty. The Earth Badge is still what is won there, and his gyms
    stand in the countries his type answers to.
  - Beating Team Rocket's Giovanni now leaves his own mark, which is worth the coat
    he runs Team Rocket in. The gym he keeps in Kanto pays its two other looks of
    him.
  - Blue's Kanto crown pays both the coats he is drawn in there, and his Heart Gold
    look asks for Johto's crown as well.
- e7a1541: - A trainer line counts the trade rather than the region, so Kanto's Swimmers and
  Johto's climb one line and pay one title between them. Their coats are still
  earned apart: beating Kanto's swimmers never dressed anybody as a Johto one.
  - Filling a region's pokedex is worth that region's professor as a title.
- 01693fb: - Every fight now pays a purse of its own rung rather than one flat 1,000 to
  10,000 for almost everybody. A roadside trainer or a grunt pays 5,000 to 15,000,
  a gym leader 20,000 to 50,000, an Ace Trainer 25,000 to 60,000, a Rocket
  executive 40,000 to 90,000, one of the Elite Four 50,000 to 110,000, Giovanni
  120,000 to 250,000, and a Champion 150,000 to 300,000.
  - The purses are read against the valuables rather than the mainline's prices: a
    nugget off the ground sells for 10,000, so nothing worth beating pays less than
    tripping over one.
  - Raid purses join the same ladder, still flat because a raid pays everybody who
    fought it: 35,000 for a shadow raid, 80,000 for a legendary and 200,000 for a
    mythical.
  - A Rocket executive, one of the Elite Four and a Champion now leave an item as
    well, drawn off the overworld pool and weighted higher the further up the ladder
    the fight is. None of them reaches the rarest band: a Master Ball stays
    something the world hides.
- 6661ba2: - Rocket executives: Archer, Ariana, Proton and Petrel bar a Team Rocket cell one
  window in eight, fielding six of the biome's rare band at the Elite Four's level
  and leaving any of the six behind.
  - Giovanni now fights at the Champion's level rather than his own band, still one
    window in sixty-four.
  - A grunt now fields six rather than three, one common and two uncommon and three
    rare, at a roadside trainer's level, and hands over one of the three it was not
    fighting with.
  - Team Rocket cells are called out in their own crimson, apart from the roadside
    duel's ember.
- d7b3260: Pokemon sheets come from the SpriteCollab checkout whole. A pokemon is a folder
  now, holding one layout, its frames as a binary, and a PNG per coat packed to
  that same layout, so a shiny or a female is a second drawing over one
  description. `pnpm import-sprites` copies them in under the species id the game
  knows each by.

  - Every pokemon of Kanto and Johto ships again, with the female coats the
    collection has drawn for 22 of them and their shinies.
  - Missingno, the egg and the substitute are refreshed from the same build.
  - Moves can ask for thirteen more clips than they could: a Karate Chop asks for
    a Chop, a Gust flaps, an Earthquake rumbles, and a Sing sings.

- 4ed3661: - Pichu, Cleffa, Igglybuff, Smoochum, Elekid and Magby.
  - An evolution can ask how much a pokemon thinks of its owner. Pichu, Cleffa
    and Igglybuff are the three that do, and they ask for 220, the point the
    catch sheet starts calling a pokemon inseparable.
  - Nests lay these six now instead of the stage above them, and Pikachu,
    Clefairy, Jigglypuff, Jynx, Electabuzz and Magmar are back in nests at last.
  - Jynx reaches Hydration, which it only ever had through a Smoochum.
  - The six join the prized band of the pools their line already walks, and
    Pikachu, Clefairy and Jigglypuff move from the base band to the uncommon one,
    so the wild changes for every existing player.
- 6379110: - Chinchou, Natu, Mareep and Hoppip and their evolutions, ten species in all,
  with their Gold and Silver learnsets and egg moves.
  - Magic Bounce casts a status move back at whoever aimed it.
  - Plus is worth 1.5x Special Attack while a living ally also has it.
  - Motor Drive turns an Electric move aimed at its holder into a stage of Speed.
  - Lanturn takes Hydration, Xatu Anticipation, Jumpluff Effect Spore, and
    Ampharos both Illuminate and Motor Drive.
  - The ten join the spawn pools of the ocean, deep ocean, kelp forest, savanna,
    grassland, shrubland, steppe and woodland, so the wild changes for every
    existing player.
- b2a8e94: - Raikou, Entei and Suicune, Lugia and Ho-Oh, and Celebi.
  - A lair can hold more than one resident, and a raid rolls which one is at
    home. The Burned Tower is the first, holding all three beasts.
  - Four lairs: the Burned Tower on grassland and woodland, the Whirl Islands at
    sea, the Bell Tower on the mountain, and the Ilex Forest shrine.
  - Raikou takes Motor Drive and Volt Absorb, Entei Magma Armor and Intimidate,
    Suicune Water Absorb and Storm Drain, Lugia Drizzle and Marvel Scale, Ho-Oh
    Healer and Drought, and Celebi Anticipation, Regenerator and Healer.
  - The GS Ball is found in the special band of the overworld item pool, and
    calls Celebi to the shrine in the forest it was left at.
  - The five legendaries join the special band of the grassland, steppe, volcano,
    badlands, taiga, tundra, deep ocean, ocean and mountain, so the wild changes
    for every existing player.
- f187784: - Heracross and Miltank, with their Gold and Silver learnsets and egg moves.
  - Sap Sipper keeps Grass moves off its holder and raises its Attack a stage
    instead.
  - Heracross takes Sap Sipper and Miltank Serene Grace.
  - Heracross joins the woodland, temperate forest and montane forest pools and
    Miltank the grassland, steppe and shrubland ones, so the wild changes for
    every existing player.
- 68cc97f: - Crobat, Bellossom, Politoed, Espeon, Umbreon, Slowking, Steelix, Scizor,
  Kingdra, Porygon2 and Blissey.
  - An evolution can ask what time of day it is. Eevee is the only line that
    does: an Espeon is a day's growing and an Umbreon a night's, both on top of
    the friendship the other three Kanto lines ask for.
  - Crobat is a Poison Touch and Tinted Lens holder and Slowking an Analytic one,
    none of which the mainline gives them.
  - Light Metal halves its holder's weight.
  - A named pokemon on an expert's list now stays on it whatever band it is in,
    so Bruno keeps his Onix and Agatha her Golbat.
  - Blissey is left at three abilities: a Happiny below it brings the fourth.
  - Spawn bands follow the lines that changed shape, so the wild changes for
    every existing player: Onix, Scyther and Chansey drop to the base band,
    Seadra and Golbat to the uncommon one, and the eleven new species join the
    rare band of the pools their lines already walk.
  - Seven spawns that were already filed in the wrong band are corrected:
    Corsola and Qwilfish move up to rare, Ninetales to rare, and Magnemite,
    Voltorb and Rhyhorn down to base.
- 0fcd67d: - Aipom, Yanma, Murkrow, Misdreavus, Girafarig, Dunsparce, Gligar, Sneasel and
  Stantler. Each one gains an evolution in a later generation, so none of them
  is filled up to four abilities: the slots belong to what comes next.
  - Speed Boost raises its holder's Speed a stage every time it acts.
  - Pickpocket takes the item off whoever touches its holder, if the holder has a
    hand free.
  - All nine join spawn pools, so the wild changes for every existing player.
    Murkrow, Gligar and Sneasel are out in the evening and at night only, and
    Misdreavus only at night.
- 921f819: - Thirteen more trainer classes stand at duelling cells, which is every mainline
  class the game has a sprite for: Kanto's Beauty, Fisherman, Sailor, Gentleman,
  Super Nerd, Juggler, Tamer, Engineer and Gambler, and Johto's Gentleman, Super
  Nerd, Juggler and Boarder.
  - A class is no longer one type only. Most field one, some field the pair the
    mainline gives them, and two trades may want the same type.
- 59d0bbf: - Unown, and the twenty-seven other forms it comes in, each its own species in
  the reserved form band and each with a sprite sheet of its own.
  - Every unown carries Levitate and three hidden abilities: Magic Guard and
    Pressure across the set, plus one the letter itself stands for, none of which
    raises a stat of its own.
  - The unowns stand in the prized band of every biome at equal weight, so which
    letter turns up is the roll and where it was walked is not.
  - Queenly Majesty and Comatose, which the Q and Z forms stand for. A comatose
    pokemon keeps acting and takes no status at all, and whatever preys on a
    sleeper (Dream Eater, Nightmare, Bad Dreams, Snore) finds one in it.
  - The printed dex still lists one row for a pokemon with forms, and it fills in
    when any of them is met. Pressing it opens a grid of every form, and pressing
    one of those opens that form's own entry.
  - A pokemon is counted once however many of its forms were met, the region dex
    quests included, which a form used to pass by entirely.
- 566f526: - Sunkern, Wooper, Pineco and Snubbull and their evolutions, eight species in
  all, with their Gold and Silver learnsets and egg moves.
  - Flower Gift is worth 1.5x Attack and Special Defense for its holder's whole
    team in sunlight.
  - Sunflora takes Flower Gift, Quagsire Oblivious, and Forretress both Aftermath
    and Filter.
  - The eight join the spawn pools of the grassland, savanna, shrubland, swamp,
    bog, mangrove, woodland, temperate forest and tropical rainforest, so the wild
    changes for every existing player.
- 3cefaec: - Swinub and Piloswine, Teddiursa and Ursaring, and Tyrogue and Hitmontop.
  - Tyrogue is a baby, met in the prized band, and Hitmonlee and Hitmonchan
    hatch from it now rather than from nothing.
  - An evolution can ask for one of a pokemon's stats measured against another.
    Tyrogue is the only line that does: at level 20 it becomes a Hitmonlee when
    its Attack beats its Defense, a Hitmonchan when it loses, and a Hitmontop
    when they tie.
  - Honey Gather comes up with a Honey the first time its holder acts, if it has
    a hand free.
  - Honey is a held item that restores 40 HP to whoever is carrying it once they
    drop to a quarter.
  - Swinub joins the tundra, glacier and alpine tundra pools, Teddiursa the taiga,
    montane forest and temperate forest, and Tyrogue the grassland, so the wild
    changes for every existing player.
- df44488: - Sudowoodo, Wobbuffet and Mantine.
  - Shadow Tag holds the far side on the field, ghosts aside.
  - Telepathy takes nothing from an ally's attack.
  - Sudowoodo is a Sap Sipper, Wobbuffet is an Unaware and Magic Bounce holder,
    and Mantine is a Hydration holder, none of which the mainline gives them.
  - Nests never hatch the three: Bonsly, Wynaut and Mantyke are the eggs those
    lines lay, and none of them exists yet.
  - All three join spawn pools, so the wild changes for every existing player.
- 6379110: Berserk raises Special Attack a stage when a hit takes its holder under half
  its HP. Typhlosion takes it in place of Reckless.

### Patch Changes

- b2a8e94: The key items sheet carries a GS Ball, tinted out of the Park Ball.
- e47563f: A blow is drawn in the type that dealt it: lit for a weakness, drained toward grey for a resistance, and the type's own colour in between. Only a blow that never landed is colourless.
- 8ffdaf6: A raid boss has twenty times the health its species would otherwise have, rather than a flat 5,000 on top of ten times. A bulky boss is a longer fight than a frail one all the way up, and the frail ones are quicker than they were.
- 5c78e39: - A raid boss takes indirect damage again: poison, burns, seeds, weather and a crash off a missed move all count, for at most 100 each.
  - Damage measured as a share of its health, such as Super Fang, is still refused, and a cost it pays itself is still paid in full.
  - A boss heals at most an eighth of its pool a second, spent from an allowance that refills as the fight runs, so the healing moves are back in its learnset and a stack of drains is worth one of them. Rest stays barred, since the sleep lands in full while the healing does not.
  - Leech Seed drains what it actually took rather than what it aimed for.
- 8089d3f: A raid boss is trained to the effort cap in every stat, not just perfect in every individual value. It is the species at the most it could ever be, which is what a raid is meant to stand for.

  Changes world generation.

- 94f522a: - The AI will not put up a screen or a veil its side already holds, and will not call up weather under a sky that answers to nobody.
  - A stat drop the far side is holding off, by a raid boss or by Mist, Clear Body, Hyper Cutter or Big Pecks, is weighed as the wasted cast it is rather than as a free one.
- 1ece758: Far Afield asks for 5 portals rather than 8 biomes, so it can be finished. A
  counter behind a prerequisite is measured from the moment the quest opens, and
  there are only 29 biomes in the world, so a player who had already seen most of
  them could never find another eight.
- 34ca2ed: Every day of the year features a family: the day is counted around the roster instead of matched against a family number, so no day is blank and no family waits for a number that never comes up.
- 3bc8a4a: - The AI takes a kill over chipping a target it cannot finish, including when the killing move has to wind up first.
  - A hit that leaves the target standing is weighed on a band whose top value it can actually reach, so a near miss counts for more than it did.
- 94f522a: Shadow is a stat change rather than a damage aura: 1.25x Attack and Special Attack, 0.75x Defense and Special Defense. A shadow hits a quarter harder and takes a third more, its stat sheet says so, and fixed-damage moves are unaffected as before.
- 56616b2: Celebi walks the temperate forest at the mythical rate, the way Mew walks the rainforest.

  Changes world generation.

- e47563f: - A move that moves a stat is drawn as the stat: chevrons rising for a raise, the same falling for a drop, coloured by which of the seven stages moved, and drawn on whoever it moved.
  - Focus Energy, Belly Drum and Baton Pass have pictures of their own instead of sharing the raise.
  - Reflect, Light Screen and Safeguard put up a pane of coloured glass over the middle of the team rather than a shell around the caster.
  - Sand Attack and Smoke Screen drift across the gap, and Flash blows out in it.
- e99b6ad: A single-target attack may be aimed at a teammate that absorbs its type, and the AI feeds Volt Absorb, Water Absorb, Dry Skin, Flash Fire, Lightning Rod, Storm Drain, Motor Drive and Sap Sipper when the payout is worth a cast.
- 4b9827f: The dashboard no longer waits forever on an account that is not there.

  The staff gate followed the profile and drew "Reading the account…" until one
  arrived. A read that answers with nothing looked exactly like a read still on
  its way, so a session signed in as a uid the store has no row for (a local
  stack that has been reset under it, an account deleted while it was open) sat
  on that card for good. The two are now told apart: nothing yet is still the
  wait, and nothing at all says so and offers the way back to the game.

- 5cf0ed0: Moves that should reach the caster's own side now do, which matters here because the whole party is on the field:

  - Earthquake, Surf, Explosion and Self-Destruct catch teammates the way Magnitude already did.
  - Present can be handed to a teammate, so the parcel that turns out to be food can feed one; the AI hands it to whoever is hurt enough to want it.
  - Psych Up copies the teammate who has built the most, and Pain Split shares with the healthiest one.
  - Mimic can borrow a teammate's move.
  - Swagger reaches a teammate only where the confusion cannot land, and a single-target stat drop only where Contrary turns it into a rise.
  - The AI reads a hit landing on its own side as a cost rather than as damage dealt.

- a7a0eb1: - A pokemon winding up a move draws a line of marks running to whatever it has picked, in the colour of the bar it is filling.
  - A pokemon helping its own side turns to look at the teammate instead of staying facing the fight.
- 56616b2: - The first stage of a two-stage line spawns in the uncommon band, where a middle stage stands.

  - A species whose evolution belongs to a generation the game does not have yet is banded as the stage it is, not as the end of its line.
  - A biome whose base band is empty draws from the richest band it does hold, rather than staging nothing.

  Changes world generation.

- 4d1e99a: A raid boss is never staged with a move that would take the fight away rather than make it harder: Bide, Belly Drum, Destiny Bond, Pain Split, Sketch and Baton Pass, and Curse on a Ghost.
- 87e0628: A pokemon casting a move over its own side no longer turns round to watch it.
  Safeguard, Reflect and every other team move aimed at the caster's own team
  turned the sprite to face a teammate, which stands behind it, so the caster
  spent the whole cast with its back to the fight.
- 9f0209d: - The Johto release page covers the whole release, including the rebuilt spawn
  bands, the ground-based item stashes and the party-wide move targeting.
  - The docs are rewritten in plain sentences. Em-dash asides are gone from every
    page.
- 94f522a: Weather in a raid is drawn over the side that called for it rather than over the whole picture. A boss that changes the sky still changes it for everybody.
- c0ed704: Spawn bands now follow the shape of a line rather than lumping the stages together:

  - Base is the first stage of a three-stage line, uncommon the first stage of a two-stage one.
  - Rare is the middle of a three-stage line, scarce the end of a two-stage one, and elusive the end of a three-stage one or a species that never evolves.
  - The five stage bands halve as they go, from 1/4 down to 1/32 for the grown one, so a walk turns up the whole of a line rather than the bottom of it over and over.
  - Prized, legendary and mythical keep the odds they had, and a legendary and a mythical are drawn as often as each other.
  - Item finds are unchanged: the item pool keeps the ladder it always ran on.
  - A baby is not counted as a stage, so the line behind it stands one shorter.
  - Level follows the stage rather than the band, and a catch pays 1 to 8 candy.

  Changes world generation.

- 56616b2: - 18 species that named a home biome but appeared in no pool now spawn there, among them Lanturn, Quagsire, Ampharos, Ursaring and Piloswine.

  - A pool no longer stages a species in a biome or at an hour its own data does not claim.

  Changes world generation.

- ed65898: Gym leaders and above now field pokemon raised for the fight: a gym leader's six carry a flat 10 in every value and 50 training points a stat, the Elite Four and the executives have perfect HP and Speed, a champion and Giovanni add the better attacking and defending stat their species leans on, and a legend is perfect in all six. An Ace Trainer is raised the way the Elite Four are without their gear or second ability. Type experts, grunts and what a beaten stop hands over are unchanged.
- e47563f: - A contact move lands as a jab, a hit, a slam or a fist, chosen by its type and power, rather than as one burst for all of them.
  - Weather arrives over the field instead of on whoever called for it.
  - A move spends the gap before it lands as what it turns out to be: a guard closes in, a boost runs upward, health is drawn back, sound carries, powder drifts, and a psychic move already turns on its target.
- d7b3260: Pokemon sheets draw on browsers with no `DecompressionStream`, Safari before 16.4
  and Firefox before 113, which until now saw every pokemon as Missingno. They
  inflate the frames with `fflate` instead, fetched only where the platform has no
  inflate of its own.
- 7b44eb1: A wild pokemon's level is read from its own evolution line rather than from its rarity band: a Charmander is met at 5 to 16, a Charmeleon at 16 to 36, and a Charizard at 36 to 60. A stage whose next step is a stone, a trade or an evolution a later generation holds starts at 30, a species that never evolves is met at 10 to 50, and a baby or an unown at 5 to 10.

  Changes world generation.

- c0abe53: A move now says how it is cast (at one unit, at one team, or at nobody) apart from who it reaches.
- e99b6ad: A move that may be aimed at a teammate now reaches the caster's own party rather than another trainer's.
- 9028d05: Shadows follow the sun through a turn of the camera, and stop disappearing at
  two bearings of it. The picture a thing lays on the ground leaned up the screen
  whatever the light was doing, so the half of a turn that puts the sun behind the
  viewer stopped following it; and the lean was always drawn across the screen, so
  wherever the light ran square across the board the picture had no height left
  and the shadow vanished. The near edge is now held square to the light, snapped
  to the nearest quarter turn, and the picture is laid on its side once that is
  the nearer of the two.
- d388994: Shoot is no longer counted among the clips every sprite sheet carries, since the
  Clefairy and Togepi lines were drawn without one. A move that asked for it now
  falls through to its next choice instead of standing in an Attack.
- b99df5e: The six clips a sheet cannot be drawn without, `Idle`, `Attack`, `Walk`, `Sleep`,
  `Hurt` and `Hop`, are named as their own tier beside the common ten, matching what
  the sprite collection now calls the bare minimum. A sheet short of one of the six
  is reported as unfinished art when it is imported, and a test says so of anything
  that ships.
- 5d3053b: The PMD archive step is gone from the sprite processor. Pokemon sheets are packed
  in the SpriteCollab checkout beside this repository now; what ships here is the
  finished sheet and its description.
- cf5098a: - A trade evolution that asks for a held item spends it at the handover: an Onix
  traded in a Metal Coat arrives a coat lighter and ready to evolve, the way the
  mainline spends it.
  - A swap only opens the evolution when the pokemon was actually holding what it
    asks for, and an auction sale settles the same way.
  - The evolution row on a catch sheet says "ready" instead of a condition once the
    handover has settled it.
- 94f522a: Fissure tears the ground open under whatever it hits: a hole that widens and closes again, with the earth broken around its rim, instead of two brown lines drawn across the floor.
- cbb53c7: The player's guide covers the Johto release.

  - Kurt is in the list of people who wander, with what he carves and what paces
    him.
  - The catching page lists all twenty-one balls, including Kurt's seven.
  - Item stashes are described by the ground they are buried in.
  - Evolution now lists friendship, time of day and one stat against another, and
    says that a trade spends the item it asked to be held.
  - Nests hold back seven species rather than eleven, since six of the babies now
    exist.
  - The dex chain covers Johto as well as Kanto, and the lairs, the two raid
    relics, Honey and the Unown forms are written down.

- f16124f: The battle docs describe the fight as it is drawn and scored now.

  - What a move looks like on the way over, what a stat change looks like, and the
    blow drawn in the type that dealt it.
  - Weather over the field, and over the side that called it in a raid.
  - Perish Song's count, and that a raid boss never hears it.
  - The AI notes cover a kill outweighing a chip, a cast that would change nothing,
    and the rule that a speculative question leaves no mark.

- 8c9d02a: - The menu keypad is laid out in themed rows: the world and who you are, then what you are carrying, then what you are doing, with Raids and Settings under them.
  - Inventory is called Bag, on the key and on the panel it opens.
- 1eeac8f: Whoever is fastest walks onto the field first, so it acts first.

  - In a raid each party is ordered on its own, since the parties arrive side by
    side and one player's speed says nothing about another's.
  - In a fight against a trainer or another player the whole field is ordered
    together, the way a mainline turn would.

- b2921b7: Transform and Sketch may be aimed at an ally, and a Transform is only worth casting on the better body.
- 6d8d761: Item stashes are drawn from the ground they are buried in. The evolution stones, the weather rocks, the pearls and shells, the mushrooms, the star pieces, the rare bones and the pretty wings each belong to the landscapes that suit them, and are found nowhere else; balls, medicine and gear are still buried everywhere. What a beaten trainer hands over follows the same ground.

  Changes world generation.

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
