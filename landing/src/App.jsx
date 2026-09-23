import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Modalities } from './components/Modalities';
import { Security } from './components/Security';
import { ForDrivers } from './components/ForDrivers';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('uniwheels-theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('uniwheels-theme', theme);
  }, [theme]);

  // Listener para sincronización con preferencias del sistema si no hay preferencia manual
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem('uniwheels-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Hero />
        <HowItWorks />
        <Modalities />
        <Security onOpenPrivacy={() => setIsPrivacyOpen(true)} />
        <ForDrivers />
        <FAQ onOpenPrivacy={() => setIsPrivacyOpen(true)} />
      </main>

      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />
      
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
