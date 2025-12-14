import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { QuickNav } from '@/components/quick-nav';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Моят Глас - Български избори',
  description: 'Платформа за гласуване в българските избори',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#00966E',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
    shortcut: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg" className={inter.variable}>
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <Nav />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <QuickNav />
      </body>
    </html>
  );
}
