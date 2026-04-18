import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Building2, Sparkles, Clock } from 'lucide-react';

const services = [
  {
    icon: Clock,
    title: "Hourly Charter",
    description: "Flexible hourly bookings for multiple stops, tours, or extended engagements."
  },
  {
    icon: Plane,
    title: "Airport Transfers",
    description: "Seamless pickups and drop-offs at MSP International. Flight tracking included."
  },
  {
    icon: Building2,
    title: "Corporate Travel",
    description: "Impress clients and executives with punctual, professional chauffeur service."
  },
  {
    icon: Sparkles,
    title: "Special Events",
    description: "Weddings, galas, and celebrations deserve an arrival that makes a statement."
  }
];

export default function ServicesSection() {
  return (
    <section id="services" className="bg-[#0a0a0a] py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-gray-500 tracking-[0.3em] uppercase text-xs mb-4">Our Services</p>
          <h2 className="font-gothic text-5xl md:text-7xl text-white">
            Tailored Excellence
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="border border-white/10 p-8 h-full transition-all duration-500 hover:border-white/30 hover:bg-white/[0.02]" aria-label={`${service.title}: ${service.description}`}>
                <service.icon className="w-8 h-8 text-white/70 mb-6 transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
                <h3 className="text-white text-lg font-medium mb-3 tracking-wide">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}