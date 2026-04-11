import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function ShareViewButton() {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => toast.success('View link copied to clipboard'),
      () => toast.error('Failed to copy link')
    );
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.5)',
      }}
      aria-label="Share this view"
    >
      <Share2 className="w-3.5 h-3.5" />
      Share view
    </button>
  );
}
