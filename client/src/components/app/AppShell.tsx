import type { ReactNode } from 'react';
import { Nav } from './Nav';

interface AppShellProps { children: ReactNode }

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#151515' }}>
      <Nav />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflowX: 'hidden',
        color: '#ededed',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,106,255,0.08) 0%, transparent 60%), #151515',
      }}>
        {children}
      </div>
    </div>
  );
}
