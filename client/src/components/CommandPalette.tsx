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
  { id: 'home', label: 'Home', icon: '🏠', category: 'Navigate', path: '/app' },
  { id: 'products', label: 'Products', icon: '🔍', category: 'Navigate', path: '/app/products' },
  { id: 'creators', label: 'Creators', icon: '👥', category: 'Navigate', path: '/app/creators' },
  { id: 'maya', label: 'Maya AI', icon: '🤖', category: 'Navigate', path: '/app/ai-chat' },
  { id: 'ads-studio', label: 'Ads Studio', icon: '🎯', category: 'Navigate', path: '/app/ads-studio' },
  { id: 'ad-briefs', label: 'Ad Briefs', icon: '📝', category: 'Navigate', path: '/app/ad-spy' },
  { id: 'store-builder', label: 'Store Builder', icon: '🏪', category: 'Navigate', path: '/app/store-builder' },
  { id: 'alerts', label: 'Alerts', icon: '🔔', category: 'Navigate', path: '/app/alerts' },
  { id: 'spy', label: 'Competitor Spy', icon: '🕵️', category: 'Navigate', path: '/app/spy' },
  { id: 'revenue', label: 'Revenue', icon: '📈', category: 'Navigate', path: '/app/revenue' },
  { id: 'learn', label: 'Academy', icon: '🎓', category: 'Navigate', path: '/app/learn' },
  { id: 'settings', label: 'Settings', icon: '⚙️', category: 'Navigate', path: '/app/settings' },
  { id: 'pricing', label: 'Pricing', icon: '💳', category: 'Navigate', path: '/pricing' },
  // Actions
  { id: 'export', label: 'Export Products CSV', icon: '⬇️', category: 'Action', action: 'export-csv' },
  { id: 'refresh', label: 'Refresh Product Data', icon: '🔄', category: 'Action', action: 'refresh-data' },
  // Filters
  { id: 'filter-hot', label: 'Hot Products', icon: '🔥', category: 'Filter', path: '/app/products?tab=hot-now' },
  { id: 'filter-new', label: 'Newest Products', icon: '✨', category: 'Filter', path: '/app/products?tab=new' },
  { id: 'filter-margin', label: 'High Margin', icon: '💰', category: 'Filter', path: '/app/products?tab=highmargin' },
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
