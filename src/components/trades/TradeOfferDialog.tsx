import type { JSX } from '@solidjs/web';
import { Show, createEffect, createSignal } from 'solid-js';
import { getBuddy } from '../../auth/buddy';
import { countCaught, isFavorite } from '../../auth/caught';
import { isEgg } from '../../model/egg';
import { type Profile, watchProfile } from '../../auth/profile';
import { TRADE_GOLD_LIMIT, offerTrade } from '../../auth/trades';
import { useGame } from '../app/game-context';
import watchLive from '../app/watch';
import { createLoad } from '../app/create-load';
import CatchPicker, { type CatchOption } from '../catches/catch-picker';
import { Button, Dialog, DialogActions, Meta, Pill, Segmented, useToast } from '../styled';
import PickBox from './PickBox';
import SwapIcon from './SwapIcon';
import { formatNumber } from '../../i18n/format';
import { m } from '../../i18n/paraglide/messages.js';

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
  /** Who the offer is for: kept through the fade that closes it */
  friend: string | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called once the closing fade is over */
  onGone?: () => void;
}

/** Which way the gold on the offer points */
type GoldMode = 'none' | 'give' | 'ask';

function readGoldModes(): { value: GoldMode; label: string }[] {
  return [
    { value: 'none', label: m.trade_gold_none() },
    { value: 'give', label: m.trade_gold_give() },
    { value: 'ask', label: m.trade_gold_ask() },
  ];
}

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
    () => ({ friend: props.friend, open: props.isOpen }),
    ({ open }) => {
      if (!open) {
        return;
      }
      setOffered(null);
      setAsked(null);
      setGoldMode('none');
      setAmount(0);
      setPicking(null);
      setSending(false);
    },
  );

  // Watched rather than `from`: this dialog is mounted for the whole
  // session and nobody is being offered to when it is created
  const theirs = watchLive<string, Profile | null>(
    () => props.friend,
    (friend, set) =>
      watchProfile(friend, (record) => {
        set(record);
      }),
  );
  const mine = watchLive<string, Profile | null>(
    () => props.player,
    (player, set) =>
      watchProfile(player, (record) => {
        set(record);
      }),
  );

  const named = (): string => theirs()?.nickname ?? m.trade_this_trainer();

  const gold = (): number => mine()?.gold ?? 0;

  // Read without waiting: the reasons below are asked of every row,
  // and a row is offered until they say otherwise
  const buddy = createLoad(
    () => (props.isOpen ? props.player : null),
    async (uid) => getBuddy(uid),
  );
  const onlyOne = createLoad(
    () => (props.isOpen ? props.player : null),
    async (uid) => (await countCaught(uid)) <= 1,
  );

  /**
   * Why one of the player's own cannot go out. The same list an
   * auction reads, since both take the pokemon out of their hands
   */
  const offeringReason = (option: CatchOption): string | null => {
    if (onlyOne.latest() === true) {
      return m.trade_reason_only();
    }
    if (option.fighting) {
      return m.trade_reason_battle();
    }
    if (isEgg(option.caught)) {
      return m.trade_reason_egg();
    }
    if (isFavorite(option.caught)) {
      return m.trade_reason_favorite();
    }
    return buddy.latest() === option.id ? m.trade_reason_buddy() : null;
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
          toast.push({ message: m.trade_offer_failed(), tone: 'ember' });
          return;
        }
        toast.push({ message: m.trade_offer_sent({ name: named() }), tone: 'leaf' });
        // The offered pokemon just left the records for escrow, and
        // whatever box is open behind this is showing the old list
        game.touchRecords();
        props.onClose();
      })
      .catch(() => {
        toast.push({ message: m.trade_offer_failed(), tone: 'ember' });
      })
      .finally(() => {
        setSending(false);
      });
  };

  return (
    <>
      <Dialog
        isOpen={props.isOpen && picking() == null}
        onClose={props.onClose}
        afterLeave={props.onGone}
        width="wider"
        title={m.trade_title({ name: named() })}
        description={m.trade_description()}
      >
        <div class="flex flex-col gap-3.5">
          {/* The two sides face each other across a swap mark; on a
              phone they stack with the mark between */}
          <div class="flex flex-col items-stretch gap-2.5 sm:flex-row">
            <section class="flex min-w-0 flex-1 flex-col gap-2.5 rounded-card border-2 border-tide bg-tide-soft/40 p-3.5">
              <h4 class="text-tide-dark">{m.trade_you_give()}</h4>
              <PickBox id={offered()} empty={m.trade_nothing_picked()}>
                <Button
                  onClick={() => {
                    setPicking('mine');
                  }}
                >
                  {offered() == null ? m.trade_pick_yours() : m.ui_change()}
                </Button>
              </PickBox>
              <Show when={goldMode() === 'give' && riding() > 0}>
                <Pill tone="gold" size="medium" class="self-start">
                  {m.trade_gold_from_you({ gold: formatNumber(riding()) })}
                </Pill>
              </Show>
            </section>

            <span
              role="img"
              aria-label={m.trade_swap()}
              class="flex size-11 shrink-0 items-center justify-center self-center rounded-full
                bg-tide text-on-accent shadow-[0_3px_0_0_var(--blue-shade)]"
            >
              <SwapIcon class="size-5 max-sm:rotate-90" />
            </span>

            <section class="flex min-w-0 flex-1 flex-col gap-2.5 rounded-card border-2 border-gold bg-gold-soft/50 p-3.5">
              <h4 class="text-gold-dark">{m.trade_you_ask()}</h4>
              <PickBox
                id={asked()}
                empty={m.trade_for_their_pick({ name: named() })}
                note={m.trade_named_exactly()}
              >
                <Button
                  onClick={() => {
                    setPicking('theirs');
                  }}
                >
                  {asked() == null ? m.trade_ask_for_one() : m.ui_change()}
                </Button>
              </PickBox>
              <Button
                tone="quiet"
                class="self-start"
                disabled={asked() == null}
                onClick={() => {
                  setAsked(null);
                }}
              >
                {m.trade_their_pick()}
              </Button>

              <Show when={goldMode() === 'ask' && riding() < 0}>
                <Pill tone="gold" size="medium" class="self-start">
                  {m.trade_gold_from_them({ gold: formatNumber(-riding()) })}
                </Pill>
              </Show>
            </section>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <h4>{m.trade_gold()}</h4>
            <Segmented
              label={m.trade_gold()}
              value={goldMode()}
              options={readGoldModes()}
              onChange={(mode) => {
                setGoldMode(mode);
              }}
            />
            <Show when={goldMode() !== 'none'}>
              <input
                type="number"
                aria-label={m.trade_amount()}
                class="h-10 w-[140px]"
                min={0}
                max={most()}
                value={amount()}
                onInput={(event) => {
                  setAmount(Number(event.currentTarget.value));
                }}
              />
              <Meta>
                {goldMode() === 'give'
                  ? m.trade_gold_taken_now({ gold: formatNumber(gold()) })
                  : m.trade_gold_taken_later()}
              </Meta>
            </Show>
          </div>

          <Meta>{m.trade_ask_note()}</Meta>
        </div>

        <DialogActions stack>
          <Button tone="primary" disabled={!ready()} onClick={send}>
            {m.trade_send()}
          </Button>
          <Button onClick={props.onClose}>{m.ui_never_mind()}</Button>
        </DialogActions>
      </Dialog>

      {/* The two boxes, each opened in the trade dialog's place rather
          than over it: two panels fighting for the close press is the
          thing being avoided */}
      <CatchPicker
        fill
        open={picking() === 'mine'}
        onClose={() => {
          setPicking(null);
        }}
        title={m.trade_your_side()}
        description={m.trade_your_side_description()}
        verb={m.trade_offer()}
        value={offered()}
        reason={offeringReason}
        onPick={(id) => {
          setOffered(id);
        }}
      />
      <CatchPicker
        fill
        open={picking() === 'theirs'}
        onClose={() => {
          setPicking(null);
        }}
        player={props.friend ?? undefined}
        title={m.trade_their_side({ name: named() })}
        description={m.trade_their_side_description()}
        verb={m.trade_ask_for()}
        value={asked()}
        filter={(option) => !isEgg(option.caught)}
        reason={(option) => (isFavorite(option.caught) ? m.trade_reason_their_favorite() : null)}
        onPick={(id) => {
          setAsked(id);
        }}
      />
    </>
  );
}
