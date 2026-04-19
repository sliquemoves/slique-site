import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Wifi, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const vehicles = [
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
    name: "Mercedes Benz Limousine - Black",
    subtitle: "Executive Class",
    image: "/slique_limo.png",
    passengers: "Up to 10",
    luggage: "10 Large Bags",
    features: ["VIP Lounge Interior", "Premium Bar", "Ambient Lighting", "Tinted Windows"],
    type: "stretch_limo"
  },
  {
    name: "Mercedes Benz Sprinter - Black",
    subtitle: "Premium Class",
    image: "/slique_van.png",
    passengers: "Up to 15",
    luggage: "15 Large Bags",
    features: ["VIP Lounge Interior", "Noise Insulation", "Ambient Lighting", "Tinted Windows"],
    type: "sprinter_van"
  },
  {
    name: "Mercedes Benz AMG - Black",
    subtitle: "Premium Class",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695c5a13600f408b85ae7545/b6bf72161_sliqueAMG.png",
    passengers: "Up to 2",
    luggage: "2 Large Bags",
    features: ["Premium Leather", "Climate Control", "Ambient Lighting", "Tinted Windows"],
    type: "luxury_sedan"
  }
];

export default function FleetSection() {
  return (
    <section id="fleet" className="bg-black py-12 md:py-32 px-0 md:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12 md:mb-20"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.name}
              className="group mx-auto w-full lg:mx-0 lg:max-w-none"
              style={{ maxWidth: '88%' }}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              <div className="space-y-4 text-center">
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