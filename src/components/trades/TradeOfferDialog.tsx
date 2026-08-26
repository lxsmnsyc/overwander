import { type JSX, Show, createEffect, createResource, createSignal, on } from 'solid-js';
import { getBuddy } from '../../auth/buddy';
import { countCaught, isFavorite } from '../../auth/caught';
import { isEgg } from '../../auth/egg';
import { type Profile, watchProfile } from '../../auth/profile';
import { TRADE_GOLD_LIMIT, offerTrade } from '../../auth/trades';
import { useGame } from '../app/game-context';
import watchLive from '../app/watch';
import CatchPicker, { type CatchOption } from '../catches/catch-picker';
import NamedCatch from './NamedCatch';
import { Button, Dialog, DialogActions, Field, Meta, Note, Row, Select, useToast } from '../styled';

/**
 * Offering a friend a trade: one of the player's pokemon, what is
 * asked in return, and any gold riding along.
 *
 * The asked side may be left to the friend — an open ask they answer
 * with a pick of their own — or named out of their box, which every
 * signed-in player can read.
 */
export interface TradeOfferDialogProps {
  /** The signed-in player, whose pokemon goes out */
  player: string;
  /** Who the offer is for, or null while nobody is */
  friend: string | null;
  onClose: () => void;
}

/** Which way the gold on the offer points */
type GoldMode = 'none' | 'give' | 'ask';

const GOLD_MODES: { value: GoldMode; label: string }[] = [
  { value: 'none', label: 'No gold' },
  { value: 'give', label: 'Add gold to the offer' },
  { value: 'ask', label: 'Ask gold with it' },
];

export default function TradeOfferDialog(props: TradeOfferDialogProps): JSX.Element {
  const game = useGame();
  const toast = useToast();
  const [offered, setOffered] = createSignal<string | null>(null);
  const [asked, setAsked] = createSignal<string | null>(null);
  const [goldMode, setGoldMode] = createSignal<GoldMode>('none');
  const [amount, setAmount] = createSignal(0);
  const [picking, setPicking] = createSignal<'mine' | 'theirs' | null>(null);
  const [sending, setSending] = createSignal(false);

  // A fresh offer every time it opens: what was half-built for one
  // friend says nothing about the next
  createEffect(
    on(
      () => props.friend,
      () => {
        setOffered(null);
        setAsked(null);
        setGoldMode('none');
        setAmount(0);
        setPicking(null);
        setSending(false);
      },
    ),
  );

  // Watched rather than `from`: this dialog is mounted for the whole
  // session and nobody is being offered to when it is created
  const theirs = watchLive<Profile | null>((set) => {
    const friend = props.friend;

    if (friend == null) {
      return null;
    }
    return watchProfile(friend, (record) => {
      set(record);
    });
  });
  const mine = watchLive<Profile | null>((set) =>
    watchProfile(props.player, (record) => {
      set(record);
    }),
  );

  const named = (): string => theirs()?.nickname ?? 'this trainer';

  const gold = (): number => mine()?.gold ?? 0;

  const [buddy] = createResource(
    () => (props.friend == null ? null : props.player),
    async (uid) => getBuddy(uid),
  );
  const [onlyOne] = createResource(
    () => (props.friend == null ? null : props.player),
    async (uid) => (await countCaught(uid)) <= 1,
  );

  /**
   * Why one of the player's own cannot go out. The same list an
   * auction reads, since both take the pokemon out of their hands
   */
  const offeringReason = (option: CatchOption): string | null => {
    if (onlyOne.latest === true) {
      return 'your only pokemon';
    }
    if (option.fighting) {
      return 'in a battle';
    }
    if (isEgg(option.caught)) {
      return 'still an egg';
    }
    if (isFavorite(option.caught)) {
      return 'a favorite';
    }
    return buddy.latest === option.id ? 'your buddy' : null;
  };

  /** How much may ride, held to the purse when it is the player's */
  const most = (): number =>
    goldMode() === 'give' ? Math.min(gold(), TRADE_GOLD_LIMIT) : TRADE_GOLD_LIMIT;

  const riding = (): number => {
    const held = Math.max(0, Math.min(most(), Math.trunc(amount())));

    if (goldMode() === 'give') {
      return held;
    }
    return goldMode() === 'ask' ? -held : 0;
  };

  const ready = (): boolean =>
    offered() != null && !sending() && (goldMode() !== 'give' || riding() <= gold());

  const send = (): void => {
    const friend = props.friend;
    const caught = offered();

    if (friend == null || caught == null || !ready()) {
      return;
    }
    setSending(true);
    offerTrade(friend, caught, asked() ?? '', riding())
      .then((id) => {
        if (id == null) {
          toast.push({ message: 'The offer could not be made.', tone: 'ember' });
          return;
        }
        toast.push({ message: `Offer sent to ${named()}.`, tone: 'leaf' });
        // The offered pokemon just left the records for escrow, and
        // whatever box is open behind this is showing the old list
        game.touchRecords();
        props.onClose();
      })
      .catch(() => {
        toast.push({ message: 'The offer could not be made.', tone: 'ember' });
      })
      .finally(() => {
        setSending(false);
      });
  };

  return (
    <>
      <Dialog
        isOpen={props.friend != null && picking() == null}
        onClose={props.onClose}
        title={`Trade with ${named()}`}
        description="Your pokemon goes to them the moment they accept, and theirs comes to you.
              An offer holds your pokemon until it is answered or taken back."
      >
        <div class="flex flex-col gap-3">
          <Row class="items-center justify-between">
            <span class="font-semibold">
              <Show when={offered()} fallback="Nothing picked yet.">
                {(id) => <NamedCatch id={id()} />}
              </Show>
            </span>
            <Button
              onClick={() => {
                setPicking('mine');
              }}
            >
              {offered() == null ? 'Pick yours' : 'Change'}
            </Button>
          </Row>

          <Row class="items-center justify-between">
            <span class="font-semibold">
              <Show when={asked()} fallback={`For whatever ${named()} picks.`}>
                {(id) => (
                  <>
                    For <NamedCatch id={id()} />
                  </>
                )}
              </Show>
            </span>
            <Row>
              <Show when={asked() != null}>
                <Button
                  onClick={() => {
                    setAsked(null);
                  }}
                >
                  Their pick
                </Button>
              </Show>
              <Button
                onClick={() => {
                  setPicking('theirs');
                }}
              >
                {asked() == null ? 'Ask for one' : 'Change'}
              </Button>
            </Row>
          </Row>

          <Select<GoldMode>
            label="Gold"
            value={goldMode()}
            options={GOLD_MODES}
            onChange={(mode) => {
              setGoldMode(mode);
            }}
          />
          <Show when={goldMode() !== 'none'}>
            <Row class="items-center">
              <Field label="Amount">
                <input
                  type="number"
                  min={0}
                  max={most()}
                  value={amount()}
                  onInput={(event) => {
                    setAmount(Number(event.currentTarget.value));
                  }}
                />
              </Field>
              <Meta>
                {goldMode() === 'give'
                  ? `Taken when the offer is sent · you hold ${gold()}`
                  : 'Taken from them when they accept'}
              </Meta>
            </Row>
          </Show>

          <Note>
            A named ask is exactly what comes back; leave it to their pick and they choose.
          </Note>
        </div>

        <DialogActions>
          <Button onClick={props.onClose}>Never mind</Button>
          <Button tone="primary" disabled={!ready()} onClick={send}>
            Send offer
          </Button>
        </DialogActions>
      </Dialog>

      {/* The two boxes, each opened in the trade dialog's place rather
          than over it: two panels fighting for the close press is the
          thing being avoided */}
      <CatchPicker
        open={picking() === 'mine'}
        onClose={() => {
          setPicking(null);
        }}
        title="Your side"
        description="Choose the pokemon to offer. It is held the moment the offer is sent."
        verb="Offer"
        value={offered()}
        reason={offeringReason}
        onPick={(id) => {
          setOffered(id);
        }}
      />
      <CatchPicker
        open={picking() === 'theirs'}
        onClose={() => {
          setPicking(null);
        }}
        player={props.friend ?? undefined}
        title={`${named()}'s pokemon`}
        description="Name the one you are asking for. It is what crosses back if they accept."
        verb="Ask for"
        value={asked()}
        filter={(option) => !isEgg(option.caught)}
        reason={(option) => (isFavorite(option.caught) ? 'their favorite' : null)}
        onPick={(id) => {
          setAsked(id);
        }}
      />
    </>
  );
}
