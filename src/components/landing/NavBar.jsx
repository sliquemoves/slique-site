import React, { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Fleet', href: '#fleet' },
  { label: 'Reserve', href: '#booking' },
];

/**
 * Which mobile top-bar buttons to show per section:
 *   hero        → Fleet + Reserve
 *   fleet       → Reserve only
 *   features    → Fleet + Reserve
 *   booking     → Fleet only
 */
function useActiveSection() {
  const [section, setSection] = useState('hero');

  useEffect(() => {
    const sectionIds = ['hero', 'fleet', 'features', 'booking'];

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

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection = useActiveSection();

  // Fade the button for the section you're currently in
  const showFleet   = activeSection !== 'fleet';
  const showReserve = activeSection !== 'booking';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (href) => {
    setMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-black/95 backdrop-blur-md border-b border-white/10 py-3'
            : 'bg-transparent py-6'
        }`}
        role="banner"
      >
        <nav
          className="relative max-w-7xl mx-auto px-6 flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Logo — left */}
          <a
            href="/"
            className="text-white font-black text-2xl tracking-tighter select-none"
            style={{ fontFamily: 'Cormorant Garamond, serif', letterSpacing: '-0.02em' }}
            aria-label="Slique — go to homepage"
          >
            SLIQUE
          </a>

          {/* Desktop links — center */}
          <ul className="hidden md:flex items-center justify-center gap-10 absolute left-1/2 -translate-x-1/2" role="list">
            {navLinks.map((link) => (
              <li key={link.label}>
                <button
                  onClick={() => handleNav(link.href)}
                  className="text-white/70 hover:text-white text-xs tracking-[0.2em] uppercase transition-colors duration-200 font-medium bg-transparent border-0 cursor-pointer"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Mobile center — scroll-aware Fleet / Reserve buttons (absolutely centered) */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 flex gap-2">
            <AnimatePresence mode="popLayout">
              {showFleet && (
                <motion.a
                  key="fleet-btn"
                  href="#fleet"
                  onClick={e => { e.preventDefault(); handleNav('#fleet'); }}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{
                    fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                    fontWeight: 500, color: '#fff', background: '#000',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '8px 12px', textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  Fleet
                </motion.a>
              )}
              {showReserve && (
                <motion.a
                  key="reserve-btn"
                  href="#booking"
                  onClick={e => { e.preventDefault(); handleNav('#booking'); }}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{
                    fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                    fontWeight: 500, color: '#000', background: '#fff',
                    padding: '8px 12px', textDecoration: 'none', whiteSpace: 'nowrap',
                    border: 'none',
                  }}
                >
                  Reserve
                </motion.a>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop CTA — right */}
          <a
            href="tel:+16122751722"
            className="hidden md:flex items-center gap-2 border border-white/30 text-white text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-white hover:text-black transition-all duration-300 font-medium"
            aria-label="Call Slique at (612) 275-1722"
          >
            <Phone className="w-3 h-3" aria-hidden="true" />
            (612) 275-1722
          </a>

          {/* Mobile CALL — right, no border */}
          <a
            href="tel:+16122751722"
            className="md:hidden"
            style={{
              fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
              fontWeight: 400, color: '#fff', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '8px 0 8px 12px',
            }}
            aria-label="Call Slique"
          >
            <Phone size={11} aria-hidden="true" /> Call
          </a>
        </nav>
      </header>

      {/* Mobile Full-screen Menu (hamburger removed — using inline buttons instead) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-0 z-40 bg-black flex flex-col"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
              <span className="text-white font-black text-2xl tracking-tighter" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                SLIQUE
              </span>
              <button onClick={() => setMenuOpen(false)} className="text-white p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-white/50 rounded" aria-label="Close navigation menu">
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col justify-center px-8 gap-2" aria-label="Mobile navigation">
              {navLinks.map((link, i) => (
                <motion.div key={link.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 + 0.1 }}>
                  <button onClick={() => handleNav(link.href)} className="block w-full text-left text-white text-3xl font-light py-4 border-b border-white/10 tracking-wide hover:text-white/70 transition-colors bg-transparent cursor-pointer" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {link.label}
                  </button>
                </motion.div>
              ))}
            </nav>
            <div className="px-8 pb-12 space-y-4">
              <a href="tel:+16122751722" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm">
                <Phone className="w-4 h-4" aria-hidden="true" />
                (612) 275-1722
              </a>
              <a href="mailto:info@sliquemoves.com" className="block text-white/50 text-xs tracking-wide hover:text-white/70 transition-colors">
                info@sliquemoves.com
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
