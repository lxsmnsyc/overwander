import { STAT_LABELS, describeIVs, isHoldable, withArticle } from './describe';
import BattleSection from './sections/BattleSection';
import EvolutionSection from './sections/EvolutionSection';
import HistorySection from './sections/HistorySection';
import PortraitSection from './sections/PortraitSection';
import StatsSection from './sections/StatsSection';
import { isAuctionableCatch } from '../../../auth/auctions';
import useBall from '../../../auth/balls';
import useBottleCap from '../../../auth/bottle-caps';
import { setBuddy } from '../../../auth/buddy';
import { getCandyCost, getCatchCandy, useCandy, useRareCandy } from '../../../auth/candy';
import {
  type CaughtPokemon,
  giveItem,
  isFavorite,
  isGuarded,
  releaseCatch,
  setFavorite,
  setGuarded,
  setNickname,
  takeItem,
} from '../../../auth/caught';
import {
  NICKNAME_LIMIT,
  asNickname,
  getCatchName,
  getMovePoints,
  isShadow,
  isShiny,
} from '../../../auth/caught-record';
import { useAuth } from '../../../auth/context';

import { canHatch, isEgg } from '../../../auth/egg';
import { hatchEgg } from '../../../auth/eggs';
import { type EvolutionOption, evolveCatch } from '../../../auth/evolution';
import useHealingItem from '../../../auth/healing';
import { type HealthState, healedByItem } from '../../../auth/health';
import type { InventoryEntry } from '../../../auth/inventory';
import { learnLevelUpMove } from '../../../auth/moves';
import type { PokedexView } from '../../../auth/pokedex';
import usePurifyingGem from '../../../auth/purify';
import {
  type TrainingResult,
  feedEffortBerry,
  trainEffort,
  useEffortItem,
} from '../../../auth/training';

import { MAX_LEVEL } from '../../../data/constants/levels';

import type { Stats } from '../../../data/constants/stats';
import { Items, getBall, getMachineMove, isMachineItem } from '../../../data/ids/items';
import type { Moves } from '../../../data/ids/moves';
import { NATURE_NAMES } from '../../../data/ids/natures';
import type { Species } from '../../../data/ids/species';

import { BERRY_EFFORT_DROPS } from '../../../data/items/berries';
import { isBottleCap, isPerfectIVs } from '../../../data/items/bottle-caps';
import { isHerbal } from '../../../data/items/medicine';
import { isPurifyingGem } from '../../../data/items/purifying-gem';
import { isPPItem, isVitamin } from '../../../data/items/vitamins';
import { isWing } from '../../../data/items/wings';
import { PP_UP_LIMIT } from '../../../data/moves';
import { isPreciousItem } from '../../../data/overworld/item-pool';
import { getFamilyName, getMovesLearnedAt, getSpeciesData } from '../../../data/species';

import { ActionsIcon, LockIcon, StarIcon } from '../../icons';
import InventoryPicker from '../../items/InventoryPicker';

import { describeItem } from '../../items/ItemGrid';

import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogSection,
  Field,
  Menu,
  type MenuAction,
  Meta,
  Note,
  Row,
  StepButton,
  type ToastTone,
  useToast,
} from '../../styled';
import IncreasePPDialog from '../IncreasePPDialog';
import TeachMoveDialog from '../TeachMoveDialog';

import { type JSX, type Resource, Show, createEffect, createSignal } from 'solid-js';

/**
 * Re-exported from where the battle card reads them too: an ability on
 * a sheet and one on a card are named the same way
 */

export interface CatchDialogProps {
  /**
   * The player the catch is being viewed under; a catch owned by
   * anyone else is treated as absent
   */
  player: string;
  /**
   * The catch to show, or null when the dialog is closed
   */
  catchId: string | null;
  onClose: () => void;
  /**
   * Fired when the catch changed (an evolution landed), so the list
   * behind the dialog can refresh
   */
  onChange?: () => void;
  /**
   * Open the listing dialog for this pokemon. The menu's Auction entry
   * is left out entirely when nobody is listening, since a sheet with
   * a dead button on it is worse than one without the button
   */
  onAuction?: (catchId: string) => void;
  /**
   * Open somebody's profile, from the ownership history.
   *
   * A pokemon that has passed through other hands is the one place in
   * the game where a player meets a trainer they have never traded a
   * word with, and the answer to "who had this before me" is the
   * profile they already have. Absent where there is nowhere to open
   * one, which leaves the names as plain text
   */
  onTrainer?: (uid: string) => void;
  /**
   * Show the record and offer nothing.
   *
   * It is for looking at a pokemon that is not the reader's: an
   * auction lot, and a trade when there is one. Two things change.
   * The owner check is dropped — a lot in escrow is owned by nobody,
   * so requiring a match would show an empty dialog — and every
   * section that writes is left out, which is the same switch the
   * dialog already throws for a catch belonging to somebody else.
   *
   * Nothing here is a permission: the server refuses all of it anyway.
   * This is so the buttons are not offered in the first place
   */
  readOnly?: boolean;
  /**
   * Something out of the bag to spend on this pokemon the moment the
   * sheet opens. It is how the bag uses an item: the item is chosen
   * first and the pokemon second, which is the way round the sheet
   * cannot ask it
   */
  useItem?: Items | null;
  /**
   * Open a different one of the player's pokemon — the one before this
   * in the box, or the one after.
   *
   * Absent for a sheet that is not one of a run: a lot on the block is
   * a pokemon somebody is looking at rather than a page of their own
   * collection, and there is nothing either side of it to step to
   */
  onCatch?: (catchId: string) => void;
}

/**
 * One catch in full, shown over the list it was opened from
 */
/**
 * The sheet itself, which is where every one of these is read.
 *
 * A read in the body that declared it lands on the boundary around
 * the page rather than on the dialog panel's own, so all ten of them
 * are read here, one component below where they are asked for
 */
export function CatchSheetBody(
  props: CatchDialogProps & {
    detail: Resource<{ id: string; caught: CaughtPokemon | null }>;
    siblings: Resource<string[]>;
    owners: Resource<Map<string, string>>;
    dex: Resource<PokedexView>;
    evolutions: Resource<EvolutionOption[]>;
    fighting: Resource<boolean>;
    onlyOne: Resource<boolean>;
    selling: Resource<boolean>;
    candies: Resource<number>;
    bag: Resource<InventoryEntry[]>;
    buddy: Resource<string | null>;
    onRecordChanged: () => void;
    onBagChanged: () => void;
    onBuddyChanged: () => void;
    onCandiesChanged: () => void;
    onEvolutionsChanged: () => void;
  },
): JSX.Element {
  const auth = useAuth();
  const toast = useToast();

  /**
   * What an action has to say for itself. It is said in the corner
   * rather than at the foot of the sheet: the sheet is a long column,
   * and a line under the bottom of it is a line nobody scrolled to
   */
  const say = (message: string, tone: ToastTone = 'neutral'): void => {
    toast.push({ message, tone });
  };

  const view = (): CaughtPokemon | null => {
    // `latest` rather than the resource itself: everything on this
    // sheet that writes re-reads the record afterwards, and a read that
    // suspends unmounts the panel — and, through the boundary the page
    // is under, the page behind it. Keeping the last record on screen
    // while the next one arrives is what makes a favorite land without
    // the screen blinking. It is only kept while it is about the
    // pokemon being looked at
    const held = props.detail.latest;
    const loaded = held?.id === props.catchId ? held.caught : null;

    if (loaded == null) {
      return null;
    }
    // A catch belongs to exactly one player; one opened under
    // someone else's list is a wrong address, not a peek. Looking at
    // one on the block is the exception: it is owned by nobody while
    // it is there, and being able to look is the point of a board
    return props.readOnly === true || loaded.owner === props.player ? loaded : null;
  };

  /**
   * The catch either side of this one, or null at the ends of the box.
   * The ends are ends rather than a loop: somebody stepping through
   * three hundred pokemon should stop at the last one instead of
   * quietly starting again
   */
  const neighbour = (step: number): string | null => {
    const listed = props.siblings();
    const catchId = props.catchId;

    if (listed == null || catchId == null) {
      return null;
    }

    const at = listed.indexOf(catchId);
    const wanted = at + step;

    return at < 0 || wanted < 0 || wanted >= listed.length ? null : listed[wanted];
  };

  const walk = (step: number): (() => void) | undefined => {
    const next = neighbour(step);
    const open = props.onCatch;

    if (next == null || open == null) {
      return undefined;
    }
    return () => {
      open(next);
    };
  };

  /**
   * Evolutions are only offered to the owner: they depend on what
   * the signed-in player carries, and only they can act on them
   */
  const owned = (): string | null => {
    const user = auth.user();

    if (props.readOnly === true) {
      return null;
    }
    return user != null && user.uid === props.player ? user.uid : null;
  };

  /**
   * Who an entry names. The player reading it is "you" rather than
   * their own nickname, and a trainer whose profile has gone is still
   * somebody — an owner is a fact about the pokemon, so a missing
   * profile must not take the entry off the list
   */
  const describeOwner = (entry: { owner: string; name?: string }): string => {
    if (entry.owner === auth.user()?.uid) {
      return 'You';
    }
    // A distributed pokemon names the trainer it came from, who has no
    // account to look up — so what the record says is what it is called
    return props.owners.latest?.get(entry.owner) ?? entry.name ?? 'A trainer';
  };

  /**
   * Whether the reader has met this species at all, and whether they
   * have owned one. A dex that has not arrived yet answers "no" to
   * both, which draws the shadow — a sheet that flashed the full
   * picture and then hid it would be worse than one that fills in
   */
  const dexKnows = (species: Species): { met: boolean; owned: boolean } => {
    const entry = props.dex();

    return {
      met: entry?.seen.some((tally) => tally.species === species) === true,
      owned: entry?.caught.some((tally) => tally.species === species) === true,
    };
  };

  /**
   * Whether the record is being held as it is, for either of the two
   * reasons there are: a live battle is running on a copy of it, or
   * the player has locked it themselves. Everything that would rewrite
   * the sheet asks this. What the lock leaves alone — walking with it,
   * grooming it, the two keeping buttons themselves — asks only
   * whether it is fighting
   */
  const frozen = (): boolean => {
    const loaded = view();

    return props.fighting.latest === true || (loaded != null && isGuarded(loaded));
  };

  /**
   * A move about to be learned, and where it came from. The dialog it
   * opens decides whether anything is forgotten for it; what differs
   * between a machine and a level is only what it costs.
   *
   * `rest` is the queue behind it. A level can offer more than one
   * move at once — plenty of species learn two at level 1 — and each
   * is its own question, asked one after the other
   */
  interface Teaching {
    move: Moves;
    rest: Moves[];
    /**
     * Grown into rather than taught: the candy already paid for it
     */
    levelled: boolean;
  }

  const [teaching, setTeaching] = createSignal<Teaching | null>(null);
  /**
   * The PP Up or PP Max waiting on a move to be spent on. Like a
   * machine, the bottle is picked in the bag and asked about here —
   * and unlike everything else in the bag, it is not spent until the
   * question is answered
   */
  const [bottle, setBottle] = createSignal<Items | null>(null);

  /**
   * Move on to the next thing the level offered, or close the dialog
   * when that was the last of them
   */
  const nextTeaching = (): void => {
    const current = teaching();
    const queued = current?.rest ?? [];

    setTeaching(
      current == null || queued.length === 0
        ? null
        : { ...current, move: queued[0], rest: queued.slice(1) },
    );
  };

  /**
   * Ask about whatever the level it just reached has to offer.
   *
   * It is the species' list for **that level exactly** — a move from
   * any earlier one is the Move Reminder's trade and costs a Heart
   * Scale — minus anything it knows already, since a candy spent
   * bringing a pokemon back to a level it has been at before should
   * not offer the same move twice.
   *
   * Saying no is allowed and costs nothing. It is only final once the
   * next candy takes the pokemon past the level
   */
  const offerLevelMoves = (level: number): void => {
    const caught = view();

    if (caught == null || isEgg(caught)) {
      return;
    }

    const knows = new Set(caught.moves);
    const learning = getMovesLearnedAt(caught.species, level).filter(
      (learned) => !knows.has(learned),
    );

    if (learning.length > 0) {
      setTeaching({ move: learning[0], rest: learning.slice(1), levelled: true });
    }
  };

  const feedCandy = (): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    useCandy(catchId)
      .then((level) => {
        say(level == null ? 'That candy could not be used.' : `Grew to level ${level}.`);
        props.onRecordChanged();
        props.onCandiesChanged();
        props.onEvolutionsChanged();
        props.onChange?.();

        if (level != null) {
          offerLevelMoves(level);
        }
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * The universal candy, spent out of the bag rather than from the
   * family's stack: same level, same level-move offer afterwards
   */
  const feedRareCandy = (): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    useRareCandy(catchId)
      .then((level) => {
        say(level == null ? 'That candy could not be used.' : `Grew to level ${level}.`);
        props.onRecordChanged();
        props.onBagChanged();
        props.onEvolutionsChanged();
        props.onChange?.();

        if (level != null) {
          offerLevelMoves(level);
        }
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * What the dialog is called: what its owner calls it, which is the
   * species' own name until somebody names it otherwise.
   *
   * An egg gives away nothing about what is inside it — not the
   * species, not the name, not even whether it sparkles — and a record
   * still being read gives away nothing at all, but the dialog is
   * named either way rather than opening unnamed
   */
  const named = (): string => {
    const loaded = view();

    if (loaded == null) {
      return 'Catch';
    }
    if (isEgg(loaded)) {
      return 'Egg';
    }
    return `${isShiny(loaded) ? '✦ ' : ''}${getCatchName(loaded)}`;
  };

  /**
   * What in the bag could be handed over. The button that opens the
   * bag asks this rather than opening onto an empty list
   */
  const holdables = (): InventoryEntry[] =>
    (props.bag.latest ?? []).filter((entry) => isHoldable(entry.item));

  /**
   * Whether the item would do this pokemon some good — a berry, a
   * potion, a cure, a revive. The rules decide: an item that would
   * change nothing about this pokemon is not offered, because using it
   * would spend it
   */
  const isRemedy = (item: Items): boolean => {
    const caught = view();

    return caught != null && healedByItem(caught, item) != null;
  };

  const moveItem = (item: Items, give: boolean): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    (give ? giveItem(catchId, item) : takeItem(catchId, item))
      .then((moved) => {
        say(
          moved
            ? `${describeItem(item)} ${give ? 'handed over' : 'taken back'}.`
            : `${describeItem(item)} could not be ${give ? 'handed over' : 'taken back'}.`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onEvolutionsChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  const heal = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    useHealingItem(catchId, item)
      .then((state: HealthState | null) => {
        say(
          state == null
            ? `${describeItem(item)} would do nothing for it.`
            : // Herbal medicine is swallowed, and the pokemon holds it
              // against whoever handed it over
              `${describeItem(item)} used — ${state.health} HP.${
                isHerbal(item) ? ' It did not enjoy that.' : ''
              }`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * Everything that moves a pokemon's training lands the same way:
   * the server decides it against the stored record and hands back
   * what the pokemon now has, and the sheet re-reads rather than
   * trusting its own arithmetic
   */
  const settleTraining = (
    running: Promise<TrainingResult | null>,
    refused: string,
    landed: (result: TrainingResult) => string,
  ): void => {
    running
      .then((result) => {
        say(result == null ? refused : landed(result));
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((thrown: unknown) => {
        say(thrown instanceof Error ? thrown.message : String(thrown), 'ember');
      });
  };

  const train = (stat: Stats, amount: number): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    settleTraining(
      trainEffort(catchId, stat, amount),
      'Those points could not be moved.',
      (result) =>
        `${STAT_LABELS[stat]} trained to ${result.effortValues[stat]} — ${result.unused} left to spend.`,
    );
  };

  /**
   * Whether the item is one that grants effort: a wing found on the
   * ground, or a vitamin bought off a shelf
   */
  const isEffortItem = (item: Items): boolean => isWing(item) || isVitamin(item);

  const trainWithItem = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    settleTraining(
      useEffortItem(catchId, item),
      `${describeItem(item)} could not be used.`,
      () => `${describeItem(item)} — points it did not have to earn.`,
    );
  };

  const feedBitterBerry = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    settleTraining(
      feedEffortBerry(catchId, item),
      `${describeItem(item)} could not be fed.`,
      (result) =>
        `Bitter, and good for it — ${result.unused} points back to spend, and it thinks the better of you.`,
    );
  };

  const purify = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    usePurifyingGem(catchId, item)
      .then((ivs) => {
        say(
          ivs == null
            ? `${describeItem(item)} could not be used.`
            : `The shadow is gone — ${describeIVs(ivs)}.`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  const polish = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    useBottleCap(catchId, item)
      .then((ivs) => {
        say(
          ivs == null
            ? `${describeItem(item)} could not be used.`
            : `${describeItem(item)} polished it — ${describeIVs(ivs)}.`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * Put it in the ball that was just spent on it. The history is not
   * touched: what each owner received it in is a fact about the
   * handover, not about the ball it sits in today
   */
  const reball = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    useBall(catchId, item)
      .then((ball) => {
        say(
          ball == null
            ? `${describeItem(item)} could not be used.`
            : `It is in ${withArticle(describeItem(item))} now.`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  const takeAlong = (): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setBuddy(uid, catchId)
      .then((set) => {
        say(set ? 'Walking with you now.' : 'That one cannot come along.');
        props.onBuddyChanged();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  const hatch = (): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    hatchEgg(catchId)
      .then((species) => {
        say(
          species == null
            ? 'It is not ready yet.'
            : `It hatched into ${getSpeciesData(species).name}!`,
        );
        props.onRecordChanged();
        props.onCandiesChanged();
        props.onEvolutionsChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  const evolve = (into: Species): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    evolveCatch(catchId, into)
      .then((species) => {
        say(species == null ? 'That evolution is no longer available.' : 'Evolution complete.');
        props.onRecordChanged();
        props.onEvolutionsChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * Mark it as one to keep, or put it away. Both are one field on the
   * record and both are the player's own doing, so they are settled
   * the same way: write, re-read, say what happened
   */
  const mark = (setting: Promise<boolean | null>, said: string, refused: string): void => {
    setting
      .then((marked) => {
        say(marked == null ? refused : said);
        props.onRecordChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * The name being typed, or null while nothing is being named. It is
   * a draft rather than the record: a player half-way through a name
   * has not renamed anything yet
   */
  const [naming, setNaming] = createSignal<string | null>(null);
  const [renaming, setRenaming] = createSignal(false);

  /**
   * What the draft will actually be stored as. The field is left
   * alone while it is being typed — cleaning every keystroke makes a
   * space impossible to type, since the trim eats it before the next
   * letter arrives — so the cleaned name is shown under it instead
   */
  const drafted = (): string => asNickname(naming() ?? '');

  /**
   * What the box will have done, said before it does it: the cleaned
   * name, or the species it goes back to when the box is left empty
   */
  const describeDraft = (): string => {
    const loaded = view();

    if (drafted() !== '') {
      return `It will be called ${drafted()}.`;
    }
    return loaded == null
      ? 'It will go back to being called by its species.'
      : `It will go back to being called ${getSpeciesData(loaded.species).name}.`;
  };

  const rename = (): void => {
    const catchId = props.catchId;
    const draft = naming();

    if (owned() == null || catchId == null || draft == null) {
      return;
    }
    setRenaming(true);
    setNickname(catchId, draft)
      .then((given) => {
        setRenaming(false);

        if (given == null) {
          say('That name could not be given.', 'ember');
          return;
        }
        setNaming(null);
        say(given === '' ? 'Its name is its own again.' : `It answers to ${given} now.`);
        props.onRecordChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setRenaming(false);
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  const favorite = (on: boolean): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    mark(
      setFavorite(catchId, on),
      on ? 'Kept — it cannot be released, auctioned or traded.' : 'No longer a favorite.',
      'That could not be changed.',
    );
  };

  const guard = (on: boolean): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    mark(
      setGuarded(catchId, on),
      on ? 'Locked — it will be left alone.' : 'Unlocked.',
      'That could not be changed.',
    );
  };

  /**
   * Whether the release button has been pressed once. Letting a
   * pokemon go cannot be undone, so it takes two presses and the
   * second one says what it is doing
   */
  const [releasing, setReleasing] = createSignal(false);

  const release = (): void => {
    const catchId = props.catchId;
    const going = view();

    if (owned() == null || catchId == null || going == null) {
      return;
    }
    // Read before the record goes: once the release lands there is
    // nothing left to ask what it was
    const { family, name } = getSpeciesData(going.species);
    const paid = getCatchCandy(going.species);

    if (!releasing()) {
      setReleasing(true);
      return;
    }
    releaseCatch(catchId)
      .then((released) => {
        setReleasing(false);

        if (!released) {
          say('It could not be released.', 'ember');
          return;
        }
        // Said in passing rather than on the sheet, because the sheet
        // is about to close: what a player gets for letting a pokemon
        // go should still be somewhere they can read it afterwards.
        // The family is named — candy is held per family, so "1 candy"
        // on its own does not say which pile grew
        toast.push({
          message: `${name} was let go. ${paid} ${getFamilyName(family)} candy.`,
          tone: 'leaf',
        });
        // The record is gone, so there is nothing left for this
        // dialog to show
        props.onChange?.();
        props.onClose();
      })
      .catch((caught: unknown) => {
        setReleasing(false);
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * Which bag is open, if either. They are panels rather than sections
   * because neither is part of reading the sheet: a player opens one,
   * hands something over or spends it, and is back to looking at the
   * pokemon
   */
  const [panel, setPanel] = createSignal<'items' | 'give' | null>(null);

  /**
   * Whether the item the bag sent along has already been spent. It is
   * cleared whenever the sheet is pointed at something new, so a
   * second potion out of the bag is a second potion spent
   */
  let spent = false;

  createEffect(() => {
    props.catchId;
    props.useItem;
    spent = false;
  });

  /**
   * Whether the item is one this pokemon could be given right now —
   * a remedy, a cap it would gain from, a gem for a shadow, a wing, a
   * bitter berry. It is the one question behind the whole Use item
   * panel, so what is offered is never something that would be spent
   * on nothing
   */
  const isUsable = (item: Items): boolean => {
    const caught = view();

    if (caught == null) {
      return false;
    }
    // The universal candy: a level for anything that can still grow
    if (item === Items.RareCandy) {
      return !isEgg(caught) && caught.level < MAX_LEVEL;
    }
    if (isBottleCap(item)) {
      return !isPerfectIVs(caught.ivs);
    }
    // A ball re-balls it, so the one it is already in would be spent
    // on nothing
    const ball = getBall(item);

    if (ball != null) {
      return ball !== caught.ball;
    }
    if (isPurifyingGem(item)) {
      return isShadow(caught);
    }
    // A machine is offered only where it would teach something: one
    // this species can learn and does not know already
    if (isMachineItem(item)) {
      const move = getMachineMove(item);

      return (
        move != null &&
        new Set(getSpeciesData(caught.species).learnSet.teachable).has(move) &&
        !new Set(caught.moves).has(move)
      );
    }
    // A bottle is offered only where there is a move for it to go on
    // that has not already taken everything it will take
    if (isPPItem(item)) {
      return caught.moves.some((move) => getMovePoints(caught, move) < PP_UP_LIMIT);
    }
    return isRemedy(item) || isEffortItem(item) || BERRY_EFFORT_DROPS.has(item);
  };

  /**
   * Whether the bag holds anything at all this pokemon would gain
   * from. It is the same question the picker's filter asks, asked
   * once over the whole bag, so the menu entry that opens the picker
   * knows whether there would be a list in it
   */
  const hasUsableItem = (): boolean =>
    (props.bag.latest ?? []).some((entry) => entry.amount > 0 && isUsable(entry.item));

  /**
   * Spend it, whatever it is. Each kind already has its own call and
   * its own message; this only decides which one the item belongs to
   */
  const useOn = (item: Items): void => {
    setPanel(null);

    // A machine is the one item that asks a question back: what a
    // pokemon gives up for it depends on how full its move list is,
    // and that is the teaching dialog's business
    const move = isMachineItem(item) ? getMachineMove(item) : null;

    if (move != null) {
      setTeaching({ move, rest: [], levelled: false });
      return;
    }
    // And so does a bottle, for the same reason: what it buys lands on
    // one move and cannot be moved off it afterwards
    if (isPPItem(item)) {
      setBottle(item);
      return;
    }
    if (item === Items.RareCandy) {
      feedRareCandy();
    } else if (getBall(item) != null) {
      reball(item);
    } else if (isBottleCap(item)) {
      polish(item);
    } else if (isPurifyingGem(item)) {
      purify(item);
    } else if (isEffortItem(item)) {
      trainWithItem(item);
    } else if (BERRY_EFFORT_DROPS.has(item)) {
      feedBitterBerry(item);
    } else {
      heal(item);
    }
  };

  /**
   * Something the bag asked to be spent on this one.
   *
   * The pokemon was chosen after the item, so that choice is the
   * agreement and the sheet spends it on arrival. Once only — the
   * record changes underneath and the sheet reads it again — and a
   * cap on a flawless pokemon is said rather than quietly swallowed
   */
  createEffect(() => {
    const item = props.useItem;
    const caught = view();

    if (item == null || caught == null || spent) {
      return;
    }
    spent = true;
    if (isUsable(item)) {
      useOn(item);
    } else {
      say(`${describeItem(item)} would do this one no good.`, 'ember');
    }
  });

  /**
   * What the menu offers. Everything in it is occasional — the things
   * a player does to a pokemon now and then rather than every time
   * they open its sheet — and every one of them is refused while it is
   * fighting
   */
  const actions = (loaded: CaughtPokemon): MenuAction[] => [
    {
      label: isFavorite(loaded) ? 'Unfavorite' : 'Favorite',
      disabled: props.fighting.latest === true,
      onSelect: () => {
        favorite(!isFavorite(loaded));
      },
    },
    {
      label: isGuarded(loaded) ? 'Unlock' : 'Lock',
      disabled: props.fighting.latest === true,
      onSelect: () => {
        guard(!isGuarded(loaded));
      },
    },
    {
      label: 'Use item',
      // Dead where there is nothing to spend. The panel it opens says
      // "Nothing in the bag would do it any good" — which is an
      // answer, but it appeared at the *top* of the sheet, a screen
      // away from the menu that was pressed, so the press read as
      // having done nothing at all. A menu entry that cannot lead
      // anywhere should say so where the finger already is
      disabled: frozen() || isEgg(loaded) || !hasUsableItem(),
      onSelect: () => {
        setPanel((open) => (open === 'items' ? null : 'items'));
      },
    },
    {
      label: 'Auction',
      // A favorite is not to be parted with, and a lot cannot be taken
      // back off the block once it is on it. Nobody listening for the
      // listing is the same as nowhere to list it.
      //
      // `isAuctionableCatch` is the other half: the block takes one
      // listing a day off a player, so it is for perfect values, a
      // shiny or a legendary — anything else a bidder could walk out
      // and catch. The server asks the same of the stored record
      // ...and one lot at a time: while the player's own auction is
      // still taking bids, the block has no room for another
      disabled:
        props.onAuction == null ||
        props.fighting.latest === true ||
        props.selling() === true ||
        isFavorite(loaded) ||
        isEgg(loaded) ||
        !isAuctionableCatch(loaded),
      onSelect: () => {
        const catchId = props.catchId;

        if (catchId == null) {
          return;
        }
        // The listing dialog is the parent's to open: this one is
        // already a dialog, and the pokemon is about to leave the
        // records this sheet is reading
        props.onClose();
        props.onAuction?.(catchId);
      },
    },
    {
      // Named for what it does to *this* pokemon: one that has never
      // been named is being given a name, and one that has is having
      // the name it answers to changed
      label: loaded.nickname === '' ? 'Set nickname' : 'Change nickname',
      // An egg is not named. What is in it has not been met, and a
      // name given to a shell is a name given to nobody
      disabled: props.fighting.latest === true || isEgg(loaded),
      onSelect: () => {
        // Opened on the name it already has rather than on an empty
        // box: renaming is far commoner than naming, and a player
        // fixing one letter should not have to type the other eleven
        setNaming(loaded.nickname);
      },
    },
    {
      label: props.buddy.latest === props.catchId ? 'Walking with you' : 'Set buddy',
      disabled: props.buddy.latest === props.catchId,
      onSelect: takeAlong,
    },
  ];

  /**
   * The menu's entries as the bar reads them: nothing at all until the
   * record is in hand, since every one of them acts on it
   */
  const menuActions = (): MenuAction[] => {
    const loaded = view();

    return loaded == null ? [] : actions(loaded);
  };

  return (
    <>
      <Dialog
        width="wide"
        // The sheet steps aside while the teaching dialog is up rather
        // than sitting open behind it: two modals at once fight for the
        // click that closes them, and the sheet is what the player comes
        // back to afterwards
        isOpen={props.catchId != null && teaching() == null && bottle() == null && naming() == null}
        onClose={() => {
          // A release half-confirmed is a release declined
          setReleasing(false);
          setPanel(null);
          props.onClose();
        }}
        // The panel is named for what it is rather than for what is on
        // it: the pokemon's own name is written under its sprite, where
        // it belongs to the pokemon rather than to the window
        title="Pokemon Info"
        // The run this sheet is one of, either side of its name. They
        // are the panel's rather than the pokemon's, so they stay put
        // however far down the sheet is scrolled.
        //
        // A pokemon that is not the reader's has no run to be one of:
        // a lot on the block is opened on its own, and there is
        // nothing either side of it to step to. The arrows are left
        // out entirely rather than drawn dead, since a pair of greyed
        // arrows reads as a box that has run out rather than as a box
        // that was never there
        lead={
          props.readOnly === true ? undefined : (
            <StepButton label="Previous pokemon" way="previous" onPress={walk(-1)} />
          )
        }
        aside={
          props.readOnly === true ? undefined : (
            <StepButton label="Next pokemon" way="next" onPress={walk(1)} />
          )
        }
        // And what can be done to it, on a bar of its own under the
        // name. It was a button in the corner of the heading, beside
        // the arrows that are there now — and what a player does to a
        // pokemon deserves more room than a corner
        bar={
          // Kept on a condition that does not flap. The menu used to
          // hang off the record itself, so every re-read of it — and
          // this sheet re-reads after everything it writes — threw the
          // menu away and built a new one, which **closes** it: the
          // open state lives in the instance. A player who pressed
          // Actions while the record was still settling watched the
          // menu shut itself, and pressing it the instant the sheet
          // opened often did nothing at all.
          //
          // Whose sheet it is cannot change under a player, so the
          // button stands from the first frame and the entries fill in
          // when the record arrives
          <>
            {/* The two marks a player puts on one themselves, at the
                other end of the same row: they are about the record
                rather than about the pokemon, which is what the row
                is for */}
            <Show when={view()}>
              {(record) => (
                <span class="mr-auto flex items-center gap-1.5">
                  <Show when={isGuarded(record())}>
                    <Badge tone="tide">
                      <LockIcon class="size-3.5" aria-hidden="true" />
                      Locked
                    </Badge>
                  </Show>
                  <Show when={isFavorite(record())}>
                    <Badge tone="gold">
                      <StarIcon class="size-3.5" aria-hidden="true" />
                      Favorite
                    </Badge>
                  </Show>
                </span>
              )}
            </Show>
            <Show when={owned() != null}>
              <Menu label="Actions" icon={ActionsIcon} actions={menuActions()} />
            </Show>
          </>
        }
        terse
        description={
          props.readOnly === true
            ? 'One pokemon in full, as it stands. Nothing here can be changed — it is not yours to change.'
            : `One pokemon in full: what it is, what it is carrying, and everything that can be
            done to it while it is not fighting.`
        }
      >
        {/* The record is read through `latest`, so a write that
            re-reads it keeps showing what it had while the read is in
            flight. Suspending instead tears the panel down and takes
            the page with it: marking a favorite would blink the whole
            screen for the length of one round trip */}
        <Show
          when={view()}
          fallback={
            <Note>{props.detail.latest == null ? 'Loading catch…' : 'No such catch.'}</Note>
          }
        >
          {(loaded) => (
            <>
              {/* Whether anything is holding the record still. A lock
                  and a favorite say so through the Actions menu, which
                  is where they are turned on and off; a raid is the one
                  nobody chose, so it is the one worth a sentence */}
              <Show when={owned()}>
                <Show when={props.fighting.latest}>
                  <Meta class="text-center">In a raid — nothing about it can be changed.</Meta>
                </Show>

                {/* Anything the bag can be spent on this pokemon: a
                    remedy, a cap, a gem for a shadow, a wing, a bitter
                    berry. One list rather than five, since the answer
                    to "what would this do for it" is the same question
                    every time */}
                <Show when={panel() === 'items'}>
                  <DialogSection title="Use item">
                    <InventoryPicker
                      inline
                      entries={props.bag.latest}
                      disabled={frozen()}
                      // Only the prized and special bands ask twice.
                      // Everything a player heals with — a Potion, a
                      // Full Restore, a wing — is spent over and
                      // over, and asking about each is a click for
                      // nothing; a cap or a Purifying Gem changes
                      // the pokemon for good, and the wrong pokemon
                      // is the wrong pokemon for good with it
                      confirm={(entry) => isPreciousItem(entry.item)}
                      value={null}
                      verb="Use"
                      empty="Nothing in the bag would do it any good."
                      filter={(entry) => isUsable(entry.item)}
                      onPick={(item) => {
                        if (item != null) {
                          useOn(item);
                        }
                      }}
                    />
                  </DialogSection>
                </Show>
              </Show>

              {/* The sheet itself, read down the middle: the pokemon
                  first, then what it is, then what it can do, then
                  where it has been.

                  Every section is ruled off from the one above it. The
                  sheet is a long column of headings and lists, and
                  without a line between them a player scrolling it
                  cannot tell where the moves stop and the abilities
                  start */}
              <div
                class="flex flex-col items-center gap-4 text-center [&>section]:w-full
                    [&>section]:border-t [&>section]:border-line-soft [&>section]:pt-4"
              >
                {/* What the record is about, walking. An egg is drawn
                    as an egg: what is inside it is not the player's to
                    see until it hatches.

                    It stands on the floor of a box with room above it.
                    The header is stuck to the top of the panel, so a
                    sprite drawn tight against it was clipped by the
                    bar the moment anything scrolled — and the space
                    that was above the pokemon is better spent under
                    the header than between the pokemon and its name */}
                <PortraitSection caught={loaded()} named={named()} />

                <Row class="justify-center">
                  {/* The level and the thing that raises it are one
                      control, not a label beside a button: what a
                      player wants to know is where it stands and what
                      the next step costs, and those are one thought.
                      For a pokemon that is nobody's to raise — an egg,
                      somebody else's — it is only the label */}
                  <Show
                    when={owned() != null && !isEgg(loaded())}
                    fallback={<Badge tone="leaf">Lv. {loaded().level}</Badge>}
                  >
                    <Button
                      tone="primary"
                      disabled={
                        (props.candies.latest ?? 0) < getCandyCost(loaded()) ||
                        loaded().level >= MAX_LEVEL ||
                        frozen()
                      }
                      onClick={feedCandy}
                    >
                      {loaded().level >= MAX_LEVEL
                        ? `Lv. ${loaded().level} — at the cap`
                        : `Lv. ${loaded().level} → ${loaded().level + 1} (${getCandyCost(
                            loaded(),
                          )})`}
                    </Button>
                  </Show>
                  <Show when={!isEgg(loaded())}>
                    <Badge>{NATURE_NAMES[loaded().nature]}</Badge>
                  </Show>
                  <Badge tone="gold">
                    {props.candies.latest ?? 0}{' '}
                    {(props.candies.latest ?? 0) === 1 ? 'candy' : 'candies'}
                  </Badge>
                </Row>

                {/* An egg has no evolution to offer, so the section
                    that would hold one holds the way out of the shell
                    instead: how far along the walk is, and the button
                    that ends it */}
                <Show when={isEgg(loaded())}>
                  <DialogSection title="Hatching">
                    <div class="h-2 overflow-hidden rounded-full bg-line-soft">
                      <div
                        class="h-full rounded-full bg-leaf transition-[width]"
                        style={{
                          width: `${Math.min(100, (loaded().steps / Math.max(1, loaded().hatchSteps)) * 100)}%`,
                        }}
                      />
                    </div>
                    <Note>
                      {loaded().steps} / {loaded().hatchSteps} steps
                      {props.buddy.latest === props.catchId
                        ? '.'
                        : ' — it only moves while it is the one being carried.'}
                    </Note>
                    <Show when={owned()}>
                      <Row class="justify-center">
                        <Button tone="primary" disabled={!canHatch(loaded())} onClick={hatch}>
                          Hatch it
                        </Button>
                      </Row>
                    </Show>
                  </DialogSection>
                </Show>

                <Show when={!isEgg(loaded())}>
                  {/* Everything it could ever become, with the ones
                      it cannot become yet left in and refused. A row
                      that is out of reach says what it is waiting for,
                      so the sheet is also where a player finds out
                      what they are working towards.

                      A pokemon at the end of its line has no section at
                      all rather than a heading over the words "It does
                      not evolve": most of a full-grown box would carry
                      a ruled-off paragraph saying nothing was going to
                      happen */}
                  <EvolutionSection
                    options={props.evolutions.latest}
                    owned={owned() != null}
                    frozen={frozen()}
                    dexKnows={dexKnows}
                    onEvolve={evolve}
                  />

                  {/* Three readings of the same six numbers: what the
                      pokemon has, what it was born with, and what has
                      been trained into it. They are tabs rather than
                      three lists, because a player compares one stat
                      across them rather than reading all eighteen */}
                  <StatsSection
                    caught={loaded()}
                    owned={owned() != null}
                    frozen={frozen()}
                    onTrain={train}
                  />

                  {/* What it brings to a fight, in one row: what it
                      knows, what it is, and what it carries. They were
                      three sections down a long sheet, which put the
                      three answers to "can it win this" three scrolls
                      apart */}
                  <BattleSection
                    caught={loaded()}
                    owned={owned() != null}
                    frozen={frozen()}
                    holdables={holdables()}
                    bag={props.bag.latest}
                    giving={panel() === 'give'}
                    onGiving={(open) => {
                      setPanel(open ? 'give' : null);
                    }}
                    onGive={(item) => {
                      moveItem(item, true);
                    }}
                    onTake={(at) => {
                      moveItem(loaded().items[at], false);
                    }}
                  />
                </Show>

                {/* Whose hands it has passed through, oldest first, and
                    where it came from before any of them */}
                <HistorySection
                  caught={loaded()}
                  player={auth.user()?.uid ?? ''}
                  nameOf={describeOwner}
                  onTrainer={props.onTrainer}
                />

                {/* There is no undoing it, so it takes two presses —
                    and whatever it is holding comes back to the bag,
                    along with the candy the pokemon was worth. The
                    second press names that candy: what a player gets
                    for it is part of the decision, and a number that
                    only turns up afterwards is a number they had to
                    make the decision without */}
                <Show when={owned()}>
                  <DialogSection>
                    <Row class="justify-center">
                      <Button
                        tone="danger"
                        // A favorite and a locked one are both marks a
                        // player put on the record to stop exactly
                        // this, so the button is dead rather than
                        // pressable and refused
                        disabled={
                          props.fighting.latest === true ||
                          props.onlyOne() === true ||
                          isFavorite(loaded()) ||
                          isGuarded(loaded())
                        }
                        onClick={release}
                      >
                        {releasing()
                          ? `Let it go for ${getCatchCandy(loaded().species)} candy?`
                          : 'Release'}
                      </Button>
                      <Show when={releasing()}>
                        <Button
                          onClick={() => {
                            setReleasing(false);
                          }}
                        >
                          Keep it
                        </Button>
                      </Show>
                    </Row>
                    <Show when={isFavorite(loaded())}>
                      <Meta>A favorite cannot be released. Unfavorite it first.</Meta>
                    </Show>
                    <Show when={isGuarded(loaded())}>
                      <Meta>A locked pokemon cannot be released. Unlock it first.</Meta>
                    </Show>
                    {/* Nothing takes the last one: a player with an
                          empty collection has no way back into the
                          game except the gift that would replace it */}
                    <Show when={props.onlyOne()}>
                      <Meta>The only pokemon you have cannot be released.</Meta>
                    </Show>
                  </DialogSection>
                </Show>
              </div>
            </>
          )}
        </Show>
        <DialogActions>
          <Button
            onClick={() => {
              setReleasing(false);
              setPanel(null);
              props.onClose();
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Learning is its own dialog because what it costs is a
          question — which move is given up — and one used on a pokemon
          with room asks nothing at all. A machine and a level ask the
          same question, so they share it; only the price differs, and
          a level has none.

          Closing steps to whatever else the level offered rather than
          straight back to the sheet, since a level can hand over two
          moves at once and each is its own decision */}
      <TeachMoveDialog
        catchId={teaching() == null ? null : props.catchId}
        move={teaching()?.move ?? null}
        cost={teaching()?.levelled === true ? 'Nothing' : undefined}
        teach={teaching()?.levelled === true ? learnLevelUpMove : undefined}
        onClose={nextTeaching}
        onTaught={() => {
          say(teaching()?.levelled === true ? 'Learned.' : 'Taught.', 'leaf');
          props.onRecordChanged();
          props.onBagChanged();
          props.onChange?.();
        }}
      />

      {/* Naming, on a dialog of its own for the same reason teaching
          is: the sheet is long and the field would be somewhere down
          it, while this is one box and one button.

          The box is filled the moment it opens rather than after a
          "do you want to rename it?" step, and the button is dead
          until the name in it is actually different — the question a
          player came here to answer is what to call it, not whether
          they meant to */}
      <Dialog
        isOpen={naming() != null}
        onClose={() => {
          setNaming(null);
        }}
        title="Change nickname?"
        // The sentence is for the screen reader alone: the box under
        // the heading is labelled, and the line below it already says
        // what an empty box does. A dialog this small should not
        // explain itself twice
        terse
        description="What you call it. Left empty, it goes back to being called by its species."
      >
        <Field label="Name" stacked>
          <input
            type="text"
            value={naming() ?? ''}
            maxLength={NICKNAME_LIMIT}
            onInput={(event) => {
              setNaming(event.currentTarget.value);
            }}
          />
        </Field>

        {/* What it will actually be called: the name cleaned the way
            the server will clean it, or the species' own name for a
            box left empty. A player should not have to send it to
            find out what it did */}
        <Meta>{describeDraft()}</Meta>

        <DialogActions>
          <Button
            disabled={renaming()}
            onClick={() => {
              setNaming(null);
            }}
          >
            Never mind
          </Button>
          <Button
            tone="primary"
            // Nothing to do where the name has not changed: the same
            // name written again is a write for the sake of one
            disabled={renaming() || drafted() === (view()?.nickname ?? '')}
            onClick={rename}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* And the same shape for a bottle: a PP Up is spent on one move
          and nothing takes the points back, so it asks which before it
          leaves the bag */}
      <IncreasePPDialog
        catchId={bottle() == null ? null : props.catchId}
        item={bottle()}
        onClose={() => {
          setBottle(null);
        }}
        onUsed={(said) => {
          say(said);
          props.onRecordChanged();
          props.onBagChanged();
          props.onChange?.();
        }}
      />
    </>
  );
}
