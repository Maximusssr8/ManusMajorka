/**
 * History page — shows all tool usage history from localStorage activity log.
 * Filterable by tool type, searchable, with delete functionality.
 */

import { ArrowLeft, ArrowUpRight, Clock, Filter, Search, Trash2 } from 'lucide-react';
import { createElement, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useDocumentTitle } from '@/_core/hooks/useDocumentTitle';
import { type ActivityEntry, getActivityLog, getRelativeTime } from '@/lib/activity';
import { allTools } from '@/lib/tools';

const ACTIVITY_KEY = 'majorka_activity_log';

export default function History() {
  useDocumentTitle('History');
  const [, setLocation] = useLocation();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    setEntries(getActivityLog());
  }, []);

  // Unique tool types from entries
  const toolTypes = Array.from(new Set(entries.map((e) => e.label))).sort();

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchQuery.trim() || entry.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || entry.label === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (idx: number) => {
    const actualIdx = entries.findIndex((e) => e === filteredEntries[idx]);
    if (actualIdx === -1) return;
    const updated = [...entries];
    updated.splice(actualIdx, 1);
    setEntries(updated);
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleClearAll = () => {
    if (!confirm('Clear all history? This cannot be undone.')) return;
    setEntries([]);
    localStorage.removeItem(ACTIVITY_KEY);
  };

  // Group entries by date
  const groupedEntries: { label: string; entries: { entry: ActivityEntry; idx: number }[] }[] = [];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  filteredEntries.forEach((entry, idx) => {
    const date = new Date(entry.timestamp);
    let dateLabel: string;
    if (date.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = date.toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }

    const existing = groupedEntries.find((g) => g.label === dateLabel);
    if (existing) {
      existing.entries.push({ entry, idx });
    } else {
      groupedEntries.push({ label: dateLabel, entries: [{ entry, idx }] });
    }
  });

  // Find tool icon for entry
  const getToolForEntry = (label: string) => {
    return allTools.find((t) => t.label === label || label.includes(t.label));
  };

  return (
    <div
      className="h-full overflow-auto"
      style={{
        background: '#060608',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}
    >
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/app')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                color: '#a1a1aa',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5' }}
              >
                History
              </h1>
              <p className="text-xs" style={{ color: '#52525b' }}>
                {entries.length} total entries
              </p>
            </div>
          </div>
          {entries.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Trash2 size={11} />
              Clear All
            </button>
          )}
        </div>

        {/* Search + Filter */}
        {entries.length > 0 && (
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#52525b' }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#f5f5f5',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.3)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.06)')}
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none appearance-none pr-8"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#f5f5f5',
                  fontFamily: 'DM Sans, sans-serif',
                  minWidth: 120,
                }}
              >
                <option value="all">All tools</option>
                {toolTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Filter
                size={10}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#52525b' }}
              />
            </div>
          </div>
        )}

        {/* Entry list */}
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
              style={{ background: 'rgba(212,175,55,0.08)' }}
            >
              <Clock size={24} style={{ color: '#d4af37', opacity: 0.4 }} />
            </div>
            <h2
              className="text-base font-bold mb-2"
              style={{ fontFamily: 'Syne, sans-serif', color: '#f5f5f5' }}
            >
              No history yet
            </h2>
            <p className="text-sm mb-4" style={{ color: '#52525b' }}>
              Your tool usage will appear here as you explore Majorka.
            </p>
            <button
              onClick={() => setLocation('/app/product-discovery')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #d4af37, #b8941f)',
                color: '#060608',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              Start Exploring <ArrowUpRight size={12} />
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: '#52525b' }}>
              No results for "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEntries.map((group) => (
              <div key={group.label}>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2 px-1"
                  style={{ color: '#3f3f46', fontFamily: 'Syne, sans-serif' }}
                >
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.entries.map(({ entry, idx }) => {
                    const tool = getToolForEntry(entry.label);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')
                        }
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(212,175,55,0.08)' }}
                        >
                          {tool ? (
                            createElement(tool.icon, { size: 13, style: { color: '#d4af37' } })
                          ) : (
                            <Clock size={13} style={{ color: '#d4af37' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-medium truncate"
                            style={{ color: '#f5f5f5' }}
                          >
                            {entry.label}
                          </div>
                          <div className="text-xs" style={{ color: '#52525b' }}>
                            {entry.type === 'tool_opened'
                              ? 'Opened tool'
                              : entry.type === 'product_imported'
                                ? 'Imported product'
                                : entry.type === 'output_saved'
                                  ? 'Saved output'
                                  : entry.type}
                          </div>
                        </div>
                        <div className="text-xs flex-shrink-0" style={{ color: '#52525b' }}>
                          {getRelativeTime(entry.timestamp)}
                        </div>
                        {tool && (
                          <button
                            onClick={() => setLocation(tool.path)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded text-xs flex-shrink-0"
                            style={{
                              color: '#d4af37',
                              background: 'rgba(212,175,55,0.08)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Open
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                          style={{
                            color: '#ef4444',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
