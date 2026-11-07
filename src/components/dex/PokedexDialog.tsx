import type { JSX } from 'solid-js';
import BattleData from '../app/BattleData';
import { Button, Dialog, DialogActions, Meta } from '../styled';
import PokedexTab from './PokedexTab';
import { m } from '../../i18n/paraglide/messages.js';

export interface PokedexDialogProps {
  player: string;
  isOpen: boolean;
  onClose: () => void;
  /** What the dialog is called and what it is for, which the route keeps */
  title: string;
  description: string;
}

/** The dex in a sheet the size of the bag's: a rail of regions beside the grid */
export default function PokedexDialog(props: PokedexDialogProps): JSX.Element {
  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      width="rail"
      terse
      title={props.title}
      description={props.description}
    >
      <BattleData>
        <PokedexTab player={props.player} />
      </BattleData>
      <DialogActions note={<Meta class="hidden md:block">{m.dex_press_note()}</Meta>}>
        <Button onClick={props.onClose}>{m.ui_close()}</Button>
      </DialogActions>
    </Dialog>
  );
}
