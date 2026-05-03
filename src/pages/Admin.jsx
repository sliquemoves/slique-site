import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus, Loader2, Clock, Users, MapPin, Car, Phone, Mail, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const timeSlots = [
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00','22:00','23:00'
];

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#C9A84C', bg: 'rgba(201,168,76,0.1)',   border: 'rgba(201,168,76,0.25)' },
  confirmed: { label: 'Confirmed', color: '#7EC8A4', bg: 'rgba(126,200,164,0.1)',  border: 'rgba(126,200,164,0.25)' },
  completed: { label: 'Completed', color: '#a0a0a0', bg: 'rgba(160,160,160,0.08)', border: 'rgba(160,160,160,0.2)' },
  cancelled: { label: 'Cancelled', color: '#e07070', bg: 'rgba(224,112,112,0.08)', border: 'rgba(224,112,112,0.2)' },
};

const SERVICE_LABELS = {
  hourly_charter: 'Hourly Charter',
  airport_transfer: 'Airport Transfer',
  corporate: 'Corporate Travel',
  special_event: 'Special Event',
};

const VEHICLE_LABELS = {
  luxury_sedan: 'Luxury Sedan',
  luxury_suv: 'Luxury SUV',
};

function generateRef(id) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'SLQ-';
  const seed = id ? String(id).replace(/-/g, '') : Date.now().toString(16);
  for (let i = 0; i < 6; i++) ref += chars[parseInt(seed[i] || '0', 16) % chars.length];
  return ref;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: '#0d0c0a', border: '1px solid rgba(201,168,76,0.12)', padding: '24px 28px' }}>
      <p style={{ fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.4)', marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 32, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, color: accent || '#e8e0d0' }}>{value}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, color: 'rgba(201,168,76,0.4)' }}>
        {icon}
        <span style={{ fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <p style={{ fontSize: 12, color: '#c8bfb0', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.02em' }}>{value}</p>
    </div>
  );
}

function BookingCard({ booking, onStatusChange, updating }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const ref = generateRef(booking.id);

  return (
    <motion.div layout style={{ background: '#0d0c0a', border: '1px solid rgba(201,168,76,0.1)', marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} onClick={() => setExpanded(e => !e)}>
        <div style={{ width: 3, height: 36, background: status.color, flexShrink: 0, borderRadius: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#e8e0d0', fontWeight: 400, letterSpacing: '0.02em' }}>
            {booking.customer_name}
          </p>
          <p style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(201,168,76,0.4)', fontFamily: "'Courier New', monospace", marginTop: 2 }}>
            {ref}
          </p>
        </div>
        <div style={{ textAlign: 'right', marginRight: 16 }}>
          <p style={{ fontSize: 11, color: '#d4c9b0', letterSpacing: '0.04em' }}>{formatDate(booking.pickup_date)}</p>
          <p style={{ fontSize: 10, color: 'rgba(201,168,76,0.5)', marginTop: 2 }}>{booking.pickup_time}</p>
        </div>
        <span style={{
          fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase',
          padding: '4px 10px', border: `1px solid ${status.border}`,
          color: status.color, background: status.bg, flexShrink: 0,
        }}>
          {status.label}
        </span>
        <div style={{ color: 'rgba(201,168,76,0.3)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderTop: '1px solid rgba(201,168,76,0.08)', padding: '20px 20px 20px 39px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <DetailItem icon={<Mail size={11} />} label="Email" value={booking.email} />
            <DetailItem icon={<Phone size={11} />} label="Phone" value={booking.phone} />
            <DetailItem icon={<Car size={11} />} label="Vehicle" value={VEHICLE_LABELS[booking.vehicle_type] || booking.vehicle_type} />
            <DetailItem icon={<Users size={11} />} label="Passengers" value={booking.passengers} />
            <DetailItem icon={<MapPin size={11} />} label="Pickup" value={booking.pickup_location} />
            {booking.dropoff_location && <DetailItem icon={<MapPin size={11} />} label="Dropoff" value={booking.dropoff_location} />}
            <DetailItem icon={<Clock size={11} />} label="Service" value={SERVICE_LABELS[booking.service_type] || booking.service_type} />
          </div>

          {booking.special_requests && (
            <div style={{ marginBottom: 20, padding: '12px 14px', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.08)' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.4)', marginBottom: 6 }}>Special Notes</p>
              <p style={{ fontSize: 12, color: '#b0a898', fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1.7 }}>{booking.special_requests}</p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Update Status</p>
            <Select value={booking.status} onValueChange={(s) => onStatusChange(booking.id, s)} disabled={updating}>
              <SelectTrigger style={{ width: 160, height: 34, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 0, fontSize: 11, color: '#d4c9b0' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {updating && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(201,168,76,0.5)' }} />}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Admin() {
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) console.error('Bookings fetch error:', error);
    setBookings(data || []);
    setBookingsLoading(false);
  }, []);

  const fetchAvailability = useCallback(async () => {
    if (!selectedDate || !selectedVehicle) { setAvailability([]); return; }
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('date', selectedDate)
      .eq('vehicle_type', selectedVehicle);
    if (error) console.error('Availability fetch error:', error);
    setAvailability(data || []);
  }, [selectedDate, selectedVehicle]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => {
    const interval = setInterval(fetchBookings, 60000);
    return () => clearInterval(interval);
  }, [fetchBookings]);
  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchBookings();
    }
    setUpdatingId(null);
  };

  const handleAddSlot = async () => {
    if (!selectedDate || !selectedVehicle || !selectedSlot) { toast.error('Select date, vehicle, and time'); return; }
    const { error } = await supabase.from('availability').insert([{
      date: selectedDate, vehicle_type: selectedVehicle, time_slot: selectedSlot, is_available: true
    }]);
    if (error) {
      toast.error('Failed to add slot');
    } else {
      toast.success('Time slot added');
      setSelectedSlot('');
      fetchAvailability();
    }
  };

  const handleBulkAdd = async () => {
    if (!selectedDate || !selectedVehicle) { toast.error('Select date and vehicle'); return; }
    const existing = availability.map(a => a.time_slot);
    const newSlots = timeSlots.filter(s => !existing.includes(s)).map(s => ({
      date: selectedDate, vehicle_type: selectedVehicle, time_slot: s, is_available: true
    }));
    if (newSlots.length === 0) { toast.info('All slots already added'); return; }
    const { error } = await supabase.from('availability').insert(newSlots);
    if (error) {
      toast.error('Failed to add slots');
    } else {
      toast.success(`Added ${newSlots.length} slots`);
      fetchAvailability();
    }
  };

  const handleDeleteSlot = async (id) => {
    const { error } = await supabase.from('availability').delete().eq('id', id);
    if (error) {
      toast.error('Failed to remove slot');
    } else {
      toast.success('Slot removed');
      fetchAvailability();
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const filtered = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, #110e07 0%, #080706 60%, #050505 100%)',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(201,168,76,0.1)', paddingBottom: 24 }}
        >
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.4)', marginBottom: 6 }}>Slique Moves</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 300, color: '#e8e0d0', letterSpacing: '0.04em' }}>
              Command <span style={{ fontStyle: 'italic', color: '#C9A84C' }}>Dashboard</span>
            </h1>
          </div>
          <button
            onClick={fetchBookings}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(201,168,76,0.5)', fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
          <StatCard label="Total Bookings" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} accent="#C9A84C" />
          <StatCard label="Confirmed" value={stats.confirmed} accent="#7EC8A4" />
          <StatCard label="Completed" value={stats.completed} accent="#a0a0a0" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 300, color: '#d4c9b0', letterSpacing: '0.05em' }}>
                Reservations
              </h2>
              <div style={{ display: 'flex', gap: 4 }}>
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    style={{
                      padding: '5px 12px', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
                      border: '1px solid',
                      borderColor: statusFilter === f ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)',
                      background: statusFilter === f ? 'rgba(201,168,76,0.08)' : 'transparent',
                      color: statusFilter === f ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {bookingsLoading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(201,168,76,0.4)', margin: '0 auto' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.15)', fontSize: 12, letterSpacing: '0.1em' }}>
                No reservations found
              </div>
            ) : (
              filtered.map(b => (
                <BookingCard key={b.id} booking={b} onStatusChange={handleStatusChange} updating={updatingId === b.id} />
              ))
            )}
          </div>

          <div style={{ background: '#0d0c0a', border: '1px solid rgba(201,168,76,0.12)', padding: 28 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 300, color: '#d4c9b0', letterSpacing: '0.05em', marginBottom: 20 }}>
              Availability
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.4)', marginBottom: 8 }}>Date</label>
              <Input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 0, color: '#d4c9b0', height: 40 }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.4)', marginBottom: 8 }}>Vehicle</label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 0, color: '#d4c9b0', height: 40 }}>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxury_sedan">Luxury Sedan</SelectItem>
                  <SelectItem value="luxury_suv">Luxury SUV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDate && selectedVehicle && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                    <SelectTrigger style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 0, color: '#d4c9b0', height: 36 }}>
                      <SelectValue placeholder="Time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={handleAddSlot} style={{ padding: '0 14px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', cursor: 'pointer', height: 36 }}>
                    <Plus size={14} />
                  </button>
                </div>

                <button onClick={handleBulkAdd} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(201,168,76,0.15)', color: 'rgba(201,168,76,0.5)', fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 20 }}>
                  Add All Day Slots
                </button>

                {availability.filter(a => a.is_available).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(126,200,164,0.5)', marginBottom: 10 }}>
                      Open · {availability.filter(a => a.is_available).length}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {availability.filter(a => a.is_available).sort((a,b) => a.time_slot.localeCompare(b.time_slot)).map(slot => (
                        <div key={slot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(126,200,164,0.06)', border: '1px solid rgba(126,200,164,0.15)' }}>
                          <span style={{ fontSize: 11, color: '#7EC8A4' }}>{slot.time_slot}</span>
                          <button onClick={() => handleDeleteSlot(slot.id)} style={{ background: 'none', border: 'none', color: 'rgba(224,112,112,0.5)', cursor: 'pointer', padding: 0 }}>
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {availability.filter(a => !a.is_available).length > 0 && (
                  <div>
                    <p style={{ fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(224,112,112,0.4)', marginBottom: 10 }}>
                      Booked · {availability.filter(a => !a.is_available).length}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {availability.filter(a => !a.is_available).sort((a,b) => a.time_slot.localeCompare(b.time_slot)).map(slot => (
                        <div key={slot.id} style={{ padding: '6px 8px', background: 'rgba(224,112,112,0.05)', border: '1px solid rgba(224,112,112,0.12)', textAlign: 'center' }}>
                          <span style={{ fontSize: 11, color: 'rgba(224,112,112,0.6)' }}>{slot.time_slot}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
