/**
 * AU Moat panels — Margin calculator, AU Shipping estimate, BNPL score,
 * and a Price-Alert modal — all surfaced inside ProductDetailDrawer.
 *
 * Three independent sections so each can fail / load on its own without
 * breaking the rest of the panel. Every section degrades gracefully when
 * a dependent service is offline (Australia Post key missing, no auth
 * for alerts, etc).
 *
 * Design tokens: gold (#4f8ef7) primary, surface #0d1117, divider #161b22.
 * Only gold, teal, amber, and greyscale used here — no off-palette colours.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellRing, Calculator, Truck, CreditCard, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/hooks/useProducts';
import { supabase } from '@/lib/supabase';

// ─── Shared helpers ─────────────────────────────────────────────────────────

const GOLD = '#4f8ef7';
const GOLD_DARK = '#b8941f';
const DIVIDER = '#161b22';
const SURFACE = '#0d1117';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

function fmtAUD(n: number | null | undefined, digits = 2): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v) || v === 0) return '—';
  return `$${v.toFixed(digits)}`;
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

function SectionHeader({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: GOLD, display: 'inline-flex' }}>{icon}</span>
      <span
        style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: '#f5f5f5',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </span>
      {hint ? (
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#737373' }}>{hint}</span>
      ) : null}
    </div>
  );
}

function sectionShell(): React.CSSProperties {
  return {
    padding: 14,
    background: SURFACE,
    border: `1px solid ${DIVIDER}`,
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };
}

// ─── Alert bell + modal ─────────────────────────────────────────────────────

interface AlertBellProps {
  product: Product;
}

interface PriceAlertRow {
  id: string;
  product_id: string;
  status: 'active' | 'triggered' | 'cancelled';
}

export function AlertBell({ product }: AlertBellProps) {
  const [hasActive, setHasActive] = useState(false);
  const [open, setOpen] = useState(false);
  const productId = String(product.id);

  // Probe whether this product already has an active alert for the user.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = await authHeaders();
        if (!('Authorization' in headers)) return;
        const res = await fetch('/api/alerts/price', { headers });
        if (!res.ok) return;
        const json = (await res.json()) as { alerts?: PriceAlertRow[] };
        if (cancelled) return;
        const active = (json.alerts ?? []).some(
          (a) => String(a.product_id) === productId && a.status === 'active',
        );
        setHasActive(active);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  return (
    <>
      <button
        type="button"
        aria-label={hasActive ? 'Manage price alert' : 'Create price drop alert'}
        onClick={() => setOpen(true)}
        style={{
          minWidth: 44,
          minHeight: 44,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: hasActive ? 'rgba(79,142,247,0.18)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hasActive ? 'rgba(79,142,247,0.45)' : DIVIDER}`,
          borderRadius: 10,
          color: hasActive ? GOLD : '#f5f5f5',
          cursor: 'pointer',
          transition: 'background 140ms ease, border 140ms ease',
        }}
      >
        {hasActive ? <BellRing size={18} fill={GOLD} /> : <Bell size={18} />}
      </button>
      {open ? (
        <PriceAlertModal
          product={product}
          onClose={() => setOpen(false)}
          onCreated={() => { setHasActive(true); setOpen(false); }}
        />
      ) : null}
    </>
  );
}

interface PriceAlertModalProps {
  product: Product;
  onClose: () => void;
  onCreated: () => void;
}

function PriceAlertModal({ product, onClose, onCreated }: PriceAlertModalProps) {
  const currentPrice = Number(product.price_aud ?? 0);
  const [enabled, setEnabled] = useState(true);
  const [alertType, setAlertType] = useState<'any_drop' | 'percentage' | 'target_price'>('any_drop');
  const [thresholdPercent, setThresholdPercent] = useState<string>('10');
  const [targetPrice, setTargetPrice] = useState<string>(
    currentPrice > 0 ? (currentPrice * 0.85).toFixed(2) : '',
  );
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!enabled || saving) return;
    setSaving(true);
    try {
      const headers = await authHeaders();
      if (!('Authorization' in headers)) {
        toast.error('Sign in to set price alerts');
        setSaving(false);
        return;
      }
      const body: Record<string, unknown> = {
        product_id: String(product.id),
        product_name: product.product_title,
        product_image: product.image_url ?? null,
        original_price: currentPrice,
        alert_type: alertType,
      };
      if (alertType === 'percentage') {
        const pct = Number(thresholdPercent);
        if (!(pct > 0)) { toast.error('Enter a percentage'); setSaving(false); return; }
        body.threshold_percent = pct;
      }
      if (alertType === 'target_price') {
        const tp = Number(targetPrice);
        if (!(tp > 0) || tp >= currentPrice) {
          toast.error('Target price must be below current price');
          setSaving(false);
          return;
        }
        body.target_price = tp;
      }
      const res = await fetch('/api/alerts/price', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(`Could not save alert: ${err?.error ?? res.status}`);
        return;
      }
      toast.success('Price alert created — we\'ll email you on the drop');
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create price alert"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 420,
          background: '#0b0b0b',
          border: `1px solid ${DIVIDER}`,
          borderRadius: 16,
          padding: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Syne', system-ui, sans-serif", fontSize: 16, fontWeight: 700, color: '#f5f5f5' }}>
            Price drop alert
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: '#a3a3a3', cursor: 'pointer',
              minWidth: 36, minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{
          padding: 12,
          background: SURFACE,
          border: `1px solid ${DIVIDER}`,
          borderRadius: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current price</span>
          <span className="mj-num" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: GOLD }}>
            {fmtAUD(currentPrice)}
          </span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f5f5f5' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: GOLD }}
          />
          Alert me when price drops
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {(['any_drop', 'percentage', 'target_price'] as const).map((k) => {
            const active = alertType === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setAlertType(k)}
                disabled={!enabled}
                style={{
                  padding: '8px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 8,
                  background: active ? 'rgba(79,142,247,0.18)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(79,142,247,0.45)' : DIVIDER}`,
                  color: active ? GOLD : '#a3a3a3',
                  cursor: enabled ? 'pointer' : 'not-allowed',
                }}
              >
                {k === 'any_drop' ? 'Any drop' : k === 'percentage' ? '% drop' : 'Target $'}
              </button>
            );
          })}
        </div>

        {alertType === 'percentage' ? (
          <FieldRow label="Trigger when price drops by">
            <NumberInput
              value={thresholdPercent}
              onChange={setThresholdPercent}
              suffix="%"
              disabled={!enabled}
              placeholder="10"
            />
          </FieldRow>
        ) : null}
        {alertType === 'target_price' ? (
          <FieldRow label="Trigger when price reaches">
            <NumberInput
              value={targetPrice}
              onChange={setTargetPrice}
              prefix="$"
              disabled={!enabled}
              placeholder="0.00"
            />
          </FieldRow>
        ) : null}

        <button
          type="button"
          onClick={onSave}
          disabled={!enabled || saving}
          style={{
            minHeight: 44,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '0 16px',
            fontSize: 14, fontWeight: 600,
            color: '#0a0a0a',
            background: enabled ? GOLD : 'rgba(79,142,247,0.4)',
            border: `1px solid ${GOLD_DARK}`,
            borderRadius: 10,
            cursor: enabled && !saving ? 'pointer' : 'not-allowed',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {saving ? 'Saving…' : 'Save Alert'}
        </button>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function NumberInput({
  value, onChange, suffix, prefix, disabled, placeholder,
}: { value: string; onChange: (v: string) => void; suffix?: string; prefix?: string; disabled?: boolean; placeholder?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: SURFACE, border: `1px solid ${DIVIDER}`, borderRadius: 8,
      padding: '0 12px',
    }}>
      {prefix ? <span style={{ color: '#737373', fontSize: 13, marginRight: 4 }}>{prefix}</span> : null}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: '#f5f5f5', fontSize: 14, padding: '10px 0', minWidth: 0,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      />
      {suffix ? <span style={{ color: '#737373', fontSize: 13, marginLeft: 4 }}>{suffix}</span> : null}
    </div>
  );
}

// ─── AU Warehouse badge (drawer body) ──────────────────────────────────────

export function AuWarehouseBadge({ product }: { product: Product }) {
  if (!product.au_warehouse_available) return null;
  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'rgba(79,142,247,0.10)',
        border: `1px solid rgba(79,142,247,0.35)`,
        borderRadius: 10,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 12, fontWeight: 700, color: GOLD,
        letterSpacing: '0.04em',
      }}
    >
      <span style={{ fontSize: 14 }}>AU</span>
      <span>WAREHOUSE — fast domestic dispatch</span>
    </div>
  );
}

// ─── AU Shipping estimate ───────────────────────────────────────────────────

interface ShippingResult {
  standard?: number | null;
  express?: number | null;
  parcel_locker?: number | null;
  eta_standard?: string | null;
  eta_express?: string | null;
  error?: string;
}

export function AuShippingEstimate({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [postcode, setPostcode] = useState('2000');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShippingResult | null>(null);

  const debouncedPostcode = useDebouncedValue(postcode, 400);

  useEffect(() => {
    if (!open) return;
    if (!/^\d{4}$/.test(debouncedPostcode)) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/shipping/estimate?productId=${encodeURIComponent(String(product.id))}&postcode=${debouncedPostcode}`,
        );
        const json = (await res.json()) as ShippingResult;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setData({ error: e instanceof Error ? e.message : 'network_error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedPostcode, open, product.id]);

  return (
    <section style={sectionShell()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <SectionHeader
          icon={<Truck size={16} />}
          title="AU Shipping Estimate"
          hint={open ? 'Hide' : 'Show'}
        />
      </button>
      {!open ? null : (
        <>
          <div>
            <div style={{ fontSize: 10, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Your postcode
            </div>
            <NumberInput
              value={postcode}
              onChange={(v) => setPostcode(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="2000"
            />
          </div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a3a3a3', fontSize: 13 }}>
              <Loader2 size={14} className="animate-spin" /> Quoting Australia Post…
            </div>
          ) : data?.error === 'auspost_not_configured' ? (
            <div style={{ fontSize: 12, color: '#f59e0b' }}>
              Australia Post API key not configured yet — admin must set <code style={{ color: '#fef3c7' }}>AUSPOST_API_KEY</code> in Vercel.
            </div>
          ) : data?.error ? (
            <div style={{ fontSize: 12, color: '#f87171' }}>
              Could not retrieve quote ({data.error}).
            </div>
          ) : data ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <ShippingCell label="Standard" value={data.standard} eta={data.eta_standard ?? '5-8 bdays'} />
              <ShippingCell label="Express" value={data.express} eta={data.eta_express ?? '1-3 bdays'} />
              <ShippingCell label="Parcel Locker" value={data.parcel_locker} eta="5-8 bdays" />
            </div>
          ) : null}
          {data && !data.error && data.standard != null ? (
            <div style={{ fontSize: 11, color: '#737373' }}>
              Estimated delivery: {data.eta_standard ?? '5-8 business days'} (standard) / {data.eta_express ?? '1-3 business days'} (express).
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function ShippingCell({ label, value, eta }: { label: string; value: number | null | undefined; eta: string }) {
  return (
    <div style={{ padding: 10, background: '#0b0b0b', border: `1px solid ${DIVIDER}`, borderRadius: 8 }}>
      <div style={{ fontSize: 9, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div className="mj-num" style={{ fontSize: 15, fontWeight: 700, color: '#f5f5f5', margin: '4px 0' }}>{fmtAUD(value)}</div>
      <div style={{ fontSize: 10, color: '#a3a3a3' }}>{eta}</div>
    </div>
  );
}

// ─── Margin calculator ─────────────────────────────────────────────────────

interface MarginApiResult {
  grossProfit: number;
  netProfit: number;
  netMarginPercent: number;
  breakEvenROAS: number;
  gstOnImport: number;
  gstCollected: number;
  netGSTPay: number;
  processingFee: number;
  gstRequired: boolean;
  customsDutyFlag: boolean;
  annualisedRevenue: number;
}

export function MarginCalculator({ product }: { product: Product }) {
  const productCost = Number(product.price_aud ?? 0);
  const [sellingPrice, setSellingPrice] = useState<string>(
    productCost > 0 ? (productCost * 3).toFixed(2) : '0',
  );
  const [adSpend, setAdSpend] = useState<number>(25);
  const [returnsPct, setReturnsPct] = useState<string>('8');
  const [data, setData] = useState<MarginApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const debounced = useDebouncedValue(
    { sellingPrice, adSpend, returnsPct, productCost },
    150,
  );

  const inflight = useRef<AbortController | null>(null);

  const fetchMargins = useCallback(async () => {
    const sp = Number(debounced.sellingPrice);
    if (!(sp > 0) || !(debounced.productCost > 0)) {
      setData(null);
      return;
    }
    if (inflight.current) inflight.current.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch('/api/margin/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          productCostAUD: debounced.productCost,
          shippingCostAUD: 0,
          sellingPriceAUD: sp,
          adSpendPercent: debounced.adSpend,
          returnsPercent: Number(debounced.returnsPct) || 0,
        }),
      });
      if (!res.ok) {
        setData(null);
        return;
      }
      const json = (await res.json()) as MarginApiResult;
      setData(json);
    } catch {
      /* aborted or network */
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => { fetchMargins(); }, [fetchMargins]);

  const marginColour = useMemo(() => {
    const p = data?.netMarginPercent ?? 0;
    if (p >= 30) return '#10b981';
    if (p >= 20) return '#f59e0b';
    return '#ef4444';
  }, [data]);

  if (productCost <= 0) {
    return (
      <section style={sectionShell()}>
        <SectionHeader icon={<Calculator size={16} />} title="Margin Calculator" />
        <div style={{ fontSize: 12, color: '#737373' }}>No supplier price recorded — calculator unavailable.</div>
      </section>
    );
  }

  return (
    <section style={sectionShell()}>
      <SectionHeader
        icon={<Calculator size={16} />}
        title="Margin Calculator"
        hint={loading ? 'Updating…' : `Cost ${fmtAUD(productCost)}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FieldRow label="Selling price (AUD)">
          <NumberInput value={sellingPrice} onChange={setSellingPrice} prefix="$" />
        </FieldRow>
        <FieldRow label="Returns rate">
          <NumberInput value={returnsPct} onChange={setReturnsPct} suffix="%" />
        </FieldRow>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          <span>Ad spend</span>
          <span>{adSpend}%</span>
        </div>
        <input
          type="range" min={0} max={80} step={1}
          value={adSpend}
          onChange={(e) => setAdSpend(Number(e.target.value))}
          style={{ width: '100%', accentColor: GOLD }}
        />
      </div>

      {data ? (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
          }}>
            <BigStat label="Net profit / sale" value={fmtAUD(data.netProfit)} colour={GOLD} mono large />
            <BigStat label="Net margin" value={`${data.netMarginPercent.toFixed(1)}%`} colour={marginColour} mono large />
            <BigStat label="Break-even ROAS" value={`${data.breakEvenROAS.toFixed(2)}x`} colour="#f5f5f5" mono />
            <BigStat label="GST on import" value={fmtAUD(data.gstOnImport)} colour="#f5f5f5" mono />
            <BigStat label="Net GST payable" value={fmtAUD(data.netGSTPay)} colour="#f5f5f5" mono />
            <BigStat label="Processing fee" value={fmtAUD(data.processingFee)} colour="#a3a3a3" mono />
          </div>
          {data.customsDutyFlag ? (
            <div style={warningStyle('#f59e0b')}>
              ⚠ Customs duty may apply — landed cost ≥ A$1,000. Consult a customs broker.
            </div>
          ) : null}
          {data.gstRequired ? (
            <div style={warningStyle('#f59e0b')}>
              ⚠ Annualised revenue ≥ A$75K — you may need to register for GST with the ATO.
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#737373' }}>Adjust the inputs to see profit, margin, ROAS and GST.</div>
      )}
    </section>
  );
}

function warningStyle(colour: string): React.CSSProperties {
  return {
    padding: '8px 10px',
    fontSize: 12,
    color: colour,
    background: `${colour}1A`,
    border: `1px solid ${colour}55`,
    borderRadius: 8,
  };
}

function BigStat({
  label, value, colour, mono, large,
}: { label: string; value: string; colour: string; mono?: boolean; large?: boolean }) {
  return (
    <div style={{ padding: 10, background: '#0b0b0b', border: `1px solid ${DIVIDER}`, borderRadius: 8 }}>
      <div style={{ fontSize: 9, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div
        className={mono ? 'mj-num' : undefined}
        style={{
          fontSize: large ? 18 : 14,
          fontWeight: 700,
          color: colour,
          marginTop: 4,
          fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── BNPL score ─────────────────────────────────────────────────────────────

interface BNPLApiResult {
  score: number;
  priceBandScore: number;
  categoryScore: number;
  popularityScore: number;
}

export function BNPLScore({ product }: { product: Product }) {
  const [data, setData] = useState<BNPLApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/bnpl/score?productId=${encodeURIComponent(String(product.id))}`);
        if (!res.ok) return;
        const json = (await res.json()) as BNPLApiResult;
        if (!cancelled) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [product.id]);

  const colour = !data ? '#a3a3a3'
    : data.score >= 75 ? '#10b981'
    : data.score >= 50 ? '#f59e0b'
    : '#a3a3a3';

  return (
    <section style={sectionShell()}>
      <SectionHeader icon={<CreditCard size={16} />} title="BNPL Score" hint={loading ? 'Loading…' : undefined} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          className="mj-num"
          style={{
            fontSize: 32, fontWeight: 800, color: colour,
            fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
          }}
        >
          {data ? data.score : '—'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <BNPLLogo label="Afterpay" />
            <BNPLLogo label="Zip" />
          </div>
          <div style={{ fontSize: 11, color: '#a3a3a3', maxWidth: 280 }}>
            Products with high BNPL scores convert better with AU buyers who use Afterpay / Zip.
          </div>
        </div>
      </div>
    </section>
  );
}

function BNPLLogo({ label }: { label: string }) {
  // Lightweight text badges — no external logo network calls, no third-party
  // image hosts. Looks crisp in dark UI and can't break.
  const colour = label === 'Afterpay' ? '#b2fce4' : '#4f8ef7';
  const bg = label === 'Afterpay' ? '#0a0a0a' : '#0a0a0a';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '3px 8px',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
        color: colour, background: bg,
        border: `1px solid ${colour}55`, borderRadius: 6,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {label}
    </span>
  );
}
