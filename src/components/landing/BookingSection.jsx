import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle } from 'lucide-react';

const serviceTypes = [
  { value: "hourly_charter", label: "Hourly Charter" },
  { value: "airport_transfer", label: "Airport Transfer" },
  { value: "corporate", label: "Corporate Travel" },
  { value: "special_event", label: "Special Event" }
];

const vehicleTypes = [
  { value: "luxury_suv", label: "Cadillac Escalade SUV - Black" },
  { value: "stretch_limo", label: "Mercedes Benz Limousine - Black" },
  { value: "sprinter_van", label: "Mercedes Benz Sprinter - Black" },
  { value: "luxury_sedan", label: "Mercedes Benz AMG - Black" }
];

export default function BookingSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission — replace with your email/backend integration
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        customer_name: '', email: '', phone: '', service_type: '',
        vehicle_type: '', pickup_date: '', pickup_time: '',
        pickup_location: '', dropoff_location: '', passengers: 1, special_requests: ''
      });
    }, 4000);
  };

  if (isSuccess) {
    return (
      <section id="booking" className="bg-white py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <CheckCircle className="w-20 h-20 text-black mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
              Reservation <span className="font-semibold">Received</span>
            </h2>
            <p className="text-gray-600">Our team will contact you within 2 hours to confirm your booking.</p>
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
              <Input required value={formData.customer_name} onChange={(e) => handleChange('customer_name', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" placeholder="John Smith" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Email *</Label>
              <Input required type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" placeholder="john@email.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Phone *</Label>
              <Input required type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" placeholder="(612) 555-0100" />
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
                  {serviceTypes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
                  {vehicleTypes.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date, Time, Passengers */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Date *</Label>
              <Input required type="date" min={new Date().toISOString().split('T')[0]}
                value={formData.pickup_date} onChange={(e) => handleChange('pickup_date', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Time *</Label>
              <Input required type="time" value={formData.pickup_time} onChange={(e) => handleChange('pickup_time', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Passengers</Label>
              <Input type="number" min="1" max="16" value={formData.passengers}
                onChange={(e) => handleChange('passengers', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" />
            </div>
          </div>

          {/* Locations */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Location *</Label>
              <Input required value={formData.pickup_location} onChange={(e) => handleChange('pickup_location', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" placeholder="Address or airport terminal" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Dropoff Location</Label>
              <Input value={formData.dropoff_location} onChange={(e) => handleChange('dropoff_location', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" placeholder="Destination address" />
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">Special Requests</Label>
            <Textarea value={formData.special_requests} onChange={(e) => handleChange('special_requests', e.target.value)}
              className="border-gray-200 focus:border-black rounded-none min-h-[100px] resize-none"
              placeholder="Child seat, flight number, route preferences, etc." />
          </div>

          <div className="pt-6">
            <Button type="submit" disabled={isSubmitting}
              className="w-full bg-black text-white hover:bg-gray-900 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-all duration-300 disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : 'Submit Reservation Request'}
            </Button>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
