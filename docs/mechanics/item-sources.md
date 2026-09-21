# Where items come from

Every item in the game is dug up, picked, or handed over by somebody beaten, and
the ground a player is standing on decides what they get.

Three landmarks give items: the **item cache**, the **berry patch** and the
**phenomenon**. A buddy with **Pickup** finds them while walking. Each source
rolls first for a rarity band, and the bands are listed in
[Items](items.md#the-item-pool).

## The ground decides what is buried in it

Balls, medicine and battle gear are buried everywhere. The rest belong to a
landscape, and are found there and nowhere else.

| What                                            | Where it is buried                                      |
| ----------------------------------------------- | ------------------------------------------------------- |
| **Fire Stone**, **Heat Rock**                   | Volcano, badlands and desert                            |
| **Sun Stone**                                   | Savanna, desert and tropical seasonal forest            |
| **Water Stone**, **pearls**, **shoal salt and shells** | Every water and every shore                      |
| **Thunder Stone**                               | Grassland, savanna, steppe, shrubland and mountain      |
| **Leaf Stone**, **mushrooms**                   | The forests, and the wetlands for the smaller mushrooms |
| **Moon Stone**, **Icy Rock**                    | The cold: glacier, tundra, taiga, cold desert, mountain |
| **Damp Rock**                                   | Swamp, bog, mangrove and rainforest                     |
| **Smooth Rock**                                 | Arid country                                            |
| **Stardust**, **Star Pieces**, **Comet Shards** | Dry and cold country under clear skies                  |
| **Rare Bones**                                  | Arid country, highlands and the glacier                 |
| **Pretty Wings**                                | Open country, highlands and forests                     |

The world is one map with no edges, so every kind of ground can be reached on
foot.

Everything a **beaten trainer** leaves behind follows the same ground. A
**Pickup** buddy is the exception: it draws from the whole shelf, since what it
finds is scavenged rather than dug.

## Item caches

An **item cache** holds a stash rather than a single item. The rarity it rolled
is the **best thing in there**, and one of that kind is guaranteed. How many
_kinds_ it holds is a separate roll of up to three, and each further kind rolls
its own rarity beneath that ceiling. A stash might therefore be two rares and a
common, three commons, or one of each. Rarity and quantity are independent,
which stops a good dig being the same three slots every time.

Each kind comes in up to **three pieces**.

A stash can be a Master Ball and two stones. Two things it can never be: **two
specials**, and **more than one piece** of a special. A Master Ball is never
found in a stack.

## Berry patches

A patch is a bush rather than a buried box, so it bears **one kind** of berry
and **three to five** pieces of it. It fruits every 15 minutes. Picked or not,
the next window grows something new.

A bush needs ground it can root in, so no patch grows on the open sea, on the
deserts and the badlands, or on the volcano, the glacier and the alpine tundra.
Everywhere else bears them.

| Band         | What grows there                                                        |
| ------------ | ----------------------------------------------------------------------- |
| **Base**     | The five single-status cures                                            |
| **Uncommon** | Leppa, Oran, Persim, and the five bitter berries                        |
| **Rare**     | Lum, Sitrus, the five that answer a blow, and the eighteen type-resists |
| **Special**  | The pinch berries, and the six silver and gold prize berries            |

What each berry does is covered in [Items](items.md#berries).

## Apricorn trees

A tree bears **one colour** of apricorn and **three to five** of them, on the
same 15-minute clock a berry patch fruits on. The colour is the tree's own and
never changes. The tree is drawn bearing it, so a red one is a landmark a player
can walk back to.

A tree stands only where a bush grows and the ground is below the tree line, so
there are none on the tundra, the steppe or the bare mountain either.

An apricorn is worth nothing on its own. **Kurt**, who passes through the
wandering cells, carves one into the ball it stands for: seven colours, seven
balls, none of them for sale anywhere.

## Phenomena

A **phenomenon** is something happening at a cell rather than something buried
in it. Which of the four is happening depends on the biome and changes every
hour. Half the time it leaves an item and half the time it produces a pokemon,
and either way a player gets **one** per cell per hour.

| Phenomenon         | Item half                         | Pokemon half                           |
| ------------------ | --------------------------------- | -------------------------------------- |
| **Hidden Grotto**  | Nothing at all                    | A pokemon, or 1/64 an egg of the biome |
| **Dust Cloud**     | One gem, stone, plate or valuable | A pokemon                              |
| **Rippling Water** | One valuable                      | A pokemon                              |
| **Flying Shadow**  | One wing                          | A pokemon                              |

The pokemon is drawn from the biome's **uncommon** band, or its **rare** band
one time in eight.

What a phenomenon leaves starts at **uncommon**. It does not hand over what an
ordinary walk turns up anyway, and the two bands above that are eight times as
wide as the ground makes them. It has no special band at all. The only special
item its pools ever reach is the **Relic Crown**, drawn with the other ruins
rather than at a rate of its own, so nothing happening at a cell leaves a Master
Ball or a Shiny Charm.

The **dust cloud is the richest** phenomenon. It is the only source of a stone
or a plate outside an item cache, and the only ordinary source of gems. The
**grotto** pays in pokemon instead. It never leaves an item at all, and one
grotto in sixty-four holds an egg of the biome, which is the same egg a nest
would have laid without the half-day wait.

## Pickup

The one source that is not a landmark. A buddy with **Pickup** finds something
every **512 steps** walked, drawn from the ordinary item pool with the **top two
bands excluded**: a ball, a potion, occasionally a stone, but never a Master
Ball and never a Bottle Cap.

## See also

- [Items](items.md): what each of these is worth once it is in the bag
- [Gold and auctions](economy.md)
- [The world](world.md): the landmarks these sit on
- [People you meet](npcs.md): the vendor, the chef and Kurt
- [Eggs](eggs.md)
