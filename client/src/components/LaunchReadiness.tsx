/**
 * Launch Readiness Checklist Widget
 * Tracks progress across Majorka tools toward launch readiness.
 * Uses localStorage + user profile to track completion.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Rocket, CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  toolPath: string;
  toolLabel: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "brand-dna", label: "Brand DNA created", toolPath: "/app/brand-dna", toolLabel: "Brand DNA" },
  { id: "product-discovery", label: "Product researched", toolPath: "/app/product-discovery", toolLabel: "Product Discovery" },
  { id: "winning-products", label: "Winning product identified", toolPath: "/app/winning-products", toolLabel: "Winning Products" },
  { id: "profit-calculator", label: "Profit margins validated", toolPath: "/app/profit-calculator", toolLabel: "Profit Calculator" },
  { id: "website-generator", label: "Website template downloaded", toolPath: "/app/website-generator", toolLabel: "Website Generator" },
  { id: "meta-ads", label: "First ad copy written", toolPath: "/app/meta-ads", toolLabel: "Meta Ads Pack" },
  { id: "supplier-finder", label: "Supplier contacted", toolPath: "/app/supplier-finder", toolLabel: "Supplier Finder" },
  { id: "store-spy", label: "Competitor analysed", toolPath: "/app/store-spy", toolLabel: "Store Spy" },
];

const STORAGE_KEY = "majorka_launch_checklist";

function getCheckedItems(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setCheckedItems(items: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function LaunchReadiness() {
  const [, setLocation] = useLocation();
  const [checked, setChecked] = useState<string[]>(getCheckedItems);

  useEffect(() => {
    setCheckedItems(checked);
  }, [checked]);

  const toggle = (id: string) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const completedCount = checked.length;
  const totalCount = CHECKLIST_ITEMS.length;
  const percent = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  return (
    <div
      className="rounded-xl p-5 mb-6"
      style={{
        background: allDone
          ? "rgba(16,185,129,0.04)"
          : "rgba(212,175,55,0.03)",
        border: `1px solid ${allDone ? "rgba(16,185,129,0.2)" : "rgba(212,175,55,0.12)"}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket
            size={16}
            style={{ color: allDone ? "#10b981" : "#d4af37" }}
          />
          <span
            className="text-sm font-bold"
            style={{
              fontFamily: "Syne, sans-serif",
              color: "#f5f5f5",
            }}
          >
            Launch Readiness
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{
              background: allDone
                ? "rgba(16,185,129,0.15)"
                : "rgba(212,175,55,0.12)",
              color: allDone ? "#10b981" : "#d4af37",
              fontSize: 10,
            }}
          >
            {percent}%
          </span>
        </div>
        <span className="text-xs" style={{ color: "#52525b" }}>
          {completedCount}/{totalCount} complete
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full mb-4 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: allDone
              ? "linear-gradient(90deg, #10b981, #059669)"
              : "linear-gradient(90deg, #d4af37, #f0c040)",
          }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-1">
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = checked.includes(item.id);
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 py-1.5 px-2 rounded-lg transition-all"
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <button
                onClick={() => toggle(item.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                ) : (
                  <Circle size={16} style={{ color: "#3f3f46" }} />
                )}
              </button>
              <span
                className="flex-1 text-xs"
                style={{
                  color: isDone ? "#52525b" : "#a1a1aa",
                  textDecoration: isDone ? "line-through" : "none",
                }}
              >
                {item.label}
              </span>
              {!isDone && (
                <button
                  onClick={() => setLocation(item.toolPath)}
                  className="flex items-center gap-1 text-xs font-medium transition-all"
                  style={{
                    color: "#d4af37",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    opacity: 0.7,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                >
                  {item.toolLabel} <ArrowRight size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* All done message */}
      {allDone && (
        <div
          className="mt-4 p-3 rounded-lg text-center"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <span
            className="text-sm font-bold"
            style={{ fontFamily: "Syne, sans-serif", color: "#10b981" }}
          >
            You're ready to launch!
          </span>
          <p className="text-xs mt-1" style={{ color: "#a1a1aa" }}>
            All checklist items complete. Time to go live.
          </p>
        </div>
      )}
    </div>
  );
}
