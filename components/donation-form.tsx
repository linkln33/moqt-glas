'use client';

import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Heart, Shield, Wallet, X } from 'lucide-react';

interface DonationFormProps {
  electionId: string;
  goal?: number;
  currentAmount?: number;
  currency?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const presetAmounts = [10, 25, 50, 100, 250, 500];
const supportedCurrencies = ['BGN', 'EUR', 'USD', 'USDC'];
const paymentMethods = [
  { id: 'card', label: 'Карта / Apple Pay / Google Pay', icon: Shield },
  { id: 'crypto', label: 'USDC (crypto)', icon: Wallet },
];

export function DonationForm({ 
  electionId, 
  goal = 0, 
  currentAmount = 0, 
  currency = 'BGN',
  onClose,
  onSuccess 
}: DonationFormProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const progress = goal > 0 ? Math.min((currentAmount / goal) * 100, 100) : 0;

  const handlePresetAmount = (preset: number) => {
    setAmount(preset);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    } else {
      setAmount('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const finalAmount = amount;
    if (!finalAmount || finalAmount <= 0) {
      setError('Моля, въведете сума за дарение');
      return;
    }

    setIsLoading(true);
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        window.location.href = '/login';
        return;
      }

      const parsed = JSON.parse(authData);
      const response = await fetch(`/api/elections/${electionId}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: parsed.telegramId,
          amount: finalAmount,
          currency: selectedCurrency,
          donorName: isAnonymous ? '' : (donorName || parsed.firstName || 'Анонимен'),
          donorMessage: donorMessage.trim() || null,
          isAnonymous,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при обработка на дарението');
      }

      // Success - close form and refresh
      setSuccessMessage(
        paymentMethod === 'crypto'
          ? 'Заявката за дарение е записана. Ще получите инструкции за USDC плащане.'
          : 'Дарението е успешно обработено.'
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Грешка при обработка на дарението');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>

        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            Подкрепи кампанията
          </GlassCardTitle>
        </GlassCardHeader>

        <GlassCardContent>
          {/* Progress Bar */}
          {goal > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Събрано</span>
                <span className="font-semibold">
                  {currentAmount.toFixed(2)} {currency} / {goal.toFixed(2)} {currency}
                </span>
              </div>
              <div className="w-full h-3 bg-background/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {progress.toFixed(1)}% от целта
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Preset Amounts */}
            <div>
              <Label className="mb-2 block">Изберете сума</Label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={amount === preset ? 'default' : 'outline'}
                    className={amount === preset ? 'gradient-primary text-white' : ''}
                    onClick={() => handlePresetAmount(preset)}
                  >
                    {preset} {currency}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Или въведете друга сума"
                value={customAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                min="1"
                step="0.01"
                className="mt-2"
              />
            </div>

            {/* Currency selector */}
            <div>
              <Label className="mb-2 block">Валута</Label>
              <div className="flex flex-wrap gap-2">
                {supportedCurrencies.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={selectedCurrency === c ? 'default' : 'outline'}
                    className={selectedCurrency === c ? 'gradient-primary text-white' : ''}
                    onClick={() => setSelectedCurrency(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div>
              <Label className="mb-2 block">Метод на плащане</Label>
              <div className="space-y-2">
                {paymentMethods.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id as 'card' | 'crypto')}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      paymentMethod === id
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border bg-background/40 hover:bg-background/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    {id === 'card' ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Карта, Apple Pay или Google Pay. Обработва се сигурно чрез платежен доставчик.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        USDC on-chain плащане. Ще получите инструкции след заявката.
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Donor Name */}
            {!isAnonymous && (
              <div>
                <Label htmlFor="donorName">Вашето име (по избор)</Label>
                <Input
                  id="donorName"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Как искате да се покажете"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <Label htmlFor="donorMessage">Съобщение (по избор)</Label>
              <Textarea
                id="donorMessage"
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
                placeholder="Напишете съобщение за подкрепа..."
                rows={3}
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground mt-1 text-right">
                {donorMessage.length}/200
              </div>
            </div>

            {/* Anonymous Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="isAnonymous" className="text-sm cursor-pointer">
                Анонимно дарение
              </Label>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
                {successMessage}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Отказ
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary text-white"
                disabled={!amount || amount <= 0 || isLoading}
              >
                {isLoading ? 'Обработване...' : `Дари ${amount} ${selectedCurrency}`}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              * Плащането ще бъде обработено чрез избрания метод
            </p>
          </form>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
