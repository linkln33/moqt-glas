'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

function CreateCreatorProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const telegramId = searchParams.get('telegramId');

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    bioBg: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get user info from localStorage to pre-fill display name
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.first_name) {
          setFormData(prev => ({
            ...prev,
            displayName: parsed.first_name + (parsed.last_name ? ` ${parsed.last_name}` : ''),
            username: parsed.username || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.displayName.trim()) {
      setError('Показваното име е задължително');
      return;
    }

    if (!telegramId) {
      setError('Невалиден потребителски идентификатор');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/creators/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          displayName: formData.displayName.trim(),
          username: formData.username.trim() || null,
          bio: formData.bio.trim() || null,
          bioBg: formData.bioBg.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Грешка при създаване на профила');
      }

      // Success - redirect to creator dashboard
      router.push('/dashboard/creator');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Грешка при създаване на профила');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-2xl mx-auto">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Създай профил като създател</GlassCardTitle>
            <GlassCardDescription>
              Попълни информацията по-долу, за да създадеш профил като създател
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="displayName">Показвано име *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Име на създателя"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Потребителско име</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                  placeholder="username"
                />
                <p className="text-xs text-muted-foreground">
                  Само букви, цифри и долна черта
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Биография (English)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bioBg">Биография (Български)</Label>
                <Textarea
                  id="bioBg"
                  value={formData.bioBg}
                  onChange={(e) => setFormData(prev => ({ ...prev, bioBg: e.target.value }))}
                  placeholder="Разкажи ни за себе си..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Link href="/dashboard/creator" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Отказ
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 gradient-primary text-white shadow-lg"
                >
                  {loading ? 'Създаване...' : 'Създай профил'}
                </Button>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}

export default function CreateCreatorProfilePage() {
  return (
    <Suspense fallback={
      <div className="py-6">
        <div className="max-w-2xl mx-auto">
          <GlassCard>
            <GlassCardContent className="py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Зареждане...</p>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    }>
      <CreateCreatorProfileContent />
    </Suspense>
  );
}
