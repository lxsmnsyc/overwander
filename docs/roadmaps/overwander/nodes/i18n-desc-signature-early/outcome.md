# Outcome: i18n-desc-signature-early

## Built

- Japanese and Spanish `name` and `description` for all 266 signature abilities filed under Kanto (94), Johto (54), Hoenn (74) and Sinnoh (44), in `src/data/text/{ja,es}/abilities/signature/{kanto,johto,hoenn,sinnoh}.yaml`.
- `test/data/locale-descriptions.test.ts`: a new entry for the signature abilities reads the regions in `SIGNATURE_REGIONS` and requires a ja and an es description (ending in the locale's full stop) and a name that differs from English. A registry may now carry an optional `named()` for translated names. The late regions are added by extending `SIGNATURE_REGIONS`.
- Terms: a new section "Signature ability names" in `docs/strategy/translations-terms.md` with the shared themes and every coined name per region.
- Changeset `.changeset/i18n-desc-signature-early.md`, `patch`.

## Deviations

- None outside the owned paths, except the terms file (shared), `test/data/locale-descriptions.test.ts` and the English Sapmark line.
- The files carry the generator's two-line header, whose wording says the names are generated, so `pnpm official-names` leaves no diff.

## English changed

- Sapmark: "and it heals the same amount." It said "Chikorita drinks the same", which names the first stage for the whole line and does not say who drinks. Committed on its own as a `fix:`.

## Stubs left

- The signature abilities of Unova, Kalos, Alola, Galar, Hisui and Paldea read in English until the next node.
- Forms that carry a signature of another region's file (Paldea's Bog Down, Raging) are not in these files.

## Gotchas

- `official-names` keeps hand-written names and entries, but rewrites the header comment of the files; write the generator's header or a rerun shows a diff.
- Coined names must be checked against the official ability, move, item and species names of the locale, not only the abilities: Estrujón, Empujón, Impulso, きれあじ, いしあたま, ちどりあし and ありじごく were all taken.
- A Spanish line must not end on a stat that ends in `Esp.`; reorder the sentence.
- Counterpart pairs and trios share a pattern in the name (みがまえ / Postura de, うねり / Oleada de, 〜の はばたき / Aleteo, ふういん / Sello de, 〜の しるし / Marca de).

## Verification

- `pnpm typecheck` exit 0, `rtk proxy pnpm exec oxlint src test` exit 0, `pnpm exec oxfmt` on the changed TypeScript and markdown clean.
- `pnpm exec vitest run test/data test/i18n test/overworld/world/buddy-copy.test.ts`: 38 files, 580 tests pass.
- `pnpm official-names` rerun: no diff.
- Not run here: `pnpm test`, the review agent and the screenshots (the caller).

## Size

- Estimated L, actual L.
