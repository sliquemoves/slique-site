import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

// ─── Date Range Picker ─────────────────────────────────────────────────────────
// One wide calendar dropdown that captures BOTH a start (pickup) and end (return)
// date. First click sets the start; the next click after it sets the end and
// closes. Used by the daily-rental inquiry modal and the admin new-booking form.
//
//   startValue / endValue : 'YYYY-MM-DD' strings (endValue may be '')
//   onChange(start, end)  : start/end are 'YYYY-MM-DD' strings or null
//   minDate               : earliest selectable date ('YYYY-MM-DD')
//   theme                 : 'light' (default) or 'dark' (admin)
//   disabledDates         : Set/array of 'YYYY-MM-DD' that are already booked —
//                           rendered greyed-out like past days and not selectable
const ymdOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function DateRangePicker({
  startValue, endValue, onChange, minDate, placeholder = 'Select dates',
  theme = 'light', disabledDates, dropUp = false,
}) {
  const dark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState(null); // Date — live preview of the range end
  const [viewDate, setViewDate] = useState(() => {
    if (startValue) return new Date(startValue + 'T00:00:00');
    return new Date();
  });
  const wrapperRef = useRef(null);

  // Normalize booked dates to a Set of 'YYYY-MM-DD' strings.
  const blocked = useMemo(
    () => (disabledDates instanceof Set ? disabledDates : new Set(disabledDates || [])),
    [disabledDates],
  );

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

  // While picking the return date, you can't reach past the next booked day —
  // that would put a booked date inside your range. This is the earliest booked
  // date strictly after the chosen start (null if none).
  const blockCutoff = useMemo(() => {
    if (!startDate || endDate || blocked.size === 0) return null;
    const d = new Date(startDate);
    for (let i = 0; i < 366; i++) {
      d.setDate(d.getDate() + 1);
      if (blocked.has(ymdOf(d))) return new Date(d);
    }
    return null;
  }, [startValue, endValue, blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (day) => {
    const picked = new Date(year, month, day);
    if (picked < min || blocked.has(ymdOf(picked))) return;
    if (blockCutoff && picked >= blockCutoff) return;

    // No start yet, or a full range already chosen → begin a new range.
    if (!startDate || (startDate && endDate)) {
      onChange(ymdOf(picked), null);
      setHoverDate(null);
      return;
    }
    // Start chosen, choosing the end. Must be after start, else restart.
    if (picked <= startDate) {
      onChange(ymdOf(picked), null);
      setHoverDate(null);
      return;
    }
    onChange(ymdOf(startDate), ymdOf(picked));
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

  // ─── theme tokens ─────────────────────────────────────────────────────────
  const triggerCls = dark
    ? 'w-full border border-white/15 hover:border-white/40 focus:border-white/60 focus:outline-none rounded-none h-12 px-3 flex items-center justify-between text-left transition-colors'
    : 'w-full border border-gray-200 hover:border-black focus:border-black focus:outline-none rounded-none h-12 px-3 flex items-center justify-between text-left transition-colors bg-white';
  const triggerStyle = dark ? { background: 'rgba(255,255,255,0.04)' } : undefined;
  const triggerTextCls = dark
    ? (startValue ? 'text-white text-sm' : 'text-white/40 text-sm')
    : (startValue ? 'text-black text-sm' : 'text-gray-400 text-sm');
  const iconCls = dark ? 'w-4 h-4 text-white/40 shrink-0' : 'w-4 h-4 text-gray-400 shrink-0';
  const posCls = dropUp ? 'bottom-full mb-2' : 'top-full mt-2';
  const panelCls = `absolute left-0 right-0 ${posCls} z-50 shadow-2xl p-5 ${
    dark ? 'bg-[#0a0a0a] border border-white/15' : 'bg-white border border-gray-200'
  }`;
  const navBtnCls = dark
    ? 'w-9 h-9 flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors'
    : 'w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors';
  const monthLabelCls = dark ? 'text-sm font-medium tracking-wide text-white' : 'text-sm font-medium tracking-wide';
  const weekdayCls = dark
    ? 'text-center text-[10px] tracking-widest uppercase text-white/40 py-1'
    : 'text-center text-[10px] tracking-widest uppercase text-gray-400 py-1';
  const helperCls = dark ? 'text-[11px] text-white/40 mt-4 text-center' : 'text-[11px] text-gray-400 mt-4 text-center';

  const dayClass = ({ isDisabled, isEdge, inRange }) => {
    const mutedTxt = dark ? 'text-white/15 cursor-not-allowed' : 'text-gray-200 cursor-not-allowed';
    const edge = dark ? 'bg-white text-black font-medium' : 'bg-black text-white font-medium';
    const range = dark ? 'bg-white/12 text-white' : 'bg-gray-100 text-gray-900';
    const normal = dark ? 'hover:bg-white/10 text-white/80 cursor-pointer' : 'hover:bg-gray-100 text-gray-800 cursor-pointer';
    return [
      'aspect-square text-sm transition-all',
      isDisabled ? mutedTxt : '',
      isEdge ? edge : '',
      !isEdge && inRange ? range : '',
      !isEdge && !inRange && !isDisabled ? normal : '',
    ].filter(Boolean).join(' ');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={triggerCls}
        style={triggerStyle}
      >
        <span className={triggerTextCls}>{triggerLabel}</span>
        <CalendarIcon className={iconCls} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropUp ? 8 : -8 }}
            transition={{ duration: 0.15 }}
            className={panelCls}
          >
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className={navBtnCls}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className={monthLabelCls}>{monthNames[month]} {year}</div>
              <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className={navBtnCls}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdays.map(w => (
                <div key={w} className={weekdayCls}>{w}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dayDate = new Date(year, month, day);
                const isPast = dayDate < min;
                const isBooked = blocked.has(ymdOf(dayDate));
                const beyondCutoff = blockCutoff && dayDate >= blockCutoff;
                const isDisabled = isPast || isBooked || beyondCutoff;
                const isStart = sameDay(dayDate, startDate);
                const isEnd = sameDay(dayDate, endDate);
                const inRange = startDate && previewEnd && dayDate > startDate && dayDate < previewEnd;
                const isEdge = isStart || isEnd;

                return (
                  <button
                    type="button"
                    key={day}
                    disabled={isDisabled}
                    onClick={() => handleSelect(day)}
                    onMouseEnter={() => !isDisabled && setHoverDate(dayDate)}
                    className={dayClass({ isDisabled, isEdge, inRange })}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <p className={helperCls}>
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
