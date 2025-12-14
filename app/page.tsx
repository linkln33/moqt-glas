import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          МОКТ Глас
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Платформа за гласуване в българските избори
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/elections">
            <Button size="lg" className="w-full sm:w-auto">
              Виж изборите
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Влез с Telegram
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Безопасно гласуване</CardTitle>
            <CardDescription>
              Защитено с Telegram автентификация и анти-измамни технологии
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Уникална идентификация на устройство</li>
              <li>✓ Защита срещу дублирани гласове</li>
              <li>✓ Анализ на риск и поведение</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Лесно и бързо</CardTitle>
            <CardDescription>
              Гласувайте бързо и удобно от вашия мобилен телефон
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Един клик с Telegram</li>
              <li>✓ Мобилно-оптимизиран интерфейс</li>
              <li>✓ Резултати в реално време</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
