# Outcome: i18n-ui-battle

## Built

- 180 Paraglide messages for the battle interface in `src/i18n/messages/{en,ja,es}.json`, grouped by prefix: `battle_` (view, top bar, unit card, party, teams preview, shared words), `verdict_`, `history_`, `duels_` (tab and lobby), `duel_rules_`, `lobby_` (invite dialog, party strip), `watch_`, `spectators_`, `canvas_`.
- Read by every file under `src/components/battle/**` and `src/components/duels/**` that shows text. `battle-view/summary.ts` and `src/game/battle/watch.ts` build no sentences, so they are unchanged.
- Module-level string tables now hold message functions or are built when shown: `BAN_CHIPS` (DuelLobby), `OUTCOME_LABELS`, `KIND_NAMES`, `WAITING_KINDS` (BattleHistory), `readBstOptions` (DuelRulesDialog), `readRoleName` (LobbyInviteDialog).
- Status names: `getStatusName(status)` in `src/model/health.ts` reads a `localeStringTable` over `src/data/text/<locale>/statuses.yaml`, the pattern types and natures use. `STATUS_NAMES` is no longer exported. Callers in `components/battle/UnitCard.tsx` and `components/catches/` (StatusSquares, TargetStrip, catch-summary) use it.
- `src/data/text/ja/statuses.yaml` and `src/data/text/es/statuses.yaml`: the games' condition names (どく, やけど, Quemado, Amedrentado), else the official name of the move that leaves the status, as the move registry writes it.
- The canvas loading label is `readLoadingLabel()` in `src/canvas/battle/field/metrics.ts` and `src/canvas/overworld/metrics.ts`.
- `docs/strategy/translations-terms.md`: new official terms (Victory, fainted, candy, raid kinds, frenzy), the battle terms (duel, lobby, seat, Ready, replay, side, foe, overworld, gold) and a status conditions section.
- `test/i18n/status-names.test.ts`: status names follow the locale, and the ja and es files name every status.
- Changeset `.changeset/i18n-ui-battle.md`, patch.

## Deviations

- `src/model/duel-record.ts` (not owned): `getDuelBlocker` writes the lobby's waiting line, so it returns messages now. Without it the duel lobby kept three English lines.
- `src/canvas/overworld/chunk-view/index.ts` (not owned): calls `readLoadingLabel()` in place of the old constant, which the brief's loading-label item implies.
- `src/components/catches/{StatusSquares.tsx,TargetStrip.tsx,catch-summary.ts}` (not owned): updated to `getStatusName`, as the brief asks.
- `src/data/text/{ja,es}/statuses.yaml` (not owned): the status names are registry text like type and nature names, so they live beside those rather than in Paraglide messages.

## Stubs left

- `LOBBY_ROLE_NAMES` (`src/model/lobby-role.ts`) is no longer read by anything; `BATTLE_KIND_NAMES` (`src/model/battle-kind.ts`) is read only by its test. The components read their own messages. Batch 7 or a cleanup can delete or move them.
- English still shows on these screens from outside this batch: the panel titles and Close buttons from the menu dialogs ("Battle", "Profile"), the Profile panel around the history, the Form a team picker (`forms/pick-team.tsx`), `duelRefusal` reasons, and `CounterTerms` furniture. Batch 7.
- Award names (`AWARD_NAMES`), NPC names (`npcName`) and raid titles (`getRaidTitle`) stay English: batch 9. Signature ability and some move names (Attack) show English: batch 8.

## Gotchas

- Fallback names passed into a sentence (`battle_the_trainer`, `battle_the_grunt`) must read inside that sentence. Spanish "Has vencido a {name}" cannot take "el ..." (it would need "al"), so the es fallbacks are "tu rival" and "un recluta".
- The e2e `openPanel(page, 'Gifts')` fails when the Gifts button carries a count badge ("16Gifts"); the screenshot script matched `/Gifts$/` instead.
- A drawn duel shows in the history with the lost (red) tint. Seen while screenshotting, not investigated; it may be how `BattleOutcome` records a draw.

## Proposed learnings

- A status, type or nature name is registry text: a `localeStringTable` over `text/<locale>/`, read through a function | they are official game words like the registry names | src/model, src/data | yes: the status test checks every locale names every status

## Verification

- Extraction commit (9e34cc406): English text unchanged, typecheck and lint pass; the key test failed only for the missing ja and es keys, which the next commit adds.
- Review: one fresh agent read ja and es against the English and the term list. No wrong meanings, terms or parameters; status names all official. Three wording fixes applied: es `duels_dismiss` Rechazar, es `history_meet` Encontrar, ja `duels_invited` しょうたいが きている.
- Screenshots at 1280x720 (Playwright against `pnpm dev` and the dev database) in ja and es: raid battle with the unit card (wild fight demo), duel tab, invited row, empty lobby, rules dialog, invite dialog, lobby with both seats ready, duel battle view, verdict, history. No clipping; long lines wrap.
- `pnpm typecheck` passes. `rtk proxy pnpm exec oxlint src test` exits 0. `pnpm test`: 276 files, 5754 tests passed.

## Size

- Estimated L, actual L.
