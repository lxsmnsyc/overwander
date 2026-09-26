import SOUND_STAMPS from './sound-stamps';
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
  /** A ball leaving the hand, over by the time it lands */
  BallThrow = 1,
  /** One rock of a thrown ball, played once for every shake it takes */
  BallShake = 2,
  /** The ball clicking shut on a pokemon that stayed in it */
  CatchSuccess = 3,
  /** The ball opening again: what was in it is still standing there */
  CatchFailed = 4,
  /** The count in, three seconds to the fight starting */
  BattleStart = 5,
  /** The fight won */
  BattleWon = 6,
  /** The fight lost */
  BattleLost = 7,
  /** Both sides down at once */
  BattleDraw = 8,
  /** A badge or a mark won off somebody who hands them out */
  TrainerBeaten = 9,
  /** A pokemon that changed into the next of its line */
  Evolution = 10,
  /** An egg giving way to what was in it */
  EggHatch = 11,
  /** A species written into the dex for the first time */
  DexEntry = 12,
  /** A quest's last step taken */
  QuestComplete = 13,
  /** Through a portal and out in a town */
  PortalCross = 14,
  /** A fossil brought back */
  FossilRevive = 15,
  /** Honey worked into a tree */
  HoneyLather = 16,
  /** Money handed over a counter */
  ShopBuy = 17,
  /** Money handed back across one */
  ShopSell = 18,
  /** A trade or a sale between players gone through */
  TradeComplete = 19,
  /** A pokemon that grew, however many levels the run reached */
  LevelUp = 20,
  /** A move taught */
  MoveLearned = 21,
  /** An ability taken on */
  AbilityLearned = 22,
  /** An ability only its own line can hold */
  SignatureLearned = 23,
  /** Room for one more thing to carry */
  ItemSlot = 24,
  /** Something a player will keep */
  PrizedItem = 25,
  /** Something hardly anybody comes by */
  SpecialItem = 26,
  /** Something foul lifted off a pokemon */
  Purified = 27,
  /** A legendary turned up in the chunk, under its herald */
  LegendaryAppears = 28,
  /** A mythical turned up in the chunk, under its herald */
  MythicalAppears = 29,
  /** A party handed back whole, at the counter it was handed over at */
  NurseHeal = 30,
  /** Something leaving the encounter, whichever end of it walked off */
  Flight = 31,
  /** An egg taken: out of a nest, out of a grotto, or off the breeder */
  EggGet = 32,
  /** An item handed over the counter */
  ItemGet = 33,
  /** A pokemon received, however it arrived */
  PokemonGet = 34,
  /** The ball clicking shut, on the beat it stops moving */
  BallClick = 35,
}

/**
 * The file each sound plays, named without its folder or extension.
 * The ones missing are silent until there is a file for them
 */
const FILES: Partial<Record<Effect, string>> = {
  [Effect.ShinySparkle]: 'shiny_sparkle',
  [Effect.BallThrow]: 'ball_throw',
  [Effect.BallShake]: 'ball_shake',
  [Effect.CatchSuccess]: 'catch_success',
  [Effect.CatchFailed]: 'catch_failed',
  [Effect.BattleStart]: 'battle_start',
  [Effect.BattleWon]: 'battle_won',
  [Effect.BattleLost]: 'battle_lost',
  [Effect.BattleDraw]: 'battle_draw',
  [Effect.TrainerBeaten]: 'trainer_beaten',
  [Effect.Evolution]: 'evolution',
  [Effect.EggHatch]: 'egg_hatch',
  [Effect.DexEntry]: 'dex_entry',
  [Effect.QuestComplete]: 'quest_complete',
  [Effect.PortalCross]: 'portal_cross',
  [Effect.FossilRevive]: 'fossil_revive',
  [Effect.HoneyLather]: 'honey_lather',
  [Effect.ShopBuy]: 'shop_buy',
  [Effect.ShopSell]: 'shop_sell',
  [Effect.TradeComplete]: 'trade_complete',
  [Effect.LevelUp]: 'level_up',
  [Effect.MoveLearned]: 'move_learned',
  [Effect.AbilityLearned]: 'ability_learned',
  [Effect.SignatureLearned]: 'signature_learned',
  [Effect.ItemSlot]: 'item_slot',
  [Effect.PrizedItem]: 'prized_item',
  [Effect.SpecialItem]: 'special_item',
  [Effect.Purified]: 'purified',
  [Effect.LegendaryAppears]: 'legendary_appears',
  [Effect.MythicalAppears]: 'mythical_appears',
};

/**
 * How loud a sound is against the setting's own 0 to 1.
 *
 * Under one, because these play over the world rather than instead of
 * it: a slider at the top should be present rather than startling
 */
const EFFECT_LEVEL = 0.8;

const loaded = new Map<Effect, HTMLAudioElement>();

/** The last playing of each sound that has not finished yet */
const sounding = new Map<Effect, HTMLAudioElement>();

/**
 * The element for a sound, made the first time it is asked for.
 *
 * Nothing is fetched on the server, and nothing is fetched at all
 * until a sound is actually wanted: a player who never meets a shiny
 * never downloads the sparkle
 */
function sourceOf(effect: Effect): HTMLAudioElement | null {
  const name = FILES[effect];

  if (typeof Audio === 'undefined' || name == null) {
    return null;
  }

  const held = loaded.get(effect);

  if (held != null) {
    return held;
  }

  // Stamped, so a sound can be cached for a year and a re-rendered one is a new address
  const stamp = SOUND_STAMPS[name];
  const made = new Audio(`/sounds/effects/${name}.ogg${stamp == null ? '' : `?v=${stamp}`}`);

  made.preload = 'auto';
  loaded.set(effect, made);
  return made;
}

/**
 * Play one of the world's sounds, at whatever the player has the
 * slider at. Silent at zero, for a sound with no file, and where the
 * browser refuses: audio before the page has been interacted with is
 * blocked, and a blocked sound is not something to tell anybody about
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
  sounding.set(effect, playing);
  playing.addEventListener('ended', () => {
    if (sounding.get(effect) === playing) {
      sounding.delete(effect);
    }
  });
  playing.play().catch(() => {
    // Refused, which a browser does until the page has been pressed
    sounding.delete(effect);
  });
}

/**
 * Play a sound once another has finished, or now if it is not
 * playing. For a fanfare that follows another rather than being
 * sung over it: a badge's march after the win's
 */
export function playEffectAfter(effect: Effect, before: Effect): void {
  const playing = sounding.get(before);

  if (playing == null) {
    playEffect(effect);
    return;
  }
  playing.addEventListener(
    'ended',
    () => {
      playEffect(effect);
    },
    { once: true },
  );
}
