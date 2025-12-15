'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscribeButtonProps {
  creatorId: string;
  tierId: string;
  tierName: string;
  price: number;
  currency?: string;
  subscriberId?: string;
  currentSubscription?: {
    tierId: string;
    status: string;
  } | null;
}

export function SubscribeButton({
  creatorId,
  tierId,
  tierName,
  price,
  currency = 'BGN',
  subscriberId,
  currentSubscription,
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isSubscribed = currentSubscription?.tierId === tierId && currentSubscription?.status === 'active';

  const handleSubscribe = async () => {
    if (!subscriberId) {
      router.push('/login');
      return;
    }

    if (isSubscribed) {
      router.push(`/creators/${creatorId}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId,
          creatorId,
          tierId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при създаване на абонамент');
      }

      // Success - refresh page or redirect
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Грешка при създаване на абонамент');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSubscribe}
        disabled={loading || isSubscribed}
        className={`w-full ${
          isSubscribed
            ? 'bg-muted text-muted-foreground'
            : 'gradient-primary text-white shadow-lg hover:shadow-xl'
        }`}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Обработване...
          </>
        ) : isSubscribed ? (
          '✓ Абониран'
        ) : (
          `Абонирай се - ${price} ${currency}/месец`
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
