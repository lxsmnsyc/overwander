import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
} from 'solid-js';
import { RadioGroup, RadioGroupOption } from 'terracotta';
import { useAbilityPatch } from '../../auth/ability-items';
import { type CaughtPokemon, getCaught } from '../../auth/caught';
import { getCatchSlots, isShiny } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { getAbilityData, getSignatureAbility } from '../../data/abilities';
import { Slots, countAbilitySlots, countsAgainstSlots } from '../../data/constants/slots';
import type Abilities from '../../data/ids/abilities';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import { Species } from '../../data/ids/species';
import { getSpeciesData } from '../../data/species';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Button, Dialog, DialogActions, Meta, Note, Status } from '../styled';

/**
 * Spending an Ability Patch on one pokemon.
 *
 * The patch writes the family's signature, which is the one ability
 * nothing rolls and nothing takes back off again. A pokemon with a
 * slot standing empty simply gains it; a full one has to give
 * something up, and which ability that is cannot be guessed, so the
 * patch asks here and leaves the bag only once the question has an
 * answer.
 */
export interface AbilityPatchDialogProps {
  /** Whose abilities are being rewritten, or null when the dialog is shut */
  catchId: string | null;
  onClose: () => void;
  /** Fired once the signature has landed, so the sheet can re-read */
  onUsed?: (said: string) => void;
}

const OPTION =
  'flex cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-sm' +
  ' shadow-pop-sm transition-colors border-line bg-paper hover:border-tide' +
  ' aria-checked:border-leaf aria-checked:bg-leaf-soft focus-visible:outline-2' +
  ' focus-visible:outline-offset-2 focus-visible:outline-tide aria-disabled:cursor-not-allowed' +
  ' aria-disabled:opacity-55 aria-disabled:hover:border-line';

/** One ability as the sheet draws it: its name, and what it does */
function AbilityLine(props: { ability: Abilities }): JSX.Element {
  return (
    <span class="flex flex-col gap-0.5 text-left">
      <span class="font-medium">{getAbilityData(props.ability).name}</span>
      <Meta>{getAbilityData(props.ability).description}</Meta>
    </span>
  );
}

/**
 * The choosing itself, which is where the record is read: a record
 * read in the body that declared it throws past the boundary written
 * there and takes the dialog with it
 */
function PatchBody(
  props: AbilityPatchDialogProps & {
    caught: Resource<CaughtPokemon | null>;
    onRefused: () => void;
    onDone: () => void;
  },
): JSX.Element {
  const [chosen, setChosen] = createSignal(0);
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  /** What it keeps that a patch could take the place of */
  const given = (): Abilities[] => {
    const held: Abilities[] = [];

    for (const ability of props.caught()?.abilities ?? []) {
      // A shadow's mark and a purified one ride free of the slots, so
      // giving one up would buy no room
      if (countsAgainstSlots(ability)) {
        held.push(ability);
      }
    }
    return held;
  };

  const signature = (): Abilities | null => {
    const record = props.caught();

    return record == null ? null : getSignatureAbility(getSpeciesData(record.species).family);
  };

  /** Whether a slot is standing empty, so nothing has to be given up */
  const roomy = (): boolean => {
    const record = props.caught();

    return (
      record != null && countAbilitySlots(record.abilities) < getCatchSlots(record, Slots.Ability)
    );
  };

  const named = (): string => {
    const record = props.caught();

    if (record == null) {
      return 'This pokemon';
    }
    return isEgg(record) ? 'Egg' : getSpeciesData(record.species).name;
  };

  const close = (): void => {
    setStatus(null);
    setChosen(0);
    setBusy(false);
    props.onDone();
  };

  const use = (): void => {
    const catchId = props.catchId;
    const written = signature();
    const dropped = roomy() ? null : (given().at(chosen()) ?? null);

    if (catchId == null || written == null || (!roomy() && dropped == null)) {
      return;
    }
    setStatus(null);
    setBusy(true);
    useAbilityPatch(catchId, dropped)
      .then((ability) => {
        setBusy(false);

        if (ability == null) {
          setStatus(
            'The patch could not be used — it may already keep its signature, or you may no longer have one.',
          );
          props.onRefused();
          return;
        }
        props.onUsed?.(
          dropped == null
            ? `It has ${getAbilityData(ability).name} now.`
            : `${getAbilityData(dropped).name} gave way to ${getAbilityData(ability).name}.`,
        );
        close();
      })
      .catch((thrown: unknown) => {
        setBusy(false);
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  return (
    <>
      <Show when={props.caught()} fallback={<Note>Reading the record…</Note>}>
        {(record) => (
          <div class="flex justify-center">
            <AnimatedSprite
              species={isEgg(record()) ? Species.Egg : record().species}
              shiny={!isEgg(record()) && isShiny(record())}
              animation={SpriteAnim.Idle}
              direction="Down"
              scale={4}
              shadow
              label={named()}
            />
          </div>
        )}
      </Show>

      <Show when={signature()} fallback={<Note>Its family has no signature to write.</Note>}>
        {(written) => (
          <>
            <Note>
              {named()} gains {getAbilityData(written()).name}:{' '}
              {getAbilityData(written()).description}
            </Note>

            <Show
              when={!roomy()}
              fallback={<Note>It has a slot standing empty, so nothing is given up.</Note>}
            >
              <RadioGroup<number>
                toggleable={false}
                value={chosen()}
                onChange={(picked) => {
                  if (picked !== undefined) {
                    setChosen(picked);
                  }
                }}
                class="flex flex-col gap-2"
              >
                <For each={given()}>
                  {(ability, at) => (
                    <RadioGroupOption value={at()} class={OPTION}>
                      <AbilityLine ability={ability} />
                    </RadioGroupOption>
                  )}
                </For>
              </RadioGroup>
            </Show>
          </>
        )}
      </Show>

      <Status message={status()} />

      <DialogActions>
        <Button disabled={busy()} onClick={close}>
          Cancel
        </Button>
        <Button
          tone="primary"
          disabled={busy() || signature() == null || (!roomy() && given().length === 0)}
          onClick={use}
        >
          {busy() ? 'Using…' : 'Use Ability Patch'}
        </Button>
      </DialogActions>
    </>
  );
}

/**
 * Writing a family's signature into one pokemon.
 *
 * The record is read one component down, under the boundary inside
 * the panel, so a record still arriving replaces the choosing rather
 * than the page the panel stands on
 */
export default function AbilityPatchDialog(props: AbilityPatchDialogProps): JSX.Element {
  const [caught, { refetch }] = createResource(() => props.catchId, getCaught);

  return (
    <Dialog
      isOpen={props.catchId != null}
      onClose={props.onClose}
      title="Write its signature"
      description="A signature cannot be taken back off. Where there is no room for it, choose the
        ability it takes the place of."
    >
      <Suspense fallback={<Note>Reading the record…</Note>}>
        <PatchBody
          {...props}
          caught={caught}
          onRefused={() => {
            Promise.resolve(refetch()).catch(() => undefined);
          }}
          onDone={props.onClose}
        />
      </Suspense>
    </Dialog>
  );
}
