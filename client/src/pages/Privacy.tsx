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

const syne = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

const SECTIONS = [
  {
    title: 'Information We Collect',
    content:
      'We collect information you provide directly to us when you create an account, such as your name and email address. We also automatically collect certain information when you use the service, including usage data, device information, and log data such as IP address, browser type, and pages visited.',
  },
  {
    title: 'How We Use Your Information',
    content:
      'We use the information we collect to provide, maintain, and improve our services; process transactions; send you technical notices and support messages; respond to your comments and questions; and send you marketing communications (where permitted by law). We also use data to personalise your AI tool experience and generate insights relevant to your business context.',
  },
  {
    title: 'Information Sharing',
    content:
      'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. We may share your information with trusted third-party service providers who assist us in operating our platform (such as Supabase for database hosting and Anthropic for AI processing), subject to confidentiality agreements. We may also disclose information when required by law or to protect our rights.',
  },
  {
    title: 'Data Security',
    content:
      'We implement industry-standard security measures to protect your personal information, including encryption in transit (TLS) and at rest. Access to your data is restricted to authorised personnel only. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.',
  },
  {
    title: 'Data Retention',
    content:
      'We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time. Certain information may be retained for a period after deletion as required by law or for legitimate business purposes.',
  },
  {
    title: 'Your Rights',
    content:
      'Depending on your jurisdiction, you may have rights regarding your personal data including the right to access, correct, or delete your information. To exercise any of these rights, please contact us at the address below. We will respond to requests within 30 days.',
  },
  {
    title: 'Contact Us',
    content:
      'If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@majorka.io. We are based in Gold Coast, Queensland, Australia.',
  },
];

export default function Privacy() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: dm }}>
      <SEO
        title="Privacy Policy — Majorka"
        description="Majorka privacy policy: how we collect, use, and protect your personal information."
        path="/privacy"
      />

      {/* Nav */}
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
            style={{
              fontSize: 14,
              color: C.secondary,
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.gold)}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.secondary)}
          >
            ← Back to home
          </span>
        </Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 96px' }}>
        {/* Header */}
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
            Privacy Policy
          </h1>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6 }}>
            Last updated: 13 March 2026
          </p>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            Majorka ("we", "us", or "our") is committed to protecting your privacy. This policy
            explains how we collect, use, and safeguard your information when you use our platform
            at <span style={{ color: C.gold }}>majorka.io</span>.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.border, marginBottom: 48 }} />

        {/* Sections */}
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
              <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.75 }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.border, margin: '56px 0 40px' }} />

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: C.secondary, fontSize: 13 }}>© 2026 Majorka. All rights reserved.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
            <Link href="/terms">
              <span
                style={{ color: C.secondary, fontSize: 13, cursor: 'pointer' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.gold)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.secondary)}
              >
                Terms of Service
              </span>
            </Link>
            <Link href="/privacy">
              <span style={{ color: C.gold, fontSize: 13, cursor: 'pointer' }}>Privacy Policy</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
