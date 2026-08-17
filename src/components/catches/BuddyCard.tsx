import { type JSX, Show, createResource, createSignal } from 'solid-js';
import { resolveBuddy, setBuddy } from '../../auth/buddy';
import { isShiny } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { MAX_FRIENDSHIP, describeFriendship } from '../../data/constants/friendship';
import getSigil from '../../data/constants/sigil';
import { Species } from '../../data/ids/species';
import { getSpeciesData } from '../../data/species';
import { GENDER_LABELS, GENDER_MARKS } from './catch-summary';
import CatchPicker from './CatchPicker';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Badge, Button, Card, Meta, Note, Row, Status } from '../styled';

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
 * A number as a length, with the words for it beside.
 *
 * Both of the things a buddy earns by being walked with — how close
 * an egg is to hatching, how well a pokemon thinks of its owner — are
 * fractions of something, and a fraction printed as two numbers is
 * arithmetic a player should not have to do at a glance. The words
 * stay, because a bar on its own cannot say *how many* steps
 */
function Gauge(props: {
  label: string;
  tone: string;
  value: number;
  of: number;
  /**
   * What a screen reader is told it comes to — "120 of 2560 steps
   * walked", "adores you". A bar is a picture, and a picture of a
   * number has to say the number
   */
  said: string;
}): JSX.Element {
  const share = (): number =>
    props.of <= 0 ? 1 : Math.max(0, Math.min(1, props.value / props.of));

  return (
    <div class="flex items-center gap-2">
      <Meta class="w-20 shrink-0 text-left">{props.label}</Meta>
      <div
        class="h-1.5 grow overflow-hidden rounded-full bg-line-soft"
        role="img"
        aria-label={`${props.label}: ${props.said}`}
        title={props.said}
      >
        <div class={`h-full rounded-full ${props.tone}`} style={{ width: `${share() * 100}%` }} />
      </div>
    </div>
  );
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
}

export default function BuddyCard(props: BuddyCardProps): JSX.Element {
  const [revision, setRevision] = createSignal(0);
  const [picking, setPicking] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);
  const [record, { refetch }] = createResource(
    () => [props.player, revision()] as const,
    async ([player]) => resolveBuddy(player),
  );

  /**
   * Who is walking along, without suspending anything.
   *
   * `latest` rather than the resource itself: reading a resource that
   * is still loading throws to the nearest Suspense boundary, and the
   * nearest one to this card is the root of the whole app. A profile
   * that re-read its buddy — which it does every time one is set —
   * would take the page down with it for as long as the read took
   */
  const buddy = (): Awaited<ReturnType<typeof resolveBuddy>> => record.latest ?? null;

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
      .then(async (changed) => {
        setStatus(changed ? null : 'That one cannot walk with you right now.');
        setRevision((count) => count + 1);
        props.onChange?.();
        await refetch();
      })
      .catch((failed: unknown) => {
        setStatus(failed instanceof Error ? failed.message : String(failed));
      });
  };

  /**
   * Whose buddy this is, as the card says it. Everything about a buddy
   * reads as something happening to the reader — walking with you,
   * walked together — and none of that is true of a trainer whose
   * profile is being looked at
   */
  const walker = (): string => (props.viewOnly === true ? 'them' : 'you');

  return (
    // No heading. The card is one line — a pokemon and the button that
    // swaps it — and a title over a single row is a word taking up as
    // much of the profile as the thing it names
    <Card>
      <Row class="flex-nowrap">
        <Show
          when={buddy()}
          fallback={
            <Note class="grow">
              <Show when={props.viewOnly !== true} fallback="Nobody is walking with this trainer.">
                Nobody is walking with you. A buddy draws pokemon in, earns the candy and is the
                only thing that hatches an egg.
              </Show>
            </Note>
          }
        >
          {(pair) => (
            <>
              {/* No fixed box. It had one, and the sprite is taller
                  than the box was, so it stood well above the line it
                  was supposed to be on — the box only ever decided
                  where the *bottom* of an overflowing picture went.
                  The picture is its own size, and the row lines it up
                  with the words beside it.

                  Half the size it was drawn at: this is a line of the
                  profile rather than the subject of a screen — and
                  half of three is not a whole number of pixels, which
                  for pixel art is the one scale that looks wrong */}
              <div class="flex shrink-0 items-end justify-center">
                <AnimatedSprite
                  species={isEgg(pair()[1]) ? Species.Egg : pair()[1].species}
                  shiny={!isEgg(pair()[1]) && isShiny(pair()[1])}
                  animation="Walk"
                  direction="DownLeft"
                  scale={2}
                  shadow
                  label={
                    isEgg(pair()[1])
                      ? `An egg, walking with ${walker()}`
                      : `${getSpeciesData(pair()[1].species).name}, walking with ${walker()}`
                  }
                />
              </div>

              <div class="flex grow flex-col gap-1">
                <Show
                  when={!isEgg(pair()[1])}
                  fallback={
                    <>
                      <span class="font-semibold">Egg</span>
                      {/* How close it is to hatching, drawn as well as
                          counted. An egg is the one thing in the game
                          that is finished by walking, so how far along
                          it is *is* what the buddy card is for */}
                      <Gauge
                        label="Hatching"
                        tone="bg-gold"
                        value={pair()[1].steps}
                        of={pair()[1].hatchSteps}
                        said={`${pair()[1].steps} of ${pair()[1].hatchSteps} steps walked`}
                      />
                    </>
                  }
                >
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-semibold">
                      Lv. {pair()[1].level} {getSpeciesData(pair()[1].species).name}
                    </span>
                    <Show when={GENDER_MARKS[pair()[1].gender] !== ''}>
                      <span
                        title={GENDER_LABELS[pair()[1].gender]}
                        aria-label={GENDER_LABELS[pair()[1].gender]}
                        role="img"
                      >
                        {GENDER_MARKS[pair()[1].gender]}
                      </span>
                    </Show>
                    {/* Said out loud as well as drawn: the sprite
                        sparkles, and a player who cannot see that is
                        owed the word */}
                    <Show when={isShiny(pair()[1])}>
                      <Badge tone="gold">✦ Shiny</Badge>
                    </Show>
                  </div>
                  {/* The mark it is known by. Two of the same species
                      with the same sigil are the same individual */}
                  <Meta class="font-mono tracking-[0.2em]">
                    {getSigil(pair()[1].individualValue, pair()[1].traitValue)}
                  </Meta>
                  {/* What walking with it has come to. Both of these
                      are earned by the walking rather than by anything
                      a player presses, and neither was written down
                      anywhere: a buddy quietly gained regard for
                      hundreds of paces and the only way to see it was
                      to open its sheet */}
                  <Gauge
                    label="Friendship"
                    tone="bg-leaf"
                    value={pair()[1].friendship}
                    of={MAX_FRIENDSHIP}
                    said={describeFriendship(pair()[1].friendship)}
                  />
                  {/* `walked`, not `steps`. They are two counts on
                      purpose: `steps` is how far an egg has been
                      carried and stops meaning anything the moment it
                      hatches, while `walked` is how far this pokemon
                      has gone as somebody's buddy — which is the one
                      that buys the friendship above */}
                  <Meta>
                    {pair()[1].walked} {pair()[1].walked === 1 ? 'step' : 'steps'} walked together
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
            {buddy() == null ? 'Choose a buddy' : 'Replace'}
          </Button>
        </Show>
      </Row>

      <Status message={status()} tone="alert" />

      {/* The ordinary picker: an egg is as valid a buddy as anything
          else, so nothing is left out of it */}
      <Show when={props.viewOnly !== true}>
        <CatchPicker
          player={props.player}
          open={picking()}
          value={buddy()?.[0] ?? null}
          title="Walk with"
          verb="Walk with"
          empty="You have nothing to walk with yet."
          onClose={() => {
            setPicking(false);
          }}
          onPick={choose}
        />
      </Show>
    </Card>
  );
}
