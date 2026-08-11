/**
 * The game's own components, as opposed to the headless ones they are
 * built on. Terracotta handles the behaviour; what a thing looks like
 * is decided here, once, so a dialog opened from the overworld and one
 * opened from the bag are the same dialog
 */
export { Dialog, DialogActions, DialogButton, DialogSection, DialogTitle } from './dialog';
export type { ButtonTone, DialogButtonProps, DialogProps, DialogWidth } from './dialog';
