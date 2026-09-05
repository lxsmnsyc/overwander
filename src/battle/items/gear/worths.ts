import { Items } from '../../../data/ids/items';
import { MoveCategories } from '../../../data/ids/moves';
import { Species } from '../../../data/ids/species';
import { TeamStatuses, Weathers } from '../../../data/ids/status';

/**
 * The gear: held items that work for as long as they are carried.
 *
 * None of them is ever spent, so each is a standing rule rather than a
 * moment — which is what makes them the plainest held items in the
 * game and the easiest to build a pokemon around. Every one rides a
 * hook the engine already has: the residual ones are paid out where
 * Solar Power and Rain Dish are, the ones that lift a stat or a power
 * ride the same checks a Choice Band does, and the ones that answer
 * being hit ride the damage event a Rough Skin does.
 */

/**
 * The mainline pays a Leftovers out at the end of every turn, and the
 * closest thing to a turn a real-time fight has is a move: the payout
 * comes as its holder reaches for one. See
 * [`onUnitActs`](../utils.ts), which is where the abilities that work
 * the same way — Solar Power, Rain Dish, Dry Skin — are paid from too
 */

/**
 * What each piece of gear is worth, and the small tables that say
 * which items share one rule. The effects are beside this file, one
 * module per kind of hook they ride
 */
/**
 * What a Leftovers is worth each time, and what a Black Sludge is
 * worth to the ones it is not food for. The sludge takes twice what
 * the leftovers give: it is rubbish, and holding rubbish costs more
 * than eating well pays
 */
export const LEFTOVERS_SHARE = 1 / 16;
export const BLACK_SLUDGE_SHARE = 1 / 8;

/**
 * What a Shell Bell hands back out of the damage its holder just did
 */
export const SHELL_BELL_SHARE = 1 / 8;

/**
 * What a Big Root adds to everything its holder drains
 */
export const BIG_ROOT_FACTOR = 1.3;

/**
 * What a Muscle Band and a Wise Glasses add to the half of the game
 * each of them belongs to
 */
export const BAND_FACTOR = 1.1;

/**
 * What an Expert Belt adds to a blow that was already landing hard.
 * It is the one power item that pays nothing at all against a
 * pokemon its holder has no answer for
 */
export const EXPERT_BELT_FACTOR = 1.2;

/**
 * What a Metronome adds for each repeat of the same move, and the
 * most it ever reaches. Doing one thing over and over is exactly what
 * a real-time fight makes easy, so the ceiling is what keeps a
 * Metronome from being a reason never to do anything else
 */
export const METRONOME_STEP = 0.2;
export const METRONOME_LIMIT = 2;

/**
 * What the lenses are worth: a tenth more of the holder's own
 * accuracy, a tenth off the accuracy of anything aimed at the holder
 */
export const WIDE_LENS_ACCURACY = 1.1;
export const BRIGHT_POWDER_EVASION = 0.9;

/**
 * What a Zoom Lens is worth against a target already casting or
 * channelling. The mainline gives it to whoever moves second, which
 * has no analog here; a committed pokemon is the same idea. Twice a
 * Wide Lens, since the moment has to be caught rather than waited for
 */
export const ZOOM_LENS_ACCURACY = 1.2;

/**
 * How much likelier a critical becomes, in stages. The ratio a blow is
 * rolled against opens at zero and doubles the odds with every stage
 * on it, so a Scope Lens is worth one doubling to anybody and the two
 * species lenses are worth two to the one pokemon each was made for
 */
export const SCOPE_LENS_CRITICAL_STAGES = 1;
export const SPECIES_LENS_CRITICAL_STAGES = 2;

/**
 * How often a Quick Claw hurries its holder, and by how much. The
 * bracket is the same scale a move's own priority is on, so a claw
 * that fires buys what a Quick Attack has: a shorter wind-up
 */
export const QUICK_CLAW_CHANCE = 0.2;
export const QUICK_CLAW_PRIORITY = 1;

/**
 * How often a Focus Band leaves its holder standing on 1 HP. Unlike a
 * Sash it is not spent doing it, and unlike a Sash it does not care
 * what health the holder started the blow on — which is why it is a
 * tenth of the time rather than every time
 */
export const FOCUS_BAND_CHANCE = 0.1;

/**
 * What a Sticky Barb costs whoever is stuck with it — the Black
 * Sludge's share, since a barb is rubbish that bites
 */
export const STICKY_BARB_SHARE = 1 / 8;

/**
 * What an Iron Ball and a Float Stone do to their carrier: one halves
 * its speed and grounds it, the other halves what it weighs
 */
export const IRON_BALL_SPEED = 0.5;
export const FLOAT_STONE_WEIGHT = 0.5;

/**
 * How much later a Lagging Tail makes its holder act. It is the
 * mirror of a Quick Claw's hurry, on the same scale a move's own
 * priority is on — the mainline's "moves last in its bracket" has no
 * bracket to be last in here
 */
export const LAGGING_TAIL_PRIORITY = -1;

/**
 * What touching a Rocky Helmet costs, as a share of the toucher
 */
export const ROCKY_HELMET_SHARE = 1 / 6;

/**
 * What a Light Clay is worth: the mainline's five turns of screen
 * become eight, which is the same bargain a weather rock strikes with
 * the sky
 */
export const LIGHT_CLAY_FACTOR = 1.6;

/**
 * What the two binding items are worth. A Grip Claw is the mainline's
 * flat seven turns against the usual four or five, so here it is the
 * same proportion of a bind's few seconds; a Binding Band deepens the
 * chip instead, which is the other half of what being held costs
 */
export const GRIP_CLAW_FACTOR = 1.75;
export const BINDING_BAND_FACTOR = 4 / 3;

/**
 * How often a King's Rock or a Razor Fang leaves whoever was hit
 * reeling
 */
export const KINGS_ROCK_CHANCE = 0.1;

/**
 * What a Razor Claw is worth: the doubling a Scope Lens buys, since
 * the two are the same item wearing different names
 */
export const RAZOR_CLAW_CRITICAL_STAGES = SCOPE_LENS_CRITICAL_STAGES;

/**
 * The screens a Light Clay holds up. Nothing else a team can be under
 * is a thing anybody put there on purpose
 */
export const SCREEN_STATUSES = new Set<TeamStatuses>([
  TeamStatuses.Reflect,
  TeamStatuses.LightScreen,
]);

/**
 * What a weather rock is worth, which is what a Light Clay is worth:
 * the mainline's five turns become eight
 */
export const WEATHER_ROCK_FACTOR = 1.6;

/**
 * The rocks, and the sky each one holds out for longer. Hail and snow
 * are the same weather as far as an Icy Rock is concerned — it is the
 * cold it keeps, not the shape of it
 */
export const WEATHER_ROCKS: { item: Items; weathers: Set<Weathers> }[] = [
  { item: Items.DampRock, weathers: new Set([Weathers.Rain]) },
  { item: Items.HeatRock, weathers: new Set([Weathers.Sunny]) },
  { item: Items.IcyRock, weathers: new Set([Weathers.Hail, Weathers.Snow]) },
  { item: Items.SmoothRock, weathers: new Set([Weathers.Sandstorm]) },
];

/**
 * The weathers an umbrella is any use against. It keeps the sun and
 * the rain off its holder — and nothing else: a sandstorm goes round
 * an umbrella, which is what the goggles are for
 */
export const UMBRELLA_WEATHERS = new Set<Weathers>([
  Weathers.Sunny,
  Weathers.Rain,
  Weathers.ExtremeSunny,
  Weathers.HeavyRain,
]);

/**
 * The lenses that belong to one species. A Lucky Punch is a boxing
 * glove nothing but a Chansey has the hands for, and a Stick is the
 * leek a Farfetch'd was already carrying
 */
export const SPECIES_LENSES: Map<Items, Species> = new Map([
  [Items.LuckyPunch, Species.Chansey],
  [Items.Stick, Species.Farfetchd],
]);

/**
 * The two items that lift one half of the game each
 */
export const BAND_CATEGORIES: Map<Items, MoveCategories> = new Map([
  [Items.MuscleBand, MoveCategories.Physical],
  [Items.WiseGlasses, MoveCategories.Special],
]);
