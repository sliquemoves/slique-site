import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Mixed chauffeur services + daily-rental occasions, interleaved so any
// visible slice of the marquee shows a balance of both sides of the business.
const trustItems = [
  'Hourly Charter',
  'Daily Rentals',
  'Airport Transfer',
  'Fast Exotics',
  'Corporate Travel',
  'Date Night',
  'Special Events',
  'Weekend Fun',
  'Accounts Available',
  'Photo Shoots',
  'Chauffeurs',
];

/* ────────────────────────────────────────────────────────────────
   TrustStrip — a truly seamless, infinitely-flowing marquee.

   How it loops without a visible jump:
     • The track contains the items duplicated EXACTLY TWICE (A + A).
     • We animate translateX from 0 → -50%.
     • At -50%, the second copy sits exactly where the first copy
       started, so the reset from -50% back to 0 is pixel-identical.
     • The second copy is aria-hidden so screen readers don't
       announce the list twice.
   ──────────────────────────────────────────────────────────────── */
function TrustStrip({ variant = 'desktop' }) {
  const isMobile = variant === 'mobile';

  const itemPadding  = isMobile ? '8px 20px' : '10px 32px';
  const itemGap      = isMobile ? 8 : 10;
  const fontSize     = isMobile ? 9 : 10;
  const animName     = isMobile ? 'trust-marquee-m' : 'trust-marquee-d';
  const trackClass   = isMobile ? 'trust-track-m'   : 'trust-track-d';

  // Repeat items inside each half enough times to guarantee the half
  // is wider than any realistic viewport. This is what kills the
  // "strip runs out mid-screen" gap: each half on its own overflows
  // the viewport, so as copy A exits left, copy B is already filling
  // the right edge with no empty space between them.
  const REPEATS_PER_HALF = 4;
  const halfItems = Array.from({ length: REPEATS_PER_HALF }).flatMap(() => trustItems);

  // Hold a constant per-item scroll speed no matter how many items are in
  // the strip (~9s/item desktop, ~8s/item mobile across one half). With the
  // original 5 items this resolves to the hand-tuned 180s / 160s.
  const duration = (isMobile ? 8 : 9) * REPEATS_PER_HALF * trustItems.length;

  const renderSet = (ariaHidden) =>
    halfItems.map((item, i) => (
      <div
        key={`${ariaHidden ? 'b' : 'a'}-${i}`}
        aria-hidden={ariaHidden || undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: itemGap,
          padding: itemPadding,
          borderRight: '1px solid rgba(255,255,255,0.08)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
        <span style={{ fontSize, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
          {item}
        </span>
      </div>
    ));

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        .${trackClass} {
          display: flex;
          width: max-content;
          animation: ${animName} ${duration}s linear infinite;
          will-change: transform;
        }
        /* Pause on hover for desktop users who want to read */
        @media (hover: hover) {
          .${trackClass}:hover { animation-play-state: paused; }
        }
        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .${trackClass} { animation: none; }
        }
      `}</style>

      <div
        style={{
          overflow: 'hidden',
          width: '100%',
          // Fade edges so items flow in/out rather than hard-clipping
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
          maskImage:
            'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
        }}
      >
        <div className={trackClass}>
          {renderSet(false)}
          {renderSet(true)}
        </div>
      </div>
    </>
  );
}

function useActiveSection() {
  const [section, setSection] = useState('hero');

  useEffect(() => {
    const sectionIds = ['hero', 'fleet', 'features'];

    const observe = () => {
      const scrollY = window.scrollY + window.innerHeight * 0.35;
      let active = 'hero';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= scrollY) {
          active = id;
        }
      }
      setSection(active);
    };

    window.addEventListener('scroll', observe, { passive: true });
    observe();
    return () => window.removeEventListener('scroll', observe);
  }, []);

  return section;
}

export default function HeroSection() {
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const activeSection = useActiveSection();

  const showFleet = activeSection !== 'fleet';

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
        {/* Fleet — center, scroll-aware */}
        <div style={{ display: 'flex', justifyContent: 'center', minHeight: 34 }}>
          {showFleet && (
            <a href="#fleet" onClick={e => { e.preventDefault(); scrollTo('fleet'); }}
              style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500, color: '#fff', background: '#000', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 16px', textDecoration: 'none', transition: 'opacity 0.25s', borderRadius: 9999 }}>
              Fleet
            </a>
          )}
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

        {/* Background — solid black. Clean and sharp; pulls the eye to the
            animated trust strip. (Hero photo intentionally removed for now.) */}
        <div className="absolute inset-0 bg-black" />

        {/* ── DESKTOP layout ── */}
        <div className="hidden md:flex relative z-10 flex-col items-center justify-center text-center px-6"
          style={{ minHeight: '100svh' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }}>
            <p className="text-gray-200 tracking-[0.4em] uppercase text-sm mb-6 font-medium">Premium Vehicle Services</p>
            <h1 className="text-7xl lg:text-8xl font-light text-white tracking-tight leading-none mb-0">
              <span className="block">EXCELLENCE IN</span>
              <span className="block font-semibold">MOTION</span>
            </h1>
          </motion.div>
        </div>

        {/* ── DESKTOP buttons + trust strip pinned above scroll arrow ── */}
        <motion.div
          className="hidden md:flex flex-col items-center gap-4 absolute z-10 left-1/2 -translate-x-1/2"
          style={{ bottom: '88px', width: '100vw' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }}>

          {/* Full-bleed seamless trust strip */}
          <div style={{ width: '100%', marginBottom: 20 }}>
            <TrustStrip variant="desktop" />
          </div>

          <div className="flex justify-center">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-sm tracking-widest uppercase font-medium bg-transparent"
              onClick={() => scrollTo('fleet')}>View Fleet</Button>
          </div>
          <div className="w-24 h-[1px] bg-white/30" />
        </motion.div>

        {/* ── MOBILE layout ── */}
        <div className="md:hidden relative z-10 flex flex-col justify-between"
          style={{ minHeight: '100svh', paddingTop: 'calc(env(safe-area-inset-top) + 80px)', paddingBottom: 48, paddingLeft: 20, paddingRight: 20 }}>

          {/* Top: eyebrow + title + trust strip */}
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }} style={{ width: '100%' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#d4d4d4', marginBottom: 16, fontWeight: 500 }}>Premium Vehicle Services</p>
              <h1 className="font-light text-white leading-none" style={{ fontSize: 'clamp(46px,13vw,62px)', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Excellence in<strong className="font-semibold block">Motion</strong>
              </h1>

              {/* Full-bleed seamless trust strip — extends past the padded container */}
              <div style={{ marginTop: 20, marginLeft: -20, marginRight: -20 }}>
                <TrustStrip variant="mobile" />
              </div>
            </motion.div>
          </div>

          {/* Bottom: View Fleet → rule */}
          <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.5 }}>
            <a href="#fleet" onClick={e => { e.preventDefault(); scrollTo('fleet'); }}
              style={{ display:'block', textAlign:'center', color:'white', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:400, padding:'16px 0', width:'min(100%, 640px)', border:'1px solid rgba(255,255,255,0.25)', background:'transparent', textDecoration:'none', borderRadius:9999 }}>
              View Fleet
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
