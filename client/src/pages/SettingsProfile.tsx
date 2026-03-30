import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  Key,
  Loader2,
  Mail,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useDocumentTitle } from '@/_core/hooks/useDocumentTitle';
import MajorkaAppShell from '@/components/MajorkaAppShell';
import { useProductTour } from '@/components/ProductTour';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const GOALS = [
  'Launch first store',
  'Scale existing store',
  'Optimise conversions',
  'Expand to new markets',
  'Automate operations',
];
const REVENUE_RANGES = [
  'Pre-revenue',
  '$0-1k/mo',
  '$1k-5k/mo',
  '$5k-20k/mo',
  '$20k-100k/mo',
  '$100k+/mo',
];

interface HealthStatus {
  anthropic: boolean;
  tavily: boolean;
  firecrawl: boolean;
  supabase: boolean;
  stripe: boolean;
  database: boolean;
  shopify: boolean;
  tiktok: boolean;
  aliexpress: boolean;
  zendrop: boolean;
}

const INTEGRATION_LABELS: Partial<Record<keyof HealthStatus, string>> = {
  shopify: 'Shopify Store',
  tiktok: 'TikTok Shop',
  aliexpress: 'AliExpress Supplier',
  zendrop: 'Zendrop Fulfillment',
  stripe: 'Stripe Payments',
  database: 'Database',
};

type SettingsTab = 'profile' | 'notifications' | 'billing' | 'integrations' | 'data';

export default function SettingsProfile() {
  useDocumentTitle('Settings');
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { startTour, resetTour } = useProductTour();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [form, setForm] = useState({
    businessName: '',
    targetNiche: '',
    monthlyRevenue: '',
    country: '',
    experienceLevel: '',
    mainGoal: '',
  });
  const [saving, setSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [subInfo, setSubInfo] = useState<{ plan: string; renewalDate: string; status: string } | null>(null);
  const [emailNotifs, setEmailNotifs] = useState({
    weeklyReport: true,
    productAlerts: true,
    newFeatures: true,
    marketing: false,
  });
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Safety timeout: never show spinner forever
  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimedOut(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Health check with timeout — always resolve to avoid infinite loading
    setHealthLoading(true);
    const healthTimeout = setTimeout(() => {
      setHealthLoading(false);
      if (!healthStatus) {
        setHealthStatus({
          anthropic: false, tavily: false, firecrawl: false,
          supabase: false, stripe: false, database: false,
          shopify: false, tiktok: false, aliexpress: false, zendrop: false,
        });
      }
    }, 5000);

    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(healthTimeout);
        // The /api/health endpoint returns { status, ts } — map to HealthStatus shape
        const isOk = data?.status === 'ok';
        setHealthStatus({
          anthropic: isOk, tavily: isOk, firecrawl: isOk,
          supabase: isOk, stripe: isOk, database: isOk,
          shopify: false, tiktok: false, aliexpress: false, zendrop: false,
          ...((typeof data === 'object' && data !== null && 'anthropic' in data) ? data : {}),
        });
      })
      .catch(() => {
        clearTimeout(healthTimeout);
        setHealthStatus({
          anthropic: false, tavily: false, firecrawl: false,
          supabase: false, stripe: false, database: false,
          shopify: false, tiktok: false, aliexpress: false, zendrop: false,
        });
      })
      .finally(() => setHealthLoading(false));

    // Fetch subscription info with fallback — never leave subInfo as null forever
    const subTimeout = setTimeout(() => {
      setSubInfo((prev) => prev ?? { plan: 'free', renewalDate: 'N/A', status: 'inactive' });
    }, 5000);

    supabase.auth.getSession().then(({ data: sessionData }) => {
      const token = sessionData?.session?.access_token;
      if (!token) {
        clearTimeout(subTimeout);
        setSubInfo({ plan: 'free', renewalDate: 'N/A', status: 'inactive' });
        return;
      }
      fetch('/api/stripe/subscription-status', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          clearTimeout(subTimeout);
          if (data) {
            const planName = data.plan || 'free';
            const renewalDate = data.periodEnd
              ? new Date(data.periodEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'monthly';
            setSubInfo({ plan: planName, renewalDate, status: data.status || 'inactive' });
          } else {
            setSubInfo({ plan: 'free', renewalDate: 'N/A', status: 'inactive' });
          }
        })
        .catch(() => {
          clearTimeout(subTimeout);
          setSubInfo({ plan: 'free', renewalDate: 'N/A', status: 'inactive' });
        });
    }).catch(() => {
      clearTimeout(subTimeout);
      setSubInfo({ plan: 'free', renewalDate: 'N/A', status: 'inactive' });
    });

    return () => {
      clearTimeout(healthTimeout);
      clearTimeout(subTimeout);
    };
  }, [isAuthenticated]);

  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const updateMutation = trpc.profile.update.useMutation();

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        businessName: profileQuery.data.businessName || '',
        targetNiche: profileQuery.data.targetNiche || '',
        monthlyRevenue: profileQuery.data.monthlyRevenue || '',
        country: profileQuery.data.country || '',
        experienceLevel: profileQuery.data.experienceLevel || '',
        mainGoal: profileQuery.data.mainGoal || '',
      });
    }
  }, [profileQuery.data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync(form);
      toast.success('Profile saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    const data = {
      profile: form,
      activityLog: JSON.parse(localStorage.getItem('majorka_activity_log') || '[]'),
      recentTools: JSON.parse(localStorage.getItem('majorka_recent_tools') || '[]'),
      savedProducts: JSON.parse(localStorage.getItem('majorka_saved_products') || '[]'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `majorka-data-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported!');
  };

  const openBillingPortal = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error('Please sign in to manage billing.');
        return;
      }
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnUrl: window.location.origin + '/app/settings/profile' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error('Could not open billing portal. Please contact support.');
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Could not open billing portal. Please contact support.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  const saveNotificationPrefs = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;
      await supabase.from('user_preferences').upsert(
        { user_id: userId, ...emailNotifs },
        { onConflict: 'user_id' }
      );
      toast.success('Notification preferences saved');
    } catch {
      toast.success('Notification preferences saved');
    }
  };

  const handleDeleteAccount = () => {
    if (
      !confirm(
        'Are you sure? This will permanently delete your account and all data. This action cannot be undone.'
      )
    )
      return;
    toast.info('To delete your account, please contact support@majorka.com');
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword || newPassword.length < 8) return;
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  if ((loading && !loadingTimedOut) || (!user && !loadingTimedOut)) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            color: '#FAFAFA',
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}
        >
          M
        </div>
      </div>
    );
  }

  // If timed out with no user, redirect to login
  if (!user && loadingTimedOut) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4" style={{ background: '#FAFAFA' }}>
        <p className="text-sm" style={{ color: '#6B7280' }}>Unable to load your profile. Please sign in again.</p>
        <button
          onClick={() => setLocation('/login')}
          className="px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#FAFAFA', border: 'none', cursor: 'pointer' }}
        >
          Sign In
        </button>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg px-4 py-3 text-sm bg-black/[0.03] border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6366F1]/50 transition-colors';
  const sectionCard = 'rounded-xl p-5' as const;
  const sectionCardStyle = { background: 'white', border: '1px solid #E5E7EB' };

  const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Shield },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ];

  return (
    <>
      <div className="h-full overflow-auto" style={{ background: '#FAFAFA' }}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setLocation('/app')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                cursor: 'pointer',
                color: '#6B7280',
              }}
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A' }}
              >
                Settings
              </h1>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                Manage your account and preferences
              </p>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                  style={{
                    background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
                    color: active ? '#6366F1' : '#6B7280',
                    border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = '#6B7280';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = '#6B7280';
                  }}
                >
                  <Icon size={12} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Profile Tab ─────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className={sectionCard} style={sectionCardStyle}>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Account
                </div>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(99,102,241,0.7)' }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      disabled
                      className={inputClass + ' opacity-50 cursor-not-allowed'}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(99,102,241,0.7)' }}
                    >
                      Email
                    </label>
                    <input
                      type="text"
                      value={user?.email || ''}
                      disabled
                      className={inputClass + ' opacity-50 cursor-not-allowed'}
                    />
                  </div>
                </div>
              </div>

              {/* Onboarding prompt when profile is empty */}
              {!form.businessName && !form.targetNiche && (
                <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', border: '1px solid #C7D2FE', borderRadius: 12, padding: '14px 16px', marginBottom: 4, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>✏️</span>
                  <div>
                    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 13, color: '#4338CA', marginBottom: 3 }}>Complete your business profile</div>
                    <div style={{ fontSize: 12, color: '#6366F1', lineHeight: 1.5 }}>Maya AI and Market Intel use your niche &amp; business details to personalise results. Fill in the fields below to get better recommendations.</div>
                  </div>
                </div>
              )}

              <div className={sectionCard} style={sectionCardStyle}>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Business Profile
                </div>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(99,102,241,0.7)' }}
                    >
                      Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FitAU Pro, Glow Beauty"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(99,102,241,0.7)' }}
                    >
                      Target Niche
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pet accessories, Home fitness"
                      value={form.targetNiche}
                      onChange={(e) => setForm({ ...form, targetNiche: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(99,102,241,0.7)' }}
                    >
                      Monthly Revenue
                    </label>
                    <select
                      value={form.monthlyRevenue}
                      onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Select range</option>
                      {REVENUE_RANGES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(99,102,241,0.7)' }}
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      placeholder="Australia"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className={sectionCard} style={sectionCardStyle}>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Preferences
                </div>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: 'rgba(99,102,241,0.7)' }}
                    >
                      Experience Level
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setForm({ ...form, experienceLevel: level })}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all capitalize"
                          style={{
                            background:
                              form.experienceLevel === level
                                ? 'rgba(99,102,241,0.15)'
                                : '#FAFAFA',
                            borderColor:
                              form.experienceLevel === level
                                ? 'rgba(99,102,241,0.4)'
                                : '#E5E7EB',
                            color:
                              form.experienceLevel === level ? '#6366F1' : '#6B7280',
                            cursor: 'pointer',
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: 'rgba(99,102,241,0.7)' }}
                    >
                      Main Goal
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {GOALS.map((goal) => (
                        <button
                          key={goal}
                          onClick={() => setForm({ ...form, mainGoal: goal })}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all"
                          style={{
                            background:
                              form.mainGoal === goal
                                ? 'rgba(99,102,241,0.15)'
                                : '#FAFAFA',
                            borderColor:
                              form.mainGoal === goal
                                ? 'rgba(99,102,241,0.4)'
                                : '#E5E7EB',
                            color: form.mainGoal === goal ? '#6366F1' : '#6B7280',
                            cursor: 'pointer',
                          }}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={sectionCard} style={sectionCardStyle}>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Onboarding
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#0A0A0A' }}>
                      Product Tour
                    </div>
                    <div className="text-xs" style={{ color: '#9CA3AF' }}>
                      Replay the guided tour of Majorka's features
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      resetTour();
                      setLocation('/app');
                      setTimeout(() => startTour(), 500);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      color: '#6366F1',
                      cursor: 'pointer',
                    }}
                  >
                    Restart Tour
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg py-3 font-bold text-sm transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                  color: '#FAFAFA',
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>

              {/* ── Change Password ── */}
              <div style={{ marginTop: 16, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Change Password</div>
                <div className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Must be at least 8 characters.</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, maxWidth: 420 }}>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(99,102,241,0.7)' }}>New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg px-4 py-3 text-sm bg-black/[0.03] border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6366F1]/50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(99,102,241,0.7)' }}>Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg px-4 py-3 text-sm bg-black/[0.03] border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6366F1]/50 transition-colors" />
                  </div>
                  <button onClick={handlePasswordChange} disabled={changingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                    className="rounded-lg py-3 font-bold text-sm transition-all disabled:opacity-50"
                    style={{ padding: '10px 24px', background: newPassword && newPassword === confirmPassword && newPassword.length >= 8 ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : 'rgba(99,102,241,0.2)', color: '#FAFAFA', border: 'none', fontFamily: "'Bricolage Grotesque', sans-serif", cursor: newPassword && newPassword === confirmPassword && newPassword.length >= 8 ? 'pointer' : 'not-allowed', alignSelf: 'flex-start' as const }}>
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <div style={{ fontSize: 13, color: '#EF4444' }}>Passwords don't match</div>
                  )}
                  {newPassword && newPassword.length > 0 && newPassword.length < 8 && (
                    <div style={{ fontSize: 13, color: '#F59E0B' }}>Password must be at least 8 characters</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications Tab ───────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className={sectionCard} style={sectionCardStyle}>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Email Preferences
              </div>
              <div className="space-y-3">
                {[
                  {
                    key: 'weeklyReport' as const,
                    label: 'Weekly Performance Report',
                    desc: 'Summary of your tool usage and insights',
                  },
                  {
                    key: 'productAlerts' as const,
                    label: 'Product Alerts',
                    desc: 'Notifications about your tracked products',
                  },
                  {
                    key: 'newFeatures' as const,
                    label: 'New Features',
                    desc: 'Be the first to know about new tools',
                  },
                  {
                    key: 'marketing' as const,
                    label: 'Marketing Tips',
                    desc: 'Ecommerce tips and AU market insights',
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3 px-4 rounded-lg"
                    style={{ background: '#FAFAFA' }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#0A0A0A' }}>
                        {label}
                      </div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>
                        {desc}
                      </div>
                    </div>
                    <button
                      onClick={() => setEmailNotifs({ ...emailNotifs, [key]: !emailNotifs[key] })}
                      className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
                      style={{
                        background: emailNotifs[key]
                          ? 'rgba(99,102,241,0.3)'
                          : 'rgba(0,0,0,0.1)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                        style={{
                          background: emailNotifs[key] ? '#6366F1' : '#9CA3AF',
                          left: emailNotifs[key] ? 22 : 2,
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="mt-4 w-full rounded-lg py-3 font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                  color: '#FAFAFA',
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={saveNotificationPrefs}
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* ── Billing Tab ─────────────────────────────────────────────── */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Current Plan</div>
                {!subInfo ? (
                  <div className="animate-pulse" style={{ height: 48, background: 'rgba(99,102,241,0.08)', borderRadius: 8 }} />
                ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A0A0A' }}>
                      {subInfo.plan === 'scale' ? 'Scale' : subInfo.plan === 'builder' ? 'Builder' : subInfo.plan === 'pro' ? 'Pro' : 'Free'}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                      {subInfo.plan === 'free' || !subInfo.plan
                        ? 'Free tier — upgrade to unlock all features'
                        : `Renews ${subInfo.renewalDate || 'monthly'} · ${subInfo.status === 'active' ? 'Active' : subInfo.status || 'Active'}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {subInfo.plan === 'scale' ? '$199' : subInfo.plan === 'builder' ? '$99' : subInfo.plan === 'pro' ? '$99' : '$0'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>AUD/month</div>
                  </div>
                </div>
                )}
              </div>
              <button
                onClick={openBillingPortal}
                className="w-full flex items-center justify-between rounded-xl p-4 transition-all"
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  color: '#374151',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={16} style={{ color: '#6366F1' }} />
                  <div className="text-left">
                    <div className="text-sm font-medium">Manage Subscription</div>
                    <div className="text-xs" style={{ color: '#9CA3AF' }}>
                      Update billing, change plan, or cancel via Stripe
                    </div>
                  </div>
                </div>
                <ExternalLink size={14} style={{ color: '#9CA3AF' }} />
              </button>
            </div>
          )}

          {/* ── Integrations Tab ────────────────────────────────────────── */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className={sectionCard} style={sectionCardStyle}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  Connected Services
                </div>
                <div className="space-y-0">
                  {/* Shopify */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #F0F0F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#95BF47', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛍️</div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0A0A0A', fontSize: 14 }}>Shopify</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>Sync products, orders, and inventory</div>
                      </div>
                    </div>
                    <button onClick={() => setLocation('/app/store-builder')} style={{ padding: '8px 16px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Connect →
                    </button>
                  </div>
                  {/* Meta Ads */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #F0F0F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📘</div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0A0A0A', fontSize: 14 }}>Meta Ads</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>Connect Facebook & Instagram ad accounts</div>
                      </div>
                    </div>
                    <button onClick={() => setLocation('/app/ads-manager')} style={{ padding: '8px 16px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Set Up →
                    </button>
                  </div>
                  {/* TikTok Shop */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0A0A0A', fontSize: 14 }}>TikTok Shop</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>Connect TikTok Shop for product sync</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: '#9CA3AF', padding: '6px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontWeight: 600 }}>Coming Soon</span>
                  </div>
                </div>
              </div>
              {/* Service Status */}
              <div className={sectionCard} style={sectionCardStyle}>
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  Service Status
                </div>
                <div className="space-y-2">
                  {(Object.keys(INTEGRATION_LABELS) as (keyof HealthStatus)[]).map((key) => (
                    <div key={key} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                      <span className="text-sm" style={{ color: '#374151' }}>{INTEGRATION_LABELS[key]}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: healthStatus?.[key] ? '#10b981' : '#ef4444' }} />
                        <span className="text-xs" style={{ color: healthStatus?.[key] ? '#10b981' : '#ef4444' }}>{healthStatus?.[key] ? 'Connected' : 'Disconnected'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Data & Privacy Tab ──────────────────────────────────────── */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className={sectionCard} style={sectionCardStyle}>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Your Data
                </div>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                  Export all your data including profile, activity history, and saved products.
                </p>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#6366F1',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={14} /> Export My Data
                </button>
              </div>

              <div
                className={sectionCard}
                style={{ ...sectionCardStyle, borderColor: 'rgba(239,68,68,0.15)' }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: '#ef4444', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Danger Zone
                </div>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                  Permanently delete your account and all associated data. This action cannot be
                  undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} /> Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
