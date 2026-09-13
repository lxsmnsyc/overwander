import settings from './settings';

/**
 * The sounds the world makes in passing.
 *
 * Every one of them is short, played over whatever else is playing,
 * and worth nothing if it is late: a sparkle that arrives after the
 * player has looked away is noise. So each is loaded once and kept,
 * and a second playing of the same sound clones the loaded element
 * rather than rewinding it, which is what lets two shinies in one
 * window both be heard.
 *
 * Volume is read at the moment of playing rather than held, so moving
 * the slider is heard on the next sound without anything subscribing
 * to it.
 */

/** What each sound is, under `public/sounds/effects` */
export const enum Effect {
  /** A shiny, whether it is standing in a chunk or in front of the player */
  ShinySparkle = 0,
  /** A party handed back whole, at the counter it was handed over at */
  NurseHeal = 1,
  /** One rock of a thrown ball, played once for every shake it takes */
  BallShake = 2,
  /** The ball opening again: what was in it is still standing there */
  CatchFailed = 3,
  /** Something leaving the encounter, whichever end of it walked off */
  Flight = 4,
  /** A pokemon that grew, however many levels the run reached */
  LevelUp = 5,
  /** The fight about to start, played over the count in */
  BattleStart = 6,
  /** The fight won */
  BattleWon = 7,
  /** The fight lost, which a draw is near enough to share */
  BattleLost = 8,
  /** An egg taken: out of a nest, out of a grotto, or off the breeder */
  EggGet = 9,
  /** An item handed over the counter */
  ItemGet = 10,
  /** A pokemon received, however it arrived */
  PokemonGet = 11,
  /** Something out of the ground that a player will keep */
  PrizedItem = 12,
  /** Something out of the ground that hardly anybody digs up */
  SpecialItem = 13,
  /** The ball clicking shut on a pokemon that stayed in it */
  BallClick = 14,
}

const FILES: Record<Effect, string> = {
  [Effect.ShinySparkle]: '/sounds/effects/shiny_sparkle.wav',
  [Effect.NurseHeal]: '/sounds/effects/nurse_heal.wav',
  [Effect.BallShake]: '/sounds/effects/ball_shake.wav',
  [Effect.CatchFailed]: '/sounds/effects/catch_failed.wav',
  [Effect.Flight]: '/sounds/effects/flight.wav',
  [Effect.LevelUp]: '/sounds/effects/level_up.wav',
  [Effect.BattleStart]: '/sounds/effects/battle_start.wav',
  [Effect.BattleWon]: '/sounds/effects/battle_won.wav',
  [Effect.BattleLost]: '/sounds/effects/battle_lost.wav',
  [Effect.EggGet]: '/sounds/effects/egg_get.wav',
  [Effect.ItemGet]: '/sounds/effects/item_get.wav',
  [Effect.PokemonGet]: '/sounds/effects/pokemon_get.wav',
  [Effect.PrizedItem]: '/sounds/effects/prized_item.wav',
  [Effect.SpecialItem]: '/sounds/effects/special_item.wav',
  [Effect.BallClick]: '/sounds/effects/ball_click.wav',
};

/**
 * How loud a sound is against the setting's own 0 to 1.
 *
 * Under one, because these play over the world rather than instead of
 * it: a slider at the top should be present rather than startling
 */
const EFFECT_LEVEL = 0.8;

const loaded = new Map<Effect, HTMLAudioElement>();

/**
 * The element for a sound, made the first time it is asked for.
 *
 * Nothing is fetched on the server, and nothing is fetched at all
 * until a sound is actually wanted: a player who never meets a shiny
 * never downloads the sparkle
 */
function sourceOf(effect: Effect): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') {
    return null;
  }

  const held = loaded.get(effect);

  if (held != null) {
    return held;
  }

  const made = new Audio(FILES[effect]);

  made.preload = 'auto';
  loaded.set(effect, made);
  return made;
}

/**
 * Play one of the world's sounds, at whatever the player has the
 * slider at. Silent at zero, and silent where the browser refuses:
 * audio before the page has been interacted with is blocked, and a
 * blocked sound is not something to tell anybody about
 */
export default function playEffect(effect: Effect): void {
  const level = settings().sound;

  if (level <= 0) {
    return;
  }

  const source = sourceOf(effect);

  if (source == null) {
    return;
  }
  // Its own element rather than the held one, so a sound already
  // playing is not cut short to start again. The held one is what
  // fetched the file; a second `Audio` on the same source is served
  // from the cache
  const playing = new Audio(source.src);

  playing.volume = Math.min(1, level * EFFECT_LEVEL);
  playing.play().catch(() => {
    // Refused, which a browser does until the page has been pressed
  });
}
