import { A, useLocation } from '@solidjs/router';
import { For, type JSX, type ParentProps } from 'solid-js';
import { linksFor, sectionFor } from './sections';
import { ROLES, ROLE_NAMES, type Role } from '../../auth/staff';
import { Badge } from '../styled';
import useStaff from './staff-context';
import { ThemeToggle } from '../app/theme';

/**
 * The frame every dashboard screen is drawn in: the sections down one
 * side, what is open across the top, and the screen itself under it.
 *
 * It is the game's own furniture — the same paper, edges and hard
 * shadows — but laid out as a page rather than as a panel over the
 * world. A dashboard is read at a desk, so it scrolls, it uses the
 * width it is given, and nothing about it is pulled over anything
 * else.
 */

/** A section in the sidebar, drawn the way the game draws a tab */
const LINK =
  'block rounded-lg border-2 px-3 py-1.5 text-sm font-bold no-underline transition-colors' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide';

const RESTING = 'border-transparent text-muted hover:border-transparent hover:text-ink';

const OPEN = 'border-tide-dark bg-tide text-on-accent shadow-pop-sm hover:text-on-accent';

export interface AdminShellProps extends ParentProps {
  /** Who is reading it, said in the header so a shared machine says so */
  nickname: string;
}

/** The role as one of the four, so an unknown one reads as a player */
function asRole(role: string): Role {
  return ROLES.find((known) => known === role) ?? '';
}

export default function AdminShell(props: AdminShellProps): JSX.Element {
  const location = useLocation();
  const staff = useStaff();
  const section = (): { title: string; lede: string } => sectionFor(location.pathname);

  return (
    <div class="min-h-dvh w-full">
      <div class="mx-auto flex min-h-dvh w-full max-w-7xl flex-col lg:flex-row">
        <aside class="shrink-0 border-b-2 border-line lg:w-56 lg:border-r-2 lg:border-b-0">
          {/* Pinned while the screen beside it scrolls: a dashboard is
              long, and the way out of a section should not be a
              scroll back to the top */}
          <div class="flex flex-col gap-3 p-3 lg:sticky lg:top-0">
            <A
              href="/"
              class="flex items-baseline gap-2 rounded-xl border-2 border-tide bg-tide px-3 py-2
                text-on-accent no-underline shadow-pop hover:text-on-accent"
            >
              <span class="text-base font-extrabold tracking-tight">Poketerra</span>
              <span class="text-xs font-bold tracking-[0.12em] uppercase opacity-80">Admin</span>
            </A>
            <nav aria-label="Dashboard sections">
              {/* A column at a desk and a scrolling row on a phone:
                  five sections do not fit across a narrow screen, and
                  a wrapped sidebar pushes the screen itself off it */}
              <ul
                class="m-0 flex list-none flex-row gap-1 overflow-x-auto p-0
                  lg:flex-col lg:overflow-visible"
              >
                <For each={linksFor(staff.role())}>
                  {(entry) => (
                    <li class="shrink-0 lg:shrink">
                      <A
                        href={entry.href}
                        // Only the overview matches by prefix alone,
                        // and every section lives under it
                        end={entry.href === '/admin'}
                        class={LINK}
                        activeClass={OPEN}
                        inactiveClass={RESTING}
                      >
                        {entry.label}
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </nav>
          </div>
        </aside>

        <div class="flex min-w-0 grow flex-col">
          <header
            class="flex flex-wrap items-center gap-3 border-b-2 border-line bg-paper px-4 py-3
              shadow-pop-sm"
          >
            <div class="min-w-0 grow">
              <h1>{section().title}</h1>
              <p class="max-w-prose text-sm text-muted">{section().lede}</p>
            </div>
            <Badge tone="tide">
              {props.nickname} · {ROLE_NAMES[asRole(staff.role())]}
            </Badge>
            <ThemeToggle />
          </header>

          <main class="grow px-4 py-4">{props.children}</main>
        </div>
      </div>
    </div>
  );
}
