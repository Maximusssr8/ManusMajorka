/**
 * AdminPanel — Full admin panel at /admin
 * Access restricted to maximusmajorka@gmail.com only.
 * Design: dark SaaS internal tool, glass morphism cards, Majorka design system.
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart2,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

const ADMIN_EMAIL = 'maximusmajorka@gmail.com';

// ── Feature Flags ─────────────────────────────────────────────────────────────

const FEATURE_FLAGS = [
  {
    key: 'website_generator',
    label: 'Website Generator',
    tiers: ['builder', 'scale'],
  },
  {
    key: 'meta_ads',
    label: 'Meta Ads Pack',
    tiers: ['builder', 'scale'],
  },
  {
    key: 'knowledge_base',
    label: 'Knowledge Base',
    tiers: ['starter', 'builder', 'scale'],
  },
  {
    key: 'academy',
    label: 'Majorka Academy',
    tiers: ['starter', 'builder', 'scale'],
  },
  {
    key: 'supplier_finder',
    label: 'Supplier Finder',
    tiers: ['builder', 'scale'],
  },
];

function loadFeatureFlags(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem('majorka_feature_flags');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveFeatureFlags(flags: Record<string, boolean>) {
  localStorage.setItem('majorka_feature_flags', JSON.stringify(flags));
}

// ── Glass Card ────────────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        backdropFilter: 'blur(12px)',
      }}
    >
      {children}
    </div>
  );
}

// ── Plan Badge ────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, React.CSSProperties> = {
    starter: { background: 'rgba(113,113,122,0.2)', color: '#6B7280' },
    builder: { background: 'rgba(99,102,241,0.15)', color: '#6366F1' },
    scale: { background: 'rgba(124,90,245,0.2)', color: '#a78bfa' },
    pro: { background: 'rgba(99,102,241,0.30)', color: '#6366F1' },
  };
  const s = styles[plan] ?? styles.starter;
  return (
    <span
      style={{
        ...s,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'Fira Code, monospace',
        textTransform: 'capitalize',
      }}
    >
      {plan || '—'}
    </span>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          background: 'white',
          border: '1px solid #F0F0F0',
          borderRadius: 16,
          padding: 32,
          maxWidth: 420,
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            color: '#0A0A0A',
            fontSize: 18,
            marginBottom: 12,
          }}
        >
          {title}
        </h3>
        <p style={{ color: '#374151', fontSize: 14, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#F9FAFB',
              color: '#374151',
              border: '1px solid #F0F0F0',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F0F0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F9FAFB')}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: danger ? 'rgba(239,68,68,0.8)' : '#6366F1',
              color: danger ? '#fff' : '#0a0a0a',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'stats', label: 'Platform Stats', icon: BarChart2 },
  { id: 'ai-usage', label: 'AI Usage', icon: Activity },
  { id: 'content', label: 'Content Manager', icon: BookOpen },
  { id: 'actions', label: 'Quick Actions', icon: Zap },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState('users');

  // Users section
  const [userSearch, setUserSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [planMenuOpen, setPlanMenuOpen] = useState<string | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<{
    userId: string;
    plan: string;
    email: string;
  } | null>(null);

  // Broadcast modal
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');

  // Redeploy confirm
  const [showRedeploy, setShowRedeploy] = useState(false);

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(loadFeatureFlags);

  // Academy editor
  const [lessonEdit, setLessonEdit] = useState<Record<string, string>>({});

  // tRPC queries
  const usersQuery = trpc.admin.getUsers.useQuery(undefined, {
    enabled: user?.email === ADMIN_EMAIL,
  });
  const statsQuery = trpc.admin.getStats.useQuery(undefined, {
    enabled: user?.email === ADMIN_EMAIL,
  });
  const updatePlanMut = trpc.admin.updateUserPlan.useMutation({
    onSuccess: () => {
      toast.success('Plan updated');
      usersQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const broadcastMut = trpc.admin.sendBroadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Broadcast sent to ${data.sent} users`);
      setShowBroadcast(false);
      setBroadcastSubject('');
      setBroadcastBody('');
    },
    onError: (e) => toast.error(e.message),
  });

  // Gate access
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: '#6366F1' }} />
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    navigate('/app');
    return null;
  }

  // ── Filtered users ─────────────────────────────────────────────────────────

  const allUsers = usersQuery.data || [];
  const filteredUsers = allUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchSearch =
      !q ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.user_metadata?.full_name || '').toLowerCase().includes(q);
    return matchSearch;
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePlanChange = (userId: string, plan: string, email: string) => {
    setConfirmPlan({ userId, plan, email });
    setPlanMenuOpen(null);
  };

  const confirmPlanChange = () => {
    if (!confirmPlan) return;
    updatePlanMut.mutate({
      userId: confirmPlan.userId,
      plan: confirmPlan.plan as 'starter' | 'builder' | 'scale' | 'pro',
    });
    setConfirmPlan(null);
  };

  const triggerN8nWorkflow = async (workflowId: string, label: string) => {
    try {
      const apiKey = (import.meta as any).env?.VITE_N8N_API_KEY || '';
      const n8nBase = (import.meta as any).env?.VITE_N8N_BASE_URL || 'http://localhost:5678';
      await fetch(`${n8nBase}/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': apiKey },
      });
      toast.success(`${label} triggered`);
    } catch {
      toast.error('n8n not reachable — is it running?');
    }
  };

  const triggerDeploy = async () => {
    const token = (await (window as any).__supabaseSession?.()) || '';
    try {
      const res = await fetch('/api/admin/deploy', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Deploy triggered — check Vercel');
      } else {
        toast.error(data.message || 'Deploy failed');
      }
    } catch {
      toast.error('Deploy request failed');
    }
    setShowRedeploy(false);
  };

  const toggleFeatureFlag = (key: string) => {
    const next = { ...featureFlags, [key]: !featureFlags[key] };
    setFeatureFlags(next);
    saveFeatureFlags(next);
    toast.success(`Feature flag updated`);
  };

  // ── Stat cards data ────────────────────────────────────────────────────────

  const statCards = [
    {
      label: 'Total Users',
      value: statsQuery.data?.totalUsers ?? '—',
      icon: Users,
      color: '#6366F1',
    },
    {
      label: 'Active Today',
      value: statsQuery.data?.activeToday ?? '—',
      icon: Activity,
      color: '#6366F1',
    },
    {
      label: 'Active This Week',
      value: statsQuery.data?.activeThisWeek ?? '—',
      icon: BarChart2,
      color: '#7c6af5',
    },
  ];

  const toolUsageData = [
    { tool: 'Market Intel', count: 0 },
    { tool: 'Ad Creator', count: 0 },
    { tool: 'Brand DNA', count: 0 },
    { tool: 'Competitor', count: 0 },
    { tool: 'Profit Calc', count: 0 },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'DM Sans, sans-serif',
        color: '#0A0A0A',
      }}
    >
      {/* Top Nav */}
      <div
        style={{
          height: 56,
          borderBottom: '1px solid #F9FAFB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          background: 'rgba(8,10,14,0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1, #f0c040)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 900,
              fontSize: 13,
              color: '#FAFAFA',
            }}
          >
            M
          </div>
          <span
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: '#0A0A0A',
            }}
          >
            Majorka Admin
          </span>
          <span
            style={{
              padding: '1px 6px',
              background: 'rgba(239,68,68,0.15)',
              color: '#f87171',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
              fontFamily: 'Fira Code, monospace',
            }}
          >
            INTERNAL
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{user.email}</span>
          <button
            onClick={() => navigate('/app')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: '#F9FAFB',
              border: '1px solid #F5F5F5',
              color: '#374151',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F0F0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F9FAFB')}
          >
            <ArrowLeft size={13} />
            Back to App
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left sidebar */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: '1px solid #F9FAFB',
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: active ? '#6366F1' : '#6B7280',
                  border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  textAlign: 'left',
                  transition: 'all 200ms ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* ── USERS ────────────────────────────────────────────────── */}
              {activeSection === 'users' && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    Users
                  </h2>

                  {/* Search + filter */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginBottom: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9CA3AF',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name or email…"
                        style={{
                          width: '100%',
                          padding: '9px 12px 9px 34px',
                          background: '#F9FAFB',
                          border: '1px solid #F5F5F5',
                          borderRadius: 8,
                          color: '#0A0A0A',
                          fontSize: 13,
                          outline: 'none',
                          transition: 'border-color 200ms ease',
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = '#F5F5F5')
                        }
                      />
                    </div>
                    <select
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        background: '#F9FAFB',
                        border: '1px solid #F5F5F5',
                        borderRadius: 8,
                        color: '#0A0A0A',
                        fontSize: 13,
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="all" style={{ background: 'white' }}>
                        All Plans
                      </option>
                      <option value="starter" style={{ background: 'white' }}>
                        Starter
                      </option>
                      <option value="builder" style={{ background: 'white' }}>
                        Builder
                      </option>
                      <option value="scale" style={{ background: 'white' }}>
                        Scale
                      </option>
                    </select>
                  </div>

                  {/* Table */}
                  <GlassCard>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr
                            style={{
                              borderBottom: '1px solid #F9FAFB',
                            }}
                          >
                            {['User', 'Email', 'Plan', 'Joined', 'Actions'].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: '12px 16px',
                                  textAlign: 'left',
                                  fontSize: 11,
                                  color: '#9CA3AF',
                                  fontWeight: 600,
                                  letterSpacing: '0.05em',
                                  textTransform: 'uppercase',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {usersQuery.isLoading ? (
                            <tr>
                              <td
                                colSpan={5}
                                style={{
                                  padding: 32,
                                  textAlign: 'center',
                                  color: '#9CA3AF',
                                }}
                              >
                                <Loader2
                                  className="animate-spin"
                                  size={20}
                                  style={{ margin: '0 auto' }}
                                />
                              </td>
                            </tr>
                          ) : filteredUsers.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                style={{
                                  padding: 32,
                                  textAlign: 'center',
                                  color: '#9CA3AF',
                                  fontSize: 14,
                                }}
                              >
                                No users found
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => {
                              const name =
                                u.user_metadata?.full_name || u.user_metadata?.name || '—';
                              const initials =
                                name !== '—'
                                  ? name
                                      .split(' ')
                                      .map((w: string) => w[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()
                                  : (u.email || '?')[0].toUpperCase();
                              const joined = u.created_at
                                ? new Date(u.created_at).toLocaleDateString('en-AU')
                                : '—';
                              return (
                                <tr
                                  key={u.id}
                                  style={{
                                    borderBottom: '1px solid #F9FAFB',
                                    transition: 'background 150ms ease',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = '#FAFAFA')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = 'transparent')
                                  }
                                >
                                  {/* Avatar + name */}
                                  <td style={{ padding: '10px 16px' }}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 32,
                                          height: 32,
                                          borderRadius: '50%',
                                          background: 'rgba(99,102,241,0.15)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: '#6366F1',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {initials}
                                      </div>
                                      <span style={{ fontSize: 13, color: '#0A0A0A' }}>{name}</span>
                                    </div>
                                  </td>
                                  {/* Email */}
                                  <td
                                    style={{
                                      padding: '10px 16px',
                                      fontSize: 12,
                                      color: '#374151',
                                      fontFamily: 'Fira Code, monospace',
                                    }}
                                  >
                                    {u.email || '—'}
                                  </td>
                                  {/* Plan */}
                                  <td style={{ padding: '10px 16px' }}>
                                    <PlanBadge plan="pro" />
                                  </td>
                                  {/* Joined */}
                                  <td
                                    style={{
                                      padding: '10px 16px',
                                      fontSize: 12,
                                      color: '#9CA3AF',
                                    }}
                                  >
                                    {joined}
                                  </td>
                                  {/* Actions */}
                                  <td style={{ padding: '10px 16px' }}>
                                    <div style={{ position: 'relative' }}>
                                      <button
                                        onClick={() =>
                                          setPlanMenuOpen(planMenuOpen === u.id ? null : u.id)
                                        }
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          padding: '5px 10px',
                                          background: '#F9FAFB',
                                          border: '1px solid #F5F5F5',
                                          borderRadius: 6,
                                          color: '#374151',
                                          cursor: 'pointer',
                                          fontSize: 12,
                                          transition: 'all 200ms ease',
                                        }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.background =
                                            '#F5F5F5')
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.background =
                                            '#F9FAFB')
                                        }
                                      >
                                        Change Plan
                                        <ChevronDown size={11} />
                                      </button>
                                      {planMenuOpen === u.id && (
                                        <div
                                          style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 4px)',
                                            left: 0,
                                            background: 'white',
                                            border: '1px solid #F0F0F0',
                                            borderRadius: 8,
                                            zIndex: 100,
                                            minWidth: 140,
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                          }}
                                        >
                                          {['starter', 'builder', 'scale', 'pro'].map((plan) => (
                                            <button
                                              key={plan}
                                              onClick={() =>
                                                handlePlanChange(u.id, plan, u.email || '')
                                              }
                                              style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '8px 12px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#374151',
                                                cursor: 'pointer',
                                                fontSize: 13,
                                                textAlign: 'left',
                                                textTransform: 'capitalize',
                                                transition: 'all 150ms ease',
                                              }}
                                              onMouseEnter={(e) =>
                                                (e.currentTarget.style.background =
                                                  '#F9FAFB')
                                              }
                                              onMouseLeave={(e) =>
                                                (e.currentTarget.style.background = 'transparent')
                                              }
                                            >
                                              {plan}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div
                      style={{
                        padding: '10px 16px',
                        borderTop: '1px solid #F9FAFB',
                        fontSize: 12,
                        color: '#9CA3AF',
                      }}
                    >
                      {filteredUsers.length} user
                      {filteredUsers.length !== 1 ? 's' : ''}
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* ── STATS ────────────────────────────────────────────────── */}
              {activeSection === 'stats' && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    Platform Stats
                  </h2>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    {statCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <GlassCard key={card.label} className="p-5">
                          <div style={{ padding: 20 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 12,
                              }}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: `${card.color}18`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Icon size={15} style={{ color: card.color }} />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: '#6B7280',
                                }}
                              >
                                {card.label}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: 28,
                                fontWeight: 700,
                                fontFamily: 'Fira Code, monospace',
                                color: card.color,
                              }}
                            >
                              {statsQuery.isLoading ? (
                                <Loader2
                                  className="animate-spin"
                                  size={20}
                                  style={{ color: card.color }}
                                />
                              ) : (
                                card.value
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>

                  {/* Tool usage bar chart */}
                  <GlassCard>
                    <div style={{ padding: 20 }}>
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: 16,
                        }}
                      >
                        Most Used Tools
                      </h3>
                      <p
                        style={{
                          fontSize: 12,
                          color: '#9CA3AF',
                          marginBottom: 16,
                        }}
                      >
                        Usage tracking requires PostHog integration — showing placeholder data.
                      </p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={toolUsageData}>
                          <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                          <XAxis
                            dataKey="tool"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{
                              background: 'white',
                              border: '1px solid #F0F0F0',
                              borderRadius: 8,
                              color: '#0A0A0A',
                              fontSize: 12,
                            }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* ── AI USAGE ─────────────────────────────────────────────── */}
              {activeSection === 'ai-usage' && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    AI Usage
                  </h2>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {[
                      {
                        label: 'API Calls This Month',
                        value: '—',
                        hint: 'Set up PostHog to track this',
                        color: '#6366F1',
                      },
                      {
                        label: 'Estimated Cost',
                        value: '—',
                        hint: 'Requires Anthropic usage API',
                        color: '#6366F1',
                      },
                      {
                        label: 'Rate Limit Hits',
                        value: '—',
                        hint: 'In-memory — resets on restart',
                        color: '#f87171',
                      },
                    ].map((item) => (
                      <GlassCard key={item.label}>
                        <div style={{ padding: 20 }}>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#6B7280',
                              marginBottom: 10,
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: 30,
                              fontWeight: 700,
                              fontFamily: 'Fira Code, monospace',
                              color: item.color,
                              marginBottom: 8,
                            }}
                          >
                            {item.value}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#9CA3AF',
                            }}
                            title={item.hint}
                          >
                            {item.hint}
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CONTENT MANAGER ──────────────────────────────────────── */}
              {activeSection === 'content' && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    Content Manager
                  </h2>

                  {/* Feature Flags */}
                  <GlassCard>
                    <div style={{ padding: 20 }}>
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: 16,
                        }}
                      >
                        Feature Flags
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {FEATURE_FLAGS.map((flag) => {
                          const enabled = featureFlags[flag.key] !== false;
                          return (
                            <div
                              key={flag.key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                                borderBottom: '1px solid #F9FAFB',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 13, color: '#0A0A0A', marginBottom: 2 }}>
                                  {flag.label}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: '#9CA3AF',
                                    fontFamily: 'Fira Code, monospace',
                                  }}
                                >
                                  {flag.tiers.join(', ')}
                                </div>
                              </div>
                              <button
                                onClick={() => toggleFeatureFlag(flag.key)}
                                aria-label={`Toggle ${flag.label}`}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                <div
                                  style={{
                                    width: 36,
                                    height: 20,
                                    borderRadius: 10,
                                    background: enabled
                                      ? 'rgba(99,102,241,0.6)'
                                      : '#F0F0F0',
                                    transition: 'background 200ms',
                                    position: 'relative',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: '50%',
                                      background: enabled ? '#6366F1' : '#9CA3AF',
                                      position: 'absolute',
                                      top: 3,
                                      left: enabled ? 19 : 3,
                                      transition: 'left 200ms, background 200ms',
                                    }}
                                  />
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>
                        Saved to localStorage — client-side only for MVP.
                      </p>
                    </div>
                  </GlassCard>

                  {/* Academy Lesson Editor */}
                  <div style={{ marginTop: 20 }}>
                    <GlassCard>
                      <div style={{ padding: 20 }}>
                        <h3
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: 4,
                          }}
                        >
                          Academy Lesson Notes
                        </h3>
                        <p
                          style={{
                            fontSize: 12,
                            color: '#9CA3AF',
                            marginBottom: 16,
                          }}
                        >
                          Quick notes per lesson — stored in localStorage. MVP only.
                        </p>
                        {[
                          'what-is-dropshipping',
                          'au-market-101',
                          'legal-setup',
                          'profit-maths',
                        ].map((lessonId) => (
                          <div key={lessonId} style={{ marginBottom: 16 }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: '#9CA3AF',
                                marginBottom: 4,
                                fontFamily: 'Fira Code, monospace',
                              }}
                            >
                              {lessonId}
                            </div>
                            <textarea
                              value={
                                lessonEdit[lessonId] ??
                                (localStorage.getItem(`majorka_lesson_${lessonId}`) || '')
                              }
                              onChange={(e) =>
                                setLessonEdit((prev) => ({
                                  ...prev,
                                  [lessonId]: e.target.value,
                                }))
                              }
                              rows={3}
                              placeholder="Add notes for this lesson…"
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: '#FAFAFA',
                                border: '1px solid #F5F5F5',
                                borderRadius: 8,
                                color: '#0A0A0A',
                                fontSize: 13,
                                resize: 'vertical',
                                outline: 'none',
                                fontFamily: 'DM Sans, sans-serif',
                                transition: 'border-color 200ms ease',
                              }}
                              onFocus={(e) =>
                                (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')
                              }
                              onBlur={(e) =>
                                (e.currentTarget.style.borderColor = '#F5F5F5')
                              }
                            />
                            <button
                              onClick={() => {
                                const val = lessonEdit[lessonId] ?? '';
                                localStorage.setItem(`majorka_lesson_${lessonId}`, val);
                                toast.success('Lesson notes saved');
                              }}
                              style={{
                                marginTop: 6,
                                padding: '5px 12px',
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                borderRadius: 6,
                                color: '#6366F1',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                transition: 'all 200ms ease',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')
                              }
                            >
                              Save
                            </button>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </div>
                </div>
              )}

              {/* ── QUICK ACTIONS ─────────────────────────────────────────── */}
              {activeSection === 'actions' && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 20,
                    }}
                  >
                    Quick Actions
                  </h2>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {[
                      {
                        label: 'Send Broadcast Email',
                        icon: Send,
                        color: '#6366F1',
                        danger: false,
                        onClick: () => setShowBroadcast(true),
                      },
                      {
                        label: 'Welcome Email Sequence',
                        icon: Zap,
                        color: '#6366F1',
                        danger: false,
                        onClick: () =>
                          triggerN8nWorkflow('s6p2EouVEPIQhGjS', 'Welcome Email Sequence'),
                      },
                      {
                        label: 'Daily Digest',
                        icon: BarChart2,
                        color: '#6366F1',
                        danger: false,
                        onClick: () => triggerN8nWorkflow('EeHbXLFUl0mt7rGg', 'Daily Digest'),
                      },
                      {
                        label: 'Weekly AU Report',
                        icon: Activity,
                        color: '#6366F1',
                        danger: false,
                        onClick: () => triggerN8nWorkflow('Ih6AKmVQKO7fn8ST', 'Weekly AU Report'),
                      },
                      {
                        label: 'Force Redeploy',
                        icon: RefreshCw,
                        color: '#f87171',
                        danger: true,
                        onClick: () => setShowRedeploy(true),
                      },
                    ].map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          onClick={action.onClick}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '16px 20px',
                            background: '#FAFAFA',
                            border: `1px solid ${action.danger ? 'rgba(239,68,68,0.2)' : '#E5E7EB'}`,
                            borderRadius: 12,
                            color: action.color,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                            textAlign: 'left',
                            transition: 'all 200ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = action.danger
                              ? 'rgba(239,68,68,0.08)'
                              : '#F9FAFB';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FAFAFA';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: action.danger
                                ? 'rgba(239,68,68,0.1)'
                                : 'rgba(99,102,241,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={16} style={{ color: action.color }} />
                          </div>
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Broadcast Email Modal */}
      <AnimatePresence>
        {showBroadcast && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setShowBroadcast(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'white',
                border: '1px solid #F0F0F0',
                borderRadius: 16,
                padding: 32,
                maxWidth: 500,
                width: '100%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0A0A0A',
                  }}
                >
                  Broadcast Email
                </h3>
                <button
                  onClick={() => setShowBroadcast(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                    padding: 4,
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: '#6B7280',
                      marginBottom: 6,
                    }}
                  >
                    Subject
                  </label>
                  <input
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="Email subject…"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#F9FAFB',
                      border: '1px solid #F0F0F0',
                      borderRadius: 8,
                      color: '#0A0A0A',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 200ms ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#F0F0F0')}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: '#6B7280',
                      marginBottom: 6,
                    }}
                  >
                    Body (HTML supported)
                  </label>
                  <textarea
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="Write your message…"
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#F9FAFB',
                      border: '1px solid #F0F0F0',
                      borderRadius: 8,
                      color: '#0A0A0A',
                      fontSize: 14,
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'border-color 200ms ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#F0F0F0')}
                  />
                </div>
                <button
                  onClick={() => {
                    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
                      toast.error('Subject and body are required');
                      return;
                    }
                    broadcastMut.mutate({
                      subject: broadcastSubject,
                      body: broadcastBody,
                    });
                  }}
                  disabled={broadcastMut.isPending}
                  style={{
                    padding: '12px 20px',
                    background: '#6366F1',
                    border: 'none',
                    borderRadius: 8,
                    color: '#0a0a0a',
                    cursor: broadcastMut.isPending ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: broadcastMut.isPending ? 0.7 : 1,
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!broadcastMut.isPending) e.currentTarget.style.opacity = '0.85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = broadcastMut.isPending ? '0.7' : '1';
                  }}
                >
                  {broadcastMut.isPending ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    <Send size={15} />
                  )}
                  {broadcastMut.isPending ? 'Sending…' : 'Send to All Users'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm dialogs */}
      <AnimatePresence>
        {confirmPlan && (
          <ConfirmDialog
            open={!!confirmPlan}
            title="Change Plan?"
            message={`Set ${confirmPlan.email || 'this user'} to ${confirmPlan.plan}?`}
            confirmLabel="Change Plan"
            onConfirm={confirmPlanChange}
            onCancel={() => setConfirmPlan(null)}
          />
        )}
        {showRedeploy && (
          <ConfirmDialog
            open={showRedeploy}
            title="Force Redeploy?"
            message="This will trigger a new Vercel production deployment. Are you sure?"
            confirmLabel="Deploy"
            danger
            onConfirm={triggerDeploy}
            onCancel={() => setShowRedeploy(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
