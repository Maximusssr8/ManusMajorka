export default function DocsPlaceholder() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#04060f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      textAlign: 'center',
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#4f8ef7',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.12em',
        marginBottom: 24,
      }}>
        MAJORKA API
      </span>
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 40,
        fontWeight: 700,
        color: '#ffffff',
        margin: '0 0 16px',
        lineHeight: 1.1,
      }}>
        Documentation
      </h1>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 17,
        color: '#8b949e',
        lineHeight: 1.6,
        maxWidth: 480,
        margin: '0 0 32px',
      }}>
        Full API docs, integration guides, and endpoint references are coming soon.
        Join the Discord for early access and direct support.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href="https://discord.gg/njVjqrG8"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: '#ffffff',
            background: '#4f8ef7',
            border: 'none',
            borderRadius: 10,
            padding: '14px 28px',
            textDecoration: 'none',
            transition: 'background 200ms',
          }}
        >
          Join Discord →
        </a>
        <a
          href="/"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            fontWeight: 500,
            color: '#8b949e',
            background: 'transparent',
            border: '1px solid #161b22',
            borderRadius: 10,
            padding: '14px 28px',
            textDecoration: 'none',
            transition: 'border-color 200ms',
          }}
        >
          Back to home
        </a>
      </div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: '#4b5563',
        marginTop: 48,
      }}>
        Questions? <a href="mailto:support@majorka.io" style={{ color: '#4f8ef7', textDecoration: 'none' }}>support@majorka.io</a>
      </p>
    </div>
  );
}
