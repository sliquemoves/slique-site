import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import FleetSection from '@/components/landing/FleetSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import FooterSection from '@/components/landing/FooterSection';

// Multi-city expansion preview (/more): identical to Home except the fleet
// section shows the Minneapolis/Atlanta/Phoenix city toggle. Once the
// expansion is approved, move showCityFilter onto Home's FleetSection and
// this page can be retired.
export default function HomePreview() {
  return (
    <main className="bg-black">
      <HeroSection />
      <FleetSection showCityFilter />
      <FeaturesSection />
      <FooterSection />
    </main>
  );
}
