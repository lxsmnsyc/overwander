import { type JSX, Show, createEffect, createResource, createSignal, on } from 'solid-js';
import type { User } from 'firebase/auth';
import { getInventory } from '../auth/inventory';
import type { EncounterRecord } from '../auth/encounter-record';
import { feedEncounter, throwBall } from '../auth/safari';
import { BALL_ITEMS, Balls, type Items } from '../data/ids/items';
import { Genders } from '../data/ids/species';
import { isShiny } from '../auth/caught-record';
import { getSpeciesData } from '../data/species';
import type SafariSession from '../overworld/safari';
import { FEED_CATCH_BONUS, SafariState, ThrowResult } from '../overworld/safari';
import InventoryPicker, { describeItem } from './InventoryPicker';
import ItemSprite from './ItemSprite';
import SpriteDisplay from './SpriteDisplay';
import { Button, Dialog, DialogActions, Status } from './styled';

/**
 * The ball a carried item stands for, so the bag can be filtered
 * down to what is throwable
 */
const BALLS_BY_ITEM = new Map<Items, Balls>(
  Object.entries(BALL_ITEMS).map(([ball, item]) => [item, Number(ball)]),
);

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

const STATE_MESSAGES: Record<SafariState, string> = {
  [SafariState.Active]: '',
  [SafariState.Caught]: 'Caught — it is yours.',
  [SafariState.Fled]: 'It fled; this one will not show up again.',
  [SafariState.Exited]: 'You walked away.',
};

export interface SafariDialogProps {
  user: User;
  /**
   * The open session, or null when no encounter is being met
   */
  session: SafariSession<EncounterRecord> | null;
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
export default function SafariDialog(props: SafariDialogProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
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
  // Read once per opened session: throwing and feeding both spend
  // from the bag, so it is refetched after each action
  const [bag, { refetch }] = createResource(
    () => (props.session == null ? null : props.user.uid),
    getInventory,
  );
  // The session mutates in place, so the view needs a nudge after
  // every action to re-read its state, turn count and bonus
  const [revision, setRevision] = createSignal(0);

  const session = (): SafariSession<EncounterRecord> | null => {
    revision();
    return props.session;
  };

  // A new encounter starts on a blank dialog.
  //
  // Nothing here belongs to the pokemon standing there now: "Caught!"
  // is about the last one, and so is the treat left in hand and the
  // bag left open. The dialog is not rebuilt between encounters — the
  // same one is handed a new session — so the state it kept was the
  // previous encounter's, announced over the next one
  createEffect(
    on(
      () => props.session,
      () => {
        setStatus(null);
        setRummaging(false);
        setTreat(null);
        setCaught(null);
      },
    ),
  );

  // The session tracks the bag only through the persistence layer,
  // so the view keeps its count in step — that is what makes the
  // last-ball pity visible before the throw
  createEffect(() => {
    const active = props.session;
    const carried = bag();

    if (active != null && carried != null) {
      active.ballsLeft = carried
        .filter((entry) => BALLS_BY_ITEM.has(entry.item))
        .reduce((total, entry) => total + entry.amount, 0);
      setRevision((value) => value + 1);
    }
  });

  const balls = (): [Balls, number][] =>
    (bag() ?? [])
      .map((entry): [Balls | undefined, number] => [BALLS_BY_ITEM.get(entry.item), entry.amount])
      .filter((pair): pair is [Balls, number] => pair[0] != null);

  /**
   * How many of it the player is carrying. Zero for something the bag
   * has run out of, which is the number worth showing on the button
   */
  const stockOf = (item: Items): number =>
    (bag() ?? []).find((entry) => entry.item === item)?.amount ?? 0;

  // A session opens on the Poke Ball, which is not necessarily what
  // the player has. The first ball in the bag stands in, so the throw
  // is one the player can actually make without going through it
  createEffect(() => {
    const active = props.session;
    const carried = balls();

    if (active == null || carried.length === 0 || stockOf(BALL_ITEMS[active.ball]) > 0) {
      return;
    }
    active.chooseBall(carried[0][0]);
    setRevision((value) => value + 1);
  });

  /**
   * What the throw would send: the treat in hand, or the ball the
   * session is set to
   */
  const inHand = (): Items => treat() ?? BALL_ITEMS[props.session?.ball ?? Balls.PokeBall];

  const settle = async (message: string | null): Promise<void> => {
    setStatus(message);
    setRevision((value) => value + 1);
    await refetch();
  };

  const act = (action: () => Promise<string | null>): void => {
    action()
      .then(settle)
      .catch((failure: unknown) => {
        setStatus(failure instanceof Error ? failure.message : String(failure));
      });
  };

  /**
   * Take one thing out of the bag. A ball becomes the preference the
   * session throws from here on; a treat is only for the next throw
   */
  const take = (item: Items): void => {
    const ball = BALLS_BY_ITEM.get(item);

    setRummaging(false);
    setStatus(null);
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
        const eaten = await feedEncounter(props.user, active, thrown);

        setTreat(null);
        return eaten
          ? `Fed ${describeItem(thrown)}. It is watching you now.`
          : `It would not take the ${describeItem(thrown)}.`;
      }

      const thrownAt = await throwBall(props.user, active);

      if (thrownAt == null) {
        return 'No ball of that kind to throw.';
      }
      // Held onto rather than handed straight up. A ball that holds
      // used to throw the catch sheet over the encounter in the same
      // beat — several screens of detail arriving before the player
      // had seen the ball stop moving. The catch is announced here
      // first, and the sheet is what they press for
      if (thrownAt.catchId != null) {
        setCaught(thrownAt.catchId);
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
   * is still marked, since the sprite is already sparkling and
   * pretending otherwise would only be coy
   */
  const met = (): string => {
    const active = props.session;

    if (active == null) {
      return 'Encounter';
    }
    const { encounter } = active;

    // The level first, then what it is, then the one mark for its
    // gender — the order the catch sheet and the field readout say it
    // in. Read as a phrase rather than as a row of facts separated by
    // dots, which is what a name is
    return `Lv. ${encounter.level} ${isShiny(encounter) ? '✦ ' : ''}${
      getSpeciesData(encounter.species).name
    } ${GENDER_MARKS[encounter.gender]}`.trimEnd();
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

    if (active != null && active.state === SafariState.Active) {
      active.runAway();
    }
    setStatus(null);
    setRummaging(false);
    setTreat(null);
    setCaught(null);
    props.onClose();
  };

  return (
    <Dialog
      isOpen={props.session != null}
      onClose={leave}
      title={met()}
      terse
      description="One encounter, one throw at a time. A treat makes it easier to catch and every
        turn gives it another chance to bolt."
    >
      <Show when={session()}>
        {(active) => (
          <>
            {/* The middle of the dialog is the pokemon itself — or the
                bag, while the player is going through it. Both stand
                in the same space, so opening the bag does not move the
                buttons under the cursor */}
            <Show
              when={rummaging() && active().state === SafariState.Active}
              fallback={
                <div class="flex min-h-52 items-center justify-center">
                  <SpriteDisplay
                    species={active().encounter.species}
                    shiny={isShiny(active().encounter)}
                    animation="Idle"
                    direction="Down"
                    scale={4}
                    label={`${getSpeciesData(active().encounter.species).name}, standing in front of you`}
                  />
                </div>
              }
            >
              {/* Balls and treats only. Everything else in the bag is
                  for somewhere that is not standing in front of a wild
                  pokemon — and a treat is left out entirely while the
                  encounter is still chewing the last one */}
              <InventoryPicker
                inline
                player={props.user.uid}
                value={inHand()}
                verb="Take out"
                empty="Nothing in the bag to throw."
                filter={(entry) =>
                  BALLS_BY_ITEM.has(entry.item) || (isTreat(entry.item) && active().canFeed())
                }
                note={(entry) =>
                  BALLS_BY_ITEM.has(entry.item) ? 'a ball' : 'a treat — fed, not thrown'
                }
                entries={bag()}
                onPick={(item) => {
                  if (item != null) {
                    take(item);
                  }
                }}
              />
            </Show>

            <Show when={active().state !== SafariState.Active}>
              <p class="text-center text-lg font-semibold" role="status">
                {STATE_MESSAGES[active().state]}
              </p>
            </Show>
            {/* What is in hand says the rest: the throw button names
                it, the badge beside it counts what is left, and a
                treat that would catch nothing is a treat the player
                chose to take out */}
            <Status message={status()} />
          </>
        )}
      </Show>

      {/* Items, throw, run away: what the player is reaching for most
          often sits nearest the way out */}
      <DialogActions center>
        <Show when={session()?.state === SafariState.Active}>
          <Show
            when={rummaging()}
            fallback={
              <>
                <Button
                  onClick={() => {
                    setStatus(null);
                    setRummaging(true);
                  }}
                >
                  Items
                </Button>
                {/* What is being thrown and how many are left are one
                    thing to read, so they are one thing to look at */}
                {/* The ball, drawn on the button that throws it. What
                    is in hand is the one thing on this screen a player
                    checks between every throw, and a picture of a
                    Great Ball is read faster than the words */}
                <Button tone="primary" disabled={stockOf(inHand()) === 0} onClick={hurl}>
                  <ItemSprite item={inHand()} size={20} label="" />
                  Throw {describeItem(inHand())} × {stockOf(inHand())}
                </Button>
              </>
            }
          >
            <Button
              onClick={() => {
                setRummaging(false);
              }}
            >
              Never mind
            </Button>
          </Show>
        </Show>
        {/* What was caught is the one thing worth pressing once the
            ball has held. It is offered rather than opened: a sheet
            that arrives on its own lands before the player has taken
            in that they caught anything */}
        <Show when={caught()}>
          <Button tone="primary" onClick={openSheet}>
            Have a look
          </Button>
        </Show>
        <Button tone={session()?.state === SafariState.Active ? 'danger' : 'ghost'} onClick={leave}>
          {session()?.state === SafariState.Active ? 'Run away' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
