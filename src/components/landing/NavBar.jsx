import React, { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Fleet', href: '#fleet' },
  { label: 'Reserve', href: '#booking' },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          className="max-w-7xl mx-auto px-6 flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <a
            href="/"
            className="text-white font-black text-2xl tracking-tighter select-none"
            style={{ fontFamily: 'Cormorant Garamond, serif', letterSpacing: '-0.02em' }}
            aria-label="Slique — go to homepage"
          >
            SLIQUE
          </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center justify-center gap-10" role="list">
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

          {/* Desktop CTA */}
          <a
            href="tel:+16122751722"
            className="hidden md:flex items-center gap-2 border border-white/30 text-white text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-white hover:text-black transition-all duration-300 font-medium"
            aria-label="Call Slique at (612) 275-1722"
          >
            <Phone className="w-3 h-3" aria-hidden="true" />
            (612) 275-1722
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </nav>
      </header>

      {/* Mobile Menu */}
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
              <span
                className="text-white font-black text-2xl tracking-tighter"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                SLIQUE
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-white p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col justify-center px-8 gap-2" aria-label="Mobile navigation">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 + 0.1 }}
                >
                  <button
                    onClick={() => handleNav(link.href)}
                    className="block w-full text-left text-white text-3xl font-light py-4 border-b border-white/10 tracking-wide hover:text-white/70 transition-colors bg-transparent cursor-pointer"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {link.label}
                  </button>
                </motion.div>
              ))}
            </nav>

            <div className="px-8 pb-12 space-y-4">
              <a
                href="tel:+16122751722"
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                (612) 275-1722
              </a>
              <a
                href="mailto:info@sliquemoves.com"
                className="block text-white/50 text-xs tracking-wide hover:text-white/70 transition-colors"
              >
                info@sliquemoves.com
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
