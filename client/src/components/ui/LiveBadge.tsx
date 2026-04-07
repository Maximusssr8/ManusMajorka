export function LiveBadge({ label = 'Live data' }: { label?: string }) {
  return (
    <span className="mkr-live-badge">
      <span className="mkr-live-dot-wrap" aria-hidden="true">
        <span className="mkr-live-dot-core" />
        <span className="mkr-live-dot-ring" />
        <span className="mkr-live-dot-ring" style={{ animationDelay: '0.5s' }} />
      </span>
      {label}
    </span>
  );
}
