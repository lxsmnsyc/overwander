import type { JSX } from '@solidjs/web';
import type ProfileSection from '../../game/session/profile-section';
import ProfileBody from './profile-sheet/body';
import ProfileHero from './profile-sheet/hero';
import createProfileState from './profile-sheet/state';

/**
 * The profile with no dialog round it: the hero and what is under it,
 * on a page that already has its own frame (the staff panel reads a
 * player this way). The sheet in `profile-sheet/` is the same two
 * halves in the game's own dialog.
 */
export interface ProfileTabProps {
  player: string;
  /** Whether this is somebody else's profile, being looked at */
  viewOnly?: boolean;
  /** Which part to open at, read once on the way in */
  section?: ProfileSection;
}

export default function ProfileTab(props: ProfileTabProps): JSX.Element {
  const state = createProfileState({
    player: props.player,
    viewOnly: props.viewOnly === true,
    section: props.section,
  });

  return (
    <div class="flex flex-col overflow-hidden rounded-card border-2 border-line-soft">
      <ProfileHero state={state} />
      <ProfileBody state={state} />
    </div>
  );
}
