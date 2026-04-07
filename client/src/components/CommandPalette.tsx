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
      // No-op stub — replace with action dispatcher when implementing.
      void cmd.action;
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
    <div className="mkr-cmdk-overlay" onClick={onClose}>
      <div className="mkr-cmdk-container" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <input
          autoFocus
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Search pages, products, tools..."
          className="mkr-cmdk-input"
        />

        {/* Results list */}
        <div className="mkr-cmdk-results-list">
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
                    <div className="mkr-cmdk-section-header">
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
                          className={`mkr-cmdk-result-item ${isSelected ? 'active' : ''}`}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          role="option"
                          aria-selected={isSelected}
                        >
                          {/* Icon */}
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>

                          {/* Label */}
                          <span style={{ flex: 1 }}>
                            {item.label}
                          </span>

                          {/* Category pill */}
                          <span className="mkr-cmdk-kbd">
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
