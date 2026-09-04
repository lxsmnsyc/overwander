# overwander

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
