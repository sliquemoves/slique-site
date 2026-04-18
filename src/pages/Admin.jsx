import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Loader2, CalendarDays, Clock, CheckCircle2, Car, Users, Phone, Mail, AlertCircle, LogOut } from 'lucide-react';
import { toast } from "sonner";

// ── Simple password gate ──────────────────────────────────────────────────
// Set VITE_ADMIN_PASSWORD in your .env — never commit the actual password.
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'slique-admin';

function PasswordGate({ onUnlock }) {
  const [pw, setPw]     = useState('');
  const [err, setErr]   = useState(false);
  const handle = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { onUnlock(); }
    else { setErr(true); setPw(''); }
  };
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-white font-black text-2xl tracking-tighter mb-8 text-center"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}>SLIQUE</p>
        <form onSubmit={handle} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-pw" className="text-xs tracking-widest uppercase text-gray-500">Admin Password</Label>
            <Input
              id="admin-pw"
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setErr(false); }}
              className={`rounded-none h-12 bg-white ${err ? 'border-red-400' : 'border-gray-200'}`}
              placeholder="Enter password"
              autoFocus
              aria-describedby={err ? 'pw-error' : undefined}
            />
            {err && <p id="pw-error" className="text-xs text-red-400" role="alert">Incorrect password</p>}
          </div>
          <Button type="submit" className="w-full bg-white text-black hover:bg-gray-100 rounded-none py-5 text-xs tracking-widest uppercase">
            Enter Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────
const timeSlots = [
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00','22:00','23:00'
];

const STATUS_CONFIG = {
  pending:   { label:'Pending',   bg:'bg-amber-50',  border:'border-amber-200',  text:'text-amber-800',  dot:'bg-amber-400' },
  confirmed: { label:'Confirmed', bg:'bg-green-50',  border:'border-green-200',  text:'text-green-800',  dot:'bg-green-500' },
  completed: { label:'Completed', bg:'bg-blue-50',   border:'border-blue-200',   text:'text-blue-800',   dot:'bg-blue-500'  },
  cancelled: { label:'Cancelled', bg:'bg-gray-100',  border:'border-gray-200',   text:'text-gray-500',   dot:'bg-gray-400'  },
};

const SERVICE_LABELS = {
  hourly_charter: 'Hourly Charter',
  airport_transfer: 'Airport Transfer',
  corporate: 'Corporate',
  special_event: 'Special Event',
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} aria-hidden="true" />
      {c.label}
    </span>
  );
}

// ── Supabase data helpers ─────────────────────────────────────────────────
const fetchBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
};

const fetchAvailability = async (date, vehicle) => {
  if (!date || !vehicle) return [];
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('date', date)
    .eq('vehicle_type', vehicle)
    .order('time_slot');
  if (error) throw error;
  return data;
};

// ── Main Admin component ──────────────────────────────────────────────────
export default function Admin() {
  const [unlocked, setUnlocked]         = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings
  });

  const { data: availability = [], isLoading: availabilityLoading } = useQuery({
    queryKey: ['availability', selectedDate, selectedVehicle],
    queryFn: () => fetchAvailability(selectedDate, selectedVehicle),
    enabled: !!selectedDate && !!selectedVehicle
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const addSlotMutation = useMutation({
    mutationFn: async (slot) => {
      const { error } = await supabase.from('availability').insert([slot]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries(['availability']); toast.success('Time slot added'); setSelectedSlot(''); },
    onError: () => toast.error('Failed to add slot')
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('availability').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries(['availability']); toast.success('Time slot removed'); },
    onError: () => toast.error('Failed to remove slot')
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries(['bookings']); toast.success('Booking updated'); },
    onError: () => toast.error('Failed to update booking')
  });

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleAddSlot = () => {
    if (!selectedDate || !selectedVehicle || !selectedSlot) {
      toast.error('Select date, vehicle, and time slot'); return;
    }
    if (availability.some(a => a.time_slot === selectedSlot)) {
      toast.error('This slot already exists for this date'); return;
    }
    addSlotMutation.mutate({ date: selectedDate, vehicle_type: selectedVehicle, time_slot: selectedSlot, is_available: true });
  };

  const handleBulkAdd = () => {
    if (!selectedDate || !selectedVehicle) { toast.error('Select date and vehicle'); return; }
    const existing = new Set(availability.map(a => a.time_slot));
    const newSlots = timeSlots
      .filter(s => !existing.has(s))
      .map(s => ({ date: selectedDate, vehicle_type: selectedVehicle, time_slot: s, is_available: true }));
    if (!newSlots.length) { toast.info('All slots already added'); return; }
    Promise.all(newSlots.map(s => supabase.from('availability').insert([s])))
      .then(() => { queryClient.invalidateQueries(['availability']); toast.success(`Added ${newSlots.length} slots`); })
      .catch(() => toast.error('Some slots could not be added'));
  };

  // ── Derived ────────────────────────────────────────────────────────────
  const stats = {
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    total:     bookings.length,
  };
  const filtered       = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);
  const availableSlots = availability.filter(a => a.is_available);
  const bookedSlots    = availability.filter(a => !a.is_available);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-black tracking-tighter text-black"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>SLIQUE</span>
            <span className="text-gray-300" aria-hidden="true">/</span>
            <h1 className="text-sm font-medium text-gray-700">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-xs text-gray-500 hover:text-black transition-colors tracking-wide uppercase">← View Site</a>
            <button onClick={() => setUnlocked(false)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-black transition-colors uppercase tracking-wide"
              aria-label="Lock dashboard">
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />Lock
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Pending',   value:stats.pending,   icon:AlertCircle,  color:'text-amber-500' },
            { label:'Confirmed', value:stats.confirmed, icon:CheckCircle2, color:'text-green-500' },
            { label:'Completed', value:stats.completed, icon:Car,          color:'text-blue-500'  },
            { label:'Total',     value:stats.total,     icon:Users,        color:'text-gray-500'  },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-200 p-5 flex items-center gap-4">
              <Icon className={`w-8 h-8 flex-shrink-0 ${color}`} aria-hidden="true" />
              <div>
                <p className="text-2xl font-light text-black">{bookingsLoading ? '—' : value}</p>
                <p className="text-xs text-gray-500 tracking-wide uppercase">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Availability */}
          <Card className="shadow-none border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-light">Manage <span className="font-semibold">Availability</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="avail-date" className="text-xs tracking-widest uppercase text-gray-500">Date</Label>
                  <Input id="avail-date" type="date" min={new Date().toISOString().split('T')[0]}
                    value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="avail-vehicle" className="text-xs tracking-widest uppercase text-gray-500">Vehicle</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger id="avail-vehicle"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luxury_sedan">Luxury Sedan</SelectItem>
                      <SelectItem value="luxury_suv">Luxury SUV</SelectItem>
                      <SelectItem value="luxury_sprinter">Luxury Sprinter</SelectItem>
                      <SelectItem value="luxury_limo">Stretch Limo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(!selectedDate || !selectedVehicle) ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-gray-200 text-center">
                  <Clock className="w-8 h-8 text-gray-300 mb-3" aria-hidden="true" />
                  <p className="text-xs text-gray-400">Select a date and vehicle to manage slots.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                      <SelectTrigger><SelectValue placeholder="Select time slot" /></SelectTrigger>
                      <SelectContent>{timeSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={handleAddSlot} disabled={addSlotMutation.isPending || !selectedSlot}
                      className="shrink-0 bg-black hover:bg-gray-900 text-white rounded-none px-4">
                      {addSlotMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><Plus className="w-4 h-4 mr-1" />Add</>}
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full rounded-none border-dashed text-xs tracking-widest uppercase" onClick={handleBulkAdd}>
                    <CalendarDays className="w-4 h-4 mr-2" />Add All Day Slots (6am–11pm)
                  </Button>
                  {availabilityLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs tracking-widest uppercase text-gray-500">
                          Available <span className="ml-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">{availableSlots.length}</span>
                        </Label>
                        {availableSlots.length === 0
                          ? <p className="text-xs text-gray-400 py-2">No available slots.</p>
                          : <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                              {availableSlots.map(s => (
                                <div key={s.id} className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
                                  <span className="text-xs font-medium text-green-800">{s.time_slot}</span>
                                  <button onClick={() => deleteSlotMutation.mutate(s.id)}
                                    className="text-green-400 hover:text-red-500 transition-colors" aria-label={`Remove ${s.time_slot}`}>
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                        }
                      </div>
                      {bookedSlots.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs tracking-widest uppercase text-gray-500">
                            Booked <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">{bookedSlots.length}</span>
                          </Label>
                          <div className="grid grid-cols-3 gap-2 max-h-24 overflow-y-auto">
                            {bookedSlots.map(s => (
                              <div key={s.id} className="bg-red-50 border border-red-200 px-3 py-2 text-center">
                                <span className="text-xs text-red-700">{s.time_slot}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Bookings */}
          <Card className="shadow-none border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-light">Recent <span className="font-semibold">Bookings</span></CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Car className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">{statusFilter === 'all' ? 'No bookings yet.' : `No ${statusFilter} bookings.`}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                  {filtered.map(b => (
                    <article key={b.id} className="border border-gray-200 p-4 space-y-3 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-black truncate">{b.customer_name}</p>
                          <div className="flex flex-wrap gap-3 mt-0.5">
                            <a href={`mailto:${b.email}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors">
                              <Mail className="w-3 h-3" />{b.email}
                            </a>
                            {b.phone && (
                              <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors">
                                <Phone className="w-3 h-3" />{b.phone}
                              </a>
                            )}
                          </div>
                        </div>
                        <Select value={b.status} onValueChange={status => updateBookingMutation.mutate({ id: b.id, status })}>
                          <SelectTrigger className="w-32 h-7 text-xs shrink-0"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={b.status} />
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                          <Car className="w-3 h-3" />{
                            b.vehicle_type === 'luxury_sedan'    ? 'Sedan'    :
                            b.vehicle_type === 'luxury_suv'      ? 'SUV'      :
                            b.vehicle_type === 'luxury_sprinter' ? 'Sprinter' :
                            b.vehicle_type === 'luxury_limo'     ? 'Limo'     : b.vehicle_type
                          }
                        </span>
                        {b.service_type && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                            {SERVICE_LABELS[b.service_type] ?? b.service_type}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                          <CalendarDays className="w-3 h-3" />{b.pickup_date}{b.pickup_time && ` · ${b.pickup_time}`}
                        </span>
                        {b.passengers && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                            <Users className="w-3 h-3" />{b.passengers} pax
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5 pt-1 border-t border-gray-100">
                        <p className="truncate"><span className="text-gray-400 uppercase tracking-wide text-[10px] mr-1">From</span>{b.pickup_location}</p>
                        {b.dropoff_location && <p className="truncate"><span className="text-gray-400 uppercase tracking-wide text-[10px] mr-1">To</span>{b.dropoff_location}</p>}
                        {b.special_requests && <p className="truncate text-gray-400 italic"><span className="not-italic uppercase tracking-wide text-[10px] mr-1">Note</span>{b.special_requests}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
