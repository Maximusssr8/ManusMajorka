import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

/**
 * useKeyboardShortcuts — Shopify-inspired G+key global navigation.
 *
 * G+H = Home, G+P = Products, G+M = Maya AI, G+A = Ads Studio,
 * G+S = Store Builder, G+R = Revenue, G+L = Academy
 * ? = show shortcut help
 * ⌘K / Ctrl+K = focus search (handled in Products.tsx already)
 *
 * Call once in AppShell.tsx.
 */
export function useKeyboardShortcuts() {
  const [, navigate] = useLocation();

  useEffect(() => {
    let buffer = '';
    let bufferTimer: ReturnType<typeof setTimeout>;

    const SHORTCUTS: Record<string, string> = {
      'gh': '/app',
      'gp': '/app/products',
      'gm': '/app/ai-chat',
      'ga': '/app/ads-studio',
      'gs': '/app/store-builder',
      'gr': '/app/revenue',
      'gl': '/app/learn',
    };

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      // ⌘K handled in Products.tsx already
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') return;

      // ? = show help
      if (e.key === '?') {
        toast('Shortcuts: G+H Home · G+P Products · G+M Maya · G+A Ads · G+S Store · G+R Revenue · G+L Academy', { duration: 5000 });
        return;
      }

      const key = e.key.toLowerCase();
      buffer += key;
      clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => { buffer = ''; }, 600);

      if (SHORTCUTS[buffer]) {
        e.preventDefault();
        navigate(SHORTCUTS[buffer]);
        buffer = '';
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(bufferTimer);
    };
  }, [navigate]);
}
