interface TickerItem {
  label: string;
  orders?: number;
  score?: number;
  price?: number;
  hot?: boolean;
}

export function LiveTicker({ items }: { items: TickerItem[] }) {
  const formatted = items.map(item =>
    `${item.hot ? '🔥' : '📈'} ${item.label}${item.orders ? ` · ${(item.orders/1000).toFixed(0)}k orders` : ''}${item.score ? ` · Score ${item.score}` : ''}${item.price ? ` · $${item.price} AUD` : ''}`
  );
  // Duplicate for seamless loop
  const doubled = [...formatted, ...formatted];

  return (
    <div className="live-ticker-wrapper" aria-label="Live product data" role="marquee">
      <div className="live-ticker-track">
        {doubled.map((item, i) => (
          <span key={i} className="live-ticker-item">{item}</span>
        ))}
      </div>
    </div>
  );
}
