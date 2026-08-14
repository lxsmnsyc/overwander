import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import GROUPS, { type Group } from './effect-atlas-readings.ts';

/**
 * Build a page that shows every effect sheet playing, beside what it
 * is and which move it would serve.
 *
 * The sheets under `effects` and `directional` are named by number and
 * nothing else, so knowing what `effects/47` looks like means opening
 * a packed atlas and working out which rectangle is which frame. That
 * is fine once and unbearable ninety-six times, and it is the reason a
 * sheet gets used twice for one move while another never gets used at
 * all. This writes the contact sheet that answers it: one row per
 * sheet, the animation playing at its own speed, and the reading of
 * what it shows.
 *
 * The page is **self-contained** — every atlas is inlined as a data
 * URI and the player is a few dozen lines at the bottom — because it
 * is meant to be published and looked at, not served out of this
 * repository. It draws the frames the same way
 * [`EffectSprite`](../src/canvas/effect-sprite.ts) does: each trimmed
 * frame put back at its trim inside the source cell, and a frame's
 * number read as the tick it starts on rather than its place in a
 * list.
 *
 * The readings below are the part no file carries. They were made by
 * looking at the frames, and a few of them are guesses; `note` is
 * where a second candidate or a caveat goes.
 *
 * ```
 * pnpm effect-atlas out.html
 * ```
 */

function say(message: string): void {
  process.stdout.write(`${message}\n`);
}

/** A frame as the page's player needs it, in the cell's own pixels. */
interface PackedFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  tx: number;
  ty: number;
}

interface PackedSheet {
  cell: [width: number, height: number];
  frames: PackedFrame[];
  /** One frame index per tick, holes filled in — `-1` for an empty tick. */
  timeline: number[];
  loops: boolean;
  /** The atlas itself, as a `data:` URI. */
  src: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Read one sheet the way the game does.
 *
 * A frame's name is the tick it starts on and it holds until the next
 * one there is, so the timeline is flattened here rather than in the
 * page — the player then indexes an array and does nothing else
 */
function pack(sheet: string): PackedSheet {
  const base = `public/sprites/${sheet}`;
  const meta: unknown = JSON.parse(readFileSync(`${base}/data.json`, 'utf8'));
  const root = isRecord(meta) ? meta : {};
  const images = Array.isArray(root.images) ? root.images : [];
  const frames: (PackedFrame & { index: number })[] = [];

  for (const entry of images) {
    const image = isRecord(entry) ? entry : {};
    const w = asNumber(image.width);
    const h = asNumber(image.height);

    if (w <= 0 || h <= 0) {
      continue;
    }

    const trim = Array.isArray(image.trim) ? image.trim : [];
    const name = typeof image.name === 'string' ? image.name : '';
    const digits = /^(\d+)/.exec(name);

    frames.push({
      x: asNumber(image.x),
      y: asNumber(image.y),
      w,
      h,
      tx: asNumber(trim[0]),
      ty: asNumber(trim[1]),
      index: digits == null ? frames.length : Number.parseInt(digits[1], 10),
    });
  }
  frames.sort((one, two) => one.index - two.index);

  if (frames.length === 0) {
    throw new Error(`${sheet} has no frames`);
  }

  const first = isRecord(images[0]) ? images[0] : {};
  const cellWidth = asNumber(first.sourceWidth) || frames[0].w;
  const cellHeight = asNumber(first.sourceHeight) || frames[0].h;
  const ticks = frames[frames.length - 1].index + 1;
  const timeline: number[] = [];
  let held = -1;
  let next = 0;

  for (let tick = 0; tick < ticks; tick += 1) {
    while (next < frames.length && frames[next].index <= tick) {
      held = next;
      next += 1;
    }
    timeline.push(held);
  }

  return {
    cell: [cellWidth, cellHeight],
    frames: frames.map(({ x, y, w, h, tx, ty }) => ({ x, y, w, h, tx, ty })),
    timeline,
    loops: root.loops === true,
    src: `data:image/png;base64,${readFileSync(`${base}/image.png`).toString('base64')}`,
  };
}

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const packed: Record<string, PackedSheet> = {};

for (const group of GROUPS) {
  for (const reading of group.readings) {
    packed[reading.sheet] = pack(reading.sheet);
  }
}

/**
 * The sheets on disk that this map has nothing to say about.
 *
 * They arrive a few at a time and the readings are written by hand, so
 * the page would quietly stop covering the collection if it did not
 * look. A folder whose description is empty is one the packing tool has
 * not finished writing and is called out separately — there is nothing
 * to read there yet
 */
function unmapped(): { missing: string[]; empty: string[] } {
  const mapped = new Set(GROUPS.flatMap((group) => group.readings).map((one) => one.sheet));
  const missing: string[] = [];
  const empty: string[] = [];

  for (const root of ['effects', 'directional']) {
    for (const id of readdirSync(`public/sprites/${root}`).sort((a, b) => Number(a) - Number(b))) {
      const sheet = `${root}/${id}`;

      try {
        if (statSync(`public/sprites/${sheet}/data.json`).size === 0) {
          empty.push(sheet);
          continue;
        }
      } catch {
        empty.push(sheet);
        continue;
      }
      if (!mapped.has(sheet)) {
        missing.push(sheet);
      }
    }
  }
  return { missing, empty };
}

const { missing, empty } = unmapped();
const readings = Object.keys(packed).length;
const emotes = GROUPS.find((group) => group.column === 'Use')?.readings.length ?? 0;
const flying = GROUPS.find((group) => group.column === 'Reads as')?.readings.length ?? 0;
const looping = Object.values(packed).filter((sheet) => sheet.loops).length;
// A group with a column of its own is one whose entries are not moves,
// and neither is an item animation or a sheet nothing claims yet — so
// the useful count is what is left over
const moves = GROUPS.filter((group) => group.column == null)
  .flatMap((group) => group.readings)
  .filter((reading) => reading.move !== '—' && reading.move !== 'Item use').length;
const free =
  GROUPS.flatMap((group) => group.readings).filter((reading) => reading.move === '—').length +
  flying;

function rows(group: Group): string {
  return group.readings
    .map((reading) => {
      const sheet = packed[reading.sheet];
      const note = reading.note == null ? '' : `<em>${escape(reading.note)}</em>`;
      const guess = reading.guess === true ? '<span class="guess">guess</span>' : '';
      const kind = sheet.loops ? 'loops' : 'one-shot';

      return `<tr>
            <td class="play"><canvas data-sheet="${escape(reading.sheet)}" width="96" height="96" aria-label="${escape(reading.sheet)} playing"></canvas></td>
            <td class="id">${escape(reading.sheet)}<span class="kind">${kind} · ${sheet.timeline.length}t</span></td>
            <td class="shows">${escape(reading.shows)}</td>
            <td class="move">${escape(reading.move)}${guess}${note}</td>
            <td class="where">${reading.plays}</td>
          </tr>`;
    })
    .join('\n');
}

const sections = GROUPS.map(
  (group) => `<section style="--sect: ${group.hue[0]}; --sect-dark: ${group.hue[1]}">
      <h2>${escape(group.title)} <span class="n">${group.readings.length} sheets</span><span class="rule"></span></h2>
      <div class="scroller">
        <table>
          <thead><tr><th></th><th>Sheet</th><th>What it shows</th><th>${escape(group.column ?? 'Move')}</th><th>Plays on</th></tr></thead>
          <tbody>
${rows(group)}
          </tbody>
        </table>
      </div>
    </section>`,
).join('\n\n  ');

const page = `<title>Effect Atlas Map</title>
<style>
  :root {
    --bg: #eceff5;
    --surface: #ffffff;
    --surface-2: #f6f7fb;
    --stage: #14161d;
    --line: #d2d8e4;
    --line-soft: #e4e8f0;
    --ink: #161922;
    --ink-2: #3d4453;
    --muted: #626b7d;
    --accent: #8a5100;
    --accent-line: #d99a1f;
    --accent-soft: #fdf1d8;
    --key: var(--sect, var(--ink));
    --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
    --sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #0e1016;
      --surface: #161a23;
      --surface-2: #1b2029;
      --stage: #0a0c11;
      --line: #29303d;
      --line-soft: #212734;
      --ink: #e7eaf1;
      --ink-2: #c2c8d4;
      --muted: #8f97a7;
      --accent: #f0b429;
      --accent-line: #7a5a12;
      --accent-soft: #2b2411;
      --key: var(--sect-dark, var(--ink));
    }
  }

  :root[data-theme="dark"] {
    --bg: #0e1016;
    --surface: #161a23;
    --surface-2: #1b2029;
    --stage: #0a0c11;
    --line: #29303d;
    --line-soft: #212734;
    --ink: #e7eaf1;
    --ink-2: #c2c8d4;
    --muted: #8f97a7;
    --accent: #f0b429;
    --accent-line: #7a5a12;
    --accent-soft: #2b2411;
    --key: var(--sect-dark, var(--ink));
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 56px 24px 96px;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  header { display: flex; flex-direction: column; gap: 14px; }

  .eyebrow {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--accent);
  }

  h1 {
    font-family: var(--mono);
    font-size: clamp(28px, 4.4vw, 40px);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0;
    text-wrap: balance;
  }

  .lede { margin: 0; max-width: 66ch; color: var(--ink-2); font-size: 16px; }

  .counts { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }

  .count {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 112px;
  }

  .count b {
    font-family: var(--mono);
    font-size: 21px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .count span {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .note {
    border-left: 2px solid var(--accent-line);
    background: var(--accent-soft);
    padding: 12px 16px;
    color: var(--ink-2);
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .note p { margin: 0; }
  .note code, .lede code, footer code { font-family: var(--mono); font-size: 0.92em; }

  section { display: flex; flex-direction: column; gap: 12px; }

  h2 {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 10px;
    color: var(--key);
  }

  h2 .rule { flex: 1; height: 1px; background: var(--line); }

  h2 .n {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .scroller { overflow-x: auto; }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 3px;
    min-width: 840px;
  }

  thead th {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 500;
    text-align: left;
    padding: 9px 14px;
    border-bottom: 1px solid var(--line);
    background: var(--surface-2);
    white-space: nowrap;
  }

  tbody td { padding: 10px 14px; border-bottom: 1px solid var(--line-soft); vertical-align: top; }
  tbody tr:last-child td { border-bottom: 0; }

  .play { width: 96px; padding: 8px 8px 8px 12px; }

  canvas {
    display: block;
    width: 96px;
    height: 96px;
    background: var(--stage);
    border: 1px solid var(--line);
    border-radius: 2px;
    image-rendering: pixelated;
  }

  .id {
    font-family: var(--mono);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--key);
    font-weight: 600;
  }

  .id .kind {
    display: block;
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .shows { color: var(--ink-2); width: 34%; }

  .move { font-weight: 600; }

  .move em {
    display: block;
    font-style: normal;
    font-weight: 400;
    font-size: 13px;
    color: var(--muted);
  }

  .where {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
  }

  .guess {
    display: inline-block;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    border: 1px solid var(--line);
    border-radius: 2px;
    padding: 1px 5px;
    margin-left: 6px;
    color: var(--muted);
    vertical-align: 2px;
  }

  footer {
    border-top: 1px solid var(--line);
    padding-top: 20px;
    color: var(--muted);
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  footer p { margin: 0; max-width: 70ch; }

  @media (max-width: 640px) { .page { padding: 36px 16px 64px; } }
</style>

<div class="page">
  <header>
    <div class="eyebrow">poketerra · public/sprites</div>
    <h1>Effect Atlas Map</h1>
    <p class="lede">Every sheet under <code>effects/</code> and <code>directional/</code>, playing at its own speed, beside the move it would serve. <span class="where">Plays on</span> says where the effect belongs — on the attacker, on the defender, or over the field.</p>
    <div class="counts">
      <div class="count"><b>${readings}</b><span>sheets</span></div>
      <div class="count"><b>${moves}</b><span>move effects</span></div>
      <div class="count"><b>${free}</b><span>unclaimed</span></div>
      <div class="count"><b>${emotes}</b><span>emotes</span></div>
      <div class="count"><b>${looping}</b><span>loop cleanly</span></div>
    </div>
    <div class="note">
      <p>Each frame is drawn the way the game draws it: put back at its trim inside the source cell, held from the tick its number names until the next number there is. Sheets marked <code>loops</code> run continuously; the rest play once and pause before repeating.</p>
      <p>Moves whose picture is a thing crossing the gap carry no assignment: a projectile needs a sprite that travels, not an effect pinned to one combatant. Those sheets are listed last, under what they read as rather than what they are.</p>
      ${
        empty.length === 0
          ? ''
          : `<p>Still being packed, so not read here: ${empty.map((sheet) => `<code>${sheet}</code>`).join(', ')}.</p>`
      }${
        missing.length === 0
          ? ''
          : `<p>On disk but not yet read: ${missing.map((sheet) => `<code>${sheet}</code>`).join(', ')}.</p>`
      }
    </div>
  </header>

  ${sections}

  <footer>
    <p>The ten emote sheets are the newest batch and the only ones packed as 8-bit RGBA; everything older is 2- or 4-bit palette. They belong to the overworld and dialogue layers, not to the battle move table.</p>
    <p>Two pairs still carry one subject between them: 43 and 44 are the same lightning with different decays, and 6 and 14 are the same bell with a warmer and a cooler ring. Take one and hold the other as its variant.</p>
    <p>Move names are the closest fit from the standard move set. Nothing here is wired up; this is a shopping list, not a manifest.</p>
    <p>Generated by <code>scripts/effect-atlas.ts</code> — rerun it after packing new sheets.</p>
  </footer>
</div>

<script>
  const SHEETS = ${JSON.stringify(packed)};
  const TICK = 1000 / 60;
  const HOLD = 500;

  const players = [];

  for (const canvas of document.querySelectorAll('canvas[data-sheet]')) {
    const sheet = SHEETS[canvas.dataset.sheet];
    const context = canvas.getContext('2d');
    const image = new Image();

    image.src = sheet.src;
    context.imageSmoothingEnabled = false;

    // The cell is fitted to the box once: every frame is placed inside
    // that cell, so a growing effect grows instead of being refitted
    const scale = Math.min(canvas.width / sheet.cell[0], canvas.height / sheet.cell[1]);
    const left = (canvas.width - sheet.cell[0] * scale) / 2;
    const top = (canvas.height - sheet.cell[1] * scale) / 2;

    players.push({ canvas, context, image, sheet, scale, left, top, at: 0, visible: false });
  }

  const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const player = players.find((one) => one.canvas === entry.target);

      if (player != null) player.visible = entry.isIntersecting;
    }
  });

  for (const player of players) watcher.observe(player.canvas);

  let last = null;

  function draw(now) {
    const elapsed = last == null ? 0 : now - last;

    last = now;
    for (const player of players) {
      if (!player.visible || !player.image.complete) continue;

      const { sheet, context, canvas } = player;
      const span = sheet.timeline.length * TICK + (sheet.loops ? 0 : HOLD);

      player.at = (player.at + elapsed) % span;

      const tick = Math.min(sheet.timeline.length - 1, Math.floor(player.at / TICK));
      const frame = sheet.frames[sheet.timeline[tick]];

      context.clearRect(0, 0, canvas.width, canvas.height);
      if (frame == null) continue;
      context.drawImage(
        player.image,
        frame.x, frame.y, frame.w, frame.h,
        Math.round(player.left + frame.tx * player.scale),
        Math.round(player.top + frame.ty * player.scale),
        Math.round(frame.w * player.scale),
        Math.round(frame.h * player.scale),
      );
    }
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
</script>
`;

const out = process.argv[2] ?? '';

if (out === '') {
  throw new Error('Usage: node scripts/effect-atlas.ts <out.html>');
}
writeFileSync(out, page);
say(`${readings} sheets, ${looping} looping -> ${out} (${Math.round(page.length / 1024)} KB)`);
if (missing.length > 0) {
  say(`unread: ${missing.join(' ')}`);
}
if (empty.length > 0) {
  say(`still packing: ${empty.join(' ')}`);
}
