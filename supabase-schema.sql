-- ============================================================
-- Slique — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Bookings table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Customer info
  customer_name    TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,

  -- Trip details
  service_type     TEXT NOT NULL,   -- hourly_charter | airport_transfer | corporate | special_event
  vehicle_type     TEXT NOT NULL,   -- luxury_sedan | luxury_suv
  pickup_date      DATE NOT NULL,
  pickup_time      TEXT NOT NULL,   -- e.g. "14:00"
  pickup_location  TEXT NOT NULL,
  dropoff_location TEXT,
  passengers       INTEGER NOT NULL DEFAULT 1,
  special_requests TEXT,

  -- Status
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','completed','cancelled'))
);

-- ── Availability table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  date         DATE NOT NULL,
  vehicle_type TEXT NOT NULL,   -- luxury_sedan | luxury_suv
  time_slot    TEXT NOT NULL,   -- e.g. "09:00"
  is_available BOOLEAN NOT NULL DEFAULT true,
  booking_id   UUID REFERENCES bookings(id) ON DELETE SET NULL,

  UNIQUE (date, vehicle_type, time_slot)
);

-- ── Row Level Security ───────────────────────────────────────
-- Bookings: anyone can INSERT (public booking form); only authenticated users can SELECT/UPDATE
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert bookings"
  ON bookings FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated users can view all bookings"
  ON bookings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update bookings"
  ON bookings FOR UPDATE TO authenticated USING (true);

-- Availability: anyone can read; only authenticated users can write
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read availability"
  ON availability FOR SELECT TO anon USING (true);

CREATE POLICY "Public can update availability (mark slot taken)"
  ON availability FOR UPDATE TO anon
  USING (true)
  WITH CHECK (is_available = false);   -- anon can only mark as taken, not re-open

CREATE POLICY "Authenticated users full availability access"
  ON availability FOR ALL TO authenticated USING (true);

-- ── Helpful indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_availability_lookup
  ON availability (date, vehicle_type, is_available);

CREATE INDEX IF NOT EXISTS idx_bookings_created
  ON bookings (created_at DESC);

-- ── Done ─────────────────────────────────────────────────────
-- You can verify the tables were created with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
