import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

export interface SubscriptionData {
  plan: string;
  status: string;
  subscribed: boolean;
}

export function useSubscription() {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = () => {
    if (!session?.access_token) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/subscription/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then((d: SubscriptionData) => {
        setSubscription(d);
        setLoading(false);
      })
      .catch(() => {
        setSubscription(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  return { subscription, loading, refetch };
}
