import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Award, Users, Star } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: "Professional Chauffeurs",
    stat: "10+",
    description: "Years of combined experience in luxury transportation"
  },
  {
    icon: Clock,
    title: "On-Time Guarantee",
    stat: "100%",
    description: "Punctuality is our promise, tracked and measured relentlessly"
  },
  {
    type: "review",
    name: "Sydney",
    date: "April 2026",
    rating: 5,
    text: "Really nice car and excellent service. The best experience I've had in my entire career. Highly recommended."
  },
  {
    type: "review",
    name: "Brandon",
    date: "March 2026",
    rating: 5,
    text: "Need a good day? This is the perfect car. Smooth pick up and drop off. The owner is a very friendly young gentleman with a great personality."
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-[#0a0a0a] py-12 px-6 relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-gray-500 tracking-[0.3em] uppercase text-xs mb-4">Why Choose Us</p>
          <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
            THE <span className="font-semibold">DIFFERENCE</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-px bg-white/10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title || feature.name}
              className="bg-[#0a0a0a] p-10 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {feature.type === 'review' ? (
                <>
                  <div className="flex justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-white fill-white" />
                    ))}
                  </div>
                  <p className="text-white text-sm font-medium mb-2">{feature.name}</p>
                  <p className="text-gray-500 text-xs italic mb-4">{feature.date}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    "{feature.text}"
                  </p>
                </>
              ) : (
                <>
                  <feature.icon className="w-8 h-8 text-white/50 mx-auto mb-6" />
                  <p className="text-4xl md:text-5xl font-light text-white mb-2">{feature.stat}</p>
                  <h3 className="text-white text-sm font-medium tracking-wide mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}