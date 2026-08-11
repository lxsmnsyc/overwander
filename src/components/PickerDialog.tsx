import type { JSX, ParentProps } from 'solid-js';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from 'terracotta';

/**
 * The panel a dialog is drawn in. It had been copied from one
 * component to the next; the pickers share this one, and the older
 * dialogs — which build their heading out of whatever they have
 * loaded — can move onto it as they are next touched
 */
const PANEL_STYLE = {
  position: 'fixed',
  inset: '10% 50% auto auto',
  transform: 'translateX(50%)',
  'max-height': '80vh',
  'overflow-y': 'auto',
  background: '#fff',
  padding: '1rem 2rem',
  'border-radius': '0.5rem',
  'text-align': 'left',
} as const;

const OVERLAY_STYLE = {
  position: 'fixed',
  inset: '0',
  background: 'rgba(0, 0, 0, 0.4)',
} as const;

export interface PickerDialogProps extends ParentProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
}

/**
 * A dialog with a heading and whatever the caller puts in it
 */
export default function PickerDialog(props: PickerDialogProps): JSX.Element {
  return (
    <Dialog isOpen={props.isOpen} onClose={props.onClose}>
      <DialogOverlay style={OVERLAY_STYLE} />
      <DialogPanel style={PANEL_STYLE}>
        <DialogTitle>{props.title}</DialogTitle>
        {props.children}
      </DialogPanel>
    </Dialog>
  );
}
