# Change request: registry-text v2 to v3

- From node: i18n-descriptions
- Status: open

## Problem

Three gaps stop the description nodes from writing text.

- `scripts/i18n/official-names.ts` overwrote each locale file whole, so a `description` or an engine's own entry written by hand beside the generated names was lost on the next run.
- `STAT_NAMES` and `STAGE_NAMES` were a plain `stringTable` over `text/en/stats.yaml`, so item descriptions built from them read English in every locale.
- Zenith names were built as `Zenith <holder>` in English only.

## Proposed change

Add to the contract:

- **Hand-written fields beside generated ones.** A locale file the generator writes may also hold fields it does not write (anything but `name` and `category`) and entries it did not match. A rerun keeps both (`keepWritten` in `scripts/i18n/keep-written.ts`) and rewrites only `name` and `category`. A generated field the script no longer writes for an entry it matched is dropped.
- **Stats and stages wired.** `text/<locale>/stats.yaml` (a flat map) and `text/<locale>/stages.yaml` (a flat map) replace the two-map English file. `STAT_NAMES` and `STAGE_NAMES` are `localeStringTable`s. `ENGLISH_STAT_NAMES` and `ENGLISH_STAGE_NAMES` hold the English names for code that matches or parses them.
- **Zenith names.** `text/<locale>/zeniths.yaml` holds a `name` template with a `{holder}` mark beside the English holders. A locale writes only `name`. The Zenith record is copied with `extendRecord` and its `name` is derived per locale (`deriveLocalized`), with the pokemon's name in that locale as the holder.
- Under **Wired**, add stats and stages and Zenith names.

Changes entry: `v3 (i18n-descriptions): hand-written fields kept by the generator; stats, stages and Zenith names wired.`

## Affected nodes

The six description nodes (`i18n-desc-*`), which write `description` fields into generated files, and any node that adds a stat or stage name.

## Workaround in place

Done locally as described above; the contract file is unchanged.

## Decision

