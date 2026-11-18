import type { JSX } from '@solidjs/web';
import {
  Loading,
  type ParentProps,
  type Resource,
  Show,
  createResource,
  createSignal,
} from 'solid-js';
import { resolveBuddy, setBuddy } from '../../auth/buddy';
import type { CaughtPokemon } from '../../auth/caught';
import { isShiny } from '../../model/caught-record';
import { isEgg } from '../../model/egg';
import getSigil from '../../data/constants/sigil';
import { Genders, Species } from '../../data/ids/species';
import { getSpeciesData } from '../../data/species';
import { GENDER_LABELS, GENDER_MARKS, sayFriendship } from './catch-summary';
import CatchPicker from './catch-picker';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Badge, Button, Meta, Note, Status } from '../styled';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import describeFailure from '../../i18n/refusals';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * Who is walking with the player.
 *
 * The buddy is the one pokemon that does anything outside a battle: it
 * draws spawns in, it earns the candy, it is what an egg is counted
 * against. It was a badge in the corner of the profile saying a name
 * and a level, which is the least a thing that important could say.
 *
 * So it is a card of its own, and it says what the catch sheet says
 * about the same pokemon: what it is, what it looks like, and the mark
 * that tells one Rattata from another.
 */

/**
 * The picture's own box, which becomes a button where the card has a
 * sheet to open. No fixed size: the sprite is taller than a box would
 * be, so one only ever decided where the *bottom* of an overflowing
 * picture went, and the row lines it up with the words beside it
 */
function Sprung(props: ParentProps<{ open?: (catchId: string) => void; at: string }>): JSX.Element {
  return (
    <Show
      when={props.open}
      fallback={<div class="flex shrink-0 items-end justify-center">{props.children}</div>}
    >
      {(open) => (
        <button
          type="button"
          class="flex shrink-0 cursor-pointer items-end justify-center rounded-lg border-0
            bg-transparent p-0 shadow-none transition-transform hover:-translate-y-0.5
            active:translate-y-0"
          onClick={() => {
            open()(props.at);
          }}
        >
          {props.children}
        </button>
      )}
    </Show>
  );
}

/**
 * What the buddy's picture is announced as. Everything about a buddy
 * reads as something happening to the reader, which is not true of a
 * trainer whose profile is being looked at
 */
function sayWalker(caught: CaughtPokemon, theirs: boolean): string {
  if (isEgg(caught)) {
    return theirs ? m.catch_buddy_egg_walking_them() : m.catch_buddy_egg_walking();
  }
  const name = getSpeciesData(caught.species).name;

  return theirs ? m.catch_buddy_walking_them({ name }) : m.catch_buddy_walking({ name });
}

export interface BuddyCardProps {
  player: string;
  /**
   * Bumped when the buddy changes, so whatever else is reading the
   * player's records catches up
   */
  onChange?: () => void;
  /**
   * Whether this is somebody else's buddy. Who is walking with them is
   * worth seeing — it is the one pokemon a trainer is known by — but
   * swapping it is theirs alone, so the button and the picker behind
   * it are left out
   */
  viewOnly?: boolean;
  /**
   * Open the buddy's own sheet. The card says a great deal about the
   * pokemon and stops short of the rest of it, and the picture is the
   * thing on the card a player reaches for
   */
  onOpen?: (catchId: string) => void;
}

/**
 * The card itself, which is where the buddy is read.
 *
 * A buddy read in the body that declared it throws past every
 * `Loading` written there and lands on the boundary around the whole
 * page — and this card re-reads every time a buddy is set
 */
function BuddyBody(
  props: BuddyCardProps & {
    record: Resource<Awaited<ReturnType<typeof resolveBuddy>>>;
    onChosen: () => void;
  },
): JSX.Element {
  const [picking, setPicking] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);

  const buddy = (): Awaited<ReturnType<typeof resolveBuddy>> => props.record() ?? null;

  /**
   * Swap who is walking along. An egg counts — walking is the only
   * thing that hatches one — so nothing is filtered out of the list
   */
  const choose = (catchId: string | null): void => {
    setPicking(false);
    if (catchId == null) {
      return;
    }
    setStatus(null);
    setBuddy(props.player, catchId)
      .then((changed) => {
        setStatus(changed ? null : m.catch_buddy_refused());
        props.onChange?.();
        props.onChosen();
      })
      .catch((failed: unknown) => {
        setStatus(describeFailure(failed));
      });
  };

  /**
   * Whose buddy this is, as the card says it. Everything about a buddy
   * reads as something happening to the reader — walking with you,
   * walked together — and none of that is true of a trainer whose
   * profile is being looked at
   */

  return (
    // The right half of the profile's hero: a white card with the
    // walker, what it is, how close the two are, and the swap
    <div class="flex min-w-0 grow flex-col gap-2">
      <div
        class="flex flex-nowrap items-center gap-3 rounded-card border-2 border-line-soft bg-paper
          px-3 py-2"
      >
        <Show
          when={buddy()}
          fallback={
            <Note class="grow">
              <Show when={props.viewOnly !== true} fallback={m.catch_buddy_none_theirs()}>
                {m.catch_buddy_none()}
              </Show>
            </Note>
          }
        >
          {(pair) => (
            <>
              {/* No fixed box. It had one, and the sprite is taller
                  than the box was, so it stood well above the line it
                  was supposed to be on. The picture is its own size,
                  and the row lines it up with the words beside it.

                  Half the size it was drawn at: this is a line of the
                  profile rather than the subject of a screen, and
                  half of three is not a whole number of pixels, which
                  for pixel art is the one scale that looks wrong */}
              <Sprung open={props.onOpen} at={pair()[0]}>
                <AnimatedSprite
                  species={isEgg(pair()[1]) ? Species.Egg : pair()[1].species}
                  shiny={!isEgg(pair()[1]) && isShiny(pair()[1])}
                  female={!isEgg(pair()[1]) && pair()[1].gender === Genders.Female}
                  animation={SpriteAnim.Walk}
                  direction="DownLeft"
                  scale={2}
                  shadow
                  label={sayWalker(pair()[1], props.viewOnly === true)}
                />
              </Sprung>

              <div class="flex min-w-0 grow flex-col">
                <span class="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
                  {props.viewOnly === true ? m.catch_buddy_label_them() : m.catch_buddy_label()}
                </span>
                <Show
                  when={!isEgg(pair()[1])}
                  fallback={
                    <>
                      <span class="text-sm font-extrabold">{m.ui_egg()}</span>
                      {/* How close it is to hatching, counted. An egg is
                          the one thing in the game that is finished by
                          walking, so how far along it is *is* what the
                          buddy card is for */}
                      <Meta>
                        {m.catch_buddy_steps({
                          steps: pair()[1].steps,
                          hatch: pair()[1].hatchSteps,
                        })}
                      </Meta>
                    </>
                  }
                >
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span class="text-sm font-extrabold">
                      {m.ui_level_name({
                        level: pair()[1].level,
                        name: getSpeciesData(pair()[1].species).name,
                      })}
                    </span>
                    <Show when={GENDER_MARKS[pair()[1].gender] !== ''}>
                      {/* The glyph's font sits it low, so its line box is
                          trimmed to keep it level with the name */}
                      <span
                        class="leading-none"
                        title={GENDER_LABELS[pair()[1].gender]()}
                        aria-label={GENDER_LABELS[pair()[1].gender]()}
                        role="img"
                      >
                        {GENDER_MARKS[pair()[1].gender]}
                      </span>
                    </Show>
                    {/* Said out loud as well as drawn: the sprite
                        sparkles, and a player who cannot see that is
                        owed the word */}
                    <Show when={isShiny(pair()[1])}>
                      <Badge tone="gold">{m.catch_shiny_badge()}</Badge>
                    </Show>
                  </div>
                  {/* What walking with it has come to. Both counts are
                      earned by the walking rather than by anything a
                      player presses: `walked` is how far this pokemon
                      has gone as somebody's buddy, which is the one
                      that buys the friendship beside it. The words for
                      the friendship stand on its tooltip, and the mark
                      it is known by ends the line (two of the same
                      species with the same sigil are the same
                      individual) */}
                  <Meta>
                    <span title={sayFriendship(pair()[1].friendship)}>
                      {m.catch_buddy_friendship({ count: pair()[1].friendship })}
                    </span>
                    {' · '}
                    {m.catch_buddy_walked({ count: pair()[1].walked })}
                    {' · '}
                    <span class="font-mono tracking-[0.2em]">
                      {getSigil(pair()[1].individualValue, pair()[1].traitValue)}
                    </span>
                  </Meta>
                </Show>
              </div>
            </>
          )}
        </Show>

        {/* Outside the branch above, because the state that most needs
            it is the one with no buddy in it: a card that only offered
            to *replace* a buddy left a player with none no way to pick
            one at all */}
        <Show when={props.viewOnly !== true}>
          <Button
            onClick={() => {
              setPicking(true);
            }}
          >
            {buddy() == null ? m.catch_buddy_choose() : m.catch_buddy_replace()}
          </Button>
        </Show>
      </div>

      <Status message={status()} tone="alert" />

      {/* The ordinary picker: an egg is as valid a buddy as anything
          else, so nothing is left out of it. A press on a square is
          the pick — choosing who walks beside you costs nothing and is
          undone by choosing somebody else, so a card and a button in
          the way of it is a step for nothing */}
      <Show when={props.viewOnly !== true}>
        <CatchPicker
          player={props.player}
          open={picking()}
          value={buddy()?.[0] ?? null}
          title={m.catch_buddy_walk_with()}
          verb={m.catch_buddy_walk_with()}
          empty={m.catch_buddy_empty()}
          onClose={() => {
            setPicking(false);
          }}
          onPick={choose}
        />
      </Show>
    </div>
  );
}

/**
 * Who is walking along with the player. The record is read one
 * component down, under this boundary, so setting a buddy re-reads
 * the card rather than the page it is on
 */
export default function BuddyCard(props: BuddyCardProps): JSX.Element {
  const [revision, setRevision] = createSignal(0);
  const [record] = createResource(
    () => [props.player, revision()] as const,
    async ([player]) => resolveBuddy(player),
  );

  return (
    <Loading fallback={<Note>{m.catch_buddy_loading()}</Note>}>
      <BuddyBody
        {...props}
        record={record}
        onChosen={() => {
          setRevision((count) => count + 1);
        }}
      />
    </Loading>
  );
}
