import { useEffect, useRef, useState } from 'react';
import './hero-demo.css';

interface DemoData {
  products: any[];
  stats: any;
  alerts: any[];
  suggestions: any[];
}

export function HeroDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDemoData() {
      try {
        const [productsRes, statsRes, suggestionsRes, alertsRes] = await Promise.all([
          fetch('/api/products/winning?limit=4&sort=orders'),
          fetch('/api/products/stats'),
          fetch('/api/products/suggestions'),
          fetch('/api/products/winning?limit=3&filter=hot&sort=orders'),
        ]);
        const [productsData, statsData, suggestionsData, alertsData] = await Promise.all([
          productsRes.json(), statsRes.json(), suggestionsRes.json(), alertsRes.json(),
        ]);
        setData({
          products: productsData.products || [],
          stats: statsData,
          alerts: alertsData.products || [],
          suggestions: suggestionsData.suggestions || [],
        });
      } catch (err) {
        console.error('[HeroDemo] fetch failed:', err);
        // Show skeleton — never fallback to fake data
      } finally {
        setLoading(false);
      }
    }
    fetchDemoData();
  }, []);

  useEffect(() => {
    if (!mountRef.current || loading || !data) return;
    const avgScore = Math.round(data.stats?.avgScore || 0);
    const cleanup = initDemoEngine(mountRef.current, data, avgScore);
    return cleanup;
  }, [loading, data]);

  if (loading) {
    return (
      <div className="w-full max-w-[720px] mx-auto">
        <div className="w-full rounded-xl border border-white/10 overflow-hidden" style={{ background: '#060A12', height: '398px' }}>
          <div className="h-[38px] flex items-center gap-3 px-4" style={{ background: '#0B0F1E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1.5">
              {['#FF5F57','#FFBD2E','#28C940'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
            </div>
            <div className="flex-1 h-5 rounded bg-[#0C1120]/[0.06] animate-pulse" />
          </div>
          <div className="flex h-[360px]">
            <div className="w-[130px] h-full animate-pulse" style={{ background: '#0B0F1E', borderRight: '1px solid rgba(255,255,255,0.06)' }} />
            <div className="flex-1 p-4 space-y-3">
              <div className="h-5 w-48 bg-[#0C1120]/[0.05] rounded animate-pulse" />
              <div className="h-4 w-32 bg-[#0C1120]/[0.04] rounded animate-pulse" />
              <div className="mt-4 space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-[#0C1120]/[0.03] rounded-lg animate-pulse" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[720px]" style={{ margin: '0 auto' }}>
      <div ref={mountRef} id="mkr-demo-mount" />
      <div className="absolute inset-0 -z-10 rounded-full scale-75 blur-3xl opacity-20 pointer-events-none" style={{ background: '#6366f1' }} />
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatOrders = (n: number): string =>
  !n ? '—' : n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);

const calcMargin = (price: number, originalPrice: number): number | null =>
  originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;

const getScoreColour = (score: number) =>
  score >= 70
    ? { text: '#34D399', border: 'rgba(52,211,153,0.3)',  bg: 'rgba(52,211,153,0.08)' }
    : score >= 55
    ? { text: '#FBBF24', border: 'rgba(251,191,36,0.3)',  bg: 'rgba(251,191,36,0.08)' }
    : { text: '#94A3B8', border: 'rgba(255,255,255,0.1)', bg: 'rgba(255,255,255,0.04)' };

const getTrendBadge = (trend: string) =>
  trend === 'rising' ? { label: 'Rising', cls: 'green' }
  : trend === 'peaked' ? { label: 'Peaked', cls: 'amber' }
  : trend === 'declining' ? { label: 'Declining', cls: 'red' }
  : null;

// ─── Engine ─────────────────────────────────────────────────────────────────
function initDemoEngine(mount: HTMLElement, data: DemoData, avgScore: number): () => void {
  const productRowsHTML = data.products.slice(0, 4).map((p, i) => {
    const price = p.price ?? p.real_price_aud ?? 0;
    const margin = calcMargin(price, p.original_price);
    const score = p.winning_score || 0;
    const sc = getScoreColour(score);
    const tb = getTrendBadge(p.trend_direction);
    const title = (p.title || p.product_title || 'Product');
    const titleShort = title.substring(0, 28) + (title.length > 28 ? '…' : '');
    return `
      <div class="mkr-table-row" id="mkr-row-${i}">
        <div class="mkr-row-product">
          <div class="mkr-thumb" style="background:#1a2035;position:relative;overflow:hidden">
            ${p.image_url ? `<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display='none'" loading="lazy">` : ''}
          </div>
          <div>
            <div class="mkr-row-title">${titleShort}</div>
            <div class="mkr-row-badges">
              ${p.hot_product_flag ? '<span class="mkr-badge mkr-badge-orange">🔥 Hot</span>' : ''}
              ${p.is_bestseller ? '<span class="mkr-badge mkr-badge-gold">🏆 Best</span>' : ''}
              ${tb ? `<span class="mkr-badge mkr-badge-${tb.cls}">${tb.label}</span>` : ''}
            </div>
          </div>
        </div>
        <span class="mkr-orders">${formatOrders(p.orders ?? p.real_orders_count)}</span>
        <span class="mkr-margin" style="color:#D4AF37">${margin !== null ? margin + '%' : '—'}</span>
        <div class="mkr-score" style="color:${sc.text};border-color:${sc.border};background:${sc.bg}">${score || '—'}</div>
      </div>`;
  }).join('');

  // If no products, show a skeleton row so the table isn't empty/zeros
  const productBodyHTML = data.products.length === 0
    ? `<div class="mkr-table-row-skeleton" style="display:flex;flex-direction:column;gap:8px;padding:8px">
        ${[...Array(4)].map(() => `<div style="height:40px;background:rgba(255,255,255,0.03);border-radius:8px;animation:mkr-pulse-fade 1.5s infinite"></div>`).join('')}
       </div>`
    : productRowsHTML;

  const alertIcons = ['🔥','💰','📈'];
  const alertIconBgs = ['rgba(251,146,60,0.12)','rgba(99,102,241,0.12)','rgba(52,211,153,0.12)'];
  const alertBadges = [{ label:'HOT',cls:'orange' },{ label:'RISING',cls:'indigo' },{ label:'TREND',cls:'green' }];

  const alertsHTML = data.alerts.slice(0, 3).map((p, i) => `
    <div class="mkr-alert mkr-alert-${i}" style="opacity:0;transform:translateX(-8px)">
      <div class="mkr-alert-icon" style="background:${alertIconBgs[i]}">${alertIcons[i]}</div>
      <div class="mkr-alert-body">
        <div class="mkr-alert-title">${(p.category || 'Product')} opportunity detected</div>
        <div class="mkr-alert-sub">${formatOrders(p.orders ?? p.real_orders_count)} real orders · Score ${p.winning_score || '—'}/100</div>
      </div>
      <span class="mkr-badge mkr-badge-${alertBadges[i].cls} mkr-badge-sm">${alertBadges[i].label}</span>
    </div>`).join('');

  const gaugeVerdict = avgScore >= 70 ? 'Excellent' : avgScore >= 55 ? 'Good' : 'Building';
  const totalProducts = data.stats?.total || 0;
  const hotCount = data.stats?.hotCount || 0;
  const nicheCount = data.stats?.nicheCount || 0;

  // Real chart points from suggestion scores
  const rawSuggestions = data.suggestions.slice(0, 8);
  const chartPoints = rawSuggestions.length >= 2
    ? rawSuggestions.map((s: any, i: number) => {
        const x = (i / (rawSuggestions.length - 1)) * 280 + 10;
        const score2 = s.trendScore ?? s.avgScore ?? 50;
        const y = 55 - (score2 / 100 * 45);
        return `${x},${y}`;
      }).join(' ')
    : '10,45 50,38 90,30 130,25 170,20 210,22 250,15 290,10';

  // Revenue estimate from real product data
  const products50 = data.products;
  const avgEstRev = products50.length > 0
    ? products50.reduce((sum: number, p: any) => {
        const price = p.price ?? p.real_price_aud ?? 0;
        const orders = p.orders ?? p.real_orders_count ?? 0;
        if (price && orders) return sum + (price * orders) / 365;
        return sum;
      }, 0) / products50.length
    : 0;

  mount.innerHTML = buildDemoHTML({ productBodyHTML, alertsHTML, avgScore, gaugeVerdict, chartPoints, totalProducts, hotCount, nicheCount, avgEstRev });

  return startEngine(data, avgScore, mount);
}

interface DemoHTMLParams {
  productBodyHTML: string;
  alertsHTML: string;
  avgScore: number;
  gaugeVerdict: string;
  chartPoints: string;
  totalProducts: number;
  hotCount: number;
  nicheCount: number;
  avgEstRev: number;
}

function buildDemoHTML(d: DemoHTMLParams): string {
  // Gauge: viewBox 0 0 100 60, r=20, circumference=125.66
  // Start at full dashoffset (empty) — animated to real value on panel activation
  const gaugeCircumference = 125.66; // 2 * PI * 20

  const navItems: Array<[string, string, string]> = [
    ['📦','Products','products'],
    ['📊','Market','market'],
    ['🤖','Maya AI','maya'],
    ['💰','Revenue','revenue'],
    ['🔔','Alerts','alerts'],
  ];

  const navHTML = navItems.map(([icon, label, id]) => `
    <div class="mkr-nav-item" id="mkr-nav-${id}">
      <span class="mkr-nav-icon">${icon}</span>
      <span class="mkr-nav-label">${label}</span>
    </div>`).join('');

  return `
<div class="mkr-demo-wrapper">
  <!-- Browser chrome -->
  <div class="mkr-chrome">
    <div class="mkr-dots">
      <div class="mkr-dot" style="background:#FF5F57"></div>
      <div class="mkr-dot" style="background:#FFBD2E"></div>
      <div class="mkr-dot" style="background:#28C940"></div>
    </div>
    <div class="mkr-url-bar">
      <span class="mkr-url-lock">🔒</span>
      <span id="mkr-url-text" class="mkr-url-text">app.majorka.io</span>
    </div>
    <div class="mkr-chrome-actions">
      <div class="mkr-chrome-btn"></div>
      <div class="mkr-chrome-btn"></div>
    </div>
  </div>

  <!-- App body -->
  <div class="mkr-body">

    <!-- Sidebar -->
    <nav class="mkr-sidebar">
      <div class="mkr-logo">M</div>
      ${navHTML}
    </nav>

    <!-- Content -->
    <div class="mkr-content">

      <!-- PANEL 1: Product Intelligence -->
      <div class="mkr-panel mkr-panel-products mkr-panel-active" id="mkr-panel-products" style="z-index:1;pointer-events:auto">
        <div class="mkr-panel-header">
          <div>
            <div class="mkr-panel-title">Product Intelligence</div>
            <div class="mkr-panel-sub">${d.totalProducts.toLocaleString()} winning products tracked</div>
          </div>
          <div class="mkr-panel-badge">
            <span class="mkr-pulse"></span> Live AliExpress data
          </div>
        </div>
        <div class="mkr-table-header">
          <span>Product</span><span>Orders</span><span>Margin</span><span>Score</span>
        </div>
        <div class="mkr-table-body">
          ${d.productBodyHTML}
        </div>
      </div>

      <!-- PANEL 2: Market Intelligence -->
      <div class="mkr-panel mkr-panel-market" id="mkr-panel-market" style="z-index:0;pointer-events:none">
        <div class="mkr-panel-header">
          <div>
            <div class="mkr-panel-title">Market Intelligence</div>
            <div class="mkr-panel-sub">Real-time market signals across ${d.nicheCount} niches</div>
          </div>
        </div>
        <div class="mkr-market-grid">
          <div class="mkr-market-stat">
            <div class="mkr-market-stat-val" style="color:#34D399">${d.totalProducts.toLocaleString()}</div>
            <div class="mkr-market-stat-label">Products tracked</div>
          </div>
          <div class="mkr-market-stat">
            <div class="mkr-market-stat-val" style="color:#FB923C">${d.hotCount}</div>
            <div class="mkr-market-stat-label">Hot products</div>
          </div>
          <div class="mkr-market-stat">
            <div class="mkr-market-stat-val" style="color:#FBBF24">${d.avgScore}</div>
            <div class="mkr-market-stat-label">Avg score</div>
          </div>
        </div>
        <!-- Gauge: starts at dashoffset=125.66 (empty), animated on panel activation -->
        <div class="mkr-gauge-wrap">
          <svg width="100" height="60" viewBox="0 0 100 60">
            <circle cx="50" cy="30" r="20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
            <circle cx="50" cy="30" r="20" fill="none" stroke="#6366f1" stroke-width="5"
              stroke-dasharray="${gaugeCircumference}" stroke-dashoffset="${gaugeCircumference}"
              stroke-linecap="round" transform="rotate(-90 50 30)" class="mkr-gauge-fill"/>
          </svg>
          <div class="mkr-gauge-label">
            <div style="color:#6366f1;font-size:18px;font-weight:700">${d.avgScore}</div>
            <div style="color:rgba(255,255,255,0.4);font-size:9px">${d.gaugeVerdict}</div>
          </div>
        </div>
        <!-- Trend chart from real suggestion data -->
        <div class="mkr-chart-wrap">
          <div class="mkr-chart-label">Trend Velocity</div>
          <svg width="300" height="60" viewBox="0 0 300 60" class="mkr-chart-svg">
            <defs>
              <linearGradient id="mkr-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <polygon points="${d.chartPoints} 290,60 10,60" fill="url(#mkr-grad)"/>
            <polyline points="${d.chartPoints}" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mkr-chart-line"/>
          </svg>
        </div>
      </div>

      <!-- PANEL 3: Maya AI -->
      <div class="mkr-panel mkr-panel-maya" id="mkr-panel-maya" style="z-index:0;pointer-events:none">
        <div class="mkr-panel-header">
          <div class="mkr-panel-title">Maya AI</div>
          <div class="mkr-panel-sub">Your AI dropshipping advisor</div>
        </div>
        <div class="mkr-chat">
          <div class="mkr-chat-user">
            <div class="mkr-chat-bubble mkr-chat-user-bubble">
              What are the top niches to dropship right now?
            </div>
          </div>
          <div class="mkr-chat-ai">
            <div class="mkr-chat-avatar">M</div>
            <div class="mkr-chat-bubble mkr-chat-ai-bubble" id="mkr-maya-response">
              <span class="mkr-typing">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        </div>
        <div class="mkr-chat-input-row">
          <input class="mkr-chat-input" placeholder="Ask Maya anything..." readonly />
          <button class="mkr-chat-send">↑</button>
        </div>
      </div>

      <!-- PANEL 4: Revenue -->
      <div class="mkr-panel mkr-panel-revenue" id="mkr-panel-revenue" style="z-index:0;pointer-events:none">
        <div class="mkr-panel-header">
          <div>
            <div class="mkr-panel-title">Revenue Dashboard</div>
            <div class="mkr-panel-sub">Est. Potential — connect your store for real data</div>
          </div>
          <span class="mkr-badge mkr-badge-amber">DEMO</span>
        </div>
        <div class="mkr-revenue-grid">
          <div class="mkr-revenue-stat">
            <div class="mkr-revenue-label">Est. Potential / Day</div>
            <div class="mkr-revenue-val" style="color:#34D399">$${Math.round(d.avgEstRev).toLocaleString()}</div>
          </div>
          <div class="mkr-revenue-stat">
            <div class="mkr-revenue-label">Products tracked</div>
            <div class="mkr-revenue-val">${d.totalProducts.toLocaleString()}</div>
          </div>
        </div>
        <div class="mkr-disclaimer">📊 Sample estimates — connect Shopify for real revenue</div>
      </div>

      <!-- PANEL 5: Smart Alerts -->
      <div class="mkr-panel mkr-panel-alerts" id="mkr-panel-alerts" style="z-index:0;pointer-events:none">
        <div class="mkr-panel-header">
          <div class="mkr-panel-title">Smart Alerts</div>
          <div class="mkr-panel-sub">Opportunities detected from real product data</div>
        </div>
        <div class="mkr-alerts-list" id="mkr-alerts-list">
          ${d.alertsHTML}
        </div>
      </div>

    </div><!-- /mkr-content -->
  </div><!-- /mkr-body -->

  <!-- Cursor -->
  <div class="mkr-cursor" id="mkr-cursor"></div>
</div>`;
}

function startEngine(_data: DemoData, avgScore: number, mount: HTMLElement): () => void {
  const panels = ['products','market','maya','revenue','alerts'];
  let currentPanel = 0;
  let paused = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const panelUrls: Record<string, string> = {
    products: 'app.majorka.io/intelligence',
    market:   'app.majorka.io/market',
    maya:     'app.majorka.io/maya',
    revenue:  'app.majorka.io/revenue',
    alerts:   'app.majorka.io/alerts',
  };

  // Hover pause / resume
  mount.addEventListener('mouseenter', () => { paused = true; });
  mount.addEventListener('mouseleave', () => { paused = false; });

  function showPanel(id: string) {
    // Deactivate all panels
    mount.querySelectorAll('.mkr-panel').forEach(p => {
      p.classList.remove('mkr-panel-active');
      (p as HTMLElement).style.zIndex = '0';
      (p as HTMLElement).style.pointerEvents = 'none';
    });
    mount.querySelectorAll('.mkr-nav-item').forEach(n => n.classList.remove('mkr-nav-active'));

    // Activate target panel
    const panel = mount.querySelector(`#mkr-panel-${id}`) as HTMLElement | null;
    const nav   = mount.querySelector(`#mkr-nav-${id}`) as HTMLElement | null;
    if (panel) {
      panel.classList.add('mkr-panel-active');
      panel.style.zIndex = '1';
      panel.style.pointerEvents = 'auto';
    }
    if (nav) nav.classList.add('mkr-nav-active');

    // Update URL bar
    const urlEl = mount.querySelector('#mkr-url-text') as HTMLElement | null;
    if (urlEl) urlEl.textContent = panelUrls[id] || 'app.majorka.io';

    // Per-panel animations
    if (id === 'market') {
      const circumference = 125.66;
      const gaugeFill = mount.querySelector('.mkr-gauge-fill') as SVGCircleElement | null;
      if (gaugeFill) {
        gaugeFill.style.transition = 'none';
        gaugeFill.style.strokeDashoffset = String(circumference);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            gaugeFill.style.transition = 'stroke-dashoffset 1s ease';
            gaugeFill.style.strokeDashoffset = String(circumference * (1 - avgScore / 100));
          });
        });
      }
      const chartLine = mount.querySelector('.mkr-chart-line') as SVGPolylineElement | null;
      if (chartLine) {
        const len = (chartLine as any).getTotalLength?.() || 400;
        chartLine.style.strokeDasharray = String(len);
        chartLine.style.strokeDashoffset = String(len);
        chartLine.style.transition = 'none';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            chartLine.style.transition = 'stroke-dashoffset 1.2s ease';
            chartLine.style.strokeDashoffset = '0';
          });
        });
      }
    }

    if (id === 'alerts') animateAlerts();

    if (id === 'maya') {
      const t = setTimeout(animateMaya, 600);
      timers.push(t);
    }
  }

  function moveCursor(targetSelector: string, cb?: () => void) {
    const cursor = mount.querySelector('#mkr-cursor') as HTMLElement | null;
    const target = mount.querySelector(targetSelector) as HTMLElement | null;
    if (!cursor || !target) { cb?.(); return; }
    const rect  = target.getBoundingClientRect();
    const wRect = mount.getBoundingClientRect();
    cursor.style.left = (rect.left - wRect.left + rect.width / 2) + 'px';
    cursor.style.top  = (rect.top  - wRect.top  + rect.height / 2) + 'px';
    cursor.style.opacity = '1';
    cursor.classList.add('mkr-cursor-click');
    const t = setTimeout(() => { cursor.classList.remove('mkr-cursor-click'); cb?.(); }, 400);
    timers.push(t);
  }

  function animateAlerts() {
    [0,1,2].forEach((i) => {
      const t = setTimeout(() => {
        const el = mount.querySelector(`.mkr-alert-${i}`) as HTMLElement | null;
        if (el) { el.style.opacity = '1'; el.style.transform = 'translateX(0)'; el.style.transition = 'all 0.4s ease'; }
      }, i * 600);
      timers.push(t);
    });
  }

  function animateMaya() {
    const responseEl = mount.querySelector('#mkr-maya-response') as HTMLElement | null;
    if (!responseEl) return;
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What are the top 2 product niches to dropship right now based on current data?', demo: true }),
    }).then(r => r.json()).then(({ response }: { response?: string }) => {
      if (response && responseEl) {
        const text = response.substring(0, 150) + (response.length > 150 ? '…' : '');
        responseEl.innerHTML = `<span style="color:#F1F5F9;font-size:11px;line-height:1.5">${text}</span>`;
      }
    }).catch(() => {
      // Keep typing indicator on failure — never show fake text
    });
  }

  function nextPanel() {
    if (paused) return;
    const id = panels[currentPanel];
    moveCursor(`#mkr-nav-${id}`, () => {
      showPanel(id);
    });
    currentPanel = (currentPanel + 1) % panels.length;
  }

  // Start immediately, then cycle every 3500ms
  showPanel('products');
  mount.querySelector('#mkr-nav-products')?.classList.add('mkr-nav-active');
  const interval = setInterval(nextPanel, 3500);

  return () => {
    clearInterval(interval);
    timers.forEach(clearTimeout);
  };
}
