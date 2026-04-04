import { Command } from 'cmdk';
import { ArrowUpRight, Globe, Rocket, Search, Settings } from 'lucide-react';
import { createElement, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { allTools } from '@/lib/tools';

const QUICK_ACTIONS = [
  { label: 'Start product research', path: '/app/product-discovery', icon: Search },
  { label: 'Generate website', path: '/app/website-generator', icon: Globe },
  { label: 'Launch planner', path: '/app/launch-planner', icon: Rocket },
  { label: 'Open settings', path: '/app/settings', icon: Settings },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const navigate = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[18vh]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg mx-4 overflow-hidden animate-scale-in"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" loop>
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid #E5E7EB' }}
          >
            <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <Command.Input
              placeholder="Search tools or jump to..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}
              autoFocus
            />
            <kbd
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#CBD5E1', fontSize: 10 }}
            >
              ESC
            </kbd>
          </div>
          <Command.List
            className="max-h-[320px] overflow-auto py-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB transparent' }}
          >
            <Command.Empty className="px-4 py-6 text-center text-sm" style={{ color: '#9CA3AF' }}>
              No results found.
            </Command.Empty>

            <Command.Group
              heading="Quick Actions"
              className="px-2 py-1"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {QUICK_ACTIONS.map((a) => (
                <Command.Item
                  key={a.path}
                  value={a.label}
                  onSelect={() => navigate(a.path)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm"
                  style={{ color: '#111827' }}
                  data-cmdk-item=""
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.1)' }}
                  >
                    {createElement(a.icon, { size: 12, style: { color: '#6366F1' } })}
                  </div>
                  <span className="flex-1">{a.label}</span>
                  <ArrowUpRight size={12} style={{ color: '#9CA3AF' }} />
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="All Tools"
              className="px-2 py-1"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {allTools.map((tool) => (
                <Command.Item
                  key={tool.id}
                  value={`${tool.label} ${tool.description}`}
                  onSelect={() => navigate(tool.path)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm"
                  style={{ color: '#111827' }}
                  data-cmdk-item=""
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F9FAFB' }}
                  >
                    {createElement(tool.icon, { size: 12, style: { color: '#6B7280' } })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-bold truncate"
                      style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 13 }}
                    >
                      {tool.label}
                    </div>
                    <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                      {tool.description}
                    </div>
                  </div>
                  <ArrowUpRight size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
