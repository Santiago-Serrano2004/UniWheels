import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Modalities } from './components/Modalities';
import { Security } from './components/Security';
import { ForDrivers } from './components/ForDrivers';
import { ForUniversities } from './components/ForUniversities';
import { Waitlist } from './components/Waitlist';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';

export default function App() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const abrirPrivacidad = () => setIsPrivacyOpen(true);

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[var(--color-papel)] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Modalities />
        <Security onOpenPrivacy={abrirPrivacidad} />
        <ForDrivers />
        <ForUniversities />
        <Waitlist onOpenPrivacy={abrirPrivacidad} />
        <FAQ onOpenPrivacy={abrirPrivacidad} />
      </main>
      <Footer />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
}
