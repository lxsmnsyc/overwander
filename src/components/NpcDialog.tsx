import { For, type JSX, type ParentProps, Show, createResource, createSignal } from 'solid-js';
import { isLockLive } from '../auth/battle-lock';
import { type CaughtPokemon, isGuarded, listCaught } from '../auth/caught';
import { syncServerClock } from '../auth/clock';
import { isShadow } from '../auth/caught-record';
import { boostedSteps, isEgg, stepsRemaining } from '../auth/egg';
import { describeFriendship, groomedFriendship } from '../data/constants/friendship';
import { type InventoryEntry, getInventory } from '../auth/inventory';
import { getProfile } from '../auth/profile';
import {
  boostEgg,
  breed,
  buyFromVendor,
  groomCatch,
  remindMove,
  sellToVendor,
  visitNurse,
} from '../auth/npcs';
import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import { getItemData } from '../data/items';
import Npc, {
  BREEDING_FEE,
  DAYCARE_FEE,
  GROOMING_FEE,
  NPC_NAMES,
  NURSE_CARE_LIMIT,
  REMINDER_FEE,
  getRecallableMoves,
} from '../data/overworld/npc';
import { VENDOR_TRADE_LIMIT, isMarketable } from '../data/overworld/vendor';
import { type BreedingParent, canBreed } from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import CatchPicker, { type CatchOption } from './CatchPicker';
import InventoryPicker, { type ItemAmount, describeItem } from './InventoryPicker';
import TeachMoveDialog, { MoveLine } from './TeachMoveDialog';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogSection,
  List,
  ListRow,
  Meta,
  Note,
  Row,
  RowButton,
  Status,
} from './styled';

/**
 * What the person standing there actually says. It is set apart from
 * the game's own words, because it is somebody talking rather than the
 * game explaining
 */
function Says(props: ParentProps): JSX.Element {
  return <p class="border-l-2 border-leaf/40 pl-3 text-sm text-muted italic">{props.children}</p>;
}

/**
 * A catch as the breeding rules read one
 */
function asParent(caught: CaughtPokemon): BreedingParent {
  return {
    species: caught.species,
    gender: caught.gender,
    ivs: caught.ivs,
    moves: caught.moves,
    shadow: isShadow(caught),
    egg: isEgg(caught),
  };
}

/**
 * A trade the player has put together but not yet agreed to: which way
 * it goes, and what is in it
 */
interface Basket {
  buying: boolean;
  picks: ItemAmount[];
}

/**
 * What one of these costs, from whichever side of the counter it is
 * being looked at. He charges `buy` and pays `sell`, and `sell` is
 * half of `buy` everywhere
 */
function priceOf(item: Items, buying: boolean): number {
  const data = getItemData(item);

  return buying ? data.buy : data.sell;
}

/**
 * What the whole basket comes to
 */
function totalOf(basket: Basket): number {
  let total = 0;

  for (const [item, amount] of basket.picks) {
    total += priceOf(item, basket.buying) * amount;
  }
  return total;
}

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
export default function NpcDialog(props: NpcDialogProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  const [chosen, setChosen] = createSignal<string[]>([]);
  const [busy, setBusy] = createSignal(false);
  // What has been picked out of the crate or the bag but not yet
  // agreed to. A trade is two steps on purpose: the picker is where
  // the player says what they want, and the summary is where they see
  // what it comes to before any gold moves
  const [basket, setBasket] = createSignal<Basket | null>(null);
  // Which side of the counter is being looked at, or null while the
  // player has only been offered the two words
  const [counter, setCounter] = createSignal<'buy' | 'sell' | null>(null);
  // Bumped after every trade, so the purse and the bag catch up with
  // what was just bought or sold
  const [traded, setTraded] = createSignal(0);
  // What the Move Reminder has been told so far: which pokemon, and
  // which of the moves it has lost. `reminding` is the two of them
  // agreed to, and while it is set this dialog is closed — the
  // teaching is a dialog of its own, and one modal over another
  // fights it for the closing click
  const [remindee, setRemindee] = createSignal<string | null>(null);
  const [recall, setRecall] = createSignal<Moves | null>(null);
  const [reminding, setReminding] = createSignal<[catchId: string, move: Moves] | null>(null);

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

  /**
   * The purse and the bag. Both are re-read after every trade, since a
   * sale moves one and a purchase moves both
   */
  const [gold] = createResource(
    () => (props.standing == null ? null : ([props.player, traded()] as const)),
    async ([player]) => (await getProfile(player))?.gold ?? 0,
  );

  const [bag] = createResource(
    () => (props.standing == null ? null : ([props.player, traded()] as const)),
    async ([player]) => getInventory(player),
  );

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
   * What stands in for a stack's count is **what the purse will take** —
   * he has as many potions as anyone wants, and the number that matters
   * to the player is how many of them they can afford. A kind they
   * cannot afford one of is left out rather than shown and refused
   */
  const crate = (): InventoryEntry[] =>
    stock()
      .map((item) => ({
        user: props.player,
        item,
        amount: Math.min(VENDOR_TRADE_LIMIT, Math.floor((gold() ?? 0) / priceOf(item, true))),
      }))
      .filter((entry) => entry.amount > 0);

  const pair = (): [CatchOption, CatchOption] | null => {
    const picked = chosen();

    if (picked.length !== 2) {
      return null;
    }

    const found = picked.map((id) => (catches() ?? []).find((entry) => entry.id === id));

    return found[0] == null || found[1] == null ? null : [found[0], found[1]];
  };

  const compatible = (): boolean => {
    const chosenPair = pair();

    return (
      chosenPair != null && canBreed(asParent(chosenPair[0].caught), asParent(chosenPair[1].caught))
    );
  };

  /**
   * Who is standing there. The dialog is named after them, and it is
   * named whether or not somebody has been walked up to yet
   */
  const who = (): string => {
    const npc = props.standing?.[1];

    return npc == null ? 'Somebody' : NPC_NAMES[npc];
  };

  /**
   * How many Heart Scales are in the bag. It is the reminder's whole
   * price, and it is read off the same bag the vendor's picker reads
   */
  const scales = (): number =>
    (bag() ?? []).find((entry) => entry.item === REMINDER_FEE)?.amount ?? 0;

  /**
   * Which pokemon has been picked out for the reminder
   */
  const remembering = (): CatchOption | null =>
    (catches() ?? []).find((option) => option.id === remindee()) ?? null;

  /**
   * What he could give this one back: everything its species learns by
   * levelling up to its level, minus the moves it still knows. It is
   * derived, so the client works it out for the list and the server
   * works it out again from the stored record before taking the scale
   */
  const forgotten = (): Moves[] => {
    const option = remembering();

    return option == null
      ? []
      : getRecallableMoves(option.caught.species, option.caught.level, option.caught.moves);
  };

  const forget = (): void => {
    setRemindee(null);
    setRecall(null);
  };

  const close = (): void => {
    setStatus(null);
    setChosen([]);
    setCounter(null);
    setBasket(null);
    forget();
    setReminding(null);
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
      .then(async (egg) => {
        setBusy(false);

        if (egg == null) {
          setStatus(
            'The breeder handed them back — that pair, that price, or you have already left a pair with him this while.',
          );
          return;
        }
        setChosen([]);
        setStatus(`An egg. It is yours — carry it as your buddy and walk. (−${BREEDING_FEE} gold)`);
        await refetch();
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
      .then(async (tended) => {
        setBusy(false);
        setStatus(
          tended == null
            ? 'She looked them over and handed them straight back — there was nothing to do, or she has already seen you this while.'
            : `She looked after ${tended.length} of them. Right as rain.`,
        );
        await refetch();
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
      .then(async (steps) => {
        setBusy(false);
        setStatus(
          steps == null
            ? 'She would not take it — it may be ready already, or she has already warmed one for you this while.'
            : `She warmed it along to ${steps} steps. (−${DAYCARE_FEE} gold)`,
        );
        await refetch();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
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
      .then(async (friendship) => {
        setBusy(false);
        setStatus(
          friendship == null
            ? 'He would not take it — it may think as well of you as it can already, or he has already seen you this while.'
            : `Brushed, fussed over and handed back ${describeFriendship(friendship)}. (−${GROOMING_FEE} gold)`,
        );
        await refetch();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Agree to what is in the basket.
   *
   * The whole of it is one trade — one call, one transaction, one
   * write to the purse and one to the bag — so a basket a player
   * agreed to lands entire or not at all. A line the vendor will not
   * price, or a stack sold from another tab, refuses the trade rather
   * than quietly selling the rest of it
   */
  const settle = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const deal = basket();

    if (snapshot == null || standing == null || deal == null || deal.picks.length === 0) {
      return;
    }
    setStatus(null);
    setBusy(true);
    (deal.buying
      ? buyFromVendor(snapshot, standing[0], deal.picks)
      : sellToVendor(snapshot, standing[0], deal.picks)
    )
      .then((done) => {
        setBusy(false);
        setBasket(null);

        if (done == null) {
          setStatus(
            deal.buying
              ? 'He would not sell you that — something in it is not in his crate, or your purse will not cover the lot.'
              : 'He would not take that — something in it is worth nothing to him, or you have not got it.',
          );
          return;
        }

        const moved = totalOf(deal);

        setStatus(
          deal.buying
            ? `He handed it over and counted your gold. (−${moved} gold)`
            : `He looked it over and paid up. (+${moved} gold)`,
        );
        setTraded(traded() + 1);
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
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
  const remind = async (
    catchId: string,
    move: Moves,
    replaces: number,
  ): Promise<Moves[] | null> => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return null;
    }
    return remindMove(snapshot, standing[0], catchId, move, replaces);
  };

  /**
   * The scale is gone and the move is back. The bag is re-read the way
   * a trade re-reads it, since that is where the scale went from
   */
  const remembered = (): void => {
    forget();
    setStatus('He hummed, tapped its head, and it remembered. (−1 Heart Scale)');
    setTraded(traded() + 1);
    Promise.resolve(refetch())
      .then(() => {
        props.onChange?.();
      })
      .catch(() => undefined);
  };

  return (
    <>
      <Dialog
        isOpen={props.standing != null && reminding() == null}
        onClose={close}
        title={who()}
        description="Somebody standing out here with an offer. They will be gone when the window
        turns over, and each of them takes you up on it once while they are here — the vendor
        as often as your purse allows."
      >
        <Show when={props.standing}>
          {(standing) => (
            <>
              <Show when={standing()[1] === Npc.Breeder}>
                <DialogSection>
                  <Says>
                    "Leave two of yours with me — {BREEDING_FEE} gold — and you will have an egg of
                    them. It takes after both."
                  </Says>
                  {/* The pair is picked with the same list every other
                    part of the game picks a pokemon with; what makes
                    it a breeding pair is the two, and the rule about
                    what can be one */}
                  <CatchPicker
                    inline
                    multiple
                    max={2}
                    options={catches()}
                    value={chosen()}
                    verb="Leave"
                    empty="You have nothing to leave."
                    filter={(option) => !isEgg(option.caught) && !option.fighting}
                    note={(option) => (isShadow(option.caught) ? 'shadow' : null)}
                    onPick={(picked) => {
                      setStatus(null);
                      setChosen(picked);
                    }}
                  />
                  {/* The pairing is checked here only so the button can
                    say so first; the refusal itself is the server's */}
                  <Status
                    message={
                      chosen().length === 2 && !compatible()
                        ? 'Those two will have nothing to do with each other.'
                        : null
                    }
                  />
                  <Row>
                    <Button tone="primary" disabled={busy() || !compatible()} onClick={submitPair}>
                      Leave them ({BREEDING_FEE} gold)
                    </Button>
                  </Row>
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.NurseJoy}>
                <DialogSection>
                  <Says>
                    "Leave them with me — all of them, if you like. No charge. And if one of them is
                    carrying a shadow, I will see to that too."
                  </Says>
                  {/* She is free, so what keeps her from being a tap is
                    the window: one visit per player while she is
                    standing here */}
                  <CatchPicker
                    inline
                    multiple
                    max={NURSE_CARE_LIMIT}
                    options={catches()}
                    value={[]}
                    verb="Hand over"
                    empty="You have nothing for her to look at."
                    filter={(option) => !isEgg(option.caught) && !option.fighting}
                    reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
                    note={(option) =>
                      isShadow(option.caught) ? 'shadow — she would purify it' : null
                    }
                    onPick={tendParty}
                  />
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.DaycareLady}>
                <DialogSection>
                  <Says>
                    "Bring me an egg — {DAYCARE_FEE} gold — and I will warm it half a walk's worth.
                    Wherever it is now, it will be that much further along."
                  </Says>
                  {/* The note on each row is what the fee actually buys
                    that egg: half of a long walk is further than half
                    of a short one */}
                  <CatchPicker
                    inline
                    options={catches()}
                    value={null}
                    verb="Warm"
                    empty="You have no egg for her."
                    filter={(option) =>
                      isEgg(option.caught) && !option.fighting && stepsRemaining(option.caught) > 0
                    }
                    note={(option) => `${option.caught.steps} → ${boostedSteps(option.caught)}`}
                    onPick={(id) => {
                      if (id != null) {
                        pushEgg(id);
                      }
                    }}
                  />
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.Groomer}>
                <DialogSection>
                  <Says>
                    "Leave one with me — {GROOMING_FEE} gold — and I will see to it properly. It
                    will think half again as much of you when I hand it back."
                  </Says>
                  {/* The note is what the fee actually buys this
                    pokemon: half of what it has left to give, which is
                    a great deal to one just out of its ball and next
                    to nothing to one that already adores its owner */}
                  <CatchPicker
                    inline
                    options={catches()}
                    value={null}
                    verb="Groom"
                    empty="You have nothing for him to see to."
                    filter={(option) =>
                      !isEgg(option.caught) &&
                      !option.fighting &&
                      groomedFriendship(option.caught.friendship) > option.caught.friendship
                    }
                    note={(option) =>
                      `${option.caught.friendship} → ${groomedFriendship(option.caught.friendship)}`
                    }
                    onPick={(id) => {
                      if (id != null) {
                        groom(id);
                      }
                    }}
                  />
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.MoveReminder}>
                <DialogSection>
                  <Says>
                    "There is not a move in the world that is truly gone — only ones nobody has
                    reminded them of. Bring me one of yours and a Heart Scale, and it will
                    remember."
                  </Says>
                  <Row>
                    <Badge tone={scales() > 0 ? 'leaf' : 'ember'}>
                      {scales()} Heart {scales() === 1 ? 'Scale' : 'Scales'}
                    </Badge>
                  </Row>

                  {/* Both inputs are on the counter the moment he is
                    walked up to: the pokemon, and what that pokemon
                    has lost. There is nothing to agree to first — what
                    he offers *is* the two of them — so the button is
                    the only step, and it stays dead until they are
                    both filled in and a scale is in the bag.

                    The pickers are inline rather than dialogs of their
                    own, since this is already one */}
                  <CatchPicker
                    inline
                    options={catches()}
                    value={remindee()}
                    verb="Remind"
                    empty="You have nothing that has forgotten anything."
                    filter={(option) =>
                      !isEgg(option.caught) &&
                      !option.fighting &&
                      getRecallableMoves(
                        option.caught.species,
                        option.caught.level,
                        option.caught.moves,
                      ).length > 0
                    }
                    reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
                    note={(option) =>
                      `${
                        getRecallableMoves(
                          option.caught.species,
                          option.caught.level,
                          option.caught.moves,
                        ).length
                      } forgotten`
                    }
                    onPick={(id) => {
                      setStatus(null);
                      setRecall(null);
                      setRemindee(id);
                    }}
                  />

                  {/* The second input only means anything once the
                      first is answered: what has been forgotten is a
                      question about a particular pokemon */}
                  <Show when={remembering()} fallback={<Note>Choose one of yours first.</Note>}>
                    <Meta>What it has learned and lost:</Meta>
                    <List>
                      <For each={forgotten()}>
                        {(move) => (
                          <ListRow selected={recall() === move}>
                            <RowButton
                              pressed={recall() === move}
                              disabled={busy()}
                              onClick={() => {
                                setRecall(move);
                              }}
                            >
                              <MoveLine move={move} />
                            </RowButton>
                          </ListRow>
                        )}
                      </For>
                    </List>
                  </Show>

                  <Row>
                    <Button
                      tone="primary"
                      disabled={busy() || scales() < 1 || remindee() == null || recall() == null}
                      onClick={() => {
                        const id = remindee();
                        const move = recall();

                        if (id != null && move != null) {
                          setReminding([id, move]);
                        }
                      }}
                    >
                      Remind it (1 Heart Scale)
                    </Button>
                  </Row>
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.Vendor}>
                <DialogSection title="Trading">
                  <Says>
                    "Balls and medicine, same price as anywhere. And I will take anything off you
                    that is worth something — I am walking on either way."
                  </Says>
                  <Row>
                    <Badge tone="gold">{gold() ?? 0} gold</Badge>
                  </Row>

                  {/* Two steps on purpose. The picker is where the player
                    says what they want, and nothing is spent there; the
                    summary below is where they see what it comes to and
                    agree to it */}
                  <Show
                    when={basket()}
                    fallback={
                      // Neither list is a dialog of its own: this one is
                      // already a dialog, and a modal opened over a modal
                      // fights it for the click that closes it. Pressing
                      // Buy or Sell puts the list here instead
                      <Show
                        when={counter()}
                        fallback={
                          <Row>
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
                          </Row>
                        }
                      >
                        {(side) => (
                          <>
                            <InventoryPicker
                              inline
                              multiple
                              player={props.player}
                              verb={side() === 'buy' ? 'Buy' : 'Sell'}
                              entries={side() === 'buy' ? crate() : bag()}
                              disabled={busy()}
                              value={[]}
                              empty={
                                side() === 'buy'
                                  ? 'Nothing in his crate is within your purse.'
                                  : 'Nothing in your bag is worth anything to him.'
                              }
                              filter={(entry) =>
                                side() === 'buy' ||
                                (isMarketable(entry.item) && priceOf(entry.item, false) > 0)
                              }
                              note={(entry) => `${priceOf(entry.item, side() === 'buy')} gold each`}
                              onPick={(picks) => {
                                setCounter(null);
                                setBasket(
                                  picks.length === 0 ? null : { buying: side() === 'buy', picks },
                                );
                              }}
                            />
                            <Row>
                              <Button
                                disabled={busy()}
                                onClick={() => {
                                  setCounter(null);
                                }}
                              >
                                Never mind
                              </Button>
                            </Row>
                          </>
                        )}
                      </Show>
                    }
                  >
                    {(deal) => (
                      <>
                        <List>
                          <For each={deal().picks}>
                            {([item, amount]) => (
                              <ListRow>
                                <span class="grow">
                                  {describeItem(item)} × {amount}
                                </span>
                                <Meta>{priceOf(item, deal().buying) * amount} gold</Meta>
                              </ListRow>
                            )}
                          </For>
                        </List>
                        <Row>
                          <Badge tone={deal().buying ? 'gold' : 'leaf'}>
                            {deal().buying ? '−' : '+'}
                            {totalOf(deal())} gold
                          </Badge>
                          <Meta>
                            {deal().buying
                              ? `Leaves you ${(gold() ?? 0) - totalOf(deal())}.`
                              : `Leaves you ${(gold() ?? 0) + totalOf(deal())}.`}
                          </Meta>
                        </Row>
                        <Row>
                          <Button
                            tone="primary"
                            disabled={busy() || (deal().buying && totalOf(deal()) > (gold() ?? 0))}
                            onClick={settle}
                          >
                            {deal().buying ? 'Buy them' : 'Sell them'}
                          </Button>
                          <Button
                            disabled={busy()}
                            onClick={() => {
                              setBasket(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </Row>
                      </>
                    )}
                  </Show>
                </DialogSection>
              </Show>

              <Status message={status()} />
            </>
          )}
        </Show>
        <DialogActions>
          <Button onClick={close}>Walk on</Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
}
