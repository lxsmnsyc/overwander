import { type JSX, createEffect, createResource, createSignal, on } from 'solid-js';
import { listMyTitles, saveSprite, saveTitle } from '../../auth/achievements';
import { type Profile, saveProfile } from '../../auth/profile';
import { PLAYER_NAME_LIMIT, asNickname } from '../../auth/nickname';
import { type Title, getTitleName } from '../../data/ids/titles';
import { Button, Combobox, Dialog, DialogActions, Status, TextField } from '../styled';
import SpritePicker from './SpritePicker';

/**
 * The things about a trainer that are theirs to set: what they are
 * called, the character they go about as, and which earned title hangs
 * under it.
 *
 * All live behind a dialog rather than in the card. A name that can be
 * typed over wherever it is shown is a name a player edits by accident,
 * and the card is read far more often than it is changed
 */

/** The picker's stand-in for wearing no title */
const NO_TITLE = -1;
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
  const [sprite, setSprite] = createSignal('');
  const [title, setTitle] = createSignal<Title>(NO_TITLE);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // What may be worn, read when the dialog opens: the earned list is
  // the server's answer, so the picker never offers a title the save
  // would refuse
  const [earned] = createResource(
    () => (props.isOpen ? props.player : null),
    async () => listMyTitles(),
  );

  const choices = (): { value: Title; label: string }[] => [
    { value: NO_TITLE, label: 'No title' },
    ...(earned.latest ?? []).flatMap((option) => {
      const label = getTitleName(option);

      return label == null ? [] : [{ value: option, label }];
    }),
  ];

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
        setSprite(props.profile.sprite);
        setTitle(props.profile.title ?? NO_TITLE);
        setError(null);
      },
    ),
  );

  /**
   * The name as it will actually be stored. The field is cleaned as it
   * is typed rather than refused on save: a player pasting something
   * outside the alphabet should see what they will get instead of
   * being told no afterwards
   */
  const wanted = (): string => asNickname(name(), PLAYER_NAME_LIMIT);

  const save = (): void => {
    if (wanted() === '') {
      return;
    }
    setError(null);
    setSaving(true);
    // The character and the title ride their own server calls, since
    // both are checked against what was earned; the nickname is the
    // one thing here a player writes directly
    Promise.all([
      saveProfile(props.player, { nickname: wanted() }),
      saveSprite(sprite()),
      saveTitle(title() === NO_TITLE ? null : title()),
    ])
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
      description="What everybody else sees you as: the name on your lots and in a lobby, and the character standing beside it."
    >
      <TextField
        label="Nickname"
        value={name()}
        autocomplete="nickname"
        hint={`Letters, digits, spaces and ' . - are kept. ${PLAYER_NAME_LIMIT} at most.`}
        disabled={saving()}
        onChange={(value) => {
          setName(asNickname(value, PLAYER_NAME_LIMIT));
        }}
      />
      <SpritePicker
        value={sprite()}
        disabled={saving()}
        onChange={(sheet) => {
          setSprite(sheet);
        }}
      />

      {/* Only what has been earned is offered: the list is the
          server's, and the save is checked against it again. Typed
          rather than scrolled, since a player deep in the ladder has
          a long list of them */}
      <Combobox
        label="Title"
        value={title()}
        options={choices()}
        disabled={saving()}
        placeholder="Search your titles…"
        hint="Earned from achievements and the badge ladder; worn under your name."
        onChange={(value) => {
          setTitle(value);
        }}
      />

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
