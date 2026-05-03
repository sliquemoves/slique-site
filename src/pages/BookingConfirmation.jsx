import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const serviceLabels = {
  hourly_charter: 'Hourly Charter',
  airport_transfer: 'Airport Transfer',
  corporate: 'Corporate Travel',
  special_event: 'Special Event',
};

const vehicleLabels = {
  escalade_suv: 'Escalade SUV',
  mercedes_limo: 'Mercedes Limousine',
  mercedes_sprinter: 'Mercedes Sprinter Van',
  mercedes_amg: 'Mercedes AMG Sedan',
  // legacy fallbacks
  luxury_sedan: 'Black Luxury Sedan',
  luxury_suv: 'Black Luxury SUV',
};

const OrnamentDivider = () => (
  <svg viewBox="0 0 400 24" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto opacity-50">
    <line x1="0" y1="12" x2="155" y2="12" stroke="#ffffff" strokeWidth="0.5" />
    <polygon points="170,4 185,12 170,20 155,12" fill="none" stroke="#ffffff" strokeWidth="0.5" />
    <polygon points="200,6 215,12 200,18 185,12" fill="#ffffff" />
    <polygon points="230,4 215,12 230,20 245,12" fill="none" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="245" y1="12" x2="400" y2="12" stroke="#ffffff" strokeWidth="0.5" />
  </svg>
);

const CornerOrnament = ({ flip = false }) => (
  <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 opacity-40" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M0,60 L0,0 L60,0" fill="none" stroke="#ffffff" strokeWidth="0.8" />
    <path d="M8,52 L8,8 L52,8" fill="none" stroke="#ffffff" strokeWidth="0.4" />
    <circle cx="8" cy="8" r="2" fill="#ffffff" opacity="0.7" />
  </svg>
);

function generateRef(id) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'SLQ-';
  const seed = id ? String(id).replace(/-/g, '') : Date.now().toString(16);
  for (let i = 0; i < 6; i++) {
    ref += chars[parseInt(seed[i] || '0', 16) % chars.length];
  }
  return ref;
}

function format12Hour(time24) {
  if (!time24) return '';
  const [h] = time24.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:00 ${period}`;
}

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!bookingId) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      if (error) console.error('Booking fetch error:', error);
      setBooking(data || null);
      setLoading(false);
    })();
  }, [bookingId]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you wish to cancel this reservation?')) return;
    setCancelling(true);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (!error && booking) {
      await supabase.from('availability').delete().eq('booking_id', bookingId);
    }
    setCancelling(false);
    if (!error) setCancelled(true);
  };

  const refCode = booking ? generateRef(booking.id) : '';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Detail bubble component
  const DetailBubble = ({ label, value }) => (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '14px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <span style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </span>
      <span style={{ fontSize: 15, color: '#ffffff', fontWeight: 300, letterSpacing: '0.02em', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {value}
      </span>
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{
        background: '#000000',
        fontFamily: "'Cormorant Garamond', 'Georgia', serif",
      }}
    >
      {/* Subtle grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
        }}
      />

      <div className="relative w-full max-w-2xl">
        {loading ? (
          <div className="text-center py-32">
            <div className="w-8 h-8 border border-white/40 border-t-white rounded-full animate-spin mx-auto" />
          </div>
        ) : !booking ? (
          <div className="text-center py-32 text-white/50">
            <p className="tracking-[0.3em] uppercase text-sm">Reservation not found</p>
            <button onClick={() => navigate('/')} className="mt-8 text-xs tracking-widest uppercase text-white/70 border-b border-white/30 hover:border-white transition-all">
              Return Home
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            <div className="relative p-[1px]" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.2) 60%, rgba(255,255,255,0.5) 100%)',
            }}>
              <div className="bg-[#0a0a0a] p-10 md:p-14 relative">

                <div className="absolute top-4 left-4"><CornerOrnament /></div>
                <div className="absolute top-4 right-4 rotate-90"><CornerOrnament /></div>
                <div className="absolute bottom-4 left-4 -rotate-90"><CornerOrnament /></div>
                <div className="absolute bottom-4 right-4 rotate-180"><CornerOrnament /></div>

                {/* Header */}
                <motion.div className="text-center mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}>
                  <p className="text-[10px] tracking-[0.5em] uppercase mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Slique Moves
                  </p>

                  {cancelled ? (
                    <>
                      <h1 className="text-3xl md:text-4xl font-light mb-3" style={{ color: '#ffffff', letterSpacing: '0.05em' }}>
                        Reservation <span style={{ fontStyle: 'italic' }}>Cancelled</span>
                      </h1>
                      <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        We hope to serve you again soon
                      </p>
                    </>
                  ) : (
                    <>
                      <motion.div className="mx-auto mb-6 flex items-center justify-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8, ease: 'backOut' }}>
                        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
                          <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
                          <path d="M28,32 L32,22 L40,28 L48,22 L52,32" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" />
                          <rect x="27" y="32" width="26" height="16" rx="0.5" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                          <path d="M33,40 L38,45 L48,35" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M32,50 Q40,56 48,50" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.6" />
                        </svg>
                      </motion.div>

                      <h1 className="text-3xl md:text-4xl font-light mb-3" style={{ color: '#ffffff', letterSpacing: '0.05em' }}>
                        Reservation <span style={{ fontStyle: 'italic' }}>Confirmed</span>
                      </h1>
                      <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Your journey has been arranged
                      </p>
                    </>
                  )}
                </motion.div>

                <OrnamentDivider />

                {!cancelled && (
                  <>
                    {/* Reference */}
                    <motion.div className="text-center my-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                      <p className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Confirmation Reference
                      </p>
                      <p className="text-2xl md:text-3xl tracking-[0.25em]" style={{ color: '#ffffff', fontFamily: "'Courier New', monospace", textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
                        {refCode}
                      </p>
                    </motion.div>

                    <OrnamentDivider />

                    {/* Trip details — bubbles */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-10">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <DetailBubble label="Guest" value={booking.customer_name} />
                        <DetailBubble label="Service" value={serviceLabels[booking.service_type] || booking.service_type} />
                        <DetailBubble label="Date" value={formatDate(booking.pickup_date)} />
                        <DetailBubble label="Time" value={format12Hour(booking.pickup_time)} />
                        <DetailBubble label="Vehicle" value={vehicleLabels[booking.vehicle_type] || booking.vehicle_type} />
                        <DetailBubble label="Passengers" value={booking.passengers} />
                      </div>

                      <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                        <DetailBubble label="Pickup Location" value={booking.pickup_location} />
                        {booking.dropoff_location && (
                          <DetailBubble label="Destination" value={booking.dropoff_location} />
                        )}
                        {booking.special_requests && (
                          <DetailBubble label="Special Notes" value={booking.special_requests} />
                        )}
                      </div>
                    </motion.div>

                    {/* Status — always show CONFIRMED unless cancelled/completed */}
                    <motion.div className="mt-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                      <span className="inline-block px-6 py-2 text-[10px] tracking-[0.4em] uppercase" style={{
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#ffffff',
                        background: 'rgba(255,255,255,0.06)',
                      }}>
                        {booking.status === 'completed' ? '✦ Journey Complete' : '✦ Confirmed'}
                      </span>
                    </motion.div>

                    <motion.p className="text-center mt-8 text-xs leading-7" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                      A confirmation has been sent to <span style={{ color: 'rgba(255,255,255,0.7)' }}>{booking.email}</span><br />
                      For immediate assistance, please reach us at<br />
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>admin@sliquemoves.com</span> · <span style={{ color: 'rgba(255,255,255,0.7)' }}>(612) 275-1722</span>
                    </motion.p>

                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <motion.div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
                        <button
                          onClick={() => navigate('/')}
                          className="px-8 py-3 text-[10px] tracking-[0.4em] uppercase transition-all duration-300"
                          style={{ background: '#ffffff', border: '1px solid #ffffff', color: '#000000', fontWeight: 600 }}
                        >
                          Return Home
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="px-8 py-3 text-[10px] tracking-[0.4em] uppercase transition-all duration-300"
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }}
                          onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,80,80,0.4)'; e.target.style.color = 'rgba(255,140,140,0.7)'; }}
                          onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.color = 'rgba(255,255,255,0.5)'; }}
                        >
                          {cancelling ? 'Cancelling…' : 'Cancel Reservation'}
                        </button>
                      </motion.div>
                    )}
                  </>
                )}

                {cancelled && (
                  <motion.div className="text-center mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button
                      onClick={() => navigate('/')}
                      className="px-8 py-3 text-[10px] tracking-[0.4em] uppercase"
                      style={{ background: '#ffffff', border: '1px solid #ffffff', color: '#000000', fontWeight: 600 }}
                    >
                      Return Home
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            <p className="text-center mt-6 text-[9px] tracking-[0.5em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Slique Moves · Excellence in Motion
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
