import { type JSX, type Resource, Show, createMemo, createSignal } from 'solid-js';
import type { InventoryEntry } from '../../../auth/inventory';
import Npc, { NPC_NAMES } from '../../../data/overworld/npc';
import type { CatchOption } from '../../catches/catch-picker';
import { Button, Dialog } from '../../styled';
import NpcSprite from '../NpcSprite';
import Breeder from './counters/breeder';
import Channeler from './counters/channeler';
import Daycare from './counters/daycare';
import Groomer from './counters/groomer';
import Kurt from './counters/kurt';
import Maniac from './counters/maniac';
import Nurse from './counters/nurse';
import Reminder from './counters/reminder';
import Scientist from './counters/scientist';
import Tutor from './counters/tutor';
import Vendor from './counters/vendor';
import type { NpcDialogProps } from './index';
import { LearnRefusal, type LearnResult } from '../../../auth/learn-refusal';
import TeachMoveDialog from '../../catches/TeachMoveDialog';
import { type CounterProps, type CounterQuestion, NPC_QUOTES } from './shared';

/**
 * The person a player has walked up to, and the dialog they are met
 * in.
 *
 * This is the window and nothing else: who is standing there, what
 * they say, and the way out. What each of them offers is a counter of
 * its own beside this file, holding its own picks, its own status line
 * and its own action row, so walking away from one and up to the next
 * starts a fresh conversation.
 *
 * The box, the purse and the bag are all read here rather than in the
 * body that declared them: read a component up and they would land on
 * the boundary around the whole page, taking the world down while
 * somebody was being served
 */
export default function NpcCounter(
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
   * What every counter is handed. The picks are theirs; what is shared
   * is who is being served and how to say that something landed
   */
  /**
   * What a counter has agreed to and handed up: the teaching, asked
   * outside this window so the two are never up at once
   */
  const [asked, setAsked] = createSignal<CounterQuestion | null>(null);

  const handed = createMemo((): CounterProps => ({
    player: props.player,
    snapshot: props.snapshot,
    standing: props.standing,
    catches: props.catches,
    gold: props.gold,
    bag: props.bag,
    visited: props.visited,
    warmed: props.warmed,
    onServed: props.onServed,
    onTraded: props.onTraded,
    onChange: props.onChange,
    walkOn: () => <Button onClick={props.onClose}>Walk on</Button>,
    ask: (question) => {
      setAsked(question);
    },
  }));

  return (
    <>
      <Dialog
        isOpen={props.standing != null && asked() == null}
        onClose={props.onClose}
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
                the same figure the player just walked up to. The room
                is held whether or not the sheet has landed, so the
                dialog does not change shape under a player who already
                knows it.

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
                <Breeder {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.NurseJoy}>
                <Nurse {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.DaycareLady}>
                <Daycare {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.Groomer}>
                <Groomer {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.Channeler}>
                <Channeler {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.MoveReminder}>
                <Reminder {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.MoveTutor}>
                <Tutor {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.FossilManiac}>
                <Maniac {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.FossilScientist}>
                <Scientist {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.Kurt}>
                <Kurt {...handed()} />
              </Show>
              <Show when={standing()[1] === Npc.Vendor || standing()[1] === Npc.Chef}>
                <Vendor {...handed()} />
              </Show>
            </>
          )}
        </Show>
      </Dialog>

      {/* The last step of a reminder or a lesson is the teaching
          itself, which is the same question a machine asks: whether
          there is room, and which move goes if there is not. It is
          asked here rather than in the counter that agreed to it,
          since the window steps aside while it is up */}
      <TeachMoveDialog
        catchId={asked()?.catchId ?? null}
        move={asked()?.move ?? null}
        cost={asked()?.cost ?? ''}
        teach={async (catchId, move, replaces): Promise<LearnResult> =>
          asked()?.teach(catchId, move, replaces) ?? { refused: LearnRefusal.Gone }
        }
        onClose={() => {
          setAsked(null);
        }}
        onTaught={() => {
          asked()?.onTaught();
        }}
      />
    </>
  );
}
