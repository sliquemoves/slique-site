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
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="bg-black">

      {/* ── Mobile Nav (hidden on md+) ── */}
      <nav
        className="md:hidden fixed top-0 left-0 right-0 z-50 grid"
        style={{
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: 'calc(env(safe-area-inset-top) + 12px) 14px 12px',
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}>
        {/* Logo — left */}
        <a href="#" style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em', color: '#fff', textDecoration: 'none', textTransform: 'uppercase' }}>
          SLIQUE
        </a>
        {/* Fleet + Reserve — center */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <a href="#fleet" onClick={e => { e.preventDefault(); scrollTo('fleet'); }}
            style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500, color: '#fff', background: '#000', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 12px', textDecoration: 'none' }}>
            Fleet
          </a>
          <a href="#booking" onClick={e => { e.preventDefault(); scrollTo('booking'); }}
            style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500, color: '#000', background: '#fff', padding: '8px 12px', textDecoration: 'none', border: 'none' }}>
            Reserve
          </a>
        </div>
        {/* Call — right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a href="tel:+16122751722"
            style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 400, color: '#fff', padding: '8px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Phone size={11} /> Call
          </a>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section id="hero" className="relative overflow-hidden bg-black" style={{ minHeight: '100svh' }}>

        {/* Background */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695c5a13600f408b85ae7545/42d14d85e_interior1.jpg')` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black" />
        </div>

        {/* ── DESKTOP layout ── */}
        <div className="hidden md:flex relative z-10 flex-col items-center justify-center text-center px-6"
          style={{ minHeight: '100svh' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }}>
            <p className="text-gray-200 tracking-[0.4em] uppercase text-sm mb-6 font-medium">Premium Chauffeur Services</p>
            <h1 className="text-7xl lg:text-8xl font-light text-white tracking-tight leading-none mb-0">
              <span className="block">ELEVATE YOUR</span>
              <span className="block font-semibold">JOURNEY</span>
            </h1>
          </motion.div>
        </div>

        {/* ── DESKTOP buttons + trust strip pinned above scroll arrow ── */}
        <motion.div
          className="hidden md:flex flex-col items-center gap-4 absolute z-10 left-1/2 -translate-x-1/2"
          style={{ bottom: '88px', width: '100vw' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }}>

          {/* Seamless trust strip */}
          <style>{`
            @keyframes marquee-desktop {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .marquee-track-d {
              display: flex;
              width: max-content;
              animation: marquee-desktop 18s linear infinite;
              will-change: transform;
            }
          `}</style>
          <div style={{ overflow: 'hidden', width: '100%', marginBottom: 20 }}>
            <div className="marquee-track-d">
              {[...trustItems, ...trustItems, ...trustItems, ...trustItems].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 32px', borderRight:'1px solid rgba(255,255,255,0.08)', whiteSpace:'nowrap', flexShrink:0 }}>
                  <span style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.35)', flexShrink:0 }} />
                  <span style={{ fontSize:10, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-sm tracking-widest uppercase font-medium bg-transparent"
              onClick={() => scrollTo('fleet')}>View Fleet</Button>
            <Button onClick={onBookNow} className="bg-white text-black hover:bg-gray-100 px-10 py-6 text-sm tracking-widest uppercase font-medium">Reserve Now</Button>
          </div>
          <div className="w-24 h-[1px] bg-white/30" />
        </motion.div>

        {/* ── MOBILE layout ── */}
        <div className="md:hidden relative z-10 flex flex-col justify-between"
          style={{ minHeight: '100svh', paddingTop: 'calc(env(safe-area-inset-top) + 80px)', paddingBottom: 48, paddingLeft: 20, paddingRight: 20 }}>

          {/* Top: eyebrow + title + trust strip */}
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#d4d4d4', marginBottom: 16, fontWeight: 500 }}>Premium Chauffeur Services</p>
              <h1 className="font-light text-white leading-none" style={{ fontSize: 'clamp(46px,13vw,62px)', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Elevate Your<strong className="font-semibold block">Journey</strong>
              </h1>
              {/* Mobile seamless trust strip */}
              <style>{`
                @keyframes marquee-mobile {
                  0%   { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .marquee-track-m {
                  display: flex;
                  width: max-content;
                  animation: marquee-mobile 32s linear infinite;
                  will-change: transform;
                }
              `}</style>
              <div style={{ overflow: 'hidden', marginTop: 20 }}>
                <div className="marquee-track-m">
                  {[...trustItems, ...trustItems, ...trustItems, ...trustItems, ...trustItems, ...trustItems, ...trustItems, ...trustItems].map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 20px', borderRight:'1px solid rgba(255,255,255,0.08)', whiteSpace:'nowrap', flexShrink:0 }}>
                      <span style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.3)', flexShrink:0 }} />
                      <span style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom: View Fleet → Reserve Now → rule */}
          <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.5 }}>
            <a href="#fleet" onClick={e => { e.preventDefault(); scrollTo('fleet'); }}
              style={{ display:'block', textAlign:'center', color:'white', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:400, padding:'16px 0', width:'min(100%, 640px)', border:'1px solid rgba(255,255,255,0.25)', background:'transparent', textDecoration:'none' }}>
              View Fleet
            </a>
            <a href="#booking" onClick={e => { e.preventDefault(); scrollTo('booking'); }}
              style={{ display:'block', textAlign:'center', color:'black', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:500, padding:'16px 0', width:'min(100%, 640px)', background:'white', textDecoration:'none' }}>
              Reserve Now
            </a>
            <div style={{ width:96, height:1, background:'rgba(255,255,255,0.3)', marginTop:8 }} />
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display:'flex', justifyContent:'center', marginTop:6 }}
            >
              <ChevronDown className="w-4 h-4 text-white/30" />
            </motion.div>
          </motion.div>
        </div>

        {/* Desktop scroll indicator */}
        <motion.div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          <motion.div animate={{ y: [0,10,0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            <ChevronDown className="w-6 h-6 text-white/50" />
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
