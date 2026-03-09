/**
 * FormTooltip — reusable "?" icon tooltip for form input labels.
 */
import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface FormTooltipProps {
  text: string;
}

export default function FormTooltip({ text }: FormTooltipProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show]);

  return (
    <span className="relative inline-flex ml-1" ref={ref}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="inline-flex items-center justify-center"
        style={{ background: "none", border: "none", cursor: "help", padding: 0 }}
      >
        <HelpCircle size={11} style={{ color: "rgba(240,237,232,0.25)" }} />
      </button>
      {show && (
        <div
          className="absolute left-full ml-2 z-50 px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-normal"
          style={{
            width: 200,
            background: "#1a1c20",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            color: "rgba(240,237,232,0.75)",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 400,
            top: -4,
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
