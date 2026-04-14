import { C } from '@/lib/designTokens';
import { proxyImage } from '@/lib/imageProxy';
import { getFormatSpec, type AdFormat } from './FormatTabs';

interface AdPreviewProps {
  format: AdFormat;
  image: string | null;
  headline: string;
  body: string;
  cta: string;
  brandName: string;
}

export default function AdPreview({ format, image, headline, body, cta, brandName }: AdPreviewProps) {
  const spec = getFormatSpec(format);
  const isMeta = spec.platform === 'meta';
  const aspect = spec.aspect;

  const frame = {
    width: 300,
    minHeight: 540,
    background: isMeta ? '#ffffff' : '#000000',
    color: isMeta ? '#050505' : '#ffffff',
    borderRadius: 28,
    overflow: 'hidden',
    border: `8px solid ${C.border}`,
    boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8)',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  };

  const proxied = proxyImage(image) ?? '';
  const imgAspect = aspect === '1:1' ? '1 / 1' : '9 / 16';

  if (isMeta) {
    return (
      <div style={frame}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderBottom: '1px solid #e4e6eb' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1877f2',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {brandName.charAt(0).toUpperCase() || 'M'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#050505' }}>{brandName || 'Your Store'}</div>
            <div style={{ fontSize: 11, color: '#65676b' }}>Sponsored · AU</div>
          </div>
        </div>

        {/* Body text above image (Meta feed style) */}
        <div style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
          {body || 'Your primary text appears here once you generate copy.'}
        </div>

        {/* Image */}
        <div
          style={{
            width: '100%',
            aspectRatio: imgAspect,
            background: '#e4e6eb',
            overflow: 'hidden',
          }}
        >
          {proxied && (
            <img src={proxied} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>

        {/* CTA bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 10,
            background: '#f0f2f5',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: '#65676b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {(brandName || 'yourstore').toLowerCase().replace(/\s/g, '')}.com.au
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#050505',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {headline || 'Your headline'}
            </div>
          </div>
          <button
            type="button"
            style={{
              padding: '6px 12px',
              background: '#e4e6eb',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 12,
              color: '#050505',
              cursor: 'pointer',
            }}
          >
            {cta || 'Shop now'}
          </button>
        </div>
      </div>
    );
  }

  // TikTok UI
  return (
    <div style={frame}>
      <div
        style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          aspectRatio: imgAspect,
          background: '#111',
          overflow: 'hidden',
        }}
      >
        {proxied && (
          <img
            src={proxied}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.75)',
            }}
          />
        )}

        {/* Right side action bar */}
        <div
          style={{
            position: 'absolute',
            right: 8,
            bottom: 90,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {['♥', '💬', '↗'].map((icon, i) => (
            <div
              key={i}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 16,
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Bottom caption stack */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 56,
            bottom: 70,
            color: '#fff',
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>@{(brandName || 'yourstore').toLowerCase().replace(/\s/g, '')}</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{headline || 'Your hook'}</div>
          <div style={{ opacity: 0.95, whiteSpace: 'pre-wrap' }}>{body || 'Your body copy shows here.'}</div>
        </div>

        {/* CTA pill */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 12,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <button
            type="button"
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#fe2c55',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {cta || 'Shop now'}
          </button>
        </div>
      </div>
    </div>
  );
}
