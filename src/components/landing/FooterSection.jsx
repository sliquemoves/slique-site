import React, { useState } from 'react';
import { Phone, Mail, MapPin, X } from 'lucide-react';

// ── Inline Policy Modal ────────────────────────────────────────────────────
function PolicyModal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 bg-white w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <h2 id="modal-title" className="text-sm tracking-[0.2em] uppercase font-medium text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-black rounded"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-8 py-6 text-sm text-gray-600 leading-relaxed space-y-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
export default function FooterSection() {
  const [modal, setModal] = useState(null); // 'privacy' | 'terms' | null

  return (
    <>
      <footer className="bg-black py-20 px-6 border-t border-white/10" role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-16">

            {/* Brand */}
            <div>
              <p
                className="text-2xl font-black text-white tracking-tighter mb-4"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                SLIQUE
              </p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Premium chauffeur services in the Minneapolis–St. Paul metropolitan area.
                Where every journey becomes an experience.
              </p>
            </div>

            {/* Contact */}
            <nav aria-label="Contact information">
              <h3 className="text-white text-xs tracking-[0.2em] uppercase mb-6">Contact</h3>
              <ul className="space-y-4" role="list">
                <li>
                  <a
                    href="tel:+16122751722"
                    className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
                    aria-label="Call Slique at (612) 275-1722"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm">(612) 275-1722</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@sliquemoves.com"
                    className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
                    aria-label="Email info@sliquemoves.com"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm">info@sliquemoves.com</span>
                  </a>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">Minneapolis–St. Paul, MN</span>
                </li>
              </ul>
            </nav>

            {/* Hours */}
            <div>
              <h3 className="text-white text-xs tracking-[0.2em] uppercase mb-6">Availability</h3>
              <p className="text-sm text-gray-400">24 Hours, 7 Days a Week</p>
              <p className="text-gray-600 text-xs mt-4 leading-relaxed">
                Advance reservations recommended.<br />
                Last-minute requests subject to availability.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs">
              © {new Date().getFullYear()} Slique. All rights reserved.
            </p>
            <nav aria-label="Legal links">
              <ul className="flex gap-8" role="list">
                <li>
                  <button
                    onClick={() => setModal('privacy')}
                    className="text-gray-600 hover:text-white text-xs transition-colors bg-transparent border-0 cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModal('terms')}
                    className="text-gray-600 hover:text-white text-xs transition-colors bg-transparent border-0 cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {modal === 'privacy' && (
        <PolicyModal title="Privacy Policy" onClose={() => setModal(null)}>
          <p><strong>Last updated:</strong> January 2026</p>
          <p>
            Slique ("we", "us", or "our") is committed to protecting your personal information.
            This policy describes how we collect, use, and safeguard data submitted through our website.
          </p>
          <p className="font-semibold text-gray-900">Information We Collect</p>
          <p>
            We collect your name, email address, phone number, and trip details when you submit a reservation request.
          </p>
          <p className="font-semibold text-gray-900">How We Use It</p>
          <p>
            Your information is used solely to process and confirm your reservation. We do not sell or share
            your personal data with third parties for marketing purposes.
          </p>
          <p className="font-semibold text-gray-900">Data Security</p>
          <p>
            We take reasonable measures to protect your information. No transmission over the internet is 100% secure.
          </p>
          <p className="font-semibold text-gray-900">Contact</p>
          <p>
            For privacy questions, email{' '}
            <a href="mailto:info@sliquemoves.com" className="text-black underline underline-offset-2">
              info@sliquemoves.com
            </a>.
          </p>
        </PolicyModal>
      )}

      {/* Terms of Service Modal */}
      {modal === 'terms' && (
        <PolicyModal title="Terms of Service" onClose={() => setModal(null)}>
          <p><strong>Last updated:</strong> January 2026</p>
          <p>
            By using our website or booking a ride with Slique, you agree to the following terms.
          </p>
          <p className="font-semibold text-gray-900">Reservations</p>
          <p>
            All bookings are subject to vehicle availability. Submitting a reservation request does not guarantee
            confirmation — a Slique representative will contact you within 2 hours to confirm.
          </p>
          <p className="font-semibold text-gray-900">Cancellations</p>
          <p>
            Cancellations made less than 24 hours before pickup may be subject to a cancellation fee.
            Please contact us as early as possible if your plans change.
          </p>
          <p className="font-semibold text-gray-900">Liability</p>
          <p>
            Slique is not liable for delays caused by traffic, weather, or events outside our reasonable control.
            We will make every effort to keep you informed of any changes to your trip.
          </p>
          <p className="font-semibold text-gray-900">Contact</p>
          <p>
            Questions? Email{' '}
            <a href="mailto:info@sliquemoves.com" className="text-black underline underline-offset-2">
              info@sliquemoves.com
            </a>{' '}
            or call{' '}
            <a href="tel:+16122751722" className="text-black underline underline-offset-2">
              (612) 275-1722
            </a>.
          </p>
        </PolicyModal>
      )}
    </>
  );
}
