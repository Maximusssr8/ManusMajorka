import type { ReactNode } from 'react';
import { Nav } from './Nav';
import { t } from '@/lib/designTokens';

interface AppShellProps { children: ReactNode }

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
