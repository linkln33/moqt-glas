'use client';

import { useEffect, useState } from 'react';
import { Footer } from './footer';

export function FooterWrapper() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem('telegram_auth');
        setIsLoggedIn(!!authData && authData !== '{}');
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => checkAuth();
    window.addEventListener('auth-state-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Don't render footer if user is logged in
  if (isClient && isLoggedIn) {
    return null;
  }

  // Show footer for non-logged-in users or during SSR
  return <Footer />;
}
