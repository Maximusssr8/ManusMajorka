import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';

interface Command {
  id: string;
  label: string;
  icon: string;
  category: 'Navigate' | 'Action' | 'Filter';
  path?: string;
  action?: string;
}

const COMMANDS: Command[] = [
  // Navigation
  { id: 'home', label: 'Home Dashboard', icon: '🏠', category: 'Navigate', path: '/app' },
  { id: 'products', label: 'Product Intelligence', icon: '🔍', category: 'Navigate', path: '/app/product-intelligence' },
  { id: 'market', label: 'Market Dashboard', icon: '📊', category: 'Navigate', path: '/app/market' },
  { id: 'creators', label: 'Creator Intelligence', icon: '👥', category: 'Navigate', path: '/app/creators' },
  { id: 'profit', label: 'Profit Calculator', icon: '💰', category: 'Navigate', path: '/app/profit' },
  { id: 'trend', label: 'Trend Radar', icon: '📡', category: 'Navigate', path: '/app/trend-radar' },
  { id: 'maya', label: 'Maya AI Chat', icon: '🤖', category: 'Navigate', path: '/app/ai-chat' },
  { id: 'ads', label: 'Ads Studio', icon: '🎯', category: 'Navigate', path: '/app/ads-studio' },
  { id: 'revenue', label: 'Revenue Tracker', icon: '📈', category: 'Navigate', path: '/app/revenue' },
  { id: 'settings', label: 'Settings', icon: '⚙️', category: 'Navigate', path: '/app/settings' },
  // Actions
  { id: 'export', label: 'Export Products CSV', icon: '⬇️', category: 'Action', action: 'export-csv' },
  { id: 'refresh', label: 'Refresh Product Data', icon: '🔄', category: 'Action', action: 'refresh-data' },
  // Filters
  { id: 'filter-hot', label: 'Show Hot Products Only', icon: '🔥', category: 'Filter', path: '/app/product-intelligence?filter=hot' },
  { id: 'filter-rising', label: 'Show Rising Products', icon: '📈', category: 'Filter', path: '/app/product-intelligence?filter=rising' },
];

interface CommandPaletteProps {
  onClose: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Group and filter commands
  const { groups, flatList } = useMemo(() => {
    const filtered = COMMANDS.filter(cmd =>
      cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    // Group by category
    const grouped: Record<string, Command[]> = {};
    filtered.forEach(cmd => {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    });

    // Flatten for keyboard navigation
    const flat: Command[] = [];
    const groupOrder = ['Navigate', 'Action', 'Filter'];
    groupOrder.forEach(cat => {
      if (grouped[cat]) {
        flat.push(...grouped[cat]);
      }
    });

    return { groups: grouped, flatList: flat };
  }, [query]);

  const handleExecute = (cmd: Command) => {
    if (cmd.path) {
      setLocation(cmd.path);
    } else if (cmd.action) {
      // Handle action here (export-csv, refresh-data, etc.)
      // For now, just log it
      console.log('Action:', cmd.action);
    }
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % flatList.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatList.length) % flatList.length);
      } else if (e.key === 'Enter' && flatList.length > 0) {
        e.preventDefault();
        handleExecute(flatList[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flatList, selectedIndex, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#0C1120',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          marginLeft: 16,
          marginRight: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, products, tools..."
            style={{
              flex: 1,
              fontSize: 16,
              border: 'none',
              background: 'transparent',
              color: 'white',
              outline: 'none',
              fontFamily: "'Inter', -apple-system, sans-serif",
              caretColor: '#6366F1',
            }}
          />
        </div>

        {/* Results list */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {flatList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No results found
            </div>
          ) : (
            <>
              {(['Navigate', 'Action', 'Filter'] as const).map(category => {
                const items = groups[category];
                if (!items || items.length === 0) return null;

                return (
                  <div key={category}>
                    {/* Category header */}
                    <div
                      style={{
                        padding: '8px 16px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    >
                      {category}
                    </div>

                    {/* Items */}
                    {items.map((item, idx) => {
                      const itemIndex = flatList.indexOf(item);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleExecute(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: 44,
                            paddingLeft: 16,
                            paddingRight: 16,
                            background: isSelected ? 'rgba(99,102,241,0.15)' : 'transparent',
                            borderLeft: isSelected ? '2px solid #6366F1' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'background 100ms',
                            gap: 10,
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                        >
                          {/* Icon */}
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>

                          {/* Label */}
                          <span
                            style={{
                              flex: 1,
                              fontSize: 14,
                              color: isSelected ? '#E2E8F0' : '#CBD5E1',
                              fontFamily: "'Inter', -apple-system, sans-serif",
                            }}
                          >
                            {item.label}
                          </span>

                          {/* Category pill */}
                          <span
                            style={{
                              fontSize: 11,
                              color: '#9CA3AF',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 4,
                              padding: '2px 6px',
                              fontWeight: 500,
                              flexShrink: 0,
                            }}
                          >
                            {category}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
