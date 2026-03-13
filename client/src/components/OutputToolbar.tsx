/**
 * OutputToolbar — shared toolbar for all tool output areas.
 * Provides: Copy section, Copy All, Export PDF, Save to localStorage.
 */

import { Check, Copy, Download, Save } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface OutputToolbarProps {
  /** The full text/data of the entire output area */
  allContent: string;
  /** The tool name for localStorage key */
  toolName: string;
  /** Optional className */
  className?: string;
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
      style={{
        background: copied ? 'rgba(45,202,114,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${copied ? 'rgba(45,202,114,0.35)' : 'rgba(255,255,255,0.08)'}`,
        color: copied ? '#2dca72' : 'rgba(240,237,232,0.5)',
        cursor: 'pointer',
        fontFamily: 'Syne, sans-serif',
        fontWeight: 600,
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied ✓' : label}
    </button>
  );
}

export default function OutputToolbar({
  allContent,
  toolName,
  className = '',
}: OutputToolbarProps) {
  const handleExportTxt = useCallback(() => {
    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `majorka-${toolName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as .txt!');
  }, [allContent, toolName]);

  const handleSave = useCallback(() => {
    const key = `majorka_saved_${toolName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
    try {
      localStorage.setItem(key, allContent);
      toast.success('Output saved!', { description: `Saved as ${key}` });
    } catch {
      toast.error('Could not save — storage may be full.');
    }
  }, [allContent, toolName]);

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      <CopyButton text={allContent} label="Copy All" />
      <button
        onClick={handleExportTxt}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(240,237,232,0.5)',
          cursor: 'pointer',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
        }}
      >
        <Download size={11} /> Export
      </button>
      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(240,237,232,0.5)',
          cursor: 'pointer',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
        }}
      >
        <Save size={11} /> Save Output
      </button>
    </div>
  );
}

export { CopyButton };
