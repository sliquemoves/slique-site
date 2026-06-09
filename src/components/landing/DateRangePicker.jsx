import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

// ─── Date Range Picker ─────────────────────────────────────────────────────────
// One wide calendar dropdown that captures BOTH a start (pickup) and end (return)
// date. First click sets the start; the next click after it sets the end and
// closes. Used by the daily-rental inquiry modal.
//
//   startValue / endValue : 'YYYY-MM-DD' strings (endValue may be '')
//   onChange(start, end)  : start/end are 'YYYY-MM-DD' strings or null
//   minDate               : earliest selectable date ('YYYY-MM-DD')
export default function DateRangePicker({ startValue, endValue, onChange, minDate, placeholder = 'Select dates' }) {
  const [open, setOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState(null); // Date — live preview of the range end
  const [viewDate, setViewDate] = useState(() => {
    if (startValue) return new Date(startValue + 'T00:00:00');
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

  // Jump the visible month to the start date when it changes externally.
  useEffect(() => {
    if (startValue) setViewDate(new Date(startValue + 'T00:00:00'));
  }, [startValue]);

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

  const formatValue = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatShort = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const startDate = startValue ? new Date(startValue + 'T00:00:00') : null;
  const endDate = endValue ? new Date(endValue + 'T00:00:00') : null;

  const sameDay = (a, b) =>
    a && b &&
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const handleSelect = (day) => {
    const picked = new Date(year, month, day);
    if (picked < min) return;

    // No start yet, or a full range already chosen → begin a new range.
    if (!startDate || (startDate && endDate)) {
      onChange(formatValue(picked), null);
      setHoverDate(null);
      return;
    }

    // Start chosen, choosing the end. Must be after start, else restart.
    if (picked <= startDate) {
      onChange(formatValue(picked), null);
      setHoverDate(null);
      return;
    }
    onChange(formatValue(startDate), formatValue(picked));
    setHoverDate(null);
    setOpen(false);
  };

  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  // The end used for in-range shading: the real end, or the hovered day while picking.
  const previewEnd = endDate || (startDate && !endDate ? hoverDate : null);

  const triggerLabel = startValue
    ? `${formatShort(startValue)}  →  ${endValue ? formatShort(endValue) : 'Select return'}`
    : placeholder;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-200 hover:border-black focus:border-black focus:outline-none rounded-none h-12 px-3 flex items-center justify-between text-left transition-colors bg-white"
      >
        <span className={startValue ? 'text-black text-sm' : 'text-gray-400 text-sm'}>
          {triggerLabel}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-gray-200 shadow-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
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
                const isStart = sameDay(dayDate, startDate);
                const isEnd = sameDay(dayDate, endDate);
                const inRange =
                  startDate && previewEnd &&
                  dayDate > startDate && dayDate < previewEnd;
                const isEdge = isStart || isEnd;

                return (
                  <button
                    type="button"
                    key={day}
                    disabled={isPast}
                    onClick={() => handleSelect(day)}
                    onMouseEnter={() => !isPast && setHoverDate(dayDate)}
                    className={`
                      aspect-square text-sm transition-all
                      ${isPast ? 'text-gray-200 cursor-not-allowed' : 'cursor-pointer'}
                      ${isEdge ? 'bg-black text-white font-medium' : ''}
                      ${inRange ? 'bg-gray-100 text-gray-900' : ''}
                      ${!isEdge && !inRange && !isPast ? 'hover:bg-gray-100 text-gray-800' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 mt-4 text-center">
              {!startValue
                ? 'Select your pickup date'
                : !endValue
                  ? 'Now select your return date'
                  : 'Pickup → Return selected'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
