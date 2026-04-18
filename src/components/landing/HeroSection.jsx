import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function HeroSection({ onBookNow }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695c5a13600f408b85ae7545/42d14d85e_interior1.jpg')`
        }}>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-24 md:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}>

          <p className="text-gray-400 tracking-[0.4em] uppercase text-xs md:text-sm mb-6">
            Minneapolis – St. Paul
          </p>
          
          <h1 className="font-gothic text-7xl md:text-9xl lg:text-[10rem] text-white leading-none mb-6" style={{ letterSpacing: '-0.02em' }}>
            <span className="block">ELEVATE YOUR</span>
            <span className="block">JOURNEY</span>
          </h1>

          <div className="w-24 h-[1px] bg-white/30 mx-auto my-8" />

          <p className="text-gray-300 mb-12 mx-auto text-lg font-normal text-center leading-relaxed md:text-xl max-w-2xl">
            Premium Chauffeur Services | Black Luxury Vehicles.<br />
            Sophistication meets Seamless Transportation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onBookNow}
              className="bg-white text-black hover:bg-gray-100 px-10 py-6 text-sm tracking-widest uppercase font-medium transition-all duration-300">

              Reserve Now
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-sm tracking-widest uppercase font-medium bg-transparent"
              onClick={() => document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' })}>

              View Fleet
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>

          <ChevronDown className="w-6 h-6 text-white/50" />
        </motion.div>
      </motion.div>
    </section>);

}