/**
 * A yes-or-no `aria-*` value as the attribute spells it. Solid 2 writes
 * a boolean as a bare attribute, present or gone, which reads as
 * neither `true` nor `false` to assistive tech or to Tailwind's
 * `aria-*:` variants. Left out stays left out
 */
export default function spellAria(on: boolean | undefined): 'true' | 'false' | undefined {
  if (on == null) {
    return undefined;
  }
  return on ? 'true' : 'false';
}
