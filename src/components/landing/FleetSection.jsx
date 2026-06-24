import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Users, Gauge, Timer, Wind, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RentalInquiryModal from './RentalInquiryModal';
import ChauffeurBookingModal from './ChauffeurBookingModal';
import { CHAUFFEUR_VEHICLES as vehicles, DAILY_RENTALS as rentals } from '@/lib/fleet';

// Daily-rental filters — matched against each car's `body` / `brand` tag.
const FILTERS = ['coupe', 'suv', 'mercedes', 'corvette'];
// Price sort options.
const SORTS = [{ id: 'asc', label: 'Low → Hi' }, { id: 'desc', label: 'Hi → Low' }];

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
        border: '1px solid #ffffff',
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
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid #ffffff' }}
        >
          <span className="font-semibold">${rental.rate}</span>
          <span className="text-white/60">/day</span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-2xl xl:text-xl text-white font-bold tracking-wide text-center mb-5" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{rental.name}</h3>

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
          className="w-full mt-auto bg-white text-black hover:bg-gray-100 tracking-[0.15em] uppercase text-xs py-5 rounded-full"
        >
          Book
        </Button>
      </div>
    </motion.div>
  );
}

export default function FleetSection() {
  const [tab, setTab] = useState('chauffeur');
  const [activeRental, setActiveRental] = useState(null);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [filter, setFilter] = useState(null);
  const [sort, setSort] = useState(null);

  // Fade the fleet section in as it's scrolled to, and back out when the user
  // scrolls up toward the hero (opacity tracks the section's top vs viewport).
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'start start'] });
  const fleetOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  // A car matches the active filter by body type OR brand. No filter = all.
  const filtered = filter
    ? rentals.filter(r => r.body === filter || r.brand === filter)
    : rentals;
  // A category filter auto-sorts low→high; the manual sort buttons only apply
  // (and only show) when no category filter is active.
  const effectiveSort = filter ? 'asc' : sort;
  const visibleRentals = effectiveSort
    ? [...filtered].sort((a, b) => (effectiveSort === 'asc' ? a.rate - b.rate : b.rate - a.rate))
    : filtered;

  return (
    <section id="fleet" ref={sectionRef} className="bg-black pt-0 pb-8 px-0 md:px-6">
      <motion.div style={{ opacity: fleetOpacity }} className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
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
                    border: '1px solid #ffffff',
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
                      <h3 className="font-display text-4xl md:text-4xl text-white font-bold tracking-wide">{vehicle.name}</h3>
                    </div>

                    <div className="flex text-sm justify-center">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{vehicle.passengers}</span>
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
                      Reserve
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
              {/* Minimal filters (one line) + price sort — click an active one to clear it. */}
              <div className="-mt-6 md:-mt-8 mb-8 md:mb-10 flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-x-5 gap-y-2 flex-wrap">
                  {FILTERS.map(opt => {
                    const active = filter === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFilter(active ? null : opt)}
                        className={`text-[10px] tracking-[0.25em] uppercase pb-0.5 border-b transition-colors ${active ? 'text-white border-white' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {!filter && (
                  <div className="flex items-center justify-center gap-x-5">
                    {SORTS.map(s => {
                      const active = sort === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSort(active ? null : s.id)}
                          className={`text-[10px] tracking-[0.2em] uppercase pb-0.5 border-b transition-colors ${active ? 'text-white border-white' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {visibleRentals.length === 0 ? (
                <p className="text-center text-gray-600 text-[11px] tracking-[0.25em] uppercase py-16">
                  None available
                </p>
              ) : (
                // Flex + justify-center: 2/3/4 columns; partial last rows auto-center.
                <div className="flex flex-wrap justify-center gap-6 px-4 md:px-0">
                  {visibleRentals.map((rental, index) => (
                    <div
                      key={rental.type}
                      className="w-full sm:w-[calc(50%_-_12px)] lg:w-[calc(33.333%_-_16px)] xl:w-[calc(25%_-_18px)]"
                    >
                      <RentalCard rental={rental} index={index} onRequest={setActiveRental} />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <RentalInquiryModal car={activeRental} onClose={() => setActiveRental(null)} />
      <ChauffeurBookingModal vehicle={activeVehicle} onClose={() => setActiveVehicle(null)} />
    </section>
  );
}
