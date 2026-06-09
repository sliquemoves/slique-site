import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, Gauge, Timer, Wind, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RentalInquiryModal from './RentalInquiryModal';
import ChauffeurBookingModal from './ChauffeurBookingModal';

// ── Chauffeur fleet (the original business) ──────────────────────────────────
const vehicles = [
  {
    name: "Cadillac Escalade SUV - Black",
    subtitle: "Executive Class",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695c5a13600f408b85ae7545/3a79fb852_sliqueescalade.png",
    passengers: "Up to 6",
    luggage: "6 Large Bags",
    features: ["Presidential Seats", "Drink Refrigerator", "Ambient Lighting", "Tinted Windows"],
    type: "escalade_suv"
  },
  {
    name: "Mercedes Benz Maybach - Black",
    subtitle: "Executive Class",
    image: "/slique_maybach.png",
    passengers: "Up to 2",
    luggage: "2 Large Bags",
    features: ["Presidential Seats", "Drink Refrigerator", "Ambient Lighting", "Tinted Windows"],
    type: "mercedes_amg"
  },
  {
    name: "Mercedes Benz Sprinter - Black",
    subtitle: "Executive Class",
    image: "/slique_van.png",
    passengers: "Up to 15",
    luggage: "15 Large Bags",
    features: ["VIP Lounge Interior", "Noise Insulation", "Ambient Lighting", "Tinted Windows"],
    type: "mercedes_sprinter"
  },
  {
    name: "Mercedes Benz Limousine - Black",
    subtitle: "Executive Class",
    image: "/slique_limo.png",
    passengers: "Up to 10",
    luggage: "10 Large Bags",
    features: ["VIP Lounge Interior", "Premium Bar", "Ambient Lighting", "Tinted Windows"],
    type: "mercedes_limo"
  }
];

// ── Daily rentals (the new self-drive performance line) ──────────────────────
// Specs are real-world figures; `rate` is a placeholder daily price — edit freely.
const rentals = [
  {
    name: "Porsche 718 S",
    tagline: "Mid-Engine Roadster",
    image: "/rentals/porsche_718s.png",
    hp: 350, zeroToSixty: "4.0s", topSpeed: "177", drive: "RWD",
    rate: 249,
    type: "porsche_718s",
  },
  {
    name: "Mercedes-AMG C43",
    tagline: "Sport Sedan",
    image: "/rentals/amg_c43.png",
    hp: 402, zeroToSixty: "4.6s", topSpeed: "155", drive: "AWD",
    rate: 149,
    type: "amg_c43",
  },
  {
    name: "Corvette C8",
    tagline: "Mid-Engine Supercar",
    image: "/rentals/corvette_c8.png",
    hp: 495, zeroToSixty: "2.9s", topSpeed: "194", drive: "RWD",
    rate: 399,
    type: "corvette_c8",
  },
  {
    name: "Tesla Model Y Performance",
    tagline: "Electric",
    image: "/rentals/tesla_model_y.png",
    hp: 456, zeroToSixty: "3.5s", topSpeed: "155", drive: "AWD · EV",
    rate: 149,
    type: "tesla_model_y",
  },
  {
    name: "Mercedes-AMG CLE 53",
    tagline: "Sport Coupe",
    image: "/rentals/amg_cle53.png",
    hp: 443, zeroToSixty: "4.2s", topSpeed: "155", drive: "AWD",
    rate: 499,
    type: "amg_cle53",
  },
  {
    name: "Corvette C8 Z06",
    tagline: "Track-Bred Supercar",
    image: "/rentals/corvette_c8_z06.png",
    hp: 670, zeroToSixty: "2.6s", topSpeed: "195", drive: "RWD",
    rate: 699,
    type: "corvette_c8_z06",
  },
];

// Image with a graceful gradient fallback if the photo isn't present yet.
function CarImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="w-full h-full"
      style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 60%, #000 100%)' }}
    >
      {!failed && (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
    </div>
  );
}

// ── Segmented toggle ─────────────────────────────────────────────────────────
function FleetToggle({ value, onChange }) {
  const tabs = [
    { id: 'chauffeur', label: 'Chauffeur' },
    { id: 'rentals',   label: 'Daily Rentals' },
  ];
  return (
    <div className="flex justify-center mb-10 md:mb-14">
      <div
        className="relative inline-flex p-1"
        style={{ border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9999 }}
      >
        {tabs.map(tab => {
          const active = value === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="relative px-6 md:px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-medium transition-colors duration-300"
              style={{ borderRadius: 9999, color: active ? '#000' : 'rgba(255,255,255,0.6)', zIndex: 1 }}
            >
              {active && (
                <motion.span
                  layoutId="fleet-toggle-pill"
                  className="absolute inset-0"
                  style={{ background: '#fff', borderRadius: 9999, zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Rental card ──────────────────────────────────────────────────────────────
function RentalCard({ rental, index, onRequest }) {
  const specs = [
    { icon: Gauge, label: 'Horsepower', value: `${rental.hp}` },
    { icon: Timer, label: '0–60 mph',   value: rental.zeroToSixty },
    { icon: Wind,  label: 'Top Speed',  value: `${rental.topSpeed} mph` },
    { icon: Cog,   label: 'Drivetrain', value: rental.drive },
  ];
  return (
    <motion.div
      className="group w-full overflow-hidden flex flex-col"
      style={{
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: '18px',
        background: 'rgba(255,255,255,0.02)',
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
    >
      <div className="relative overflow-hidden">
        <div className="aspect-[16/10] overflow-hidden">
          <CarImage src={rental.image} alt={rental.name} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        {/* Rate badge */}
        <div
          className="absolute top-3 right-3 px-3 py-1.5 text-xs text-white"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          <span className="font-semibold">${rental.rate}</span>
          <span className="text-white/60">/day</span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl text-white font-light tracking-wide text-center mb-5">{rental.name}</h3>

        {/* Performance spec grid */}
        <div className="grid grid-cols-2 gap-px mb-6" style={{ background: 'rgba(255,255,255,0.08)' }}>
          {specs.map(s => (
            <div key={s.label} className="bg-black px-3 py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                <s.icon className="w-3 h-3" />
                <span className="text-[9px] tracking-[0.15em] uppercase">{s.label}</span>
              </div>
              <span className="text-white text-sm font-medium">{s.value}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={() => onRequest(rental)}
          className="w-full mt-auto bg-white text-black hover:bg-gray-100 tracking-[0.15em] uppercase text-xs py-5 rounded-none"
        >
          Request Rental
        </Button>
      </div>
    </motion.div>
  );
}

export default function FleetSection() {
  const [tab, setTab] = useState('chauffeur');
  const [activeRental, setActiveRental] = useState(null);
  const [activeVehicle, setActiveVehicle] = useState(null);

  // The Reserve band (and any other CTA) can switch the active tab via a
  // window event before scrolling here.
  useEffect(() => {
    const handler = (e) => {
      if (e.detail === 'chauffeur' || e.detail === 'rentals') setTab(e.detail);
    };
    window.addEventListener('slique:fleetTab', handler);
    return () => window.removeEventListener('slique:fleetTab', handler);
  }, []);

  return (
    <section id="fleet" className="bg-black py-8 px-0 md:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-gray-500 tracking-[0.3em] uppercase text-xs mb-4">The Fleet</p>
          <h2 className="text-3xl md:text-5xl font-light text-white tracking-tight">
            UNCOMPROMISING <span className="font-semibold">LUXURY</span>
          </h2>
        </motion.div>

        <FleetToggle value={tab} onChange={setTab} />

        <AnimatePresence mode="wait">
          {tab === 'chauffeur' ? (
            <motion.div
              key="chauffeur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-items-center px-4 md:px-0"
            >
              {vehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.name}
                  className="group mx-auto w-full lg:mx-0 lg:max-w-none lg:w-full"
                  style={{
                    maxWidth: '88%',
                    border: '3px solid rgba(255,255,255,0.32)',
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '0 0 28px 0',
                    overflow: 'hidden',
                  }}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  <div className="relative overflow-hidden mb-8">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  </div>

                  <div className="space-y-4 text-center px-6">
                    <div>
                      <p className="text-gray-500 text-xs tracking-[0.2em] uppercase mb-2">{vehicle.subtitle}</p>
                      <h3 className="text-3xl md:text-3xl text-white font-light tracking-wide">{vehicle.name}</h3>
                    </div>

                    <div className="flex gap-8 text-sm justify-center">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{vehicle.passengers}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Briefcase className="w-4 h-4" />
                        <span>{vehicle.luggage}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 justify-center">
                      {vehicle.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs text-gray-500 border border-white/10 px-3 py-1.5 tracking-wide"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <Button
                      onClick={() => setActiveVehicle(vehicle)}
                      className="w-full mt-6 bg-white text-black hover:bg-gray-100 tracking-[0.15em] uppercase text-xs py-6"
                    >
                      Book This Vehicle
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="rentals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
                {rentals.map((rental, index) => (
                  <RentalCard
                    key={rental.type}
                    rental={rental}
                    index={index}
                    onRequest={setActiveRental}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RentalInquiryModal car={activeRental} onClose={() => setActiveRental(null)} />
      <ChauffeurBookingModal vehicle={activeVehicle} onClose={() => setActiveVehicle(null)} />
    </section>
  );
}
