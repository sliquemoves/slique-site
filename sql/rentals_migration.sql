-- ============================================================
-- Slique — Daily-Rental schedule migration
-- Run once in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Safe to run on a live database and safe to run more than once:
-- every statement is guarded with IF NOT EXISTS, so it never drops
-- or overwrites existing data.
--
-- What it does: gives the `bookings` table real, structured columns
-- for a rental's return date and pricing, so the admin command center
-- can draw an accurate per-car month schedule. Until now the return
-- date lived as plain text inside `special_requests`.
-- ============================================================

-- Return / drop-off date for daily rentals (NULL for single-day chauffeur trips)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_date DATE;

-- Agreed daily rate at time of booking (so later rate edits don't rewrite history)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS daily_rate NUMERIC;

-- Estimated total (subtotal + processing), stored for quick reference
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC;

-- Speeds up the admin month query (find rentals overlapping a date window)
CREATE INDEX IF NOT EXISTS idx_bookings_rental_dates
  ON bookings (vehicle_type, pickup_date, return_date);

-- ── Optional one-time backfill ───────────────────────────────────────────────
-- Pulls the "Return date: YYYY-MM-DD" line out of the old notes text into the
-- new column for any existing daily-rental rows. Harmless to run; updates only
-- rows that still have a NULL return_date.
UPDATE bookings
SET return_date = (
  substring(special_requests FROM 'Return date:\s*(\d{4}-\d{2}-\d{2})')
)::date
WHERE service_type = 'daily_rental'
  AND return_date IS NULL
  AND special_requests ~ 'Return date:\s*\d{4}-\d{2}-\d{2}';

-- ── Done ─────────────────────────────────────────────────────────────────────
-- Verify with:
--   SELECT customer_name, vehicle_type, pickup_date, return_date, total_amount
--   FROM bookings WHERE service_type = 'daily_rental' ORDER BY pickup_date DESC;
