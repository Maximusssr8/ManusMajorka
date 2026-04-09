import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Toaster } from 'sonner';
import { Nav } from './Nav';

interface AppShellProps { children: ReactNode }

/**
 * AppShell — root layout for authenticated /app routes.
 *
 * Wraps the tree in:
 *   - Radix Tooltip.Provider so tooltips anywhere in the app just work
 *   - sonner Toaster (Majorka-themed) for toast notifications
 *   - A motion.div page-transition wrapper that fades content in on
 *     route change (initial opacity 0 + 8px drop → opacity 1)
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={100}>
      <div className="flex min-h-screen bg-bg text-text font-body">
        <Nav />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-bg">
          <motion.div
            key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </div>
      </div>

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1a1d27',
            color: '#f0f4ff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
          },
        }}
      />
    </Tooltip.Provider>
  );
}
