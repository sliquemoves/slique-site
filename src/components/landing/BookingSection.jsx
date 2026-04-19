import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Car, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const serviceTypes = [
  { value: "hourly_charter", label: "Hourly Charter" },
  { value: "airport_transfer", label: "Airport Transfer" },
  { value: "corporate", label: "Corporate Travel" },
  { value: "special_event", label: "Special Event" }
];

const vehicleTypes = [
  { value: "luxury_sedan", label: "Black Luxury Sedan" },
  { value: "luxury_suv", label: "Black Luxury SUV" }
];

export default function BookingSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    service_type: '',
    vehicle_type: '',
    pickup_date: '',
    pickup_time: '',
    pickup_location: '',
    dropoff_location: '',
    passengers: 1,
    special_requests: ''
  });

  // Auto-populate vehicle from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('vehicle=')) {
      const vehicleType = hash.split('vehicle=')[1];
      setFormData(prev => ({ ...prev, vehicle_type: vehicleType }));
      window.location.hash = '';
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset time when date or vehicle changes
    if (field === 'pickup_date' || field === 'vehicle_type') {
      setFormData(prev => ({ ...prev, pickup_time: '' }));
    }
  };

  // Check availability when date and vehicle are selected
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.pickup_date && formData.vehicle_type) {
        setCheckingAvailability(true);
        
        const availability = await base44.entities.Availability.filter({
          date: formData.pickup_date,
          vehicle_type: formData.vehicle_type,
          is_available: true
        });
        
        setAvailableSlots(availability.map(slot => slot.time_slot).sort());
        setCheckingAvailability(false);
      } else {
        setAvailableSlots([]);
      }
    };
    
    checkAvailability();
  }, [formData.pickup_date, formData.vehicle_type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Create the booking
    const booking = await base44.entities.Booking.create({
      ...formData,
      passengers: Number(formData.passengers),
      status: 'pending'
    });

    // Update availability to mark slot as taken
    const availabilitySlots = await base44.entities.Availability.filter({
      date: formData.pickup_date,
      time_slot: formData.pickup_time,
      vehicle_type: formData.vehicle_type,
      is_available: true
    });

    if (availabilitySlots.length > 0) {
      await base44.entities.Availability.update(availabilitySlots[0].id, {
        is_available: false,
        booking_id: booking.id
      });
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success("Reservation request submitted successfully!");
    
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        customer_name: '',
        email: '',
        phone: '',
        service_type: '',
        vehicle_type: '',
        pickup_date: '',
        pickup_time: '',
        pickup_location: '',
        dropoff_location: '',
        passengers: 1,
        special_requests: ''
      });
      setAvailableSlots([]);
    }, 3000);
  };

  if (isSuccess) {
    return (
      <section id="booking" className="bg-white py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle className="w-20 h-20 text-black mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
              Reservation <span className="font-semibold">Received</span>
            </h2>
            <p className="text-gray-600">
              Our team will contact you within 2 hours to confirm your booking.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="bg-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-gray-400 tracking-[0.3em] uppercase text-xs mb-4">Book Now</p>
          <h2 className="text-4xl md:text-5xl font-light text-black tracking-tight">
            RESERVE YOUR <span className="font-semibold">RIDE</span>
          </h2>
        </motion.div>

        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Contact Info */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Full Name *</Label>
              <Input
                required
                value={formData.customer_name}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12"
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Email *</Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12"
                placeholder="john@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Phone *</Label>
              <Input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12"
                placeholder="(612) 555-0100"
              />
            </div>
          </div>

          {/* Service & Vehicle */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Service Type *</Label>
              <Select required value={formData.service_type} onValueChange={(v) => handleChange('service_type', v)}>
                <SelectTrigger className="border-gray-200 focus:border-black rounded-none h-12">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Vehicle *</Label>
              <Select required value={formData.vehicle_type} onValueChange={(v) => handleChange('vehicle_type', v)}>
                <SelectTrigger className="border-gray-200 focus:border-black rounded-none h-12">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map(v => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date, Time, Passengers */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Date *</Label>
              <Input
                required
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.pickup_date}
                onChange={(e) => handleChange('pickup_date', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Time *</Label>
              {formData.pickup_date && formData.vehicle_type ? (
                checkingAvailability ? (
                  <div className="border border-gray-200 rounded-none h-12 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                ) : availableSlots.length > 0 ? (
                  <Select 
                    required 
                    value={formData.pickup_time} 
                    onValueChange={(v) => handleChange('pickup_time', v)}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-black rounded-none h-12">
                      <SelectValue placeholder="Select available time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="border border-red-200 bg-red-50 rounded-none h-12 flex items-center px-3 gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600">No availability</span>
                  </div>
                )
              ) : (
                <div className="border border-gray-200 rounded-none h-12 flex items-center px-3">
                  <span className="text-xs text-gray-400">Select date & vehicle first</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Passengers</Label>
              <Input
                type="number"
                min="1"
                max="6"
                value={formData.passengers}
                onChange={(e) => handleChange('passengers', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12"
              />
            </div>
          </div>

          {/* Availability Message */}
          {formData.pickup_date && formData.vehicle_type && !checkingAvailability && (
            <div className={`p-4 rounded-lg border ${
              availableSlots.length > 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {availableSlots.length > 0 ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-800">
                      {availableSlots.length} time slot{availableSlots.length !== 1 ? 's' : ''} available on this date
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-800">
                      Fully booked for this date. Please select a different date or vehicle.
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Locations */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Location *</Label>
              <Input
                required
                value={formData.pickup_location}
                onChange={(e) => handleChange('pickup_location', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12"
                placeholder="Address or airport terminal"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Dropoff Location</Label>
              <Input
                value={formData.dropoff_location}
                onChange={(e) => handleChange('dropoff_location', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12"
                placeholder="Destination address"
              />
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">Special Requests</Label>
            <Textarea
              value={formData.special_requests}
              onChange={(e) => handleChange('special_requests', e.target.value)}
              className="border-gray-200 focus:border-black rounded-none min-h-[100px] resize-none"
              placeholder="Child seat, specific route preferences, flight number, etc."
            />
          </div>

          <div className="pt-6">
            <Button 
              type="submit"
              disabled={isSubmitting || availableSlots.length === 0}
              className="w-full bg-black text-white hover:bg-gray-900 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Reservation Request'
              )}
            </Button>
          </div>
        </motion.form>
      </div>
    </section>
  );
}