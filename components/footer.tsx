import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { href: '/elections', label: 'Избори' },
      { href: '/dashboard', label: 'Табло' },
      { href: '/dashboard/create', label: 'Създай избор' },
    ],
    legal: [
      { href: '/privacy', label: 'Поверителност' },
      { href: '/terms', label: 'Условия' },
      { href: '/about', label: 'За нас' },
    ],
    support: [
      { href: '/contact', label: 'Контакти' },
      { href: '/help', label: 'Помощ' },
      { href: '/faq', label: 'Често задавани въпроси' },
    ],
  };

  return (
    <footer className="border-t border-border/50 glass backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Моят Глас
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Платформа за демократично гласуване в българските избори. 
              Прозрачно, сигурно и достъпно за всички.
            </p>
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Платформа</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Правна информация</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Поддръжка</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {currentYear} Моят Глас. Всички права запазени.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Изградено с{' '}
              <span className="text-primary">❤️</span>
              {' '}за България
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
