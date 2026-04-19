import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import FleetSection from '@/components/landing/FleetSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BookingSection from '@/components/landing/BookingSection';
import FooterSection from '@/components/landing/FooterSection';

export default function Home() {
  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="bg-black">
      <HeroSection onBookNow={scrollToBooking} />
      <FleetSection />
      <FeaturesSection />
      <BookingSection />
      <FooterSection />
    </main>
  );
}