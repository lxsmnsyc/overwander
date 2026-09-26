import { type JSX, Show, createSignal } from 'solid-js';
import { asNumber, asRecord, asRecordArray, asString } from '../../auth/__normalize';
import { spriteUrl } from '../../canvas/sprite-origin';

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
  /** The whole sheet, which a scaled picture has to scale with it */
  width: number;
  height: number;
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
  // From the sprite host: the app deployment leaves public/sprites out
  const response = await fetch(spriteUrl(`/sprites/extras/${name}.json`));

  if (!response.ok) {
    throw new Error(`No extras sheet at ${name}`);
  }

  const described: unknown = await response.json();

  const images: SheetImage[] = [];

  for (const entry of asRecordArray(asRecord(described).images)) {
    images.push({
      name: asString(entry.name),
      x: asNumber(entry.x),
      y: asNumber(entry.y),
      width: asNumber(entry.width),
      height: asNumber(entry.height),
    });
  }
  const whole = asRecord(described);

  return { width: asNumber(whole.width), height: asNumber(whole.height), images };
}

export interface ExtraSpriteProps {
  /** The sheet under `sprites/extras`, subfolders and all */
  sheet: string;
  /** Which of its pictures, by the name the description carries */
  name: string;
  label: string;
  /**
   * The longest side, in pixels, for a picture fitted to a box of its
   * own. Left out, it is drawn at the size it was cut at
   */
  size?: number;
  class?: string;
}

export default function ExtraSprite(props: ExtraSpriteProps): JSX.Element {
  const image = (): SheetImage | null => {
    for (const entry of sheetOf(props.sheet)?.images ?? []) {
      if (entry.name === props.name) {
        return entry;
      }
    }
    return null;
  };

  /** How far the picture is scaled to fit `size` */
  const scale = (found: SheetImage): number =>
    props.size == null ? 1 : props.size / Math.max(1, found.width, found.height);

  return (
    <Show when={image()} keyed>
      {(found) => (
        <span
          role="img"
          aria-label={props.label}
          aria-hidden={props.label === '' ? 'true' : undefined}
          class={`inline-block ${props.class ?? ''}`}
          style={{
            width: `${found.width * scale(found)}px`,
            height: `${found.height * scale(found)}px`,
            'background-image': `url(${spriteUrl(`/sprites/extras/${props.sheet}.png`)})`,
            'background-position': `-${found.x * scale(found)}px -${found.y * scale(found)}px`,
            // Only when scaled: drawn as cut, the sheet sits at its own size
            'background-size':
              props.size == null
                ? undefined
                : `${(sheetOf(props.sheet)?.width ?? 0) * scale(found)}px ${
                    (sheetOf(props.sheet)?.height ?? 0) * scale(found)
                  }px`,
            'image-rendering': 'pixelated',
          }}
        />
      )}
    </Show>
  );
}
