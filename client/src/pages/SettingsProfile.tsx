import React, { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { User, Building2, Target, DollarSign, Globe, TrendingUp, Sparkles, Save } from "lucide-react";

const FIELD_CONFIG = [
  { key: "businessName", label: "Business Name", icon: Building2, placeholder: "e.g. Luma Skincare" },
  { key: "targetNiche", label: "Target Niche", icon: Target, placeholder: "e.g. Organic beauty, Pet accessories" },
  { key: "monthlyRevenue", label: "Monthly Revenue", icon: DollarSign, placeholder: "e.g. $0, $1k-5k, $10k+" },
  { key: "country", label: "Country", icon: Globe, placeholder: "e.g. Australia, United States" },
] as const;

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const GOALS = [
  "Find my first winning product",
  "Launch my first store",
  "Scale to $10k/month",
  "Optimise an existing store",
  "Build a brand",
] as const;

export default function SettingsProfile() {
  const profileQuery = trpc.profile.get.useQuery();
  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => toast.success("Profile saved!"),
    onError: () => toast.error("Failed to save profile"),
  });

  const [form, setForm] = useState({
    businessName: "",
    targetNiche: "",
    monthlyRevenue: "",
    country: "",
    experienceLevel: "",
    mainGoal: "",
    budget: "",
  });

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        businessName: profileQuery.data.businessName ?? "",
        targetNiche: profileQuery.data.targetNiche ?? "",
        monthlyRevenue: profileQuery.data.monthlyRevenue ?? "",
        country: profileQuery.data.country ?? "",
        experienceLevel: profileQuery.data.experienceLevel ?? "",
        mainGoal: profileQuery.data.mainGoal ?? "",
        budget: profileQuery.data.budget ?? "",
      });
    }
  }, [profileQuery.data]);

  const handleSave = useCallback(() => {
    updateMutation.mutate(form);
  }, [form, updateMutation]);

  return (
    <div className="h-full overflow-auto" style={{ background: "#0a0b0d" }}>
      <div className="max-w-2xl mx-auto px-6 py-8 page-enter">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={12} style={{ color: "#d4af37" }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
              Profile Settings
            </span>
          </div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
            Your Profile
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(240,237,232,0.45)" }}>
            This information helps Majorka's AI give you personalised, relevant advice.
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {FIELD_CONFIG.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-xs font-bold mb-1.5" style={{ fontFamily: "Syne, sans-serif", color: "rgba(240,237,232,0.6)" }}>
                <Icon size={12} />
                {label}
              </label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f0ede8",
                  fontFamily: "DM Sans, sans-serif",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
          ))}

          {/* Experience Level */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold mb-1.5" style={{ fontFamily: "Syne, sans-serif", color: "rgba(240,237,232,0.6)" }}>
              <TrendingUp size={12} />
              Experience Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setForm((f) => ({ ...f, experienceLevel: level }))}
                  className="rounded-xl px-3 py-2.5 text-xs font-bold capitalize transition-all"
                  style={{
                    fontFamily: "Syne, sans-serif",
                    background: form.experienceLevel === level ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${form.experienceLevel === level ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}`,
                    color: form.experienceLevel === level ? "#d4af37" : "rgba(240,237,232,0.4)",
                  }}
                >
                  {level === "beginner" ? "🌱" : level === "intermediate" ? "🌿" : "🌳"} {level}
                </button>
              ))}
            </div>
          </div>

          {/* Main Goal */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold mb-1.5" style={{ fontFamily: "Syne, sans-serif", color: "rgba(240,237,232,0.6)" }}>
              <User size={12} />
              Main Goal
            </label>
            <div className="space-y-1.5">
              {GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => setForm((f) => ({ ...f, mainGoal: goal }))}
                  className="w-full text-left rounded-xl px-4 py-2.5 text-xs transition-all"
                  style={{
                    background: form.mainGoal === goal ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${form.mainGoal === goal ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)"}`,
                    color: form.mainGoal === goal ? "#d4af37" : "rgba(240,237,232,0.5)",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all btn-gold"
        >
          <Save size={14} />
          {updateMutation.isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
