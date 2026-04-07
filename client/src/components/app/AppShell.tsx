import type { ReactNode } from 'react';
import { Nav } from './Nav';

interface AppShellProps { children: ReactNode }

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
      <Nav />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflowX: 'hidden',
        color: '#ededed',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {children}
      </div>
    </div>
  );
}
