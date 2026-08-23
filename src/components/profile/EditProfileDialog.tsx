import { type JSX, Show, createEffect, createSignal, on } from 'solid-js';
import { type Profile, saveProfile } from '../../auth/profile';
import { Button, Dialog, DialogActions, Status, TextField } from '../styled';

/**
 * The two things about a trainer that are theirs to set: what they are
 * called, and the picture beside the name.
 *
 * Both live behind a dialog rather than in the card. A name that can be
 * typed over wherever it is shown is a name a player edits by accident,
 * and the card is read far more often than it is changed
 */
export interface EditProfileDialogProps {
  player: string;
  /** What is stored now, which is what the boxes open on */
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditProfileDialog(props: EditProfileDialogProps): JSX.Element {
  const [name, setName] = createSignal('');
  const [avatar, setAvatar] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Opened on what is stored rather than on what was last typed: a
  // dialog closed without saving should not remember the refusal
  createEffect(
    on(
      () => props.isOpen,
      (open) => {
        if (!open) {
          return;
        }
        setName(props.profile.nickname);
        setAvatar(props.profile.avatar ?? '');
        setError(null);
      },
    ),
  );

  const save = (): void => {
    const wanted = name().trim();
    const picture = avatar().trim();

    if (wanted === '') {
      return;
    }
    setError(null);
    setSaving(true);
    // Empty is stored as nothing rather than as an empty string: the
    // record says a trainer with no picture has `null`
    saveProfile(props.player, { nickname: wanted, avatar: picture === '' ? null : picture })
      .then(() => {
        props.onSaved?.();
        props.onClose();
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Edit profile"
      description="What everybody else sees you as: the name on your lots and in a lobby, and the picture beside it."
    >
      <TextField
        label="Nickname"
        value={name()}
        autocomplete="nickname"
        disabled={saving()}
        onChange={(value) => {
          setName(value);
        }}
      />
      <TextField
        label="Avatar address"
        value={avatar()}
        kind="url"
        placeholder="https://…"
        disabled={saving()}
        onChange={(value) => {
          setAvatar(value);
        }}
      />

      {/* What it will look like beside the name, at the size the card
          draws it. Nothing is said about an address that loads
          nothing: the picture failing to appear says it */}
      <Show when={avatar().trim()}>
        {(picture) => (
          <img
            src={picture()}
            alt="Avatar"
            width={64}
            height={64}
            class="size-16 self-center rounded-full border-2 border-tide object-cover"
          />
        )}
      </Show>

      <Status message={error()} tone="alert" />
      <DialogActions>
        <Button tone="primary" disabled={saving() || name().trim() === ''} onClick={save}>
          {saving() ? 'Saving…' : 'Save'}
        </Button>
        <Button disabled={saving()} onClick={props.onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
