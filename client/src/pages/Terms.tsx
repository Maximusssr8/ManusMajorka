import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

const C = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#0A0A0A',
  secondary: '#6B7280',
  gold: '#4f8ef7',
};

const syne = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content:
      'These Terms of Service ("Terms") form a legally binding agreement between you ("User") and Majorka Pty Ltd ("Majorka"), Gold Coast, Queensland, Australia. By creating an account, accessing, or using the platform at majorka.io, you agree to be bound by these Terms. If you do not agree, do not use the platform.',
  },
  {
    title: 'The Service',
    content:
      'Majorka provides an AI-powered ecommerce intelligence and product research platform for dropshippers. Features include winning product discovery, supplier intelligence, ad creative generation, store builder, and analytics. We reserve the right to modify, suspend, or discontinue features at any time with reasonable notice.',
  },
  {
    title: 'Eligibility',
    content:
      'You must be at least 18 years of age and have the legal capacity to enter contracts in your jurisdiction. By registering, you confirm you meet these requirements and that the information you provide is accurate and complete.',
  },
  {
    title: 'Acceptable Use',
    content:
      'You agree not to: reverse engineer, scrape, or resell access to Majorka; use the platform for illegal purposes or to infringe third-party rights; share or transfer account credentials; upload malicious code or attempt to circumvent our access controls or paywalls; or use automated tools to extract data from the platform beyond our official API.',
  },
  {
    title: 'Subscriptions and Billing',
    content:
      'Subscriptions are billed monthly in AUD via Stripe (Builder $99/mo · Scale $199/mo). Your subscription renews automatically unless cancelled before the next renewal date via your account settings. Prices may change with 30 days written notice. You are responsible for all charges on your account including applicable taxes.',
  },
  {
    title: 'AI-Generated Content',
    content:
      'Majorka uses AI to generate product insights, ad copy, trend analysis, and other content. This content is provided for informational purposes only. We do not guarantee specific business outcomes, revenue, or profits from using AI-generated recommendations. You are responsible for verifying any content before using it commercially.',
  },
  {
    title: 'Intellectual Property',
    content:
      'Majorka and its underlying technology, data, design, and trademarks are owned by Majorka Pty Ltd. AI-generated outputs created using our platform are licensed to you for your business use. You retain ownership of data you upload to the platform. You may not copy, modify, or redistribute the platform itself.',
  },
  {
    title: 'Limitation of Liability',
    content:
      'To the maximum extent permitted by law, Majorka is not liable for indirect, incidental, consequential, or punitive damages, including loss of profits, revenue, or data. Our total aggregate liability to you in any month shall not exceed the subscription fees paid by you in that month.',
  },
  {
    title: 'Australian Consumer Law',
    content:
      'Nothing in these Terms limits your rights under the Competition and Consumer Act 2010 (Cth) or Australian Consumer Law, including any guarantees or remedies that cannot lawfully be excluded. These statutory rights apply regardless of any other provision in these Terms.',
  },
  {
    title: 'Termination',
    content:
      'We may suspend or terminate your account for breach of these Terms, non-payment, or abuse of the platform. You may cancel your account at any time via account settings. Termination does not entitle you to a refund except as provided in our Refund Policy. Upon termination, your access is revoked and stored data may be deleted after a 30-day grace period.',
  },
  {
    title: 'Dispute Resolution and Governing Law',
    content:
      'For disputes, please contact hello@majorka.io first — we commit to responding within 5 business days. If unresolved, these Terms are governed by the laws of Queensland, Australia, and disputes are subject to the exclusive jurisdiction of the courts of Queensland.',
  },
  {
    title: 'Updates to These Terms',
    content:
      'We may update these Terms from time to time. Material changes will be communicated via email with at least 14 days notice. Continued use of the platform after the notice period constitutes acceptance of the updated Terms. The current version is always available at majorka.io/terms.',
  },
  {
    title: 'Contact',
    content:
      'Majorka Pty Ltd · Gold Coast, Queensland, Australia · hello@majorka.io',
  },
];

export default function Terms() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: dm }}>
      <SEO
        title="Terms of Service — Majorka"
        description="Majorka Terms of Service: the legally binding agreement for using our ecommerce intelligence platform."
        path="/terms"
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
                background: 'linear-gradient(135deg, #4f8ef7, #4f8ef7)',
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

      {/* Content */}
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
            Terms of Service
          </h1>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6 }}>
            Last updated: 14 April 2026
          </p>
          <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            These Terms govern your use of the Majorka platform at{' '}
            <span style={{ color: C.gold }}>majorka.io</span>. Please read them carefully.
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
            <Link href="/cookies">
              <span
                style={{ color: C.secondary, fontSize: 13, cursor: 'pointer' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.gold)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.secondary)}
              >
                Cookie Policy
              </span>
            </Link>
            <Link href="/terms">
              <span style={{ color: C.gold, fontSize: 13, cursor: 'pointer' }}>Terms of Service</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
