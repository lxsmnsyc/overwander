import { type JSX, type Resource, Show, createMemo, createResource, createSignal } from 'solid-js';
import { isLockLive } from '../../../auth/battle-lock';
import { type CaughtPokemon, listCaught } from '../../../auth/caught';
import { syncServerClock } from '../../../auth/clock';
import { isShadow } from '../../../auth/caught-record';
import { getMaxHealth } from '../../../auth/health';

import { describeFriendship } from '../../../data/constants/friendship';
import { type InventoryEntry, getInventory } from '../../../auth/inventory';
import { getProfile } from '../../../auth/profile';
import {
  boostEgg,
  breed,
  buyFossil,
  buyFromVendor,
  carveApricorns,
  channelAbility,
  groomCatch,
  hasVisited,
  remindMove,
  reviveFossil,
  sellToVendor,
  tutorMove,
  visitNurse,
} from '../../../auth/npcs';
import type { Items } from '../../../data/ids/items';
import { getApricornBall } from '../../../data/ids/items';
import type { Moves } from '../../../data/ids/moves';
import { getItemData, isFossil } from '../../../data/items';

import { getFossilPrice } from '../../../data/overworld/fossil';
import { Species } from '../../../data/ids/species';
import { getAbilityData } from '../../../data/abilities';
import { getSpeciesData } from '../../../data/species';
import Npc, {
  BREEDING_FEE,
  CHANNELER_FEE,
  DAYCARE_FEE,
  GROOMING_FEE,
  NPC_NAMES,
  REMINDER_FEE,
  TUTOR_FEE,
} from '../../../data/overworld/npc';
import { VENDOR_TRADE_LIMIT } from '../../../data/overworld/vendor';
import { canBreed } from '../../../overworld/breeding';
import { LearnRefusal, type LearnResult } from '../../../auth/learn-refusal';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import type { CatchOption } from '../../catches/catch-picker';
import { describeItem } from '../../details';
import InventoryPicker, { type ItemAmount } from '../../items/InventoryPicker';

import NpcSprite from '../NpcSprite';
import AnimatedSprite from '../../sprites/AnimatedSprite';
import ItemSprite from '../../items/ItemSprite';
import TeachMoveDialog from '../../catches/TeachMoveDialog';
import { Badge, Button, Detail, Dialog, DialogActions, Meta, Status, useToast } from '../../styled';
import {
  BreederCounter,
  ChannelerCounter,
  DaycareCounter,
  GroomerCounter,
  NurseCounter,
} from './counters/care';
import { FossilCounter, KurtCounter, ReviveCounter, VendorCounter } from './counters/goods';
import { ReminderCounter, TutorCounter } from './counters/moves';
import { NPC_QUOTES, asParent, priceOf } from './shared';

/**
 * How every one of these sections is laid out.
 *
 * Down the middle, all of them. The dialog is one person making one
 * offer — a picture of them, a line of what they say, and the thing
 * they want picked — and a column of left-aligned lists under a
 * centred portrait read as two screens stuck together
 */

export interface NpcDialogProps {
  player: string;
  /**
   * The chunk the player is standing in, and the cell they walked
   * up to — the server re-derives who is standing there from both
   */
  snapshot: ChunkSnapshot | null;
  /**
   * Who is standing there, or null when the dialog is closed
   */
  standing: [cell: number, npc: Npc] | null;
  onClose: () => void;
  /**
   * Fired when something landed — an egg was made, an egg moved on —
   * so the list behind the dialog can catch up
   */
  onChange?: () => void;
}

/**
 * The person a player has walked up to. A breeder wants two pokemon
 * and a fee; a daycare lady wants an egg and a fee; Nurse Joy wants
 * nothing at all, and gives a party back whole once a window. Any of
 * them can be walked away from
 */
/**
 * What the person has to offer, which is where the box, the purse and
 * the bag are all read.
 *
 * Any of them read in the body that declared it would land on the
 * boundary around the whole page, taking the world down while
 * somebody was being served. Read a component below and it is the
 * dialog's own panel that waits
 */
function NpcCounter(
  props: NpcDialogProps & {
    catches: Resource<CatchOption[]>;
    gold: Resource<number>;
    bag: Resource<InventoryEntry[]>;
    /** Whether the maniac has already sold to this player this window */
    visited: Resource<boolean>;
    /** Whether the daycare lady has already warmed an egg this window */
    warmed: Resource<boolean>;
    onServed: () => void;
    onTraded: () => void;
  },
): JSX.Element {
  const toast = useToast();
  const [status, setStatus] = createSignal<string | null>(null);
  const [chosen, setChosen] = createSignal<string[]>([]);
  const [busy, setBusy] = createSignal(false);
  // Which side of the counter is being looked at, or null while the
  // player has only been offered the two words
  const [counter, setCounter] = createSignal<'buy' | 'sell' | null>(null);
  // What the Move Reminder has been told so far: which pokemon, and
  // which of the moves it has lost. `reminding` is the two of them
  // agreed to, and while it is set this dialog is closed — the
  // teaching is a dialog of its own, and one modal over another
  // fights it for the closing click
  const [remindee, setRemindee] = createSignal<string | null>(null);
  const [recall, setRecall] = createSignal<Moves | null>(null);
  const [reminding, setReminding] = createSignal<[catchId: string, move: Moves] | null>(null);
  // And the tutor's half of the same conversation: which pokemon,
  // which lesson, and the pair agreed to
  const [tutee, setTutee] = createSignal<string | null>(null);
  const [lesson, setLesson] = createSignal<Moves | null>(null);
  const [tutoring, setTutoring] = createSignal<[catchId: string, move: Moves] | null>(null);

  /**
   * The purse and the bag. Both are re-read after every trade, since a
   * sale moves one and a purchase moves both
   */

  /**
   * What the vendor is carrying. It is derived from the window the
   * same way he is, so the crate needs no read of its own — and the
   * server derives it again before it takes a coin
   */
  const stock = (): Items[] => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    return snapshot == null || standing == null ? [] : snapshot.getVendorStock(standing[0]);
  };

  /**
   * The crate as a list the picker can read: the same shape a bag has,
   * so buying and selling are the same list asked in two directions.
   *
   * What stands in for a stack's count is **how many he will part with
   * at once** — he has as many potions as anyone wants, and the limit
   * is the trade's rather than the crate's.
   *
   * It used to be how many the purse could cover, which put an item
   * the player could not afford in the list at "× 0" wearing a badge
   * saying so. That is the same refusal three times over: the count,
   * the badge, and the total at the bottom that will not let the trade
   * through. The price beside the row is what a player is deciding
   * with, and the total is where a purse that will not stretch says so
   */
  const crate = (): InventoryEntry[] =>
    stock().map((item) => ({
      user: props.player,
      item,
      amount: VENDOR_TRADE_LIMIT,
    }));

  /**
   * The player's pokemon as every picker in this dialog reads them.
   *
   * `latest`, not the resource. Every one of these people writes and
   * then re-reads the list, and a read that suspends takes the panel
   * out for the length of the round trip: handing a party to Nurse Joy
   * would blank the counter mid-sentence
   */
  const offers = (): CatchOption[] => props.catches.latest ?? [];

  const pair = (): [CatchOption, CatchOption] | null => {
    const picked = chosen();

    if (picked.length !== 2) {
      return null;
    }

    const found = picked.map((id) => offers().find((entry) => entry.id === id));

    return found[0] == null || found[1] == null ? null : [found[0], found[1]];
  };

  const compatible = (): boolean => {
    const chosenPair = pair();

    return (
      chosenPair != null && canBreed(asParent(chosenPair[0].caught), asParent(chosenPair[1].caught))
    );
  };

  /**
   * Who the dialog is about, held past the moment they are dismissed.
   *
   * A dialog is on screen for the length of its fade after it closes,
   * and `standing` is null for all of it — so a panel read straight off
   * the prop empties as it leaves and shows a nameless dialog belonging
   * to nobody. The hold is for **showing** only: anything that acts on
   * the person still reads `props.standing`, which is what makes the
   * buttons dead the moment they are gone
   */
  const showing = createMemo<[cell: number, npc: Npc] | null>(
    (held) => props.standing ?? held ?? null,
    null,
  );

  /**
   * Who is standing there. The dialog is named after them, and it is
   * named whether or not somebody has been walked up to yet
   */
  const who = (): string => {
    const npc = showing()?.[1];

    return npc == null ? 'Somebody' : NPC_NAMES[npc];
  };

  /**
   * How many Heart Scales are in the bag. It is the reminder's whole
   * price, and it is read off the same bag the vendor's picker reads
   */
  /**
   * Whether Nurse Joy would do anything to it: patch it up, take a
   * status off, or put a shadow right. One that is already whole she
   * looks over and hands straight back, spending the window on
   * nothing, so it is left out of her list rather than offered
   */
  const needsCare = (caught: CaughtPokemon): boolean =>
    isShadow(caught) || caught.statuses !== 0 || caught.health < getMaxHealth(caught);

  const scales = (): number =>
    (props.bag.latest ?? []).find((entry) => entry.item === REMINDER_FEE)?.amount ?? 0;

  const forget = (): void => {
    setRemindee(null);
    setRecall(null);
    setTutee(null);
    setLesson(null);
  };

  /**
   * The two the maniac is carrying. Derived from the window he was,
   * so it needs no read of its own — and the server derives the pair
   * again before it takes a coin
   */
  const offer = (): Items[] => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    return snapshot == null || standing == null ? [] : snapshot.getFossilOffer(standing[0]);
  };

  /**
   * What is in the bag that the scientist can open
   */
  const fossils = (): InventoryEntry[] =>
    (props.bag.latest ?? []).filter((entry) => isFossil(entry.item) && entry.amount > 0);

  /** What the apricorn on this square becomes, for the tray to say. */
  const ballName = (item: Items): string => {
    const ball = getApricornBall(item);

    return ball == null ? '' : getItemData(ball).name;
  };

  const apricorns = (): InventoryEntry[] =>
    (props.bag.latest ?? []).filter(
      (entry) => getApricornBall(entry.item) != null && entry.amount > 0,
    );

  /**
   * Hand him a basket of one colour. The bag is re-read afterwards
   * the way a trade re-reads it: the apricorns went from it and the
   * balls arrived in it
   */
  const carve = (item: Items, amount: number): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    carveApricorns(snapshot, standing[0], item, amount)
      .then((done) => {
        setBusy(false);

        if (done == null) {
          toast.push({
            message: 'He turned the basket over and handed it straight back.',
            tone: 'ember',
          });
          return;
        }
        // What came back rather than what he did with it: the bench is
        // still open behind this, and the next basket is the next
        // press
        toast.push({
          title: `${getItemData(done.ball).name}${done.amount > 1 ? ` ×${done.amount}` : ''}`,
          message: `−${amount} ${describeItem(item)}`,
          art: () => <ItemSprite item={done.ball} size={24} label="" />,
          tone: 'leaf',
        });
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch(() => {
        setBusy(false);
        toast.push({ message: 'The bench went quiet. Nothing changed hands.', tone: 'ember' });
      });
  };

  const close = (): void => {
    setStatus(null);
    setChosen([]);
    setCounter(null);
    forget();
    setReminding(null);
    setTutoring(null);
    props.onClose();
  };

  const submitPair = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const chosenPair = pair();

    if (snapshot == null || standing == null || chosenPair == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    breed(snapshot, standing[0], [chosenPair[0].id, chosenPair[1].id])
      .then((egg) => {
        setBusy(false);

        // Said in passing rather than in the panel: the egg is
        // already in the box by the time there is anything to report
        if (egg == null) {
          toast.push({
            message:
              'He handed them back. Wrong pair, short purse, or you have already bred this while.',
            tone: 'ember',
          });
          return;
        }
        setChosen([]);
        toast.push({
          title: 'An egg',
          message: `Carry it as your buddy and walk. −${BREEDING_FEE} gold`,
          tone: 'leaf',
        });
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const tendParty = (picked: string[]): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null || picked.length === 0) {
      return;
    }
    setStatus(null);
    setBusy(true);
    visitNurse(snapshot, standing[0], picked)
      .then((tended) => {
        setBusy(false);
        setStatus(
          tended == null
            ? 'She handed it straight back. Nothing to heal.'
            : 'She looked after it. Right as rain.',
        );
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const pushEgg = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    boostEgg(snapshot, standing[0], id)
      .then((steps) => {
        setBusy(false);

        if (steps == null) {
          toast.push({
            message: 'She would not take it. It may be ready, or she has warmed her one for you.',
            tone: 'ember',
          });
          return;
        }
        toast.push({
          title: 'Egg',
          message: `Warmed along to ${steps} steps. −${DAYCARE_FEE} gold`,
          art: () => (
            <span class="flex size-8 items-center justify-center">
              <AnimatedSprite species={Species.Egg} direction="DownLeft" fill still label="" />
            </span>
          ),
          tone: 'leaf',
        });
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        toast.push({
          message: caught instanceof Error ? caught.message : String(caught),
          tone: 'ember',
        });
      });
  };

  const groom = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    groomCatch(snapshot, standing[0], id)
      .then((friendship) => {
        setBusy(false);
        setStatus(
          friendship == null
            ? 'He would not take it. A shadow, a friend already, or he has seen you this while.'
            : `Brushed, fussed over and handed back ${describeFriendship(friendship)}. (−${GROOMING_FEE} gold)`,
        );
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Hand the scale over and let her call something up.
   *
   * One press: the slot she opens and the ability that fills it are
   * one write on the server, so there is nothing here to agree to
   * afterwards. What came out is said in a word in passing, since it
   * is the one thing the picker behind it cannot show
   */
  const channel = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    channelAbility(snapshot, standing[0], id)
      .then((drawn) => {
        setBusy(false);

        if (drawn == null) {
          setStatus(
            'Nothing answered. No scale, a pokemon she cannot reach, or she has seen you this while.',
          );
          return;
        }
        toast.push({
          title: getAbilityData(drawn.ability).name,
          message: `Called up, and room for it. (−1 Heart Scale)`,
          tone: 'leaf',
        });
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * How many of it the player is carrying. It is what the crate cannot
   * say — his counts are his — and what a player buying a third potion
   * is actually deciding with
   */
  const carrying = (item: Items): number =>
    (props.bag.latest ?? []).find((entry) => entry.item === item)?.amount ?? 0;

  /**
   * Trade some of something, either way across the counter.
   *
   * One line, one transaction, however many of it: the crate takes a
   * count under the tray and the whole line lands or none of it does.
   * A basket of several kinds was two screens and three presses for
   * the thing a player does most, buying a potion
   */
  const trade = (item: Items, amount: number, buyingIt: boolean): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }

    const picks: ItemAmount[] = [[item, amount]];

    setStatus(null);
    setBusy(true);
    (buyingIt
      ? buyFromVendor(snapshot, standing[0], picks, standing[1])
      : sellToVendor(snapshot, standing[0], picks, standing[1])
    )
      .then((done) => {
        setBusy(false);

        if (done == null) {
          return;
        }
        // A purchase is worth a word in passing; a sale's receipt is
        // the purse badge climbing, and a refusal is the greyed square
        if (buyingIt) {
          toast.push({
            title: `${describeItem(item)}${amount > 1 ? ` ×${amount}` : ''}`,
            message: `−${priceOf(item, true) * amount} gold`,
            art: () => <ItemSprite item={item} size={24} label="" />,
            tone: 'leaf',
          });
        }
        props.onTraded();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Buy one of the maniac's rocks. One press, one purchase, the way
   * the vendor's crate trades: the price is on the square, and he
   * sells one while he is standing here, so the sold state that
   * follows is what ends the shopping
   */
  const buyRock = (item: Items): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    buyFossil(snapshot, standing[0], item)
      .then((done) => {
        setBusy(false);

        // The word in passing is the purchase; the shelf turning to
        // "sold" says the rest
        if (done != null) {
          toast.push({
            title: describeItem(item),
            message: `−${getFossilPrice(item)} gold`,
            art: () => <ItemSprite item={item} size={24} label="" />,
            tone: 'leaf',
          });
          props.onTraded();
          props.onChange?.();
        }
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Put the fossil on the bench. What comes out is the fossil's
   * rather than anybody's choice; one press opens one rock, the way
   * every other counter here trades
   */
  const openRock = (item: Items): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    reviveFossil(snapshot, standing[0], item)
      .then((revived) => {
        setBusy(false);

        if (revived == null) {
          toast.push({
            message: 'Nothing came of it. That rock is not in your bag any more.',
            tone: 'ember',
          });
          return;
        }
        // Said over the counter rather than under it: the bench is
        // cleared for the next rock the moment this one is open, and a
        // line in the panel would go with it
        toast.push({
          title: getSpeciesData(revived.species).name,
          message: `Level ${revived.level}, out of ${describeItem(item)}.${
            revived.shiny ? ' It sparkles.' : ''
          }`,
          art: () => (
            <span class="flex size-8 items-center justify-center">
              <AnimatedSprite
                species={revived.species}
                shiny={revived.shiny}
                direction="DownLeft"
                fill
                still
                label=""
              />
            </span>
          ),
          tone: 'leaf',
        });
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        toast.push({
          message: caught instanceof Error ? caught.message : String(caught),
          tone: 'ember',
        });
      });
  };

  /**
   * Hand the scale over and take the move back.
   *
   * It is the teaching dialog's `teach`, so what a player agreed to
   * there is what is asked for here — and the scale leaves the bag in
   * the same transaction the move list is written in, which is what
   * makes a refusal cost nothing
   */
  const remind = async (catchId: string, move: Moves, replaces: number): Promise<LearnResult> => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return { refused: LearnRefusal.Gone };
    }
    return remindMove(snapshot, standing[0], catchId, move, replaces);
  };

  /**
   * The tutor's half of the same handover: the fee moves in the
   * transaction the move list is written in, so a refusal costs
   * nothing
   */
  const tutor = async (catchId: string, move: Moves, replaces: number): Promise<LearnResult> => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return { refused: LearnRefusal.Gone };
    }
    return tutorMove(snapshot, standing[0], catchId, move, replaces);
  };

  /**
   * What each of them offers, as the one or two buttons that do it.
   *
   * They live on the dialog's bottom bar rather than in the section
   * they belong to, so every one of these dialogs is answered in the
   * same place — and the vendor, whose offer is three screens deep,
   * says what pressing on means at each of them
   */
  const npcActions = (npc: Npc): JSX.Element => {
    if (npc === Npc.Breeder) {
      return (
        <Button tone="primary" disabled={busy() || !compatible()} onClick={submitPair}>
          Breed <Badge tone="gold">{BREEDING_FEE} gold</Badge>
        </Button>
      );
    }
    if (npc === Npc.MoveReminder) {
      return (
        <Button
          tone="primary"
          disabled={busy() || scales() < 1 || remindee() == null || recall() == null}
          // The badge is the price drawn rather than spelled out, so
          // the button says in a picture what the bag says in one
          label="Remind, 1 Heart Scale"
          onClick={() => {
            const id = remindee();
            const move = recall();

            if (id != null && move != null) {
              setReminding([id, move]);
            }
          }}
        >
          Remind{' '}
          <Badge tone="gold">
            <ItemSprite item={REMINDER_FEE} size={16} label="" />1
          </Badge>
        </Button>
      );
    }
    if (npc === Npc.MoveTutor) {
      return (
        <Button
          tone="primary"
          disabled={busy() || scales() < 1 || tutee() == null || lesson() == null}
          label="Teach, 1 Heart Scale"
          onClick={() => {
            const id = tutee();
            const move = lesson();

            if (id != null && move != null) {
              setTutoring([id, move]);
            }
          }}
        >
          Teach{' '}
          <Badge tone="gold">
            <ItemSprite item={TUTOR_FEE} size={16} label="" />1
          </Badge>
        </Button>
      );
    }
    if (npc !== Npc.Vendor && npc !== Npc.Chef) {
      // The daycare lady, the groomer, the channeler, the maniac, the
      // scientist and Kurt act the moment something is pressed, so
      // there is nothing left to agree to: a button here would only
      // ask the question twice
      return null;
    }

    // Both open a window of their own, and what is picked in it is
    // agreed to in another — so the bar itself only ever offers the two
    // words
    return (
      <>
        <Button
          tone="primary"
          disabled={busy()}
          onClick={() => {
            setStatus(null);
            setCounter('buy');
          }}
        >
          Buy
        </Button>
        <Button
          disabled={busy()}
          onClick={() => {
            setStatus(null);
            setCounter('sell');
          }}
        >
          Sell
        </Button>
      </>
    );
  };

  /**
   * The scale is gone and the move is back. The bag is re-read the way
   * a trade re-reads it, since that is where the scale went from
   */
  const remembered = (): void => {
    forget();
    setStatus('He hummed, tapped its head, and it remembered. (−1 Heart Scale)');
    props.onTraded();
    props.onServed();
    props.onChange?.();
  };

  /**
   * The fee is gone and the lesson took. The purse is re-read the way
   * a trade re-reads it, since that is where the fee went from
   */
  const tutored = (): void => {
    forget();
    setStatus('One lesson, well spent. (−1 Heart Scale)');
    props.onTraded();
    props.onServed();
    props.onChange?.();
  };

  return (
    <>
      <Dialog
        isOpen={props.standing != null && reminding() == null && tutoring() == null}
        onClose={close}
        title={who()}
        terse
        description="Somebody passing through with an offer, gone when the window turns. Most
        will serve you once; the vendor trades as long as your purse holds, and the two who take
        a Heart Scale as long as you have scales."
      >
        <Show when={showing()}>
          {(standing) => (
            <>
              {/* The person themselves, off their overworld charset —
                  the same figure the player just walked up to. The
                  room is held whether or not the sheet has landed, so
                  the dialog does not change shape under a player who
                  already knows it.

                  What they say goes under them rather than in the
                  dialog's description, where it was the game's voice
                  rather than theirs */}
              <div class="flex flex-col items-center gap-2 pt-1 text-center">
                <NpcSprite
                  npc={standing()[1]}
                  sheet={props.snapshot?.getWandererCoats().get(standing()[0])}
                  label=""
                />
                <blockquote class="m-0 max-w-prose text-sm text-muted italic">
                  “{NPC_QUOTES[standing()[1]]}”
                </blockquote>
              </div>

              <Show when={standing()[1] === Npc.Breeder}>
                <BreederCounter
                  options={offers()}
                  chosen={chosen()}
                  compatible={compatible()}
                  onPick={(picked) => {
                    setStatus(null);
                    setChosen(picked);
                  }}
                />
              </Show>
              <Show when={standing()[1] === Npc.NurseJoy}>
                <NurseCounter
                  options={offers()}
                  busy={busy()}
                  needsCare={(option) => needsCare(option.caught)}
                  onHeal={(id) => {
                    tendParty([id]);
                  }}
                />
              </Show>
              <Show when={standing()[1] === Npc.DaycareLady}>
                {/* Centred, like everything else she is standing in
                    the middle of: one egg, one price, and the box the
                    egg is picked out of */}
                <DaycareCounter
                  options={offers()}
                  warmed={props.warmed.latest === true}
                  fee={DAYCARE_FEE}
                  onWarm={pushEgg}
                />
              </Show>
              <Show when={standing()[1] === Npc.Groomer}>
                <GroomerCounter options={offers()} fee={GROOMING_FEE} onGroom={groom} />
              </Show>

              <Show when={standing()[1] === Npc.Channeler}>
                <ChannelerCounter
                  options={offers()}
                  scales={scales()}
                  fee={CHANNELER_FEE}
                  busy={busy()}
                  onChannel={channel}
                />
              </Show>

              <Show when={standing()[1] === Npc.MoveReminder}>
                <ReminderCounter
                  options={offers()}
                  scales={scales()}
                  fee={REMINDER_FEE}
                  picked={remindee()}
                  chosen={recall()}
                  busy={busy()}
                  onPick={(id) => {
                    setStatus(null);
                    setRecall(null);
                    setRemindee(id);
                  }}
                  onChoose={(move) => {
                    setRecall(move);
                  }}
                />
              </Show>

              <Show when={standing()[1] === Npc.MoveTutor}>
                <TutorCounter
                  options={offers()}
                  scales={scales()}
                  fee={TUTOR_FEE}
                  picked={tutee()}
                  chosen={lesson()}
                  busy={busy()}
                  onPick={(id) => {
                    setStatus(null);
                    setLesson(null);
                    setTutee(id);
                  }}
                  onChoose={(move) => {
                    setLesson(move);
                  }}
                />
              </Show>

              <Show when={standing()[1] === Npc.FossilManiac}>
                <FossilCounter
                  offer={offer()}
                  gold={props.gold.latest ?? 0}
                  busy={busy()}
                  sold={props.visited.latest === true}
                  onBuy={buyRock}
                />
              </Show>

              <Show when={standing()[1] === Npc.FossilScientist}>
                <ReviveCounter fossils={fossils()} busy={busy()} onRevive={openRock} />
              </Show>

              <Show when={standing()[1] === Npc.Kurt}>
                <KurtCounter
                  apricorns={apricorns()}
                  busy={busy()}
                  ballName={ballName}
                  onCarve={carve}
                />
              </Show>

              <Show when={standing()[1] === Npc.Vendor || standing()[1] === Npc.Chef}>
                <VendorCounter gold={props.gold.latest ?? 0} />
              </Show>

              <Status message={status()} />
            </>
          )}
        </Show>

        {/* Everything that acts, on the bar with the way out.

            They were scattered down the panel — under a picker, under a
            list, under a summary — so a player who had chosen what they
            wanted had to look for the button that did it, and in the
            reminder's case scroll past a list of moves to find it. The
            bar is where a dialog is answered */}
        <DialogActions>
          {/* Keyed on the pair rather than on the npc: `Npc.Breeder`
              is 0, and a `Show` asked about it is a `Show` asked about
              a falsy value — the breeder's own button was the one
              thing this row never drew */}
          <Show when={showing()} keyed>
            {(standing) => npcActions(standing[1])}
          </Show>
          <Button onClick={close}>Walk on</Button>
        </DialogActions>
      </Dialog>

      {/* His crate, or the player's bag, as a window of its own.

          It stands beside the counter rather than inside it: a tray of
          thirty squares unfolded into the dialog pushed everything
          under it — the total, the buttons — off the screen */}
      <InventoryPicker
        open={counter() != null}
        keepOpen
        onClose={() => {
          setCounter(null);
        }}
        player={props.player}
        title={counter() === 'sell' ? 'Sell' : 'Buy'}
        // The squares say what he has and what it costs, so the
        // sentence is kept for the screen reader and off the screen
        terse
        // What is in the purse, under the crate it is spent on: it is
        // the number every press on this window changes, and it was
        // one screen behind on the counter
        below={<Badge tone="gold">{props.gold.latest ?? 0} gold</Badge>}
        description={
          counter() === 'sell'
            ? 'Press what you are selling, then say how many.'
            : 'Press what you are buying, then say how many.'
        }
        verb={counter() === 'sell' ? 'Sell' : 'Buy'}
        entries={counter() === 'sell' ? props.bag.latest : crate()}
        disabled={busy()}
        value={null}
        carried={(entry) => carrying(entry.item)}
        // He has as many of anything as a player wants, so a count on
        // his crate is a number that never moves
        counts={counter() === 'sell'}
        empty={
          counter() === 'sell'
            ? 'Nothing in your bag is worth anything to him.'
            : 'His crate is empty.'
        }
        filter={(entry) => counter() !== 'sell' || priceOf(entry.item, false) > 0}
        // What the purse will not stretch to is greyed where it stands,
        // rather than left out: what he stocks is the same crate
        // whatever a player is carrying
        blocked={(entry) =>
          counter() !== 'sell' && priceOf(entry.item, true) > (props.gold.latest ?? 0)
            ? 'More than you hold'
            : null
        }
        // Short enough to sit in the corner of a square: the tray has no
        // room for a sentence, and the number is the news
        note={(entry) => `${priceOf(entry.item, counter() !== 'sell')}g`}
        // The same number again, in words, over the button that spends
        // it. The corner badge is four characters read at a glance
        // across thirty squares; the card is where one square is being
        // decided on, and "200g" there is a number without a currency
        card={(entry) => (
          <Detail label={counter() === 'sell' ? 'He pays' : 'Costs'}>
            {priceOf(entry.item, counter() !== 'sell')} gold
          </Detail>
        )}
        // How many of one line he will part with, or take: the purse
        // decides a purchase and the bag decides a sale, and the
        // trade limit is over both so a slip of the keyboard cannot
        // ask for a hundred thousand potions
        most={(entry) =>
          counter() === 'sell'
            ? Math.min(VENDOR_TRADE_LIMIT, entry.amount)
            : Math.max(
                1,
                Math.min(
                  VENDOR_TRADE_LIMIT,
                  Math.floor((props.gold.latest ?? 0) / Math.max(1, priceOf(entry.item, true))),
                ),
              )
        }
        // What the count comes to, which is the number the decision is
        // actually about: the price on the square is one of them
        sum={(item, amount) => (
          <Meta>
            {amount} × {priceOf(item, counter() !== 'sell')} gold ={' '}
            <strong>{priceOf(item, counter() !== 'sell') * amount} gold</strong>
          </Meta>
        )}
        refuse={(item, amount) =>
          counter() !== 'sell' && priceOf(item, true) * amount > (props.gold.latest ?? 0)
            ? 'More than you hold.'
            : null
        }
        onPick={(item, amount) => {
          if (item != null && amount > 0) {
            trade(item, amount, counter() !== 'sell');
          }
        }}
      />

      {/* The last step of the reminder is the teaching itself, which is
        the same question a machine asks — whether there is room, and
        which move goes if there is not. It is that dialog, paid for
        with a scale, rather than a second one shaped like it */}
      <TeachMoveDialog
        catchId={reminding()?.[0] ?? null}
        move={reminding()?.[1] ?? null}
        cost="The Heart Scale"
        teach={remind}
        onClose={() => {
          setReminding(null);
        }}
        onTaught={remembered}
      />

      {/* And the tutor's last step, which is the same question again:
        whether there is room, and which move goes if there is not */}
      <TeachMoveDialog
        catchId={tutoring()?.[0] ?? null}
        move={tutoring()?.[1] ?? null}
        cost="The Heart Scale"
        teach={tutor}
        onClose={() => {
          setTutoring(null);
        }}
        onTaught={tutored}
      />
    </>
  );
}

/**
 * Somebody standing out in the world with an offer.
 *
 * The box, the purse and the bag are read one component down, under
 * this boundary: read here they would throw to the page and take the
 * world with them in the middle of a trade
 */
export default function NpcDialog(props: NpcDialogProps): JSX.Element {
  // Bumped after every trade, so the purse and the bag catch up with
  // what was just bought or sold; served counts the free visits, for
  // the reads that follow the window rather than the purse
  const [traded, setTraded] = createSignal(0);
  const [served, setServed] = createSignal(0);

  // Both lists are drawn from this one read: the pair the breeder
  // wants and the egg the daycare lady wants are the same records,
  // asked two different questions
  const [catches, { refetch }] = createResource(
    () => (props.standing == null ? null : props.player),
    async (player): Promise<CatchOption[]> => {
      const [owned, now] = await Promise.all([listCaught(player), syncServerClock()]);

      return owned.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, now) }));
    },
  );

  const [gold] = createResource(
    () => (props.standing == null ? null : ([props.player, traded()] as const)),
    async ([player]) => (await getProfile(player))?.gold ?? 0,
  );

  const [bag] = createResource(
    () => (props.standing == null ? null : ([props.player, traded()] as const)),
    async ([player]) => getInventory(player),
  );

  // Whether the maniac has already sold to this player this window.
  // The server refuses a second sale either way; this is what lets
  // the dialog say so instead of offering a dead trade
  const [visited] = createResource(
    () =>
      props.snapshot == null || props.standing?.[1] !== Npc.FossilManiac
        ? null
        : ([props.snapshot, props.standing[0], traded()] as const),
    async ([snapshot, cell]) => hasVisited(snapshot, 'fossil', cell),
  );

  // Whether the daycare lady has already taken an egg this window.
  // One is her rule, and this is what greys the box afterwards rather
  // than leaving a press the server refuses
  const [warmed] = createResource(
    () =>
      props.snapshot == null || props.standing?.[1] !== Npc.DaycareLady
        ? null
        : ([props.snapshot, props.standing[0], served()] as const),
    async ([snapshot, cell]) => hasVisited(snapshot, 'daycare', cell),
  );

  return (
    <NpcCounter
      {...props}
      catches={catches}
      gold={gold}
      bag={bag}
      visited={visited}
      warmed={warmed}
      onServed={() => {
        setServed((count) => count + 1);
        Promise.resolve(refetch()).catch(() => undefined);
      }}
      onTraded={() => {
        setTraded((count) => count + 1);
      }}
    />
  );
}
