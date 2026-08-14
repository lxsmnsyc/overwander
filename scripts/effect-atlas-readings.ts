/**
 * What each effect sheet shows, and the move it serves.
 *
 * The sheets carry no name for their subject — `effects/47` is a
 * number and a packed atlas — so this is the reading, made by watching
 * the frames. It sits apart from the page that renders it
 * ([`effect-atlas.ts`](./effect-atlas.ts)) because it is the half that
 * gets revised: the builder changes when the page changes, this changes
 * every time a sheet is claimed for a move.
 *
 * Two rules shape the assignments:
 *
 * - **Projectiles are somebody else's job.** A move whose picture is a
 *   thing crossing the gap — leaves, needles, coins, a beam — needs a
 *   sprite that travels, not an effect pinned to one combatant. Those
 *   sheets are still listed, under `Projectiles`, but they carry no
 *   move: assigning one here would promise something this layer cannot
 *   draw.
 * - **One sheet, one move.** Where two sheets share a subject the
 *   second is marked as a variant rather than given the same move
 *   twice.
 */

/** Where an effect belongs when it plays. */
export type Plays = 'User' | 'Target' | 'Field' | 'User / Target';

export interface Reading {
  /** Sheet folder, relative to `public/sprites`. */
  sheet: string;
  /** What is actually on the frames. */
  shows: string;
  /** The move it serves, or a dash for a sheet nothing claims yet. */
  move: string;
  /** A second candidate, a caveat, or nothing. */
  note?: string;
  plays: Plays;
  /** Whether the subject could not be pinned down. */
  guess?: boolean;
}

export interface Group {
  title: string;
  /** The hue this group is keyed by, as a light and a dark value. */
  hue: [light: string, dark: string];
  /** What the last column is called — the emotes are not moves. */
  column?: string;
  readings: Reading[];
}

const GROUPS: Group[] = [
  {
    title: 'Fire',
    hue: ['#b23c0c', '#ff8a5c'],
    readings: [
      {
        sheet: 'effects/4',
        shows: 'Fist glyph in a yellow starburst, then a ring of orange fire',
        move: 'Fire Punch',
        plays: 'Target',
      },
      {
        sheet: 'effects/5',
        shows: 'Two orange fire blasts detonating in sequence',
        move: 'Heat Wave',
        plays: 'Target',
      },
      {
        sheet: 'effects/10',
        shows: 'Ring of flames circling a point, closing inward',
        move: 'Flare Blitz',
        note: 'the ring wraps the attacker rather than the struck point',
        plays: 'User',
      },
      {
        sheet: 'effects/28',
        shows: 'Row of fire bursts across a wide cell',
        move: 'Inferno',
        plays: 'Target',
      },
      {
        sheet: 'effects/29',
        shows: 'Paw print igniting, then red claw slashes',
        move: 'Blaze Kick',
        note: 'free now that 165 is the drawn Fire Fang',
        plays: 'Target',
      },
      {
        sheet: 'effects/30',
        shows: 'Flash, sparkle, then tall walls of flame',
        move: 'Fire Blast',
        plays: 'Target',
      },
      {
        sheet: 'effects/36',
        shows: 'Column of flame rising from the ground',
        move: 'Flame Burst',
        plays: 'Target',
      },
      {
        sheet: 'effects/53',
        shows: 'Small orange embers scattering and dying',
        move: 'Fire Spin',
        plays: 'Target',
      },
      {
        sheet: 'effects/81',
        shows: 'Loose orange flame wisps drifting',
        move: 'Will-O-Wisp',
        plays: 'Target',
      },
      {
        sheet: 'effects/95',
        shows: 'White-hot lances falling in a row, breaking into embers',
        move: 'Overheat',
        plays: 'Target',
      },
      {
        sheet: 'effects/96',
        shows: 'White core swelling into a fireball, then red smoke',
        move: 'Blast Burn',
        plays: 'Target',
      },
      {
        sheet: 'directional/5',
        shows: 'Tall orange column growing from the pinned end',
        move: 'Eruption',
        note: 'aimed',
        plays: 'Target',
      },
      {
        sheet: 'effects/127',
        shows: 'Orange spark bursting wide, then embers',
        move: 'Flame Charge',
        plays: 'Target',
      },
      {
        sheet: 'effects/128',
        shows: 'A small flame lifting off, leaving a rising spark',
        move: 'Flash Fire',
        plays: 'User',
        guess: true,
      },
      {
        sheet: 'effects/165',
        shows: 'White jaws closing on a burst of fire, then smoke',
        move: 'Fire Fang',
        note: 'one of the fang trio with 160 and 163',
        plays: 'Target',
      },
    ],
  },
  {
    title: 'Electric',
    hue: ['#8a6100', '#f5c542'],
    readings: [
      {
        sheet: 'effects/18',
        shows: 'Blue point, white flash, then a yellow lightning burst',
        move: 'Thunder Shock',
        plays: 'Target',
      },
      {
        sheet: 'effects/42',
        shows: 'Heavy yellow arcs forming a cage around the whole cell',
        move: 'Discharge',
        plays: 'Target',
      },
      {
        sheet: 'effects/43',
        shows: 'Lightning arcs collapsing into a white core',
        move: 'Thunderbolt',
        plays: 'Target',
      },
      {
        sheet: 'effects/44',
        shows: 'The same arcs as 43 with a different decay',
        move: 'Thunderbolt',
        note: 'second variant — pair them or drop one',
        plays: 'Target',
      },
      {
        sheet: 'effects/91',
        shows: 'Fist glyph in a starburst, then jagged yellow sparks scattering',
        move: 'Thunder Punch',
        note: 'the fist points right — needs a flip for left-facing attackers',
        plays: 'Target',
      },
      {
        sheet: 'directional/3',
        shows: 'Vertical bolt, thin then bright and thick',
        move: 'Thunder',
        note: 'drawn at its own orientation — struck straight down, not aimed',
        plays: 'Target',
      },
      {
        sheet: 'effects/134',
        shows: 'White core throwing long yellow arcs in every direction',
        move: 'Zap Cannon',
        plays: 'Target',
      },
      {
        sheet: 'effects/160',
        shows: 'White jaws closing on a yellow discharge',
        move: 'Thunder Fang',
        note: 'one of the fang trio with 163 and 165',
        plays: 'Target',
      },
      {
        sheet: 'directional/7',
        shows: 'A thin lightning thread strung between two stars',
        move: 'Thunder Wave',
        note: 'aimed',
        plays: 'Target',
      },
      {
        sheet: 'directional/8',
        shows: 'The same thread ending in a burst',
        move: 'Charge Beam',
        note: 'aimed',
        plays: 'Target',
      },
    ],
  },
  {
    title: 'Water & Ice',
    hue: ['#14607f', '#5cc4e8'],
    readings: [
      {
        sheet: 'effects/23',
        shows: 'White sparkles, blue crystals, a flash, then a cyan ring',
        move: '—',
        note: 'a freeze landing on a target; whichever ice move gets it, the beam itself would travel',
        plays: 'Target',
      },
      {
        sheet: 'effects/38',
        shows: 'Cyan four-point sparkles drifting apart',
        move: 'Icy Wind',
        plays: 'Target',
      },
      {
        sheet: 'effects/63',
        shows: 'Cluster of yellow-white bubbles rising',
        move: 'Acid',
        plays: 'Target',
      },
      {
        sheet: 'effects/83',
        shows: 'Blue arrow driving down into a splash',
        move: 'Waterfall',
        plays: 'Target',
      },
      {
        sheet: 'effects/94',
        shows: 'Five pale rings circling, weaving into a knot, then closing',
        move: 'Aqua Ring',
        note: 'or Reflect — it reads as a shield being woven',
        plays: 'User',
      },
      {
        sheet: 'directional/2',
        shows: 'White orb bursting into a cyan splash crown',
        move: 'Surf',
        note: 'the splash, aimed',
        plays: 'Target',
      },
      {
        sheet: 'effects/119',
        shows: 'Blue cloud swelling and thinning away',
        move: 'Mist',
        plays: 'Field',
      },
      {
        sheet: 'effects/125',
        shows: 'Blue orb bursting into bubbles and spray',
        move: 'Water Pulse',
        plays: 'Target',
      },
      {
        sheet: 'effects/139',
        shows: 'Cyan four-point stars twinkling in and out',
        move: 'Powder Snow',
        plays: 'Target',
      },
      {
        sheet: 'effects/148',
        shows: 'Ice crystals growing up out of the ground',
        move: 'Icicle Crash',
        plays: 'Target',
      },
      {
        sheet: 'effects/163',
        shows: 'White jaws closing on a scatter of ice',
        move: 'Ice Fang',
        note: 'one of the fang trio with 160 and 165',
        plays: 'Target',
      },
      {
        sheet: 'effects/166',
        shows: 'Blue crescent sweeping through with spray behind it',
        move: 'Aqua Tail',
        plays: 'Target',
      },
    ],
  },
  {
    title: 'Grass',
    hue: ['#2c6b21', '#7fce62'],
    readings: [
      {
        sheet: 'effects/33',
        shows: 'Pink petals bursting from a green centre',
        move: 'Petal Dance',
        plays: 'Target',
      },
      {
        sheet: 'effects/35',
        shows: 'Petals and whole flowers drifting outward',
        move: 'Petal Blizzard',
        plays: 'Target',
      },
      {
        sheet: 'effects/78',
        shows: 'Small green crescents, a few at a time',
        move: 'Leaf Blade',
        plays: 'Target',
      },
      {
        sheet: 'effects/79',
        shows: 'Large green crescent arcs with a white edge',
        move: '—',
        note: 'the heavier cut of the pair; free now that 78 is Leaf Blade',
        plays: 'Target',
      },
      {
        sheet: 'effects/86',
        shows: 'Tan roots writhing up with a spark or two among them',
        move: 'Ingrain',
        plays: 'User',
      },
      {
        sheet: 'effects/87',
        shows: 'Brown roots erupting with green leaves above',
        move: 'Frenzy Plant',
        note: 'free now that 145 is the drawn Grassy Terrain',
        plays: 'Target',
      },
      {
        sheet: 'effects/92',
        shows: 'Green helix winding upward, coil by coil',
        move: 'Bind',
        note: 'or Constrict — the coil wraps whatever it plays on',
        plays: 'Target',
      },
      {
        sheet: 'effects/122',
        shows: 'Green seeds scattering and settling',
        move: 'Leech Seed',
        plays: 'Target',
      },
      {
        sheet: 'effects/123',
        shows: 'Green seeds going white, then brown',
        move: 'Worry Seed',
        note: 'the seeds turn; which move that is, is a guess',
        plays: 'Target',
        guess: true,
      },
      {
        sheet: 'effects/129',
        shows: 'Green bolt lancing across with a white head',
        move: 'Solar Beam',
        note: 'the release — 60 is the charge',
        plays: 'Target',
      },
      {
        sheet: 'effects/144',
        shows: 'Stacked rings of wind with gold leaves caught in them',
        move: 'Leaf Tornado',
        plays: 'Target',
      },
      {
        sheet: 'effects/145',
        shows: 'A row of green seedlings coming up',
        move: 'Grassy Terrain',
        plays: 'Field',
      },
      {
        sheet: 'effects/154',
        shows: 'Green rings multiplying into a flower of rings',
        move: 'Synthesis',
        plays: 'User',
        guess: true,
      },
      {
        sheet: 'effects/162',
        shows: 'Green ring opening with leaves spilling out',
        move: 'Grass Whistle',
        plays: 'Target',
        guess: true,
      },
      {
        sheet: 'effects/168',
        shows: 'Green orb with sparkles, opening into a ring',
        move: 'Giga Drain',
        plays: 'Target',
      },
    ],
  },
  {
    title: 'Psychic, Ghost & Dark',
    hue: ['#8c2a6d', '#f07ccd'],
    readings: [
      {
        sheet: 'effects/46',
        shows: 'Purple bat unfolding its wings, eyes lighting up',
        move: 'Leech Life',
        plays: 'Target',
      },
      {
        sheet: 'effects/62',
        shows: 'A point, then a thin vertical line, then nothing',
        move: 'Teleport',
        plays: 'User',
      },
      {
        sheet: 'effects/65',
        shows: 'White spiral winding down to nothing',
        move: 'Hypnosis',
        note: 'or Confuse Ray',
        plays: 'Target',
      },
      {
        sheet: 'effects/80',
        shows: 'Magenta starburst filling the cell with radiating spikes',
        move: 'Psychic',
        plays: 'Target',
      },
      {
        sheet: 'effects/90',
        shows: 'White spectre with hollow eyes and a wisp tail',
        move: 'Curse',
        plays: 'Target',
      },
      {
        sheet: 'effects/93',
        shows: 'Violet claw swiping through, trailing three streaks',
        move: 'Shadow Claw',
        plays: 'Target',
      },
      {
        sheet: 'effects/106',
        shows: 'Violet flames rising in columns, on a loop',
        move: 'Hex',
        plays: 'Target',
      },
      {
        sheet: 'effects/118',
        shows: 'Blue demon face opening its mouth, eyes burning',
        move: 'Nightmare',
        plays: 'Target',
      },
      {
        sheet: 'effects/132',
        shows: 'A silver spoon bending double',
        move: 'Kinesis',
        plays: 'Target',
      },
      {
        sheet: 'effects/136',
        shows: 'Green triangle with coloured nodes turning at its corners',
        move: 'Trick Room',
        plays: 'Field',
      },
      {
        sheet: 'effects/150',
        shows: 'Three cyan rings orbiting a point',
        move: 'Cosmic Power',
        plays: 'User',
      },
      {
        sheet: 'effects/152',
        shows: 'White crescents, then a magenta radial burst',
        move: 'Psycho Cut',
        plays: 'Target',
      },
      {
        sheet: 'effects/170',
        shows: 'Violet hands swirling around a dark orb',
        move: 'Phantom Force',
        plays: 'Target',
      },
    ],
  },
  {
    title: 'Poison & Powder',
    hue: ['#6b3a8c', '#b78ee8'],
    readings: [
      {
        sheet: 'effects/22',
        shows: 'Fine grey-green motes drifting upward, very sparse',
        move: '—',
        note: 'the faint powder; free now that 98, 99 and 100 carry the three',
        plays: 'Target',
      },
      {
        sheet: 'effects/98',
        shows: 'Yellow and orange motes streaming upward, on a loop',
        move: 'Stun Spore',
        plays: 'Target',
      },
      {
        sheet: 'effects/99',
        shows: 'The same plume in violet',
        move: 'Poison Powder',
        plays: 'Target',
      },
      {
        sheet: 'effects/100',
        shows: 'The same plume in green',
        move: 'Sleep Powder',
        plays: 'Target',
      },
      {
        sheet: 'effects/47',
        shows: 'Mushroom growing on a white stalk until the cap fills the cell',
        move: 'Spore',
        plays: 'Target',
      },
      {
        sheet: 'effects/57',
        shows: 'Mottled grey cloud swelling and going ragged',
        move: 'Smog',
        note: 'or Sludge Wave',
        plays: 'Target',
      },
      {
        sheet: 'directional/4',
        shows: 'Pale specks rising the length of a tall cell',
        move: 'Spore drift',
        note: 'aimed; sparse enough to be hard to read',
        plays: 'Target',
        guess: true,
      },
      {
        sheet: 'effects/153',
        shows: 'Purple mass swelling and going mottled',
        move: 'Sludge Bomb',
        plays: 'Target',
      },
      {
        sheet: 'effects/164',
        shows: 'Violet blobs multiplying until they fill the cell',
        move: 'Poison Gas',
        plays: 'Target',
      },
    ],
  },
  {
    title: 'Contact & Physical',
    hue: ['#4a5163', '#a8b0c2'],
    readings: [
      {
        sheet: 'effects/1',
        shows: 'White flash expanding, then a scatter of debris',
        move: 'Tackle',
        note: 'the general-purpose contact hit',
        plays: 'Target',
      },
      {
        sheet: 'effects/2',
        shows: 'Brown rock chunks bursting and crumbling to dust',
        move: 'Rock Slide',
        plays: 'Target',
      },
      {
        sheet: 'effects/11',
        shows: 'Gold spheres landing in a cluster under a horizon line',
        move: 'Self-Destruct',
        plays: 'User',
      },
      {
        sheet: 'effects/12',
        shows: 'The same spheres, more of them and spread wider',
        move: 'Explosion',
        plays: 'User',
      },
      {
        sheet: 'effects/15',
        shows: 'White spikes with pink flights, driving in threes',
        move: 'Crush Claw',
        note: 'claw-type; pairs with 54',
        plays: 'Target',
      },
      {
        sheet: 'effects/17',
        shows: 'White puff with a fist driving through it',
        move: 'Mach Punch',
        plays: 'Target',
      },
      {
        sheet: 'effects/21',
        shows: 'Two open palms, then claws, then a cyan ring',
        move: 'Helping Hand',
        plays: 'User',
      },
      {
        sheet: 'effects/24',
        shows: 'Pairs of tan claws raking across',
        move: 'Fury Swipes',
        plays: 'Target',
      },
      {
        sheet: 'effects/26',
        shows: 'Two curved fangs closing on the centre',
        move: 'Bite',
        note: 'or Crunch',
        plays: 'Target',
      },
      {
        sheet: 'effects/27',
        shows: 'White feathered arcs sweeping across',
        move: 'Roost',
        plays: 'User',
      },
      {
        sheet: 'effects/48',
        shows: 'Something arriving into a jagged orange impact',
        move: 'Guillotine',
        plays: 'Target',
      },
      {
        sheet: 'effects/49',
        shows: 'Gold blades crossing at a point',
        move: 'X-Scissor',
        note: 'the pinching pair',
        plays: 'Target',
      },
      {
        sheet: 'effects/54',
        shows: 'The same spikes as 15, tighter grouping',
        move: 'Metal Claw',
        note: 'claw-type; pairs with 15',
        plays: 'Target',
      },
      {
        sheet: 'effects/55',
        shows: 'Yellow crescent slashes cutting across',
        move: 'Slash',
        note: 'or Air Slash',
        plays: 'Target',
      },
      {
        sheet: 'effects/59',
        shows: 'White six-point starbursts with small plus sparks',
        move: 'Critical hit',
        note: 'a hit marker rather than a move of its own',
        plays: 'Target',
      },
      {
        sheet: 'effects/89',
        shows: 'Steel nail driven in until only the head shows',
        move: 'Spikes',
        note: 'free now that 90 is Curse',
        plays: 'Target',
      },
      {
        sheet: 'effects/107',
        shows: 'Two braided ropes twisting closed',
        move: 'Wrap',
        plays: 'Target',
      },
      {
        sheet: 'effects/108',
        shows: 'Fist glyph in a small yellow starburst',
        move: 'Dizzy Punch',
        plays: 'Target',
      },
      {
        sheet: 'effects/109',
        shows: 'Fist glyph in a long eight-point starburst',
        move: 'Focus Punch',
        note: 'the heaviest of the punch flashes',
        plays: 'Target',
      },
      {
        sheet: 'effects/110',
        shows: 'Two fists closing, then crossing on a gold cord',
        move: 'Cross Chop',
        plays: 'Target',
      },
      {
        sheet: 'effects/111',
        shows: 'Three blue streaks cutting diagonally through',
        move: 'Aerial Ace',
        plays: 'Target',
      },
      {
        sheet: 'effects/112',
        shows: 'Paw print inside an eight-point starburst',
        move: 'Stomp',
        plays: 'Target',
      },
      {
        sheet: 'effects/113',
        shows: 'Open blue hand in a yellow starburst',
        move: 'Karate Chop',
        plays: 'Target',
      },
      {
        sheet: 'effects/114',
        shows: 'Two blue lenses closing on the middle',
        move: 'Vice Grip',
        plays: 'Target',
      },
      {
        sheet: 'effects/124',
        shows: 'Grey spheres lifting and scattering',
        move: 'Ancient Power',
        plays: 'Target',
      },
      {
        sheet: 'effects/131',
        shows: 'Grainy brown clumps thrown up in patches',
        move: 'Mud-Slap',
        plays: 'Target',
      },
      {
        sheet: 'effects/143',
        shows: 'Flat white rings stacking upward',
        move: 'Whirlwind',
        plays: 'Target',
      },
      {
        sheet: 'effects/146',
        shows: 'A boulder settling with dust around it',
        move: 'Rock Tomb',
        plays: 'Target',
      },
      {
        sheet: 'effects/147',
        shows: 'Spiked white ball breaking into dust',
        move: 'Rollout',
        plays: 'Target',
      },
      {
        sheet: 'effects/151',
        shows: 'A cog of wind throwing off white crescents',
        move: 'Air Cutter',
        plays: 'Target',
      },
      {
        sheet: 'effects/158',
        shows: 'Red fist inside a red starburst',
        move: 'Counter',
        plays: 'User',
      },
      {
        sheet: 'effects/159',
        shows: 'White gem shapes turning and scattering',
        move: 'Power Gem',
        plays: 'Target',
      },
      {
        sheet: 'effects/161',
        shows: 'Small coloured blocks thrown out and falling',
        move: 'Fling',
        plays: 'Target',
      },
      {
        sheet: 'effects/171',
        shows: 'White orb with speed lines tearing off it',
        move: 'Extreme Speed',
        plays: 'User',
      },
    ],
  },
  {
    title: 'Sound',
    hue: ['#1f5f6b', '#62c8d6'],
    readings: [
      {
        sheet: 'effects/6',
        shows: 'Golden bell ringing inside a yellow ring, notes either side',
        move: 'Heal Bell',
        plays: 'User',
      },
      {
        sheet: 'effects/7',
        shows: 'Blue, pink and yellow notes rising apart',
        move: 'Sing',
        plays: 'User',
      },
      {
        sheet: 'effects/8',
        shows: 'Pink notes lifting out of a yellow ring',
        move: 'Round',
        plays: 'User',
      },
      {
        sheet: 'effects/9',
        shows: 'Dense pink notes, then white sound chevrons pushing out',
        move: 'Echoed Voice',
        note: 'free now that 97 carries Uproar',
        plays: 'Target',
      },
      {
        sheet: 'effects/97',
        shows: 'Orange ring widening with sparks turning around it, on a loop',
        move: 'Uproar',
        note: 'or Hyper Voice — the ring wraps whoever is shouting',
        plays: 'User',
      },
      {
        sheet: 'effects/14',
        shows: 'Golden bell with a widening blue ring',
        move: 'Heal Bell',
        note: 'cooler variant of 6',
        plays: 'User',
      },
      {
        sheet: 'effects/19',
        shows: 'Thin cyan ring expanding past the cell',
        move: 'Screech',
        note: 'or Supersonic',
        plays: 'User',
      },
      {
        sheet: 'effects/169',
        shows: 'Coloured rings turning with notes riding them',
        move: 'Perish Song',
        plays: 'Field',
      },
    ],
  },
  {
    title: 'Status, Buffs & Field',
    hue: ['#5a4a86', '#a99bec'],
    readings: [
      {
        sheet: 'effects/3',
        shows: 'Ring of red, green, blue and yellow segments expanding',
        move: 'Safeguard',
        note: 'or Aurora Veil',
        plays: 'Field',
      },
      {
        sheet: 'effects/13',
        shows: 'Small flask tipping, then a yellow ring',
        move: 'Item use',
        note: 'an X-item or a drink, not a move',
        plays: 'User',
      },
      {
        sheet: 'effects/16',
        shows: 'Flash, then a green sphere morphing to cone to cube',
        move: 'Transform',
        note: 'or Conversion',
        plays: 'User',
      },
      {
        sheet: 'effects/20',
        shows: 'Cyan ring resolving into a red and yellow crosshair',
        move: 'Lock-On',
        note: 'or Mind Reader',
        plays: 'Target',
      },
      {
        sheet: 'effects/25',
        shows: 'White light cone from above, pooling on the ground',
        move: 'Heal Pulse',
        plays: 'Target',
      },
      {
        sheet: 'effects/31',
        shows: 'Olive orb with a violet ring orbiting it',
        move: 'Sunny Day',
        plays: 'Field',
      },
      {
        sheet: 'effects/32',
        shows: 'Star, then the whole cell going white, then yellow',
        move: 'Flash',
        plays: 'Field',
      },
      {
        sheet: 'effects/34',
        shows: 'Two white puffs collapsing into dotted rings',
        move: 'Smokescreen',
        plays: 'Target',
      },
      {
        sheet: 'effects/37',
        shows: 'Dotted ring, cyan sparkles, then a gold star',
        move: 'Refresh',
        note: 'or any status cure',
        plays: 'User',
      },
      {
        sheet: 'effects/40',
        shows: 'White cloud thinning into grey grit',
        move: 'Sand Attack',
        plays: 'Target',
      },
      {
        sheet: 'effects/50',
        shows: 'Pink hearts multiplying and floating up',
        move: 'Attract',
        plays: 'Target',
      },
      {
        sheet: 'effects/51',
        shows: 'Red targeting reticles crossing out',
        move: 'Foresight',
        note: 'or Odor Sleuth',
        plays: 'Target',
      },
      {
        sheet: 'effects/52',
        shows: 'Pale spirit appearing, then hearts',
        move: 'Captivate',
        note: 'or Lovely Kiss',
        plays: 'Target',
      },
      {
        sheet: 'effects/60',
        shows: 'Yellow ring around a white core, holding steady',
        move: 'Solar Beam',
        note: 'the charge, not the release',
        plays: 'User',
      },
      {
        sheet: 'effects/61',
        shows: 'Glowing yellow orb shedding sparkles',
        move: 'Charge',
        plays: 'User',
      },
      {
        sheet: 'effects/64',
        shows: 'Pale cone opening downward from a point',
        move: 'Encore',
        plays: 'Target',
      },
      {
        sheet: 'effects/72',
        shows: 'Four marks converging on a point',
        move: 'Taunt',
        plays: 'Target',
      },
      {
        sheet: 'effects/73',
        shows: 'Spiked yellow sun ring expanding and thinning',
        move: 'Morning Sun',
        note: 'reads as the stronger Sunny Day candidate if 31 is ever freed',
        plays: 'User',
      },
      {
        sheet: 'effects/75',
        shows: 'Hand popping out of a white puff',
        move: 'Metronome',
        plays: 'User',
      },
      {
        sheet: 'effects/76',
        shows: 'Yellow face with a jagged mouth',
        move: 'Scary Face',
        plays: 'Target',
      },
      {
        sheet: 'effects/77',
        shows: 'Black eye opening, gold pupil narrowing',
        move: 'Leer',
        note: 'or Mean Look',
        plays: 'Target',
      },
      {
        sheet: 'effects/85',
        shows: 'Gold stars trailing along an arc',
        move: 'Wish',
        plays: 'User',
      },
      {
        sheet: 'effects/101',
        shows: 'A red and a green orb pulsing together',
        move: '—',
        note: 'a paired-orb effect nobody has claimed',
        plays: 'User',
        guess: true,
      },
      {
        sheet: 'effects/102',
        shows: 'Flat cyan rings widening across the ground',
        move: 'Bulldoze',
        plays: 'Field',
      },
      {
        sheet: 'effects/103',
        shows: 'White cloud swelling and thinning away',
        move: 'Haze',
        plays: 'Field',
      },
      {
        sheet: 'effects/104',
        shows: 'Yellow wall rising with a battlemented top',
        move: 'Light Screen',
        plays: 'User',
      },
      {
        sheet: 'effects/116',
        shows: 'Pink ring filling to a white disc, then breaking up',
        move: 'Dazzling Gleam',
        plays: 'Target',
      },
      {
        sheet: 'effects/117',
        shows: 'Red lips and dark wings crowding in',
        move: 'Lovely Kiss',
        plays: 'Target',
      },
      {
        sheet: 'effects/120',
        shows: 'Flat white disc going yellow around a star',
        move: 'Earthquake',
        plays: 'Field',
      },
      {
        sheet: 'effects/121',
        shows: 'Ring of stones drawing in and settling',
        move: 'Stealth Rock',
        plays: 'Field',
      },
      {
        sheet: 'effects/126',
        shows: 'Grey sphere with eight smaller ones turning around it',
        move: 'Gyro Ball',
        plays: 'User',
      },
      {
        sheet: 'effects/130',
        shows: 'A single four-point twinkle opening and closing',
        move: 'Charm',
        plays: 'Target',
        guess: true,
      },
      {
        sheet: 'effects/133',
        shows: 'An egg cracking open in two',
        move: 'Softboiled',
        plays: 'User',
      },
      {
        sheet: 'effects/135',
        shows: 'Fire going to red spikes, then to blue crystal',
        move: 'Weather Ball',
        note: 'it changes element mid-clip',
        plays: 'Target',
        guess: true,
      },
      {
        sheet: 'effects/137',
        shows: 'A field of gold sparkles rising',
        move: 'Aromatherapy',
        plays: 'User',
      },
      {
        sheet: 'effects/138',
        shows: 'A full moon with sparkles falling from it',
        move: 'Moonlight',
        plays: 'User',
      },
      {
        sheet: 'effects/140',
        shows: 'A sword drawn up out of nothing',
        move: 'Swords Dance',
        plays: 'User',
      },
      {
        sheet: 'effects/141',
        shows: 'Ring of white cotton puffs',
        move: 'Cotton Spore',
        plays: 'Target',
      },
      {
        sheet: 'effects/142',
        shows: 'Hexagonal web weaving itself into a shield',
        move: 'Protect',
        plays: 'User',
      },
      {
        sheet: 'effects/149',
        shows: 'A single flat cyan ring widening',
        move: 'Magnitude',
        note: 'the quieter cousin of 102',
        plays: 'Field',
      },
      {
        sheet: 'effects/155',
        shows: 'A point flaring to white, then leaving tokens',
        move: 'Healing Wish',
        plays: 'User',
        guess: true,
      },
      {
        sheet: 'effects/156',
        shows: 'Gold stars framed in green rings',
        move: 'Lucky Chant',
        plays: 'User',
        guess: true,
      },
      {
        sheet: 'effects/157',
        shows: 'The same tokens closing back to white',
        move: 'Nature Power',
        plays: 'Field',
        guess: true,
      },
      {
        sheet: 'effects/167',
        shows: 'Pink six-point stars bursting in turn',
        move: 'Play Rough',
        plays: 'Target',
      },
      {
        sheet: 'effects/172',
        shows: 'A blue flake opening into a ring of pale stars',
        move: 'Moonblast',
        plays: 'Target',
      },
    ],
  },
  {
    title: 'Projectiles — need a travelling sprite',
    hue: ['#7a5a1e', '#c8a45c'],
    column: 'Reads as',
    readings: [
      {
        sheet: 'effects/39',
        shows: 'Small gold discs tumbling and settling',
        move: 'Thrown coins',
        plays: 'Target',
      },
      {
        sheet: 'effects/41',
        shows: 'Small ridged white blocks scattering along an arc',
        move: 'Flung debris',
        plays: 'Target',
        guess: true,
      },
      {
        sheet: 'effects/45',
        shows: 'Row of cream stars growing left to right',
        move: 'Star volley',
        plays: 'Target',
      },
      {
        sheet: 'effects/56',
        shows: 'Ring of blue shards contracting into a cluster',
        move: 'Ice shards',
        plays: 'Target',
      },
      {
        sheet: 'effects/58',
        shows: 'Magenta beams firing upward from white cores',
        move: 'Beam volley',
        plays: 'Target',
      },
      {
        sheet: 'effects/82',
        shows: 'Blue droplets spraying in arcs',
        move: 'Water spray',
        plays: 'Target',
      },
      {
        sheet: 'effects/84',
        shows: 'Green chevrons flying in formation',
        move: 'Thrown leaves',
        plays: 'Target',
      },
      {
        sheet: 'effects/88',
        shows: 'Round blue spheres scattering outward',
        move: 'Bubbles',
        plays: 'Target',
      },
      {
        sheet: 'directional/1',
        shows: 'Magenta beam growing down the length of the cell',
        move: 'Aimed beam',
        plays: 'Target',
      },
      {
        sheet: 'effects/105',
        shows: 'A gold lance crossing the cell and shrinking',
        move: 'Thrown lance',
        plays: 'Target',
      },
      {
        sheet: 'effects/115',
        shows: 'Orange meteors streaking down in a group',
        move: 'Falling meteors',
        plays: 'Target',
      },
      {
        sheet: 'directional/6',
        shows: 'A thick white beam driving down with a burning base',
        move: 'Heavy aimed beam',
        note: 'reads as Hyper Beam once something can fire it',
        plays: 'Target',
      },
    ],
  },
  {
    title: 'Emotes — not moves',
    hue: ['#6b6f7c', '#9aa0ad'],
    column: 'Use',
    readings: [
      {
        sheet: 'effects/66',
        shows: 'Blue exclamation mark, held steady',
        move: 'Alerted',
        plays: 'User',
      },
      {
        sheet: 'effects/67',
        shows: 'Blue question mark, held steady',
        move: 'Confused',
        plays: 'User',
      },
      { sheet: 'effects/68', shows: 'Yellow dashes fanning out', move: 'Emphasis', plays: 'User' },
      { sheet: 'effects/69', shows: 'Single yellow sparkle', move: 'Delighted', plays: 'User' },
      { sheet: 'effects/70', shows: 'Blue teardrop', move: 'Dismayed', plays: 'User' },
      {
        sheet: 'effects/71',
        shows: 'White chevrons sweeping in an arc',
        move: 'Speed lines',
        plays: 'User',
      },
      { sheet: 'effects/74', shows: 'Hand giving a thumbs-up', move: 'Approval', plays: 'User' },
    ],
  },
];

export default GROUPS;
