import type { ReactNode } from 'react';
import { Nav } from './Nav';
import { t } from '@/lib/designTokens';

interface AppShellProps { children: ReactNode }

/**
 * AppShell — the root layout for all `/app/*` routes.
 *
 * Design notes:
 *   - Page background is the single source of truth (t.bg).
 *   - No radial violet glow — that was the AI-purple tell.
 *   - The nav sits flush against the page; its only separator is
 *     a 1px hairline, not a surface change.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: t.bg,
        color: t.text,
        fontFamily: t.fontBody,
      }}
    >
      <Nav />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflowX: 'hidden',
          background: t.bg,
        }}
      >
        {children}
      </div>
    </div>
  );
}
