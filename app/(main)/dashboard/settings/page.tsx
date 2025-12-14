'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Building2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PaymentDetails {
  id?: string;
  payment_method: 'bank_transfer' | 'paypal' | 'stripe' | 'revolut' | 'wise' | 'other';
  bank_name?: string;
  bank_account_holder_name: string;
  bank_account_number?: string;
  bank_swift_bic?: string;
  paypal_email?: string;
  stripe_account_id?: string;
  revolut_email?: string;
  wise_email?: string;
  is_verified: boolean;
  is_active: boolean;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [user, setUser] = useState<any>(null);
  const [availableFunds, setAvailableFunds] = useState<{ total: number; currency: string } | null>(null);

  useEffect(() => {
    loadUserData();
    loadPaymentDetails();
    loadAvailableFunds();
  }, []);

  const loadUserData = () => {
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (authData) {
        setUser(JSON.parse(authData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadPaymentDetails = async () => {
    setLoading(true);
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) return;

      const parsed = JSON.parse(authData);
      const response = await fetch(`/api/user/payment-details?telegramId=${parsed.telegramId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data.paymentDetails || null);
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableFunds = async () => {
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) return;

      const parsed = JSON.parse(authData);
      const response = await fetch(`/api/user/available-funds?telegramId=${parsed.telegramId}`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailableFunds(data);
      }
    } catch (error) {
      console.error('Error loading available funds:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        alert('Моля, влезте в системата');
        return;
      }

      const parsed = JSON.parse(authData);
      const response = await fetch('/api/user/payment-details', {
        method: paymentDetails?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: parsed.telegramId,
          ...paymentDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при запазване');
      }

      setPaymentDetails(data.paymentDetails);
      alert('Данните са запазени успешно!');
      loadPaymentDetails();
    } catch (error: any) {
      alert(error.message || 'Грешка при запазване на данните');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PaymentDetails, value: any) => {
    setPaymentDetails((prev) => ({
      ...prev || {
        payment_method: 'bank_transfer',
        bank_account_holder_name: '',
        is_verified: false,
        is_active: true,
      },
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Настройки
          </h1>
          <p className="text-muted-foreground">
            Управление на профила и платежни данни
          </p>
        </div>

        {/* Available Funds */}
        {availableFunds && availableFunds.total > 0 && (
          <GlassCard className="mb-6">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Налични средства
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-3xl font-bold mb-2">
                {availableFunds.total.toFixed(2)} {availableFunds.currency}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Сумата, която можете да изтеглите от вашите кампании
              </p>
              {paymentDetails?.is_verified ? (
                <Button className="gradient-primary text-white">
                  Заяви изтегляне
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Моля, добавете и потвърдете платежните си данни за да изтеглите средства</span>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Payment Details Form */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Платежни данни</GlassCardTitle>
            <GlassCardDescription>
              Добавете вашите банкови или платежни данни, за да получавате средства от кампаниите си
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {paymentDetails?.is_verified && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500">Вашите данни са потвърдени</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method */}
              <div>
                <Label>Метод на плащане</Label>
                <select
                  value={paymentDetails?.payment_method || 'bank_transfer'}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm mt-2"
                >
                  <option value="bank_transfer">Банков превод (България)</option>
                  <option value="paypal">PayPal</option>
                  <option value="revolut">Revolut</option>
                  <option value="wise">Wise</option>
                  <option value="stripe">Stripe</option>
                  <option value="other">Друг</option>
                </select>
              </div>

              {/* Bank Transfer Fields */}
              {paymentDetails?.payment_method === 'bank_transfer' && (
                <>
                  <div>
                    <Label>Име на банка</Label>
                    <Input
                      value={paymentDetails?.bank_name || ''}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      placeholder="Напр: УниКредит Булбанк"
                    />
                  </div>
                  <div>
                    <Label>Име на собственика на сметката *</Label>
                    <Input
                      value={paymentDetails?.bank_account_holder_name || ''}
                      onChange={(e) => handleInputChange('bank_account_holder_name', e.target.value)}
                      placeholder="Име и фамилия"
                      required
                    />
                  </div>
                  <div>
                    <Label>IBAN номер *</Label>
                    <Input
                      value={paymentDetails?.bank_account_number || ''}
                      onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                      placeholder="BG18BNBG96611020345678"
                      required
                    />
                  </div>
                  <div>
                    <Label>BIC/SWIFT код</Label>
                    <Input
                      value={paymentDetails?.bank_swift_bic || ''}
                      onChange={(e) => handleInputChange('bank_swift_bic', e.target.value)}
                      placeholder="BNBGBGSD"
                    />
                  </div>
                </>
              )}

              {/* PayPal */}
              {paymentDetails?.payment_method === 'paypal' && (
                <div>
                  <Label>PayPal имейл *</Label>
                  <Input
                    type="email"
                    value={paymentDetails?.paypal_email || ''}
                    onChange={(e) => handleInputChange('paypal_email', e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              )}

              {/* Revolut */}
              {paymentDetails?.payment_method === 'revolut' && (
                <div>
                  <Label>Revolut имейл *</Label>
                  <Input
                    type="email"
                    value={paymentDetails?.revolut_email || ''}
                    onChange={(e) => handleInputChange('revolut_email', e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              )}

              {/* Wise */}
              {paymentDetails?.payment_method === 'wise' && (
                <div>
                  <Label>Wise имейл *</Label>
                  <Input
                    type="email"
                    value={paymentDetails?.wise_email || ''}
                    onChange={(e) => handleInputChange('wise_email', e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              )}

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="text-sm text-amber-500">
                    <p className="font-semibold mb-1">Важно:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Вашите платежни данни ще бъдат проверени преди първото изтегляне</li>
                      <li>Всички данни се съхраняват сигурно и криптирано</li>
                      <li>Ще получите известие след потвърждение</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Отказ
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white"
                  disabled={saving}
                >
                  {saving ? 'Запазване...' : 'Запази данните'}
                </Button>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
