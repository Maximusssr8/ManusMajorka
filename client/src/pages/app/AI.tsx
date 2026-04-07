import { Link } from 'wouter';
import { Sparkles, Megaphone, Store, PenTool, Eye, BarChart3, ArrowUpRight } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

interface ToolCard {
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  tag: string;
  title: string;
  body: string;
  href: string;
}

const TOOLS: ToolCard[] = [
  { icon: Sparkles, tag: 'Maya AI',       title: 'Your AI ecommerce strategist',    body: 'Ask anything — Maya knows your market, your products, and your plan.', href: '/app/ai-chat' },
  { icon: Megaphone, tag: 'Ads Studio',   title: 'Meta + TikTok ad creative',       body: '5 headline variants, VSL scripts, AU-specific angles — ready to launch.', href: '/app/ads-studio' },
  { icon: Store,    tag: 'Store Builder', title: 'Zero to live store in 7 minutes', body: 'Build with AI from your niche, or connect existing Shopify in one click.', href: '/app/store-builder' },
  { icon: PenTool,  tag: 'Ad Briefs',     title: 'Generate ad briefs from data',    body: 'Discover winning ad angles based on competitor signals and product trends.', href: '/app/ad-spy' },
  { icon: Eye,      tag: 'Competitor Spy', title: 'Decode any competitor store',    body: 'Revenue estimates, top SKUs, ad spend signals, and tech stack.', href: '/app/competitor-spy' },
  { icon: BarChart3, tag: 'Profit Calc',  title: 'Know your margin before launch',  body: 'Real break-even CPA and monthly projections in seconds.', href: '/app/profit' },
];

export default function AppAI() {
  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: display, fontWeight: 600, fontSize: 28, color: '#ededed', letterSpacing: '-0.025em', margin: '0 0 6px' }}>AI Tools</h1>
        <p style={{ fontFamily: sans, fontSize: 14, color: '#71717a', margin: 0 }}>
          Six AI-powered tools — from research to creative to launch.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.tag} href={tool.href} style={{
              background: '#111114',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '24px 26px',
              display: 'block',
              textDecoration: 'none',
              transition: 'border-color 200ms, background 200ms, transform 200ms',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                e.currentTarget.style.background = '#0e0e10';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = '#111114';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'rgba(99,102,241,0.12)',
                color: '#6366F1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
                border: '1px solid rgba(99,102,241,0.25)',
              }}><Icon size={16} /></div>
              <div style={{
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                color: '#6366F1',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>{tool.tag}</div>
              <h3 style={{
                fontFamily: display,
                fontWeight: 700,
                fontSize: 17,
                color: '#ededed',
                letterSpacing: '-0.015em',
                margin: '0 0 10px',
                lineHeight: 1.25,
              }}>{tool.title}</h3>
              <p style={{
                fontFamily: sans,
                fontSize: 13,
                color: '#71717a',
                lineHeight: 1.55,
                margin: '0 0 16px',
              }}>{tool.body}</p>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: sans,
                fontSize: 13,
                color: '#6366F1',
                fontWeight: 600,
              }}>Open <ArrowUpRight size={13} /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
