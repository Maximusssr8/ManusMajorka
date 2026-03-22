import { MARKET_CODES, MARKETS } from '@shared/markets';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMarket } from '@/contexts/MarketContext';
import { trackMarketChanged } from '@/lib/analytics';

export default function MarketSelector() {
  const { market, setMarket, marketConfig } = useMarket();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-all"
        style={{
          borderRadius: 8,
          background: open ? 'rgba(255,255,255,0.05)' : 'transparent',
          border: '1px solid rgba(255,255,255,0.06)',
          color: '#a1a1aa',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onMouseEnter={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.2)';
        }}
        onMouseLeave={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
        }}
      >
        <span className="text-sm">{marketConfig.flag}</span>
        <span className="flex-1 text-left truncate">{marketConfig.name}</span>
        <ChevronDown
          size={12}
          style={{
            opacity: 0.5,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 w-full overflow-hidden"
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
        >
          {MARKET_CODES.map((code) => {
            const m = MARKETS[code];
            const active = code === market;
            return (
              <button
                key={code}
                onClick={() => {
                  trackMarketChanged(market, code);
                  setMarket(code);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-all"
                style={{
                  background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: active ? '#f5f5f5' : '#a1a1aa',
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span className="text-sm">{m.flag}</span>
                <span className="flex-1 text-left">{m.name}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366F1' }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
