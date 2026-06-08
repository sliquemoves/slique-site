import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

// ─── Custom Date Picker ────────────────────────────────────────────────────────
// Shared between the chauffeur booking form (BookingSection) and the daily-rental
// inquiry modal (RentalInquiryModal). Pure presentational + local open state.
export default function DatePicker({ value, onChange, minDate, placeholder = 'Select date' }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  });
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keep the visible month in sync if the bound value jumps (e.g. a return
  // date being auto-bumped to follow the pickup date).
  useEffect(() => {
    if (value) setViewDate(new Date(value + 'T00:00:00'));
  }, [value]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate ? new Date(minDate + 'T00:00:00') : today;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const formatDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatValue = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSelect = (day) => {
    const selected = new Date(year, month, day);
    if (selected < min) return;
    onChange(formatValue(selected));
    setOpen(false);
  };

  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-200 hover:border-black focus:border-black focus:outline-none rounded-none h-12 px-3 flex items-center justify-between text-left transition-colors bg-white"
      >
        <span className={value ? 'text-black text-sm' : 'text-gray-400 text-sm'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 shadow-2xl"
            style={{ width: 340, padding: 20 }}
          >
            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-medium tracking-wide">
                {monthNames[month]} {year}
              </div>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdays.map(w => (
                <div key={w} className="text-center text-[10px] tracking-widest uppercase text-gray-400 py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dayDate = new Date(year, month, day);
                const isPast = dayDate < min;
                const isSelected = selectedDate &&
                  dayDate.getDate() === selectedDate.getDate() &&
                  dayDate.getMonth() === selectedDate.getMonth() &&
                  dayDate.getFullYear() === selectedDate.getFullYear();
                const isToday =
                  dayDate.getDate() === today.getDate() &&
                  dayDate.getMonth() === today.getMonth() &&
                  dayDate.getFullYear() === today.getFullYear();

                return (
                  <button
                    type="button"
                    key={day}
                    disabled={isPast}
                    onClick={() => handleSelect(day)}
                    className={`
                      aspect-square text-sm transition-all
                      ${isPast ? 'text-gray-200 cursor-not-allowed' : 'cursor-pointer'}
                      ${isSelected ? 'bg-black text-white font-medium' : ''}
                      ${!isSelected && !isPast ? 'hover:bg-gray-100 text-gray-800' : ''}
                      ${isToday && !isSelected ? 'border border-gray-300 font-medium' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
