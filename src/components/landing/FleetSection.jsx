import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Wifi, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const vehicles = [
  {
    name: "Mercedes-Benz AMG Sedan - Black",
    subtitle: "Premium Class",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695c5a13600f408b85ae7545/b6bf72161_sliqueAMG.png",
    passengers: "Up to 3",
    luggage: "2 Large Bags",
    features: ["Ambient Lighting", "Premium Leather", "Climate Control", "Tinted Windows"],
    type: "luxury_sedan"
  },
  {
    name: "Cadillac Escalade SUV - Black",
    subtitle: "Executive Class",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695c5a13600f408b85ae7545/3a79fb852_sliqueescalade.png",
    passengers: "Up to 6",
    luggage: "6 Large Bags",
    features: ["Presidential Seats", "Drink Refrigerator", "Ambient Lighting", "Tinted Windows"],
    type: "luxury_suv"
  },
  {
    name: "Mercedes-Benz Sprinter - Black",
    subtitle: "Premium Class",
    image: null,
    passengers: "Up to 15",
    luggage: "15 Large Bags",
    features: ["Ambient Lighting", "Business Seats", "Noise Insulation", "Tinted Windows"],
    type: "luxury_sprinter"
  },
  {
    name: "Stretch Limousine - Black",
    subtitle: "Executive Class",
    image: null,
    passengers: "Up to 10",
    luggage: "10 Large Bags",
    features: ["Presidential Seats", "Drink Refrigerator", "Ambient Lighting", "Tinted Windows"],
    type: "luxury_limo"
  }
];

export default function FleetSection() {
  return (
    <section id="fleet" className="bg-black py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-gray-500 tracking-[0.3em] uppercase text-xs mb-4">The Fleet</p>
          <h2 className="font-gothic text-5xl md:text-7xl text-white">
            Uncompromising Luxury
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.name}
              className="group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: (index % 2) * 0.2 }}
            >
              <div className="relative overflow-hidden mb-8">
                <div className="aspect-[16/10] overflow-hidden">
                  {vehicle.image ? (
                    <img
                      src={vehicle.image}
                      alt={`${vehicle.name} — ${vehicle.subtitle} available for hire in Minneapolis–St. Paul`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center gap-3 border border-white/10">
                      <div className="w-12 h-[1px] bg-white/20" />
                      <p className="text-white/20 text-xs tracking-[0.3em] uppercase">Image Coming Soon</p>
                      <div className="w-12 h-[1px] bg-white/20" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-xs tracking-[0.2em] uppercase mb-2">{vehicle.subtitle}</p>
                  <h3 className="font-gothic text-3xl md:text-4xl text-white">{vehicle.name}</h3>
                </div>

                <div className="flex gap-8 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" aria-hidden="true" />
                    <span>{vehicle.passengers}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Briefcase className="w-4 h-4" aria-hidden="true" />
                    <span>{vehicle.luggage}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
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
                  onClick={() => {
                    window.location.hash = `vehicle=${vehicle.type}`;
                    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full mt-6 bg-white text-black hover:bg-gray-100 tracking-[0.15em] uppercase text-xs py-6"
                >
                  Book This Vehicle
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}