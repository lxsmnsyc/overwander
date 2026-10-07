import type { PlayerIdentity } from '../../auth/user';
import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
} from 'solid-js';
import { type InventoryEntry, getInventory } from '../../auth/inventory';
import type { EncounterRecord } from '../../auth/encounter-record';
import { feedEncounter, throwBall } from '../../auth/safari';
import { BALL_ITEMS, Balls, type Items, getBall } from '../../data/ids/items';
import { Genders } from '../../data/ids/species';
import { isShadow, isShiny } from '../../auth/caught-record';
import { getSpeciesData } from '../../data/species';
import type SafariSession from '../../overworld/safari';
import { FEED_CATCH_BONUS, SafariState, ThrowResult, describeFlight } from '../../overworld/safari';
import { describeAbility, describeItem } from '../details';
import playEffect, { Effect, playEffectAfter } from '../app/sound';
import InventoryPicker from '../items/InventoryPicker';
import ItemSprite from '../items/ItemSprite';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { ArrowLeftIcon, BagIcon, FireIcon, SparklesIcon } from '../icons';
import { getSpeciesDexEntry } from '../../auth/pokedex';
import { Badge, Dialog, Status, useToast } from '../styled';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import settings, { setSetting } from '../app/settings';
import { failed, readable } from '../app/resource-reads';

/** One command in the safari's menu: a chunky tile on a hard drop */
const TILE =
  'flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border-2' +
  ' border-line bg-paper px-1.5 py-2 text-sm font-extrabold text-ink shadow-[0_4px_0_0_var(--drop)]' +
  ' transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55';

/** The throw, which is the tile pressed most */
const TILE_PRIMARY = 'border-black/25 bg-tide text-on-accent shadow-[0_4px_0_0_rgb(0_0_0/0.25)]';

/** The small line under a tile's word */
const TILE_NOTE = 'text-[10.5px] font-bold text-muted';

/**
 * Whether the item is something the encounter would eat
 */
function isTreat(item: Items): boolean {
  return FEED_CATCH_BONUS[item] != null;
}

/**
 * How a gender is shown beside a level. Something genderless says
 * nothing rather than saying so: an empty column is not information
 */
const GENDER_MARKS: Record<Genders, string> = {
  [Genders.Genderless]: '',
  [Genders.Male]: '♂',
  [Genders.Female]: '♀',
};

const THROW_MESSAGES: Record<ThrowResult, string> = {
  [ThrowResult.Caught]: 'Caught!',
  [ThrowResult.BrokeFree]: 'It broke free.',
  [ThrowResult.Fled]: 'It fled.',
};

/**
 * How large the ball on the throw button is drawn. It is the label
 * rather than a decoration beside one now — the button no longer
 * spells out what is in hand — so it is drawn at a size that can be
 * told from the other balls at a glance
 */
/** How large the held item is drawn in its badge */
const HELD_SPRITE = 16;

const THROW_SPRITE = 28;

/** How large the thrown ball is drawn where the pokemon was standing */
const BALL_SPRITE = 48;

/**
 * How long the ball takes to land, how long one shake of it takes, how
 * long it lies still between shakes, and the beat it is left still
 * before the answer is said.
 *
 * Most of it runs while the catch is being written down, so the player
 * waits little longer than they already do: what changes is that the
 * wait is the ball rocking rather than a static sprite.
 *
 * A shake and the rest after it are one iteration of the keyframes, so
 * the two are split there in the same 2/3 to 1/3 they are here
 */
const BALL_LAND = 260;
const BALL_SHAKE = 400;
const BALL_REST = 200;
const BALL_SETTLE = 320;

const STATE_MESSAGES: Record<SafariState, string> = {
  [SafariState.Active]: '',
  [SafariState.Caught]: 'Caught. It is yours.',
  [SafariState.Fled]: 'It fled, and it will not be back.',
  [SafariState.Exited]: 'You walked away.',
};

export interface SafariDialogProps {
  user: PlayerIdentity;
  /**
   * The open session, or null when no encounter is being met
   */
  session: SafariSession<EncounterRecord> | null;
  /**
   * Whether walking away has to be meant.
   *
   * A wild pokemon on a cell is still standing there after a stray
   * press on the ground behind the dialog: the player walks back and
   * meets it again. One that came out of a phenomenon or was won is
   * met once and never again, and the overlay closing it threw the
   * whole thing away. Those are answered by the buttons alone
   */
  insistent?: boolean;
  /**
   * Whether what it is carrying is shown before anything is thrown.
   * A Frisk buddy is what looks; without one the badge stays off and
   * a held item is found when the pokemon is caught
   */
  revealsHeld?: boolean;
  /**
   * Whether how ready it is to run is said before the first ball. A
   * Forewarn buddy is what knows; without one the meeting is read off
   * the pokemon itself
   */
  revealsFlight?: boolean;
  /**
   * Whether what it can do is read before it is caught. A Trace buddy
   * is what reads it; without one the ability is found by catching it
   */
  revealsAbility?: boolean;
  onClose: () => void;
  /**
   * Fired with the new record the moment a throw lands.
   *
   * A caught pokemon is the thing the player was after, and the sheet
   * is where it can be looked at properly — its sigil, what it was
   * born with, what it can be raised into. Handing the id up rather
   * than opening the sheet here keeps one dialog on screen at a time
   */
  onCaught?: (catchId: string) => void;
}

/**
 * One safari encounter, as three things a player can do: throw what
 * is in hand, go through the bag for something else, or walk away.
 *
 * What is in hand is one item rather than a list of them — a ball, or
 * a treat picked up on the way to throwing one — so the dialog asks
 * the question the player is actually answering ("throw this?") and
 * keeps the bag behind a button. Every action goes through the
 * persistence layer, so the bag and the catch records move with the
 * session
 */
/**
 * The encounter itself, which is where the bag is read.
 *
 * A bag read in the body that declared it would land on the boundary
 * around the whole page and take the world down mid-throw, so the
 * reading half stands under the boundary below
 */
function SafariBody(
  props: SafariDialogProps & {
    bag: Resource<InventoryEntry[]>;
    /** Whether this player has ever owned the species standing there, a shiny one for a shiny */
    owned: Resource<boolean>;
    /** One of this item left the bag on the server */
    onSpent: (item: Items) => void;
  },
): JSX.Element {
  const toast = useToast();
  const [narrated, setNarrated] = createSignal<string | null>(null);
  // Whether the bag is open over the three actions. The picker is not
  // a dialog of its own: this is already one, and a modal over a
  // modal fights it for the click that closes it
  const [rummaging, setRummaging] = createSignal(false);
  // The treat in hand, or null when it is the ball. It is the dialog's
  // rather than the session's because a ball is a *preference* that
  // outlives the throw, while a treat is one throw's business — and
  // the session already owns the ball
  const [treat, setTreat] = createSignal<Items | null>(null);
  /**
   * What was just caught, until the player has said they have seen it.
   * The sheet opens from here rather than from the throw
   */
  const [caught, setCaught] = createSignal<string | null>(null);
  // The session mutates in place, so the view needs a nudge after
  // every action to re-read its state, turn count and bonus
  const [revision, setRevision] = createSignal(0);
  /**
   * Whether a throw is with the server.
   *
   * Nothing on screen moves between the press and the answer, and the
   * throw is what spends the ball and rolls the pokemon's turn: a
   * mashed button threw the bag at one encounter. The actions are shut
   * for the length of the call, running away with them, since leaving
   * mid-throw settles the session under the answer coming back
   */
  const [throwing, setThrowing] = createSignal(false);

  /**
   * The ball on screen, as how many times it is set to rock. Null
   * while nothing is thrown, which is what puts the pokemon back
   */
  const [rocking, setRocking] = createSignal<number | null>(null);

  /**
   * Play the ball landing and rocking, and resolve when it is done.
   *
   * It is awaited alongside the write rather than after it, so the
   * animation costs nothing: a throw was already this long. Somebody
   * who has asked for less motion is shown the ball and told the
   * answer without the wait
   */
  const rock = async (shakes: number, result: ThrowResult): Promise<void> => {
    // Somebody who has asked for less motion is shown the ball for a
    // beat and told the answer. The rocking is where the near miss is
    // said, and there is nowhere else to say it that would not also
    // say it to everybody the animation already told
    const still = settings().reduceMotion;
    const held = still ? BALL_SETTLE : BALL_LAND + shakes * (BALL_SHAKE + BALL_REST) + BALL_SETTLE;

    setRocking(shakes);
    // One knock on the beat the ball rocks, so the count a player
    // hears is the count they are watching. Nothing is drawn rocking
    // for somebody who asked for less motion, so they get the one
    // knock the beat is worth rather than a count of a thing that is
    // standing still
    if (still) {
      playEffect(Effect.BallShake);
    } else {
      // The throw is timed to be over as the ball lands, where the
      // first knock starts
      playEffect(Effect.BallThrow);
      for (let shake = 0; shake < shakes; shake += 1) {
        setTimeout(
          () => {
            playEffect(Effect.BallShake);
          },
          BALL_LAND + shake * (BALL_SHAKE + BALL_REST),
        );
      }
    }
    // The click of a ball that held, on the beat it stops moving. The
    // fanfare for what is in it comes after, once the answer is said
    if (result === ThrowResult.Caught) {
      setTimeout(
        () => {
          playEffect(Effect.BallClick);
        },
        still ? 0 : BALL_LAND + shakes * (BALL_SHAKE + BALL_REST),
      );
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, held);
    });
  };

  /**
   * The session as the panel shows it, held one beat past the end.
   *
   * Running away empties the prop at once, and the dialog is still on
   * screen for the length of its fade: reading it live blanked the
   * panel and put the heading back to "Encounter" on the way out.
   * `equals: false` because the session is mutated in place, so a
   * nudge has to carry even when the object is the one before
   */
  const session = createMemo<SafariSession<EncounterRecord> | null>(
    (held) => {
      revision();
      return props.session ?? held ?? null;
    },
    null,
    { equals: false },
  );

  // A new encounter starts on a blank dialog.
  //
  // Nothing here belongs to the pokemon standing there now: "Caught!"
  // is about the last one, and so is the treat left in hand and the
  // bag left open. The dialog is not rebuilt between encounters, the
  // same one is handed a new session, so the state it kept was the
  // previous encounter's announced over the next one.
  //
  // On the way in only: clearing as the session goes empties a panel
  // the player is still watching fade
  createEffect(
    on(
      () => props.session,
      (active) => {
        if (active == null) {
          return;
        }
        setNarrated(null);
        setRummaging(false);
        setTreat(null);
        setCaught(null);
        setThrowing(false);
        setRocking(null);
        // Said as the meeting opens rather than only drawn: the
        // sparkles in the title and on the sprite are easy to walk
        // past, and this is the one encounter worth the whole bag
        if (isShiny(active.encounter)) {
          playEffect(Effect.ShinySparkle);
        }
      },
    ),
  );

  // The session tracks the bag only through the persistence layer, so
  // the view keeps its count in step: it is what the throw button
  // counts down and what says there is nothing left to throw
  createEffect(() => {
    const active = props.session;
    const carried = readable(props.bag);

    if (active != null && carried != null) {
      let total = 0;

      for (const entry of carried) {
        if (getBall(entry.item) != null) {
          total += entry.amount;
        }
      }
      active.ballsLeft = total;
      setRevision((value) => value + 1);
    }
  });

  const balls = (): [Balls, number][] => {
    const pairs: [Balls, number][] = [];

    for (const entry of readable(props.bag) ?? []) {
      const ball = getBall(entry.item);

      if (ball != null) {
        pairs.push([ball, entry.amount]);
      }
    }
    return pairs;
  };

  /**
   * How many of it the player is carrying. Zero for something the bag
   * has run out of, which is the number worth showing on the button
   */
  const stockOf = (item: Items): number => {
    for (const entry of readable(props.bag) ?? []) {
      if (entry.item === item) {
        return entry.amount;
      }
    }
    return 0;
  };

  /**
   * Which session has already been handed its ball, so the player's
   * own choice is not snapped back underneath them. The bag is re-read
   * after every throw, and without this the effect below would pick
   * the ball again each time it lands
   */
  let handed: SafariSession<EncounterRecord> | null = null;

  /**
   * What is in hand when a meeting opens.
   *
   * A session opens on the Poke Ball, which is neither necessarily
   * what the player has nor what they were using. Where they still
   * carry the ball they last threw, that is picked up again; failing
   * that the first ball in the bag stands in, so the throw is one they
   * can actually make without going through the bag first.
   *
   * Waits on the bag rather than running as the session arrives: what
   * the player is carrying decides both answers, and it is still being
   * read when the encounter opens
   */
  createEffect(() => {
    const active = props.session;
    const carried = balls();

    if (active == null || carried.length === 0) {
      return;
    }
    if (settings().keepBall && handed !== active) {
      const again = settings().lastBall;

      if (stockOf(BALL_ITEMS[again]) > 0) {
        handed = active;
        active.chooseBall(again);
        setRevision((value) => value + 1);
        return;
      }
    }
    if (stockOf(BALL_ITEMS[active.ball]) > 0) {
      return;
    }
    active.chooseBall(carried[0][0]);
    setRevision((value) => value + 1);
  });

  /**
   * What the throw would send: the treat in hand, or the ball the
   * session is set to
   */
  const inHand = (): Items => treat() ?? BALL_ITEMS[session()?.ball ?? Balls.PokeBall];

  // What each throw came to is narrated in the field's textbox, the
  // way a battle says what just happened
  const settle = (message: string | null): void => {
    setNarrated(message);
    setRevision((value) => value + 1);
  };

  const act = (action: () => Promise<string | null>): void => {
    if (throwing()) {
      return;
    }
    setThrowing(true);
    const asked = props.session;
    action()
      .then((message) => {
        // A late answer belongs to the encounter it was thrown at
        if (props.session === asked) {
          settle(message);
        }
      })
      .catch((failure: unknown) => {
        toast.push({
          message: failure instanceof Error ? failure.message : String(failure),
          tone: 'ember',
        });
      })
      .finally(() => {
        setThrowing(false);
      });
  };

  /**
   * Take one thing out of the bag. A ball becomes the preference the
   * session throws from here on; a treat is only for the next throw
   */
  const take = (item: Items): void => {
    const ball = getBall(item);

    setRummaging(false);
    if (ball == null) {
      setTreat(item);
      return;
    }
    setTreat(null);
    props.session?.chooseBall(ball);
    setRevision((value) => value + 1);
  };

  /**
   * Throw whatever is in hand. A ball is a catch attempt; a treat is
   * fed, and the hand goes back to the ball afterwards — one treat is
   * all the encounter will take before a ball misses
   */
  const hurl = (): void => {
    const thrown = treat();

    act(async () => {
      const active = props.session;

      if (active == null) {
        return null;
      }
      if (thrown != null) {
        const eaten = await feedEncounter(active, thrown);

        setTreat(null);
        if (eaten) {
          props.onSpent(thrown);
        }
        return eaten
          ? `Fed ${describeItem(thrown)}. It is watching you now.`
          : `It would not take the ${describeItem(thrown)}.`;
      }

      const spent = active.ball;
      // The server rolls the throw and writes it down in one call;
      // `throwBall` hands the shakes over as soon as it answers, and
      // what is awaited here is the ball finishing its rocking
      let played: Promise<void> = Promise.resolve();
      const thrownAt = await throwBall(active, (shakes, result) => {
        played = rock(shakes, result);
      });

      await played;
      if (thrownAt != null) {
        props.onSpent(BALL_ITEMS[spent]);
      }
      if (thrownAt == null) {
        setRocking(null);
        return 'No ball of that kind to throw.';
      }
      // A ball that held stays where it stopped. The pokemon is inside
      // it, so putting the sprite back in the field said it had got
      // out, in the same beat as being told it was caught
      if (thrownAt.result !== ThrowResult.Caught) {
        setRocking(null);
      }
      // Said as the ball stops: one sound for it opening again, and
      // another for a pokemon that used the moment to bolt
      if (thrownAt.result === ThrowResult.Caught) {
        playEffect(Effect.CatchSuccess);
        // A species this player never owned is a new line in the dex,
        // said once the fanfare is done. Strictly false, so a dex
        // entry still loading does not count as missing
        if (props.owned.latest === false) {
          playEffectAfter(Effect.DexEntry, Effect.CatchSuccess);
        }
      }
      if (thrownAt.result === ThrowResult.BrokeFree) {
        playEffect(Effect.CatchFailed);
      }
      if (thrownAt.result === ThrowResult.Fled) {
        playEffect(Effect.Flight);
      }
      // Written down whatever the setting says: the record is of what
      // happened, and turning the setting on later should pick up the
      // ball the player was actually using
      setSetting('lastBall', spent);
      // Held onto rather than handed straight up. A ball that holds
      // used to throw the catch sheet over the encounter in the same
      // beat — several screens of detail arriving before the player
      // had seen the ball stop moving. The catch is announced here
      // first, and the sheet is what they press for
      if (thrownAt.catchId != null) {
        setCaught(thrownAt.catchId);
      }
      // What a Pickpocket buddy came away with, said where the flight
      // itself is said: it is the same moment, and the consolation
      // reads as part of it rather than as a second announcement
      // A ball that held on the first shake is the one throw worth
      // saying anything more about than that it worked
      if (thrownAt.critical && thrownAt.result === ThrowResult.Caught) {
        return 'Caught, first shake!';
      }
      if (thrownAt.pocketed != null) {
        return `It fled, and dropped its ${describeItem(thrownAt.pocketed)}.`;
      }
      return THROW_MESSAGES[thrownAt.result];
    });
  };

  /**
   * What is standing there, as the dialog is named after it: the
   * species, the level and — for anything that has one — its gender.
   *
   * That is deliberately all of it. What the sheet would say about a
   * caught pokemon, and what the odds behind the next throw are, is
   * not shown: a player deciding whether this one is worth the balls
   * should be looking at the pokemon rather than at a table. A shiny
   * is still marked, with the same sparkles the box and the sheet mark
   * one by, since the sprite alone leaves it to be noticed
   */
  const met = (): JSX.Element => {
    const active = session();

    if (active == null) {
      return 'Encounter';
    }
    const { encounter } = active;
    // Caught before, the level, the marks, then the name and its gender
    return (
      <span class="inline-flex items-center justify-center gap-1.5">
        {/* Latest rather than read, so the heading never waits on the dex */}
        <Show when={props.owned.latest === true}>
          {/* The ball fills 18 of its 32-pixel cell, so the cell is drawn at 28 to bring
              the ball up to the icons beside it, and pulled in so the line keeps their height */}
          <ItemSprite item={BALL_ITEMS[Balls.PokeBall]} size={28} label="" class="-m-1.5" />
          <span class="sr-only">Caught before</span>
        </Show>
        <span>Lv. {encounter.level}</span>
        <Show when={isShiny(encounter)}>
          {/* The bar's own white rather than gold, which barely shows on
              the blue. The word is what a screen reader hears */}
          <SparklesIcon aria-hidden="true" class="size-4 shrink-0" />
          <span class="sr-only">Shiny</span>
        </Show>
        <Show when={isShadow(encounter)}>
          <FireIcon aria-hidden="true" class="size-4 shrink-0" />
          <span class="sr-only">Shadow</span>
        </Show>
        <span>
          {`${getSpeciesData(encounter.species).name} ${GENDER_MARKS[encounter.gender]}`.trimEnd()}
        </span>
      </span>
    );
  };

  /**
   * Done looking at what was caught: the sheet takes it from here, and
   * the encounter is over either way
   */
  const openSheet = (): void => {
    const id = caught();

    setCaught(null);
    if (id != null) {
      props.onCaught?.(id);
    }
  };

  const leave = (): void => {
    const active = props.session;

    if (throwing()) {
      return;
    }

    if (active != null && active.state === SafariState.Active) {
      active.runAway();
      // The same sound either way: what is left standing there is an
      // empty cell, whoever walked off first
      playEffect(Effect.Flight);
    }
    // What the panel is showing is left alone: it is on screen until
    // the fade is over, and the next encounter blanks it on the way in
    props.onClose();
  };

  /** What the textbox says: the last throw, how it ended, or the question */
  const narration = (): string => {
    const active = session();

    if (active != null && active.state !== SafariState.Active) {
      return STATE_MESSAGES[active.state];
    }
    return narrated() ?? 'What will you do?';
  };

  return (
    <Dialog
      isOpen={props.session != null}
      onClose={leave}
      // A throw in flight is insistent whatever the encounter is: the
      // ball is rocking, the answer is on its way, and leaving mid
      // throw settles the session under it
      insistent={props.insistent === true || throwing()}
      // Named by the box on the field rather than a nameplate: this is
      // a battle screen, and the pokemon's own box is its heading
      quiet
      title={met()}
      description="One encounter, one throw at a time. A treat makes it easier to catch and every
        turn gives it another chance to bolt."
    >
      <Show when={session()}>
        {(held) => {
          // Show only hands on a new object, and the session is mutated
          // in place, so each read also follows the nudge that says it changed
          const active = (): SafariSession<EncounterRecord> => {
            revision();
            return held();
          };

          return (
            <>
              {/* The field: sky over grass, and the pokemon on its base.
                Its height is held whatever stands on it, so a throw
                never moves the controls out from under the finger */}
              <div
                class="relative -mx-4 -mt-4 h-60 overflow-hidden rounded-t-[20px] sm:-mx-5 sm:-mt-5"
                style={{
                  background:
                    'linear-gradient(var(--field-sky), var(--field-haze) 55%, var(--field-grass) 55%, var(--field-grass-deep))',
                }}
              >
                <span
                  aria-hidden="true"
                  class="absolute bottom-8 left-1/2 h-9 w-40 -translate-x-1/2 rounded-[50%]
                  shadow-[inset_0_-5px_0_rgb(0_0_0/0.15)]"
                  style={{ background: 'var(--field-base)' }}
                />
                {/* The pokemon's box, the way a battle names who is standing there */}
                <div
                  class="absolute top-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-col gap-1
                  rounded-xl border-2 border-line bg-paper px-2.5 py-1.5 text-sm font-extrabold
                  shadow-pop"
                >
                  {met()}
                  <Show
                    when={
                      (props.revealsHeld === true && active().encounter.items.length > 0) ||
                      props.revealsFlight === true ||
                      props.revealsAbility === true
                    }
                  >
                    <span class="flex flex-wrap gap-1">
                      <Show when={props.revealsHeld === true}>
                        <For each={active().encounter.items}>
                          {(item) => (
                            <Badge tone="tide">
                              <ItemSprite item={item} size={HELD_SPRITE} label="" />
                              {describeItem(item)}
                            </Badge>
                          )}
                        </For>
                      </Show>
                      {/* What a Forewarn buddy passes on: how ready it is to be gone */}
                      <Show when={props.revealsFlight === true}>
                        <Badge tone="ember">{describeFlight(active().getFleeChance())}</Badge>
                      </Show>
                      {/* And what a Trace buddy reads off it */}
                      <Show when={props.revealsAbility === true}>
                        <Badge tone="leaf">{describeAbility(active().encounter.ability)}</Badge>
                      </Show>
                    </span>
                  </Show>
                </div>
                <div class="absolute inset-x-0 top-4 bottom-12 flex items-end justify-center">
                  {/* The ball stands where the pokemon did while it rocks:
                    what is inside the ball is not also in the field */}
                  <Show
                    when={rocking() != null}
                    fallback={
                      // Fitted to a square as tall as the field, as the catch
                      // sheet does, so a tall species shrinks rather than crops
                      <div class="relative flex aspect-square h-full max-w-full items-end justify-center">
                        <AnimatedSprite
                          species={active().encounter.species}
                          shiny={isShiny(active().encounter)}
                          female={active().encounter.gender === Genders.Female}
                          sparkle={isShiny(active().encounter)}
                          aura={isShadow(active().encounter) ? 'shadow' : undefined}
                          animation={SpriteAnim.Idle}
                          direction="Down"
                          fill
                          sized
                          label={`${getSpeciesData(active().encounter.species).name}, standing in front of you`}
                        />
                      </div>
                    }
                  >
                    <span
                      class="block pb-2"
                      style={{ animation: `ball-land ${BALL_LAND}ms ease-out both` }}
                    >
                      <span
                        class="block"
                        style={{
                          animation: `ball-shake ${BALL_SHAKE + BALL_REST}ms ease-in-out ${BALL_LAND}ms ${rocking() ?? 0} both`,
                        }}
                      >
                        <ItemSprite
                          item={BALL_ITEMS[active().ball]}
                          size={BALL_SPRITE}
                          label={
                            active().state === SafariState.Caught
                              ? 'The ball holds'
                              : 'The ball rocks'
                          }
                        />
                      </span>
                    </span>
                  </Show>
                </div>
              </div>

              {/* The textbox: what happened, said where the player is looking */}
              <p
                class="relative z-10 -mt-7 mb-0 rounded-xl border-2 border-line bg-paper px-3 py-2
                text-sm font-bold shadow-pop"
                role="status"
              >
                {narration()}
              </p>
              <Status message={failed(props.bag)} />

              <Show
                when={active().state === SafariState.Active}
                fallback={
                  <div class="grid grid-cols-2 gap-2">
                    <Show
                      when={caught()}
                      fallback={
                        <button type="button" class={`${TILE} col-span-2`} onClick={leave}>
                          Walk on
                        </button>
                      }
                    >
                      <button type="button" class={TILE} onClick={leave}>
                        Walk on
                      </button>
                      <button type="button" class={`${TILE} ${TILE_PRIMARY}`} onClick={openSheet}>
                        Have a look
                      </button>
                    </Show>
                  </div>
                }
              >
                <Show
                  when={rummaging()}
                  fallback={
                    // The command menu: the way out on the left, as a dock has it, then the throw and the bag
                    <div class="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
                      <button
                        type="button"
                        class={`${TILE} text-ember-dark`}
                        disabled={throwing()}
                        onClick={leave}
                      >
                        <ArrowLeftIcon class="size-5" aria-hidden="true" />
                        Run
                        <span class={TILE_NOTE}>Walk away</span>
                      </button>
                      {/* The ball in hand is the label: it is the one thing
                        checked between every throw */}
                      <button
                        type="button"
                        class={`${TILE} ${TILE_PRIMARY}`}
                        disabled={throwing() || stockOf(inHand()) === 0}
                        aria-label={`Throw ${describeItem(inHand())}, ${stockOf(inHand())} left`}
                        onClick={hurl}
                      >
                        <ItemSprite item={inHand()} size={THROW_SPRITE} label="" class="-my-1" />
                        Throw
                        <span class={`${TILE_NOTE} text-on-accent/85`}>
                          {describeItem(inHand())} × {stockOf(inHand())}
                        </span>
                      </button>
                      <button
                        type="button"
                        class={TILE}
                        disabled={throwing()}
                        onClick={() => {
                          setRummaging(true);
                        }}
                      >
                        <BagIcon class="size-5" aria-hidden="true" />
                        Bag
                        <span class={TILE_NOTE}>Balls, treats</span>
                      </button>
                    </div>
                  }
                >
                  {/* Balls and treats only, and no treat while it is
                    still chewing the last one */}
                  <InventoryPicker
                    inline
                    player={props.user.uid}
                    value={inHand()}
                    empty="Nothing in the bag to throw."
                    filter={(entry) =>
                      getBall(entry.item) != null || (isTreat(entry.item) && active().canFeed())
                    }
                    entries={readable(props.bag)}
                    onPick={(item) => {
                      if (item != null) {
                        take(item);
                      }
                    }}
                  />
                  <button
                    type="button"
                    class={TILE}
                    onClick={() => {
                      setRummaging(false);
                    }}
                  >
                    Never mind
                  </button>
                </Show>
              </Show>
            </>
          );
        }}
      </Show>
    </Dialog>
  );
}

/**
 * One safari encounter. The bag is read one component down, under
 * this boundary: a throw spends from it and re-reads it, and that
 * read must not reach the page the world is drawn on
 */
export default function SafariDialog(props: SafariDialogProps): JSX.Element {
  // Read once per opened session. A throw or a treat spends exactly
  // one of what was used, so the count is taken down here rather than
  // the whole bag read again after every action
  const [bag, { mutate }] = createResource(
    () => (props.session == null ? null : props.user.uid),
    getInventory,
  );
  // A shiny counts as caught only once a shiny of the species has been:
  // owning the plain one says nothing about the sparkling one
  const [owned] = createResource(
    () =>
      props.session == null
        ? null
        : ([
            props.user.uid,
            props.session.encounter.species,
            isShiny(props.session.encounter),
          ] as const),
    async ([uid, species, shiny]) => {
      const entry = await getSpeciesDexEntry(uid, species);

      return shiny ? entry.shiny : entry.owned;
    },
  );

  return (
    <Suspense>
      <SafariBody
        {...props}
        bag={bag}
        owned={owned}
        onSpent={(item) => {
          mutate((carried) => {
            const left: InventoryEntry[] = [];

            for (const entry of carried ?? []) {
              if (entry.item !== item) {
                left.push(entry);
              } else if (entry.amount > 1) {
                left.push({ ...entry, amount: entry.amount - 1 });
              }
            }
            return left;
          });
        }}
      />
    </Suspense>
  );
}
