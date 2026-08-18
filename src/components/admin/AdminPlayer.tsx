import { A } from '@solidjs/router';
import { type JSX, type Resource, Show, Suspense, createResource, createSignal } from 'solid-js';
import type { PlayerRow } from '../../auth/admin';
import { ROLES, ROLE_NAMES, type Role, canActOn, grantableRoles } from '../../auth/staff';
import { Badge, Button, Card, Meta, Note, Row, Select, Status, TextField } from '../styled';
import ProfileTab from '../profile/ProfileTab';
import { getPlayer, setPlayerBan, setPlayerRole } from '../../auth/admin';
import useStaff from './staff-context';

/**
 * One account, from both sides.
 *
 * The top of the page is what only the dashboard can see — the
 * address, the uid, the role, the day the account was opened. Under
 * it is the profile exactly as another player meets it, so what the
 * staff read and what a trainer in a lobby reads cannot drift apart.
 */

/** The role as one of the four, so an unknown one reads as a player */
function asRole(role: string): Role {
  return ROLES.find((known) => known === role) ?? '';
}

/** The day the account was opened, said the way a date is said locally */
function opened(at: number): string {
  return Number.isNaN(at) ? 'unknown' : new Date(at).toLocaleDateString();
}

/**
 * The account itself, which is where it is read. A read in the body
 * that declared it throws past every boundary written there
 */
function PlayerCard(props: { uid: string; player: Resource<PlayerRow | null> }): JSX.Element {
  const staff = useStaff();
  /**
   * What the account holds now, once this page has changed it. Null
   * until then, so the page reads the listing's answer rather than one
   * it made up
   */
  const [granted, setGranted] = createSignal<string | null>(null);
  const [shut, setShut] = createSignal<boolean | null>(null);
  const [why, setWhy] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [wrong, setWrong] = createSignal<string | null>(null);

  const roleOf = (row: PlayerRow): string => granted() ?? row.role;

  const bannedNow = (row: PlayerRow): boolean => shut() ?? row.banned;

  /** Whether this account stands below the reader's own */
  const beneath = (row: PlayerRow): boolean =>
    row.uid !== staff.uid && canActOn(staff.role(), roleOf(row));

  const act = <T,>(action: Promise<T | null>, refused: string, keep: (value: T) => void): void => {
    setWrong(null);
    setBusy(true);
    action
      .then((value) => {
        if (value == null) {
          setWrong(refused);
          return;
        }
        keep(value);
      })
      .catch((caught: unknown) => {
        setWrong(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <Show
      when={props.player()}
      fallback={
        <Card title="No such account">
          <Note>
            Nothing has ever signed in under {props.uid}. <A href="/admin/players">Back to the
            accounts.</A>
          </Note>
        </Card>
      }
    >
      {(row) => (
        <div class="flex flex-col gap-4">
          <Card title={row().nickname === '' ? 'Unnamed trainer' : row().nickname}>
            <Row>
              <Badge tone={roleOf(row()) === '' ? 'neutral' : 'tide'}>
                {ROLE_NAMES[asRole(roleOf(row()))]}
              </Badge>
              <Show when={bannedNow(row())}>
                <Badge tone="ember">banned</Badge>
              </Show>
              <Badge tone="gold">{row().gold} gold</Badge>
              <Meta>joined {opened(row().createdAt)}</Meta>
            </Row>
            <Meta class="font-mono break-all">{row().email === '' ? 'no address' : row().email}</Meta>
            <Meta class="font-mono break-all">{row().uid}</Meta>
          </Card>

          {/* What this page changes about an account. Both halves are
              offered only where the reader stands above it — and both
              are checked again on the server, which is what actually
              decides */}
          <Card title="Standing">
            <Show
              when={beneath(row())}
              fallback={
                <Note>
                  {row().uid === staff.uid
                    ? 'Your own account. Nobody may take their own authority off.'
                    : 'This account stands at or above your own, so there is nothing to change here.'}
                </Note>
              }
            >
              <Show
                when={grantableRoles(staff.role()).length > 0}
                fallback={<Note>Your rank hands out no roles.</Note>}
              >
                <Row class="items-end">
                  <Select
                    label="Role"
                    class="grow"
                    value={roleOf(row())}
                    options={grantableRoles(staff.role()).map((role) => ({
                      value: role,
                      label: ROLE_NAMES[role],
                    }))}
                    disabled={busy()}
                    onChange={(wanted) => {
                      act(setPlayerRole(row().uid, wanted), 'That role is not yours to hand out.', (role) => {
                        setGranted(role);
                      });
                    }}
                  />
                </Row>
              </Show>

              {/* A ban is the one power every rank of staff has. The
                  reason travels with it: a ban nobody can explain is
                  one nobody can appeal */}
              <Row class="items-end">
                <Show when={!bannedNow(row())}>
                  <TextField
                    label="Reason"
                    class="grow"
                    value={why()}
                    placeholder="What it is for"
                    disabled={busy()}
                    onChange={(value) => {
                      setWhy(value);
                    }}
                  />
                </Show>
                <Button
                  tone={bannedNow(row()) ? 'primary' : 'danger'}
                  disabled={busy()}
                  onClick={() => {
                    act(
                      setPlayerBan(row().uid, !bannedNow(row()), why().trim()),
                      'That account is not yours to ban.',
                      (banned) => {
                        setShut(banned);
                        setWhy('');
                      },
                    );
                  }}
                >
                  {bannedNow(row()) ? 'Let them back in' : 'Ban'}
                </Button>
              </Row>
              <Show when={bannedNow(row()) && row().banReason !== ''}>
                <Meta>Banned for: {row().banReason}</Meta>
              </Show>
            </Show>
            <Status message={wrong()} tone="alert" />
          </Card>

          {/* The game's own profile, with everything that writes taken
              off it. Staff read a player the way a player does */}
          <ProfileTab player={row().uid} viewOnly />
        </div>
      )}
    </Show>
  );
}

export default function AdminPlayer(props: { uid: string }): JSX.Element {
  const [player] = createResource(() => props.uid, getPlayer);

  return (
    <Suspense fallback={<Note>Reading the account…</Note>}>
      <PlayerCard uid={props.uid} player={player} />
    </Suspense>
  );
}
