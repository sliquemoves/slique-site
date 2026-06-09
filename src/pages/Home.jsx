import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import FleetSection from '@/components/landing/FleetSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import FooterSection from '@/components/landing/FooterSection';

export default function Home() {
  return (
    <main className="bg-black">
      <HeroSection />
      <FleetSection />
      <FeaturesSection />
      <FooterSection />
    </main>
  );
}
