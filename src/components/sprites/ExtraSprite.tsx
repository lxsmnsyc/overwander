import { type JSX, Show, createSignal } from 'solid-js';
import { asNumber, asRecord, asRecordArray, asString } from '../../auth/__normalize';

/**
 * One picture off an extras sheet, drawn as a CSS background the way
 * every interface sprite is. The sheet's description is fetched once
 * and shared by every sprite on the page; a fetch that fails is
 * forgotten after a pause rather than cached, so a sheet that was
 * missing for a moment comes back
 */

interface SheetImage {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExtraSheet {
  images: SheetImage[];
}

const SHEETS = new Map<string, ExtraSheet>();
const FETCHING = new Set<string>();
const RETRY_PACE = 5000;

/** Bumped when a sheet lands, so every reader looks again */
const [landed, setLanded] = createSignal(0);

function sheetOf(name: string): ExtraSheet | null {
  landed();

  const held = SHEETS.get(name);

  if (held == null && !FETCHING.has(name)) {
    FETCHING.add(name);
    fetchSheet(name)
      .then((sheet) => {
        SHEETS.set(name, sheet);
        setLanded((count) => count + 1);
      })
      .catch(() => {
        setTimeout(() => {
          FETCHING.delete(name);
          setLanded((count) => count + 1);
        }, RETRY_PACE);
      });
  }
  return held ?? null;
}

async function fetchSheet(name: string): Promise<ExtraSheet> {
  const response = await fetch(`/sprites/extras/${name}.json`);

  if (!response.ok) {
    throw new Error(`No extras sheet at ${name}`);
  }

  const described: unknown = await response.json();

  return {
    images: asRecordArray(asRecord(described).images).map((entry) => ({
      name: asString(entry.name),
      x: asNumber(entry.x),
      y: asNumber(entry.y),
      width: asNumber(entry.width),
      height: asNumber(entry.height),
    })),
  };
}

export interface ExtraSpriteProps {
  /** The sheet under `sprites/extras`, subfolders and all */
  sheet: string;
  /** Which of its pictures, by the name the description carries */
  name: string;
  label: string;
  class?: string;
}

export default function ExtraSprite(props: ExtraSpriteProps): JSX.Element {
  const image = (): SheetImage | null =>
    sheetOf(props.sheet)?.images.find((entry) => entry.name === props.name) ?? null;

  return (
    <Show when={image()} keyed>
      {(found) => (
        <span
          role="img"
          aria-label={props.label}
          aria-hidden={props.label === '' ? 'true' : undefined}
          class={`inline-block ${props.class ?? ''}`}
          style={{
            width: `${found.width}px`,
            height: `${found.height}px`,
            'background-image': `url(/sprites/extras/${props.sheet}.png)`,
            'background-position': `-${found.x}px -${found.y}px`,
            'image-rendering': 'pixelated',
          }}
        />
      )}
    </Show>
  );
}
