import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";

const trustItems = [
  'Hourly Charter',
  'Airport Transfer',
  'Corporate Travel',
  'Special Events',
  'Accounts Available',
];

export default function HeroSection({ onBookNow }) {
  return (
    <div className="bg-black">

      {/* Mobile Nav */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px' }}>
        <a href="#" className="font-black text-white text-xl tracking-tighter" style={{ fontFamily: 'Georgia, serif' }}>SLIQUE</a>
        <div className="flex items-center gap-2">
          <a href="#fleet"
            onClick={e => { e.preventDefault(); document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-white border border-white/30 bg-black px-3 py-2"
            style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
            Fleet
          </a>
          <a href="#booking"
            onClick={e => { e.preventDefault(); document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-black bg-white px-3 py-2"
            style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
            Reserve
          </a>
          <a href="tel:+16122751722" className="text-white border border-white/30 px-3 py-2 flex items-center gap-1"
            style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 400 }}>
            <Phone size={11} /> Call
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-black" style={{ minHeight: '100svh' }}>

        {/* Background */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695c5a13600f408b85ae7545/42d14d85e_interior1.jpg')` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black" />
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex relative z-10 items-center justify-center text-center px-6 max-w-5xl mx-auto" style={{ minHeight: '100svh' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
            <p className="text-gray-400 tracking-[0.4em] uppercase text-sm mb-6">Minneapolis – St. Paul</p>
            <h1 className="text-7xl lg:text-8xl font-light text-white tracking-tight leading-none mb-6">
              <span className="block">ELEVATE YOUR</span>
              <span className="block font-semibold">JOURNEY</span>
            </h1>
            <div className="w-24 h-[1px] bg-white/30 mx-auto my-8" />
            <p className="text-gray-300 mb-12 text-xl font-normal leading-relaxed max-w-2xl mx-auto">
              Premium Chauffeur Services with Black Luxury SUVs and Sedans<br />
              Sophistication meets Seamless Transportation
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={onBookNow} className="bg-white text-black hover:bg-gray-100 px-10 py-6 text-sm tracking-widest uppercase font-medium">Reserve Now</Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-sm tracking-widest uppercase font-medium bg-transparent"
                onClick={() => document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' })}>View Fleet</Button>
            </div>
          </motion.div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden relative z-10 flex flex-col justify-between"
          style={{ minHeight: '100svh', paddingTop: 'calc(env(safe-area-inset-top) + 80px)', paddingBottom: '48px', paddingLeft: 20, paddingRight: 20 }}>

          {/* Top content */}
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#a3a3a3', marginBottom: 16 }}>Premium Chauffeur Services</p>
              <h1 className="font-light text-white leading-none" style={{ fontSize: 'clamp(46px, 13vw, 62px)', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Elevate Your<strong className="font-semibold block">Journey</strong>
              </h1>
              {/* Mobile trust strip */}
              <div className="overflow-hidden mt-5">
                <style>{`@keyframes marquee-m{from{transform:translateX(0)}to{transform:translateX(-50%)}}.trust-m{display:flex;width:max-content;animation:marquee-m 18s linear infinite}`}</style>
                <div className="trust-m">
                  {[...trustItems, ...trustItems].map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 20px', borderRight:'1px solid rgba(255,255,255,0.08)', whiteSpace:'nowrap' }}>
                      <span style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.3)', flexShrink:0 }} />
                      <span style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom actions */}
          <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.5 }}>
            <a href="#fleet" onClick={e => { e.preventDefault(); document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ display:'block', textAlign:'center', color:'white', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:400, padding:'16px 0', width:'min(100%, 640px)', border:'1px solid rgba(255,255,255,0.25)', background:'transparent' }}>
              View Fleet
            </a>
            <a href="#booking" onClick={e => { e.preventDefault(); document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ display:'block', textAlign:'center', color:'black', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:500, padding:'16px 0', width:'min(100%, 640px)', background:'white' }}>
              Reserve Now
            </a>
            <div style={{ width:96, height:1, background:'rgba(255,255,255,0.3)', marginTop:8 }} />
          </motion.div>
        </div>

        {/* Desktop scroll indicator */}
        <motion.div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="w-6 h-6 text-white/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* Desktop trust strip */}
      <div className="hidden md:block bg-[#0a0a0a] border-t border-white/[0.06] overflow-hidden">
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}.trust-marquee{display:flex;width:max-content;animation:marquee 24s linear infinite}.trust-marquee:hover{animation-play-state:paused}`}</style>
        <div className="trust-marquee">
          {[...trustItems, ...trustItems].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-8 py-4 border-r border-white/[0.06] whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500">{item}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
