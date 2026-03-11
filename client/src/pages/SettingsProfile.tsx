import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import MajorkaAppShell from "@/components/MajorkaAppShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

export default function SettingsProfile() {
  const { user, loading, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    businessName: "",
    targetNiche: "",
    monthlyRevenue: "",
    country: "",
    experienceLevel: "",
    mainGoal: "",
  });
  const [saving, setSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setHealthLoading(true);
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthStatus) => setHealthStatus(data))
      .catch(() => setHealthStatus(null))
      .finally(() => setHealthLoading(false));
  }, [isAuthenticated]);

  // Load existing profile
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

  const inputClass =
    "w-full rounded-xl px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37]/50 transition-colors";
  const labelClass = "block text-xs font-bold uppercase tracking-wider mb-1.5";

  // Show nothing while auth is resolving or redirecting
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0a0b0d" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm animate-pulse" style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#0a0b0d", fontFamily: "Syne, sans-serif" }}>M</div>
      </div>
    );
  }

  return (
    <MajorkaAppShell>
      <div className="h-full overflow-auto" style={{ background: "#0a0b0d" }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1
            className="text-2xl font-black mb-1"
            style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}
          >
            Profile Settings
          </h1>
          <p className="text-sm mb-8" style={{ color: "rgba(240,237,232,0.45)" }}>
            Your profile helps the AI tailor advice to your specific situation.
          </p>

          <div className="space-y-5">
            {/* Name (read-only from auth) */}
            <div>
              <label className={labelClass} style={{ color: "rgba(212,175,55,0.7)" }}>Name</label>
              <input
                type="text"
                value={user?.name || ""}
                disabled
                className={inputClass + " opacity-50 cursor-not-allowed"}
              />
            </div>

            {/* Business Name */}
            <div>
              <label className={labelClass} style={{ color: "rgba(212,175,55,0.7)" }}>Business Name</label>
              <input
                type="text"
                placeholder="My Shopify Store"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Target Niche */}
            <div>
              <label className={labelClass} style={{ color: "rgba(212,175,55,0.7)" }}>Target Niche</label>
              <input
                type="text"
                placeholder="e.g. Pet accessories, Home fitness"
                value={form.targetNiche}
                onChange={(e) => setForm({ ...form, targetNiche: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Monthly Revenue */}
            <div>
              <label className={labelClass} style={{ color: "rgba(212,175,55,0.7)" }}>Monthly Revenue</label>
              <select
                value={form.monthlyRevenue}
                onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })}
                className={inputClass}
              >
                <option value="">Select range</option>
                {REVENUE_RANGES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className={labelClass} style={{ color: "rgba(212,175,55,0.7)" }}>Country</label>
              <input
                type="text"
                placeholder="Australia"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className={labelClass} style={{ color: "rgba(212,175,55,0.7)" }}>Experience Level</label>
              <div className="flex gap-2 flex-wrap">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setForm({ ...form, experienceLevel: level })}
                    className="px-4 py-2 rounded-full text-xs font-semibold border transition-all capitalize"
                    style={{
                      background: form.experienceLevel === level ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)",
                      borderColor: form.experienceLevel === level ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)",
                      color: form.experienceLevel === level ? "#d4af37" : "rgba(240,237,232,0.6)",
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Goal */}
            <div>
              <label className={labelClass} style={{ color: "rgba(212,175,55,0.7)" }}>Main Goal</label>
              <div className="flex gap-2 flex-wrap">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setForm({ ...form, mainGoal: goal })}
                    className="px-4 py-2 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      background: form.mainGoal === goal ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)",
                      borderColor: form.mainGoal === goal ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)",
                      color: form.mainGoal === goal ? "#d4af37" : "rgba(240,237,232,0.6)",
                    }}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Integration Status */}
          {user && (
            <div className="mt-8">
              <h2
                className="text-base font-black mb-1"
                style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}
              >
                Integration Status
              </h2>
              <p className="text-xs mb-4" style={{ color: "rgba(240,237,232,0.45)" }}>
                Live status of connected services.
              </p>
              <div className="space-y-2">
                {healthLoading || !healthStatus
                  ? (Object.keys(INTEGRATION_LABELS) as (keyof HealthStatus)[]).map((key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <div className="h-3 w-32 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                        <div className="h-5 w-5 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                      </div>
                    ))
                  : (Object.keys(INTEGRATION_LABELS) as (keyof HealthStatus)[]).map((key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <span className="text-sm" style={{ color: "rgba(240,237,232,0.8)", fontFamily: "DM Sans, sans-serif" }}>
                          {INTEGRATION_LABELS[key]}
                        </span>
                        <span className="text-base leading-none">
                          {healthStatus[key] ? "✅" : "❌"}
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-8 w-full rounded-full py-3 font-bold text-sm transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #d4af37, #f0c040)",
              color: "#0a0b0d",
              fontFamily: "Syne, sans-serif",
            }}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </MajorkaAppShell>
  );
}
