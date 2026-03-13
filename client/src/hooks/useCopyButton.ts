/**
 * useCopyButton — provides "Copied!" feedback state for copy buttons.
 * Returns { copied, handleCopy } — copied flips to true for 2 seconds after copy.
 */
import { useState, useCallback, useRef } from "react";

export function useCopyButton() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  return { copied, handleCopy };
}
