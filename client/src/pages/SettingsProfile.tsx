import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import { useProductTour } from "@/components/ProductTour";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useDocumentTitle } from "@/_core/hooks/useDocumentTitle";
import {
  User, Bell, CreditCard, Shield, Database,
  ArrowLeft, Loader2, Check, Download, Trash2,
  ExternalLink, ChevronRight, Key, Mail,
} from "lucide-react";

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced", "expert"];
const GOALS = ["Launch first store", "Scale existing store", "Optimise conversions", "Expand to new markets", "Automate operations"];
const REVENUE_RANGES = ["Pre-revenue", "$0-1k/mo", "$1k-5k/mo", "$5k-20k/mo", "$20k-100k/mo", "$100k+/mo"];

interface HealthStatus {
  anthropic: boolean;
  tavily: boolean;
  firecrawl: boolean;
  supabase: boolean;
  stripe: boolean;
  database: boolean;
}

const INTEGRATION_LABELS: Record<keyof HealthStatus, string> = {
  anthropic: "Anthropic AI",
  tavily: "Tavily Search",
  firecrawl: "Firecrawl Scraper",
  supabase: "Supabase Auth",
  stripe: "Stripe Payments",
  database: "Database",
};

type SettingsTab = "profile" | "notifications" | "billing" | "integrations" | "data";

export default function SettingsProfile() {
  useDocumentTitle("Settings");
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { startTour, resetTour } = useProductTour();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [form, setForm] = useState({
    businessName: "", targetNiche: "", monthlyRevenue: "",
    country: "", experienceLevel: "", mainGoal: "",
  });
  const [saving, setSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState({ weeklyReport: true, productAlerts: true, newFeatures: true, marketing: false });

  useEffect(() => {
    if (!isAuthenticated) return;
    setHealthLoading(true);
    fetch("/api/health")
      .then(res => res.json())
      .then((data: HealthStatus) => setHealthStatus(data))
      .catch(() => setHealthStatus(null))
      .finally(() => setHealthLoading(false));
  }, [isAuthenticated]);

  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const updateMutation = trpc.profile.update.useMutation();

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        businessName: profileQuery.data.businessName || "",
        targetNiche: profileQuery.data.targetNiche || "",
        monthlyRevenue: profileQuery.data.monthlyRevenue || "",
        country: profileQuery.data.country || "",
        experienceLevel: profileQuery.data.experienceLevel || "",
        mainGoal: profileQuery.data.mainGoal || "",
      });
    }
  }, [profileQuery.data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync(form);
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    const data = {
      profile: form,
      activityLog: JSON.parse(localStorage.getItem("majorka_activity_log") || "[]"),
      recentTools: JSON.parse(localStorage.getItem("majorka_recent_tools") || "[]"),
      savedProducts: JSON.parse(localStorage.getItem("majorka_saved_products") || "[]"),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `majorka-data-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported!");
  };

  const handleDeleteAccount = () => {
    if (!confirm("Are you sure? This will permanently delete your account and all data. This action cannot be undone.")) return;
    toast.info("To delete your account, please contact support@majorka.com");
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0a0b0d" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm animate-pulse"
          style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}>M</div>
      </div>
    );
  }

  const inputClass = "w-full rounded-lg px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37]/50 transition-colors";
  const sectionCard = "rounded-xl p-5" as const;
  const sectionCardStyle = { background: "#0c0c10", border: "1px solid rgba(255,255,255,0.06)" };

  const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "integrations", label: "Integrations", icon: Shield },
    { id: "data", label: "Data & Privacy", icon: Database },
  ];

  return (
    <MajorkaAppShell>
      <div className="h-full overflow-auto" style={{ background: "#060608" }}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setLocation("/app")}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", color: "#a1a1aa" }}>
              <ArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>Settings</h1>
              <p className="text-xs" style={{ color: "#52525b" }}>Manage your account and preferences</p>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                  style={{
                    background: active ? "rgba(212,175,55,0.08)" : "transparent",
                    color: active ? "#d4af37" : "#71717a",
                    border: active ? "1px solid rgba(212,175,55,0.2)" : "1px solid transparent",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#a1a1aa"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#71717a"; }}>
                  <Icon size={12} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Profile Tab ─────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className={sectionCard} style={sectionCardStyle}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Account</div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(212,175,55,0.7)" }}>Name</label>
                    <input type="text" value={user?.name || ""} disabled className={inputClass + " opacity-50 cursor-not-allowed"} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(212,175,55,0.7)" }}>Email</label>
                    <input type="text" value={user?.email || ""} disabled className={inputClass + " opacity-50 cursor-not-allowed"} />
                  </div>
                </div>
              </div>

              <div className={sectionCard} style={sectionCardStyle}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Business Profile</div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(212,175,55,0.7)" }}>Business Name</label>
                    <input type="text" placeholder="My Shopify Store" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(212,175,55,0.7)" }}>Target Niche</label>
                    <input type="text" placeholder="e.g. Pet accessories, Home fitness" value={form.targetNiche} onChange={e => setForm({ ...form, targetNiche: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(212,175,55,0.7)" }}>Monthly Revenue</label>
                    <select value={form.monthlyRevenue} onChange={e => setForm({ ...form, monthlyRevenue: e.target.value })} className={inputClass}>
                      <option value="">Select range</option>
                      {REVENUE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(212,175,55,0.7)" }}>Country</label>
                    <input type="text" placeholder="Australia" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className={sectionCard} style={sectionCardStyle}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Preferences</div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(212,175,55,0.7)" }}>Experience Level</label>
                    <div className="flex gap-2 flex-wrap">
                      {EXPERIENCE_LEVELS.map(level => (
                        <button key={level} onClick={() => setForm({ ...form, experienceLevel: level })}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all capitalize"
                          style={{
                            background: form.experienceLevel === level ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)",
                            borderColor: form.experienceLevel === level ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)",
                            color: form.experienceLevel === level ? "#d4af37" : "rgba(240,237,232,0.6)", cursor: "pointer",
                          }}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(212,175,55,0.7)" }}>Main Goal</label>
                    <div className="flex gap-2 flex-wrap">
                      {GOALS.map(goal => (
                        <button key={goal} onClick={() => setForm({ ...form, mainGoal: goal })}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all"
                          style={{
                            background: form.mainGoal === goal ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)",
                            borderColor: form.mainGoal === goal ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)",
                            color: form.mainGoal === goal ? "#d4af37" : "rgba(240,237,232,0.6)", cursor: "pointer",
                          }}>
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={sectionCard} style={sectionCardStyle}>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Onboarding</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#f5f5f5" }}>Product Tour</div>
                    <div className="text-xs" style={{ color: "#52525b" }}>Replay the guided tour of Majorka's features</div>
                  </div>
                  <button
                    onClick={() => { resetTour(); setLocation("/app"); setTimeout(() => startTour(), 500); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", cursor: "pointer" }}>
                    Restart Tour
                  </button>
                </div>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full rounded-lg py-3 font-bold text-sm transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif", border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}

          {/* ── Notifications Tab ───────────────────────────────────────── */}
          {activeTab === "notifications" && (
            <div className={sectionCard} style={sectionCardStyle}>
              <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Email Preferences</div>
              <div className="space-y-3">
                {[
                  { key: "weeklyReport" as const, label: "Weekly Performance Report", desc: "Summary of your tool usage and insights" },
                  { key: "productAlerts" as const, label: "Product Alerts", desc: "Notifications about your tracked products" },
                  { key: "newFeatures" as const, label: "New Features", desc: "Be the first to know about new tools" },
                  { key: "marketing" as const, label: "Marketing Tips", desc: "Ecommerce tips and AU market insights" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#f5f5f5" }}>{label}</div>
                      <div className="text-xs" style={{ color: "#52525b" }}>{desc}</div>
                    </div>
                    <button
                      onClick={() => setEmailNotifs({ ...emailNotifs, [key]: !emailNotifs[key] })}
                      className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
                      style={{
                        background: emailNotifs[key] ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.1)",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                        style={{
                          background: emailNotifs[key] ? "#d4af37" : "#52525b",
                          left: emailNotifs[key] ? 22 : 2,
                        }} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full rounded-lg py-3 font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif", border: "none", cursor: "pointer" }}
                onClick={() => toast.success("Notification preferences saved")}>
                Save Preferences
              </button>
            </div>
          )}

          {/* ── Billing Tab ─────────────────────────────────────────────── */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              <div className={sectionCard} style={sectionCardStyle}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Current Plan</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}>Majorka Pro</div>
                    <div className="text-sm" style={{ color: "#a1a1aa" }}>$99/month AUD</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "rgba(45,202,114,0.1)", border: "1px solid rgba(45,202,114,0.25)", color: "#2dca72" }}>
                    Active
                  </span>
                </div>
              </div>
              <button onClick={() => setLocation("/account")}
                className="w-full flex items-center justify-between rounded-xl p-4 transition-all"
                style={{ background: "#0c0c10", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", color: "#f5f5f5" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
                <div className="flex items-center gap-3">
                  <CreditCard size={16} style={{ color: "#d4af37" }} />
                  <div className="text-left">
                    <div className="text-sm font-medium">Manage Subscription</div>
                    <div className="text-xs" style={{ color: "#52525b" }}>Update billing, change plan, or cancel</div>
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: "#52525b" }} />
              </button>
            </div>
          )}

          {/* ── Integrations Tab ────────────────────────────────────────── */}
          {activeTab === "integrations" && (
            <div className={sectionCard} style={sectionCardStyle}>
              <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Service Status</div>
              <div className="space-y-2">
                {healthLoading || !healthStatus
                  ? (Object.keys(INTEGRATION_LABELS) as (keyof HealthStatus)[]).map(key => (
                      <div key={key} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="h-3 w-32 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                        <div className="h-5 w-5 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                      </div>
                    ))
                  : (Object.keys(INTEGRATION_LABELS) as (keyof HealthStatus)[]).map(key => (
                      <div key={key} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span className="text-sm" style={{ color: "rgba(240,237,232,0.8)" }}>{INTEGRATION_LABELS[key]}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: healthStatus[key] ? "#10b981" : "#ef4444" }} />
                          <span className="text-xs" style={{ color: healthStatus[key] ? "#10b981" : "#ef4444" }}>
                            {healthStatus[key] ? "Connected" : "Disconnected"}
                          </span>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}

          {/* ── Data & Privacy Tab ──────────────────────────────────────── */}
          {activeTab === "data" && (
            <div className="space-y-4">
              <div className={sectionCard} style={sectionCardStyle}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#52525b", fontFamily: "Syne, sans-serif" }}>Your Data</div>
                <p className="text-sm mb-4" style={{ color: "#a1a1aa" }}>
                  Export all your data including profile, activity history, and saved products.
                </p>
                <button onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", cursor: "pointer" }}>
                  <Download size={14} /> Export My Data
                </button>
              </div>

              <div className={sectionCard} style={{ ...sectionCardStyle, borderColor: "rgba(239,68,68,0.15)" }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#ef4444", fontFamily: "Syne, sans-serif" }}>Danger Zone</div>
                <p className="text-sm mb-4" style={{ color: "#a1a1aa" }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer" }}>
                  <Trash2 size={14} /> Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MajorkaAppShell>
  );
}
