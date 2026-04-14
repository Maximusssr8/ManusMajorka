import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const C = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#0A0A0A',
  secondary: '#6B7280',
  gold: '#6366F1',
};

const syne = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

const SECTIONS = [
  {
    title: 'What Are Cookies',
    content:
      'Cookies are small text files stored on your device by your browser when you visit a website. They allow us to recognise your device, remember your preferences, and provide a secure, personalised experience on the Majorka platform.',
  },
  {
    title: 'Essential Cookies',
    content:
      'Required for core platform functionality — authentication, session management, security (CSRF protection), and remembering your regional settings. These cookies cannot be disabled without breaking sign-in and other critical features. They never contain personally identifiable information beyond what is needed to keep you logged in.',
  },
  {
    title: 'Analytics Cookies',
    content:
      'We use PostHog to understand how users interact with our platform so we can improve features and user experience. PostHog data is pseudonymised and stored in the European Union. We do not share analytics data with advertisers. You may opt out of analytics cookies via your browser settings or by emailing privacy@majorka.io.',
  },
  {
    title: 'Preference Cookies',
    content:
      'We store your theme preference (light/dark), selected region (AU, US, UK, etc.), currency display, and onboarding progress so the experience is consistent across sessions. These cookies contain no personally identifying information and are stored only on your device.',
  },
  {
    title: 'What We Do Not Use',
    content:
      'Majorka does not use advertising cookies, third-party tracking pixels, or cross-site retargeting tags. We do not sell cookie data to third parties. We do not participate in ad-tech bidding networks.',
  },
  {
    title: 'Third-Party Services',
    content:
      'Some features rely on trusted third parties that may set their own cookies: Stripe (payment processing, PCI-DSS compliant), Supabase (authentication tokens), and Vercel (hosting and CDN). Each of these providers is contractually bound to handle your data in accordance with applicable privacy laws.',
  },
  {
    title: 'Cookie Consent',
    content:
      'By continuing to use Majorka, you consent to our use of essential cookies. For analytics cookies, you may opt out at any time via browser settings or by contacting privacy@majorka.io. We will never override your explicit opt-out preferences.',
  },
  {
    title: 'Managing Cookies in Your Browser',
    content:
      'Most browsers let you view, manage, and delete cookies via Settings → Privacy. You can also block cookies entirely, but note that disabling essential cookies will prevent you from signing in or using core features of the platform.',
  },
  {
    title: 'Updates to This Policy',
    content:
      'We may update this Cookie Policy from time to time to reflect changes in our practices or for legal and regulatory reasons. The current version is always available at majorka.io/cookies. Material changes will be communicated via email.',
  },
  {
    title: 'Contact Us',
    content:
      'For questions about our cookie practices, contact privacy@majorka.io. Majorka Pty Ltd · Gold Coast, Queensland, Australia.',
  },
];

export default function Cookies() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: dm }}>
      <SEO
        title="Cookie Policy — Majorka"
        description="Majorka Cookie Policy: what cookies we use, why we use them, and how to manage them."
        path="/cookies"
      />

      <nav
        style={{
          borderBottom: `1px solid ${C.border}`,
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: syne,
                fontWeight: 800,
                fontSize: 16,
                color: '#FAFAFA',
              }}
            >
              M
            </div>
            <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 17, color: C.text }}>
              Majorka
            </span>
          </div>
        </Link>
        <Link href="/">
          <span
            style={{ fontSize: 14, color: C.secondary, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.gold)}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.secondary)}
          >
            ← Back to home
          </span>
        </Link>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 96px' }}>
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              color: C.gold,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Legal
          </p>
          <h1
            style={{
              fontFamily: syne,
              fontWeight: 800,
              fontSize: 40,
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Cookie Policy
          </h1>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6 }}>
            Last updated: 14 April 2026
          </p>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            This policy explains how Majorka uses cookies and similar technologies on{' '}
            <span style={{ color: C.gold }}>majorka.io</span>.
          </p>
        </div>

        <div style={{ height: 1, background: C.border, marginBottom: 48 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {SECTIONS.map((section, i) => (
            <div key={i}>
              <h2
                style={{
                  fontFamily: syne,
                  fontWeight: 700,
                  fontSize: 18,
                  color: C.text,
                  marginBottom: 12,
                }}
              >
                {i + 1}. {section.title}
              </h2>
              <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.75 }}>{section.content}</p>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: C.border, margin: '56px 0 40px' }} />

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: C.secondary, fontSize: 13 }}>© 2026 Majorka Pty Ltd. All rights reserved.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
            <Link href="/privacy">
              <span
                style={{ color: C.secondary, fontSize: 13, cursor: 'pointer' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.gold)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.secondary)}
              >
                Privacy Policy
              </span>
            </Link>
            <Link href="/terms">
              <span
                style={{ color: C.secondary, fontSize: 13, cursor: 'pointer' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.gold)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.secondary)}
              >
                Terms of Service
              </span>
            </Link>
            <Link href="/cookies">
              <span style={{ color: C.gold, fontSize: 13, cursor: 'pointer' }}>Cookie Policy</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
