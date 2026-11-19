import { For, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { BALL_ITEMS } from '../../../data/ids/items';
import { Genders } from '../../../data/ids/species';
import { SpriteAnim } from '../../../data/ids/sprite-anims';
import { getSpeciesData } from '../../../data/species';
import { isShadow, isShiny } from '../../../model/caught-record';
import type { EncounterRecord } from '../../../model/encounter-record';
import type SafariSession from '../../../overworld/safari';
import { SafariState, describeFlight } from '../../../overworld/safari';
import { describeAbility, describeItem } from '../../details';
import ItemSprite from '../../items/ItemSprite';
import AnimatedSprite from '../../sprites/AnimatedSprite';
import { Badge } from '../../styled';
import { BALL_LAND, BALL_REST, BALL_SHAKE, BALL_SPRITE, HELD_SPRITE } from './metrics';
import { m } from '../../../i18n/paraglide/messages.js';

export interface FieldProps {
  session: SafariSession<EncounterRecord>;
  /** How many times the ball is set to rock, or null while the pokemon stands */
  rocking: number | null;
  revealsHeld?: boolean;
  revealsFlight?: boolean;
  revealsAbility?: boolean;
}

/**
 * The field: sky over grass, and the pokemon on its base. Its height
 * is held whatever stands on it, so a throw never moves the controls
 * out from under the finger
 */
export default function Field(props: FieldProps): JSX.Element {
  return (
    <div
      class="relative h-[200px] overflow-hidden rounded-t-[22px] sm:h-[250px]"
      style={{
        background:
          'linear-gradient(var(--field-sky), var(--field-haze) 55%, var(--field-grass) 55%, var(--field-grass-deep))',
      }}
    >
      <span
        aria-hidden="true"
        class="absolute bottom-8 left-1/2 h-9 w-40 -translate-x-1/2 rounded-[50%]
          shadow-[inset_0_-5px_0_rgb(0_0_0/0.15)]"
        style={{ background: 'var(--field-base)' }}
      />
      {/* What a buddy reads off the pokemon, the one thing the nameplate
          does not already say. No box at all without a buddy that reads */}
      <Show
        when={
          (props.revealsHeld === true && props.session.encounter.items.length > 0) ||
          props.revealsFlight === true ||
          props.revealsAbility === true
        }
      >
        <div
          class="absolute left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1
            rounded-[14px] border-2 border-line bg-paper/95 px-3 py-2 shadow-pop
            backdrop-blur-sm top-7 sm:left-3.5"
        >
          <Show when={props.revealsHeld === true}>
            <For each={props.session.encounter.items}>
              {(item) => (
                <Badge tone="tide">
                  <ItemSprite item={item} size={HELD_SPRITE} label="" />
                  {describeItem(item)}
                </Badge>
              )}
            </For>
          </Show>
          {/* What a Forewarn buddy passes on: how ready it is to be gone */}
          <Show when={props.revealsFlight === true}>
            <Badge tone="ember">{describeFlight(props.session.getFleeChance())}</Badge>
          </Show>
          {/* And what a Trace buddy reads off it */}
          <Show when={props.revealsAbility === true}>
            <Badge tone="leaf">{describeAbility(props.session.encounter.ability)}</Badge>
          </Show>
        </div>
      </Show>
      <div class="absolute inset-x-0 top-4 bottom-12 flex items-end justify-center">
        {/* The ball stands where the pokemon did while it rocks:
          what is inside the ball is not also in the field */}
        <Show
          when={props.rocking != null}
          fallback={
            // Fitted to a square as tall as the field, as the catch
            // sheet does, so a tall species shrinks rather than crops
            <div class="relative flex aspect-square h-full max-w-full items-end justify-center">
              <AnimatedSprite
                species={props.session.encounter.species}
                shiny={isShiny(props.session.encounter)}
                female={props.session.encounter.gender === Genders.Female}
                sparkle={isShiny(props.session.encounter)}
                aura={isShadow(props.session.encounter) ? 'shadow' : undefined}
                animation={SpriteAnim.Idle}
                direction="Down"
                fill
                sized
                label={m.safari_standing({
                  name: getSpeciesData(props.session.encounter.species).name,
                })}
              />
            </div>
          }
        >
          <span class="block pb-2" style={{ animation: `ball-land ${BALL_LAND}ms ease-out both` }}>
            <span
              class="block"
              style={{
                animation: `ball-shake ${BALL_SHAKE + BALL_REST}ms ease-in-out ${BALL_LAND}ms ${props.rocking ?? 0} both`,
              }}
            >
              <ItemSprite
                item={BALL_ITEMS[props.session.ball]}
                size={BALL_SPRITE}
                label={
                  props.session.state === SafariState.Caught
                    ? m.safari_ball_holds()
                    : m.safari_ball_rocks()
                }
              />
            </span>
          </span>
        </Show>
      </div>
    </div>
  );
}
