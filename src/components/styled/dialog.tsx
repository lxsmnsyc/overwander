import type { JSX, ParentProps } from 'solid-js';
import {
  DialogOverlay,
  DialogPanel,
  Dialog as HeadlessDialog,
  DialogTitle as HeadlessDialogTitle,
} from 'terracotta';

/**
 * The game's dialogs, as a set rather than as a habit.
 *
 * Terracotta gives the behaviour — the overlay, the focus trap, the
 * escape key — and says nothing about how any of it looks, so every
 * dialog in the game had been carrying its own copy of the same
 * inline styles. Six copies is six chances to disagree, and they had
 * already started to: one panel opened at 10% from the top and
 * another at 20%, one scrolled and another did not.
 *
 * These are that panel, once. A dialog written against them says what
 * is in it and nothing about how tall it is.
 */

const OVERLAY_STYLE = {
  position: 'fixed',
  inset: '0',
  background: 'rgba(9, 12, 20, 0.55)',
} as const;

/**
 * How wide a panel opens. Most dialogs are a list of things to press;
 * a few — the catch sheet, the world map — are a page of detail, and
 * asking for room is better than every one of them being that wide
 */
export type DialogWidth = 'narrow' | 'wide';

const WIDTHS: Record<DialogWidth, string> = {
  narrow: 'min(92vw, 26rem)',
  wide: 'min(92vw, 42rem)',
};

function panelStyle(width: DialogWidth): JSX.CSSProperties {
  return {
    position: 'fixed',
    inset: '8% 50% auto auto',
    transform: 'translateX(50%)',
    width: WIDTHS[width],
    'max-height': '84vh',
    'overflow-y': 'auto',
    background: '#fdfdfb',
    color: '#1c2029',
    border: '1px solid #d9dde6',
    padding: '1rem 1.25rem 1.25rem',
    'border-radius': '0.75rem',
    'box-shadow': '0 1.5rem 3rem rgba(9, 12, 20, 0.28)',
    'text-align': 'left',
  };
}

export interface DialogProps extends ParentProps {
  isOpen: boolean;
  onClose: () => void;
  width?: DialogWidth;
}

/**
 * A dialog: the overlay behind it and the panel it is drawn on. What
 * goes in it is the caller's, and usually starts with a `DialogTitle`
 */
export function Dialog(props: DialogProps): JSX.Element {
  return (
    <HeadlessDialog isOpen={props.isOpen} onClose={props.onClose}>
      <DialogOverlay style={OVERLAY_STYLE} />
      <DialogPanel style={panelStyle(props.width ?? 'narrow')}>{props.children}</DialogPanel>
    </HeadlessDialog>
  );
}

/**
 * What the dialog is called. It is the first thing in the panel and
 * the thing a screen reader announces, so it is a heading rather than
 * bold text
 */
export function DialogTitle(props: ParentProps): JSX.Element {
  return (
    <HeadlessDialogTitle
      as="h2"
      style={{
        margin: '0 0 0.75rem',
        'font-size': '1.15rem',
        'line-height': '1.3',
        'border-bottom': '1px solid #eceff4',
        'padding-bottom': '0.5rem',
      }}
    >
      {props.children}
    </HeadlessDialogTitle>
  );
}

/**
 * A run of related things inside a dialog — a list and the sentence
 * above it — set apart from the run before it
 */
export function DialogSection(props: ParentProps & { title?: string }): JSX.Element {
  return (
    <section style={{ margin: '0 0 0.9rem' }}>
      {props.title == null ? null : (
        <h3 style={{ margin: '0 0 0.35rem', 'font-size': '0.95rem' }}>{props.title}</h3>
      )}
      {props.children}
    </section>
  );
}

/**
 * The row a dialog ends on. Buttons sit to the right of it, in the
 * order they are written, with the way out last
 */
export function DialogActions(props: ParentProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        'justify-content': 'flex-end',
        'align-items': 'center',
        'flex-wrap': 'wrap',
        margin: '1rem 0 0',
        'border-top': '1px solid #eceff4',
        'padding-top': '0.75rem',
      }}
    >
      {props.children}
    </div>
  );
}

/**
 * What a button in a dialog is for: the thing it is offering, a way
 * out of it, or something that cannot be taken back
 */
export type ButtonTone = 'primary' | 'ghost' | 'danger';

const TONES: Record<ButtonTone, { background: string; color: string; border: string }> = {
  primary: { background: '#2f6f4f', color: '#f6faf7', border: '1px solid #245741' },
  ghost: { background: '#f2f4f8', color: '#1c2029', border: '1px solid #d9dde6' },
  danger: { background: '#8f3b3b', color: '#fdf5f5', border: '1px solid #6f2d2d' },
};

export interface DialogButtonProps extends ParentProps {
  onClick?: () => void;
  disabled?: boolean;
  tone?: ButtonTone;
}

/**
 * A button that looks like the dialog it is in. It stays a plain
 * button underneath — the game has a great many of them, and none of
 * them want a framework
 */
export function DialogButton(props: DialogButtonProps): JSX.Element {
  const tone = (): ButtonTone => props.tone ?? 'ghost';

  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={() => {
        props.onClick?.();
      }}
      style={{
        ...TONES[tone()],
        padding: '0.35rem 0.75rem',
        'border-radius': '0.4rem',
        font: 'inherit',
        cursor: props.disabled === true ? 'default' : 'pointer',
        opacity: props.disabled === true ? '0.5' : '1',
      }}
    >
      {props.children}
    </button>
  );
}
