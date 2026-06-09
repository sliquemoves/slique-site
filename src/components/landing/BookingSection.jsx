import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

// ─── Reserve band ──────────────────────────────────────────────────────────────
// Slim call-to-action that replaced the old full booking form. Booking now
// happens in the per-vehicle pop-ups on the fleet, so this just funnels people
// there with the right tab pre-selected. Keeps id="booking" so every "Reserve"
// link and the scroll-aware nav continue to work.
export default function BookingSection() {
  const goToFleet = (fleetTab) => {
    window.dispatchEvent(new CustomEvent('slique:fleetTab', { detail: fleetTab }));
    document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="booking"
      className="px-6 pt-14 pb-20"
      style={{
        // White section. Top 40px fades black→transparent so it blends from the
        // dark section above with no hard seam (matches the old form section).
        backgroundColor: '#ffffff',
        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0px, rgba(0,0,0,0) 40px)',
      }}
    >
      <motion.div
        className="max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-gray-400 tracking-[0.3em] uppercase text-xs mb-4">Book Now</p>
        <h2 className="text-4xl md:text-5xl font-light text-black tracking-tight">
          READY WHEN <span className="font-semibold">YOU ARE</span>
        </h2>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto mt-6 leading-relaxed">
          Pick your vehicle and reserve in under a minute — no long forms.
          Chauffeured black-car service, or a self-drive exotic for the weekend.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Button
            onClick={() => goToFleet('chauffeur')}
            className="group bg-black text-white hover:bg-gray-900 px-10 py-6 text-sm tracking-widest uppercase font-medium rounded-none"
          >
            Chauffeur Fleet
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            onClick={() => goToFleet('rentals')}
            variant="outline"
            className="group bg-transparent text-black border border-black hover:bg-black hover:text-white px-10 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-colors"
          >
            Daily Rentals
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
