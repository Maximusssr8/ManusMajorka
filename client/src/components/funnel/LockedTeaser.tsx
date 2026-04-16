import type { ReactElement, ReactNode } from 'react';
import { Link } from 'wouter';
import { Lock } from 'lucide-react';
import { useSubscriptionTier, type FeatureKey } from '@/hooks/useSubscriptionTier';

export type LockedFeature =
  | 'ads.image-gen'
  | 'creators.matrix'
  | 'ads.brief-full'
  | 'academy.tracks'
  | 'spy.competitor-matrix'
  | 'store-builder.unlimited'
  | 'alerts.unlimited';

export type LockedTier = 'builder' | 'scale';

interface LockedTeaserProps {
  feature: LockedFeature;
  tier?: LockedTier;
  /** The real content the user would see if unlocked. Rendered blurred behind the overlay. */
  children: ReactNode;
  /** Optional override copy. */
  headline?: string;
}

interface CopyEntry {
  headline: string;
  featureGateKey?: FeatureKey;
}

const LOSS_AVERSION_COPY: Record<LockedFeature, CopyEntry> = {
  'ads.image-gen': {
    headline: "You're writing copy in the dark. Scale users see real ad creative generated for their exact product.",
    featureGateKey: 'ads.image-gen',
  },
  'creators.matrix': {
    headline: "Your competitors already know which 47 AU creators are making $10k+ from dropshipping. You don't \u2014 yet.",
    featureGateKey: 'creators.matrix',
  },
  'ads.brief-full': {
    headline: 'Scale operators get a 6-paragraph briefing on every product. Free tier sees the first line.',
    featureGateKey: 'ads.brief-full',
  },
  'academy.tracks': {
    headline: 'Track 1 teaches you to FIND winners. Tracks 2+3 teach you to SELL them. Scale unlocks both.',
    featureGateKey: 'academy.track-2',
  },
  'spy.competitor-matrix': {
    headline: 'Scale users see every competitor\u2019s top-selling SKUs, ad spend, and refund rate. You\u2019re guessing.',
    featureGateKey: 'spy.competitor-matrix',
  },
  'store-builder.unlimited': {
    headline: 'Builders hit 3 stores and stop. Scale operators launch, kill, and relaunch until one hits.',
    featureGateKey: 'store-builder.unlimited',
  },
  'alerts.unlimited': {
    headline: 'Free tier sees the first 10 alerts. Scale operators see every price change, sellout, and restock \u2014 live.',
    featureGateKey: 'alerts.unlimited',
  },
};

export function LockedTeaser({ feature, tier = 'scale', children, headline }: LockedTeaserProps): ReactElement {
  const { isFeatureUnlocked } = useSubscriptionTier();
  const copy = LOSS_AVERSION_COPY[feature];
  const resolvedHeadline = headline ?? copy.headline;

  const unlocked = copy.featureGateKey ? isFeatureUnlocked(copy.featureGateKey) : false;
  if (unlocked) {
    return <>{children}</>;
  }

  const tierLabel = tier === 'builder' ? 'Builder' : 'Scale';
  const upgradeHref = `/pricing?highlight=${encodeURIComponent(feature)}`;

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', isolation: 'isolate' }}>
      {/* Blurred underlay */}
      <div
        aria-hidden="true"
        style={{
          filter: 'blur(6px) saturate(0.6)',
          opacity: 0.55,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {children}
      </div>
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background:
            'radial-gradient(ellipse at center, rgba(17,17,20,0.6) 0%, rgba(10,10,10,0.9) 70%)',
          textAlign: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(79,142,247,0.12)',
            border: '1px solid rgba(79,142,247,0.4)',
            color: '#4f8ef7',
          }}
        >
          <Lock size={18} strokeWidth={2.5} />
        </div>
        <p
          style={{
            maxWidth: 480,
            margin: 0,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 15,
            lineHeight: 1.55,
            color: '#ededed',
            fontWeight: 500,
          }}
        >
          {resolvedHeadline}
        </p>
        <Link
          href={upgradeHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 44,
            padding: '0 20px',
            background:
              'linear-gradient(135deg, #4f8ef7 0%, #f4d77a 50%, #4f8ef7 100%)',
            color: '#0d1117',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 999,
            textDecoration: 'none',
            boxShadow: '0 8px 24px -8px rgba(79,142,247,0.5)',
          }}
        >
          Upgrade to {tierLabel} &rarr;
        </Link>
      </div>
    </div>
  );
}
