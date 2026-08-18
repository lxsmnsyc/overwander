import { For, Index, type JSX, Show, createMemo, createSignal } from 'solid-js';
import {
  Button,
  Combobox,
  Dialog,
  DialogActions,
  Field,
  FormActions,
  FormGrid,
  FormSection,
  RadioGroup,
  Select,
  Status,
  Switch,
  TextField,
} from '../styled';
import { ITEM_TYPE_ORDER, getItemData, listItemsByType } from '../../data/items';
import { BALL_ITEMS, Balls, type Items } from '../../data/ids/items';
import { GiftKind } from '../../auth/gift-record';
import {
  MAX_IV,
  STAT_NAMES,
  STAT_ORDER,
  type Stats,
  createStatsField,
  packIVs,
} from '../../data/constants/stats';
import { NATURE_NAMES } from '../../data/ids/natures';
import type Abilities from '../../data/ids/abilities';
import type Natures from '../../data/ids/natures';
import { Genders, type Species } from '../../data/ids/species';
import type { Moves } from '../../data/ids/moves';
import PlayerPicker from './PlayerPicker';
import { getAbilityData } from '../../data/abilities';
import { getMoveData, getRegisteredMoves } from '../../data/moves';
import { getRegisteredSpecies, getSpeciesAbilities, getSpeciesData } from '../../data/species';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  MAX_SLOTS,
  packSlots,
} from '../../data/constants/slots';
import ItemGrid from '../items/ItemGrid';
import ItemSprite from '../items/ItemSprite';
import type { StaffGift } from '../../auth/admin';
import { offerGift } from '../../auth/admin';

/**
 * Putting something on somebody's shelf — or on everybody's.
 *
 * Everything the game gives is a consequence of something a player
 * did; this is the one gift that is not, so it asks for the reason in
 * the same breath as the thing — the reason is the only line on the
 * card that says where a gift came from.
 *
 * A pokemon is rolled on the server the moment the gift is written,
 * and that one rolled meeting is what every taker receives. What is
 * left blank here is left to the roll: a gift that named nothing but
 * a species and a level is the ordinary one, and the fields under it
 * are for the distribution that has to be exact.
 *
 * It goes over as a **record** or as a **meeting**. A record is
 * handed to them finished, in the ball the gift names. A meeting is
 * stood in front of them to throw at: it cannot run and it cannot
 * break out, and the ball it ends up in is whichever one they threw.
 */

/** What the pokemon a gift holds may come at */
const MIN_LEVEL = 1;
const MAX_LEVEL = 100;

/** How big a held item is drawn in its square */
const HELD_SPRITE = 28;

/**
 * Six values a hand-set gift starts from. Perfect rather than average:
 * somebody setting them by hand is setting them because they want an
 * exact pokemon, and it is fewer keystrokes to lower one than to raise
 * six
 */
function perfect(): Record<Stats, number> {
  const values = createStatsField();

  for (const stat of STAT_ORDER) {
    values[stat] = MAX_IV;
  }
  return values;
}

/** How a gender reads to whoever is filling the form in */
const GENDER_NAMES: Record<Genders, string> = {
  [Genders.Genderless]: 'Genderless',
  [Genders.Male]: 'Male',
  [Genders.Female]: 'Female',
};

/**
 * Midnight at the end of a typed day, on the reader's own clock, or
 * null for a field left empty. A gift expires at the end of the day it
 * names rather than at its beginning — "the 5th" means the 5th is
 * still a day it can be taken on
 */
function endOf(day: string): number | null {
  if (day.trim() === '') {
    return null;
  }
  const at = new Date(`${day}T23:59:59`);

  return Number.isNaN(at.getTime()) ? null : at.getTime();
}

export interface GiftFormProps {
  /** Fired once a gift has been written down, so the shelf can be read again */
  onGiven: () => void;
  onClose: () => void;
}

export default function GiftForm(props: GiftFormProps): JSX.Element {
  // Open by default: a distribution is the ordinary reason to write
  // one of these by hand, and a gift for one person is the exception
  const [everybody, setEverybody] = createSignal(true);
  const [player, setPlayer] = createSignal('');
  const [named, setNamed] = createSignal('');
  const [kind, setKind] = createSignal<GiftKind>(GiftKind.Item);
  const [reason, setReason] = createSignal('');
  const [expiry, setExpiry] = createSignal('');
  const [item, setItem] = createSignal<Items | null>(null);
  const [amount, setAmount] = createSignal('1');
  const [species, setSpecies] = createSignal<Species | null>(null);
  const [level, setLevel] = createSignal('5');
  const [shiny, setShiny] = createSignal(false);
  const [shadow, setShadow] = createSignal(false);
  const [gender, setGender] = createSignal<Genders | null>(null);
  const [nature, setNature] = createSignal<Natures | null>(null);
  const [abilities, setAbilities] = createSignal<Abilities[]>([]);
  const [moves, setMoves] = createSignal<Moves[]>([]);
  const [held, setHeld] = createSignal<(Items | null)[]>(
    Array.from({ length: MAX_SLOTS }, () => null),
  );
  /** Which held-item square is being filled, or null while none is */
  const [filling, setFilling] = createSignal<number | null>(null);
  const [ball, setBall] = createSignal<Balls>(Balls.PremierBall);
  const [owner, setOwner] = createSignal('');
  const [place, setPlace] = createSignal('');
  const [abilityRoom, setAbilityRoom] = createSignal(String(DEFAULT_ABILITY_SLOTS));
  const [itemRoom, setItemRoom] = createSignal(String(DEFAULT_ITEM_SLOTS));
  const [moveRoom, setMoveRoom] = createSignal(String(DEFAULT_MOVE_SLOTS));
  const [exact, setExact] = createSignal(false);
  const [values, setValues] = createSignal<Record<Stats, number>>(perfect());
  const [busy, setBusy] = createSignal(false);
  const [said, setSaid] = createSignal<string | null>(null);
  const [wrong, setWrong] = createSignal<string | null>(null);

  // Built once: the registries are fixed at boot, and both lists are
  // long enough that rebuilding them per keystroke would be felt
  const items = createMemo(() =>
    ITEM_TYPE_ORDER.flatMap((type) =>
      listItemsByType(type).map((entry) => ({ value: entry, label: getItemData(entry).name })),
    ),
  );
  const pokemon = createMemo(() =>
    getRegisteredSpecies().map((entry) => ({ value: entry, label: getSpeciesData(entry).name })),
  );
  const everyMove = createMemo(() =>
    getRegisteredMoves()
      .map((entry) => ({ value: entry, label: getMoveData(entry).name }))
      .sort((left, right) => left.label.localeCompare(right.label)),
  );
  /**
   * What this line can carry. It is the species' own pool plus its
   * pre-evolutions', which is what the roll draws from — a gift may be
   * exact without being impossible
   */
  const abilityOptions = createMemo(() => {
    const which = species();

    return which == null
      ? []
      : [...getSpeciesAbilities(which)].map((entry) => ({
          value: entry,
          label: getAbilityData(entry).name,
        }));
  });
  const balls = createMemo(() =>
    (Object.keys(BALL_ITEMS).map(Number) as Balls[]).map((entry) => ({
      value: entry,
      label: getItemData(BALL_ITEMS[entry]).name,
    })),
  );

  const count = (): number => Math.floor(Number(amount()));
  const rank = (): number => Math.floor(Number(level()));

  /** A typed slot count, held to what three bits can carry */
  const room = (typed: string): number =>
    Math.max(1, Math.min(MAX_SLOTS, Math.floor(Number(typed)) || 1));

  /** The room this gift walks in with, as the record stores it */
  const slots = (): number => packSlots(room(abilityRoom()), room(itemRoom()), room(moveRoom()));


  /**
   * Where the record says it happened. A fateful meeting is at no
   * coordinate anybody walked to, so where it came from is a name —
   * and it stands in a different row depending on what else that row
   * has to hold
   */
  const placeField = (): JSX.Element => (
    <TextField
      label="Location"
      value={place()}
      placeholder="Nowhere in particular"
      hint="Read back on the sheet: met in a fateful encounter at Pallet Town."
      onChange={(value) => {
        setPlace(value);
      }}
    />
  );

  /** What one held-item square is, said to whoever is listening */
  const describeSlot = (carried: Items | null, slot: number): string =>
    carried == null
      ? `Fill held item slot ${slot + 1}`
      : `Held item ${slot + 1}: ${getItemData(carried).name}`;

  /** What it walks in knowing, cut to the room it has for moves */
  const known = (): Moves[] => moves().slice(0, room(moveRoom()));

  const setCarried = (slot: number, carried: Items | null): void => {
    setHeld((current) => current.map((entry, at) => (at === slot ? carried : entry)));
  };

  /** What it walks in carrying, in slot order and without the gaps */
  const carrying = (): Items[] =>
    held()
      .slice(0, room(itemRoom()))
      .filter((carried): carried is Items => carried != null);

  const setValue = (stat: Stats, value: string): void => {
    const wanted = Math.max(0, Math.min(MAX_IV, Math.floor(Number(value))));

    setValues((current) => ({ ...current, [stat]: Number.isFinite(wanted) ? wanted : 0 }));
  };

  /**
   * Why the gift cannot be given yet, in the words of the field that
   * is missing. Null means it can
   */
  const refusal = (): string | null => {
    if (!everybody() && player() === '') {
      return 'Pick who it is for, or offer it to everybody.';
    }
    if (reason().trim() === '') {
      return 'Say what it is for — it is the only line on the card.';
    }
    if (expiry().trim() !== '' && endOf(expiry()) == null) {
      return 'That expiry is not a date.';
    }
    if (kind() === GiftKind.Item) {
      if (item() == null) {
        return 'Pick an item.';
      }
      return Number.isFinite(count()) && count() > 0 ? null : 'An amount of at least one.';
    }
    if (species() == null) {
      return 'Pick a pokemon.';
    }
    if (!Number.isFinite(rank()) || rank() < MIN_LEVEL || rank() > MAX_LEVEL) {
      return `A level between ${MIN_LEVEL} and ${MAX_LEVEL}.`;
    }
    return null;
  };

  /**
   * The gift as the server takes it, or null while the half that is
   * showing has nothing in it. It is null rather than a stand-in
   * because the two kinds are written down differently: a missing
   * item must not quietly become a pokemon
   */
  const wanted = (): StaffGift | null => {
    const chosen = item();
    const which = species();
    const common = {
      reason: reason().trim(),
      player: everybody() ? null : player(),
      expiresAt: endOf(expiry()),
    };

    if (kind() === GiftKind.Item) {
      return chosen == null
        ? null
        : { ...common, kind: GiftKind.Item, item: chosen, amount: count() };
    }
    if (which == null) {
      return null;
    }

    const living = {
      ...common,
      species: which,
      level: rank(),
      shiny: shiny(),
      gender: gender(),
      nature: nature(),
      ivs: exact() ? packIVs(values()) : null,
      shadow: shadow(),
      abilities: abilities().slice(0, room(abilityRoom())),
      moves: known(),
      items: carrying(),
      place: place().trim(),
      slots: slots(),
    };

    return kind() === GiftKind.Encounter
      ? { ...living, kind: GiftKind.Encounter }
      : { ...living, kind: GiftKind.Catch, ball: ball(), owner: owner().trim() };
  };

  const give = (): void => {
    const gift = wanted();

    if (gift == null) {
      return;
    }
    setSaid(null);
    setWrong(null);
    setBusy(true);
    offerGift(gift)
      .then((given) => {
        if (!given) {
          setWrong('That gift is already on the shelf.');
          return;
        }
        setSaid(
          everybody()
            ? 'On every shelf. Anybody may take it once.'
            : `On ${named() === '' ? 'their' : `${named()}'s`} shelf.`,
        );
        setReason('');
        props.onGiven();
      })
      .catch((caught: unknown) => {
        setWrong(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <FormSection
      title="Give a gift"
      lede="It waits on the shelf until somebody comes for it, the same as the starter."
    >
      {/* One shelf or all of them. An open gift is one pokemon and one
          roll, taken once each by however many people take it */}
      <Switch
        label="For everybody"
        description="Anybody may take it, once. Nobody is picked."
        checked={everybody()}
        onChange={(value) => {
          setEverybody(value);
        }}
      />

      <Show when={!everybody()}>
        <PlayerPicker
          value={player()}
          onChange={(uid, nickname) => {
            setPlayer(uid);
            setNamed(nickname);
          }}
        />
      </Show>

      <FormGrid>
        <TextField
          label="Reason"
          required
          value={reason()}
          placeholder="What it is for"
          hint="It is the only line on the card that says where the gift came from."
          onChange={(value) => {
            setReason(value);
          }}
        />
        <TextField
          label="Last day"
          kind="date"
          value={expiry()}
          hint="Leave it empty and it waits forever."
          onChange={(value) => {
            setExpiry(value);
          }}
        />
      </FormGrid>

      <RadioGroup
        label="What it is"
        value={kind()}
        options={[
          { value: GiftKind.Item, label: 'An item', description: 'Some number of one thing.' },
          {
            value: GiftKind.Catch,
            label: 'A pokemon',
            description: 'Handed over as a record, in the ball the gift names.',
          },
          {
            value: GiftKind.Encounter,
            label: 'A meeting',
            description: 'Stood in front of them to throw at. It cannot run, and it cannot break out.',
          },
        ]}
        onChange={(value) => {
          setKind(value);
        }}
      />

      <Show
        when={kind() === GiftKind.Item}
        fallback={
          <>
            <FormGrid>
              <Combobox
                label="Pokemon"
                required
                value={species()}
                options={pokemon()}
                placeholder="Search species"
                onChange={(value) => {
                  setSpecies(value);
                }}
              />
              <TextField
                label="Level"
                kind="number"
                required
                min={MIN_LEVEL}
                max={MAX_LEVEL}
                value={level()}
                onChange={(value) => {
                  setLevel(value);
                }}
              />
              <Switch
                label="Shiny"
                description="Set on the gift itself rather than rolled for."
                checked={shiny()}
                onChange={(value) => {
                  setShiny(value);
                }}
              />
              <Switch
                label="Shadow"
                description="It keeps the Shadow ability, and thinks nothing of anybody until it is put right."
                checked={shadow()}
                onChange={(value) => {
                  setShadow(value);
                }}
              />
            </FormGrid>

            {/* Everything under here is optional, and what is left
                alone is left to the roll — which is what the gifts the
                game gives itself do */}
            <FormGrid>
              <Select
                label="Gender"
                value={gender()}
                placeholder="Whatever it rolls"
                options={[Genders.Genderless, Genders.Male, Genders.Female].map((entry) => ({
                  value: entry,
                  label: GENDER_NAMES[entry],
                }))}
                onChange={(value) => {
                  setGender(value);
                }}
              />
              <Combobox
                label="Nature"
                value={nature()}
                placeholder="Whatever it rolls"
                options={Object.entries(NATURE_NAMES).map(([entry, label]) => ({
                  value: Number(entry),
                  label,
                }))}
                onChange={(value) => {
                  setNature(value);
                }}
              />
            </FormGrid>

            {/* How much room it walks in with, three across: they are
                one decision about the individual rather than three,
                and the boxes under them are filled against these */}
            <FormGrid columns={3}>
              <TextField
                label="Ability slots"
                kind="number"
                min={1}
                max={MAX_SLOTS}
                value={abilityRoom()}
                onChange={(value) => {
                  setAbilityRoom(value);
                }}
              />
              <TextField
                label="Move slots"
                kind="number"
                min={1}
                max={MAX_SLOTS}
                value={moveRoom()}
                onChange={(value) => {
                  setMoveRoom(value);
                }}
              />
              <TextField
                label="Item slots"
                kind="number"
                min={1}
                max={MAX_SLOTS}
                value={itemRoom()}
                onChange={(value) => {
                  setItemRoom(value);
                }}
              />
            </FormGrid>

            {/* One box each, holding as many as the room above allows.
                Picking something already picked takes it back off, and
                a gift that names one move names all of them */}
            <FormGrid>
              <Combobox
                label="Abilities"
                multiple
                limit={room(abilityRoom())}
                value={abilities()}
                placeholder="Whatever it rolls"
                options={abilityOptions()}
                onChange={(picked) => {
                  setAbilities(picked);
                }}
              />
              <Combobox
                label="Moves"
                multiple
                limit={room(moveRoom())}
                value={known()}
                placeholder="Whatever it rolls"
                options={everyMove()}
                onChange={(picked) => {
                  setMoves(picked);
                }}
              />
            </FormGrid>

            {/* What it is carrying, drawn the way the box draws held
                items: squares rather than a list of names. Everything
                past the room it has is shown as the room it has not.
                Beside it stands the one thing a record needs that a
                meeting does not — or, for a meeting, where it happened */}
            <FormGrid>
              {/* Stacked, so the row of squares is given the whole
                  column: a `Field` puts its word beside the control by
                  default, which leaves a row of eight nothing to be
                  wide in. The weight matches the labels either side of
                  it, which come from `FieldFrame` rather than here */}
              <Field label="Held items" stacked class="w-full [&>span]:font-semibold">
                {/* One row of squares, however narrow the column is:
                    each is a share of the width rather than a fixed
                    size, so eight of them never wrap and never
                    scroll. `flex-row` is said out loud because the
                    base layer makes every list a column, and `flex`
                    alone only sets the display */}
                <ul class="m-0 flex w-full list-none flex-row gap-1.5 p-0">
                  <Index each={held()}>
                    {(carried, at) => (
                      <li class="contents">
                        <button
                          type="button"
                          disabled={at >= room(itemRoom())}
                          aria-label={describeSlot(carried(), at)}
                          class={`flex aspect-square min-w-0 grow basis-0 items-center
                            justify-center rounded-lg border-2 p-1 transition-colors
                            disabled:cursor-not-allowed disabled:opacity-40 ${
                              carried() == null
                                ? 'border-dashed border-line bg-paper/40 text-muted'
                                : 'border-line bg-paper hover:border-tide'
                            }`}
                          onClick={() => {
                            setFilling(at);
                          }}
                        >
                          <Show when={carried()} fallback={<span aria-hidden="true">+</span>}>
                            {(shown) => <ItemSprite item={shown()} size={HELD_SPRITE} label="" />}
                          </Show>
                        </button>
                      </li>
                    )}
                  </Index>
                </ul>
              </Field>

              <Show when={kind() === GiftKind.Catch} fallback={placeField()}>
                <Select
                  label="Ball"
                  value={ball()}
                  options={balls()}
                  onChange={(value) => {
                    setBall(value);
                  }}
                />
              </Show>
            </FormGrid>

            {/* A record handed over says where it came from and whose
                it was before; a meeting has said the first already and
                has no answer to the second — what a player catches is
                theirs first */}
            <Show when={kind() === GiftKind.Catch}>
              <FormGrid>
                {placeField()}
                <TextField
                  label="Original trainer"
                  value={owner()}
                  placeholder="Nobody"
                  hint="A name on the sheet — Red — rather than an account."
                  onChange={(value) => {
                    setOwner(value);
                  }}
                />
              </FormGrid>
            </Show>

            <Switch
              label="Set the values by hand"
              description="Otherwise they come out of the roll, the way a wild one's do."
              checked={exact()}
              onChange={(value) => {
                setExact(value);
              }}
            />
            <Show when={exact()}>
              <FormGrid>
                <For each={STAT_ORDER}>
                  {(stat) => (
                    <TextField
                      label={STAT_NAMES[stat]}
                      kind="number"
                      value={String(values()[stat])}
                      onChange={(value) => {
                        setValue(stat, value);
                      }}
                    />
                  )}
                </For>
              </FormGrid>
            </Show>
          </>
        }
      >
        <FormGrid>
          <Combobox
            label="Item"
            required
            value={item()}
            options={items()}
            placeholder="Search the bag's contents"
            onChange={(value) => {
              setItem(value);
            }}
          />
          <TextField
            label="How many"
            kind="number"
            required
            value={amount()}
            onChange={(value) => {
              setAmount(value);
            }}
          />
        </FormGrid>
      </Show>

      {/* The bag's own tray, standing in for a bag: a gift is written
          out of the registry rather than out of anybody's pockets, so
          every item there is, searchable */}
      <Dialog
        isOpen={filling() != null}
        title="Held item"
        description="What it walks in carrying. One square, one thing."
        onClose={() => {
          setFilling(null);
        }}
      >
        <ItemGrid
          verb="Choose"
          entries={items().map((entry) => ({ item: entry.value }))}
          onPress={(chosen) => {
            setCarried(filling() ?? 0, chosen);
            setFilling(null);
          }}
        />
        <DialogActions>
          <Button
            onClick={() => {
              setCarried(filling() ?? 0, null);
              setFilling(null);
            }}
          >
            Nothing
          </Button>
        </DialogActions>
      </Dialog>

      <Status message={said()} />
      <Status message={wrong()} tone="alert" />

      <FormActions note={refusal()}>
        <Button onClick={props.onClose}>Done</Button>
        <Button tone="primary" disabled={busy() || refusal() != null} onClick={give}>
          Give
        </Button>
      </FormActions>
    </FormSection>
  );
}
